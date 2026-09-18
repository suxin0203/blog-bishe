<!-- AI 向导：右下角悬浮球 + 引导气泡 + 聊天面板（前台全局，后台 /dashboard 下隐藏） -->
<!-- 二期：Markdown 渲染（DOMPurify 消毒）、工具调用状态行、会话持久化（localStorage + /ai/history） -->
<template>
  <div v-if="visible" class="ai-guide" :class="{ 'is-open': open }">
    <transition name="ai-pop">
      <div v-if="open" class="ai-panel">
        <div class="ai-header">
          <div class="ai-title">
            <span class="ai-dot"></span>文文 · 博客向导
          </div>
          <div class="ai-actions">
            <button class="ai-icon-btn" title="清空对话" @click="resetChat">⟲</button>
            <button class="ai-icon-btn" title="收起" @click="toggleOpen">✕</button>
          </div>
        </div>

        <div ref="listRef" class="ai-messages">
          <div v-if="messages.length === 0" class="ai-welcome">
            <p>你好呀，我是文文 👋<br>关于博客的文章、功能和使用方法都可以问我～</p>
            <div class="ai-suggest">
              <button v-for="q in suggestions" :key="q" class="ai-chip" @click="send(q)">{{ q }}</button>
            </div>
          </div>

          <div v-for="(m, i) in messages" :key="i" class="ai-msg" :class="m.role">
            <div class="ai-bubble">
              <template v-if="m.role === 'assistant'">
                <!-- 执行步骤时间线：随 SSE 事件动态生长，完成后收起为一行 -->
                <div v-if="m.steps && m.steps.length && !m.collapsed" class="ai-steps">
                  <div v-for="(s, si) in m.steps" :key="si" class="ai-step" :class="'is-' + s.state">
                    <span class="ai-step-dot"></span>
                    <span class="ai-step-label">{{ s.label }}</span>
                    <span v-if="s.note && s.state === 'active'" class="ai-step-note">{{ s.note }}</span>
                  </div>
                </div>
                <div v-if="m.collapsed" class="ai-steps-done">✓ 已完成 {{ m.steps.length }} 个步骤</div>
                <!-- assistant 内容经 markdown-it 渲染 + DOMPurify 消毒后输出 -->
                <span class="ai-text md-body" v-html="renderMarkdown(m.content)"></span>
                <span v-if="m.loading" class="ai-cursor">▍</span>
              </template>
              <span v-else class="ai-text">{{ m.content }}</span>
            </div>
          </div>
        </div>

        <div class="ai-input">
          <textarea
            v-model="input"
            rows="2"
            maxlength="500"
            :disabled="loading"
            placeholder="问问博客有什么文章、功能…（Enter 发送，Shift+Enter 换行）"
            @keydown.enter.exact.prevent="send()"
          ></textarea>
          <button class="ai-send" :disabled="loading || !input.trim()" @click="send()">
            {{ loading ? '…' : '发送' }}
          </button>
        </div>
      </div>
    </transition>

    <div class="ai-fab-wrap">
      <!-- 引导气泡：定时轮换问题，点击直接提问；横向胶囊样式，弹在悬浮球上方空白区 -->
      <transition name="ai-bubble">
        <div v-if="bubble" class="ai-tip" title="点击直接提问" @click="askFromBubble">
          <span class="ai-tip-emoji">💡</span>
          <span class="ai-tip-text">{{ bubble }}</span>
          <span class="ai-tip-hint">点击提问</span>
          <button class="ai-tip-close" title="关闭" @click.stop="dismissBubble">✕</button>
        </div>
      </transition>
      <button class="ai-fab" :title="open ? '收起向导' : '博客向导'" @click="toggleOpen">
        <span v-if="!open">🤖</span>
        <span v-else>💬</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import markdownit from 'markdown-it';
import DOMPurify from 'dompurify';
import { streamChat, fetchHistory } from '@/api/ai';

const route = useRoute();
// 后台管理页不显示向导（面向访客的前台功能）
const visible = computed(() => !route.path.startsWith('/dashboard'));

// ---------- Markdown 渲染：markdown-it 解析 + DOMPurify 消毒，链接统一新窗口 ----------
const md = markdownit({ breaks: true, linkify: true });
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});
const renderMarkdown = (text) => DOMPurify.sanitize(md.render(text || ''));

const open = ref(false);
const input = ref('');
const loading = ref(false);
const sessionId = ref('');
const messages = ref([]);
const listRef = ref(null);
const bubble = ref('');
let abortHandle = null;

