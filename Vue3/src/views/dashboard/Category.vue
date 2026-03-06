<template>
  <div>
    <n-button
      strong
      secondary
      type="info"
      @click="showAddModal = true"
      style="margin: 10px 0px"
    >
      添加分类
    </n-button>
    <n-table :bordered="false" :single-line="false">
      <thead>
        <tr>
          <th>编号</th>
          <th>分类名称</th>
          <th>分类介绍</th>
          <th>创建时间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="category in categoryList" :key="category.id">
          <td>{{ category.id }}</td>
          <td>{{ category.name }}</td>
          <td>{{ category.description }}</td>
          <td>{{ category.created_at }}</td>
          <td>
            <n-space>
              <n-button tertiary type="info" @click="toUpdate(category)">
                修改
              </n-button>
              <n-button tertiary type="error" @click="deleteCategory(category)">
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
        <n-form :label-width="80" :model="addCategoryData" :rules="rules">
          <n-form-item label="分类名称" path="category.name">
            <n-input
              v-model:value="addCategoryData.name"
              placeholder="请输入分类名称"
            />
          </n-form-item>
          <n-form-item label="分类介绍" path="category.description">
            <n-input
              v-model:value="addCategoryData.description"
              placeholder="请输入分类介绍"
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
        <n-form :label-width="80" :model="updateCategory" :rules="rules">
          <n-form-item label="分类名称" path="category.name">
            <n-input
              v-model:value="updateCategory.name"
              placeholder="请输入分类名称"
            />
          </n-form-item>
          <n-form-item label="分类介绍" path="category.description">
            <n-input
              v-model:value="updateCategory.description"
              placeholder="请输入分类介绍"
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
  getCategoryList,
  addCategory,
  updateCategoryById,
  deleteCategoryById,
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

const addCategoryData = reactive({
  name: "",
  description: "",
});
const updateCategory = reactive({
  id: 0,
  name: "",
  description: "",
});
onMounted(() => {
  getCategories();
});

// 获取全部分类
const getCategories = async () => {
  let res = await getCategoryList();
  categoryList.value = res.data;
};

// 添加分类
const add = async () => {
  let res = await addCategory(addCategoryData);
  if (res.code == 200) {
    getCategories();
    message.info(res.message);
  } else {
    message.error(res.message);
  }
  showAddModal.value = false;
};

//获取要修改的分类
const toUpdate = (category) => {
  showUpdateModal.value = true;
  updateCategory.id = category.id;
  updateCategory.name = category.name;
  updateCategory.description = category.description;
};

// 修改分类
const update = async () => {
  const { id } = updateCategory;
  let res = await updateCategoryById(id, updateCategory);
  if (res.code == 200) {
    getCategories();
    message.info(res.message);
  } else {
    message.error(res.message);
  }
  showUpdateModal.value = false;
};

const deleteCategory = async (category) => {
  dialog.warning({
    title: "警告",
    content: "是否删除该分类？",
    positiveText: "确定",
    negativeText: "不确定",
    onPositiveClick: async () => {
      let res = await deleteCategoryById(category.id);
      // 关闭弹窗
      console.log(res);
      if (res.code == 200) {
        message.info(res.message);
        getCategories();
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
