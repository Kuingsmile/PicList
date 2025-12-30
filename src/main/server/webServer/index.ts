import http from 'node:http'
import path from 'node:path'

import picgo from '@core/picgo'
import logger from '@core/picgo/logger'
import fs from 'fs-extra'

import type { IStringKeyMap } from '#/types/types'
import { encodeFilePath } from '~/utils/common'
import { configPaths } from '~/utils/configPaths'

const defaultPath = process.platform === 'win32' ? 'C:\\Users' : '/'

function getFileIcon(fileName: string, isDirectory: boolean): string {
  if (isDirectory)
    return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4v8a1 1 0 001 1h10a1 1 0 001-1V5a1 1 0 00-1-1H7L6 3H3a1 1 0 00-1 1z" fill="#FFCB47"/></svg>`

  const ext = path.extname(fileName).toLowerCase()

  if (['.txt', '.md', '.readme'].includes(ext)) {
    return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 2v12h8V6l-4-4H4z" fill="#6B73FF" stroke="#5A67D8"/><path d="M8 2v4h4" stroke="#5A67D8" fill="none"/></svg>`
  }

  if (['.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.json'].includes(ext)) {
    return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 2v12h8V6l-4-4H4z" fill="#FF6B6B" stroke="#E53E3E"/><path d="M8 2v4h4" stroke="#E53E3E" fill="none"/><text x="8" y="10" font-family="monospace" font-size="4" text-anchor="middle" fill="#fff">&lt;/&gt;</text></svg>`
  }

  if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'].includes(ext)) {
    return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 3v10h12V3H2z" fill="#4ECDC4" stroke="#319795"/><circle cx="5" cy="6" r="1" fill="#fff"/><path d="m2 10 3-3 2 2 4-4 3 3v2H2v-1z" fill="#fff" opacity="0.8"/></svg>`
  }

  if (['.mp4', '.avi', '.mov', '.wmv', '.mkv'].includes(ext)) {
    return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 3v10h12V3H2z" fill="#FF6B6B" stroke="#E53E3E"/><path d="m6 5 4 3-4 3V5z" fill="#fff"/></svg>`
  }

  if (['.mp3', '.wav', '.flac', '.aac'].includes(ext)) {
    return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 2v12h8V6l-4-4H4z" fill="#9F7AEA" stroke="#805AD5"/><path d="M8 2v4h4" stroke="#805AD5" fill="none"/><circle cx="8" cy="10" r="2" fill="#fff"/></svg>`
  }

  if (['.zip', '.rar', '.7z', '.tar', '.gz'].includes(ext)) {
    return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 2v12h8V6l-4-4H4z" fill="#F6AD55" stroke="#DD6B20"/><path d="M8 2v4h4" stroke="#DD6B20" fill="none"/><rect x="6" y="8" width="4" height="2" fill="#fff" rx="0.5"/></svg>`
  }

  if (ext === '.pdf') {
    return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 2v12h8V6l-4-4H4z" fill="#E53E3E" stroke="#C53030"/><path d="M8 2v4h4" stroke="#C53030" fill="none"/><text x="8" y="10" font-family="Arial" font-size="3" text-anchor="middle" fill="#fff">PDF</text></svg>`
  }

  if (['.exe', '.msi', '.app', '.deb', '.rpm'].includes(ext)) {
    return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 2v12h8V6l-4-4H4z" fill="#38A169" stroke="#2F855A"/><path d="M8 2v4h4" stroke="#2F855A" fill="none"/><rect x="6" y="8" width="4" height="4" fill="#fff" rx="1"/></svg>`
  }

  return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 2v12h8V6l-4-4H4z" fill="#A0ADB8" stroke="#718096"/><path d="M8 2v4h4" stroke="#718096" fill="none"/></svg>`
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function generateDirectoryListingHtml(files: any[], requestPath: string, fullPath: string) {
  const sortedFiles = sortFiles(files, fullPath)

  let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${requestPath || 'Home'} - File Browser</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
            font-size: 13px;
            background: #ffffff;
            color: #212121;
            line-height: 1.4;
        }
        
        .window {
            height: 100vh;
            display: flex;
            flex-direction: column;
            border: 1px solid #dadce0;
        }
        
        .titlebar {
            height: 32px;
            background: #f8f9fa;
            border-bottom: 1px solid #dadce0;
            display: flex;
            align-items: center;
            padding: 0 12px;
            color: #5f6368;
            font-size: 13px;
            font-weight: 500;
        }
        
        .toolbar {
            height: 40px;
            background: #ffffff;
            border-bottom: 1px solid #e8eaed;
            display: flex;
            align-items: center;
            padding: 0 12px;
            gap: 8px;
        }
        
        .nav-button {
            width: 24px;
            height: 24px;
            border: 1px solid #dadce0;
            background: #ffffff;
            cursor: pointer;
            border-radius: 2px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            color: #5f6368;
        }
        
        .nav-button:hover {
            background: #f8f9fa;
            border-color: #c4c7c5;
        }
        
        .nav-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .address-bar {
            flex: 1;
            height: 24px;
            border: 1px solid #dadce0;
            background: #ffffff;
            padding: 0 8px;
            margin: 0 8px;
            border-radius: 2px;
            font-size: 13px;
            color: #202124;
        }
        
        .address-bar:focus {
            outline: none;
            border-color: #1a73e8;
        }
        
        .search-box {
            width: 200px;
            height: 24px;
            border: 1px solid #dadce0;
            background: #ffffff;
            padding: 0 8px;
            border-radius: 2px;
            font-size: 13px;
        }
        
        .search-box:focus {
            outline: none;
            border-color: #1a73e8;
        }
        
        .main-content {
            flex: 1;
            display: flex;
            overflow: hidden;
        }
        
        .file-list-container {
            flex: 1;
            overflow: auto;
            background: #ffffff;
        }
        
        .list-header {
            height: 24px;
            background: #f8f9fa;
            border-bottom: 1px solid #e8eaed;
            display: flex;
            align-items: center;
            padding: 0 12px;
            font-size: 11px;
            font-weight: 600;
            color: #5f6368;
            text-transform: uppercase;
            letter-spacing: 0.8px;
        }
        
        .header-name {
            flex: 1;
            min-width: 200px;
        }
        
        .header-modified {
            width: 140px;
            padding: 0 8px;
        }
        
        .header-size {
            width: 80px;
            text-align: right;
            padding: 0 8px;
        }
        
        .file-list {
            user-select: none;
        }
        
        .file-item {
            height: 20px;
            display: flex;
            align-items: center;
            padding: 0 12px;
            text-decoration: none;
            color: #202124;
            border-bottom: 1px solid transparent;
            cursor: pointer;
        }
        
        .file-item:hover {
            background: #f8f9fa;
        }
        
        .file-item:active {
            background: #e8f0fe;
        }
        
        .file-icon {
            width: 16px;
            height: 16px;
            margin-right: 8px;
            flex-shrink: 0;
        }
        
        .file-name {
            flex: 1;
            min-width: 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            font-size: 13px;
        }
        
        .file-modified {
            width: 140px;
            padding: 0 8px;
            font-size: 12px;
            color: #5f6368;
            white-space: nowrap;
        }
        
        .file-size {
            width: 80px;
            text-align: right;
            padding: 0 8px;
            font-size: 12px;
            color: #5f6368;
            white-space: nowrap;
        }
        
        .directory .file-name {
            font-weight: 500;
        }
        
        .parent-dir {
            border-bottom: 1px solid #e8eaed;
        }
        
        .parent-dir .file-name {
            color: #1a73e8;
            font-weight: 500;
        }
        
        .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 200px;
            color: #5f6368;
        }
        
        .empty-state-icon {
            width: 48px;
            height: 48px;
            margin-bottom: 16px;
            opacity: 0.5;
        }
        
        .status-bar {
            height: 22px;
            background: #f8f9fa;
            border-top: 1px solid #e8eaed;
            display: flex;
            align-items: center;
            padding: 0 12px;
            font-size: 12px;
            color: #5f6368;
        }
        
        @media (max-width: 768px) {
            .header-modified, .file-modified {
                display: none;
            }
            
            .header-size, .file-size {
                width: 60px;
            }
            
            .search-box {
                width: 150px;
            }
        }
    </style>
