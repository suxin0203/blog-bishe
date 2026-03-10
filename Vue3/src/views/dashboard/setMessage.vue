<template>
  <div class="dashboard-page">
    <n-card title="留言管理" class="admin-page-card message-card-wrap">
    <template #header-extra>
      <n-space align="center" :size="8">
        <n-input
          v-model:value="messageKeyword"
          placeholder="搜索署名、留言内容"
          clearable
          style="width: 180px"
        />
        <n-button type="primary" size="small" @click="showAddModal = true">添加留言</n-button>
      </n-space>
    </template>
    <div class="card-body-scroll">
    <n-data-table
      :columns="messageColumns"
      :data="displayedList"
      :bordered="false"
      size="small"
      :single-line="false"
      class="admin-table"
    />
    <n-empty v-if="!filteredMessageList.length" description="暂无留言" style="padding: 24px 0" />
    </div>
    <div v-if="filteredMessageList.length > 0" class="pagination-wrap">
      <n-pagination
        v-model:page="pageInfo.page"
        :page-size="pageInfo.pageSize"
        show-size-picker
        :page-sizes="[10, 20, 50]"
        :item-count="filteredMessageList.length"
        @update:page="pageInfo.page = $event"
        @update:page-size="onPageSizeChange"
      />
      <n-text depth="2" style="font-size: 13px">共 {{ filteredMessageList.length }} 条</n-text>
    </div>

    <n-modal v-model:show="showAddModal" preset="dialog" title="添加留言">
      <template #header>
        <span>添加留言</span>
      </template>
      <div>
        <n-form ref="addMessageFormRef" :label-width="80" :model="addMessageData" :rules="rules">
          <n-form-item label="署名" path="name">
            <n-input
              v-model:value="addMessageData.name"
              placeholder="选填，留言展示用"
            />
          </n-form-item>
          <n-form-item label="留言内容" path="content" required>
            <n-input
              v-model:value="addMessageData.content"
              type="textarea"
              placeholder="请输入留言内容"
              :rows="3"
            />
          </n-form-item>
          <n-form-item label="留言权重">
            <n-input-number
              v-model:value="addMessageData.value"
              placeholder="数字越大越靠前"
              :min="0"
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
    <n-modal v-model:show="showUpdateModal" preset="dialog" title="修改留言">
      <template #header>
        <span>修改留言</span>
      </template>
      <div>
        <n-form ref="updateMessageFormRef" :label-width="80" :model="updateMessage" :rules="rules">
          <n-form-item label="署名" path="name">
            <n-input
              v-model:value="updateMessage.name"
              placeholder="选填"
            />
          </n-form-item>
          <n-form-item label="留言内容" path="content" required>
            <n-input
              v-model:value="updateMessage.content"
              type="textarea"
              placeholder="请输入留言内容"
              :rows="3"
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
import { NSpace, NButton } from "naive-ui";
// import {router , routes} from "@/common/router.js";

import {
  updateMessageById,
  addMessage,
  deleteMessageById,
  getMessagesList,
} from "@/api/api";

const axios = inject("axios");
const message = inject("message");
const dialog = inject("dialog");
const adminStore = AdminStore();

const messageList = ref([]);
const messageKeyword = ref("");
const showAddModal = ref(false);
const showUpdateModal = ref(false);
const addMessageFormRef = ref(null);
const updateMessageFormRef = ref(null);
const pageInfo = reactive({ page: 1, pageSize: 10 });
const filteredMessageList = computed(() => {
  const list = messageList.value;
  const k = (messageKeyword.value || "").trim().toLowerCase();
  if (!k) return list;
  return list.filter((m) => (m.name || "").toLowerCase().includes(k) || (m.content || "").toLowerCase().includes(k));
});
const pageCount = computed(() => Math.max(1, Math.ceil(filteredMessageList.value.length / pageInfo.pageSize)));
const displayedList = computed(() => {
  const list = filteredMessageList.value;
  const start = (pageInfo.page - 1) * pageInfo.pageSize;
  return list.slice(start, start + pageInfo.pageSize);
});
function onPageSizeChange(size) {
  pageInfo.pageSize = size;
  pageInfo.page = 1;
}

let rules = {
  name: [{ max: 20, message: "署名长度不超过 20 个字符", trigger: "blur" }],
  content: [
    { required: true, message: "请输入留言内容", trigger: "blur" },
    { min: 1, max: 500, message: "长度在 1 到 500 个字符", trigger: "blur" },
  ],
};

const addMessageData = reactive({
  name: "",
  value: "",
  content: "",
});
const updateMessage = reactive({
  id: 0,
  name: "",
  value: "",
  content: "",
});

const messageColumns = [
  { title: "ID", key: "id", width: 80 },
  { title: "用户名称", key: "name", width: 120, ellipsis: { tooltip: true } },
  { title: "留言内容", key: "content", ellipsis: { tooltip: true } },
  { title: "权重", key: "value", width: 80 },
  { title: "留言时间", key: "created_at", width: 170 },
  {
    title: "操作",
    key: "action",
    width: 140,
    fixed: "right",
    render: (r) =>
      h(NSpace, null, [
        h(NButton, { size: "small", tertiary: true, type: "primary", onClick: () => toUpdate(r) }, { default: () => "修改" }),
        h(NButton, { size: "small", tertiary: true, type: "error", onClick: () => deleteMessage(r) }, { default: () => "删除" }),
      ]),
  },
];

onMounted(() => {
  getMessages();
});

const getMessages = async () => {
  const res = await getMessagesList();
  messageList.value = Array.isArray(res.data) ? res.data : [];
};

// 添加留言
const add = async () => {
  try {
    await addMessageFormRef.value?.validate();
  } catch (_) {
    return;
  }
  let res = await addMessage(addMessageData);
  if (res.code == 200) {
    getMessages();
    message.info(res.message);
    showAddModal.value = false;
  } else {
    message.error(res.message);
  }
};

// 获取要修改的留言
const toUpdate = (messages) => {
  showUpdateModal.value = true;
  updateMessage.id = messages.id;
  updateMessage.name = messages.name;
  updateMessage.content = messages.content;
  updateMessage.value = messages.value;
};

// 修改留言
const update = async () => {
  try {
    await updateMessageFormRef.value?.validate();
  } catch (_) {
    return;
  }
  const { id } = updateMessage;
  let res = await updateMessageById(id, updateMessage);
  if (res.code == 200) {
    getMessages();
    message.info(res.message);
    showUpdateModal.value = false;
  } else {
    message.error(res.message);
  }
};

const deleteMessage = async (messages) => {
  dialog.warning({
    title: "确认删除",
    content: "是否删除该留言？",
    positiveText: "确定",
    negativeText: "不确定",
    onPositiveClick: async () => {
      let res = await deleteMessageById(messages.id);
      if (res.code == 200) {
        message.info(res.message);
        getMessages();
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
.message-card-wrap {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.message-card-wrap :deep(.n-card__content) {
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
