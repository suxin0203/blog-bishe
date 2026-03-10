<template>
  <div class="dashboard-page admin-settings">
    <div class="settings-page">
      <!-- 页面标题区 -->
      <header class="page-header">
        <div class="page-header-icon">
          <n-icon size="28" :component="SettingsOutline" />
        </div>
        <div class="page-header-text">
          <h1 class="page-title">系统设置</h1>
          <p class="page-desc">管理首页轮播、主题、公告与侧栏推荐卡片</p>
        </div>
      </header>

      <div class="settings-body">
        <!-- 轮播图：整行 -->
        <section class="settings-section section-carousel">
          <div class="section-head">
            <span class="section-icon carousel-icon">
              <n-icon size="20" :component="ImagesOutline" />
            </span>
            <div class="section-title-block">
              <h2 class="section-title">轮播图管理</h2>
              <p class="section-desc">首页顶部轮播，上传后自动加入列表，可拖拽调整顺序</p>
            </div>
          </div>
          <div class="section-content upload-section">
            <n-upload
              v-if="showimg"
              :action="axios.defaults.baseURL + '/upload/token/lbt_upload'"
              :headers="{ Authorization: 'Bearer ' + token }"
              list-type="image-card"
              :default-file-list="fileList"
              @finish="handleFinish"
              @remove="handleRemove"
              class="upload-area"
            >
              <div class="upload-trigger">
                <n-icon size="20" :component="ImagesOutline" />
                <span>点击或拖拽上传</span>
              </div>
            </n-upload>
          </div>
        </section>

        <!-- 两列：主题+公告 | 推荐卡片 -->
        <div class="settings-grid">
          <!-- 左列：主题与展示 + 公告与标题 -->
          <div class="settings-col">
            <section class="settings-section section-theme">
              <div class="section-head">
                <span class="section-icon theme-icon">
                  <n-icon size="20" :component="MoonOutline" />
                </span>
                <h2 class="section-title">主题与展示</h2>
              </div>
              <div class="section-content">
                <div class="form-row switch-row">
                  <span class="form-label">深色主题</span>
                  <n-switch
                    v-model:value="themeSwitchValue"
                    :checked-value="1"
                    :unchecked-value="0"
                    @update:value="handleChange"
                  />
                  <span class="form-hint">开启后前台使用深色主题</span>
                </div>
              </div>
            </section>

            <section class="settings-section section-notice">
              <div class="section-head">
                <span class="section-icon notice-icon">
                  <n-icon size="20" :component="MegaphoneOutline" />
                </span>
                <h2 class="section-title">首页/文章列表 广告位</h2>
                <p class="section-desc">主内容区顶部卡片，两行文案可自定义（如：点此留言板、广告位招租）</p>
              </div>
              <div class="section-content">
                <n-form :model="noticeData" :rules="rules" label-placement="top" class="settings-form">
                  <n-form-item label="主标题展示">
                    <n-space align="center" justify="space-between" style="width: 100%">
                      <n-text depth="2">在首页/文章列表展示主标题</n-text>
                      <n-switch :checked-value="1" :unchecked-value="0" v-model:value="noticesopen" />
                    </n-space>
                  </n-form-item>
                  <n-form-item label="主标题文案" path="notice">
                    <n-input
                      v-model:value="noticeData.notice"
                      placeholder="如：点此留言板"
                      maxlength="50"
                      show-count
                      clearable
                    />
                  </n-form-item>
                  <n-form-item label="副标题展示">
                    <n-space align="center" justify="space-between" style="width: 100%">
                      <n-text depth="2">展示副标题</n-text>
                      <n-switch :checked-value="1" :unchecked-value="0" v-model:value="noticecontentopen" />
                    </n-space>
                  </n-form-item>
                  <n-form-item label="副标题文案" path="noticecontent">
                    <n-input
                      v-model:value="noticeData.noticecontent"
                      placeholder="如：广告位招租..."
                      maxlength="80"
                      show-count
                      clearable
                    />
                  </n-form-item>
                  <n-form-item>
                    <n-button type="primary" block @click="updateNotice">保存首页/文章列表广告位</n-button>
                  </n-form-item>
                </n-form>
              </div>
            </section>

            <section class="settings-section section-carousel-notice">
              <div class="section-head">
                <span class="section-icon notice-icon">
                  <n-icon size="20" :component="MegaphoneOutline" />
                </span>
                <h2 class="section-title">轮播图 公告与标题</h2>
                <p class="section-desc">首页顶部轮播图上的主标题与副标题，与上方广告位独立</p>
              </div>
              <div class="section-content">
                <n-form label-placement="top" class="settings-form">
                  <n-form-item label="轮播图主标题">
                    <n-input
                      v-model:value="carouselNoticeData.notice"
                      placeholder="如：欢迎来到我的博客"
                      maxlength="50"
                      show-count
                      clearable
                    />
                  </n-form-item>
                  <n-form-item label="轮播图副标题">
                    <n-input
                      v-model:value="carouselNoticeData.noticecontent"
                      placeholder="如：记录技术与生活"
                      maxlength="80"
                      show-count
                      clearable
                    />
                  </n-form-item>
                  <n-form-item>
                    <n-button type="primary" block @click="saveCarouselNotice">保存轮播图公告</n-button>
                  </n-form-item>
                </n-form>
              </div>
            </section>

            <section class="settings-section section-detail-notice">
              <div class="section-head">
                <span class="section-icon notice-icon">
                  <n-icon size="20" :component="MegaphoneOutline" />
                </span>
                <h2 class="section-title">详情页 广告位</h2>
                <p class="section-desc">文章详情页侧栏的公告/广告卡片，与首页、轮播图分开存储</p>
              </div>
              <div class="section-content">
                <n-form label-placement="top" class="settings-form">
                  <n-form-item label="详情页主标题">
                    <n-input
                      v-model:value="detailNoticeData.notice"
                      placeholder="如：点此留言"
                      maxlength="50"
                      show-count
                      clearable
                    />
                  </n-form-item>
                  <n-form-item label="详情页副标题">
                    <n-input
                      v-model:value="detailNoticeData.noticecontent"
                      placeholder="如：广告位招租"
                      maxlength="80"
                      show-count
                      clearable
                    />
                  </n-form-item>
                  <n-form-item>
                    <n-button type="primary" block @click="saveDetailNotice">保存详情页广告位</n-button>
                  </n-form-item>
                </n-form>
              </div>
            </section>
          </div>

          <!-- 右列：推荐卡片 -->
          <div class="settings-col">
            <section class="settings-section section-promo">
              <div class="section-head">
                <span class="section-icon promo-icon">
                  <n-icon size="20" :component="BookOutline" />
                </span>
                <h2 class="section-title">推荐卡片</h2>
                <p class="section-desc">首页 / 文章页侧栏展示，可编辑标题、标签与正文</p>
              </div>
              <div class="section-content">
                <n-form label-placement="top" class="settings-form promo-form">
                  <n-form-item label="在侧栏展示">
                    <n-space align="center">
                      <n-switch
                        v-model:value="promoEnabled"
                        :checked-value="true"
                        :unchecked-value="false"
                      />
                      <n-text depth="2">关闭后侧栏不显示该卡片</n-text>
                    </n-space>
                  </n-form-item>
                  <n-form-item label="卡片标题">
                    <n-input
                      v-model:value="promoTitle"
                      placeholder="如：如何成功"
                      maxlength="30"
                      show-count
                      clearable
                    />
                  </n-form-item>
                  <n-form-item label="标签（英文逗号分隔）">
                    <n-input
                      v-model:value="promoTagsStr"
                      placeholder="教程, 思维, 联想"
                      clearable
                    />
                  </n-form-item>
                  <n-form-item label="正文内容">
                    <n-input
                      v-model:value="promoContent"
                      type="textarea"
                      placeholder="卡片正文，支持多行"
                      :rows="6"
                      maxlength="2000"
                      show-count
                      clearable
                    />
                  </n-form-item>
                  <n-form-item>
                    <n-button type="primary" block :loading="promoSaving" @click="savePromoCard">
                      保存推荐卡片
                    </n-button>
                  </n-form-item>
                </n-form>
              </div>
            </section>

            <section class="settings-section section-site">
              <div class="section-head">
                <span class="section-icon footer-icon">
                  <n-icon size="20" :component="BookOutline" />
                </span>
                <h2 class="section-title">站点信息</h2>
                <p class="section-desc">站点名称、描述与 LOGO，用于前台展示</p>
              </div>
              <div class="section-content">
                <n-form label-placement="top" class="settings-form">
                  <n-form-item label="站点名称">
                    <n-input v-model:value="siteData.site_name" placeholder="如：文栈博客" maxlength="60" show-count clearable />
                  </n-form-item>
                  <n-form-item label="站点描述">
                    <n-input v-model:value="siteData.site_description" type="textarea" placeholder="简短描述" :rows="2" maxlength="200" show-count clearable />
                  </n-form-item>
                  <n-form-item label="LOGO 图片链接">
                    <n-input v-model:value="siteData.site_logo_url" placeholder="留空则使用默认 LOGO" clearable />
                  </n-form-item>
                  <n-form-item label="默认头像链接">
                    <n-input v-model:value="siteData.default_avatar_url" placeholder="用户无头像时显示的图片，如 https://api.suxin23.cn/upload/avatar.png" clearable />
                  </n-form-item>
                  <n-form-item>
                    <n-button type="primary" block @click="saveSiteBasic">保存站点信息</n-button>
                  </n-form-item>
                </n-form>
              </div>
            </section>

            <section class="settings-section section-footer">
              <div class="section-head">
                <span class="section-icon footer-icon">
                  <n-icon size="20" :component="BookOutline" />
                </span>
                <h2 class="section-title">页脚设置</h2>
                <p class="section-desc">前台页脚展示内容，支持多行；留空则使用默认文案</p>
              </div>
              <div class="section-content">
                <n-form label-placement="top" class="settings-form">
                  <n-form-item label="左侧/品牌名">
                    <n-input
                      v-model:value="footerData.footer_title"
                      placeholder="如：Suxin ·"
                      maxlength="60"
                      show-count
                      clearable
                    />
                  </n-form-item>
                  <n-form-item label="中间正文（多行版权等）">
                    <n-input
                      v-model:value="footerData.footer_content"
                      type="textarea"
                      placeholder="如：© 2022 - 也许，将会是最好用的博客管理系统！"
                      :rows="3"
                      maxlength="500"
                      show-count
                      clearable
                    />
                  </n-form-item>
                  <n-form-item label="右侧（如备案号）">
                    <n-input
                      v-model:value="footerData.footer_icp"
                      placeholder="如：蜀ICP备2022022757"
                      maxlength="80"
                      show-count
                      clearable
                    />
                  </n-form-item>
                  <n-form-item>
                    <n-button type="primary" block @click="saveFooter">保存页脚</n-button>
                  </n-form-item>
                </n-form>
              </div>
            </section>

            <section class="settings-section section-sensitive">
              <div class="section-head">
                <span class="section-icon footer-icon">
                  <n-icon size="20" :component="MegaphoneOutline" />
                </span>
                <h2 class="section-title">评论敏感词</h2>
                <p class="section-desc">评论提交时会将内容中的敏感词替换为 ***，每行一个词</p>
              </div>
              <div class="section-content">
                <n-form label-placement="top" class="settings-form">
                  <n-form-item label="敏感词列表">
                    <n-input
                      v-model:value="sensitiveWordsText"
                      type="textarea"
                      placeholder="每行一个敏感词，例如：&#10;广告&#10;违禁"
                      :rows="4"
                      clearable
                    />
                  </n-form-item>
                  <n-form-item>
                    <n-button type="primary" block @click="saveSensitiveWords">保存敏感词</n-button>
                  </n-form-item>
                </n-form>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, inject, onMounted, reactive } from "vue";
