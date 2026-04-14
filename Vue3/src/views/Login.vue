<template>
  <div class="login-page">
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
          <n-tab-pane name="login" tab="登录">
            <n-form :model="admin" :rules="rules" ref="formRef" class="auth-form">
              <n-form-item label="账号" path="username">
                <n-input v-model:value="admin.username" placeholder="至少 4 个字符" @keyup.enter="login()" />
              </n-form-item>
              <n-form-item label="密码" path="password">
                <n-input v-model:value="admin.password" placeholder="请输入密码" type="password" @keyup.enter="login()" />
              </n-form-item>
              <n-form-item label="验证码" path="countresult">
                <n-input-group>
                  <n-input-group-label style="background-color: transparent" @click="fetchCaptcha()">
                    {{ num1 }} + {{ num2 }} =
                  </n-input-group-label>
                  <n-input v-model:value="admin.countresult" placeholder="计算结果" @keyup.enter="login()" />
                </n-input-group>
              </n-form-item>
              <n-form-item>
                <n-checkbox v-model:checked="admin.remember" label="记住我" />
              </n-form-item>
              <n-form-item>
                <n-button type="primary" block strong @click="login" class="loginbtn">登 录</n-button>
              </n-form-item>
            </n-form>
            <div class="forgot-wrap">
              <n-button text type="primary" tag="a" @click.prevent="showForgotModal = true">忘记密码？</n-button>
            </div>
          </n-tab-pane>
          <n-tab-pane name="register" tab="注册">
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
                <n-input-group>
                  <n-input-group-label style="background-color: transparent" @click="fetchCaptcha()">
                    {{ num1 }} + {{ num2 }} =
                  </n-input-group-label>
                  <n-input v-model:value="admin.countresult" placeholder="计算结果" @keyup.enter="register()" />
                </n-input-group>
              </n-form-item>
              <n-form-item>
                <n-button type="primary" block strong @click="register" class="loginbtn">注 册</n-button>
              </n-form-item>
            </n-form>
          </n-tab-pane>
        </n-tabs>
        <div class="other-login">
          <span class="other-login-label">其它登录方式</span>
          <n-button quaternary size="small" class="wechat-btn" @click="openWechatQr">
            <span class="wechat-icon">
              <img
                class="wechat-icon-img"
                src="https://img.icons8.com/color/48/weixing.png"
                alt="WeChat"
              />
            </span>
            <span class="wechat-text">扫码登录 / 注册</span>
          </n-button>
        </div>
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
    <n-modal v-model:show="showQrModal" preset="card" title="微信扫码登录 / 注册" style="width: 420px" :mask-closable="true">
      <div class="qr-login">
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
              请使用微信扫描小程序码，按提示完成登录或注册
              <n-tooltip trigger="hover">
                <template #trigger>
                  <span class="qr-help">?</span>
                </template>
                <div class="qr-help-content">
                  <p>1. 已绑定账号：先在小程序内确认“允许在本次电脑登录”，再完成登录。</p>
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
    </n-modal>
  </div>
</template>

<script setup>
import { reactive, ref, inject, onMounted, onUnmounted, watch } from "vue";
import { AdminStore } from "../stores/AdminStore";
import { router, routes } from "@/common/router.js";
import { getCaptcha, userLogin, userRegister, getForgotEmail, forgotVerify, forgotReset, createQrLoginSession, getQrLoginSessionStatus } from "../api/api";
import { base64Encode, captchaMd5 } from "@/utils/encode";

const axios = inject("axios");
const message = inject("message");
const adminStore = AdminStore();

const formRef = ref();
const formRefRegister = ref();
const activeTab = ref("login");

const showQrModal = ref(false);

const qrImage = ref("");
const qrSceneId = ref("");
const qrCountdown = ref(0);
const qrTimer = ref(null);
const qrPollTimer = ref(null);
const qrLoading = ref(false);
const qrError = ref("");

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

const captchaId = ref("");
let num1 = ref(0);
let num2 = ref(0);

