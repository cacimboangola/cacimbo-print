require('dotenv').config();

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
};

if (!config.printer.identifier) {
  console.error('[ERRO] PRINTER_IDENTIFIER não configurado. Configure o .env');
  process.exit(1);
}

module.exports = config;
