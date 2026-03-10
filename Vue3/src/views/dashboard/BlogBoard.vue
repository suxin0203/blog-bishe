<template>
  <div class="dashboard-page blog-board-wrap">
    <header class="board-header">
      <div class="board-header-icon">
        <n-icon size="26" :component="StatsChartOutline" />
      </div>
      <div class="board-header-text">
        <h1 class="board-title">数据看板</h1>
        <p class="board-desc">近 7 日数据概览 · 用户、内容与互动统计</p>
      </div>
    </header>

    <n-card class="admin-page-card blog-board" :bordered="false">
      <n-spin :show="loading">
        <n-space vertical :size="20">
          <n-grid :cols="4" :x-gap="16" :y-gap="16">
            <n-gi>
              <div class="stat-card stat-user">
                <div class="stat-icon">
                  <n-icon size="24" :component="PersonOutline" />
                </div>
                <div class="stat-body">
                  <n-statistic label="用户总数" :value="stats.userTotal" />
                </div>
              </div>
            </n-gi>
            <n-gi>
              <div class="stat-card stat-article">
                <div class="stat-icon">
                  <n-icon size="24" :component="BookOutline" />
                </div>
                <div class="stat-body">
                  <n-statistic label="文章总数" :value="stats.articleTotal" />
                </div>
              </div>
            </n-gi>
            <n-gi>
              <div class="stat-card stat-comment">
                <div class="stat-icon">
                  <n-icon size="24" :component="ChatbubbleOutline" />
                </div>
                <div class="stat-body">
                  <n-statistic label="评论总数" :value="stats.commentTotal" />
                </div>
              </div>
            </n-gi>
            <n-gi>
              <div class="stat-card stat-message">
                <div class="stat-icon">
                  <n-icon size="24" :component="MailOutline" />
                </div>
                <div class="stat-body">
                  <n-statistic label="留言总数" :value="stats.messageTotal" />
                </div>
              </div>
            </n-gi>
          </n-grid>

          <n-card v-if="trafficSource.internal !== undefined" title="文章阅读来源" size="small" class="traffic-card">
            <n-grid :cols="2" :x-gap="16">
              <n-gi>
                <n-statistic label="站内跳转阅读" :value="trafficSource.internal" />
              </n-gi>
              <n-gi>
                <n-statistic label="站外/直接访问阅读" :value="trafficSource.external" />
              </n-gi>
            </n-grid>
          </n-card>

          <n-grid :cols="2" :x-gap="16" :y-gap="16">
            <n-gi>
              <n-card title="用户增长趋势" size="small" class="chart-card">
                <template #header-extra>
                  <n-text depth="2" style="font-size: 12px">近 7 日新增</n-text>
                </template>
                <div ref="userTrendRef" class="chart" style="height: 260px"></div>
              </n-card>
            </n-gi>
            <n-gi>
              <n-card title="文章发布统计" size="small" class="chart-card">
                <template #header-extra>
                  <n-text depth="2" style="font-size: 12px">近 7 日发布</n-text>
                </template>
                <div ref="articleTrendRef" class="chart" style="height: 260px"></div>
              </n-card>
            </n-gi>
          </n-grid>

          <n-card title="热门文章排行" size="small" class="rank-card">
            <template #header-extra>
              <n-text depth="2" style="font-size: 12px">按阅读量排序 Top 10</n-text>
            </template>
            <n-data-table
              :columns="rankColumns"
              :data="articleRankList"
              :bordered="false"
              :single-line="false"
              size="small"
              :row-class-name="rowClassName"
            />
          </n-card>
        </n-space>
      </n-spin>
    </n-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import * as echarts from "echarts";
import {
  StatsChartOutline,
  PersonOutline,
  BookOutline,
  ChatbubbleOutline,
  MailOutline,
} from "@vicons/ionicons5";
import {
  getDashboardStats,
  getDashboardArticleRank,
  getDashboardUserTrend,
  getDashboardArticleTrend,
  getDashboardTrafficSource,
} from "@/api/api";

const loading = ref(true);
const stats = ref({
  userTotal: 0,
  articleTotal: 0,
  commentTotal: 0,
  messageTotal: 0,
});
const trafficSource = ref({ internal: undefined, external: undefined });

const userTrendRef = ref(null);
const articleTrendRef = ref(null);
let userChart = null;
let articleChart = null;

const articleRankList = ref([]);
const rankColumns = [
  { title: "标题", key: "title", ellipsis: { tooltip: true } },
  { title: "阅读", key: "view_count", width: 72 },
  { title: "点赞", key: "like_count", width: 64 },
  { title: "评论", key: "comment_count", width: 64 },
  { title: "收藏", key: "favorite_count", width: 64 },
  { title: "发布时间", key: "created_at", width: 155 },
];

const DAYS = 7;

function rowClassName(_, index) {
  return index < 3 ? "rank-top-row" : "";
}

const CHART_COLORS = {
  blue: { line: "#3b82f6", area: ["rgba(59, 130, 246, 0.35)", "rgba(59, 130, 246, 0)"] },
  green: { line: "#18a058", area: ["rgba(24, 160, 88, 0.35)", "rgba(24, 160, 88, 0)"] },
};

