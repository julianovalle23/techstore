'use strict';

const $ = s => document.querySelector(s);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
}[c]));

const money = v => new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
}).format(Number(v || 0));

const date = v => v ? new Date(v).toLocaleString('es-CO') : '—';
const path = v => encodeURIComponent(v);

const state = {
    token: sessionStorage.getItem('techstore.token'),
    base: localStorage.getItem('techstore.base') || 'http://localhost:8050',
    me: null,
    view: 'home',
    page: 0,
    rows: [],
    cache: {},
    busy: false
};

const sections = {
    home: { title: 'Inicio', icon: '⌂' },
    categorias: { title: 'Categorías', icon: '🗂', prefix: 'CATEGORIA', endpoint: '/api/categorias' },
    articulos: { title: 'Artículos', icon: '💻', prefix: 'ARTICULO', endpoint: '/api/articulos' },
    pedidos: { title: 'Pedidos', icon: '🧾', prefix: 'PEDIDO', endpoint: '/api/pedidos' },
    users: { title: 'Usuarios', icon: '♧' },
    roles: { title: 'Roles', icon: '◈' },
    permissions: { title: 'Permisos', icon: '⚿' }
};

const can = p => state.me?.effectivePermissions?.includes(p);
const any = ps => ps.some(can);

function visible(view) {
    if (view === 'home') return true;
    if (view === 'users') {
        return any(['USER_READ', 'USER_CREATE', 'USER_UPDATE', 'USER_DELETE', 'ROLE_ASSIGN', 'PERMISSION_ASSIGN']);
    }
    if (view === 'roles') return can('ROLE_MANAGE');
    if (view === 'permissions') return can('PERMISSION_MANAGE');

    const p = sections[view].prefix;
    return any([p + '_READ', p + '_CREATE', p + '_UPDATE', p + '_DELETE', p + '_CANCEL']);
}

function toast(message, bad = false) {
    $('#toast').textContent = message;
    $('#toast').className = 'visible' + (bad ? ' bad' : '');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => {
        $('#toast').className = '';
    }, 5500);
}

function logout() {
    state.token = null;
    state.me = null;
    state.cache = {};
    sessionStorage.removeItem('techstore.token');
    $('#app').hidden = true;
    $('#login-screen').hidden = false;
    if ($('#modal').open) $('#modal').close();
    $('#login-form').password.value = '';
}

async function api(url, { method = 'GET', body, auth = true } = {}) {
    const headers = { Accept: 'application/json, text/plain' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (auth && state.token) headers.Authorization = 'Bearer ' + state.token;

    let response;
    try {
        response = await fetch(state.base + url, {
            method,
            headers,
            body: body === undefined ? undefined : JSON.stringify(body)
        });
    } catch {
        throw new Error('No se pudo conectar con el servidor. Revisa la URL, Spring Boot y PostgreSQL.');
    }

    const text = await response.text();
    let data = text;
    try {
        data = text ? JSON.parse(text) : null;
    } catch {}

    if (!response.ok) {
        if (auth && (response.status === 401 || (response.status === 403 && url === '/api/auth/me'))) {
            logout();
        }
        let error = typeof data === 'string'
            ? data
            : (data?.detail || data?.message || Object.entries(data || {})
                .filter(([k]) => !['timestamp', 'status', 'error', 'path'].includes(k))
                .map(([k, v]) => k + ': ' + v)
                .join('\n'));

        if (response.status === 403) {
            error = 'Tu cuenta no tiene permiso para esta operación, o la sesión ya no está disponible.';
        }
        throw new Error(error || `La operación no se completó (${response.status}).`);
    }

    return data;
}

async function refreshMe() {
    state.me = await api('/api/auth/me');
    $('#session-name').textContent = state.me.username;
    $('#session-role').textContent = state.me.role || 'Sin rol';
    $('#avatar').textContent = state.me.username.slice(0, 2).toUpperCase();
    $('#server-label').textContent = state.base;
    $('#navigation').innerHTML = Object.entries(sections)
        .filter(([k]) => visible(k))
        .map(([k, v]) => `
            <button data-nav="${k}" class="${state.view === k ? 'active' : ''}">
                <span class="nav-icon">${v.icon}</span>${v.title}
            </button>
        `).join('');
}

async function enter() {
    await refreshMe();
    $('#login-screen').hidden = true;
    $('#app').hidden = false;
    await navigate('home');
}

$('#login-form').base.value = state.base;

$('#login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.currentTarget;
    const b = f.querySelector('button[type=submit]');
    b.disabled = true;
    $('#login-error').textContent = '';

    try {
        const base = f.base.value.trim().replace(/\/+$/, '');
        const u = new URL(base);
        if (!['http:', 'https:'].includes(u.protocol)) {
            throw new Error('Utiliza una URL HTTP o HTTPS.');
        }

        state.base = base;
        localStorage.setItem('techstore.base', base);
        state.token = await api('/api/auth/login', {
            method: 'POST',
            auth: false,
            body: {
                username: f.username.value.trim(),
                password: f.password.value
            }
        });
        sessionStorage.setItem('techstore.token', state.token);
        await enter();
        f.password.value = '';
    } catch (error) {
        logout();
        $('#login-error').textContent = error.message;
    } finally {
        b.disabled = false;
    }
});

