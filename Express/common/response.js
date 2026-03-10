/**
 * 统一响应格式
 * { code, message, data? }
 */
function success(res, data = null, message = 'success') {
  return res.status(200).json({ code: 200, message, data });
}

function fail(res, message = 'fail', code = 400) {
  return res.status(200).json({ code, message, data: null });
}

function error(res, message = '服务器错误', code = 500) {
  return res.status(code >= 500 ? 500 : 200).json({ code: code >= 500 ? 500 : code, message, data: null });
}

module.exports = { success, fail, error };
