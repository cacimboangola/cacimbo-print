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

const config = {
  api: {
    url: process.env.API_URL || 'http://localhost:8000/api',
  },
  printer: {
    identifier: process.env.PRINTER_IDENTIFIER || '',
    type: process.env.PRINTER_TYPE || 'epson',
    interface: process.env.PRINTER_INTERFACE || 'tcp://localhost:9100',
    width: parseInt(process.env.PRINTER_WIDTH || '48', 10),
  },
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

if (!config.printer.identifier) {
  console.error('[ERRO] PRINTER_IDENTIFIER não configurado. Configure o .env');
  process.exit(1);
}

module.exports = config;
