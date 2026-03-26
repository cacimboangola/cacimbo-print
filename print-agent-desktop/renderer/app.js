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

// API Printer Selection
let apiPrinters = [];
let selectedApiPrinters = new Set();

async function fetchApiPrinters() {
  try {
    const config = await window.electronAPI.getConfig();
    const apiUrl = config.API_URL || 'http://127.0.0.1:8000/api';
    
    showNotification('Buscando impressoras da API...', 'info');
    
    const result = await window.electronAPI.fetchApiPrinters(apiUrl);
    
    if (result.success && result.data) {
      apiPrinters = result.data;
      renderApiPrinters();
      showNotification(`${apiPrinters.length} impressora(s) encontrada(s)`, 'success');
    } else {
      showNotification('Erro ao buscar impressoras: ' + (result.error || 'Erro desconhecido'), 'error');
      document.getElementById('apiPrintersList').innerHTML = '<p class="text-muted">Erro ao carregar impressoras da API</p>';
    }
  } catch (error) {
    console.error('Error fetching API printers:', error);
    showNotification('Erro ao buscar impressoras da API', 'error');
  }
}

function renderApiPrinters() {
  const list = document.getElementById('apiPrintersList');
  if (!list || apiPrinters.length === 0) {
    list.innerHTML = '<p class="text-muted">Nenhuma impressora registrada na API</p>';
    return;
  }
  
  list.innerHTML = '';
  
  apiPrinters.forEach(printer => {
    const item = document.createElement('div');
    item.className = 'api-printer-item';
    item.dataset.printerId = printer.id;
    
    item.innerHTML = `
      <div class="api-printer-checkbox">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <div class="api-printer-info">
        <div class="api-printer-name">${printer.name}</div>
        <div class="api-printer-meta">
          <span class="api-printer-badge">UUID: ${printer.identifier}</span>
          <span class="api-printer-badge">Tipo: ${printer.type}</span>
          <span class="api-printer-badge">Status: ${printer.is_active ? '✓ Ativo' : '✗ Inativo'}</span>
        </div>
      </div>
    `;
    
    item.addEventListener('click', () => toggleApiPrinter(printer.id, item));
    list.appendChild(item);
  });
}

function toggleApiPrinter(printerId, element) {
  if (selectedApiPrinters.has(printerId)) {
    selectedApiPrinters.delete(printerId);
    element.classList.remove('selected');
  } else {
    selectedApiPrinters.add(printerId);
    element.classList.add('selected');
  }
}

async function saveSelectedApiPrinters() {
  if (selectedApiPrinters.size === 0) {
    showNotification('Selecione pelo menos uma impressora', 'error');
    return;
  }
  
  const printerInterface = document.getElementById('printerInterfaceApi').value.trim();
  const printerWidth = parseInt(document.getElementById('printerWidthApi').value);
  
  if (!printerInterface) {
    showNotification('Preencha a interface da impressora', 'error');
    return;
  }
  
  // Add selected printers to the list
  selectedApiPrinters.forEach(printerId => {
    const apiPrinter = apiPrinters.find(p => p.id === printerId);
    if (apiPrinter) {
      // Check if printer already exists
      const exists = printers.find(p => p.id === apiPrinter.identifier);
      if (!exists) {
        printers.push({
          id: apiPrinter.identifier,
          name: apiPrinter.name,
          type: 'epson', // Default type, can be customized
          width: printerWidth,
          interface: printerInterface,
        });
      }
    }
  });
  
  try {
    await window.electronAPI.savePrinters(printers);
    showNotification(`${selectedApiPrinters.size} impressora(s) adicionada(s) com sucesso!`, 'success');
    renderPrinters();
    closePrinterModal();
    selectedApiPrinters.clear();
  } catch (error) {
    console.error('Error saving printers:', error);
    showNotification('Erro ao salvar impressoras', 'error');
  }
}

// Mode toggle functionality
function toggleMode(mode) {
  const apiMode = document.getElementById('apiMode');
  const manualMode = document.getElementById('manualMode');
  const apiModeBtn = document.getElementById('apiModeBtn');
  const manualModeBtn = document.getElementById('manualModeBtn');
  const saveFromApiBtn = document.getElementById('saveFromApiBtn');
  
  if (mode === 'api') {
    apiMode.classList.add('active');
    manualMode.classList.remove('active');
    apiModeBtn.classList.add('active');
    manualModeBtn.classList.remove('active');
    saveFromApiBtn.style.display = 'flex';
  } else {
    apiMode.classList.remove('active');
    manualMode.classList.add('active');
    apiModeBtn.classList.remove('active');
    manualModeBtn.classList.add('active');
    saveFromApiBtn.style.display = 'none';
  }
}

// Printer management event listeners
document.getElementById('addPrinterBtn')?.addEventListener('click', () => openPrinterModal());
document.getElementById('closeModal')?.addEventListener('click', closePrinterModal);
document.getElementById('cancelBtn')?.addEventListener('click', closePrinterModal);
document.getElementById('printerForm')?.addEventListener('submit', savePrinter);
document.getElementById('fetchPrintersBtn')?.addEventListener('click', fetchApiPrinters);
document.getElementById('saveFromApiBtn')?.addEventListener('click', saveSelectedApiPrinters);
document.getElementById('apiModeBtn')?.addEventListener('click', () => toggleMode('api'));
document.getElementById('manualModeBtn')?.addEventListener('click', () => toggleMode('manual'));

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
