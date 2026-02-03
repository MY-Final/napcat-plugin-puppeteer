import { useState } from 'react'
import { Zap, Image, Shield, Settings, ChevronDown } from 'lucide-react'

interface ApiEndpoint {
    id: string
    method: 'GET' | 'POST'
    path: string
    description: string
    noAuth?: boolean
    params?: { name: string; type: string; required: boolean; desc: string }[]
    response?: string
}

const apiEndpoints: { section: string; icon: React.ReactNode; items: ApiEndpoint[] }[] = [
    {
        section: '核心服务',
        icon: <Image size={24} className="text-primary" />,
        items: [
            {
                id: 'api-screenshot',
                method: 'POST',
                path: '/screenshot',
                description: '通用截图接口，支持 URL、本地文件路径或直接传入 HTML 字符串进行渲染。',
                noAuth: true,
                params: [
                    { name: 'file', type: 'string', required: true, desc: '目标内容 (URL / HTML代码 / 文件路径)' },
                    { name: 'file_type', type: 'string', required: false, desc: '指定内容类型: url | htmlString | file | auto(默认)' },
                    { name: 'selector', type: 'string', required: false, desc: 'CSS 选择器，只截取指定元素。默认 body' },
                    { name: 'omitBackground', type: 'boolean', required: false, desc: '是否隐藏默认背景（设为透明）。默认 false' },
                    { name: 'data', type: 'object', required: false, desc: 'Handlebars 模板数据，仅当 file 为模板时有效' },
                    { name: 'waitSelector', type: 'string', required: false, desc: '等待该元素出现后再截图' },
                    { name: 'setViewport', type: 'object', required: false, desc: '{ width, height, deviceScaleFactor }' },
                ],
                response: `{
  "code": 0,
  "data": "Base64String...",  // 图片数据
  "message": "OK",
  "time": 150                 // 耗时(ms)
}`,
            },
            {
                id: 'api-render',
                method: 'POST',
                path: '/render',
                description: '/screenshot 的语义化别名，专门用于 HTML 模板渲染。',
                noAuth: true,
                params: [
                    { name: 'html', type: 'string', required: true, desc: 'HTML 模板字符串' },
                    { name: 'data', type: 'object', required: false, desc: '模板插值数据' },
                ],
            },
            {
                id: 'api-screenshot-get',
                method: 'GET',
                path: '/screenshot',
                description: '轻量级 URL 截图接口，适合快速调试或简单场景。',
                noAuth: true,
                params: [
                    { name: 'url', type: 'string', required: true, desc: '目标网页地址' },
                    { name: 'width', type: 'number', required: false, desc: '视口宽度 (默认 1280)' },
                    { name: 'height', type: 'number', required: false, desc: '视口高度 (默认 800)' },
                    { name: 'selector', type: 'string', required: false, desc: '元素选择器' },
                    { name: 'raw', type: 'boolean', required: false, desc: '如果为 true，直接返回 image/png 流，不包装 JSON' },
                ],
            },
        ],
    },
    {
        section: '浏览器控制',
        icon: <Shield size={24} className="text-primary" />,
        items: [
            {
                id: 'api-browser-status',
                method: 'GET',
                path: '/browser/status',
                description: '获取 Puppeteer 实例的详细状态。',
                noAuth: true,
                response: `{
  "code": 0,
  "data": {
    "connected": true,      // 浏览器是否连接
    "version": "Chrome...", // 版本信息
    "pageCount": 1,         // 打开的页面数
    "pid": 12345,           // 进程 ID
    "executablePath": "..." // 浏览器路径
  }
}`,
            },
            {
                id: 'api-browser-ops',
                method: 'POST',
                path: '/browser/{action}',
                description: '生命周期控制接口，支持 start, stop, restart。',
                noAuth: false,
                response: `{ "code": 0, "message": "Browser started successfully" }`,
            },
        ],
    },
    {
        section: '系统配置',
        icon: <Settings size={24} className="text-primary" />,
        items: [
            {
                id: 'api-sys-config',
                method: 'POST',
                path: '/config',
                description: '热更新插件配置，实时生效（部分浏览器配置需重启生效）。',
                noAuth: false,
                response: `{
  "browser": {
    "headless": true,
    "args": ["--no-sandbox"]
  },
  "maxPages": 10,
  "lockTimeout": 30000
}`,
            },
            {
                id: 'api-sys-status',
                method: 'GET',
                path: '/status',
                description: '获取插件整体运行统计。',
                noAuth: true,
                response: `{
  "totalRenders": 100,
  "failedRenders": 2,
  "uptimeFormatted": "2小时 15分"
}`,
            },
        ],
    },
]

