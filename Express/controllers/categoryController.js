const categoryService = require('../services/categoryService');
const { success, fail, error } = require('../common/response');

function formatItem(c) {
  c.created_at = c.created_at?.toLocaleString?.() ?? c.created_at;
  return c;
}

exports.getAllCategories = async (req, res) => {
  try {
    const list = await categoryService.findAll();
    list.forEach(formatItem);
    return success(res, list, '获取分类列表成功');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, description, sort_order } = req.body;
    const id = await categoryService.create({ name, description, sort_order });
    return success(res, { id, name, description, sort_order }, '创建成功');
  } catch (e) {
    console.error(e);
    return error(res, e.message || '操作错误');
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const id = req.params.id;
    const { name, description, sort_order } = req.body;
    const n = await categoryService.update(id, { name, description, sort_order });
    if (!n) return fail(res, '更新失败或无变更');
    return success(res, { id }, '更新成功');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const id = req.params.id;
    const count = await categoryService.countArticlesByCategoryId(id);
    if (count > 0) return fail(res, '该分类已被文章使用，无法删除');
    const n = await categoryService.remove(id);
    if (!n) return fail(res, '分类不存在');
    return success(res, { id }, '删除成功');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};
