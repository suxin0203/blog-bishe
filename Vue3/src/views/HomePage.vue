<template>
  <div class="lbt">
    <MyHeaderVue
      :setstyle="true"
      :options="categoryOptions"
      @updateKeyword="searchKeyword"
      @updateCategory="searchCategory"
      v-model:keyword="pageInfo.keyword"
      v-model:category_id="pageInfo.category_id"
    />
    <MyCarouselVue />
    <div class="main">
      <n-divider />
      <!--头部↑-->
      <div class="main-body">
        <div class="main-body-l">
          <div class="card" @click="toMsg()">
            <div class="bg">
              <span @click="toMsg()">点此留言版</span>
              <span>广告位招租...</span>
            </div>
            <div class="blob"></div>
          </div>
          <div v-if="show">
            <n-card
              v-for="i of pageInfo.pageSize"
              :key="i"
              style="margin-top: 20px"
            >
              <n-skeleton :width="180" :sharp="false" size="medium" />
              <div style="margin: 10px 0">
                <n-skeleton text :repeat="1" />
                <n-skeleton text style="width: 60%" />
              </div>
              <n-space justify="space-between">
                <n-skeleton :width="80" :sharp="false" size="mini" />
                <n-skeleton :width="160" :sharp="false" size="mini" />
              </n-space>
            </n-card>
          </div>
          <div v-else>
            <n-card
              content-style="color: #888888"
              hoverable
              v-for="blog in blogListInfo"
              :key="blog.id"
              :title="blog.title"
              class="main-body-l-item"
              :class="{ 'highlight-blog': blog.status === 1 }"
              @click="toDetail(blog)"
            >
              <blockquote class="contentStyle">
                <code>
                  {{ blog.content + "..." }}
                </code>
              </blockquote>
              <template #footer>
                <n-space justify="space-between">
                  <n-space>
                    <n-icon :component="CodeSlashOutline" size="20" />
                    <span>
                      {{ categoryMap[blog.category_id] }}
                    </span>
                  </n-space>
                  <n-space>
                    <n-icon :component="TimeOutline" size="20" />
                    <span> {{ blog.created_at }} </span>
                  </n-space>
                </n-space>
              </template>
            </n-card>
          </div>
        </div>

        <div class="main-body-r">
          <div class="stk">
            <n-space vertical class="animate__animated animate__fadeInRight">
              <n-card hoverable>
                <div class="myavatar">
                  <n-avatar
                    round
                    size="60"
                    class="animate__animated animate__rotateIn"
                    :src="displayAvatarUrl"
                    @click="gouser"
                  />
                  <p>{{ displayUsername }}</p>
                  <n-button type="primary" @click="token ? logout() : gouser()">
                    {{ token ? "注销" : "登录" }}</n-button
                  >
                </div>
              </n-card>
              <n-card
                title="🏷️ 分类"
                hoverable
                v-if="categoryOptions.length > 0"
              >
                <n-space>
                  <n-tag
                    :bordered="false"
                    type="success"
                    v-for="categoryname in categoryOptions"
                    :key="categoryname.value"
                  >
                    {{ categoryname.label }}
                  </n-tag>
                </n-space>
              </n-card>
              <n-card title="🔗 友链" hoverable v-if="friendUrl.length > 0">
                <n-space>
                  <a v-for="i in friendUrl" :key="i.link_id" :href="i.blog_url">
                    <n-popover trigger="hover">
                      <template #trigger>
                        <n-button quaternary type="primary">
                          {{ i.blog_name }}
                        </n-button>
                      </template>
                      <span> {{ i.blog_theme }}</span>
                    </n-popover>
                  </a>
                </n-space>
              </n-card>
              <n-card
                title="📖 网易热评"
                embedded
                :bordered="false"
                hoverable
                v-if="musicSwitch.url"
              >
                <n-space>
                  <n-gradient-text :size="16" type="success">
                    {{ musicSwitch.name }}
                  </n-gradient-text>
                  <span>
                    <n-tag :bordered="false" type="info"
                      >{{ musicSwitch.nickname }}：</n-tag
                    >
                    {{ musicSwitch.content }}</span
                  >
                  <n-space justify="space-around">
                    <n-button
                      :loading="loadingRef"
                      type="primary"
                      ghost
                      size="small"
                      :render-icon="renderIcon"
                      @click="getMusicComment()"
                    >
                      下一条
                    </n-button>
                    <n-button
                      :loading="loadingRef"
                      type="primary"
                      ghost
                      size="small"
                      :render-icon="MusicalNotesOutlineIcon"
                      @click="playmusic(musicSwitch.url)"
                    >
                      听此曲
                    </n-button>
                  </n-space>
                </n-space>
              </n-card>
              <MusicPlayer :musicData="musicSwitch" v-show="showMyaudio" />
              <!-- <n-pagination
                style="width: 100%"
                v-model:page="pageInfo.page"
                :page-count="pageInfo.totalPages"
                simple
              /> -->
            </n-space>
          </div>
        </div>
      </div>
      <n-back-top :right="50" :bottom="100" />

      <n-pagination
        class="fenye"
        v-model:page="pageInfo.page"
        v-model:page-count="pageInfo.totalPages"
        :default-page-size="5"
        :page-sizes="[
          { label: '5 / 页', value: 5 },
          { label: '10 / 页', value: 10 },
          { label: '20 / 页', value: 20 },
          { label: '50 / 页', value: 50 },
        ]"
        show-size-picker
        @update:page-size="changePageSize"
        @update:page="getArtiles()"
      />
      <n-divider />
    </div>

    <MyFooterVue />
  </div>
