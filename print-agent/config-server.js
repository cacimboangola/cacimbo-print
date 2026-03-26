const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT_START = 3001;
let currentPort = PORT_START;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function readEnvFile() {
  const envPath = path.join(__dirname, '.env');
  
  if (!fs.existsSync(envPath)) {
    return {};
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const config = {};

  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key) {
        config[key.trim()] = valueParts.join('=').trim();
      }
    }
  });

  return config;
}

function writeEnvFile(config) {
  const envPath = path.join(__dirname, '.env');
  const lines = [
    '# URL da API do PDV na VPS (com https em produção)',
    `API_URL=${config.API_URL || 'http://localhost:8000/api'}`,
    '',
    '# Identificador único da impressora (UUID gerado ao registrar)',
    `PRINTER_IDENTIFIER=${config.PRINTER_IDENTIFIER || ''}`,
    '',
    '# Intervalo de polling em milissegundos (padrão: 3000 = 3 segundos)',
    `POLLING_INTERVAL=${config.POLLING_INTERVAL || '3000'}`,
    '',
    '# Tipo de impressora: epson, star, daruma',
    `PRINTER_TYPE=${config.PRINTER_TYPE || 'epson'}`,
    '',
    '# Interface da impressora (ex: USB, rede, etc.)',
    '# USB Windows: \\\\localhost\\NomeDaImpressora',
    '# USB Linux: /dev/usb/lp0',
    '# Rede: tcp://192.168.1.100:9100',
    `PRINTER_INTERFACE=${config.PRINTER_INTERFACE || 'tcp://localhost:9100'}`,
    '',
    '# Largura do papel (caracteres por linha)',
    `PRINTER_WIDTH=${config.PRINTER_WIDTH || '48'}`,
    '',
    '# Nível de log: error, warn, info, debug',
    `LOG_LEVEL=${config.LOG_LEVEL || 'info'}`,
    '',
  ];

  fs.writeFileSync(envPath, lines.join('\n'), 'utf-8');
}

app.get('/api/config', (req, res) => {
  try {
    const config = readEnvFile();
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/config', (req, res) => {
  try {
    const config = req.body;

    if (!config.API_URL) {
      return res.status(400).json({ success: false, error: 'API_URL é obrigatório' });
    }

    if (!config.PRINTER_IDENTIFIER) {
      return res.status(400).json({ success: false, error: 'PRINTER_IDENTIFIER é obrigatório' });
    }

    writeEnvFile(config);

    res.json({ success: true, message: 'Configurações salvas com sucesso!' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/test-connection', async (req, res) => {
  try {
    const { apiUrl } = req.body;

    if (!apiUrl) {
      return res.status(400).json({ success: false, error: 'API_URL é obrigatório' });
    }

    const response = await axios.get(`${apiUrl}/printers`, {
      timeout: 5000,
      headers: {
        'Accept': 'application/json',
      },
    });

    res.json({ 
      success: true, 
      message: 'Conexão com a API estabelecida com sucesso!',
      data: response.data 
    });
  } catch (error) {
    let errorMessage = 'Falha ao conectar com a API';
    
    if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Não foi possível conectar. Verifique se o servidor está rodando.';
    } else if (error.response) {
      errorMessage = `Erro ${error.response.status}: ${error.response.statusText}`;
    }

    res.status(500).json({ success: false, error: errorMessage });
  }
});

app.post('/api/register-printer', async (req, res) => {
  try {
    const { apiUrl, name, type } = req.body;

    if (!apiUrl || !name || !type) {
      return res.status(400).json({ 
        success: false, 
        error: 'API_URL, nome e tipo são obrigatórios' 
      });
    }

    const response = await axios.post(`${apiUrl}/printers/register`, {
      name,
      type,
    }, {
      timeout: 5000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    res.json({ 
      success: true, 
      message: 'Impressora registrada com sucesso!',
      data: response.data.data 
    });
  } catch (error) {
    let errorMessage = 'Falha ao registrar impressora';
    
    if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Não foi possível conectar com a API';
    } else if (error.response) {
      errorMessage = error.response.data?.message || `Erro ${error.response.status}`;
    }

    res.status(500).json({ success: false, error: errorMessage });
  }
});

async function findAvailablePort(startPort) {
  return new Promise((resolve) => {
    const server = app.listen(startPort, '127.0.0.1', () => {
      server.close(() => resolve(startPort));
    }).on('error', () => {
      resolve(findAvailablePort(startPort + 1));
    });
  });
}

async function startServer() {
  try {
    currentPort = await findAvailablePort(PORT_START);

    app.listen(currentPort, '127.0.0.1', async () => {
      const url = `http://localhost:${currentPort}`;
      
      console.log('\n========================================');
      console.log('  Cacimbo Print - Config Server');
      console.log('========================================');
      console.log(`  URL: ${url}`);
      console.log('  Pressione Ctrl+C para sair');
      console.log('========================================\n');

      try {
        const open = (await import('open')).default;
        await open(url);
      } catch (error) {
        console.log(`\nNão foi possível abrir o navegador automaticamente.`);
        console.log(`Abra manualmente: ${url}\n`);
      }
    });
  } catch (error) {
    console.error('Erro ao iniciar servidor:', error.message);
    process.exit(1);
  }
}

startServer();
