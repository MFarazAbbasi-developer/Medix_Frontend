import { app, BrowserWindow, ipcMain, shell, safeStorage } from 'electron';
import path from 'path';

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    show: false,
    title: 'Medix by FARMAX',
    backgroundColor: '#F5F7F9',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.on('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show();
    }
  });

  // Handle external links safely
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  if (isDev) {
    const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
    mainWindow.loadURL(devServerUrl).catch((err) => {
      console.error('Failed to load dev server URL:', err);
    });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

// In-memory or safeStorage secured token store for desktop station
let encryptedRefreshToken: Buffer | null = null;
let memoryFallbackRefreshToken: string | null = null;

// Register IPC handlers for desktop capabilities
function setupIpcHandlers(): void {
  ipcMain.handle('app:get-version', () => {
    return app.getVersion();
  });

  ipcMain.handle('app:get-platform', () => {
    return process.platform;
  });

  // Secure credential storage for refresh tokens (OS-level encryption via safeStorage)
  ipcMain.handle('auth:get-refresh-token', async () => {
    try {
      if (encryptedRefreshToken) {
        if (safeStorage.isEncryptionAvailable()) {
          return safeStorage.decryptString(encryptedRefreshToken);
        }
      }
      return memoryFallbackRefreshToken;
    } catch (err) {
      console.error('Failed to decrypt stored refresh token:', err);
      return null;
    }
  });

  ipcMain.handle('auth:set-refresh-token', async (_event, token: string) => {
    try {
      if (token && safeStorage.isEncryptionAvailable()) {
        encryptedRefreshToken = safeStorage.encryptString(token);
        memoryFallbackRefreshToken = null;
      } else {
        memoryFallbackRefreshToken = token || null;
        encryptedRefreshToken = null;
      }
      return true;
    } catch (err) {
      console.error('Failed to securely store refresh token:', err);
      memoryFallbackRefreshToken = token || null;
      return false;
    }
  });

  ipcMain.handle('auth:clear-refresh-token', async () => {
    encryptedRefreshToken = null;
    memoryFallbackRefreshToken = null;
    return true;
  });

  ipcMain.on('window:minimize', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.minimize();
    }
  });

  ipcMain.on('window:maximize', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });

  ipcMain.on('window:close', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.close();
    }
  });
}

app.whenReady().then(() => {
  setupIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
