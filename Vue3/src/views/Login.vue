<template>
  <div class="login-page">
    <div class="login-glow login-glow-1"></div>
    <div class="login-glow login-glow-2"></div>
    <a class="back-home" href="#/" @click.prevent="router.push('/')">
      <span class="back-home-icon">←</span>
      <span>返回首页</span>
    </a>
    <div class="login-pane">
      <div class="login-card-wrap">
        <h1 class="login-title">文栈博客</h1>
        <p class="login-subtitle">登录或注册以继续</p>
        <n-card class="login-card" bordered>
          <n-tabs type="line" size="large" v-model:value="activeTab" class="login-tabs">
            <n-tab name="login">账号登录</n-tab>
            <n-tab name="register">注册</n-tab>
            <n-tab name="qrcode">扫码登录</n-tab>
          </n-tabs>

          <Transition name="auth-pane" mode="out-in">
            <!-- 账号登录 -->
            <div v-if="activeTab === 'login'" key="login" class="auth-pane">
              <n-form :model="admin" :rules="rules" ref="formRef" class="auth-form">
                <n-form-item label="账号" path="username">
                  <n-input v-model:value="admin.username" placeholder="至少 4 个字符" @keyup.enter="login()" />
                </n-form-item>
                <n-form-item label="密码" path="password">
                  <n-input v-model:value="admin.password" placeholder="请输入密码" type="password" @keyup.enter="login()" />
                </n-form-item>
                <n-form-item label="验证码" path="countresult">
                  <div class="captcha-row">
                    <div
                      class="captcha-box"
                      :class="{ refreshing: captchaRefreshing }"
                      title="看不清？点击刷新"
                      @click="fetchCaptcha()"
                    >
                      <span class="captcha-question">{{ num1 }} + {{ num2 }} = ?</span>
                      <n-icon class="captcha-refresh-icon" :component="RefreshOutline" />
                    </div>
                    <n-input v-model:value="admin.countresult" placeholder="计算结果" @keyup.enter="login()" />
                  </div>
                </n-form-item>
                <n-form-item>
                  <n-checkbox v-model:checked="admin.remember" label="记住我" />
                </n-form-item>
                <n-form-item>
                  <n-button type="primary" block strong :loading="loginLoading" @click="login" class="loginbtn">登 录</n-button>
                </n-form-item>
              </n-form>
              <div class="forgot-wrap">
                <n-button text type="primary" tag="a" @click.prevent="showForgotModal = true">忘记密码？</n-button>
              </div>
            </div>

            <!-- 注册 -->
            <div v-else-if="activeTab === 'register'" key="register" class="auth-pane">
              <n-form :model="admin" :rules="rulesRegister" ref="formRefRegister" class="auth-form">
                <n-form-item label="账号" path="username">
                  <n-input v-model:value="admin.username" placeholder="至少 4 个字符" @keyup.enter="register()" />
                </n-form-item>
                <n-form-item label="密码" path="password">
                  <n-input v-model:value="admin.password" placeholder="至少 4 个字符" type="password" @keyup.enter="register()" />
                </n-form-item>
                <n-form-item label="确认密码" path="confirmPassword">
                  <n-input v-model:value="admin.confirmPassword" placeholder="请再次输入密码" type="password" @keyup.enter="register()" />
                </n-form-item>
                <n-form-item label="邮箱" path="email">
                  <n-input v-model:value="admin.email" placeholder="用于找回密码，请填写有效邮箱" type="text" @keyup.enter="register()" />
                </n-form-item>
                <n-form-item label="验证码" path="countresult">
                  <div class="captcha-row">
                    <div
                      class="captcha-box"
                      :class="{ refreshing: captchaRefreshing }"
                      title="看不清？点击刷新"
                      @click="fetchCaptcha()"
                    >
                      <span class="captcha-question">{{ num1 }} + {{ num2 }} = ?</span>
                      <n-icon class="captcha-refresh-icon" :component="RefreshOutline" />
                    </div>
                    <n-input v-model:value="admin.countresult" placeholder="计算结果" @keyup.enter="register()" />
                  </div>
                </n-form-item>
                <n-form-item>
                  <n-button type="primary" block strong :loading="registerLoading" @click="register" class="loginbtn">注 册</n-button>
                </n-form-item>
              </n-form>
            </div>

            <!-- 扫码登录 -->
            <div v-else key="qrcode" class="auth-pane qr-login">
              <div class="qr-version-switch">
                <span class="qr-version-label">扫码打开版本</span>
                <n-radio-group v-model:value="qrEnvVersion" size="small" @update:value="onQrEnvVersionChange">
                  <n-radio-button value="release">正式版</n-radio-button>
                  <n-radio-button value="trial">体验版</n-radio-button>
                  <n-radio-button value="develop">开发版</n-radio-button>
                </n-radio-group>
              </div>
              <p class="qr-version-tip">体验版 / 开发版需为该小程序的体验成员或开发者才能打开；正式版槽位临时部署其他项目时请切换到体验版</p>
              <div class="qr-box">
                <div v-if="qrLoading" class="qr-placeholder">
                  <n-spin size="large" />
                  <p>正在获取微信小程序码...</p>
                </div>
                <div v-else-if="qrError" class="qr-placeholder">
                  <p class="qr-error">{{ qrError }}</p>
                  <n-button size="medium" type="primary" strong @click="initQrLogin">重新获取二维码</n-button>
                </div>
                <div v-else>
                  <img v-if="qrImage" :src="qrImage" alt="微信小程序码" class="qr-image" />
                  <p class="qr-tip">
                    {{ isMobileClient ? "长按识别上方小程序码完成登录，或截图后用微信扫一扫" : "请使用微信扫描小程序码，按提示完成登录或注册" }}
                    <n-tooltip trigger="hover">
                      <template #trigger>
                        <span class="qr-help">?</span>
                      </template>
                      <div class="qr-help-content">
                        <p>1. 已绑定账号：先在小程序内确认"允许在本次电脑登录"，再完成登录。</p>
                        <p>2. 未绑定账号：可在小程序内注册新账号或绑定已有账号，完成后本页面会自动登录。</p>
                      </div>
                    </n-tooltip>
                  </p>
                  <p v-if="qrCountdown > 0" class="qr-countdown">二维码将在 {{ qrCountdown }} 秒后过期</p>
                  <p v-else class="qr-countdown qr-countdown-expired">二维码已过期，请点击下方按钮刷新</p>
                  <div class="qr-actions">
                    <n-button size="medium" type="primary" strong @click="initQrLogin">刷新二维码</n-button>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </n-card>
      </div>
    </div>

    <n-modal v-model:show="showForgotModal" preset="card" title="找回密码" style="width: 400px" :mask-closable="false">
      <div v-if="forgotStep === 1" class="forgot-step">
        <n-form-item label="用户名">
          <n-input v-model:value="forgotForm.username" placeholder="请输入注册时的用户名" @keyup.enter="fetchMaskEmail" />
        </n-form-item>
        <n-button type="primary" block :loading="forgotLoading" @click="fetchMaskEmail">下一步：查看脱敏邮箱</n-button>
        <p v-if="forgotMaskEmail" class="forgot-tip">您的邮箱为：<strong>{{ forgotMaskEmail }}</strong>，请在下一步填写完整邮箱以验证。</p>
      </div>
      <div v-else-if="forgotStep === 2" class="forgot-step">
        <p class="forgot-tip">请填写完整邮箱（与注册时一致）</p>
        <n-form-item label="完整邮箱">
          <n-input v-model:value="forgotForm.email" type="text" placeholder="例如：your@example.com" @keyup.enter="doForgotVerify" />
        </n-form-item>
        <n-space>
          <n-button @click="forgotStep = 1">上一步</n-button>
          <n-button type="primary" :loading="forgotLoading" @click="doForgotVerify">验证邮箱</n-button>
        </n-space>
      </div>
      <div v-else class="forgot-step">
        <n-form-item label="新密码">
          <n-input v-model:value="forgotForm.newPassword" type="password" placeholder="至少 4 个字符" />
        </n-form-item>
        <n-form-item label="确认密码">
          <n-input v-model:value="forgotForm.confirmPassword" type="password" placeholder="再次输入新密码" />
        </n-form-item>
        <n-button type="primary" block :loading="forgotLoading" @click="doForgotReset">确认重置</n-button>
      </div>
    </n-modal>
  </div>
