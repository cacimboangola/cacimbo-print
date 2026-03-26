let agentRunning = false;
let jobsProcessed = 0;

const elements = {
  statusDot: document.getElementById('statusDot'),
  statusText: document.getElementById('statusText'),
  startBtn: document.getElementById('startBtn'),
  stopBtn: document.getElementById('stopBtn'),
  testBtn: document.getElementById('testBtn'),
  registerBtn: document.getElementById('registerBtn'),
  clearLogsBtn: document.getElementById('clearLogsBtn'),
  configForm: document.getElementById('configForm'),
  logs: document.getElementById('logs'),
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
      
      // Update active nav item
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');
      
      // Update active section
      sections.forEach(section => section.classList.remove('active'));
      document.getElementById(`${targetSection}-section`).classList.add('active');
      
      // Update page title
      const titles = {
        dashboard: 'Dashboard',
        config: 'Configuração',
        logs: 'Logs'
      };
      pageTitle.textContent = titles[targetSection] || 'Dashboard';
    });
  });
}

// Update Dashboard
function updateDashboard(config) {
  if (!config) return;
  
  document.getElementById('dashPrinterName').textContent = config.PRINTER_NAME || 'Não configurada';
  document.getElementById('dashApiUrl').textContent = config.API_URL || 'Não configurada';
  document.getElementById('dashPrinterUuid').textContent = config.PRINTER_IDENTIFIER || 'Não registrada';
  document.getElementById('dashPrinterType').textContent = config.PRINTER_TYPE ? 
    { kitchen: 'Cozinha', bar: 'Bar', receipt: 'Recibo' }[config.PRINTER_TYPE] : '-';
  
  const pollingInterval = config.POLLING_INTERVAL || '3000';
  document.getElementById('dashPollingInterval').textContent = `${parseInt(pollingInterval) / 1000}s`;
  
  document.getElementById('dashJobsCount').textContent = jobsProcessed;
}

async function loadConfig() {
  try {
    const config = await window.electronAPI.getConfig();
    console.log('Config received in renderer:', config);
    
    document.getElementById('apiUrl').value = config.API_URL || 'http://127.0.0.1:8000/api';
    document.getElementById('printerName').value = config.PRINTER_NAME || '';
    document.getElementById('printerIdentifier').value = config.PRINTER_IDENTIFIER || '';
    document.getElementById('printerType').value = config.PRINTER_TYPE || 'kitchen';
    document.getElementById('printerInterface').value = config.PRINTER_INTERFACE || '';
    document.getElementById('pollingInterval').value = config.POLLING_INTERVAL || '3000';
    document.getElementById('pdfFormat').value = config.PDF_PAGE_FORMAT || 'A4';
    document.getElementById('pdfOrientation').value = config.PDF_ORIENTATION || 'portrait';
    document.getElementById('pdfMargin').value = config.PDF_MARGIN || '10mm';
    
    // Update dashboard
    updateDashboard(config);
    
    console.log('Printer Identifier set to:', document.getElementById('printerIdentifier').value);
  } catch (error) {
    console.error('Error loading config:', error);
  }
}

