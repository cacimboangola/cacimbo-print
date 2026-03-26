const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const { fork } = require('child_process');

let mainWindow = null;
let tray = null;
let agentProcess = null;
let agentRunning = false;

const CONFIG_PATH = path.join(app.getPath('userData'), '.env');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    autoHideMenuBar: true,
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

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
  const iconPath = path.join(__dirname, 'build', 'icon.png');
  let trayIcon;
  
  if (fs.existsSync(iconPath)) {
    trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  } else {
    trayIcon = nativeImage.createEmpty();
  }
  
  tray = new Tray(trayIcon);
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Abrir Configuração',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
        } else {
          createWindow();
        }
      },
    },
    {
      type: 'separator',
    },
    {
      label: agentRunning ? 'Parar Agent' : 'Iniciar Agent',
      click: () => {
        if (agentRunning) {
          stopAgent();
        } else {
          startAgent();
        }
      },
      id: 'toggle-agent',
    },
    {
      type: 'separator',
    },
    {
      label: 'Sair',
      click: () => {
        app.isQuitting = true;
        stopAgent();
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.setToolTip('Cacimbo Print Agent');

  tray.on('click', () => {
    if (mainWindow) {
      mainWindow.show();
    } else {
      createWindow();
    }
  });
}

function updateTrayMenu() {
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Abrir Configuração',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
        } else {
          createWindow();
        }
      },
    },
    {
      type: 'separator',
    },
    {
      label: agentRunning ? 'Parar Agent' : 'Iniciar Agent',
      click: () => {
        if (agentRunning) {
          stopAgent();
        } else {
          startAgent();
        }
      },
    },
    {
      type: 'separator',
    },
    {
      label: 'Sair',
      click: () => {
        app.isQuitting = true;
        stopAgent();
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
}

function startAgent() {
  if (agentRunning) {
    return;
  }

  if (!fs.existsSync(CONFIG_PATH)) {
    if (mainWindow) {
      mainWindow.webContents.send('agent-error', 'Configuração não encontrada. Configure o agent primeiro.');
    }
    return;
  }

  const agentPath = path.join(__dirname, 'agent', 'index.js');
  
  agentProcess = fork(agentPath, [], {
    cwd: path.join(__dirname, 'agent'),
    env: {
      ...process.env,
      NODE_ENV: 'production',
      ELECTRON_RUN_AS_NODE: '1',
      CONFIG_PATH: CONFIG_PATH,
    },
    stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
  });

  agentRunning = true;
  updateTrayMenu();

  if (mainWindow) {
    mainWindow.webContents.send('agent-status', { running: true });
  }

  agentProcess.stdout.on('data', (data) => {
    const log = data.toString();
    console.log('[Agent]', log);
    if (mainWindow) {
      mainWindow.webContents.send('agent-log', log);
    }
  });

  agentProcess.stderr.on('data', (data) => {
    const log = data.toString();
    console.error('[Agent Error]', log);
    if (mainWindow) {
      mainWindow.webContents.send('agent-log', `ERROR: ${log}`);
    }
  });

  agentProcess.on('message', (message) => {
    if (message.type === 'circuit-breaker-status' && mainWindow) {
      mainWindow.webContents.send('circuit-breaker-status', message.data);
    }
  });

  agentProcess.on('exit', (code) => {
    console.log(`Agent process exited with code ${code}`);
    agentRunning = false;
    agentProcess = null;
    updateTrayMenu();
    
    if (mainWindow) {
      mainWindow.webContents.send('agent-status', { running: false });
      if (code !== 0) {
        mainWindow.webContents.send('agent-error', `Agent parou com código ${code}`);
      }
    }
  });
}

function stopAgent() {
  if (!agentRunning || !agentProcess) {
    return;
  }

  agentProcess.kill();
  agentProcess = null;
  agentRunning = false;
  updateTrayMenu();

  if (mainWindow) {
    mainWindow.webContents.send('agent-status', { running: false });
  }
}

app.whenReady().then(() => {
  createWindow();
  createTray();

  if (fs.existsSync(CONFIG_PATH)) {
    setTimeout(() => {
      startAgent();
    }, 1000);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  app.isQuitting = true;
  stopAgent();
});

ipcMain.handle('get-config', async () => {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const content = fs.readFileSync(CONFIG_PATH, 'utf8');
      const config = {};
      
      content.split('\n').forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          const match = trimmedLine.match(/^([^=]+)=(.*)$/);
          if (match) {
            const key = match[1].trim();
            const value = match[2].trim();
            config[key] = value;
          }
        }
      });
      
      console.log('Config loaded:', config);
      return config;
    }
    console.log('Config file not found at:', CONFIG_PATH);
    return {};
  } catch (error) {
    console.error('Error reading config:', error);
    return {};
  }
});

