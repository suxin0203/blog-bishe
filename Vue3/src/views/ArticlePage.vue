<template>
  <div class="articles-page">
    <MyHeaderVue
      :setstyle="false"
      :options="categoryOptions"
      @updateKeyword="searchKeyword"
      @updateCategory="searchCategory"
      v-model:keyword="pageInfo.keyword"
      v-model:category_id="pageInfo.category_id"
    />

    <div class="articles-main">
      <!-- 独立 Hero：与首页区分 -->
      <section class="articles-hero">
        <h1 class="articles-hero-title">文章</h1>
        <p class="articles-hero-desc">全站文章列表 · 按分类与标签筛选，快速发现内容</p>
      </section>

      <div class="articles-body">
        <div class="articles-content">
          <!-- 筛选工具栏 -->
          <div class="articles-toolbar">
            <div class="toolbar-left">
              <n-select
                v-model:value="pageInfo.category_id"
                :options="categoryOptionsForSelect"
                placeholder="分类"
                clearable
                size="small"
                style="width: 140px"
                @update:value="searchCategory"
              />
              <n-select
                v-model:value="pageInfo.tag_id"
                :options="tagOptionsForSelect"
                placeholder="标签"
                clearable
                size="small"
                style="width: 140px"
                @update:value="onTagSelect"
              />
            </div>
            <div class="toolbar-right">
              <span class="toolbar-total">共 {{ pageInfo.count }} 篇</span>
              <n-select
                v-model:value="pageInfo.pageSize"
                :options="pageSizeOptions"
                size="small"
                style="width: 100px"
                @update:value="changePageSize"
              />
            </div>
          </div>

          <!-- 文章列表：序号 + 标题 + 元信息 + 摘要（与首页卡片样式完全不同） -->
          <div v-if="!show && blogListInfo.length === 0" class="articles-empty">
            <n-empty description="暂无文章" size="large" />
          </div>
          <ul v-else-if="!show" class="article-list">
              <li
                v-for="(blog, index) in blogListInfo"
                :key="blog.id"
                class="article-list-item"
                :class="{ 'is-pinned': blog.status === 1 }"
                @click="toDetail(blog)"
              >
                <span class="item-index">{{ (pageInfo.page - 1) * pageInfo.pageSize + index + 1 }}</span>
                <div class="item-main">
                  <h3 class="item-title">{{ blog.title || '未命名' }}</h3>
                  <div class="item-meta">
                    <n-tag v-if="categoryMap[blog.category_id]" :bordered="false" size="small" type="success">
                      {{ categoryMap[blog.category_id] }}
                    </n-tag>
                    <span class="item-author">作者：{{ blog.author_name || '用户已注销' }}</span>
                    <span class="item-date">{{ blog.created_at }}</span>
                    <span class="item-stats">
                      {{ blog.view_count ?? 0 }} 阅读 · {{ blog.like_count ?? 0 }} 赞
                    </span>
                  </div>
                  <p v-if="(blog.summary || blog.content)" class="item-summary">
                    {{ stripSummary(blog.summary || blog.content) }}
                  </p>
                </div>
                <n-icon class="item-arrow" :component="ChevronForwardOutline" size="18" />
              </li>
            </ul>
          <!-- 骨架屏：与首页不同的占位样式 -->
          <ul v-if="show" class="article-list article-list-skeleton">
              <li v-for="i of 5" :key="'s' + i" class="article-list-item skeleton-item">
                <span class="item-index">{{ i }}</span>
                <div class="item-main">
                  <n-skeleton text :repeat="1" style="width: 60%; height: 22px" />
                  <n-skeleton text :repeat="1" style="width: 40%; height: 18px; margin-top: 8px" />
                  <n-skeleton text :repeat="1" style="width: 90%; height: 16px; margin-top: 6px" />
                </div>
              </li>
            </ul>

          <div class="articles-pagination">
            <n-pagination
              v-model:page="pageInfo.page"
              v-model:page-count="pageInfo.totalPages"
              :page-sizes="[5, 10, 20, 50]"
              show-size-picker
              show-quick-jumper
              @update:page="getArtiles()"
              @update:page-size="changePageSize"
            />
          </div>
        </div>

        <!-- 侧栏：当前筛选摘要 + 分类/标签/友链/推荐（紧凑布局） -->
        <aside class="articles-sidebar">
          <div class="sidebar-inner">
            <n-card title="当前筛选" size="small" class="sidebar-card sidebar-summary">
              <div class="filter-summary">
                <span>{{ currentFilterText }}</span>
              </div>
            </n-card>
            <n-card title="分类" size="small" class="sidebar-card">
              <n-space wrap :size="[6, 6]">
                <n-tag
                  v-for="c in categoryOptions"
                  :key="c.value"
                  :bordered="false"
                  :type="pageInfo.category_id === c.value ? 'success' : 'default'"
                  size="small"
                  class="filter-tag"
                  @click="searchCategory(c.value)"
                >
                  {{ c.label }}
                </n-tag>
              </n-space>
            </n-card>
            <n-card title="标签" size="small" class="sidebar-card" v-if="tagOptions.length">
              <n-space wrap :size="[6, 6]">
                <n-tag
                  v-for="t in tagOptions"
                  :key="t.value"
                  :bordered="false"
                  type="info"
                  size="small"
                  class="filter-tag"
                  @click="searchTag(t.value)"
                >
                  {{ t.label }}
                </n-tag>
              </n-space>
            </n-card>
            <n-card title="友链" size="small" class="sidebar-card" v-if="friendUrl.length">
              <n-space vertical :size="4">
                <a
                  v-for="i in friendUrl"
                  :key="i.link_id"
                  :href="i.blog_url"
                  target="_blank"
                  rel="noopener"
                  class="friend-link"
                >
                  {{ i.blog_name }}
                </a>
              </n-space>
            </n-card>
            <n-card
              v-if="promoCard?.enabled && promoCard?.title"
              :title="'📖 ' + promoCard.title"
              size="small"
              embedded
              :bordered="false"
              class="sidebar-card promo-card"
            >
              <n-space v-if="promoCard.tags?.length" wrap :size="4" style="margin-bottom: 6px">
                <n-tag v-for="t in promoCard.tags" :key="t" :bordered="false" type="info" size="tiny">{{ t }}</n-tag>
              </n-space>
              <div class="promo-card-content">{{ promoCard.content || '' }}</div>
            </n-card>
          </div>
        </aside>
      </div>
      <n-back-top :right="50" :bottom="100" />
    </div>

    <MyFooterVue />
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import { router } from "@/common/router.js";
import MyFooterVue from "@/components/MyFooter.vue";
import MyHeaderVue from "@/components/MyHeader.vue";
import { AdminStore } from "@/stores/AdminStore";
import { getCategoryList, getTagList, getArticleList, getOtherswitch, getLinksList } from "@/api/api";
import { ChevronForwardOutline } from "@vicons/ionicons5";
import { NIcon } from "naive-ui";

