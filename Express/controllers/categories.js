const runQuery = require('../common/utils');
// const db = require('../common/pool');


// 获取所有分类
exports.getAllCategories = async (req, res, next) => {
  try {
    const sql = 'SELECT * FROM categories';
    const categories = await runQuery(sql);
    // 格式化创建时间
    categories.forEach(category => { category.created_at = category.created_at.toLocaleString();});
    responseData = {
      code : 200,
      message: '获取分类列表成功',
      data: categories
    };
    // res.render('success', responseData);
    res.json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '操作错误' });
  }
};


// 创建分类
exports.createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const sql = `INSERT INTO categories (name, description) VALUES (?, ?)`;
    const values = [name, description];
    const row = await runQuery(sql, values);
    const responseData = {
      message: '创建成功',
      data: { name, description}
    };
    // res.render('success', responseData);
    res.json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '操作错误' });
  }
}

// 更新分类
exports.updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const sql = `UPDATE categories SET name = ?, description = ? WHERE id = ?`;
    const values = [name, description, id];
    const row = await runQuery(sql, values);
    // 获取更新后的分类信息 
    const responseData = {
      message: '更新成功',
      data: { id, name, description}
    };
    // res.render('success', responseData);
    res.json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '操作错误' });
  }
}

// 删除分类
exports.deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sql = `DELETE FROM categories WHERE id = ?`;
    const values = [id];
    const row = await runQuery(sql, values);
    const responseData = {
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