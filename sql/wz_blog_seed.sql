/*
 * 文栈博客 - 测试数据（每表约 15 条，外键关联严谨）
 * 用户密码统一为 123456（bcrypt）
 * 执行前请先执行 wz_blog_schema.sql
 */

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 密码 123456 的 bcrypt 哈希（与 Express 测试一致）
SET @pwd = '$2b$10$qRZGAWcFSe0xdZboCKw9WOvxCeruSbef0n6d4udKOCgvCi4NWRIGa';

-- ----------------------------
-- 1. wz_users（约 18 条）
-- ----------------------------
INSERT INTO `wz_users` (`id`,`username`,`password`,`email`,`nickname`,`role`,`is_root`,`status`,`points`,`title`) VALUES
(1,'admin',@pwd,'admin@test.com','管理员', 'admin',1,1,999,'站长'),
(2,'editor',@pwd,'editor@test.com','编辑',   'editor',0,1,500,'达人'),
(3,'user1',@pwd,'user1@test.com','测试用户1','user',0,1,200,NULL),
(4,'user2',@pwd,'user2@test.com','测试用户2','user',0,1,150,NULL),
(5,'user3',@pwd,'user3@test.com','测试用户3','user',0,1,80,NULL),
(6,'user4',@pwd,'user4@test.com','测试用户4','user',0,1,60,NULL),
(7,'user5',@pwd,'user5@test.com','测试用户5','user',0,1,100,NULL),
(8,'user6',@pwd,'user6@test.com','测试用户6','user',0,1,0,NULL),
(9,'user7',@pwd,'user7@test.com','测试用户7','user',0,1,30,NULL),
(10,'user8',@pwd,'user8@test.com','测试用户8','user',0,1,45,NULL),
(11,'user9',@pwd,'user9@test.com','测试用户9','user',0,1,120,NULL),
(12,'user10',@pwd,'user10@test.com','测试用户10','user',0,1,88,NULL),
(13,'user11',@pwd,'user11@test.com','测试用户11','user',0,1,66,NULL),
(14,'user12',@pwd,'user12@test.com','测试用户12','user',0,1,0,NULL),
(15,'user13',@pwd,'user13@test.com','测试用户13','user',0,1,200,NULL),
(16,'user14',@pwd,'user14@test.com','测试用户14','user',0,1,50,NULL),
(17,'user15',@pwd,'user15@test.com','测试用户15','user',0,1,180,NULL),
(18,'user16',@pwd,'user16@test.com','测试用户16','user',0,1,70,NULL);

-- ----------------------------
-- 2. wz_categories（约 15 条）
-- ----------------------------
INSERT INTO `wz_categories` (`id`,`name`,`description`,`sort_order`) VALUES
(1,'前端开发','Vue、React、前端工程化',1),
(2,'后端开发','Node、Java、数据库',2),
(3,'算法与数据结构','LeetCode、算法题解',3),
(4,'生活随笔','日常、读书、旅行',4),
(5,'技术杂谈','架构、运维、DevOps',5),
(6,'Python','Python 教程与实战',6),
(7,'数据库','MySQL、Redis、MongoDB',7),
(8,'Linux','Linux 运维与脚本',8),
(9,'网络安全','安全、渗透、加固',9),
(10,'移动端','iOS、Android、Flutter',10),
(11,'云原生','Docker、K8s、CI/CD',11),
(12,'开源项目','开源贡献与阅读',12),
(13,'面试经验','面经与职业发展',13),
(14,'读书笔记','读书与思考',14),
(15,'其他','未分类文章',15);

-- ----------------------------
-- 3. wz_tags（约 18 条）
-- ----------------------------
INSERT INTO `wz_tags` (`id`,`name`) VALUES
(1,'Vue'),(2,'React'),(3,'Node.js'),(4,'MySQL'),(5,'Redis'),
(6,'Docker'),(7,'JavaScript'),(8,'TypeScript'),(9,'Java'),
(10,'Python'),(11,'算法'),(12,'面试'),(13,'读书'),(14,'生活'),
(15,'Linux'),(16,'Nginx'),(17,'Git'),(18,'Webpack');

