import { defineStore } from "pinia"



const STORE_NAME = "admin";
const TOKEN_KEY = "token";
const USERINFO_KEY = "userInfo";

export const AdminStore = defineStore(STORE_NAME, {
    state: () => {
        return {
            id: 0,
            username: "",
            nickname: "",
            avatar_url: "",
            openid: "",
            created_at: "",
            is_root: false,
            token: localStorage.getItem("token") || null,
            globalOptions:  localStorage.getItem("globalOptions") ? JSON.parse(localStorage.getItem("globalOptions")) : [],
        };
    },
    actions: {
        // 设置token
        setToken(token, userInfo) {
            this.token = token;
            localStorage.setItem(TOKEN_KEY, token);
            localStorage.setItem(USERINFO_KEY, JSON.stringify(userInfo))
            // 把用户信息存储到pinia中
            this.getAdminInfo();
        },
        // 删除token
        delToken() {
            this.token = null;
            localStorage.removeItem(TOKEN_KEY);
            // 清除本地存储中的用户信息
            localStorage.removeItem(USERINFO_KEY);
            // 刷新页面
            window.location.reload();
        },
        // 获取用户信息
        getAdminInfo() {
            // console.log('获取用户信息');
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const{ id, username, nickname, avatar_url, openid, created_at, is_root } = userInfo;
            this.id = id;
            this.username = username;
            this.nickname = nickname;
            this.avatar_url = avatar_url;
            this.openid = openid;
            this.created_at = created_at;
            this.is_root = is_root;
        },
        // 获取全局配置
        async getgloablOptions(optins) {
            this.globalOptions = optins;
            localStorage.setItem('globalOptions', JSON.stringify(optins));
            optins.find((item) => item.name === 'darkthem').value === 1 ? document.querySelector('html').classList.add('darklight') : '';
        },
    },
    getters: {},
})