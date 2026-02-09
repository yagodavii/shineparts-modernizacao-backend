const db = require('../database/index');

class SaraBrain {
    constructor() {
        // --- INTENÇÕES DO CLIENTE (LOJA) ---
        this.intents = {
            HELP: /\b(ajuda|help|o que fazer|socorro|como funciona)\b/i,
            GREETING: /\b(oi|ola|olá|bom dia|boa tarde|boa noite|eai|opa)\b/i,
            PRICE: /\b(preço|valor|custa|quanto)\b/i,
            TRACKING: /\b(pedido|rastreio|rastrear|status|entrega|onde ta)\b/i,
            LOCATION: /\b(onde|fica|endereço|loja|local)\b/i,
            STOCK: /\b(tem|estoque|disponivel|sobrou)\b/i
        };

        // --- INTENÇÕES DO ADMIN (GESTÃO) ---
        this.adminIntents = {
            OVERVIEW: /\b(resumo|hoje|vendas|faturamento|total)\b/i,
            ALERTS: /\b(alerta|problema|erro|inconsistencia|travado|bug)\b/i,
            STOCK_LOW: /\b(acabando|baixo|estoque|repo|repor|falta)\b/i,
            PENDING: /\b(pendente|parado|fila|esperando|atrasado)\b/i
        };
    }

    // --- PROCESSADOR PRINCIPAL ---
    async process(message, userContext, currentPath) {
        const lowerMsg = message.toLowerCase();

        // 1. AJUDA CONTEXTUAL (Se o usuário pedir ajuda, respondemos baseado na tela)
        if (this.intents.HELP.test(lowerMsg)) {
            return this.getContextualHelp(currentPath, userContext);
        }

        // 2. MODO ADMIN (Se for Admin E estiver em rota administrativa)
        if (userContext && (userContext.role === 'admin' || userContext.role === 'gerente')) {
            
            // 2.1 Contexto: Tela de Pedidos (/admin/orders)
            if (currentPath && currentPath.includes('/admin/orders')) {
                if (this.adminIntents.PENDING.test(lowerMsg) || lowerMsg.includes('listar')) {
                    return await this.checkPendingOrders();
                }
            }

            // 2.2 Contexto: Tela de Produtos (/admin/products)
            if (currentPath && currentPath.includes('/admin/products')) {
                if (this.adminIntents.STOCK_LOW.test(lowerMsg)) {
                    return await this.checkLowStock();
                }
            }

            // 2.3 Comandos Gerais de Admin (Resumo, Alertas)
            // Se o admin digitar algo genérico, tentamos processar como comando admin.
            const adminResponse = await this.handleAdminGeneral(lowerMsg, userContext);
            if (adminResponse) return adminResponse;
        }

        // 3. MODO CLIENTE / LOJA (Padrão)
        
        // 3.1 Contexto: Carrinho (/cart)
        if (currentPath === '/cart') {
            if (lowerMsg.includes('cupom') || lowerMsg.includes('desconto')) {
                return "🎁 Use o cupom **SHINERAY10** para ganhar 10% de desconto agora!";
            }
            if (lowerMsg.includes('pagamento') || lowerMsg.includes('pagar') || lowerMsg.includes('cartao')) {
                return "Aceitamos **PIX** (aprovação imediata) e **Cartão de Crédito** em até 12x. O botão de finalizar está logo ali! 👇";
            }
        }

        // 3.2 Processamento Padrão (Busca de Produtos, Rastreio)
        return await this.handleClientMode(lowerMsg);
    }

