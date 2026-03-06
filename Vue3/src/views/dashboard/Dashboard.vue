<template>
  <div class="main-panel">
    <div class="menu">
      <n-space vertical>
        <!-- <n-switch v-model:value="collapsed" /> -->
        <n-layout has-sider>
          <n-layout-sider
            bordered
            collapse-mode="width"
            :collapsed-width="64"
            :width="200"
            :collapsed="collapsed"
            show-trigger
            @collapse="collapsed = true"
            @expand="collapsed = false"
          >
            <n-menu
              :collapsed="collapsed"
              :collapsed-width="64"
              :collapsed-icon-size="22"
              :options="menuOptions"
              :expand-icon="expandIcon"
              @update:value="handleUpdateValue"
            />
          </n-layout-sider>
          <n-layout>
            <div id="maincontent">
              <n-card>
                <div class="usermain">
                  <div>
                    <n-avatar
                      round
                      :src="
                        adminStore.avatar_url ||
                        'http://47.115.219.151:7031/upload/385877425537093.png'
                      "
                      size="large"
                    />
                    <span style="margin-left: 10px"
                      >{{ adminStore.nickname }}
                      {{ adminStore.is_root ? "👑" : "" }}
                    </span>
                  </div>
                  <div>
                    <n-icon
                      size="28"
                      :component="AddCircleOutline"
                      @click="addArticle"
                    />
                    <n-divider vertical />
                    <n-button
                      strong
                      secondary
                      round
                      type="error"
                      size="small"
                      @click="toLogout()"
                    >
                      登出
                    </n-button>
                  </div>
                </div>
              </n-card>
              <hr />
              <div class="content">
                <router-view> </router-view>
              </div>
            </div>
          </n-layout>
        </n-layout>
      </n-space>
    </div>
  </div>
</template>

<script setup>
import { AdminStore } from "@/stores/AdminStore";
import { reactive, ref, inject, h, defineComponent } from "vue";
import { RouterLink } from "vue-router";
import { router, routes } from "@/common/router.js";
import { CaretDownOutline } from "@vicons/ionicons5";
import { NIcon } from "naive-ui";
import {
  BookOutline as BookIcon,
  PersonOutline as PersonIcon,
  HomeOutline as HomeIcon,
  CloseCircleOutline,
  AddCircleOutline,
  LogOutOutline,
  LibraryOutline,
  EllipsisHorizontalCircle,
} from "@vicons/ionicons5";

const axios = inject("axios");
const message = inject("message");
const adminStore = AdminStore();
const collapsed = ref(false);

function renderIcon(icon) {
  return () => h(NIcon, null, { default: () => h(icon) });
}

const menuOptions = [
  {
    label: () =>
      h(
        RouterLink,
        {
          to: {
            name: "user",
          },
        },
        { default: () => "用户" }
      ),
    key: "go-user",
    icon: renderIcon(PersonIcon),
  },
  {
    label: () =>
      h(
        RouterLink,
        {
          to: {
            name: "article",
          },
        },
        { default: () => "文章" }
      ),
    key: "go-article",
    icon: renderIcon(BookIcon),
  },
  {
    label: () =>
      h(
        RouterLink,
        {
          to: {
            name: "category",
          },
        },
        { default: () => "分类" }
      ),
    key: "go-category",
    icon: renderIcon(LibraryOutline),
  },
  {
    label: () =>
      h(
        RouterLink,
        {
          to: {
            name: "setmessage",
          },
        },
        { default: () => "留言" }
      ),
    key: "go-setmessage",
    icon: renderIcon(PersonIcon),
  },
  {
    label: () =>
      h(
        RouterLink,
        {
          to: {
            name: "otherset",
          },
        },
        { default: () => "其他" }
      ),
    key: "updataother",
    icon: renderIcon(EllipsisHorizontalCircle),
  },
  // {
  //   label: "退出",
  //   key: "logout",
  //   icon: renderIcon(LogOutOutline),
  //   // onClick: toLogout,
  // },
  {
    label: () =>
      h(
        RouterLink,
        {
          to: {
            name: "home",
          },
        },
        { default: () => "主页" }
      ),
    key: "go-home",
    icon: renderIcon(HomeIcon),
  },
  {
    label: "root",
    key: "dance-dance-dance",
    icon: renderIcon(PersonIcon),
    disabled: !adminStore.is_root,
    children: [
      {
        label: () =>
          h(
            RouterLink,
            {
              to: {
                name: "show",
              },
            },
            { default: () => "大屏展示" }
          ),
        key: "show",
        icon: renderIcon(CloseCircleOutline),
        // disabled: true,
      },
      {
        label: () =>
          h(
            RouterLink,
            {
              to: {
                name: "table",
              },
            },
            { default: () => "数据列表" }
          ),
        key: "table",
        icon: renderIcon(CloseCircleOutline),
        // disabled: true,
      },
      {
        label: () =>
          h(
            RouterLink,
            {
              to: {
                name: "check199",
              },
            },
            { default: () => "199平台" }
          ),
        key: "check199",
        icon: renderIcon(CloseCircleOutline),
      },
      {
        label: () =>
          h(
            RouterLink,
            {
              to: {
                name: "leavemessage",
              },
            },
            { default: () => "词云图" }
          ),
        key: "leavemessage",
        icon: renderIcon(CloseCircleOutline),
      },
    ],
  },
];

const handleUpdateValue = (key, item) => {
  if (key === "logout") {
    toLogout();
  }
};

const expandIcon = () => {
  return h(NIcon, null, { default: () => h(CaretDownOutline) });
};

const toLogout = (url) => {
  router.push(url ? url : "/");
  //清理token
  adminStore.delToken();
  message.info("退出成功");
};

const addArticle = () => {
  router.push("/dashboard/article");
};
</script>

<style lang="less" scoped>
.main-panel {
  display: flex;
  height: 100vh;
  width: 100vw;
  background-color: aliceblue;
}
.menu {
  // width: 200px;
  width: 100vw;
  height: 100vh;
  padding: 10px;
  box-sizing: border-box;
  overflow: hidden;

  border-right: solid 1px gray;
  :deep(.n-anchor-link__title) {
    text-align: center;
    margin-top: 20px;
    font-size: 18px;
  }
}
#maincontent {
  flex: 1;
  padding: 0 20px;
  height: 100vh;
  overflow: auto;
  min-width: 320px;
  .usermain {
    display: flex;
    align-items: center;
    justify-content: space-between;
    span {
      font-size: 18px;
      font-weight: 900;
    }
    div {
      display: flex;
      align-items: center;
    }
  }
  .content {
    flex: 1;
    overflow-y: auto;
    box-sizing: border-box;
    height: calc(100vh - 150px);
  }
}

@media screen and (max-width: 600px) {
  .main-panel {
    display: block;
  }

  .menu {
    // width: 100vw;
    // height: 110px;
    padding: 0px;
    // :deep(.n-anchor-link__title) {
    //   text-align: left;
    //   margin-top: 1px;
    //   font-size: 16px;
    // }
  }
  #maincontent {
    padding: 0 2px;
  }

  .content {
    // padding: 10px;
    box-sizing: border-box;
  }
}
</style>
