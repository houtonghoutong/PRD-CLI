const http = require('http');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { exec } = require('child_process');

class A2UIServer {
    constructor(port = 3333, targetFile = null) {
        this.port = port;
        this.targetFile = targetFile;
        this.viewerPath = path.join(__dirname, '../a2ui-viewer');
        this.projectPath = process.cwd();
    }

    start() {
        const server = http.createServer((req, res) => {
            // 处理 CORS
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

            // 路由处理
            const parsedUrl = new URL(req.url, `http://localhost:${this.port}`);
            const pathname = parsedUrl.pathname;

            if (pathname === '/') {
                this.serveFile(res, path.join(this.viewerPath, 'index.html'), 'text/html');
            } else if (pathname === '/ui.json') {
                // Priority: 1. URL Query Param (?file=...) 2. CLI Argument 3. Default
                const queryFile = parsedUrl.searchParams.get('file');
                let jsonPath = path.join(this.projectPath, '.a2ui/current.json');

                if (queryFile) {
                    // Prevent directory traversal attacks (basic check)
                    // Allow relative paths from project root
                    jsonPath = path.resolve(this.projectPath, queryFile);
                    if (!jsonPath.startsWith(this.projectPath)) {
                        res.writeHead(403);
                        res.end('Access denied: File outside project directory');
                        return;
                    }
                } else if (this.targetFile) {
                    jsonPath = path.isAbsolute(this.targetFile)
                        ? this.targetFile
                        : path.join(this.projectPath, this.targetFile);
                }

                this.serveFile(res, jsonPath, 'application/json');
            } else {
                res.writeHead(404);
                res.end('Not found');
            }
        });

        server.listen(this.port, () => {
            console.log(chalk.green(`\n🚀 A2UI 预览服务已启动!`));
            console.log(chalk.cyan(`👉 打开浏览器访问: http://localhost:${this.port}\n`));

            // 自动打开浏览器
            const startCommand = process.platform === 'darwin' ? 'open' :
                process.platform === 'win32' ? 'start' : 'xdg-open';
            exec(`${startCommand} http://localhost:${this.port}`);
        });

        return server;
    }

    serveFile(res, filePath, contentType) {
        fs.readFile(filePath, (err, content) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    // 如果数据文件不存在，返回空对象
                    if (filePath.endsWith('.json')) {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ type: 'Page', title: '等待数据...', children: [] }));
                    } else {
                        res.writeHead(404);
                        res.end('File not found');
                    }
                } else {
                    res.writeHead(500);
                    res.end(`Server Error: ${err.code}`);
                }
            } else {
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content);
            }
        });
    }
}

module.exports = A2UIServer;
