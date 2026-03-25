const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const os = require('os');
const logger = require('./logger');
const { retryWithBackoff } = require('./retry-util');

function getChromiumPath() {
  if (process.platform === 'win32') {
    // When running as Electron child process, look for Chrome in common locations
    const possiblePaths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
      path.join(process.env.PROGRAMFILES || '', 'Google\\Chrome\\Application\\chrome.exe'),
      path.join(process.env['PROGRAMFILES(X86)'] || '', 'Google\\Chrome\\Application\\chrome.exe'),
    ];

    for (const chromePath of possiblePaths) {
      if (chromePath && fs.existsSync(chromePath)) {
        return chromePath;
      }
    }
  }
  
  return null;
}

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

  try {
    const result = await retryWithBackoff(async () => {
      let browser = null;
      
      try {
        logger.info('Iniciando conversão HTML → PDF...');

        const launchOptions = {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
          ],
        };

        const chromiumPath = getChromiumPath();
        if (chromiumPath && fs.existsSync(chromiumPath)) {
          launchOptions.executablePath = chromiumPath;
          logger.info(`Usando Chrome: ${chromiumPath}`);
        } else {
          logger.error('Google Chrome não encontrado. Instale o Google Chrome para usar a funcionalidade de HTML→PDF');
          throw new Error('Google Chrome não encontrado. Instale o Google Chrome em: https://www.google.com/chrome/');
        }

        browser = await puppeteer.launch(launchOptions);

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
      } finally {
        if (browser) {
          try {
            await browser.close();
          } catch (e) {
            logger.debug(`Erro ao fechar browser: ${e.message}`);
          }
        }
      }
    }, 2, 500);

    return result;
  } catch (error) {
    logger.error(`Erro ao converter HTML para PDF após retries: ${error.message}`);

    // Limpar arquivo parcial se existir
    try {
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }
    } catch (e) {
      // Ignorar
    }

    return null;
  }
}

module.exports = {
  convertHTMLtoPDF,
};
