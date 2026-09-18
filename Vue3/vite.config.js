import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import prismjs from "vite-plugin-prismjs";

export default defineConfig({
  plugins: [
    vue(),
    prismjs.default({
      languages: ['javascript', 'css', 'markup', 'typescript', 'bash', 'json', 'markdown', 'python', 'java', 'php', 'go', 'sql', 'csharp', 'cpp', 'less', 'scss', 'stylus', 'yaml', 'ini', 'docker', 'nginx', 'http'],
      plugins: ['line-numbers', 'copy-to-clipboard', 'highlight-keywords', 'autolinker'],
      // 黑色主题
      // theme: "twilight",
      css: true,
    })
  ],
  build: {
    // 兼容微信内置浏览器旧 X5 内核（Chromium < 80 不支持可选链等 ES2020 语法）
    target: "es2018",
  },
  server: {
    host: "0.0.0.0", //内网访问
    // 开发时前端直连 VITE_BASE_URL 指向的后端地址，无需代理
  },
  resolve: {
    alias: {
      // 关键代码
      "@": resolve(__dirname, "src")
    },
  },
});