$('#logout').onclick = logout;
$('#menu-toggle').onclick = () => $('#sidebar').classList.toggle('open');
$('#navigation').onclick = e => {
    const b = e.target.closest('[data-nav]');
    if (b) navigate(b.dataset.nav);
};

function heading(title, subtitle, actions = '') {
    return `
        <div class="page-heading">
            <div>
                <span class="eyebrow">ESPACIO DE TRABAJO</span>
                <h1>${esc(title)}</h1>
                <p>${esc(subtitle)}</p>
            </div>
            <div class="toolbar">${actions}</div>
        </div>
    `;
}

function button(action, label, data = '', className = 'primary') {
    return `<button type="button" class="${className}" data-action="${action}" ${data}>${label}</button>`;
}

function badge(active) {
    return `<span class="badge ${active ? '' : 'off'}">${active ? 'Activo' : 'Inactivo'}</span>`;
}

function chips(values) {
    return `
        <div class="chips">
            ${(values || []).map(v => `<span class="chip">${esc(v)}</span>`).join('') || '<span class="muted">Sin permisos</span>'}
        </div>
    `;
}

async function navigate(view, page = 0) {
    if (!visible(view)) view = 'home';
    state.view = view;
    state.page = page;
    $('#sidebar').classList.remove('open');
    $('#crumb').textContent = sections[view].title;
    $('#navigation').querySelectorAll('button').forEach(b => {
        b.classList.toggle('active', b.dataset.nav === view);
    });

    $('#content').innerHTML = '<div class="empty">Cargando tu espacio…</div>';

    try {
        await render();
    } catch (error) {
        $('#content').innerHTML = heading(sections[view].title, 'No se pudo cargar la información') + `
            <div class="panel empty">
                ${esc(error.message)}<br><br>
                ${button('reload', 'Reintentar')}
            </div>
        `;
    }
}

async function render() {
    if (state.view === 'home') return dashboard();

    const view = state.view;
    const conf = sections[view];
    let actions = button('reload', '↻ Actualizar', '', 'secondary');
    let rows = [];
    let read = false;

    if (['categorias', 'articulos', 'pedidos'].includes(view)) {
        read = can(conf.prefix + '_READ');

        if (can(conf.prefix + '_CREATE')) {
            actions = button('create', '+ ' + (view === 'pedidos' ? 'Nuevo pedido' : view === 'articulos' ? 'Nuevo artículo' : 'Nueva categoría')) + actions;
        }
        if (!read && view !== 'pedidos' && can(conf.prefix + '_UPDATE')) {
            actions += button('edit-business-id', 'Editar por ID', '', 'secondary');
        }
        if (!read && view !== 'pedidos' && can(conf.prefix + '_DELETE')) {
            actions += button('deactivate-business-id', 'Eliminar por ID', '', 'secondary');
        }
        if (!read && view === 'pedidos' && can('PEDIDO_STATUS')) {
            actions += button('estado-pedido-id', 'Cambiar estado por ID', '', 'secondary');
        }

        if (read) {
            // La API TechStore devuelve lista simple (sin paginas)
            const result = await api(conf.endpoint);
            rows = Array.isArray(result) ? result : (result.content || []);
            state.total = rows.length;
            state.pages = 1;
        }
    } else if (view === 'users') {
        read = can('USER_READ');

        if (can('USER_CREATE')) actions = button('create', '＋ Nuevo usuario') + actions;
        if (can('ROLE_ASSIGN')) actions += button('user-role', 'Asignar rol', '', 'secondary');
        if (can('PERMISSION_ASSIGN')) {
            actions += button('user-permission', 'Dar permiso', '', 'secondary') + button('revoke-permission-id', 'Retirar permiso', '', 'secondary');
        }
        if (!read && can('USER_UPDATE')) actions += button('edit-named', 'Actualizar cuenta', '', 'secondary');
        if (!read && can('USER_DELETE')) actions += button('delete-named', 'Eliminar cuenta', '', 'secondary');

        if (read) rows = await api('/api/user/all');
    } else if (view === 'roles') {
        read = true;
        rows = await api('/api/roles');
        actions = button('create', '＋ Nuevo rol') + actions;
    } else {
        read = true;
        rows = (await api('/api/permissions')).map(name => ({ name }));
        actions = button('create', '＋ Nuevo permiso') + actions;
    }

    state.rows = rows;

    // Marca visual de stock bajo (solo ADMIN con permiso)
    if (view === 'articulos' && can('ARTICULO_STOCK')) {
        try { state.cache.bajo = (await api('/api/articulos/stock-bajo')).map(a => a.id); }
        catch { state.cache.bajo = []; }
    } else { state.cache.bajo = []; }

    const intro = {
        categorias: 'Agrupa tus artículos por tipo.',
        articulos: 'Tu catálogo, precios y existencias al día.',
        pedidos: 'Cada pedido, con su estado e historial.',
        users: 'Cuentas, estados y accesos de tu equipo.',
        roles: 'Un rol por usuario. Capacidades compartidas por equipo.',
        permissions: 'El catálogo de capacidades de tu aplicación.'
    };

    $('#content').innerHTML = heading(conf.title, intro[view], actions) + (
        !read
            ? '<div class="panel empty">Puedes realizar las acciones habilitadas arriba. Tu cuenta no tiene permiso para consultar este listado.</div>'
            : table(view, rows)
    );
}