// 会话持久化：sessionId 存 localStorage，刷新后按 /ai/history 恢复
const SESSION_KEY = 'ai_guide_session';

const suggestions = ['博客有什么文章？', '推荐几篇热门文章', '博客有什么功能？', '怎么获得积分？'];

function scrollToBottom() {
  nextTick(() => {
    const el = listRef.value;
    if (el) el.scrollTop = el.scrollHeight;
  });
}

function toggleOpen() {
  open.value = !open.value;
  if (!open.value && abortHandle) {
    abortHandle.abort();
    abortHandle = null;
  }
}

// ---------- 引导气泡：固定问题轮询，用于让访客注意到向导 ----------
const BUBBLE_INTERVAL = 60 * 1000;  // 每 60s 弹一次
const BUBBLE_FIRST_DELAY = 4 * 1000; // 首次进入页面 4s 后弹
const BUBBLE_SHOW_MS = 8 * 1000;     // 每次停留 8s
let bubbleIndex = 0;
let bubbleCycleTimer = null;
let bubbleFirstTimer = null;
let bubbleHideTimer = null;

function showBubble() {
  // 面板打开或气泡已在显示时跳过本轮
  if (open.value || loading.value || bubble.value) return;
  bubble.value = suggestions[bubbleIndex % suggestions.length];
  bubbleIndex += 1;
  bubbleHideTimer = setTimeout(() => { bubble.value = ''; }, BUBBLE_SHOW_MS);
}

function dismissBubble() {
  bubble.value = '';
  clearTimeout(bubbleHideTimer);
}

// 点击气泡 = 直接向 AI 提问该问题，并停止后续轮询（已经注意到就不必再打扰）
function askFromBubble() {
  const q = bubble.value;
  dismissBubble();
  stopBubbleCycle();
  open.value = true;
  nextTick(() => send(q));
}

function stopBubbleCycle() {
  bubble.value = '';
  clearTimeout(bubbleFirstTimer);
  clearTimeout(bubbleHideTimer);
  clearInterval(bubbleCycleTimer);
  bubbleCycleTimer = null;
}

watch(open, (v) => { if (v) dismissBubble(); });

onMounted(() => {
  bubbleFirstTimer = setTimeout(showBubble, BUBBLE_FIRST_DELAY);
  bubbleCycleTimer = setInterval(showBubble, BUBBLE_INTERVAL);
  restoreHistory();
});