</template>

<script setup>
import { reactive, ref, inject, onMounted, onUnmounted, watch } from "vue";
import { AdminStore } from "../stores/AdminStore";
import { router } from "@/common/router.js";
import { getCaptcha, userLogin, userRegister, getForgotEmail, forgotVerify, forgotReset, createQrLoginSession, getQrLoginSessionStatus } from "../api/api";
import { base64Encode, captchaMd5 } from "@/utils/encode";
import { RefreshOutline } from "@vicons/ionicons5";

const message = inject("message");
const adminStore = AdminStore();

const activeTab = ref("login");

const loginLoading = ref(false);
const registerLoading = ref(false);

const showForgotModal = ref(false);
const forgotStep = ref(1);
const forgotLoading = ref(false);
const forgotMaskEmail = ref("");
const forgotForm = reactive({
  username: "",
  email: "",
  newPassword: "",
  confirmPassword: "",
  resetToken: "",
});

// ---------- 扫码登录 ----------
// 识别登录页当前运行环境，让扫码会话记录真实来源端（而不是写死的 pc）。
// UA 关键字：微信内置浏览器含 MicroMessenger；手机 UA 含 Mobile/Android/iPhone
const detectClientChannel = () => {
  const ua = navigator.userAgent || "";
  const inWeChat = /MicroMessenger/i.test(ua);
  const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua);
  if (isMobile && inWeChat) return "wechat-h5";
  if (isMobile) return "h5";
  return "pc";
};
const clientChannel = detectClientChannel();
const isMobileClient = clientChannel !== "pc";

