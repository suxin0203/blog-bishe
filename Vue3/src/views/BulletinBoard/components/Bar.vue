<template>
  <div class="bar" ref="bar" :style="{ height, width }"></div>
</template>

<script setup>
// 折线图echarts
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import * as echarts from "echarts";

const props = defineProps({
  height: {
    type: String,
    default: "300px",
  },
  width: {
    type: String,
    default: "100%",
  },
  optionData: {
    type: Object,
    default: () => {},
  },
});

watch(
  () => props.optionData,
  (val) => {
    // 检测到数据 然后清洗数据
    cleanData(val);
  }
);

// 根据数据获取活动高频时间段top5
const cleanData = (data) => {
  // 数据清洗
  //   {
  //     "code": 200,
  //     "message": "获取成功",
  //     "pagination": {
  //         "total": 1,
  //         "page": 1,
  //         "limit": 10
  //     },
  //     "data": [
  //         {
  //             "id": 449,
  //             "name": "七点五矿泉水sign",
  //             "created_at": "7/24/2024, 7:13:46 PM",
  //             "content": "YZ1265317548026494976YZq6kG8UFE|苏辛",
  //             "token": null,
  //             "value": null,
  //             "remarks": "无"
  //         }
  //     ]
  // }

  // 首先清空数据
  option.series[0].data = [];
  // 统计created_at的类型个数精确到每分钟
  let created_atArr = data.data.map((item) => item.created_at);
  let created_atSet = new Set(created_atArr);
  let created_atArr2 = Array.from(created_atSet);
  // console.log(created_atArr2);
  //计算每个created_at的个数 只统计到时分秒的数据 不要日月天 要上下午  例如：7:13:46 PM
  let created_atObj = {};
  created_atArr2.forEach((item) => {
    let time = item.split(",")[1].trim();
    let time2 =
      time.split(":")[0] + ":" + time.split(":")[1] + " " + time.split(" ")[1];
    if (created_atObj[time2]) {
      created_atObj[time2]++;
    } else {
      created_atObj[time2] = 1;
    }
  });

  // console.log(created_atObj);
  // 重新赋值
  let created_atArr3 = Object.keys(created_atObj);
  let created_atArr4 = Object.values(created_atObj);
  // console.log(created_atArr3);
  // console.log(created_atArr4);
  created_atArr3.forEach((item, index) => {
    option.series[0].data.push({
      name: item,
      value: created_atArr4[index],
    });
  });

  // 筛选出top5
  let top5 = [];
  let created_atArr5 = created_atArr4.slice(0);
  created_atArr5.sort((a, b) => b - a);
  let top5Value = created_atArr5.slice(0, 5);
  top5Value.forEach((item) => {
    let index = created_atArr4.indexOf(item);
    top5.push({
      name: created_atArr3[index],
      value: item,
    });
  });
  // console.log(top5);
  // 重新赋值
  option.yAxis[0].data = top5.map((item) => item.name);
  // 按照top5的顺序排列
  option.yAxis[1].data = top5.map((item) => item.value);
  option.series[0].data = top5.map((item) => item.value);
  // 背景颜色取最大值 然后复制5个
  option.series[1].data = [
    top5Value[0],
    top5Value[0],
    top5Value[0],
    top5Value[0],
    top5Value[0],
  ];

  // 重新渲染
  myChart.setOption(option);
};

const bar = ref(null);

let myChart = null;

let option = {
  title: {
    text: "活动高频时间段Top5",
    top: "5%",
    left: "center",
    textStyle: {
      fontSize: 16,
      color: "#fff",
    },
  },
  grid: {
    left: "5%",
    right: "5%",
    bottom: "5%",
    top: "10%",
    containLabel: true,
  },
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "none",
    },
    formatter: function (params) {
      return (
        params[0].name +
        "<br/>" +
        "<span style='display:inline-block;margin-right:5px;border-radius:10px;width:9px;height:9px;background-color:rgba(36,207,233,0.9)'></span>" +
        params[0].seriesName +
        " : " +
        params[0].value
      );
    },
  },
  backgroundColor: "rgb(20,28,52,0.1)",
  xAxis: {
    show: false,
    type: "value",
  },
  yAxis: [
    {
      type: "category",
      inverse: true,
      axisLabel: {
        show: true,
        // textStyle: {
        color: "#fff",
        // },
      },
      splitLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      axisLine: {
        show: false,
      },
      data: ["大米", "玉米", "蔬菜", "鸡蛋", "坚果"],
    },
    {
      type: "category",
      inverse: true,
      axisTick: "none",
      axisLine: "none",
      show: true,
      axisLabel: {
        // textStyle: {
        color: "#ffffff",
        fontSize: "12",
        // },
        formatter: function (value) {
          return value.toLocaleString();
        },
      },
      data: [50000000, 22000000, 10000000, 5000000, 1],
    },
  ],
  series: [
    {
      name: "次数",
      type: "bar",
      zlevel: 1,
      itemStyle: {
        // normal: {
        borderRadius: 30,
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          {
            offset: 0,
            color: "rgb(57,89,255,0.8)",
          },
          {
            offset: 1,
            color: "rgb(46,200,207,0.2)",
          },
        ]),
        // },
      },
      barWidth: 20,
      data: [50000000, 22000000, 10000000, 5000000, 1],
    },
    {
      name: "背景",
      type: "bar",
      barWidth: 20,
      barGap: "-100%",
      data: [50000000, 50000000, 50000000, 50000000, 1],
      itemStyle: {
        // normal: {
        color: "rgba(24,31,68,0.2)",
        borderRadius: 30,
        // }
      },
    },
  ],
};

onMounted(() => {
  myChart = echarts.init(bar.value);
  myChart.setOption(option);
});

onBeforeUnmount(() => {
  myChart.dispose();
});
</script>

<style>
</style>