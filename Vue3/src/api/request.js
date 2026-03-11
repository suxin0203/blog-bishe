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
    // 时间戳防重放（后端校验与服务器时间差不超过 30 秒）
    config.headers['X-Request-Time'] = String(Date.now());
    // 需登录的 /token 接口 或 可选登录的 POST /comments（带 token 时后端记录评论者）
    const token = localStorage.getItem('token');
    if (config.url.includes('/token') || config.url.includes('/users/me') || config.url.includes('/points/log') || config.url.includes('/points/orders') || config.url.includes('/articles/token') || config.url.includes('/likes') || config.url.includes('/favorites') || (config.url.includes('/comments') && config.method?.toLowerCase() === 'post') || (config.url.includes('/messages') && config.method?.toLowerCase() === 'post')) {
      if (token) config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器：遇到 401 时尝试用 refreshToken 刷新，成功后刷新整页
instance.interceptors.response.use(
  async (response) => {
    const code = response.data?.code;
    if (code === 403) {
      message.error(response.data.message || "没有权限");
    }
    if (code === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const axios = (await import('axios')).default;
          const baseURL = import.meta.env.VITE_BASE_URL || '';
          const { data } = await axios.post(baseURL + '/users/refresh', { refreshToken }, { timeout: 8000 });
          if (data?.code === 200 && data?.token) {
            localStorage.setItem('token', data.token);
            adminStore.token = data.token;
            if (data.data) {
              localStorage.setItem('userInfo', JSON.stringify(data.data));
              adminStore.getAdminInfo();
            }
            // 刷新成功后直接刷新当前页面，后续请求自动带上新 token
            window.location.reload();
            return;
          }
        } catch (_) {}
      }
      adminStore.delToken();
      message.error(response.data.message || "请重新登录");
      return response.data;
    }
    // 其余非 200 的业务码统一提示后返回
    if (code && code !== 200) {
      message.error(response.data.message || "请求失败");
    }
    return response.data;
  },
  async (error) => {
    const res = error.response;
    const is401 = res?.status === 401 || res?.data?.code === 401;
    const refreshToken = localStorage.getItem('refreshToken');
    if (is401 && refreshToken) {
      try {
        const axios = (await import('axios')).default;
        const baseURL = import.meta.env.VITE_BASE_URL || '';
        const { data } = await axios.post(baseURL + '/users/refresh', { refreshToken }, { timeout: 8000 });
        if (data?.code === 200 && data?.token) {
          localStorage.setItem('token', data.token);
          adminStore.token = data.token;
          if (data.data) {
            localStorage.setItem('userInfo', JSON.stringify(data.data));
            adminStore.getAdminInfo();
          }
          // 刷新成功后直接刷新当前页面
          window.location.reload();
          return;
        }
      } catch (_) {}
    }
    if (is401) {
      adminStore.delToken();
      message.error(res?.data?.message || "登录已过期，请重新登录");
    } else if (res?.data?.message) {
      // 其他接口异常也提示后端返回的 message
      message.error(res.data.message);
    }
    return Promise.reject(error);
  }
);

// 导出封装后的 Axios 实例
export default instance;
