/**
 * AI 向导连通性测试脚本（方案一第一步验证）
 * 用法：node scripts/test-ai.js
 * 作用：① 依次尝试智谱免费 flash 模型，找到第一个可用的；② 对该模型做一次 SSE 流式调用验证打字机效果
 */
require('dotenv').config();

const BASE_URL = 'https://open.bigmodel.cn/api/paas/v4';
// 按新旧排列，命中即停（都是官方免费模型，见 docs/AI向导-方案一设计计划.md）
const FREE_MODELS = ['glm-4.7-flash', 'glm-4.5-flash', 'glm-4-flash-250414'];

const apiKey = process.env.ZHIPU_API_KEY;
if (!apiKey || !apiKey.trim()) {
  console.error('!!! 未配置 ZHIPU_API_KEY，请填写 Express/.env 后重试');
  process.exit(1);
}

async function chatOnce(model) {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey.trim()}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: '你是文栈博客的向导，用中文简洁回答。' },
        { role: 'user', content: '用一句话介绍你自己，并说明你是什么模型。' },
      ],
    }),
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

async function testStream(model) {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey.trim()}`,
    },
    body: JSON.stringify({
      model,
      stream: true,
      messages: [{ role: 'user', content: '从 1 数到 5，每个数字之间用空格隔开。' }],
    }),
  });
  if (!res.ok || !res.body) {
    console.error(`    流式请求失败: HTTP ${res.status}`);
    return;
  }
  process.stdout.write('    流式输出: ');
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    // SSE 按行解析，data: [DONE] 为结束标记
    const lines = buf.split('\n');
    buf = lines.pop();
    for (const line of lines) {
      const payload = line.replace(/^data:\s*/, '').trim();
      if (!payload || payload === '[DONE]') continue;
      try {
        const delta = JSON.parse(payload).choices?.[0]?.delta?.content;
        if (delta) process.stdout.write(delta);
      } catch (_) { /* 忽略心跳等非 JSON 行 */ }
    }
  }
  console.log('\n    ✓ 流式输出正常');
}

(async () => {
  let workingModel = null;
  for (const model of FREE_MODELS) {
    process.stdout.write(`测试模型 ${model} ... `);
    try {
      const { ok, status, body } = await chatOnce(model);
      if (ok && body.choices?.[0]?.message?.content) {
        console.log('✓ 可用');
        console.log(`    回复: ${body.choices[0].message.content.trim()}`);
        workingModel = model;
        break;
      }
      console.log(`✗ HTTP ${status} ${JSON.stringify(body.error || body).slice(0, 200)}`);
    } catch (err) {
      console.log(`✗ ${err.message}`);
    }
  }

  if (!workingModel) {
    console.error('!!! 所有候选模型都不可用，请检查 Key 或到 bigmodel.cn 确认免费模型名称');
    process.exit(1);
  }
  console.log(`\n对 ${workingModel} 做流式验证：`);
  await testStream(workingModel);
  console.log(`\n结论：AI 向导后端默认模型建议写 「${workingModel}」`);
})();
