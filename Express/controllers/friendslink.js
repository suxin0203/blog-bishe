const db = require('../common/pool');

// 获取所有友情链接
exports.getAllFriendsLinks = async (req, res, next) => {
  try {
    const sql = 'SELECT * FROM friendslink ORDER BY sort_order DESC';
    const [rows] = await db.query(sql);
    const responseData = {
      code: 200,
      message: '获取友情链接列表成功',
      data: rows
    };
    res.json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '操作错误' });
  }
};

// 创建友情链接
exports.createFriendsLink = async (req, res, next) => {
  try {
    const { blog_name, blog_url } = req.body;
    const { blog_theme, blogger_name, contact_info, logo_url, sort_order } = req.body;

    console.log('body----------------',req.body);

    // 构建 SQL 查询语句和参数列表
    const sql = `INSERT INTO friendslink (blog_name, blog_url, blog_theme, blogger_name, contact_info, logo_url, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const values = [blog_name, blog_url, blog_theme || null, blogger_name || null, contact_info || null, logo_url || null, sort_order || null];

    const [result] = await db.query(sql, values);
    const responseData = {
      code: 200,
      message: '友链创建成功',
      data: {
        link_id: result.insertId,
        blog_name,
        blog_url,
        blog_theme,
        blogger_name,
        contact_info,
        logo_url,
        sort_order
      }
    };
    res.json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '操作错误' });
  }
};

// 更新友情链接
exports.updateFriendsLink = async (req, res, next) => {
  try {
    const { link_id } = req.params;
    const { blog_name, blog_theme, blogger_name, blog_url, contact_info, logo_url, sort_order } = req.body;
    const sql = `UPDATE friendslink SET blog_name = ?, blog_theme = ?, blogger_name = ?, blog_url = ?, contact_info = ?, logo_url = ?, sort_order = ? WHERE link_id = ?`;
    const values = [blog_name, blog_theme, blogger_name, blog_url, contact_info, logo_url, sort_order, link_id];
    await db.query(sql, values);
    const responseData = {
      code: 200,
      message: '友情链接更新成功',
      data: {
        link_id,
        blog_name,
        blog_theme,
        blogger_name,
        blog_url,
        contact_info,
        logo_url,
        sort_order
      }
    };
    res.json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '操作错误' });
  }
};

// 删除友情链接
exports.deleteFriendsLink = async (req, res, next) => {
  try {
    const { link_id } = req.params;
    const sql = `DELETE FROM friendslink WHERE link_id = ?`;
    const [result] = await db.query(sql, [link_id]);
    const responseData = {
      code: 200,
      message: '友情链接删除成功',
      data: {
        link_id
      }
    };
    res.json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '操作错误' });
  }
};

