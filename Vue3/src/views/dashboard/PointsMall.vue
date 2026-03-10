<template>
  <div class="dashboard-page points-mall-wrap">
  <n-card title="积分商城" class="admin-page-card points-mall points-mall-card-wrap">
    <n-tabs type="line" animated size="large" class="points-mall-tabs">
      <n-tab-pane name="goods" tab="商品管理">
        <div class="tab-pane-inner">
          <div class="tab-toolbar">
            <n-button type="primary" size="small" @click="openGoodsModal()">新增商品</n-button>
            <n-input
              v-model:value="goodsKeyword"
              placeholder="搜索商品名称、说明"
              clearable
              style="width: 200px"
              @keydown.enter="loadGoods()"
            />
            <n-button quaternary type="primary" size="small" @click="loadGoods()">搜索</n-button>
          </div>
          <div class="card-body-scroll">
            <n-data-table :columns="goodsColumns" :data="goodsList" :bordered="false" size="small" class="admin-table" />
          </div>
          <div class="pagination-wrap">
            <n-pagination
              v-if="goodsTotal > 0"
              v-model:page="goodsPage"
              :page-count="Math.ceil(goodsTotal / goodsPageSize)"
              :page-size="goodsPageSize"
              show-size-picker
              :page-sizes="[10, 20, 50]"
              @update:page="loadGoods"
              @update:page-size="(s) => { goodsPageSize = s; goodsPage = 1; loadGoods(); }"
            />
            <n-text depth="2" style="font-size: 13px">共 {{ goodsTotal }} 件商品</n-text>
          </div>
        </div>
      </n-tab-pane>
      <n-tab-pane name="orders" tab="订单管理">
        <div class="tab-pane-inner">
          <div class="tab-toolbar">
            <n-input
              v-model:value="orderKeyword"
              placeholder="搜索商品名称"
              clearable
              style="width: 180px"
              @keydown.enter="loadOrders()"
            />
            <n-button quaternary type="primary" size="small" @click="loadOrders()">搜索</n-button>
          </div>
          <div class="card-body-scroll">
            <n-data-table :columns="orderColumns" :data="orderList" :bordered="false" size="small" class="admin-table" />
          </div>
          <div class="pagination-wrap">
            <n-pagination
              v-if="orderTotal > 0"
              v-model:page="orderPage"
              :page-count="orderPageCount"
              :page-size="orderPageSize"
              show-size-picker
              :page-sizes="[10, 20]"
              @update:page="loadOrders"
              @update:page-size="(s) => { orderPageSize = s; orderPage = 1; loadOrders(); }"
            />
            <n-text depth="2" style="font-size: 13px">共 {{ orderTotal }} 条</n-text>
          </div>
        </div>
      </n-tab-pane>
    </n-tabs>

    <n-modal v-model:show="goodsModalShow" preset="card" :title="editingGoods ? '编辑商品' : '新增商品'" style="width: 480px" :mask-closable="false">
      <n-form ref="goodsFormRef" :model="goodsForm" :rules="goodsRules" label-width="100">
        <n-form-item label="类型" path="type">
          <n-select v-model:value="goodsForm.type" :options="typeOptions" />
        </n-form-item>
        <n-form-item v-if="goodsForm.type === 'title'" label="称号说明">
          <n-alert type="info" :bordered="false" style="margin: 0;">
            称号类：<strong>下方「名称」即用户获得的称号</strong>。用户兑换后订单自动完成并更新其称号（仅保留一个，会覆盖原称号）。请填写准确名称，如：VIP会员、达人。
          </n-alert>
        </n-form-item>
        <n-form-item label="名称" path="name">
          <n-input v-model:value="goodsForm.name" :placeholder="goodsForm.type === 'title' ? '称号名称（如：VIP会员）' : '商品名称'" />
        </n-form-item>
        <div class="goods-form-row">
          <n-form-item label="所需积分" path="points_cost" class="goods-form-half">
            <n-input-number v-model:value="goodsForm.points_cost" :min="1" style="width: 100%" />
          </n-form-item>
          <n-form-item label="库存" path="stock" class="goods-form-half">
            <n-input-number v-model:value="goodsForm.stock" :min="0" placeholder="空为不限" style="width: 100%" clearable />
          </n-form-item>
        </div>
        <n-form-item label="状态" path="status">
          <n-select v-model:value="goodsForm.status" :options="statusOptions" />
        </n-form-item>
        <n-form-item label="说明" path="description">
          <n-input v-model:value="goodsForm.description" type="textarea" placeholder="选填" :rows="2" />
        </n-form-item>
        <n-form-item label="图片 URL" path="image_url">
          <n-input v-model:value="goodsForm.image_url" placeholder="选填" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="goodsModalShow = false">取消</n-button>
          <n-button type="primary" :loading="goodsSubmitting" @click="submitGoods">保存</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="orderModalShow" preset="card" title="订单状态" style="width: 480px" :mask-closable="false">
      <n-form ref="orderFormRef" :model="orderForm" label-width="100">
        <n-form-item label="兑换用户">{{ orderForm.redeemer_username || "—" }}</n-form-item>
        <template v-if="orderForm.receiver_name || orderForm.receiver_phone || orderForm.receiver_address">
          <n-form-item label="收货人">{{ orderForm.receiver_name || "—" }}</n-form-item>
          <n-form-item label="联系电话">{{ orderForm.receiver_phone || "—" }}</n-form-item>
          <n-form-item label="收货地址">{{ orderForm.receiver_address || "—" }}</n-form-item>
        </template>
        <n-form-item v-if="orderForm.user_remark" label="用户备注">
          <n-input :value="orderForm.user_remark" type="textarea" readonly :autosize="{ minRows: 1, maxRows: 4 }" />
        </n-form-item>
        <n-form-item label="状态">
          <n-select v-model:value="orderForm.status" :options="orderStatusOptions" />
        </n-form-item>
        <n-form-item v-if="orderForm.status === 'shipped'" label="物流公司">
          <n-input v-model:value="orderForm.logistics_company" placeholder="如：顺丰、圆通" />
        </n-form-item>
        <n-form-item v-if="orderForm.status === 'shipped'" label="物流单号">
          <n-input v-model:value="orderForm.logistics_no" placeholder="选填" />
        </n-form-item>
        <n-form-item label="管理员备注">
          <n-input v-model:value="orderForm.admin_remark" type="textarea" placeholder="选填" :rows="2" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="orderModalShow = false">取消</n-button>
          <n-button type="primary" :loading="orderSubmitting" @click="submitOrderStatus">保存</n-button>
        </n-space>
      </template>
    </n-modal>
  </n-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, h, inject } from "vue";