import { useDialog } from "naive-ui";
import {
  SettingsOutline,
  ImagesOutline,
  MoonOutline,
  MegaphoneOutline,
  BookOutline,
} from "@vicons/ionicons5";
import { AdminStore } from "@/stores/AdminStore";
import { getOtherswitch, updateOtherswitch, createOtherswitch, getSwiperList, deleteSwiperById, addSwiper } from "@/api/api";

const adminStore = AdminStore();
const message = inject("message");
const axios = inject("axios");
const dialog = useDialog();
const token = localStorage.getItem("token");

let fileList = ref([]);
let showimg = ref(false);

let darkthem = ref(adminStore.globalOptions.find((item) => item.name === "darkthem" || item.name === "darktheme"));
let themeSwitchValue = ref(darkthem.value?.value ?? 0);
let notices = ref(adminStore.globalOptions.find((item) => item.name === "notice"));
let noticecontent = ref(adminStore.globalOptions.find((item) => item.name === "noticecontent"));
const noticeData = reactive({
  notice: notices.value?.content ?? "",
  noticecontent: noticecontent.value?.content ?? "",
});
let noticesopen = ref(notices.value?.value ?? 1);
let noticecontentopen = ref(noticecontent.value?.value ?? 1);

const carouselNoticeRow = ref(null);
const carouselNoticeContentRow = ref(null);
const carouselNoticeData = reactive({ notice: "", noticecontent: "" });

