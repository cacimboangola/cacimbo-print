const chokidar = require('chokidar');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

class FolderWatcher {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.watcher = null;
    this.processing = new Set();
  }

  start() {
    if (this.watcher) {
      this.logger.warn('Watcher já está rodando');
      return;
    }

    const watchPath = this.config.WATCH_FOLDER || 'C:\\CacimboPrint\\Queue';
    
    if (!fs.existsSync(watchPath)) {
      fs.mkdirSync(watchPath, { recursive: true });
      this.logger.info(`Pasta de monitoramento criada: ${watchPath}`);
    }

    this.logger.info(`Iniciando monitoramento da pasta: ${watchPath}`);

    this.watcher = chokidar.watch(watchPath, {
      ignored: /(^|[\/\\])\../, // Ignora arquivos ocultos
      persistent: true,
      ignoreInitial: false,
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100
      }
    });

    this.watcher
      .on('add', (filePath) => this.handleNewFile(filePath))
      .on('error', (error) => this.logger.error(`Erro no watcher: ${error.message}`));

    this.logger.info('✅ Watcher iniciado com sucesso');
  }

  stop() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
      this.logger.info('Watcher parado');
    }
  }

  async handleNewFile(filePath) {
    const fileName = path.basename(filePath);
    const ext = path.extname(filePath).toLowerCase();

    // Apenas processar PDFs
    if (ext !== '.pdf') {
      this.logger.debug(`Arquivo ignorado (não é PDF): ${fileName}`);
      return;
    }

    // Evitar processar o mesmo arquivo múltiplas vezes
    if (this.processing.has(filePath)) {
      return;
    }

    this.processing.add(filePath);
    this.logger.info(`📄 Novo arquivo detectado: ${fileName}`);

    try {
      await this.sendToAPI(filePath);
      await this.moveToProcessed(filePath);
    } catch (error) {
      this.logger.error(`Erro ao processar ${fileName}: ${error.message}`);
      await this.moveToFailed(filePath);
    } finally {
      this.processing.delete(filePath);
    }
  }

  async sendToAPI(filePath) {
    const fileName = path.basename(filePath);
    
    // Ler arquivo como base64
    const fileBuffer = fs.readFileSync(filePath);
    const base64Content = fileBuffer.toString('base64');

    const apiUrl = this.config.API_URL || 'http://localhost:8000/api';
    const printerIdentifier = this.config.TARGET_PRINTER_UUID;

    if (!printerIdentifier) {
      throw new Error('UUID da impressora de destino não configurado');
    }

    this.logger.info(`Enviando ${fileName} para API...`);

    const payload = {
      printer_identifier: printerIdentifier,
      content: {
        type: 'pdf',
        content: base64Content
      }
    };

    const response = await axios.post(`${apiUrl}/print-jobs`, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 30000
    });

    if (response.data && response.data.id) {
      this.logger.info(`✅ Job criado com sucesso: ID ${response.data.id}`);
      return response.data;
    } else {
      throw new Error('Resposta inválida da API');
    }
  }

  async moveToProcessed(filePath) {
    const processedFolder = path.join(path.dirname(filePath), 'processed');
    
    if (!fs.existsSync(processedFolder)) {
      fs.mkdirSync(processedFolder, { recursive: true });
    }

    const fileName = path.basename(filePath);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const newPath = path.join(processedFolder, `${timestamp}_${fileName}`);

    fs.renameSync(filePath, newPath);
    this.logger.info(`Arquivo movido para: ${newPath}`);
  }

  async moveToFailed(filePath) {
    const failedFolder = path.join(path.dirname(filePath), 'failed');
    
    if (!fs.existsSync(failedFolder)) {
      fs.mkdirSync(failedFolder, { recursive: true });
    }

    const fileName = path.basename(filePath);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const newPath = path.join(failedFolder, `${timestamp}_${fileName}`);

    fs.renameSync(filePath, newPath);
    this.logger.warn(`Arquivo movido para pasta de falhas: ${newPath}`);
  }

  getStats() {
    return {
      watching: this.watcher !== null,
      processing: this.processing.size,
      watchPath: this.config.WATCH_FOLDER
    };
  }
}

module.exports = FolderWatcher;
