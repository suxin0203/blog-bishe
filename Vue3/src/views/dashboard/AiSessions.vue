<!-- AI 会话管理（仅超管）：查看向导对话记录 / 删除会话 -->
<template>
  <div class="dashboard-page aisessions-wrap">
    <header class="board-header">
      <div class="board-header-icon">
        <n-icon size="26" :component="ChatbubbleEllipsesOutline" />
      </div>
      <div class="board-header-text">
        <h1 class="board-title">AI 会话管理</h1>
        <p class="board-desc">查看与管理博客向导的对话记录 · 仅超级管理员可见</p>
      </div>
    </header>

    <n-card class="admin-page-card" :bordered="false">
      <div class="pane-inner">
        <!-- 顶部工具栏：固定不滚 -->
        <div class="pane-toolbar">
          <n-input
            v-model:value="keyword"
            placeholder="搜索用户昵称 / 会话ID / 提问内容"
            clearable
            style="width: 300px"
            @keyup.enter="load(1)"
          />
          <n-button type="primary" @click="load(1)">搜索</n-button>
        </div>

        <!-- 中间表格区：随剩余高度滚动 -->
        <div class="card-body-scroll">
          <n-data-table
            :columns="columns"
            :data="list"
            :loading="loading"
            :bordered="false"
            :single-line="false"
            size="small"
          />
        </div>

        <!-- 底部分页条：固定不滚，与积分商城等页面统一 -->
        <div class="pagination-wrap">
          <n-pagination
            v-model:page="pagination.page"
            :page-size="pagination.pageSize"
            :item-count="pagination.itemCount"
            show-size-picker
            :page-sizes="pagination.pageSizes"
            @update:page="onPageChange"
            @update:page-size="onPageSizeChange"
          />
          <n-text depth="2" style="font-size: 13px">共 {{ pagination.itemCount }} 条</n-text>
        </div>
      </div>
    </n-card>

    <n-modal v-model:show="showDetail" preset="card" title="对话详情" style="width: 680px">
      <n-spin :show="detailLoading">
        <n-empty v-if="detailMessages.length === 0" description="该会话没有消息记录" />
        <div v-else class="dialog-list">
          <div v-for="m in detailMessages" :key="m.id" class="dialog-item" :class="'r-' + m.role">
            <template v-if="m.role === 'tool'">
              <div class="dialog-tool">🔧 工具调用：{{ m.tool_name || '未知工具' }}<span class="dialog-tool-time">{{ m.created_at }}</span></div>
            </template>
            <template v-else>
              <div class="dialog-role">{{ m.role === 'user' ? '用户' : '文文' }}<span class="dialog-time">{{ m.created_at }}</span></div>
              <div class="dialog-content">{{ m.content }}</div>
            </template>
          </div>
        </div>
      </n-spin>
    </n-modal>
  </div>
</template>

<script setup>
import { h, ref, reactive, onMounted } from "vue";
import { NButton, NPopconfirm, NTag } from "naive-ui";
import { ChatbubbleEllipsesOutline } from "@vicons/ionicons5";
import { getAiSessions, getAiSessionMessages, deleteAiSession } from "@/api/api";

const loading = ref(false);
const list = ref([]);
const keyword = ref("");

const showDetail = ref(false);
const detailLoading = ref(false);
const detailMessages = ref([]);

// 与其他后台页一致：底部独立分页条（10/20/50）
const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  pageSizes: [10, 20, 50],
});

function onPageChange(page) {
  pagination.page = page;
  load(page);
}

function onPageSizeChange(pageSize) {
  pagination.pageSize = pageSize;
  load(1);
}