    // --- FUNÇÕES DE AJUDA CONTEXTUAL ---
    getContextualHelp(path, user) {
        if (!path) return "Posso te ajudar a encontrar peças para sua Shineray. O que procura?";

        if (path.includes('/admin/orders')) return "👮‍♀️ **Gestão de Pedidos:**\nDigite 'pendentes' para ver o que precisa ser enviado ou 'resumo' para ver o total de hoje.";
        if (path.includes('/admin/products')) return "📦 **Gestão de Estoque:**\nDigite 'baixo' para ver produtos que precisam de reposição ou 'preço' para ver itens sem valor cadastrado.";
        if (path.includes('/admin/branches')) return "🏢 **Gestão de Filiais:**\nAqui você controla suas lojas físicas. Posso ajudar com relatórios por loja.";
        
        if (path === '/cart') return "🛒 **Carrinho:**\nEstou aqui para ajudar a fechar a compra. Tem dúvida sobre pagamento, cupom ou frete?";
        if (path === '/login') return "🔐 **Área Restrita:**\nInsira suas credenciais. Se esqueceu a senha, contate o suporte técnico.";
        
        return "Estou pronta para ajudar! Pode perguntar sobre preços, estoque ou rastreio.";
    }

    // --- LÓGICA DE ADMINISTRAÇÃO (COM INSIGHTS BI) ---
    async handleAdminGeneral(msg, user) {
        const adminName = user.name ? user.name.split(' ')[0] : 'Chefe';

        if (this.adminIntents.OVERVIEW.test(msg)) {
            return await this.getAdminOverview(adminName);
        }

        if (this.adminIntents.ALERTS.test(msg)) {
            return await this.checkInconsistencies();
        }

        if (this.adminIntents.STOCK_LOW.test(msg)) {
            return await this.checkLowStock();
        }

        return null; 
    }

    async getAdminOverview(name) {
        // 1. Busca vendas de hoje
        const sql = `
            SELECT 
                COUNT(*) as count, 
                SUM(total_amount) as total 
            FROM orders 
            WHERE date(created_at) = date('now')
        `;
        const stats = await new Promise(resolve => db.get(sql, [], (err, r) => resolve(r)));
        
        // 2. Busca ticket médio geral para comparação (Insight)
        const avgSql = `SELECT AVG(total_amount) as avg_ticket FROM orders`;
        const avgStats = await new Promise(resolve => db.get(avgSql, [], (err, r) => resolve(r)));

        const total = stats.total || 0;
        const count = stats.count || 0;
        const ticketMedioHoje = count > 0 ? total / count : 0;
        const ticketMedioGeral = avgStats.avg_ticket || 0;

        // 3. Gera o Insight Inteligente
        let insight = "";
        if (count === 0) {
            insight = "💡 **Sugestão:** O movimento está parado. Que tal disparar uma oferta no WhatsApp?";
        } else if (ticketMedioHoje > ticketMedioGeral) {
            insight = "🚀 **Insight:** O ticket médio de hoje está acima da média histórica. Ótimo trabalho de mix de produtos!";
        } else {
            insight = "📊 **Análise:** Volume de vendas dentro da normalidade. Fique atento aos pedidos pendentes de envio.";
        }

        return `📊 **Resumo Inteligente (${name}):**\n\n` +
               `✅ Pedidos Hoje: **${count}**\n` +
               `💰 Faturamento: **R$ ${total.toFixed(2)}**\n` +
               `📈 Ticket Médio: R$ ${ticketMedioHoje.toFixed(2)}\n\n` +
               `${insight}`;
    }

    async checkPendingOrders() {
        const sql = `SELECT id, customer_name, total_amount FROM orders WHERE status = 'Pendente' ORDER BY created_at DESC LIMIT 5`;
        const orders = await new Promise(r => db.all(sql, [], (e,row) => r(row || [])));
        
        if (orders.length === 0) return "✅ Nenhum pedido pendente! Tudo em dia.";
        
        let msg = "📋 **Últimos Pedidos Pendentes:**\n\n";
        orders.forEach(o => msg += `• **#${o.id}** - ${o.customer_name} (R$ ${o.total_amount.toFixed(2)})\n`);
        return msg;
    }

