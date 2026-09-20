import { createRouter, createWebHashHistory } from "vue-router";
import { AdminStore } from "../stores/AdminStore";


let routes = [
  { path: "/", name: "home", component: () => import("@/views/HomePage.vue") },
  { path: "/articles", name: "articles", component: () => import("@/views/ArticlePage.vue") },
  { path: "/archive", name: "archive", component: () => import("@/views/ArchivePage.vue") },
  {
    path: "/activity",
    name: "activity",
    component: () => import("@/views/MobilePage/index.vue"),
  },
  {
    path: "/show",
    name: "show",
    component: () => import("@/views/BulletinBoard/index.vue"),
  },
  {
    path: "/table",
    name: "table",
    component: () => import("@/views/ActivityTbale/index.vue"),
  },
  {
    path: "/shop",
    name: "shop",
    component: () => import("@/views/PointsShop.vue"),
  },
  {
    path: "/my-orders",
    name: "myOrders",
    component: () => import("@/views/MyOrders.vue"),
  },
  {
    path: "/my-favorites",
    name: "myFavorites",
    component: () => import("@/views/dashboard/MyFavorites.vue"),
  },
  {
    path: "/my-points-log",
    name: "myPointsLog",
    component: () => import("@/views/MyPointsLog.vue"),
  },
  {
    path: "/leavemessage",
    name: "leavemessage",
    component: () => import("@/views/Sendmsg.vue"),
  },
  {
    path: "/detail",
    name: "detail",
    component: () => import("@/views/Detail.vue"),
  },
  {
    path: "/login",
    name: "login",
    beforeEnter: (to, from, next) => {
      if (from.name === "article") {
        next({ name: "home" });
      }
      next();
    },
    component: () => import("@/views/Login.vue"),
  },
  {
    path: "/dashboard",
    name: "dashboard",
    redirect: "/dashboard/board",
    component: () => import("@/views/dashboard/Dashboard.vue"),
    children: [
      {
        path: "/dashboard/user",
        name: "user",
        meta: { is_root: true },
        component: () => import("@/views/dashboard/Users.vue"),
      },
      {
        path: "/dashboard/category",
        name: "category",
        meta: { is_root: true },
        component: () => import("@/views/dashboard/Category.vue"),
      },
      {
        path: "/dashboard/tag",
        name: "tag",
        meta: { is_root: true },
        component: () => import("@/views/dashboard/Tag.vue"),
      },
      {
        path: "/dashboard/friendslink",
        name: "friendslink",
        meta: { is_root: true },
        component: () => import("@/views/dashboard/Friendslink.vue"),
      },
      {
        path: "/dashboard/article",
        name: "article",
        meta: { is_root: true },
        component: () => import("@/views/dashboard/Article.vue"),
      },
      {
        path: "/dashboard/board",
        name: "board",
        meta: { is_root: true },
        component: () => import("@/views/dashboard/BlogBoard.vue"),
      },
      {
        path: "/dashboard/aisessions",
        name: "aisessions",
        meta: { is_root: true },
        component: () => import("@/views/dashboard/AiSessions.vue"),
      },
      {
        path: "/dashboard/setmessage",
        name: "setmessage",
        meta: { is_root: true },
        component: () => import("@/views/dashboard/setMessage.vue"),
      },
      {
        path: "/dashboard/setcomment",
        name: "setcomment",
        meta: { is_root: true },
        component: () => import("@/views/dashboard/setComment.vue"),
      },
      {
        path: "/dashboard/otherset",
        name: "otherset",
        meta: { is_root: true },
        // 注意：磁盘文件名是 Adminset.vue（小写 s），Linux 部署下大小写敏感，写错会直接构建失败
        component: () => import("@/views/dashboard/Adminset.vue"),
      },
      {
        path: "/dashboard/pointsmall",
        name: "pointsmall",
        meta: { is_root: true },
        component: () => import("@/views/dashboard/PointsMall.vue"),
      },
      {
        path: "/dashboard/favorites",
        name: "favorites",
        meta: { is_root: true },
        component: () => import("@/views/dashboard/MyFavorites.vue"),
      },
    ],
  },
  {
    path: '/:pathMatch(.*)',
    name: '404',
    component: () => import('@/views/404.vue'),
  },
  
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  // 滚动行为：浏览器原生前进/后退（含文章列表 ↔ 详情）恢复当时的滚动位置；
  // 其余导航（含详情页自定义返回按钮的 push）落到页面顶部
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition;
    return { top: 0 };
  },
});

router.beforeEach((to, from, next) => {
  const adminStore = AdminStore();
  if (to.matched.some((record) => record.meta.is_root)) {
    if (!adminStore.token) {
      next({ name: "login" });
    } else if (!adminStore.is_root && adminStore.role !== "editor") {
      next({ name: "home" });
    } else if (adminStore.role === "editor" && !["article", "category", "tag", "board", "favorites"].includes(to.name)) {
      next({ name: "article" });
    } else {
      next();
    }
  } else {
    next();
  }
});



export { router, routes };
