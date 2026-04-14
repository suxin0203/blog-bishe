<template>
  <div class="lbt">
    <MyHeaderVue
      :options="categoryOptions"
      @updateKeyword="searchKeyword"
      @updateCategory="searchCategory"
      v-model:keyword="pageInfo.keyword"
      v-model:category_id="pageInfo.category_id"
      class="detail-header"
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
            <n-space justify="space-between" align="center" v-if="blogInfo.id">
              <n-space>
                <n-tag :bordered="false" type="success">
                  {{ blogInfo.category_name }}
                </n-tag>
                <n-tag v-if="blogInfo.author_name" :bordered="false" type="default">
                  作者：{{ blogInfo.author_name }}
                </n-tag>
                <n-tag v-for="t in articleTagNames" :key="t.id" :bordered="false" type="info" size="small">
                  {{ t.name }}
                </n-tag>
              </n-space>
              <n-space align="center">
                <span class="meta-count">{{ blogInfo.view_count ?? 0 }} 阅读</span>
                <template v-if="adminStore.token">
                  <n-tooltip trigger="hover">
                    <template #trigger>
                      <n-button
                        quaternary
                        :type="liked ? 'primary' : 'default'"
                        size="small"
                        :loading="likeLoading"
                        @click="handleLike"
                      >
                        {{ liked ? "已赞" : "点赞" }} {{ likeCount }}
                      </n-button>
                    </template>
                    点赞获得 1 积分，取消点赞扣除 1 积分
                  </n-tooltip>
                  <n-button
                    quaternary
                    :type="favorited ? 'warning' : 'default'"
                    size="small"
                    :loading="favoriteLoading"
                    @click="handleFavorite"
                  >
                    {{ favorited ? "已收藏" : "收藏" }} {{ favoriteCount }}
                  </n-button>
                </template>
                <template v-else>
                  <span class="meta-count">{{ likeCount }} 点赞</span>
                  <span class="meta-count">{{ favoriteCount }} 收藏</span>
                </template>
                <n-tag :bordered="false">{{ blogInfo.created_at }}</n-tag>
              </n-space>
            </n-space>
            <hr />
            <div>
              <div
                v-html="blogInfo.content"
                id="editor-content-view"
                class="editor-content-view"
                @click="showImg($event)"
              ></div>
              <n-back-top v-if="scrollTarget" :listen-to="scrollTarget" :right="50" :bottom="100" />
            </div>
            <!-- 评论区 -->
            <n-divider />
            <div class="comment-section">
              <h3 class="comment-title">评论 ({{ commentList.length }})</h3>
              <div v-if="blogInfo.id && adminStore.token" class="comment-form">
                <n-input
                  v-model:value="commentContent"
                  type="textarea"
                  placeholder="写下你的评论…"
                  :rows="3"
                  maxlength="500"
                  show-count
                />
                <n-button type="primary" :loading="commentSubmitting" @click="submitComment" style="margin-top: 8px">
                  发表评论
                </n-button>
                <p class="comment-tip-inline">评论需经作者或管理员审核通过后显示</p>
              </div>
              <div v-else-if="blogInfo.id && !adminStore.token" class="comment-guest-tip">
                <n-text depth="2">登录后可评论</n-text>
                <n-button type="primary" size="small" quaternary @click="gouser" style="margin-left: 8px">去登录</n-button>
              </div>
              <div v-else class="comment-tip">加载中…</div>
              <div class="comment-list">
                <div v-for="c in commentList" :key="c.id" class="comment-item">
                  <n-avatar round :size="36" :src="c.user_avatar || undefined" style="flex-shrink: 0">
                    {{ (c.user_name || '访客').charAt(0) }}
                  </n-avatar>
                  <div class="comment-body">
                    <span class="comment-user">{{ c.user_name || '访客' }}</span>
                    <n-tag v-if="c.user_title" size="tiny" type="info" :bordered="false" class="comment-title-tag">{{ c.user_title }}</n-tag>
                    <n-tag v-if="isCommentAuthor(c)" size="tiny" type="success" :bordered="false" class="comment-role-tag">作者</n-tag>
                    <n-tag v-else-if="isCommentAdmin(c)" size="tiny" type="warning" :bordered="false" class="comment-role-tag">管理员</n-tag>
                    <span class="comment-time">{{ c.created_at }}</span>
                    <template v-if="canModerateComment">
                      <n-space class="comment-actions" :size="4">
                        <n-button v-if="c.status === 0" type="primary" size="tiny" quaternary @click="approveComment(c)">通过</n-button>
                        <n-button v-if="c.status === 0" type="warning" size="tiny" quaternary @click="rejectComment(c)">屏蔽</n-button>
                        <n-button v-if="c.status === 1" type="warning" size="tiny" quaternary @click="rejectComment(c)">屏蔽</n-button>
                        <n-button type="error" size="tiny" quaternary @click="deleteComment(c)">删除</n-button>
                      </n-space>
                    </template>
                    <p class="comment-text">{{ c.content }}</p>
                  </div>
                </div>
                <template v-if="pendingComments.length && canModerateComment">
                  <h4 class="comment-pending-title">待审核 ({{ pendingComments.length }})</h4>
                  <div v-for="c in pendingComments" :key="'p-' + c.id" class="comment-item comment-item-pending">
                    <n-avatar round :size="36" :src="c.user_avatar || undefined" style="flex-shrink: 0">{{ (c.user_name || '访客').charAt(0) }}</n-avatar>
                    <div class="comment-body">
                      <span class="comment-user">{{ c.user_name || '访客' }}</span>
                      <n-tag v-if="c.user_title" size="tiny" type="info" :bordered="false" class="comment-title-tag">{{ c.user_title }}</n-tag>
                      <span class="comment-time">{{ c.created_at }}</span>
                      <n-space class="comment-actions" :size="4">
                        <n-button type="primary" size="tiny" quaternary @click="approveComment(c)">通过</n-button>
                        <n-button type="warning" size="tiny" quaternary @click="rejectComment(c)">屏蔽</n-button>
                        <n-button type="error" size="tiny" quaternary @click="deleteComment(c)">删除</n-button>
                      </n-space>
                      <p class="comment-text">{{ c.content }}</p>
                    </div>
                  </div>
                </template>
                <div v-if="commentLoading" class="comment-empty">加载中…</div>
                <div v-else-if="commentList.length === 0 && (!pendingComments.length || !canModerateComment)" class="comment-empty">暂无评论，来抢沙发吧～</div>
              </div>
            </div>
          </n-card>
        </div>

        <div class="main-body-r">
          <div class="stk detail-sidebar">
            <n-space vertical :size="16">
              <n-card
                class="detail-sidebar-card detail-notice-card"
                hoverable
                size="small"
                @click="toMsg"
              >
                <div class="detail-notice-inner">
                  <span class="detail-notice-main">{{ detailNoticeMain || '点此留言' }}</span>
                  <span class="detail-notice-sub">{{ detailNoticeSub || '广告位招租' }}</span>
                </div>
              </n-card>
              <n-card title="📊 阅读 Top 5" hoverable size="small" class="detail-sidebar-card">
                <n-space vertical :size="6">
                  <div
                    v-for="(a, i) in topByView"
                    :key="'v-' + a.id"
                    class="rank-item"
                    @click="goDetail(a.id)"
                  >
                    <span class="rank-num">{{ i + 1 }}</span>
                    <span class="rank-title">{{ a.title || '未命名' }}</span>
                    <span class="rank-count">{{ a.view_count ?? 0 }} 阅读</span>
                  </div>
                  <n-empty v-if="topByView.length === 0" description="暂无" size="medium" />
                </n-space>
              </n-card>
              <n-card title="👍 点赞 Top 5" hoverable size="small" class="detail-sidebar-card">
                <n-space vertical :size="6">
                  <div
                    v-for="(a, i) in topByLike"
                    :key="'l-' + a.id"
                    class="rank-item"
                    @click="goDetail(a.id)"
                  >
                    <span class="rank-num">{{ i + 1 }}</span>
                    <span class="rank-title">{{ a.title || '未命名' }}</span>
                    <span class="rank-count">{{ a.like_count ?? 0 }} 赞</span>
                  </div>
                  <n-empty v-if="topByLike.length === 0" description="暂无" size="medium" />
                </n-space>
              </n-card>
              <n-card title="⭐ 收藏 Top 5" hoverable size="small" class="detail-sidebar-card">
                <n-space vertical :size="6">
                  <div
                    v-for="(a, i) in topByFavorite"
                    :key="'f-' + a.id"
                    class="rank-item"
                    @click="goDetail(a.id)"
                  >
                    <span class="rank-num">{{ i + 1 }}</span>
                    <span class="rank-title">{{ a.title || '未命名' }}</span>
                    <span class="rank-count">{{ a.favorite_count ?? 0 }} 收藏</span>
                  </div>
                  <n-empty v-if="topByFavorite.length === 0" description="暂无" size="medium" />
                </n-space>
              </n-card>
              <n-card title="📄 本文信息" hoverable size="small" class="detail-sidebar-card">
                <n-space vertical :size="10">
                  <div v-if="blogInfo.category_name" class="sidebar-meta">
                    <span class="sidebar-meta-label">分类</span>
                    <n-tag :bordered="false" type="success" size="small">{{ blogInfo.category_name }}</n-tag>
                  </div>
                  <div v-if="articleTagNames.length" class="sidebar-meta">
                    <span class="sidebar-meta-label">标签</span>
                    <n-space wrap :size="6">
                      <n-tag v-for="t in articleTagNames" :key="t.id" :bordered="false" type="info" size="small">{{ t.name }}</n-tag>
                    </n-space>
                  </div>
                  <div v-if="blogInfo.author_name" class="sidebar-meta">
                    <span class="sidebar-meta-label">作者</span>
                    <span class="sidebar-meta-value">{{ blogInfo.author_name }}</span>
                  </div>
                  <div class="sidebar-meta">
                    <span class="sidebar-meta-label">发布于</span>
                    <span class="sidebar-meta-value">{{ blogInfo.created_at }}</span>
                  </div>
                  <div class="sidebar-meta">
                    <span class="sidebar-meta-label">阅读</span>
                    <span class="sidebar-meta-value">{{ blogInfo.view_count ?? 0 }}</span>
                    <span class="sidebar-meta-label" style="margin-left: 12px">点赞</span>
                    <span class="sidebar-meta-value">{{ likeCount }}</span>
                    <span class="sidebar-meta-label" style="margin-left: 12px">收藏</span>
                    <span class="sidebar-meta-value">{{ favoriteCount }}</span>
                  </div>
                </n-space>
              </n-card>
              <n-card
                v-if="promoCard?.enabled && promoCard?.title"
                :title="'📖 ' + promoCard.title"
                embedded
                :bordered="false"
                hoverable
                class="main-body-r-page promo-card"
              >
                <n-space v-if="promoCard.tags?.length" wrap style="margin-bottom: 8px;">
                  <n-tag v-for="t in promoCard.tags" :key="t" :bordered="false" type="info" size="small">
                    {{ t }}
                  </n-tag>
                </n-space>
                <div class="promo-card-content">{{ promoCard.content || '' }}</div>
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
import { getArticleDetail, getCategoryList, getTagList, getCommentsByArticleId, createComment, updateCommentById, deleteCommentById, checkArticleLiked, toggleArticleLike, checkArticleFavorited, toggleArticleFavorite, getOtherswitch, getArticleTop } from "@/api/api";
import MyHeaderVue from "@/components/MyHeader.vue";
import { AdminStore } from "@/stores/AdminStore";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
// import "prismjs/plugins/line-numbers/prism-line-numbers.css";
import { CloseCircleOutline } from "@vicons/ionicons5";



