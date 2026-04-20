const swiperService = require('../services/swiperService');
const { success, fail, error } = require('../common/response');

function getPublicBaseUrl(req) {
  const forwardedProto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  const forwardedHost = String(req.headers['x-forwarded-host'] || '').split(',')[0].trim();
  const protocol = forwardedProto || req.protocol || 'http';
  const host = forwardedHost || req.get('host') || '';
  return host ? `${protocol}://${host}` : '';
}

function normalizeImageUrl(imageUrl, req) {
  if (!imageUrl) return imageUrl;
  const baseUrl = getPublicBaseUrl(req);
  const uploadPathMatch = String(imageUrl).match(/\/upload\/.+$/i);
  if (uploadPathMatch && baseUrl) {
    return `${baseUrl}${uploadPathMatch[0]}`;
  }
  if (String(imageUrl).startsWith('/upload/') && baseUrl) {
    return `${baseUrl}${imageUrl}`;
  }
  return imageUrl;
}

exports.getSwiperList = async (req, res) => {
  try {
    const onlyShow = req.query.all !== '1';
    const list = await swiperService.getList(onlyShow);
    list.forEach((s) => {
      s.created_at = s.created_at?.toLocaleString?.() ?? s.created_at;
      s.image_url = normalizeImageUrl(s.image_url, req);
    });
    return success(res, list, '获取轮播图列表成功');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};

exports.createSwiper = async (req, res) => {
  try {
    const { image_url, link_url, title, sort_order, status } = req.body;
    const id = await swiperService.create({
      image_url,
      link_url,
      title,
      sort_order,
      status,
    });
    return success(res, { id }, '创建成功');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};

exports.updateSwiper = async (req, res) => {
  try {
    const id = req.params.id;
    const { image_url, link_url, title, sort_order, status } = req.body;
    const n = await swiperService.update(id, { image_url, link_url, title, sort_order, status });
    if (!n) return fail(res, '更新失败或无变更');
    return success(res, { id }, '更新成功');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};

exports.deleteSwiper = async (req, res) => {
  try {
    const id = req.params.id;
    const n = await swiperService.remove(id);
    if (!n) return fail(res, '轮播图不存在');
    return success(res, { id }, '删除成功');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};
