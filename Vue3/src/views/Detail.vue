<template>
  <div class="lbt">
    <MyHeaderVue
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
      <div style="overflow: hidden" class="main-hr">
        <n-divider />
      </div>

      <!--头部↑-->
      <div class="main-body">
        <div class="main-body-l">
          <n-card id="main-page">
            <h1>{{ blogInfo.title }}</h1>
            <n-space justify="space-between" v-if="blogInfo.id">
              <n-tag :bordered="false" type="success">
                {{ blogInfo.category_name }}
              </n-tag>
              <n-tag :bordered="false">
                {{ blogInfo.created_at }}
              </n-tag>
            </n-space>
            <hr />
            <div>
              <div
                v-html="blogInfo.content"
                id="editor-content-view"
                class="editor-content-view"
                @click="showImg($event)"
              ></div>
              <n-back-top :right="50" :bottom="100" />
            </div>
          </n-card>
        </div>

        <div class="main-body-r">
          <div class="stk">
            <n-space vertical>
              <n-card hoverable>
                <div class="myavatar">
                  <n-avatar
                    round
                    size="60"
                    class="animationClass"
                    :src="
                      adminStore.avatar_url ||
                      'https://q2.qlogo.cn/headimg_dl?spec=100&dst_uin=208082474'
                    "
                    @click="gouser"
                  />
                  <p>
                    {{
                      adminStore.nickname ||
                      adminStore.username ||
                      "小苏的个人闲聊站"
                    }}
                    {{ adminStore.is_root ? "👑" : "" }}
                  </p>
                  <n-space>
                    <n-button
                      type="primary"
                      @click="gouser"
                      v-if="!adminStore.token"
                      >登录</n-button
                    >
                    <n-button
                      type="primary"
                      @click="logout"
                      v-if="adminStore.token"
                      >注销</n-button
                    >
                  </n-space>
                </div>
              </n-card>
              <n-card title="分类" hoverable class="main-body-r-class">
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
              <n-card
                title="📖 如何成功"
                embedded
                :bordered="false"
                hoverable
                class="main-body-r-page"
              >
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
      <!--分页组件-->
      <n-divider />
    </div>
    <MyFooterVue />
    <!-- 富文本图片放大 -->
    <div
      class="imgDolg"
      v-show="imgPreview.show"
      @click.stop="imgPreview.show = false"
    >
      <n-icon
        :component="CloseCircleOutline"
        size="60"
        id="imgDolgClose"
        @click.stop="imgPreview.show = false"
      />
      <img
        @click.stop="imgPreview.show = true"
        :src="imgPreview.img"
        class="animate__animated animate__fadeIn"
      />
    </div>
  </div>
</template>

<script setup>
import {
  reactive,
  ref,
  inject,
  onMounted,
  computed,
  nextTick,
  watch,
} from "vue";
import { router, routes } from "@/common/router.js";
import MyFooterVue from "@/components/MyFooter.vue";
import { getArticleDetail, getCategoryList } from "@/api/api";
import MyHeaderVue from "@/components/MyHeader.vue";
import { AdminStore } from "@/stores/AdminStore";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
// import "prismjs/plugins/line-numbers/prism-line-numbers.css";
import { CloseCircleOutline } from "@vicons/ionicons5";



const adminStore = AdminStore();
const blogInfo = ref({});
const selectedCategory = ref(0);
const categoryOptions = ref([]); //分类列表
const blogListInfo = ref([]);
const isActive = ref(false);
const imgPreview = reactive({
  show: false,
  img: "",
});

const pageInfo = reactive({
  page: 1, //当前页码
  pageSize: 5, //每页显示条数
  totalPages: 1, //总页数
  count: 0, //总条数
  keyword: "", //搜索关键字
  category_id: 0, //  分类id
});

const getArticleById = async () => {
  const res = await getArticleDetail(router.currentRoute.value.query.id);
  blogInfo.value = res.data[0];
  // 设置网页标题为文章标题blogInfo.value.title
  document.title = blogInfo.value.title;
  await nextTick(() => {
    Prism.highlightAll();
  });
};

