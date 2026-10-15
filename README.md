# ShineParts

Projeto de modernização de um sistema web com foco em **consolidação do backend, refatoração de APIs, autenticação, consistência de banco de dados, segurança e confiabilidade da aplicação**.

O projeto migrou de uma arquitetura com dois backends executando em paralelo — Flask e Node.js — para uma arquitetura única baseada em **Node.js + Express**, reduzindo duplicidade de regras de negócio e tornando o sistema mais seguro, simples e sustentável.

---

## 🎯 Problema resolvido

O sistema original possuía duas aplicações backend funcionando simultaneamente:

- Python / Flask: `backend/app.py`
- Node.js / Express: `backend/server.js`

Essa estrutura gerava problemas como:

- Regras de negócio duplicadas
- Comportamentos inconsistentes entre APIs
- Validações incompletas em algumas rotas
- Riscos relacionados à autenticação
- Inconsistências no banco de dados
- Problemas de CORS entre frontend e backend
- Maior complexidade de manutenção

O objetivo da modernização foi reduzir essa complexidade, centralizar as regras de negócio, melhorar a segurança e criar uma base arquitetural mais simples para evolução futura.

---

## 💼 Valor gerado

A modernização trouxe melhorias importantes para o sistema:

- Redução de lógica duplicada no backend
- Melhoria nos mecanismos de autenticação e autorização
- Maior consistência nas APIs
- Melhoria na confiabilidade do banco de dados
- Redução de riscos operacionais
- Correção de problemas de comunicação entre frontend e backend
- Preservação de compatibilidade com rotas legadas
- Arquitetura mais clara e sustentável para futuras evoluções

O resultado foi uma base backend mais segura, confiável e fácil de manter.

---

## 🏗️ Modernização da arquitetura

### 1. Unificação do backend

O backend oficial do sistema foi consolidado em **Node.js com Express**.

- Entrada principal da API: `backend/server.js`
- Base da API: `http://localhost:5000/api`
- O backend Flask passou a ser considerado legado

Essa decisão reduziu conflitos e eliminou duplicidade de responsabilidade entre os dois backends.

---

### 2. Compatibilidade com o backend legado

O backend Flask foi descontinuado como aplicação principal e passou a funcionar apenas como marcador de legado.

Requisições realizadas para `/api/*` através do Flask passaram a retornar:

`410 Gone`

A resposta orienta o uso do backend Node.js.

A porta do Flask também foi alterada para:

`5050`

evitando conflito com o backend Node.js.

---

## 🔐 Segurança e autenticação

A autenticação da aplicação foi aprimorada com:

- Autenticação através do backend Node.js
- JWT para controle de sessão
- Hash de senhas com bcrypt
- Migração de senhas legadas quando necessário
- Middleware de autorização baseado em perfis
- Controle de acesso para administrador, gerente e vendedor

Também foram adicionadas validações mais consistentes nas rotas protegidas.

---

## 🔗 APIs

Diversas rotas foram revisadas e melhoradas.

Principais áreas:

- Produtos
- Pedidos
- Filiais
- Usuários
- Configurações

As APIs passaram a contar com:

- Validação de payloads
- Validação de parâmetros
- Tratamento centralizado de erros
- Respostas HTTP padronizadas
- Limites de upload
- Validação de tipos de arquivos

Principais códigos HTTP utilizados:

- `400` — Bad Request
- `401` — Unauthorized
- `403` — Forbidden
- `404` — Not Found
- `409` — Conflict
- `500` — Internal Server Error

---

## 🔄 Compatibilidade com rotas antigas

Para evitar quebra de funcionalidades existentes, algumas rotas legadas foram preservadas:

- `POST /api/order`
- `POST /api/admin/products`

Isso permitiu modernizar a aplicação sem interromper fluxos já existentes.

---

## 🤖 Camada de inteligência

O endpoint de chat foi integrado com:

`backend/brain/SaraBrain.js`

