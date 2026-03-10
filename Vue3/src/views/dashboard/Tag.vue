<template>
  <div class="dashboard-page">
    <n-card title="标签管理" class="admin-page-card tag-card-wrap">
    <template #header-extra>
      <n-space align="center" :size="8">
        <n-input
          v-model:value="tagKeyword"
          placeholder="搜索标签名称"
          clearable
          style="width: 160px"
        />
        <n-button type="primary" size="small" @click="showAddModal = true">添加标签</n-button>
      </n-space>
    </template>
    <div class="card-body-scroll">
    <n-data-table
      :columns="tagColumns"
      :data="displayedList"
      :bordered="false"
      size="small"
      :single-line="false"
      class="admin-table"
    />
    <n-empty v-if="filteredTagList.length === 0" description="暂无标签" style="padding: 24px 0" />
    </div>
    <div v-if="filteredTagList.length > 0" class="pagination-wrap">
      <n-pagination
        v-model:page="pageInfo.page"
        :page-size="pageInfo.pageSize"
        show-size-picker
        :page-sizes="[10, 20, 50]"
        :item-count="filteredTagList.length"
        @update:page="pageInfo.page = $event"
        @update:page-size="onPageSizeChange"
      />
      <n-text depth="2" style="font-size: 13px">共 {{ filteredTagList.length }} 条</n-text>
    </div>

    <n-modal v-model:show="showAddModal" preset="dialog" title="添加标签">
      <div>
        <n-form :label-width="80" :model="addTagData">
          <n-form-item label="标签名称">
            <n-input v-model:value="addTagData.name" placeholder="请输入标签名称" />
          </n-form-item>
        </n-form>
      </div>
      <template #action>
        <n-button tertiary type="info" @click="add">提交</n-button>
      </template>
    </n-modal>
    <n-modal v-model:show="showUpdateModal" preset="dialog" title="修改标签">
      <div>
        <n-form :label-width="80" :model="updateTagData">
          <n-form-item label="标签名称">
            <n-input v-model:value="updateTagData.name" placeholder="请输入标签名称" />
          </n-form-item>
        </n-form>
      </div>
      <template #action>
        <n-button tertiary type="info" @click="update">提交</n-button>
      </template>
    </n-modal>
  </n-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, inject, onMounted, h } from "vue";
import { getTagList, addTag, updateTagById, deleteTagById } from "@/api/api";
import { NSpace, NButton } from "naive-ui";

const message = inject("message");
const dialog = inject("dialog");

const tagList = ref([]);
const tagKeyword = ref("");
const showAddModal = ref(false);
const showUpdateModal = ref(false);
const addTagData = ref({ name: "" });
const updateTagData = ref({ id: 0, name: "" });
const pageInfo = reactive({ page: 1, pageSize: 10 });
const filteredTagList = computed(() => {
  const list = tagList.value;
  const k = (tagKeyword.value || "").trim().toLowerCase();
  if (!k) return list;
  return list.filter((t) => (t.name || "").toLowerCase().includes(k));
});
const pageCount = computed(() => Math.max(1, Math.ceil(filteredTagList.value.length / pageInfo.pageSize)));
const displayedList = computed(() => {
  const list = filteredTagList.value;
  const start = (pageInfo.page - 1) * pageInfo.pageSize;
  return list.slice(start, start + pageInfo.pageSize);
});
function onPageSizeChange(size) {
  pageInfo.pageSize = size;
  pageInfo.page = 1;
}

const tagColumns = [
  { title: "ID", key: "id", width: 80 },
  { title: "标签名称", key: "name", ellipsis: { tooltip: true } },
  { title: "创建时间", key: "created_at", width: 170 },
  {
    title: "操作",
    key: "action",
    width: 140,
    fixed: "right",
    render: (r) =>
      h(NSpace, null, [
        h(NButton, { size: "small", tertiary: true, type: "primary", onClick: () => toUpdate(r) }, { default: () => "修改" }),
        h(NButton, { size: "small", tertiary: true, type: "error", onClick: () => deleteTag(r) }, { default: () => "删除" }),
      ]),
  },
];

const load = async () => {
  const res = await getTagList();
  tagList.value = Array.isArray(res.data) ? res.data : [];
};

const add = async () => {
  if (!addTagData.value.name?.trim()) {
    message.warning("请输入标签名称");
    return;
  }
  const res = await addTag({ name: addTagData.value.name.trim() });
  if (res.code === 200) {
    message.success(res.message);
    addTagData.value.name = "";
    showAddModal.value = false;
    load();
  } else {
    message.error(res.message || "添加失败");
  }
};

const toUpdate = (tag) => {
  updateTagData.value = { id: tag.id, name: tag.name };
  showUpdateModal.value = true;
};

const update = async () => {
  const res = await updateTagById(updateTagData.value.id, { name: updateTagData.value.name });
  if (res.code === 200) {
    message.success(res.message);
    showUpdateModal.value = false;
    load();
  } else {
    message.error(res.message || "修改失败");
  }
};

const deleteTag = (tag) => {
  dialog.warning({
    title: "确认删除",
    content: "确定删除标签「" + tag.name + "」？",
    positiveText: "确定",
    negativeText: "取消",
    onPositiveClick: async () => {
      const res = await deleteTagById(tag.id);
      if (res.code === 200) {
        message.success(res.message);
        load();
      } else {
        message.error(res.message || "删除失败");
      }
    },
  });
};

onMounted(() => load());
</script>

<style lang="less" scoped>
.dashboard-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.tag-card-wrap {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.tag-card-wrap :deep(.n-card__content) {
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
