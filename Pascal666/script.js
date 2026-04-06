// 核心应用程序
class DownloadManager {
    constructor() {
        this.softwareData = null;
        this.activeDownloads = new Map();
        this.downloadHistory = JSON.parse(localStorage.getItem('downloadHistory') || '[]');
        this.currentView = 'grid';
        this.itemsPerPage = 12;
        this.currentPage = 0;
        
        this.init();
    }
    
    async init() {
        // 加载软件数据
        await this.loadSoftwareData();
        
        // 初始化UI
        this.initUI();
        this.initEventListeners();
        
        // 显示通知
        this.showNotification('🚀 Pascal666.xyz 高速下载站已就绪！', 'info');
        
        // 更新统计数据
        this.updateStats();
    }
    
    async loadSoftwareData() {
        try {
            // 尝试加载外部软件数据
            const response = await fetch('software-list.json');
            this.softwareData = await response.json();
        } catch (error) {
            console.log('使用内置软件数据');
            this.softwareData = this.getDefaultSoftwareData();
        }
        
        // 更新软件数量显示
        document.getElementById('softwareCount').textContent = 
            this.softwareData.software.length;
        
        // 初始化分类过滤器
        this.initCategoryFilter();
        
        // 显示软件
        this.displaySoftware();
    }
    
    getDefaultSoftwareData() {
        return {
            categories: ["浏览器", "影音播放", "办公学习", "系统工具", "开发编程", "游戏娱乐"],
            software: [
                {
                    id: 1,
                    name: "Google Chrome",
                    description: "谷歌浏览器，速度最快的现代浏览器",
                    version: "最新稳定版",
                    category: "浏览器",
                    icon: "🌐",
                    size: "1.2 MB",
                    popularity: 5,
                    urls: [
                        "https://dl.google.com/tag/s/appguid%3D%7B8A69D345-D564-463C-AFF1-A69D9E530F96%7D%26iid%3D%7BDFC86580-8A9B-44E4-A4AE-591B3B8ECF4F%7D%26lang%3Dzh-CN%26browser%3D4%26usagestats%3D1%26appname%3DGoogle%2520Chrome%26needsadmin%3Dprefers%26ap%3Dx64-stable-statsdef_1%26installdataindex%3Dempty/update2/installers/ChromeSetup.exe"
                    ]
                },
                {
                    id: 2,
                    "name": "Microsoft Edge",
                    "description": "微软基于Chromium内核的浏览器",
                    "version": "最新版",
                    "category": "浏览器",
                    "icon": "🔵",
                    "size": "1.5 MB",
                    "popularity": 5,
                    "urls": [
                        "https://go.microsoft.com/fwlink/?linkid=2109047&Channel=Stable&language=zh-CN"
                    ]
                },
                {
                    "id": 3,
                    "name": "Firefox",
                    "description": "火狐浏览器，开源隐私保护",
                    "version": "128.0",
                    "category": "浏览器",
                    "icon": "🦊",
                    "size": "65 MB",
                    "popularity": 4,
                    "urls": [
                        "https://download.mozilla.org/?product=firefox-latest-ssl&os=win64&lang=zh-CN"
                    ]
                },
                {
                    "id": 4,
                    "name": "PotPlayer",
                    "description": "韩国开发者出品，支持格式极多的播放器",
                    "version": "240705",
                    "category": "影音播放",
                    "icon": "🎬",
                    "size": "32 MB",
                    "popularity": 5,
                    "urls": [
                        "https://t1.daumcdn.net/potplayer/PotPlayer/Version/240705/PotPlayerSetup64.exe"
                    ]
                },
                {
                    "id": 5,
                    "name": "7-Zip",
                    "description": "免费开源的压缩解压工具",
                    "version": "24.07",
                    "category": "系统工具",
                    "icon": "📦",
                    "size": "1.5 MB",
                    "popularity": 5,
                    "urls": [
                        "https://www.7-zip.org/a/7z2407-x64.exe"
                    ]
                },
                {
                    "id": 6,
                    "name": "Steam",
                    "description": "全球最大PC游戏平台",
                    "version": "最新版",
                    "category": "游戏娱乐",
                    "icon": "🎮",
                    "size": "3.2 MB",
                    "popularity": 5,
                    "urls": [
                        "https://cdn.cloudflare.steamstatic.com/client/installer/SteamSetup.exe"
                    ]
                }
            ]
        };
    }
    
    initUI() {
        // 设置初始视图
        document.getElementById('gridViewBtn').classList.add('active');
        
        // 更新统计
        this.updateStats();
    }
    
