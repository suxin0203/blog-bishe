<template>
  <div class="main-panel">
    <!-- 顶层：个人信息 + 快捷入口，占满宽度 -->
    <header class="dashboard-topbar">
      <div class="topbar-inner">
        <n-dropdown
          trigger="click"
          :options="userDropdownOptions"
          @select="onUserMenuSelect"
        >
          <div class="topbar-user clickable">
            <n-avatar
              round
              :size="44"
              :src="adminStore.avatar_url || dashboardDefaultAvatar || DEFAULT_AVATAR_URL"
            />
            <div class="topbar-user-info">
            <span class="topbar-name">
              {{ adminStore.nickname || adminStore.username || "用户" }}
              {{ adminStore.is_root ? "👑" : "" }}
            </span>
            <n-space :size="8" style="margin-top: 4px">
              <n-tag
                v-if="adminStore.points != null"
                size="small"
                round
                type="success"
                class="points-tag"
                @click="showPointsLog = true; loadPointsLog()"
              >
                积分 {{ adminStore.points }}
              </n-tag>
              <n-tag v-if="adminStore.title" size="small" type="info" round>
                {{ adminStore.title }}
</n-tag>
            </n-space>
            </div>
          </div>
        </n-dropdown>
        <div class="topbar-shortcuts">
          <n-button quaternary size="small" @click="addArticle">
            <template #icon>
              <n-icon :component="CreateOutline" size="18" />
            </template>
            写文章
          </n-button>
          <n-button quaternary size="small" @click="router.push({ name: 'board' })">
            <template #icon>
              <n-icon :component="StatsChartOutline" size="18" />
            </template>
            数据看板
          </n-button>
          <n-button v-if="adminStore.is_root" quaternary size="small" @click="router.push({ name: 'pointsmall' })">
            <template #icon>
              <n-icon :component="CartOutline" size="18" />
            </template>
            积分商城
          </n-button>
          <n-button quaternary size="small" type="primary" @click="router.push({ name: 'home' })">
            <template #icon>
              <n-icon :component="HomeIcon" size="18" />
            </template>
            访问前台
          </n-button>
        </div>
        <div class="topbar-actions">
          <n-button quaternary type="error" size="small" @click="toLogout()">
            <template #icon>
              <n-icon :component="LogOutOutline" size="18" />
            </template>
            退出登录
          </n-button>
        </div>
      </div>
    </header>

    <div class="dashboard-body">
      <aside class="dashboard-sider" :class="{ collapsed }">
        <n-menu
          :collapsed="collapsed"
          :collapsed-width="64"
          :collapsed-icon-size="22"
          :options="menuOptions"
          :value="activeMenuKey"
          :default-expanded-keys="defaultExpandedKeys"
          :expand-icon="expandIcon"
          @update:value="handleUpdateValue"
        />
        <div class="sider-trigger" @click="collapsed = !collapsed">
          <n-icon :component="collapsed ? ChevronForwardOutline : ChevronBackOutline" size="20" />
        </div>
      </aside>
      <main class="dashboard-main">
        <div class="main-inner">
          <div class="main-inner-content">
            <router-view />
          </div>
        </div>
      </main>
    </div>
    <n-drawer v-model:show="showPointsLog" :width="520" placement="right">
      <n-drawer-content title="积分流水" closable>
        <n-spin :show="pointsLogLoading">
          <n-list v-if="pointsLogList.length">
            <n-list-item v-for="item in pointsLogList" :key="item.id">
              <n-thing>
                <template #header>
                  <span :style="{ color: item.change >= 0 ? '#18a058' : '#d03050' }">
                    {{ item.change >= 0 ? '+' : '' }}{{ item.change }}
                  </span>
                  <n-text depth="2" style="margin-left: 8px">{{ reasonLabel(item) }}</n-text>
                </template>
                <template #header-extra>{{ item.created_at }}</template>
              </n-thing>
            </n-list-item>
          </n-list>
          <n-empty v-else description="暂无流水" />
        </n-spin>
      </n-drawer-content>
    </n-drawer>

    <!-- 修改个人信息 -->
    <n-drawer v-model:show="showProfileDrawer" :width="400" placement="right">
      <n-drawer-content title="修改个人信息" closable>
        <n-form :model="profileForm" label-placement="top" style="margin-top: 16px">
          <n-form-item label="昵称">
            <n-input v-model:value="profileForm.nickname" placeholder="请输入昵称" maxlength="20" show-count />
          </n-form-item>
          <n-form-item label="头像 URL">
            <n-input v-model:value="profileForm.avatar_url" placeholder="请输入头像链接" />
          </n-form-item>
          <n-space justify="end" style="margin-top: 24px">
            <n-button @click="showProfileDrawer = false">取消</n-button>
            <n-button type="primary" :loading="profileSaving" @click="saveProfile">保存</n-button>
          </n-space>
        </n-form>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>

