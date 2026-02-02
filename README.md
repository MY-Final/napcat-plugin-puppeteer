# napcat-plugin-puppeteer

NapCat Puppeteer 渲染服务插件 - 提供 HTML/模板截图渲染 API，供其他插件调用。

## 功能特性

- 🎨 **HTML 渲染截图** - 支持 HTML 字符串、URL、本地文件
- 📝 **模板语法** - 支持 `{{key}}` 模板变量替换
- 📐 **灵活配置** - 自定义视口、选择器、图片格式
- 📄 **分页截图** - 支持长页面自动分页
- 🔒 **API 认证** - 强制认证密钥保护，首次启动自动生成安全密钥
- 🌐 **WebUI 管理** - 可视化控制面板

## 安装

1. 将 `dist` 目录复制到 NapCat 插件目录
2. 确保系统已安装 Chrome/Edge 浏览器
3. 在 WebUI 配置浏览器路径（可选，默认自动检测）

## API 端点

所有 API 均以 `/puppeteer` 为前缀。

### 核心渲染服务

#### 1. 截图接口 (POST)
**Endpoint:** `/puppeteer/screenshot`  
**描述:** 通用截图接口，支持 URL、本地文件或 HTML 字符串。

**Request Body (JSON):**
```json
{
  "file": "https://example.com",        // [必填] URL / HTML字符串 / 本地文件路径
  "file_type": "auto",                  // [可选] auto | htmlString | url | file
  "selector": "body",                   // [可选] 截图元素选择器，默认 body
  "omitBackground": false,              // [可选] 是否隐藏默认白色背景（透明背景）
  "type": "png",                        // [可选] 输出格式: png | jpeg | webp
  "quality": 80,                        // [可选] 图片质量 (1-100, 仅 jpeg/webp)
  "encoding": "base64",                 // [可选] 返回编码: base64 | binary (默认 base64)
  "fullPage": false,                    // [可选] 全网页截图 (true时忽略 selector)
  "data": { "name": "World" },          // [可选] Handlebars 模板数据
  "waitSelector": "#content",           // [可选] 等待指定元素出现后再截图
  "setViewport": {                      // [可选] 设置视口大小
    "width": 1280,
    "height": 800,
    "deviceScaleFactor": 1
  }
}
```

**Response (JSON):**
```json
{
  "code": 0,
  "data": "Base64String...", // 截图数据
  "message": "OK",
  "time": 150                // 耗时(ms)
}
```

#### 2. HTML 渲染接口 (POST)
**Endpoint:** `/puppeteer/render`  
**描述:** `/screenshot` 的别名接口，更强调 HTML 模板渲染语义。

**Request Body (JSON):**
```json
{
  "html": "<h1>Hello {{name}}</h1>",    // [必填] HTML 模板字符串
  "data": { "name": "NapCat" },         // [可选] 模板数据
  "selector": "h1"                      // [可选] 其他参数同 /screenshot
}
```

#### 3. 快速 URL 截图 (GET)
**Endpoint:** `/puppeteer/screenshot`  
**描述:** 通过 Query 参数进行快速 URL 截图，适合调试。

**Query Parameters:**
| 参数 | 必填 | 说明 |
|------|------|------|
| `url` | 是 | 目标网页 URL |
| `width` | 否 | 视口宽度 (默认 1280) |
| `height` | 否 | 视口高度 (默认 800) |
| `selector` | 否 | 元素选择器 |
| `raw` | 否 | 如为 `true`，直接返回 image 流而非 JSON |

---

### 浏览器实例控制

-   **GET** `/puppeteer/browser/status`
    -   获取浏览器连接状态、版本、PID、打开页面数等信息。
-   **POST** `/puppeteer/browser/start`
    -   手动启动浏览器实例。
-   **POST** `/puppeteer/browser/stop`
    -   关闭浏览器实例及其所有页面。
-   **POST** `/puppeteer/browser/restart`
    -   重启浏览器实例。

### 系统配置与状态

-   **GET** `/puppeteer/status`
    -   获取插件整体统计信息（运行时长、渲染次数、失败次数）。
-   **GET** `/puppeteer/config`
    -   获取当前生效的插件配置。
-   **POST** `/puppeteer/config`
    -   更新插件配置（部分浏览器参数需要重启实例生效）。

---

## 响应码说明

| Code | 说明 |
|------|------|
| 0 | 成功 |
| -1 | 系统/未知错误 |
| 400 | 请求参数错误 |
| 401 | 认证失败 (Token 无效) |
| 500 | 渲染失败或浏览器错误 |
}
```

## 其他插件调用示例

```typescript
// 调用渲染 API（需要认证密钥）
const AUTH_TOKEN = '你的认证密钥'; // 从配置页面获取

const response = await fetch('http://localhost:端口/api/Plugin/ext/插件名/puppeteer/render', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AUTH_TOKEN}`  // 认证头
  },
  body: JSON.stringify({
    html: '<h1>Hello {{name}}</h1>',
    data: { name: 'World' },
    encoding: 'base64'
  })
});

const { data } = await response.json();
// data 是 base64 编码的图片
```

## 配置项

| 配置 | 说明 | 默认值 |
|------|------|--------|
| enabled | 启用渲染服务 | true |
| browser.executablePath | 浏览器路径 | 自动检测 |
| browser.headless | 无头模式 | true |
| browser.maxPages | 最大并发页面数 | 5 |
| browser.timeout | 默认超时时间 | 30000 |
| browser.defaultViewportWidth | 默认视口宽度 | 1280 |
| browser.defaultViewportHeight | 默认视口高度 | 800 |
| browser.deviceScaleFactor | 设备像素比 | 2 |
| authToken | API 认证密钥 | 自动生成 64 位安全密钥 |
| debug | 调试模式 | false |

## API 认证

### 认证机制

所有渲染相关的 API 都需要认证密钥才能访问。插件首次启动时会自动生成一个 64 位的安全密钥，你也可以在 WebUI 配置页面自定义密钥。

### 认证方式

**HTTP Header 方式**
```
Authorization: Bearer <your-auth-token>
```

> ⚠️ 出于安全考虑，不支持 Query 参数传递密钥（密钥会被记录在服务器日志、浏览器历史等位置）

### 获取认证密钥

- 在 NapCat WebUI 的插件配置页面查看
- 或在插件的 WebUI 控制台「设置」页面查看和修改

## 开发

```bash
# 安装依赖
pnpm install

# 开发构建
pnpm run build
```

## 许可证

MIT