const qrImage = ref("");
const qrSceneId = ref("");
const qrExpiresAt = ref("");
const qrCountdown = ref(0);
const qrTimer = ref(null);
const qrPollTimer = ref(null);
const qrLoading = ref(false);
const qrError = ref("");

// 扫码打开的小程序版本：正式版槽位可能临时部署其他项目，
// 手动切换到体验版/开发版保底，保证至少一个版本能扫码登录；
// 选择持久化到 localStorage，下次打开自动沿用
const QR_ENV_VERSION_KEY = "wx_qr_env_version";
const qrEnvVersion = ref(
  localStorage.getItem(QR_ENV_VERSION_KEY) || (import.meta.env.PROD ? "release" : "trial")
);
watch(qrEnvVersion, (v) => {
  localStorage.setItem(QR_ENV_VERSION_KEY, v);
});
// 同一会话内切换版本：只换参数重新取码图，会话与轮询状态不受影响
const refreshQrImage = () => {
  const base = import.meta.env.VITE_BASE_URL || "";
  if (!base || !qrSceneId.value || qrLoading.value || qrError.value || !qrImage.value) return;
  qrImage.value = `${base}/qr-login/session/${encodeURIComponent(qrSceneId.value)}/code.png?env_version=${qrEnvVersion.value}&t=${Date.now()}`;
};
const onQrEnvVersionChange = () => refreshQrImage();

const clearQrTimers = () => {
  if (qrTimer.value) {
    clearInterval(qrTimer.value);
    qrTimer.value = null;
  }
  if (qrPollTimer.value) {
    clearInterval(qrPollTimer.value);
    qrPollTimer.value = null;
  }
};

const startQrCountdown = (expiresAt) => {
  clearQrTimers();
  const exp = new Date(expiresAt).getTime();
  const update = () => {
    const diff = Math.max(0, Math.floor((exp - Date.now()) / 1000));
    qrCountdown.value = diff;
    if (diff <= 0) {
      clearQrTimers();
    }
  };
  update();
  qrTimer.value = setInterval(update, 1000);
};

