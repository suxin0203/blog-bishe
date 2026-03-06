<template>
  <n-card>
    <n-grid x-gap="12" :cols="24" style="height: 100%">
      <n-gi :span="4">
        <div class="light-green">
          <n-anchor :show-rail="showRail" :show-background="showBackground">
            <n-anchor-link title="表">
              <n-anchor-link title="基础用法" />
              <n-anchor-link title="忽略间隔" />
              <n-anchor-link title="固定" />
              <n-anchor-link title="滚动到" />
            </n-anchor-link>
            <n-anchor-link title="API" href="#API" />
          </n-anchor>
        </div>
      </n-gi>
      <n-gi :span="20">
        <div class="green">
          <n-flex>
            <n-form
              ref="formRef"
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
                  @change="serchData()"
                />
              </n-form-item>
              <n-form-item label="Token" path="token">
                <n-input
                  v-model:value="formValue.token"
                  placeholder="输入Token"
                  @change="serchData()"
                />
              </n-form-item>
              <n-form-item label="内容" path="content">
                <n-input
                  v-model:value="formValue.content"
                  placeholder="内容"
                  @change="serchData()"
                />
              </n-form-item>
              <n-form-item label="备注" path="remarks">
                <n-input
                  v-model:value="formValue.remarks"
                  placeholder="备注"
                  @change="serchData()"
                />
              </n-form-item>
              <n-form-item>
                <n-button attr-type="button" @click="serchData()">
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
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { getActivityList } from "@/api/api";

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
  limit: 100,
  page: 1,
});

let loading = ref(false);

const pagination = reactive({
  page: 1,
  pageSize: 100,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 30, 50, 100],
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
    width: "15  0px",
    align: "center",
    resizable: true,
  },
  { title: "值", key: "value", width: "50px", align: "center" },
  // { title: "操作", key: "action", width: "100px", align: "center" },
];

const serchData = () => {
  pagination.page = 1;
  formValue.value.page = 1;
  fetchActivityList();
};

const fetchActivityList = async () => {
  loading.value = true;
  let res = await getActivityList(formValue.value);
  data.value = res.data;
  pagination.itemCount = res.pagination.total;
  loading.value = false;
};

onMounted(() => {
  fetchActivityList();
});
</script>

<style scoped>
.n-card {
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
  /* background-color: rgba(0, 128, 0, 0.24); */
  padding: 20px;
}
</style>