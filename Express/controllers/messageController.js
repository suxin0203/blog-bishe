const messageService = require('../services/messageService');
const { success, fail, error } = require('../common/response');
const userService = require('../services/userService');

exports.getAllMessages = async (req, res) => {
  try {
    const status = req.query.status;
    const list = await messageService.getList({ status });
    return success(res, list, '获取留言列表成功');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};

exports.createMessage = async (req, res) => {
  try {
    if (!req.user?.id) return fail(res, '请先登录后留言', 401);
    const user = await userService.findById(req.user.id);
    const displayName = user ? (user.nickname || user.username || '用户') : '用户';
    const { content, value } = req.body;
    const id = await messageService.create({
      user_id: req.user.id,
      name: displayName,
      content,
      status: 1,
      value: value ?? 25,
    });
    return success(res, { id, name: displayName, content }, '创建成功');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};

exports.updateMessage = async (req, res) => {
  try {
    const id = req.params.id;
    const { name, content, status, value } = req.body;
    const n = await messageService.update(id, { name, content, status, value });
    if (!n) return fail(res, '更新失败或无变更');
    return success(res, { id }, '更新成功');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const id = req.params.id;
    const n = await messageService.remove(id);
    if (!n) return fail(res, '留言不存在');
    return success(res, { id }, '删除成功');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};
