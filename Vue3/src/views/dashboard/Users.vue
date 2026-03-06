<template>
  <div>
    <n-button
      strong
      secondary
      type="info"
      @click="showAddModal = true"
      style="margin: 10px 0px"
    >
      添加用户
    </n-button>
    <n-table :bordered="false" :single-line="false" class="user-table">
      <thead>
        <tr>
          <th>编号</th>
          <th>用户头像</th>
          <th>用户账号</th>
          <th>用户昵称</th>
          <th>用户角色</th>
          <th>用户密码</th>
          <th>openid</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="category in categoryList" :key="category.id">
          <td>{{ category.id }}</td>
          <td>
            <n-avatar
              color="white"
              round
              size="medium"
              :src="category.avatar_url"
            />
          </td>
          <td>{{ category.username }}</td>

          <td>{{ category.nickname }}</td>
          <td>
            <n-tag :type="category.is_root ? 'success' : ''">
              {{ category.is_root ? "管理员" : "普通用户" }}
            </n-tag>
          </td>
          <td>{{ category.password }}</td>
          <td>{{ category.openid }}</td>
          <td>
            <n-space>
              <n-button tertiary type="info" @click="toUpdate(category)">
                修改
              </n-button>
              <n-button tertiary type="error" @click="deleteUser(category)">
                删除
              </n-button>
            </n-space>
          </td>
        </tr>
      </tbody>
    </n-table>

    <n-modal v-model:show="showAddModal" preset="dialog" title="Dialog">
      <template #header>
        <div>添加用户</div>
      </template>
      <div>
        <n-form :label-width="80" :model="addUserData" :rules="rules">
          <n-form-item label="用户名称" path="category.name">
            <n-input
              v-model:value="addUserData.username"
              placeholder="请输入用户名称"
            />
          </n-form-item>
          <n-form-item label="用户密码" path="category.description">
            <n-input
              v-model:value="addUserData.password"
              placeholder="请输入用户密码"
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
        <div>修改用户</div>
      </template>
      <div>
        <n-form :label-width="80" :model="updateUserData" :rules="rules">
          <n-form-item label="用户昵称" path="category.name">
            <n-input
              v-model:value="updateUserData.nickname"
              placeholder="请输入用户昵称"
            />
          </n-form-item>
          <n-form-item label="用户头像" path="category.description">
            <n-input
              v-model:value="updateUserData.avatar_url"
              placeholder="请输入用户头像"
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
  getAllUsers,
  getUserInfo,
  updateUserInfo,
  deleteUserById,
  updateUserPassword,
  userRegister,
} from "@/api/api";

const axios = inject("axios");
const message = inject("message");
const dialog = inject("dialog");
const adminStore = AdminStore();

const categoryList = ref([]);
const showAddModal = ref(false);
const showUpdateModal = ref(false);

let rules = {
  category: {
    nickname: [
      { required: true, message: "请输入用户名称", trigger: "blur" },
      { min: 2, max: 10, message: "长度在 2 到 10 个字符", trigger: "blur" },
    ],
    avatar_url: [
      { required: true, message: "请输入用户密码", trigger: "blur" },
      { min: 2, max: 20, message: "长度在 2 到 20 个字符", trigger: "blur" },
    ],
  },
};

const addUserData = reactive({
  username: "",
  password: "",
});
const updateUserData = reactive({
  id: 0,
  nickname: "",
  avatar_url: "",
});
onMounted(() => {
  getAllUsersList();
});

// 获取全部用户
const getAllUsersList = async () => {
  let res = await getAllUsers();
  categoryList.value = res.data;
};

// 添加用户
const add = async () => {
  let res = await userRegister(addUserData);
  if (res.code == 200) {
    getAllUsersList();
    message.info(res.message);
    addUserData.username = "";
    addUserData.password = "";
  } else {
    message.error(res.message);
  }
  showAddModal.value = false;
};

//获取要修改的用户
const toUpdate = (category) => {
  showUpdateModal.value = true;
  updateUserData.id = category.id;
  updateUserData.nickname = category.nickname;
  updateUserData.avatar_url = category.avatar_url;
};

// 修改用户
const update = async () => {
  const { id } = updateUserData;
  if( id === adminStore.id){
    message.error("不能修改自己的信息");
    return;
  }
  let res = await updateUserInfo(id, updateUserData);
  if (res.code == 200) {
    getAllUsersList();
    message.info(res.message);
    updateUserData.nickname = "";
    updateUserData.avatar_url = "";
  } else {
    message.error(res.message);
  }
  showUpdateModal.value = false;
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
// .user-table{
//   height: 500px;
// }
</style>