</head>
<body>
    <div class="window">
        <div class="titlebar">
            File Browser - ${requestPath || 'Home'}
        </div>
        
        <div class="toolbar">
            <button class="nav-button" onclick="history.back()" title="Back">←</button>
            <button class="nav-button" onclick="history.forward()" title="Forward">→</button>
            <button class="nav-button" onclick="location.reload()" title="Refresh">↻</button>
            <input type="text" class="address-bar" value="${requestPath || '/'}" readonly>
            <input type="text" class="search-box" placeholder="Search..." id="searchBox">
        </div>
        
        <div class="main-content">
            <div class="file-list-container">
                <div class="list-header">
                    <div class="header-name">Name</div>
                    <div class="header-modified">Date modified</div>
                    <div class="header-size">Size</div>
                </div>
                
                <div class="file-list" id="fileList">
  `

  if (requestPath !== '/' && requestPath !== '') {
    const parentPath = path.dirname(requestPath)
    html += `
                    <a href="${encodeFilePath(parentPath === '.' ? '/' : parentPath)}" class="file-item parent-dir">
                        <div class="file-icon">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M2 6h12l-1.5-1.5H3.5L2 6z" fill="#1a73e8"/>
                                <path d="M2 6v6a1 1 0 001 1h10a1 1 0 001-1V6H2z" fill="#4285f4"/>
                            </svg>
                        </div>
                        <div class="file-name">.. (Up to parent directory)</div>
                        <div class="file-modified"></div>
                        <div class="file-size"></div>
                    </a>
    `
  }

  if (sortedFiles.length === 0) {
    html += `
                    <div class="empty-state">
                        <svg class="empty-state-icon" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
                        </svg>
                        <div>This folder is empty</div>
                    </div>
    `
  } else {
    sortedFiles.forEach((fileInfo: any) => {
      const filePath = path.join(requestPath, fileInfo.name)
      const icon = getFileIcon(fileInfo.name, fileInfo.isDirectory)
      const sizeDisplay = fileInfo.isDirectory ? '' : formatFileSize(fileInfo.size || 0)
      const modifiedDate = fileInfo.mtime
        ? new Date(fileInfo.mtime).toLocaleDateString('en-US', {
            year: '2-digit',
            month: 'numeric',
            day: 'numeric',
          }) +
          ' ' +
          new Date(fileInfo.mtime).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          })
        : ''

      html += `
                    <a href="${encodeFilePath(filePath)}" class="file-item ${fileInfo.isDirectory ? 'directory' : ''}">
                        <div class="file-icon">${icon}</div>
                        <div class="file-name">${fileInfo.name}</div>
                        <div class="file-modified">${modifiedDate}</div>
                        <div class="file-size">${sizeDisplay}</div>
                    </a>
      `
    })
  }

  const itemCount = sortedFiles.length + (requestPath !== '/' && requestPath !== '' ? 1 : 0)

  html += `
                </div>
            </div>
        </div>
        
        <div class="status-bar">
            ${itemCount} items
        </div>
    </div>
    
    <script>
        // Search functionality
        document.getElementById('searchBox').addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const fileItems = document.querySelectorAll('.file-item:not(.parent-dir)');
            
            fileItems.forEach(item => {
                const fileName = item.querySelector('.file-name').textContent.toLowerCase();
                if (fileName.includes(searchTerm)) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });
        });
        
        // Handle keyboard navigation
        document.addEventListener('keydown', function(e) {
            if (e.key === 'F5') {
                e.preventDefault();
                location.reload();
            }
        });
    </script>