import { NTag, NButton } from "naive-ui";
import { AdminStore } from "@/stores/AdminStore";
import {
  getPointsGoodsList,
  addPointsGoods,
  updatePointsGoods,
  deletePointsGoods,
  getPointsOrderList,
  updatePointsOrderStatus,
  updateUserInfo,
} from "@/api/api";

const message = inject("message");
const adminStore = AdminStore();
const goodsList = ref([]);
const goodsPage = ref(1);
const goodsPageSize = ref(10);
const goodsTotal = ref(0);
const goodsKeyword = ref("");
const orderKeyword = ref("");
const orderList = ref([]);
const goodsModalShow = ref(false);
const orderModalShow = ref(false);
const editingGoods = ref(null);
const editingOrderId = ref(null);
const goodsFormRef = ref(null);
const orderFormRef = ref(null);
const goodsSubmitting = ref(false);
const orderSubmitting = ref(false);

const orderPage = ref(1);
const orderPageSize = ref(10);
const orderPageCount = ref(1);
const orderTotal = ref(0);
const editingOrderUserId = ref(null);
const editingOrderGoodsName = ref("");
const editingOrderGoodsType = ref("");

const typeOptions = [
  { label: "实物", value: "physical" },
  { label: "称号", value: "title" },
];
const statusOptions = [
  { label: "上架", value: 1 },
  { label: "下架", value: 0 },
];
const orderStatusOptions = [
  { label: "待审核", value: "pending" },
  { label: "已发货", value: "shipped" },
];

const goodsForm = reactive({
  name: "",
  type: "physical",
  points_cost: 10,
  stock: null,
  status: 1,
  description: "",
  image_url: "",
});

const goodsRules = {
  name: [{ required: true, message: "请输入名称", trigger: "blur" }],
  points_cost: [{ required: true, type: "number", min: 1, message: "积分至少 1", trigger: "blur" }],
};