const detailNoticeRow = ref(null);
const detailNoticeContentRow = ref(null);
const detailNoticeData = reactive({ notice: "", noticecontent: "" });

let rules = {
  notice: [
    { required: true, message: "请输入主标题", trigger: "blur" },
    { min: 2, max: 50, message: "长度在 2 到 50 个字符", trigger: "blur" },
  ],
  noticecontent: [
    { required: true, message: "请输入副标题", trigger: "blur" },
    { min: 2, max: 80, message: "长度在 2 到 80 个字符", trigger: "blur" },
  ],
};

let promoCardRow = ref(null);
let promoEnabled = ref(true);
let promoTitle = ref("");
let promoTagsStr = ref("");
let promoContent = ref("");
let promoSaving = ref(false);

const footerTitleRow = ref(null);
const footerContentRow = ref(null);
const footerIcpRow = ref(null);
const footerData = reactive({
  footer_title: "",
  footer_content: "",
  footer_icp: "",
});

const sensitiveWordsRow = ref(null);
const sensitiveWordsText = ref("");

const siteNameRow = ref(null);
const siteDescRow = ref(null);
const siteLogoRow = ref(null);
const defaultAvatarRow = ref(null);
const siteData = reactive({ site_name: "", site_description: "", site_logo_url: "", default_avatar_url: "" });

