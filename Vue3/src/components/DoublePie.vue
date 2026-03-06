<template>
  <div :id="id" :style="{ width: width, height: height }" ref="chartRef"></div>
</template>

<script setup>
import {
  ref,
  onMounted,
  watch,
  onUnmounted,
} from "vue";
import * as echarts from "echarts";
const props = defineProps({
  id: {
    type: String,
    default: "chart",
  },
  width: {
    type: String,
    default: "100%",
  },
  height: {
    type: String,
    default: "100%",
  },
  optiondata: {
    // 将属性名改为 optiondata
    type: Object,
    default: () => ({}),
  },
});
const chartRef = ref("null");
const chart = ref(null);
const option = {
  title: {
    text: "未通过模块分布",
  },
  tooltip: {
    trigger: "item",
    formatter: "{b}:({d}%)",
  },
  series: [
    {
      type: "pie",
      data: [],
      label: {
        position: "inside",
      },
      radius: [0, 100],
      itemStyle: {
        borderWidth: 4,
        borderColor: "#FFFFFF",
      },
      clockwise: true,
      animation: false,
    },
    {
      type: "pie",
      data: [],
      radius: [122, 180],
      itemStyle: {
        borderWidth: 4,
        borderColor: "#FFFFFF",
      },
      animation: false,
    },
  ],
  backgroundColor: "#FFFFFF",
};

const initChart = () => {
  chart.value = echarts.init(chartRef.value);
  chart.value.setOption(option);
};
onMounted(() => {
  initChart();
  window.addEventListener("resize", () => {
    chart.value.resize();
  });
});
watch(
  () => props.optiondata,
  () => {
    console.log(props.optiondata);
    option.series[0].data = props.optiondata.menu1;
    option.series[1].data = props.optiondata.menu2;
    chart.value.setOption(option);
  },
  { deep: true }
);
onUnmounted(() => {
  window.removeEventListener("resize", resizeChart);
});

const resizeChart = () => {
  chart.value.resize();
};
</script>

<style lang="less" scoped></style>
