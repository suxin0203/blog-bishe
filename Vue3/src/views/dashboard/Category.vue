<template>
  <div class="dashboard-page">
    <n-card title="分类管理" class="admin-page-card category-card-wrap">
    <template #header-extra>
      <n-space align="center" :size="8">
        <n-input
          v-model:value="categoryKeyword"
          placeholder="搜索分类名称、介绍"
          clearable
          style="width: 180px"
        />
        <n-button type="primary" size="small" @click="showAddModal = true">添加分类</n-button>
      </n-space>
    </template>
    <div class="card-body-scroll">
    <n-data-table
      :columns="categoryColumns"
      :data="displayedList"
      :bordered="false"
      size="small"
      :single-line="false"
      class="admin-table"
    />
    <n-empty v-if="filteredCategoryList.length === 0" description="暂无分类" style="padding: 24px 0" />
    </div>
    <div v-if="filteredCategoryList.length > 0" class="pagination-wrap">
      <n-pagination
        v-model:page="pageInfo.page"
        :page-size="pageInfo.pageSize"
        show-size-picker
        :page-sizes="[10, 20, 50]"
        :item-count="filteredCategoryList.length"
        @update:page="pageInfo.page = $event"
        @update:page-size="onPageSizeChange"
      />
      <n-text depth="2" style="font-size: 13px">共 {{ filteredCategoryList.length }} 条</n-text>
    </div>

    <n-modal v-model:show="showAddModal" preset="dialog" title="添加分类">
      <template #header>
        <span>添加分类</span>
      </template>
      <div>
        <n-form ref="addFormRef" :label-width="80" :model="addCategoryData" :rules="addRules">
          <n-form-item label="分类名称" path="name">
            <n-input
              v-model:value="addCategoryData.name"
              placeholder="请输入分类名称"
            />
          </n-form-item>
          <n-form-item label="分类介绍" path="description">
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
    <n-modal v-model:show="showUpdateModal" preset="dialog" title="修改分类">
      <template #header>
        <span>修改分类</span>
      </template>
      <div>
        <n-form ref="updateFormRef" :label-width="80" :model="updateCategory" :rules="addRules">
          <n-form-item label="分类名称" path="name">
            <n-input
              v-model:value="updateCategory.name"
              placeholder="请输入分类名称"
            />
          </n-form-item>
          <n-form-item label="分类介绍" path="description">
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
  </n-card>
  </div>
</template>

<script setup>
import { AdminStore } from "@/stores/AdminStore";
import { reactive, ref, inject, onMounted, computed, h } from "vue";
import { NSpace, NButton } from "naive-ui";
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
const categoryKeyword = ref("");
const showAddModal = ref(false);
const showUpdateModal = ref(false);
const pageInfo = reactive({ page: 1, pageSize: 10 });
const filteredCategoryList = computed(() => {
  const list = categoryList.value;
  const k = (categoryKeyword.value || "").trim().toLowerCase();
  if (!k) return list;
  return list.filter((c) => (c.name || "").toLowerCase().includes(k) || (c.description || "").toLowerCase().includes(k));
});
const pageCount = computed(() => Math.max(1, Math.ceil(filteredCategoryList.value.length / pageInfo.pageSize)));
const displayedList = computed(() => {
  const list = filteredCategoryList.value;
  const start = (pageInfo.page - 1) * pageInfo.pageSize;
  return list.slice(start, start + pageInfo.pageSize);
});
function onPageSizeChange(size) {
  pageInfo.pageSize = size;
  pageInfo.page = 1;
}

const addRules = {
  name: [
    { required: true, message: "请输入分类名称", trigger: "blur" },
    { min: 2, max: 10, message: "长度在 2 到 10 个字符", trigger: "blur" },
  ],
  description: [
    { max: 50, message: "介绍最多 50 个字符", trigger: "blur" },
  ],
};

const addFormRef = ref(null);
const updateFormRef = ref(null);
const addCategoryData = reactive({
  name: "",
  description: "",
});
const updateCategory = reactive({
  id: 0,
  name: "",
  description: "",
});
const categoryColumns = [
  { title: "ID", key: "id", width: 80 },
  { title: "分类名称", key: "name", width: 140, ellipsis: { tooltip: true } },
  { title: "分类介绍", key: "description", ellipsis: { tooltip: true }, render: (r) => r.description || "—" },
  { title: "创建时间", key: "created_at", width: 170 },
  {
    title: "操作",
    key: "action",
    width: 140,
    fixed: "right",
    render: (r) =>
      h(NSpace, null, [
        h(NButton, { size: "small", tertiary: true, type: "primary", onClick: () => toUpdate(r) }, { default: () => "修改" }),
        h(NButton, { size: "small", tertiary: true, type: "error", onClick: () => deleteCategory(r) }, { default: () => "删除" }),
      ]),
  },
];

onMounted(() => {
  getCategories();
});

// 获取全部分类（后端返回 data 为数组）
const getCategories = async () => {
  const res = await getCategoryList();
  categoryList.value = Array.isArray(res.data) ? res.data : [];
};

// 添加分类
const add = async () => {
  try {
    await addFormRef.value?.validate();
  } catch (_) {
    return;
  }
  const res = await addCategory({ name: addCategoryData.name.trim(), description: (addCategoryData.description || "").trim() });
  if (res.code == 200) {
    getCategories();
    message.info(res.message);
    showAddModal.value = false;
    addCategoryData.name = "";
    addCategoryData.description = "";
  } else {
    message.error(res.message);
  }
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

<style lang="less" scoped>
.dashboard-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.category-card-wrap {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.category-card-wrap :deep(.n-card__content) {
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
