export interface BrowserStatus {
    connected: boolean
    version?: string
    pageCount: number
    pid?: number
    executablePath?: string
    browserWSEndpoint?: string
    mode?: 'local' | 'remote'
    totalRenders: number
    failedRenders: number
}

export interface PluginStatus {
    browser: BrowserStatus
    uptimeFormatted: string
}

export interface ApiResponse<T = unknown> {
    code: number
    data?: T
    message?: string
    time?: number
}

export interface PluginConfig {
    enabled: boolean
    debug: boolean
    browser: {
        maxPages: number
        timeout: number
        headless: boolean
        executablePath?: string
        browserWSEndpoint?: string
        args?: string[]
        defaultViewportWidth: number
        defaultViewportHeight: number
        deviceScaleFactor: number
    }
}

export interface ChromeStatus {
    platform: string
    arch: string
    linuxDistro?: string
    defaultVersion: string
    installed: boolean
    version?: string
    executablePath?: string
    isInstalling: boolean
    progress?: ChromeProgress
}

export interface ChromeProgress {
    status: 'idle' | 'downloading' | 'extracting' | 'installing-deps' | 'completed' | 'failed'
    progress: number
    message: string
    downloadedBytes?: number
    totalBytes?: number
    speed?: string
    eta?: string
    error?: string
}

export interface RenderOptions {
    html?: string
    file?: string
    file_type?: 'url' | 'htmlString' | 'file' | 'auto'
    encoding?: 'base64' | 'binary'
    data?: Record<string, unknown>
    selector?: string
    waitForSelector?: string
    omitBackground?: boolean
    waitForTimeout?: number
    setViewport?: {
        width?: number
        height?: number
        deviceScaleFactor?: number
    }
}

export interface RenderResult {
    code: number
    data?: string | string[]
    message?: string
    time?: number
}