<script setup>
import { AdminStore } from "@/stores/AdminStore";
import { reactive, ref, inject, h, defineComponent, computed } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { router, routes } from "@/common/router.js";
import { getPointsLog, updateUserInfo } from "@/api/api";
import { DEFAULT_AVATAR_URL } from "@/common/constants";
import { CaretDownOutline, ChevronBackOutline, ChevronForwardOutline } from "@vicons/ionicons5";
import { NIcon } from "naive-ui";
import {
  BookOutline as BookIcon,
  PersonOutline as PersonIcon,
  HomeOutline as HomeIcon,
  CreateOutline,
  LibraryOutline,
  LinkOutline,
  EllipsisHorizontalCircle,
  ChatbubbleOutline,
  PricetagOutline,
  StatsChartOutline,
  CartOutline,
  HeartOutline,
  LogOutOutline,
} from "@vicons/ionicons5";

const axios = inject("axios");
const message = inject("message");
const adminStore = AdminStore();
const route = useRoute();
const collapsed = ref(false);
const dashboardDefaultAvatar = computed(() => {
  const url = (adminStore.globalOptions?.find((i) => i.name === "default_avatar_url")?.content || "").trim();
  return url || DEFAULT_AVATAR_URL;
});

const routeNameToMenuKey = {
  board: "go-board",
  user: "go-user",
  category: "go-category",
  tag: "go-tag",
  friendslink: "go-friendslink",
  article: "go-article",
  setmessage: "go-setmessage",
  setcomment: "go-setcomment",
  otherset: "updataother",
  pointsmall: "go-pointsmall",
  favorites: "go-favorites",
};
const activeMenuKey = computed(() => routeNameToMenuKey[route.name] || null);
const defaultExpandedKeys = ["data-group", "content-group", "interact-group", "system-group"];
const showPointsLog = ref(false);
const pointsLogLoading = ref(false);
const pointsLogList = ref([]);
const showProfileDrawer = ref(false);
const profileSaving = ref(false);
const profileForm = reactive({ nickname: "", avatar_url: "" });

const userDropdownOptions = [
  { label: "修改个人信息", key: "profile" },
  { label: "积分流水", key: "points" },
];

function onUserMenuSelect(key) {
  if (key === "profile") {
    profileForm.nickname = adminStore.nickname ?? "";
    profileForm.avatar_url = adminStore.avatar_url ?? "";
    showProfileDrawer.value = true;
  } else if (key === "points") {
    showPointsLog.value = true;
    loadPointsLog();
  }
}

async function saveProfile() {
  const nickname = (profileForm.nickname || "").trim();
  if (!nickname) {
    message.warning("请输入昵称");
    return;
  }
  profileSaving.value = true;
  try {
    const res = await updateUserInfo(adminStore.id, {
      nickname: nickname,
      avatar_url: profileForm.avatar_url?.trim() || undefined,
    });
    if (res.code === 200) {
      adminStore.setNickname(nickname);
      adminStore.setAvatarUrl(profileForm.avatar_url?.trim() || "");
      message.success("保存成功");
      showProfileDrawer.value = false;
    } else {
      message.error(res.message || "保存失败");
    }
  } catch (e) {
    message.error("保存失败");
  } finally {
    profileSaving.value = false;
  }
}

