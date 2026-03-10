<template>
  <div class="dashboard-page article-page">
    <n-card class="admin-page-card article-card-wrap article-card-no-title">
      <div class="article-tabs-wrap">
        <n-tabs v-model:value="tabValue" justify-content="start" type="line" size="large" class="article-tabs">
          <n-tab-pane name="list" tab="文章列表" class="tab-pane-with-scroll">
            <div class="tab-pane-inner">
              <n-space align="center" :size="12" style="margin-bottom: 12px;">
                <n-input
                  v-model:value="articleKeyword"
                  placeholder="搜索标题、摘要、正文"
                  clearable
                  style="width: 220px"
                  @keydown.enter="getArticles()"
                />
                <n-button quaternary type="primary" @click="pageInfo.page = 1; getArticles()">搜索</n-button>
              </n-space>
              <div class="tab-list-wrap">
                <n-space vertical :size="12" class="article-list">
                  <div
                    v-for="blog in blogListInfo"
                    :key="blog.id"
                    class="article-item"
                    :class="{ 'is-pinned': blog.status === 1 }"
                    @click="goArticle(blog)"
                  >
                    <n-card size="small" hoverable class="article-card">
                      <template #header>
                        <n-space align="center" justify="space-between" style="width: 100%">
                          <span class="article-card-title-text">{{ blog.title || '未命名文章' }}</span>
                          <n-space align="center" :size="8">
                            <n-tag v-if="blog.status === 1" type="primary" size="small" :bordered="false" class="pinned-tag">置顶</n-tag>
                            <n-tag v-if="isHot(blog)" type="error" size="small" round :bordered="false" class="hot-tag">热榜</n-tag>
                          </n-space>
                        </n-space>
                      </template>
                      <div class="article-card-body">
                        <div class="article-card-title-row">标题：{{ blog.title || '未命名文章' }}</div>
                        <n-text depth="2" class="article-card-summary">
                          {{ (blog.summary || blog.content || '暂无摘要').slice(0, 120) }}{{ (blog.summary || blog.content || '').length > 120 ? '…' : '' }}
                        </n-text>
                      </div>
                      <template #footer>
                        <n-space align="center" justify="space-between" wrap style="width: 100%">
                          <n-space align="center" wrap :size="10">
                            <n-tag size="small" :bordered="false">{{ blog.updated_at }}</n-tag>
                            <span class="stat-item">阅读 {{ blog.view_count ?? 0 }}</span>
                            <span class="stat-item">点赞 {{ blog.like_count ?? 0 }}</span>
                            <span class="stat-item">评论 {{ blog.comment_count ?? 0 }}</span>
                            <span class="stat-item">收藏 {{ blog.favorite_count ?? 0 }}</span>
                            <n-tag v-if="adminStore.is_root && (blog.author_name || blog.author_id)" size="small" type="default" :bordered="false">发布者：{{ blog.author_name || '未知' }}</n-tag>
                          </n-space>
                          <n-space>
                            <n-button type="primary" quaternary size="small" @click.stop="toUpdate(blog)">修改</n-button>
                            <n-button type="error" quaternary size="small" @click.stop="toDelete(blog)">删除</n-button>
                          </n-space>
                        </n-space>
                      </template>
                    </n-card>
                  </div>
                  <n-empty v-if="blogListInfo.length === 0" description="暂无文章" style="padding: 32px 0" />
                </n-space>
              </div>
              <div v-if="blogListInfo.length > 0" class="pagination-wrap">
                <n-pagination
                  v-model:page="pageInfo.page"
                  :page-size="pageInfo.pageSize"
                  show-size-picker
                  :page-sizes="[5, 10, 20]"
                  :item-count="pageInfo.count"
                  @update:page="toPage($event)"
                  @update:page-size="onPageSizeChange($event)"
                />
                <n-text depth="2" style="font-size: 13px">共 {{ pageInfo.count }} 篇</n-text>
              </div>
            </div>
          </n-tab-pane>
          <n-tab-pane name="add" tab="添加文章" class="tab-pane-add">
            <div class="add-article-pane">
              <div class="add-article-scroll">
                <n-form ref="addForm" class="add-article-form" label-placement="top" label-width="auto">
                  <n-form-item label="标题" required>
                    <n-input
                      v-model:value="addArticleData.title"
                      placeholder="请输入文章标题"
                      clearable
                      maxlength="200"
                      show-count
                    />
                  </n-form-item>
                  <n-form-item label="摘要">
                    <n-input
                      v-model:value="addArticleData.summary"
                      type="textarea"
                      placeholder="选填，用于列表/卡片展示，不填则自动从正文截取"
                      :rows="3"
                      maxlength="500"
                      show-count
                      clearable
                    />
                  </n-form-item>
                  <n-grid :cols="2" :x-gap="16">
                    <n-gi>
                      <n-form-item label="分类" required>
                        <n-select
                          v-model:value="addArticleData.category_id"
                          :options="categoryOptions"
                          placeholder="选择分类"
                        />
                      </n-form-item>
                    </n-gi>
                    <n-gi>
                      <n-form-item label="状态">
                        <n-select
                          v-model:value="addArticleData.status"
                          :options="statusOptions"
                          placeholder="选择状态"
                        />
                      </n-form-item>
                    </n-gi>
                  </n-grid>
                  <n-form-item label="标签">
                    <n-select
                      v-model:value="addArticleData.tag_ids"
                      :options="tagOptions"
                      multiple
                      placeholder="多选标签（可选）"
                      clearable
                    />
                  </n-form-item>
                  <n-form-item label="正文内容" required>
                    <rich-text-editor
                      v-model="addArticleData.content"
                    />
                  </n-form-item>
                  <div class="add-article-actions">
                    <n-space>
                      <n-button type="primary" @click="add">确认添加</n-button>
                      <!-- <n-button secondary @click="addArticleData.title = ''; addArticleData.summary = ''; addArticleData.content = ''; addArticleData.tag_ids = []">清空</n-button> -->
                    </n-space>
                  </div>
                </n-form>
              </div>
            </div>
          </n-tab-pane>
          <n-tab-pane name="delete" tab="回收站" class="tab-pane-with-scroll">
            <div class="tab-pane-inner">
              <div class="tab-list-wrap">
                <n-alert type="warning" class="recycle-alert" :bordered="false">
                已放入回收站的文章可在此恢复或彻底删除。
                <template #footer>
                  <n-button type="error" quaternary size="small" @click="clearRecycleBin">清空当前页</n-button>
                </template>
                </n-alert>
                <n-space vertical :size="12" class="article-list">
                  <div
                    v-for="blog in restoreBlogListInfo"
                    :key="blog.id"
                    class="article-item"
                    @click="goArticle(blog)"
                  >
                    <n-card size="small" hoverable class="article-card recycle-card">
                      <template #header>
                        <n-space align="center" justify="space-between" style="width: 100%">
                          <span class="article-card-title-text">{{ blog.title || '未命名文章' }}</span>
                          <n-tag size="small" type="warning" :bordered="false">已删除</n-tag>
                        </n-space>
                      </template>
                      <div class="article-card-body">
                        <div class="article-card-title-row">标题：{{ blog.title || '未命名文章' }}</div>
                        <n-text depth="2" class="article-card-summary">
                          {{ (blog.summary || blog.content || '暂无摘要').slice(0, 100) }}{{ (blog.summary || blog.content || '').length > 100 ? '…' : '' }}
                        </n-text>
                      </div>
              <template #footer>
                <n-space align="center" justify="space-between" wrap style="width: 100%">
                  <n-space align="center" wrap :size="10">
                    <n-tag size="small" :bordered="false">{{ blog.updated_at }}</n-tag>
                    <span class="stat-item">阅读 {{ blog.view_count ?? 0 }}</span>
                    <span class="stat-item">点赞 {{ blog.like_count ?? 0 }}</span>
                    <span class="stat-item">评论 {{ blog.comment_count ?? 0 }}</span>
                    <n-tag v-if="adminStore.is_root && (blog.author_name || blog.author_id)" size="small" :bordered="false">发布者：{{ blog.author_name || '未知' }}</n-tag>
                  </n-space>
                  <n-space>
                    <n-button quaternary size="small" @click.stop="toRestore(blog)">恢复</n-button>
                    <n-button type="error" quaternary size="small" @click.stop="toDeleteForever(blog)">彻底删除</n-button>
                  </n-space>
                </n-space>
              </template>
            </n-card>
          </div>
                  <n-empty v-if="restoreBlogListInfo.length === 0" description="暂无回收站文章" style="padding: 32px 0" />
                </n-space>
              </div>
              <div v-if="restoreBlogListInfo.length > 0" class="pagination-wrap">
                <n-pagination
                  v-model:page="pageInfo.page"
                  :page-size="pageInfo.pageSize"
                  show-size-picker
                  :page-sizes="[5, 10, 20]"
                  :item-count="pageInfo.count"
                  @update:page="toRecyclePage($event)"
                  @update:page-size="onRecyclePageSizeChange($event)"
                />
                <n-text depth="2" style="font-size: 13px">共 {{ pageInfo.count }} 篇</n-text>
              </div>
            </div>
          </n-tab-pane>
        </n-tabs>
      </div>

      <!-- 修改文章：抽屉内编辑，从列表点击「修改」打开 -->
      <n-drawer
        v-model:show="showUpdateDrawer"
        :width="540"
        placement="right"
        :trap-focus="false"
        display-directive="show"
      >
        <n-drawer-content title="修改文章" closable>
          <template #header>
            <span>修改文章 <n-tag v-if="updateArticle.id" size="small" type="info">ID {{ updateArticle.id }}</n-tag></span>
          </template>
          <n-form ref="updateForm" class="update-drawer-form" label-placement="top">
            <n-form-item label="标题" required>
              <n-input v-model:value="updateArticle.title" placeholder="请输入标题" clearable maxlength="200" show-count />
            </n-form-item>
            <n-form-item label="分类" required>
              <n-select v-model:value="updateArticle.category_id" :options="categoryOptions" placeholder="选择分类" />
            </n-form-item>
            <n-form-item label="状态">
              <n-select v-model:value="updateArticle.status" :options="statusOptions" placeholder="选择状态" />
            </n-form-item>
            <n-form-item label="标签">
              <n-select v-model:value="updateArticle.tag_ids" :options="tagOptions" multiple placeholder="多选标签" clearable />
            </n-form-item>
            <n-form-item label="正文内容" required>
              <rich-text-editor :height="'320px'" v-model="updateArticle.content" />
            </n-form-item>
            <n-form-item>
              <n-space>
                <n-button type="primary" @click="update">保存修改</n-button>
                <n-button @click="showUpdateDrawer = false">取消</n-button>
              </n-space>
            </n-form-item>
          </n-form>
        </n-drawer-content>
      </n-drawer>
    </n-card>
  </div>