Essa camada utiliza contexto do usuário e da rota atual para fornecer respostas mais contextualizadas dentro da aplicação.

---

## 🗄️ Banco de dados

A inicialização do banco foi centralizada em:

`backend/database/index.js`

Foram implementadas melhorias como:

- `PRAGMA foreign_keys = ON`
- `PRAGMA journal_mode = WAL`
- Índices para melhoria de performance
- Garantia de existência do usuário administrador
- Senha administrativa armazenada com hash
- Padronização da conexão com o banco

O arquivo:

`backend/database/database.js`

também passou a utilizar a mesma conexão centralizada.

---

## 🌐 Correção de CORS

O backend passou a permitir explicitamente a origem:

`http://localhost:3001`

Isso corrigiu erros `403` durante requisições de preflight, como:

`OPTIONS /api/auth/login`

---

## 🛠️ Principais arquivos modificados

- `backend/server.js`
- `backend/app.py`
- `backend/database/index.js`
- `backend/database/database.js`
- `backend/middleware/auth.js`
- `backend/routes/auth.js`
- `backend/routes/products.js`
- `backend/routes/orders.js`
- `backend/models/User.js`
- `backend/models/Product.js`
- `backend/models/Order.js`
- `backend/BACKEND_ARCHITECTURE.md`

---

## 🚀 Stack utilizada

- Node.js
- Express.js
- JavaScript
- SQLite
- REST APIs
- JWT
- bcrypt
- CORS
- Vite
- Flask legado

---

## ▶️ Como executar

### Backend

`cd backend`  
`npm install`  
`npm run dev`

### Frontend

`cd frontend`  
`npm install`  
`npm run dev`

---

## 🌍 URLs locais

**Frontend:**  
`http://localhost:5173`

**Health Check da API:**  
`http://localhost:5000/api/health`

---

## 🔑 Credenciais padrão

**Usuário:** `admin`  
**Senha:** `admin`

> ⚠️ Altere as credenciais padrão antes de utilizar o sistema em qualquer ambiente real.

---

## 🧰 Troubleshooting

### Vite não reconhecido

Execute dentro da pasta `frontend`:

`npm install`

---

### Login retorna 403 no OPTIONS

Possível causa:

Origem não permitida pelo CORS.

O problema foi corrigido permitindo:

`localhost:3001`

no backend.

---

### Login falha mesmo com credenciais corretas

Tente:

1. Limpar o `localStorage`
2. Remover especialmente a chave `shineray_token`
3. Reiniciar backend e frontend
4. Confirmar que a API está respondendo em:

`http://localhost:5000/api/health`

---

## 📈 Resultado da modernização

Após a modernização, a aplicação passou a operar com:

- Backend centralizado
- Autenticação mais segura
- APIs mais consistentes
- Melhor tratamento de erros
- Banco de dados mais confiável
- Configuração de CORS corrigida
- Menor duplicidade de código
- Menor risco operacional
- Arquitetura mais simples para evolução futura

---

## 🧠 O que este projeto demonstra

Este projeto demonstra experiência prática em:

- Modernização de sistemas legados
- Arquitetura backend
- Refatoração de APIs
- Desenvolvimento com Node.js
- Autenticação JWT
- Autorização baseada em perfis
- Hash de senhas com bcrypt
- Consistência de banco de dados
- Debugging de CORS
- Validação de rotas
- Tratamento de erros
- Integração frontend/backend
- Migração de sistemas legados
- Simplificação arquitetural
- Segurança de aplicações

---

## 🎯 Objetivo do projeto

O objetivo deste projeto é demonstrar como decisões de engenharia backend podem melhorar um sistema existente.

A modernização mostra como arquitetura, autenticação, banco de dados, APIs e compatibilidade com sistemas legados podem ser trabalhados em conjunto para tornar uma aplicação:

- Mais segura
- Mais confiável
- Mais simples
- Mais sustentável
- Mais fácil de evoluir
