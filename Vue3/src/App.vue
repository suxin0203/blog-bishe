<template>
  <!-- 全局中文文案：分页（x 条/页、跳至）、日期选择等 naive 组件统一为简体中文 -->
  <n-config-provider :locale="zhCN" :date-locale="dateZhCN">
    <n-dialog-provider>
      <!-- 文章列表页被 keep-alive 缓存：从详情返回时保留列表数据与滚动位置 -->
      <router-view v-slot="{ Component }">
        <keep-alive include="ArticlePage">
          <component :is="Component" />
        </keep-alive>
      </router-view>
      <!-- AI 向导：全站悬浮聊天入口（后台 /dashboard 下自动隐藏） -->
      <AiGuide />
    </n-dialog-provider>
  </n-config-provider>
</template>

<script setup>
import { zhCN, dateZhCN } from "naive-ui";
import AiGuide from "@/components/AiGuide/index.vue";
</script>

<style scoped></style>
