/**
 * 文栈博客 API 文档 - OpenAPI 3.0
 * 访问 /api-docs 查看 Swagger UI
 */
module.exports = {
  openapi: '3.0.3',
  info: {
    title: '文栈博客 API',
    description: '文栈博客（wzblog）后端接口文档，基于 Express + MySQL（wz_* 表）',
    version: '1.0.0',
  },
  servers: [
    { url: 'http://localhost:8021', description: '本地开发' },
  ],
  tags: [
    { name: '用户', description: '注册、登录、用户信息' },
    { name: '分类', description: '文章分类' },
    { name: '文章', description: '文章 CRUD、回收站、阅读量' },
    { name: '标签', description: '标签管理' },
    { name: '评论', description: '文章评论' },
    { name: '点赞', description: '文章点赞' },
    { name: '留言', description: '留言板' },
    { name: '全局配置', description: 'otherswitch 站点配置' },
    { name: '友情链接', description: '友链' },
    { name: '轮播图', description: '首页轮播' },
    { name: '积分商城', description: '商品、订单、积分流水' },
    { name: '看板', description: '统计数据与排行' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: '登录后返回的 token，需登录的接口在路径中带 /token/',
      },
    },
    schemas: {
      ApiResponse: {
        type: 'object',
        properties: {
          code: { type: 'integer', example: 200 },
          message: { type: 'string', example: 'success' },
          data: { type: 'object', nullable: true },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          username: { type: 'string' },
          email: { type: 'string', nullable: true },
          nickname: { type: 'string', nullable: true },
          avatar_url: { type: 'string', nullable: true },
          role: { type: 'string', enum: ['user', 'editor', 'admin'] },
          is_root: { type: 'integer', enum: [0, 1] },
          status: { type: 'integer' },
          points: { type: 'integer' },
          title: { type: 'string', nullable: true },
          created_at: { type: 'string' },
          updated_at: { type: 'string' },
        },
      },
      Category: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          description: { type: 'string', nullable: true },
          sort_order: { type: 'integer' },
          created_at: { type: 'string' },
        },
      },
      Article: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          title: { type: 'string' },
          summary: { type: 'string', nullable: true },
          cover_url: { type: 'string', nullable: true },
          content: { type: 'string' },
          category_id: { type: 'integer' },
          author_id: { type: 'integer' },
          status: { type: 'integer', description: '0=展示 1=置顶 2=回收站' },
          view_count: { type: 'integer' },
          like_count: { type: 'integer' },
          comment_count: { type: 'integer' },
          created_at: { type: 'string' },
          updated_at: { type: 'string' },
          category_name: { type: 'string' },
          tag_ids: { type: 'array', items: { type: 'integer' } },
        },
      },
      Tag: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          created_at: { type: 'string' },
        },
      },
      Comment: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          article_id: { type: 'integer' },
          user_id: { type: 'integer', nullable: true },
          parent_id: { type: 'integer', nullable: true },
          content: { type: 'string' },
          status: { type: 'integer', description: '1=已发布 0=待审核 2=屏蔽' },
          like_count: { type: 'integer' },
          created_at: { type: 'string' },
          user_name: { type: 'string' },
          user_avatar: { type: 'string' },
        },
      },
      Message: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          user_id: { type: 'integer', nullable: true },
          name: { type: 'string' },
          content: { type: 'string' },
          status: { type: 'integer' },
          value: { type: 'integer' },
          created_at: { type: 'string' },
        },
      },
      Friendslink: {
        type: 'object',
        properties: {
          link_id: { type: 'integer' },
          blog_name: { type: 'string' },
          blog_url: { type: 'string' },
          blog_theme: { type: 'string', nullable: true },
          blogger_name: { type: 'string', nullable: true },
          contact_info: { type: 'string', nullable: true },
          logo_url: { type: 'string', nullable: true },
          sort_order: { type: 'integer' },
        },
      },
      Swiper: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          image_url: { type: 'string' },
          link_url: { type: 'string', nullable: true },
          title: { type: 'string', nullable: true },
          sort_order: { type: 'integer' },
          status: { type: 'integer' },
          created_at: { type: 'string' },
        },
      },
      PointsGoods: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          type: { type: 'string', enum: ['physical', 'title'] },
          description: { type: 'string', nullable: true },
          image_url: { type: 'string', nullable: true },
          points_cost: { type: 'integer' },
          stock: { type: 'integer', nullable: true },
          status: { type: 'integer' },
        },
      },
      PointsOrder: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          user_id: { type: 'integer' },
          goods_id: { type: 'integer' },
          quantity: { type: 'integer' },
          points_cost: { type: 'integer' },
          total_points: { type: 'integer' },
          status: { type: 'string', enum: ['pending', 'approved', 'shipped', 'completed', 'cancelled'] },
          receiver_name: { type: 'string', nullable: true },
          receiver_phone: { type: 'string', nullable: true },
          receiver_address: { type: 'string', nullable: true },
          logistics_company: { type: 'string', nullable: true },
          logistics_no: { type: 'string', nullable: true },
          created_at: { type: 'string' },
        },
      },
    },
  },
  paths: {
    // ---------- 用户 ----------
    '/users/me': {
      get: {
        tags: ['用户'],
        summary: '获取当前登录用户信息',
        description: 'Header 带 Authorization: Bearer {token}，用于恢复登录态',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: '成功', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
          401: { description: '未登录' },
        },
      },
    },
    '/users/login': {
      post: {
        tags: ['用户'],
        summary: '登录',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'password'],
                properties: {
                  username: { type: 'string' },
                  password: { type: 'string' },
                  openid: { type: 'string', description: '可选，微信 openid' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: '成功返回 token 和用户信息',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'integer', example: 200 },
                    message: { type: 'string' },
                    token: { type: 'string' },
                    data: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          400: { description: '用户名或密码错误' },
        },
      },
    },
    '/users/register': {
      post: {
        tags: ['用户'],
        summary: '注册',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'password'],
                properties: {
                  username: { type: 'string' },
                  password: { type: 'string' },
                  email: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: '注册成功' },
          400: { description: '用户名已存在或参数为空' },
        },
      },
    },
    '/users/token/': {
      get: {
        tags: ['用户'],
        summary: '用户列表（需管理员/编辑）',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: '成功', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } } },
      },
    },
    '/users/token/{id}': {
      get: {
        tags: ['用户'],
        summary: '根据 ID 获取用户',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: '成功' }, 404: { description: '用户不存在' } },
      },
      put: {
        tags: ['用户'],
        summary: '更新用户',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  nickname: { type: 'string' },
                  avatar_url: { type: 'string' },
                  email: { type: 'string' },
                  status: { type: 'integer' },
                  role: { type: 'string', enum: ['user', 'editor', 'admin'] },
                  title: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 200: { description: '更新成功' } },
      },
      delete: {
        tags: ['用户'],
        summary: '删除用户',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: '删除成功' }, 400: { description: '无法删除自己' } },
      },
    },
    '/users/token/updatePassword': {
      post: {
        tags: ['用户'],
        summary: '修改密码',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['id', 'oldPassword', 'newPassword'],
                properties: {
                  id: { type: 'integer' },
                  oldPassword: { type: 'string' },
                  newPassword: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 200: { description: '更新成功' }, 400: { description: '原密码错误' } },
      },
    },

    // ---------- 分类 ----------
    '/categories': {
      get: {
        tags: ['分类'],
        summary: '分类列表',
        responses: { 200: { description: '成功', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } } },
      },
      post: {
        tags: ['分类'],
        summary: '新增分类（需登录）',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  sort_order: { type: 'integer' },
                },
              },
            },
          },
        },
        responses: { 200: { description: '创建成功' } },
      },
    },
    '/categories/token/{id}': {
      put: {
        tags: ['分类'],
        summary: '更新分类',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  sort_order: { type: 'integer' },
                },
              },
            },
          },
        },
        responses: { 200: { description: '更新成功' } },
      },
      delete: {
        tags: ['分类'],
        summary: '删除分类（有文章引用时不可删）',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: '删除成功' }, 400: { description: '该分类下还有文章' } },
      },
    },

    // ---------- 文章 ----------
    '/articles': {
      get: {
        tags: ['文章'],
        summary: '文章列表（分页）',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 8 } },
          { name: 'keyword', in: 'query', schema: { type: 'string' } },
          { name: 'category_id', in: 'query', schema: { type: 'integer' } },
          { name: 'tag_id', in: 'query', schema: { type: 'integer' } },
          { name: 'status', in: 'query', description: '0/1 正常与置顶，2 回收站', schema: { type: 'integer' } },
        ],
        responses: {
          200: {
            description: '成功，data 为 { list, pagination }',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } },
          },
        },
      },
      post: {
        tags: ['文章'],
        summary: '创建文章（需登录）',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'content', 'category_id'],
                properties: {
                  title: { type: 'string' },
                  summary: { type: 'string' },
                  cover_url: { type: 'string' },
                  content: { type: 'string' },
                  category_id: { type: 'integer' },
                  author_id: { type: 'integer' },
                  status: { type: 'integer', default: 0 },
                  tag_ids: { type: 'array', items: { type: 'integer' } },
                },
              },
            },
          },
        },
        responses: { 200: { description: '创建成功' } },
      },
    },
    '/articles/{id}': {
      get: {
        tags: ['文章'],
        summary: '文章详情',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
          { name: 'incrementView', in: 'query', description: 'true 时阅读量+1', schema: { type: 'string' } },
        ],
        responses: { 200: { description: '成功' }, 404: { description: '文章不存在' } },
      },
    },
    '/articles/token/{id}': {
      put: {
        tags: ['文章'],
        summary: '更新文章',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  summary: { type: 'string' },
                  cover_url: { type: 'string' },
                  content: { type: 'string' },
                  category_id: { type: 'integer' },
                  status: { type: 'integer' },
                  tag_ids: { type: 'array', items: { type: 'integer' } },
                },
              },
            },
          },
        },
        responses: { 200: { description: '更新成功' }, 403: { description: '编辑只能改自己的文章' } },
      },
      delete: {
        tags: ['文章'],
        summary: '删除文章（默认软删，?soft=0 硬删）',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
          { name: 'soft', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: '删除成功' } },
      },
    },
    '/articles/token/{id}/restore': {
      put: {
        tags: ['文章'],
        summary: '从回收站恢复文章',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: '恢复成功' } },
      },
    },
    '/articles/{id}/view': {
      post: {
        tags: ['文章'],
        summary: '阅读量 +1',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'ok' } },
      },
    },

    // ---------- 标签 ----------
    '/tags': {
      get: {
        tags: ['标签'],
        summary: '标签列表',
        responses: { 200: { description: '成功' } },
      },
      post: {
        tags: ['标签'],
        summary: '新增标签（需登录）',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: { name: { type: 'string' } },
              },
            },
          },
        },
        responses: { 200: { description: '创建成功' } },
      },
    },
    '/tags/token/{id}': {
      put: {
        tags: ['标签'],
        summary: '更新标签',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { name: { type: 'string' } },
              },
            },
          },
        },
        responses: { 200: { description: '更新成功' } },
      },
      delete: {
        tags: ['标签'],
        summary: '删除标签',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: '删除成功' } },
      },
    },

    // ---------- 评论 ----------
    '/comments/article/{articleId}': {
      get: {
        tags: ['评论'],
        summary: '某文章的评论列表',
        parameters: [
          { name: 'articleId', in: 'path', required: true, schema: { type: 'integer' } },
          { name: 'status', in: 'query', description: '1=已发布', schema: { type: 'integer' } },
        ],
        responses: { 200: { description: '成功' } },
      },
    },
    '/comments': {
      post: {
        tags: ['评论'],
        summary: '发表评论（可匿名，带 Token 则关联用户）',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['article_id', 'content'],
                properties: {
                  article_id: { type: 'integer' },
                  parent_id: { type: 'integer', description: '楼中楼回复' },
                  content: { type: 'string' },
                  status: { type: 'integer' },
                },
              },
            },
          },
        },
        responses: { 200: { description: '评论成功' } },
      },
    },
    '/comments/token/{id}': {
      put: {
        tags: ['评论'],
        summary: '更新评论（需登录）',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  content: { type: 'string' },
                  status: { type: 'integer' },
                },
              },
            },
          },
        },
        responses: { 200: { description: '更新成功' } },
      },
      delete: {
        tags: ['评论'],
        summary: '删除评论',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: '删除成功' } },
      },
    },

    // ---------- 点赞 ----------
    '/likes/token/article/{articleId}/toggle': {
      post: {
        tags: ['点赞'],
        summary: '点赞/取消点赞（需登录）',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'articleId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: {
            description: '成功，data 为 { liked: true/false }',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } },
          },
        },
      },
    },
    '/likes/article/{articleId}/check': {
      get: {
        tags: ['点赞'],
        summary: '当前用户是否已点赞（可选 Token）',
        parameters: [{ name: 'articleId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'data 为 { liked: true/false }' } },
      },
    },

    // ---------- 留言 ----------
    '/messages': {
      get: {
        tags: ['留言'],
        summary: '留言列表',
        parameters: [{ name: 'status', in: 'query', schema: { type: 'integer' } }],
        responses: { 200: { description: '成功' } },
      },
      post: {
        tags: ['留言'],
        summary: '发表留言',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['content'],
                properties: {
                  name: { type: 'string' },
                  content: { type: 'string' },
                  value: { type: 'integer' },
                },
              },
            },
          },
        },
        responses: { 200: { description: '创建成功' } },
      },
    },
    '/messages/token/{id}': {
      put: {
        tags: ['留言'],
        summary: '更新留言',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  content: { type: 'string' },
                  status: { type: 'integer' },
                  value: { type: 'integer' },
                },
              },
            },
          },
        },
        responses: { 200: { description: '更新成功' } },
      },
      delete: {
        tags: ['留言'],
        summary: '删除留言',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: '删除成功' } },
      },
    },

    // ---------- 全局配置 ----------
    '/otherswitch': {
      get: {
        tags: ['全局配置'],
        summary: '获取全部配置项',
        responses: { 200: { description: '成功' } },
      },
      post: {
        tags: ['全局配置'],
        summary: '新增配置（需登录）',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  content: { type: 'string' },
                  value: { type: 'integer' },
                },
              },
            },
          },
        },
        responses: { 200: { description: '创建成功' } },
      },
    },
    '/otherswitch/token/{id}': {
      put: {
        tags: ['全局配置'],
        summary: '更新配置',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  content: { type: 'string' },
                  value: { type: 'integer' },
                  deleted: { type: 'integer' },
                },
              },
            },
          },
        },
        responses: { 200: { description: '更新成功' } },
      },
      delete: {
        tags: ['全局配置'],
        summary: '删除配置',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: '删除成功' } },
      },
    },

    // ---------- 友情链接 ----------
    '/friendslink': {
      get: {
        tags: ['友情链接'],
        summary: '友链列表',
        responses: { 200: { description: '成功' } },
      },
      post: {
        tags: ['友情链接'],
        summary: '新增友链（需登录）',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['blog_name', 'blog_url'],
                properties: {
                  blog_name: { type: 'string' },
                  blog_url: { type: 'string' },
                  blog_theme: { type: 'string' },
                  blogger_name: { type: 'string' },
                  contact_info: { type: 'string' },
                  logo_url: { type: 'string' },
                  sort_order: { type: 'integer' },
                },
              },
            },
          },
        },
        responses: { 200: { description: '创建成功' } },
      },
    },
    '/friendslink/token/{link_id}': {
      put: {
        tags: ['友情链接'],
        summary: '更新友链',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'link_id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  blog_name: { type: 'string' },
                  blog_url: { type: 'string' },
                  blog_theme: { type: 'string' },
                  blogger_name: { type: 'string' },
                  contact_info: { type: 'string' },
                  logo_url: { type: 'string' },
                  sort_order: { type: 'integer' },
                },
              },
            },
          },
        },
        responses: { 200: { description: '更新成功' } },
      },
      delete: {
        tags: ['友情链接'],
        summary: '删除友链',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'link_id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: '删除成功' } },
      },
    },

    // ---------- 轮播图 ----------
    '/swiper': {
      get: {
        tags: ['轮播图'],
        summary: '轮播图列表（默认仅展示中的，?all=1 全部）',
        parameters: [{ name: 'all', in: 'query', schema: { type: 'string' } }],
        responses: { 200: { description: '成功' } },
      },
      post: {
        tags: ['轮播图'],
        summary: '新增轮播图（需登录）',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['image_url'],
                properties: {
                  image_url: { type: 'string' },
                  link_url: { type: 'string' },
                  title: { type: 'string' },
                  sort_order: { type: 'integer' },
                  status: { type: 'integer' },
                },
              },
            },
          },
        },
        responses: { 200: { description: '创建成功' } },
      },
    },
    '/swiper/token/{id}': {
      put: {
        tags: ['轮播图'],
        summary: '更新轮播图',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  image_url: { type: 'string' },
                  link_url: { type: 'string' },
                  title: { type: 'string' },
                  sort_order: { type: 'integer' },
                  status: { type: 'integer' },
                },
              },
            },
          },
        },
        responses: { 200: { description: '更新成功' } },
      },
      delete: {
        tags: ['轮播图'],
        summary: '删除轮播图',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: '删除成功' } },
      },
    },

    // ---------- 积分商城 ----------
    '/points/goods': {
      get: {
        tags: ['积分商城'],
        summary: '商品列表（默认仅上架，?all=1 全部）',
        parameters: [{ name: 'all', in: 'query', schema: { type: 'string' } }],
        responses: { 200: { description: '成功' } },
      },
      post: {
        tags: ['积分商城'],
        summary: '新增商品（需登录）',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'points_cost'],
                properties: {
                  name: { type: 'string' },
                  type: { type: 'string', enum: ['physical', 'title'] },
                  description: { type: 'string' },
                  image_url: { type: 'string' },
                  points_cost: { type: 'integer' },
                  stock: { type: 'integer', nullable: true },
                  status: { type: 'integer' },
                },
              },
            },
          },
        },
        responses: { 200: { description: '创建成功' } },
      },
    },
    '/points/goods/{id}': {
      get: {
        tags: ['积分商城'],
        summary: '商品详情',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: '成功' } },
      },
    },
    '/points/token/goods/{id}': {
      put: {
        tags: ['积分商城'],
        summary: '更新商品',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  type: { type: 'string' },
                  description: { type: 'string' },
                  image_url: { type: 'string' },
                  points_cost: { type: 'integer' },
                  stock: { type: 'integer' },
                  status: { type: 'integer' },
                },
              },
            },
          },
        },
        responses: { 200: { description: '更新成功' } },
      },
      delete: {
        tags: ['积分商城'],
        summary: '删除商品',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: '删除成功' } },
      },
    },
    '/points/orders': {
      get: {
        tags: ['积分商城'],
        summary: '订单列表（?my=1 当前用户，否则可传 userId）',
        parameters: [
          { name: 'my', in: 'query', schema: { type: 'string' } },
          { name: 'userId', in: 'query', schema: { type: 'integer' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { 200: { description: '成功，data 为 { list, total }' } },
      },
      post: {
        tags: ['积分商城'],
        summary: '兑换商品（需登录）',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['goods_id'],
                properties: {
                  goods_id: { type: 'integer' },
                  quantity: { type: 'integer' },
                  receiver_name: { type: 'string' },
                  receiver_phone: { type: 'string' },
                  receiver_address: { type: 'string' },
                  user_remark: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 200: { description: '兑换成功' }, 400: { description: '积分不足/库存不足' } },
      },
    },
    '/points/orders/{id}': {
      get: {
        tags: ['积分商城'],
        summary: '订单详情',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: '成功' } },
      },
    },
    '/points/token/orders/{id}': {
      put: {
        tags: ['积分商城'],
        summary: '更新订单状态/物流（管理员）',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', enum: ['pending', 'approved', 'shipped', 'completed', 'cancelled'] },
                  logistics_company: { type: 'string' },
                  logistics_no: { type: 'string' },
                  admin_remark: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 200: { description: '更新成功' } },
      },
    },
    '/points/log': {
      get: {
        tags: ['积分商城'],
        summary: '积分流水（query userId 或当前用户）',
        parameters: [
          { name: 'userId', in: 'query', schema: { type: 'integer' } },
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { 200: { description: '成功，data 为 { list, total }' } },
      },
    },

    // ---------- 看板 ----------
    '/dashboard/token/stats': {
      get: {
        tags: ['看板'],
        summary: '基础统计（用户/文章/评论/留言总数）',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'data: { userTotal, articleTotal, commentTotal, messageTotal }',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } },
          },
        },
      },
    },
    '/dashboard/token/article-rank': {
      get: {
        tags: ['看板'],
        summary: '文章排行',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'type', in: 'query', description: 'view_count | like_count | comment_count', schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { 200: { description: '成功' } },
      },
    },
    '/dashboard/token/user-trend': {
      get: {
        tags: ['看板'],
        summary: '用户增长趋势（按日）',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'days', in: 'query', schema: { type: 'integer' } }],
        responses: { 200: { description: '成功' } },
      },
    },
    '/dashboard/token/article-trend': {
      get: {
        tags: ['看板'],
        summary: '文章发布趋势（按日）',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'days', in: 'query', schema: { type: 'integer' } }],
        responses: { 200: { description: '成功' } },
      },
    },
  },
};
