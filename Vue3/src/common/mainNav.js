/**
 * 前台主导航配置（首页顶栏与各页共用，单一数据源）
 * 分类筛选放在首页/文章页侧栏，顶栏不再重复
 */
export const MAIN_NAV = [
  { label: '首页', route: '/' },
  { label: '文章', route: '/articles' },
  { label: '归档', route: '/archive' },
  { label: '留言', route: '/leavemessage' },
  { label: '积分商城', route: '/shop' },
  { label: '关于我', external: 'https://github.com/suxin0203' },
];
