<template>
  <div class="message-page">
    <MyHeaderVue />
    <div class="message-main">
      <!-- Hero：与文章页统一的视觉语言 -->
      <section class="message-hero">
        <h1 class="message-hero-title">留言板</h1>
        <p class="message-hero-desc">写下你的想法，会出现在下方词云中 · 违规内容可联系管理员删除</p>
      </section>

      <div class="message-body">
        <!-- 左侧：发表留言卡片 -->
        <div class="message-form-wrap">
          <n-card title="发表留言" class="message-form-card" size="medium">
            <div v-if="!adminStore.token" class="message-login-tip">
              <n-text depth="2">请先登录后留言，留言将显示为您的昵称或用户名。</n-text>
              <n-button type="primary" style="margin-top: 12px" @click="goLogin">去登录</n-button>
            </div>
            <n-form v-else label-placement="top" class="message-form">
              <n-form-item label="留言内容">
                <n-input
                  v-model:value="addMeassage.content"
                  type="textarea"
                  placeholder="说点什么吧～"
                  :rows="4"
                  clearable
                  maxlength="200"
                  show-count
                />
              </n-form-item>
              <n-button type="primary" block size="large" :loading="submitting" @click="submitMessage">
                发布留言
              </n-button>
            </n-form>
          </n-card>
        </div>

        <!-- 右侧：词云卡片 -->
        <div class="message-chart-wrap">
          <n-card title="留言词云" class="message-chart-card" size="medium">
            <template #header-extra>
              <n-text depth="2" style="font-size: 12px">点击词语可增加权重</n-text>
            </template>
            <div class="chart-container">
              <MessageWordcloud v-if="msgdata.length" :msg-list="msgdata" class="wordcloud-inner" />
              <div v-else class="chart-empty">
                <n-empty description="暂无留言，来写第一条吧" size="medium" />
              </div>
            </div>
          </n-card>
        </div>
      </div>
    </div>
    <MyFooterVue />
  </div>
</template>

<script setup>
import MyHeaderVue from "@/components/MyHeader.vue";
import MyFooterVue from "@/components/MyFooter.vue";
import MessageWordcloud from "@/components/MessageWordcloud.vue";
import { ref, reactive, inject, onMounted } from "vue";
import { useRouter } from "vue-router";
import { AdminStore } from "@/stores/AdminStore";
import { addMessage, getMessagesList } from "@/api/api";

const message = inject("message");
const router = useRouter();
const adminStore = AdminStore();
const submitting = ref(false);

const addMeassage = reactive({
  content: "",
  value: 28,
});

const goLogin = () => {
  router.push("/login");
};

const msgdata = ref([]);

const submitMessage = async () => {
  if (!adminStore.token) {
    message.warning("请先登录");
    return;
  }
  const content = (addMeassage.content || "").trim();
  if (!content) {
    message.warning("请输入留言内容");
    return;
  }
  const data = {
    content: content.replace(/</g, "&lt;").replace(/>/g, "&gt;"),
    value: addMeassage.value,
  };
  submitting.value = true;
  try {
    const res = await addMessage(data);
    if (res.code === 200) {
      message.success(res.message || "发布成功");
      addMeassage.content = "";
      await loadmsg();
    } else {
      message.error(res.message || "发布失败");
    }
  } catch (e) {
    message.error("发布失败");
  }
  submitting.value = false;
};

const loadmsg = async () => {
  try {
    const res = await getMessagesList();
    const list = Array.isArray(res.data) ? res.data : [];
    msgdata.value = list.map((item) => ({
      name: item.content,
      value: item.value ?? 28,
      author: item.name,
      id: item.id,
    }));
  } catch (_) {
    msgdata.value = [];
  }
};

onMounted(() => {
  loadmsg();
});
</script>

<style lang="less" scoped>
.message-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 35%, #e2e8f0 100%);
  display: flex;
  flex-direction: column;
}

.message-main {
  flex: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 20px 48px;
  width: 100%;
}

.message-hero {
  text-align: center;
  padding: 36px 24px 32px;
  margin-bottom: 24px;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
  border-radius: 16px;
  color: #fff;
  box-shadow: 0 10px 40px rgba(15, 23, 42, 0.25);
}
.message-hero-title {
  margin: 0 0 8px 0;
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}
.message-hero-desc {
  margin: 0;
  font-size: 0.95rem;
  opacity: 0.88;
}

.message-body {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 24px;
  align-items: start;
}

.message-form-card,
.message-chart-card {
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.message-form {
  max-width: 100%;
}
.message-login-tip {
  padding: 16px 0;
  text-align: center;
}

.chart-container {
  position: relative;
  width: 100%;
  min-height: 380px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.wordcloud-inner {
  width: 100%;
  height: 380px;
}
.chart-empty {
  width: 100%;
  height: 380px;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media screen and (max-width: 900px) {
  .message-body {
    grid-template-columns: 1fr;
  }
  .message-form-wrap {
    order: 1;
  }
  .message-chart-wrap {
    order: 2;
  }
}

@media screen and (max-width: 600px) {
  .message-main {
    padding: 16px 12px 32px;
  }
  .message-hero {
    padding: 24px 16px;
  }
  .message-hero-title {
    font-size: 1.5rem;
  }
  .chart-container,
  .wordcloud-inner,
  .chart-empty {
    min-height: 320px;
    height: 320px;
  }
}
</style>
