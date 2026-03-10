<template>
  <div class="dashboard-page">
  <n-card title="我的收藏" class="admin-page-card favorites-card-wrap">
    <n-space v-if="total > 0" align="center" :size="12" style="margin-bottom: 12px;">
      <n-input
        v-model:value="keyword"
        placeholder="搜索收藏文章标题、摘要"
        clearable
        style="width: 220px"
        @keydown.enter="load()"
      />
      <n-button quaternary type="primary" @click="page = 1; load()">搜索</n-button>
    </n-space>
    <n-empty v-if="list.length === 0 && !loading" description="暂无收藏，去文章详情页收藏喜欢的文章吧" style="padding: 48px 0" />
    <n-spin :show="loading">
      <div v-if="list.length > 0" class="favorites-body">
        <div class="favorites-list-wrap">
          <n-space vertical :size="12" class="article-list">
            <div v-for="item in list" :key="item.id" class="article-item" @click="goDetail(item)">
              <n-card size="small" hoverable class="article-card">
                <template #header>
                  <n-ellipsis style="max-width: 85%">{{ item.title }}</n-ellipsis>
                </template>
                <n-text depth="2" style="font-size: 13px">
                  {{ (item.summary || '').slice(0, 100) }}{{ (item.summary || '').length > 100 ? '…' : '' || '暂无摘要' }}
                </n-text>
                <template #footer>
                  <n-space align="center" wrap :size="10">
                    <n-tag size="small" :bordered="false">{{ item.category_name || '未分类' }}</n-tag>
                    <span class="stat-item">阅读 {{ item.view_count ?? 0 }}</span>
                    <span class="stat-item">点赞 {{ item.like_count ?? 0 }}</span>
                    <span class="stat-item">评论 {{ item.comment_count ?? 0 }}</span>
                    <n-text depth="2" style="font-size: 12px">收藏于 {{ item.favorited_at }}</n-text>
                  </n-space>
                </template>
              </n-card>
            </div>
          </n-space>
        </div>
        <div class="pagination-wrap">
          <n-pagination
            v-model:page="page"
            :page-size="pageSize"
            show-size-picker
            :page-sizes="[10, 20]"
            :item-count="total"
            @update:page="load"
            @update:page-size="onPageSizeChange"
          />
          <n-text depth="2" style="font-size: 13px">共 {{ total }} 篇</n-text>
        </div>
      </div>
    </n-spin>
  </n-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getMyFavorites } from '@/api/api';

const router = useRouter();
const loading = ref(false);
const keyword = ref("");
const list = ref([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const pageCount = ref(1);

async function load() {
  loading.value = true;
  try {
    const params = { page: page.value, pageSize: pageSize.value };
    if (keyword.value?.trim()) params.keyword = keyword.value.trim();
    const res = await getMyFavorites(params);
    list.value = res.data?.list ?? [];
    total.value = res.data?.total ?? 0;
    pageCount.value = Math.max(1, Math.ceil(total.value / pageSize.value));
  } catch (_) {
    list.value = [];
    total.value = 0;
    pageCount.value = 1;
  }
  loading.value = false;
}

function onPageSizeChange(size) {
  pageSize.value = size;
  page.value = 1;
  load();
}

function goDetail(item) {
  router.push({ path: '/detail', query: { id: item.id } });
}

onMounted(() => load());
</script>

<style lang="less" scoped>
.admin-page-card {
  margin-top: 0;
}
.article-item {
  cursor: pointer;
}
.article-card {
  border-radius: var(--radius, 8px);
}
.dashboard-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.dashboard-page .favorites-card-wrap {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.favorites-card-wrap :deep(.n-card__content) {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.favorites-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.favorites-list-wrap {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  max-height: calc(100vh - 260px);
}
.pagination-wrap {
  flex-shrink: 0;
  margin-top: 0;
}
.stat-item {
  font-size: 12px;
  color: var(--text-secondary, #636873);
}
.pagination-wrap {
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