ipcMain.handle('save-config', async (event, config) => {
  try {
    const lines = [
      `API_URL=${config.API_URL || 'http://127.0.0.1:8000/api'}`,
      `PRINTER_NAME=${config.PRINTER_NAME || ''}`,
      `PRINTER_IDENTIFIER=${config.PRINTER_IDENTIFIER || ''}`,
      `PRINTER_TYPE=${config.PRINTER_TYPE || 'kitchen'}`,
      `PRINTER_INTERFACE=${config.PRINTER_INTERFACE || ''}`,
      `POLLING_INTERVAL=${config.POLLING_INTERVAL || '3000'}`,
      `PDF_PAGE_FORMAT=${config.PDF_PAGE_FORMAT || 'A4'}`,
      `PDF_ORIENTATION=${config.PDF_ORIENTATION || 'portrait'}`,
      `PDF_MARGIN=${config.PDF_MARGIN || '10mm'}`,
    ];

    const dir = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(CONFIG_PATH, lines.join('\n'), 'utf8');
    return { success: true };
  } catch (error) {
    console.error('Error saving config:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('start-agent', async () => {
  startAgent();
  return { success: true };
});

ipcMain.handle('stop-agent', async () => {
  stopAgent();
  return { success: true };
});

ipcMain.handle('get-agent-status', () => {
  return { running: agentRunning };
});

const PRINTERS_PATH = path.join(__dirname, 'agent', 'printers.json');

ipcMain.handle('load-printers', async () => {
  try {
    if (fs.existsSync(PRINTERS_PATH)) {
      const content = fs.readFileSync(PRINTERS_PATH, 'utf8');
      return JSON.parse(content);
    }
    return [];
  } catch (error) {
    console.error('Error loading printers:', error);
    return [];
  }
});

ipcMain.handle('save-printers', async (event, printers) => {
  try {
    const dir = path.dirname(PRINTERS_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(PRINTERS_PATH, JSON.stringify(printers, null, 2), 'utf8');
    console.log('Printers saved successfully');
    
    // Restart agent if running to reload printers
    if (agentRunning) {
      stopAgent();
      setTimeout(() => startAgent(), 1000);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error saving printers:', error);
    throw error;
  }
});

ipcMain.handle('test-connection', async (event, apiUrl) => {
  try {
    const axios = require('axios');
    const response = await axios.get(`${apiUrl}/printers`, { timeout: 5000 });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('fetch-api-printers', async (event, apiUrl) => {
  try {
    const axios = require('axios');
    const response = await axios.get(`${apiUrl}/printers`, { timeout: 10000 });
    
    if (response.data && Array.isArray(response.data)) {
      return { success: true, data: response.data };
    } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
      return { success: true, data: response.data.data };
    } else {
      return { success: false, error: 'Invalid response format from API' };
    }
  } catch (error) {
    console.error('Error fetching API printers:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('register-printer', async (event, apiUrl, printerData) => {
  try {
    const axios = require('axios');
    const response = await axios.post(`${apiUrl}/printers/register`, {
      name: printerData.name,
      type: printerData.type,
    }, { timeout: 10000 });
    
    console.log('Printer registered:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error registering printer:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.message || error.message 
    };
  }
});
