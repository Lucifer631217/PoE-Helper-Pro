const { app, BrowserWindow, globalShortcut, ipcMain, dialog } = require('electron');
const path = require('path');

let mainWindow = null;
let isVisible = true;
let savedOpacity = 0.9;

// 判斷是否為開發環境
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 400,
        height: 780,
        minWidth: 300,
        minHeight: 400,
        // --- 置頂功能：永遠在遊戲畫面上方 ---
        alwaysOnTop: true,
        // --- 無邊框視窗 (自訂標題列) ---
        frame: false,
        // --- 預設透明度 (不使用 transparent，否則 Windows 下邊框縮放失效) ---
        opacity: savedOpacity,
        // --- 允許自由縮放 ---
        resizable: true,
        // --- 啟用 Windows 粗邊框，讓四角和四邊都可拖曳縮放 ---
        thickFrame: true,
        // --- 跳過工作列 (可選) ---
        skipTaskbar: false,
        // --- 置頂層級設定為螢幕保護程式級別，確保在全螢幕遊戲上方 ---
        // alwaysOnTop level 可設為 'screen-saver' 來覆蓋全螢幕遊戲
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            contextIsolation: true,
            nodeIntegration: false,
            webSecurity: false // 允許載入本地圖片
        },
    });

    // 設定置頂層級為最高 (可在全螢幕遊戲上方)
    mainWindow.setAlwaysOnTop(true, 'screen-saver');

    // 開發模式載入 Vite 開發伺服器，生產模式載入打包後的檔案
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
    } else {
        mainWindow.loadFile(path.join(__dirname, '..', 'build', 'index.html'));
    }

    // --- F10 一鍵隱藏/顯示 ---
    globalShortcut.register('F10', () => {
        if (!mainWindow) return;
        if (isVisible) {
            mainWindow.setOpacity(0);
            isVisible = false;
        } else {
            mainWindow.setOpacity(savedOpacity);
            isVisible = true;
        }
    });

    // --- F9 速查表顯示/隱藏 ---
    globalShortcut.register('F9', () => {
        if (!mainWindow) return;
        mainWindow.webContents.send('toggle-cheatsheet');
    });

    // --- F8 Regex 顯示/隱藏 ---
    globalShortcut.register('F8', () => {
        if (!mainWindow) return;
        mainWindow.webContents.send('toggle-regex');
    });

    // --- IPC：接收來自前端的透明度調整 ---
    ipcMain.on('set-opacity', (event, value) => {
        if (mainWindow && value >= 0.1 && value <= 1.0) {
            savedOpacity = value;
            if (isVisible) {
                mainWindow.setOpacity(value);
            }
        }
    });

    // --- IPC：接收來自前端的關閉視窗請求 ---
    ipcMain.on('close-window', () => {
        if (mainWindow) mainWindow.close();
    });

    // --- IPC：接收來自前端的最小化請求 ---
    ipcMain.on('minimize-window', () => {
        if (mainWindow) mainWindow.minimize();
    });

    // --- IPC：取得目前透明度 ---
    ipcMain.handle('get-opacity', () => savedOpacity);

    // --- IPC：取得目前可見狀態 ---
    ipcMain.handle('get-visible', () => isVisible);

    // --- IPC：選擇圖片 ---
    ipcMain.handle('select-image', async () => {
        const result = await dialog.showOpenDialog(mainWindow, {
            title: '選擇速查表圖片',
            properties: ['openFile'],
            filters: [{ name: 'Images', extensions: ['jpg', 'png', 'gif', 'webp'] }]
        });
        if (!result.canceled && result.filePaths.length > 0) {
            return `file:///${result.filePaths[0].replace(/\\/g, '/')}`; // 轉為 URL 格式
        }
        return null;
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    globalShortcut.unregisterAll();
    app.quit();
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});
