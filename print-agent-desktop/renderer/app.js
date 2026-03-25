let agentRunning = false;

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
    badge.textContent = '🟢 API Online';
    badge.className = 'badge badge-success';
    details.textContent = state.failureCount > 0 ? `${state.failureCount} falhas` : '';
  } else if (state.state === 'OPEN') {
    badge.textContent = '🔴 API Offline';
    badge.className = 'badge badge-error';
    details.textContent = `Reconectando em ${state.secondsUntilRetry}s`;
  } else if (state.state === 'HALF_OPEN') {
    badge.textContent = '🟡 Testando Conexão...';
    badge.className = 'badge badge-warning';
    details.textContent = 'Verificando API';
  }
}

loadConfig();

window.electronAPI.getAgentStatus().then(updateAgentStatus);