const route = useRoute();
const adminStore = AdminStore();
const categoryOptions = ref([]);
const categoryMap = ref({});
const tagOptions = ref([]);
const blogListInfo = ref([]);
const show = ref(true);
const promoCard = ref(null);
const friendUrl = ref([]);

const pageInfo = reactive({
  page: 1,
  pageSize: 10,
  totalPages: 1,
  count: 0,
  keyword: "",
  category_id: 0,
  tag_id: null,
  year: null,
  month: null,
});

const categoryOptionsForSelect = computed(() =>
  categoryOptions.value.map((c) => ({ label: c.label, value: c.value }))
);

const tagOptionsForSelect = computed(() =>
  tagOptions.value.map((t) => ({ label: t.label, value: t.value }))
);

const pageSizeOptions = [
  { label: '5 篇/页', value: 5 },
  { label: '10 篇/页', value: 10 },
  { label: '20 篇/页', value: 20 },
  { label: '50 篇/页', value: 50 },
];

const currentFilterText = computed(() => {
  const parts = [];
  if (pageInfo.year != null && pageInfo.month != null) {
    parts.push(`${pageInfo.year}年${pageInfo.month}月`);
  }
  if (pageInfo.category_id && pageInfo.category_id !== 0) {
    parts.push(categoryMap.value[pageInfo.category_id] || '分类');
  }
  if (pageInfo.tag_id) {
    const t = tagOptions.value.find((x) => x.value === pageInfo.tag_id);
    parts.push(t ? t.label : '标签');
  }
  if (pageInfo.keyword) parts.push('「' + pageInfo.keyword + '」');
  return parts.length ? parts.join(' · ') : '全部文章';
});

