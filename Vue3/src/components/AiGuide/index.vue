<!-- AI 向导：右下角悬浮球 + 引导气泡 + 聊天面板（前台全局，后台 /dashboard 下隐藏） -->
<template>
  <div v-if="visible" class="ai-guide">
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
            <p>你好呀，我是文文 👋<br>关于博客的功能和使用方法都可以问我～</p>
            <div class="ai-suggest">
              <button v-for="q in suggestions" :key="q" class="ai-chip" @click="send(q)">{{ q }}</button>
            </div>
          </div>

          <div v-for="(m, i) in messages" :key="i" class="ai-msg" :class="m.role">
            <div class="ai-bubble"><span class="ai-text">{{ m.content }}</span><span v-if="m.loading" class="ai-cursor">▍</span></div>
          </div>
        </div>

        <div class="ai-input">
          <textarea
            v-model="input"
            rows="2"
            maxlength="500"
            :disabled="loading"
            placeholder="问问博客有什么功能…（Enter 发送，Shift+Enter 换行）"
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
import { streamChat } from '@/api/ai';

const route = useRoute();
// 后台管理页不显示向导（面向访客的前台功能）
const visible = computed(() => !route.path.startsWith('/dashboard'));

const open = ref(false);
const input = ref('');
const loading = ref(false);
const sessionId = ref('');
const messages = ref([]);
const listRef = ref(null);
const bubble = ref('');
let abortHandle = null;

const suggestions = ['博客有什么功能？', '怎么获得积分？', '签到在哪里？', '如何扫码登录？'];

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
});

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
  // 必须用 reactive 包裹：闭包里直接改原始对象不会触发 Vue 重渲染，
  // 会导致流式/打字机内容只在结束时一次性出现
  const reply = reactive({ role: 'assistant', content: '', loading: true });
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
      } else if (evt.delta) {
        pendingText += evt.delta;
      } else if (evt.error) {
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
  max-width: 82%;
  padding: 9px 12px;
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}
.ai-msg.user .ai-bubble { background: linear-gradient(135deg, #18a058, #36ad6a); color: #fff; border-bottom-right-radius: 4px; }
.ai-msg.assistant .ai-bubble { background: #fff; color: #333; border: 1px solid #e6eaf2; border-bottom-left-radius: 4px; }
.ai-cursor { animation: ai-blink 0.8s infinite; margin-left: 1px; }
@keyframes ai-blink { 50% { opacity: 0; } }

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
</style>