</body>
</html>
  `

  return html
}

function sortFiles(files: string[], fullPath: string): any[] {
  return files
    .map(file => {
      const filePath = path.join(fullPath, file)
      let stats
      try {
        stats = fs.statSync(filePath)
      } catch (_e) {
        stats = null
      }

      return {
        name: file,
        isDirectory: stats ? stats.isDirectory() : false,
        size: stats ? stats.size : 0,
        mtime: stats ? stats.mtime : null,
      }
    })
    .sort((a, b) => {
      // Directories first, then files
      if (a.isDirectory && !b.isDirectory) return -1
      if (!a.isDirectory && b.isDirectory) return 1
      // Then alphabetical by name
      return a.name.localeCompare(b.name)
    })
}

function generateErrorPage(errorCode: number, _e: string): string {
  const errorDescriptions: Record<number, { title: string; description: string }> = {
    404: {
      title: 'Page Not Found',
      description: 'The file or directory you are looking for could not be found.',
    },
    500: {
      title: 'Server Error',
      description: 'An internal server error occurred while processing your request.',
    },
    403: {
      title: 'Access Denied',
      description: 'You do not have permission to access this resource.',
    },
  }

  const error = errorDescriptions[errorCode] || {
    title: 'Unknown Error',
    description: 'An unexpected error occurred.',
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Error ${errorCode}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .error-container {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(10px);
            padding: 60px 40px;
            text-align: center;
            max-width: 500px;
            width: 100%;
        }
        
        .error-icon {
            font-size: 80px;
            margin-bottom: 20px;
            opacity: 0.8;
        }
        
        .error-code {
            font-size: 48px;
            font-weight: 700;
            color: #e74c3c;
            margin-bottom: 10px;
        }
        
        .error-title {
            font-size: 24px;
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 15px;
        }
        
        .error-description {
            font-size: 16px;
            color: #7f8c8d;
            line-height: 1.6;
            margin-bottom: 30px;
        }
        
        .back-button {
            display: inline-block;
            padding: 12px 24px;
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            color: white;
            text-decoration: none;
            border-radius: 25px;
            font-weight: 500;
            transition: transform 0.3s, box-shadow 0.3s;
        }
        
        .back-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(79, 172, 254, 0.4);
        }
        
        @media (max-width: 480px) {
            .error-container {
                padding: 40px 30px;
            }
            
            .error-icon {
                font-size: 60px;
            }
            
            .error-code {
                font-size: 36px;
            }
            
            .error-title {
                font-size: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="error-container">
        <div class="error-icon">${errorCode === 404 ? '🔍' : errorCode === 500 ? '⚠️' : errorCode === 403 ? '🚫' : '❌'}</div>
        <div class="error-code">${errorCode}</div>
        <div class="error-title">${error.title}</div>
        <div class="error-description">${error.description}</div>
        <a href="/" class="back-button">🏠 Go Home</a>
    </div>
</body>
</html>
  `
}

