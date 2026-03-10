-- 积分商城示例商品（称号 + 实物），便于前台/后台测试
-- 执行前请确保已执行 wz_blog_schema.sql（存在 wz_points_goods 表）
-- 请根据实际库名修改 USE

USE `wzblog`;

INSERT INTO `wz_points_goods` (`name`,`type`,`description`,`image_url`,`points_cost`,`stock`,`status`,`created_at`,`updated_at`)
VALUES
('文栈称号：创作者','title','兑换后获得称号「创作者」，展示在个人资料',NULL,100,NULL,1,NOW(),NOW()),
('文栈称号：站长','title','高积分称号「站长」',NULL,300,NULL,1,NOW(),NOW()),
('定制马克杯','physical','文栈 Logo 马克杯（实物，需填收货地址）',NULL,200,20,1,NOW(),NOW()),
('周边帆布包','physical','简约帆布包，库存有限',NULL,350,5,1,NOW(),NOW()),
('积分体验礼：小贴纸','physical','10 积分即可兑换，用于测试低积分流程',NULL,10,100,1,NOW(),NOW());
