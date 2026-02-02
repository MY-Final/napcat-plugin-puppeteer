# napcat-plugin-puppeteer

NapCat Puppeteer 渲染服务插件 - 提供 HTML/模板截图渲染 API，供其他插件调用。

## 功能特性

- 🎨 **HTML 渲染截图** - 支持 HTML 字符串、URL、本地文件
- 📝 **模板语法** - 支持 `{{key}}` 模板变量替换
- 📐 **灵活配置** - 自定义视口、选择器、图片格式
- 📄 **分页截图** - 支持长页面自动分页
- 🔒 **API 认证** - 可选的 Token 认证保护
- 🌐 **WebUI 管理** - 可视化控制面板

## 安装

1. 将 `dist` 目录复制到 NapCat 插件目录
2. 确保系统已安装 Chrome/Edge 浏览器
3. 在 WebUI 配置浏览器路径（可选，默认自动检测）

## API 端点

所有 API 以 `/puppeteer` 为前缀。

### 截图接口

#### POST /puppeteer/screenshot

对 URL 或 HTML 进行截图。

```json
{
  "file": "https://example.com",
  "file_type": "auto",
  "selector": "body",
  "encoding": "base64",
  "type": "png",
  "fullPage": false,
  "setViewport": {
    "width": 1280,
    "height": 800,
    "deviceScaleFactor": 2
  }
}
```

#### POST /puppeteer/render

渲染 HTML 模板并截图。

```json
{
  "html": "<h1>Hello {{name}}</h1>",
  "data": { "name": "World" },
  "selector": "body",
  "encoding": "base64"
}
```

#### GET /puppeteer/screenshot?url=xxx

简单 URL 截图，添加 `&raw=true` 直接返回图片。

### 浏览器控制

- `GET /puppeteer/browser/status` - 获取浏览器状态
- `POST /puppeteer/browser/start` - 启动浏览器
- `POST /puppeteer/browser/stop` - 停止浏览器
- `POST /puppeteer/browser/restart` - 重启浏览器

### 配置接口

- `GET /puppeteer/config` - 获取配置
- `POST /puppeteer/config` - 保存配置
- `GET /puppeteer/status` - 获取插件状态

## 请求参数说明

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| file | string | 必填 | URL、file:// 路径或 HTML 字符串 |
| file_type | string | auto | auto / htmlString |
| data | object | - | 模板变量数据 |
| selector | string | body | 截图元素选择器 |
| type | string | png | png / jpeg / webp |
| quality | number | 90 | 图片质量 (1-100) |
| encoding | string | base64 | base64 / binary |
| fullPage | boolean | false | 是否全页面截图 |
| multiPage | boolean/number | false | 分页截图 |
| omitBackground | boolean | false | 透明背景 |
| setViewport | object | - | 视口设置 |
| waitForTimeout | number | - | 截图前等待时间 (ms) |
| waitForSelector | string | - | 等待元素出现 |

## 响应格式

```json
{
  "code": 0,
  "data": "base64图片数据...",
  "time": 1234
}
```

## 其他插件调用示例

```typescript
// 调用渲染 API
const response = await fetch('http://localhost:端口/插件名/puppeteer/render', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
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
| authToken | API 认证 Token | 空 |
| debug | 调试模式 | false |

## 开发

```bash
# 安装依赖
pnpm install

# 开发构建
pnpm run build

# 监听模式
pnpm run watch
```

## 许可证

MIT