onMounted(async () => {
  const res = await getOtherswitch();
  const list = Array.isArray(res) ? res : (res?.data ?? []);
  adminStore.getgloablOptions(list);
  darkthem.value = list.find((item) => item.name === "darkthem" || item.name === "darktheme");
  themeSwitchValue.value = darkthem.value?.value ?? 0;
  notices.value = list.find((item) => item.name === "notice") || list.find((item) => item.name === "home_notice");
  noticecontent.value = list.find((item) => item.name === "noticecontent") || list.find((item) => item.name === "home_noticecontent");
  noticeData.notice = notices.value?.content ?? "";
  noticeData.noticecontent = noticecontent.value?.content ?? "";
  noticesopen.value = notices.value?.value ?? 1;
  noticecontentopen.value = noticecontent.value?.value ?? 1;

  carouselNoticeRow.value = list.find((item) => item.name === "carousel_notice");
  carouselNoticeContentRow.value = list.find((item) => item.name === "carousel_noticecontent");
  carouselNoticeData.notice = carouselNoticeRow.value?.content ?? "";
  carouselNoticeData.noticecontent = carouselNoticeContentRow.value?.content ?? "";

  detailNoticeRow.value = list.find((item) => item.name === "detail_notice");
  detailNoticeContentRow.value = list.find((item) => item.name === "detail_noticecontent");
  detailNoticeData.notice = detailNoticeRow.value?.content ?? "";
  detailNoticeData.noticecontent = detailNoticeContentRow.value?.content ?? "";

  promoCardRow.value = list.find((item) => item.name === "promo_card");
  if (promoCardRow.value) {
    promoEnabled.value = !!promoCardRow.value.value;
    try {
      const obj = promoCardRow.value.content ? JSON.parse(promoCardRow.value.content) : {};
      promoTitle.value = obj.title ?? "";
      promoContent.value = obj.content ?? "";
      promoTagsStr.value = Array.isArray(obj.tags) ? obj.tags.join(",") : (obj.tags ? String(obj.tags) : "");
    } catch (_) {
      promoTitle.value = "";
      promoContent.value = "";
      promoTagsStr.value = "";
    }
  }
  footerTitleRow.value = list.find((item) => item.name === "footer_title");
  footerContentRow.value = list.find((item) => item.name === "footer_content");
  footerIcpRow.value = list.find((item) => item.name === "footer_icp");
  footerData.footer_title = footerTitleRow.value?.content ?? "";
  footerData.footer_content = footerContentRow.value?.content ?? "";
  footerData.footer_icp = footerIcpRow.value?.content ?? "";
  siteNameRow.value = list.find((item) => item.name === "site_name");
  siteDescRow.value = list.find((item) => item.name === "site_description");
  siteLogoRow.value = list.find((item) => item.name === "site_logo_url");
  defaultAvatarRow.value = list.find((item) => item.name === "default_avatar_url");
  siteData.site_name = siteNameRow.value?.content ?? "";
  siteData.site_description = siteDescRow.value?.content ?? "";
  siteData.site_logo_url = siteLogoRow.value?.content ?? "";
  siteData.default_avatar_url = defaultAvatarRow.value?.content ?? "";
  const sensitiveRow = list.find((item) => item && item.name === "sensitive_words");
  sensitiveWordsRow.value = sensitiveRow || null;
  try {
    const raw = (sensitiveRow && (sensitiveRow.content ?? sensitiveRow.Content ?? "")) || "[]";
    const arr = typeof raw === "string" ? JSON.parse(raw) : Array.isArray(raw) ? raw : [];
    sensitiveWordsText.value = Array.isArray(arr) ? arr.join("\n") : "";
  } catch (_) {
    sensitiveWordsText.value = "";
  }
  loadlbt();
});

