
const runQuery = require('../common/utils');
// const db = require('../common/pool');


// 获取所有设置
exports.getAllOtherswitch = async (req, res, next) => {
    try {
        const sql = 'SELECT * FROM otherswitch';
        const otherswitch = await runQuery(sql);
        const responseData = {
            code: 200,
            message: '查询成功',
            data:  otherswitch
          };
        res.json(responseData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: '操作错误' });
    }
};


// 创建设置
exports.createOtherswitch = async (req, res, next) => {
    try {
        const { name, content, value } = req.body;
        const sql = `INSERT INTO otherswitch (name, content,value) VALUES (?, ?, ?)`;
        const values = [name, content, value];
        const row = await runQuery(sql, values);
        const responseData = {
            code: 200,
            message: '创建成功',
            data:  { name, content,value }
          };
        res.json(responseData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: '操作错误' });
    }
}


// 更新设置
exports.updateOtherswitch = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, content, value, deleted } = req.body;
        
        // 构建 SQL 查询语句和值数组
        let sql = 'UPDATE otherswitch SET ';
        const values = [];
        
        if (name) {
            sql += 'name = ?, ';
            values.push(name);
        }
        
        if (content) {
            sql += 'content = ?, ';
            values.push(content);
        }
        
        if (value !== undefined) {
            sql += 'value = ?, ';
            values.push(value);
        }
        
        if (deleted !== undefined) {
            sql += 'deleted = ?, ';
            values.push(deleted);
        }
        
        // 去掉最后一个逗号和空格
        sql = sql.slice(0, -2);
        
        // 添加 WHERE 子句
        sql += ' WHERE id = ?';
        values.push(id);
        
        // 执行查询
        const row = await runQuery(sql, values);
        
        // 获取更新后的设置信息 
        const responseData = {
            code: 200,
            message: '更新成功',
            data:  { id, name, content, value, deleted }
          };
        res.json(responseData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: '操作错误' });
    }
}



// 删除设置
exports.deleteOtherswitch = async (req, res, next) => {
    try {
        const { id } = req.params;
        const sql = `DELETE FROM otherswitch WHERE id = ?`;
        const values = [id];
        const row = await runQuery(sql, values);
        const responseData = {
            code: 200,
            message: '删除成功',
            data:  { id }
          };
        res.json(responseData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: '操作错误' });
    }
}