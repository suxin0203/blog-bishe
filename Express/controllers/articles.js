const runQuery = require('../common/utils');
// const db = require('../common/pool');
const { default: axios } = require('axios');

const stripHtmlTags = (html) => {
  const regex = /(<([^>]+)>)/gi;
  return html.replace(regex, '');
};

exports.getArticles = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 8, keyword = '', category_id } = req.query;

    const offset = (page - 1) * pageSize;
    let sql = `
      SELECT id, status, category_id, title, created_at, updated_at, LEFT(content, 400) AS content
      FROM articles
      WHERE (title LIKE ? OR content LIKE ?) AND status IN (0, 1)
    `;
    const values = [`%${keyword}%`, `%${keyword}%`];

    if (category_id) {
      // 如果提供了 category_id，则添加分类筛选条件
      sql += 'AND category_id = ?';
      values.push(category_id);
    }

    sql += 'ORDER BY CASE WHEN status = 1 THEN 0 ELSE 1 END, id DESC LIMIT ?, ?';
    values.push(offset, Number(pageSize));

    // 获取总文章数量和文章列表
    const [totalResult, articles] = await Promise.all([
      runQuery(`
        SELECT COUNT(*) AS total
        FROM articles
        WHERE (title LIKE ? OR content LIKE ?) AND status IN (0, 1)
        ${category_id ? 'AND category_id = ?' : ''}
      `, [...values, category_id]),
      runQuery(sql, values)
    ]);

    // 格式化创建时间，和修改时间
    articles.forEach(article => {
      article.created_at = article.created_at.toLocaleString();
      article.updated_at = article.updated_at.toLocaleString();
      article.content = stripHtmlTags(article.content); // 去除 HTML 标签
    });

    const total = totalResult[0].total;

    const responseData = {
      message: '获取分页文章列表成功',
      data: articles,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
    res.json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '操作错误' });
  }
};




// 获取单个文章
exports.getArticleById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sql = `SELECT * FROM articles WHERE id = ?`;
    const values = [id];
    const articles = await runQuery(sql, values);
    if (articles.length === 0) {
      // 请求https://api.uomg.com/api/rand.qinghua?format=json 返回res.data.content
      let response =  await axios.get('https://api.uomg.com/api/rand.qinghua?format=json')
      res.json({ code: 200, message: '查询失败', data: [{ title: '文章走丢了~', content: `<h2>----${response.data.content}</h2>` }] });
      return;
    }
    // 根据category_id获取category_name
    const sql2 = `SELECT * FROM categories WHERE id = ${articles[0].category_id}`;
    const categories = await runQuery(sql2);
    articles[0].category_name = categories[0].name;
    // res.json(articles);
    // 格式化创建时间，和修改时间
    articles.forEach(article => {
      article.created_at = article.created_at.toLocaleString();
      article.updated_at = article.updated_at.toLocaleString();
    });
    const responseData = {
      code: 200,
      message: '查询成功',
      data: articles
    };
    // res.render('success', responseData);
    res.json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '操作错误' });
  }
};

// 创建文章
exports.createArticle = async (req, res, next) => {
  try {
    const { title, content, category_id, status } = req.body;
    const sql = `INSERT INTO articles (title, content, category_id, status) VALUES (?, ?, ?, ?)`;
    const values = [title, content, category_id, status];
    const row = await runQuery(sql, values);
    const responseData = {
      code: 200,
      message: '创建成功',
      data: title,
    };
    res.json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '操作错误' });
  }
}

// 更新文章
exports.updateArticle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, category_id, status } = req.body;
    const sql = `UPDATE articles SET title = ?, content = ? ,category_id = ? ,status = ? WHERE id = ?`;
    const values = [title, content, category_id,status, id];
    const row = await runQuery(sql, values);
    console.log(row);
    if (row.affectedRows === 0) {
      res.status(404).json({ error: '文章不存在' });
      return;
    }

    // 获取更新后的文章信息 
    const responseData = {
      code: 200,
      message: '更新成功',
      data:  id 
    };
    res.json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '操作错误' });
  }
}

// 删除文章
exports.deleteArticle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sql = `DELETE FROM articles WHERE id = ?`;
    const values = [id];
    const row = await runQuery(sql, values);
    if (row.affectedRows === 0) {
      res.status(404).json({ error: '文章不存在' });
      return;
    }
    const responseData = {
      code: 200,
      message: '删除成功',
      data:  id 
    };
    res.json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '操作错误' });
  }
}