</template>

<script setup>
import { reactive, ref, inject, onMounted, computed, h } from "vue";
import { router, routes } from "@/common/router.js";
import MyFooterVue from "@/components/MyFooter.vue";
import MyHeaderVue from "@/components/MyHeader.vue";
import MyCarouselVue from "@/components/MyCarousel.vue";
import { AdminStore } from "@/stores/AdminStore";
import { NIcon } from "naive-ui";
import axios from "axios";
import MusicPlayer from "@/components/HomeComponents/MusicPlayer.vue";
import {
  CodeSlashOutline,
  TimeOutline,
  ReloadOutline,
  MusicalNotesOutline,
} from "@vicons/ionicons5";

import {
  getCategoryList,
  getArticleList,
  getOtherswitch,
  getMusicComments,
  getLinksList,
} from "@/api/api";

const adminStore = AdminStore();
const { avatar_url, nickname, username, is_root, token } = adminStore;
const categoryOptions = ref([]); //分类列表
const categoryMap = ref({}); //分类列表
const blogListInfo = ref([]);
const show = ref(true);
const animationClass = ref("");
const musicSwitch = ref({});
const showMyaudio = ref(false);
const renderIcon = () => {
  return h(NIcon, null, {
    default: () => h(ReloadOutline),
  });
};
const MusicalNotesOutlineIcon = () => {
  return h(NIcon, null, {
    default: () => h(MusicalNotesOutline),
  });
};
const loadingRef = ref(false);
const displayUsername = ref(
  (nickname || username || "未登录") + (is_root ? "👑" : "")
);
const displayAvatarUrl = ref(
  avatar_url || "https://q2.qlogo.cn/headimg_dl?spec=100&dst_uin=208082474"
);
const friendUrl = ref([]);

onMounted(async () => {
  await getCategories();
  getArtiles();
  getFriendslink();
  getMusicComment();
});

const gohome = () => {
  router.push("/"); //跳转到首页
};

const toMsg = () => {
  router.push("/leavemessage"); //跳转到留言页面
};

// 获取友链
const getFriendslink = async () => {
  let res = await getLinksList();
  friendUrl.value = res.data;
};

// 播放音乐
const playmusic = (url) => {
  loadingRef.value = true;
  showMyaudio.value = true;
  setTimeout(() => {
    loadingRef.value = false;
  }, 3000);
  // let audio = document.getElementById("Myaudio");
  // audio.src = url;
  // audio.play();
};
const logout = () => {
  // delToken
  adminStore.delToken();
  console.log("退出登录");
  window.location.reload();
};
// 获取音乐评论
const getMusicComment = async () => {
  loadingRef.value = true;
  let res = await getMusicComments();
  musicSwitch.value = res.data;
  loadingRef.value = false;
  // axios.get('https://api.uomg.com/api/comments.163?format=json').then(res => console.log(res)).catch(error => console.log(error))
};
// 获取全部分类
const getCategories = async () => {
  let res = await getCategoryList();
  categoryOptions.value = res.data.map((item) => {
    return {
      label: item.name,
      value: item.id,
    };
  });
  categoryOptions.value.unshift({
    label: "全部分类",
    value: 0,
  });

  // 预处理数据：将分类选项转换为以 category_id 为键，label 为值的对象
  categoryOptions.value.forEach((item) => {
    categoryMap.value[item.value] = item.label;
  });
};

