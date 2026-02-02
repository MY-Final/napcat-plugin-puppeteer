/**
 * Puppeteer 渲染服务
 * 浏览器管理、截图核心逻辑
 */

import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';
import type { Browser, Page } from 'puppeteer-core';
import { pluginState } from '../core/state';
import { getDefaultBrowserPaths } from '../config';
import type {
    ScreenshotOptions,
    RenderResult,
    BrowserStatus,
    BrowserConfig,
    Encoding,
    MultiPage,
} from '../types';

/** 浏览器实例 */
let browser: Browser | null = null;

/** 当前打开的页面数 */
let currentPageCount = 0;

/** 页面信号量（用于限制并发） */
let pageQueue: Array<() => void> = [];

/** 统计信息 */
const stats = {
    totalRenders: 0,
    failedRenders: 0,
    startTime: 0,
};

/**
 * 查找可用的浏览器路径
 */
function findBrowserPath(configPath?: string, suppressLog = false): string | undefined {
    // 优先使用配置的路径
    if (configPath && fs.existsSync(configPath)) {
        return configPath;
    }

    // 自动检测系统浏览器
    const defaultPaths = getDefaultBrowserPaths();
    for (const browserPath of defaultPaths) {
        if (browserPath && fs.existsSync(browserPath)) {
            if (!suppressLog) {
                pluginState.log('info', `自动检测到浏览器: ${browserPath}`);
            }
            return browserPath;
        }
    }

    return undefined;
}

/**
 * 获取浏览器启动参数
 */
function getBrowserArgs(config: BrowserConfig): string[] {
    const defaultArgs = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-zygote',
        '--disable-extensions',
        '--disable-background-networking',
        '--disable-sync',
        '--disable-translate',
        '--disable-notifications',
        '--disable-crash-reporter',
        `--window-size=${config.defaultViewportWidth || 1280},${config.defaultViewportHeight || 800}`,
    ];

    return config.args?.length ? config.args : defaultArgs;
}

/**
 * 初始化浏览器
 */
export async function initBrowser(): Promise<boolean> {
    if (browser) {
        pluginState.log('warn', '浏览器已初始化，跳过');
        return true;
    }

    const config = pluginState.config.browser;
    const executablePath = findBrowserPath(config.executablePath);

    if (!executablePath) {
        pluginState.log('error', '未找到可用的浏览器，请在配置中指定浏览器路径');
        return false;
    }

    try {
        pluginState.log('info', `正在启动浏览器: ${executablePath}`);

        browser = await puppeteer.launch({
            executablePath,
            headless: config.headless !== false,
            args: getBrowserArgs(config),
            defaultViewport: {
                width: config.defaultViewportWidth || 1280,
                height: config.defaultViewportHeight || 800,
                deviceScaleFactor: config.deviceScaleFactor || 2,
            },
        });

        // 监听浏览器关闭事件
        browser.on('disconnected', () => {
            pluginState.log('warn', '浏览器已断开连接');
            browser = null;
            currentPageCount = 0;
            pageQueue = [];
        });

        stats.startTime = Date.now();
        pluginState.log('info', '浏览器启动成功');
        return true;
    } catch (error) {
        pluginState.log('error', '启动浏览器失败:', error);
        browser = null;
        return false;
    }
}

/**
 * 关闭浏览器
 */
export async function closeBrowser(): Promise<void> {
    if (browser) {
        try {
            await browser.close();
            pluginState.log('info', '浏览器已关闭');
        } catch (error) {
            pluginState.log('error', '关闭浏览器失败:', error);
        } finally {
            browser = null;
            currentPageCount = 0;
            pageQueue = [];
        }
    }
}

/**
 * 重启浏览器
 */
export async function restartBrowser(): Promise<boolean> {
    await closeBrowser();
    return initBrowser();
}

/**
 * 获取浏览器状态
 */