function stripSummary(text) {
  if (!text) return '';
  const s = String(text).replace(/<[^>]+>/g, '').trim();
  return s.length > 120 ? s.slice(0, 120) + '…' : s;
}

onMounted(async () => {
  await getCategories();
  await getTags();
  const tagId = route.query.tag_id;
  if (tagId != null && tagId !== '') {
    const n = Number(tagId);
    if (!Number.isNaN(n)) pageInfo.tag_id = n;
  }
  if (route.query.year != null && route.query.year !== '') pageInfo.year = Number(route.query.year) || null;
  if (route.query.month != null && route.query.month !== '') pageInfo.month = Number(route.query.month) || null;
  getArtiles();
  getFriendslink();
  loadPromoCard();
});

const getFriendslink = async () => {
  try {
    const res = await getLinksList();
    friendUrl.value = Array.isArray(res.data) ? res.data : [];
  } catch (_) {
    friendUrl.value = [];
  }
};

function loadPromoCard() {
  getOtherswitch().then((res) => {
    const list = res.data || [];
    const item = list.find((i) => i.name === 'promo_card');
    if (item) {
      let parsed = { enabled: !!item.value, title: '', tags: [], content: '' };
      try {
        if (item.content) parsed = { ...parsed, ...JSON.parse(item.content) };
      } catch (_) {}
      if (!Array.isArray(parsed.tags)) parsed.tags = [];
      promoCard.value = parsed;
    }
  });
}

const getCategories = async () => {
  const res = await getCategoryList();
  const list = Array.isArray(res.data) ? res.data : [];
  categoryOptions.value = list.map((item) => ({ label: item.name, value: item.id }));
  categoryOptions.value.unshift({ label: '全部分类', value: 0 });
  categoryOptions.value.forEach((item) => {
    categoryMap.value[item.value] = item.label;
  });
};

const getTags = async () => {
  const res = await getTagList();
  const list = Array.isArray(res.data) ? res.data : [];
  tagOptions.value = list.map((item) => ({ label: item.name, value: item.id }));
};

const searchCategory = (category_id) => {
  pageInfo.category_id = (category_id === 0 || category_id == null) ? 0 : category_id;
  getArtiles(1);
};

const onTagSelect = (tag_id) => {
  pageInfo.tag_id = tag_id ?? null;
  getArtiles(1);
};

const searchTag = (tag_id) => {
  pageInfo.tag_id = tag_id || null;
  getArtiles(1);
};

const toDetail = (blog) => {
  router.push({ path: '/detail', query: { id: blog.id } });
};

const searchKeyword = (keyword) => {
  pageInfo.keyword = keyword;
  getArtiles(1);
};

const changePageSize = (pageSize) => {
  pageInfo.pageSize = pageSize;
  getArtiles(1);
};

const getArtiles = async (page) => {
  show.value = true;
  if (page === 1) pageInfo.page = 1;
  const params = {
    page: pageInfo.page,
    pageSize: pageInfo.pageSize,
    keyword: pageInfo.keyword,
  };
  if (pageInfo.year != null) params.year = pageInfo.year;
  if (pageInfo.month != null) params.month = pageInfo.month;
  if (pageInfo.category_id && pageInfo.category_id !== 0) params.category_id = pageInfo.category_id;
  if (pageInfo.tag_id) params.tag_id = pageInfo.tag_id;
  try {
    const res = await getArticleList(params);
    const data = res.data || {};
    blogListInfo.value = Array.isArray(data.list) ? data.list : [];
    pageInfo.totalPages = data.pagination?.totalPages ?? 1;
    pageInfo.count = data.pagination?.total ?? 0;
  } finally {
    show.value = false;
  }
};
</script>

