<template>
  <div class="linear" ref="linear" :style="{ height, width }"></div>
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

// 根据数据获取本周和上周的每日注册量
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
  //         },
  //         {
  //             "id": 448,
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
  option.series[1].data = [];
  option.xAxis[0].data = [];
  // 计算最近7天和上7天的注册量
  // 先获取x轴的日期
  // option.xAxis[0].data = [];
  let date = new Date();
  let dateArr = [];
  for (let i = 0; i < 7; i++) {
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    dateArr.unshift(`${month}/${day}/${year}`);
    date.setDate(date.getDate() - 1);
  }

  // console.log(dateArr);
  // 获取近7天 每一天的注册量
  let dataArr = [];
  dateArr.forEach((item) => {
    let count = 0;
    data.data.forEach((item2) => {
      let date = item2.created_at.split(",")[0].trim();
      // console.log(date, item);
      if (date === item) {
        count++;
      }
    });
    dataArr.push(count);
  });
  // console.log(dataArr);
  // 重新赋值
  dataArr.forEach((item, index) => {
    option.series[0].data.push(item);
  });

  // 获取上7天 每一天的注册量 7-14
  let dateArr2 = dateArr.map((item) => {
    let date = item.split("/");
    let month = date[0];
    let day = date[1];
    let year = date[2];
    let date2 = new Date(`${month}/${day}/${year}`);
    date2.setDate(date2.getDate() - 7);
    return `${date2.getMonth() + 1}/${date2.getDate()}/${date2.getFullYear()}`;
  });
  console.log("dateArr2",dateArr2);
  let dataArr2 = [];
  dateArr2.forEach((item) => {
    let count = 0;
    data.data.forEach((item2) => {
      let date = item2.created_at.split(",")[0].trim();
      // console.log(date, item);
      if (date === item) {
        count++;
      }
    });
    dataArr2.push(count);
  });
  console.log("dataArr2",dataArr2);
  // 重新赋值
  dataArr2.forEach((item, index) => {
    option.series[1].data.push(item);
  });


  // 去掉年份
  // option.xAxis[0].data = dateArr;
  dateArr = dateArr.map((item) => item.split("/2024")[0].trim());
  option.xAxis[0].data = dateArr;

  // 重新渲染
  myChart.setOption(option);
};

const linear = ref(null);

let myChart = null;

let option = {
  backgroundColor: "rgba(0,0,0,0)", //背景颜色
  title: {
    text: "近两周每日数据量",
    // textStyle: {
    align: "center",
    color: "#fff",
    fontSize: 16,
    // },
    top: "5%",
    left: "center",
  },
  tooltip: {
    trigger: "axis",
    axisPointer: {
      lineStyle: {
        color: {
          type: "linear",
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            {
              offset: 0,
              color: "rgba(0, 255, 233,0)",
            },
            {
              offset: 0.5,
              color: "rgba(255, 255, 255,1)",
            },
            {
              offset: 1,
              color: "rgba(0, 255, 233,0)",
            },
          ],
          global: false,
        },
      },
    },
  },
  grid: {
    top: "15%",
    left: "5%",
    right: "5%",
    bottom: "15%",
    // containLabel: true
  },
  xAxis: [
    {
      type: "category",
      axisLine: {
        show: true,
      },
      splitArea: {
        // show: true,
        color: "#f00",
        lineStyle: {
          color: "#f00",
        },
      },
      axisLabel: {
        color: "#000",
      },
      splitLine: {
        show: false,
      },
      boundaryGap: false,
      data: ["A", "B", "C", "D", "E", "F"],
    },
  ],

  yAxis: [
    {
      type: "value",
      min: 0,
      // max: 140,
      splitNumber: 4,
      splitLine: {
        show: true,
        lineStyle: {
          color: "rgba(255,255,255,0.1)",
        },
      },
      axisLine: {
        show: false,
      },
      axisLabel: {
        show: false,
        margin: 20,
        // textStyle: {
        color: "#d1e6eb",
        // },
      },
      axisTick: {
        show: false,
      },
    },
  ],
  series: [
    {
      name: "本周",
      type: "line",
      smooth: true, //是否平滑
      showAllSymbol: true,
      // symbol: 'image://./static/images/guang-circle.png',
      symbol: "circle",
      symbolSize: 15,
      lineStyle: {
        // normal: {
        color: "#00b3f4",
        shadowColor: "rgba(0, 0, 0, .3)",
        shadowBlur: 0,
        shadowOffsetY: 5,
        shadowOffsetX: 5,
        // },
      },
      label: {
        show: true,
        position: "top",
        // textStyle: {
        color: "#00b3f4",
        // },
      },
      itemStyle: {
        color: "#00b3f4",
        borderColor: "#fff",
        borderWidth: 3,
        shadowColor: "rgba(0, 0, 0, .3)",
        shadowBlur: 0,
        shadowOffsetY: 2,
        shadowOffsetX: 2,
      },
      tooltip: {
        formatter (params) {
          return `${params.name}：${params.data}`;
        },
      },
      areaStyle: {
        // normal: {
        color: new echarts.graphic.LinearGradient(
          0,
          0,
          0,
          1,
          [
            {
              offset: 0,
              color: "rgba(0,179,244,0.3)",
            },
            {
              offset: 1,
              color: "rgba(0,179,244,0)",
            },
          ],
          false
        ),
        shadowColor: "rgba(0,179,244, 0.9)",
        shadowBlur: 20,
        // },
      },
      data: [5,5,5,5,5,5,5],
    },
    {
      name: "上周",
      type: "line",
      smooth: true, //是否平滑
      showAllSymbol: true,
      // symbol: 'image://./static/images/guang-circle.png',
      symbol: "circle",
      symbolSize: 15,
      lineStyle: {
        // normal: {
        color: "#00ca95",
        shadowColor: "rgba(0, 0, 0, .3)",
        shadowBlur: 0,
        shadowOffsetY: 5,
        shadowOffsetX: 5,
        // },
      },
      label: {
        show: true,
        position: "top",
        // textStyle: {
        color: "#00ca95",
        // },
      },

      itemStyle: {
        color: "#00ca95",
        borderColor: "#fff",
        borderWidth: 3,
        shadowColor: "rgba(0, 0, 0, .3)",
        shadowBlur: 0,
        shadowOffsetY: 2,
        shadowOffsetX: 2,
      },
      tooltip: {
        formatter: "{b} <br/>{a} : {c}",

      },
      areaStyle: {
        // normal: {
        color: new echarts.graphic.LinearGradient(
          0,
          0,
          0,
          1,
          [
            {
              offset: 0,
              color: "rgba(0,202,149,0.3)",
            },
            {
              offset: 1,
              color: "rgba(0,202,149,0)",
            },
          ],
          false
        ),
        shadowColor: "rgba(0,202,149, 0.9)",
        shadowBlur: 20,
        // },
      },
      data: [6,6,6,6,6,6,6],
    },
  ],
};

onMounted(() => {
  myChart = echarts.init(linear.value);
  myChart.setOption(option);
});

onBeforeUnmount(() => {
  myChart.dispose();
});
</script>

<style>
</style>