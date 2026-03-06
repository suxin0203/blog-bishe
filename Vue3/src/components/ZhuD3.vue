<template>
  <svg id="base-bar-chart1"></svg>
  <svg id="chart1"></svg>
  <svg id="circle"></svg>
</template>

<script setup>
// 引入d3
import * as d3 from "d3";
// 引入ref,reactive
import { ref, reactive, onMounted } from "vue";

onMounted(() => {
  draw();
  draw1();
  draw2();
});

const draw = () => {
  let svg1 = d3
    .select("#base-bar-chart1")
    .attr("width", 600)
    .attr("height", 600);

  var dataset = [210, 90, 130, 250, 70]; //数据（表示矩形的宽度）

  var scaleLinear = d3
    .scaleLinear()
    .domain([0, d3.max(dataset)])
    .range([400, 0]);

  var xScale = d3
    .scaleBand()
    .domain(d3.range(dataset.length))
    .rangeRound([0, 400]);
  //定义坐标轴
  var axis = d3
    .axisBottom(xScale) //定义一个axis并指定刻度的方向为bottom（朝下）且指定比例尺为scaleLinear
    .ticks(5);

  var rectHeight = 40; //每个矩形所占的像素高度(包括空白)

  svg1
    .selectAll("rect")
    .data(dataset)
    .enter()
    .append("rect")
    .attr("transform", "translate(70,50)")
    .attr("x", function (d, i) {
      return i * 2 * rectHeight;
    })
    .attr("y", function (d, i) {
      return scaleLinear(d);
    })
    .attr("height", function (d) {
      return 500 - scaleLinear(d);
    })
    .attr("width", rectHeight)
    .attr("fill", "steelblue");

  // .on("click", function (d, i) {
  //   console.log(d, i);
  //   // PointerEvent {isTrusted: true, currentTarget: rect, pointerId: 1, stopPropagation: ƒ, stopImmediatePropagation: ƒ, …} 70
  //   d3.select(this)
  //     .transition()
  //     .duration(500)
  //     .attr("height", "0")
  //     .attr("y", "550");
  //   // 让图表上添加到texts文字元素消失
  // })

  // .on("mouseover", function (d, i) {
  //   d3.select(this).attr("fill", "yellow");
  // })
  // .on("mouseout", function (d, i) {
  //   d3.select(this).attr("fill", "steelblue");
  // })
  // .transition()
  // .duration(2000)
  // .ease(d3.easeCircle)
  // .attr("y", function (d, i) {
  //   return 550 - scaleLinear(d);
  // })
  // .attr("height", function (d) {
  //   return scaleLinear(d);
  // });

  svg1
    .append("g")
    .attr("class", "axis")
    .attr("transform", `translate(50,550)`)
    .call(axis);

  // 添加文字元素
  var texts = svg1
    .selectAll(".MyText")
    .data(dataset)
    .enter()
    .append("text")
    .attr("class", "MyText")
    .attr("fill", "black")
    .attr("x", function (d, i) {
      return i * 2 * rectHeight + 70;
    })
    .attr("y", function (d) {
      return scaleLinear(d) + 50;
    })
    .attr("dx", function () {
      return 7.5;
    })
    .attr("dy", function (d) {
      return -10;
    })
    .text(function (d) {
      return d;
    });
};