-- ----------------------------
-- 4. wz_articles（约 18 条，author_id 1-18, category_id 1-15）
-- ----------------------------
INSERT INTO `wz_articles` (`id`,`title`,`summary`,`content`,`category_id`,`author_id`,`status`,`view_count`,`like_count`,`comment_count`,`favorite_count`) VALUES
(1,'Vue3 组合式 API 入门','摘要：从选项式到组合式','<p>正文：Vue3 组合式 API 入门教程...</p>',1,1,1,1200,88,12,30),
(2,'Node.js 与 Express 搭建 REST API','摘要：从零搭建后端','<p>正文：Node.js 与 Express...</p>',2,1,0,800,45,8,20),
(3,'MySQL 索引优化实践','摘要：索引与查询优化','<p>正文：MySQL 索引...</p>',7,2,0,650,32,5,15),
(4,'LeetCode 刷题笔记（一）','摘要：数组与哈希','<p>正文：LeetCode...</p>',3,3,0,420,28,3,10),
(5,'生活随笔：周末读书','摘要：本周读书心得','<p>正文：周末读书...</p>',4,4,0,180,15,2,5),
(6,'Docker 容器化部署','摘要：Docker 入门','<p>正文：Docker...</p>',11,2,0,520,40,6,18),
(7,'Redis 缓存策略','摘要：缓存穿透与雪崩','<p>正文：Redis...</p>',7,1,0,380,22,4,12),
(8,'前端工程化：Vite 实践','摘要：Vite 构建优化','<p>正文：Vite...</p>',1,5,0,290,18,2,8),
(9,'Linux 常用命令速查','摘要：运维常用命令','<p>正文：Linux...</p>',8,6,0,760,55,9,25),
(10,'面试复盘：大厂一二面','摘要：面经分享','<p>正文：面试...</p>',13,7,0,1200,90,15,45),
(11,'TypeScript 类型体操','摘要：TS 进阶','<p>正文：TypeScript...</p>',1,8,0,340,25,3,11),
(12,'读书笔记：《代码整洁之道》','摘要：读书笔记','<p>正文：代码整洁之道...</p>',14,9,0,210,12,1,6),
(13,'Nginx 反向代理配置','摘要：Nginx 实践','<p>正文：Nginx...</p>',8,10,0,440,30,5,14),
(14,'Git 工作流规范','摘要：Git 协作','<p>正文：Git...</p>',5,2,0,390,28,4,13),
(15,'Python 异步编程 asyncio','摘要：asyncio 入门','<p>正文：asyncio...</p>',6,11,0,270,20,2,9),
(16,'K8s 入门：Pod 与 Deployment','摘要：K8s 基础','<p>正文：K8s...</p>',11,1,0,580,42,7,22),
(17,'Webpack 5 迁移指南','摘要：从 4 到 5','<p>正文：Webpack...</p>',1,12,0,310,19,3,10),
(18,'网络安全：XSS 与 CSRF','摘要：常见 Web 安全','<p>正文：XSS CSRF...</p>',9,13,0,460,35,6,16);

-- ----------------------------
-- 5. wz_article_tags（约 20 条，关联文章与标签）
-- ----------------------------
INSERT INTO `wz_article_tags` (`article_id`,`tag_id`) VALUES
(1,1),(1,7),(2,3),(3,4),(4,11),(4,12),(5,13),(5,14),(6,6),(7,5),
(8,1),(8,7),(9,15),(10,12),(11,8),(12,13),(13,16),(14,17),(15,10),(16,6);

