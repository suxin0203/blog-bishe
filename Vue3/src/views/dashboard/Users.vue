<template>
  <div class="dashboard-page">
    <n-card title="用户管理" class="admin-page-card user-card-wrap">
    <template #header-extra>
      <n-space align="center" :size="8">
        <n-input
          v-model:value="userKeyword"
          placeholder="搜索账号、昵称、称号"
          clearable
          style="width: 180px"
          @keydown.enter="getAllUsersList()"
        />
        <n-button quaternary size="small" @click="pageInfo.page = 1; getAllUsersList()">搜索</n-button>
        <n-button type="primary" size="small" @click="showAddModal = true">添加用户</n-button>
      </n-space>
    </template>
    <div class="card-body-scroll">
    <n-data-table
      :columns="userColumns"
      :data="displayedList"
      :bordered="false"
      size="small"
      :single-line="false"
      class="admin-table"
    />
    <n-empty v-if="categoryList.length === 0" description="暂无用户" style="padding: 24px 0" />
    </div>
    <div v-if="categoryList.length > 0" class="pagination-wrap">
      <n-pagination
        v-model:page="pageInfo.page"
        :page-size="pageInfo.pageSize"
        show-size-picker
        :page-sizes="[10, 20, 50]"
        :item-count="categoryList.length"
        @update:page="pageInfo.page = $event"
        @update:page-size="onPageSizeChange"
      />
      <n-text depth="2" style="font-size: 13px">共 {{ categoryList.length }} 人</n-text>
    </div>

    <n-modal v-model:show="showAddModal" preset="dialog" title="添加用户">
      <template #header>
        <span>添加用户</span>
      </template>
      <div>
        <n-form ref="addFormRef" :label-width="80" :model="addUserData" :rules="addUserRules">
          <n-form-item label="账号" path="username" required>
            <n-input
              v-model:value="addUserData.username"
              placeholder="至少 4 个字符"
            />
          </n-form-item>
          <n-form-item label="密码" path="password" required>
            <n-input
              v-model:value="addUserData.password"
              placeholder="至少 4 个字符"
              type="password"
            />
          </n-form-item>
          <n-form-item label="邮箱" path="email">
            <n-input
              v-model:value="addUserData.email"
              placeholder="选填，用于找回密码"
              type="text"
            />
          </n-form-item>
          <n-form-item label="角色" path="role">
            <n-select
              v-model:value="addUserData.role"
              :options="addUserRoleOptions"
              placeholder="选择角色"
              style="width: 100%"
            />
          </n-form-item>
        </n-form>
      </div>
      <template #action>
        <div>
          <n-button tertiary type="info" @click="add"> 提交 </n-button>
        </div>
      </template>
    </n-modal>
    <n-modal v-model:show="showUpdateModal" preset="dialog" title="修改用户">
      <template #header>
        <span>修改用户</span>
      </template>
      <div>
        <n-form ref="updateFormRef" :label-width="80" :model="updateUserData" :rules="updateUserRules">
          <n-form-item label="用户昵称" path="nickname" required>
            <n-input
              v-model:value="updateUserData.nickname"
              placeholder="请输入用户昵称"
            />
          </n-form-item>
          <n-form-item label="用户头像" path="avatar_url">
            <n-input
              v-model:value="updateUserData.avatar_url"
              placeholder="头像图片链接"
            />
          </n-form-item>
          <n-form-item label="称号" path="title">
            <n-input
              v-model:value="updateUserData.title"
              placeholder="选填，如：VIP、达人"
              clearable
            />
          </n-form-item>
        </n-form>
      </div>
      <template #action>
        <div>
          <n-button tertiary type="info" @click="update"> 提交 </n-button>
        </div>
      </template>
    </n-modal>
  </n-card>
  </div>
</template>

<script setup>
import { AdminStore } from "@/stores/AdminStore";
import { reactive, ref, computed, inject, onMounted, h } from "vue";
import { NAvatar, NTag, NSpace, NButton } from "naive-ui";
// import {router , routes} from "@/common/router.js";

import {
  getAllUsers,
  getUserInfo,
  updateUserInfo,
  deleteUserById,
  updateUserPassword,
  adminAddUser,
} from "@/api/api";
import { base64Encode } from "@/utils/encode";

const axios = inject("axios");
const message = inject("message");
const dialog = inject("dialog");
const adminStore = AdminStore();

const categoryList = ref([]);
const userKeyword = ref("");
const showAddModal = ref(false);
const showUpdateModal = ref(false);
const pageInfo = reactive({ page: 1, pageSize: 10 });
const pageCount = computed(() => Math.max(1, Math.ceil(categoryList.value.length / pageInfo.pageSize)));
const displayedList = computed(() => {
  const list = categoryList.value;
  const start = (pageInfo.page - 1) * pageInfo.pageSize;
  return list.slice(start, start + pageInfo.pageSize);
});
function onPageSizeChange(size) {
  pageInfo.pageSize = size;
  pageInfo.page = 1;
}

const addFormRef = ref(null);
const updateFormRef = ref(null);
const addUserRules = {
  username: [
    { required: true, message: "请输入账号", trigger: "blur" },
    { min: 4, message: "账号至少 4 个字符", trigger: "blur" },
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 4, message: "密码至少 4 个字符", trigger: "blur" },
  ],
};
const updateUserRules = {
  nickname: [
    { required: true, message: "请输入用户昵称", trigger: "blur" },
    { min: 1, max: 30, message: "长度在 1 到 30 个字符", trigger: "blur" },
  ],
  avatar_url: [{ required: false }],
};

