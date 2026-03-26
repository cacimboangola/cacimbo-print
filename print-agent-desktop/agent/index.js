const config = require('./config');
const logger = require('./logger');
const { fetchPendingJobs, completeJob } = require('./api-client');
const { printJob, isPrinterConnected } = require('./printer');
const { CircuitBreaker } = require('./circuit-breaker');

let isProcessing = false;
const jobFailureCount = new Map(); // Track failures per job ID
const MAX_POLLING_CYCLES = 3; // Max cycles before giving up on a job

// Circuit breaker for API calls
const apiCircuitBreaker = new CircuitBreaker(5, 30000);

// Metrics
let metricsRetriedSuccessfully = 0;
let metricsPermanentlyFailed = 0;

// Send circuit breaker status to parent process (Electron main)
function sendCircuitBreakerStatus() {
  if (process.send) {
    const state = apiCircuitBreaker.getState();
    process.send({
      type: 'circuit-breaker-status',
      data: state,
    });
  }
}

// Send status updates periodically
setInterval(sendCircuitBreakerStatus, 1000);

/**
 * Processa os print jobs pendentes.
 */
async function processJobs() {
  if (isProcessing) {
    return;
  }

  isProcessing = true;

  try {
    // Fetch jobs through circuit breaker
    const jobs = await apiCircuitBreaker.execute(() => fetchPendingJobs());

    if (jobs.length === 0) {
      return;
    }

    logger.info(`${jobs.length} job(s) pendente(s) encontrado(s)`);

    for (const job of jobs) {
      const jobType = job.content?.type || 'order';
      const jobId = job.id;
      
      logger.info(`[Job ${jobId}] Processando (Tipo: ${jobType})`);

      const success = await printJob(job.content);

      if (success === true) {
        // Success - mark as completed
        await completeJob(jobId, 'completed');
        
        // Check if this was a retry success
        const failureCount = jobFailureCount.get(jobId) || 0;
        if (failureCount > 0) {
          metricsRetriedSuccessfully++;
          logger.info(`[Job ${jobId}] ✓ Succeeded after ${failureCount} failed cycle(s)`);
        }
        
        // Clear failure count
        jobFailureCount.delete(jobId);
      } else if (success === null) {
        // Failed after all retries - track failure
        const currentFailures = jobFailureCount.get(jobId) || 0;
        const newFailures = currentFailures + 1;
        
        jobFailureCount.set(jobId, newFailures);
        
        logger.warn(`[Job ${jobId}] Failed in polling cycle ${newFailures}/${MAX_POLLING_CYCLES}`);
        
        if (newFailures >= MAX_POLLING_CYCLES) {
          // Permanently failed - give up
          metricsPermanentlyFailed++;
          logger.error(`[Job ${jobId}] ✗ Permanently failed after ${MAX_POLLING_CYCLES} polling cycles`);
          logger.error(`[Job ${jobId}] Skipping this job - manual intervention required`);
          
          // Remove from tracking to stop trying
          jobFailureCount.delete(jobId);
          
          // Note: We do NOT mark as completed in the API
          // The job stays pending so it can be investigated/retried manually
        } else {
          logger.info(`[Job ${jobId}] Will retry in next polling cycle`);
        }
      }
    }
    
    // Log metrics periodically
    if (metricsRetriedSuccessfully > 0 || metricsPermanentlyFailed > 0) {
      logger.info(`📊 Retry Metrics: ${metricsRetriedSuccessfully} recovered, ${metricsPermanentlyFailed} permanently failed`);
    }
  } catch (error) {
    if (error.message === 'Circuit breaker is OPEN') {
      // Circuit breaker is open - API is offline, don't spam logs
      const state = apiCircuitBreaker.getState();
      logger.warn(`⏸️  Circuit breaker OPEN - API offline, pausing polling (retry in ${state.secondsUntilRetry}s)`);
    } else {
      // Other error - log it
      logger.error(`Erro no loop de processamento: ${error.message}`);
    }
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
  logger.info(`Impressoras configuradas: ${config.printers.length}`);
  config.printers.forEach((p, index) => {
    logger.info(`  ${index + 1}. ${p.name} (${p.id}) - ${p.interface}`);
  });
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
