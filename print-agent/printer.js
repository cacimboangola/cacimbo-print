const ThermalPrinter = require('node-thermal-printer').printer;
const PrinterTypes = require('node-thermal-printer').types;
const config = require('./config');
const logger = require('./logger');
const { printWithWindowsCommand, formatOrderAsText } = require('./windows-printer');
const { printPDF, saveTempPDF, cleanupTempFile } = require('./pdf-printer');
const { convertHTMLtoPDF } = require('./html-to-pdf');

const PRINTER_TYPE_MAP = {
  epson: PrinterTypes.EPSON,
  star: PrinterTypes.STAR,
  daruma: PrinterTypes.DARUMA,
};

/**
 * Cria uma instância da impressora térmica.
 * @returns {ThermalPrinter}
 */
function createPrinter() {
  const type = PRINTER_TYPE_MAP[config.printer.type] || PrinterTypes.EPSON;

  return new ThermalPrinter({
    type,
    interface: config.printer.interface,
    characterSet: 'PC860_PORTUGUESE',
    removeSpecialCharacters: false,
    width: config.printer.width,
    options: {
      timeout: 5000,
    },
  });
}

/**
 * Verifica se a impressora está conectada.
 * NOTA: Esta verificação pode não funcionar corretamente com impressoras compartilhadas do Windows.
 * O agente tentará imprimir mesmo se esta verificação falhar.
 * @returns {Promise<boolean>}
 */
async function isPrinterConnected() {
  try {
    const printer = createPrinter();
    const isConnected = await printer.isPrinterConnected();
    return isConnected;
  } catch (error) {
    // Não logar como erro - é normal para impressoras compartilhadas do Windows
    logger.debug(`Verificação de conexão falhou (normal para impressoras compartilhadas): ${error.message}`);
    return false;
  }
}

/**
 * Imprime uma comanda/pedido.
 * @param {object} content - Conteúdo do print job
 * @param {string} content.table_number - Número da mesa
 * @param {Array} content.items - Itens do pedido
 * @param {number} content.total - Total do pedido
 * @param {string|null} content.notes - Observações
 * @param {number} content.order_id - ID do pedido
 * @param {string} content.created_at - Data de criação
 * @returns {Promise<boolean>} true se imprimiu com sucesso
 */
async function printOrder(content) {
  try {
    logger.info(`Iniciando impressão da comanda #${content.order_id}...`);
    
    // Se a interface começa com \\ (impressora compartilhada Windows), usar comando nativo
    if (config.printer.interface.startsWith('\\\\')) {
      logger.info('Detectada impressora compartilhada do Windows, usando comando nativo...');
      const textContent = formatOrderAsText(content);
      const success = await printWithWindowsCommand(config.printer.interface, textContent);
      
      if (success) {
        logger.info(`Comanda #${content.order_id} impressa com sucesso (Mesa ${content.table_number})`);
        return true;
      } else {
        logger.error(`Falha ao imprimir comanda #${content.order_id} via comando Windows`);
        return false;
      }
    }
    
    // Caso contrário, usar node-thermal-printer (para USB direto ou rede)
    const printer = createPrinter();

    printer.alignCenter();
    printer.bold(true);
    printer.setTextSize(1, 1);
    printer.println('================================');
    printer.println('        COMANDA / PEDIDO        ');
    printer.println('================================');
    printer.bold(false);

    printer.newLine();
    printer.alignLeft();

    printer.bold(true);
    printer.println(`Mesa: ${content.table_number}`);
    printer.bold(false);
    printer.println(`Pedido #${content.order_id}`);
    printer.println(`Data: ${content.created_at}`);

    printer.drawLine();

    // Itens do pedido
    printer.bold(true);
    printer.println('ITENS:');
    printer.bold(false);
    printer.newLine();

    if (Array.isArray(content.items)) {
      content.items.forEach((item, index) => {
        const qty = item.quantity || 1;
        const name = item.name || 'Item sem nome';
        const price = parseFloat(item.price || 0).toFixed(2);
        const subtotal = (qty * parseFloat(item.price || 0)).toFixed(2);

        printer.bold(true);
        printer.println(`${index + 1}. ${qty}x ${name}`);
        printer.bold(false);

        printer.alignRight();
        printer.println(`${price} x ${qty} = ${subtotal} Kz`);
        printer.alignLeft();

        if (item.notes) {
          printer.println(`   Obs: ${item.notes}`);
        }

        printer.newLine();
      });
    }

    printer.drawLine();

    // Total
    printer.alignRight();
    printer.bold(true);
    printer.setTextSize(1, 1);
    printer.println(`TOTAL: ${parseFloat(content.total || 0).toFixed(2)} Kz`);
    printer.bold(false);
    printer.setTextNormal();

    // Observações gerais
    if (content.notes) {
      printer.alignLeft();
      printer.newLine();
      printer.drawLine();
      printer.bold(true);
      printer.println('OBSERVACOES:');
      printer.bold(false);
      printer.println(content.notes);
    }

    printer.newLine();
    printer.alignCenter();
    printer.println('--------------------------------');
    printer.println('Cacimbo Print - Sistema PDV');
    printer.println('--------------------------------');

    printer.cut();

    logger.info('Enviando dados para a impressora...');
    await printer.execute();

    logger.info(`Comanda #${content.order_id} impressa com sucesso (Mesa ${content.table_number})`);
    return true;
  } catch (error) {
    logger.error(`Erro ao imprimir comanda #${content.order_id}: ${error.message}`);
    logger.error(`Stack trace: ${error.stack}`);
    if (error.code) {
      logger.error(`Código do erro: ${error.code}`);
    }
    return false;
  }
}

