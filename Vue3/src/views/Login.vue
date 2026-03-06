<template>
  <div class="bodyc">
    <button type="button" class="button" @click="router.push('/')">
      <span class="button__text">返 回</span>
      <span class="button__icon"
        ><svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          viewBox="0 0 24 24"
          stroke-width="2"
          stroke-linejoin="round"
          stroke-linecap="round"
          stroke="currentColor"
          height="24"
          fill="none"
          class="svg"
        >
          <line x1="25" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
      </span>
    </button>
    <div class="login-pane">
      <div class="qiu"></div>
      <n-card title="管理员登录">
        <n-form :model="admin" :rules="rules" ref="formRef">
          <n-form-item label="账号" path="username">
            <n-input
              v-model:value="admin.username"
              placeholder="请输入账号"
              @keyup.enter="login()"
            />
          </n-form-item>
          <n-form-item label="密码" path="password">
            <n-input
              v-model:value="admin.password"
              placeholder="请输入密码"
              type="password"
              @keyup.enter="login()"
            />
          </n-form-item>
          <n-form-item label="验证码" path="countresult">
            <n-input-group>
              <n-input-group-label
                style="background-color: transparent"
                @click="marthCount()"
              >
                {{ num1 }} + {{ num2 }} =
              </n-input-group-label>
              <n-input
                v-model:value="admin.countresult"
                :style="{ width: '80%' }"
                placeholder="请输入计算结果"
                @keyup.enter="login()"
              />
            </n-input-group>
          </n-form-item>
        </n-form>
        <template #footer>
          <n-checkbox
            v-model:checked="admin.remember"
            label="记住我"
            style="background-color: transparent; margin-bottom: 20px"
          />
          <n-space justify="space-around" size="large">
            <n-button
              type="primary"
              @click="login"
              class="loginbtn"
              @keyup.enter="login()"
            >
              登录
            </n-button>
            <n-button
              type="primary"
              secondary
              strong
              @click="register"
              class="loginbtn"
            >
              注册
            </n-button>
          </n-space>
        </template>
      </n-card>
      <div class="qiu1"></div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, inject, onMounted } from "vue";
import { AdminStore } from "../stores/AdminStore";
import { router, routes } from "@/common/router.js";
import { userLogin, userRegister } from "../api/api";

const axios = inject("axios");
const message = inject("message");
const adminStore = AdminStore();

const formRef = ref();

let num1 = ref();
let num2 = ref();
let sum = ref();

// 获取用户保存的账号密码
const { username, password, remember } = localStorage;
const admin = reactive({
  username: username || "",
  password: password ? atob(password) : "",
  remember: !!remember || false,
  countresult: "",
});

// 验证码逻辑
const marthCount = () => {
  admin.countresult = "";
  // 生成两个小于20的随机数并计算之和
  num1.value = Math.floor(Math.random() * 20);
  num2.value = Math.floor(Math.random() * 20);
  sum.value = num1.value + num2.value;
};
// 页面加载时候执行一次
marthCount();

let rules = {
  username: [
    { required: true, message: "请输入账号", trigger: "blur" },
    { min: 3, max: 12, message: "账号长度在 3 到 12 个字符", trigger: "blur" },
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 6, max: 18, message: "密码长度在 6 到 18 个字符", trigger: "blur" },
  ],
  countresult: [{ required: true, message: "请输入验证码", trigger: "blur" }],
};

const login = async (e) => {
  // 校验表单
  // e.preventDefault();
  formRef.value?.validate(async (errors) => {
    let { username, password, remember, countresult } = admin;
    if (!errors && countresult == sum.value) {
      let res = await userLogin({
        username,
        password,
      });
      if (res.code == 200) {
        router.push("/dashboard");
        message.info(res.message + " -欢迎回来ovo");
        // 将用户信息存储到本地存储
        adminStore.setToken(res.token, res.data);
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
        marthCount();
      }
    } else {
      message.error("验证码错误");
      marthCount();
    }
  });
};

const register = async (e) => {
  let { username, password, countresult } = admin;
  if (countresult == sum.value) {
    let res = await userRegister({ username, password });
    if (res.code == 200) {
      message.info(res.data.username + res.message);
      marthCount();
    } else {
      message.error(res.message);
      marthCount();
    }
  } else {
    message.error("验证码错误");
    marthCount();
    return;
  }
};
</script>

<style lang="less" scoped>
.bodyc {
  /* 初始化 取消内外边距 */
  margin: 0;
  padding: 0;
  /* 100%窗口高度 */
  height: 100vh;
  width: 100vw;
  /* 渐变背景 */
  background: linear-gradient(
    125deg,
    #2c3e50,
    #27ae60,
    #2980b9,
    #e74c3c,
    #8e44ad
  );
  /* 指定背景图像的大小 */
  background-size: 500%;
  /* 执行动画：动画名 时长 线性的 无限次播放 */
  animation: bgAnimation 15s linear infinite;
  // background: var(--baseColor);
}
.login-pane {
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: row;
}

