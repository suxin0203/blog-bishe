<template>
  <div class="graph" ref="graph" :style="{ height, width }"></div>
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
  //        {"code":0,"data":{"resultEnumName":"COUPON_89"}},
  //        {"code":0,"msg":"","data":{"status":5}}
  //     ]
  // }

  // 首先清空数据
  option.series[0].data = [];
  // 统计data里面每个数据的key出现的次数 找出top5
  // 统计每个key出现的次数
  let keyArr = [];
  data.data.forEach((item) => {
    item = JSON.parse(item.content);
    for (let key in item) {
      keyArr.push(key);
    }
  });
  let keyObj = {};
  keyArr.forEach((item) => {
    if (keyObj[item]) {
      keyObj[item]++;
    } else {
      keyObj[item] = 1;
    }
  });
  // console.log(keyObj);
  // 对keyObj进行排序
  let keyArr2 = [];
  for (let key in keyObj) {
    keyArr2.push({ key, count: keyObj[key] });
  }
  keyArr2.sort((a, b) => b.count - a.count);
  // console.log(keyArr2);
  // 取前5个
  let keyArr3 = keyArr2.slice(0, 5);
  // console.log(keyArr3);
  // 重新赋值
  keyArr3.forEach((item, index) => {
    option.series[0].data.push({
      name: item.key,
      value: item.count,
    });
  });

  // 重新渲染
  myChart.setOption(option);

};

const graph = ref(null);

let myChart = null;

let chartdata = [
    { name: '污水', sum: 208,size:50 },
    { name: '碳排放',sum: 80,size:60 },
    { name: '钢铁1', sum: 108,size:70 },
    { name: '碳排放1',sum: 80,size:80 },
    { name: '钢铁2', sum: 108,size:90 }
    ];
let color = ['#6DFFA1', '#56C7F6', '#F9F08A','#6DFFA1', '#56C7F6', '#F9F08A','#6DFFA1', '#56C7F6', '#F9F08A','#6DFFA1', '#56C7F6', '#F9F08A']
let data=[];

chartdata.map((item,index)=>{
    data.push(
          {
        name:item.name+'\n\n'+item.sum,
        value: 111,
        symbolSize: item.size,
        draggable: true,
        label: {
            normal: {
                textStyle: {
                    fontSize: 12,
                    color: '#fff',
                },
            },
        },
        itemStyle: {
            normal: {
                color: new echarts.graphic.RadialGradient(0.5, 0.5, 1, [
                    {
                        offset: 0.2,
                        color: 'rgba(27, 54, 72, 0.2)',
                    },
                    {
                        offset: 0.8,
                        color: color[index],
                    },
                ]),
                opacity: 1,
                borderWidth: 1,
                borderColor: color[index],
                shadowBlur: 7,
                symbolOffset: 0.6,
                shadowColor:color[index],
            },
        },
    },
        )
})

let option = {
  backgroundColor: 'rgba(0,0,0,0)',
  animationDurationUpdate: function (idx) {
    return idx * 100;
  },
  tooltip: {
    trigger: "item",
    formatter: function (params, ticket, callback) {
      return params.data.tips || params.name;
    },
  },
  animationEasingUpdate: "bounceIn",
  itemStyle: {
    // color: 'red',
  },
  cursor: "pointer",
  series: [
    {
      type: "graph",
      layout: "force",
      cursor: "pointer",
      force: {
        repulsion: 200,
        edgeLength: 100,
      },
      roam: true,
      label: {
        normal: {
          show: true,
        },
      },
      data,
    },
  ],
};

onMounted(() => {
  myChart = echarts.init(graph.value);
  myChart.setOption(option);
});

onBeforeUnmount(() => {
  myChart.dispose();
});
</script>

<style>
</style>