<template>
  <div class="points-log-page">
    <MyHeaderVue />
    <div class="page-main">
      <section class="page-hero">
        <h1 class="page-hero-title">积分记录</h1>
        <p class="page-hero-desc">当前积分：<strong>{{ adminStore.points ?? 0 }}</strong></p>
      </section>
      <div v-if="!adminStore.token" class="page-guest">
        <n-empty description="请先登录后查看积分记录" size="medium">
          <template #extra>
            <n-button type="primary" @click="goLogin">去登录</n-button>
          </template>
        </n-empty>
      </div>
      <div v-else class="page-body">
        <n-spin :show="loading">
          <n-card v-if="logList.length" class="list-card" bordered>
            <n-data-table
              :columns="columns"
              :data="logList"
              :bordered="false"
              size="small"
              :single-line="false"
              class="log-table"
            />
          </n-card>
          <n-empty v-else-if="!loading" description="暂无积分记录" size="medium" class="list-empty" />
          <div v-if="logList.length && total > pageSize" class="pagination-wrap">
            <n-pagination
              v-model:page="page"
              :page-size="pageSize"
              :item-count="total"
              show-size-picker
              :page-sizes="[10, 20]"
              @update:page="load"
              @update:page-size="onPageSizeChange"
            />
          </div>
        </n-spin>
      </div>
    </div>
    <MyFooterVue />
  </div>
</template>

<script setup>
import { ref, onMounted, h } from "vue";
import { useRouter } from "vue-router";
import { NTag } from "naive-ui";
import MyHeaderVue from "@/components/MyHeader.vue";
import MyFooterVue from "@/components/MyFooter.vue";
import { AdminStore } from "@/stores/AdminStore";
import { getPointsLog } from "@/api/api";

const router = useRouter();
const adminStore = AdminStore();
const loading = ref(false);
const logList = ref([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);

const reasonMap = {
  daily_login: "每日登录",
  comment: "评论",
  like: "点赞文章",
  like_cancel: "取消点赞",
  redeem_goods: "兑换商品",
  admin_adjust: "管理员调整",
};

const columns = [
  {
    title: "变动",
    key: "change",
    width: 100,
    render: (r) => {
      const n = Number(r.change);
      const isPlus = n >= 0;
      return h("span", { style: { color: isPlus ? "#18a058" : "#d03050", fontWeight: 600 } }, isPlus ? `+${n}` : String(n));
    },
  },
  { title: "原因", key: "reason", width: 120, render: (r) => reasonMap[r.reason] || r.reason || "—" },
  { title: "时间", key: "created_at", width: 165 },
];

function goLogin() {
  router.push("/login");
}

function onPageSizeChange(s) {
  pageSize.value = s;
  page.value = 1;
  load();
}

async function load() {
  if (!adminStore.token) return;
  loading.value = true;
  try {
    const res = await getPointsLog({ page: page.value, pageSize: pageSize.value });
    const data = res?.data ?? res;
    logList.value = data?.list ?? [];
    total.value = data?.total ?? 0;
  } catch (e) {
    logList.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  if (adminStore.token) load();
});
</script>

<style lang="less" scoped>
.points-log-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 35%, #e2e8f0 100%);
}
.page-main {
  flex: 1;
  max-width: 900px;
  margin: 0 auto;
  padding: 24px 20px 48px;
  width: 100%;
}
.page-hero {
  text-align: center;
  padding: 28px 24px;
  margin-bottom: 24px;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
  border-radius: 16px;
  color: #fff;
}
.page-hero-title {
  margin: 0 0 6px 0;
  font-size: 1.5rem;
  font-weight: 700;
}
.page-hero-desc {
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.88;
}
.page-guest,
.list-empty {
  padding: 48px 24px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}
.list-card {
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}
.log-table {
  margin-top: 0;
}
.pagination-wrap {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}
</style>
