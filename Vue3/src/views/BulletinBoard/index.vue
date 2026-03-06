<template>
  <n-spin :show="loading">
    <template #description> 正在处理数据中... </template>
    <n-card id="main" loading="{{ loading }}">
      <n-grid x-gap="12" :cols="24" style="height: calc(100vh-40px)">
        <n-gi :span="6">
          <div class="light-green">
            <n-flex align="center" justify="center" style="height: 100%">
              <Linear :height="'30%'" :width="'100%'" :optionData="data" />
              <Bar :height="'30%'" :width="'100%'" :optionData="data" />
              <Pie :height="'30%'" :width="'100%'" :optionData="data" />
            </n-flex>
          </div>
        </n-gi>
        <n-gi :span="12">
          <div class="green">
            <n-flex justify="space-between" class="title-counts">
              <div
                class="title-counts-item"
                v-for="item in titleCounts"
                :key="item.title"
              >
                <n-text type="h2">{{ item.count }}</n-text>
                <hr />
                <n-text>{{ item.title }}</n-text>
              </div>
            </n-flex>
            <ChinaMap :height="'calc(100vh - 540px)'" :width="'100%'" />
            <div class="datatable">
              <n-table :bordered="false" :single-line="false">
                <thead>
                  <tr>
                    <th style="width: 80px">项目名称</th>
                    <th>次数统计</th>
                    <th>热门时间</th>
                    <th>今日事件</th>
                    <th>异常情况</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in data.data" :key="item.id">
                    <td>{{ item.name }}</td>
                    <td>
                      <n-tooltip placement="top-center" :style="{ maxWidth: '600px' }">
                        <template #trigger>
                          <n-text>{{ item.content.slice(0, 180) }}...</n-text>
                        </template>
                        <div>{{ item.content }}</div>
                      </n-tooltip>
                      </td>
                    <td>{{ item.created_at }}</td>
                    <td>{{ item.remarks }}</td>
                    <td>{{ !item.value }}</td>
                  </tr>
                </tbody>
              </n-table>
            </div>
          </div>
        </n-gi>
        <n-gi :span="6">
          <div class="light-green">
            <n-flex align="center" justify="center" style="height: 100%">
              <!-- <Pie :height="'30%'" :width="'100%'" :optionData="data" /> -->
              <Graph :height="'30%'" :width="'100%'" :optionData="data" />
              <Bar :height="'30%'" :width="'100%'" :optionData="data" />
              <Linear :height="'30%'" :width="'100%'" :optionData="data" />
            </n-flex>
          </div>
        </n-gi>
      </n-grid>
    </n-card>
  </n-spin>
</template>

<script scoped setup>
import { ref, reactive, onMounted } from "vue";
import { getActivityList } from "@/api/api";
import { router } from "@/common/router";
import Linear from "@/views/BulletinBoard/components/Line.vue";
import Bar from "@/views/BulletinBoard/components/Bar.vue";
import Pie from "@/views/BulletinBoard/components/Pie.vue";
import ChinaMap from "./components/ChinaMap.vue";
import Graph from "@/views/BulletinBoard/components/Graph.vue";
// import MenuTest from "./components/MenuTest.vue";

let loading = ref(false);

const formValue = ref({
  name: "",
  token: "",
  content: "",
  remarks: "",
  limit: 1000,
  page: 6,
});

let titleCounts = ref([
  {
    title: "项目类型",
    count: 16,
  },
  {
    title: "总次数",
    count: 5357,
  },
  {
    title: "参与人数",
    count: 986,
  },
  {
    title: "参与城市",
    count: 59,
  },
  {
    title: "今日事件",
    count: 26,
  },
]);

const data = ref([]);

const fetchActivityList = async () => {
  loading.value = true;
  let res = await getActivityList(formValue.value);
  if (res.code === 401) {
    // router.push("/login");
    setTimeout(() => {
      router.push("/login");
    }, 3000);
    return;
  }
  console.log(res);
  data.value = res;
  loading.value = false;
  // 运行统计title函数
  titleCountsData();
};

// titleCounts数据统计
const titleCountsData = () => {
  // 项目类型
  let projectType = data.value.data.map((item) => item.name);
  let projectTypeSet = new Set(projectType);
  let projectTypeArr = Array.from(projectTypeSet);
  titleCounts.value[0].count = projectTypeArr.length;

  // 总次数
  titleCounts.value[1].count = data.value.pagination.total;

  // 参与人数
  let people = data.value.data.map((item) => item.content);
  let peopleSet = new Set(people);
  let peopleArr = Array.from(peopleSet);
  titleCounts.value[2].count = peopleArr.length;

  // 参与城市
  let city = data.value.data.map((item) => item.remarks);
  let citySet = new Set(city);
  let cityArr = Array.from(citySet);
  titleCounts.value[3].count = cityArr.length;

  // 今日事件
  let today = new Date();
  let todayStr = `${
    today.getMonth() + 1
  }/${today.getDate()}/${today.getFullYear()}`;
  let todayArr = data.value.data.filter((item) => {
    let date = item.created_at.split(",")[0].trim();
    return date === todayStr;
  });
  titleCounts.value[4].count = todayArr.length;
};

onMounted(() => {
  // loading.value = true;
  fetchActivityList();
  // loading.value = false;
});
</script>

<style scoped lang="less">
#main {
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  /* padding: 20px; */
  height: 100vh;
  width: 100vw;
  .title-counts {
    padding: 20px;
    height: 120px;

    .title-counts-item {
      width: 15%;
      border-radius: 8px;
      text-align: center;
      font-size: 20px;
      font-weight: 600;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background-color: rgba(96, 185, 181, 0.2);
      .n-text {
        color: #3a8486;
      }
      hr {
        width: 50%;
        margin: 0 auto;
        border: 1px solid #e8e8e8;
      }
    }
  }
  .datatable {
    // padding: 20px;
    height: 330px;
    overflow: auto;
    background-color: rgba(255, 255, 255, 0) !important;
    // 隐藏滚动条
    &::-webkit-scrollbar {
      display: none;
    }
    table {
      background-color: rgba(255, 255, 255, 0) !important;
    }
    thead {
      background-color: rgba(255, 255, 255, 0.4) !important;
    }
    tbody {
      // 透明背景
      background-color: rgba(255, 255, 255, 0) !important;
    }
    th {
      background-color: rgba(255, 255, 255, 0) !important;
    }
    tr {
      background-color: rgba(255, 255, 255, 0) !important;
    }
    td {
      background-color: rgba(255, 255, 255, 0) !important;
    }
  }
}
.light-green {
  height: 100%;
  background-color: rgba(0, 128, 0, 0.12);
  border-radius: 6px;
}
.green {
  height: 100%;
  background-color: rgba(0, 128, 0, 0.24);
  border-radius: 6px;
}
</style>