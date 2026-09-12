# 源集 · 源头档口批发（微信小程序模板）

按「一手」小程序**真机实测结构**搭的服装批发平台小程序模板（客户端），可直接用微信开发者工具打开。

## 怎么跑

1. 安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 打开 → 导入项目 → 目录选择本文件夹 `outputs/yuanji-miniprogram`
3. AppID 选择「测试号」即可（`project.config.json` 里已填 `touristappid`）
4. 编译后即可点着看

> 无后端、无登录服务，所有数据和交互都是本地模拟；`认证`在本地标记后立即解锁拿货价。

## 已实现的页面（对照一手实测）

| 页面 | 路径 | 对应一手 |
| --- | --- | --- |
| 专场（首页） | `pages/home/index` | 专场：搜索 → 市场金刚区 → 今日新款/今日特卖/档口现货 → 筛选行 → 大牌联合上新 → 商品流 |
| 分类 | `pages/category/index` | 左侧一级分类 + 热门分类推荐 + 二级类目 |
| 进货车 | `pages/cart/index` | 进货车：空态引导 + 底部结算栏（商品总价/共计优惠/合计/优惠明细） |
| 我的 | `pages/mine/index` | 登录注册 / 订阅档口 / 订单四状态 / 资产 / 活动 |
| 市场列表页 | `pages/list/index` | 倒计时 + 大牌 banner + 综合|销量|上新|批发价 + 商品卡 |
| 商品详情 | `pages/goods/index` | 商品/档口/详情 三页签 + 模特图/实拍图/尺码 切换 + SKU 弹层 |
| 档口主页 | `pages/stall/index` | 档口资料 + 订阅档口 + 档口满减 |
| 搜索 | `pages/search/index` | 历史搜索 / 搜索推荐 / 结果页 / 筛选抽屉 |
| 登录 | `pages/login/index` | 手机号一键登录 + 其它方式登录 + 协议 |
| 店主认证 | `pages/cert/index` | **价格闸门**：认证后解锁拿货价 |
| 结算 | `pages/checkout/index` | 确认订单：地址 / 商品清单 / 优惠明细 / 备注 / 支付方式 |
| 订单列表 | `pages/orders/index` | 我的订单：全部·待付款·待发货·待收货·已完成 |
| 订单详情 | `pages/order-detail/index` | 订单详情：状态 / 物流 / 收货信息 / 金额明细 |
| 收货地址 | `pages/address/index` | 地址管理：选择 / 设为默认 / 新增 |
| 收藏商品 | `pages/favorites/index` | 收藏列表 |
| 订阅档口 | `pages/subs/index` | 订阅列表 + 取消订阅 |
| 红包 / 卡券 | `pages/coupons/index` | 新人60元礼包：领取（满339减30 等） |
| 素材中心 | `pages/material/index` | 一键下载素材 / 复制文案 |
| 协议与政策 | `pages/doc/index` | 用户服务协议 / 隐私政策 / 店主认证须知（登录页、认证页、我的页均可进入） |

## 核心业务规则（与一手一致）

1. **价格闸门**：未认证只显示「建议零售价」+「登录看拿货价」；完成店主认证后才显示拿货价。
   逻辑集中在 `utils/store.js` 的 `priceView()`，全站商品卡、详情页、进货车都走它。
2. **档口阶梯满减**：18 档（满699减5 → 满30000减1050），商品详情可展开，进货车按档口算优惠。
3. **发货时效**：`广州发货` + `当前下单，09月21日未发可取消`。
4. **退货策略**：部分品类不支持无理由退货，商品详情可展开原因。
5. **商品卡信息**：今日新款角标 / 实拍视频角标 / 收藏 / `市场|满699减5` / 价格+价格标签 / 今日已拼N件。
6. **底部 4 个 Tab**：专场 / 分类 / 进货车 / 我的（一手小程序端没有直播 Tab）。

## 视觉规范（清爽白底现代电商风）

整套样式收敛成一套设计变量，集中在 `app.wxss` 顶部，改颜色/圆角只改这里：

| 变量 | 值 | 用途 |
| --- | --- | --- |
| `--brand` / `--brand-soft` | `#ff3355` / `#fff0f3` | 品牌玫红，只用在按钮、选中态、标签 |
| `--price` | `#ff2f4f` | 价格数字 |
| `--text` / `--text-2` / `--text-3` | `#17171c` / `#62626e` / `#9c9ca6` | 三级文字层次 |
| `--bg` / `--line` | `#f6f7f9` / `#eeeef2` | 页面底色、分隔线 |
| `--radius` / `--shadow` | `24rpx` / `0 2rpx 14rpx rgba(17,17,30,.05)` | 卡片圆角与阴影 |

通用组件类（都在 `app.wxss`）：`.card` `.btn-primary` `.btn-ghost` `.btn-mini` `.tag` `.chip` `.price`
`.sec-head` `.list-row` `.empty` `.fixed-bar`。页面样式只写自己特有的部分。