<style lang="less" scoped>
.articles-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 35%, #e2e8f0 100%);
}

.articles-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 20px 48px;
  min-height: calc(100vh - 120px);
}

/* Hero：与首页轮播+卡片完全不同 */
.articles-hero {
  text-align: center;
  padding: 36px 24px 32px;
  margin-bottom: 20px;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
  border-radius: 16px;
  color: #fff;
  box-shadow: 0 10px 40px rgba(15, 23, 42, 0.25);
}
.articles-hero-title {
  margin: 0 0 8px 0;
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}
.articles-hero-desc {
  margin: 0;
  font-size: 0.95rem;
  opacity: 0.88;
}

.articles-body {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}
.articles-content {
  flex: 1;
  min-width: 0;
}

/* 筛选工具栏 */
.articles-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 14px 16px;
  margin-bottom: 16px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}
.toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.toolbar-total {
  font-size: 13px;
  color: var(--n-text-color-3);
}

/* 文章列表：行式布局，非首页卡片 */
.article-list {
  list-style: none;
  margin: 0;
  padding: 0;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}
.article-list-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 18px 20px;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  transition: background 0.2s;
}
.article-list-item:last-child {
  border-bottom: none;
}
.article-list-item:hover {
  background: #f8fafc;
}
.article-list-item.is-pinned {
  background: linear-gradient(90deg, rgba(24, 160, 88, 0.06) 0%, transparent 100%);
}
.item-index {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  background: #e2e8f0;
  border-radius: 8px;
}
.article-list-item.is-pinned .item-index {
  background: #18a058;
  color: #fff;
}
.item-main {
  flex: 1;
  min-width: 0;
}
.item-title {
  margin: 0 0 8px 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--n-text-color);
  line-height: 1.35;
}
.item-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 6px;
  font-size: 12px;
  color: var(--n-text-color-3);
}
.item-date {
  color: var(--n-text-color-3);
}
.item-stats {
  color: var(--n-text-color-3);
}
.item-summary {
  margin: 0;
  font-size: 13px;
  color: var(--n-text-color-2);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.item-arrow {
  flex-shrink: 0;
  color: #cbd5e1;
  transition: transform 0.2s;
}
.article-list-item:hover .item-arrow {
  color: #18a058;
  transform: translateX(4px);
}

.article-list-skeleton .article-list-item {
  cursor: default;
}
.article-list-skeleton .article-list-item:hover {
  background: transparent;
}
.skeleton-item .item-index {
  background: #e2e8f0;
}

.articles-empty {
  padding: 48px 24px;
  background: #fff;
  border-radius: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.articles-pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

/* 侧栏 */
.articles-sidebar {
  width: 280px;
  flex-shrink: 0;
}
.sidebar-inner {
  position: sticky;
  top: 90px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.sidebar-card {
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}
.sidebar-summary .filter-summary {
  font-size: 13px;
  color: var(--n-text-color-2);
}
.filter-tag {
  cursor: pointer;
  transition: opacity 0.2s;
}
.filter-tag:hover {
  opacity: 0.9;
}
.friend-link {
  display: block;
  font-size: 13px;
  color: #18a058;
  text-decoration: none;
  padding: 4px 0;
}
.friend-link:hover {
  text-decoration: underline;
}
.promo-card .promo-card-content {
  font-size: 12px;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--n-text-color-2);
}

@media screen and (max-width: 1024px) {
  .articles-sidebar {
    width: 240px;
  }
}
@media screen and (max-width: 900px) {
  .articles-body {
    flex-direction: column;
  }
  .articles-sidebar {
    width: 100%;
  }
  .sidebar-inner {
    position: static;
    flex-direction: row;
    flex-wrap: wrap;
  }
  .sidebar-inner .sidebar-card {
    flex: 1;
    min-width: 200px;
  }
}
@media screen and (max-width: 600px) {
  .articles-main {
    padding: 16px 12px 32px;
  }
  .articles-hero {
    padding: 24px 16px;
  }
  .articles-hero-title {
    font-size: 1.5rem;
  }
  .articles-toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  .toolbar-left,
  .toolbar-right {
    width: 100%;
  }
}
</style>
