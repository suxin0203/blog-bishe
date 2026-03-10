const friendslinkService = require('../services/friendslinkService');
const { success, fail, error } = require('../common/response');

exports.getAllFriendsLinks = async (req, res) => {
  try {
    const list = await friendslinkService.getAll();
    return success(res, list, '获取友情链接列表成功');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};

exports.createFriendsLink = async (req, res) => {
  try {
    const { blog_name, blog_url, blog_theme, blogger_name, contact_info, logo_url, sort_order } = req.body;
    const id = await friendslinkService.create({
      blog_name,
      blog_url,
      blog_theme,
      blogger_name,
      contact_info,
      logo_url,
      sort_order,
    });
    return success(res, { link_id: id, blog_name, blog_url }, '友链创建成功');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};

exports.updateFriendsLink = async (req, res) => {
  try {
    const linkId = req.params.link_id;
    const { blog_name, blog_url, blog_theme, blogger_name, contact_info, logo_url, sort_order } = req.body;
    const n = await friendslinkService.update(linkId, {
      blog_name,
      blog_url,
      blog_theme,
      blogger_name,
      contact_info,
      logo_url,
      sort_order,
    });
    if (!n) return fail(res, '更新失败或无变更');
    return success(res, { link_id: linkId }, '友情链接更新成功');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};

exports.deleteFriendsLink = async (req, res) => {
  try {
    const linkId = req.params.link_id;
    const n = await friendslinkService.remove(linkId);
    if (!n) return fail(res, '链接不存在');
    return success(res, { link_id: linkId }, '删除成功');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};
