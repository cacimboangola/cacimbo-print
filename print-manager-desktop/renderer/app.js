let watcherRunning = false;

const elements = {
  statusDot: document.getElementById('statusDot'),
  statusText: document.getElementById('statusText'),
  startBtn: document.getElementById('startBtn'),
  stopBtn: document.getElementById('stopBtn'),
  openFolderBtn: document.getElementById('openFolderBtn'),
  configForm: document.getElementById('configForm'),
  notification: document.getElementById('notification'),
};

// Navigation
function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const sections = document.querySelectorAll('.content-section');
  const pageTitle = document.getElementById('pageTitle');
  
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetSection = item.dataset.section;
      
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');
      
      sections.forEach(section => section.classList.remove('active'));
      document.getElementById(`${targetSection}-section`).classList.add('active');
      
      const titles = {
        dashboard: 'Dashboard',
        config: 'Configuração'
      };
      pageTitle.textContent = titles[targetSection] || 'Dashboard';
    });
  });
}

// Update Dashboard
function updateDashboard(config) {
  if (!config) return;
  
  document.getElementById('dashWatchFolder').textContent = config.WATCH_FOLDER || 'Não configurada';
  document.getElementById('dashPrinterUuid').textContent = config.TARGET_PRINTER_UUID || 'Não configurada';
  document.getElementById('dashApiUrl').textContent = config.API_URL || 'Não configurada';
  document.getElementById('folderPath').textContent = config.WATCH_FOLDER || 'C:\\CacimboPrint\\Queue';
}

async function loadConfig() {
  try {
    const config = await window.electronAPI.getConfig();
    
    document.getElementById('apiUrl').value = config.API_URL || 'http://localhost:8000/api';
    document.getElementById('targetPrinterUuid').value = config.TARGET_PRINTER_UUID || '';
    document.getElementById('watchFolder').value = config.WATCH_FOLDER || 'C:\\CacimboPrint\\Queue';
    document.getElementById('autoStart').checked = config.AUTO_START || false;
    
    updateDashboard(config);
  } catch (error) {
    console.error('Error loading config:', error);
  }
}

async function saveConfig(event) {
  event.preventDefault();
  
  const config = {
    API_URL: document.getElementById('apiUrl').value,
    TARGET_PRINTER_UUID: document.getElementById('targetPrinterUuid').value,
    WATCH_FOLDER: document.getElementById('watchFolder').value,
    AUTO_START: document.getElementById('autoStart').checked
  };

  try {
    const result = await window.electronAPI.saveConfig(config);
    
    if (result.success) {
      showNotification('Configuração salva com sucesso!', 'success');
      updateDashboard(config);
    } else {
      showNotification('Erro ao salvar configuração: ' + result.error, 'error');
    }
  } catch (error) {
    showNotification('Erro ao salvar configuração: ' + error.message, 'error');
  }
}

async function startWatcher() {
  try {
    const result = await window.electronAPI.startWatcher();
    updateWatcherStatus({ running: result.running });
    
    if (result.running) {
      showNotification('Watcher iniciado com sucesso!', 'success');
    }
  } catch (error) {
    showNotification('Erro ao iniciar watcher: ' + error.message, 'error');
  }
}

async function stopWatcher() {
  try {
    const result = await window.electronAPI.stopWatcher();
    updateWatcherStatus({ running: result.running });
    showNotification('Watcher parado', 'success');
  } catch (error) {
    showNotification('Erro ao parar watcher: ' + error.message, 'error');
  }
}

function updateWatcherStatus(status) {
  watcherRunning = status.running;
  
  if (watcherRunning) {
    elements.statusDot.classList.add('running');
    elements.statusText.textContent = 'Rodando';
    elements.startBtn.disabled = true;
    elements.stopBtn.disabled = false;
  } else {
    elements.statusDot.classList.remove('running');
    elements.statusText.textContent = 'Parado';
    elements.startBtn.disabled = false;
    elements.stopBtn.disabled = true;
  }
}

async function openFolder() {
  try {
    await window.electronAPI.openFolder();
  } catch (error) {
    showNotification('Erro ao abrir pasta: ' + error.message, 'error');
  }
}

function showNotification(message, type = 'info') {
  elements.notification.textContent = message;
  elements.notification.className = `notification ${type} show`;
  
  setTimeout(() => {
    elements.notification.classList.remove('show');
  }, 3000);
}

// Event Listeners
elements.configForm.addEventListener('submit', saveConfig);
elements.startBtn.addEventListener('click', startWatcher);
elements.stopBtn.addEventListener('click', stopWatcher);
elements.openFolderBtn.addEventListener('click', openFolder);

window.electronAPI.onWatcherStatus((status) => {
  updateWatcherStatus(status);
});

window.electronAPI.onWatcherError((error) => {
  showNotification(error, 'error');
});

// Initialize
initNavigation();
loadConfig();

window.electronAPI.getWatcherStatus().then(status => {
  updateWatcherStatus(status);
});
