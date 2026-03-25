const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron');
const path = require('path');
const { loadConfig, saveConfig } = require('./watcher/config');
const logger = require('./watcher/logger');
const FolderWatcher = require('./watcher/folder-watcher');

let mainWindow = null;
let tray = null;
let watcher = null;
let watcherRunning = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: path.join(__dirname, 'assets', 'icon.png')
  });

  mainWindow.loadFile('renderer/index.html');

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  tray = new Tray(path.join(__dirname, 'assets', 'icon.png'));
  updateTrayMenu();

  tray.on('click', () => {
    if (mainWindow) {
      mainWindow.show();
    }
  });
}

function updateTrayMenu() {
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Cacimbo Print Manager',
      enabled: false
    },
    { type: 'separator' },
    {
      label: watcherRunning ? 'Watcher: Rodando' : 'Watcher: Parado',
      enabled: false
    },
    { type: 'separator' },
    {
      label: 'Abrir',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
        }
      }
    },
    {
      label: watcherRunning ? 'Parar Watcher' : 'Iniciar Watcher',
      click: () => {
        if (watcherRunning) {
          stopWatcher();
        } else {
          startWatcher();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Sair',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
  tray.setToolTip(watcherRunning ? 'Print Manager - Rodando' : 'Print Manager - Parado');
}

function startWatcher() {
  if (watcherRunning) {
    logger.warn('Watcher já está rodando');
    return;
  }

  const config = loadConfig();
  
  if (!config.TARGET_PRINTER_UUID) {
    logger.error('UUID da impressora não configurado');
    if (mainWindow) {
      mainWindow.webContents.send('watcher-error', 'Configure o UUID da impressora antes de iniciar');
    }
    return;
  }

  watcher = new FolderWatcher(config, logger);
  watcher.start();
  watcherRunning = true;
  updateTrayMenu();

  if (mainWindow) {
    mainWindow.webContents.send('watcher-status', { running: true });
  }

  logger.info('Watcher iniciado');
}

function stopWatcher() {
  if (!watcherRunning || !watcher) {
    return;
  }

  watcher.stop();
  watcher = null;
  watcherRunning = false;
  updateTrayMenu();

  if (mainWindow) {
    mainWindow.webContents.send('watcher-status', { running: false });
  }

  logger.info('Watcher parado');
}

// IPC Handlers
ipcMain.handle('get-config', () => {
  return loadConfig();
});

ipcMain.handle('save-config', (event, config) => {
  try {
    saveConfig(config);
    
    // Se watcher está rodando, reiniciar com nova config
    if (watcherRunning) {
      stopWatcher();
      startWatcher();
    }
    
    return { success: true };
  } catch (error) {
    logger.error(`Erro ao salvar config: ${error.message}`);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('start-watcher', () => {
  startWatcher();
  return { running: watcherRunning };
});

ipcMain.handle('stop-watcher', () => {
  stopWatcher();
  return { running: watcherRunning };
});

ipcMain.handle('get-watcher-status', () => {
  return { 
    running: watcherRunning,
    stats: watcher ? watcher.getStats() : null
  };
});

ipcMain.handle('open-folder', async () => {
  const { shell } = require('electron');
  const config = loadConfig();
  const folder = config.WATCH_FOLDER || 'C:\\CacimboPrint\\Queue';
  
  const fs = require('fs');
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }
  
  shell.openPath(folder);
});

// App Events
app.whenReady().then(() => {
  createWindow();
  createTray();

  // Auto-start se configurado
  const config = loadConfig();
  if (config.AUTO_START) {
    setTimeout(() => startWatcher(), 2000);
  }
});

app.on('window-all-closed', () => {
  // Não sair quando todas janelas fecharem (continuar em background)
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  if (watcherRunning) {
    stopWatcher();
  }
});