const loadlbt = async () => {
  showimg.value = false;
  const res = await getSwiperList({ all: 1 });
  const list = res.data || [];
  fileList.value = list.map((s) => ({
    id: s.id,
    name: String(s.id),
    status: "finished",
    url: s.image_url,
  }));
  showimg.value = true;
};

const handleFinish = ({ file, event }) => {
  let data = null;
  try {
    const raw = event?.target?.response;
    if (raw) {
      const body = typeof raw === "string" ? JSON.parse(raw) : raw;
      data = body?.data;
    }
    if (!data?.url && file?.response?.data) data = file.response.data;
  } catch (_) {}
  if (!data?.url) {
    message.error("上传返回数据异常");
    loadlbt();
    return;
  }
  const baseURL = (axios?.defaults?.baseURL || import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");
  const imageUrl = baseURL ? `${baseURL}/${data.url.replace(/^\//, "")}` : `/${data.url.replace(/^\//, "")}`;
  addSwiper({ image_url: imageUrl })
    .then(() => {
      message.info("上传成功");
      loadlbt();
    })
    .catch(() => {
      message.error("保存轮播记录失败");
      loadlbt();
    });
};

const handleRemove = ({ file }) => {
  const swiperId = file.id;
  if (swiperId == null) {
    message.error("无法获取轮播 id");
    return;
  }
  dialog.warning({
    title: "确认删除",
    content: "确定删除该轮播图？",
    positiveText: "确定",
    negativeText: "取消",
    onPositiveClick: () => {
      deleteSwiperById(swiperId).then((res) => {
        message.info(res.message || "已删除");
        loadlbt();
      });
    },
  });
};

const handleChange = (value) => {
  const htmlElement = document.querySelector("html");
  if (htmlElement) {
    if (value) htmlElement.classList.add("darklight");
    else htmlElement.classList.remove("darklight");
  }
  const id = darkthem.value?.id;
  const doUpdate = () => {
    darkthem.value = { ...(darkthem.value || {}), value };
    themeSwitchValue.value = value ?? 0;
    const opts = adminStore.globalOptions || [];
    const themeRow = opts.find((i) => i.name === "darkthem" || i.name === "darktheme");
    if (themeRow) themeRow.value = value;
    else opts.push({ name: "darkthem", value });
    adminStore.getgloablOptions(opts);
  };
  if (id != null) {
    updateOtherswitch(id, { value }).then(doUpdate).catch(() => { themeSwitchValue.value = darkthem.value?.value ?? 0; });
  } else {
    createOtherswitch({ name: "darkthem", content: "0", value: value ? 1 : 0 })
      .then(() => getOtherswitch())
      .then((res) => {
        const list = Array.isArray(res) ? res : (res?.data ?? []);
        darkthem.value = list.find((i) => i.name === "darkthem" || i.name === "darktheme");
        themeSwitchValue.value = darkthem.value?.value ?? 0;
        adminStore.getgloablOptions(list);
      })
      .catch(() => { themeSwitchValue.value = 0; });
  }
};

const updateNotice = () => {
  const saveOne = (row, key, content, value) => {
    if (row?.id) return updateOtherswitch(row.id, { content: content ?? "", value: value ?? 1 });
    return createOtherswitch({ name: key, content: content ?? "", value: value ?? 1 });
  };
  Promise.all([
    saveOne(notices.value, "notice", noticeData.notice, noticesopen.value),
    saveOne(noticecontent.value, "noticecontent", noticeData.noticecontent, noticecontentopen.value),
  ])
    .then(() => {
      message.success("首页/文章列表广告位已保存");
      return getOtherswitch();
    })
    .then((res) => {
      const list = Array.isArray(res) ? res : (res?.data ?? []);
      notices.value = list.find((i) => i.name === "notice") || list.find((i) => i.name === "home_notice");
      noticecontent.value = list.find((i) => i.name === "noticecontent") || list.find((i) => i.name === "home_noticecontent");
      noticeData.notice = notices.value?.content ?? "";
      noticeData.noticecontent = noticecontent.value?.content ?? "";
      noticesopen.value = notices.value?.value ?? 1;
      noticecontentopen.value = noticecontent.value?.value ?? 1;
      adminStore.getgloablOptions(list);
    })
    .catch(() => message.error("保存失败"));
};

const saveCarouselNotice = () => {
  const saveOne = (row, key, content) => {
    if (row?.id) {
      return updateOtherswitch(row.id, { content: content ?? "" });
    }
    return createOtherswitch({ name: key, content: content ?? "", value: 1 });
  };
  Promise.all([
    saveOne(carouselNoticeRow.value, "carousel_notice", carouselNoticeData.notice),
    saveOne(carouselNoticeContentRow.value, "carousel_noticecontent", carouselNoticeData.noticecontent),
  ])
    .then(() => {
      message.success("轮播图公告已保存");
      getOtherswitch().then((res) => {
        const list = res.data || [];
        carouselNoticeRow.value = list.find((i) => i.name === "carousel_notice");
        carouselNoticeContentRow.value = list.find((i) => i.name === "carousel_noticecontent");
      });
    })
    .catch(() => message.error("保存失败"));
};

const saveDetailNotice = () => {
  const saveOne = (row, key, content) => {
    if (row?.id) {
      return updateOtherswitch(row.id, { content: content ?? "" });
    }
    return createOtherswitch({ name: key, content: content ?? "", value: 1 });
  };
  Promise.all([
    saveOne(detailNoticeRow.value, "detail_notice", detailNoticeData.notice),
    saveOne(detailNoticeContentRow.value, "detail_noticecontent", detailNoticeData.noticecontent),
  ])
    .then(() => {
      message.success("详情页广告位已保存");
      getOtherswitch().then((res) => {
        const list = res.data || [];
        detailNoticeRow.value = list.find((i) => i.name === "detail_notice");
        detailNoticeContentRow.value = list.find((i) => i.name === "detail_noticecontent");
      });
    })
    .catch(() => message.error("保存失败"));
};

function savePromoCard() {
  const tags = promoTagsStr.value
    .split(/[,，]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const payload = {
    title: promoTitle.value.trim() || "推荐",
    tags,
    content: promoContent.value.trim() || "",
  };
  const contentStr = JSON.stringify(payload);
  const value = promoEnabled.value ? 1 : 0;

  promoSaving.value = true;
  const done = () => {
    promoSaving.value = false;
  };

  if (promoCardRow.value?.id) {
    updateOtherswitch(promoCardRow.value.id, { content: contentStr, value })
      .then((res) => {
        message.success(res.message || "推荐卡片已保存");
      })
      .catch(() => message.error("保存失败"))
      .finally(done);
  } else {
    createOtherswitch({ name: "promo_card", content: contentStr, value })
      .then((res) => {
        promoCardRow.value = { id: res.data?.id, name: "promo_card", content: contentStr, value };
        message.success("推荐卡片已创建并保存");
      })
      .catch(() => message.error("创建失败，请先执行 migrate-promo-card.sql"))
      .finally(done);
  }
}

const saveSiteBasic = () => {
  const saveOne = (row, key, content) => {
    if (row?.id) return updateOtherswitch(row.id, { content: content ?? "" });
    return createOtherswitch({ name: key, content: content ?? "", value: 0 });
  };
  Promise.all([
    saveOne(siteNameRow.value, "site_name", siteData.site_name),
    saveOne(siteDescRow.value, "site_description", siteData.site_description),
    saveOne(siteLogoRow.value, "site_logo_url", siteData.site_logo_url),
    saveOne(defaultAvatarRow.value, "default_avatar_url", siteData.default_avatar_url),
  ])
    .then(() => {
      message.success("站点信息已保存");
      getOtherswitch().then((res) => {
        const list = res.data || [];
        adminStore.getgloablOptions(list);
        siteNameRow.value = list.find((i) => i.name === "site_name");
        siteDescRow.value = list.find((i) => i.name === "site_description");
        siteLogoRow.value = list.find((i) => i.name === "site_logo_url");
        defaultAvatarRow.value = list.find((i) => i.name === "default_avatar_url");
        siteData.default_avatar_url = defaultAvatarRow.value?.content ?? "";
      });
    })
    .catch(() => message.error("保存失败"));
};

const saveFooter = () => {
  const saveOne = (row, key, content) => {
    if (row?.id) return updateOtherswitch(row.id, { content: content ?? "" });
    return createOtherswitch({ name: key, content: content ?? "", value: 0 });
  };
  Promise.all([
    saveOne(footerTitleRow.value, "footer_title", footerData.footer_title),
    saveOne(footerContentRow.value, "footer_content", footerData.footer_content),
    saveOne(footerIcpRow.value, "footer_icp", footerData.footer_icp),
  ])
    .then(() => {
      message.success("页脚已保存");
      getOtherswitch().then((res) => {
        const list = res.data || [];
        adminStore.getgloablOptions(list);
        footerTitleRow.value = list.find((i) => i.name === "footer_title");
        footerContentRow.value = list.find((i) => i.name === "footer_content");
        footerIcpRow.value = list.find((i) => i.name === "footer_icp");
      });
    })
    .catch(() => message.error("保存失败"));
};

const saveSensitiveWords = () => {
  const text = (sensitiveWordsText.value || "").trim();
  const words = text
    .split(/[\n,，\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const contentStr = JSON.stringify(words);
  const displayText = words.join("\n");

  const refillFromRes = (res) => {
    const list = Array.isArray(res) ? res : (res?.data ?? []);
    const row = Array.isArray(list) ? list.find((i) => i && i.name === "sensitive_words") : null;
    sensitiveWordsRow.value = row || null;
    try {
      const raw = row && (row.content ?? row.Content ?? "");
      const arr = raw ? (typeof raw === "string" ? JSON.parse(raw) : raw) : [];
      sensitiveWordsText.value = Array.isArray(arr) ? arr.join("\n") : displayText;
    } catch (_) {
      sensitiveWordsText.value = displayText;
    }
  };

  if (sensitiveWordsRow.value?.id) {
    updateOtherswitch(sensitiveWordsRow.value.id, { content: contentStr })
      .then(() => {
        message.success("敏感词已保存");
        return getOtherswitch();
      })
      .then(refillFromRes)
      .catch(() => message.error("保存失败"));
  } else {
    createOtherswitch({ name: "sensitive_words", content: contentStr, value: 0 })
      .then(() => {
        message.success("敏感词已创建并保存");
        return getOtherswitch();
      })
      .then(refillFromRes)
      .catch(() => message.error("保存失败"));
  }
};
</script>

<style lang="less" scoped>
.dashboard-page.admin-settings {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
}
.admin-settings {
  width: 100%;
  min-height: 0;
  box-sizing: border-box;
}
.admin-settings .settings-page {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.settings-page {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding-bottom: 32px;
  box-sizing: border-box;
}

/* ---------- 页面标题 ---------- */
.page-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 28px;
  padding: 20px 24px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.page-header-icon {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #18a058 0%, #36ad6a 100%);
  color: #fff;
  border-radius: 12px;
  flex-shrink: 0;
}

.page-header-text {
  min-width: 0;
}

.page-title {
  margin: 0 0 6px 0;
  font-size: 22px;
  font-weight: 600;
  color: #1e293b;
  letter-spacing: -0.02em;
}

.page-desc {
  margin: 0;
  font-size: 14px;
  color: #64748b;
  line-height: 1.5;
}

/* ---------- 主体布局 ---------- */
.settings-body {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  box-sizing: border-box;
}

.settings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  width: 100%;
  min-width: 0;
}

.settings-col {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
}

/* ---------- 区块通用 ---------- */
.settings-section {
  background: var(--card-bg, #fff);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.section-head {
  padding: 16px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}

.section-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  flex-shrink: 0;
  color: #fff;
}

.carousel-icon {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.theme-icon {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
}

.notice-icon {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.promo-icon {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.footer-icon {
  background: linear-gradient(135deg, #64748b 0%, #475569 100%);
}

.section-title-block {
  flex: 1;
  min-width: 0;
}

.section-title {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.section-desc {
  margin: 0;
  font-size: 12px;
  color: #64748b;
  line-height: 1.45;
}

.section-head .section-title {
  margin: 0;
}

.section-head .section-desc {
  width: 100%;
  margin-top: 4px;
  margin-left: 52px;
}

.section-content {
  padding: 20px;
  box-sizing: border-box;
}

/* ---------- 轮播图区块 ---------- */
.section-carousel .section-content {
  padding: 20px;
}

.upload-section {
  min-height: 140px;
}

.upload-area {
  width: 100%;
  min-height: 120px;
}

.upload-area :deep(.n-upload-dragger) {
  padding: 24px;
  border-radius: 10px;
  border: 2px dashed rgba(0, 0, 0, 0.12);
  background: #fafafa;
  transition: border-color 0.2s, background 0.2s;
}

.upload-area :deep(.n-upload-dragger:hover) {
  border-color: #18a058;
  background: rgba(24, 160, 88, 0.04);
}

.upload-trigger {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #64748b;
  font-size: 12px;
  line-height: 1.2;
  text-align: center;
  padding: 4px;
  box-sizing: border-box;
}
.upload-trigger .n-icon {
  flex-shrink: 0;
}

.upload-area :deep(.n-upload-file-list) {
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

/* 轮播图预览：固定小比例，避免单张过大 */
.upload-area :deep(.n-upload-file-list .n-upload-file) {
  width: 100px !important;
  height: 68px !important;
  margin: 0 !important;
}

.upload-area :deep(.n-upload-file-list .n-upload-file img),
.upload-area :deep(.n-upload-file-list .n-upload-file .n-image) {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
}

.upload-area :deep(.n-upload-dragger) {
  width: 100px;
  height: 68px;
  padding: 8px;
}

/* ---------- 表单 ---------- */
.settings-form {
  width: 100%;
  box-sizing: border-box;
}

.settings-form :deep(.n-form-item) {
  margin-bottom: 18px;
}

.settings-form :deep(.n-form-item:last-child) {
  margin-bottom: 0;
}

.settings-form :deep(.n-form-item-label) {
  font-weight: 500;
  color: #334155;
}

.form-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.form-label {
  font-weight: 500;
  color: #334155;
  min-width: 80px;
}

.form-hint {
  font-size: 13px;
  color: #64748b;
}

.switch-row {
  padding: 4px 0;
}

/* ---------- 响应式 ---------- */
@media (max-width: 900px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .settings-page {
    max-width: 100%;
    padding-bottom: 24px;
  }

  .page-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 20px 16px;
    margin-bottom: 20px;
  }

  .page-title {
    font-size: 20px;
  }

  .page-desc {
    font-size: 13px;
  }

  .section-head {
    padding: 14px 16px;
  }

  .section-head .section-desc {
    margin-left: 0;
  }

  .section-content {
    padding: 16px;
  }

  .section-carousel .section-content {
    padding: 16px;
  }
}
</style>
