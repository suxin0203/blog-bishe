<template>
  <div class="carousel1">
    <section style="background: #00b5d1">
      <n-carousel autoplay draggable v-show="fileList.length > 0">
        <img
          class="carousel-img"
          :src="item.href"
          v-for="item in fileList"
          :key="item.id"
        />
      </n-carousel>
      <div class="title-h1">
        <h1 v-if="carouselNotice">{{ carouselNotice }}</h1>
        <p class="title-h1-page" v-if="carouselNoticeContent">
          {{ carouselNoticeContent }}
        </p>
      </div>
      <div class="wave wave1"></div>
      <div class="wave wave2"></div>
      <div class="wave wave3"></div>
      <div class="wave wave4"></div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import { getOtherswitch, getSwiperList } from "@/api/api";
import { AdminStore } from "@/stores/AdminStore";

const adminStore = AdminStore();
const carouselNotice = ref("");
const carouselNoticeContent = ref("");
let fileList = ref([]);

onMounted(() => {
  getOtherswitchs();
});

const getOtherswitchs = async () => {
  const res = await getOtherswitch();
  adminStore.getgloablOptions(res.data);
  const list = res.data || [];
  const row1 = list.find((item) => item.name === "carousel_notice");
  const row2 = list.find((item) => item.name === "carousel_noticecontent");
  carouselNotice.value = row1?.content ?? "";
  carouselNoticeContent.value = row2?.content ?? "";
  // 旧的轮播图
  // fileList.value = JSON.parse(
  //   res.data.find((item) => item.name === "lunbotu").content
  // );

  // 轮播图来自 GET /swiper（只展示 status=1）
  const swiperRes = await getSwiperList();
  const swiperList = swiperRes.data || [];
  const base = typeof import.meta.env.VITE_BASE_URL === "string" ? import.meta.env.VITE_BASE_URL.replace(/\/$/, "") : "";
  fileList.value = swiperList.map((s) => {
    const url = s.image_url || "";
    const href = url.startsWith("http") ? url : base ? `${base}/${url.replace(/^\//, "")}` : url;
    return { id: s.id, href };
  });
};
</script>

<style lang="less" scoped>
.carousel1 {
  margin-top: -80px;
  position: relative;
  height: 500px;
  .carousel-img {
    width: 100%;
    height: 500px;
    object-fit: cover;
  }
  .title-h1 {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 24px;
    color: #cbcbcb;
    font-weight: bold;
    text-align: center;
  }
  // .title-h1-page {
  //   display: none;
  // }
}

section .wave {
  width: 100%;
  height: 100px;
  position: absolute;
  bottom: 0;
  left: 0;
  background: url("@/assets/images/wave.png");
  background-size: 1000px 100px;
}

section .wave.wave1 {
  animation: animate1 20s linear infinite;
  z-index: 10;
  opacity: 1;
  animation-delay: 0s;
  bottom: 0;
}

section .wave.wave2 {
  animation: animate2 15s linear infinite;
  z-index: 9;
  opacity: 0.5;
  animation-delay: -5s;
  bottom: 10px;
}

section .wave.wave3 {
  animation: animate1 10s linear infinite;
  z-index: 8;
  opacity: 0.2;
  animation-delay: -7s;
  bottom: 15px;
}

section .wave.wave4 {
  animation: animate2 2s linear infinite;
  z-index: 7;
  opacity: 0.71;
  animation-delay: -5s;
  bottom: 20px;
}

@keyframes animate1 {
  0% {
    background-position-x: 0;
  }
  100% {
    background-position-x: 1000px;
  }
}

@keyframes animate2 {
  0% {
    background-position-x: 0;
  }
  100% {
    background-position-x: -1000px;
  }
}

@media screen and (max-width: 600px) {
  .carousel1 {
    height: 300px;
    margin-top: 0px;
    .carousel-img {
      height: 300px;
    }
    .title-h1 {
      font-size: 18px;
    }
  }
  section .wave {
    display: none;
    // height: 50px;
    // background-size: 300px 50px;
  }
}
</style>
