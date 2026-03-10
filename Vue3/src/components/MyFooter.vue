<template>
  <div class="footer">
    <div class="footer-main">
      <div class="footer-main-l">
        <div v-if="footerTitle" class="footer-main-l-l">
          <a href="javascript:;">{{ footerTitle }}</a>
        </div>
        <div class="footer-main-l-content" style="color: #888888">
          <template v-if="footerContent">
            <p v-for="(line, i) in footerContentLines" :key="i">{{ line }}</p>
          </template>
          <template v-else>
            <p>© 2022 - 也许，将会是最好用的博客管理系统！</p>
            <p>Perhaps, it will be the best blog management system!</p>
          </template>
        </div>
      </div>
      <div v-if="footerIcp" class="footer-main-r">
        <a href="javascript:;">{{ footerIcp }}</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { getOtherswitch } from "@/api/api";

const footerTitle = ref("");
const footerContent = ref("");
const footerIcp = ref("");

const footerContentLines = computed(() => {
  const s = (footerContent.value || "").trim();
  if (!s) return [];
  return s.split(/\r?\n/).filter(Boolean);
});

onMounted(async () => {
  try {
    const res = await getOtherswitch();
    const list = res?.data || [];
    const byName = (name) => list.find((i) => i.name === name);
    footerTitle.value = (byName("footer_title")?.content || "").trim();
    footerContent.value = (byName("footer_content")?.content || "").trim();
    footerIcp.value = (byName("footer_icp")?.content || "").trim();
  } catch (_) {
    footerTitle.value = "";
    footerContent.value = "";
    footerIcp.value = "";
  }
});
</script>

<style lang="less" scoped>
.footer {
  text-align: center;
  font-size: 14px;
  width: 100%;
  background-color: #fff;
  box-shadow: -1px -1px 10px #888888;
  &-main {
    height: 90px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 1200px;
    margin: 0 auto;
    line-height: 1.2;
    &-l {
      width: 60%;
      height: 90px;
      display: flex;
      align-items: center;
      & a:hover {
        color: #36ad6a;
      }
      &-l {
        border-right: 2px solid #e5e7eb;
        padding-right: 25px;
        height: 50px;
        display: flex;
        align-items: center;
        font-size: 24px;
        margin-right: 25px;
      }
    }
  }
}

@media screen and (max-width: 1250px) {
  .footer-main {
    width: 90vw;
  }
}

@media screen and (max-width: 820px) {
  .footer {
    width: 100%;

    &-main {
      height: auto;
      display: block;
      width: 100vw;

      &-l {
        width: 100vw;
        height: auto;
        display: bldock;
        display: flex;
        justify-content: center;

        & a:hover {
          color: #36ad6a;
        }
        &-l {
          display: none;
        }
      }
    }
  }
}
</style>
