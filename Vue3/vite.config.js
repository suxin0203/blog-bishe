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
  server: {
    host: "0.0.0.0", //内网访问
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  resolve: {
    alias: {
      // 关键代码
      "@": resolve(__dirname, "src")
    },
  },
});