-- ----------------------------
-- 6. wz_comments（约 18 条，article_id 1-18, user_id 1-15, 部分 parent_id）
-- ----------------------------
INSERT INTO `wz_comments` (`id`,`article_id`,`user_id`,`parent_id`,`content`,`status`) VALUES
(1,1,2,NULL,'写得很清晰，感谢分享！',1),
(2,1,3,1,'同感，组合式用起来很顺手',1),
(3,2,4,NULL,'Express 版本是 4 还是 5？',1),
(4,3,5,NULL,'索引部分讲得很实用',1),
(5,4,6,NULL,'刷题加油',1),
(6,5,7,NULL,'读书愉快',1),
(7,6,8,NULL,'Docker 部署确实方便',1),
(8,7,9,NULL,'Redis 缓存我们项目也在用',1),
(9,8,10,NULL,'Vite 比 Webpack 快很多',1),
(10,9,11,NULL,'命令很全，收藏了',1),
(11,10,12,NULL,'面经很有帮助',1),
(12,11,13,NULL,'类型体操太难了',1),
(13,12,14,NULL,'这本书确实经典',1),
(14,13,15,NULL,'Nginx 配置收藏',1),
(15,14,1,NULL,'Git 规范我们团队也在推行',1),
(16,15,2,NULL,'asyncio 入门好文',1),
(17,16,3,NULL,'K8s 学习路线清晰',1),
(18,17,4,NULL,'Webpack5 我们还没迁',1);

-- ----------------------------
-- 7. wz_article_likes（约 18 条，article_id + user_id 不重复）
-- ----------------------------
INSERT INTO `wz_article_likes` (`article_id`,`user_id`) VALUES
(1,2),(1,3),(2,4),(3,5),(4,6),(5,7),(6,8),(7,9),(8,10),(9,11),
(10,12),(11,13),(12,14),(13,15),(14,1),(15,2),(16,3),(17,4);

-- ----------------------------
-- 8. wz_article_favorites（约 18 条）
-- ----------------------------
INSERT INTO `wz_article_favorites` (`article_id`,`user_id`) VALUES
(1,3),(2,5),(3,6),(4,7),(5,8),(6,9),(7,10),(8,11),(9,12),(10,13),
(11,14),(12,15),(13,1),(14,2),(15,3),(16,4),(17,5),(18,6);

-- ----------------------------
-- 9. wz_messages（约 18 条，部分 user_id 为空）
-- ----------------------------
INSERT INTO `wz_messages` (`user_id`,`name`,`content`,`status`,`value`) VALUES
(1,'管理员','欢迎来到本站留言板！',1,25),
(2,'编辑','有问题可以留言哦',1,25),
(3,'测试用户1','第一次留言，站点做得不错',1,25),
(NULL,'访客','匿名留个脚印',1,25),
(4,'测试用户2','主题很清爽',1,25),
(5,'测试用户3','期待更多技术文章',1,25),
(NULL,'路人甲','广告位招租哈哈',1,25),
(6,'测试用户4','已收藏好几篇',1,25),
(7,'测试用户5','积分商城挺好玩的',1,25),
(8,'测试用户6','友链已申请',1,25),
(9,'测试用户7','评论敏感词过滤有效',1,25),
(10,'测试用户8','希望多写 Vue 相关',1,25),
(11,'测试用户9','Node 后端写得清晰',1,25),
(12,'测试用户10','面试篇很有用',1,25),
(13,'测试用户11','读书笔记栏目不错',1,25),
(14,'测试用户12','Linux 命令收藏了',1,25),
(15,'测试用户13','Docker 那篇讲得好',1,25),
(1,'管理员','感谢大家支持，会持续更新',1,25);

-- ----------------------------
-- 10. wz_otherswitch（约 18 条配置）
-- ----------------------------
INSERT INTO `wz_otherswitch` (`name`,`content`,`value`,`deleted`) VALUES
('site_name','文栈博客',0,0),
('site_description','技术博客，记录与分享',0,0),
('site_logo_url','',0,0),
('default_avatar_url','https://api.suxin23.cn/upload/avatar.png',0,0),
('footer_title','关于本站',0,0),
('footer_content','基于 Vue3 + Express 的个人博客，仅供学习交流。',0,0),
('footer_icp','',0,0),
('darkthem','0',0,0),
('sensitive_words','敏感\n违禁\n测试敏感词',0,0),
('carousel_notice','轮播公告：欢迎访问文栈博客',0,0),
('carousel_noticecontent','轮播副标题：技术 · 生活 · 分享',0,0),
('detail_notice','详情页公告',0,0),
('detail_noticecontent','详情页公告内容：请文明评论。',0,0),
('message_board_title','点此留言板',0,0),
('message_board_desc','广告位招租',0,0),
('notice','点此留言板',1,0),
('noticecontent','广告位招租...',1,0),
('main_nav_articles','文章',0,0);