const startQrPolling = () => {
  if (!qrSceneId.value) return;
  if (qrPollTimer.value) {
    clearInterval(qrPollTimer.value);
  }
  const poll = async () => {
    if (!qrSceneId.value) return;
    try {
      const res = await getQrLoginSessionStatus(qrSceneId.value);
      if (!res) return;
      if (res.code === 410 || res.data?.status === "expired") {
        qrError.value = res.message || "二维码已过期，请刷新";
        qrSceneId.value = "";
        qrCountdown.value = 0;
        clearQrTimers();
        return;
      }
      if (res.code === 200 && res.data?.status === "confirmed" && res.data.token) {
        const { token, refreshToken, user } = res.data;
        if (token && user) {
          adminStore.setToken(token, user);
          if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
          message.success("扫码登录成功，欢迎回来");
          qrSceneId.value = "";
          clearQrTimers();
          router.push("/dashboard");
        }
      }
    } catch (e) {
      // 忽略单次轮询错误，等待下次
    }
  };
  poll();
  qrPollTimer.value = setInterval(poll, 2500);
};

const initQrLogin = async () => {
  qrLoading.value = true;
  qrError.value = "";
  qrImage.value = "";
  qrSceneId.value = "";
  qrExpiresAt.value = "";
  clearQrTimers();
  try {
    const res = await createQrLoginSession({ channel: clientChannel, env_version: qrEnvVersion.value });
    if (res.code === 200 && res.data?.sceneId) {
      qrSceneId.value = res.data.sceneId;
      // Android 微信/QQ WebView 对 data:image/* base64 有时不渲染/缓存异常，优先用后端 PNG 地址
      const base = import.meta.env.VITE_BASE_URL || "";
      if (base) {
        const t = Date.now();
        qrImage.value = `${base}/qr-login/session/${encodeURIComponent(qrSceneId.value)}/code.png?env_version=${qrEnvVersion.value}&t=${t}`;
      } else {
        // 兜底：仍使用后端返回的 dataURL
        qrImage.value = res.data.miniProgramCode || "";
      }
      if (res.data.expiresAt) {
        qrExpiresAt.value = res.data.expiresAt;
        startQrCountdown(res.data.expiresAt);
      }
      startQrPolling();
    } else {
      qrError.value = res.message || "获取小程序码失败，请稍后重试";
    }
  } catch (e) {
    const rawMsg = e?.response?.data?.message || e?.message || "";
    let niceMsg = "获取小程序码失败，请稍后重试";
    if (typeof rawMsg === "string" && rawMsg.toLowerCase().includes("timeout")) {
      niceMsg = "获取小程序码超时，请检查网络后重试";
    } else if (rawMsg) {
      niceMsg = rawMsg;
    }
    qrError.value = niceMsg;
  }
  qrLoading.value = false;
};

// 切到扫码页时：有未过期的会话就续上倒计时和轮询，否则新开一个会话；
// 切走时停止定时器，避免后台空转
watch(activeTab, (v) => {
  if (v === "qrcode") {
    const alive =
      qrSceneId.value &&
      qrExpiresAt.value &&
      qrImage.value &&
      new Date(qrExpiresAt.value).getTime() > Date.now();
    if (alive) {
      startQrCountdown(qrExpiresAt.value);
      startQrPolling();
    } else {
      initQrLogin();
    }
  } else {
    clearQrTimers();
  }
});

onUnmounted(() => {
  clearQrTimers();
});

// ---------- 找回密码 ----------
const fetchMaskEmail = async () => {
  const name = forgotForm.username.trim();
  if (!name) {
    message.warning("请输入用户名");
    return;
  }
  forgotLoading.value = true;
  try {
    const res = await getForgotEmail(name);
    if (res.code === 200 && res.data?.maskEmail) {
      forgotMaskEmail.value = res.data.maskEmail;
      forgotStep.value = 2;
    } else {
      message.error(res.message || "获取失败");
    }
  } catch (e) {
    message.error(e?.response?.data?.message || e?.message || "请求失败");
  }
  forgotLoading.value = false;
};

watch(showForgotModal, (v) => {
  if (v) {
    forgotStep.value = 1;
    forgotMaskEmail.value = "";
    forgotForm.username = "";
    forgotForm.email = "";
    forgotForm.newPassword = "";
    forgotForm.confirmPassword = "";
    forgotForm.resetToken = "";
  }
});