async function saveConfig(event) {
  event.preventDefault();
  
  const config = {
    API_URL: document.getElementById('apiUrl').value,
    PRINTER_NAME: document.getElementById('printerName').value,
    PRINTER_IDENTIFIER: document.getElementById('printerIdentifier').value,
    PRINTER_TYPE: document.getElementById('printerType').value,
    PRINTER_INTERFACE: document.getElementById('printerInterface').value,
    POLLING_INTERVAL: document.getElementById('pollingInterval').value,
    PDF_PAGE_FORMAT: document.getElementById('pdfFormat').value,
    PDF_ORIENTATION: document.getElementById('pdfOrientation').value,
    PDF_MARGIN: document.getElementById('pdfMargin').value,
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

async function registerPrinter() {
  const apiUrl = document.getElementById('apiUrl').value;
  const printerName = document.getElementById('printerName').value;
  const printerType = document.getElementById('printerType').value;
  
  if (!apiUrl) {
    showNotification('Informe a URL da API', 'error');
    return;
  }

  if (!printerName) {
    showNotification('Informe o nome da impressora', 'error');
    return;
  }

  elements.registerBtn.disabled = true;
  elements.registerBtn.textContent = '⏳ Registrando...';

  try {
    const result = await window.electronAPI.registerPrinter(apiUrl, {
      name: printerName,
      type: printerType,
    });
    
    if (result.success) {
      const printer = result.data.data;
      document.getElementById('printerIdentifier').value = printer.identifier;
      
      showNotification(`Impressora registrada! UUID: ${printer.identifier}`, 'success');
      addLog(`Impressora "${printerName}" registrada com UUID: ${printer.identifier}`);
    } else {
      showNotification('Falha ao registrar: ' + result.error, 'error');
    }
  } catch (error) {
    showNotification('Erro ao registrar impressora: ' + error.message, 'error');
  } finally {
    elements.registerBtn.disabled = false;
    elements.registerBtn.textContent = '📝 Registrar Impressora';
  }
}

async function testConnection() {
  const apiUrl = document.getElementById('apiUrl').value;
  
  if (!apiUrl) {
    showNotification('Informe a URL da API', 'error');
    return;
  }

  elements.testBtn.disabled = true;
  elements.testBtn.textContent = '⏳ Testando...';

  try {
    const result = await window.electronAPI.testConnection(apiUrl);
    
    if (result.success) {
      showNotification('Conexão bem-sucedida! ✓', 'success');
    } else {
      showNotification('Falha na conexão: ' + result.error, 'error');
    }
  } catch (error) {
    showNotification('Erro ao testar conexão: ' + error.message, 'error');
  } finally {
    elements.testBtn.disabled = false;
    elements.testBtn.textContent = '🔍 Testar Conexão';
  }
}

async function startAgent() {
  try {
    await window.electronAPI.startAgent();
    showNotification('Agent iniciado', 'success');
  } catch (error) {
    showNotification('Erro ao iniciar agent: ' + error.message, 'error');
  }
}

async function stopAgent() {
  try {
    await window.electronAPI.stopAgent();
    showNotification('Agent parado', 'info');
  } catch (error) {
    showNotification('Erro ao parar agent: ' + error.message, 'error');
  }
}

function updateAgentStatus(status) {
  agentRunning = status.running;
  
  if (agentRunning) {
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

function addLog(message) {
  const logEntry = document.createElement('div');
  logEntry.className = 'log-entry';
  
  if (message.includes('ERROR') || message.includes('Erro')) {
    logEntry.classList.add('error');
  }
  
  const timestamp = new Date().toLocaleTimeString('pt-BR');
  logEntry.textContent = `[${timestamp}] ${message}`;
  
  elements.logs.appendChild(logEntry);
  elements.logs.scrollTop = elements.logs.scrollHeight;
  
  if (elements.logs.children.length > 100) {
    elements.logs.removeChild(elements.logs.firstChild);
  }
}

function clearLogs() {
  elements.logs.innerHTML = '';
}

function showNotification(message, type = 'info') {
  elements.notification.textContent = message;
  elements.notification.className = `notification ${type} show`;
  
  setTimeout(() => {
    elements.notification.classList.remove('show');
  }, 3000);
}

elements.configForm.addEventListener('submit', saveConfig);
elements.testBtn.addEventListener('click', testConnection);
elements.registerBtn.addEventListener('click', registerPrinter);
elements.startBtn.addEventListener('click', startAgent);
elements.stopBtn.addEventListener('click', stopAgent);
elements.clearLogsBtn.addEventListener('click', clearLogs);

window.electronAPI.onAgentStatus((status) => {
  updateAgentStatus(status);
});

window.electronAPI.onAgentLog((log) => {
  addLog(log);
});

window.electronAPI.onAgentError((error) => {
  addLog(`ERROR: ${error}`);
  showNotification(error, 'error');
});

window.electronAPI.onCircuitBreakerStatus((state) => {
  updateCircuitBreakerStatus(state);
});

function updateCircuitBreakerStatus(state) {
  const badge = document.getElementById('circuitBreakerBadge');
  const details = document.getElementById('circuitBreakerDetails');
  
  if (!badge || !details) return;
  
  // Update badge based on state
  if (state.state === 'CLOSED') {
    badge.innerHTML = '<span class="api-badge-icon">🟢</span><span class="api-badge-text">API Online</span>';
    badge.className = 'api-badge badge-success';
    details.textContent = state.failureCount > 0 ? `${state.failureCount} falhas` : '';
  } else if (state.state === 'OPEN') {
    badge.innerHTML = '<span class="api-badge-icon">🔴</span><span class="api-badge-text">API Offline</span>';
    badge.className = 'api-badge badge-error';
    details.textContent = `Reconectando em ${state.secondsUntilRetry}s`;
  } else if (state.state === 'HALF_OPEN') {
    badge.innerHTML = '<span class="api-badge-icon">🟡</span><span class="api-badge-text">Testando...</span>';
    badge.className = 'api-badge badge-warning';
    details.textContent = 'Verificando API';
  }
}

// ===== PRINTER MANAGEMENT =====
let printers = [];

async function loadPrinters() {
  try {
    const data = await window.electronAPI.loadPrinters();
    printers = data || [];
    renderPrinters();
  } catch (error) {
    console.error('Error loading printers:', error);
    showNotification('Erro ao carregar impressoras', 'error');
  }
}

function renderPrinters() {
  const printersList = document.getElementById('printersList');
  if (!printersList) return;
  
  printersList.innerHTML = '';
  
  printers.forEach((printer, index) => {
    const card = document.createElement('div');
    card.className = 'printer-card';
    card.innerHTML = `
      <div class="printer-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
          <path d="M6 14h12v8H6z"/>
        </svg>
      </div>
      <div class="printer-info">
        <div class="printer-name">${printer.name}</div>
        <div class="printer-details">
          <span class="printer-detail">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px;">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            ${printer.id}
          </span>
          <span class="printer-detail">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px;">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
              <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
            </svg>
            ${printer.type}
          </span>
          <span class="printer-detail">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px;">
              <path d="M21 16V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2z"/>
              <polyline points="7 10 12 15 17 10"/>
            </svg>
            ${printer.interface}
          </span>
        </div>
      </div>
      <div class="printer-actions">
        <button class="btn btn-secondary btn-icon" onclick="editPrinter(${index})" title="Editar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button class="btn btn-danger btn-icon" onclick="deletePrinter(${index})" title="Remover">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
          </svg>
        </button>
      </div>
    `;
    printersList.appendChild(card);
  });
}

function openPrinterModal(index = null) {
  const modal = document.getElementById('printerModal');
  const modalTitle = document.getElementById('modalTitle');
  const form = document.getElementById('printerForm');
  
  if (index !== null) {
    // Edit mode
    modalTitle.textContent = 'Editar Impressora';
    const printer = printers[index];
    document.getElementById('printerIndex').value = index;
    document.getElementById('printerId').value = printer.id;
    document.getElementById('printerNameModal').value = printer.name;
    document.getElementById('printerTypeModal').value = printer.type;
    document.getElementById('printerWidth').value = printer.width;
    document.getElementById('printerInterfaceModal').value = printer.interface;
  } else {
    // Add mode
    modalTitle.textContent = 'Adicionar Impressora';
    form.reset();
    document.getElementById('printerIndex').value = '';
    document.getElementById('printerWidth').value = '48';
  }
  
  modal.classList.add('show');
}

function closePrinterModal() {
  const modal = document.getElementById('printerModal');
  modal.classList.remove('show');
}

async function savePrinter(event) {
  event.preventDefault();
  
  const index = document.getElementById('printerIndex').value;
  const printer = {
    id: document.getElementById('printerId').value.trim(),
    name: document.getElementById('printerNameModal').value.trim(),
    type: document.getElementById('printerTypeModal').value,
    width: parseInt(document.getElementById('printerWidth').value),
    interface: document.getElementById('printerInterfaceModal').value.trim(),
  };
  
  if (index === '') {
    // Add new printer
    printers.push(printer);
  } else {
    // Update existing printer
    printers[parseInt(index)] = printer;
  }
  
  try {
    await window.electronAPI.savePrinters(printers);
    showNotification('Impressora salva com sucesso!', 'success');
    renderPrinters();
    closePrinterModal();
  } catch (error) {
    console.error('Error saving printer:', error);
    showNotification('Erro ao salvar impressora', 'error');
  }
}

function editPrinter(index) {
  openPrinterModal(index);
}

async function deletePrinter(index) {
  const printer = printers[index];
  if (!confirm(`Deseja realmente remover a impressora "${printer.name}"?`)) {
    return;
  }
  
  printers.splice(index, 1);
  
  try {
    await window.electronAPI.savePrinters(printers);
    showNotification('Impressora removida com sucesso!', 'success');
    renderPrinters();
  } catch (error) {
    console.error('Error deleting printer:', error);
    showNotification('Erro ao remover impressora', 'error');
  }
}

// Printer management event listeners
document.getElementById('addPrinterBtn')?.addEventListener('click', () => openPrinterModal());
document.getElementById('closeModal')?.addEventListener('click', closePrinterModal);
document.getElementById('cancelBtn')?.addEventListener('click', closePrinterModal);
document.getElementById('printerForm')?.addEventListener('submit', savePrinter);

// Close modal on background click
document.getElementById('printerModal')?.addEventListener('click', (e) => {
  if (e.target.id === 'printerModal') {
    closePrinterModal();
  }
});

// Update navigation titles
function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const sections = document.querySelectorAll('.content-section');
  const pageTitle = document.getElementById('pageTitle');
  
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetSection = item.dataset.section;
      
      // Update active nav item
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');
      
      // Update active section
      sections.forEach(section => section.classList.remove('active'));
      document.getElementById(`${targetSection}-section`).classList.add('active');
      
      // Update page title
      const titles = {
        dashboard: 'Dashboard',
        printers: 'Impressoras',
        config: 'Configuração',
        logs: 'Logs'
      };
      pageTitle.textContent = titles[targetSection] || 'Dashboard';
      
      // Load printers when navigating to printers section
      if (targetSection === 'printers') {
        loadPrinters();
      }
    });
  });
}

// Initialize navigation
initNavigation();

// Load initial config
loadConfig();

// Load printers on startup
loadPrinters();

window.electronAPI.getAgentStatus().then(updateAgentStatus);
