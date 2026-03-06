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

app.use(router);
app.use(naive);
app.use(createPinia());

console.log(app);


import { AdminStore } from "@/stores/AdminStore";
const adminStore = AdminStore();
// 初始化应用时检查本地存储中是否有token
if (localStorage.getItem('token')) {
  // 将用户信息加载到状态管理器中
  // console.log('初始化应用时检查本地存储中是否有token');
  adminStore.getAdminInfo();

}



app.mount("#app");




