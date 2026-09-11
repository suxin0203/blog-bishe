<template>
  <div style="z-index: 999">
    <Toolbar
      :editor="editorRef"
      :defaultConfig="toolbarConfig"
      :mode="mode"
      style="border-bottom: 1px solid #ccc"
    />
    <Editor
      :defaultConfig="editorConfig"
      :mode="mode"
      v-model="valueHtml"
      :style="{ height: height }"
      @onCreated="handleCreated"
      @onChange="handleChange"
    />
  </div>
</template>

<script setup>
import "@wangeditor/editor/dist/css/style.css";
import {
  onBeforeUnmount,
  ref,
  shallowRef,
  onMounted,
  inject,
  watch
} from "vue";
import { Editor, Toolbar } from "@wangeditor/editor-for-vue";
import request from "@/api/request";

// 传入的height
const props = defineProps({
  height: {
    type: String,
    default: "350px",
  },
  modelValue: {
    type: String,
    default: "",
  },
});

const server_url = inject("server_url");

// 编辑器实例，必须用 shallowRef，重要！
const editorRef = shallowRef();
//屏蔽上传视频
const toolbarConfig = { excludeKeys: ["uploadVideo"] };
const mode = ref("default");
const editorConfig = { placeholder: "请输入内容..." };
editorConfig.MENU_CONF = {};
// 图片上传：走 axios 实例（customUpload），
// token 由请求拦截器实时读取并支持 401 自动刷新，避免组件初始化时固化过期 token 导致上传静默失败
editorConfig.MENU_CONF["uploadImage"] = {
  // 小于该值就插入 base64 格式（而不上传），默认为 0
  base64LimitSize: 10 * 1024, // 10kb
  async customUpload(file, insertFn) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await request.post("/upload/token/rich_editor_upload", formData);
    if (res?.code === 200 && res?.data?.url) {
      // 插入绝对地址，保证编辑器预览与已保存内容在不同环境下都可显示
      const url = res.data.url.startsWith("http") ? res.data.url : `${server_url}${res.data.url}`;
      insertFn(url, res.data.alt || "", res.data.href || url);
    } else {
      throw new Error(res?.message || "上传失败");
    }
  },
};

editorConfig.MENU_CONF["insertImage"] = {
  parseImageSrc: (src) => {
    if (src.indexOf("http") !== 0) {
      return `${server_url}${src}`;
    }
    return src;
  }, // 也支持 async 函数
};

// 内容 HTML
const valueHtml = ref("");
let initFinished = false;
const emit = defineEmits(["update:modelValue"]);
const syncingFromOutside = ref(false);

onMounted(() => {
  setTimeout(() => {
    // 首次初始化：把外部值灌入编辑器
    valueHtml.value = props.modelValue;
    try {
      editorRef.value?.setHtml?.(valueHtml.value || "");
    } catch (_) {}
    initFinished = true;
  }, 10);
});

// 外部 v-model 变更（例如：切换文章点“修改”）时，同步刷新编辑器内容
watch(
  () => props.modelValue,
  (next) => {
    const nextHtml = next ?? "";
    if (nextHtml === valueHtml.value) return;
    syncingFromOutside.value = true;
    valueHtml.value = nextHtml;
    try {
      editorRef.value?.setHtml?.(nextHtml);
    } catch (_) {}
    // 放到微任务末尾，避免触发 onChange 立刻回写
    Promise.resolve().then(() => {
      syncingFromOutside.value = false;
    });
  }
);

// 组件销毁时，也及时销毁编辑器，重要！
onBeforeUnmount(() => {
  const editor = editorRef.value;
  if (editor == null) return;

  editor.destroy();
});

// 编辑器回调函数
const handleCreated = (editor) => {
  //   console.log("created", editor);
  editorRef.value = editor; // 记录 editor 实例，重要！
};
const handleChange = (editor) => {
  //   console.log("change:", editor.getHtml());

  if (initFinished && !syncingFromOutside.value) {
    emit("update:modelValue", valueHtml.value);
  }
};
</script>

<style lang="less" scoped></style>