const doForgotVerify = async () => {
  const email = forgotForm.email.trim();
  if (!email) {
    message.warning("请输入完整邮箱");
    return;
  }
  forgotLoading.value = true;
  try {
    const res = await forgotVerify({ username: forgotForm.username.trim(), email });
    if (res.code === 200 && res.data?.resetToken) {
      forgotForm.resetToken = res.data.resetToken;
      forgotStep.value = 3;
    } else {
      message.error(res.message || "验证失败");
    }
  } catch (e) {
    message.error(e?.response?.data?.message || e?.message || "验证失败");
  }
  forgotLoading.value = false;
};

const doForgotReset = async () => {
  const pw = forgotForm.newPassword;
  const confirm = forgotForm.confirmPassword;
  const pwTrim = pw ? String(pw).trim() : "";
  if (pwTrim.length <= 5) {
    message.warning("密码不能为空且须大于 5 个字符");
    return;
  }
  if (pw !== confirm) {
    message.warning("两次输入的密码不一致");
    return;
  }
  forgotLoading.value = true;
  try {
    const res = await forgotReset({ resetToken: forgotForm.resetToken, newPassword: base64Encode(pwTrim) });
    if (res.code === 200) {
      message.success(res.message || "密码已重置");
      showForgotModal.value = false;
      forgotStep.value = 1;
      forgotMaskEmail.value = "";
      forgotForm.username = "";
      forgotForm.email = "";
      forgotForm.newPassword = "";
      forgotForm.confirmPassword = "";
      forgotForm.resetToken = "";
    } else {
      message.error(res.message || "重置失败");
    }
  } catch (e) {
    message.error(e?.response?.data?.message || e?.message || "重置失败");
  }
  forgotLoading.value = false;
};

// ---------- 验证码 ----------
const captchaId = ref("");
const captchaRefreshing = ref(false);
let num1 = ref(0);
let num2 = ref(0);

// 从后端获取验证码（首次加载、点击刷新、任意登录/注册失败后自动刷新）
const fetchCaptcha = async () => {
  admin.countresult = "";
  captchaRefreshing.value = true;
  try {
    const res = await getCaptcha();
    const data = res?.data ?? res;
    if (data?.captchaId != null) {
      captchaId.value = data.captchaId;
      num1.value = data.num1 ?? 0;
      num2.value = data.num2 ?? 0;
    }
  } catch (e) {
    message?.error?.(e?.response?.data?.message || e?.message || "获取验证码失败");
  }
  captchaRefreshing.value = false;
};
onMounted(() => fetchCaptcha());

const admin = reactive({
  username: localStorage.getItem("username") || "",
  password: localStorage.getItem("password") ? atob(localStorage.getItem("password")) : "",
  confirmPassword: "",
  email: "",
  remember: !!localStorage.getItem("remember") || false,
  countresult: "",
});

let rules = {
  username: [
    { required: true, message: "请输入账号", trigger: "blur" },
    { min: 4, message: "账号至少 4 个字符", trigger: "blur" },
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 4, message: "密码至少 4 个字符", trigger: "blur" },
  ],
  countresult: [{ required: true, message: "请输入验证码", trigger: "blur" }],
};

const rulesRegister = {
  username: [
    { required: true, message: "请输入账号", trigger: "blur" },
    { min: 4, message: "账号至少 4 个字符", trigger: "blur" },
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 4, message: "密码至少 4 个字符", trigger: "blur" },
  ],
  confirmPassword: [
    { required: true, message: "请再次输入密码", trigger: "blur" },
    { min: 4, message: "密码至少 4 个字符", trigger: "blur" },
  ],
  email: [
    { required: true, message: "请填写邮箱，便于找回密码", trigger: "blur" },
    { type: "email", message: "请输入有效邮箱地址", trigger: "blur" },
  ],
  countresult: [{ required: true, message: "请输入验证码", trigger: "blur" }],
};

