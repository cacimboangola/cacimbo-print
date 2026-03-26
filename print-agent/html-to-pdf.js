const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const os = require('os');
const logger = require('./logger');

/**
 * Converte conteúdo HTML para um arquivo PDF.
 * @param {string} htmlContent - Conteúdo HTML completo
 * @param {object} options - Opções de configuração
 * @param {string} [options.format='A4'] - Tamanho da página (A4, Letter, A5, etc.)
 * @param {boolean} [options.landscape=false] - Orientação paisagem
 * @param {string} [options.margin] - Margens (ex: '10mm')
 * @param {boolean} [options.printBackground=true] - Imprimir cores de fundo
 * @returns {Promise<string|null>} Caminho do arquivo PDF gerado ou null se falhar
 */
async function convertHTMLtoPDF(htmlContent, options = {}) {
  const tempDir = path.join(os.tmpdir(), 'cacimbo-print');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const outputPath = path.join(tempDir, `html-${Date.now()}.pdf`);
  let browser = null;

  try {
    logger.info('Iniciando conversão HTML → PDF...');

    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    const page = await browser.newPage();

    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    const margin = options.margin || '10mm';

    await page.pdf({
      path: outputPath,
      format: options.format || 'A4',
      landscape: options.landscape || false,
      printBackground: options.printBackground !== false,
      margin: {
        top: margin,
        right: margin,
        bottom: margin,
        left: margin,
      },
      preferCSSPageSize: true,
    });

    const stats = fs.statSync(outputPath);
    logger.info(`HTML convertido para PDF: ${outputPath} (${stats.size} bytes)`);

    return outputPath;
  } catch (error) {
    logger.error(`Erro ao converter HTML para PDF: ${error.message}`);
    if (error.stack) {
      logger.debug(`Stack: ${error.stack}`);
    }

    // Limpar arquivo parcial se existir
    try {
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }
    } catch (e) {
      // Ignorar
    }

    return null;
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        logger.debug(`Erro ao fechar browser: ${e.message}`);
      }
    }
  }
}

module.exports = {
  convertHTMLtoPDF,
};
