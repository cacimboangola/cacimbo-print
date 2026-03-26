const config = require('./config');
const logger = require('./logger');
const { fetchPendingJobs, completeJob } = require('./api-client');
const { printJob, isPrinterConnected } = require('./printer');

let isProcessing = false;

/**
 * Processa os print jobs pendentes.
 */
async function processJobs() {
  if (isProcessing) {
    return;
  }

  isProcessing = true;

  try {
    const jobs = await fetchPendingJobs();

    if (jobs.length === 0) {
      return;
    }

    logger.info(`${jobs.length} job(s) pendente(s) encontrado(s)`);

    for (const job of jobs) {
      const jobType = job.content?.type || 'order';
      logger.info(`Processando job #${job.id} (Tipo: ${jobType})`);

      const success = await printJob(job.content);

      if (success) {
        await completeJob(job.id, 'completed');
      } else {
        logger.warn(`Falha ao imprimir job #${job.id}. Tentativa ${(job.attempts || 0) + 1}`);
        await completeJob(job.id, 'failed');
      }
    }
  } catch (error) {
    logger.error(`Erro no loop de processamento: ${error.message}`);
  } finally {
    isProcessing = false;
  }
}

/**
 * Inicia o agente de impressão.
 */
async function start() {
  logger.info('========================================');
  logger.info('  Cacimbo Print Agent - Iniciando...');
  logger.info('========================================');
  logger.info(`API URL: ${config.api.url}`);
  logger.info(`Impressora: ${config.printer.identifier}`);
  logger.info(`Tipo: ${config.printer.type}`);
  logger.info(`Interface: ${config.printer.interface}`);
  logger.info(`Polling: a cada ${config.polling.interval}ms`);
  logger.info('----------------------------------------');

  const connected = await isPrinterConnected();

  if (connected) {
    logger.info('✅ Impressora conectada e pronta!');
  } else {
    logger.info('⚠️  Verificação de impressora falhou (normal para impressoras compartilhadas)');
    logger.info('   O agente tentará imprimir quando houver jobs pendentes.');
  }

  logger.info('🔄 Iniciando polling de print jobs...');

  setInterval(processJobs, config.polling.interval);

  // Processar imediatamente na primeira vez
  processJobs();
}

// Tratamento de sinais para shutdown gracioso
process.on('SIGINT', () => {
  logger.info('Recebido SIGINT. Encerrando agente...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Recebido SIGTERM. Encerrando agente...');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  logger.error(`Erro não capturado: ${error.message}`);
  logger.error(error.stack);
});

process.on('unhandledRejection', (reason) => {
  logger.error(`Promise rejeitada: ${reason}`);
});

start();
