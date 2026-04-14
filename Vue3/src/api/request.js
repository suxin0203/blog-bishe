import axios from 'axios';
import { AdminStore } from "@/stores/AdminStore";
import { createDiscreteApi } from "naive-ui";
import { router } from "../common/router";

const adminStore = AdminStore();
const { message } = createDiscreteApi(["message"]);

const instance = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
  timeout: 5000,
});

// 刷新锁：同一时刻只允许一个 refresh 请求
let isRefreshing = false;

// 401 等待队列
let requestQueue = [];

function enqueueRequest(config) {
  return new Promise((resolve, reject) => {
    requestQueue.push({ resolve, reject, config });
  });
}

function flushQueue(error, token) {
  requestQueue.forEach(({ resolve, reject, config }) => {
    if (error) {
      reject(error);
      return;
    }
    const retryConfig = {
      ...config,
      _retry: true,
      headers: {
        ...(config?.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    };
    resolve(instance(retryConfig));
  });
  requestQueue = [];
}

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) throw new Error('缺少 refreshToken');

  const rawAxios = (await import('axios')).default;
  const baseURL = import.meta.env.VITE_BASE_URL || '';
  const { data } = await rawAxios.post(
    baseURL + '/users/refresh',
    { refreshToken },
    { timeout: 8000 }
  );

  if (!(data?.code === 200 && data?.token)) {
    throw new Error(data?.message || '刷新登录状态失败');
  }

  localStorage.setItem('token', data.token);
  adminStore.token = data.token;
  if (data.data) {
    localStorage.setItem('userInfo', JSON.stringify(data.data));
    adminStore.getAdminInfo();
  }

  return data.token;
}

async function handle401AndRetry(config, msg) {
  if (!config || config._retry || config.url?.includes('/users/refresh')) {
    adminStore.delToken();
    message.error(msg || '登录已过期，请重新登录');
    router.push('/login');
    return Promise.reject(new Error(msg || '401'));
  }

  if (isRefreshing) {
    return enqueueRequest(config);
  }

  isRefreshing = true;
  try {
    const newToken = await refreshAccessToken();
    message.success('登录状态已自动刷新');

    // 先放行等待队列
    flushQueue(null, newToken);

    // 再重试当前请求
    const retryConfig = {
      ...config,
      _retry: true,
      headers: {
        ...(config?.headers || {}),
        Authorization: `Bearer ${newToken}`,
      },
    };
    return instance(retryConfig);
  } catch (err) {
    // 刷新失败，拒绝所有排队请求
    flushQueue(err, null);
    adminStore.delToken();
    message.error(msg || '登录已过期，请重新登录');
    router.push('/login');
    return Promise.reject(err);
  } finally {
    isRefreshing = false;
  }
}

instance.interceptors.request.use(
  (config) => {
    config.headers['X-Request-Time'] = String(Date.now());
    const token = localStorage.getItem('token');

    const needAuth = config.url.includes('/token')
      || config.url.includes('/users/me')
      || config.url.includes('/points/log')
      || config.url.includes('/points/orders')
      || config.url.includes('/articles/token')
      || config.url.includes('/likes')
      || config.url.includes('/favorites')
      || (config.url.includes('/comments') && config.method?.toLowerCase() === 'post')
      || (config.url.includes('/messages') && config.method?.toLowerCase() === 'post');

    if (needAuth && token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

instance.interceptors.response.use(
  async (response) => {
    const code = response.data?.code;

    // 兼容后端可能返回 HTTP 200 + code 401 的场景
    if (code === 401) {
      return handle401AndRetry(response.config, response.data?.message || '登录已过期，请重新登录');
    }

    if (code === 403) {
      message.error(response.data.message || '没有权限');
    }

    if (code && code !== 200) {
      message.error(response.data.message || '请求失败');
    }

    return response.data;
  },
  async (error) => {
    const res = error.response;
    const is401 = res?.status === 401 || res?.data?.code === 401;

    if (is401) {
      return handle401AndRetry(error.config, res?.data?.message || '登录已过期，请重新登录');
    }

    if (res?.data?.message) {
      message.error(res.data.message);
    }

    return Promise.reject(error);
  }
);

export default instance;