function table(view, rows) {
    let headers;
    let cells;
    const action = (name, label, i, cls = 'link-button') => button(name, label, `data-index="${i}"`, cls);

    if (view === 'categorias') {
        headers = ['Categoría', 'Descripción', 'Estado', 'Acciones'];
        cells = (r, i) => [
            `<span class="cell-title">${esc(r.nombre)}</span><small class="cell-sub">Categoría #${r.id}</small>`,
            `${esc(r.descripcion || '—')}`,
            `<span class="badge ${r.estado === 'activa' ? '' : 'off'}">${esc(r.estado)}</span>`,
            (can('CATEGORIA_UPDATE') ? action('edit', 'Editar', i) : '') +
            (can('CATEGORIA_DELETE') ? action('deactivate', 'Eliminar', i) : '')
        ];
    }
    if (view === 'articulos') {
        headers = ['Artículo', 'Precio', 'Existencias', 'Categoría', 'Acciones'];
        cells = (r, i) => [
            `<span class="cell-title">${esc(r.nombre)}</span><small class="cell-sub">${esc(r.codigo)} · ${esc(r.marca || '')} ${esc(r.modelo || '')}</small>`,
            money(r.precioUnitario),
            (state.cache.bajo || []).includes(r.id)
                ? `${r.stockActual} <span class="badge off">Stock bajo</span>`
                : r.stockActual,
            esc(r.categoriaNombre || ''),
            (can('ARTICULO_UPDATE') ? action('edit', 'Editar', i) : '') +
            (can('ARTICULO_DELETE') ? action('deactivate', 'Eliminar', i) : '')
        ];
    }
    if (view === 'pedidos') {
        headers = ['Pedido', 'Comprador', 'Fecha', 'Total', 'Estado', 'Acciones'];
        cells = (r, i) => [
            `<span class="cell-title">#${r.id}</span><small class="cell-sub">${esc(r.articuloNombre)} × ${r.cantidad}</small>`,
            esc(r.compradorNombre),
            date(r.fecha),
            money(r.total),
            `<span class="badge ${r.estado === 'CANCELADO' ? 'off' : ''}">${esc(r.estado)}</span>`,
            action('pedido-detail', 'Ver detalle', i) +
            (r.estado !== 'CANCELADO' && can('PEDIDO_STATUS') ? action('cancel-pedido', 'Cancelar', i) : '')
        ];
    }
    if (view === 'users') {
        headers = ['Usuario', 'Rol', 'Estado', 'Acciones'];
        cells = (r, i) => [
            `<span class="cell-title">${esc(r.username)}</span><small class="cell-sub">${esc(r.email)}</small>`,
            `<span class="badge">${esc(r.role || 'Sin rol')}</span>`,
            `<span class="badge ${r.locked || r.disabled ? 'off' : ''}">${r.disabled ? 'Deshabilitado' : r.locked ? 'Bloqueado' : 'Habilitado'}</span>`,
            (can('USER_UPDATE') ? action('edit', 'Editar', i) : '') +
            action('user-detail', 'Permisos', i) +
            (can('ROLE_ASSIGN') ? action('user-role', 'Rol', i) : '') +
            (can('PERMISSION_ASSIGN') ? action('user-permission', '＋ Permiso', i) : '') +
            (can('USER_DELETE') ? action('delete-user', 'Eliminar', i) : '')
        ];
    }
    if (view === 'roles') {
        headers = ['Rol', 'Permisos heredados', 'Acciones'];
        cells = (r, i) => [
            `<span class="cell-title">${esc(r.name)}</span>`,
            chips(r.permissions),
            can('PERMISSION_MANAGE') ? action('role-permission', 'Gestionar permisos', i) : '—'
        ];
    }
    if (view === 'permissions') {
        headers = ['Permiso', 'Tipo'];
        cells = r => [
            `<span class="cell-title">${esc(r.name)}</span>`,
            'Capacidad disponible para roles y usuarios'
        ];
    }

    const paging = [].includes(view);

    return `
        <section class="panel">
            <div class="panel-title">
                <h3>${esc(sections[view].title)} <span class="muted">· ${paging ? state.total : rows.length}</span></h3>
                <div class="toolbar">
                    <input id="filter" aria-label="Buscar en los resultados visibles" placeholder="Buscar en esta página…">
                </div>
            </div>
            <div class="table-wrap">
                <table>
                    <thead>
                        <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
                    </thead>
                    <tbody>
                        ${rows.map((r, i) => `
                            <tr>
                                ${cells(r, i).map((v, k) => `
                                    <td ${k === headers.length - 1 ? 'class="actions"' : ''}>${v}</td>
                                `).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div id="empty-table" class="empty" ${rows.length ? 'hidden' : ''}>
                    Aún no hay registros. Empieza con una nueva creación.
                </div>
            </div>
            ${paging ? `
                <div class="pagination">
                    <span>Página ${state.page + 1} de ${Math.max(state.pages, 1)} ·${state.total} registros</span>
                    <div>
                        <button data-action="previous" ${state.page === 0 ? 'disabled' : ''}>← Anterior</button>
                        <button data-action="next" ${state.page + 1 >= state.pages ? 'disabled' : ''}>Siguiente →</button>
                    </div>
                </div>
            ` : ''}
        </section>
    `;
}

async function dashboard() {
    const first = state.me.username;
    const metrics = await Promise.all(['categorias', 'articulos', 'pedidos'].map(async key => ({
        key,
        total: can(sections[key].prefix + '_READ')
            ? (await api(sections[key].endpoint)).length
            : null
    })));

    const links = Object.entries(sections).filter(([key]) => key !== 'home' && visible(key));

    $('#content').innerHTML = heading(
        `Hola, ${first}.`,
        'Tu operación, de un vistazo.',
        `<span class="date-label">${esc(new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }))}</span>`
    ) + `
        <div class="hero">
            <div>
                <span class="eyebrow">UN ESPACIO PARA TU EQUIPO</span>
                <h2>La gestión empieza con una buena conexión.</h2>
                <p>Consulta tus módulos, registra una operación o administra los accesos. Todo desde tu espacio de trabajo.</p>
            </div>
            <span class="hero-mark">◈</span>
        </div>
        <div class="cards">
            ${metrics.map(({ key, total }) => `
                <div class="card">
                    <span class="card-icon">${sections[key].icon}</span>
                    <div>
                        <h3>${sections[key].title}</h3>
                        <p>${total === null ? 'Sin acceso al listado' : 'Registros en tu espacio'}</p>
                    </div>
                    <div class="metric">${total ?? '—'}</div>
                    ${visible(key) ? button('go', 'Abrir módulo →', `data-view="${key}"`, 'link-button') : ''}
                </div>
            `).join('')}
        </div>
        <section class="panel">
            <div class="panel-title">
                <h3>Accesos rápidos</h3>
                <span class="badge">${esc(state.me.role)}</span>
            </div>
            <div class="quick-links">
                ${links.map(([key, v]) => `
                    <button class="quick-link" data-action="go" data-view="${key}">
                        <span>${v.icon} &nbsp; ${v.title}<small>Ir a${v.title.toLowerCase()}</small></span>
                        <span>→</span>
                    </button>
                `).join('') || '<div class="empty">Tu cuenta todavía no tiene permisos para estos módulos.</div>'}
            </div>
        </section>
    `;
}

let modalSubmit = null;

function modal(title, body, onSubmit, label = 'Guardar') {
    const f = $('#modal-form');
    f.reset();
    $('#modal-title').textContent = title;
    $('#modal-body').innerHTML = body;
    $('#modal-error').textContent = '';
    $('#modal-save').textContent = label;
    $('#modal-save').hidden = !onSubmit;
    $('#modal-cancel').textContent = onSubmit ? 'Cancelar' : 'Cerrar';
    modalSubmit = onSubmit;
    if (!$('#modal').open) $('#modal').showModal();
}

$('#modal-close').onclick = $('#modal-cancel').onclick = () => $('#modal').close();

$('#modal').addEventListener('click', e => {
    if (e.target === $('#modal')) {
        const rect = e.target.getBoundingClientRect();
        if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
            e.target.close();
        }
    }
});

$('#modal-form').onsubmit = async e => {
    e.preventDefault();
    if (!modalSubmit) return;

    const submit = modalSubmit;
    const b = $('#modal-save');
    b.disabled = true;
    $('#modal-error').textContent = '';

    try {
        await submit(new FormData(e.currentTarget));
        $('#modal').close();
        state.cache = {};
        await refreshMe();
        await navigate(state.view, state.page);
        toast('Cambios guardados correctamente.');
    } catch (error) {
        $('#modal-error').textContent = error.message;
    } finally {
        b.disabled = false;
    }
};

const field = (label, name, value = '', type = 'text', extra = '') => `
    <label>
        ${label}
        <input name="${name}" type="${type}" value="${esc(value)}" ${extra}>
    </label>
