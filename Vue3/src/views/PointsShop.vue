<template>
  <div class="shop-page">
    <MyHeaderVue />
    <div class="shop-main">
      <!-- Hero：与文章/留言页统一 -->
      <section class="shop-hero">
        <h1 class="shop-hero-title">积分商城</h1>
        <p class="shop-hero-desc">用积分兑换商品与称号，登录后即可参与</p>
        <div v-if="adminStore.token" class="shop-hero-user">
          <div class="shop-hero-points">
            <span class="points-label">我的积分</span>
            <span class="points-value">{{ adminStore.points ?? 0 }}</span>
          </div>
          <div class="shop-hero-links">
            <router-link to="/my-orders" class="shop-hero-link">兑换记录</router-link>
            <span class="shop-hero-sep">|</span>
            <router-link to="/my-points-log" class="shop-hero-link">积分记录</router-link>
          </div>
        </div>
        <p v-else class="shop-hero-login">
          <router-link to="/login" class="login-link">登录</router-link> 后可查看积分并兑换
        </p>
      </section>

      <!-- 商品列表 -->
      <div class="shop-body">
        <div v-if="loading" class="shop-grid shop-grid-skeleton">
          <div v-for="i of 6" :key="'s' + i" class="goods-card skeleton-card">
            <n-skeleton height="180px" :sharp="false" />
            <div class="skeleton-body">
              <n-skeleton text :repeat="2" style="margin-top: 12px" />
              <n-skeleton width="60%" height="32px" style="margin-top: 12px" />
            </div>
          </div>
        </div>
        <div v-else-if="!goodsList.length" class="shop-empty">
          <n-empty description="暂无商品" size="large" />
        </div>
        <div v-else class="shop-grid">
          <div
            v-for="g in goodsList"
            :key="g.id"
            class="goods-card"
            :class="{ 'goods-out': g.stock != null && g.stock <= 0 }"
          >
            <div class="goods-cover">
              <img v-if="g.image_url" :src="assetUrl(g.image_url)" :alt="g.name" />
              <div v-else class="goods-no-img">
                <span>{{ g.type === 'title' ? '称号' : '实物' }}</span>
              </div>
              <div class="goods-badges">
                <n-tag :type="g.type === 'title' ? 'info' : 'warning'" size="small" round>
                  {{ g.type === 'title' ? '称号' : '实物' }}
                </n-tag>
                <n-tag v-if="g.stock != null && g.stock <= 0" type="error" size="small">售罄</n-tag>
              </div>
            </div>
            <div class="goods-info">
              <h3 class="goods-name">{{ g.name }}</h3>
              <p class="goods-desc">{{ g.description || '暂无说明' }}</p>
              <div class="goods-footer">
                <span class="goods-cost">
                  <strong>{{ g.points_cost }}</strong> 积分
                </span>
                <span v-if="g.stock != null && g.stock > 0" class="goods-stock">库存 {{ g.stock }}</span>
                <n-button
                  type="primary"
                  size="small"
                  :disabled="!adminStore.token || (g.stock != null && g.stock <= 0)"
                  class="goods-btn"
                  @click.stop="openRedeem(g)"
                >
                  兑换
                </n-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 兑换弹窗 -->
    <n-modal
      v-model:show="showRedeem"
      preset="card"
      :title="currentGoods?.type === 'title' ? '兑换称号' : '兑换'"
      style="width: 420px; max-width: 95vw"
      :mask-closable="false"
      class="redeem-modal"
    >
      <n-alert v-if="currentGoods?.type === 'title'" type="warning" :bordered="false" style="margin-bottom: 16px">
        只能拥有一个称号，兑换后将覆盖当前称号。
      </n-alert>
      <n-form ref="formRef" :model="redeemForm" :rules="redeemRules" label-placement="left" label-width="80">
        <n-form-item v-if="currentGoods?.type !== 'title'" label="数量" path="quantity">
          <n-input-number v-model:value="redeemForm.quantity" :min="1" :max="maxQuantity" style="width: 120px" />
        </n-form-item>
        <template v-if="currentGoods?.type === 'physical'">
          <n-form-item label="收货人" path="receiver_name">
            <n-input v-model:value="redeemForm.receiver_name" placeholder="姓名" />
          </n-form-item>
          <n-form-item label="电话" path="receiver_phone">
            <n-input v-model:value="redeemForm.receiver_phone" placeholder="手机号" />
          </n-form-item>
          <n-form-item label="地址" path="receiver_address">
            <n-input v-model:value="redeemForm.receiver_address" type="textarea" placeholder="详细地址" :rows="2" />
          </n-form-item>
        </template>
        <n-form-item label="备注" path="user_remark">
          <n-input v-model:value="redeemForm.user_remark" type="textarea" placeholder="选填" :rows="2" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showRedeem = false">取消</n-button>
          <n-button type="primary" :loading="submitting" @click="submitRedeem">确认兑换</n-button>
        </n-space>
      </template>
    </n-modal>

    <MyFooterVue />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, inject } from "vue";
