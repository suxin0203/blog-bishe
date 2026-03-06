const runQuery = require('../common/utils');


// 获取所有活动项目，支持模糊搜索和分页
exports.getAllActivitys = async (req, res, next) => {
  try {
    const { name, token, content, remarks, page = 1, limit = 10 } = req.query;
    let sql = 'SELECT * FROM activity WHERE 1=1';
    let countSql = 'SELECT COUNT(*) as total FROM activity WHERE 1=1';
    const values = [];
    const countValues = [];

    if (name) {
      sql += ' AND name LIKE ?';
      countSql += ' AND name LIKE ?';
      values.push(`%${name}%`);
      countValues.push(`%${name}%`);
    }
    if (token) {
      sql += ' AND token LIKE ?';
      countSql += ' AND token LIKE ?';
      values.push(`%${token}%`);
      countValues.push(`%${token}%`);
    }
    if (content) {
      sql += ' AND content LIKE ?';
      countSql += ' AND content LIKE ?';
      values.push(`%${content}%`);
      countValues.push(`%${content}%`);
    }
    if (remarks) {
      sql += ' AND remarks LIKE ?';
      countSql += ' AND remarks LIKE ?';
      values.push(`%${remarks}%`);
      countValues.push(`%${remarks}%`);
    }

    // 获取总记录数
    const totalResult = await runQuery(countSql, countValues);
    const total = totalResult[0].total;

    // 添加分页
    const offset = (page - 1) * limit;
    sql += ' LIMIT ? OFFSET ?';
    values.push(parseInt(limit), parseInt(offset));

    const activity = await runQuery(sql, values);

    // 格式化创建时间
    activity.forEach(message => {
      message.created_at = message.created_at.toLocaleString();
    });

    const responseData = {
      code: 200,
      message: '获取成功',
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
      },
      data: activity
    };

    res.json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '操作错误' });
  }
};

// 创建活动项目
exports.createActivity = async (req, res, next) => {
  try {
    const { name, value, content, token,remarks } = req.body;
    const sql = `INSERT INTO activity (name, value, content, token, remarks) VALUES (?, ?, ?, ?, ?)`;
    const values = [name, value, content, token, remarks];
    const row = await runQuery(sql, values);
    const responseData = {
      code: 200,
      message: '成功',
      data: { name, content, remarks, value}
    };
    res.json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '操作错误' });
  }
}

// 创建活动项目 签到
exports.createActivitySign = async (req, res, next) => {
  try {
    const { name, value, content, token,remarks } = req.body;
    const sql = `INSERT INTO activity_sign (name, value, content, token, remarks) VALUES (?, ?, ?, ?, ?)`;
    const values = [name, value, content, token, remarks];
    const row = await runQuery(sql, values);
    const responseData = {
      code: 200,
      message: '提交成功',
      data: { name, content, remarks, value}
    };
    res.json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '操作错误' });
  }
}

// 获取所有活动项目，支持模糊搜索和分页
exports.createActivitySignSelect = async (req, res, next) => {
  try {
    const { name, token, content, remarks, page = 1, limit = 10 } = req.query;
    let sql = 'SELECT * FROM activity_sign WHERE 1=1';
    let countSql = 'SELECT COUNT(*) as total FROM activity_sign WHERE 1=1';
    const values = [];
    const countValues = [];

    if (name) {
      sql += ' AND name LIKE ?';
      countSql += ' AND name LIKE ?';
      values.push(`%${name}%`);
      countValues.push(`%${name}%`);
    }
    if (token) {
      sql += ' AND token LIKE ?';
      countSql += ' AND token LIKE ?';
      values.push(`%${token}%`);
      countValues.push(`%${token}%`);
    }
    if (content) {
      sql += ' AND content LIKE ?';
      countSql += ' AND content LIKE ?';
      values.push(`%${content}%`);
      countValues.push(`%${content}%`);
    }
    if (remarks) {
      sql += ' AND remarks LIKE ?';
      countSql += ' AND remarks LIKE ?';
      values.push(`%${remarks}%`);
      countValues.push(`%${remarks}%`);
    }

    // 获取总记录数
    const totalResult = await runQuery(countSql, countValues);
    const total = totalResult[0].total;
    console.log(totalResult);

    // 添加分页
    const offset = (page - 1) * limit;
    sql += ' LIMIT ? OFFSET ?';
    values.push(parseInt(limit), parseInt(offset));

    const activity = await runQuery(sql, values);

    // 格式化创建时间并处理token
    activity.forEach(message => {
      message.created_at = message.created_at.toLocaleString();
      if (message.token) {
        message.token = message.token.replace(/.{3}$/, "***"); // 将token的最后三位替换为***
      }
    });


    const responseData = {
      code: 200,
      message: '获取成功',
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
      },
      data: activity
    };

    res.json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '操作错误' });
  }
};

// // 更新活动项目
// exports.updateMessage = async (req, res, next) => {
//   try {
//     const { id } = req.params;
//     const { name, value, content } = req.body;
//     const sql = `UPDATE activity SET name = ?, value = ?, content = ? WHERE id = ?`;
//     const values = [name, value, content, id];
//     const row = await runQuery(sql, values);
//     // 获取更新后的留言信息
//     const responseData = {
//       code: 200,
//       message: '更新成功',
//       data: { id, name, content, value}
//     };
//    res.json(responseData);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: '操作错误' });
//   }
// }

// // 删除项目
// exports.deleteMessage = async (req, res, next) => {
//   try {
//     const { id } = req.params;
//     const sql = `DELETE FROM activity WHERE id = ?`;
//     const values = [id];
//     const row = await runQuery(sql, values);
//     const responseData = {
//       code: 200,
//       message: '删除成功',
//       data: { id }
//     };
//    res.json(responseData);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: '操作错误' });
//   }
// }