</template>

<script setup>
import { AdminStore } from "@/stores/AdminStore";
import { reactive, ref, inject, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import RichTextEditor from "@/components/RichTextEditor.vue";
import { router, routes } from "@/common/router.js";
import {
  getArticleListForDashboard,
  getCategoryList,
  getTagList,
  addArticle,
  getArticleById,
  updateArticleById,
  deleteArticleById,
  restoreArticle,
} from "@/api/api";

const message = inject("message");
const dialog = inject("dialog");
const adminStore = AdminStore();

let addForm = ref("addForm");

const addArticleData = reactive({
  category_id: null,
  title: "",
  summary: "",
  content: "",
  status: 0,
  tag_ids: [],
});

const updateArticle = reactive({
  id: 0,
  category_id: null,
  title: "",
  summary: "",
  content: "",
  status: 0,
  tag_ids: [],
});

const categoryOptions = ref([]);
const tagOptions = ref([]);
const statusOptions = ref([
  { label: "展示", value: 0 },
  { label: "置顶", value: 1 },
  { label: "删除", value: 2 },
]);
const blogListInfo = ref([]);
const restoreBlogListInfo = ref([]);
const route = useRoute();
const tabValue = ref(route.query.tab === "add" ? "add" : "list");
const showUpdateDrawer = ref(false);

const articleKeyword = ref("");
const pageInfo = reactive({
  page: 1,
  pageSize: 10,
  pageCount: 1,
  count: 0,
});

onMounted(() => {
  if (route.query.tab === "add") tabValue.value = "add";
  getArticles();
  getCategories();
  getTags();
});

watch(
  () => route.query.tab,
  (tab) => {
    if (tab === "add") tabValue.value = "add";
  }
);

watch(
  () => tabValue.value,
  (val) => {
    if (val === "list") {
      pageInfo.page = 1;
      getArticles();
    } else if (val === "delete") {
      pageInfo.page = 1;
      getRestoreArticles();
    }
  }
);

// 获取文章列表（后台接口：编辑仅看自己，管理员看全部，支持关键词模糊搜索）
const getArticles = async () => {
  const params = { page: pageInfo.page, pageSize: pageInfo.pageSize };
  if (articleKeyword.value?.trim()) params.keyword = articleKeyword.value.trim();
  const res = await getArticleListForDashboard(params);
  const data = res.data || {};
  blogListInfo.value = Array.isArray(data.list) ? data.list : [];
  pageInfo.pageCount = data.pagination?.totalPages ?? 1;
  pageInfo.count = data.pagination?.total ?? 0;
};

const getRestoreArticles = async () => {
  const res = await getArticleListForDashboard({
    page: pageInfo.page,
    pageSize: pageInfo.pageSize,
    status: 2,
  });
  const data = res.data || {};
  restoreBlogListInfo.value = Array.isArray(data.list) ? data.list : [];
  pageInfo.pageCount = data.pagination?.totalPages ?? 1;
  pageInfo.count = data.pagination?.total ?? 0;
};

// 获取全部分类（后端返回 data 为数组）
const getCategories = async () => {
  const res = await getCategoryList();
  const list = Array.isArray(res.data) ? res.data : [];
  categoryOptions.value = list.map((item) => ({ label: item.name, value: item.id }));
  if (categoryOptions.value.length > 0 && addArticleData.category_id == null) {
    addArticleData.category_id = categoryOptions.value[0].value;
  }
};

// 获取全部标签（用于文章多选标签）
const getTags = async () => {
  const res = await getTagList();
  const list = Array.isArray(res.data) ? res.data : [];
  tagOptions.value = list.map((item) => ({ label: item.name, value: item.id }));
};

// 新增文章
const add = async () => {
  if (addArticleData.title == "") {
    message.error("标题不能为空");
    return;
  }
  if (addArticleData.content == "") {
    message.error("内容不能为空");
    return;
  }
  let res = await addArticle(addArticleData);
  if (res.code == 200) {
    message.info(res.message);
    addArticleData.title = "";
    addArticleData.summary = "";
    addArticleData.content = "";
    addArticleData.tag_ids = [];
    getArticles();
    tabValue.value = "list";
  } else {
    message.error(res.message);
  }
};

const toPage = (pageNum) => {
  pageInfo.page = pageNum;
  getArticles();
};

const onPageSizeChange = (size) => {
  pageInfo.pageSize = size;
  pageInfo.page = 1;
  getArticles();
};

const toRecyclePage = (pageNum) => {
  pageInfo.page = pageNum;
  getRestoreArticles();
};

const onRecyclePageSizeChange = (size) => {
  pageInfo.pageSize = size;
  pageInfo.page = 1;
  getRestoreArticles();
};

const goArticle = (blog) => {
  router.push({ path: "/detail", query: { id: blog.id } });
};

// 热榜：阅读或点赞达到一定量显示
const isHot = (blog) => {
  const v = blog.view_count ?? 0;
  const l = blog.like_count ?? 0;
  return v >= 30 || l >= 5;
};

// 打开修改抽屉并加载文章
const toUpdate = async (blog) => {
  const res = await getArticleById(blog.id);
  const row = Array.isArray(res.data) ? res.data[0] : res.data;
  if (!row) return;
  updateArticle.id = row.id;
  updateArticle.title = row.title ?? "";
  updateArticle.summary = row.summary ?? "";
  updateArticle.content = row.content ?? "";
  updateArticle.category_id = row.category_id;
  updateArticle.status = row.status ?? 0;
  updateArticle.tag_ids = Array.isArray(row.tag_ids) ? [...row.tag_ids] : [];
  showUpdateDrawer.value = true;
};

// 更新文章
const update = async () => {
  if (updateArticle.title == "") {
    message.error("标题不能为空");
    return;
  }
  if (updateArticle.content == "") {
    message.error("内容不能为空");
    return;
  }
  let res = await updateArticleById(updateArticle.id, updateArticle);
  if (res.code == 200) {
    message.info(res.message);
    showUpdateDrawer.value = false;
    getArticles();
  } else {
    message.error(res.message);
  }
};

// 删除文章（软删除：后端 DELETE 默认移入回收站）
const toDelete = async (blog) => {
  dialog.warning({
    title: "警告",
    content: "你确定要将该文章移入回收站吗？",
    positiveText: "确定",
    negativeText: "取消",
    onPositiveClick: async () => {
      const res = await deleteArticleById(blog.id, true);
      if (res.code == 200) {
        message.info(res.message || "已移入回收站");
        getArticles();
      } else {
        message.error(res.message);
      }
    },
    onNegativeClick: () => {},
  });
};

// 从回收站恢复文章（后端 PUT /articles/token/:id/restore）
const toRestore = async (blog) => {
  const res = await restoreArticle(blog.id);
  if (res.code == 200) {
    message.info(res.message || "已恢复到文章列表");
    getRestoreArticles();
  } else {
    message.error(res.message || "恢复失败");
  }
};

// 彻底删除单篇文章（后端 DELETE ?soft=0）
const toDeleteForever = async (blog) => {
  dialog.warning({
    title: "警告",
    content: "该操作不可恢复，是否彻底删除该文章？",
    positiveText: "确定",
    negativeText: "取消",
    onPositiveClick: async () => {
      const res = await deleteArticleById(blog.id, false);
      if (res.code == 200) {
        message.info(res.message);
        getRestoreArticles();
      } else {
        message.error(res.message);
      }
    },
  });
};

// 清空回收站（逐条彻底删除当前页文章）
const clearRecycleBin = async () => {
  if (!restoreBlogListInfo.value.length) {
    message.info("当前回收站为空");
    return;
  }
  dialog.warning({
    title: "清空回收站",
    content: "将彻底删除当前页回收站中的所有文章，确定继续？",
    positiveText: "确定",
    negativeText: "取消",
    onPositiveClick: async () => {
      for (const blog of restoreBlogListInfo.value) {
        try {
          await deleteArticleById(blog.id, false);
        } catch (e) {}
      }
      message.info("已尝试清空当前页回收站文章");
      getRestoreArticles();
    },
  });
};
</script>

<style lang="less" scoped>
/* 文章管理页：占满主内容区，避免整页滚动 */
.article-page {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.article-card-wrap {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
/* 去掉大标题，只保留三个 tab 作为主视觉 */
.article-card-no-title :deep(.n-card-header) {
  display: none;
}
.article-card-wrap :deep(.n-card__content) {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 0;
}

/* 统一内边距：tabs 与内容不再贴边 */
.article-tabs-wrap {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 20px 24px 24px;
  box-sizing: border-box;
}
.article-tabs-wrap .article-tabs {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.article-tabs-wrap :deep(.n-tabs-nav),
.article-tabs-wrap :deep(.n-tabs-tab-list) {
  flex-shrink: 0;
  padding-bottom: 4px;
}
.article-tabs-wrap :deep(.n-tabs-pane-wrapper),
.article-tabs-wrap :deep(.n-tabs__content),
.article-tabs-wrap :deep([class*="n-tabs-body"]),
.article-tabs-wrap :deep(.n-tabs .n-tabs-nav-container + div) {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.article-tabs-wrap :deep(.n-tab-pane),
.article-tabs-wrap :deep([class*="n-tab-pane"]) {
  height: 100%;
  min-height: 0;
}
.article-tabs-wrap :deep(.n-tab-pane__content),
.article-tabs-wrap :deep([class*="n-tab-pane"] > div) {
  height: 100% !important;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 列表/回收站 tab：上列表下分页 */
.tab-pane-inner {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding-top: 12px;
  box-sizing: border-box;
}
/* 列表可滚动区：左右留足边距，卡片不贴边 */
.tab-list-wrap {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 20px 16px;
  max-height: calc(100vh - 300px);
}
.article-list {
  margin-bottom: 8px;
  padding: 0 8px;
}
/* 列表内每张卡片的内部留白（避免详情贴边） */
.article-item :deep(.n-card__content) {
  padding: 12px 16px;
}
.article-item :deep(.n-card-header) {
  padding: 10px 16px;
}
.article-item :deep(.n-card-footer) {
  padding: 10px 16px;
}
.recycle-alert {
  margin-bottom: 16px;
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

/* 添加文章 tab：外层有明确高度，内层滚动，任意屏幕都能滚到底部看到「确认添加」「清空」 */
.add-article-pane {
  flex: 1;
  min-height: 280px;
  max-height: calc(100vh - 140px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding-top: 8px;
  box-sizing: border-box;
}
.add-article-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px 0 56px;
  box-sizing: border-box;
  -webkit-overflow-scrolling: touch;
}
.add-article-form {
  max-width: 720px;
}
.add-article-form :deep(.n-form-item-label) {
  font-weight: 500;
}
.add-article-form :deep(.n-form-item) {
  margin-bottom: 18px;
}
.add-article-actions {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--n-border-color, #e8e8ec);
}

/* 修改文章抽屉 */
.update-drawer-form :deep(.n-form-item) {
  margin-bottom: 18px;
}

.admin-page-card {
  margin-top: 0;
}
.article-item :deep(.n-card) {
  margin-left: 0;
  margin-right: 0;
}
.article-item {
  cursor: pointer;
}
.article-card {
  border-radius: var(--radius, 8px);
}
.article-card-title-text {
  font-size: 15px;
  font-weight: 600;
  color: var(--n-text-color, #333);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 75%;
  min-width: 0;
}
.article-card-body {
  margin-top: 2px;
}
.article-card-title-row {
  font-size: 14px;
  font-weight: 600;
  color: var(--n-text-color, #333);
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.article-card-summary {
  font-size: 13px;
  display: block;
}
/* 置顶文章：左侧色条 + 浅底区分 */
.article-item.is-pinned :deep(.n-card) {
  border-left: 3px solid var(--n-primary-color, #18a058);
  background: linear-gradient(to right, rgba(24, 160, 88, 0.05) 0%, transparent 12px);
}
.pinned-tag {
  flex-shrink: 0;
}
.recycle-card {
  border-left: 3px solid var(--n-warning-color, #f0a020);
}
.stat-item {
  font-size: 12px;
  color: var(--text-secondary, #636873);
}
.hot-tag {
  flex-shrink: 0;
}
</style>
