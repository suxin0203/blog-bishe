const otherswitchService = require('../services/otherswitchService');
const { success, fail, error } = require('../common/response');

exports.getAllOtherswitch = async (req, res) => {
  try {
    const list = await otherswitchService.getAll();
    return success(res, list, '查询成功');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};

exports.createOtherswitch = async (req, res) => {
  try {
    const { name, content, value } = req.body;
    const id = await otherswitchService.create({ name, content, value });
    return success(res, { id, name, content, value }, '创建成功');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};

exports.updateOtherswitch = async (req, res) => {
  try {
    const id = req.params.id;
    const { name, content, value, deleted } = req.body;
    const n = await otherswitchService.update(id, { name, content, value, deleted });
    if (!n) return fail(res, '更新失败或无变更');
    return success(res, { id }, '更新成功');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};

exports.deleteOtherswitch = async (req, res) => {
  try {
    const id = req.params.id;
    const n = await otherswitchService.remove(id);
    if (!n) return fail(res, '记录不存在');
    return success(res, { id }, '删除成功');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};