.qiu {
  width: 300px;
  height: 300px;
  border-radius: 50%;
  margin-top: -230px;
  margin-right: -180px;
  background: linear-gradient(135deg, #ffb566, #ff6677);
  z-index: 0;
  animation: bounce-down 5s linear infinite;
}
.qiu1 {
  width: 175px;
  height: 175px;
  border-radius: 50%;
  margin-top: 225px;
  margin-left: -90px;
  background: linear-gradient(135deg, #de82ca, #259fac);
  z-index: 0;
  animation: bounce-down 8s linear infinite;
}

.n-card {
  width: 400px;
  height: 440px;
  z-index: 999;
  background-color: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  border: 0.8px solid rgba(255, 255, 255, 0.18);
  box-shadow: rgba(142, 142, 142, 0.19) 0px 6px 15px 0px;
  -webkit-box-shadow: rgba(142, 142, 142, 0.19) 0px 6px 15px 0px;
  border-radius: 12px;
  -webkit-border-radius: 12px;
  color: rgba(255, 255, 255, 0.75);
}
.n-input {
  background-color: transparent;
}
:deep(.n-checkbox-box) {
  background-color: transparent !important;
}

button {
  z-index: 1;
  position: relative;
  font-size: inherit;
  font-family: inherit;
  color: white;
  padding: 0.5em 1em;
  outline: none;
  border: none;
  // background-color: hsl(236, 32%, 26%);
  overflow: hidden;
  transition: color 0.6s ease-in-out;
}

.loginbtn {
  width: 140px;
}

.loginbtn::before {
  content: "";
  z-index: -1;
  position: absolute;
  top: 50%;
  left: 50%;
  width: 1em;
  height: 1em;
  border-radius: 50%;
  background-color: #3cefff;
  transform-origin: center;
  transform: translate3d(-50%, -50%, 0) scale3d(0, 0, 0);
  transition: transform 0.7s ease-in-out;
}

.loginbtn:hover {
  cursor: pointer;
  color: #161616;
}

.loginbtn:hover::before {
  transform: translate3d(-50%, -50%, 0) scale3d(30, 30, 30);
}

// .n-checkbox-box .n-checkbox {
//   background-color: transparent!important;;
// }

// 拟态卡片
// .n-card {
//   border-radius: 50px;
//   background: #e0e0e0;
//   box-shadow: -20px -20px 60px #bebebe, 20px 20px 60px #ffffff;
// }

/* 定义动画 */
@keyframes bgAnimation {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

@keyframes bounce-down {
  25% {
    -webkit-transform: translateY(-20px);
  }
  50%,
  100% {
    -webkit-transform: translateY(0);
  }

  75% {
    -webkit-transform: translateY(20px);
  }
}
@media screen and (max-width: 600px) {
  .n-card {
    width: 90vw;
  }
  // 媒体查询当分辨率小于768px时候，n-card宽度为90vw
  .qiu {
    position: fixed;
    width: 200px;
    height: 200px;
    right: 150px;
    border-radius: 50%;
    background: linear-gradient(135deg, #ffb566, #ff6677);
    z-index: 0;
    animation: bounce-down 5s linear infinite;
  }
  .qiu1 {
    position: fixed;
    width: 175px;
    height: 175px;
    left: 50px;
    border-radius: 50%;
    background: linear-gradient(135deg, #de82ca, #259fac);
    z-index: 0;
    animation: bounce-down 8s linear infinite;
  }
}

//以下是退出按钮的样式
.button {
  position: relative;
  width: 150px;
  height: 40px;
  cursor: pointer;
  display: flex;
  align-items: center;
  border: 1px solid #34974d;
  background-color: #3aa856;
  border-radius: 15px;
  // 固定定位
  position: fixed;
  bottom: 20px;
  right: 20px;
}

.button,
.button__icon,
.button__text {
  transition: all 0.3s;
}

.button .button__text {
  transform: translateX(30px);
  color: #fff;
  font-weight: 600;
}

.button .button__icon {
  position: absolute;
  transform: translateX(99px);
  height: 100%;
  width: 39px;
  background-color: #34974d;
  display: flex;
  align-items: center;
  justify-content: center;
}

.button .svg {
  width: 30px;
  stroke: #fff;
}

.button:hover {
  background: #34974d;
}

.button:hover .button__text {
  color: transparent;
}

.button:hover .button__icon {
  width: 118px;
  transform: translateX(0);
}

.button:active .button__icon {
  background-color: #2e8644;
}

.button:active {
  border: 1px solid #2e8644;
}
</style>
