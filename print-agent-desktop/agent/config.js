const path = require('path');
const fs = require('fs');

const configPath = process.env.CONFIG_PATH || path.join(__dirname, '.env');

if (fs.existsSync(configPath)) {
  const envContent = fs.readFileSync(configPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const match = trimmedLine.match(/^([^=]+)=(.*)$/);
      if (match) {
        process.env[match[1].trim()] = match[2].trim();
      }
    }
  });
}

// Carrega configuração de impressoras do arquivo JSON
function loadPrintersConfig() {
  const printersConfigPath = path.join(__dirname, 'printers.json');
  
  if (fs.existsSync(printersConfigPath)) {
    try {
      const data = fs.readFileSync(printersConfigPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('[ERRO] Falha ao carregar printers.json:', error.message);
      return [];
    }
  }
  
  // Fallback: criar configuração de impressora única a partir do .env (compatibilidade)
  if (process.env.PRINTER_IDENTIFIER) {
    return [{
      id: process.env.PRINTER_IDENTIFIER,
      name: process.env.PRINTER_NAME || 'Impressora Principal',
      type: process.env.PRINTER_TYPE || 'epson',
      interface: process.env.PRINTER_INTERFACE || 'tcp://localhost:9100',
      width: parseInt(process.env.PRINTER_WIDTH || '48', 10),
    }];
  }
  
  return [];
}

const config = {
  api: {
    url: process.env.API_URL || 'http://localhost:8000/api',
  },
  printers: loadPrintersConfig(),
  polling: {
    interval: parseInt(process.env.POLLING_INTERVAL || '3000', 10),
  },
  log: {
    level: process.env.LOG_LEVEL || 'info',
  },
  pdf: {
    format: process.env.PDF_PAGE_FORMAT || 'A4',
    orientation: process.env.PDF_ORIENTATION || 'portrait',
    margin: process.env.PDF_MARGIN || '10mm',
  },
};

if (!config.printers || config.printers.length === 0) {
  console.warn('[AVISO] Nenhuma impressora configurada. Configure printers.json ou .env');
  console.warn('[AVISO] O agente iniciará, mas não poderá processar jobs até que impressoras sejam configuradas.');
} else {
  console.log(`[CONFIG] ${config.printers.length} impressora(s) configurada(s):`);
  config.printers.forEach(p => {
    console.log(`  - ${p.name} (${p.id}) → ${p.interface}`);
  });
}

module.exports = config;
