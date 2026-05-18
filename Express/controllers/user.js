const runQuery = require('../common/utils');
const db = require('../common/pool');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const secretKey = 'suxin0203_Blog_mysql';
const saltRounds = 10;


// 获取所有用户
exports.getAllUsers = async (req, res, next) => {
  try {
    const sql = 'SELECT * FROM wz_users';
    const users = await runQuery(sql);
    // 不返回密码 并且格式化创建时间
    users.forEach(user => {
      user.password = '********';
      user.created_at = user.created_at.toLocaleString();
    });
    const responseData = {
      code: 200,
      message: '获取用户列表成功',
      data: users
    };
    res.json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '操作错误' });
  }
};

// 获取单个用户
exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sql = `SELECT * FROM wz_users WHERE id = ?`;
    const values = [id];
    const users = await runQuery(sql, values);
    // 密码置空
    users[0].password = '********';
    const responseData = {
      code: 200,
      message: '查询成功',
      data: users
    };
    res.json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '操作错误' });
  }
};


// 更新用户
exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nickname, avatar_url } = req.body;
    const sql = `UPDATE wz_users SET nickname = ?, avatar_url = ? WHERE id = ?`;
    const values = [nickname, avatar_url, id];
    const row = await runQuery(sql, values);
    // 获取更新后的用户信息
    const responseData = {
      message: '更新成功',
      data: { id }
    };
    // res.render('success', responseData);
    res.json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '操作错误' });
  }
}

// 删除用户
exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { user } = req;

    // 检查是否是删除自己
    if (Number(id) === Number(user.id)) {
      res.json({ code: 400, message: '无法删除自己' });
      return;
    }
    const sql = `DELETE FROM wz_users WHERE id = ?`;
    const values = [id];
    const row = await runQuery(sql, values);
    if (row.affectedRows === 0) {
      res.json({ code: 400, message: '用户不存在' });
      return;
    } else {
      const responseData = {
        code: 200,
        message: '删除成功',
        data: { id }
      };
      res.json(responseData);
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '操作错误' });
  }
}

// 登录用户
exports.loginUser = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const sql = `SELECT * FROM wz_users WHERE username = ?`;
    const values = [username];
    const row = await runQuery(sql, values);
    if (row.length === 0) {
      res.json({ code: 400, message: '用户名或密码错误' });
      return;
    }

    let user = row[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      res.json({ code: 400, message: '用户名或密码错误' });
      return;
    }
    // 如果是微信登录，将openid写入数据库
    if (req.body.openid) {
      // console.log('微信登录', req.body.openid);
      const openid = req.body.openid;
      const updateSql = `UPDATE wz_users SET openid = ? WHERE id = ?`;
      const values = [openid, user.id];
      const row = await runQuery(updateSql, values);

      // 重新查询用户信息，包括更新后的数据
      const selectSql = `SELECT * FROM wz_users WHERE id = ?`;
      const selectValues = [user.id];
      const selectRow = await runQuery(selectSql, selectValues);
      user = selectRow[0];
    }

    // 删除敏感信息
    delete user.password;
    // 生成 JWT
    token = jwt.sign({ id: user.id, username: user.username, is_root: user.is_root }, secretKey, { expiresIn: '10h' })
    const responseData = {
      code: 200,
      message: '登录成功',
      token: token,  // 将生成的 JWT 添加到 responseData 中
      data: user,
    };
    res.json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '操作错误' });
  }
};

//  注册用户
exports.registerUser = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    // 判断参数是否为空
    if (!username || !password) {
      res.json({ code: 400, message: '用户名或密码不能为空' });
      return;
    }
    const sql = `SELECT * FROM wz_users WHERE username = ?`;
    const values = [username];
    const row = await runQuery(sql, values);
    if (row.length > 0) {
      res.json({ code: 400, message: '用户名已存在' });
    } else {
      // 使用 bcrypt 对密码进行哈希处理
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const sql = `INSERT INTO wz_users (username, password) VALUES (?, ?)`;
      const values = [username, hashedPassword];
      await runQuery(sql, values);

      const responseData = {
        code: 200,
        message: '注册成功',
        data: { username }
      };
      res.json(responseData);
    }
  } catch (error) {
    res.status(500).json({ error: '操作错误' });
  }
};



// 修改密码
exports.updatePassword = async (req, res, next) => {
  try {
    let { id, oldPassword, newPassword } = req.body;
    if (oldPassword === newPassword) {
      res.json({ code: 400, message: '新密码不能与原密码相同' });
      return;
    }
    // 查询数据库获取用户信息，包括哈希过的密码
    const sqlSelect = `SELECT * FROM wz_users WHERE id = ?`;
    const valuesSelect = [id];
    const user = await runQuery(sqlSelect, valuesSelect);
    console.log(valuesSelect, '----', user)
    if (user.length === 0) {
      res.json({ code: 400, message: '用户不存在' });
      return;
    }

    const storedHashedPassword = user[0].password;

    // 使用 bcrypt 的 compare 函数比较原密码是否正确
    const isPasswordMatch = await bcrypt.compare(oldPassword, storedHashedPassword);

    if (!isPasswordMatch) {
      res.json({ code: 400, message: '原密码错误' });
      return;
    }

    // 使用 bcrypt 对新密码进行哈希处理
    const newHashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // 更新密码
    const sqlUpdate = `UPDATE wz_users SET password = ? WHERE id = ?`;
    const valuesUpdate = [newHashedPassword, id];
    await runQuery(sqlUpdate, valuesUpdate);

    res.json({ code: 200, message: '更新成功' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '操作错误' });
  }
};


//
