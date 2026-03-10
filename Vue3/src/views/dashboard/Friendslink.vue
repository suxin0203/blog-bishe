<template>
  <div class="dashboard-page">
    <n-card title="友情链接管理" class="admin-page-card friendslink-card-wrap">
      <template #header-extra>
        <n-space align="center" :size="8">
          <n-input
            v-model:value="keyword"
            placeholder="搜索站点名、链接、博主"
            clearable
            style="width: 200px"
          />
          <n-button type="primary" size="small" @click="showAddModal = true">添加友链</n-button>
        </n-space>
      </template>
      <div class="card-body-scroll">
        <n-data-table
          :columns="columns"
          :data="displayedList"
          :bordered="false"
          size="small"
          :single-line="false"
          class="admin-table"
        />
        <n-empty v-if="filteredList.length === 0" description="暂无友情链接" style="padding: 24px 0" />
      </div>
      <div v-if="filteredList.length > 0" class="pagination-wrap">
        <n-pagination
          v-model:page="pageInfo.page"
          :page-size="pageInfo.pageSize"
          show-size-picker
          :page-sizes="[10, 20, 50]"
          :item-count="filteredList.length"
          @update:page="pageInfo.page = $event"
          @update:page-size="onPageSizeChange"
        />
        <n-text depth="2" style="font-size: 13px">共 {{ filteredList.length }} 条</n-text>
      </div>

      <n-modal v-model:show="showAddModal" preset="dialog" title="添加友情链接">
        <template #header><span>添加友情链接</span></template>
        <n-form :label-width="90" :model="addForm" label-placement="top">
          <n-form-item label="站点名称" required>
            <n-input v-model:value="addForm.blog_name" placeholder="如：某某博客" maxlength="80" show-count />
          </n-form-item>
          <n-form-item label="链接地址" required>
            <n-input v-model:value="addForm.blog_url" placeholder="https://..." type="text" />
          </n-form-item>
          <n-form-item label="站点描述/主题">
            <n-input v-model:value="addForm.blog_theme" placeholder="选填" clearable />
          </n-form-item>
          <n-form-item label="博主名称">
            <n-input v-model:value="addForm.blogger_name" placeholder="选填" clearable />
          </n-form-item>
          <n-form-item label="Logo 链接">
            <n-input v-model:value="addForm.logo_url" placeholder="图片 URL，选填" clearable />
          </n-form-item>
          <n-form-item label="排序值">
            <n-input-number v-model:value="addForm.sort_order" :min="0" placeholder="数字越小越靠前" style="width: 100%" />
          </n-form-item>
        </n-form>
        <template #action>
          <n-button tertiary type="primary" @click="add">提交</n-button>
        </template>
      </n-modal>

      <n-modal v-model:show="showUpdateModal" preset="dialog" title="修改友情链接">
        <template #header><span>修改友情链接</span></template>
        <n-form :label-width="90" :model="updateForm" label-placement="top">
          <n-form-item label="站点名称" required>
            <n-input v-model:value="updateForm.blog_name" placeholder="如：某某博客" maxlength="80" show-count />
          </n-form-item>
          <n-form-item label="链接地址" required>
            <n-input v-model:value="updateForm.blog_url" placeholder="https://..." type="text" />
          </n-form-item>
          <n-form-item label="站点描述/主题">
            <n-input v-model:value="updateForm.blog_theme" placeholder="选填" clearable />
          </n-form-item>
          <n-form-item label="博主名称">
            <n-input v-model:value="updateForm.blogger_name" placeholder="选填" clearable />
          </n-form-item>
          <n-form-item label="Logo 链接">
            <n-input v-model:value="updateForm.logo_url" placeholder="图片 URL，选填" clearable />
          </n-form-item>
          <n-form-item label="排序值">
            <n-input-number v-model:value="updateForm.sort_order" :min="0" style="width: 100%" />
          </n-form-item>
        </n-form>
        <template #action>
          <n-button tertiary type="primary" @click="update">提交</n-button>
        </template>
      </n-modal>
    </n-card>
  </div>
</template>

<script setup>
import { reactive, ref, computed, inject, onMounted, h } from "vue";
import { NButton, NSpace, NAvatar } from "naive-ui";
import { getLinksList, addLink, updateLinkById, deleteLinkById } from "@/api/api";

const message = inject("message");
const dialog = inject("dialog");

const list = ref([]);
const keyword = ref("");
const showAddModal = ref(false);
const showUpdateModal = ref(false);
const pageInfo = reactive({ page: 1, pageSize: 10 });

const addForm = reactive({
  blog_name: "",
  blog_url: "",
  blog_theme: "",
  blogger_name: "",
  logo_url: "",
  sort_order: 1,
});

const updateForm = reactive({
  link_id: null,
  blog_name: "",
  blog_url: "",
  blog_theme: "",
  blogger_name: "",
  logo_url: "",
  sort_order: 1,
});

