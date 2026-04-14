<template>
  <div class="dashboard-page">
    <n-card title="用户管理" class="admin-page-card user-card-wrap">
    <template #header-extra>
      <n-space align="center" :size="8">
        <n-radio-group v-model:value="userStatusFilter" size="small" @update:value="onStatusFilterChange">
          <n-radio-button :value="0">正常用户</n-radio-button>
          <n-radio-button :value="1">已停用</n-radio-button>
        </n-radio-group>
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
        <n-form ref="updateFormRef" :label-width="88" :model="updateUserData" :rules="updateUserRules">
          <n-form-item label="用户昵称" path="nickname" required>
            <n-input
              v-model:value="updateUserData.nickname"
              placeholder="请输入用户昵称"
            />
          </n-form-item>
          <n-form-item v-if="adminStore.is_root" label="用户角色" path="role">
            <n-select
              v-model:value="updateUserData.role"
              :options="updateUserRoleOptions"
              placeholder="选择角色"
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

          <template v-if="adminStore.is_root">
            <n-divider style="margin: 8px 0 14px">管理员附加操作</n-divider>
            <n-form-item label="积分调整" path="points_adjustment">
              <n-input-number
                v-model:value="updateUserData.points_adjustment"
                placeholder="正数增加，负数扣减"
                clearable
                style="width: 100%"
              />
            </n-form-item>
            <n-form-item label="调整备注" path="points_remark">
              <n-input
                v-model:value="updateUserData.points_remark"
                type="textarea"
                placeholder="填写本次积分调整原因，便于后续查看"
                :rows="3"
                maxlength="100"
                show-count
                clearable
              />
            </n-form-item>
            <div v-if="userPointsLogs.length" class="points-log-preview">
              <div class="points-log-preview__title">最近积分记录</div>
              <div
                v-for="item in userPointsLogs"
                :key="item.id"
                class="points-log-preview__item"
              >
                <div class="points-log-preview__main">
                  <n-text :type="item.change >= 0 ? 'success' : 'error'">
                    {{ item.change >= 0 ? '+' : '' }}{{ item.change }}
                  </n-text>
                  <span class="points-log-preview__reason">{{ pointReasonLabel(item) }}</span>
                </div>
                <span class="points-log-preview__time">{{ item.created_at }}</span>
              </div>
            </div>
          </template>
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
import { NAvatar, NTag, NSpace, NButton, NText, NInputNumber, NDivider, NRadioGroup, NRadioButton } from "naive-ui";
// import {router , routes} from "@/common/router.js";

import {
  getAllUsers,
  updateUserInfo,
  deleteUserById,
  adminAddUser,
  getPointsLog,
} from "@/api/api";
import { base64Encode } from "@/utils/encode";

const message = inject("message");
const dialog = inject("dialog");
const adminStore = AdminStore();

const categoryList = ref([]);
const userKeyword = ref("");
const userStatusFilter = ref(0);
const showAddModal = ref(false);
const showUpdateModal = ref(false);
const userPointsLogs = ref([]);
const pageInfo = reactive({ page: 1, pageSize: 10 });
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
  points_adjustment: [
    {
      validator: (_, value) => {
        if (!adminStore.is_root || value === null || value === undefined || value === "") return true;
        if (!Number.isInteger(value)) return new Error("积分调整值必须为整数");
        if (value === 0) return new Error("积分调整值不能为 0");
        if (!String(updateUserData.points_remark || "").trim()) return new Error("调整积分时请填写备注");
        return true;
      },
      trigger: ["blur", "input"],
    },
  ],
  points_remark: [
    {
      validator: (_, value) => {
        if (!adminStore.is_root || updateUserData.points_adjustment === null || updateUserData.points_adjustment === undefined || updateUserData.points_adjustment === "") return true;
        if (!String(value || "").trim()) return new Error("请输入积分调整备注");
        return true;
      },
      trigger: ["blur", "input"],
    },
  ],
};

const addUserRoleOptions = [
  { label: "普通用户", value: "user" },
  { label: "编辑者", value: "editor" },
];
const updateUserRoleOptions = [
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
  role: "user",
  points_adjustment: null,
  points_remark: "",
});
const roleMap = { admin: "管理员", editor: "编辑者", user: "普通用户" };
const pointReasonLabel = (item) => {
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
  const base = map[item.reason] || item.reason || "未知原因";
  const actionReasons = new Set(["article_liked", "article_unliked", "article_publish", "article_delete", "comment_approved", "comment_removed"]);
  if (item.remark && actionReasons.has(item.reason)) return `${base}《${item.remark}》`;
  return item.remark ? `${base}：${item.remark}` : base;
};
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
      const label = roleMap[r.role] ?? (r.is_root ? "管理员" : "普通用户");
      const type = r.role === "admin" ? "success" : r.role === "editor" ? "info" : "default";
      return h(NTag, { type, size: "small" }, () => label);
    },
  },
  { title: "积分", key: "points", width: 80, render: (r) => r.points ?? 0 },
  { title: "称号", key: "title", width: 90, ellipsis: { tooltip: true }, render: (r) => r.title || "—" },
  {
    title: "状态",
    key: "status",
    width: 80,
    render: (r) => h(NTag, { size: "small", type: Number(r.status) === 1 ? "warning" : "success" }, () => Number(r.status) === 1 ? "停用" : "正常"),
  },
  { title: "最后登录", key: "last_login_at", width: 165, ellipsis: { tooltip: true }, render: (r) => r.last_login_at || "—" },
  {
    title: "操作",
    key: "action",
    width: 220,
    fixed: "right",
    render: (r) =>
      h(NSpace, null, [
        h(NButton, { size: "small", tertiary: true, type: "primary", onClick: () => toUpdate(r) }, { default: () => "修改" }),
        Number(r.status) === 1
          ? h(NButton, { size: "small", tertiary: true, type: "warning", onClick: () => enableUser(r) }, { default: () => "启用" })
          : h(NButton, { size: "small", tertiary: true, type: "warning", onClick: () => disableUser(r) }, { default: () => "停用" }),
        h(NButton, { size: "small", tertiary: true, type: "error", onClick: () => deleteUser(r) }, { default: () => "彻底删除" }),
      ]),
  },
];

