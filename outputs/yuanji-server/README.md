# 源集后端（MVP）

服装批发小程序的 API 服务。**零依赖**（只用 Node 内置模块），`node server.js` 就能跑，方便先用起来再逐步换基础设施。

## 跑起来

```powershell
cd "C:\Users\Administrator\Documents\Codex\2026-09-11\new-chat\outputs\yuanji-server"
node server.js                 # 默认 http://127.0.0.1:3000
node --watch server.js         # 改代码自动重启（开发用）
```

## 目录结构

```
yuanji-server/
├── server.js          HTTP 服务：路由分发、JSON 解析、CORS、统一响应
├── src/app.js         全部业务接口（首页/商品/档口/搜索/账号/收藏/订阅/进货车/订单/地址）
├── src/db.js          JSON 文件数据库（data/db.json，原子写入）
├── src/auth.js        登录态：HMAC 签名 token；code2session（配了 APPID/SECRET 走真接口）
├── src/pricing.js     价格闸门 + 档口阶梯满减 + 商品对外形状
├── src/seed.js        种子数据（由小程序 utils/data.js 生成，见 work/gen-server-seed.mjs）
└── data/db.json       运行数据：用户 / 订单 / 收藏 / 订阅 / 领券 / 地址
```

## 接口（统一前缀 `/api/v1`，响应 `{ code, msg, data }`）

| 分类 | 接口 |
| --- | --- |
| 基础 | `GET /health`、`GET /home`、`GET /markets`、`GET /categories` |
| 商品 | `GET /goods?market=&category=&sort=&filter=&kw=&page=`、`GET /goods/{id}` |
| 档口 | `GET /stalls`、`GET /stalls/{id}` |
| 搜索 | `GET /search?kw=&sort=` |
| 账号 | `POST /auth/login`、`POST /auth/phone`、`GET /user/profile`、`GET/POST /user/cert` |
| 收藏订阅 | `GET/POST /favorites`、`DELETE /favorites/{goodsId}`、`GET/POST /subscriptions`、`DELETE /subscriptions/{stallId}` |
| 卡券 | `GET /coupons`、`POST /coupons/{id}/claim` |
| 进货车 | `GET/POST /cart`、`PATCH /cart/{id}`、`DELETE /cart/{id}` |
| 订单 | `POST /orders/preview`、`POST /orders`、`GET /orders?status=`、`GET /orders/{id}`、`POST /orders/{id}/pay` / `cancel` / `ship` / `confirm` |
| 地址 | `GET/POST /addresses`、`POST /addresses/{id}/default` |
| 素材 | `GET /materials` |
| 档口工作台 | `POST /stall/login`、`GET /stall/me`、`GET /stall/stats`、`GET /stall/orders`、`POST /stall/orders/{id}/ship`、`GET /stall/goods`、`POST /stall/goods/{id}/toggle` |
| 档口上架 | `POST /stall/goods`（新建）、`POST /stall/goods/{id}/update`（编辑自己上架的）、`POST /upload`（图片上传） |
| 档口资料 | `GET/POST /stall/profile`（结算账户与资质）、`GET /admin/stall-profiles`、`POST /admin/stalls/{id}/review` |
| 对账（运营） | `GET /admin/bills/summary`、`GET /admin/bills/export`、`POST /admin/bills/download` |
| 对账（逐笔） | `POST /admin/bills/reconcile`（跑一次逐笔比对）、`GET /admin/bills/reconcile?date=`（看结果） |
| 运营位配置 | `GET/POST /admin/campaigns`、`POST /admin/campaigns/{id}/toggle`、`POST /admin/campaigns/{id}/remove` |
| 分账（运营） | `POST /admin/stalls/{id}/invite`、`POST /admin/stalls/{id}/settle-account`、`GET /admin/settlements`、`POST /admin/settle/run` |

鉴权：请求头 `Authorization: Bearer <token>`（由 `POST /auth/login` 返回）。

## 已实现的关键业务规则