const login = async () => {
  formRef.value?.validate(async (errors) => {
    if (errors) return;
    loginLoading.value = true;
    try {
      const { username, password, remember, countresult } = admin;
      const res = await userLogin({
        username,
        password: base64Encode(password),
        captchaId: captchaId.value,
        captchaAnswer: captchaMd5(countresult),
      });
      if (res.code == 200) {
        adminStore.setToken(res.token, res.data);
        if (res.refreshToken) localStorage.setItem("refreshToken", res.refreshToken);
        message.info(res.message + " -欢迎回来ovo");
        router.push("/dashboard");
        if (remember) {
          localStorage.setItem("username", username);
          localStorage.setItem("password", btoa(password));
          localStorage.setItem("remember", 1);
        } else {
          localStorage.removeItem("username");
          localStorage.removeItem("password");
          localStorage.removeItem("remember");
        }
      } else {
        message.error(res.message);
        // 后端验证码为一次性消费（无论失败原因），任何失败都必须换新验证码
        await fetchCaptcha();
      }
    } catch (e) {
      message.error(e?.response?.data?.message || e?.message || "登录失败，请重试");
      await fetchCaptcha();
    } finally {
      loginLoading.value = false;
    }
  });
};

const register = async () => {
  formRefRegister.value?.validate(async (errors) => {
    if (errors) return;
    const { username, password, confirmPassword, email, countresult } = admin;
    const pw = String(password || "").trim();
    const pwConfirm = String(confirmPassword || "").trim();
    if (pw !== pwConfirm) {
      message.error("两次输入的密码不一致");
      return;
    }
    if (!email || !String(email).trim()) {
      message.error("请填写邮箱，便于后续找回密码");
      return;
    }
    registerLoading.value = true;
    try {
      const res = await userRegister({
        username,
        password: base64Encode(password),
        email: String(email).trim(),
        captchaId: captchaId.value,
        captchaAnswer: captchaMd5(countresult),
      });
      if (res.code == 200) {
        message.success((res.data?.username ? res.data.username + " " : "") + (res.message || "注册成功，请登录"));
        activeTab.value = "login";
        await fetchCaptcha();
      } else {
        message.error(res.message || "注册失败");
        // 任意失败都刷新验证码（后端一次性消费）
        await fetchCaptcha();
      }
    } catch (e) {
      message.error(e?.response?.data?.message || e?.message || "注册失败，请重试");
      await fetchCaptcha();
    } finally {
      registerLoading.value = false;
    }
  });
};
</script>

