<template>
  <div class="main">
    <h1>199平台测试数据可视化</h1>
    <div>
      <n-space>
        <n-button
          strong
          secondary
          type="info"
          :disabled="true"
          @click="startcheck(0)"
        >
          开始测试
        </n-button>
        <n-button
          strong
          secondary
          type="info"
          :disabled="showModal"
          @click="startcheck(1)"
        >
          上次结果
        </n-button>
      </n-space>
    </div>
    <br />
    <div v-show="tableData.length > 0">
      <n-space vertical :size="12">
        <div class="piediv">
          <DoublePie
            :width="'60vw'"
            :height="'40vh'"
            ref="chartRef"
            :optiondata="option"
          />
        </div>
        <n-data-table
          :bordered="false"
          :single-line="false"
          :columns="columns"
          :data="tableData"
          :pagination="pagination"
        />
      </n-space>
    </div>
  </div>
  <n-modal v-model:show="showModal">
    <n-card style="width: 300px; padding: 20px">
      <n-progress
        type="circle"
        :percentage="parseInt(fake.progress * 100)"
        style="width: 200px"
      >
        <div>
          <p>预计: 240s</p>
          <p>进度：{{ parseInt(fake.progress * 100) }}%</p>
        </div>
      </n-progress>
    </n-card>
  </n-modal>
</template>

<script setup>
import { inject, ref, h, defineComponent, reactive } from "vue";
import { NTag, NButton } from "naive-ui";
import axios from "axios";
import DoublePie from "@/components/DoublePie.vue";
import FakeProgress from "fake-progress";

const fake = reactive(
  new FakeProgress({
    timeConstant: 6000, //timeConstant相当于分母，分母越大则加的越少
    autoStart: true, //自动开始
  })
);

let chekcbox = ref(true);
// let percentage = ref(10);
let message = inject("message");
let showModal = ref(false);
let option = ref({ menu1: [], menu2: [] });
let pagination = ref({
  pageSize: 10,
});
const tableData = ref([]);

const createColumns = ({ play }) => {
  return [
    {
      title: "一级目录",
      key: "menu1",
      align: "center",
    },
    {
      title: "二级目录",
      key: "menu2",
      align: "center",
    },
    {
      title: "结果",
      key: "result",
      align: "center",
      render: (row) => {
        if (row.result == 1) {
          return h("span", { style: { color: "green" } }, "通过");
        } else {
          return h(
            NTag,
            {
              type: "error",
              bordered: false,
            },
            {
              default: () => "失败",
            }
          );
        }
      },
    },
    {
      title: "备注",
      key: "remark",
      align: "center",
      render: (row) => {
        if (row.remark == "pass") {
          return h("span", { style: { color: "red" } }, "默认pass");
        } else {
          return h("span", "正常");
        }
      },
    },
    {
      title: "时间",
      key: "creat_time",
      align: "center",
    },
    {
      title: "操作",
      key: "actions",
      align: "center",
      render(row) {
        return h(
          NButton,
          {
            strong: true,
            tertiary: true,
            size: "small",
            onClick: () => play(row),
          },
          { default: () => "单元测试" }
        );
      },
    },
  ];
};

const columns = createColumns({
  play(row) {
    message.info(`未开发`);
  },
});
const urllist = [
  "http://199.suxin23.cn/api/runtest",
  "http://199.suxin23.cn/api/list",
];
const startcheck = async (id) => {
  fake.progress = 0; //每次先归零
  fake.start();
  showModal.value = true;
  chekcbox.value = false;
  let res = await axios.get(urllist[id]);
  tableData.value = res.data;
  // 计算res.data中的数据 每一个menu1中rusult为0的个数 并以{name:menu1,value:count}的形式返回给option.menu1
  //     option.value.menu1 = res.data
  // .filter((item) => item.result == 0)
  // .map((item) => {
  //   return { name: item.menu1, value:
  //     res.data.filter((item2) => item2.menu1 == item.menu1 && item2.result == 0).length };
  // });
  option.value.menu1 = res.data.reduce((result, item) => {
    if (item.result === 0) {
      if (!result[item.menu1]) {
        result[item.menu1] = 1;
      } else {
        result[item.menu1]++;
      }
    }
    return result;
  }, {});

  option.value.menu1 = Object.entries(option.value.menu1).map(
    ([name, value]) => ({
      name,
      value,
    })
  );

  //   // 统计option.menu1中的menu2的个数 并以{name:menu2,value:count}的形式返回给option.menu2
  //   option.value.menu1.map((item) => {
  //     res.data.map((item2) => {
  //       if (item.name == item2.menu1 && item2.result == 0) {
  //         option.value.menu2.push({ name: item2.menu2, value: 1 });
  //       }
  //     });
  //   });
  option.value.menu2 = res.data.reduce((result, item) => {
    if (item.result === 0) {
      if (!result[item.menu1]) {
        result[item.menu1] = {};
      }
      if (!result[item.menu1][item.menu2]) {
        result[item.menu1][item.menu2] = 1;
      } else {
        result[item.menu1][item.menu2]++;
      }
    }
    return result;
  }, {});

  option.value.menu2 = Object.entries(option.value.menu2).reduce(
    (result, [menu1, menu2Counts]) => {
      const menu2Entries = Object.entries(menu2Counts).map(
        ([menu2, value]) => ({
          name: menu2,
          value,
        })
      );
      result.push(...menu2Entries);
      return result;
    },
    []
  );
  // 返回数据
  fake.end();
  chekcbox.value = true;
  setTimeout(() => {
    showModal.value = false;
  }, 500);
};
</script>

<style lang="less" scoped>
.demo-progress .el-progress--line {
  margin-bottom: 15px;
  width: 350px;
}
.demo-progress .el-progress--circle {
  margin-right: 15px;
}
.main {
  width: 100vw;
  padding: 20px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.piediv{
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
}

@media screen and (max-width: 768px) {
  .piediv{
    width: 100vw;
  }
}
</style>
