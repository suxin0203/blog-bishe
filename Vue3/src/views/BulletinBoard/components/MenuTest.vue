<template>
  <div id="menu" style="position: relative; " class="menu">
    <svg height="700" width="300">
      <path
        :d="`
	M ${p1}	C ${cp1} ${cp2} ${p2}`
        "
        stroke="rgba(132, 196, 233)"
        stroke-width="10"
        stroke-linecap="round"
        stroke-opacity="0.3"
        fill="none"
      />
      <foreignObject width="100%" height="100%">
        <div id="allmenu">
          <div
            v-for="(item, index) in menulist.slice(0,9)"
            :key="index"
            class="menuitem"
            @click="changeindex(item.title,item.path)"
          >
            <img v-if="activeindex!==item.title" src="../../assets/menu/测导航默认.png" class="itembody">
            <img v-else src="../../assets/menu/测导航点击.png" class="itembody">
            <span class="itemname" :class="[activeindex===item.title?'fontcolor':'']">{{ item.title }}</span>
            <i class="itemicon" :class="item.icon" />
          </div>
        </div>
        <!-- top与bottom都是用来做上下菜单蒙版的 -->
        <!-- <div class="top" />
        <div class="bottom" /> -->
      </foreignObject>
    </svg>
  </div>
</template>
 
<script>
import { _throttle } from "@/common/util/throttle";
export default {
  components: {},
  props: {
    // 组件宽高
    width: {
      type: Number,
      default: 300,
    },
    height: {
      type: Number,
      default: 700,
    },
    towMenuname: {
      type: String,
      default: "温度",
    },
    // 组件菜单栏
    menulist: {
      type: Array,
      default() {
        return [
          // 菜单项
          { name: "菜单一" },
          { name: "菜单二" },
          { name: "菜单三" },
          { name: "菜单四" },
          { name: "菜单五" },
          { name: "菜单六" },
          { name: "菜单七" },
          { name: "菜单八" },
          { name: "菜单九" },
          { name: "菜单十" },
        ];
      },
    },
  },
  data() {
    return {
      // 菜单每个选项的t，t用来求三层次贝塞尔曲线对应的点，缓慢的增加或减少t可以实现动画效果
      menuitemt: [],
      // 菜单选中状态
      activeindex: "气温",
      // 计数器，根据每次动画帧数缓慢增加减少t实现动画
      counter: 0,
      bottom: 4,
      top: 4,
    };
  },
  computed: {
    // 起始点
    p1: function name() {
      return [0, 0];
    },
    p2: function name() {
      return [0, this.height];
    },
    // 控制点
    cp1: function name() {
      return [70, 110];
    },
    cp2: function name() {
      return [70, this.height - 110];
    },
  },
  watch: {
    menulist: {
      handler(newName, oldName) {
        this.init();
      },
    },
    towMenuname: {
      handler(newName, oldName) {
        this.activeindex = newName;
        this.top = 0;
        this.bottom = this.menulist.length - 8;
        console.log(this.bottom);
      },
    },
  },
  created() {},
  async mounted() {
    // 添加滚轮事件
    var menu = document.getElementById("menu");
    // 为menu绑定一个鼠标滚动的事件
    menu.onmousewheel = (event) => {
      // 判断鼠标滚轮滚动的方向
      event = event || window.event;
      // alert(event.wheelDelta);向上120，向下-120
      if (event.wheelDelta > 0 || event.detail < 0) {
        // 火狐event.detail  向上滚动-3 向下滚动+3
        // 向上滚，改变menulist数组
        this.up();
      } else {
        // 向下滚，改变menulist数组
        this.down();
      }
      return false;
    };
    this.init();
  },
  methods: {
    // 初始化
    init() {
      this.$nextTick(function () {
        this.elem = document.getElementsByClassName("menuitem");
        let i;
        // 每个菜单项的在贝塞尔曲线的间隔
        const menuinterval = 1 / 10;
        for (i = 0; i < 9; i++) {
          // 这里写死了t，t取值在0-1之间，这里不算0的话t有9个，显示的菜单也有九个（菜单小于9个有多少显示多少）
          this.menuitemt[i] = (i + 1) * menuinterval;
          // 操作dom移动到合适的位置
          this.elem[i].style.left =
            24 +
            this.threeOrderBezier(
              this.menuitemt[i],
              this.p1,
              this.cp1,
              this.cp2,
              this.p2
            )[0] +
            "px";
          this.elem[i].style.top =
            -30 +
            this.threeOrderBezier(
              this.menuitemt[i],
              this.p1,
              this.cp1,
              this.cp2,
              this.p2
            )[1] +
            "px";
        }
      });
    },
    // 获取三次贝塞尔曲线的位置
    threeOrderBezier(t, p1, cp1, cp2, p2) {
      // 参数分别为t，起始点，两个控制点和终点
      var [x1, y1] = p1;
      var [cx1, cy1] = cp1;
      var [cx2, cy2] = cp2;
      var [x2, y2] = p2;
      var x =
        x1 * (1 - t) * (1 - t) * (1 - t) +
        3 * cx1 * t * (1 - t) * (1 - t) +
        3 * cx2 * t * t * (1 - t) +
        x2 * t * t * t;
      var y =
        y1 * (1 - t) * (1 - t) * (1 - t) +
        3 * cy1 * t * (1 - t) * (1 - t) +
        3 * cy2 * t * t * (1 - t) +
        y2 * t * t * t;
      return [x, y];
    },
    // 改变menu数组使用防抖节流
    down: _throttle(function (val) {
      if (this.menulist.length > 8 && this.top > 0) {
        this.animation({}, 0);
        console.log("bbb");
        this.bottom = this.bottom + 1;
        this.top = this.top - 1;
      }
    }),
    up: _throttle(function (val) {
      if (this.menulist.length > 8 && this.bottom > 0) {
        this.animation({}, 1);
        console.log("aaaa");
        this.bottom = this.bottom - 1;
        this.top = this.top + 1;
      }
    }),
    // up() {
    //   this.animation({}, 1)
    // },
    // 改变选中
    changeindex(targetRoute) {
      if (targetRoute && (targetRoute.path || targetRoute.name)) {
        this.$router.push(targetRoute);
      } else {
        console.error("目标路由未定义或格式不正确", targetRoute);
      }
    },
    // 每次鼠标滚轮触发该方法
    animation(args, flag) {
      function animate(draw, duration, callback) {
        var start = 0;
        requestAnimationFrame(function animate(time) {
          start = start + 1;
          var timePassed = start;
          if (timePassed > 10) {
            timePassed = duration;
          }
          draw(timePassed);
          if (timePassed < 10) {
            requestAnimationFrame(animate);
          } else callback();
        });
      }
      animate(
        (timePassed) => {
          // 调用需要执行的方法
          this.counter = this.counter + 1;
          var i;
          // 根据帧数将每个间隔再分成26份
          const menuinterval = 1 / 10 / 10;
          var elem = document.getElementsByClassName("menuitem");
          if (flag) {
            for (i = 0; i < 9; i++) {
              elem[i].style.left =
                24 +
                this.threeOrderBezier(
                  this.menuitemt[i] - menuinterval * this.counter,
                  this.p1,
                  this.cp1,
                  this.cp2,
                  this.p2
                )[0] +
                "px";
              elem[i].style.top =
                -30 +
                this.threeOrderBezier(
                  this.menuitemt[i] - menuinterval * this.counter,
                  this.p1,
                  this.cp1,
                  this.cp2,
                  this.p2
                )[1] +
                "px";
            }
          } else {
            for (i = 0; i < 9; i++) {
              elem[i].style.left =
                24 +
                this.threeOrderBezier(
                  this.menuitemt[i] + menuinterval * this.counter,
                  this.p1,
                  this.cp1,
                  this.cp2,
                  this.p2
                )[0] +
                "px";
              elem[i].style.top =
                -30 +
                this.threeOrderBezier(
                  this.menuitemt[i] + menuinterval * this.counter,
                  this.p1,
                  this.cp1,
                  this.cp2,
                  this.p2
                )[1] +
                "px";
            }
          }
          // console.log(elem[1].style.left, elem[1].style.top)
        },
        400,
        function changeItems() {
          if (flag) {
            this.menulist.push(this.menulist.shift());
          } else {
            var last = this.menulist.pop(); // 取数组最后一项
            this.menulist.unshift(last); // 插入数组第一位
          }
          this.init();
          this.counter = 0;
        }.bind(this)
      );
    },
  },
};
</script>
<style lang="less" scoped>
.menu {
  width: 300px;
  height: 700px;
  background: transparent;
  position: relative;
  .menuitem {
    position: absolute;
    .itembody {
      position: relative;
      // opacity: 1;
    }
    .itemname {
      z-index: 1000;
      display: block;
      position: absolute;
      left: 40px;
      width: 100px;
      text-align: center;
      bottom: 27px;
      font-size: 13px;
      font-family: Microsoft YaHei;
      font-weight: bold;
      color: #42a8ff;
    }
    .itemicon {
      z-index: 10000;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      // background-color: rgb(136, 15, 15);
      position: absolute;
      left: 3px;
      top: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: chocolate;
    }
    .fontcolor {
      color: #00f0ff;
      transition: color 0.5s;
      font-size: 14px;
      transition: font-size 0.5s;
    }
  }
  .menuitem:nth-child(1),
  .menuitem:nth-child(9) {
    // opacity: 0.4;
    transition: opacity 0.5s;
  }
  .top {
    pointer-events: none;
    position: absolute;
    top: 0;
    // background-color: rgb(144, 61, 61);
    width: 70%;
    height: 60px;
    background-image: linear-gradient(
      to bottom,
      rgba(255, 255, 255, 1),
      rgba(255, 255, 255, 0)
    );
  }
  .bottom {
    pointer-events: none;
    position: absolute;
    bottom: 0;
    background-image: linear-gradient(
      to top,
      rgba(255, 255, 255, 1),
      rgba(255, 255, 255, 0)
    );
    width: 70%;
    height: 70px;
  }
}
</style>