版式约定：商品图统一 3:4（600×800 JPG）；价格用 `--price` 大号加粗，其余信息用灰阶做层次；
右上角统一留出 190rpx 让开微信胶囊按钮。

## 目录结构

```
yuanji-miniprogram/
├── app.js / app.json / app.wxss      全局配置与样式
├── components/goods-card/            商品卡组件（含价格闸门展示）
├── pages/                            18 个页面
├── utils/data.js                     假数据（市场/分类/档口/商品/满减）
├── utils/store.js                    全局状态（登录/认证/进货车/收藏/订阅）
├── utils/api.js                      mock 数据访问层（首页/列表/搜索/卡券/订单等已走这里，接后端时替换实现）
├── images/goods/                     18 张商品图（600×800 JPG，原型用网图）
├── images/tab/                       8 个 Tab 栏图标（常态/选中）
└── images/icons/                     34 个页面内图标
```

> `images/goods/*.jpg` 是**原型用的网图**（从公开电商图里挑的、已裁成 3:4），仅用于本地演示，
> 正式上线前请换成自有商品的实拍图。抓图与裁图脚本：`work/fetch-photos.ps1`、`work/apply-photos.mjs`。

## 已验证（真机渲染）

在微信开发者工具模拟器（iPhone 12/13）里逐页核对过：首页 / 分类 / 进货车 / 我的 / 商品详情 /
订单列表 / 结算页 均正常渲染，Tab 栏与图标显示正常。验证办法见 `work/set-first-page.mjs`。

### 自动核对（推荐，不用人工点）

```powershell
# 自动打开开发者工具 → 逐页截图 → 跑一遍登录/认证/加购/结算/下单链路 → 输出报告
node work/verify-render.mjs

node work/verify-render.mjs --pages home,goods   # 只核对指定页面
node work/verify-render.mjs --connect            # 开发者工具已开着自动化端口时直接连
node work/verify-render.mjs --keep-open          # 跑完不关开发者工具
```

产物：`outputs/预览截图/miniprogram/*.png`（16 张页面截图 + 8 张交互过程截图）与
`outputs/预览截图/miniprogram/核对报告.md`（每页非空像素占比、颜色数、结论，以及控制台报错）。
依赖装在 `work/node_modules`（`miniprogram-automator` + `pngjs`），不影响小程序本体。

静态检查（页面完整性 / JS 语法 / JSON / 事件绑定 / 图片路径）：

```powershell
node work/check-miniprogram.mjs
```

## 接后端时要替换的地方

| 位置 | 现在 | 正式版 |
| --- | --- | --- |
| `utils/config.js` | 指向本机后端 `http://127.0.0.1:3000/api/v1` | 改成已备案的 HTTPS 域名，并在小程序后台配置服务器域名 |
| `utils/api.js` | 已改为真实 `wx.request`，失败自动退回本地数据 | 不用改（后端不可用时的兜底逻辑保留即可） |
| `utils/data.js` | 启动时由 `api.hydrate()` 灌入后端数据，保留种子数据兜底 | 后端稳定后可删掉种子数据 |
| `utils/store.js` `login()` | 调后端 `/auth/login`（后端不可用则本地演示登录） | 后端配 `WECHAT_APPID/SECRET` 后自动走真 `code2session` |
| `pages/login` 一键登录 | 直接登录 | `getPhoneNumber` + 后端解密手机号 |
| `pages/cert` 提交 | 调后端 `/user/cert`（当前自动通过） | 后台人工/自动审核 |
| 支付 | 已接 `wx.requestPayment` + 后端微信支付 APIv3（未配商户号时走演示支付） | 配好商户号即真实扣款，见 `outputs/docs/微信支付接入说明.md` |

## 连后端（本地开发）

后端代码在 `outputs/yuanji-server`，启动后小程序自动连上：

```powershell
cd "C:\Users\Administrator\Documents\Codex\2026-09-11\new-chat\outputs\yuanji-server"
node server.js      # http://127.0.0.1:3000
```

- 价格闸门现在在**服务端**：未认证时商品接口里根本没有拿货价字段；认证后才有。
- 订单也在服务端：登录 → 认证 → 加购 → 提交订单都会打到后端，数据存在 `yuanji-server/data/db.json`。
- 后端没启动也不影响演示：小程序会自动退回本地假数据（控制台打印「[api] 走本地数据」）。
- 手机预览时把 `utils/config.js` 的 `BASE_URL` 换成电脑局域网 IP，或部署到 HTTPS 域名。

## 发布上线

已上传版本 **1.0.0**（AppID 见 `project.config.json`），手机预览二维码在 `outputs/预览二维码-1.0.0.png`。
体验版与正式发布的完整流程、类目/备案/隐私指引要求、以及"过审前还缺什么"，见
`outputs/docs/上线与发布指引.md`。

重新上传（改完代码后）：

```powershell
& "C:\Program Files (x86)\Tencent\微信web开发者工具\cli.bat" upload `
  --project "C:\Users\Administrator\Documents\Codex\2026-09-11\new-chat\outputs\yuanji-miniprogram" `
  -v 1.0.1 -d "改动说明"
```
