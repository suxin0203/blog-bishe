const tagService = require('../services/tagService');
const { formatDateTime } = require('../common/utils');
const { success, fail, error } = require('../common/response');

function formatItem(t) {
  t.created_at = formatDateTime(t.created_at);
  return t;
}

exports.getAllTags = async (req, res) => {
  try {
    const list = await tagService.findAll();
    list.forEach(formatItem);
    return success(res, list, '获取标签列表成功');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};

exports.createTag = async (req, res) => {
  try {
    const name = req.body.name != null ? String(req.body.name).trim() : '';
    if (!name) return fail(res, '标签名称不能为空');
    const existing = await tagService.findByName(name);
    if (existing) return fail(res, '标签名称已存在', 400);
    const id = await tagService.create({ name });
    return success(res, { id, name }, '创建成功');
  } catch (e) {
    console.error(e);
    return error(res, e.message || '操作错误');
  }
};

exports.updateTag = async (req, res) => {
  try {
    const id = req.params.id;
    const name = req.body.name != null ? String(req.body.name).trim() : '';
    if (!name) return fail(res, '标签名称不能为空');
    const existing = await tagService.findByName(name);
    if (existing && Number(existing.id) !== Number(id)) return fail(res, '标签名称已存在', 400);
    const n = await tagService.update(id, { name });
    if (!n) return fail(res, '更新失败或无变更');
    return success(res, { id }, '更新成功');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};

exports.deleteTag = async (req, res) => {
  try {
    const id = req.params.id;
    const count = await tagService.countArticlesByTagId(id);
    if (count > 0) return fail(res, '该标签已被文章使用，无法删除');
    const n = await tagService.remove(id);
    if (!n) return fail(res, '标签不存在');
    return success(res, { id }, '删除成功');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};
