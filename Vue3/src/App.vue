<template>
  <n-dialog-provider>
    <router-view></router-view>
    <!-- AI 向导：全站悬浮聊天入口（后台 /dashboard 下自动隐藏） -->
    <AiGuide />
  </n-dialog-provider>
</template>

<script setup>
import AiGuide from "@/components/AiGuide/index.vue";
</script>

<style scoped></style>
