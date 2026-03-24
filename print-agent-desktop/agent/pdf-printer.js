const { print, getPrinters } = require('pdf-to-printer');
const fs = require('fs');
const path = require('path');
const os = require('os');
const logger = require('./logger');
const config = require('./config');
const { retryWithBackoff } = require('./retry-util');

/**
 * Imprime um arquivo PDF usando o sistema nativo do Windows.
 * @param {string} pdfPath - Caminho absoluto do arquivo PDF
 * @param {object} options - Opções adicionais
 * @param {string} [options.printer] - Nome da impressora (usa a padrão se não informar)
 * @returns {Promise<boolean>}
 */
async function printPDF(pdfPath, options = {}) {
  try {
    if (!fs.existsSync(pdfPath)) {
      logger.error(`Arquivo PDF não encontrado: ${pdfPath}`);
      return false;
    }

    const result = await retryWithBackoff(async () => {
      const printOptions = {};

      // Extrair nome da impressora da interface configurada
      const printerName = options.printer || extractPrinterName(config.printer.interface);

      if (printerName) {
        printOptions.printer = printerName;
        logger.info(`Imprimindo PDF na impressora: ${printerName}`);
      } else {
        logger.info('Imprimindo PDF na impressora padrão do Windows');
      }

      await print(pdfPath, printOptions);

      logger.info(`PDF impresso com sucesso: ${pdfPath}`);
      return true;
    }, 3, 1000);

    return result;
  } catch (error) {
    logger.error(`Erro ao imprimir PDF após retries: ${error.message}`);
    return false;
  }
}

/**
 * Salva conteúdo base64 como arquivo PDF temporário.
 * @param {string} base64Content - Conteúdo PDF codificado em base64
 * @returns {string} Caminho do arquivo PDF temporário
 */
function saveTempPDF(base64Content) {
  const tempDir = path.join(os.tmpdir(), 'cacimbo-print');

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const tempFile = path.join(tempDir, `print-${Date.now()}.pdf`);
  const buffer = Buffer.from(base64Content, 'base64');
  fs.writeFileSync(tempFile, buffer);

  logger.debug(`PDF temporário salvo: ${tempFile} (${buffer.length} bytes)`);
  return tempFile;
}

/**
 * Remove arquivo PDF temporário.
 * @param {string} filePath - Caminho do arquivo
 */
function cleanupTempFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.debug(`Arquivo temporário removido: ${filePath}`);
    }
  } catch (error) {
    logger.warn(`Não foi possível remover arquivo temporário: ${error.message}`);
  }
}

/**
 * Extrai o nome da impressora a partir da interface configurada.
 * Ex: "\\\\ARNALDO\\TESTE" → "TESTE"
 * Ex: "\\\\localhost\\MinhaImpressora" → "MinhaImpressora"
 * @param {string} printerInterface - Interface configurada no .env
 * @returns {string|null}
 */
function extractPrinterName(printerInterface) {
  if (!printerInterface) return null;

  // Impressora compartilhada Windows: \\HOST\NOME
  if (printerInterface.startsWith('\\\\')) {
    const parts = printerInterface.replace(/\\\\/g, '').split('\\');
    if (parts.length >= 2) {
      return parts[parts.length - 1];
    }
  }

  return null;
}

/**
 * Lista impressoras disponíveis no sistema.
 * @returns {Promise<Array>}
 */
async function listPrinters() {
  try {
    const printers = await getPrinters();
    return printers;
  } catch (error) {
    logger.error(`Erro ao listar impressoras: ${error.message}`);
    return [];
  }
}

module.exports = {
  printPDF,
  saveTempPDF,
  cleanupTempFile,
  extractPrinterName,
  listPrinters,
};
