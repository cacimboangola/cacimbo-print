# Guia de Implantação - Cacimbo Print Agent Desktop

## 📦 Distribuição para Parceiros

### Opção 1: Aplicação Portável (Recomendado para Testes)

A aplicação foi empacotada em `dist/Cacimbo Print Agent-win32-x64/` e está pronta para distribuição.

#### Como Distribuir

1. **Comprimir a pasta**
   ```bash
   # Comprimir a pasta dist/Cacimbo Print Agent-win32-x64/
   # Criar arquivo: Cacimbo-Print-Agent-v1.0.0-Portable.zip
   ```

2. **Enviar para parceiros**
   - Tamanho aproximado: ~400-500MB
   - Incluir instruções de uso (ver abaixo)

#### Instruções para Parceiros

**Instalação:**
1. Extrair o arquivo ZIP para uma pasta (ex: `C:\Cacimbo Print Agent\`)
2. Executar `Cacimbo Print Agent.exe`
3. A aplicação abrirá automaticamente

**Primeira Configuração:**
1. Preencher os dados da API Laravel
2. Inserir o UUID da impressora (obtido no sistema web)
3. Configurar o caminho da impressora Windows
4. Clicar em "Testar Conexão"
5. Clicar em "Salvar Configuração"
6. Clicar em "Iniciar" para começar a imprimir

**Uso Diário:**
- A aplicação minimiza para a bandeja do sistema
- Clique direito no ícone da bandeja para controlar
- Fechar a janela NÃO fecha o aplicativo (apenas minimiza)
- Para sair completamente: Bandeja → Sair

### Opção 2: Instalador Windows (Futuro)

Para criar um instalador profissional com wizard de instalação:

1. **Executar como Administrador**
   - Abrir PowerShell/CMD como Administrador
   - Necessário para evitar erros de permissão

2. **Build do instalador**
   ```bash
   npm run build
   ```

3. **Resultado**
   - Instalador NSIS: `dist/Cacimbo-Print-Agent-Setup-1.0.0.exe`
   - Instalação Next → Next → Finish
   - Cria atalhos automáticos
   - Desinstalador incluído

**Nota:** Atualmente há problemas com assinatura de código no Windows. Use a Opção 1 (portável) até resolver.

## 🔧 Configuração Avançada

### Auto-Start com Windows

Para fazer a aplicação iniciar automaticamente com o Windows:

1. Pressionar `Win + R`
2. Digitar: `shell:startup`
3. Criar atalho de `Cacimbo Print Agent.exe` nesta pasta

### Configuração via Arquivo

Editar manualmente: `%APPDATA%\cacimbo-print-agent-desktop\.env`

```env
API_URL=http://192.168.1.100:8000/api
PRINTER_IDENTIFIER=195888c2-ebc6-45b9-afd9-ad2ad6e953a2
PRINTER_TYPE=epson
PRINTER_INTERFACE=\\SERVIDOR\IMPRESSORA
POLLING_INTERVAL=3000
PDF_PAGE_FORMAT=A4
PDF_ORIENTATION=portrait
PDF_MARGIN=10mm
```

### Logs

Localização: `%APPDATA%\cacimbo-print-agent-desktop\logs\`
- `agent.log` - Logs gerais
- `error.log` - Apenas erros

## 🐛 Troubleshooting

### Aplicação não abre
- Verificar se há antivírus bloqueando
- Executar como Administrador
- Verificar logs em `%APPDATA%\cacimbo-print-agent-desktop\logs\error.log`

### Agent não inicia
- Verificar se a configuração foi salva
- Testar conexão com API
- Verificar firewall/antivírus

### Impressora não imprime
- Verificar caminho UNC da impressora
- Testar impressão manual no Windows
- Verificar permissões de rede
- Confirmar que impressora está compartilhada

### Jobs não são detectados
- Verificar UUID da impressora
- Confirmar impressora ativa no Laravel
- Verificar URL da API
- Testar endpoint: `GET /api/print-jobs/pending?printer_identifier=UUID`

## 📋 Checklist de Implantação

**Antes de enviar para parceiros:**
- [ ] Testar aplicação em máquina limpa (sem Node.js)
- [ ] Testar configuração completa
- [ ] Testar impressão de HTML
- [ ] Testar impressão de PDF
- [ ] Testar impressão térmica (se aplicável)
- [ ] Verificar system tray funcionando
- [ ] Criar documentação em PDF para parceiros
- [ ] Preparar vídeo tutorial (opcional)

**Documentação para parceiros:**
- [ ] Guia de instalação passo-a-passo
- [ ] Screenshots da interface
- [ ] Como obter UUID da impressora
- [ ] Troubleshooting comum
- [ ] Contato para suporte

## 🔄 Atualizações Futuras

### Para atualizar a aplicação:

1. **Desenvolvimento:**
   ```bash
   # Fazer alterações no código
   npm run package
   ```

2. **Distribuição:**
   - Comprimir nova versão
   - Enviar para parceiros
   - Parceiros extraem e substituem arquivos antigos
   - Configuração é preservada (salva em %APPDATA%)

### Roadmap de Melhorias

1. **Auto-update** - Implementar electron-updater
2. **Assinatura de código** - Certificado digital para evitar avisos do Windows
3. **Instalador MSI** - Para ambientes corporativos
4. **Multi-idioma** - Suporte para outros idiomas
5. **Modo offline** - Queue local quando API indisponível

## 📞 Suporte

Para problemas técnicos:
1. Verificar logs em `%APPDATA%\cacimbo-print-agent-desktop\logs\`
2. Testar conexão com API
3. Verificar configuração da impressora
4. Contatar suporte técnico com logs anexados

## 📄 Licença

MIT - Livre para uso comercial e distribuição