/**
 * Detecta o tipo de conteúdo de um print job.
 * @param {object} content - Conteúdo do print job
 * @returns {'html'|'pdf'|'order'} Tipo do conteúdo
 */
function detectContentType(content) {
  if (!content) return 'order';

  // Formato explícito: { type: 'html', content: '...' }
  if (content.type === 'html') return 'html';
  if (content.type === 'pdf') return 'pdf';

  // Detecção automática por conteúdo
  if (typeof content.html === 'string') return 'html';
  if (typeof content.pdf === 'string') return 'pdf';

  // Padrão: formato de comanda/pedido (JSON estruturado)
  return 'order';
}

/**
 * Imprime conteúdo HTML convertendo-o para PDF primeiro.
 * @param {string} htmlContent - HTML completo
 * @param {object} options - Opções de formatação
 * @returns {Promise<boolean>}
 */
async function printHTML(htmlContent, options = {}) {
  let pdfPath = null;

  try {
    logger.info('Processando conteúdo HTML...');

    pdfPath = await convertHTMLtoPDF(htmlContent, options);

    if (!pdfPath) {
      logger.error('Falha ao converter HTML para PDF');
      return false;
    }

    const success = await printPDF(pdfPath);

    // Aguardar o SumatraPDF finalizar a leitura do arquivo antes de limpar
    await new Promise(resolve => setTimeout(resolve, 5000));

    return success;
  } catch (error) {
    logger.error(`Erro ao imprimir HTML: ${error.message}`);
    return false;
  } finally {
    if (pdfPath) {
      cleanupTempFile(pdfPath);
    }
  }
}

/**
 * Imprime conteúdo PDF a partir de base64.
 * @param {string} base64Content - PDF codificado em base64
 * @returns {Promise<boolean>}
 */
async function printPDFBase64(base64Content) {
  let pdfPath = null;

  try {
    logger.info('Processando conteúdo PDF (base64)...');
    logger.debug(`Base64 content length: ${base64Content?.length || 0} chars`);

    pdfPath = saveTempPDF(base64Content);
    const success = await printPDF(pdfPath);

    // Aguardar o SumatraPDF finalizar a leitura do arquivo antes de limpar
    await new Promise(resolve => setTimeout(resolve, 5000));

    return success;
  } catch (error) {
    logger.error(`Erro ao imprimir PDF: ${error.message}`);
    logger.error(`Stack: ${error.stack}`);
    return false;
  } finally {
    if (pdfPath) {
      cleanupTempFile(pdfPath);
    }
  }
}

/**
 * Dispatcher principal - roteia o print job para o handler correto.
 * Suporta 3 formatos:
 *   - order: JSON estruturado (comandas/pedidos) → método original
 *   - html:  Conteúdo HTML → converte para PDF → imprime
 *   - pdf:   PDF em base64 → imprime diretamente
 *
 * @param {object} content - Conteúdo do print job
 * @returns {Promise<boolean>}
 */
async function printJob(content) {
  const contentType = detectContentType(content);
  logger.info(`Tipo de conteúdo detectado: ${contentType}`);

  switch (contentType) {
    case 'html': {
      const htmlContent = content.content || content.html;
      const options = {
        format: content.format || 'A4',
        landscape: content.landscape || false,
        margin: content.margin || '10mm',
      };
      return printHTML(htmlContent, options);
    }

    case 'pdf': {
      const pdfContent = content.content || content.pdf;
      return printPDFBase64(pdfContent);
    }

    case 'order':
    default:
      return printOrder(content);
  }
}

module.exports = {
  isPrinterConnected,
  printOrder,
  printJob,
  printHTML,
  printPDFBase64,
  detectContentType,
};
