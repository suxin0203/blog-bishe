/**
 * API 文档导出脚本
 * 用途：将 Swagger 配置导出为 JSON 格式，供 AI 开发时使用
 * 运行：npm run docs:export
 */

const fs = require('fs');
const path = require('path');
const swaggerSpec = require('../config/swagger');

const docsDir = path.join(__dirname, '../../docs');
const outputDir = path.join(docsDir, 'api-exports');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('📄 开始导出 API 文档...\n');

// 1. 导出完整 OpenAPI JSON
const fullSpecPath = path.join(outputDir, 'openapi-full.json');
fs.writeFileSync(fullSpecPath, JSON.stringify(swaggerSpec, null, 2));
console.log('✅ 完整 OpenAPI 规范已导出：', fullSpecPath);

// 2. 导出简化版（仅接口路径和参数）
const simplified = {
  version: swaggerSpec.info.version,
  title: swaggerSpec.info.title,
  baseURL: swaggerSpec.servers[0].url,
  tags: swaggerSpec.tags,
  endpoints: {}
};

Object.entries(swaggerSpec.paths).forEach(([path, methods]) => {
  Object.entries(methods).forEach(([method, spec]) => {
    const key = `${method.toUpperCase()} ${path}`;
    simplified.endpoints[key] = {
      summary: spec.summary,
      description: spec.description,
      tags: spec.tags,
      auth: spec.security ? 'required' : 'optional',
      params: spec.parameters?.map(p => ({
        name: p.name,
        in: p.in,
        required: p.required,
        type: p.schema?.type,
        description: p.description
      })),
      requestBody: spec.requestBody?.content?.['application/json']?.schema,
      responses: Object.keys(spec.responses || {})
    };
  });
});

const simplifiedPath = path.join(outputDir, 'api-simplified.json');
fs.writeFileSync(simplifiedPath, JSON.stringify(simplified, null, 2));
console.log('✅ 简化版 API 索引已导出：', simplifiedPath);

// 3. 按模块分组导出
const byModule = {};
swaggerSpec.tags.forEach(tag => {
  byModule[tag.name] = {
    description: tag.description,
    endpoints: []
  };
});

Object.entries(swaggerSpec.paths).forEach(([path, methods]) => {
  Object.entries(methods).forEach(([method, spec]) => {
    const tag = spec.tags?.[0];
    if (tag && byModule[tag]) {
      byModule[tag].endpoints.push({
        method: method.toUpperCase(),
        path: path,
        summary: spec.summary,
        auth: spec.security ? 'required' : 'optional'
      });
    }
  });
});

const byModulePath = path.join(outputDir, 'api-by-module.json');
fs.writeFileSync(byModulePath, JSON.stringify(byModule, null, 2));
console.log('✅ 按模块分组的 API 已导出：', byModulePath);

// 4. 生成小程序专用接口清单
const miniappEndpoints = {
  title: '小程序常用接口清单',
  categories: {
    '用户认证': [],
    '微信登录': [],
    '文章浏览': [],
    '互动功能': [],
    '积分商城': [],
    '其他': []
  }
};

const miniappTags = {
  '用户': '用户认证',
  '微信登录': '微信登录',
  '文章': '文章浏览',
  '点赞': '互动功能',
  '收藏': '互动功能',
  '评论': '互动功能',
  '积分商城': '积分商城',
  '分类': '其他',
  '标签': '其他',
  '轮播图': '其他'
};

Object.entries(swaggerSpec.paths).forEach(([path, methods]) => {
  Object.entries(methods).forEach(([method, spec]) => {
    const tag = spec.tags?.[0];
    const category = miniappTags[tag] || '其他';
    
    if (category !== '其他' || ['GET', 'POST'].includes(method.toUpperCase())) {
      miniappEndpoints.categories[category].push({
        method: method.toUpperCase(),
        path: path,
        summary: spec.summary,
        description: spec.description,
        auth: spec.security ? '需要登录' : '无需登录'
      });
    }
  });
});

const miniappPath = path.join(outputDir, 'miniapp-endpoints.json');
fs.writeFileSync(miniappPath, JSON.stringify(miniappEndpoints, null, 2));
console.log('✅ 小程序专用接口清单已导出：', miniappPath);

// 5. 生成统计信息
const stats = {
  totalEndpoints: Object.keys(simplified.endpoints).length,
  byMethod: {},
  byAuth: {
    required: 0,
    optional: 0
  },
  byModule: {}
};

Object.entries(simplified.endpoints).forEach(([key, endpoint]) => {
  const method = key.split(' ')[0];
  stats.byMethod[method] = (stats.byMethod[method] || 0) + 1;
  stats.byAuth[endpoint.auth] = (stats.byAuth[endpoint.auth] || 0) + 1;
  
  endpoint.tags?.forEach(tag => {
    stats.byModule[tag] = (stats.byModule[tag] || 0) + 1;
  });
});

const statsPath = path.join(outputDir, 'api-stats.json');
fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
console.log('✅ API 统计信息已导出：', statsPath);

console.log('\n📊 导出统计：');
console.log(`   - 总接口数：${stats.totalEndpoints}`);
console.log(`   - 需要认证：${stats.byAuth.required}`);
console.log(`   - 无需认证：${stats.byAuth.optional}`);
console.log(`   - 按方法分布：`, stats.byMethod);

console.log('\n✨ API 文档导出完成！');
console.log('\n📁 导出文件位置：', outputDir);
console.log('\n💡 使用建议：');
console.log('   - AI 开发时优先查阅：docs/API接口索引.md');
console.log('   - 小程序开发查阅：wenzhan_miniprogram/docs/API接口快速参考.md');
console.log('   - 需要完整规范时查看：docs/api-exports/openapi-full.json');