`;

function check(label, name, checked) {
    return `
        <label class="check-label">
            <input type="checkbox" name="${name}" ${checked ? 'checked' : ''}>
            ${label}
        </label>
    `;
}

async function options(url) {
    return await api(url);
}

async function picker(name, label, kind, current = '') {
    let values = [];
    if (kind === 'role' && can('ROLE_MANAGE')) {
        values = (await options('/api/roles')).map(r => r.name);
    }
    if (kind === 'permission' && can('PERMISSION_MANAGE')) {
        values = await options('/api/permissions');
    } else if (kind === 'permission' && can('PERMISSION_ASSIGN')) {
        values = await options('/api/user/permissions');
    }

    if (values.length) {
        return `
            <label>
                ${label}
                <select name="${name}" required>
                    ${values.map(v => `<option ${v === current ? 'selected' : ''} value="${esc(v)}">${esc(v)}</option>`).join('')}
                </select>
            </label>
        `;
    }

    return field(label, name, current || (kind === 'role' ? 'CUSTOMER' : ''), 'text', 'required maxlength="50"');
}

async function entityForm(row, askId = false) {
    const view = state.view;
    const edit = !!row;
    row = row || {};
    let body = '';

    if (view === 'categorias') {
        body = field('Nombre', 'nombre', row.nombre, 'text', 'required maxlength="100"') +
            field('Descripción', 'descripcion', row.descripcion, 'text', 'maxlength="255"') + `
            <label>
                Estado
                <select name="estado" required>
                    <option value="activa" ${row.estado !== 'inactiva' ? 'selected' : ''}>activa</option>
                    <option value="inactiva" ${row.estado === 'inactiva' ? 'selected' : ''}>inactiva</option>
                </select>
            </label>
        `;
    }

    if (view === 'articulos') {
        const cats = can('CATEGORIA_READ') ? await api('/api/categorias') : [];
        body = field('Código SKU', 'codigo', row.codigo, 'text', 'required maxlength="50"') +
            field('Nombre', 'nombre', row.nombre, 'text', 'required maxlength="150"') + `
            <div class="fields">
                ${field('Marca', 'marca', row.marca, 'text', 'maxlength="100"')}
                ${field('Modelo', 'modelo', row.modelo, 'text', 'maxlength="100"')}
            </div>
            ${field('Especificaciones', 'especificaciones', row.especificaciones, 'text')} `
            + `
            <div class="fields">
                ${field('Precio', 'precioUnitario', row.precioUnitario ?? '', 'number', 'required min="0.01" step="0.01"')}
                ${field('Stock actual', 'stockActual', row.stockActual ?? 0, 'number', 'required min="0" step="1"')}
            </div>
            <div class="fields">
                ${field('Stock mínimo', 'stockMinimo', row.stockMinimo ?? 5, 'number', 'required min="0" step="1"')}
            </div>
            ` + (cats.length ? `
            <label>
                Categoría
                <select name="categoriaId" required>
                    ${cats.map(c => `<option value="${c.id}" ${c.id === row.categoriaId ? 'selected' : ''}>${esc(c.nombre)}</option>`).join('')}
                </select>
            </label>` : field('ID de categoría', 'categoriaId', row.categoriaId, 'number', 'required min="1" step="1"'));
    }

    if (view === 'users') {
        body = field('Usuario', 'username', row.username, 'text', `required maxlength="50" ${edit ? 'readonly' : ''}`) +
            field('Correo', 'email', row.email, 'email', 'required maxlength="200"') +
            field(edit ? 'Nueva contraseña (opcional)' : 'Contraseña', 'password', '', 'password', `${edit ? '' : 'required'} autocomplete="new-password"`) + `
            <div class="fields">
                ${check('Cuenta bloqueada', 'locked', row.locked)}
                ${check('Cuenta deshabilitada', 'disabled', row.disabled)}
            </div>
        `;

        if (!edit && can('ROLE_ASSIGN')) {
            body += await picker('role', 'Rol de la cuenta', 'role');
        }
        body += '<p class="note">Los permisos adicionales se gestionan desde la acción «Dar permiso». Editar datos no cambia el rol.</p>';
    }

    if (view === 'roles') {
        body = field('Nombre del rol', 'name', '', 'text', 'required maxlength="50" pattern="[A-Za-z][A-Za-z0-9_]{0,49}"');
        if (can('PERMISSION_MANAGE')) {
            body += `
                <label>Permisos iniciales</label>
                <div class="checks">
                    ${(await api('/api/permissions')).map(v => `
                        <label>
                            <input type="checkbox" name="permissions" value="${esc(v)}">
                            ${esc(v)}
                        </label>
                    `).join('')}
                </div>
            `;
        }
        body += '<p class="note">El rol puede comenzar sin permisos. Después podrás asignarlo a un usuario.</p>';
    }

    if (view === 'permissions') {
        body = field('Nombre del permiso', 'name', '', 'text', 'required maxlength="50" pattern="[A-Za-z][A-Za-z0-9_]{0,49}"') +
            '<p class="note">Crear un permiso lo registra en el catálogo. La operación correspondiente debe comprobarlo en el servidor.</p>';
    }

    if (askId) {
        body = field('Identificador del registro', 'recordId', '', 'number', 'required min="1" step="1"') + body;
    }

    modal((edit ? 'Editar ' : 'Nuevo ') + ({
        categorias: 'categoría',
        articulos: 'artículo',
        users: 'usuario',
        roles: 'rol',
        permissions: 'permiso'
    }[view]), body, async f => {
        let data = Object.fromEntries(f);
        const recordId = askId ? data.recordId : row.id;
        delete data.recordId;

        if (view === 'articulos') {
            data.precioUnitario = Number(data.precioUnitario);
            data.stockActual = Number(data.stockActual);
            data.stockMinimo = Number(data.stockMinimo);
            data.categoriaId = Number(data.categoriaId);
        }
        if (view === 'users') {
            data.locked = f.has('locked');
            data.disabled = f.has('disabled');
            if (edit && !data.password) delete data.password;
        }
        if (view === 'roles' && can('PERMISSION_MANAGE')) {
            data.permissions = f.getAll('permissions');
        }

        const url = view === 'users'
            ? (edit ? '/api/user/update' : '/api/user/add')
            : view === 'roles'
                ? '/api/roles'
                : view === 'permissions'
                    ? '/api/permissions'
                    : sections[view].endpoint + (edit ? '/' + recordId : '');

        await api(url, { method: edit ? 'PUT' : 'POST', body: data });
    });
}

function confirmAction(title, message, run) {
    modal(title, `<p>${esc(message)}</p>`, run, 'Confirmar');
}

async function userRole(row) {
    modal(
        'Asignar rol',
        field('Usuario', 'username', row?.username || '', 'text', 'required') +
        await picker('role', 'Rol único', 'role', row?.role) +
        '<p class="note">Reemplaza el rol actual y conserva los permisos individuales.</p>',
        f => api('/api/user/assignRole', { method: 'POST', body: Object.fromEntries(f) })
    );
}

async function userPermission(row) {
    modal(
        'Dar permiso individual',
        field('Usuario', 'username', row?.username || '', 'text', 'required') +
        await picker('permission', 'Permiso adicional', 'permission') +
        '<p class="note">Se suma a los permisos del rol sin cambiarlo.</p>',
        f => api('/api/user/assignPermission', { method: 'POST', body: Object.fromEntries(f) })
    );
}

async function userDetails(row) {
    const d = await api(`/api/user/${path(row.username)}/permissions`);
    modal(
        'Permisos de ' + d.username,
        `
            <p class="note">Rol: <b>${esc(d.role)}</b></p>
            <div class="permission-group">
                <h3>Heredados del rol</h3>
                ${chips(d.rolePermissions)}
            </div>
            <div class="permission-group">
                <h3>Permisos individuales</h3>
                ${(d.additionalPermissions || []).map(p => `
                    <div class="info-row">
                        <span>${esc(p)}</span>${can('PERMISSION_ASSIGN') ? button('revoke-user-permission', 'Retirar', `data-username="${esc(d.username)}" data-permission="${esc(p)}"`, 'link-button') : ''}
                    </div>
                `).join('') || '<small>No tiene permisos adicionales.</small>'}
            </div>
            <div class="permission-group">
                <h3>Acceso efectivo</h3>
                ${chips(d.effectivePermissions)}
            </div>
        `,
        null
    );
}

async function rolePermissions(row) {
    const p = await picker('permission', 'Permiso', 'permission');
    modal(
        'Permisos de ' + row.name,
        `
            <p class="note">Estos permisos se aplican a todos los usuarios con el rol ${esc(row.name)}.</p>
            ${p}
            <label>
                Operación
                <select name="operation">
                    <option value="PUT">Agregar al rol</option>
                    <option value="DELETE">Retirar del rol</option>
                </select>
            </label>
            <div class="permission-group">
                <h3>Permisos actuales</h3>
                ${chips(row.permissions)}
            </div>
        `,
        f => api(`/api/roles/${path(row.name)}/permissions/${path(f.get('permission'))}`, { method: f.get('operation') })
    );
}

async function pedidoForm() {
    // Articulos para elegir (si hay permiso de lectura)
    const articulos = can('ARTICULO_READ') ? await api('/api/articulos') : [];

    const articulo = articulos.length
        ? `
            <label>
                Artículo
                <select name="articuloId" required>
                    <option value="">Selecciona un artículo</option>
                    ${articulos.map(a => `<option value="${a.id}">${esc(a.nombre)} · $${money(a.precioUnitario)} · stock ${a.stockActual}</option>`).join('')}
                </select>
            </label>
        `
        : field('Identificador del artículo', 'articuloId', '', 'number', 'required min="1" step="1"');

    modal(
        'Nuevo pedido',
        field('Comprador *', 'compradorNombre', '', 'text', 'required maxlength="150"') + `
            <div class="fields">
                ${field('Documento', 'compradorDocumento', '', 'text', 'maxlength="50"')}
                ${field('Teléfono', 'compradorTelefono', '', 'tel', 'maxlength="50"')}
            </div>
            ${field('Correo', 'compradorCorreo', '', 'email', 'maxlength="150"')}
            <label>
                Método de pago
                <select name="metodoPago" required>
                    <option value="efectivo">efectivo</option>
                    <option value="tarjeta">tarjeta</option>
                    <option value="transferencia">transferencia</option>
                </select>
            </label>` +
        articulo +
        field('Cantidad *', 'cantidad', '1', 'number', 'required min="1" step="1"') +
        '<p class="note">El servidor copia el precio, calcula el total y descuenta el stock.</p>' +
        '<div class="totals"><span>Total estimado</span><b id="pedido-total">—</b></div>',
        async f => {
            await api('/api/pedidos', {
                method: 'POST',
                body: {
                    compradorNombre: f.get('compradorNombre'),
                    compradorDocumento: f.get('compradorDocumento') || null,
                    compradorCorreo: f.get('compradorCorreo') || null,
                    compradorTelefono: f.get('compradorTelefono') || null,
                    articuloId: Number(f.get('articuloId')),
                    cantidad: Number(f.get('cantidad')),
                    metodoPago: f.get('metodoPago')
                }
            });
        },
        'Registrar pedido'
    );

    state.cache.pedidoArticulos = articulos;
    pedidoEstimate();
}

function pedidoEstimate() {
    if (!$('#pedido-total')) return;
    const id = Number(document.querySelector('#modal-body [name=articuloId]')?.value);
    const cant = Number(document.querySelector('#modal-body [name=cantidad]')?.value);
    const a = (state.cache.pedidoArticulos || []).find(a => a.id === id);
    $('#pedido-total').textContent = (!a || !cant) ? 'Por calcular' : money(Number(a.precioUnitario) * cant);
}

async function pedidoDetails(row) {
    const d = await api('/api/pedidos/' + row.id);
    modal(
        'Pedido #' + d.id,
        `
            <div class="info-row"><span>Comprador</span><b>${esc(d.compradorNombre)}</b></div>
            <div class="info-row"><span>Documento</span><b>${esc(d.compradorDocumento || '—')}</b></div>
            <div class="info-row"><span>Contacto</span><b>${esc(d.compradorCorreo || '')} ${esc(d.compradorTelefono || '')}</b></div>
            <div class="info-row"><span>Artículo</span><b>${esc(d.articuloNombre)} × ${d.cantidad}</b></div>
            <div class="info-row"><span>Precio unitario</span><b>${money(d.precioUnitario)}</b></div>
            <div class="info-row"><span>Fecha</span><b>${esc(date(d.fecha))}</b></div>
            <div class="info-row"><span>Pago</span><b>${esc(d.metodoPago)}</b></div>
            <div class="info-row"><span>Estado</span><b>${esc(d.estado)}</b></div>
            <div class="totals">
                <span>Total registrado</span><b>${money(d.total)}</b>
            </div>
        `,
        null
    );
}

async function handle(action, element) {
    const row = state.rows[Number(element.dataset.index)];

    switch (action) {
        case 'go':
            return navigate(element.dataset.view);

        case 'reload':
            await refreshMe();
            return navigate(state.view, state.page);

        case 'previous':
            return navigate(state.view, state.page - 1);

        case 'next':
            return navigate(state.view, state.page + 1);

        case 'create':
            return state.view === 'pedidos' ? pedidoForm() : entityForm();

        case 'edit':
            return entityForm(row);

        case 'edit-business-id':
            return entityForm({}, true);

        case 'deactivate-business-id':
            modal(
                'Eliminar registro',
                field('Identificador', 'id', '', 'number', 'required min="1" step="1"') +
                '<p class="note">Se eliminará permanentemente. Una categoría con artículos no se puede borrar.</p>',
                f => api(sections[state.view].endpoint + '/' + path(f.get('id')), { method: 'DELETE' }),
                'Eliminar'
            );
            return;

        case 'estado-pedido-id':
            modal(
                'Cambiar estado del pedido',
                field('Identificador del pedido', 'id', '', 'number', 'required min="1" step="1"') +
                `<label> Nuevo estado
                    <select name="estado" required>
                        <option value="PAGADO">PAGADO</option>
                        <option value="PENDIENTE">PENDIENTE</option>
                        <option value="CANCELADO">CANCELADO</option>
                    </select>
                </label>
                <p class="note">Pasar a CANCELADO devuelve las unidades al stock.</p>`,
                f => api('/api/pedidos/' + path(f.get('id')) + '/estado', { method: 'PATCH', body: { estado: f.get('estado') } }),
                'Cambiar estado'
            );
            return;

        case 'revoke-permission-id':
            modal(
                'Retirar permiso individual',
                field('Usuario', 'username', '', 'text', 'required') +
                await picker('permission', 'Permiso individual', 'permission') +
                '<p class="note">Los permisos heredados del rol permanecerán activos.</p>',
                f => api(`/api/user/${path(f.get('username'))}/permissions/${path(f.get('permission'))}`, { method: 'DELETE' }),
                'Retirar permiso'
            );
            return;

        case 'edit-named':
            modal(
                'Actualizar cuenta',
                field('Usuario', 'username', '', 'text', 'required') +
                field('Nuevo correo (opcional)', 'email', '', 'email') +
                field('Nueva contraseña (opcional)', 'password', '', 'password') +
                `
                    <label>
                        Estado
                        <select name="status">
                            <option value="">Conservar estado</option>
                            <option value="enabled">Habilitar y desbloquear</option>
                            <option value="disabled">Deshabilitar</option>
                            <option value="locked">Bloquear</option>
                        </select>
                    </label>
                `,
                f => {
                    const data = { username: f.get('username') };
                    if (f.get('email')) data.email = f.get('email');
                    if (f.get('password')) data.password = f.get('password');
                    if (f.get('status') === 'enabled') {
                        data.locked = false;
                        data.disabled = false;
                    }
                    if (f.get('status') === 'disabled') data.disabled = true;
                    if (f.get('status') === 'locked') data.locked = true;
                    return api('/api/user/update', { method: 'PUT', body: data });
                }
            );
            return;

        case 'delete-named':
            modal(
                'Eliminar cuenta',
                field('Usuario', 'username', '', 'text', 'required') +
                '<p class="note">La cuenta se eliminará permanentemente.</p>',
                f => api('/api/user/delete/' + path(f.get('username')), { method: 'DELETE' }),
                'Eliminar'
            );
            return;

        case 'deactivate':
            return confirmAction(
                'Eliminar registro',
                `¿Eliminar ${row.nombre || row.name}? No se puede deshacer.`,
                () => api(sections[state.view].endpoint + '/' + row.id, { method: 'DELETE' })
            );

        case 'delete-user':
            return confirmAction(
                'Eliminar usuario',
                `¿Eliminar permanentemente la cuenta ${row.username}?`,
                () => api('/api/user/delete/' + path(row.username), { method: 'DELETE' })
            );

        case 'user-role':
            return userRole(row);

        case 'user-permission':
            return userPermission(row);

        case 'user-detail':
            return userDetails(row);

        case 'role-permission':
            return rolePermissions(row);

        case 'cancel-pedido':
            return confirmAction(
                'Cancelar pedido',
                `¿Cancelar el pedido #${row.id}? Sus unidades regresarán al stock.`,
                () => api('/api/pedidos/' + row.id + '/estado', { method: 'PATCH', body: { estado: 'CANCELADO' } })
            );

        case 'pedido-detail':
            return pedidoDetails(row);

        case 'revoke-user-permission':
            return confirmAction(
                'Retirar permiso individual',
                `¿Retirar ${element.dataset.permission} de ${element.dataset.username}? Los permisos heredados se conservan.`,
                () => api(`/api/user/${path(element.dataset.username)}/permissions/${path(element.dataset.permission)}`, { method: 'DELETE' })
            );
    }
}