-- ----------------------------
-- 11. wz_friendslink（约 15 条）
-- ----------------------------
INSERT INTO `wz_friendslink` (`blog_name`,`blog_url`,`blog_theme`,`blogger_name`,`sort_order`) VALUES
('友链一号','https://example.com/1','技术博客','博主A',1),
('友链二号','https://example.com/2','生活随笔','博主B',2),
('友链三号','https://example.com/3','前端开发','博主C',3),
('友链四号','https://example.com/4','后端架构','博主D',4),
('友链五号','https://example.com/5','算法题解','博主E',5),
('友链六号','https://example.com/6','Python','博主F',6),
('友链七号','https://example.com/7','数据库','博主G',7),
('友链八号','https://example.com/8','Linux','博主H',8),
('友链九号','https://example.com/9','DevOps','博主I',9),
('友链十号','https://example.com/10','开源','博主J',10),
('友链十一号','https://example.com/11','面试','博主K',11),
('友链十二号','https://example.com/12','读书','博主L',12),
('友链十三号','https://example.com/13','全栈','博主M',13),
('友链十四号','https://example.com/14','云原生','博主N',14),
('友链十五号','https://example.com/15','安全','博主O',15);

-- ----------------------------
-- 12. wz_swiper（约 15 条）
-- ----------------------------
INSERT INTO `wz_swiper` (`image_url`,`link_url`,`title`,`sort_order`,`status`) VALUES
('https://picsum.photos/800/300?r=1','/articles','轮播1：文章列表',1,1),
('https://picsum.photos/800/300?r=2','/shop','轮播2：积分商城',2,1),
('https://picsum.photos/800/300?r=3','/leavemessage','轮播3：留言板',3,1),
('https://picsum.photos/800/300?r=4',NULL,'轮播4：欢迎访问',4,1),
('https://picsum.photos/800/300?r=5',NULL,'轮播5：技术分享',5,1),
('https://picsum.photos/800/300?r=6',NULL,'轮播6',6,1),
('https://picsum.photos/800/300?r=7',NULL,'轮播7',7,1),
('https://picsum.photos/800/300?r=8',NULL,'轮播8',8,1),
('https://picsum.photos/800/300?r=9',NULL,'轮播9',9,1),
('https://picsum.photos/800/300?r=10',NULL,'轮播10',10,1),
('https://picsum.photos/800/300?r=11',NULL,'轮播11',11,1),
('https://picsum.photos/800/300?r=12',NULL,'轮播12',12,1),
('https://picsum.photos/800/300?r=13',NULL,'轮播13',13,1),
('https://picsum.photos/800/300?r=14',NULL,'轮播14',14,1),
('https://picsum.photos/800/300?r=15',NULL,'轮播15',15,1);

-- ----------------------------
-- 13. wz_points_goods（约 15 条，含实物与称号）
-- ----------------------------
INSERT INTO `wz_points_goods` (`name`,`type`,`description`,`points_cost`,`stock`,`status`) VALUES
('VIP会员','title','尊享VIP称号',500,NULL,1),
('达人','title','达人称号',300,NULL,1),
('新星','title','新星称号',100,NULL,1),
('定制马克杯','physical','本站定制马克杯',200,50,1),
('技术书籍随机一本','physical','技术书随机发',400,20,1),
('键盘垫','physical','周边键盘垫',80,100,1),
('贴纸套装','physical','博客贴纸',30,200,1),
('至尊称号','title','至尊称号',800,NULL,1),
('帆布包','physical','定制帆布包',150,60,1),
('鼠标垫','physical','大号鼠标垫',60,80,1),
('小风扇','physical','USB小风扇',120,40,1),
('书签套装','physical','金属书签',45,150,1),
('进阶称号','title','进阶称号',250,NULL,1),
('抱枕','physical','周边抱枕',180,30,1),
('徽章','physical','限量徽章',90,70,1);

