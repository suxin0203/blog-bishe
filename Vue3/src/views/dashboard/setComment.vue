<template>
  <div class="dashboard-page">
  <n-card title="评论管理" class="admin-page-card comment-card-wrap">
    <n-spin :show="loading">
      <n-space align="center" :size="12" style="margin-bottom: 12px;">
        <n-input
          v-model:value="commentKeyword"
          placeholder="搜索评论内容、文章标题、评论者"
          clearable
          style="width: 240px"
          @keydown.enter="load()"
        />
        <n-button quaternary type="primary" @click="load()">搜索</n-button>
      </n-space>
      <n-tabs v-model:value="tabStatus" type="line" size="large" @update:value="onTabChange" class="comment-tabs">
        <n-tab-pane name="0" tab="待审核">
          <div class="comment-pane-inner">
            <div class="comment-table-wrap">
              <n-data-table
                :columns="commentColumns(0)"
                :data="commentList"
                :bordered="false"
                size="small"
                :single-line="false"
                class="admin-table"
              />
              <n-empty v-if="commentList.length === 0 && !loading" description="暂无待审核评论" style="padding: 24px 0" />
            </div>
            <div v-if="commentList.length > 0" class="pagination-wrap">
              <n-pagination
                v-model:page="pageInfo.page"
                :page-size="pageInfo.pageSize"
                show-size-picker
                :page-sizes="[10, 20, 50]"
                :item-count="pageInfo.total"
                @update:page="load"
                @update:page-size="onPageSizeChange"
              />
              <n-text depth="2" style="font-size: 13px">共 {{ pageInfo.total }} 条</n-text>
            </div>
          </div>
        </n-tab-pane>
        <n-tab-pane name="1" tab="已通过">
          <div class="comment-pane-inner">
            <div class="comment-table-wrap">
              <n-data-table
                :columns="commentColumns(1)"
                :data="commentList"
                :bordered="false"
                size="small"
                :single-line="false"
                class="admin-table"
              />
              <n-empty v-if="commentList.length === 0 && !loading" description="暂无已通过评论" style="padding: 24px 0" />
            </div>
            <div v-if="commentList.length > 0" class="pagination-wrap">
              <n-pagination
                v-model:page="pageInfo.page"
                :page-size="pageInfo.pageSize"
                show-size-picker
                :page-sizes="[10, 20, 50]"
                :item-count="pageInfo.total"
                @update:page="load"
                @update:page-size="onPageSizeChange"
              />
              <n-text depth="2" style="font-size: 13px">共 {{ pageInfo.total }} 条</n-text>
            </div>
          </div>
        </n-tab-pane>
        <n-tab-pane name="2" tab="已屏蔽">
          <div class="comment-pane-inner">
            <div class="comment-table-wrap">
              <n-data-table
                :columns="commentColumns(2)"
                :data="commentList"
                :bordered="false"
                size="small"
                :single-line="false"
                class="admin-table"
              />
              <n-empty v-if="commentList.length === 0 && !loading" description="暂无已屏蔽评论" style="padding: 24px 0" />
            </div>
            <div v-if="commentList.length > 0" class="pagination-wrap">
              <n-pagination
                v-model:page="pageInfo.page"
                :page-size="pageInfo.pageSize"
                show-size-picker
                :page-sizes="[10, 20, 50]"
                :item-count="pageInfo.total"
                @update:page="load"
                @update:page-size="onPageSizeChange"
              />
              <n-text depth="2" style="font-size: 13px">共 {{ pageInfo.total }} 条</n-text>
            </div>
          </div>
        </n-tab-pane>
      </n-tabs>
    </n-spin>
  </n-card>
  </div>
</template>

<script setup>
import { ref, reactive, inject, onMounted, h } from "vue";
import { getCommentList, updateCommentById, deleteCommentById } from "@/api/api";
import { NSpace, NButton } from "naive-ui";

const message = inject("message");
const dialog = inject("dialog");
const tabStatus = ref("0");
const commentKeyword = ref("");
const commentList = ref([]);
const loading = ref(false);
const pageInfo = reactive({
  page: 1,
  pageSize: 20,
  pageCount: 1,
  total: 0,
});

