<template>
  <div class="my-orders-page">
    <MyHeaderVue />
    <div class="page-main">
      <section class="page-hero">
        <h1 class="page-hero-title">兑换记录</h1>
        <p class="page-hero-desc">我的积分兑换订单</p>
      </section>
      <div v-if="!adminStore.token" class="page-guest">
        <n-empty description="请先登录后查看兑换记录" size="medium">
          <template #extra>
            <n-button type="primary" @click="goLogin">去登录</n-button>
          </template>
        </n-empty>
      </div>
      <div v-else class="page-body">
        <n-spin :show="loading">
          <n-card v-if="orderList.length" class="list-card" bordered>
            <n-data-table
              :columns="columns"
              :data="orderList"
              :bordered="false"
              size="small"
              :single-line="false"
              class="orders-table"
            />
          </n-card>
          <n-empty v-else-if="!loading" description="暂无兑换记录" size="medium" class="list-empty" />
          <div v-if="orderList.length && total > pageSize" class="pagination-wrap">
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
import { getPointsOrderList } from "@/api/api";

const router = useRouter();
const adminStore = AdminStore();
const loading = ref(false);
const orderList = ref([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);

const statusMap = { pending: "待审核", approved: "待审核", shipped: "已发货", completed: "订单完成", cancelled: "已取消" };
const typeMap = { title: "称号", physical: "实物" };

const columns = [
  { title: "商品", key: "goods_name", width: 130, ellipsis: { tooltip: true } },
  { title: "类型", key: "goods_type", width: 68, render: (r) => h(NTag, { type: "info", size: "small", bordered: false }, () => typeMap[r.goods_type] || r.goods_type) },
  { title: "消耗积分", key: "total_points", width: 88 },
  { title: "状态", key: "status", width: 82, render: (r) => h(NTag, { type: r.status === "completed" ? "success" : r.status === "shipped" ? "info" : "warning", size: "small", bordered: false }, () => statusMap[r.status] || r.status) },
  {
    title: "物流信息",
    key: "logistics",
    width: 140,
    ellipsis: { tooltip: true },
    render: (r) => {
      if (r.status !== "shipped" && r.status !== "completed") return "—";
      const parts = [r.logistics_company, r.logistics_no].filter(Boolean);
      return parts.length ? parts.join(" ") : "—";
    },
  },
  {
    title: "管理员备注",
    key: "admin_remark",
    width: 140,
    ellipsis: { tooltip: true },
    render: (r) => r.admin_remark || "—",
  },
  { title: "兑换时间", key: "created_at", width: 158 },
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
    const res = await getPointsOrderList({ my: 1, page: page.value, pageSize: pageSize.value });
    const data = res?.data ?? res;
    orderList.value = data?.list ?? [];
    total.value = data?.total ?? 0;
  } catch (e) {
    orderList.value = [];
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
.my-orders-page {
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
.orders-table {
  margin-top: 0;
}
.pagination-wrap {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}
</style>
