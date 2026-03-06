<template>
  <div class="blog">
    <MyHeaderVue
      :setstyle="false"
      :options="categoryOptions"
      @updateKeyword="searchKeyword"
      @updateCategory="searchCategory"
      v-model:keyword="pageInfo.keyword"
      v-model:category_id="pageInfo.category_id"
      style="
        background: rgba(24, 160, 88, 0.3);
        backdrop-filter: saturate(50%) blur(4px);
      "
    />
    <div class="main">
      <div style="overflow: hidden">
        <n-divider />
      </div>

      <!--头部↑-->
      <div class="main-body">
        <div class="main-body-l">
          <n-spin :show="show">
            <div
              v-for="blog in blogListInfo"
              :key="blog.id"
              class="main-body-l-item"
            >
              <n-card
                content-style="color: #888888"
                :title="blog.title"
                hoverable
                @click="toDetail(blog)"
              >
                <!-- <span>{{ blog.content }}</span> -->
                <!-- <pre>
                  {{ blog.content }}
                </pre> -->
                <code>
                  {{ blog.content }}
                </code>
                <template #footer>
                  <span class="create-time">
                    {{
                      categoryOptions.find(
                        (item) => item.value === blog.category_id
                      ).label
                    }}</span
                  >
                  <span style="float: right"> ⏱{{ blog.created_at }} </span>
                </template>
              </n-card>
            </div>
          </n-spin>
        </div>

        <div class="main-body-r">
          <div class="stk">
            <n-space vertical>
              <n-card hoverable>
                <div class="myavatar" v-if="!adminStore.token">
                  <n-avatar
                    round
                    :size="60"
                    src="https://q2.qlogo.cn/headimg_dl?spec=100&dst_uin=208082474"
                  />
                  <p>小苏的个人闲聊站</p>
                  <n-space>
                    <n-button type="primary" @click="tologin"> 登录 </n-button>
                  </n-space>
                </div>
                <div class="myavatar" v-else>
                  <n-avatar round :size="60" :src="adminStore.avatar_url" />
                  <p>
                    {{
                      adminStore.nickname
                        ? adminStore.nickname
                        : adminStore.username
                    }}
                    {{ adminStore.is_root ? "👑" : "" }}
                  </p>
                  <n-space>
                    <n-button type="primary" @click="logout"> 注销 </n-button>
                  </n-space>
                </div>
              </n-card>
              <n-card title="分类" hoverable>
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
              <n-card title="友链" hoverable>
                <n-space>
                  <a href="http://www.suxin23.cn/">
                    <n-button quaternary type="primary">
                      苏辛博客(原)
                    </n-button>
                  </a>
                  <a href="https://github.com/suxin0203">
                    <n-button quaternary type="primary">
                      GitHub-suxin
                    </n-button>
                  </a>

                  <a href="https://www.naiveui.com/">
                    <n-button quaternary type="primary"> Naive UI </n-button>
                  </a>
                  <a href="https://www.itbooks.work/">
                    <n-button quaternary type="primary"> 天界程序员 </n-button>
                  </a>
                </n-space>
              </n-card>
              <n-card title="📖 如何成功" embedded :bordered="false" hoverable>
                <n-space>
                  <n-tag :bordered="false" type="info" size="small">
                    教程 </n-tag
                  ><n-tag :bordered="false" type="info" size="small">
                    思维 </n-tag
                  ><n-tag :bordered="false" type="info" size="small">
                    联想
                  </n-tag>
                </n-space>

                如果你年轻的时候不 996，你什么时候可以 996？你一辈子没有
                996，你觉得你就很骄傲了？这个世界上，我们每一个人都希望成功，都希望美好生活，都希望被尊重，我请问大家，你不付出超越别人的努力和时间，你怎么能够实现你想要的成功？
              </n-card>
            </n-space>
          </div>
        </div>
      </div>
      <n-back-top :right="50" :bottom="100" />

      <n-pagination
        class="fenye"
        v-model:page="pageInfo.page"
        @update:page="getArtiles()"
        v-model:page-count="pageInfo.totalPages"
        :page-sizes="[5, 10, 20, 50]"
        @update:page-size="changePageSize"
        show-quick-jumper
        show-size-picker
      />
      <n-divider />
    </div>

    <MyFooterVue />
  </div>
</template>

<script setup>
import { reactive, ref, inject, onMounted, computed } from "vue";
import { router, routes } from "@/common/router.js";
import MyFooterVue from "@/components/MyFooter.vue";
import MyHeaderVue from "@/components/MyHeader.vue";
import MyCarouselVue from "@/components/MyCarousel.vue";
import { AdminStore } from "@/stores/AdminStore";
import { getCategoryList, getArticleList, getOtherswitch } from "@/api/api";

const adminStore = AdminStore();
const categoryOptions = ref([]); //分类列表
const blogListInfo = ref([]);
const show = ref(true);