function ApiCard({ endpoint, isOpen, onToggle }: { endpoint: ApiEndpoint; isOpen: boolean; onToggle: () => void }) {
    return (
        <div id={endpoint.id} className={`api-card ${isOpen ? 'open' : ''}`}>
            <div className="p-4 flex items-center justify-between cursor-pointer select-none hover:bg-black/[0.02] dark:hover:bg-white/[0.02]" onClick={onToggle}>
                <div className="flex items-center gap-3 overflow-hidden">
                    <span className={`method-badge method-${endpoint.method}`}>{endpoint.method}</span>
                    <div className="flex items-center gap-2">
                        <code className="text-sm font-semibold truncate">{endpoint.path}</code>
                        {endpoint.noAuth && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-bold">无认证</span>
                        )}
                        {!endpoint.noAuth && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-bold">需认证</span>
                        )}
                    </div>
                </div>
                <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
            </div>

            {isOpen && (
                <div className="px-6 pb-6 border-t border-gray-100 dark:border-gray-700 pt-4">
                    <p className="text-sm text-gray-500 mb-4">{endpoint.description}</p>

                    {!endpoint.noAuth && (
                        <div className="text-xs p-2 mb-4 bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400 rounded">
                            🔒 此接口需要 WebUI 认证 Token
                        </div>
                    )}

                    {endpoint.params && endpoint.params.length > 0 && (
                        <>
                            <div className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                {endpoint.method === 'GET' ? 'Query Parameters' : 'Request Body (JSON)'}
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm border-collapse">
                                    <thead>
                                        <tr className="border-b-2 border-gray-100 dark:border-gray-700">
                                            <th className="text-left py-2 px-2 text-gray-500 font-semibold">参数名</th>
                                            <th className="text-left py-2 px-2 text-gray-500 font-semibold">类型</th>
                                            <th className="text-left py-2 px-2 text-gray-500 font-semibold">必填</th>
                                            <th className="text-left py-2 px-2 text-gray-500 font-semibold">说明</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {endpoint.params.map((param) => (
                                            <tr key={param.name} className="border-b border-gray-100 dark:border-gray-700">
                                                <td className="py-2 px-2 text-gray-700 dark:text-gray-300">{param.name}</td>
                                                <td className="py-2 px-2">
                                                    <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-red-500 dark:text-red-400">
                                                        {param.type}
                                                    </span>
                                                </td>
                                                <td className="py-2 px-2">
                                                    {param.required ? (
                                                        <span className="text-red-500 text-xs border border-red-500 px-1 rounded">是</span>
                                                    ) : (
                                                        <span className="text-amber-500 text-xs border border-amber-500 px-1 rounded">否</span>
                                                    )}
                                                </td>
                                                <td className="py-2 px-2 text-gray-600 dark:text-gray-400">{param.desc}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {endpoint.response && (
                        <>
                            <div className="text-sm font-bold text-gray-700 dark:text-gray-300 mt-4 mb-2">Response JSON</div>
                            <pre className="text-xs">{endpoint.response}</pre>
                        </>
                    )}
                </div>
            )}
        </div>
    )
}

export default function ApiPage() {
    const [openCards, setOpenCards] = useState<Set<string>>(new Set(['api-screenshot']))

    const toggleCard = (id: string) => {
        setOpenCards((prev) => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })
    }

    return (
        <div className="flex flex-col lg:flex-row gap-8 items-start max-w-7xl mx-auto">
            {/* Left TOC */}
            <div className="hidden lg:block w-56 flex-shrink-0 sticky top-28">
                <div className="bg-white dark:bg-[#202124] rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-3">
                    <div className="text-xs font-bold text-gray-400 uppercase px-3 py-2">快速开始</div>
                    <a onClick={() => document.getElementById('api-quickstart')?.scrollIntoView({ behavior: 'smooth' })} className="block px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary cursor-pointer">
                        调用说明
                    </a>

                    {apiEndpoints.map((section) => (
                        <div key={section.section}>
                            <div className="h-px bg-gray-100 dark:bg-gray-700 my-2"></div>
                            <div className="text-xs font-bold text-gray-400 uppercase px-3 py-2">{section.section}</div>
                            {section.items.map((item) => (
                                <a
                                    key={item.id}
                                    onClick={() => {
                                        setOpenCards((prev) => new Set([...prev, item.id]))
                                        setTimeout(() => document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' }), 100)
                                    }}
                                    className="block px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary cursor-pointer border-l-2 border-transparent hover:border-primary hover:bg-primary/5"
                                >
                                    {item.path}
                                </a>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Content */}
            <div className="flex-1 w-full min-w-0 space-y-12 pb-24">
                {/* Quick Start */}
                <section id="api-quickstart">
                    <h3 className="flex items-center gap-2 text-xl font-bold mb-6 text-gray-800 dark:text-gray-100">
                        <Zap size={24} className="text-primary" />
                        快速开始
                    </h3>

                    <div className="glass-card p-6 mb-6">
                        <h4 className="font-bold text-lg mb-3">API 路径说明</h4>

                        <div className="mb-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-bold rounded">推荐</span>
                                <span className="text-sm font-semibold">无认证 API（供其他插件调用）</span>
                            </div>
                            <div className="bg-gray-900 text-gray-100 rounded-lg p-3 font-mono text-sm overflow-x-auto">
                                <span className="text-gray-400">{'{host}'}</span>
                                <span className="text-green-400">/plugin/napcat-plugin-puppeteer/api</span>
                                <span className="text-yellow-400">/{'{endpoint}'}</span>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-bold rounded">WebUI</span>
                                <span className="text-sm font-semibold">需认证 API（WebUI 管理）</span>
                            </div>
                            <div className="bg-gray-900 text-gray-100 rounded-lg p-3 font-mono text-sm overflow-x-auto">
                                <span className="text-gray-400">{'{host}'}</span>
                                <span className="text-blue-400">/api/Plugin/ext/napcat-plugin-puppeteer</span>
                                <span className="text-yellow-400">/{'{endpoint}'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-6">
                        <h4 className="font-bold text-lg mb-4">调用示例</h4>
                        <pre className="text-xs overflow-x-auto">{`// 在其他插件中调用（无需认证）
const response = await fetch('http://localhost:6099/plugin/napcat-plugin-puppeteer/api/render', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        html: '<div style="padding:20px;background:#fff;"><h1>Hello {{name}}</h1></div>',
        data: { name: 'World' },
        encoding: 'base64'
    })
});
const result = await response.json();
// result.data 为 Base64 编码的图片数据`}</pre>
                    </div>
                </section>

                {/* API Sections */}
                {apiEndpoints.map((section) => (
                    <section key={section.section}>
                        <h3 className="flex items-center gap-2 text-xl font-bold mb-6 text-gray-800 dark:text-gray-100">
                            {section.icon}
                            {section.section}
                        </h3>

                        {section.items.map((endpoint) => (
                            <ApiCard
                                key={endpoint.id}
                                endpoint={endpoint}
                                isOpen={openCards.has(endpoint.id)}
                                onToggle={() => toggleCard(endpoint.id)}
                            />
                        ))}
                    </section>
                ))}
            </div>
        </div>
    )
}
