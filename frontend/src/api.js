// src/api.js

// Define a URL direta para evitar erro de process.env no Vite
const API_URL = 'http://localhost:5000/api';

// Função auxiliar central para chamadas fetch com autenticação
const authFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('shineray_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });
    
    if (response.status === 204) {
        return null; // Sem conteúdo
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `Erro ${response.status}: Falha na requisição`);
    }
    
    return response.json();
  } catch (error) {
    console.error("Erro na API:", error);
    throw error;
  }
};

// --- AUTH ---
export const login = (username, password) => authFetch('/auth/login', {
  method: 'POST',
  body: JSON.stringify({ username, password }),
});

// --- DASHBOARD & ESTATÍSTICAS ---
export const getAdminStats = (range = 'week') => authFetch(`/admin/stats?range=${range}`);
export const getSalesByBranch = (range = 'week') => authFetch(`/admin/sales-by-branch?range=${range}`);
export const getTopProducts = (range = 'week') => authFetch(`/admin/top-products?range=${range}`);

// --- PRODUTOS ---
export const getProducts = () => authFetch('/products');
export const getProductById = (id) => authFetch(`/products/${id}`);

export const createProduct = (product) => authFetch('/products', {
  method: 'POST',
  body: JSON.stringify(product),
});

export const updateProduct = (id, product) => authFetch(`/products/${id}`, {
  method: 'PUT',
  body: JSON.stringify(product),
});

export const deleteProduct = (id) => authFetch(`/products/${id}`, {
  method: 'DELETE',
});

export const updateProductStock = (productId, branchId, quantity) => authFetch('/products/stock', {
  method: 'POST',
  body: JSON.stringify({ productId, branchId, quantity }),
});

// Funções Placeholder para CSV e Importação
export const importProductsCSV = (file) => Promise.resolve(); 
export const exportProductsCSV = () => Promise.resolve();

// --- PEDIDOS ---
export const getOrders = () => authFetch('/orders');

export const createOrder = (order) => authFetch('/orders', {
  method: 'POST',
  body: JSON.stringify(order),
});

export const updateOrderStatus = (id, status) => authFetch(`/orders/${id}/status`, {
  method: 'PUT',
  body: JSON.stringify({ status }),
});

export const deleteOrder = (id) => authFetch(`/orders/${id}`, {
  method: 'DELETE',
});

// CORREÇÃO: Adicionadas as funções que faltavam para evitar o erro no Orders.jsx
export const filterOrdersByBranch = (branchId) => authFetch(`/orders?branch_id=${branchId}`);
export const exportOrdersToCSV = (orders) => {
    console.log("Exportando CSV", orders);
    return Promise.resolve();
};

// --- FILIAIS (BRANCHES) ---
export const getBranches = () => authFetch('/branches');

export const createBranch = (data) => authFetch('/branches', {
  method: 'POST',
  body: JSON.stringify(data),
});

export const updateBranch = (id, data) => authFetch(`/branches/${id}`, {
  method: 'PUT',
  body: JSON.stringify(data),
});

export const deleteBranch = (id) => authFetch(`/branches/${id}`, {
  method: 'DELETE',
});

export const getBranchStats = (id) => authFetch(`/branches/${id}/stats`);

// --- CONFIGURAÇÕES (SETTINGS) ---
export const getSettings = () => authFetch('/settings');
export const saveSettings = (data) => authFetch('/settings', {
  method: 'POST',
  body: JSON.stringify(data),
});

export const getPaymentMethods = () => authFetch('/payment-methods');
export const getShippingMethods = () => authFetch('/shipping-methods');

// --- USUÁRIOS (TEAM) ---
export const getUsers = () => authFetch('/users');

export const createUser = (data) => authFetch('/users', {
  method: 'POST',
  body: JSON.stringify(data),
});

export const deleteUser = (id) => authFetch(`/users/${id}`, {
  method: 'DELETE',
});