import MyHeaderVue from "@/components/MyHeader.vue";
import MyFooterVue from "@/components/MyFooter.vue";
import { AdminStore } from "@/stores/AdminStore";
import {
  getPointsGoodsList,
  createPointsOrder,
  getCurrentUser,
} from "@/api/api";

const message = inject("message");
const adminStore = AdminStore();

// 商品图为 /upload/ 相对路径时补全当前环境 API 域名（与库内"相对路径"约定配套）
const API_BASE = import.meta.env.VITE_BASE_URL || "";
function assetUrl(p) {
  if (!p) return p;
  return p.startsWith("/upload/") ? API_BASE + p : p;
}

const loading = ref(false);
const goodsList = ref([]);
const showRedeem = ref(false);
const submitting = ref(false);
const formRef = ref(null);
const currentGoods = ref(null);

const redeemForm = reactive({
  quantity: 1,
  receiver_name: "",
  receiver_phone: "",
  receiver_address: "",
  user_remark: "",
});

const maxQuantity = computed(() => {
  const g = currentGoods.value;
  if (!g) return 1;
  if (g.stock == null) return 999;
  return Math.max(1, g.stock);
});

const redeemRules = computed(() => {
  const rules = {
    quantity: [{ required: true, type: "number", min: 1, message: "数量至少 1", trigger: "blur" }],
  };
  if (currentGoods.value?.type === "physical") {
    rules.receiver_name = [{ required: true, message: "请输入收货人", trigger: "blur" }];
    rules.receiver_phone = [{ required: true, message: "请输入电话", trigger: "blur" }];
    rules.receiver_address = [{ required: true, message: "请输入地址", trigger: "blur" }];
  }
  return rules;
});

async function loadGoods() {
  loading.value = true;
  goodsList.value = [];
  try {
    const res = await getPointsGoodsList();
    const raw = res?.data;
    goodsList.value = Array.isArray(raw) ? raw : (raw?.list || []);
  } catch (e) {
    goodsList.value = [];
    message.error(e?.response?.data?.message || e?.message || "加载商品失败，请检查网络或后端");
  } finally {
    loading.value = false;
  }
}

function openRedeem(g) {
  if (!adminStore.token) {
    message.warning("请先登录");
    return;
  }
  if (g.stock != null && g.stock <= 0) return;
  currentGoods.value = g;
  redeemForm.quantity = g.type === "title" ? 1 : redeemForm.quantity;
  redeemForm.receiver_name = "";
  redeemForm.receiver_phone = "";
  redeemForm.receiver_address = "";
  redeemForm.user_remark = "";
  showRedeem.value = true;
}

async function submitRedeem() {
  const g = currentGoods.value;
  if (!g) return;
  const qty = g.type === "title" ? 1 : redeemForm.quantity;
  if (g.type !== "title") {
    try {
      await formRef.value?.validate();
    } catch (_) {
      return;
    }
  }
  const total = g.points_cost * qty;
  if ((adminStore.points ?? 0) < total) {
    message.error("积分不足");
    return;
  }
  submitting.value = true;
  try {
    const res = await createPointsOrder({
      goods_id: g.id,
      quantity: qty,
      receiver_name: g.type === "physical" ? redeemForm.receiver_name : undefined,
      receiver_phone: g.type === "physical" ? redeemForm.receiver_phone : undefined,
      receiver_address: g.type === "physical" ? redeemForm.receiver_address : undefined,
      user_remark: redeemForm.user_remark || undefined,
    });
    const data = res?.data ?? res;
    if (data?.completed && data?.title) {
      message.success(`订单完成，您的称号已更新为「${data.title}」`);
    } else {
      message.success("兑换成功，积分已扣除");
    }
    showRedeem.value = false;
    const me = await getCurrentUser();
    if (me?.data) {
      adminStore.points = me.data.points ?? adminStore.points;
      if (me.data.title != null) adminStore.setTitle(me.data.title);
      const raw = localStorage.getItem("userInfo");
      if (raw) {
        try {
          const prev = JSON.parse(raw);
          localStorage.setItem("userInfo", JSON.stringify({ ...prev, points: me.data.points, title: me.data.title ?? prev.title }));
        } catch (_) {}
      }
    }
  } catch (e) {
    message.error(e?.message || e?.data?.message || "兑换失败");
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  loadGoods();
});
</script>

