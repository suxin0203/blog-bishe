<template>
  <div class="header" id="top" :class="{ headercolor: isActive, headermohu: isMohu, headertransparent: isTransparent }">
    <div class="nav-new">
      <div class="nav-new-l">
        <a href="#/" class="logo" @click.prevent="onNavClick($event, { route: '/' })">
          <img :src="siteLogoUrl || logo" :alt="siteName || 'LOGO'" />
        </a>
        <nav class="nav-menu">
          <template v-for="item in MAIN_NAV" :key="item.label">
            <a v-if="item.external" :href="item.external" target="_blank" rel="noopener" class="nav-item">
              <span class="nav-link">{{ item.label }}</span>
            </a>
            <a
              v-else
              :href="hashHref(item)"
              class="nav-item"
              :class="{ 'nav-item-active': isNavActive(item) }"
              @click="onNavClick($event, item)"
            >
              <span class="nav-link">{{ item.label }}</span>
            </a>
          </template>
        </nav>
      </div>
      <div class="nav-new-r">
        <div class="nav-search">
          <n-input
            :value="keyword"
            @input="$emit('update:keyword', $event)"
            @keydown.enter="emit('updateKeyword', keyword)"
            placeholder="搜索文章..."
            clearable
            class="nav-search-input"
          />
          <n-button type="primary" quaternary class="nav-search-btn" @click="emit('updateKeyword', keyword)">
            搜索
          </n-button>
        </div>
        <div v-if="adminStore.token" class="nav-back">
          <n-tag v-if="adminStore.title" size="small" type="info" round class="nav-title-tag">{{ adminStore.title }}</n-tag>
          <n-button v-if="adminStore.is_root || adminStore.role === 'editor'" type="primary" quaternary size="small" @click="goDashboard" class="nav-back-btn">
            进入后台
          </n-button>
          <n-dropdown trigger="click" :options="avatarMenuOptions" @select="handleAvatarMenu">
            <n-avatar
              round
              :size="32"
              :src="adminStore.avatar_url || defaultAvatarUrl || 'https://api.suxin23.cn/upload/avatar.png'"
              class="nav-avatar"
            />
          </n-dropdown>
        </div>
        <div v-else class="nav-back">
          <n-button type="primary" size="small" @click="goLogin" class="nav-login-btn">登录</n-button>
        </div>
      </div>
    </div>
    <n-modal v-model:show="showProfileModal" preset="card" title="编辑资料" style="width: 400px" :mask-closable="false">
      <n-form label-placement="top">
        <n-form-item label="昵称">
          <n-input v-model:value="profileForm.nickname" placeholder="显示名称" maxlength="20" show-count />
        </n-form-item>
        <n-form-item label="头像链接">
          <n-input v-model:value="profileForm.avatar_url" placeholder="图片 URL" clearable />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showProfileModal = false">取消</n-button>
          <n-button type="primary" :loading="profileSaving" @click="saveProfile">保存</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, watch, computed, inject, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { MAIN_NAV } from "@/common/mainNav.js";
import { AdminStore } from "@/stores/AdminStore";
import { updateUserInfo, getOtherswitch } from "@/api/api";
import logo from "@/assets/images/logo3.png";

const message = inject("message");
const adminStore = AdminStore();
const route = useRoute();
const router = useRouter();

const siteName = ref("");
const siteLogoUrl = ref("");
const defaultAvatarUrl = ref("");
onMounted(async () => {
  try {
    const res = await getOtherswitch();
    const list = res?.data || [];
    const byName = (name) => list.find((i) => i.name === name);
    siteName.value = (byName("site_name")?.content || "").trim();
    siteLogoUrl.value = (byName("site_logo_url")?.content || "").trim();
    defaultAvatarUrl.value = (byName("default_avatar_url")?.content || "").trim() || "https://api.suxin23.cn/upload/avatar.png";
  } catch (_) {
    defaultAvatarUrl.value = "https://api.suxin23.cn/upload/avatar.png";
  }
});

const showProfileModal = ref(false);
const profileSaving = ref(false);
const profileForm = ref({ nickname: "", avatar_url: "" });

const avatarMenuOptions = computed(() => {
  const opts = [{ label: "编辑资料", key: "profile" }];
  opts.push({ label: "我的收藏", key: "favorites" });
  opts.push({ label: "兑换记录", key: "orders" });
  opts.push({ label: "积分记录", key: "pointsLog" });
  if (adminStore.is_root || adminStore.role === "editor") {
    opts.push({ label: "进入后台", key: "dashboard" });
  }
  opts.push({ label: "退出", key: "logout" });
  return opts;
});

const handleAvatarMenu = (key) => {
  if (key === "profile") {
    profileForm.value = {
      nickname: adminStore.nickname || "",
      avatar_url: adminStore.avatar_url || "",
    };
    showProfileModal.value = true;
  } else if (key === "favorites") {
    router.push("/my-favorites");
  } else if (key === "orders") {
    router.push("/my-orders");
  } else if (key === "pointsLog") {
    router.push("/my-points-log");
  } else if (key === "dashboard") {
    goDashboard();
  } else if (key === "logout") {
    adminStore.delToken();
  }
};

