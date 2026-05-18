const pointsService = require('../services/pointsService');
const { success, fail, error } = require('../common/response');

// ---------- 商品 ----------
exports.getGoodsList = async (req, res) => {
  try {
    const opts = {
      all: req.query.all === '1',
      keyword: req.query.keyword,
      type: req.query.type,
      page: req.query.page,
      pageSize: req.query.pageSize,
    };
    const result = await pointsService.getGoodsList(opts);
    if (result.list !== undefined) {
      return success(res, result, '获取商品列表成功');
    }
    return success(res, { list: result, total: result.length }, '获取商品列表成功');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};

exports.getGoodsById = async (req, res) => {
  try {
    const goods = await pointsService.getGoodsById(req.params.id);
    if (!goods) return fail(res, '商品不存在', 404);
    return success(res, goods, 'ok');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};

exports.createGoods = async (req, res) => {
  try {
    const { name, type, description, image_url, points_cost, stock, status } = req.body;
    const id = await pointsService.createGoods({
      name,
      type,
      description,
      image_url,
      points_cost,
      stock,
      status,
    });
    return success(res, { id }, '创建成功');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};

exports.updateGoods = async (req, res) => {
  try {
    const id = req.params.id;
    const { name, type, description, image_url, points_cost, stock, status } = req.body;
    const n = await pointsService.updateGoods(id, {
      name,
      type,
      description,
      image_url,
      points_cost,
      stock,
      status,
    });
    if (!n) return fail(res, '更新失败或无变更');
    return success(res, { id }, '更新成功');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};

exports.deleteGoods = async (req, res) => {
  try {
    const n = await pointsService.removeGoods(req.params.id);
    if (!n) return fail(res, '商品不存在');
    return success(res, { id: req.params.id }, '删除成功');
  } catch (e) {
    if (e.code === 'HAS_ORDERS' || (e.message && e.message.includes('订单'))) {
      return fail(res, e.message || '该商品已有订单，无法删除');
    }
    console.error(e);
    return error(res, e.message || '操作错误');
  }
};

// ---------- 订单 ----------
exports.getOrderList = async (req, res) => {
  try {
    if (!req.user?.id) return fail(res, '请先登录', 401);
    const isAdminOrEditor = req.user.is_root === 1 || req.user.role === 'editor';
    const userId = isAdminOrEditor ? req.query.userId : req.user.id;
    const { list, total } = await pointsService.getOrderList({
      userId,
      status: req.query.status,
      keyword: req.query.keyword,
      page: req.query.page,
      pageSize: req.query.pageSize,
    });
    return success(res, { list, total }, 'ok');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};

exports.getOrderById = async (req, res) => {
  try {
    if (!req.user?.id) return fail(res, '请先登录', 401);
    const order = await pointsService.getOrderById(req.params.id);
    if (!order) return fail(res, '订单不存在', 404);
    const isAdminOrEditor = req.user.is_root === 1 || req.user.role === 'editor';
    if (!isAdminOrEditor && Number(order.user_id) !== Number(req.user.id)) {
      return fail(res, '无权查看该订单', 403);
    }
    order.created_at = order.created_at?.toLocaleString?.() ?? order.created_at;
    order.updated_at = order.updated_at?.toLocaleString?.() ?? order.updated_at;
    return success(res, order, 'ok');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};

exports.createOrder = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return fail(res, '请先登录', 401);
    const { goods_id, quantity, receiver_name, receiver_phone, receiver_address, user_remark } = req.body;
    const result = await pointsService.createOrder({
      user_id: userId,
      goods_id,
      quantity: quantity ?? 1,
      receiver_name,
      receiver_phone,
      receiver_address,
      user_remark,
    });
    const id = result && typeof result === 'object' && result.orderId != null ? result.orderId : result;
    const data = { id };
    if (result && typeof result === 'object' && result.isTitle) {
      data.completed = true;
      data.title = result.titleName || '';
    }
    const msg = data.completed ? '订单完成，称号已生效' : '兑换成功';
    return success(res, data, msg);
  } catch (e) {
    console.error(e);
    return fail(res, e.message || '操作错误');
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const id = req.params.id;
    const { status, logistics_company, logistics_no, admin_remark } = req.body;
    const n = await pointsService.updateOrderStatus(id, {
      status,
      logistics_company,
      logistics_no,
      admin_remark,
    });
    if (!n) return fail(res, '更新失败或无变更');
    return success(res, { id }, '更新成功');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};

// ---------- 积分流水 ----------
exports.getPointsLog = async (req, res) => {
  try {
    if (!req.user?.id) return fail(res, '请先登录', 401);
    const isAdminOrEditor = req.user.is_root === 1 || req.user.role === 'editor';
    const userId = isAdminOrEditor && req.query.userId ? req.query.userId : req.user.id;
    const { list, total } = await pointsService.getPointsLogList(userId, {
      page: req.query.page,
      pageSize: req.query.pageSize,
    });
    return success(res, { list, total }, 'ok');
  } catch (e) {
    console.error(e);
    return error(res, '操作错误');
  }
};