// 监听URL参数变化
watch(
  () => router.currentRoute.value.query,
  async (newQuery, oldQuery) => {
    // console.log(newQuery);
      await getArticleById(newQuery.id);
  }
);

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

getArticleById();
getCategories();

// 图片点击放大
const showImg = (e) => {
  console.log(e.target.tagName);
  if (e.target.tagName == "IMG") {
    imgPreview.img = e.target.src;
    imgPreview.show = true;
  }
};

const goback = () => {
  router.push("/");
};

const gohome = () => {
  router.push("/"); //跳转到首页
};

//跳转到/dashboard/user
const gouser = () => {
  adminStore.token ? router.push("/dashboard/user") : router.push("/login");
};

const logout = () => {
  // delToken
  adminStore.delToken();
  console.log("退出登录");
};

const dashboard = () => {
  router.push("/login"); //跳转到登录页
};

//搜索分类
const searchCategory = (category_id) => {
  // // console.log(category_id);
  // category_id === 0
  //   ? delete pageInfo.category_id
  //   : (pageInfo.category_id = category_id);
  // getArtiles(1); //搜索默认第一页
  // 跳转到文章列表页
  router.push({
    path: "/articles",
    query: {
      keyword: keyword,
    },
  });
};

// 搜索关键词
const searchKeyword = (keyword) => {
  // console.log(keyword);
  // pageInfo.keyword = keyword;
  // getArtiles(1); //搜索默认第一页

  // 跳转到文章列表页
  router.push({
    path: "/articles",
    query: {
      keyword: keyword,
    },
  });
};
</script>

<style lang="less" scoped>
.goback {
  color: #36ad6a !important;
}
.gotop {
  position: fixed;
  right: 20px;
  bottom: 90px;
  z-index: 999;
  font-size: 24px;
}

.lbt {
  position: relative;
  width: 100%;
  height: 100%;
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
      width: 74%;
      #main-page {
        height: 100%;
      }
    }
    &-r {
      width: 24%;

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
  z-index: 2;
  background-color: #fff;
}
.nav-new {
  height: 80px;
  width: 1200px;
  display: flex;
  margin: 0 auto;
  justify-content: space-between;
  &-title {
    position: relative;
  }
  &-title ::after {
    content: "";
    position: absolute;
    height: 3px;
    width: 100%;
    background-color: #36ad6a;
    bottom: 0;
    left: 0;
    opacity: 0;
  }
  &-title :hover {
    color: #36ad6a !important;
  }
  &-title :hover::after {
    opacity: 1;
  }
  &-l {
    height: 80px;
    flex: 1;
    display: flex;
    &-menu {
      width: 60%;
      display: flex;
      justify-content: space-around;
      align-items: center;
      a {
        line-height: 70px;
        font-size: 18px;
        color: gray;
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
    flex: 1;
    display: flex;
    justify-content: right;
    align-items: center;
    &-search {
      width: 70%;
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

@media screen and (max-width: 600px) {
  html,
  body {
    display: flex;
    width: 100vw;
  }
  .lbt {
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
    &-menu {
      width: 250px;
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
      width: 95vw;
      margin: 0 auto;
      height: 80px;
      display: flex;
      align-items: center;
    }
  }
  .carousel1 {
    height: 300px;
  }

  .main {
    width: 100vw;

    &-hr {
      // display: none!important;
      height: 20px;
    }

    // background-color: pink;
    &-body {
      display: block;
      &-l {
        width: 95vw;
        margin: 0 auto;
      }
      &-r {
        width: 95vw;
        margin: 10px auto;
        &-class {
          display: none;
        }
        &-page {
          display: none;
        }
      }
    }
  }
}

//富文本图片放大
.imgDolg {
  width: 100vw;
  height: 100vh;
  position: fixed;
  z-index: 9999;
  background-color: rgba(56, 53, 53, 0.6);
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  #imgDolgClose {
    position: fixed;
    top: 10%;
    cursor: pointer;
    right: 5%;
    color: white;
    z-index: 99999;
  }
  img {
    margin: auto;
    max-width: calc(100vw - 64px);
    max-height: calc(100vh - 64px);
    min-width: 50%;
  }
}
</style>