function renderLineChart(dom, title, dates, counts, colorKey = "green") {
  if (!dom) return null;
  const colors = CHART_COLORS[colorKey] || CHART_COLORS.green;
  const chart = echarts.init(dom);
  chart.setOption({
    tooltip: { trigger: "axis" },
    grid: { left: "3%", right: "4%", bottom: "3%", top: "12%", containLabel: true },
    xAxis: { type: "category", boundaryGap: false, data: dates },
    yAxis: { type: "value", minInterval: 1 },
    series: [
      {
        name: title,
        type: "line",
        smooth: true,
        data: counts,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: colors.area[0] },
            { offset: 1, color: colors.area[1] },
          ]),
        },
        lineStyle: { color: colors.line },
        itemStyle: { color: colors.line },
      },
    ],
  });
  return chart;
}

function unwrap(res) {
  return res?.data;
}

async function fetchAll() {
  loading.value = true;
  try {
    const [statsSettled, rankSettled, userTrendSettled, articleTrendSettled, trafficSettled] = await Promise.allSettled([
      getDashboardStats(),
      getDashboardArticleRank({ type: "view_count", limit: 10 }),
      getDashboardUserTrend({ days: DAYS }),
      getDashboardArticleTrend({ days: DAYS }),
      getDashboardTrafficSource(),
    ]);

    let statsRes = statsSettled.status === "fulfilled" ? statsSettled.value : null;
    let rankRes = rankSettled.status === "fulfilled" ? rankSettled.value : null;
    let userTrendRes = userTrendSettled.status === "fulfilled" ? userTrendSettled.value : null;
    let articleTrendRes = articleTrendSettled.status === "fulfilled" ? articleTrendSettled.value : null;

    if (!userTrendRes && userTrendSettled.status === "rejected") {
      await new Promise((r) => setTimeout(r, 400));
      try {
        userTrendRes = await getDashboardUserTrend({ days: DAYS });
      } catch (_) {}
    }
    if (!articleTrendRes && articleTrendSettled.status === "rejected") {
      await new Promise((r) => setTimeout(r, 400));
      try {
        articleTrendRes = await getDashboardArticleTrend({ days: DAYS });
      } catch (_) {}
    }

    stats.value = {
      userTotal: unwrap(statsRes)?.userTotal ?? 0,
      articleTotal: unwrap(statsRes)?.articleTotal ?? 0,
      commentTotal: unwrap(statsRes)?.commentTotal ?? 0,
      messageTotal: unwrap(statsRes)?.messageTotal ?? 0,
    };

    const trafficRes = trafficSettled?.status === "fulfilled" ? trafficSettled.value : null;
    const trafficData = unwrap(trafficRes);
    trafficSource.value = {
      internal: trafficData?.internal ?? 0,
      external: trafficData?.external ?? 0,
    };

    articleRankList.value = (unwrap(rankRes) || []).map((r) => ({
      ...r,
      title: r.title || "-",
      view_count: r.view_count ?? 0,
      like_count: r.like_count ?? 0,
      comment_count: r.comment_count ?? 0,
      favorite_count: r.favorite_count ?? 0,
      created_at: r.created_at || "-",
    }));

    const userList = unwrap(userTrendRes) || [];
    const articleList = unwrap(articleTrendRes) || [];
    const userDates = userList.map((d) => (d.date || "").slice(5));
    const userCounts = userList.map((d) => d.count ?? 0);
    const articleDates = articleList.map((d) => (d.date || "").slice(5));
    const articleCounts = articleList.map((d) => d.count ?? 0);

    if (userTrendRef.value) {
      userChart = renderLineChart(
        userTrendRef.value,
        "新增用户",
        userDates,
        userCounts,
        "blue"
      );
    }
    if (articleTrendRef.value) {
      articleChart = renderLineChart(
        articleTrendRef.value,
        "发布文章",
        articleDates,
        articleCounts,
        "green"
      );
    }
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchAll();
});

onBeforeUnmount(() => {
  userChart?.dispose();
  articleChart?.dispose();
});
</script>

<style lang="less" scoped>
.dashboard-page.blog-board-wrap {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
}
.blog-board-wrap {
  width: 100%;
  min-height: 0;
  box-sizing: border-box;
}
.blog-board-wrap .board-header {
  flex-shrink: 0;
}
.blog-board-wrap .blog-board {
  flex: 1;
  min-height: 0;
  overflow: auto;
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

.blog-board {
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  border-radius: 10px;
  border: 1px solid transparent;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.stat-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  color: #fff;
  flex-shrink: 0;
}

.stat-user .stat-icon { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); }
.stat-article .stat-icon { background: linear-gradient(135deg, #18a058 0%, #36ad6a 100%); }
.stat-comment .stat-icon { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
.stat-message .stat-icon { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); }

.stat-body {
  flex: 1;
  min-width: 0;
}

.stat-body :deep(.n-statistic__label) {
  font-size: 13px;
  color: #64748b;
}

.stat-body :deep(.n-statistic__value) {
  font-size: 22px;
  font-weight: 600;
  color: #1e293b;
}

.chart-card {
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.chart {
  width: 100%;
}

.rank-card {
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

:deep(.rank-top-row) {
  background: rgba(24, 160, 88, 0.04);
}
</style>