//跳转到详情页
const toDetail = (blog) => {
  router.push({ path: "/detail", query: { id: blog.id } });
};

//跳转到/dashboard/user
const gouser = () => {
  adminStore.token ? router.push("/dashboard/user") : router.push("/login");
};

const changePageSize = (pageSize) => {
  pageInfo.pageSize = pageSize;
  getArtiles(1);
}; //改变每页显示条数

const pageInfo = reactive({
  page: 1, //当前页码
  pageSize: 10, //每页显示条数
  totalPages: 1, //总页数
  count: 0, //总条数
  keyword: "", //搜索关键字
  category_id: 0, //  分类id
});

// 获取博客列表
const getArtiles = async (page) => {
  show.value = true;
  // 分页 搜索 分类 默认第一页
  if (page === 1) {
    pageInfo.page = page;
  }
  pageInfo.category_id === 0 ? delete pageInfo.category_id : "";
  getArticleList(pageInfo).then((res) => {
    blogListInfo.value = res.data;
    pageInfo.totalPages = res.pagination.totalPages;
    pageInfo.count = res.pagination.total;
    show.value = false;
  });
};

//搜索分类
const searchCategory = (category_id) => {
  // console.log(category_id);
  category_id === 0
    ? delete pageInfo.category_id
    : (pageInfo.category_id = category_id);
  getArtiles(1); //搜索默认第一页
};

// 搜索关键词
const searchKeyword = (keyword) => {
  // console.log(keyword);
  pageInfo.keyword = keyword;
  getArtiles(1); //搜索默认第一页
};
</script>

