
const runQuery = require('../common/utils');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const secretKey = 'suxin0203_Blog_mysql';
const saltRounds = 10;

//微信登录获取openid
exports.wxloginUser = async (req, res, next) => {
    try {
        const code = req.params.code;
        const appId = "wx15276ccd959c150c";
        const appSecret = "e92d91ea4d286209050510806625dc9d";
        const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`;
        // 请求微信服务器获取openid 使用axios
        const result = await axios.get(url);
        if (result.data.errcode) {
            res.status(200).json({ code: 0, message: '微信登录失败', errcode: result.data.errcode, errmsg: result.data.errmsg });
        }
        const responseData = {
            message: '获取openid成功',
            data: result.data
        };
        // res.render('success', responseData);
        res.json(responseData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: '操作错误' });
    }
};


//微信登录根据openid获取用户信息
exports.wxloginUserByOpenid = async (req, res, next) => {
    try {
        const openid = req.params.openid;
        console.log(openid);
        const sql = `SELECT * FROM wz_users WHERE openid = ?`;
        const values = [openid];
        const users = await runQuery(sql, values);

        if (users.length === 0) {
            res.status(200).json({ code: 0, message: '用户不存在' });
        } else {
            let user = users[0];
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
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: '操作错误' });

    }
}