const orderForm = reactive({
  redeemer_username: "",
  receiver_name: "",
  receiver_phone: "",
  receiver_address: "",
  user_remark: "",
  status: "pending",
  admin_remark: "",
  logistics_company: "",
  logistics_no: "",
});

const goodsColumns = [
  { title: "ID", key: "id", width: 60 },
  { title: "名称", key: "name", ellipsis: { tooltip: true } },
  { title: "类型", key: "type", width: 70, render: (r) => (r.type === "title" ? "称号" : "实物") },
  { title: "积分", key: "points_cost", width: 70 },
  { title: "库存", key: "stock", width: 70, render: (r) => (r.stock == null ? "不限" : r.stock) },
  {
    title: "状态",
    key: "status",
    width: 80,
    render: (r) => h(NTag, { type: r.status === 1 ? "success" : "default", size: "small", bordered: false }, () => (r.status === 1 ? "上架" : "下架")),
  },
  {
    title: "操作",
    key: "action",
    width: 140,
    render: (r) =>
      h("n-space", null, [
        h(NButton, { size: "small", tertiary: true, type: "primary", onClick: () => openGoodsModal(r) }, { default: () => "编辑" }),
        h(NButton, { size: "small", tertiary: true, type: "error", onClick: () => doDeleteGoods(r) }, { default: () => "删除" }),
      ]),
  },
];

const orderStatusMap = { pending: "待审核", approved: "待审核", shipped: "已发货", completed: "订单完成", cancelled: "已取消" };
const orderStatusTypeMap = { pending: "warning", approved: "warning", shipped: "success", completed: "info", cancelled: "default" };

const orderColumns = [
  { title: "ID", key: "id", width: 60 },
  { title: "兑换用户", key: "redeemer_username", width: 110, ellipsis: { tooltip: true }, render: (r) => r.redeemer_username || "—" },
  { title: "商品", key: "goods_name", width: 120, ellipsis: { tooltip: true } },
  { title: "数量", key: "quantity", width: 60 },
  { title: "消耗积分", key: "total_points", width: 90 },
  {
    title: "状态",
    key: "status",
    width: 90,
    render: (r) => h(NTag, { type: orderStatusTypeMap[r.status] || "default", size: "small", bordered: false }, () => orderStatusMap[r.status] || r.status),
  },
  { title: "用户备注", key: "user_remark", width: 120, ellipsis: { tooltip: true }, render: (r) => r.user_remark || "—" },
  { title: "下单时间", key: "created_at", width: 160 },
  {
    title: "操作",
    key: "action",
    width: 100,
    render: (r) =>
      r.goods_type === "title"
        ? h("span", { style: { color: "var(--n-text-color-3)", fontSize: "12px" } }, "—")
        : h(NButton, { size: "small", tertiary: true, type: "primary", onClick: () => openOrderModal(r) }, { default: () => "改状态" }),
  },
];

async function loadGoods() {
  const res = await getPointsGoodsList({
    all: 1,
    page: goodsPage.value,
    pageSize: goodsPageSize.value,
    keyword: goodsKeyword.value || undefined,
  });
  const data = res.data;
  goodsList.value = data?.list ?? [];
  goodsTotal.value = data?.total ?? 0;
}

async function loadOrders() {
  const res = await getPointsOrderList({
    page: orderPage.value,
    pageSize: orderPageSize.value,
    keyword: orderKeyword.value || undefined,
  });
  const list = res.data?.list ?? [];
  const total = res.data?.total ?? 0;
  orderList.value = list;
  orderTotal.value = total;
  orderPageCount.value = Math.max(1, Math.ceil(total / orderPageSize.value));
}

function openGoodsModal(row) {
  editingGoods.value = row || null;
  if (row) {
    goodsForm.name = row.name;
    goodsForm.type = row.type || "physical";
    goodsForm.points_cost = row.points_cost ?? 10;
    goodsForm.stock = row.stock;
    goodsForm.status = row.status ?? 1;
    goodsForm.description = row.description ?? "";
    goodsForm.image_url = row.image_url ?? "";
  } else {
    goodsForm.name = "";
    goodsForm.type = "physical";
    goodsForm.points_cost = 10;
    goodsForm.stock = null;
    goodsForm.status = 1;
    goodsForm.description = "";
    goodsForm.image_url = "";
  }
  goodsModalShow.value = true;
}