1. **价格闸门在服务端**：未认证用户的商品响应里**根本没有拿货价字段**（只有建议零售价 + `pv.locked=true`），认证后才返回 `price` 与 `pv.boost`（助力预估价）。前端拿不到就是拿不到。
2. **按档口拆单**：一单跨多个档口时，服务端拆成多个订单，各自算满减、各自发货。
3. **档口阶梯满减**：按档口金额命中最高的那一档（18 档：满 699 减 5 ~ 满 30000 减 1050）。
4. **下单前必须认证**：未认证调用 `POST /orders` 直接返回 403。

## 环境变量

| 变量 | 默认 | 说明 |
| --- | --- | --- |
| `PORT` | 3000 | 监听端口 |
| `HOST` | 0.0.0.0 | 监听地址 |
| `DB_FILE` | `data/db.json` | 数据文件位置 |
| `TOKEN_SECRET` | 内置开发密钥 | 上线必须改，用于签发登录 token |
| `WECHAT_APPID` / `WECHAT_SECRET` | 空 | 填上就走真实 `code2session`；不填用本地演示账号 |
| `LOG` | 开启 | 设为 `off` 关闭访问日志 |
| `WECHAT_MCHID` | 空 | 微信支付商户号（配上才走真实支付） |
| `WECHAT_PAY_SERIAL` | 空 | 商户 API 证书序列号 |
| `WECHAT_PAY_PRIVATE_KEY` | 空 | `apiclient_key.pem` 内容或路径 |
| `WECHAT_PAY_APIV3_KEY` | 空 | APIv3 密钥（回调 AES-GCM 解密用） |
| `WECHAT_PAY_PLATFORM_CERT` | 空 | 微信支付平台证书（回调验签用，生产必须配） |
| `WECHAT_PAY_NOTIFY_URL` | 空 | 支付回调地址（HTTPS 公网域名） |
| `ORDER_TIMEOUT_MIN` | 30 | 未支付订单自动关闭的超时时间（分钟，可小数） |
| `SWEEP_INTERVAL_SEC` | 60 | 关单扫描间隔（秒） |
| `ADMIN_TOKEN` | 空 | 配置后可手动触发关单：`POST /admin/sweep`（请求头 `x-admin-token`） |
| `PLATFORM_FEE_RATE` | 0.05 | 平台佣金比例（分账时从档口货款里扣） |
| `PROFIT_SHARING_ON_PAY` | 开启 | 设为 `0` 关闭「支付成功自动分账」 |
| `UPLOAD_DIR` | `data/uploads` | 商品图上传目录（静态路由 `/uploads/<文件名>`） |
| `UPLOAD_MAX_BYTES` | 4MB | 单张图片大小上限 |
| `ASSET_BASE_URL` | 自动用请求 Host | 返回给前端的图片域名前缀；上 CDN 后填 CDN 域名 |
| `AFTERSALE_ESCALATE_HOURS` | 24 | 售后单超过多少小时未处理自动转平台介入 |
| `NOTIFY_WEBHOOK` | 空 | 对账有差异时推送的机器人地址（企业微信/钉钉，text 格式） |

## 支付

`src/pay.js` 实现了微信支付 APIv3（JSAPI）的完整链路：统一下单 → 小程序调起支付 → 回调验签解密 → 订单状态流转 → 主动查单对账。

