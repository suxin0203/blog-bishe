<template>
  <div class="archive-page">
    <MyHeaderVue />
    <div class="archive-main">
      <section class="archive-hero">
        <h1 class="archive-hero-title">时间归档</h1>
        <p class="archive-hero-desc">按年·月查看文章</p>
      </section>
      <div class="archive-body">
        <ul v-if="archiveList.length" class="archive-list">
          <li
            v-for="item in archiveList"
            :key="`${item.year}-${item.month}`"
            class="archive-item"
            @click="goMonth(item)"
          >
            <span class="archive-label">{{ item.year }} 年 {{ item.month }} 月</span>
            <span class="archive-count">{{ item.count }} 篇</span>
          </li>
        </ul>
        <n-empty v-else description="暂无归档" size="medium" class="archive-empty" />
      </div>
    </div>
    <MyFooterVue />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import MyHeaderVue from "@/components/MyHeader.vue";
import MyFooterVue from "@/components/MyFooter.vue";
import { getArticleArchive } from "@/api/api";

const router = useRouter();
const archiveList = ref([]);

onMounted(async () => {
  try {
    const res = await getArticleArchive();
    archiveList.value = Array.isArray(res.data) ? res.data : [];
  } catch (_) {
    archiveList.value = [];
  }
});

function goMonth(item) {
  router.push({ path: "/articles", query: { year: item.year, month: item.month } });
}
</script>

<style lang="less" scoped>
.archive-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 35%, #e2e8f0 100%);
}
.archive-main {
  flex: 1;
  max-width: 800px;
  width: 100%;
  margin: 0 auto;
  padding: 24px 20px 48px;
  box-sizing: border-box;
}
.archive-hero {
  text-align: center;
  padding: 32px 0 24px;
}
.archive-hero-title {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 600;
  color: #1e293b;
}
.archive-hero-desc {
  margin: 0;
  font-size: 14px;
  color: #64748b;
}
.archive-body {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}
.archive-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.archive-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  transition: background 0.2s;
}
.archive-item:last-child {
  border-bottom: none;
}
.archive-item:hover {
  background: #f8fafc;
}
.archive-label {
  font-weight: 500;
  color: #1e293b;
}
.archive-count {
  font-size: 13px;
  color: #64748b;
}
.archive-empty {
  padding: 48px 0;
}
</style>