<style lang="less" scoped>
.login-page {
  min-height: 100vh;
  margin: 0;
  padding: 24px;
  box-sizing: border-box;
  background: linear-gradient(160deg, #0f172a 0%, #1e293b 45%, #334155 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}
.login-glow {
  position: absolute;
  width: 420px;
  height: 420px;
  border-radius: 50%;
  filter: blur(90px);
  opacity: 0.18;
  pointer-events: none;
}
.login-glow-1 {
  background: #10b981;
  top: -120px;
  left: -100px;
}
.login-glow-2 {
  background: #3b82f6;
  bottom: -140px;
  right: -80px;
}

.back-home {
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 10;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  font-size: 14px;
  padding: 8px 14px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(6px);
  transition: background 0.2s, color 0.2s;
}
.back-home:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
}
.back-home-icon {
  font-size: 18px;
  font-weight: 600;
}

.login-pane {
  width: 100%;
  max-width: 440px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 1;
}

.login-card-wrap {
  width: 100%;
}

.login-title {
  margin: 0 0 4px 0;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-align: center;
  background: linear-gradient(90deg, #6ee7b7 0%, #93c5fd 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.login-subtitle {
  margin: 0 0 20px 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
}

.login-card {
  width: 100%;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.45);
  background: #fff;
}
.login-card :deep(.n-card__content) {
  padding: 20px 22px 22px;
}
.login-tabs {
  margin-bottom: 4px;
}
.login-tabs :deep(.n-tabs-nav) {
  margin-bottom: 12px;
}
.login-tabs :deep(.n-tabs-tab) {
  font-weight: 600;
}

// 标签页切换动画：淡入 + 轻微滑动，替代原来突兀的弹窗
.auth-pane-enter-active {
  transition: opacity 0.2s ease, transform 0.25s ease;
}
.auth-pane-leave-active {
  transition: opacity 0.15s ease, transform 0.2s ease;
}
.auth-pane-enter-from {
  opacity: 0;
  transform: translateX(16px);
}
.auth-pane-leave-to {
  opacity: 0;
  transform: translateX(-12px);
}
.auth-pane {
  min-height: 300px;
}

.auth-form {
  margin-top: 4px;
}
.auth-form :deep(.n-form-item) {
  margin-bottom: 16px;
}
.auth-form :deep(.n-form-item:last-of-type) {
  margin-bottom: 0;
}

// 验证码：可点击刷新的算式卡片 + 输入框
.captcha-row {
  display: flex;
  gap: 10px;
  width: 100%;
  align-items: stretch;
}
.captcha-row :deep(.n-input) {
  flex: 1;
}
.captcha-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  height: 34px;
  min-width: 136px;
  padding: 0 12px;
  box-sizing: border-box;
  border: 1px dashed #cbd5e1;
  border-radius: 6px;
  background: #f8fafc;
  cursor: pointer;
  user-select: none;
  font-family: "Consolas", "Monaco", monospace;
  font-size: 15px;
  color: #334155;
  transition: border-color 0.2s, background 0.2s, color 0.2s;
}
.captcha-box:hover {
  border-color: #18a058;
  background: #f0fdf4;
  color: #0f766e;
}
.captcha-refresh-icon {
  font-size: 15px;
  color: #94a3b8;
  transition: color 0.2s;
}
.captcha-box:hover .captcha-refresh-icon {
  color: #18a058;
}
.captcha-box.refreshing .captcha-refresh-icon {
  animation: captcha-spin 0.6s linear infinite;
}
@keyframes captcha-spin {
  to {
    transform: rotate(360deg);
  }
}

.forgot-wrap {
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
}
.forgot-step .forgot-tip {
  margin: 8px 0 12px 0;
  font-size: 13px;
  color: var(--n-text-color-3, #666);
}
.loginbtn {
  width: 100%;
  height: 44px;
  font-weight: 600;
  border-radius: 10px;
}

// ---------- 扫码登录页签 ----------
.qr-login {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 420px;
}
.qr-version-switch {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 2px;
}
.qr-version-label {
  font-size: 13px;
  color: #64748b;
  white-space: nowrap;
}
.qr-version-tip {
  margin: 6px 0 4px;
  font-size: 12px;
  color: #94a3b8;
  text-align: center;
  line-height: 1.5;
  padding: 0 8px;
}
.qr-box {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 0 18px;
}
.qr-image {
  width: 300px;
  max-width: 100%;
  height: auto;
  aspect-ratio: 1 / 1;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.18);
  display: block;
  margin: 0 auto;
}
.qr-placeholder {
  width: 240px;
  height: 260px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #64748b;
}
.qr-tip {
  margin-top: 12px;
  font-size: 13px;
  color: #64748b;
  text-align: center;
}
.qr-help {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  margin-left: 4px;
  border-radius: 50%;
  border: 1px solid #cbd5e1;
  font-size: 11px;
  color: #94a3b8;
  cursor: help;
  vertical-align: middle;
}
.qr-help-content {
  max-width: 260px;
  font-size: 12px;
  line-height: 1.6;
  color: #475569;
}
.qr-help-content p {
  margin: 2px 0;
}
.qr-countdown {
  margin-top: 6px;
  font-size: 12px;
  color: #0f766e;
  text-align: center;
}
.qr-countdown-expired {
  color: #b91c1c;
}
.qr-actions {
  margin-top: 10px;
  display: flex;
  justify-content: center;
}
.qr-error {
  font-size: 13px;
  color: #b91c1c;
  text-align: center;
}

@media screen and (max-width: 480px) {
  .login-page {
    padding: 16px;
  }
  .login-title {
    font-size: 24px;
  }
  .login-card :deep(.n-card__content) {
    padding: 16px 14px;
  }
  .qr-image {
    width: 240px;
  }
}
</style>