const columns = [
  {
    title: "会话ID",
    key: "id",
    width: 110,
    render: (row) => h("span", { title: row.id }, row.id.slice(0, 8) + "…"),
  },
  { title: "用户", key: "user_name", width: 120, ellipsis: { tooltip: true } },
  { title: "首问", key: "first_question", ellipsis: { tooltip: true } },
  { title: "消息数", key: "message_count", width: 76 },
  { title: "来源", key: "channel", width: 76 },
  { title: "最近活跃", key: "updated_at", width: 165 },
  {
    title: "操作",
    key: "actions",
    width: 140,
    render(row) {
      return h("div", { style: "display:flex;gap:6px" }, [
        h(
          NButton,
          { size: "tiny", type: "primary", quaternary: true, onClick: () => viewSession(row) },
          { default: () => "查看" }
        ),
        h(
          NPopconfirm,
          { onPositiveClick: () => remove(row) },
          {
            trigger: () =>
              h(NButton, { size: "tiny", type: "error", quaternary: true }, { default: () => "删除" }),
            default: () => "确认删除该会话及其全部消息？",
          }
        ),
      ]);
    },
  },
];

async function load(page = pagination.page) {
  loading.value = true;
  try {
    const res = await getAiSessions({ page, pageSize: pagination.pageSize, keyword: keyword.value });
    const data = res?.data || {};
    list.value = data.list || [];
    pagination.itemCount = data.total || 0;
    pagination.page = page;
  } catch (_) {
    list.value = [];
  } finally {
    loading.value = false;
  }
}

async function viewSession(row) {
  showDetail.value = true;
  detailLoading.value = true;
  detailMessages.value = [];
  try {
    const res = await getAiSessionMessages(row.id);
    detailMessages.value = res?.data?.messages || [];
  } catch (_) {
    detailMessages.value = [];
  } finally {
    detailLoading.value = false;
  }
}

async function remove(row) {
  try {
    await deleteAiSession(row.id);
    // 本地移除，避免整页刷新
    list.value = list.value.filter((r) => r.id !== row.id);
    pagination.itemCount = Math.max(0, pagination.itemCount - 1);
  } catch (_) {}
}

onMounted(() => load(1));
</script>

<style lang="less" scoped>
.dashboard-page.aisessions-wrap {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
}
.aisessions-wrap .board-header {
  flex-shrink: 0;
}
/* 三段式布局：卡片填充剩余高度，内部再分「工具栏固定 / 表格滚动 / 分页固定」 */
.aisessions-wrap .admin-page-card {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.aisessions-wrap .admin-page-card :deep(.n-card__content) {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.pane-inner {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.pane-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  margin-bottom: 10px;
}
.card-body-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
}

.board-header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 20px;
  padding: 18px 22px;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border-radius: 12px;
  border: 1px solid rgba(24, 160, 88, 0.12);
}
.board-header-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #18a058 0%, #36ad6a 100%);
  color: #fff;
  border-radius: 10px;
  flex-shrink: 0;
}
.board-title {
  margin: 0 0 4px 0;
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
}
.board-desc {
  margin: 0;
  font-size: 13px;
  color: #64748b;
}

/* 底部分页条：固定在卡片底部，不随表格滚动 */
.pagination-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid #e8e8ec;
  flex-shrink: 0;
}

/* 对话详情 */
.dialog-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 4px;
}
.dialog-item {
  border: 1px solid #eef1f6;
  border-radius: 10px;
  padding: 10px 12px;
}
.dialog-item.r-user {
  background: rgba(24, 160, 88, 0.05);
  border-color: rgba(24, 160, 88, 0.2);
}
.dialog-role {
  font-size: 12px;
  font-weight: 600;
  color: #18a058;
  margin-bottom: 4px;
}
.dialog-item.r-assistant .dialog-role {
  color: #4f7df7;
}
.dialog-time {
  margin-left: 8px;
  font-weight: 400;
  color: #94a3b8;
  font-size: 11px;
}
.dialog-content {
  font-size: 13px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
  color: #333;
}
.dialog-tool {
  font-size: 12px;
  color: #94a3b8;
}
.dialog-tool-time {
  margin-left: 8px;
  font-size: 11px;
}
</style>
