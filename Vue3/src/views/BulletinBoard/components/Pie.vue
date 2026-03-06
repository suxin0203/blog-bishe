<template>
  <div class="pie" ref="pie" :style="{ height, width }"></div>
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
  // 统计name的类型个数
  let nameArr = data.data.map((item) => item.name);
  let nameSet = new Set(nameArr);
  let nameArr2 = Array.from(nameSet);
  // console.log(nameArr2);
  //计算每个name的个数
  let nameCount = [];
  nameArr2.forEach((item) => {
    let count = 0;
    nameArr.forEach((name) => {
      if (name === item) {
        count++;
      }
    });
    nameCount.push(count);
  });
  // console.log(nameCount);
  // 重新赋值
  nameCount.forEach((item, index) => {
    option.series[0].data.push({
      name: nameArr2[index],
      value: item,
    });
  });

  // 重新渲染
  myChart.setOption(option);
};

const pie = ref(null);

let myChart = null;

let colorList = [
  "#73DDFF",
  "#73ACFF",
  "#FDD56A",
  "#FDB36A",
  "#FD866A",
  "#9E87FF",
  "#58D5FF",
  "#FFD57A",
  "#FFB36A",
  "#FF866A",
  "#FF9E87",
  "#FF58D5",
  "#FF73DD",
  "#FF73AC",
  "#FFD56A",
];

let option = {
  title: {
    text: "活动参与度占比统计",
    x: "center",
    y: "center",
    textStyle: {
      fontSize: 14,
    },
  },
  tooltip: {
    trigger: "item",
  },
  series: [
    {
      type: "pie",
      center: ["50%", "50%"],
      radius: ["40%", "80%"],
      clockwise: true,
      avoidLabelOverlap: true,
      //   hoverOffset: 15,
      itemStyle: {
        normal: {
          color: function (params) {
            return colorList[params.dataIndex];
          },
        },
      },
      label: {
        show: true,
        position: "outside",
        // formatter: "{a|{b}：{d}%}\n{hr|}",
        rich: {
          hr: {
            /*
            再次声明一下，大家在这里修改之后不要点击上面的保存！
    不要点击保存！不要点击保存！重要的事情说三遍！
    你的修改会覆盖我的原代码的！感谢理解！
                                --2020/8/4  by--suwanqing
                    */
            backgroundColor: "t",
            borderRadius: 3,
            width: 3,
            height: 3,
            padding: [3, 3, 0, -12],
          },
          a: {
            padding: [-30, 15, -20, 15],
          },
        },
      },
      labelLine: {
        normal: {
          length: 20,
          length2: 10,
          lineStyle: {
            width: 1,
          },
        },
      },
      data: [
        {
          name: "一月",
          value: 1.45,
        },
        {
          name: "二月",
          value: 2.93,
        },
        {
          name: "三月",
          value: 3.15,
        },
        {
          name: "四月",
          value: 4.78,
        },
        {
          name: "五月",
          value: 5.93,
        },
        {
          name: "六月",
          value: 5.73,
        },
      ],
    },
  ],
};

onMounted(() => {
  myChart = echarts.init(pie.value);
  myChart.setOption(option);
});

onBeforeUnmount(() => {
  myChart.dispose();
});
</script>

<style>
</style>