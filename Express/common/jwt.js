// JWT 密钥统一出口：所有签发与校验处统一从这里取，
// 避免多个文件各自定义导致"改了环境变量、个别接口仍用旧密钥"的漂移问题
const secretKey = process.env.JWT_SECRET || 'suxin0203_Blog_mysql';

module.exports = secretKey;
