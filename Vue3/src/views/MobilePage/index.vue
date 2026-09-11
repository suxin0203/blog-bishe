<template>
  <n-card id="main-card">
    <n-grid x-gap="12" :cols="24" style="height: 100%" class="main_body">
      <n-gi :span="4" class="menu_list">
        <div class="light-green">
          <n-anchor :show-rail="showRail" :show-background="showBackground">
            <n-anchor-link title="签到">
              <n-anchor-link title="霸王茶坤" />
              <n-anchor-link title="七点五圣水" />
              <n-anchor-link title="幻师签到" />
            </n-anchor-link>
            <n-anchor-link title="抽奖">
              <n-anchor-link title="邮生活ysh" />
              <n-anchor-link title="茶百道cbd" />
            </n-anchor-link>
            <n-anchor-link title="抢领">
              <n-anchor-link title="塔斯汀tst" />
              <n-anchor-link title="茶百道cbd" />
            </n-anchor-link>
          </n-anchor>
        </div>
      </n-gi>
      <n-gi :span="6" class="form_list">
        <div class="green">
          <h2>代抢填写(填错无效)</h2>
          <n-form
            ref="formRef"
            :rules="rules1"
            :model="model"
            label-placement="top"
            label-width="auto"
            require-mark-placement="right-hanging"
          >
            <n-form-item label="项目" path="name">
              <n-select
                v-model:value="model.name"
                placeholder="Select"
                :options="generalOptions"
              />
            </n-form-item>
            <n-form-item label="Token（Qm-User-Token）" path="token">
              <n-input
                v-model:value="model.token"
                placeholder="例：IUZLN0ltKzx2dlOjoDo4AgwB1dQnsEyzVgczML"
              />
            </n-form-item>
            <n-form-item label="账号信息（timestamp）" path="timestamp">
              <n-input
                v-model:value="model.timestamp"
                placeholder="例：1722050284170"
                type="number"
              />
            </n-form-item>
            <n-form-item label="账号信息（signature）" path="signature">
              <n-input
                v-model:value="model.signature"
                placeholder="例：565524EE4DCE62D6BABC09958C6D4FE5"
              />
            </n-form-item>
            <n-form-item label="账号信息（version）" path="version">
              <n-input
                v-model:value="model.version"
                placeholder="例：38"
                type="number"
              />
            </n-form-item>
            <n-form-item label="账号信息（data）" path="data">
              <n-input
                v-model:value="model.data"
                placeholder="例：MoLhdoWI6V5+Ppnt3lRYZeZGE6Ggd0tofG...="
              />
            </n-form-item>
            <n-form-item label="留言" path="remarks">
              <n-input
                v-model:value="model.remarks"
                placeholder="如果有留言，请在这里输入"
                type="textarea"
                :autosize="{
                  minRows: 2,
                  maxRows: 5,
                }"
              />
            </n-form-item>
            <!-- <n-form-item label="Multiple Select" path="multipleSelectValue">
              <n-select
                v-model:value="model.multipleSelectValue"
                placeholder="Select"
                :options="generalOptions"
                multiple
              />
            </n-form-item> -->
            <!-- <n-form-item label="Datetime" path="datetimeValue">
              <n-date-picker
                v-model:value="model.datetimeValue"
                type="datetime"
              />
            </n-form-item> -->
            <!-- <n-form-item label="Switch" path="switchValue">
              <n-switch v-model:value="model.switchValue" />
            </n-form-item> -->
            <div style="display: flex; justify-content: flex-end">
              <n-button round type="primary" @click="handleValidateButtonClick">
                提交
              </n-button>
            </div>
          </n-form>
          <n-card title="提交记录" style="margin: 20px 0">
            <p>无</p>
            <p v-for="log in commoitLog" :key="log.content">
              {{ log.data.content }}
            </p>
          </n-card>
        </div>
      </n-gi>
      <n-gi :span="14" class="table_list">
        <div class="light-green">
          <n-flex>
            <n-form
              ref="formRef1"
              inline
              label-placement="left"
              label-width="auto"
              :model="formValue"
              :rules="rules"
            >
              <n-form-item label="活动名称" path="name">
                <n-input
                  v-model:value="formValue.name"
                  placeholder="输入活动名称"
                />
              </n-form-item>
              <n-form-item label="Token" path="token">
                <n-input
                  v-model:value="formValue.token"
                  placeholder="输入Token"
                />
              </n-form-item>
              <n-form-item label="内容" path="content">
                <n-input v-model:value="formValue.content" placeholder="内容" />
              </n-form-item>
              <n-form-item label="备注" path="remarks">
                <n-input v-model:value="formValue.remarks" placeholder="备注" />
              </n-form-item>
              <n-form-item>
                <n-button attr-type="button" @click="fetchActivityList">
                  搜索
                </n-button>
              </n-form-item>
            </n-form>
            <n-spin :show="loading">
              <n-data-table
                style="height: calc(100vh - 152px)"
                remote
                :max-height="'calc(100vh - 240px)'"
                :bordered="false"
                :single-line="false"
                :columns="columns"
                :data="data"
                :pagination="pagination"
                striped
              />
            </n-spin>
          </n-flex>
        </div>
      </n-gi>
    </n-grid>
  </n-card>
  <n-float-button
    v-if="false"
    position="absolute"
    type="primary"
    menu-trigger="hover"
    :right="50"
    :bottom="100"
  >
    <n-icon>
      <CashIcon />
    </n-icon>
    <template #menu>
      <n-float-button shape="square" type="primary">
        <n-icon>
          <CashIcon />
        </n-icon>
      </n-float-button>
      <n-float-button>
        <n-icon>
          <CashIcon />
        </n-icon>
      </n-float-button>
      <n-float-button>
        <n-icon>
          <CashIcon />
        </n-icon>
      </n-float-button>
    </template>
  </n-float-button>