function serveDirectory(res: http.ServerResponse, filePath: fs.PathLike, requestPath: string) {
  fs.readdir(filePath, (err, files) => {
    if (err) {
      logger.error(`Error reading directory ${filePath}:`, err)
      res.writeHead(500, { 'Content-Type': 'text/html' })
      res.end(generateErrorPage(500, 'Error listing directory contents'))
    } else {
      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end(generateDirectoryListingHtml(files, requestPath, filePath.toString()))
    }
  })
}

function serveFile(res: http.ServerResponse, filePath: fs.PathLike) {
  const readStream = fs.createReadStream(filePath)

  const ext = path.extname(filePath.toString()).toLowerCase()
  const contentTypes: Record<string, string> = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.md': 'text/markdown',
  }

  const contentType = contentTypes[ext] || 'application/octet-stream'
  res.setHeader('Content-Type', contentType)

  readStream.pipe(res)
  readStream.on('error', err => {
    logger.error(`Error reading file ${filePath}:`, err)
    res.writeHead(500, { 'Content-Type': 'text/html' })
    res.end(generateErrorPage(500, 'Error reading file'))
  })
}

class WebServer {
  #server!: http.Server
  #config!: IStringKeyMap

  constructor() {
    this.loadConfig()
    this.initServer()
  }

  loadConfig(): void {
    this.#config = {
      enableWebServer: picgo.getConfig<boolean>(configPaths.settings.enableWebServer) || false,
      webServerHost: picgo.getConfig<string>(configPaths.settings.webServerHost) || '0.0.0.0',
      webServerPort: picgo.getConfig<number>(configPaths.settings.webServerPort) || 37777,
      webServerPath: picgo.getConfig<string>(configPaths.settings.webServerPath) || defaultPath,
    }
  }

  initServer(): void {
    this.#server = http.createServer((req, res) => {
      const requestPath = req.url?.split('?')[0] || '/'
      const filePath = path.join(this.#config.webServerPath, decodeURIComponent(requestPath))

      try {
        const stats = fs.statSync(filePath)
        if (stats.isDirectory()) {
          serveDirectory(res, filePath, requestPath)
        } else {
          serveFile(res, filePath)
        }
      } catch (_e) {
        logger.error(`File not found: ${filePath}`)
        res.writeHead(404, { 'Content-Type': 'text/html' })
        res.end(generateErrorPage(404, 'The requested file or directory was not found'))
      }
    })
  }

  start() {
    if (this.#config.enableWebServer) {
      this.#server
        .listen(
          this.#config.webServerPort === 36699 ? 37777 : this.#config.webServerPort,
          this.#config.webServerHost,
          () => {
            logger.info(
              `Web server is running at http://${this.#config.webServerHost}:${this.#config.webServerPort}, root path is ${this.#config.webServerPath}`,
            )
          },
        )
        .on('error', err => {
          logger.error(err)
        })
    } else {
      logger.info('Web server is not enabled')
    }
  }

  stop() {
    this.#server.close(() => {
      logger.info('Web server is stopped')
    })
  }

  restart() {
    this.stop()
    this.loadConfig()
    this.initServer()
    this.start()
  }
}

export default new WebServer()