-- ----------------------------
-- 14. wz_points_orders（约 18 条，user_id 1-18, goods_id 1-15）
-- ----------------------------
INSERT INTO `wz_points_orders` (`user_id`,`goods_id`,`quantity`,`points_cost`,`total_points`,`status`,`receiver_name`,`receiver_phone`,`receiver_address`,`user_remark`,`admin_remark`) VALUES
(3,1,1,500,500,'completed',NULL,NULL,NULL,'兑换称号',NULL),
(4,4,2,200,400,'shipped','张三','13800138001','北京市朝阳区xxx','请发顺丰','已发顺丰 SF123456'),
(5,2,1,300,300,'completed',NULL,NULL,NULL,NULL,NULL),
(6,6,1,80,80,'pending','李四','13900139002','上海市浦东xxx',NULL,NULL),
(7,7,3,30,90,'shipped','王五','13700137003','广州市天河xxx','多送一张','已备注'),
(8,9,1,150,150,'pending','赵六','13600136004','深圳市南山区xxx',NULL,NULL),
(9,10,1,60,60,'completed','钱七','13500135005','杭州市西湖区xxx',NULL,NULL),
(10,11,1,120,120,'shipped','孙八','13400134006','成都市武侯区xxx',NULL,'圆通 YT789'),
(11,3,1,100,100,'completed',NULL,NULL,NULL,NULL,NULL),
(12,5,1,400,400,'pending','周九','13300133007','武汉市洪山区xxx','想要前端书',NULL),
(13,8,1,800,800,'completed',NULL,NULL,NULL,NULL,NULL),
(14,12,2,45,90,'shipped','吴十','13200132008','南京市鼓楼区xxx',NULL,NULL),
(15,13,1,250,250,'completed',NULL,NULL,NULL,NULL,NULL),
(1,14,1,180,180,'shipped','管理员','13100131009','北京海淀xxx',NULL,'已发'),
(2,15,1,90,90,'completed','编辑',NULL,NULL,NULL,NULL),
(3,4,1,200,200,'pending','测试用户1','13000130010','西安雁塔区xxx',NULL,NULL),
(4,6,1,80,80,'shipped','测试用户2','12900129011','苏州工业园区xxx',NULL,'已发'),
(5,7,5,30,150,'pending','测试用户3',NULL,NULL,'送朋友',NULL);

-- ----------------------------
-- 15. wz_user_points_log（约 20 条，user_id 1-15, reason 与 change）
-- ----------------------------
INSERT INTO `wz_user_points_log` (`user_id`,`change`,`reason`) VALUES
(1,10,'daily_login'),
(1,-500,'redeem_goods'),
(2,10,'daily_login'),
(2,50,'admin_adjust'),
(3,10,'daily_login'),
(3,-500,'redeem_goods'),
(4,10,'daily_login'),
(4,5,'comment'),
(4,-400,'redeem_goods'),
(5,10,'daily_login'),
(5,-300,'redeem_goods'),
(6,10,'daily_login'),
(6,5,'comment'),
(7,10,'daily_login'),
(7,-90,'redeem_goods'),
(8,10,'daily_login'),
(9,10,'daily_login'),
(10,10,'daily_login'),
(11,10,'daily_login'),
(12,10,'daily_login');

-- 更新文章统计与用户积分（与订单/流水一致的可选步骤，按需执行）
-- UPDATE wz_articles a SET like_count = (SELECT COUNT(*) FROM wz_article_likes WHERE article_id = a.id), favorite_count = (SELECT COUNT(*) FROM wz_article_favorites WHERE article_id = a.id), comment_count = (SELECT COUNT(*) FROM wz_comments WHERE article_id = a.id AND status = 1);

SET FOREIGN_KEY_CHECKS = 1;