export async function getBrowserStatus(): Promise<BrowserStatus> {
    const config = pluginState.config.browser;

    if (!browser) {
        return {
            connected: false,
            pageCount: 0,
            executablePath: findBrowserPath(config.executablePath, true),
            totalRenders: stats.totalRenders,
            failedRenders: stats.failedRenders,
        };
    }

    try {
        const version = await browser.version();
        const pages = await browser.pages();

        return {
            connected: true,
            version,
            pageCount: pages.length,
            executablePath: findBrowserPath(config.executablePath, true),
            startTime: stats.startTime,
            totalRenders: stats.totalRenders,
            failedRenders: stats.failedRenders,
        };
    } catch (error) {
        return {
            connected: false,
            pageCount: 0,
            totalRenders: stats.totalRenders,
            failedRenders: stats.failedRenders,
        };
    }
}

/**
 * 获取页面（带并发控制）
 */
async function acquirePage(): Promise<Page> {
    const maxPages = pluginState.config.browser.maxPages || 5;

    // 如果达到最大并发，等待
    if (currentPageCount >= maxPages) {
        await new Promise<void>((resolve) => {
            pageQueue.push(resolve);
        });
    }

    currentPageCount++;

    if (!browser) {
        const success = await initBrowser();
        if (!success || !browser) {
            currentPageCount--;
            throw new Error('浏览器未就绪');
        }
    }

    const page = await browser.newPage();
    return page;
}

/**
 * 释放页面
 */
async function releasePage(page: Page): Promise<void> {
    try {
        await page.close();
    } catch (error) {
        pluginState.logDebug('关闭页面失败:', error);
    }

    currentPageCount--;

    // 唤醒等待的任务
    if (pageQueue.length > 0) {
        const next = pageQueue.shift();
        next?.();
    }
}

/**
 * 简单模板渲染
 * 支持 {{key}} 语法
 */
function renderTemplate(html: string, data?: Record<string, any>): string {
    if (!data) return html;

    return html.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return data[key] !== undefined ? String(data[key]) : match;
    });
}

/**
 * 查找截图目标元素
 */
async function findTargetElement(page: Page, selector?: string) {
    const findDefault = async () => {
        const container = await page.$('#container');
        if (container) return container;
        const body = await page.$('body');
        return body!;
    };

    try {
        if (selector) {
            const element = await page.$(selector);
            if (element) return element;
        }
        return findDefault();
    } catch (error) {
        pluginState.logDebug('查找元素失败:', error);
        return findDefault();
    }
}

/**
 * 计算分页尺寸
 */
function calculatePageDimensions(
    pageIndex: number,
    pageHeight: number,
    totalHeight: number
): { y: number; height: number } {
    let y = pageIndex * pageHeight;
    let height = Math.min(pageHeight, totalHeight - pageIndex * pageHeight);

    if (pageIndex !== 0) {
        y -= 100;
        height += 100;
    }

    return { y, height };
}

/**
 * 核心截图函数
 */
export async function screenshot<
    T extends Encoding = 'base64',
    M extends MultiPage = false