onMounted(async () => {
  await getCategories();
  getArtiles();
});

const gohome = () => {
  router.push("/"); //跳转到首页
};

const toMsg = () => {
  router.push("/leavemessage"); //跳转到留言页面
};

const tologin = () => {
  router.push("/login"); //跳转到登录页面
};
const logout = () => {
  // delToken
  adminStore.delToken();
  console.log("退出登录");
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
};

//跳转到详情页
const toDetail = (blog) => {
  router.push({ path: "/detail", query: { id: blog.id } });
};

const changePageSize = (pageSize) => {
  pageInfo.pageSize = pageSize;
  getArtiles(1);
}; //改变每页显示条数

const pageInfo = reactive({
  page: 1, //当前页码
  pageSize: 5, //每页显示条数
  totalPages: 1, //总页数
  count: 0, //总条数
  keyword: "", //搜索关键字
  category_id: 0, //  分类id
});

// 获取博客列表
const getArtiles = async (page) => {
  // 分页 搜索 分类 默认第一页
  if (page === 1) {
    pageInfo.page = page;
  }
  pageInfo.category_id === 0 ? delete pageInfo.category_id : "";
  getArticleList(pageInfo).then((res) => {
    blogListInfo.value = res.data;
    pageInfo.totalPages = res.pagination.totalPages;
    pageInfo.count = res.pagination.total;
  });
  show.value = false;
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
.header2 {
  background-color: #fff;
  a {
    color: gray !important;
  }
}
.blog {
  position: relative;
  width: 100%;
  height: 100%;
  background: linear-gradient(#ffffff 33%, #eee 66%);
}
.main {
  width: 1200px;
  margin: 0 auto;
  min-height: calc(100vh - 170px);
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
      &-item:nth-child(n + 2) {
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
.carousel1 {
  margin-top: -80px;
}
.carousel-img {
  width: 100%;
  height: 500px;
  object-fit: cover;
}

.myavatar {
  width: 100%;
  height: 150px;

  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.stk {
  position: sticky;
  top: 100px;
}
.header {
  position: sticky;
  top: 0px;
  width: 100%;
  box-shadow: 0.5px 0.5px 5px #888888;
  z-index: 99;
  // background-image: radial-gradient(transparent 1px, #fff 4px);
  // background-size: 8px 8px;
  // backdrop-filter: saturate(50%) blur(4px);
  // background-color: rgba(255, 255, 255, 0.8);
}
.nav-new {
  height: 80px;
  width: 1200px;
  display: flex;
  margin: 0 auto;
  justify-content: space-between;

  &-title :hover {
    color: #36ad6a !important;
  }

  // &-title :hover::after {
  //   opacity: 1;
  // }
  &-l {
    height: 80px;
    display: flex;
    &-menu {
      width: 280px;
      display: flex;
      justify-content: space-around;
      align-items: center;
      a {
        line-height: 70px;
        font-size: 18px;
        color: #fff;
      }
    }
  }

  .logo {
    height: 80px;
    display: flex;
    align-items: center;
    img {
      height: 40px;
      width: auto;
      background-color: gray;
      border-radius: 4px;
    }
  }

  &-r {
    // background-color: greenyellow;
    height: 80px;
    display: flex;
    justify-content: right;
    align-items: center;
    width: 40%;
    &-search {
      width: 100%;
      height: 80px;
      display: flex;
      align-items: center;
    }
  }
}

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
  .nav-new {
    width: 90vw;
  }
  .main {
    width: 90vw;
  }
}
@media screen and (max-width: 820px) {
  .main {
    width: 95vw;
  }
  .nav-new {
    width: 95vw;
  }
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
  .blog {
    width: 100vw;
  }
  .header {
    height: 120px;
    width: 100vw;
    background-color: #fff;
  }
  .nav-new {
    height: 120px;
    display: block;
    width: 100vw;
  }
  .nav-new-l {
    width: 100vw;
    height: 60px;
    display: flex;
    &-menu {
      // width: 250px;
      flex: 1;
      a {
        line-height: 70px;
        font-size: 18px;
        color: #888888;
      }
    }
  }
  .nav-new-l .logo {
    height: 60px;
    margin-left: 10px;
  }
  .nav-new-r {
    width: 100vw;
    height: 60px;

    &-search {
      width: 90vw;
      margin: 0 auto;
      height: 60px;
      display: flex;
      align-items: center;
    }
  }
  .carousel1 {
    height: 500px;
  }

  .main {
    width: 100vw;

    // background-color: pink;
    &-body {
      display: block;
      &-l {
        width: 95vw;
        margin: 0 auto;
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

.nav-new-title {
  position: relative;
}

.nav-new-title::before {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background-color: #36ad6a;
  transform-origin: bottom right;
  transform: scaleX(0);
  transition: transform 0.5s ease;
}

.nav-new-title:hover::before {
  transform-origin: bottom left;
  transform: scaleX(1);
}
</style>
