<template>
  <div>
    <n-button
      strong
      secondary
      type="info"
      @click="showAddModal = true"
      style="margin: 10px 0px"
    >
      添加留言
    </n-button>
    <n-table :bordered="false" :single-line="false">
      <thead>
        <tr>
          <th>编号</th>
          <th>用户名称</th>
          <th>留言内容</th>
          <th>留言权重</th>
          <th>留言时间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="messages in messageList" :key="messages.id">
          <td>{{ messages.id }}</td>
          <td>{{ messages.name }}</td>
          <td>{{ messages.content }}</td>
          <td>{{ messages.value }}</td>
          <td>{{ messages.created_at }}</td>
          <td>
            <n-space>
              <n-button tertiary type="info" @click="toUpdate(messages)">
                修改
              </n-button>
              <n-button tertiary type="error" @click="deleteMessage(messages)">
                删除
              </n-button>
            </n-space>
          </td>
        </tr>
      </tbody>
    </n-table>

    <n-modal v-model:show="showAddModal" preset="dialog" title="Dialog">
      <template #header>
        <div>添加分类</div>
      </template>
      <div>
        <n-form :label-width="80" :model="addMessageData" :rules="rules">
          <n-form-item label="署名：" path="message.name">
            <n-input
              v-model:value="addMessageData.name"
              placeholder="请输入署名"
            />
          </n-form-item>
          <n-form-item label="留言内容：" path="message.description">
            <n-input
              v-model:value="addMessageData.content"
              placeholder="请输入留言内容"
            />
          </n-form-item>
          <n-form-item label="留言权重：" path="message.description">
            <n-input
              v-model:value="addMessageData.value"
              placeholder="请输入留言权重"
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
    <n-modal v-model:show="showUpdateModal" preset="dialog" title="Dialog">
      <template #header>
        <div>修改分类</div>
      </template>
      <div>
        <n-form :label-width="80" :model="updateMessage" :rules="rules">
          <n-form-item label="署名" path="message.name">
            <n-input
              v-model:value="updateMessage.name"
              placeholder="请输入署名"
            />
          </n-form-item>
          <n-form-item label="留言内容" path="message.description">
            <n-input
              v-model:value="updateMessage.content"
              placeholder="请输入留言内容"
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
  </div>
</template>

<script setup>
import { AdminStore } from "@/stores/AdminStore";
import { reactive, ref, inject, onMounted } from "vue";
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
const showAddModal = ref(false);
const showUpdateModal = ref(false);

let rules = {
  message: {
    name: [
      { required: true, message: "请输入分类名称", trigger: "blur" },
      { min: 2, max: 10, message: "长度在 2 到 10 个字符", trigger: "blur" },
    ],
    description: [
      { required: false, message: "请输入分类介绍", trigger: "blur" },
      { min: 2, max: 20, message: "长度在 2 到 20 个字符", trigger: "blur" },
    ],
  },
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
onMounted(() => {
  getMessages();
});

// 获取全部分类
const getMessages = async () => {
  let res = await getMessagesList();
  messageList.value = res.data;
};

// 添加分类
const add = async () => {
  let res = await addMessage(addMessageData);
  if (res.code == 200) {
    getMessages();
    message.info(res.message);
  } else {
    message.error(res.message);
  }
  showAddModal.value = false;
};

//获取要修改的分类
const toUpdate = (messages) => {
  showUpdateModal.value = true;
  updateMessage.id = messages.id;
  updateMessage.name = messages.name;
  updateMessage.content = messages.content;
  updateMessage.value = messages.value;
};

// 修改分类
const update = async () => {
  const { id } = updateMessage;
  let res = await updateMessageById(id, updateMessage);
  if (res.code == 200) {
    getMessages();
    message.info(res.message);
  } else {
    message.error(res.message);
  }
  showUpdateModal.value = false;
};

const deleteMessage = async (messages) => {
  dialog.warning({
    title: "警告",
    content: "是否删除该分类？",
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

<style lang="less" scoped></style>