function commentColumns(status) {
  const base = [
    { title: "ID", key: "id", width: 64 },
    { title: "文章", key: "article_title", width: 140, ellipsis: { tooltip: true }, render: (r) => r.article_title || "—" },
    { title: "评论者", key: "user_name", width: 100, ellipsis: { tooltip: true }, render: (r) => (r.user_name || r.username || "—").trim() || "—" },
    { title: "内容", key: "content", ellipsis: { tooltip: true }, render: (r) => (r.content || "").slice(0, 50) + ((r.content || "").length > 50 ? "…" : "") },
    { title: "时间", key: "created_at", width: 165 },
  ];
  const actions = {
    0: (r) => h(NSpace, null, [
      h(NButton, { size: "small", tertiary: true, type: "success", onClick: () => approve(r) }, { default: () => "通过" }),
      h(NButton, { size: "small", tertiary: true, type: "warning", onClick: () => reject(r) }, { default: () => "屏蔽" }),
      h(NButton, { size: "small", tertiary: true, type: "error", onClick: () => del(r) }, { default: () => "删除" }),
    ]),
    1: (r) => h(NSpace, null, [
      h(NButton, { size: "small", tertiary: true, type: "warning", onClick: () => reject(r) }, { default: () => "屏蔽" }),
      h(NButton, { size: "small", tertiary: true, type: "error", onClick: () => del(r) }, { default: () => "删除" }),
    ]),
    2: (r) => h(NSpace, null, [
      h(NButton, { size: "small", tertiary: true, type: "success", onClick: () => approve(r) }, { default: () => "通过" }),
      h(NButton, { size: "small", tertiary: true, type: "error", onClick: () => del(r) }, { default: () => "删除" }),
    ]),
  };
  base.push({ title: "操作", key: "action", width: 180, render: actions[status] || (() => "") });
  return base;
}

const load = async () => {
  loading.value = true;
  try {
    const params = { status: tabStatus.value, page: pageInfo.page, pageSize: pageInfo.pageSize };
    if (commentKeyword.value?.trim()) params.keyword = commentKeyword.value.trim();
    const res = await getCommentList(params);
    commentList.value = res.data?.list ?? [];
    pageInfo.total = res.data?.total ?? 0;
    pageInfo.pageCount = Math.max(1, Math.ceil(pageInfo.total / pageInfo.pageSize));
  } catch (_) {
    commentList.value = [];
    pageInfo.total = 0;
    pageInfo.pageCount = 1;
  }
  loading.value = false;
};

const onTabChange = () => {
  pageInfo.page = 1;
  load();
};

const onPageSizeChange = (size) => {
  pageInfo.pageSize = size;
  pageInfo.page = 1;
  load();
};

const approve = async (c) => {
  const res = await updateCommentById(c.id, { status: 1 });
  if (res.code === 200) {
    message.success("已通过");
    load();
  } else {
    message.error(res.message || "操作失败");
  }
};

const reject = async (c) => {
  const res = await updateCommentById(c.id, { status: 2 });
  if (res.code === 200) {
    message.success("已屏蔽");
    load();
  } else {
    message.error(res.message || "操作失败");
  }
};

const del = (c) => {
  dialog.warning({
    title: "确认删除",
    content: "删除后不可恢复，确定删除该评论？",
    positiveText: "确定",
    negativeText: "取消",
    onPositiveClick: async () => {
      const res = await deleteCommentById(c.id);
      if (res.code === 200) {
        message.success("已删除");
        load();
      } else {
        message.error(res.message || "删除失败");
      }
    },
  });
};

onMounted(() => {
  load();
});
</script>

<style lang="less" scoped>
.dashboard-page {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.comment-card-wrap {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.comment-card-wrap :deep(.n-card__content) {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
/* n-spin 内层保持 flex 链，避免挡住滚动 */
.comment-card-wrap :deep(.n-spin-container),
.comment-card-wrap :deep(.n-spin-content) {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.comment-tabs {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.comment-tabs :deep(.n-tabs) {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.comment-tabs :deep(.n-tabs-nav),
.comment-tabs :deep(.n-tabs-tab-list) {
  flex-shrink: 0;
}
.comment-tabs :deep(.n-tabs-pane-wrapper),
.comment-tabs :deep(.n-tabs__content),
.comment-tabs :deep([class*="n-tabs-body"]),
.comment-tabs :deep(.n-tabs .n-tabs-nav-container + div) {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.comment-tabs :deep(.n-tab-pane),
.comment-tabs :deep([class*="n-tab-pane"]) {
  height: 100%;
  min-height: 0;
}
.comment-tabs :deep(.n-tab-pane__content),
.comment-tabs :deep([class*="n-tab-pane"] > div) {
  height: 100% !important;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.comment-pane-inner {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0 4px;
  box-sizing: border-box;
}
.comment-table-wrap {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  max-height: calc(100vh - 280px);
}
.admin-page-card {
  margin-top: 0;
}
.admin-table {
  margin-top: 8px;
}
.pagination-wrap {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border, #e8e8ec);
}
</style>