const filteredList = computed(() => {
  const k = (keyword.value || "").trim().toLowerCase();
  if (!k) return list.value;
  return list.value.filter(
    (item) =>
      (item.blog_name || "").toLowerCase().includes(k) ||
      (item.blog_url || "").toLowerCase().includes(k) ||
      (item.blogger_name || "").toLowerCase().includes(k) ||
      (item.blog_theme || "").toLowerCase().includes(k)
  );
});

const displayedList = computed(() => {
  const start = (pageInfo.page - 1) * pageInfo.pageSize;
  return filteredList.value.slice(start, start + pageInfo.pageSize);
});

function onPageSizeChange(size) {
  pageInfo.pageSize = size;
  pageInfo.page = 1;
}

const columns = [
  { title: "ID", key: "link_id", width: 72 },
  {
    title: "Logo",
    key: "logo_url",
    width: 56,
    render: (r) => (r.logo_url ? h(NAvatar, { round: true, size: "small", src: r.logo_url }) : "—"),
  },
  { title: "站点名称", key: "blog_name", width: 140, ellipsis: { tooltip: true } },
  { title: "链接", key: "blog_url", ellipsis: { tooltip: true }, render: (r) => r.blog_url || "—" },
  { title: "博主", key: "blogger_name", width: 100, ellipsis: { tooltip: true }, render: (r) => r.blogger_name || "—" },
  { title: "排序", key: "sort_order", width: 72, render: (r) => r.sort_order ?? 0 },
  {
    title: "操作",
    key: "action",
    width: 140,
    fixed: "right",
    render: (r) =>
      h(NSpace, null, [
        h(NButton, { size: "small", tertiary: true, type: "primary", onClick: () => toUpdate(r) }, { default: () => "修改" }),
        h(NButton, { size: "small", tertiary: true, type: "error", onClick: () => remove(r) }, { default: () => "删除" }),
      ]),
  },
];

async function loadList() {
  try {
    const res = await getLinksList();
    list.value = Array.isArray(res.data) ? res.data : [];
  } catch (_) {
    list.value = [];
  }
}

function add() {
  const name = (addForm.blog_name || "").trim();
  const url = (addForm.blog_url || "").trim();
  if (!name || !url) {
    message.warning("请填写站点名称和链接地址");
    return;
  }
  addLink({
    blog_name: name,
    blog_url: url,
    blog_theme: addForm.blog_theme?.trim() || undefined,
    blogger_name: addForm.blogger_name?.trim() || undefined,
    logo_url: addForm.logo_url?.trim() || undefined,
    sort_order: addForm.sort_order ?? 1,
  })
    .then((res) => {
      if (res.code === 200) {
        message.success(res.message || "添加成功");
        Object.assign(addForm, { blog_name: "", blog_url: "", blog_theme: "", blogger_name: "", logo_url: "", sort_order: 1 });
        showAddModal.value = false;
        loadList();
      } else message.error(res.message || "添加失败");
    })
    .catch(() => message.error("添加失败"));
}

function toUpdate(row) {
  updateForm.link_id = row.link_id;
  updateForm.blog_name = row.blog_name ?? "";
  updateForm.blog_url = row.blog_url ?? "";
  updateForm.blog_theme = row.blog_theme ?? "";
  updateForm.blogger_name = row.blogger_name ?? "";
  updateForm.logo_url = row.logo_url ?? "";
  updateForm.sort_order = row.sort_order ?? 1;
  showUpdateModal.value = true;
}

function update() {
  const name = (updateForm.blog_name || "").trim();
  const url = (updateForm.blog_url || "").trim();
  if (!name || !url) {
    message.warning("请填写站点名称和链接地址");
    return;
  }
  updateLinkById(updateForm.link_id, {
    blog_name: name,
    blog_url: url,
    blog_theme: updateForm.blog_theme?.trim() || undefined,
    blogger_name: updateForm.blogger_name?.trim() || undefined,
    logo_url: updateForm.logo_url?.trim() || undefined,
    sort_order: updateForm.sort_order ?? 1,
  })
    .then((res) => {
      if (res.code === 200) {
        message.success(res.message || "修改成功");
        showUpdateModal.value = false;
        loadList();
      } else message.error(res.message || "修改失败");
    })
    .catch(() => message.error("修改失败"));
}

function remove(row) {
  dialog.warning({
    title: "确认删除",
    content: `确定删除友链「${row.blog_name || "未命名"}」？`,
    positiveText: "确定",
    negativeText: "取消",
    onPositiveClick: () => {
      deleteLinkById(row.link_id)
        .then((res) => {
          if (res.code === 200) {
            message.success(res.message || "已删除");
            loadList();
          } else message.error(res.message || "删除失败");
        })
        .catch(() => message.error("删除失败"));
    },
  });
}

onMounted(() => loadList());
</script>

<style lang="less" scoped>
.dashboard-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.friendslink-card-wrap {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.friendslink-card-wrap :deep(.n-card__content) {
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
