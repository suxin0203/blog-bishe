<template>
  <div>
    <n-card title="设置" style="margin-bottom: 16px">
      <n-tabs type="line" animated>
        <n-tab-pane name="systemset" tab="系统设置">
          <span>轮播图设置：</span>
          <n-upload
            :action="axios.defaults.baseURL + '/upload/token/lbt_upload'"
            :headers="{ Authorization: 'Bearer ' + token }"
            @finish="handleFinish"
            @remove="handleRemove"
            :default-file-list="fileList"
            list-type="image-card"
            v-if="showimg"
          >
            点击上传
          </n-upload>
          <hr />
          <div style="margin: 50px 0">
            <span>主题切换：</span>
            <n-switch
              :checked-value="1"
              :unchecked-value="0"
              :default-value="darkthem.value"
              @update:value="handleChange"
            />
          </div>
          <hr />
          <div class="notice">
            <span>标题展示开关：</span>
            <n-switch
              :checked-value="1"
              :unchecked-value="0"
              v-model:value="noticesopen"
            />
            <p style="margin: 20px"></p>
            <span>副标题展示开关：</span>
            <n-switch
              :checked-value="1"
              :unchecked-value="0"
              v-model:value="noticecontentopen"
            />
            <p style="margin: 50px"></p>
            <n-form :label-width="80" :model="noticeData" :rules="rules">
              <n-form-item label="标题" path="category.name">
                <n-input
                  v-model:value="noticeData.notice"
                  placeholder="请输入标题"
                />
              </n-form-item>
              <n-form-item label="副标题" path="category.description">
                <n-input
                  v-model:value="noticeData.noticecontent"
                  placeholder="请输入副标题"
                />
              </n-form-item>
            </n-form>
            <n-button type="primary" @click="updateNotice">提交</n-button>
            <!-- <button id="nitaibtn">提交</button> -->
          </div>
        </n-tab-pane>
        <n-tab-pane name="question" tab="动态表单">
          <QuestionNaire />
        </n-tab-pane>
        <n-tab-pane name="d3jsdemo" tab="D3js练习">
          <div class="d3photo">
            <ZhuD3 />
          </div>
        </n-tab-pane>
      </n-tabs>
    </n-card>
  </div>
</template>

<script setup>
import { defineComponent, ref, inject, onMounted, reactive } from "vue";
import ZhuD3 from "@/components/ZhuD3.vue";
import QuestionNaire from "@/components/QuestionNaire.vue";
import { useMessage, useDialog } from "naive-ui";
import { AdminStore } from "@/stores/AdminStore";
import { updateOtherswitch,getSwiperList,deleteSwiperById } from "@/api/api";
import globalThrottle from "@/common/utils";

const adminStore = AdminStore();
const message = inject("message");
const axios = inject("axios");
const dialog = useDialog();
const token = localStorage.getItem("token");

let fileList = ref([]);
let showimg = ref(false);

let darkthem = adminStore.globalOptions.find(
  (item) => item.name === "darkthem"
);
let notices = adminStore.globalOptions.find((item) => item.name === "notice");
let noticecontent = adminStore.globalOptions.find(
  (item) => item.name === "noticecontent"
);
const noticeData = reactive({
  notice: notices.content,
  noticecontent: noticecontent.content,
});

let noticesopen = ref(notices.value);
let noticecontentopen = ref(noticecontent.value);

let rules = {
  notice: [
    { required: true, message: "请输入标题", trigger: "blur" },
    { min: 2, max: 20, message: "长度在 2 到 20 个字符", trigger: "blur" },
  ],
  noticecontent: [
    { required: true, message: "请输入副标题", trigger: "blur" },
    { min: 2, max: 20, message: "长度在 2 到 20 个字符", trigger: "blur" },
  ],
};

onMounted(() => {
  loadlbt();
});

const loadlbt = async () => {
  showimg.value = false;
  // let lunbotu = adminStore.globalOptions.find(
  //   (item) => item.name === "lunbotu"
  // );
  // fileList.value = JSON.parse(lunbotu.content).map((item) => {
  //   return {
  //     id: item.newhref,
  //     name: item.newhref,
  //     status: "finished",
  //     url: item.newhref,
  //   };
  // });

      // 新的轮播图
  const SwiperList = await getSwiperList();
  fileList.value = SwiperList.data;


  showimg.value = true;
};
// 轮播图上传
const handleFinish = ({ file, event }) => {
  // 上传之前在请求标头中添加token和id
  // let url = JSON.parse((event?.target).response).data.href;
  // let msg = JSON.parse((event?.target).response).data.msg;
  message.info("上传成功");
  loadlbt();
};

const handleRemove = async ({ file, fileList }) => {
  // 弹出框确定是否删除
  dialog.warning({
    title: "警告",
    content: "你确定？",
    positiveText: "确定",
    negativeText: "不确定",
    onPositiveClick: () => {
      deleteSwiperById(file.name).then((res) => {
        message.info(res.message);
        loadlbt();
      });
    },
    onNegativeClick: () => {
      loadlbt();
    },
  });
};

const handleChange = (value) => {
  const id = darkthem.id;
  updateOtherswitch(id, { value }).then((res) => {
    const htmlElement = document.querySelector("html");
    value
      ? htmlElement.classList.add("darklight")
      : htmlElement.classList.remove("darklight");
  });
};

const updateNotice = () => {
  const id = notices.id;
  const id2 = noticecontent.id;
  // console.log(noticesopen, noticecontentopen);
  updateOtherswitch(id, {
    content: noticeData.notice,
    value: noticesopen.value,
  }).then((res) => {
    message.info(res.message);
  });
  updateOtherswitch(id2, {
    content: noticeData.noticecontent,
    value: noticecontentopen.value,
  }).then((res) => {
    message.info(res.message);
  });
};
</script>

<style lang="less" scoped>
.d3photo {
  height: 100%;
  width: 100%;
  background: pink;
}
#nitaibtn {
  color: #090909;
  padding: 0.7em 1.7em;
  font-size: 18px;
  border-radius: 0.5em;
  background: #e8e8e8;
  border: 1px solid #e8e8e8;
  transition: all 0.3s;
  box-shadow: 6px 6px 12px #c5c5c5, -6px -6px 12px #ffffff;
}

#nitaibtn:active {
  color: #666;
  box-shadow: inset 4px 4px 12px #c5c5c5, inset -4px -4px 12px #ffffff;
}
</style>
