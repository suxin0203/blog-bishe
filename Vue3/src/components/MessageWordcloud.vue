<template>
  <div ref="chartRef" class="message-wordcloud-chart"></div>
</template>

<script setup>
import * as echarts from "echarts";
import "echarts-wordcloud";
import { ref, onMounted, watch, onBeforeUnmount } from "vue";

const props = defineProps({
  msgList: {
    type: Array,
    default: () => [],
  },
});

const chartRef = ref(null);
let chartInstance = null;

// 与项目一致的配色：绿/青/灰
const projectColors = [
  "#0d9488",
  "#18a058",
  "#36ad6a",
  "#10b981",
  "#14b8a6",
  "#64748b",
  "#475569",
  "#334155",
];

function getOption(data) {
  return {
    tooltip: {
      trigger: "item",
      confine: true,
      formatter: (params) => {
        const d = params.data;
        return [
          `<div style="padding:4px 0">留言：${d.name || ""}</div>`,
          d.value != null ? `<div>权重：${d.value}</div>` : "",
          d.author ? `<div>署名：${d.author}</div>` : "",
        ].join("");
      },
    },
    series: [
      {
        type: "wordCloud",
        shape: "circle",
        left: "center",
        top: "center",
        width: "100%",
        height: "100%",
        right: null,
        bottom: null,
        sizeRange: [14, 52],
        rotationRange: [-15, 15],
        rotationStep: 12,
        gridSize: 10,
        drawOutOfBound: false,
        layoutAnimation: true,
        textStyle: {
          fontFamily: "sans-serif",
          fontWeight: "bold",
          color: function () {
            return projectColors[Math.floor(Math.random() * projectColors.length)];
          },
        },
        emphasis: {
          focus: "self",
          textStyle: {
            shadowBlur: 10,
            shadowColor: "#18a058",
          },
        },
        data: data,
      },
    ],
  };
}

function initChart() {
  if (!chartRef.value) return;
  chartInstance = echarts.init(chartRef.value);
  chartInstance.setOption(getOption(props.msgList || []));
}

function resizeChart() {
  chartInstance?.resize();
}

watch(
  () => props.msgList,
  (list) => {
    if (!chartInstance) return;
    chartInstance.setOption({
      series: [{ data: list || [] }],
    });
  },
  { deep: true }
);

onMounted(() => {
  initChart();
  window.addEventListener("resize", resizeChart);
  // 点击词语增加权重（仅前端展示，可按需对接后端）
  chartInstance?.on("click", (params) => {
    const list = [...(props.msgList || [])];
    const item = list.find((i) => i.id === params.data?.id);
    if (item && item.value != null) {
      item.value = (item.value || 0) + 10;
      chartInstance.setOption({ series: [{ data: list }] });
    }
  });
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", resizeChart);
  chartInstance?.dispose();
  chartInstance = null;
});
</script>

<style lang="less" scoped>
.message-wordcloud-chart {
  width: 100%;
  height: 100%;
  min-height: 320px;
}
</style>