const saveProfile = async () => {
  const nickname = (profileForm.value.nickname || "").trim();
  const avatar_url = (profileForm.value.avatar_url || "").trim() || null;
  profileSaving.value = true;
  try {
    const res = await updateUserInfo(adminStore.id, { nickname, avatar_url });
    if (res?.code === 200) {
      message.success("保存成功");
      adminStore.setNickname(nickname || adminStore.username);
      adminStore.setAvatarUrl(avatar_url || "");
      showProfileModal.value = false;
    } else {
      message.error(res?.message || "保存失败");
    }
  } catch (e) {
    message.error(e?.message || e?.data?.message || "保存失败");
  }
  profileSaving.value = false;
};

const hashHref = (item) => {
  const path = item.route || "/";
  return "#" + (path.startsWith("/") ? path : "/" + path);
};

const isNavActive = (item) => {
  const path = item.route || "/";
  return route.path === path;
};

const onNavClick = (e, item) => {
  if (item.external) return;
  const path = item.route || "/";
  e.preventDefault();
  if (route.path === path) return;
  const hash = "#" + (path.startsWith("/") ? path : "/" + path);
  window.location.hash = hash;
};
const props = defineProps({
  options: {
    type: Array,
    default: () => [{ label: "全部分类", value: 0 }],
  },
  keyword: {
    type: String,
    default: "",
  },
  category_id: {
    type: Number,
    default: 0,
  },
  setstyle: {
    type: Boolean,
    required: false,
  },
});

const emit = defineEmits([
  "update:keyword",
  "update:category_id",
  "updateKeyword",
  "updateCategory",
]);
const isActive = ref(false);
const isMohu = ref(false);
const isTransparent = ref(false);

const getScrollPosition = () => {
  const top = document.documentElement.scrollTop || document.body.scrollTop;
  isTransparent.value = props.setstyle && top <= 50;
  isMohu.value = top > 450;
  isActive.value = top > 50 && !isMohu.value;
};

const setupScrollListener = () => {
  window.addEventListener("scroll", getScrollPosition, false);
};

watch(
  () => props.setstyle,
  (newValue) => {
    if (newValue) {
      setupScrollListener();
      getScrollPosition();
    } else {
      isTransparent.value = false;
    }
  },
  { immediate: true }
);

const goDashboard = () => {
  router.push("/dashboard");
};

const goLogin = () => {
  router.push("/login");
};
</script>

<style lang="less" scoped>
.header {
  position: sticky;
  top: 0;
  width: 100%;
  z-index: 99;
  background: #fff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.2s ease;
  .nav-search-input {
    background: #f5f5f5;
  }
  .nav-back-btn {
    color: #18a058;
  }
  &.headertransparent {
    background: rgba(255, 255, 255, 0.35);
    backdrop-filter: saturate(120%) blur(8px);
    border-bottom-color: rgba(0, 0, 0, 0.04);
    box-shadow: none;
  }
  &.headermohu {
    background: rgba(255, 255, 255, 0.96);
    backdrop-filter: saturate(180%) blur(10px);
    border-bottom-color: transparent;
  }
}

.nav-new {
  height: 64px;
  max-width: 1200px;
  padding: 0 20px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.nav-new-l {
  display: flex;
  align-items: center;
  gap: 28px;
  flex: 1;
  min-width: 0;
}

.logo {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
  text-decoration: none;
  color: inherit;
  img {
    height: 32px;
    width: auto;
    border-radius: 6px;
    object-fit: contain;
  }
}

.nav-menu {
  display: flex;
  align-items: center;
  gap: 2px;
}

.nav-item {
  user-select: none;
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  &.nav-item-active .nav-link {
    color: #18a058;
    background: rgba(24, 160, 88, 0.12);
  }
  .nav-link {
    display: inline-block;
    padding: 6px 12px;
    font-size: 14px;
    font-weight: 500;
    color: #333;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.2s, color 0.2s;
  }
  .nav-link:hover {
    color: #18a058;
    background: rgba(24, 160, 88, 0.08);
  }
}

.nav-new-r {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.nav-search {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  max-width: 240px;
  .nav-search-input {
    flex: 1;
    border-radius: 6px;
    transition: background 0.2s;
  }
  .nav-search-btn {
    flex-shrink: 0;
  }
}

.nav-back {
  display: flex;
  align-items: center;
  gap: 8px;
  .nav-title-tag {
    max-width: 80px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .nav-back-btn {
    font-weight: 500;
  }
  .nav-avatar {
    cursor: pointer;
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    min-width: 32px;
    min-height: 32px;
    transition: transform 0.2s;
  }
  .nav-avatar:hover {
    transform: scale(1.06);
  }
}

@media screen and (max-width: 1250px) {
  .nav-new { max-width: 90vw; }
}

@media screen and (max-width: 900px) {
  .nav-menu { display: none; }
  .nav-search { max-width: 180px; }
}

@media screen and (max-width: 600px) {
  .header { min-height: 52px; }
  .nav-new {
    height: 52px;
    padding: 0 12px;
    max-width: 100%;
  }
  .nav-new-r {
    gap: 8px;
  }
  .nav-search { max-width: 120px; }
  .nav-back .nav-title-tag { display: none; }
  .nav-back .nav-back-btn { display: none; }
  .nav-avatar {
    width: 28px !important;
    height: 28px !important;
    min-width: 28px !important;
    min-height: 28px !important;
  }
}
</style>