const message = inject("message");
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
const commentList = ref([]);
const pendingComments = ref([]);
const commentContent = ref("");
const commentSubmitting = ref(false);
const commentLoading = ref(false);
const canModerateComment = computed(() => {
  if (!adminStore.token || !blogInfo.value?.id) return false;
  return !!adminStore.is_root || Number(adminStore.id) === Number(blogInfo.value.author_id);
});
const liked = ref(false);
const likeCount = ref(0);
const likeLoading = ref(false);
const favorited = ref(false);
const favoriteCount = ref(0);
const favoriteLoading = ref(false);
const tagList = ref([]);
const topByView = ref([]);
const topByLike = ref([]);
const topByFavorite = ref([]);
const scrollTarget = ref(null);
onMounted(() => {
  scrollTarget.value = document.documentElement;
});
const articleTagNames = computed(() => {
  const ids = blogInfo.value.tag_ids || [];
  const list = tagList.value;
  return ids.map((id) => list.find((t) => Number(t.id) === Number(id))).filter(Boolean);
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
  const id = router.currentRoute.value.query.id;
  if (!id) return;
  const ref = typeof document !== 'undefined' ? document.referrer : '';
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const source = ref && origin && ref.startsWith(origin) ? 'internal' : 'external';
  const res = await getArticleDetail(id, { incrementView: true, source });
  const article = Array.isArray(res.data) ? res.data[0] : res.data;
  blogInfo.value = article || {};
  likeCount.value = article?.like_count ?? 0;
  favoriteCount.value = article?.favorite_count ?? 0;
  document.title = article?.title || document.title;
  loadComments(id);
  if (adminStore.token) {
    try {
      const [likeRes, favRes] = await Promise.all([checkArticleLiked(id), checkArticleFavorited(id)]);
      liked.value = likeRes.data?.liked === true;
      favorited.value = favRes.data?.favorited === true;
    } catch (_) {
      liked.value = false;
      favorited.value = false;
    }
  } else {
    liked.value = false;
    favorited.value = false;
  }
  await nextTick(() => {
    Prism.highlightAll();
  });
};

const handleLike = async () => {
  const id = blogInfo.value?.id;
  if (!id) return;
  if (!adminStore.token) {
    message.warning("请先登录后再点赞");
    return;
  }
  likeLoading.value = true;
  try {
    const res = await toggleArticleLike(id);
    if (res.code === 200 && res.data) {
      liked.value = res.data.liked === true;
      likeCount.value = Math.max(0, likeCount.value + (res.data.liked ? 1 : -1));
      if (res.data.liked) message.success("点赞成功，获得 1 积分");
      else message.info("已取消点赞，扣除 1 积分");
    } else {
      message.error(res.message || "操作失败");
    }
  } catch (e) {
    message.error("点赞操作失败");
  }
  likeLoading.value = false;
};

const handleFavorite = async () => {
  const id = blogInfo.value?.id;
  if (!id) return;
  if (!adminStore.token) {
    message.warning("请先登录后再收藏");
    return;
  }
  favoriteLoading.value = true;
  try {
    const res = await toggleArticleFavorite(id);
    if (res.code === 200 && res.data) {
      favorited.value = res.data.favorited === true;
      favoriteCount.value = Math.max(0, favoriteCount.value + (res.data.favorited ? 1 : -1));
    } else {
      message.error(res.message || "操作失败");
    }
  } catch (e) {
    message.error("收藏操作失败");
  }
  favoriteLoading.value = false;
};

const loadComments = async (articleId) => {
  if (!articleId) return;
  commentLoading.value = true;
  try {
    const res = await getCommentsByArticleId(articleId, { status: 1 });
    commentList.value = Array.isArray(res.data) ? res.data : [];
    if (canModerateComment.value) {
      const pendingRes = await getCommentsByArticleId(articleId, { status: 0 });
      pendingComments.value = Array.isArray(pendingRes.data) ? pendingRes.data : [];
    } else {
      pendingComments.value = [];
    }
  } catch (_) {
    commentList.value = [];
    pendingComments.value = [];
  }
  commentLoading.value = false;
};

const approveComment = async (c) => {
  try {
    const res = await updateCommentById(c.id, { status: 1 });
    if (res?.code === 200) {
      message.success("已通过");
      pendingComments.value = pendingComments.value.filter((x) => x.id !== c.id);
      const id = blogInfo.value?.id;
      if (id) await loadComments(id);
    } else message.error(res?.message || "操作失败");
  } catch (e) {
    message.error("操作失败");
  }
};
const rejectComment = async (c) => {
  try {
    const res = await updateCommentById(c.id, { status: 2 });
    if (res?.code === 200) {
      message.success("已屏蔽");
      pendingComments.value = pendingComments.value.filter((x) => x.id !== c.id);
      commentList.value = commentList.value.filter((x) => x.id !== c.id);
    } else message.error(res?.message || "操作失败");
  } catch (e) {
    message.error("操作失败");
  }
};
const deleteComment = async (c) => {
  if (!confirm("确定删除该评论？")) return;
  try {
    const res = await deleteCommentById(c.id);
    if (res?.code === 200) {
      message.success("已删除");
      pendingComments.value = pendingComments.value.filter((x) => x.id !== c.id);
      commentList.value = commentList.value.filter((x) => x.id !== c.id);
    } else message.error(res?.message || "操作失败");
  } catch (e) {
    message.error("操作失败");
  }
};

const submitComment = async () => {
  const id = blogInfo.value?.id;
  const content = (commentContent.value || "").trim();
  if (!id) {
    message.warning("请等待文章加载完成");
    return;
  }
  if (!content) {
    message.warning("请输入评论内容");
    return;
  }
  commentSubmitting.value = true;
  try {
    const res = await createComment({ article_id: id, content });
    if (res.code === 200) {
      message.success(res.message || "评论已提交，通过审核后显示");
      commentContent.value = "";
      loadComments(id);
    } else {
      message.error(res.message || "评论失败");
    }
  } catch (e) {
    message.error("评论失败");
  }
  commentSubmitting.value = false;
};

const isCommentAuthor = (c) => {
  return c.user_id != null && blogInfo.value?.author_id != null && Number(c.user_id) === Number(blogInfo.value.author_id);
};
const isCommentAdmin = (c) => {
  return c.user_is_root === 1;
};

// 监听 URL 参数变化（如从列表点进另一篇）
watch(
  () => router.currentRoute.value.query.id,
  async () => {
    await getArticleById();
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

const loadTags = async () => {
  const res = await getTagList();
  tagList.value = Array.isArray(res.data) ? res.data : [];
};
const loadTopArticles = async () => {
  try {
    const res = await getArticleTop({ limit: 5 });
    const d = res.data || {};
    topByView.value = d.view_top || [];
    topByLike.value = d.like_top || [];
    topByFavorite.value = d.favorite_top || [];
  } catch (_) {
    topByView.value = [];
    topByLike.value = [];
    topByFavorite.value = [];
  }
};

const goDetail = (id) => {
  router.push({ path: "/detail", query: { id } });
};

getArticleById();
getCategories();
loadTags();
loadPromoCard();
loadTopArticles();

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

const goDashboard = () => {
  router.push("/dashboard");
};

const logout = () => {
  adminStore.delToken();
  console.log("退出登录");
};

const promoCard = ref(null);
const detailNoticeMain = ref("");
const detailNoticeSub = ref("");

function loadPromoCard() {
  getOtherswitch().then((res) => {
    const list = res.data || [];
    const item = list.find((i) => i.name === "promo_card");
    if (item) {
      let parsed = { enabled: !!item.value, title: "", tags: [], content: "" };
      try {
        if (item.content) parsed = { ...parsed, ...JSON.parse(item.content) };
      } catch (_) {}
      if (!Array.isArray(parsed.tags)) parsed.tags = [];
      promoCard.value = parsed;
    }
    const dn = list.find((i) => i.name === "detail_notice");
    const dnc = list.find((i) => i.name === "detail_noticecontent");
    detailNoticeMain.value = dn?.content ?? "";
    detailNoticeSub.value = dnc?.content ?? "";
  });
}

const toMsg = () => {
  router.push("/leavemessage");
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
.comment-section {
  margin-top: 24px;
}
.comment-title {
  margin: 0 0 12px 0;
  font-size: 16px;
}
.comment-form {
  margin-bottom: 20px;
}
.comment-tip {
  color: #999;
  margin-bottom: 12px;
}
.comment-guest-tip {
  margin-bottom: 20px;
  padding: 12px 0;
  display: flex;
  align-items: center;
}
.comment-list {
  margin-top: 16px;
}
.comment-item {
  display: flex;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border, #e8e8ec);
}
.comment-item:last-child {
  border-bottom: none;
}
.comment-body {
  flex: 1;
  min-width: 0;
}
.comment-user {
  font-weight: 500;
  margin-right: 8px;
}
.comment-time {
  font-size: 12px;
  color: #999;
}
.comment-text {
  margin: 6px 0 0 0;
  white-space: pre-wrap;
  word-break: break-word;
}
.comment-empty {
  color: #999;
  padding: 24px 0;
  text-align: center;
}
.comment-role-tag {
  margin-left: 6px;
  vertical-align: middle;
}
.comment-title-tag {
  margin-left: 4px;
  vertical-align: middle;
}
.comment-actions {
  margin-top: 4px;
  margin-bottom: 2px;
}
.comment-pending-title {
  margin: 16px 0 8px 0;
  font-size: 14px;
  color: var(--n-text-color-2, #666);
}
.comment-item-pending {
  border-left: 3px solid #f0a020;
}
.detail-sidebar {
  min-width: 240px;
}
.detail-sidebar-card .sidebar-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}
.sidebar-meta-label {
  font-size: 12px;
  color: var(--n-text-color-2, #666);
  flex-shrink: 0;
}
.sidebar-meta-value {
  font-size: 13px;
}
.rank-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.2s;
}
.rank-item:hover {
  background: rgba(24, 160, 88, 0.08);
}
.rank-num {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  line-height: 18px;
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  background: #18a058;
  border-radius: 4px;
}
.rank-title {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rank-count {
  flex-shrink: 0;
  font-size: 11px;
  color: #999;
}
.comment-tip-inline {
  margin: 6px 0 0 0;
  font-size: 12px;
  color: #999;
}
.meta-count {
  font-size: 13px;
  color: #666;
  margin-right: 4px;
}

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
.detail-header {
  background: var(--primary-soft, rgba(24, 160, 88, 0.12));
  backdrop-filter: saturate(80%) blur(8px);
  border-bottom: 1px solid var(--border, #e8e8ec);
}

.main {
  width: 1200px;
  max-width: 100%;
  margin: 0 auto;
  min-height: calc(100vh - 170px);
  padding: 0 var(--spacing, 16px);
  &-body {
    display: flex;
    justify-content: space-between;
    &-l {
      width: 74%;
      #main-page {
        height: 100%;
        border-radius: var(--radius, 8px);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
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
  min-height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 8px;
}
.avatar-clickable {
  cursor: pointer;
  transition: transform 0.2s;
}
.avatar-clickable:hover {
  transform: scale(1.06);
}
.promo-card .promo-card-content {
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}
.detail-notice-card {
  cursor: pointer;
}
.detail-notice-inner {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.detail-notice-main {
  font-weight: 600;
  color: var(--n-text-color);
}
.detail-notice-sub {
  font-size: 12px;
  color: var(--n-text-color-3);
}
.stk {
  position: sticky;
  top: 100px;
}
.stk .n-card {
  border-radius: var(--radius, 8px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
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
