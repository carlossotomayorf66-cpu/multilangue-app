const API_URL = '/api';

async function apiRequest(endpoint, method = 'GET', body = null) {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const config = { method, headers };
    if (body) config.body = JSON.stringify(body);

    const response = await fetch(`${API_URL}${endpoint}`, config);

    // Intentar as text primero para debuggear si falla el json
    const text = await response.text();
    let data;
    try {
        data = JSON.parse(text);
    } catch (e) {
        console.error('Server Error (Not JSON):', text);
        throw new Error('Error del servidor: Respuesta no válida');
    }

    if (!response.ok && response.status === 401) {
        logout();
        throw new Error('Sesión expirada');
    }

    if (!data.success) {
        throw new Error(data.message || 'Error en la petición');
    }

    return data;
}

function notify(msg, type = 'success') {
    const div = document.createElement('div');
    div.style.background = type === 'success' ? '#10b981' : '#ef4444';
    div.style.padding = '1rem';
    div.style.marginBottom = '0.5rem';
    div.style.borderRadius = '0.5rem';
    div.style.color = 'white';
    div.innerText = msg;
    document.getElementById('notification-area').appendChild(div);
    setTimeout(() => div.remove(), 3000);
}
