<template>
  <div id="messages" style="width: 80vw; height: 80vh" ref="wordcloud"></div>
</template>

<script setup>
import * as echarts from "echarts";
import "echarts-wordcloud";
import { ref, onMounted, reactive, watch } from "vue";

const props = defineProps(["msgList"]);

const wordcloud = ref(null);
let myEcharts = reactive({});
let worddata = ref([]);

const option = {
  title: {
    text: "留言板",
    link: "https://github.com/suxin0203",
    subtext: "违规留言点我联系管理员删除",
    sublink:
      "tencent://Message/?Uin=208082474&websiteName=www.oicqzone.com&Menu=yes",
  },
  tooltip: {
    show: true,
    trigger: "item",
    triggerOn: "mousemove",
    hideDelay: 100,
    formatter: function (params) {
      return (
        "留言：" +
        params.data.name +
        "<br />点赞：" +
        params.data.value +
        "<br />作者：" +
        (params.data.author ? params.data.author : "匿名")
      );
    },
    textStyle: {
      color: "#000",
      fontSize: 18,
    },
    confine: true,
  },
  series: [
    {
      type: "wordCloud",
      wordCloud: {
        textKey: "content", // 使用 'word' 字段表示词汇文本
        valueKey: "value", // 使用 'weight' 字段表示词汇权重
      },
      gridSize: 20,
      sizeRange: [12, 50],
      rotationRange: [0, 0],
      shape: "circle",
      textStyle: {
        color: function () {
          // 自定义颜色函数
          var r = Math.round(Math.random() * 160);
          var g = Math.round(Math.random() * 160);
          var b = Math.round(Math.random() * 160);
          return "rgb(" + r + "," + g + "," + b + ")";
        },
      },
      emphasis: {
        textStyle: {
          fontWeight: "bold",
          color: "red",
        },
      },
      data: worddata.value,
    },
  ],
};

watch(
  () => props.msgList,
  (newVal, oldVal) => {
    // console.log("watch", newVal);
    worddata.value = newVal;
    myEcharts.setOption({ series: [{ data: worddata.value }] });
  }
);
onMounted(() => {
  myEcharts = echarts.init(wordcloud.value);
  myEcharts.setOption(option);
  // 点击某个字
  myEcharts.on("click", function (params) {
    worddata.value.forEach((item) => {
      if (item.id == params.data.id) {
        item.value += 10;
        myEcharts.setOption({ series: [{ data: worddata.value }] });
      }
    });
  });

  //additional：图表大小自适应窗口大小变化
  window.onresize = () => {
    myEcharts.resize();
  };
});
</script>

<style lang="less" scoped></style>