    initEventListeners() {
        // 智能分析按钮
        document.getElementById('analyzeBtn').addEventListener('click', () => {
            this.handleUrlAnalysis();
        });
        
        // 网址输入框回车
        document.getElementById('urlInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleUrlAnalysis();
            }
        });
        
        // 视图切换
        document.getElementById('listViewBtn').addEventListener('click', () => {
            this.switchView('list');
        });
        
        document.getElementById('gridViewBtn').addEventListener('click', () => {
            this.switchView('grid');
        });
        
        // 加载更多
        document.getElementById('loadMoreBtn').addEventListener('click', () => {
            this.loadMoreSoftware();
        });
        
        // 模态框关闭
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeModal('downloadModal');
        });
        
        document.getElementById('closeProgressModal').addEventListener('click', () => {
            this.closeModal('progressModal');
        });
        
        document.getElementById('cancelModalBtn').addEventListener('click', () => {
            this.closeModal('downloadModal');
        });
        
        // 开始下载按钮
        document.getElementById('startDownloadBtn').addEventListener('click', () => {
            this.startSmartDownload();
        });
        
        // 线程滑块
        const threadSlider = document.getElementById('threadSlider');
        const threadCount = document.getElementById('threadCount');
        threadSlider.addEventListener('input', () => {
            threadCount.textContent = threadSlider.value;
        });
    }
    
    async handleUrlAnalysis() {
        const urlInput = document.getElementById('urlInput');
        const url = urlInput.value.trim();
        
        if (!url) {
            this.showNotification('请输入下载地址', 'error');
            return;
        }
        
        // 显示测速区域
        const speedtestSection = document.getElementById('speedtestSection');
        speedtestSection.style.display = 'block';
        
        // 滚动到测速区域
        speedtestSection.scrollIntoView({ behavior: 'smooth' });
        
        // 生成测试节点
        const testNodes = this.generateTestNodes(url);
        this.displayTestNodes(testNodes);
        
        // 开始并行测速
        const bestNode = await this.performSpeedTest(testNodes);
        
        if (bestNode) {
            this.showNotification(`🎯 最佳节点: ${bestNode.name} (${bestNode.speed})`, 'success');
            this.showDownloadModal(bestNode);
        } else {
            this.showNotification('⚠️ 所有节点测速失败，将使用原始链接', 'warning');
        }
    }
    
    generateTestNodes(url) {
        const originalUrl = new URL(url);
        const domain = originalUrl.hostname;
        
        // 生成多个测试节点
        return [
            {
                id: 1,
                name: '主服务器',
                url: url,
                latency: null,
                speed: null,
                status: 'waiting'
            },
            {
                id: 2,
                name: 'CDN节点1',
                url: url.replace(domain, 'cdn1.' + domain),
                latency: null,
                speed: null,
                status: 'waiting'
            },
            {
                id: 3,
                name: '镜像节点1',
                url: url.replace(originalUrl.origin, 'https://mirror1.example.com'),
                latency: null,
                speed: null,
                status: 'waiting'
            },
            {
                id: 4,
                name: '备用服务器',
                url: url.replace(domain, 'download.' + domain),
                latency: null,
                speed: null,
                status: 'waiting'
            },
            {
                id: 5,
                name: '加速节点',
                url: url + '?accelerate=true',
                latency: null,
                speed: null,
                status: 'waiting'
            }
        ];
    }
    
    displayTestNodes(nodes) {
        const grid = document.getElementById('speedtestGrid');
        grid.innerHTML = nodes.map(node => `
            <div class="speedtest-node" id="node-${node.id}" data-status="${node.status}">
                <div class="node-header">
                    <span class="node-name">${node.name}</span>
                    <span class="node-status ${node.status}">等待测速</span>
                </div>
                <div class="node-speed">-- MB/s</div>
                <div class="node-latency">延迟: -- ms</div>
            </div>
        `).join('');
    }
    
    async performSpeedTest(nodes) {
        let bestNode = null;
        let bestSpeed = 0;
        
        // 创建进度条
        const progressBar = document.getElementById('speedtestProgress');
        const progressText = document.getElementById('progressText');
        const bestNodeInfo = document.getElementById('bestNodeInfo');
        
        // 并行测速
        const promises = nodes.map(async (node, index) => {
            const nodeElement = document.getElementById(`node-${node.id}`);
            const speedElement = nodeElement.querySelector('.node-speed');
            const latencyElement = nodeElement.querySelector('.node-latency');
            const statusElement = nodeElement.querySelector('.node-status');
            
            // 更新状态
            nodeElement.setAttribute('data-status', 'testing');
            statusElement.textContent = '测速中';
            statusElement.className = 'node-status testing';
            
            try {
                // 测速逻辑
                const startTime = performance.now();
                const response = await fetch(node.url, { 
                    method: 'HEAD',
                    mode: 'no-cors',
                    cache: 'no-cache'
                });
                const endTime = performance.now();
                
                const latency = Math.round(endTime - startTime);
                const speed = this.calculateSpeed(latency);
                
                // 更新UI
                speedElement.textContent = `${speed} MB/s`;
                latencyElement.textContent = `延迟: ${latency} ms`;
                
                node.latency = latency;
                node.speed = speed;
                node.status = 'success';
                
                // 更新状态
                nodeElement.setAttribute('data-status', 'success');
                statusElement.textContent = '可用';
                statusElement.className = 'node-status success';
                
                // 更新最佳节点
                if (speed > bestSpeed) {
                    bestSpeed = speed;
                    bestNode = node;
                    bestNodeInfo.textContent = `最佳节点: ${node.name} (${speed} MB/s)`;
                }
                
            } catch (error) {
                console.error(`节点 ${node.name} 测速失败:`, error);
                
                node.status = 'error';
                nodeElement.setAttribute('data-status', 'error');
                statusElement.textContent = '不可用';
                statusElement.className = 'node-status error';
            }
            
            // 更新进度
            const progress = ((index + 1) / nodes.length) * 100;
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `${Math.round(progress)}%`;
        });
        
        // 等待所有测速完成
        await Promise.allSettled(promises);
        
        return bestNode;
    }
    
    calculateSpeed(latency) {
        // 模拟计算速度
        if (latency < 50) return (Math.random() * 5 + 8).toFixed(1); // 8-13 MB/s
        if (latency < 100) return (Math.random() * 3 + 4).toFixed(1); // 4-7 MB/s
        if (latency < 200) return (Math.random() * 2 + 2).toFixed(1); // 2-4 MB/s
        return (Math.random() + 0.5).toFixed(1); // 0.5-1.5 MB/s
    }
    
    // 其他功能函数（因篇幅限制，以下是核心功能示意）
    showDownloadModal(node) {
        const modal = document.getElementById('downloadModal');
        modal.style.display = 'flex';
        
        // 更新模态框信息
        document.getElementById('modalFileName').textContent = '智能下载';
        document.getElementById('modalBestNode').textContent = `${node.name} (${node.speed} MB/s)`;
        
        // 计算预计时间
        const estTime = this.calculateEstimatedTime(node.speed);
        document.getElementById('modalEstTime').textContent = estTime;
    }
    
    calculateEstimatedTime(speed) {
        if (!speed) return '计算中...';
        const size = 100; // 假设100MB文件
        const seconds = size / speed;
        
        if (seconds < 60) return `${Math.ceil(seconds)}秒`;
        if (seconds < 3600) return `${Math.ceil(seconds/60)}分钟`;
        return `${(seconds/3600).toFixed(1)}小时`;
    }
    
    startSmartDownload() {
        const modal = document.getElementById('downloadModal');
        const progressModal = document.getElementById('progressModal');
        
        // 切换到进度模态框
        modal.style.display = 'none';
        progressModal.style.display = 'flex';
        
        this.showNotification('🚀 开始智能下载', 'success');
        
        // 模拟下载进度
        this.simulateDownloadProgress();
    }
    
    simulateDownloadProgress() {
        const totalProgress = document.getElementById('totalProgress');
        const totalProgressBar = document.getElementById('totalProgressBar');
        const timeRemaining = document.getElementById('timeRemaining');
        const progressSpeed = document.getElementById('progressSpeed');
        
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 3;
            if (progress > 100) progress = 100;
            
            totalProgress.textContent = `${Math.round(progress)}%`;
            totalProgressBar.style.width = `${progress}%`;
            
            const speed = (Math.random() * 3 + 2).toFixed(1);
            progressSpeed.textContent = `${speed} MB/s`;
            
            const remaining = Math.round((100 - progress) / 3);
            timeRemaining.textContent = `剩余: ${remaining}秒`;
            
            if (progress >= 100) {
                clearInterval(interval);
                this.showNotification('🎉 下载完成！', 'success');
                
                // 3秒后关闭进度框
                setTimeout(() => {
                    this.closeModal('progressModal');
                }, 3000);
            }
        }, 300);
    }
    
    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }
    
    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        const icon = document.getElementById('notificationIcon');
        const text = document.getElementById('notificationText');
        
        // 设置图标
        const icons = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };
        
        icon.textContent = icons[type] || 'ℹ️';
        text.textContent = message;
        
        // 显示通知
        notification.classList.add('show');
        
        // 3秒后隐藏
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
    
    updateStats() {
        const totalDownloads = document.getElementById('totalDownloads');
        const avgSpeed = document.getElementById('avgSpeed');
        
        totalDownloads.textContent = this.downloadHistory.length;
        avgSpeed.textContent = '2.8 MB/s';
    }
}

// 页面加载后初始化
document.addEventListener('DOMContentLoaded', () => {
    window.downloadManager = new DownloadManager();
});