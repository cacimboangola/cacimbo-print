const axios = require('axios');
const config = require('./config');
const logger = require('./logger');

const client = axios.create({
  baseURL: config.api.url,
  timeout: 10000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

/**
 * Busca print jobs pendentes para todas as impressoras configuradas.
 * @returns {Promise<Array>} Lista de print jobs pendentes
 */
async function fetchPendingJobs() {
  try {
    // Buscar jobs para cada impressora configurada
    const allJobs = [];
    
    for (const printer of config.printers) {
      try {
        const response = await client.get('/print-jobs/pending', {
          params: {
            printer_identifier: printer.id,
          },
        });
        
        const jobs = response.data.data || [];
        allJobs.push(...jobs);
      } catch (printerError) {
        // Log erro específico da impressora mas continue com as outras
        logger.warn(`Erro ao buscar jobs para ${printer.name}: ${printerError.message}`);
      }
    }

    return allJobs;
  } catch (error) {
    if (error.response) {
      logger.error(`API respondeu com erro ${error.response.status}: ${JSON.stringify(error.response.data)}`);
    } else if (error.code === 'ECONNREFUSED') {
      logger.warn('Não foi possível conectar à API. Servidor offline?');
    } else if (error.code === 'ENOTFOUND') {
      logger.error(`Erro DNS: Host não encontrado (${config.api.url})`);
    } else if (error.code === 'ETIMEDOUT') {
      logger.warn(`Timeout ao conectar à API (${config.api.url})`);
    } else {
      logger.error(`Erro ao buscar jobs (${error.code || 'UNKNOWN'}): ${error.message}`);
    }
    return [];
  }
}

/**
 * Marca um print job como completo ou falho.
 * @param {number} jobId - ID do print job
 * @param {string} status - 'completed' ou 'failed'
 */
async function completeJob(jobId, status = 'completed') {
  try {
    const response = await client.patch(`/print-jobs/${jobId}/complete`, {
      status,
    });

    logger.info(`Job #${jobId} marcado como ${status}`);
    return response.data;
  } catch (error) {
    if (error.response) {
      logger.error(`Erro ao completar job #${jobId}: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    } else {
      logger.error(`Erro ao completar job #${jobId}: ${error.message}`);
    }
    return null;
  }
}

module.exports = {
  fetchPendingJobs,
  completeJob,
};