const admin = reactive({
  username: localStorage.getItem("username") || "",
  password: localStorage.getItem("password") ? atob(localStorage.getItem("password")) : "",
  confirmPassword: "",
  email: "",
  remember: !!localStorage.getItem("remember") || false,
  countresult: "",
});

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
  clearQrTimers();
  try {
    const res = await createQrLoginSession({ channel: "pc" });
    if (res.code === 200 && res.data?.sceneId && res.data?.miniProgramCode) {
      qrSceneId.value = res.data.sceneId;
      qrImage.value = res.data.miniProgramCode;
      if (res.data.expiresAt) {
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

const openWechatQr = () => {
  showQrModal.value = true;
  if (!qrSceneId.value) {
    initQrLogin();
  }
};

watch(activeTab, (v) => {
  if (v !== "login" && v !== "register") {
    clearQrTimers();
  }
});

onUnmounted(() => {
  clearQrTimers();
});

// 从后端获取验证码（点击刷新或首次加载）
const fetchCaptcha = async () => {
  admin.countresult = "";
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
};
onMounted(() => fetchCaptcha());

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

const login = async (e) => {
  formRef.value?.validate(async (errors) => {
    if (errors) return;
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
      const msg = (res.message || "").toString();
      if (msg.includes("验证码") || msg.includes("验证码已过期")) await fetchCaptcha();
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
      admin.countresult = "";
      await fetchCaptcha();
    } else {
      message.error(res.message || "注册失败");
      const msg = (res.message || "").toString();
      if (msg.includes("验证码") || msg.includes("验证码已过期")) await fetchCaptcha();
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
}

.back-home {
  position: fixed;
  top: 20px;
  left: 20px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  font-size: 14px;
  padding: 8px 14px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
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
  max-width: 420px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.login-card-wrap {
  width: 100%;
}

.login-title {
  margin: 0 0 4px 0;
  font-size: 26px;
  font-weight: 700;
  color: #fff;
  text-align: center;
  letter-spacing: 0.02em;
}

.login-subtitle {
  margin: 0 0 20px 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.65);
  text-align: center;
}

.login-card {
  width: 100%;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
  background: #fff;
}
.login-card :deep(.n-card__content) {
  padding: 24px 20px 20px;
}
.login-tabs :deep(.n-tabs-nav) {
  margin-bottom: 8px;
}
.login-tabs :deep(.n-tab-pane) {
  padding: 0;
}
.auth-form {
  margin-top: 4px;
}
.auth-form :deep(.n-form-item) {
  margin-bottom: 18px;
}
.auth-form :deep(.n-form-item:last-of-type) {
  margin-bottom: 0;
}
.other-login {
  margin-top: 16px;
  padding-top: 10px;
  border-top: 1px dashed rgba(148, 163, 184, 0.5);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.other-login-label {
  font-size: 12px;
  color: #9ca3af;
}
.wechat-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 999px;
}
.wechat-icon {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: #22c55e;
  color: #fff;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.wechat-icon-img {
  width: 16px;
  height: 16px;
  display: block;
}
.wechat-text {
  font-size: 13px;
  color: #16a34a;
}
.qr-login {
  margin-top: 8px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.qr-box {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px 0;
}
.qr-image {
  width: 360px;
  height: 360px;
  border-radius: 16px;
  box-shadow: 0 15px 35px rgba(15, 23, 42, 0.35);
  display: block;
  margin: 0 auto;
}
.qr-placeholder {
  width: 200px;
  height: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #64748b;
}
.qr-tip {
  margin-top: 10px;
  font-size: 13px;
  color: #64748b;
  text-align: center;
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
  margin-top: 6px;
  display: flex;
  justify-content: center;
}
.qr-error {
  font-size: 13px;
  color: #b91c1c;
  text-align: center;
}
.qr-desc {
  margin-top: 8px;
  font-size: 12px;
  color: #6b7280;
  line-height: 1.5;
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

@media screen and (max-width: 480px) {
  .login-page {
    padding: 16px;
  }
  .login-title {
    font-size: 22px;
  }
  .login-card :deep(.n-card__content) {
    padding: 20px 16px;
  }
}

.button:active {
  border: 1px solid #2e8644;
}
</style>
