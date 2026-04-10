const { print, getPrinters } = require('pdf-to-printer');
const fs = require('fs');
const path = require('path');
const os = require('os');
const logger = require('./logger');
const config = require('./config');
const { retryWithBackoff } = require('./retry-util');

// Configurar caminho correto do SumatraPDF quando empacotado
if (process.env.ELECTRON_RUN_AS_NODE === '1') {
  const isPackaged = process.resourcesPath && process.resourcesPath.includes('app.asar');
  
  if (isPackaged) {
    // Caminho correto quando empacotado
    const sumatraPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'pdf-to-printer', 'dist');
    
    // Verificar se o SumatraPDF existe no caminho correto
    const sumatraExe = path.join(sumatraPath, 'SumatraPDF-3.4.6-32.exe');
    if (fs.existsSync(sumatraExe)) {
      logger.info(`SumatraPDF encontrado em: ${sumatraExe}`);
      // Configurar variável de ambiente para o pdf-to-printer
      process.env.SUMATRA_PATH = sumatraPath;
    } else {
      logger.warn(`SumatraPDF não encontrado em: ${sumatraExe}`);
    }
  }
}

/**
 * Imprime um arquivo PDF usando o sistema nativo do Windows.
 * @param {string} pdfPath - Caminho absoluto do arquivo PDF
 * @param {string} printerInterface - Interface da impressora (ex: \\COMPUTADOR\IMPRESSORA)
 * @returns {Promise<boolean>}
 */
async function printPDF(pdfPath, printerInterface = null) {
  try {
    if (!fs.existsSync(pdfPath)) {
      logger.error(`Arquivo PDF não encontrado: ${pdfPath}`);
      return false;
    }

    const result = await retryWithBackoff(async () => {
      const printOptions = {};

      // Extrair nome da impressora da interface fornecida ou usar a primeira configurada
      const targetInterface = printerInterface || (config.printers && config.printers[0]?.interface);
      const printerName = extractPrinterName(targetInterface);

      if (printerName) {
        printOptions.printer = printerName;
        logger.info(`Imprimindo PDF na impressora: ${printerName}`);
      } else {
        logger.info('Imprimindo PDF na impressora padrão do Windows');
      }

      // Configurar caminho do SumatraPDF quando empacotado
      if (process.env.ELECTRON_RUN_AS_NODE === '1' && process.resourcesPath) {
        const sumatraPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'pdf-to-printer', 'dist', 'SumatraPDF-3.4.6-32.exe');
        if (fs.existsSync(sumatraPath)) {
          printOptions.sumatraPdfPath = sumatraPath;
          logger.info(`Usando SumatraPDF em: ${sumatraPath}`);
        }
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
 * Para impressoras compartilhadas Windows, retorna o caminho UNC completo.
 * Ex: "\\ARNALDO\TESTE" → "\\ARNALDO\TESTE"
 * Ex: "http://192.168.1.100:9100" → null (não suportado para PDF)
 * @param {string} printerInterface - Interface configurada
 * @returns {string|null}
 */
function extractPrinterName(printerInterface) {
  if (!printerInterface) return null;

  // Impressora compartilhada Windows: retorna o caminho UNC completo
  if (printerInterface.startsWith('\\\\')) {
    return printerInterface;
  }

  // Se for uma URL HTTP (impressora de rede), não é suportado para PDF
  if (printerInterface.startsWith('http://') || printerInterface.startsWith('https://')) {
    logger.warn(`Interface HTTP não suportada para impressão de PDF: ${printerInterface}`);
    return null;
  }

  // Retorna como está (pode ser nome local da impressora)
  return printerInterface;
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