</template>

<script setup>
import { ref, reactive, onMounted, inject } from "vue";
import { getActivityListSign, addActivity } from "@/api/api";
import { CashOutline as CashIcon } from "@vicons/ionicons5";
import { useMessage, useDialog } from "naive-ui";
const message = inject("message");
const dialog = useDialog();
// State variables
const showRail = ref(true);
const showBackground = ref(true);

const data = ref([]);
const formRef = ref(null);
const formValue = ref({
  name: "",
  token: "",
  content: "",
  remarks: "",
  limit: 50,
  page: 1,
});

let loading = ref(false);

const pagination = reactive({
  page: 1,
  pageSize: 50,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 30, 40, 50],
  onChange: (page) => {
    pagination.page = page;
    formValue.value.page = page;
    fetchActivityList();
  },
  onUpdatePageSize: (pageSize) => {
    pagination.page = 1;
    pagination.pageSize = pageSize;
    formValue.value.page = 1;
    formValue.value.limit = pageSize;
    fetchActivityList();
  },
});

const rules = {
  name: [{ required: false, message: "请输入活动名称", trigger: "blur" }],
  token: [{ required: false, message: "请输入Token", trigger: "blur" }],
  content: [{ required: false, message: "请输入内容", trigger: "blur" }],
  remarks: [{ required: false, message: "请输入备注", trigger: "blur" }],
};

let model = ref({
  name: "",
  content: "",
  remarks: "",
});

let generalOptions = ref([
  { label: "霸王茶姬_代抢", value: "霸王茶姬_代抢" },
  { label: "茉莉奶白_代抢", value: "茉莉奶白_代抢" },
  { label: "沪上阿姨_代抢", value: "沪上阿姨_代抢" },
  { label: "蜜雪冰城_代抢", value: "蜜雪冰城_代抢" },
  { label: "七点五圣水sign", value: "七点五矿泉水sign", disabled: true },
  { label: "霸王茶坤sign", value: "霸王茶坤sign", disabled: true },
]);