>(options: ScreenshotOptions): Promise<RenderResult<T, M>> {
    const startTime = Date.now();
    stats.totalRenders++;

    let page: Page | null = null;

    try {
        // 获取页面
        page = await acquirePage();

        const config = pluginState.config.browser;
        const timeout = options.pageGotoParams?.timeout || config.timeout || 30000;

        // 设置视口
        if (options.setViewport) {
            await page.setViewport({
                width: options.setViewport.width || config.defaultViewportWidth || 1280,
                height: options.setViewport.height || config.defaultViewportHeight || 800,
                deviceScaleFactor: options.setViewport.deviceScaleFactor || config.deviceScaleFactor || 2,
            });
        }

        // 设置额外的 HTTP 头
        if (options.headers) {
            await page.setExtraHTTPHeaders(options.headers);
        }

        // 确定导航目标
        let targetUrl: string;

        if (options.file_type === 'htmlString' ||
            (!options.file.startsWith('http://') &&
                !options.file.startsWith('https://') &&
                !options.file.startsWith('file://'))) {
            // HTML 字符串，需要先渲染模板
            let html = options.file;
            if (options.data) {
                html = renderTemplate(html, options.data);
            }
            await page.setContent(html, {
                waitUntil: options.pageGotoParams?.waitUntil || 'networkidle0',
                timeout,
            });
        } else {
            // URL 或 file:// 路径
            targetUrl = options.file;

            // 处理 file:// 协议，读取文件并渲染模板
            if (targetUrl.startsWith('file://')) {
                const filePath = targetUrl.replace('file://', '');
                if (fs.existsSync(filePath)) {
                    let html = fs.readFileSync(filePath, 'utf-8');
                    if (options.data) {
                        html = renderTemplate(html, options.data);
                    }
                    await page.setContent(html, {
                        waitUntil: options.pageGotoParams?.waitUntil || 'networkidle0',
                        timeout,
                    });
                } else {
                    throw new Error(`文件不存在: ${filePath}`);
                }
            } else {
                await page.goto(targetUrl, {
                    waitUntil: options.pageGotoParams?.waitUntil || 'networkidle0',
                    timeout,
                });
            }
        }

        // 等待指定选择器
        if (options.waitForSelector) {
            await page.waitForSelector(options.waitForSelector, { timeout });
        }

        // 等待指定时间
        if (options.waitForTimeout) {
            await new Promise(resolve => setTimeout(resolve, options.waitForTimeout));
        }

        // 截图选项
        const screenshotOptions: any = {
            type: options.type || 'png',
            encoding: options.encoding || 'base64',
            omitBackground: options.omitBackground || false,
        };

        if (options.type !== 'png' && options.quality) {
            screenshotOptions.quality = options.quality;
        }

        // 全页面截图
        if (options.fullPage) {
            screenshotOptions.fullPage = true;
            screenshotOptions.captureBeyondViewport = true;

            const result = await page.screenshot(screenshotOptions);

            return {
                status: true,
                data: result as any,
                time: Date.now() - startTime,
            };
        }

        // 获取目标元素
        const element = await findTargetElement(page, options.selector);
        const box = await element.boundingBox();

        // 更新视口以适应元素
        if (box) {
            await page.setViewport({
                width: Math.ceil(box.width) || config.defaultViewportWidth || 1280,
                height: Math.ceil(box.height) || config.defaultViewportHeight || 800,
                deviceScaleFactor: options.setViewport?.deviceScaleFactor || config.deviceScaleFactor || 2,
            });
        }

        // 分页截图
        if (options.multiPage && box) {
            const pageHeight = typeof options.multiPage === 'number'
                ? options.multiPage
                : (box.height >= 2000 ? 2000 : box.height);

            const totalPages = Math.ceil(box.height / pageHeight);
            const results: any[] = [];

            for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
                const { y, height } = calculatePageDimensions(pageIndex, pageHeight, box.height);

                const clipOptions = {
                    ...screenshotOptions,
                    clip: { x: 0, y, width: box.width, height },
                };

                const screenshot = await element.screenshot(clipOptions);
                results.push(screenshot);
            }

            return {
                status: true,
                data: results as any,
                time: Date.now() - startTime,
            };
        }

        // 单页截图
        const result = await element.screenshot(screenshotOptions);

        return {
            status: true,
            data: result as any,
            time: Date.now() - startTime,
        };

    } catch (error) {
        stats.failedRenders++;
        const message = error instanceof Error ? error.message : String(error);
        pluginState.log('error', '截图失败:', message);

        return {
            status: false,
            data: '' as any,
            message,
            time: Date.now() - startTime,
        };
    } finally {
        if (page) {
            await releasePage(page);
        }
    }
}

/**
 * 渲染 HTML 并截图（便捷方法）
 */
export async function renderHtml(
    html: string,
    options?: Partial<ScreenshotOptions>
): Promise<RenderResult<'base64', false>> {
    return screenshot({
        file: html,
        file_type: 'htmlString',
        encoding: 'base64',
        ...options,
    });
}

/**
 * 截图 URL（便捷方法）
 */
export async function screenshotUrl(
    url: string,
    options?: Partial<ScreenshotOptions>
): Promise<RenderResult<'base64', false>> {
    return screenshot({
        file: url,
        file_type: 'auto',
        encoding: 'base64',
        ...options,
    });
}
