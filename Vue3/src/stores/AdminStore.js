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
            role: "user",
            points: 0,
            title: "",
            created_at: "",
            is_root: false,
            token: localStorage.getItem("token") || null,
            globalOptions: localStorage.getItem("globalOptions") ? JSON.parse(localStorage.getItem("globalOptions")) : [],
        };
    },
    actions: {
        // 设置 token 与用户信息（对接 Express 登录返回的 token、data）
        setToken(token, userInfo) {
            this.token = token;
            localStorage.setItem(TOKEN_KEY, token);
            localStorage.setItem(USERINFO_KEY, JSON.stringify(userInfo || {}));
            this.getAdminInfo();
        },
        // 删除 token 与用户信息；reload=false 时只清状态不刷新页面（供 401 拦截器先提示再跳转）
        delToken(reload = true) {
            this.token = null;
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem("refreshToken");
            localStorage.removeItem(USERINFO_KEY);
            if (reload) window.location.reload();
        },
        // 从 localStorage 恢复用户信息（与后端 formatUser 字段一致：id, username, nickname, role, is_root 等）
        getAdminInfo() {
            const raw = localStorage.getItem(USERINFO_KEY);
            if (!raw) return;
            try {
                const userInfo = JSON.parse(raw);
                this.id = userInfo.id ?? 0;
                this.username = userInfo.username ?? "";
                this.nickname = userInfo.nickname ?? "";
                this.avatar_url = userInfo.avatar_url ?? "";
                this.openid = userInfo.openid ?? "";
                this.role = userInfo.role ?? "user";
                this.points = userInfo.points ?? 0;
                this.title = userInfo.title ?? "";
                this.created_at = userInfo.created_at ?? "";
                this.is_root = !!userInfo.is_root;
            } catch (_) {}
        },
        // 更新本地昵称/头像（修改个人资料后同步到 store 与 localStorage）
        setNickname(nickname) {
            if (nickname != null) {
                this.nickname = nickname;
                this._patchUserInfo({ nickname });
            }
        },
        setAvatarUrl(avatar_url) {
            if (avatar_url != null) {
                this.avatar_url = avatar_url;
                this._patchUserInfo({ avatar_url });
            }
        },
        setTitle(title) {
            if (title !== undefined) {
                this.title = title ?? "";
                this._patchUserInfo({ title: this.title });
            }
        },
        _patchUserInfo(patch) {
            const raw = localStorage.getItem(USERINFO_KEY);
            if (!raw) return;
            try {
                const userInfo = { ...JSON.parse(raw), ...patch };
                localStorage.setItem(USERINFO_KEY, JSON.stringify(userInfo));
            } catch (_) {}
        },
        // 获取全局配置（支持 darkthem / darktheme 键名兼容）
        async getgloablOptions(optins) {
            this.globalOptions = optins || [];
            localStorage.setItem('globalOptions', JSON.stringify(this.globalOptions));
            const themeRow = this.globalOptions.find((item) => item.name === 'darkthem' || item.name === 'darktheme');
            const isDark = themeRow && Number(themeRow.value) === 1;
            const htmlEl = document.querySelector('html');
            if (htmlEl) {
                if (isDark) htmlEl.classList.add('darklight');
                else htmlEl.classList.remove('darklight');
            }
        },
    },
    getters: {},
})