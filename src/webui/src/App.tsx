import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import StatusPage from './pages/StatusPage'
import TestPage from './pages/TestPage'
import ApiPage from './pages/ApiPage'
import SettingsPage from './pages/SettingsPage'
import ChromePage from './pages/ChromePage'
import ToastContainer from './components/ToastContainer'
import { useStatus } from './hooks/useStatus'
import { useTheme } from './hooks/useTheme'

export type PageId = 'status' | 'test' | 'api' | 'settings' | 'chrome'

const pageConfig: Record<PageId, { title: string; desc: string }> = {
    status: { title: '运行状态', desc: '查看插件和服务概览' },
    test: { title: '渲染测试', desc: '测试 HTML 渲染效果' },
    api: { title: 'API 文档', desc: '接口调用参考' },
    settings: { title: '设置', desc: '插件配置管理' },
    chrome: { title: 'Chrome 安装', desc: '安装和管理 Chrome 浏览器' },
}

function App() {
    const [currentPage, setCurrentPage] = useState<PageId>('status')
    const [isScrolled, setIsScrolled] = useState(false)
    const { status, fetchStatus } = useStatus()

    // 初始化主题
    useTheme()

    // 定时刷新状态
    useEffect(() => {
        fetchStatus()
        const interval = setInterval(fetchStatus, 5000)
        return () => clearInterval(interval)
    }, [fetchStatus])

    const handleScroll = (e: React.UIEvent<HTMLElement>) => {
        setIsScrolled(e.currentTarget.scrollTop > 10)
    }

    const renderPage = () => {
        switch (currentPage) {
            case 'status':
                return <StatusPage status={status} onRefresh={fetchStatus} />
            case 'test':
                return <TestPage />
            case 'api':
                return <ApiPage />
            case 'settings':
                return <SettingsPage />
            case 'chrome':
                return <ChromePage />
            default:
                return <StatusPage status={status} onRefresh={fetchStatus} />
        }
    }

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-[#18191C] text-gray-800 dark:text-gray-200 transition-colors duration-300">
            <ToastContainer />

            <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />

            <div className="flex-1 flex flex-col overflow-hidden relative">
                <main
                    className="flex-1 overflow-y-auto h-full relative"
                    onScroll={handleScroll}
                >
                    <Header
                        title={pageConfig[currentPage].title}
                        description={pageConfig[currentPage].desc}
                        isScrolled={isScrolled}
                        status={status}
                        currentPage={currentPage}
                    />

                    <div className="px-4 md:px-8 pb-8">
                        <div className="page-enter">
                            {renderPage()}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}

export default App
