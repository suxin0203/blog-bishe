# 文栈博客 · 数据库脚本说明

本目录为项目**唯一**数据库脚本入口，按用途分类存放。

---

## 一、新建库（推荐）

**首次部署**或需要**从零建库**时，按顺序执行：

| 文件 | 说明 |
|------|------|
| `wz_blog_schema.sql` | 建表（仅项目实际使用的表，已剔除未使用表） |
| `wz_blog_seed.sql`   | 基础测试数据（约每表 15 条，含外键约束） |

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS wzblog DEFAULT CHARSET utf8mb4 COLLATE utf8mb4_general_ci;"
mysql -u root -p wzblog < sql/wz_blog_schema.sql
mysql -u root -p wzblog < sql/wz_blog_seed.sql
```

---

## 二、已有旧库升级（迁移）

若数据库是由**旧版**项目创建的（缺少新字段或配置项），可执行：

| 目录/文件 | 说明 |
|-----------|------|
| `migrations/01-existing-db-upgrade.sql` | 为旧表增加字段 + 插入全局配置（可重复执行 INSERT，ALTER 若报“列已存在”可忽略） |

执行前建议备份。INSERT 已做 `WHERE NOT EXISTS`，可重复执行；ALTER 每环境执行一次即可。

---

## 三、可选脚本（测试/辅助）

`scripts/` 下为可选脚本，用于本地或测试环境：

| 文件 | 说明 |
|------|------|
| `reset-test-passwords.sql` | 将测试账号（如 admin/editor/user1）密码统一设为 123456 |
| `seed-dashboard-dates.sql` | 按日期插入用户/文章等，便于看板“用户增长趋势”等图表有数据 |
| `seed-points-shop.sql`     | 积分商城示例商品（称号、实物） |
| `seed-scroll-test.sql`     | 大量分类/标签/友链等，用于测试列表滚动与分页 |

脚本内若含 `USE \`wz-blog\`;` 等库名，请按实际库名修改后再执行。

---

## 四、目录结构

```
sql/
├── README.md                    # 本说明
├── wz_blog_schema.sql           # 建表（主）
├── wz_blog_seed.sql             # 基础种子数据（主）
├── migrations/                  # 已有库增量升级
│   └── 01-existing-db-upgrade.sql
└── scripts/                     # 可选测试/辅助脚本
    ├── reset-test-passwords.sql
    ├── seed-dashboard-dates.sql
    ├── seed-points-shop.sql
    └── seed-scroll-test.sql
```

根目录下的 `newblog.sql` / `newblog_seed.sql` 已废弃，请以本目录下 schema/seed 为准。
