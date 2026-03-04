const { contextBridge, ipcRenderer } = require('electron');

// 安全地暴露 Electron API 給前端
contextBridge.exposeInMainWorld('electronAPI', {
    // 設定視窗透明度 (0.1 ~ 1.0)
    setOpacity: (value) => ipcRenderer.send('set-opacity', value),
    // 關閉視窗
    closeWindow: () => ipcRenderer.send('close-window'),
    // 最小化視窗
    minimizeWindow: () => ipcRenderer.send('minimize-window'),
    // 取得目前透明度
    getOpacity: () => ipcRenderer.invoke('get-opacity'),
    // 取得目前可見狀態
    getVisible: () => ipcRenderer.invoke('get-visible'),
    // 判斷是否在 Electron 環境
    isElectron: true,
    // 選擇速查表圖片
    selectImage: () => ipcRenderer.invoke('select-image'),
    // 註冊速查表熱鍵事件
    onToggleCheatsheet: (callback) => ipcRenderer.on('toggle-cheatsheet', (event, ...args) => callback(...args)),
    // 移除速查表熱鍵事件
    offToggleCheatsheet: (callback) => ipcRenderer.removeAllListeners('toggle-cheatsheet'),
    // 註冊 Vendor Regex 熱鍵事件
    onToggleRegex: (callback) => ipcRenderer.on('toggle-regex', (event, ...args) => callback(...args)),
    // 移除 Vendor Regex 熱鍵事件
    offToggleRegex: (callback) => ipcRenderer.removeAllListeners('toggle-regex'),
});