// 刷新页面后按 localStorage 的 sessionId 恢复最近对话
async function restoreHistory() {
  const saved = localStorage.getItem(SESSION_KEY);
  if (!saved) return;
  try {
    const data = await fetchHistory(saved);
    if (data.sessionId && Array.isArray(data.messages) && data.messages.length) {
      sessionId.value = data.sessionId;
      messages.value = data.messages.map((m) => ({ role: m.role, content: m.content }));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  } catch (_) { /* 网络异常不打扰用户 */ }
}

// ---------- 步骤时间线：把 SSE 事件映射为可视化的执行步骤 ----------
// 步骤随事件动态生长：理解与分析问题 →（查询站内数据，可有可无）→ 整理并组织回答
function advanceStep(reply, label) {
  reply.steps.forEach((s) => { if (s.state === 'active') s.state = 'done'; });
  let target = reply.steps.find((s) => s.label === label);
  if (!target) {
    target = { label, state: 'active', note: '' };
    reply.steps.push(target);
  } else {
    target.state = 'active';
  }
  return target;
}

function completeSteps(reply) {
  reply.steps.forEach((s) => { if (s.state === 'active') s.state = 'done'; });
  // 停顿一瞬让用户看到全绿，再收起为一行
  setTimeout(() => { reply.collapsed = true; scrollToBottom(); }, 900);
}

// ---------- 打字机效果：流式增量先进缓冲区，再匀速逐字上屏 ----------
const TYPE_INTERVAL = 24; // ms，约 40 帧/秒
let pendingText = '';
let typeTimer = null;
let streamDone = false;

function startTypewriter(reply) {
  typeTimer = setInterval(() => {
    if (pendingText.length) {
      // 积压越多单帧吐字越多，保证追得上模型速度
      const step = Math.max(1, Math.ceil(pendingText.length / 25));
      reply.content += pendingText.slice(0, step);
      pendingText = pendingText.slice(step);
      scrollToBottom();
    } else if (streamDone) {
      finishTypewriter(reply);
    }
  }, TYPE_INTERVAL);
}

function finishTypewriter(reply) {
  clearInterval(typeTimer);
  typeTimer = null;
  reply.loading = false;
  completeSteps(reply);
  loading.value = false;
  abortHandle = null;
  scrollToBottom();
}

function resetChat() {
  if (abortHandle) { abortHandle.abort(); abortHandle = null; }
  clearInterval(typeTimer);
  typeTimer = null;
  pendingText = '';
  streamDone = false;
  sessionId.value = '';
  localStorage.removeItem(SESSION_KEY);
  messages.value = [];
  loading.value = false;
}

function send(preset) {
  const text = (preset || input.value).trim();
  if (!text || loading.value) return;
  input.value = '';
  // 访客已主动提问，说明注意到向导了，停止气泡轮询
  stopBubbleCycle();
  messages.value.push({ role: 'user', content: text });
  // 必须用 reactive 包裹：闭包里直接改原始对象不会触发 Vue 重渲染
  const reply = reactive({
    role: 'assistant',
    content: '',
    loading: true,
    collapsed: false,
    steps: [{ label: '理解与分析问题', state: 'active', note: '' }],
  });
  messages.value.push(reply);
  loading.value = true;
  pendingText = '';
  streamDone = false;
  scrollToBottom();

  abortHandle = streamChat({
    message: text,
    sessionId: sessionId.value,
    onEvent(evt) {
      if (evt.sessionId) {
        sessionId.value = evt.sessionId;
        localStorage.setItem(SESSION_KEY, evt.sessionId);
      } else if (evt.tool) {
        const s = advanceStep(reply, '查询站内数据');
        s.note = evt.tool.brief;
        scrollToBottom();
      } else if (evt.delta) {
        if (!reply._answerStarted) {
          reply._answerStarted = true;
          advanceStep(reply, '整理并组织回答');
        }
        pendingText += evt.delta;
      } else if (evt.error) {
        reply.steps.forEach((s) => { if (s.state === 'active') s.state = 'error'; });
        pendingText += '⚠️ ' + evt.error;
        streamDone = true;
      }
    },
    onDone() {
      streamDone = true;
    },
  });
  startTypewriter(reply);
}

onBeforeUnmount(() => {
  if (abortHandle) abortHandle.abort();
  clearInterval(typeTimer);
  stopBubbleCycle();
});
</script>

<style scoped>
.ai-guide {
  position: fixed;
  /* 与各页面 n-back-top（right:50, bottom:100，实测 44×44）同列同心：
     悬浮球叠在回到顶部按钮正上方（bottom:156 = 100 + 44 + 12px 间隔），
     引导气泡弹在悬浮球上方的空白区，不会遮挡回到顶部 */
  right: 50px;
  bottom: 156px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
  font-family: inherit;
}

.ai-fab-wrap { position: relative; }

/* 引导气泡：横向胶囊，单行展示 */
.ai-tip {
  position: absolute;
  right: 0;
  bottom: calc(100% + 14px);
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 280px;
  max-width: 340px;
  padding: 11px 14px;
  background: #fff;
  border: 1px solid rgba(24, 160, 88, 0.35);
  border-radius: 999px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.14);
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
}
.ai-tip::after {
  content: "";
  position: absolute;
  bottom: -6px;
  right: 16px;
  width: 10px;
  height: 10px;
  background: #fff;
  border-right: 1px solid rgba(24, 160, 88, 0.35);
  border-bottom: 1px solid rgba(24, 160, 88, 0.35);
  transform: rotate(45deg);
}
.ai-tip:hover { border-color: #18a058; }
.ai-tip:hover .ai-tip-text { color: #18a058; }
.ai-tip-emoji { font-size: 14px; }
.ai-tip-text { flex: 1; font-size: 13px; color: #333; overflow: hidden; text-overflow: ellipsis; }
.ai-tip-hint { flex-shrink: 0; font-size: 12px; color: #18a058; }
.ai-tip-close {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: #9ca3af;
  font-size: 11px;
  cursor: pointer;
  line-height: 1;
}
.ai-tip-close:hover { background: #f1f5f9; color: #475569; }
.ai-bubble-enter-active, .ai-bubble-leave-active { transition: opacity 0.22s, transform 0.22s; }
.ai-bubble-enter-from, .ai-bubble-leave-to { opacity: 0; transform: translateY(8px) scale(0.95); }

/* 悬浮球 */
.ai-fab {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  font-size: 22px;
  line-height: 1;
  background: linear-gradient(135deg, #18a058, #10b981);
  color: #fff;
  box-shadow: 0 6px 20px rgba(24, 160, 88, 0.45);
  transition: transform 0.2s;
}
.ai-fab:hover { transform: scale(1.08); }

/* 聊天面板 */
.ai-panel {
  width: min(380px, calc(100vw - 32px));
  height: min(560px, 70vh);
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
  overflow: hidden;
}

.ai-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: linear-gradient(135deg, #18a058, #36ad6a);
  color: #fff;
}
.ai-title { font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
.ai-dot { width: 8px; height: 8px; border-radius: 50%; background: #7dffb3; box-shadow: 0 0 6px #7dffb3; }
.ai-actions { display: flex; gap: 6px; }
.ai-icon-btn {
  width: 26px; height: 26px;
  border: none; border-radius: 6px;
  background: rgba(255, 255, 255, 0.2);
  color: #fff; cursor: pointer; font-size: 13px;
}
.ai-icon-btn:hover { background: rgba(255, 255, 255, 0.35); }

/* 消息区 */
.ai-messages { flex: 1; overflow-y: auto; padding: 14px; background: #f5f7fb; }
.ai-welcome { text-align: center; color: #7a8699; font-size: 13px; line-height: 1.8; margin-top: 18px; }
.ai-suggest { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-top: 12px; }
.ai-chip {
  border: 1px solid #d7dfec; border-radius: 14px;
  background: #fff; color: #4a5b76;
  font-size: 12px; padding: 5px 12px; cursor: pointer;
}
.ai-chip:hover { border-color: #18a058; color: #18a058; }

.ai-msg { display: flex; margin-bottom: 12px; }
.ai-msg.user { justify-content: flex-end; }
.ai-bubble {
  max-width: 86%;
  padding: 9px 12px;
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.7;
  word-break: break-word;
}
.ai-msg.user .ai-bubble { background: linear-gradient(135deg, #18a058, #36ad6a); color: #fff; border-bottom-right-radius: 4px; }
.ai-msg.assistant .ai-bubble { background: #fff; color: #333; border: 1px solid #e6eaf2; border-bottom-left-radius: 4px; }
.ai-msg.user .ai-text { white-space: pre-wrap; }
.ai-cursor { animation: ai-blink 0.8s infinite; margin-left: 1px; }
@keyframes ai-blink { 50% { opacity: 0; } }

/* 执行步骤时间线 */
.ai-steps {
  display: block;
  margin: 0 0 8px;
  padding: 8px 10px;
  background: rgba(24, 160, 88, 0.05);
  border: 1px solid rgba(24, 160, 88, 0.18);
  border-radius: 8px;
}
.ai-step {
  position: relative;
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 2px 0 2px 18px;
  font-size: 12px;
  color: #7a8699;
}
.ai-step::before {
  content: "";
  position: absolute;
  left: 4px;
  top: 13px;
  bottom: -5px;
  width: 1px;
  background: #dbe3ee;
}
.ai-step:last-child::before { display: none; }
.ai-step-dot {
  position: absolute;
  left: 0;
  top: 5px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  border: 2px solid #cbd5e1;
  background: #fff;
  box-sizing: border-box;
}
.ai-step.is-done .ai-step-dot { border-color: #18a058; background: #18a058; }
.ai-step.is-done .ai-step-label { color: #94a3b8; }
.ai-step.is-active .ai-step-dot { border-color: #18a058; background: #7dffb3; animation: ai-pulse 1.2s infinite; }
.ai-step.is-active .ai-step-label { color: #18a058; font-weight: 600; }
.ai-step.is-error .ai-step-dot { border-color: #ef4444; background: #fecaca; }
.ai-step.is-error .ai-step-label { color: #ef4444; }
.ai-step-note { color: #18a058; }
.ai-steps-done { font-size: 12px; color: #94a3b8; margin-bottom: 6px; }
@keyframes ai-pulse { 50% { opacity: 0.45; } }

/* Markdown 正文样式（仅 assistant 气泡内） */
.md-body { display: block; }
.md-body p { margin: 0 0 8px; }
.md-body p:last-child { margin-bottom: 0; }
.md-body h1, .md-body h2, .md-body h3, .md-body h4 { margin: 10px 0 6px; font-size: 14px; line-height: 1.5; }
.md-body ul, .md-body ol { margin: 6px 0; padding-left: 20px; }
.md-body li { margin: 3px 0; }
.md-body a { color: #18a058; text-decoration: underline; word-break: break-all; }
.md-body code {
  background: rgba(24, 160, 88, 0.1);
  color: #0e7a43;
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 12px;
  font-family: Consolas, Monaco, monospace;
}
.md-body pre {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px;
  overflow-x: auto;
  margin: 8px 0;
}
.md-body pre code { background: transparent; color: #334155; padding: 0; font-size: 12px; }
.md-body blockquote {
  margin: 8px 0;
  padding: 4px 10px;
  border-left: 3px solid #18a058;
  background: rgba(24, 160, 88, 0.06);
  color: #475569;
}
.md-body table { border-collapse: collapse; margin: 8px 0; font-size: 12px; }
.md-body th, .md-body td { border: 1px solid #e2e8f0; padding: 4px 8px; }
.md-body strong { font-weight: 700; }

/* 输入区 */
.ai-input { display: flex; gap: 8px; padding: 10px; border-top: 1px solid #eef1f6; background: #fff; }
.ai-input textarea {
  flex: 1;
  resize: none;
  border: 1px solid #dfe5ee;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 13px;
  line-height: 1.5;
  font-family: inherit;
  outline: none;
  /* 两行高度：占位提示完整可见，不再内部滚动 */
  min-height: 58px;
  max-height: 90px;
}
.ai-input textarea:focus { border-color: #18a058; }
.ai-send {
  align-self: flex-end;
  border: none; border-radius: 8px;
  background: linear-gradient(135deg, #18a058, #36ad6a);
  color: #fff; font-size: 13px;
  padding: 9px 14px; cursor: pointer;
}
.ai-send:disabled { opacity: 0.5; cursor: not-allowed; }

/* 出现/收起动效 */
.ai-pop-enter-active, .ai-pop-leave-active { transition: opacity 0.18s, transform 0.18s; }
.ai-pop-enter-from, .ai-pop-leave-to { opacity: 0; transform: translateY(12px) scale(0.97); }

/* 适配站点暗色主题（html.darklight） */
:global(.darklight) .ai-panel { background: #1f2430; box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5); }
:global(.darklight) .ai-messages { background: #171b24; }
:global(.darklight) .ai-msg.assistant .ai-bubble { background: #262c3a; color: #d6dbe4; border-color: #323a4c; }
:global(.darklight) .ai-welcome { color: #8b96a8; }
:global(.darklight) .ai-chip { background: #262c3a; border-color: #323a4c; color: #aeb8c8; }
:global(.darklight) .ai-input { border-top-color: #262c3a; background: #1f2430; }
:global(.darklight) .ai-input textarea { background: #171b24; border-color: #323a4c; color: #d6dbe4; }
:global(.darklight) .ai-tip { background: #262c3a; border-color: rgba(24, 160, 88, 0.5); }
:global(.darklight) .ai-tip::after { background: #262c3a; border-color: rgba(24, 160, 88, 0.5); }
:global(.darklight) .ai-tip-text { color: #d6dbe4; }
:global(.darklight) .ai-steps { background: rgba(24, 160, 88, 0.08); border-color: rgba(24, 160, 88, 0.3); }
:global(.darklight) .ai-step { color: #8b96a8; }
:global(.darklight) .ai-step::before { background: #323a4c; }
:global(.darklight) .ai-step.is-active .ai-step-label { color: #7dffb3; }
:global(.darklight) .ai-step-note { color: #7dffb3; }
:global(.darklight) .md-body pre { background: #171b24; border-color: #323a4c; }
:global(.darklight) .md-body pre code { background: transparent; color: #d6dbe4; }
:global(.darklight) .md-body blockquote { background: rgba(24, 160, 88, 0.08); color: #aeb8c8; }
:global(.darklight) .md-body code { background: rgba(24, 160, 88, 0.15); color: #7dffb3; }

/* 移动端：面板全屏化（原生聊天体验），悬浮球贴边，气泡限宽防溢出 */
@media (max-width: 640px) {
  .ai-guide { right: 12px; bottom: 12px; }
  .ai-tip { min-width: 0; max-width: calc(100vw - 48px); }
  /* 面板铺满整屏，避开刘海/底部横条 */
  .ai-panel {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    height: 100dvh;
    border-radius: 0;
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
  }
  /* 全屏面板时隐藏悬浮球，避免压住输入区；用面板右上角 ✕ 关闭 */
  .ai-guide.is-open .ai-fab-wrap { display: none; }
  .ai-msg .ai-bubble { font-size: 14px; max-width: 90%; }
  /* 触控目标与输入体验：iOS 对字号 <16px 的输入框聚焦时会自动放大页面 */
  .ai-input textarea { font-size: 16px; min-height: 64px; }
  .ai-send { padding: 10px 16px; }
  .ai-icon-btn { width: 30px; height: 30px; font-size: 14px; }
  .ai-chip { padding: 7px 14px; font-size: 13px; }
}
</style>