function reasonLabel(itemOrReason) {
  const item = typeof itemOrReason === "object" && itemOrReason !== null
    ? itemOrReason
    : { reason: itemOrReason, remark: "" };
  const map = {
    daily_login: "每日登录",
    comment: "评论通过",
    like: "点赞",
    like_cancel: "取消点赞",
    article_liked: "文章获赞",
    article_unliked: "文章取消获赞",
    article_publish: "发布文章",
    article_delete: "删除文章",
    comment_approved: "评论审核通过",
    comment_removed: "删除已通过评论",
    redeem: "兑换",
    redeem_goods: "积分兑换",
    refund: "退款",
    admin_adjust: "管理员调整",
  };
  const label = map[item.reason] || item.reason || "-";
  const actionReasons = new Set(["article_liked", "article_unliked", "article_publish", "article_delete", "comment_approved", "comment_removed"]);
  if (item.remark && actionReasons.has(item.reason)) return `${label}《${item.remark}》`;
  return item.remark ? `${label}：${item.remark}` : label;
}

async function loadPointsLog() {
  pointsLogLoading.value = true;
  pointsLogList.value = [];
  try {
    const res = await getPointsLog({ pageSize: 50 });
    pointsLogList.value = res.data?.list || [];
  } catch (_) {
    pointsLogList.value = [];
  } finally {
    pointsLogLoading.value = false;
  }
}

function renderIcon(icon) {
  return () => h(NIcon, null, { default: () => h(icon) });
}

const editorOnlyKeys = ["go-article", "go-category", "go-tag", "go-home"];
const allMenuOptions = [
  {
    label: "数据与运营",
    key: "data-group",
    icon: renderIcon(StatsChartOutline),
    children: [
      { label: () => h(RouterLink, { to: { name: "board" } }, { default: () => "数据看板" }), key: "go-board", icon: renderIcon(StatsChartOutline) },
      { label: () => h(RouterLink, { to: { name: "pointsmall" } }, { default: () => "积分商城" }), key: "go-pointsmall", icon: renderIcon(CartOutline) },
    ],
  },
  {
    label: "内容管理",
    key: "content-group",
    icon: renderIcon(BookIcon),
    children: [
      { label: () => h(RouterLink, { to: { name: "article" } }, { default: () => "文章管理" }), key: "go-article", icon: renderIcon(BookIcon) },
      { label: () => h(RouterLink, { to: { name: "category" } }, { default: () => "分类管理" }), key: "go-category", icon: renderIcon(LibraryOutline) },
      { label: () => h(RouterLink, { to: { name: "tag" } }, { default: () => "标签管理" }), key: "go-tag", icon: renderIcon(PricetagOutline) },
      { label: () => h(RouterLink, { to: { name: "friendslink" } }, { default: () => "友情链接" }), key: "go-friendslink", icon: renderIcon(LinkOutline) },
    ],
  },
  {
    label: "互动与用户",
    key: "interact-group",
    icon: renderIcon(PersonIcon),
    children: [
      { label: () => h(RouterLink, { to: { name: "favorites" } }, { default: () => "我的收藏" }), key: "go-favorites", icon: renderIcon(HeartOutline) },
      { label: () => h(RouterLink, { to: { name: "user" } }, { default: () => "用户管理" }), key: "go-user", icon: renderIcon(PersonIcon) },
      { label: () => h(RouterLink, { to: { name: "setcomment" } }, { default: () => "评论管理" }), key: "go-setcomment", icon: renderIcon(ChatbubbleOutline) },
      { label: () => h(RouterLink, { to: { name: "setmessage" } }, { default: () => "留言管理" }), key: "go-setmessage", icon: renderIcon(ChatbubbleOutline) },
    ],
  },
  {
    label: "系统设置",
    key: "system-group",
    icon: renderIcon(EllipsisHorizontalCircle),
    children: [
      { label: () => h(RouterLink, { to: { name: "otherset" } }, { default: () => "其他设置" }), key: "updataother", icon: renderIcon(EllipsisHorizontalCircle) },
    ],
  },
];
const menuOptions = computed(() => {
  if (adminStore.role === "editor") {
    const filtered = allMenuOptions.filter(
      (opt) => opt.key === "data-group" || opt.key === "content-group" || opt.key === "interact-group"
    );
    return filtered.map((opt) => {
      if (opt.key === "interact-group" && opt.children) {
        return { ...opt, children: opt.children.filter((c) => c.key === "go-favorites") };
      }
      if (opt.key === "data-group" && opt.children) {
        return { ...opt, children: opt.children.filter((c) => c.key === "go-board") };
      }
      if (opt.key === "content-group" && opt.children) {
        return { ...opt, children: opt.children.filter((c) => ["go-article", "go-category", "go-tag"].includes(c.key)) };
      }
      return opt;
    });
  }
  return allMenuOptions;
});

