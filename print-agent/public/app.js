const alert = document.getElementById('alert');
const testConnectionBtn = document.getElementById('testConnectionBtn');
const registerPrinterBtn = document.getElementById('registerPrinterBtn');
const saveBtn = document.getElementById('saveBtn');

const apiUrlInput = document.getElementById('apiUrl');
const printerIdentifierInput = document.getElementById('printerIdentifier');
const printerTypeInput = document.getElementById('printerType');
const printerInterfaceInput = document.getElementById('printerInterface');
const printerWidthInput = document.getElementById('printerWidth');
const pollingIntervalInput = document.getElementById('pollingInterval');
const logLevelInput = document.getElementById('logLevel');

const printerNameInput = document.getElementById('printerName');
const printerTypeRegisterInput = document.getElementById('printerTypeRegister');

function showAlert(message, type = 'info') {
  alert.textContent = message;
  alert.className = `alert alert-${type}`;
  alert.classList.remove('hidden');
  
  setTimeout(() => {
    alert.classList.add('hidden');
  }, 5000);
}

function setButtonLoading(button, loading) {
  const text = button.querySelector('.btn-text');
  const spinner = button.querySelector('.spinner');
  
  button.disabled = loading;
  
  if (loading) {
    text.classList.add('hidden');
    spinner.classList.remove('hidden');
  } else {
    text.classList.remove('hidden');
    spinner.classList.add('hidden');
  }
}

async function loadConfig() {
  try {
    const response = await fetch('/api/config');
    const result = await response.json();
    
    if (result.success) {
      const config = result.data;
      
      apiUrlInput.value = config.API_URL || 'http://localhost:8000/api';
      printerIdentifierInput.value = config.PRINTER_IDENTIFIER || '';
      printerTypeInput.value = config.PRINTER_TYPE || 'epson';
      printerInterfaceInput.value = config.PRINTER_INTERFACE || 'tcp://localhost:9100';
      printerWidthInput.value = config.PRINTER_WIDTH || '48';
      pollingIntervalInput.value = config.POLLING_INTERVAL || '3000';
      logLevelInput.value = config.LOG_LEVEL || 'info';
    }
  } catch (error) {
    console.error('Erro ao carregar configurações:', error);
  }
}

testConnectionBtn.addEventListener('click', async () => {
  const apiUrl = apiUrlInput.value.trim();
  
  if (!apiUrl) {
    showAlert('Por favor, preencha a URL da API', 'error');
    return;
  }
  
  setButtonLoading(testConnectionBtn, true);
  
  try {
    const response = await fetch('/api/test-connection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiUrl }),
    });
    
    const result = await response.json();
    
    if (result.success) {
      showAlert('✅ ' + result.message, 'success');
    } else {
      showAlert('❌ ' + result.error, 'error');
    }
  } catch (error) {
    showAlert('❌ Erro ao testar conexão: ' + error.message, 'error');
  } finally {
    setButtonLoading(testConnectionBtn, false);
  }
});

registerPrinterBtn.addEventListener('click', async () => {
  const apiUrl = apiUrlInput.value.trim();
  const name = printerNameInput.value.trim();
  const type = printerTypeRegisterInput.value;
  
  if (!apiUrl) {
    showAlert('Por favor, preencha a URL da API primeiro', 'error');
    return;
  }
  
  if (!name) {
    showAlert('Por favor, preencha o nome da impressora', 'error');
    return;
  }
  
  setButtonLoading(registerPrinterBtn, true);
  
  try {
    const response = await fetch('/api/register-printer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiUrl, name, type }),
    });
    
    const result = await response.json();
    
    if (result.success) {
      const printer = result.data;
      printerIdentifierInput.value = printer.identifier;
      
      showAlert(`✅ Impressora registrada! Identifier: ${printer.identifier}`, 'success');
      
      printerNameInput.value = '';
    } else {
      showAlert('❌ ' + result.error, 'error');
    }
  } catch (error) {
    showAlert('❌ Erro ao registrar impressora: ' + error.message, 'error');
  } finally {
    setButtonLoading(registerPrinterBtn, false);
  }
});

saveBtn.addEventListener('click', async () => {
  const config = {
    API_URL: apiUrlInput.value.trim(),
    PRINTER_IDENTIFIER: printerIdentifierInput.value.trim(),
    PRINTER_TYPE: printerTypeInput.value,
    PRINTER_INTERFACE: printerInterfaceInput.value.trim(),
    PRINTER_WIDTH: printerWidthInput.value,
    POLLING_INTERVAL: pollingIntervalInput.value,
    LOG_LEVEL: logLevelInput.value,
  };
  
  if (!config.API_URL) {
    showAlert('Por favor, preencha a URL da API', 'error');
    return;
  }
  
  if (!config.PRINTER_IDENTIFIER) {
    showAlert('Por favor, preencha o Identificador da impressora', 'error');
    return;
  }
  
  if (!config.PRINTER_INTERFACE) {
    showAlert('Por favor, preencha a Interface da impressora', 'error');
    return;
  }
  
  setButtonLoading(saveBtn, true);
  
  try {
    const response = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    
    const result = await response.json();
    
    if (result.success) {
      showAlert('✅ ' + result.message + ' Você pode fechar esta janela e executar: npm start', 'success');
    } else {
      showAlert('❌ ' + result.error, 'error');
    }
  } catch (error) {
    showAlert('❌ Erro ao salvar configurações: ' + error.message, 'error');
  } finally {
    setButtonLoading(saveBtn, false);
  }
});

loadConfig();