- **没配商户号**：自动 mock 模式，点「去付款」直接置为「待发货」（演示 / 联调用）。
- **配了商户号**：`POST /orders/{id}/pay` 返回 `wx.requestPayment` 所需参数，支付成功后微信回调 `POST /pay/notify`。
- 配置步骤、环境变量、常见错误码见 `outputs/docs/微信支付接入说明.md`。
- **退款**：`POST /orders/{id}/refund` 走微信退款接口，回调 `/pay/refund-notify` 自动把订单置为「已退款」；未配商户号时按演示模式直接退款。
- **超时关单**：服务启动即开启定时任务（默认 30 分钟未支付自动关闭，真支付模式会调微信关单接口）。
- **平台证书**：服务启动时 + 每天自动拉取 `/v3/certificates` 并用于回调验签（没配商户号时自动跳过）。
- **分账（平台代收 → 按档口结算，避免二清）**：`src/profitsharing.js`。
  支付成功后自动发起分账（档口货款 = 订单实付 − 平台佣金 `PLATFORM_FEE_RATE`），退款时自动分账回退；
  档口未绑结算账户则挂账（`hold`），补绑后定时任务自动补分账。
  接口：`POST /admin/stalls/{id}/settle-account`、`GET /orders/{id}/settle`、`POST /admin/settle/run`、`GET /admin/settlements`。
  规则见 `outputs/docs/微信支付接入说明.md` 第八节。

## 商品图片上传

- `POST /upload`（body：`{ data: <base64>, contentType, filename }`）→ 存到 `UPLOAD_DIR`，
  返回可直接访问的 URL（`http://<host>/uploads/<文件名>`），静态路由由 `server.js` 提供并带一年缓存头。
- 档口上架商品时把该 URL 传给 `POST /stall/goods` 的 `imgUrl` 字段即可；买家列表/搜索/详情立即可见。
- **上生产建议换成对象存储**：把 `src/uploads.js` 的 `saveImage` 改为腾讯云 COS / 阿里云 OSS 直传，
  并把 `ASSET_BASE_URL` 设为 CDN 域名；其余业务代码不用动。

## 小程序怎么连

小程序端配置在 `outputs/yuanji-miniprogram/utils/config.js`：

```js
BASE_URL: 'http://127.0.0.1:3000/api/v1'
```

- **模拟器**：开发者工具已勾选「不校验合法域名」，直接能用。
- **手机预览 / 体验版**：手机访问不到电脑的 127.0.0.1。把 `BASE_URL` 换成电脑局域网 IP（`http://192.168.x.x:3000/api/v1`，手机与电脑同一 WiFi），或者把服务部署到公网 HTTPS 域名。
- **正式版**：必须是 HTTPS + ICP 备案域名，并在小程序后台「开发设置 → 服务器域名」里配置 `request` 合法域名。
- 后端不可用时，小程序会自动退回本地假数据（离线也能演示），控制台会打印「[api] 走本地数据」。

## 上线要替换的东西（按优先级）

| 现在 | 上线换成 | 说明 |
| --- | --- | --- |
| JSON 文件 | MySQL/PostgreSQL + 连接池 | 只改 `src/db.js`，接口层不用动 |
| 内置 token 密钥 | `TOKEN_SECRET` 环境变量 / 密钥管理 | |
| 本地演示登录 | `WECHAT_APPID` + `WECHAT_SECRET` → 真 openid | 分支已写好，填环境变量即可 |
| 无缓存 | Redis 缓存 `/home` 与榜单 | 首页是读最重的接口 |
| 本机图片 | 腾讯云 COS / 阿里云 OSS + CDN | 商品图、实拍视频走 CDN |
| 模拟支付 | 微信支付 JSAPI + 分账 | `POST /orders/{id}/pay` 接统一下单，`/pay/notify` 收回调 |
| 无物流 | 快递100 / 菜鸟开放平台 | 面单 + 轨迹回传 |

## 部署（最简路径）

1. 买一台云服务器 + 域名，域名做 ICP 备案。
2. 上传本目录，用 pm2 或 Docker 常驻：`pm2 start server.js --name yuanji-api`。
3. Nginx 反向代理 + 申请 HTTPS 证书（Let's Encrypt 也可以）。
4. 小程序后台配置服务器域名，再把 `utils/config.js` 的 `BASE_URL` 改成 `https://api.你的域名.com/api/v1`。

## 还没做的

- 商家端（档口上架/接单/配货）与平台后台（审核/仲裁）
- 微信支付真实对接与分账、物流轨迹、订阅消息
- 图片上传与 CDN（现在是本地图片）
- 权限与风控（现在只有登录态，没有运营后台角色）
