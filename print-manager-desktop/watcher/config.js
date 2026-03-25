const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(process.env.APPDATA || process.env.HOME, 'cacimbo-print-manager', 'config.json');

function ensureConfigDir() {
  const dir = path.dirname(CONFIG_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadConfig() {
  ensureConfigDir();
  
  if (!fs.existsSync(CONFIG_PATH)) {
    const defaultConfig = {
      API_URL: 'http://localhost:8000/api',
      TARGET_PRINTER_UUID: '',
      WATCH_FOLDER: 'C:\\CacimboPrint\\Queue',
      AUTO_START: false
    };
    
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(defaultConfig, null, 2));
    return defaultConfig;
  }
  
  const data = fs.readFileSync(CONFIG_PATH, 'utf8');
  return JSON.parse(data);
}

function saveConfig(config) {
  ensureConfigDir();
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

module.exports = {
  CONFIG_PATH,
  loadConfig,
  saveConfig
};