onMounted(() => {
  getAllUsersList();
});

// 获取全部用户（默认按积分降序，支持关键词模糊搜索）
const getAllUsersList = async () => {
  const params = { sort: "points", status: userStatusFilter.value };
  if (userKeyword.value?.trim()) params.keyword = userKeyword.value.trim();
  const res = await getAllUsers(params);
  categoryList.value = res.data || [];
};

const onStatusFilterChange = () => {
  pageInfo.page = 1;
  getAllUsersList();
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
  const res = await adminAddUser(payload);
  if (res.code === 200) {
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
const toUpdate = async (category) => {
  showUpdateModal.value = true;
  updateUserData.id = category.id;
  updateUserData.nickname = category.nickname;
  updateUserData.avatar_url = category.avatar_url;
  updateUserData.title = category.title ?? "";
  updateUserData.role = category.role === "editor" ? "editor" : "user";
  updateUserData.points_adjustment = null;
  updateUserData.points_remark = "";
  userPointsLogs.value = [];
  if (adminStore.is_root) {
    try {
      const res = await getPointsLog({ userId: category.id, pageSize: 5 });
      userPointsLogs.value = res.data?.list || [];
    } catch (_) {
      userPointsLogs.value = [];
    }
  }
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
    status: userStatusFilter.value === 1 ? 1 : 0,
  };
  if (adminStore.is_root) {
    payload.role = updateUserData.role;
    if (updateUserData.points_adjustment !== null && updateUserData.points_adjustment !== undefined && updateUserData.points_adjustment !== "") {
      payload.points_adjustment = updateUserData.points_adjustment;
      payload.points_remark = updateUserData.points_remark?.trim() || "";
    }
  }
  const res = await updateUserInfo(id, payload);
  if (res.code === 200) {
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
    updateUserData.role = "user";
    updateUserData.points_adjustment = null;
    updateUserData.points_remark = "";
    userPointsLogs.value = [];
    showUpdateModal.value = false;
  } else {
    message.error(res.message);
  }
};
const disableUser = async (category) => {
  if (Number(category.id) === Number(adminStore.id)) {
    message.warning("不能停用当前登录账号");
    return;
  }
  dialog.warning({
    title: "停用用户",
    content: `确认停用用户“${category.nickname || category.username}”吗？停用后该账号将无法登录，但历史内容会保留。`,
    positiveText: "确认停用",
    negativeText: "取消",
    onPositiveClick: async () => {
      const res = await deleteUserById(category.id);
      if (res.code === 200) {
        message.success(res.message);
        getAllUsersList();
      } else {
        message.error(res.message);
      }
    },
    onNegativeClick: () => {},
  });
};

const enableUser = async (category) => {
  const res = await updateUserInfo(category.id, { status: 0 });
  if (res.code === 200) {
    message.success("启用成功");
    getAllUsersList();
  } else {
    message.error(res.message);
  }
};

// 彻底删除用户
const deleteUser = async (category) => {
  if (Number(category.id) === Number(adminStore.id)) {
    message.warning("不能彻底删除当前登录账号");
    return;
  }
  dialog.error({
    title: "彻底删除用户",
    content: "确认彻底删除该用户吗？删除后账号不可恢复，历史文章和评论会保留并显示为用户已注销。",
    positiveText: "确认删除",
    negativeText: "取消",
    onPositiveClick: async () => {
      const res = await deleteUserById(category.id, { hard: 1 });
      if (res.code === 200) {
        message.success(res.message);
        getAllUsersList();
      } else {
        message.error(res.message);
      }
    },
    onNegativeClick: () => {},
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
.points-log-preview {
  margin-top: 4px;
  padding: 12px;
  border-radius: 10px;
  background: #f7f9fb;
  border: 1px solid #edf1f5;
}
.points-log-preview__title {
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #333;
}
.points-log-preview__item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 6px 0;
  font-size: 12px;
}
.points-log-preview__item + .points-log-preview__item {
  border-top: 1px dashed #e4e9ee;
}
.points-log-preview__main {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.points-log-preview__reason {
  color: #5b6472;
  word-break: break-all;
}
.points-log-preview__time {
  flex-shrink: 0;
  color: #8b95a1;
}
</style>
