const runQuery = require('../common/utils');
// const db = require('../common/pool');


// 获取所有留言
exports.getAllMessages = async (req, res, next) => {
  try {
    const sql = 'SELECT * FROM messages where value != 1';
    const messages = await runQuery(sql);
    // 格式化创建时间
    messages.forEach(message => { message.created_at = message.created_at.toLocaleString();});
    const responseData = {
      code : 200,
      message: '获取留言列表成功',
      data: messages
    };
    // res.render('success', responseData);
    res.json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '操作错误' });
  }
};


// 创建留言
exports.createMessage = async (req, res, next) => {
  try {
    const { name, value, content } = req.body;
    const sql = `INSERT INTO messages (name, value, content) VALUES (?, ?, ?)`;
    const values = [name, value, content];
    const row = await runQuery(sql, values);
    const responseData = {
      code: 200,
      message: '创建成功',
      data: { name, content, value}
    };
    // res.render('success', responseData);
    res.json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '操作错误' });
  }
}

// 更新留言
exports.updateMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, value, content } = req.body;
    const sql = `UPDATE messages SET name = ?, value = ?, content = ? WHERE id = ?`;
    const values = [name, value, content, id];
    const row = await runQuery(sql, values);
    // 获取更新后的留言信息 
    const responseData = {
      code: 200,
      message: '更新成功',
      data: { id, name, content, value}
    };
    // res.render('success', responseData);
    res.json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '操作错误' });
  }
}

// 删除留言
exports.deleteMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sql = `DELETE FROM messages WHERE id = ?`;
    const values = [id];
    const row = await runQuery(sql, values);
    const responseData = {
      code: 200,
      message: '删除成功',
      data: { id }
    };
    // res.render('success', responseData);
    res.json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '操作错误' });
  }
}