async function onAction(e) {
    const b = e.target.closest('[data-action]');
    if (!b || b.disabled) return;
    b.disabled = true;

    try {
        await handle(b.dataset.action, b);
    } catch (error) {
        toast(error.message, true);
    } finally {
        b.disabled = false;
    }
}

$('#content').addEventListener('click', onAction);
$('#modal-body').addEventListener('click', onAction);
$('#modal-body').addEventListener('input', pedidoEstimate);

$('#content').addEventListener('input', e => {
    if (e.target.id !== 'filter') return;
    const term = e.target.value.toLocaleLowerCase();
    let shown = 0;

    $('#content').querySelectorAll('tbody tr').forEach(row => {
        row.hidden = !row.textContent.toLocaleLowerCase().includes(term);
        if (!row.hidden) shown++;
    });

    $('#empty-table').hidden = shown > 0;
    $('#empty-table').textContent = term ? 'No hay coincidencias en esta página.' : 'Aún no hay registros.';
});

$('#session-button').onclick = async () => {
    try {
        await refreshMe();
        modal(
            'Mi espacio',
            `
                <div class="info-row"><span>Usuario</span><b>${esc(state.me.username)}</b></div>
                <div class="info-row"><span>Rol</span><b>${esc(state.me.role)}</b></div>
                <div class="permission-group">
                    <h3>Permisos de mi sesión</h3>
                    ${chips(state.me.effectivePermissions)}
                </div>
            `,
            null
        );
    } catch (error) {
        toast(error.message, true);
        logout();
    }
};

if (state.token) {
    enter().catch(() => {
        logout();
        toast('Inicia sesión nuevamente para continuar.', true);
    });
}