const draw1 = () => {
  var marge = { top: 60, bottom: 60, left: 60, right: 60 };
  var svg = d3.select("#chart1").attr("width", 600).attr("height", 600);
  var width = svg.attr("width");
  var height = svg.attr("height");
  var g = svg
    .append("g")
    .attr("transform", "translate(" + marge.top + "," + marge.left + ")");

  //准备数据
  var nodes = [
    //节点集
    { name: "湖南邵阳" },
    { name: "山东莱州" },
    { name: "广东阳江" },
    { name: "山东枣庄" },
    { name: "泽" },
    { name: "恒" },
    { name: "鑫" },
    { name: "明山" },
    { name: "班长" },
  ];

  var edges = [
    //边集
    { source: 0, target: 4, relation: "籍贯", value: 1.3 },
    { source: 4, target: 5, relation: "舍友", value: 1 },
    { source: 4, target: 6, relation: "舍友", value: 1 },
    { source: 4, target: 7, relation: "舍友", value: 1 },
    { source: 1, target: 6, relation: "籍贯", value: 2 },
    { source: 2, target: 5, relation: "籍贯", value: 0.9 },
    { source: 3, target: 7, relation: "籍贯", value: 1 },
    { source: 5, target: 6, relation: "同学", value: 1.6 },
    { source: 6, target: 7, relation: "朋友", value: 0.7 },
    { source: 6, target: 8, relation: "职责", value: 2 },
  ];

  //设置一个color的颜色比例尺，为了让不同的扇形呈现不同的颜色
  var colorScale = d3
    .scaleOrdinal()
    .domain(d3.range(nodes.length))
    .range(d3.schemeCategory10);

  var forceSimulation = d3
    .forceSimulation()
    .force("link", d3.forceLink())
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter());

  //生成节点数据
  forceSimulation.nodes(nodes).on("tick", ticked); //这个函数很重要，后面给出具体实现和说明

  //生成边数据
  forceSimulation
    .force("link")
    .links(edges)
    .distance(function (d) {
      //每一边的长度
      return d.value * 100;
    });

  //设置图形的中心位置
  forceSimulation
    .force("center")
    .x(width / 2)
    .y(height / 2);
  //在浏览器的控制台输出
  console.log(nodes);
  console.log(edges);

  //绘制边
  var links = g
    .append("g")
    .selectAll("line")
    .data(edges)
    .enter()
    .append("line")
    .attr("stroke", function (d, i) {
      return colorScale(i);
    })
    .attr("stroke-width", 1);

  var linksText = g
    .append("g")
    .selectAll("text")
    .data(edges)
    .enter()
    .append("text")
    .text(function (d) {
      return d.relation;
    });

  var gs = g
    .selectAll(".circleText")
    .data(nodes)
    .enter()
    .append("g")
    .attr("transform", function (d, i) {
      var cirX = d.x;
      var cirY = d.y;
      return "translate(" + cirX + "," + cirY + ")";
    })
    .call(d3.drag().on("start", started).on("drag", dragged).on("end", ended));

  //绘制节点
  gs.append("circle")
    .attr("r", 10)
    .attr("fill", function (d, i) {
      return colorScale(i);
    });
  //文字
  gs.append("text")
    .attr("x", -10)
    .attr("y", -20)
    .attr("dy", 10)
    .text(function (d) {
      return d.name;
    });

  function ticked() {
    links
      .attr("x1", function (d) {
        return d.source.x;
      })
      .attr("y1", function (d) {
        return d.source.y;
      })
      .attr("x2", function (d) {
        return d.target.x;
      })
      .attr("y2", function (d) {
        return d.target.y;
      });

    linksText
      .attr("x", function (d) {
        return (d.source.x + d.target.x) / 2;
      })
      .attr("y", function (d) {
        return (d.source.y + d.target.y) / 2;
      });

    gs.attr("transform", function (d) {
      return "translate(" + d.x + "," + d.y + ")";
    });
  }

  function started(d) {
    if (!d3.active) {
      forceSimulation.alphaTarget(0.8).restart();
    }
    d.subject.fx = d.x;
    d.subject.fy = d.y;
  }
  function dragged(d) {
    d.subject.fx = d.x;
    d.subject.fy = d.y;
  }
  function ended(d) {
    if (!d3.active) {
      forceSimulation.alphaTarget(0);
    }
    d.subject.fx = null;
    d.subject.fy = null;
  }
};

const draw2 = () => {
  var marge = { top: 60, bottom: 60, left: 60, right: 60 };
  var svg = d3.select("#circle").attr("width", 600).attr("height", 600);
  var width = svg.attr("width");
  var height = svg.attr("height");
  console.log(width, height);
  // var g = svg
  // .append("g")
  // .attr("transform", "translate(" + marge.top + "," + marge.left + ")");

  var dataset = [30, 10, 43, 55, 13]; //需要将这些数据变成饼状图的数据

  //设置一个color的颜色比例尺，为了让不同的扇形呈现不同的颜色
  var colorScale = d3
    .scaleOrdinal()
    .domain(d3.range(dataset.length))
    .range(d3.schemeCategory10);

  //新建一个饼状图
  var pie = d3.pie();

  //新建一个弧形生成器
  var innerRadius = 0; //内半径
  var outerRadius = 50; //外半径
  var arc_generator = d3.arc().innerRadius(0).outerRadius(100);

  //将原始数据变成可以绘制饼状图的数据，
  var pieData = pie(dataset);

  //在浏览器的控制台打印pieData
  console.log(pieData);

  var gs = svg
    .selectAll(".g")
    .data(pieData)
    .enter()
    .append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")"); //位置信息

  console.log(gs);

  //绘制饼状图的各个扇形
  gs.append("path")
    .attr("d", function (d) {
      return arc_generator(d); //往弧形生成器中出入数据
    })
    .attr("fill", function (d, i) {
      return colorScale(i); //设置颜色
    });

  //绘制饼状图上面的文字信息
  gs.append("text")
    .attr("transform", function (d) {
      //位置设在中心处
      return "translate(" + arc_generator.centroid(d) + ")";
    })
    .attr("text-anchor", "middle")
    .text(function (d) {
      return d.data;
    });

  setInterval(() => {
    // 饼图旋转90度动画d3
    svg
      .transition()
      .duration(1000)
      .attr("transform", "rotate(180)")
      .transition()
      .duration(1000)
      .attr("transform", "rotate(360)");
  }, 2000);
};
</script>

<style lang="less" scoped>
// .axis path,
// .axis line {
//   fill: none;
//   stroke: black;
//   shape-rendering: crispEdges;
// }

// .axis text {
//   font-family: sans-serif;
//   font-size: 11px;
// }
</style>