<style lang="less" scoped>
.shop-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 35%, #e2e8f0 100%);
  display: flex;
  flex-direction: column;
}

.shop-main {
  flex: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 20px 48px;
  width: 100%;
}

.shop-hero {
  text-align: center;
  padding: 36px 24px 32px;
  margin-bottom: 24px;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
  border-radius: 16px;
  color: #fff;
  box-shadow: 0 10px 40px rgba(15, 23, 42, 0.25);
}
.shop-hero-title {
  margin: 0 0 8px 0;
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}
.shop-hero-desc {
  margin: 0 0 16px 0;
  font-size: 0.95rem;
  opacity: 0.88;
}
.shop-hero-user {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.shop-hero-points {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 12px;
}
.shop-hero-points .points-label {
  font-size: 0.9rem;
  opacity: 0.9;
}
.shop-hero-points .points-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #fbbf24;
}
.shop-hero-links {
  font-size: 0.9rem;
  opacity: 0.9;
}
.shop-hero-link {
  color: #7dd3fc;
  text-decoration: none;
}
.shop-hero-link:hover {
  text-decoration: underline;
}
.shop-hero-sep {
  margin: 0 8px;
  opacity: 0.7;
}
.shop-hero-login {
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.88;
}
.shop-hero-login .login-link {
  color: #7dd3fc;
  text-decoration: none;
  font-weight: 500;
}
.shop-hero-login .login-link:hover {
  text-decoration: underline;
}

.shop-body {
  position: relative;
  min-height: 200px;
}

.shop-empty {
  padding: 48px 24px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  display: flex;
  justify-content: center;
  align-items: center;
}

.shop-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 20px;
}
@media (min-width: 600px) {
  .shop-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (min-width: 900px) {
  .shop-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.goods-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  transition: box-shadow 0.2s, transform 0.2s;
  display: flex;
  flex-direction: column;
}
.goods-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}
.goods-card:not(.goods-out):not(.skeleton-card):hover {
  transform: translateY(-2px);
}
.goods-card.goods-out {
  opacity: 0.75;
}

.goods-cover {
  position: relative;
  height: 180px;
  background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.goods-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.goods-no-img {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  font-size: 1rem;
  font-weight: 500;
}
.goods-badges {
  position: absolute;
  top: 10px;
  left: 10px;
  display: flex;
  gap: 6px;
}
.goods-info {
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
}
.goods-name {
  margin: 0 0 8px 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--n-text-color);
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.goods-desc {
  margin: 0 0 12px 0;
  font-size: 13px;
  color: var(--n-text-color-2);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}
.goods-footer {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: auto;
}
.goods-cost {
  font-size: 14px;
  color: var(--n-text-color-2);
}
.goods-cost strong {
  color: #f59e0b;
  font-size: 1.1rem;
}
.goods-stock {
  font-size: 12px;
  color: var(--n-text-color-3);
  margin-left: auto;
}
.goods-btn {
  flex-shrink: 0;
}

.shop-grid-skeleton .goods-card {
  pointer-events: none;
}
.skeleton-card .skeleton-body {
  padding: 16px;
}

@media screen and (max-width: 600px) {
  .shop-main {
    padding: 16px 12px 32px;
  }
  .shop-hero {
    padding: 24px 16px;
  }
  .shop-hero-title {
    font-size: 1.5rem;
  }
  .goods-cover {
    height: 160px;
  }
}
</style>
