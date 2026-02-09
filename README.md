<<<<<<< HEAD
# ShineParts-main
=======
﻿# ShineParts - README da Atualizacao

## Visao geral
Este documento resume a modernizacao do sistema **ShineParts**, saindo de uma estrutura com dois backends em paralelo para uma arquitetura unica e mais segura.

## Como era antes (estado antigo)
- Existiam **dois backends ativos** ao mesmo tempo:
  - Python/Flask (`backend/app.py`)
  - Node/Express (`backend/server.js`)
- As regras de negocio estavam espalhadas, com duplicidade de rotas e comportamentos diferentes para o mesmo dominio.
- Parte das rotas tinha validacao fraca de entrada.
- Havia inconsistencias entre `routes/`, `models/` e schema real do SQLite.
- O fluxo de login e autorizacao estava menos robusto.
- Houve bloqueio de CORS no frontend por origem nao permitida (`localhost:3001`).

## O que foi feito (migracao aplicada)

### 1) Arquitetura unificada
- Backend oficial definido como **Node/Express**.
- Entrada oficial da API: `backend/server.js`.
- Base da API: `http://localhost:5000/api`.
- Flask foi marcado como **legado** para evitar conflito e confusao.

### 2) Flask descontinuado com compatibilidade
- `backend/app.py` agora e um marcador legado.
- Requisicoes `/api/*` no Flask retornam `410 Gone` com orientacao para usar o backend Node.
- Porta do Flask alterada para `5050` para nao conflitar com o Node.

### 3) Seguranca e autenticacao
- Login no Node com validacao de credenciais e JWT.
- Senhas em `users` tratadas com `bcrypt` (incluindo migracao de senha antiga quando necessario).
- Middleware de autorizacao por perfil (`admin`, `gerente`, `vendedor`).

### 4) Rotas melhoradas
- Validacao de parametros e payloads nas rotas de produtos, pedidos, filiais, usuarios e configuracoes.
- Respostas HTTP mais consistentes (`400`, `401`, `403`, `404`, `409`, `500`).
- Tratamento de erro centralizado.
- Upload com limites e validacao de tipo de arquivo.

### 5) Compatibilidade com rotas antigas
Para evitar quebra de fluxo existente:
- `POST /api/order` (compatibilidade para criacao de pedido)
- `POST /api/admin/products` (compatibilidade para cadastro de produto)

### 6) Chat e inteligencia
- Integracao do endpoint de chat com `backend/brain/SaraBrain.js`.
- Suporte a contexto de usuario e rota atual para respostas mais inteligentes.

### 7) Banco de dados
- Inicializacao central em `backend/database/index.js`.
- Melhorias aplicadas:
  - `PRAGMA foreign_keys = ON`
  - `PRAGMA journal_mode = WAL`
  - indices para melhorar consultas
  - usuario admin padrao garantido com hash
- `backend/database/database.js` passou a apontar para a mesma conexao (`index.js`).

### 8) CORS corrigido
- Inclusao de `http://localhost:3001` como origem permitida no backend.
- Resolvido erro `403` no preflight `OPTIONS /api/auth/login`.

## Arquivos alterados
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

## Como executar o sistema

### Backend
```powershell
cd C:\Users\yagod\Desktop\Projetos Grupo VR\ShineParts-main\projeto-shineray\backend
npm install
npm run dev
```

### Frontend
```powershell
cd C:\Users\yagod\Desktop\Projetos Grupo VR\ShineParts-main\projeto-shineray\frontend
npm install
npm run dev
```

### URLs
- Frontend: `http://localhost:5173` (ou porta exibida pelo Vite)
- API health: `http://localhost:5000/api/health`

## Credenciais padrao
- Usuario: `admin`
- Senha: `admin`

## Troubleshooting rapido

### Erro `vite nao e reconhecido`
- Rode `npm install` dentro da pasta `frontend`.

### Erro de login com `403` no `OPTIONS`
- Causa: CORS (origem nao permitida).
- Status atual: corrigido incluindo `localhost:3001` no backend.

### Login nao entra mesmo com credenciais corretas
- Limpar `localStorage` (chave `shineray_token`) no navegador.
- Reiniciar backend e frontend.
- Confirmar backend em `http://localhost:5000/api/health`.

## Resultado da migracao
A aplicacao agora esta com backend unico, rotas mais robustas, seguranca superior e menor risco operacional para evolucao do produto.
>>>>>>> 8988b99 (feat: unificacao backend node e melhorias de rotas)