<style lang="less" scoped>
.contentStyle {
  border-left: 8px solid #18a058;
  padding: 10px;
  margin: 10px 0;
  background-color: #f1f1f1;
}
// .header2 {
//   background-color: #fff;
//   a {
//     color: gray !important;
//   }
// }
.lbt {
  position: relative;
  width: 100%;
  height: 100%;
  background: linear-gradient(#ffffff 30%, #eee 40%);
}
.main {
  width: 1200px;
  margin: 0 auto;
  // background-color: pink;
  &-body {
    display: flex;
    justify-content: space-between;
    &-l {
      .card {
        position: relative;
        // width: 200px;
        width: 100%;
        height: 60px;
        border-radius: 7px;
        z-index: 10;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        box-shadow: 5px 5px 15px #bebebe, -5px -5px 15px #ffffff;
      }

      .bg {
        position: absolute;
        top: 4px;
        left: 4px;
        // width: 190px;
        width: calc(100% - 8px);
        height: 52px;
        z-index: 2;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(24px);
        border-radius: 5px;
        overflow: hidden;
        outline: 2px solid white;
        font-size: 18px;
        cursor: pointer;
        // padding: 0 20px;
        display: flex;
        align-items: center;
        justify-content: space-around;
      }

      .blob {
        position: absolute;
        z-index: 1;
        top: 50%;
        left: 50%;
        width: 100%;
        height: 60px;
        border-radius: 50%;
        background-color: #18a058;
        opacity: 1;
        filter: blur(12px);
        animation: blob-bounce 5s infinite ease;
      }

      @keyframes blob-bounce {
        0% {
          transform: translate(-100%, -100%) translate3d(0, 0, 0);
        }

        25% {
          transform: translate(-100%, -100%) translate3d(100%, 0, 0);
        }

        50% {
          transform: translate(-100%, -100%) translate3d(100%, 100%, 0);
        }

        75% {
          transform: translate(-100%, -100%) translate3d(0, 100%, 0);
        }

        100% {
          transform: translate(-100%, -100%) translate3d(0, 0, 0);
        }
      }
      flex: 1;
      &-item {
        margin-top: 20px;
        cursor: pointer;
      }
    }
    &-r {
      width: 288px;
      margin-left: 12px;

      // background-color: pink;
    }
  }
}
// .carousel1 {
//   margin-top: -80px;
// }
// .carousel-img {
//   width: 100%;
//   height: 500px;
//   object-fit: cover;
// }

.myavatar {
  width: 100%;
  height: 150px;

  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  // #avatarhover:hover 放大1.2倍动画
}
.stk {
  position: sticky;
  top: 100px;
}
// .header {
//   position: sticky;
//   top: 0px;
//   width: 100%;
//   box-shadow: 0.5px 0.5px 5px #888888;
//   z-index: 99;
// }
// .nav-new {
//   height: 80px;
//   width: 1200px;
//   display: flex;
//   margin: 0 auto;
//   justify-content: space-between;

//   &-title :hover {
//     color: #36ad6a !important;
//   }

//   // &-title :hover::after {
//   //   opacity: 1;
//   // }
//   &-l {
//     height: 80px;
//     display: flex;
//     &-menu {
//       width: 280px;
//       display: flex;
//       justify-content: space-around;
//       align-items: center;
//       a {
//         line-height: 70px;
//         font-size: 18px;
//         color: #fff;
//       }
//     }
//   }

//   .logo {
//     height: 80px;
//     display: flex;
//     align-items: center;
//     img {
//       height: 40px;
//       width: auto;
//       background-color: gray;
//       border-radius: 4px;
//     }
//   }

//   &-r {
//     // background-color: greenyellow;
//     height: 80px;
//     display: flex;
//     justify-content: right;
//     align-items: center;
//     width: 40%;
//     &-search {
//       width: 100%;
//       height: 80px;
//       display: flex;
//       align-items: center;
//     }
//   }
// }

.create-time {
  font-size: 14px;
  color: gray;
}

@keyframes animate1 {
  0% {
    background-position-x: 0;
  }
  100% {
    background-position-x: 1000px;
  }
}

@keyframes animate2 {
  0% {
    background-position-x: 0;
  }
  100% {
    background-position-x: -1000px;
  }
}
.fenye {
  width: 74%;
  display: flex;
  justify-content: center;
  margin-top: 10px;
}
@media screen and (max-width: 1250px) {
  // .nav-new {
  //   width: 90vw;
  // }
  .main {
    width: 90vw;
  }
}
@media screen and (max-width: 820px) {
  .main {
    width: 95vw;
  }
  // .nav-new {
  //   width: 95vw;
  // }
  .main-body {
    &-l {
      flex: 1;
    }
    &-r {
      width: 250px;
    }
  }
}
@media screen and (max-width: 600px) {
  html,
  body {
    display: flex;
    width: 100vw;
  }
  .fenye {
    width: 95vw;
    display: flex;
    justify-content: center;
    margin-top: 10px;
  }
  .lbt {
    width: 100vw;
  }
  // .header {
  //   height: 120px;
  //   width: 100vw;
  //   background-color: #fff;
  // }
  // .nav-new {
  //   height: 120px;
  //   display: block;
  //   width: 100vw;
  // }
  // .nav-new-l {
  //   width: 100vw;
  //   height: 60px;
  //   display: flex;
  //   &-menu {
  //     // width: 250px;
  //     flex: 1;
  //     a {
  //       line-height: 70px;
  //       font-size: 18px;
  //       color: #888888;
  //     }
  //   }
  // }
  // .nav-new-l .logo {
  //   height: 60px;
  //   margin-left: 10px;
  // }
  // .nav-new-r {
  //   width: 100vw;
  //   height: 60px;

  //   &-search {
  //     width: 90vw;
  //     margin: 0 auto;
  //     height: 60px;
  //     display: flex;
  //     align-items: center;
  //   }
  // }
  // .carousel1 {
  //   height: 500px;
  // }

  .main {
    width: 100vw;

    // background-color: pink;
    &-body {
      display: block;
      &-l {
        width: 95vw;
        margin: 0 auto;
        .card {
          display: none;
        }
      }
      &-r {
        width: 95vw;
        margin: 0 auto;
        // background-color: pink;
      }
    }
  }

  .title-h1-page {
    display: none;
  }
}

// .nav-new-title {
//   position: relative;
// }

// .nav-new-title::before {
//   content: "";
//   position: absolute;
//   bottom: 0;
//   left: 0;
//   right: 0;
//   height: 4px;
//   background-color: #36ad6a;
//   transform-origin: bottom right;
//   transform: scaleX(0);
//   transition: transform 0.5s ease;
// }

// .nav-new-title:hover::before {
//   transform-origin: bottom left;
//   transform: scaleX(1);
// }

.highlight-blog {
  // 下边框
  border-right: 2px solid #18a058;
}
</style>
