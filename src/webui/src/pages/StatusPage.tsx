import { Play, RotateCcw, Square, Shield, CheckCircle, XCircle, Globe, Laptop } from 'lucide-react'
import type { PluginStatus } from '../types'
import { authFetch } from '../utils/api'
import { showToast } from '../hooks/useToast'

interface StatusPageProps {
    status: PluginStatus | null
    onRefresh: () => void
}

export default function StatusPage({ status, onRefresh }: StatusPageProps) {
    const browser = status?.browser

    const browserAction = async (action: string, name: string) => {
        showToast(`正在${name}浏览器...`, 'info')
        try {
            const data = await authFetch('/browser/' + action, { method: 'POST' })
            const success = data.code === 0
            showToast(data.message || (success ? `${name}成功` : `${name}失败`), success ? 'success' : 'error')
            setTimeout(onRefresh, 1000)
        } catch (e) {
            showToast(`${name}失败: ` + (e as Error).message, 'error')
        }
    }

    return (
        <div>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="glass-card p-6">
                    <div className="text-gray-500 text-sm mb-2">总渲染次数</div>
                    <div className="text-3xl font-bold text-primary">{browser?.totalRenders || 0}</div>
                </div>
                <div className="glass-card p-6">
                    <div className="text-gray-500 text-sm mb-2">失败次数</div>
                    <div className="text-3xl font-bold text-red-500">{browser?.failedRenders || 0}</div>
                </div>
                <div className="glass-card p-6">
                    <div className="text-gray-500 text-sm mb-2">当前页面数</div>
                    <div className="text-3xl font-bold text-blue-500">{browser?.pageCount || 0}</div>
                </div>
                <div className="glass-card p-6">
                    <div className="text-gray-500 text-sm mb-2">运行时长</div>
                    <div className="text-xl font-bold text-green-500 truncate">{status?.uptimeFormatted || '-'}</div>
                </div>
            </div>

            {/* Browser Control */}
            <div className="glass-card p-6 mb-8">
                <h3 className="font-bold text-lg mb-4">浏览器控制</h3>
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-primary">
                            <Shield size={24} />
                        </div>
                        <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">实例管理</div>
                            <div className="text-sm text-gray-500">控制 Puppeteer 浏览器生命周期</div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => browserAction('start', '启动')}
                            className="btn bg-gray-100 dark:bg-gray-800 hover:bg-green-50 dark:hover:bg-green-900/20 text-gray-700 dark:text-gray-200 hover:text-green-600 dark:hover:text-green-400 border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700"
                        >
                            <Play size={18} />
                            启动
                        </button>
                        <button
                            onClick={() => browserAction('restart', '重启')}
                            className="btn bg-gray-100 dark:bg-gray-800 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-gray-700 dark:text-gray-200 hover:text-amber-600 dark:hover:text-amber-400 border border-gray-200 dark:border-gray-700 hover:border-amber-300 dark:hover:border-amber-700"
                        >
                            <RotateCcw size={18} />
                            重启
                        </button>
                        <button
                            onClick={() => browserAction('stop', '停止')}
                            className="btn bg-gray-100 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-700 dark:text-gray-200 hover:text-red-600 dark:hover:text-red-400 border border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-700"
                        >
                            <Square size={18} />
                            停止
                        </button>
                    </div>
                </div>
            </div>

            {/* System Info */}
            <div className="glass-card p-6">
                <h3 className="font-bold text-lg mb-4">系统信息</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between p-3 bg-gray-50 dark:bg-[#202124] rounded-lg">
                        <span className="text-gray-500">连接状态</span>
                        <span className={`font-medium flex items-center gap-1 ${browser?.connected ? 'text-green-500' : 'text-red-500'}`}>
                            {browser?.connected ? <CheckCircle size={14} /> : <XCircle size={14} />}
                            {browser?.connected ? '已连接' : '未连接'}
                        </span>
                    </div>
                    <div className="flex justify-between p-3 bg-gray-50 dark:bg-[#202124] rounded-lg">
                        <span className="text-gray-500">连接模式</span>
                        <span className={`font-medium flex items-center gap-1 ${browser?.mode === 'remote' ? 'text-blue-500' : 'text-gray-500'}`}>
                            {browser?.mode === 'remote' ? <Globe size={14} /> : <Laptop size={14} />}
                            {browser?.mode === 'remote' ? '远程连接' : '本地启动'}
                        </span>
                    </div>

                    <div className="flex justify-between p-3 bg-gray-50 dark:bg-[#202124] rounded-lg">
                        <span className="text-gray-500">浏览器版本</span>
                        <span className="font-medium">{browser?.version || '-'}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-gray-50 dark:bg-[#202124] rounded-lg">
                        <span className="text-gray-500 flex-shrink-0 mr-4">浏览器地址</span>
                        <span
                            className="font-medium truncate font-mono text-xs"
                            title={browser?.mode === 'remote' ? browser?.browserWSEndpoint : browser?.executablePath}
                        >
                            {browser?.mode === 'remote' ? browser?.browserWSEndpoint : browser?.executablePath || '-'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}
