const http = require('http');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { exec } = require('child_process');

class A2UIServer {
    constructor(port = 3333) {
        this.port = port;
        this.viewerPath = path.join(__dirname, '../a2ui-viewer');
        this.projectPath = process.cwd();
    }

    start() {
        const server = http.createServer((req, res) => {
            // 处理 CORS
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

            // 路由处理
            if (req.url === '/') {
                this.serveFile(res, path.join(this.viewerPath, 'index.html'), 'text/html');
            } else if (req.url === '/ui.json') {
                // 读取项目根目录下的 a2ui-data.json
                this.serveFile(res, path.join(this.projectPath, '.a2ui/current.json'), 'application/json');
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
