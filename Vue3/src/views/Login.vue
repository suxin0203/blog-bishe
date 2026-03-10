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
                <div class="forgot-wrap">
                  <n-button text type="primary" tag="a" @click.prevent="showForgotModal = true">忘记密码？</n-button>
                </div>
              </n-form-item>
            </n-form>
          </n-tab-pane>
          <n-tab-pane name="register" tab="注册">
            <n-form :model="admin" :rules="rulesRegister" ref="formRefRegister" class="auth-form">
              <n-form-item label="账号" path="username">
                <n-input v-model:value="admin.username" placeholder="至少 4 个字符" @keyup.enter="register()" />
              </n-form-item>
              <n-form-item label="密码" path="password">
                <n-input v-model:value="admin.password" placeholder="至少 4 个字符" type="password" @keyup.enter="register()" />
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
import { reactive, ref, inject, onMounted, watch } from "vue";
import { AdminStore } from "../stores/AdminStore";
import { router, routes } from "@/common/router.js";
import { getCaptcha, userLogin, userRegister, getForgotEmail, forgotVerify, forgotReset } from "../api/api";
import { base64Encode, captchaMd5 } from "@/utils/encode";

const axios = inject("axios");
const message = inject("message");
const adminStore = AdminStore();

const formRef = ref();
const formRefRegister = ref();
const activeTab = ref("login");

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
  email: "",
  remember: !!localStorage.getItem("remember") || false,
  countresult: "",
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
    const { username, password, email, countresult } = admin;
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
.forgot-wrap {
  margin-top: 12px;
  text-align: center;
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