    async checkInconsistencies() {
        let report = "🕵️‍♀️ **Auditoria do Sistema:**\n\n";
        let issuesFound = 0;

        // Pedidos travados
        const stuckOrdersSql = `SELECT id FROM orders WHERE status = 'Pago' AND date(created_at) < date('now', '-3 days')`;
        const stuckOrders = await new Promise(r => db.all(stuckOrdersSql, [], (e,row) => r(row || [])));
        if (stuckOrders.length > 0) {
            issuesFound++;
            report += `🚨 **${stuckOrders.length} Pedidos Atrasados (+3 dias):** IDs ${stuckOrders.map(o=>'#'+o.id).join(', ')}\n`;
        }

        // Produtos sem preço
        const badPriceSql = `SELECT name FROM products WHERE price <= 0`;
        const badPrice = await new Promise(r => db.all(badPriceSql, [], (e,row) => r(row || [])));
        if (badPrice.length > 0) {
            issuesFound++;
            report += `⚠️ **${badPrice.length} Produtos sem Preço:** Verifique o cadastro.\n`;
        }

        if (issuesFound === 0) return "✅ Nenhuma inconsistência encontrada no sistema.";
        return report;
    }

    async checkLowStock() {
        const sql = `SELECT name, stock_quantity FROM products WHERE stock_quantity < 5 AND stock_quantity > 0 LIMIT 5`;
        const products = await new Promise(r => db.all(sql, [], (e,row) => r(row || [])));
        
        if (products.length === 0) return "Estoque saudável! Nenhum item crítico.";
        
        let msg = "📉 **Reposição Necessária:**\n\n";
        products.forEach(p => msg += `• ${p.name}: Restam **${p.stock_quantity}**\n`);
        return msg;
    }

    // --- LÓGICA DE CLIENTE (VENDEDORA) ---
    async handleClientMode(msg) {
        // Rastreio
        const orderMatch = msg.match(/#?(\d+)/);
        if ((this.intents.TRACKING.test(msg) || msg.includes('meu pedido')) && orderMatch) {
            return await this.checkOrderStatus(orderMatch[1]);
        }

        // Saudações
        if (this.intents.GREETING.test(msg)) {
            return "Olá! Sou a Sara, consultora Shineray. 🏍️\nPosso ver preços, estoque ou status de pedidos. Como ajudo?";
        }

        // Localização
        if (this.intents.LOCATION.test(msg)) {
            return "Nossa matriz fica no Centro. Enviamos para todo Brasil! 🇧🇷";
        }

        // Busca de Produtos (Core)
        const cleanQuery = msg.replace(/\b(gostaria|queria|saber|o|preço|valor|de|do|da|tem|voces|vende|quanto|custa|um|uma|para|minha|moto|shineray)\b/gi, '').trim();
        
        if (cleanQuery.length > 2) {
            return await this.searchProduct(cleanQuery);
        }

        return "Não entendi qual peça você precisa. 🔧\nTente digitar apenas o nome, ex: 'Carburador', 'Pneu' ou 'Carenagem'.";
    }

    async searchProduct(query) {
        const sql = `SELECT * FROM products WHERE name LIKE ? OR category LIKE ? OR description LIKE ? LIMIT 3`;
        const term = `%${query}%`;
        const products = await new Promise(r => db.all(sql, [term, term, term], (e,row) => r(row || [])));

        if (products.length === 0) return `Poxa, não encontrei nada sobre "${query}" no estoque agora. 😕`;

        let response = `Encontrei essas opções:\n\n`;
        products.forEach(p => {
            let stockMsg = p.stock_quantity > 0 ? `✅ Estoque: ${p.stock_quantity}` : `❌ Indisponível`;
            response += `🔧 **${p.name}**\n💰 R$ ${p.price.toFixed(2)}\n${stockMsg}\n\n`;
        });
        return response + "Posso separar algum para você?";
    }

    async checkOrderStatus(orderId) {
        const sql = `SELECT status, total_amount, created_at, customer_name FROM orders WHERE id = ?`;
        const order = await new Promise(r => db.get(sql, [orderId], (e,row) => r(row)));

        if (!order) return `Não achei o pedido #${orderId}. Confere o número? 🤔`;

        const date = new Date(order.created_at).toLocaleDateString('pt-BR');
        return `📦 **Pedido #${orderId}**\n📅 Data: ${date}\n📍 Status: **${order.status}**\n💰 Valor: R$ ${order.total_amount.toFixed(2)}`;
    }
}

module.exports = new SaraBrain();