const rules1 = {
  name: [{ required: true, message: "请选择活动项目", trigger: "blur" }],
  // token必填且长度为64
  token: [
    { required: true, message: "请输入Token", trigger: "blur" },
    { min: 64, max: 64, message: "请检查Token是否完整", trigger: "blur" },
  ],
  timestamp: [
    { required: true, message: "请输入timestamp", trigger: "blur" },
    { min: 13, max: 13, message: "请检查timestamp是否完整", trigger: "blur" },
  ],
  signature: [
    { required: true, message: "请输入signature", trigger: "blur" },
    { min: 32, max: 32, message: "请检查signature是否完整", trigger: "blur" },
  ],
  // version必须是数字
  version: [{ required: true, message: "请输入version", trigger: "blur" }],
  data: [{ required: true, message: "请输入data", trigger: "blur" }],
  content: [{ required: false, message: "请输入内容", trigger: "blur" }],
  remarks: [{ required: false, message: "请输入备注", trigger: "blur" }],
};

const columns = [
  { title: "ID", key: "id", width: "80px", align: "center" },
  {
    title: "项目",
    key: "name",
    width: "150px",
    align: "center",
    resizable: true,
  },
  {
    title: "Token",
    key: "token",
    width: "400px",
    resizable: true,
    //
    ellipsis: { tooltip: { placement: "top", width: "40vw" } },
  },
  {
    title: "内容",
    key: "content",
    resizable: true,
    ellipsis: { tooltip: { placement: "top", width: "30vw" } },
    expandable: true,
  },
  { title: "时间", key: "created_at", width: "200px" },
  {
    title: "注释",
    key: "remarks",
    width: "120px",
    align: "center",
    resizable: true,
  },
  { title: "值", key: "value", width: "50px", align: "center" },
  // { title: "操作", key: "action", width: "100px", align: "center" },
];

let commoitLog = ref([]);

const addActivityfun = async (data) => {
  let res = await addActivity(data);
  commoitLog.value.push(res);
  // 弹窗提示 message
  message.info(res.message);
  // 刷新列表
  fetchActivityList();
  // 重置表单
  model.value = {
    name: "",
    token: "",
    timestamp: "",
    signature: "",
    version: "",
    data: "",
    content: "",
    remarks: "",
  };
};

const handleValidateButtonClick = async () => {
  // 校验表单
  formRef.value.validate().then(async (valid) => {
    if (valid) {
      dialog.warning({
        title: "提示",
        content: `确认选择项目：[${model.value.name}]？`,
        positiveText: "确定",
        negativeText: "选错了",
        onPositiveClick: () => {
          model.value.content = `${model.value.timestamp}|${model.value.signature}|${model.value.version}|${model.value.data}`;
          addActivityfun(model.value);
        },
      });
    } else {
    }
  });
};

const fetchActivityList = async () => {
  loading.value = true;
  let res = await getActivityListSign(formValue.value);
  data.value = res.data;
  pagination.itemCount = res.pagination.total;
  loading.value = false;
};

onMounted(() => {
  fetchActivityList();
});
</script>

<style scoped lang="less">
#main-card {
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  /* padding: 20px; */
  height: 100vh;
  width: 100vw;
}
.light-green {
  height: calc(100% - 40px);
  background-color: rgba(0, 128, 0, 0.12);
  padding: 20px;
}
.green {
  height: calc(100% - 40px);
  background-color: rgba(0, 128, 0, 0.05);
  padding: 20px;
  overflow-y: auto;
}

@media screen and (max-width: 600px) {
  #main-card {
    overflow-y: auto;
    .main_body {
      .menu_list {
        display: none !important;
      }
      .form_list {
        // display: block;
        grid-column: span 24 / span 24 !important;
        // width: 100vw;
        .green {
          overflow-y: auto;
        }
      }
      .table_list {
        display: none !important;
      }
    }
  }
}
</style>