const addUserRoleOptions = [
  { label: "普通用户", value: "user" },
  { label: "编辑者", value: "editor" },
];
const addUserData = reactive({
  username: "",
  password: "",
  email: "",
  role: "user",
});
const updateUserData = reactive({
  id: 0,
  nickname: "",
  avatar_url: "",
  title: "",
});
const userColumns = [
  { title: "ID", key: "id", width: 64 },
  {
    title: "头像",
    key: "avatar_url",
    width: 64,
    render: (r) => h(NAvatar, { round: true, size: "small", src: r.avatar_url || "https://api.suxin23.cn/upload/avatar.png" }),
  },
  { title: "账号", key: "username", width: 110, ellipsis: { tooltip: true } },
  { title: "昵称", key: "nickname", width: 100, ellipsis: { tooltip: true } },
  {
    title: "角色",
    key: "role",
    width: 90,
    render: (r) => {
      const roleMap = { admin: "管理员", editor: "编辑者", user: "普通用户" };
      const label = roleMap[r.role] ?? (r.is_root ? "管理员" : "普通用户");
      const type = r.role === "admin" ? "success" : r.role === "editor" ? "info" : "default";
      return h(NTag, { type, size: "small" }, () => label);
    },
  },
  { title: "积分", key: "points", width: 80, render: (r) => r.points ?? 0 },
  { title: "称号", key: "title", width: 90, ellipsis: { tooltip: true }, render: (r) => r.title || "—" },
  { title: "最后登录", key: "last_login_at", width: 165, ellipsis: { tooltip: true }, render: (r) => r.last_login_at || "—" },
  {
    title: "操作",
    key: "action",
    width: 140,
    fixed: "right",
    render: (r) =>
      h(NSpace, null, [
        h(NButton, { size: "small", tertiary: true, type: "primary", onClick: () => toUpdate(r) }, { default: () => "修改" }),
        h(NButton, { size: "small", tertiary: true, type: "error", onClick: () => deleteUser(r) }, { default: () => "删除" }),
      ]),
  },
];

onMounted(() => {
  getAllUsersList();
});

// 获取全部用户（默认按积分降序，支持关键词模糊搜索）
const getAllUsersList = async () => {
  const params = { sort: "points" };
  if (userKeyword.value?.trim()) params.keyword = userKeyword.value.trim();
  let res = await getAllUsers(params);
  categoryList.value = res.data || [];
};

// 添加用户（管理员接口，无需验证码；密码 Base64 编码；角色仅限编辑者/用户）
const add = async () => {
  try {
    await addFormRef.value?.validate();
  } catch (_) {
    return;
  }
  const role = addUserData.role === "editor" ? "editor" : "user";
  const payload = {
    username: addUserData.username.trim(),
    password: base64Encode(addUserData.password),
    email: addUserData.email?.trim() || undefined,
    role,
  };
  let res = await adminAddUser(payload);
  if (res.code == 200) {
    getAllUsersList();
    message.info(res.message);
    addUserData.username = "";
    addUserData.password = "";
    addUserData.email = "";
    addUserData.role = "user";
    showAddModal.value = false;
  } else {
    message.error(res.message);
  }
};

//获取要修改的用户
const toUpdate = (category) => {
  showUpdateModal.value = true;
  updateUserData.id = category.id;
  updateUserData.nickname = category.nickname;
  updateUserData.avatar_url = category.avatar_url;
  updateUserData.title = category.title ?? "";
};

// 修改用户（支持修改自己：仅昵称/头像；管理员可改称号等）
const update = async () => {
  try {
    await updateFormRef.value?.validate();
  } catch (_) {
    return;
  }
  const { id } = updateUserData;
  const payload = {
    nickname: updateUserData.nickname,
    avatar_url: updateUserData.avatar_url,
    title: updateUserData.title,
  };
  let res = await updateUserInfo(id, payload);
  if (res.code == 200) {
    getAllUsersList();
    message.info(res.message);
    if (Number(id) === Number(adminStore.id)) {
      adminStore.setNickname(updateUserData.nickname);
      adminStore.setAvatarUrl(updateUserData.avatar_url);
      if (payload.title !== undefined) adminStore.setTitle(payload.title);
    }
    updateUserData.nickname = "";
    updateUserData.avatar_url = "";
    updateUserData.title = "";
    showUpdateModal.value = false;
  } else {
    message.error(res.message);
  }
};
// 删除用户
const deleteUser = async (category) => {
  dialog.warning({
    title: "警告",
    content: "是否删除该用户？",
    positiveText: "确定",
    negativeText: "不确定",
    onPositiveClick: async () => {
      let res = await deleteUserById(category.id);
      // 关闭弹窗
      console.log(res);
      if (res.code == 200) {
        message.info(res.message);
        getAllUsersList();
      } else {
        message.error(res.message);
      }
    },
    onNegativeClick: () => {
      //   message.error("不确定");
    },
  });
};
</script>

<style lang="less" scoped>
.dashboard-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.user-card-wrap {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.user-card-wrap :deep(.n-card__content) {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.card-body-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  max-height: calc(100vh - 260px);
}
.admin-page-card {
  margin-top: 0;
}
.admin-table {
  margin-top: 8px;
}
.pagination-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding-top: 12px;
  margin-top: 12px;
  border-top: 1px solid var(--border, #e8e8ec);
  flex-shrink: 0;
}
</style>
