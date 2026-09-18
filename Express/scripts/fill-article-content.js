/**
 * 文章内容补全脚本（AI 向导二期 · 阶段 0）
 * 用法：node scripts/fill-article-content.js
 * 作用：把开发库 wztest-ai 中 14 篇空壳/残缺文章补全为真实内容（只 UPDATE 开发库，正式库 wztest 不受影响）
 * 安全性：按 id 精确 UPDATE，执行前后打印内容长度对比
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

// id -> HTML 内容（与 WangEditor 存储格式一致：p/h2/h3/pre>code/ul/li/blockquote）
const articles = {
  3: `<p>索引是数据库性能优化的第一抓手。这篇记录我在项目里做 MySQL 索引优化的完整思路。</p>
<h2>索引的底层结构</h2>
<p>InnoDB 使用 B+ 树组织索引：非叶子节点只存键值，叶子节点存数据并通过双向链表连接，因此等值查询和范围查询都很快。主键索引的叶子节点存整行数据（聚簇索引），二级索引的叶子节点只存主键值，查完还需要回表。</p>
<h2>我踩过的三个坑</h2>
<h3>1. 最左前缀不满足</h3>
<p>联合索引 (a, b, c) 只在查询条件从 a 开始连续命中时才生效。WHERE b = 1 完全用不上；WHERE a = 1 AND c = 3 只能用到 a。</p>
<h3>2. 索引列上做运算</h3>
<p>WHERE YEAR(created_at) = 2026 会让索引失效，改写成范围查询 WHERE created_at >= '2026-01-01' AND created_at < '2027-01-01' 就能走索引。</p>
<h3>3. 隐式类型转换</h3>
<p>phone 是 varchar，用 WHERE phone = 13800000000 数字去比会触发隐式转换，等价于对列做 CAST，索引失效。养成参数类型与列类型一致的习惯。</p>
<h2>EXPLAIN 是唯一依据</h2>
<p>任何优化前后都要跑 EXPLAIN 看执行计划，重点关注 type（至少到 range）、key（实际用到的索引）、rows（扫描行数）。覆盖索引是性价比最高的手段：把查询需要的列都放进联合索引，Extra 出现 Using index 就说明免去了回表。</p>
<blockquote>结论：索引不是越多越好，写多读少的表要控制索引数量；先看慢查询日志，再动手加索引。</blockquote>`,
  4: `<p>记录刷题第一阶段——数组与哈希表的解题套路。这个专题的核心是：<b>用空间换时间，把 O(n²) 的暴力枚举优化成 O(n) 的一次遍历</b>。</p>
<h2>两数之和：哈希表的入场券</h2>
<p>暴力解法是双层循环找 a + b = target。更优的写法是遍历一次，用哈希表记录「每个元素的下标」，对当前元素 x 查 target - x 是否已经出现过：</p>
<pre><code class="language-javascript">const twoSum = (nums, target) => {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (map.has(need)) return [map.get(need), i];
    map.set(nums[i], i);
  }
  return [];
};</code></pre>
<p>时间 O(n)、空间 O(n)。要点是「先查再存」，天然处理了重复元素。</p>
<h2>三个高频套路</h2>
<ul>
<li><b>前缀和</b>：子数组和问题先转成前缀和之差，配合哈希表统计出现次数（如和为 K 的子数组）。</li>
<li><b>双指针</b>：有序数组的两数之和、移除元素、盛水容器，一头一尾向中间收缩。</li>
<li><b>滑动窗口</b>：无重复字符的最长子串，右指针扩张、左指针收缩，窗口内维护状态。</li>
</ul>
<h2>复盘方法</h2>
<p>每道题做完问自己三个问题：暴力解是什么？瓶颈在哪一步？哈希表/指针消掉了哪层循环？能回答这三问，同类型变体就能秒杀。下一阶段主题：链表与栈。</p>`,
  5: `<p>这周把攒了很久的几本书翻了出来，突然意识到已经很久没有不带目的地读过书了。</p>
<h2>从「有用」到「喜欢」</h2>
<p>以前买书总带着功利心：学编程买技术书，焦虑了买成长书，恨不得每页都能兑换成生产力。这个周末换个姿势，泡了杯茶，重读汪曾祺的《人间草木》。没有划线，没有做笔记，就是读。读到写昆明的雨那段，居然把半年前旅行路过云南的记忆全部翻了出来。</p>
<h2>三点小感受</h2>
<ul>
<li>纸质书和手机是两种注意力模式：翻页的触感会让人慢下来，慢下来才能注意到好句子。</li>
<li>读书不用读完。以前一本书读不完就有负罪感，现在学会了「读不下去就放」，过几个月再拿起来往往正好。</li>
<li>输出不用刻意。以前逼自己写读后感，现在随手在扉页写两句话，反而更真实。</li>
</ul>
<h2>下周计划</h2>
<p>把《代码整洁之道》的技术阅读和一本散文集穿插着来，白天敲代码，晚上翻散文。技术让人谋生，人文让人记得为什么生活。周末读书这件事，值得当成一个长期项目维护下去。</p>`,
  7: `<p>Redis 是博客系统里最常用的缓存层，但缓存不是加个 GET/SET 就完事。这篇整理三种经典缓存异常的成因与对策。</p>
<h2>缓存穿透：查不存在的数据</h2>
<p>请求的数据在缓存和数据库里都不存在，每次都打到数据库。典型攻击方式是用大量随机 ID 请求接口。对策：</p>
<ul>
<li><b>空值缓存</b>：数据库查不到也写入一个短 TTL 的空标记（如 30 秒），挡住重复请求。</li>
<li><b>布隆过滤器</b>：把全部合法 ID 预热进布隆过滤器，不存在的请求直接在缓存层拦截。</li>
<li><b>参数校验</b>：明显非法的 ID（负数、超长）在入口直接拒绝。</li>
</ul>
<h2>缓存雪崩：大量 key 同时失效</h2>
<p>同一批 key 设置了相同 TTL，到期瞬间全部穿透到数据库。对策：过期时间加随机偏移（如基础 30 分钟 + 随机 0~300 秒），把失效时间打散；热点数据用「逻辑过期 + 异步更新」，物理上永不过期。</p>
<h2>缓存击穿：单个热 key 失效</h2>
<p>某个热点 key 过期瞬间，大量并发同时回源。对策是互斥锁：只放一个请求去查数据库，其余请求短暂等待后读新缓存。单机用本地锁，分布式用 SET NX。</p>
<h2>选型建议</h2>
<p>个人博客规模的系统，空值缓存 + 随机 TTL 就能解决 90% 的问题；布隆过滤器和分布式锁等流量到了再上，避免过度设计。</p>`,
  8: `<p>把项目从 Webpack 迁到 Vite 之后，本地启动从 40 秒变成 2 秒。这篇聊聊 Vite 为什么快，以及实践中的配置要点。</p>
<h2>Vite 快的原理</h2>
<p>Webpack 启动时要把整个依赖图打包完才可运行；Vite 的开发模式直接基于浏览器原生 ESM：请求哪个模块就按需编译哪个，依赖预构建交给 esbuild（Go 写的，比 JS 打包器快一个数量级）。所以启动速度与项目大小基本无关。</p>
<h2>实践配置</h2>
<pre><code class="language-javascript">import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  resolve: { alias: { '@': '/src' } },
  server: { port: 5173, open: true },
  build: {
    rollupOptions: {
      output: {
        manualChunks: { vendor: ['vue', 'vue-router', 'pinia'] }
      }
    }
  }
});</code></pre>
<h2>三个实用优化</h2>
<ul>
<li><b>依赖预构建缓存</b>：package.json 的依赖没变就不要删 node_modules/.vite，二次启动接近秒开。</li>
<li><b>手动分包</b>：把 Vue 全家桶、ECharts 这类稳定依赖拆成独立 chunk，业务代码改动不影响它们的缓存。</li>
<li><b>按需引入组件库</b>：naive-ui 配合 unplugin-vue-components，产物体积明显下降。</li>
</ul>
<h2>踩过的坑</h2>
<p>CommonJS 依赖在浏览器 ESM 环境会有互操作问题，遇到「xxx is not a function」优先怀疑预构建，把包名加进 optimizeDeps.include 重启即可。总体而言，新项目直接上 Vite，老项目值得迁移。</p>`,
  9: `<p>整理一份服务器运维最常用的 Linux 命令速查，按使用场景分类，都是日常高频操作。</p>
<h2>文件与目录</h2>
<pre><code class="language-bash">ls -lah          # 列出文件（含隐藏文件，人类可读大小）
cd -             # 回到上一个目录
find /var/log -name '*.log' -mtime +7   # 7 天前的日志
du -sh *         # 当前目录各文件夹占用大小
grep -rn 'error' ./logs --include='*.log'   # 递归搜索关键字</code></pre>
<h2>进程管理</h2>
<pre><code class="language-bash">ps -ef | grep node     # 查进程
top                    # 实时资源监控（P 按CPU排序，M 按内存排序）
kill -9 12345          # 强杀进程
nohup node app.js &    # 后台启动
lsof -i:8021           # 查端口占用</code></pre>
<h2>网络排查</h2>
<pre><code class="language-bash">curl -I https://example.com     # 只看响应头
ping -c 4 8.8.8.8               # 连通性
netstat -tlnp                   # 本机监听端口
scp app.tar.gz root@1.2.3.4:/root/   # 传文件</code></pre>
<h2>权限与其他</h2>
<p>chmod +x 给执行权限；chown user:user file 改属主；tar -xzvf 解压；crontab -e 编辑定时任务。日常运维记住一个原则：先看日志（tail -f），再查进程，最后动配置。命令不用背，用的时候查，用过二十次自然就记住了。</p>`,
  10: `<p>复盘最近一场大厂前端岗的一面和二面，把被问住的问题和答得好的问题都记下来，给后续求职的同学一个参考。</p>
<h2>一面（基础 + 算法，60 分钟）</h2>
<p>开场十分钟项目介绍，面试官抓住「为什么用 Pinia 不用 Vuex」深挖了三层：状态共享方案对比、响应式原理、模块化设计。基础部分问了事件循环（宏任务/微任务执行顺序）、Vue 响应式（Proxy 相比 defineProperty 的优劣）、跨端方案。算法两道：无重复字符最长子串（滑动窗口）、合并两个有序链表，都要求现场手写并讲思路。</p>
<h2>二面（项目深挖 + 设计，60 分钟）</h2>
<p>二面基本没有八股，全程围绕项目：权限路由怎么设计的？token 无感刷新的并发队列怎么处理？如果 QPS 涨十倍哪里先崩？最后一道开放设计题：设计一个站内消息系统。这轮最大的感受是<b>面试官在考察技术决策的理由，而不是技术名词的堆砌</b>。</p>
<h2>复盘与改进</h2>
<ul>
<li>项目里每个技术选型都要能说出「备选方案是什么、为什么不用」，这是二面的核心考点。</li>
<li>算法不能只会思路，手写要练到无 IDE 一遍过。</li>
<li>反问环节问团队技术栈和成长机制，比问加班印象分高。</li>
</ul>
<p>结果还在等，但这轮面试暴露的短板非常有价值：八股是底线，项目的深度才是区分度。</p>`,
  11: `<p>TypeScript 的类型系统是图灵完备的，可以在类型层面做运算——这类写法俗称「类型体操」。这篇记录常用的进阶套路。</p>
<h2>从工具类型开始</h2>
<p>内置工具类型是体操的基本功，必会五个：</p>
<pre><code class="language-typescript">type PartialUser = Partial&lt;User&gt;;       // 全部可选
type RequiredUser = Required&lt;User&gt;;     // 全部必填
type UserPreview = Pick&lt;User, 'id' | 'name'&gt;;   // 挑选字段
type UserNoId = Omit&lt;User, 'id'&gt;;       // 排除字段
type NameMap = Record&lt;string, User&gt;;    // 键值映射</code></pre>
<h2>条件类型与 infer</h2>
<p>条件类型让类型具备「分支判断」能力，infer 用于在类型模式中「解构」出感兴趣的部分：</p>
<pre><code class="language-typescript">type ElementType&lt;T&gt; = T extends (infer U)[] ? U : never;
type A = ElementType&lt;string[]&gt;;   // string

type UnwrapPromise&lt;T&gt; = T extends Promise&lt;infer V&gt; ? V : T;
type B = UnwrapPromise&lt;Promise&lt;number&gt;&gt;;   // number</code></pre>
<h2>模板字面量类型</h2>
<p>TS 4.1 之后可以对字符串类型做拼接与模式匹配，事件处理器、路由表这类场景很好用：</p>
<pre><code class="language-typescript">type EventName&lt;T extends string&gt; = \`on\${Capitalize&lt;T&gt;}\`;
type Handler&lt;T extends string&gt; = Record&lt;EventName&lt;T&gt;, () =&gt; void&gt;;
// { onClick: () => void; onFocus: () => void }
type H = Handler&lt;'click' | 'focus'&gt;;</code></pre>
<h2>练习建议</h2>
<p>推荐 type-challenges 仓库从 easy 刷到 medium，理解 each 工具类型的实现原理比记住结论重要。类型体操在业务里要克制：可读性优先，过度炫技的深层嵌套条件类型是团队灾难。</p>`,
  12: `<p>重读《代码整洁之道》，这本 2008 年的书里的建议在今天依然字字见血。记录最触动我的几条与实践体会。</p>
<h2>命名是最便宜的文档</h2>
<p>书里说：好的命名意味着你不需要注释。对比 getProcessedData 和 getData2，前者自解释。我的实践准则是：变量用名词、函数用动词、布尔值用 is/has/can 开头；宁可名字长，不要名字含糊。</p>
<h2>函数的第一戒律：短小</h2>
<p>函数应该只做一件事，并且把它做好。判断标准是「能否只用一层缩进」。把长函数拆成一系列职责单一的短函数之后，主流程读起来像目录：</p>
<pre><code class="language-javascript">async function publishArticle(id) {
  const article = await loadArticle(id);
  const cleaned = sanitize(article);
  await save(cleaned);
  notifySubscribers(cleaned);
}</code></pre>
<h2>注释的真相</h2>
<p>「注释不是用来补救烂代码的」。与其写一段注释解释这段诡异的代码在干什么，不如花十分钟把它重构成不需要解释的样子。只有「为什么这么做」（业务背景、权衡过程）值得写注释，「做了什么」交给代码自己说。</p>
<h2>其他要点</h2>
<ul>
<li>错误处理不要污染主逻辑，统一在边界捕获。</li>
<li>类要小，职责单一，函数参数最多两三个。</li>
<li>重构是持续动作，不是某天的专项任务——童子军军规：让代码比你离开时更干净。</li>
</ul>
<p>这本书最大的价值不是具体规则，而是传递一种态度：代码首先是写给人看的，其次才是给机器执行的。</p>`,
  13: `<p>Nginx 是个人服务器上性价比最高的软件：反向代理、负载均衡、静态资源、HTTPS 一肩挑。这篇记录博客系统的实际配置。</p>
<h2>最小可用配置</h2>
<pre><code class="language-nginx">server {
    listen 443 ssl;
    server_name wzblog.suxin23.cn;

    # 前端静态资源
    root /www/wwwroot/wzBlog/dist;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;   # hash 或 history 路由兜底
    }

    # 后端 API 反向代理
    location /api/ {
        proxy_pass http://127.0.0.1:8021/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}</code></pre>
<h2>三个关键点</h2>
<h3>1. try_files 的路由兜底</h3>
<p>前端路由刷新 404，几乎都是这一行没配。含义是先找真实文件，找不到就回退到 index.html 交给前端路由。</p>
<h3>2. proxy_pass 末尾的斜杠</h3>
<p>location /api/ + proxy_pass http://127.0.0.1:8021/ 会<b>去掉</b> /api 前缀；末尾不带斜杠则会保留。前缀拼接对不上是反向代理最常见的 404 原因。</p>
<h3>3. 转发真实 IP</h3>
<p>不加 X-Real-IP / X-Forwarded-For，后端拿到的永远是 127.0.0.1，限流和日志全部失真。Express 里配套 app.set('trust proxy', true)。</p>
<h2>日常运维</h2>
<p>改完配置先 nginx -t 语法检查，再 nginx -s reload 热加载；日志在 /var/log/nginx/ 下，access log 排查请求、error log 定位配置问题。性能层面记住两个指令：gzip on 开压缩，expires 给静态资源加缓存头。</p>`,
  14: `<p>单人项目也要有 Git 规范——这不是形式主义，而是让三个月后的自己看懂现在的代码。整理我在个人项目里执行的 Git 工作流。</p>
<h2>分支模型：简化版 Git Flow</h2>
<p>企业级的 Git Flow 对个人项目太重，简化成两条长期分支：</p>
<ul>
<li><b>main</b>：永远可部署，只接受合并，不直接提交；</li>
<li><b>dev</b>：日常开发主线，功能完成后合入 main 并打 tag。</li>
</ul>
<p>新功能开 feature/xxx 分支，修紧急线上问题开 hotfix/xxx，完成后合回。分支存活时间控制在一周内，越拖越难合。</p>
<h2>Commit Message 规范</h2>
<p>采用 Conventional Commits：类型(范围): 描述。</p>
<pre><code class="language-bash">feat(ai): 新增文章搜索工具
fix(login): 补充缺失的 formRef 声明
docs: 更新二期部署文档
refactor(ai): 流式调用改为 axios 适配 Node14</code></pre>
<p>好处是 git log 可以当变更日志直接用，也能配合语义化版本自动发版。</p>
<h2>merge 还是 rebase</h2>
<p>个人准则：功能分支合入主线用 merge --no-ff（保留功能边界），功能分支内部同步主线用 rebase（保持线性历史）。rebase 黄金法则：只对没推送过的本地提交做变基。</p>
<h2>事故自救</h2>
<p>commit 错了还没推：git commit --amend；已经推了：git revert 生成反向提交；误删分支：git reflog 找回。最后一条铁律：<b>重要分支推远端，本地不可靠</b>。</p>`,
  15: `<p>asyncio 是 Python 处理 IO 密集任务的答案，但很多人写完就疑惑「为什么没变快」。这篇梳理异步编程的心智模型。</p>
<h2>核心概念：事件循环</h2>
<p>asyncio 的本质是单线程内的协作式调度：协程在 await 处主动让出控制权，事件循环去执行其他协程，IO 完成后再切回来。关键词是「协作」——一个协程如果不主动 await，就会卡住整个循环。</p>
<h2>基本用法</h2>
<pre><code class="language-python">import asyncio

async def fetch(name, delay):
    await asyncio.sleep(delay)          # 模拟 IO
    return f'{name} done'

async def main():
    results = await asyncio.gather(
        fetch('a', 1), fetch('b', 2), fetch('c', 1.5)
    )
    print(results)                       # 总耗时约 2s 而非 4.5s

asyncio.run(main())</code></pre>
<p>gather 并发调度多个协程，总耗时约等于最慢的一个，这就是异步的价值。</p>
<h2>最容易踩的三个坑</h2>
<ul>
<li><b>在协程里写阻塞调用</b>：time.sleep、requests、重计算都会冻结整个事件循环，必须换对应的异步库（aiohttp）或丢进线程池（asyncio.to_thread）。</li>
<li><b>忘记 await</b>：调用协程不 await 只会创建一个从未执行的协程对象，不会有任何报错。</li>
<li><b>过度并发</b>：一万个并发请求会打崩对方服务也打崩自己，用 Semaphore 控制并发上限。</li>
</ul>
<h2>适用边界</h2>
<p>异步只加速 IO 等待（网络、磁盘），对 CPU 密集任务无效——那是多进程的领域。选型口诀：IO 多用 asyncio，CPU 多用 multiprocessing，简单脚本别用任何花活。</p>`,
  16: `<p>Kubernetes 的概念有一百多个，但入门只需要吃透两个对象：Pod 和 Deployment。这篇用博客系统的部署举例。</p>
<h2>Pod：最小调度单位</h2>
<p>Pod 是一组共享网络和存储的容器集合。多数场景一个 Pod 就一个容器，但它们不是等价概念——Pod 里的容器共享同一个 IP 和端口空间，可以用 localhost 互访，适合放需要「同生共死」的辅助容器。</p>
<h2>Deployment：让 Pod 有副本、能自愈</h2>
<p>直接创建的 Pod 挂了就没了。Deployment 负责维持期望副本数，并提供了滚动更新与回滚：</p>
<pre><code class="language-yaml">apiVersion: apps/v1
kind: Deployment
metadata:
  name: blog-api
spec:
  replicas: 2
  selector:
    matchLabels: { app: blog-api }
  template:
    metadata:
      labels: { app: blog-api }
    spec:
      containers:
        - name: express
          image: registry.example.com/blog-api:1.2.0
          ports: [{ containerPort: 8021 }]</code></pre>
<p>kubectl apply 之后，K8s 会逐步替换旧 Pod 实现滚动更新；新版本起不来会自动暂停，kubectl rollout undo 一键回滚。</p>
<h2>常用命令</h2>
<pre><code class="language-bash">kubectl get pods -o wide        # 看 Pod 列表与节点
kubectl logs -f pod-name        # 追日志
kubectl describe pod pod-name   # 排查调度/启动失败
kubectl scale deploy blog-api --replicas=4</code></pre>
<h2>下一步</h2>
<p>Pod 通过 Service 暴露访问，配置用 ConfigMap/Secret 注入——这三件是入门后的第二课。建议用 minikube 或 kind 在本地起个集群练手，比看十篇教程都有效。</p>`,
  19: `<p>博客首页有一个「每日图片推荐」轮播图模块，这篇介绍它的功能设计与实现思路。</p>
<h2>功能设计</h2>
<p>轮播图的数据由后台管理维护：管理员可以上传图片、填写跳转链接、调整排序，前台自动拉取展示。设计上遵循三个原则：</p>
<ul>
<li><b>内容运营化</b>：图片不是写死在前端的，站长随时可以在后台换图，前台零发布即可更新；</li>
<li><b>自动轮播</b>：默认 4 秒切换，鼠标悬停暂停，离开继续；</li>
<li><b>可跳转</b>：每张图可配置跳转链接，既是装饰位也是导流位。</li>
</ul>
<h2>实现要点</h2>
<p>轮播组件核心是「位移 + 过渡」：图片横向排列在一个长条容器里，通过改变 transform: translateX 控制显示第几张，配合 transition 实现平滑滑动。切到最后一张时先无感切回第一张的克隆帧，再瞬时归零，实现无缝循环。</p>
<h2>踩过的坑</h2>
<ul>
<li>图片地址曾被拼成本机 localhost，导致线上全部裂图——后来统一归一化为相对路径 /upload/ 开头，前端再按环境拼接域名；</li>
<li>自动轮播的 setInterval 要在组件卸载时清除，否则路由切换后仍在后台跑；</li>
<li>移动端记得处理 touch 滑动事件与 click 的冲突。</li>
</ul>
<p>一个看起来简单的轮播图，做稳定、做通用，其实涵盖了前端组件设计的很多基本功。</p>`,
};

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const ids = Object.keys(articles).map(Number);
  const [before] = await conn.query(
    `SELECT id, title, CHAR_LENGTH(content) AS len FROM wz_articles WHERE id IN (${ids.map(() => '?').join(',')}) ORDER BY id`,
    ids,
  );
  console.log('===== 执行前 =====');
  before.forEach((r) => console.log(`#${r.id} ${r.title} — ${r.len} 字符`));

  for (const [id, html] of Object.entries(articles)) {
    const [ret] = await conn.query(
      'UPDATE wz_articles SET content = ?, updated_at = NOW() WHERE id = ?',
      [html, Number(id)],
    );
    if (ret.affectedRows !== 1) console.error(`!! id=${id} 更新失败（affectedRows=${ret.affectedRows}）`);
  }

  const [after] = await conn.query(
    `SELECT id, title, CHAR_LENGTH(content) AS len FROM wz_articles WHERE id IN (${ids.map(() => '?').join(',')}) ORDER BY id`,
    ids,
  );
  console.log('===== 执行后 =====');
  after.forEach((r) => console.log(`#${r.id} ${r.title} — ${r.len} 字符`));

  const [isolation] = await conn.query('SELECT DATABASE() AS db');
  console.log('操作库确认:', isolation[0].db, '（应为 wztest-ai）');
  await conn.end();
  console.log('✅ 内容补全完成');
})().catch((e) => {
  console.error('失败:', e.message);
  process.exit(1);
});
