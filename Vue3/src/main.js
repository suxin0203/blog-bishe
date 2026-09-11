import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import naive from "naive-ui";
import { createDiscreteApi } from "naive-ui";
import { createPinia } from "pinia";
import { router } from "./common/router";
import axios from "axios";

// 引入animate.css
import 'animate.css';



axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const { message, dialog, notification } = createDiscreteApi([
  "message",
  "dialog",
  "notification",
]);

const app = createApp(App);





app.provide("axios", axios);
app.provide("message", message);
app.provide("dialog", dialog);
app.provide("notification", notification);
app.provide("server_url", axios.defaults.baseURL);

app.use(createPinia());
app.use(router);
app.use(naive);


import { AdminStore } from "@/stores/AdminStore";
const adminStore = AdminStore();
// 初始化应用时检查本地存储中是否有 token
if (localStorage.getItem('token')) {
  adminStore.getAdminInfo();
}
// 初始化时根据已缓存的 globalOptions 应用黑白灰主题（避免刷新后主题丢失）
try {
  const cached = localStorage.getItem('globalOptions');
  if (cached) {
    const list = JSON.parse(cached);
    const themeRow = list.find((item) => item.name === 'darkthem' || item.name === 'darktheme');
    const isDark = themeRow && Number(themeRow.value) === 1;
    const htmlEl = document.documentElement;
    if (isDark) htmlEl.classList.add('darklight');
    else htmlEl.classList.remove('darklight');
  }
} catch (_) {}



app.mount("#app");




