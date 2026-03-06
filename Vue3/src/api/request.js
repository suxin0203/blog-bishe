import axios from 'axios';
import { AdminStore } from "@/stores/AdminStore";
import { createDiscreteApi, idID } from "naive-ui";
import { router } from "../common/router";
const adminStore = AdminStore();


const { message } = createDiscreteApi([
  "message",
]);



const instance = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
  timeout: 5000, // 请求超时时间，根据需求修改
});

// 请求拦截器，可以在发送请求之前做一些全局操作，如添加认证信息等
instance.interceptors.request.use(
  (config) => {
    // 如果请求地址包含 /token 就传token过去
    if (config.url.includes('/token')) {
      const token = localStorage.getItem('token');
      config.headers['Authorization'] = token ? `Bearer ${token}` : null;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器，可以在接收响应之后做一些全局操作，如处理错误信息等
instance.interceptors.response.use(
  (response) => {
    // 获取res.code 如果是401则跳转到登录页面 并且清除本地存储中的token
    if (response.data.code === 401 || response.data.code === 403) {
      response.data.code === 401 ? adminStore.delToken() : console.log('没有权限');
      message.error(response.data.message || "请重新登录");
    }
    return response.data;
  },
  (error) => {
    // 在这里处理错误信息，根据需求做相应的操作
    return Promise.reject(error);
  }
);

// 导出封装后的 Axios 实例
export default instance;
