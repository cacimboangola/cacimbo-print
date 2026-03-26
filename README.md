# Cacimbo Print

Sistema de impressão remota para restaurantes e estabelecimentos comerciais. Permite enviar documentos para impressão em impressoras térmicas e convencionais através de uma API REST.

## 🌐 URLs

- **Produção:** https://cacimbo-print-main-so67gi.laravel.cloud
- **API Docs:** https://cacimbo-print-main-so67gi.laravel.cloud/api-docs.html
- **Local:** http://localhost:8000

## 🎯 Características

- ✅ **API REST** completa para gerenciamento de impressoras e jobs
- ✅ **Swagger/OpenAPI** documentação interativa
- ✅ **Multi-Printer Support** - múltiplas impressoras por agente
- ✅ **Print Agent Desktop** - aplicação Windows com interface gráfica
- ✅ **Suporte a múltiplos formatos** - HTML, PDF, impressão térmica
- ✅ **Circuit Breaker** - proteção contra falhas de API
- ✅ **Polling inteligente** - busca automática de jobs pendentes

## 📦 Componentes

### 1. Laravel API (Backend)
API REST para gerenciar impressoras e jobs de impressão.

**Tecnologias:**
- Laravel 12
- MySQL
- Swagger/OpenAPI

**Principais Endpoints:**
- `POST /api/printers/register` - Registrar impressora
- `GET /api/printers` - Listar impressoras
- `POST /api/print-jobs` - Criar job de impressão
- `GET /api/print-jobs/pending/{printer_id}` - Buscar jobs pendentes

### 2. Print Agent Desktop
Aplicação Windows para gerenciar impressoras localmente.

**Características:**
- Interface gráfica moderna
- Gerenciamento de múltiplas impressoras via UI
- Buscar impressoras da API e selecionar via checkboxes
- Auto-start com Windows
- System tray integration

**Documentação:** [print-agent-desktop/README.md](print-agent-desktop/README.md)

## 🚀 Instalação

### Backend (Laravel)

```bash
# Clone o repositório
git clone https://github.com/cacimboangola/cacimbo-print.git
cd cacimbo-print

# Instale dependências
composer install

# Configure o ambiente
cp .env.example .env
php artisan key:generate

# Configure o banco de dados no .env
DB_DATABASE=cacimbo_print
DB_USERNAME=root
DB_PASSWORD=

# Execute migrations
php artisan migrate

# Inicie o servidor
php artisan serve
```

### Print Agent Desktop

```bash
cd print-agent-desktop
npm install
npm start
```

**Build do instalador Windows:**
```bash
npm run build
```

## 📖 Documentação

- **API Documentation:** [Swagger UI](https://cacimbo-print-main-so67gi.laravel.cloud/api-docs.html)
- **Multi-Printer Setup:** [MULTI-PRINTER.md](print-agent-desktop/MULTI-PRINTER.md)
- **Print Agent Desktop:** [print-agent-desktop/README.md](print-agent-desktop/README.md)

## 🔧 Configuração de Produção

A aplicação está hospedada no **Laravel Cloud**:

**URL Base:** `https://cacimbo-print-main-so67gi.laravel.cloud`

**Configurar Print Agent para Produção:**
1. Abra o Print Agent Desktop
2. Configure a URL da API: `https://cacimbo-print-main-so67gi.laravel.cloud/api`
3. Registre suas impressoras via UI ou API
4. Inicie o agente

## 📝 Licença

Este projeto é proprietário da Cacimbo Angola.