async function submitGoods() {
  try {
    await goodsFormRef.value?.validate();
  } catch (_) {
    return;
  }
  goodsSubmitting.value = true;
  try {
    if (editingGoods.value) {
      await updatePointsGoods(editingGoods.value.id, {
        name: goodsForm.name,
        type: goodsForm.type,
        points_cost: goodsForm.points_cost,
        stock: goodsForm.stock,
        status: goodsForm.status,
        description: goodsForm.description || undefined,
        image_url: goodsForm.image_url || undefined,
      });
      message.success("更新成功");
    } else {
      await addPointsGoods({
        name: goodsForm.name,
        type: goodsForm.type,
        points_cost: goodsForm.points_cost,
        stock: goodsForm.stock,
        status: goodsForm.status,
        description: goodsForm.description || undefined,
        image_url: goodsForm.image_url || undefined,
      });
      message.success("创建成功");
    }
    goodsModalShow.value = false;
    loadGoods();
  } catch (e) {
    message.error(e?.message || e?.data?.message || "操作失败");
  } finally {
    goodsSubmitting.value = false;
  }
}

function doDeleteGoods(row) {
  if (!confirm(`确定删除「${row.name}」？\n若该商品已有订单记录，将无法删除。`)) return;
  deletePointsGoods(row.id)
    .then((res) => {
      if (res && res.code !== 200) {
        message.error(res.message || "删除失败");
        return;
      }
      message.success("已删除");
      loadGoods();
    })
    .catch((e) => {
      const msg = e?.response?.data?.message || e?.data?.message || e?.message || "删除失败";
      message.error(msg);
    });
}

function openOrderModal(row) {
  editingOrderId.value = row.id;
  editingOrderUserId.value = row.user_id ?? null;
  editingOrderGoodsName.value = row.goods_name ?? "";
  editingOrderGoodsType.value = row.goods_type ?? "";
  orderForm.redeemer_username = row.redeemer_username ?? "";
  orderForm.receiver_name = row.receiver_name ?? "";
  orderForm.receiver_phone = row.receiver_phone ?? "";
  orderForm.receiver_address = row.receiver_address ?? "";
  orderForm.user_remark = row.user_remark ?? "";
  orderForm.status = row.status === "shipped" || row.status === "completed" ? "shipped" : "pending";
  orderForm.admin_remark = row.admin_remark ?? "";
  orderForm.logistics_company = row.logistics_company ?? "";
  orderForm.logistics_no = row.logistics_no ?? "";
  orderModalShow.value = true;
}

async function submitOrderStatus() {
  orderSubmitting.value = true;
  try {
    await updatePointsOrderStatus(editingOrderId.value, {
      status: orderForm.status,
      admin_remark: orderForm.admin_remark || undefined,
      logistics_company: orderForm.logistics_company || undefined,
      logistics_no: orderForm.logistics_no || undefined,
    });
    if (orderForm.status === "completed" && editingOrderGoodsType.value === "title" && editingOrderUserId.value && editingOrderGoodsName.value) {
      try {
        await updateUserInfo(editingOrderUserId.value, { title: editingOrderGoodsName.value });
        if (Number(editingOrderUserId.value) === Number(adminStore.id)) {
          adminStore.setTitle(editingOrderGoodsName.value);
        }
        message.success("订单已更新，已为用户发放称号");
      } catch (_) {
        message.success("订单已更新");
      }
    } else {
      message.success("已更新");
    }
    orderModalShow.value = false;
    loadOrders();
  } catch (e) {
    message.error(e?.message || e?.data?.message || "操作失败");
  } finally {
    orderSubmitting.value = false;
  }
}

onMounted(() => {
  loadGoods();
  loadOrders();
});
</script>

<style scoped>
.dashboard-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.points-mall-card-wrap {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.points-mall-card-wrap :deep(.n-card__content) {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.points-mall-tabs {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.points-mall-tabs :deep(.n-tabs-nav) {
  flex-shrink: 0;
}
.points-mall-tabs :deep(.n-tabs-pane-wrapper) {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.points-mall-tabs :deep(.n-tabs-tab-pad) {
  flex: 1;
  min-width: 0;
}
.tab-pane-inner {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.tab-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  margin-bottom: 8px;
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
.card-body-scroll .admin-table {
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
.goods-form-row {
  display: flex;
  gap: 16px;
}
.goods-form-row .goods-form-half {
  flex: 1;
  min-width: 0;
}
</style>
