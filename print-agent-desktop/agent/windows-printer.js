const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const logger = require('./logger');
const { retryWithBackoff } = require('./retry-util');

/**
 * Imprime usando o comando nativo do Windows para impressoras compartilhadas.
 * @param {string} printerPath - Caminho da impressora (ex: \\ARNALDO\TESTE)
 * @param {string} content - Conteúdo texto para imprimir
 * @returns {Promise<boolean>}
 */
async function printWithWindowsCommand(printerPath, content) {
  try {
    const result = await retryWithBackoff(async () => {
      return new Promise((resolve, reject) => {
        const tempFile = path.join(os.tmpdir(), `cacimbo-print-${Date.now()}.txt`);
        
        try {
          fs.writeFileSync(tempFile, content, 'utf8');
          
          const command = `print /D:"${printerPath}" "${tempFile}"`;
          
          logger.info(`Executando comando: ${command}`);
          
          exec(command, (error, stdout, stderr) => {
            try {
              fs.unlinkSync(tempFile);
            } catch (e) {
              logger.warn(`Não foi possível deletar arquivo temporário: ${e.message}`);
            }
            
            if (error) {
              logger.error(`Erro ao executar comando print: ${error.message}`);
              if (stderr) logger.error(`stderr: ${stderr}`);
              reject(new Error(`Print command failed: ${error.message}`));
            } else {
              logger.info(`Comando executado com sucesso: ${stdout}`);
              resolve(true);
            }
          });
        } catch (error) {
          logger.error(`Erro ao criar arquivo temporário: ${error.message}`);
          try {
            fs.unlinkSync(tempFile);
          } catch (e) {
            // Ignorar
          }
          reject(error);
        }
      });
    }, 3, 1000);

    return result;
  } catch (error) {
    logger.error(`Falha ao imprimir após retries: ${error.message}`);
    return false;
  }
}

/**
 * Formata o conteúdo da comanda como texto simples.
 * @param {object} content - Conteúdo do print job
 * @returns {string}
 */
function formatOrderAsText(content) {
  let text = '';
  
  text += '================================\n';
  text += '        COMANDA / PEDIDO        \n';
  text += '================================\n';
  text += '\n';
  
  text += `Mesa: ${content.table_number}\n`;
  text += `Pedido #${content.order_id}\n`;
  text += `Data: ${content.created_at}\n`;
  text += '\n';
  text += '--------------------------------\n';
  text += 'ITENS:\n';
  text += '\n';
  
  if (Array.isArray(content.items)) {
    content.items.forEach((item, index) => {
      const qty = item.quantity || 1;
      const name = item.name || 'Item sem nome';
      const price = parseFloat(item.price || 0).toFixed(2);
      const subtotal = (qty * parseFloat(item.price || 0)).toFixed(2);
      
      text += `${index + 1}. ${qty}x ${name}\n`;
      text += `   ${price} x ${qty} = ${subtotal} Kz\n`;
      
      if (item.notes) {
        text += `   Obs: ${item.notes}\n`;
      }
      
      text += '\n';
    });
  }
  
  text += '--------------------------------\n';
  text += '\n';
  text += `TOTAL: ${parseFloat(content.total || 0).toFixed(2)} Kz\n`;
  text += '\n';
  
  if (content.notes) {
    text += '--------------------------------\n';
    text += 'OBSERVACOES:\n';
    text += `${content.notes}\n`;
    text += '--------------------------------\n';
  }
  
  text += '\n';
  text += '--------------------------------\n';
  text += 'Cacimbo Print - Sistema PDV\n';
  text += '--------------------------------\n';
  
  return text;
}

module.exports = {
  printWithWindowsCommand,
  formatOrderAsText,
};