const handleUpdateValue = (key, item) => {
  if (key === "logout") {
    toLogout();
  }
};

const expandIcon = () => {
  return h(NIcon, null, { default: () => h(CaretDownOutline) });
};

const toLogout = (url) => {
  router.push(url ? url : "/");
  //清理token
  adminStore.delToken();
  message.info("退出成功");
};

const addArticle = () => {
  router.push({ name: "article", query: { tab: "add" } });
};
</script>

<style lang="less" scoped>
.main-panel {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  max-width: 100vw;
  overflow: hidden;
  background: var(--page-bg, #f0f2f5);
  box-sizing: border-box;
}

.dashboard-topbar {
  flex-shrink: 0;
  width: 100%;
  background: var(--card-bg, #fff);
  border-bottom: 1px solid var(--border, #e8e8ec);
  border-left: 3px solid #18a058;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}
.topbar-inner {
  max-width: 100%;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}
.topbar-user {
  display: flex;
  align-items: center;
  gap: 12px;
}
.topbar-user-info {
  display: flex;
  flex-direction: column;
}
.topbar-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}
.points-tag {
  cursor: pointer;
}
.topbar-shortcuts {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}
.topbar-actions {
  display: flex;
  align-items: center;
}

.dashboard-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: row;
  overflow: hidden;
}

.dashboard-sider {
  width: 220px;
  flex-shrink: 0;
  height: 100%;
  background: linear-gradient(180deg, #fff 0%, #fafbfc 100%);
  border-right: 1px solid var(--border, #e8e8ec);
  display: flex;
  flex-direction: column;
  position: relative;
  transition: width 0.2s ease;
}
.dashboard-sider.collapsed {
  width: 64px;
}
.dashboard-sider :deep(.n-menu) {
  flex: 1;
  padding: 8px 0;
  min-width: 0;
  overflow-x: hidden;
}
.dashboard-sider :deep(.n-menu-item-content:not(.n-menu-item-content--disabled):hover) {
  background: rgba(24, 160, 88, 0.08);
  color: #18a058;
}
.dashboard-sider :deep(.n-menu-item-content.n-menu-item-content--selected) {
  background: rgba(24, 160, 88, 0.12);
  color: #18a058;
}
.sider-trigger {
  flex-shrink: 0;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-top: 1px solid var(--border, #e8e8ec);
  cursor: pointer;
  color: var(--text-secondary, #636873);
  transition: background 0.2s;
}
.sider-trigger:hover {
  background: var(--page-bg, #f5f6f8);
}

.dashboard-main {
  flex: 1;
  min-width: 0;
  min-height: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--page-bg, #f5f6f8);
}
.main-inner {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding: 16px 24px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}
.main-inner-content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.main-inner-content > * {
  min-height: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.main-inner-content > .n-card,
.main-inner-content .dashboard-page .n-card {
  border-radius: var(--radius, 8px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.topbar-user.clickable {
  cursor: pointer;
  border-radius: 8px;
  padding: 4px 8px 4px 4px;
  margin: -4px -8px -4px -4px;
}
.topbar-user.clickable:hover {
  background: var(--page-bg, #f5f6f8);
}

@media screen and (max-width: 768px) {
  .topbar-inner {
    padding: 10px 12px;
  }
  .topbar-shortcuts {
    order: 3;
    width: 100%;
  }
  .dashboard-sider {
    width: 64px;
  }
  .dashboard-sider:not(.collapsed) {
    width: 200px;
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 10;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.08);
  }
  .main-inner {
    padding: 12px;
  }
}
</style>
