let currentUser = null;

// Validación Cédula Ecuador
function isValidCI(ci) {
    if (!ci || ci.length !== 10 || isNaN(ci)) return false;
    const digits = ci.split('').map(Number);
    const province = parseInt(ci.substring(0, 2));
    const third = digits[2];

    // Provincias 01-24, 30 (extranjeros - a veces usado)
    if ((province < 1 || province > 24) && province !== 30) return false;
    if (third >= 6) return false; // Solo personas naturales para este algoritmo estándar

    const coefs = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    let total = 0;

    for (let i = 0; i < 9; i++) {
        let val = digits[i] * coefs[i];
        if (val >= 10) val -= 9;
        total += val;
    }

    const checkDigit = total % 10 === 0 ? 0 : 10 - (total % 10);
    return checkDigit === digits[9];
}

document.addEventListener('DOMContentLoaded', () => {
    // Auth Listeners
    document.getElementById('btn-login')?.addEventListener('click', handleLogin);
    document.getElementById('btn-register')?.addEventListener('click', handleRegister);
    document.getElementById('login-pass')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
    document.getElementById('link-register')?.addEventListener('click', (e) => { e.preventDefault(); toggleAuth('register'); });
    document.getElementById('link-login')?.addEventListener('click', (e) => { e.preventDefault(); toggleAuth('login'); });

    // Nav Listeners
    document.getElementById('nav-home')?.addEventListener('click', () => loadView('home'));
    document.getElementById('nav-enroll')?.addEventListener('click', () => loadView('enroll'));
    document.getElementById('nav-courses')?.addEventListener('click', () => loadView('courses'));
    document.getElementById('nav-professors')?.addEventListener('click', () => loadView('professors'));
    document.getElementById('nav-students')?.addEventListener('click', () => loadView('students'));
    document.getElementById('nav-logout')?.addEventListener('click', logout);

    if (localStorage.getItem('token')) initApp();
});

function toggleAuth(view) {
    document.getElementById('login-form').classList.toggle('hidden', view !== 'login');
    document.getElementById('register-form').classList.toggle('hidden', view !== 'register');
}

// Toggle Password
window.togglePassVisibility = (id) => {
    const input = document.getElementById(id);
    input.type = input.type === 'password' ? 'text' : 'password';
};

async function handleLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-pass').value;
    try {
        const res = await apiRequest('/auth/login', 'POST', { email, password });
        localStorage.setItem('token', res.token);

        if (res.mustChangePassword) {
            showChangePasswordModal();
        } else {
            currentUser = res.data;
            initApp();
        }
    } catch (e) { alert(e.message); }
}

function showChangePasswordModal() {
    let modal = document.getElementById('modal-change-pass');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-change-pass';
        modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.9); z-index:9999; display:flex; justify-content:center; align-items:center;';
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div class="glass-card" style="width:100%; max-width:450px; text-align:center;">
            <h2 style="color:var(--primary); margin-bottom:1rem;">⚠️ Cambio de Contraseña Requerido</h2>
            <p style="color:#cbd5e1; margin-bottom:2rem;">Es tu primer inicio de sesión. Por seguridad, debes cambiar tu contraseña.</p>
            
            <div class="input-group" style="position:relative;">
                <label>Nueva Contraseña</label>
                <input type="password" id="new-password-1" placeholder="Mínimo 6 caracteres" style="padding-right:40px;">
                <button type="button" onclick="togglePassVisibility('new-password-1')" style="position:absolute; right:10px; top:35px; background:none; border:none; color:white; cursor:pointer;">👁️</button>
            </div>
            <div class="input-group" style="position:relative;">
                <label>Confirmar Contraseña</label>
                <input type="password" id="new-password-2" placeholder="Repite la contraseña" style="padding-right:40px;">
                <button type="button" onclick="togglePassVisibility('new-password-2')" style="position:absolute; right:10px; top:35px; background:none; border:none; color:white; cursor:pointer;">👁️</button>
            </div>
            
            <button class="btn btn-primary" style="width:100%; margin-top:1.5rem;" onclick="submitNewPassword()">Actualizar Contraseña</button>
        </div>
    `;
}

async function submitNewPassword() {
    const p1 = document.getElementById('new-password-1').value;
    const p2 = document.getElementById('new-password-2').value;

    if (p1.length < 6) return alert('La contraseña debe tener al menos 6 caracteres');
    if (p1 !== p2) return alert('Las contraseñas no coinciden');

    try {
        await apiRequest('/auth/change-password', 'POST', { newPassword: p1 });
        alert('✅ Contraseña actualizada. Bienvenido.');
        document.getElementById('modal-change-pass').remove();

        // Reload user data to be sure
        const res = await apiRequest('/auth/me');
        currentUser = res.data;
        initApp();
    } catch (e) { alert(e.message); }
}

async function handleRegister() {
    const full_name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const phone = document.getElementById('reg-phone').value;
    const password = document.getElementById('reg-pass').value;
    const confirmPass = document.getElementById('reg-pass-conf').value;
    const dni = document.getElementById('reg-dni').value;
    const age = document.getElementById('reg-age').value;

    if (password !== confirmPass) return alert('❌ Las contraseñas no coinciden');
    if (!dni || !age || !phone) return alert('❌ Por favor completa todos los campos');
    if (!isValidCI(dni)) return alert('❌ La cédula ingresada no es válida (Número incorrecto para Ecuador).');

    try {
        const res = await apiRequest('/auth/register', 'POST', { full_name, email, password, dni, age, phone });
        // No auto-login on success because status is pending
        showSuccessModal(res.message || 'Registro exitoso. Tu cuenta está pendiente de aprobación.');

        // Clear form
        document.getElementById('reg-name').value = '';
        document.getElementById('reg-email').value = '';
        document.getElementById('reg-phone').value = '';
        document.getElementById('reg-pass').value = '';
        document.getElementById('reg-pass-conf').value = '';
        document.getElementById('reg-dni').value = '';
        document.getElementById('reg-age').value = '';

        // Go to login view
        toggleAuth('login');
    } catch (e) { alert(e.message); }
}

function logout() {
    confirmAction('¿Estás seguro de que deseas cerrar sesión?', () => {
        localStorage.removeItem('token');
        location.reload();
    });
}
// Helper for custom confirmation
window.confirmAction = (message, callback) => {
    let modal = document.createElement('div');
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:10000; display:flex; justify-content:center; align-items:center; backdrop-filter:blur(5px);';
    modal.innerHTML = `
        <div class="glass-card" style="max-width:400px; width:90%; text-align:center; box-shadow:0 20px 25px -5px rgba(0,0,0,0.5);">
            <div style="font-size:3rem; margin-bottom:1rem;">🤔</div>
            <h3 style="margin-bottom:1rem; color:var(--text-main);">${message}</h3>
            <div style="display:flex; justify-content:center; gap:1rem; margin-top:2rem;">
                <button id="confirm-no" class="btn btn-secondary" style="min-width:100px;">Cancelar</button>
                <button id="confirm-yes" class="btn btn-primary" style="min-width:100px;">Confirmar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('confirm-yes').onclick = () => {
        modal.remove();
        callback();
    };
    document.getElementById('confirm-no').onclick = () => {
        modal.remove();
    };
};

async function initApp() {
    if (!currentUser) {
        try {
            const res = await apiRequest('/auth/me');
            currentUser = res.data;
            if (currentUser.must_change_password) {
                showChangePasswordModal();
                return;
            }
        }
        catch (e) { return; }
    }
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('dashboard').style.display = 'flex';
    document.getElementById('dashboard').classList.remove('hidden');

    document.getElementById('user-role-display').innerText = currentUser.role;
    document.getElementById('user-info').innerText = currentUser.full_name;

    if (currentUser.role === 'ADMIN') {
        document.getElementById('nav-courses').innerHTML = '📚 Cursos';
        document.getElementById('admin-links').classList.remove('hidden');
        document.getElementById('admin-links').style.display = 'flex';
        // Notifications
        document.getElementById('admin-notifs').classList.remove('hidden');
        checkPendingUsers();
    } else if (currentUser.role === 'PROFESOR') {
        document.getElementById('nav-courses').innerHTML = '📚 Mis Cursos';
    } else {
        document.getElementById('nav-courses').innerHTML = '📚 Cursos';
        document.getElementById('nav-enroll').classList.remove('hidden'); // Show for Students
    }

    loadView('home');
}

async function loadView(view) {
    const content = document.getElementById('content-area');
    const title = document.getElementById('page-title');

    // Active State
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`nav-${view}`)?.classList.add('active');

    content.innerHTML = '<div style="text-align:center; padding:3rem;"><p>Cargando información...</p></div>';

    if (view === 'home') {
        title.innerText = 'Inicio';

        if (currentUser.role === 'ESTUDIANTE') {
            // Fetch extra info for student
            try {
                const res = await apiRequest('/v1/my-courses');
                const courses = res.data || [];
                const course = courses[0]; // Take first active course

                const level = course ? course.name : 'Sin Asignar';
                const lang = course ? (course.language_name || '') : '';
                const phone = currentUser.phone || 'No registrado';

                content.innerHTML = `
                    <div class="home-hero">
                        <h1 class="hero-title notranslate" translate="no">MULTILANGUE+</h1>
                        <p style="margin-bottom:2rem; color:var(--text-muted);">Bienvenido a tu plataforma de aprendizaje.</p>
                        
                        <div class="glass-card" style="max-width:600px; margin:0 auto; text-align:left; border-left:4px solid var(--primary); padding:2rem;">
                            <h2 style="color:var(--primary); margin-bottom:1.5rem; font-size:1.5rem;">🎓 Estudiante MultiLangue+</h2>
                            <div style="font-size:1.1rem; display:flex; flex-direction:column; gap:0.8rem;">
                                <div><strong>Nombre Completo:</strong> <span style="color:white;">${currentUser.full_name}</span></div>
                                <div><strong>Nombre de la clase:</strong> <span style="color:white;">${level}</span></div>
                                <div><strong>Idioma:</strong> <span style="color:white;">${lang}</span></div>
                                <div><strong>Celular:</strong> <span style="color:white;">${phone}</span></div>
                            </div>
                        </div>
                    </div>
                `;
            } catch (e) { console.error(e); }
        } else {
            // Admin / Professor View
            content.innerHTML = `
                <div class="home-hero">
                    <h1 class="hero-title notranslate" translate="no">MULTILANGUE+</h1>
                    <p class="founder-info">Fundador: <strong>Carlos Sotomayor</strong></p>
                    <div style="margin-bottom:2rem"><span class="year-badge">EST 2025</span></div>
                    
                    <div class="flags-grid">
                        <div class="flag-card" onclick="openPlacementMenu('Francés')" role="button" tabindex="0">
                            <span class="flag-emoji">🇫🇷</span>
                            <div class="flag-name">Francés</div>
                        </div>
                        <div class="flag-card" onclick="openPlacementMenu('Inglés')" role="button" tabindex="0">
                            <span class="flag-emoji">🇺🇸</span>
                            <div class="flag-name">Inglés</div>
                        </div>
                        <div class="flag-card" onclick="openPlacementMenu('Portugués')" role="button" tabindex="0">
                            <span class="flag-emoji">🇧🇷</span>
                            <div class="flag-name">Portugués</div>
                        </div>

                    </div>
                    <p style="margin-top:2rem; color:gray; font-size:0.9rem;">* Selecciona un idioma para gestionar Pruebas de Ubicación</p>
                </div>
            `;
        }
    }
    else if (view === 'enroll') {
        title.innerText = 'Inscripciones';
        content.innerHTML = `
            <div class="glass-card" style="text-align:center; padding:3rem; margin-top:2rem;">
                <div style="font-size:4rem; margin-bottom:1rem;">📝</div>
                <h2 style="color:var(--primary); margin-bottom:1rem; font-size:1.8rem;">Inscripción a Cursos</h2>
                <p style="font-size:1.2rem; color:#cbd5e1; line-height:1.6;">
                    Aún no estás inscrita en ningún idioma. <br>
                    <span style="font-size:1rem; color:gray;">Sigue en contacto para próximas aperturas.</span>
                </p>
            </div>
        `;
    }
    else if (view === 'courses') {
        title.innerText = currentUser.role === 'PROFESOR' ? 'Mis Cursos' : 'Gestión de Cursos';
        try {
            const endpoint = currentUser.role === 'ADMIN' ? '/v1/all-courses' : '/v1/my-courses';
            const [resCourses, resLangs] = await Promise.all([
                apiRequest(endpoint),
                apiRequest('/v1/languages')
            ]);

            const courses = resCourses.data || [];
            window.currentCourses = courses; // Store for editing
            const langs = resLangs.data || [];

            // Empty State for Professors
            if (currentUser.role === 'PROFESOR' && courses.length === 0) {
                content.innerHTML = `
                    <div style="text-align:center; padding:5rem; color:#94a3b8;">
                        <div style="font-size:4rem; margin-bottom:1rem; opacity:0.5;">📭</div>
                        <h2 style="font-size:2rem; color:white; margin-bottom:1rem;">Aún no tiene cursos registrados</h2>
                        <p>Contacte al administrador para que le asigne sus clases.</p>
                    </div>
                `;
                return;
            }

            let html = `
                <div style="display:flex; justify-content:space-between; margin-bottom:1.5rem; align-items:center;">
                    ${currentUser.role === 'ADMIN' ? `
                    <select id="filter-lang" class="input-group" style="width:200px; margin:0;" onchange="filterCourses()">
                        <option value="all">🌐 Todos</option>
                        ${langs.map(l => `<option value="${l.name}">${l.name}</option>`).join('')}
                    </select>
                    <button class="btn btn-primary" onclick="showCreateCourseModal()">+ Nuevo Curso</button>
                    ` : ''}
                </div>
                
                <div class="card-grid" id="courses-grid">
                    ${courses.length ? courses.map(c => `
                        <div class="glass-card course-card" data-lang="${c.language_name || c.language}">
                            <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                                <span style="color:var(--secondary); font-weight:700; font-size:0.8rem; letter-spacing:1px; text-transform:uppercase;">
                                    ${c.language_name || c.language}
                                </span>
                                ${currentUser.role === 'ADMIN' ?
                    `<span style="background:rgba(255,255,255,0.1); padding:2px 8px; border-radius:4px; font-size:0.8rem;">👥 ${c.student_count || 0}</span>` : ''}
                            </div>
                            <h3 style="font-size:1.3rem; margin-bottom:0.5rem;">${c.name}</h3>
                            <p style="color:#94a3b8; font-size:0.9rem; margin-bottom:1rem;">📅 ${c.schedule_description || 'Sin horario'}</p>
                            <p style="font-size:0.9rem; margin-bottom:1.5rem;">👨‍🏫 ${c.teacher_name || c.teacher || 'Sin asignar'}</p>
                            
                            <div style="display:flex; gap:0.5rem;">
                                <button class="btn btn-primary" style="flex:1" onclick="enterCourse(${c.id})">Entrar</button>
                                ${currentUser.role === 'ADMIN' ? `<button class="btn btn-secondary" onclick="editCourse(${c.id})">✏️</button>` : ''}
                            </div>
                        </div>
                    `).join('') : '<p style="grid-column:1/-1; text-align:center; padding:2rem; color:gray;">No se encontraron cursos activos.</p>'}
                </div>
            `;
            content.innerHTML = html;
        } catch (e) {
            content.innerHTML = `<p style="color:red; background:rgba(255,0,0,0.1); padding:1rem; border-radius:0.5rem; text-align:center;">⚠️ Error cargando cursos: ${e.message}</p>`;
        }
    }
    else if (view === 'professors') {
        title.innerText = 'Directorio de Profesores';
        renderUserSection('PROFESOR');
    }
    else if (view === 'students') {
        title.innerText = 'Lista de Estudiantes';
        renderUserSection('ESTUDIANTE');
    }
}

async function renderUserSection(role) {
    const content = document.getElementById('content-area');
    try {
        const [resUsers, resCourses] = await Promise.all([
            apiRequest('/v1/users'),
            role === 'ESTUDIANTE' ? apiRequest('/v1/all-courses') : Promise.resolve({ data: [] })
        ]);

        const users = resUsers.data.filter(u => u.role === role);
        const courses = resCourses.data || [];

        content.innerHTML = `
            <div class="glass-card" style="margin-bottom:2rem;">
                <h3 style="margin-bottom:1rem; color:var(--primary);">Registrar Nuevo ${role === 'PROFESOR' ? 'Profesor' : 'Estudiante'}</h3>
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:1rem;">
                    <div class="input-group">
                        <label>Nombre Completo</label>
                        <input id="new-name" placeholder="Ej. Juan Pérez">
                    </div>
                    <div class="input-group">
                        <label>Email</label>
                        <input id="new-email" placeholder="juan@ejemplo.com">
                    </div>
                    <div class="input-group">
                        <label>Teléfono</label>
                        <input id="new-phone" placeholder="099...">
                    </div>
                    <div class="input-group">
                        <label>Cédula/DNI (Será su contraseña)</label>
                        <input id="new-dni" placeholder="17...">
                    </div>
                    ${role === 'ESTUDIANTE' ? `
                    <div class="input-group">
                        <label>Asignar a Curso (Opcional)</label>
                        <select id="new-course">
                            <option value="">-- Seleccionar --</option>
                            ${courses.map(c => `<option value="${c.id}">${c.name} (${c.schedule_description})</option>`).join('')}
                        </select>
                    </div>` : ''}
                </div>
                <div style="text-align:right; margin-top:1rem;">
                    <button class="btn btn-primary" onclick="createUser('${role}')">Guardar Registro</button>
                </div>
            </div>

            <div class="glass-card">
                <div style="overflow-x:auto;">
                    <table>
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Email</th>
                                <th>Teléfono</th>
                                <th>Cédula</th>
                                <th style="text-align:right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${users.map(u => `
                                <tr>
                                    <td><strong>${u.full_name}</strong></td>
                                    <td>${u.email}</td>
                                    <td>${u.phone || '<span style="color:gray">-</span>'}</td>
                                    <td>${u.dni || '<span style="color:gray">-</span>'}</td>
                                    <td style="text-align:right; display:flex; justify-content:flex-end; gap:0.5rem;">
                                        <button class="btn btn-secondary" style="padding:0.4rem 0.8rem; font-size:0.8rem;" 
                                            onclick='showEditUserModal(${JSON.stringify(u)}, "${role}")'>✏️</button>
                                        <button class="btn btn-secondary" style="padding:0.4rem 0.8rem; font-size:0.8rem; background:var(--warning); color:black;" 
                                            onclick="resetUserPassword(${u.id})" title="Resetear Contraseña a DNI">🔑</button>
                                        <button class="btn btn-danger" style="padding:0.4rem 0.8rem; font-size:0.8rem;" 
                                            onclick="deleteUser(${u.id}, '${role}')">🗑️</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } catch (e) { content.innerHTML = `<p style="color:red">Error: ${e.message}</p>`; }
}

// Helper for success modal
window.showSuccessModal = (message) => {
    let modal = document.createElement('div');
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:10000; display:flex; justify-content:center; align-items:center; backdrop-filter:blur(5px); animation:fadeIn 0.2s;';
    modal.innerHTML = `
        <div class="glass-card" style="max-width:400px; width:90%; text-align:center; border:2px solid var(--success);">
            <div style="font-size:3rem; margin-bottom:1rem;">✅</div>
            <h3 style="margin-bottom:1rem; color:white;">¡Éxito!</h3>
            <p style="color:#cbd5e1; margin-bottom:2rem; font-size:1.1rem;">${message}</p>
            <button class="btn btn-primary" onclick="this.closest('div').parentElement.remove()" style="width:100%">Entendido</button>
        </div>
    `;
    document.body.appendChild(modal);
};

async function createUser(role) {
    const full_name = document.getElementById('new-name').value;
    const email = document.getElementById('new-email').value;
    const phone = document.getElementById('new-phone').value;
    const dni = document.getElementById('new-dni').value;
    const course_id = document.getElementById('new-course')?.value;

    if (!full_name || !email || !dni) return alert('Nombre, Email y Cédula son obligatorios');
    if (!isValidCI(dni)) return alert('❌ Cédula inválida (Algoritmo Ecuador)');

    try {
        await apiRequest('/v1/users', 'POST', { full_name, email, role, phone, dni, course_id });
        showSuccessModal('Usuario creado correctamente. Su contraseña inicial es su Cédula.');
        loadView(role === 'PROFESOR' ? 'professors' : 'students');
    } catch (e) { alert('❌ Error: ' + e.message); }
}

function filterCourses() {
    const filter = document.getElementById('filter-lang').value.toLowerCase();
    const cards = document.querySelectorAll('.course-card');
    cards.forEach(card => {
        const lang = card.dataset.lang?.toLowerCase() || '';
        if (filter === 'all' || lang === filter) card.style.display = 'block';
        else card.style.display = 'none';
    });
}

// Full Course Detail View
// Full Course Detail View
// Full Course Detail View
async function enterCourse(courseId) {
    window.currentCourseId = courseId; // Track state
    const content = document.getElementById('content-area');
    content.innerHTML = '<p>Cargando aula...</p>';

    try {
        const res = await apiRequest(`/v1/courses/${courseId}`);
        const { course, units } = res.data;
        window.currentUnits = units; // Track units for editing

        const pageTitle = document.getElementById('page-title');
        if (pageTitle) pageTitle.innerText = course.name;

        // 1. HOMEWORK / ASSIGNMENTS
        let assignments = [];
        try {
            // Fetch assignments for everyone
            const resAss = await apiRequest(`/v1/courses/${courseId}/assignments`);
            assignments = resAss.data || [];
            window.currentAssignments = assignments;
        } catch (e) { console.error('Error fetching assignments', e); }

        let homeworkMsg = '<div id="homework-area">Cargando...</div>';

        // 2. Fetch MATERIALS
        let materialsMsg = '';
        try {
            const resMat = await apiRequest(`/v1/courses/${courseId}/materials`);
            const materials = resMat.data || [];

            materialsMsg = `
                <div style="margin-bottom:2rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                        <h4 style="color:var(--secondary);">📂 Archivos y Recursos</h4>
                        ${currentUser.role === 'PROFESOR' || currentUser.role === 'ADMIN' ?
                    `<button class="btn btn-primary" style="font-size:0.8rem; padding:0.4rem 0.8rem;" onclick="showUploadMaterialModal(${courseId})">+ Subir Material</button>` : ''}
                    </div>
                    
                    ${materials.length > 0 ? `
                        <div class="glass-card" style="padding:0;">
                            ${materials.map(m => `
                                <div style="display:flex; justify-content:space-between; align-items:center; padding:1rem; border-bottom:1px solid rgba(255,255,255,0.05);">
                                    <div style="display:flex; align-items:center; gap:1rem;">
                                        <div style="background:rgba(255,255,255,0.1); width:40px; height:40px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:1.5rem;">📄</div>
                                        <div>
                                            <div style="font-weight:bold;">${m.title}</div>
                                            <div style="font-size:0.8rem; color:#94a3b8;">${new Date(m.uploaded_at).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                    <a href="${m.url}" target="_blank" class="btn btn-primary" style="font-size:0.8rem;">👁️ Ver</a>
                                </div>
                            `).join('')}
                        </div>
                    ` : '<div class="glass-card"><p style="color:gray;">No hay archivos subidos.</p></div>'}
                </div>
            `;
        } catch (e) { console.error('Error fetching materials', e); }

        // Top Nav
        const nav = `
            <div style="display:flex; gap:1rem; margin-bottom:2rem; overflow-x:auto;">
                <button class="nav-btn active" onclick="switchTab('activities')">🧩 Actividades</button>
                <button class="nav-btn" onclick="switchTab('progress')">📊 Progreso</button>
                <button class="nav-btn" onclick="switchTab('materials')">📚 Materiales</button>
                <button class="nav-btn" onclick="switchTab('homework')">📝 Deberes</button>
                ${currentUser.role === 'PROFESOR' || currentUser.role === 'ADMIN' ? '<button class="nav-btn" onclick="switchTab(\'attendance\')">📋 Asistencia</button>' : ''}
            </div>
            <style>
                .nav-btn {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    color: #cbd5e1;
                    padding: 0.8rem 1.5rem;
                    border-radius: 12px;
                    cursor: pointer;
                    font-size: 1rem;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex; align-items: center; gap: 0.5rem;
                }
                .nav-btn:hover {
                    background: rgba(255,255,255,0.1);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                    border-color: var(--primary);
                    color: white;
                }
                .nav-btn.active {
                    background: var(--primary);
                    color: white;
                    border-color: var(--primary);
                    box-shadow: 0 0 15px rgba(99,102,241,0.4);
                }
                .progress-bar-container { background:rgba(255,255,255,0.1); border-radius:10px; height:20px; width:100%; overflow:hidden; margin-top:0.5rem; position:relative; }
                .progress-bar { height:100%; transition:width 1s ease-in-out; display:flex; align-items:center; justify-content:center; font-size:0.7rem; font-weight:bold; color:white; text-shadow:0 1px 2px rgba(0,0,0,0.5); }
                .bg-gray { background:#475569; width:0%; }
                .bg-red { background:#ef4444; }
                .bg-yellow { background:#eab308; }
                .bg-green { background:#10b981; }
            </style>
        `;

        // Helper to switch tabs
        window.switchTab = (tabName) => {
            // Update buttons
            document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
            const activeBtn = document.querySelector(`button[onclick="switchTab('${tabName}')"]`);
            if (activeBtn) activeBtn.classList.add('active');

            // Hide all tab contents
            ['activities', 'progress', 'materials', 'homework', 'attendance'].forEach(t => {
                const el = document.getElementById(`tab-${t}`);
                if (el) el.classList.add('hidden');
            });

            // Show selected tab
            const target = document.getElementById(`tab-${tabName}`);
            if (target) {
                target.classList.remove('hidden');
                if (tabName === 'attendance') loadAttendanceHistory(courseId);
            }
        };

        // 3. Render HTML
        content.innerHTML = `
            <div style="max-width:1200px; margin:0 auto;">
                <button class="btn btn-secondary" style="margin-bottom:2rem;" onclick="loadView('courses')">← Volver al Panel</button>
                <h2 style="font-size:2rem; margin-bottom:1.5rem; color:white;">${course.name}</h2>
                ${nav}

                <div style="display:grid; grid-template-columns: 3fr 1fr; gap:2rem;">
                    
                    <div style="min-width:0;">
                        
                        <!-- TAB CONTENT: ACTIVITIES -->
                        <div id="tab-activities"> 
                            ${renderUnits(units)}
                        </div>

                        <!-- TAB CONTENT: PROGRESS -->
                        <div id="tab-progress" class="hidden">
                            <div id="progress-content-area">
                                <p style="text-align:center; color:gray;">Cargando progreso...</p>
                            </div>
                        </div>

                        <!-- TAB CONTENT: MATERIALS -->
                        <div id="tab-materials" class="hidden">
                            ${materialsMsg}
                        </div>

                        <!-- TAB CONTENT: HOMEWORK (Rename from recordings) -->
                        <div id="tab-homework" class="hidden">
                            ${homeworkMsg}
                        </div>

                        <!-- TAB CONTENT: ATTENDANCE -->
                        <div id="tab-attendance" class="hidden">
                             <div style="display:grid; grid-template-columns: 1fr 250px; gap:1.5rem;">
                                <!-- Main Attendance Area -->
                                <div class="glass-card">
                                    <h3>Registro de Asistencia</h3>
                                    <div style="display:flex; gap:1rem; align-items:center; margin-bottom:1rem;">
                                        <input type="date" id="att-date" class="input-group" style="max-width:200px; margin:0;" value="${new Date().toISOString().split('T')[0]}">
                                        <button class="btn btn-secondary" onclick="loadAttendanceList(${courseId})">Cargar Lista</button>
                                    </div>
                                    <div id="attendance-list-area">
                                        <p style="color:gray">Selecciona fecha y carga lista...</p>
                                    </div>
                                </div>

                                <!-- Historial Fechas -->
                                <div class="glass-card" style="height:fit-content; background: linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01)); border: 1px solid rgba(255,255,255,0.1);">
                                    <h4 style="font-size:1.1rem; color:var(--primary); margin-bottom:1rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom:0.5rem;">📅 Historial</h4>
                                    <div id="att-history-list" style="display:flex; flex-direction:column; gap:0.8rem; max-height:450px; overflow-y:auto; padding-right:5px;">
                                        <p style="font-size:0.8rem; text-align:center;">Cargando...</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    <!-- RIGHT COLUMN info -->
                    <div style="display:flex; flex-direction:column; gap:1rem;">
                        <div class="glass-card">
                            <h4 style="margin-bottom:0.8rem; color:var(--primary);">Info Curso</h4>
                            <p style="margin-bottom:0.5rem"><strong>Nivel:</strong> ${course.name}</p>
                            <p style="margin-bottom:0.5rem"><strong>Idioma:</strong> ${course.language_name || 'N/A'}</p>
                            <p style="margin-bottom:0.5rem"><strong>Horario:</strong> ${course.schedule_description || '-'}</p>
                            <p style="margin-bottom:0.5rem"><strong>Profesor:</strong> ${course.teacher_name || '-'}</p>
                        </div>
                    </div>

                </div>
            </div>
        `;

        // Load Progress
        loadCourseProgress(courseId);

    } catch (e) {
        content.innerHTML = `<p style="color:red">Error: ${e.message}</p>`;
        console.error(e);
    }
}

// === PROGRESS LOGIC ===
async function loadCourseProgress(courseId) {
    const area = document.getElementById('progress-content-area');
    if (!area) return; // Tab might not be rendered yet if logic order changes, but it is in HTML string above

    try {
        const res = await apiRequest(`/v1/courses/${courseId}/progress`);
        const data = res.data || [];
        window.currentCourseProgress = data; // Store globally for Student List

        renderHomeworkTab(courseId); // Initial render of homework tab content

        if (data.length === 0) {
            area.innerHTML = '<div class="glass-card"><p>No hay datos de progreso disponibles.</p></div>';
            return;
        }

        if (currentUser.role === 'ESTUDIANTE') {
            // -- VISTA ESTUDIANTE --
            // Solo sus propias unidades
            const studentData = data[0]; // Backend returns array with 1 item for student
            if (!studentData) return;

            let html = '<div class="glass-card">';
            html += `<h3 style="margin-bottom:1.5rem; color:var(--primary);">Tu Progreso</h3>`;

            html += renderUnitBars(studentData.units, `stu-${studentData.student_id}`);
            html += '</div>';

            area.innerHTML = html;

        } else {
            // -- VISTA ADMIN / PROF --
            // Lista de estudiantes
            let html = `
                <div class="glass-card">
                    <h3 style="margin-bottom:1rem;">Progreso de Estudiantes</h3>
                    <div style="display:flex; flex-direction:column; gap:1rem;">
            `;

            data.forEach(student => {
                const uniqueId = `prog-${student.student_id}`;
                html += `
                    <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:1rem;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <div>
                                <div style="font-weight:bold; font-size:1.1rem;">${student.full_name}</div>
                                <div style="font-size:0.8rem; color:#94a3b8;">${student.email}</div>
                            </div>
                            <button class="btn btn-primary" onclick="toggleStudentProgress('${uniqueId}')">
                                Ver Progreso
                            </button>
                        </div>
                        
                        <div id="${uniqueId}" class="hidden" style="display:none; margin-top:1.5rem; border-top:1px solid rgba(255,255,255,0.1); padding-top:1rem;">
                            <!-- Render Bars Here -->
                            ${renderUnitBars(student.units, uniqueId)}
                        </div>
                    </div>
                `;
            });

            html += '</div></div>';
            area.innerHTML = html;
        }

    } catch (e) {
        console.error("Error loading progress", e);
        area.innerHTML = `<p style="color:red">Error cargando progreso: ${e.message}</p>`;
    }
}

function renderUnitBars(units, baseId) {
    if (!units || units.length === 0) return '<p>No hay unidades.</p>';

    let html = '<div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap:1.5rem;">';

    units.forEach((unit, idx) => {
        // Color logic
        let color = '#94a3b8'; // gray
        if (unit.status === 'red') color = '#ef4444';
        else if (unit.status === 'yellow') color = '#eab308';
        else if (unit.status === 'green') color = '#22c55e';

        const detailsId = `${baseId}-unit-${unit.unit_id}`;

        html += `
            <div style="background:rgba(0,0,0,0.2); border-radius:8px; padding:1rem;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                    <span style="font-weight:bold; font-size:0.9rem;">${unit.unit_title}</span>
                    <button onclick="toggleElement('${detailsId}')" style="background:none; border:none; color:white; cursor:pointer;">
                        ▼
                    </button>
                </div>

                <!-- Barra -->
                <div style="background:#334155; height:10px; border-radius:5px; overflow:hidden; margin-bottom:0.5rem;">
                    <div style="background:${color}; width:${unit.percentage}%; height:100%;"></div>
                </div>
                <div style="text-align:right; font-size:0.8rem; color:${color}; font-weight:bold;">${unit.percentage}%</div>

                <!-- Detalles (Drill-down) -->
                <div id="${detailsId}" class="hidden" style="margin-top:1rem; font-size:0.85rem;">
                    ${unit.details.length === 0 ? '<p style="color:gray;">Sin actividad.</p>' : ''}
                    ${unit.details.map(act => `
                        <div style="margin-bottom:0.5rem; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:0.3rem;">
                            <div style="color:white; margin-bottom:2px;">${act.activity_title}</div>
                            <div style="display:flex; justify-content:space-between; color:#94a3b8; font-size:0.75rem;">
                                <span>${act.submitted_at ? new Date(act.submitted_at).toLocaleDateString() : 'Pendiente'}</span>
                                <span style="color:${act.grade >= 70 ? '#22c55e' : (act.submitted_at ? '#ef4444' : 'gray')}">
                                    ${act.submitted_at ? Math.round(act.grade) + '/100' : '-'}
                                </span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });

    html += '</div>';
    return html;
}

window.toggleStudentProgress = (id) => {
    console.log("toggleStudentProgress called for:", id);
    const el = document.getElementById(id);
    if (!el) return console.error("Element not found:", id);

    if (el.style.display === 'none') {
        el.style.display = 'block';
        el.classList.remove('hidden');
    } else {
        el.style.display = 'none';
        el.classList.add('hidden');
    }
};

window.toggleElement = (id) => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('hidden');
};

// === WINDOW FUNCTIONS FOR COURSE VIEW ===
window.switchTab = function (tabName) {
    ['materials', 'activities', 'recordings', 'attendance', 'progress'].forEach(t => {
        const el = document.getElementById(`tab-${t}`);
        if (el) {
            el.classList.toggle('hidden', t !== tabName);
        }
    });
};

window.loadAttendanceHistory = async (cId) => {
    try {
        const res = await apiRequest(`/v1/courses/${cId}/attendance-history`);
        const dates = res.data || [];
        const list = document.getElementById('att-history-list');

        if (!list) return;

        if (dates.length === 0) {
            list.innerHTML = '<p style="font-size:0.8rem; color:gray; text-align:center;">Sin registros previos.</p>';
            return;
        }

        list.innerHTML = dates.map(d => `
            <button class="btn glass-card-hover" style="
                    font-size:0.9rem; 
                    width:100%; 
                    text-align:left; 
                    padding: 0.8rem; 
                    border: 1px solid rgba(255,255,255,0.05); 
                    background: rgba(255,255,255,0.02); 
                    color: var(--text-main); 
                    cursor: pointer; 
                    border-radius: 8px; 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center;
                    transition: all 0.2s ease;
                " 
                onclick="document.getElementById('att-date').value='${d.date}'; loadAttendanceList(${cId}, true);"
                onmouseover="this.style.background='rgba(255,255,255,0.1)'"
                onmouseout="this.style.background='rgba(255,255,255,0.02)'"
            >
                <span>📅 ${d.date}</span>
                <span style="font-size:0.75rem; background: var(--primary); color: white; padding: 2px 6px; border-radius: 4px;">${d.record_count}</span>
            </button>
        `).join('');
    } catch (e) { console.error(e); }
};

window.loadAttendanceList = async (cId, readOnly = false) => {
    const dateInput = document.getElementById('att-date');
    const date = dateInput.value;
    const area = document.getElementById('attendance-list-area');
    area.innerHTML = '<p>Cargando...</p>';

    try {
        const resStudents = await apiRequest(`/v1/courses/${cId}/students`);
        const students = resStudents.data || [];

        if (students.length === 0) {
            area.innerHTML = '<p>No hay estudiantes inscritos en este curso.</p>';
            return;
        }

        const resAtt = await apiRequest(`/v1/courses/${cId}/attendance?date=${date}`);
        const existing = resAtt.data || [];

        const attMap = {};
        existing.forEach(r => attMap[r.student_id] = r.status);

        let tableContent = '';
        if (readOnly) {
            tableContent = `
                <div style="background:rgba(99,102,241,0.1); padding:1rem; margin-bottom:1rem; border-radius:8px; text-align:center; border: 1px solid var(--primary);">
                    <div style="font-size:1.1rem; margin-bottom:0.5rem;">👁️ <strong>Vista de Lectura</strong></div>
                    <div style="font-size:0.9rem; margin-bottom:1rem;">Registro del: <strong>${date}</strong></div>
                    <button class="btn btn-secondary" style="font-size:0.8rem;" onclick="loadAttendanceList(${cId}, false)">✏️ Volver a Editar / Nueva Asistencia</button>
                </div>
                <table style="width:100%; margin-top:1rem; border-collapse: collapse;">
                    <thead>
                        <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                            <th style="padding:0.5rem; text-align:left;">Estudiante</th>
                            <th style="padding:0.5rem; text-align:center;">Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${students.map(s => {
                const status = attMap[s.id] || ' - ';
                let color = 'white';
                let icon = '';
                if (status === 'AUSENTE') { color = '#ef4444'; icon = '❌'; }
                if (status === 'TARDE') { color = '#f59e0b'; icon = '⚠️'; }
                if (status === 'PRESENTE') { color = '#22c55e'; icon = '✅'; }

                return `
                            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                                <td style="padding:0.8rem 0.5rem;">${s.full_name}</td>
                                <td style="padding:0.8rem 0.5rem; text-align:center; color:${color}; font-weight:bold;">${icon} ${status}</td>
                            </tr>
                        `}).join('')}
                    </tbody>
                </table>
             `;
        } else {
            tableContent = `
                <table style="width:100%; margin-top:1rem;">
                    <thead><tr><th>Estudiante</th><th>Estado</th></tr></thead>
                    <tbody>
                        ${students.map(s => `
                            <tr data-sid="${s.id}">
                                <td>${s.full_name}</td>
                                <td>
                                    <select class="att-select" style="background:#0f172a; color:white; padding:5px; border-radius:4px;">
                                        <option value="PRESENTE" ${attMap[s.id] !== 'AUSENTE' && attMap[s.id] !== 'TARDE' ? 'selected' : ''}>Presente</option>
                                        <option value="AUSENTE" ${attMap[s.id] === 'AUSENTE' ? 'selected' : ''}>Ausente</option>
                                        <option value="TARDE" ${attMap[s.id] === 'TARDE' ? 'selected' : ''}>Tarde</option>
                                    </select>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <button class="btn btn-primary" style="margin-top:1rem; width:100%" onclick="saveAttendance(${cId})">Guardar Cambios</button>
            `;
        }

        area.innerHTML = tableContent;

    } catch (e) { area.innerHTML = `<p style="color:red">${e.message}</p>`; }
};

window.saveAttendance = async (cId) => {
    const date = document.getElementById('att-date').value;
    const rows = document.querySelectorAll('#attendance-list-area tr[data-sid]');
    const data = [];

    rows.forEach(row => {
        const sid = row.getAttribute('data-sid');
        const status = row.querySelector('select').value;
        data.push({ student_id: sid, status });
    });

    try {
        await apiRequest(`/v1/courses/${cId}/attendance`, 'POST', { date, attendanceData: data });
        alert('✅ Asistencia guardada correctamente');
        loadAttendanceHistory(cId);
    } catch (e) { alert(e.message); }
};

window.showUploadMaterialModal = (cId) => {
    let modal = document.getElementById('modal-upload-mat');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-upload-mat';
        modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.8); z-index:9999; display:flex; justify-content:center; align-items:center;';
        document.body.appendChild(modal);
    }
    modal.innerHTML = `
        <div class="glass-card" style="width:100%; max-width:400px; position:relative;">
            <button onclick="document.getElementById('modal-upload-mat').style.display='none'" style="position:absolute; top:1rem; right:1rem; background:none; border:none; color:white; font-size:1.5rem; cursor:pointer;">&times;</button>
            <h3 style="margin-bottom:1.5rem; color:var(--primary);">Subir Material</h3>
            
            <div class="input-group">
                <label>Título / Descripción</label>
                <input id="mat-title" placeholder="Ej. Guía de estudio PDF">
            </div>
            
            <div class="input-group">
                <label>Archivo</label>
                <input type="file" id="mat-file">
            </div>

            <button class="btn btn-primary" style="width:100%; margin-top:1rem;" onclick="uploadMaterial(${cId})">Subir Archivo</button>
            <div id="mat-progress" style="margin-top:0.5rem; font-size:0.8rem; color:gray;"></div>
        </div>
    `;
    modal.style.display = 'flex';
};

window.uploadMaterial = async (cId) => {
    const fileInput = document.getElementById('mat-file');
    const title = document.getElementById('mat-title').value;
    const file = fileInput.files[0];

    if (!file) return alert('Selecciona un archivo');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);

    document.getElementById('mat-progress').innerText = 'Subiendo...';

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/v1/courses/${cId}/materials`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        const data = await res.json();

        if (data.success) {
            alert('✅ Archivo subido exitosamente');
            document.getElementById('modal-upload-mat').style.display = 'none';
            enterCourse(cId); // Reload view
        } else {
            alert('Error: ' + data.message);
        }
    } catch (e) { alert('Error de red: ' + e.message); }
};

// --- DELETE USER ---
async function deleteUser(id, role) {
    confirmAction('¿Estás seguro de eliminar este usuario? Esta acción es irreversible.', async () => {
        try {
            await apiRequest(`/v1/users/${id}`, 'DELETE');
            showSuccessModal('Usuario eliminado correctamente.');
            loadView(role === 'PROFESOR' ? 'professors' : 'students');
        } catch (e) { alert('❌ Error: ' + e.message); }
    });
}

async function resetUserPassword(id) {
    confirmAction('¿Estás seguro de resetear la contraseña? Volverá a ser su número de Cédula.', async () => {
        try {
            await apiRequest(`/v1/users/${id}/reset-password`, 'POST');
            showSuccessModal('Contraseña reseteada. El usuario deberá cambiarla al ingresar.');
        } catch (e) { alert('❌ Error: ' + e.message); }
    });
}


// --- EDIT USER ---
let editingUserId = null;
async function showEditUserModal(user, role) {
    let courses = [];
    if (role === 'ESTUDIANTE') {
        try {
            const res = await apiRequest('/v1/all-courses');
            courses = res.data || [];
        } catch (e) { console.error('Error loading courses', e); }
    }

    let modal = document.getElementById('modal-edit-user');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-edit-user';
        modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.8); z-index:2000; display:flex; justify-content:center; align-items:center;';
        document.body.appendChild(modal);
    }

    // Courses Dropdown HTML
    let coursesSelect = '';
    if (role === 'ESTUDIANTE') {
        coursesSelect = `
            <div class="input-group">
                <label>Asignar Curso (Opcional)</label>
                <select id="edit-course">
                    <option value="">-- Seleccionar --</option>
                    ${courses.map(c => `<option value="${c.id}">${c.name} (${c.language})</option>`).join('')}
                </select>
            </div>
        `;
    }

    modal.innerHTML = `
            <div class="glass-card" style="width:100%; max-width:400px; position:relative;">
                <button onclick="document.getElementById('modal-edit-user').style.display='none'" style="position:absolute; top:1rem; right:1rem; background:none; border:none; color:white; font-size:1.5rem; cursor:pointer;">&times;</button>
                <h3 style="margin-bottom:1.5rem; color:var(--primary);">Editar Usuario</h3>
                
                <input type="hidden" id="edit-id" value="${user.id}">
                <input type="hidden" id="edit-role" value="${role}">

                <div class="input-group">
                    <label>Nombre Completo</label>
                    <input id="edit-name" value="${user.full_name}">
                </div>
                <div class="input-group">
                    <label>Email</label>
                    <input id="edit-email" value="${user.email}">
                </div>
                <div class="input-group">
                    <label>Teléfono</label>
                    <input id="edit-phone" value="${user.phone || ''}">
                </div>
                <div class="input-group">
                    <label>Cédula/DNI</label>
                    <input id="edit-dni" value="${user.dni || ''}">
                </div>
                <div class="input-group">
                    <label>Edad</label>
                    <input type="number" id="edit-age" value="${user.age || ''}">
                </div>
                
                ${coursesSelect}

                <div style="text-align:right; margin-top:1.5rem;">
                    <button class="btn btn-primary" onclick="updateUser()">Guardar Cambios</button>
                </div>
            </div>
        `;
    modal.style.display = 'flex';
}

async function updateUser() {
    const id = document.getElementById('edit-id').value;
    const role = document.getElementById('edit-role').value;
    const full_name = document.getElementById('edit-name').value;
    const email = document.getElementById('edit-email').value;
    const phone = document.getElementById('edit-phone').value;
    const dni = document.getElementById('edit-dni').value;
    const age = document.getElementById('edit-age').value;

    let course_id = null;
    const courseSelect = document.getElementById('edit-course');
    if (courseSelect) course_id = courseSelect.value;


    try {
        await apiRequest(`/v1/users/${id}`, 'PUT', { full_name, email, role, phone, dni, age, course_id });
        showSuccessModal('Usuario actualizado correctamente.');
        document.getElementById('modal-edit-user').style.display = 'none';
        loadView(role === 'PROFESOR' ? 'professors' : 'students');
    } catch (e) { alert('❌ Error: ' + e.message); }
}

// --- PENDING USERS MANAGEMENT ---
window.checkPendingUsers = async () => {
    try {
        const res = await apiRequest('/v1/users/pending');
        const count = res.data.length;
        const badge = document.getElementById('notif-badge');
        if (count > 0) {
            badge.innerText = count;
            badge.style.display = 'block';
            badge.classList.remove('hidden');
        } else {
            badge.style.display = 'none';
        }
    } catch (e) { console.error('Error checking pending users', e); }
};

window.openPendingUsersModal = async () => {
    // Re-fetch to be sure
    let pending = [];
    try {
        const res = await apiRequest('/v1/users/pending');
        pending = res.data || [];
    } catch (e) { return alert(e.message); }

    let modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:2000; display:flex; justify-content:center; align-items:center;';

    modal.innerHTML = `
        <div class="glass-card" style="width:100%; max-width:600px; height:80vh; display:flex; flex-direction:column; position:relative;">
            <button onclick="this.closest('.modal-overlay').remove()" style="position:absolute; top:1rem; right:1rem; background:none; border:none; color:white; font-size:1.5rem; cursor:pointer;">&times;</button>
            <h3 style="margin-bottom:1.5rem; color:var(--primary);">Solicitudes de Registro (${pending.length})</h3>
            
            <div style="flex:1; overflow-y:auto; padding-right:0.5rem;">
                ${pending.length === 0 ? '<p style="text-align:center; color:gray; margin-top:2rem;">No hay solicitudes pendientes.</p>' : ''}
                ${pending.map(u => `
                    <div class="glass-card" style="margin-bottom:1rem; border:1px solid rgba(255,255,255,0.1); padding:1rem; display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.02);">
                        <div>
                            <div style="font-weight:bold; font-size:1.1rem;">${u.full_name}</div>
                            <div style="color:#94a3b8; font-size:0.9rem;">${u.email}</div>
                            <div style="color:#94a3b8; font-size:0.8rem; margin-top:0.3rem;">📅 ${new Date(u.created_at).toLocaleString()} | 🆔 ${u.dni || 'Sin Cédula'} | 🎂 ${u.age || 'N/A'} años</div>
                        </div>
                        <div style="display:flex; flex-direction:column; gap:0.5rem;">
                            <button class="btn btn-primary" style="padding:0.3rem 0.8rem; font-size:0.8rem;" onclick="approveUserAction(${u.id}, this)">✅ Aprobar</button>
                            <button class="btn btn-danger" style="padding:0.3rem 0.8rem; font-size:0.8rem;" onclick="rejectUserAction(${u.id}, this)">🗑️ Rechazar</button>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div style="text-align:right; margin-top:1rem; border-top:1px solid rgba(255,255,255,0.1); padding-top:1rem;">
                <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cerrar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
};

window.approveUserAction = async (id, btn) => {
    try {
        await apiRequest(`/v1/users/${id}/approve`, 'PUT');
        btn.closest('.glass-card').style.opacity = '0.5';
        btn.parentElement.innerHTML = '<span style="color:#22c55e; font-weight:bold;">Aprobado</span>';
        checkPendingUsers(); // Update badge
        loadView('students'); // Refresh list if open
    } catch (e) { alert(e.message); }
};

window.rejectUserAction = async (id, btn) => {
    if (!confirm('¿Rechazar y eliminar esta solicitud?')) return;
    try {
        await apiRequest(`/v1/users/${id}`, 'DELETE');
        btn.closest('.glass-card').remove();
        checkPendingUsers(); // Update badge
    } catch (e) { alert(e.message); }
};

// --- Course Creation Logic ---
async function showCreateCourseModal() {
    const content = document.getElementById('content-area');

    // Fetch data for dropdowns
    try {
        const [resLangs, resUsers] = await Promise.all([
            apiRequest('/v1/languages'),
            apiRequest('/v1/users')
        ]);

        const langs = resLangs.data || [];
        // Filter only professors
        const teachers = (resUsers.data || []).filter(u => u.role === 'PROFESOR');

        let modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.9); z-index:2000; display:flex; justify-content:center; align-items:center;';

        modal.innerHTML = `
            <div class="glass-card" style="width:100%; max-width:500px; position:relative;">
                <button onclick="this.closest('.modal-overlay').remove()" style="position:absolute; top:1rem; right:1rem; background:none; border:none; color:white; font-size:1.5rem; cursor:pointer;">&times;</button>
                <h3 style="margin-bottom:1.5rem; color:var(--primary);">Crear Nuevo Curso</h3>
                
                <div class="input-group">
                    <label>Nombre del Curso</label>
                    <input type="text" id="new-course-name" placeholder="Ej: Francés A1">
                </div>
                <div class="input-group">
                    <label>Idioma</label>
                    <select id="new-course-lang" style="background:rgba(0,0,0,0.3); color:white; border:1px solid rgba(255,255,255,0.1); padding:0.8rem; border-radius:8px; width:100%;">
                        ${langs.map(l => `<option value="${l.id}">${l.name}</option>`).join('')}
                    </select>
                </div>
                <div class="input-group">
                    <label>Nivel (Opcional)</label>
                    <input type="text" id="new-course-level" placeholder="Ej: B1">
                </div>
                <div class="input-group">
                    <label>Instructor</label>
                    <select id="new-course-instructor" style="background:rgba(0,0,0,0.3); color:white; border:1px solid rgba(255,255,255,0.1); padding:0.8rem; border-radius:8px; width:100%;">
                        ${teachers.map(t => `<option value="${t.id}">${t.full_name}</option>`).join('')}
                    </select>
                </div>
                <div class="input-group">
                    <label>Descripción</label>
                    <textarea id="new-course-desc" rows="3" placeholder="Breve descripción..."></textarea>
                </div>

                <div style="display:flex; justify-content:flex-end; gap:1rem; margin-top:2rem;">
                    <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
                    <button class="btn btn-primary" onclick="createCourseAction()">Crear Curso</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

    } catch (e) { alert(e.message); }
}

window.createCourseAction = async () => {
    const name = document.getElementById('new-course-name').value;
    const langId = document.getElementById('new-course-lang').value;
    const instructorId = document.getElementById('new-course-instructor').value;
    const level = document.getElementById('new-course-level').value;
    const desc = document.getElementById('new-course-desc').value;

    if (!name) return alert('El nombre es obligatorio');

    try {
        await apiRequest('/v1/courses', 'POST', {
            name, language_id: langId, instructor_id: instructorId, level, description: desc
        });
        document.querySelector('.modal-overlay').remove();
        renderDashboard(); // Refresh
    } catch (e) { alert(e.message); }
};

// --- Progress Logic ---
window.loadProgressTab = async (courseId) => {
    try {
        const res = await apiRequest(`/v1/courses/${courseId}/progress`);
        const container = document.getElementById('progress-container');
        const data = res.data;

        if (data.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:gray;">No hay datos de progreso.</p>';
            return;
        }

        const studentData = data[0];

        container.innerHTML = `
            <h2 style="margin-bottom:1.5rem;">Tu Progreso</h2>
            <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap:1.5rem;">
                ${studentData.units.map(u => `
                    <div class="glass-card" style="padding:1.5rem;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; cursor:pointer;" onclick="toggleProgressDetails(${u.unit_id})">
                            <h3 style="margin:0; font-size:1.1rem;">${u.unit_title}</h3>
                            <div style="transform:rotate(0deg); transition:transform 0.3s;" id="arrow-${u.unit_id}">▼</div>
                        </div>
                        
                        <div class="progress-bar-container">
                            <div class="progress-bar bg-${u.status}" style="width:${u.percentage}%"></div>
                            <span style="position:absolute; width:100%; text-align:center; top:0; line-height:20px; color:white; text-shadow:0 0 4px black;">${u.percentage}%</span>
                        </div>

                        <div id="details-${u.unit_id}" style="display:none; margin-top:1.5rem; border-top:1px solid rgba(255,255,255,0.1); padding-top:1rem;">
                            ${u.details.map(d => `
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.8rem; font-size:0.95rem;">
                                    <span style="color:#cbd5e1;">${d.activity_title}</span>
                                    <div style="display:flex; gap:0.5rem; align-items:center;">
                                        <span style="
                                            color:${d.status === 'COMPLETED' ? '#4ade80' : (d.status === 'IN_PROGRESS' ? '#facc15' : 'gray')}; 
                                            font-weight:bold;
                                        ">
                                            ${d.status === 'COMPLETED' ? (d.grade !== null ? d.grade.toFixed(0) + '/100' : 'Completado') :
                (d.status === 'IN_PROGRESS' ? 'En Progreso (' + Math.round(d.progress_percentage || 0) + '%)' : '-')}
                                        </span>
                                        ${d.status === 'COMPLETED' && d.type === 'QUIZ' ?
                `<button onclick="reviewActivity(${d.activity_id})" style="background:rgba(99,102,241,0.2); border:1px solid rgba(99,102,241,0.5); color:white; border-radius:4px; cursor:pointer; font-size:0.7rem; padding:2px 8px; transition:all 0.2s;">Ver Respuestas</button>`
                : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

    } catch (e) { console.error(e); }
};

window.toggleProgressDetails = (uid) => {
    const d = document.getElementById(`details-${uid}`);
    const a = document.getElementById(`arrow-${uid}`);
    if (d.style.display === 'none') {
        d.style.display = 'block';
        a.style.transform = 'rotate(180deg)';
    } else {
        d.style.display = 'none';
        a.style.transform = 'rotate(0deg)';
    }
};

window.reviewActivity = async (actId) => {
    try {
        const res = await apiRequest(`/v1/activities/${actId}`);
        const act = res.data;
        const sub = act.last_submission;

        if (!sub || !sub.content) return alert("No hay respuestas guardadas.");

        let answers = {};
        try { answers = JSON.parse(sub.content); } catch (e) { }

        let modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.9); z-index:2000; display:flex; justify-content:center; align-items:center;';

        modal.innerHTML = `
            <div class="glass-card" style="width:90%; max-width:700px; max-height:85vh; overflow-y:auto; position:relative;">
                <button onclick="this.closest('.modal-overlay').remove()" style="position:absolute; top:1rem; right:1rem; background:none; border:none; color:white; font-size:1.5rem; cursor:pointer;">&times;</button>
                <h2>Resultados: ${act.title}</h2>
                <p style="color:#cbd5e1; margin-bottom:1rem;">Calificación: ${sub.grade}/100</p>
                
                <div style="display:flex; flex-direction:column; gap:2rem;">
                    ${act.questions.map((q, i) => {
            const userAns = answers[q.id];

            return `
                        <div style="background:rgba(255,255,255,0.02); padding:1rem; border-radius:12px;">
                            <p style="font-weight:bold; margin-bottom:0.8rem;">${i + 1}. ${q.text}</p>
                            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:0.5rem;">
                                ${q.options.map(opt => {
                // Styling Logic
                let bg = 'rgba(255,255,255,0.05)';
                let border = '1px solid rgba(255,255,255,0.1)';
                let mark = '';

                // If correct answer
                if (opt.is_correct === 1) {
                    bg = 'rgba(16,185,129,0.2)';
                    border = '1px solid #10b981';
                    mark = ' <span style="color:#34d399; font-weight:bold;">(Correcta)</span>';
                }

                // If user selected this
                if (userAns == opt.id) {
                    if (opt.is_correct === 1) {
                        // Correct match
                        bg = 'rgba(16,185,129,0.3)';
                    } else {
                        // Incorrect choice
                        bg = 'rgba(239,68,68,0.2)';
                        border = '1px solid #ef4444';
                        mark = ' <span style="color:#f87171; font-weight:bold;">(Tu elección)</span>';
                    }
                }

                return `
                                    <div style="background:${bg}; border:${border}; padding:0.8rem; border-radius:8px; font-size:0.95rem;">
                                        ${opt.text} ${mark}
                                    </div>
                                    `;
            }).join('')}
                            </div>
                        </div>
                        `;
        }).join('')}
                </div>
            </div>
        `;
        document.body.appendChild(modal);

    } catch (e) { alert(e.message); }
};


// Global Exports
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.toggleAuth = toggleAuth;
window.logout = logout;
window.loadView = loadView;
window.createUser = createUser;
window.enterCourse = enterCourse;
window.filterCourses = filterCourses;
window.showCreateCourseModal = showCreateCourseModal;

window.deleteUser = deleteUser;
window.resetUserPassword = resetUserPassword;
window.updateUser = updateUser;

// ==========================================
// PLACEMENT TEST MODULE
// ==========================================

window.openPlacementMenu = async (language) => {
    // Check if user is logged in
    if (!currentUser) return alert('Debes iniciar sesión para acceder.');

    // Security check for Students
    if (currentUser.role === 'ESTUDIANTE') {
        return alert('⚠️ No tienes permiso para acceder a esta sección.');
    }

    // Fetch existing tests for this language
    try {
        const res = await apiRequest(`/v1/placement/tests/${language}`);
        const tests = res.data || [];

        // Determine view based on role
        if (currentUser.role === 'ADMIN') {
            renderPlacementAdmin(language, tests);
        } else {
            renderPlacementStudent(language, tests);
        }
    } catch (e) { alert(e.message); }
};

function renderPlacementAdmin(language, tests) {
    const content = document.getElementById('content-area');
    const title = document.getElementById('page-title');
    title.innerText = `Gestión de Pruebas - ${language}`;

    content.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem;">
            <button class="btn btn-secondary" onclick="loadView('home')">⬅ Volver</button>
            <button class="btn btn-primary" onclick="showCreatePlacementTestModal('${language}')">+ Nuevo Cuestionario</button>
        </div>

        <div class="card-grid">
            ${tests.map(t => `
                <div class="glass-card">
                    <h3 style="margin-bottom:0.5rem;">${t.title}</h3>
                    <p style="color:var(--text-muted); margin-bottom:1rem;">${t.description || 'Sin descripción'}</p>
                    <div style="display:flex; flex-wrap:wrap; gap:0.5rem;">
                        <button class="btn btn-primary" onclick="enterTestEditor(${t.id})">Preguntas</button>
                        <button class="btn btn-secondary" onclick="openEditTestModal(${JSON.stringify(t).replace(/"/g, '&quot;')})">Editar Info</button>
                        <button class="btn btn-danger" onclick="deletePlacementTest(${t.id}, '${language}')">Eliminar</button>
                        <button class="btn btn-secondary" onclick="enterTestTaker(${t.id})">Vista Previa</button>
                    </div>
                </div>
            `).join('')}
            ${tests.length === 0 ? '<p style="grid-column:1/-1; text-align:center; padding:2rem; color:gray;">No hay pruebas creadas para este idioma.</p>' : ''}
        </div>
    `;
}

window.deletePlacementTest = async (testId, language) => {
    if (!confirm('¿Estás seguro de eliminar este cuestionario completo?')) return;
    try {
        await apiRequest(`/v1/placement/test/${testId}`, 'DELETE');
        openPlacementMenu(language);
    } catch (e) { alert(e.message); }
};

window.openEditTestModal = (test) => {
    let modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.8); z-index:2000; display:flex; justify-content:center; align-items:center;';
    modal.innerHTML = `
        <div class="glass-card" style="width:100%; max-width:400px; position:relative;">
            <button onclick="this.closest('.modal-overlay').remove()" style="position:absolute; top:1rem; right:1rem; background:none; border:none; color:white; font-size:1.5rem; cursor:pointer;">&times;</button>
            <h3 style="margin-bottom:1.5rem; color:var(--primary);">Editar Cuestionario</h3>
            <div class="input-group">
                <label>Título</label>
                <input id="edit-pt-title" value="${test.title}">
            </div>
            <div class="input-group">
                <label>Descripción</label>
                <input id="edit-pt-desc" value="${test.description || ''}">
            </div>
            <button class="btn btn-primary" style="width:100%" onclick="updatePlacementTest(${test.id}, '${test.language}', this)">Guardar Cambios</button>
        </div>
    `;
    document.body.appendChild(modal);
};

window.updatePlacementTest = async (testId, language, btn) => {
    const title = document.getElementById('edit-pt-title').value;
    const description = document.getElementById('edit-pt-desc').value;
    if (!title) return alert('El título es obligatorio');

    try {
        await apiRequest(`/v1/placement/test/${testId}`, 'PUT', { title, description });
        btn.closest('.modal-overlay').remove();
        openPlacementMenu(language);
    } catch (e) { alert(e.message); }
};

function renderPlacementStudent(language, tests) {
    const content = document.getElementById('content-area');
    const title = document.getElementById('page-title');
    title.innerText = `Pruebas de Ubicación - ${language}`;

    content.innerHTML = `
        <button class="btn btn-secondary" style="margin-bottom:2rem;" onclick="loadView('home')">⬅ Volver</button>
        <div class="card-grid">
            ${tests.map(t => `
                <div class="glass-card">
                    <h3 style="margin-bottom:0.5rem;">${t.title}</h3>
                    <p style="color:var(--text-muted); margin-bottom:1rem;">${t.description || ''}</p>
                    <button class="btn btn-primary" style="width:100%" onclick="enterTestTaker(${t.id})">Comenzar Prueba</button>
                </div>
            `).join('')}
            ${tests.length === 0 ? '<p style="grid-column:1/-1; text-align:center; padding:2rem; color:gray;">No hay pruebas disponibles por el momento.</p>' : ''}
        </div>
    `;
}

window.showCreatePlacementTestModal = (language) => {
    let modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.8); z-index:2000; display:flex; justify-content:center; align-items:center;';
    modal.innerHTML = `
        <div class="glass-card" style="width:100%; max-width:400px; position:relative;">
            <button onclick="this.closest('.modal-overlay').remove()" style="position:absolute; top:1rem; right:1rem; background:none; border:none; color:white; font-size:1.5rem; cursor:pointer;">&times;</button>
            <h3 style="margin-bottom:1.5rem; color:var(--primary);">Crear Cuestionario (${language})</h3>
            <div class="input-group">
                <label>Título</label>
                <input id="pt-title" placeholder="Ej. Placement Test A1">
            </div>
            <div class="input-group">
                <label>Descripción</label>
                <input id="pt-desc" placeholder="Breve descripción...">
            </div>
            <button class="btn btn-primary" style="width:100%" onclick="createPlacementTest('${language}', this)">Crear</button>
        </div>
    `;
    document.body.appendChild(modal);
};

window.createPlacementTest = async (language, btn) => {
    const title = document.getElementById('pt-title').value;
    const description = document.getElementById('pt-desc').value;
    if (!title) return alert('El título es obligatorio');

    try {
        await apiRequest('/v1/placement/tests', 'POST', { language, title, description });
        btn.closest('.modal-overlay').remove();
        openPlacementMenu(language); // Reload
    } catch (e) { alert(e.message); }
};

window.enterTestEditor = async (testId) => {
    try {
        const res = await apiRequest(`/v1/placement/test/${testId}`);
        const test = res.data;
        const content = document.getElementById('content-area');
        const title = document.getElementById('page-title');
        title.innerText = `Editando: ${test.title}`;

        content.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:2rem;">
                <button class="btn btn-secondary" onclick="openPlacementMenu('${test.language}')">⬅ Volver</button>
                <button class="btn btn-primary" onclick="showAddQuestionModal(${testId})">+ Agregar Pregunta</button>
            </div>
            
            <div id="questions-list" style="display:flex; flex-direction:column; gap:1.5rem;">
                ${renderQuestionsEditor(test.questions)}
            </div>
        `;
    } catch (e) { alert(e.message); }
};

function renderQuestionsEditor(questions) {
    if (!questions || questions.length === 0) return '<p style="text-align:center; color:gray;">No hay preguntas aún.</p>';

    return questions.map((q, idx) => `
        <div class="glass-card">
            <div style="display:flex; justify-content:space-between; margin-bottom:1rem;">
                <strong>Pregunta ${idx + 1}</strong>
                <button class="btn btn-danger" style="padding:0.2rem 0.5rem; font-size:0.8rem;" onclick="deleteQuestion(${q.id}, ${q.test_id})">Eliminar</button>
            </div>
            <p style="font-size:1.1rem; margin-bottom:1rem;">${q.question_text}</p>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:0.5rem;">
                ${q.options.map(opt => `
                    <div style="padding:0.5rem; border:1px solid ${opt.is_correct ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}; border-radius:4px; background:${opt.is_correct ? 'rgba(99,102,241,0.1)' : 'transparent'}">
                        ${opt.is_correct ? '✅' : '⚪'} ${opt.option_text}
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

window.showAddQuestionModal = (testId) => {
    let modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.8); z-index:2000; display:flex; justify-content:center; align-items:center;';

    // HTML for 4 options by default
    const optionsHtml = [1, 2, 3, 4].map(i => `
        <div style="display:flex; gap:0.5rem; align-items:center; margin-bottom:0.5rem;">
            <input type="radio" name="correct-opt" value="${i - 1}" ${i === 1 ? 'checked' : ''}>
            <input type="text" class="opt-text" placeholder="Opción ${i}" style="flex:1; padding:0.5rem; border-radius:4px; border:none;">
        </div>
    `).join('');

    modal.innerHTML = `
        <div class="glass-card" style="width:100%; max-width:500px; position:relative;">
            <button onclick="this.closest('.modal-overlay').remove()" style="position:absolute; top:1rem; right:1rem; background:none; border:none; color:white; font-size:1.5rem; cursor:pointer;">&times;</button>
            <h3 style="margin-bottom:1rem; color:var(--primary);">Agregar Pregunta</h3>
            
            <div class="input-group">
                <label>Texto de la Pregunta</label>
                <textarea id="new-q-text" rows="3" style="width:100%; background:rgba(0,0,0,0.2); color:white; border:1px solid rgba(255,255,255,0.1); padding:0.5rem;"></textarea>
            </div>
            
            <label style="display:block; margin-bottom:0.5rem; font-size:0.9rem;">Opciones (Marca la correcta)</label>
            <div id="new-q-opts">${optionsHtml}</div>

            <button class="btn btn-primary" style="width:100%; margin-top:1rem;" onclick="saveQuestion(${testId}, this)">Guardar Pregunta</button>
        </div>
    `;
    document.body.appendChild(modal);
};

window.saveQuestion = async (testId, btn) => {
    const text = document.getElementById('new-q-text').value;
    if (!text) return alert('Escribe la pregunta');

    const optInputs = document.querySelectorAll('.opt-text');
    const radioInputs = document.querySelectorAll('input[name="correct-opt"]');

    const options = [];
    let hasCorrect = false;

    optInputs.forEach((input, idx) => {
        if (input.value.trim()) {
            const isCorrect = radioInputs[idx].checked;
            if (isCorrect) hasCorrect = true;
            options.push({ text: input.value, isCorrect });
        }
    });

    if (options.length < 2) return alert('Agrega al menos 2 opciones');
    // if (!hasCorrect) return alert('Selecciona la respuesta correcta'); // Radio always has one checked by default but good check

    try {
        await apiRequest(`/v1/placement/test/${testId}/questions`, 'POST', { questionText: text, options });
        btn.closest('.modal-overlay').remove();
        enterTestEditor(testId); // Reload
    } catch (e) { alert(e.message); }
};

window.deleteQuestion = async (qId, testId) => {
    if (!confirm('¿Borrar pregunta?')) return;
    try {
        await apiRequest(`/v1/placement/question/${qId}`, 'DELETE');
        enterTestEditor(testId);
    } catch (e) { alert(e.message); }
};

window.enterTestTaker = async (testId) => {
    try {
        const res = await apiRequest(`/v1/placement/test/${testId}`);
        const test = res.data;
        const content = document.getElementById('content-area');
        const title = document.getElementById('page-title');
        title.innerText = `Prueba: ${test.title}`;

        // Render Test Form
        content.innerHTML = `
            <div style="max-width:800px; margin:0 auto;">
                <div class="glass-card" style="margin-bottom:2rem;">
                    <p>${test.description || 'Responde todas las preguntas.'}</p>
                </div>
                
                <form id="test-form">
                    ${test.questions.map((q, idx) => `
                        <div class="glass-card" style="margin-bottom:1.5rem;">
                            <p style="font-size:1.1rem; margin-bottom:1rem; font-weight:bold;">${idx + 1}. ${q.question_text}</p>
                            <div style="display:flex; flex-direction:column; gap:0.5rem;">
                                ${q.options.map(opt => `
                                    <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer; padding:0.5rem; border-radius:4px; transition:background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='transparent'">
                                        <input type="radio" name="q_${q.id}" value="${opt.id}" required>
                                        <span>${opt.option_text}</span>
                                    </label>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}

                    ${test.questions.length > 0 ?
                `<button type="button" class="btn btn-primary" style="width:100%; font-size:1.2rem; padding:1rem;" onclick="submitTest(${testId})">Enviar Respuestas</button>`
                : '<p>No hay preguntas.</p>'
            }
                </form>
            </div>
        `;
    } catch (e) { alert(e.message); }
};

window.submitTest = async (testId) => {
    const form = document.getElementById('test-form');
    // Gather answers
    const answers = {};
    const formData = new FormData(form); // Actually FormData doesn't work easily with multiple radios unless named well
    // Easier manual collection
    const questions = form.querySelectorAll('input[type="radio"]:checked');

    // Check if all answered? Not strictly required but good UX. 
    // The browser 'required' attr works on submit, but we are using JS.

    questions.forEach(q => {
        const qId = q.name.replace('q_', '');
        answers[qId] = q.value;
    });

    try {
        const res = await apiRequest(`/v1/placement/test/${testId}/submit`, 'POST', { answers });
        if (res.success) {
            showTestResult(res.score, res.correctCount, res.total);
        }
    } catch (e) { alert(e.message); }
};

window.showTestResult = (score, correct, total) => {
    const content = document.getElementById('content-area');
    const color = score >= 70 ? '#22c55e' : '#ef4444';

    content.innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:60vh; text-align:center;">
            <div class="glass-card" style="padding:4rem 2rem; max-width:500px; width:100%;">
                <h2 style="font-size:3rem; margin-bottom:1rem;">Resultado</h2>
                <div style="font-size:6rem; font-weight:900; color:${color}; margin-bottom:1rem;">
                    ${Math.round(score)}/100
                </div>
                <p style="font-size:1.2rem; margin-bottom:2rem;">
                    Has respondido correctamente <strong>${correct}</strong> de <strong>${total}</strong> preguntas.
                </p>
                
                <button class="btn btn-primary" onclick="loadView('home')">Volver al Inicio</button>
            </div>
        </div>
    `;
};

// ==========================================
// COURSE ACTIVITIES & QUIZZES
// ==========================================

window.showCreateUnitModal = (courseId) => {
    let modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.8); z-index:2000; display:flex; justify-content:center; align-items:center;';
    modal.innerHTML = `
        <div class="glass-card" style="width:100%; max-width:400px; position:relative;">
            <button onclick="this.closest('.modal-overlay').remove()" style="position:absolute; top:1rem; right:1rem; background:none; border:none; color:white; font-size:1.5rem; cursor:pointer;">&times;</button>
            <h3 style="margin-bottom:1.5rem; color:var(--primary);">Nueva Unidad</h3>
            <div class="input-group">
                <label>Título de la Unidad</label>
                <input id="new-unit-title" placeholder="Ej. Unidad 1: Verbos Básicos">
            </div>
            <div class="input-group">
                <label>Orden</label>
                <input type="number" id="new-unit-order" value="1">
            </div>
            <button class="btn btn-primary" style="width:100%" onclick="createUnit(${courseId}, this)">Crear Unidad</button>
        </div>
    `;
    document.body.appendChild(modal);
};


window.createUnit = async (courseId, btn) => {
    const title = document.getElementById('new-unit-title').value;
    const order = document.getElementById('new-unit-order').value;
    if (!title) return alert('Título requerido');

    try {
        await apiRequest('/v1/units', 'POST', { course_id: courseId, title, order_index: order });
        if (btn && btn.closest) btn.closest('.modal-overlay').remove();
        enterCourse(courseId); // Reload
    } catch (e) { alert(e.message); }
};

window.scaffoldUnits = async (courseId, silent = false) => {
    if (!silent && !confirm('¿Completar la estructura de unidades (0-6 + Examen)?')) return;
    try {
        const fullUnits = [
            'Unité 1: Salutations',
            'Unité 2: La Famille',
            'Unité 3: Les Loisirs',
            'Unité 4: La Ville',
            'Unité 5: Au Restaurant',
            'Unité 6: Le Futur',
            'Examen A1'
        ];

        // 1. Get existing units to avoid duplicates
        const res = await apiRequest(`/v1/courses/${courseId}`);
        const existingUnits = res.data.units || [];
        const existingTitles = existingUnits.map(u => u.title);

        let order = existingUnits.length > 0 ? (Math.max(...existingUnits.map(u => u.order_index)) + 1) : 0;
        let createdCount = 0;

        for (const title of fullUnits) {
            // Check if unit number already exists (e.g. "Unité 1" matches "Unité 1: Salutations")
            const baseTitle = title.includes(':') ? title.split(':')[0] : title;
            const alreadyExists = existingTitles.some(t => t.startsWith(baseTitle));

            if (!alreadyExists) {
                await apiRequest('/v1/units', 'POST', { course_id: courseId, title, order_index: order++ });
                createdCount++;
            }
        }

        if (!silent) {
            if (createdCount > 0) alert(`Se han añadido ${createdCount} nuevas unidades.`);
            else alert('La estructura ya está completa.');
            enterCourse(courseId);
        } else if (createdCount > 0) {
            enterCourse(courseId);
        }
    } catch (e) { if (!silent) alert(e.message); }
};

let tempQuizQuestions = [];

window.toggleUnitMenu = (id) => {
    const menu = document.getElementById(`unit-menu-${id}`);
    if (menu) menu.classList.toggle('hidden');
    // Close others
    document.querySelectorAll('[id^="unit-menu-"]').forEach(el => {
        if (el.id !== `unit-menu-${id}`) el.classList.add('hidden');
    });
};

window.editUnit = async (id, currentTitle) => {
    const newTitle = prompt('Nuevo nombre de la unidad:', currentTitle);
    if (!newTitle || newTitle === currentTitle) return;
    try {
        await apiRequest(`/v1/units/${id}`, 'PUT', { title: newTitle });
        // Reload current view
        const activeCourse = document.querySelector('.course-card button')?.getAttribute('onclick')?.match(/\d+/)?.[0];
        // Or cleaner: store currentCourseId globally or just grab it from DOM if simple
        // Since we are inside the course view, we can just reload it if we have ID.
        // Actually, we are inside enterCourse(courseId), but this function is global.
        // We passed courseId to deleteUnit, but not editUnit.
        // Let's rely on reload or just simple alert.Ideally we reload.
        // Quick hack: click 'Actividades' or re-call enterCourse if possible.
        alert('Unidad actualizada.');
        // Try to find the course ID from the "Nueva Unidad" button which has it
        const backBtn = document.querySelector('button[onclick^="showCreateUnitModal"]');
        if (backBtn) {
            const cId = backBtn.getAttribute('onclick').match(/\d+/)[0];
            enterCourse(cId);
        }
    } catch (e) { alert(e.message); }
};

window.deleteUnit = async (id, courseId) => {
    if (!confirm('¿Estás seguro de borrar esta unidad? Se borrarán todas sus actividades y notas.')) return;
    try {
        await apiRequest(`/v1/units/${id}`, 'DELETE');
        enterCourse(courseId);
    } catch (e) { alert(e.message); }
};

window.showCreateActivityModal = (unitId) => {
    tempQuizQuestions = [];
    let modal = document.createElement('div');
    modal.id = 'modal-create-activity';
    modal.className = 'modal-overlay';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.8); z-index:2000; display:flex; justify-content:center; align-items:center;';
    modal.innerHTML = `
        <div class="glass-card" style="width:100%; max-width:600px; position:relative; max-height:90vh; overflow-y:auto; background:#0f172a; border:1px solid rgba(255,255,255,0.1);">
            <button onclick="this.closest('.modal-overlay').remove()" style="position:absolute; top:1rem; right:1rem; background:none; border:none; color:white; font-size:1.5rem; cursor:pointer;">&times;</button>
            <h3 style="margin-bottom:1.5rem; color:var(--primary);">Crear Cuestionario</h3>
            
            <div class="input-group">
                <label>Título del Cuestionario</label>
                <input id="act-title" placeholder="Ej. Quiz de Vocabulario" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:white;">
            </div>
            
            <div style="display:none;">
                <select id="act-type"><option value="QUIZ">Quiz</option></select>
                <textarea id="act-desc">Evaluación</textarea>
                <input id="act-score" value="100">
            </div>

            <div style="margin-top:2rem; border-top:1px solid rgba(255,255,255,0.1); padding-top:1rem;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                    <h4 style="color:white; margin:0;">Preguntas</h4>
                    <button class="btn btn-secondary" onclick="openQuestionModal()" style="font-size:0.9rem;">+ Agregar Pregunta</button>
                </div>
                
                <div id="quiz-questions-list" style="display:flex; flex-direction:column; gap:0.5rem; margin-bottom:2rem; min-height:50px;">
                    <p style="color:gray; font-size:0.9rem; text-align:center; padding:1rem;">No hay preguntas añadidas aún.</p>
                </div>
            </div>

            <button class="btn btn-primary" style="width:100%; padding:1rem;" onclick="createActivity(${unitId})">Guardar Cuestionario Completo</button>
        </div>
    `;
    document.body.appendChild(modal);
};

window.openQuestionModal = () => {
    let qModal = document.createElement('div');
    qModal.className = 'modal-overlay';
    qModal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:2200; display:flex; justify-content:center; align-items:center;';
    qModal.innerHTML = `
        <div class="glass-card" style="width:100%; max-width:600px; background:#1e293b; border-radius:16px; padding:2rem; position:relative; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); border:1px solid rgba(255,255,255,0.05);">
            <button onclick="this.closest('.modal-overlay').remove()" style="position:absolute; top:1.5rem; right:1.5rem; background:none; border:none; color:white; font-size:2rem; cursor:pointer; line-height:1;">&times;</button>
            
            <h3 style="margin-bottom:1.5rem; color:#818cf8; font-size:1.5rem; font-weight:700;">Agregar Pregunta</h3>
            
            <label style="color:#94a3b8; display:block; margin-bottom:0.5rem; font-size:0.95rem;">Texto de la Pregunta</label>
            <textarea id="q-text-modal" rows="3" style="width:100%; background:#0f172a; border:1px solid #334155; border-radius:8px; padding:1rem; color:white; margin-bottom:2rem; resize:none; font-size:1rem;" placeholder="Escribe tu pregunta..."></textarea>
            
            <label style="color:#94a3b8; display:block; margin-bottom:0.8rem; font-size:0.95rem;">Opciones (Marca la correcta)</label>
            <div style="display:flex; flex-direction:column; gap:1rem; margin-bottom:2.5rem;">
                ${[1, 2, 3, 4].map(i => `
                    <div style="display:flex; align-items:center; gap:1rem;">
                        <input type="radio" name="correct-opt-modal" value="${i - 1}" style="transform:scale(1.3); cursor:pointer; accent-color:#6366f1;">
                        <input class="opt-input-modal" placeholder="Opción ${i}" style="flex:1; background:white; border:none; border-radius:8px; padding:0.8rem 1rem; color:#0f172a; font-weight:500; font-size:1rem;">
                    </div>
                `).join('')}
            </div>

            <button class="btn btn-primary" style="width:100%; padding:1rem; background:#6366f1; border-radius:10px; font-weight:700; font-size:1.1rem; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4); border:none; color:white; cursor:pointer; transition:all 0.2s;" 
            onmouseover="this.style.background='#4f46e5'; this.style.transform='translateY(-2px)'"
            onmouseout="this.style.background='#6366f1'; this.style.transform='translateY(0)'"
            onclick="saveQuestionFromModal(this)">Guardar Pregunta</button>
        </div>
    `;
    document.body.appendChild(qModal);
};

window.saveQuestionFromModal = (btn) => {
    const text = document.getElementById('q-text-modal').value;
    const opts = document.querySelectorAll('.opt-input-modal');
    const correctRadio = document.querySelector('input[name="correct-opt-modal"]:checked');

    if (!text) return alert('Falta el texto de la pregunta');
    if (!correctRadio) return alert('Selecciona la opción correcta');

    let options = [];
    let allFilled = true;
    opts.forEach((inp, idx) => {
        if (!inp.value.trim()) allFilled = false;
        options.push({ text: inp.value, isCorrect: idx == correctRadio.value });
    });

    if (!allFilled) return alert('Completa todas las opciones');

    tempQuizQuestions.push({ text, options });
    renderQuizPreview();
    btn.closest('.modal-overlay').remove();
};

window.renderQuizPreview = () => {
    const list = document.getElementById('quiz-questions-list');
    if (tempQuizQuestions.length === 0) {
        list.innerHTML = '<p style="color:gray; font-size:0.9rem; text-align:center; padding:1rem;">No hay preguntas añadidas aún.</p>';
        return;
    }
    list.innerHTML = tempQuizQuestions.map((q, i) => `
        <div style="background:rgba(255,255,255,0.05); padding:1rem; border-radius:8px; border:1px solid rgba(255,255,255,0.05); display:flex; justify-content:space-between; align-items:center;">
            <div>
                <div style="font-weight:bold; color:white; margin-bottom:0.3rem;">${i + 1}. ${q.text}</div>
                <div style="font-size:0.85rem; color:#818cf8;">Correcta: ${q.options.find(o => o.isCorrect).text}</div>
            </div>
            <button onclick="removeTempQuestion(${i})" style="background:none; border:none; color:#f87171; cursor:pointer; font-size:1.2rem;">&times;</button>
        </div>
    `).join('');
};

window.removeTempQuestion = (idx) => {
    tempQuizQuestions.splice(idx, 1);
    renderQuizPreview();
};

window.createActivity = async (unitId) => {
    const title = document.getElementById('act-title').value;

    if (!title) return showToast('Título requerido', 'error');
    if (tempQuizQuestions.length === 0) return showToast('Añade al menos una pregunta', 'error');

    const data = {
        unit_id: unitId,
        title,
        description: 'Evaluación de unidad',
        type: 'QUIZ',
        max_score: 100,
        due_date: null,
        questions: tempQuizQuestions
    };

    try {
        await apiRequest('/v1/activities', 'POST', data);
        document.getElementById('modal-create-activity').remove();
        showToast('Cuestionario creado', 'success');
        reloadContext();
    } catch (e) { showToast(e.message, 'error'); }
};

window.deleteActivity = async (id) => {
    if (!await showConfirm('¿Estás seguro de eliminar esta actividad? Se borrarán todos los progresos asociados.')) return;
    try {
        await apiRequest(`/v1/activities/${id}`, 'DELETE');
        showToast('Actividad eliminada', 'success');
        reloadContext();
    } catch (e) { showToast(e.message, 'error'); }
};

// State variables for quiz wizard
let currentQuizState = {
    activityId: null,
    questions: [],
    answers: {},
    currentQuestionIndex: 0
};

window.openActivity = async (actId) => {
    try {
        const res = await apiRequest(`/v1/activities/${actId}`);
        const act = res.data;
        const sub = act.last_submission;

        // Check for completed submission (Retake Logic)
        if (sub && sub.status === 'COMPLETED' && currentUser.role === 'ESTUDIANTE') {
            if (!await showConfirm(`Ya completaste esta actividad con una nota de ${(sub.grade || 0).toFixed(2)}%.\n\n¿Quieres volver a intentarlo?\nNOTA: Tu progreso anterior será reemplazado.`)) {
                return;
            }
        }

        let modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'activity-modal';
        modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.9); z-index:2000; display:flex; justify-content:center; align-items:center;';

        // Prepare content
        if (act.type === 'QUIZ') {
            // Initialize State
            currentQuizState = {
                activityId: act.id,
                questions: act.questions,
                answers: {},
                currentQuestionIndex: 0
            };

            // Load saved answers if IN_PROGRESS
            if (sub && sub.content) {
                try {
                    currentQuizState.answers = JSON.parse(sub.content);
                    // Find first unanswered question or last
                    const questionIds = act.questions.map(q => q.id.toString());
                    for (let i = 0; i < questionIds.length; i++) {
                        if (!currentQuizState.answers[questionIds[i]]) {
                            currentQuizState.currentQuestionIndex = i;
                            break;
                        }
                    }
                } catch (e) { console.error("Error loading saved answers", e); }
            }

            modal.innerHTML = `
                <div class="glass-card" style="width:90%; max-width:700px; height:80vh; display:flex; flex-direction:column; position:relative;">
                    <button onclick="pauseAndExit()" style="position:absolute; top:1rem; right:1rem; background:none; border:none; color:white; font-size:1.5rem; cursor:pointer;">&times;</button>
                    
                    <div style="margin-bottom:1rem; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:1rem;">
                        <div style="font-size:0.8rem; color:var(--primary); text-transform:uppercase;">${act.type}</div>
                        <h2 style="margin:0.5rem 0;">${act.title}</h2>
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span style="color:gray; font-size:0.9rem;">Pregunta <span id="q-indicator">1</span> de ${act.questions.length}</span>
                            <div>
                                ${currentUser.role !== 'ESTUDIANTE' ?
                    `<button class="btn btn-secondary" style="font-size:0.8rem; padding:0.4rem 0.8rem; margin-right:0.5rem;" onclick="document.getElementById('activity-modal').remove(); editActivity(${act.id})">✏️ Editar</button>`
                    : ''}
                                <button class="btn btn-secondary" onclick="pauseAndExit()" style="font-size:0.8rem; padding:0.4rem 0.8rem;">
                                    ${currentUser.role === 'ESTUDIANTE' ? '⏸ Pausar y Guardar' : '✖ Salir (Sin guardar)'}
                                </button>
                            </div>
                        </div>
                    </div>
                    <div id="quiz-wizard-body" style="flex:1; overflow-y:auto; display:flex; flex-direction:column; justify-content:center; padding:1rem;">
                        <!-- Question Rendered Here -->
                    </div>

                    <div style="margin-top:auto; padding-top:1rem; border-top:1px solid rgba(255,255,255,0.1); display:flex; justify-content:space-between;">
                        <button id="btn-prev" class="btn btn-secondary" onclick="changeQuestion(-1)" disabled>Anterior</button>
                        <button id="btn-next" class="btn btn-primary" onclick="changeQuestion(1)">Siguiente</button>
                        <button id="btn-finish" class="btn btn-success hidden" onclick="finishQuiz()">Finalizar</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            renderQuizStep();

        } else {
            // Normal view for other activity types
            modal.innerHTML = `
                <div class="glass-card" style="width:90%; max-width:700px; max-height:90vh; overflow-y:auto; position:relative;">
                    <button onclick="this.closest('.modal-overlay').remove()" style="position:absolute; top:1rem; right:1rem; background:none; border:none; color:white; font-size:1.5rem; cursor:pointer;">&times;</button>
                    <h2 style="margin-bottom:1rem;">${act.title}</h2>
                    <p style="white-space:pre-wrap; margin-bottom:2rem;">${act.description}</p>
                    
                    <label>Tu Respuesta / Enlace</label>
                    <textarea id="submission-content" rows="5" style="width:100%; padding:1rem; border-radius:8px; margin-bottom:1rem; background:rgba(0,0,0,0.3); color:white;" placeholder="Escribe tu respuesta...">${sub ? sub.content : ''}</textarea>
                    
                    ${currentUser.role === 'ESTUDIANTE' ? `
                        <button class="btn btn-primary" style="width:100%;" onclick="submitRegularActivity(${act.id})">Entregar Actividad</button>
                    ` : ''}
                </div>
            `;
            document.body.appendChild(modal);
        }

    } catch (e) { alert(e.message); }
};

window.renderQuizStep = () => {
    const qIndex = currentQuizState.currentQuestionIndex;
    const question = currentQuizState.questions[qIndex];
    const container = document.getElementById('quiz-wizard-body');
    const qIds = currentQuizState.questions.map(q => q.id);

    // Update Indicators
    document.getElementById('q-indicator').innerText = qIndex + 1;

    // Buttons state
    document.getElementById('btn-prev').disabled = qIndex === 0;
    if (qIndex === currentQuizState.questions.length - 1) {
        document.getElementById('btn-next').classList.add('hidden');
        document.getElementById('btn-finish').classList.remove('hidden');
    } else {
        document.getElementById('btn-next').classList.remove('hidden');
        document.getElementById('btn-finish').classList.add('hidden');
    }

    // Render Question
    const savedVal = currentQuizState.answers[question.id] || '';

    container.innerHTML = `
        <div style="font-size:1.2rem; margin-bottom:1.5rem; font-weight:bold; color:white;">
            ${question.text}
        </div>
        <div style="display:flex; flex-direction:column; gap:0.8rem;">
            ${question.options.map(opt => `
                <label class="option-card ${savedVal == opt.id ? 'selected' : ''}" 
                    style="
                        background:${savedVal == opt.id ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)'}; 
                        border:1px solid ${savedVal == opt.id ? 'var(--primary)' : 'rgba(255,255,255,0.1)'};
                        padding:1rem; border-radius:12px; cursor:pointer; display:flex; align-items:center; gap:1rem; transition:all 0.2s;
                    "
                    onclick="selectOption(${question.id}, ${opt.id}, this)"
                >
                    <div style="
                        width:20px; height:20px; border-radius:50%; 
                        border:2px solid ${savedVal == opt.id ? 'var(--primary)' : 'gray'};
                        background:${savedVal == opt.id ? 'var(--primary)' : 'transparent'};
                    "></div>
                    <span style="font-size:1.05rem;">${opt.text}</span>
                </label>
            `).join('')}
        </div>
    `;
};

window.selectOption = (qId, optId, element) => {
    // UI Update
    document.querySelectorAll('.option-card').forEach(el => {
        el.style.background = 'rgba(255,255,255,0.05)';
        el.style.borderColor = 'rgba(255,255,255,0.1)';
        el.querySelector('div').style.background = 'transparent';
        el.querySelector('div').style.borderColor = 'gray';
    });

    element.style.background = 'rgba(99,102,241,0.2)';
    element.style.borderColor = 'var(--primary)';
    element.querySelector('div').style.background = 'var(--primary)';
    element.querySelector('div').style.borderColor = 'var(--primary)';

    // Save state
    currentQuizState.answers[qId] = optId;
};

window.changeQuestion = (delta) => {
    currentQuizState.currentQuestionIndex += delta;
    renderQuizStep();
};

window.pauseAndExit = async () => {
    if (currentUser.role !== 'ESTUDIANTE') {
        document.getElementById('activity-modal').remove();
        return;
    }
    try {
        await apiRequest('/v1/submit', 'POST', {
            activity_id: currentQuizState.activityId,
            content: JSON.stringify(currentQuizState.answers),
            status: 'IN_PROGRESS'
        });
        document.getElementById('activity-modal').remove();
    } catch (e) { showToast('Error guardando progreso: ' + e.message, 'error'); }
};

window.finishQuiz = async () => {
    // Validate all answered?
    const answeredCount = Object.keys(currentQuizState.answers).length;
    const total = currentQuizState.questions.length;

    if (answeredCount < total) {
        if (!await showConfirm(`Has respondido ${answeredCount} de ${total} preguntas. ¿Seguro que quieres finalizar?`)) return;
    }

    if (currentUser.role !== 'ESTUDIANTE') {
        // Admin Simulation
        let score = 0;
        currentQuizState.questions.forEach(q => {
            const ans = currentQuizState.answers[q.id];
            const correct = q.options.find(o => o.isCorrect);
            if (ans == correct.id) score++;
        });
        const pct = (score / total) * 100;
        await showConfirm(`[MODO PRUEBA ADMIN]\nTu calificación simulada sería: ${pct.toFixed(2)}%\n\nNo se ha guardado nada en la base de datos.`);
        document.getElementById('activity-modal').remove();
        return;
    }

    try {
        const res = await apiRequest('/v1/submit', 'POST', {
            activity_id: currentQuizState.activityId,
            content: JSON.stringify(currentQuizState.answers),
            status: 'COMPLETED'
        });

        if (res.grade !== undefined) {
            alert(`¡Cuestionario finalizado!\nTu calificación: ${res.grade.toFixed(2)}%`);
        } else {
            alert('Cuestionario entregado.');
        }
        document.getElementById('activity-modal').remove();

        // Reload unit details if open, or course view check?
        // Soft refresh
        setTimeout(() => reloadContext(), 500);

    } catch (e) { showToast(e.message, 'error'); }
};

window.submitRegularActivity = async (actId) => {
    const content = document.getElementById('submission-content').value;
    if (!content) return alert('Escribe algo.');
    try {
        await apiRequest('/v1/submit', 'POST', { activity_id: actId, content, status: 'COMPLETED' });
        alert('Actividad entregada');
        document.querySelector('.modal-overlay').remove();
    } catch (e) { alert(e.message); }
};

window.renderUnits = (units) => {
    if (!units || units.length === 0) return '<div class="glass-card"><p>No hay unidades en este curso.</p></div>';

    return `
        <div class="card-grid">
            ${units.map(u => {
        // Progress Logic
        const pct = u.progress_percentage !== undefined ? Math.round(u.progress_percentage) : 0;
        let progressBarColor = "#3b82f6"; // default blue
        if (pct >= 100) progressBarColor = "#22c55e"; // green
        if (pct > 0 && pct < 100) progressBarColor = "#eab308"; // yellow/orange

        // Check active submission (for button style)
        let hasActive = false;
        if (u.activities) {
            hasActive = u.activities.some(a => a.user_submission && a.user_submission.status === 'IN_PROGRESS');
        }

        return `
                <div class="glass-card" style="position:relative; display:flex; flex-direction:column; justify-content:space-between; min-height:220px;">
                    <!-- Edit/Delete for Admin -->
                    ${currentUser.role === 'ADMIN' || currentUser.role === 'PROFESOR' ?
                `<div style="position:absolute; top:1rem; right:1rem;">
                        <button onclick="editUnit(${u.id})" style="background:rgba(0,0,0,0.5); border:none; color:white; border-radius:50%; width:30px; height:30px; cursor:pointer; margin-right:5px;">✏️</button>
                        <button onclick="deleteUnit(${u.id})" style="background:rgba(0,0,0,0.5); border:none; color:#ef4444; border-radius:50%; width:30px; height:30px; cursor:pointer;">🗑️</button>
                    </div>` : ''}

                    <div style="margin-bottom:1rem;">
                        <h3 style="font-size:1.4rem; margin-bottom:0.5rem; color:white;">${u.title}</h3>
                        <p style="color:#cbd5e1; font-size:0.9rem; line-height:1.4;">${u.description || 'Sin descripción'}</p>
                    </div>
                    
                    <div style="margin-top:auto;">
                         <!-- Progress Bar -->
                        <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem; font-size:0.8rem; color:#94a3b8; font-weight:bold;">
                            <span>Progreso</span>
                            <span>${pct}/100%</span>
                        </div>
                        <div style="background:rgba(255,255,255,0.1); height:8px; border-radius:4px; overflow:hidden; margin-bottom:1.5rem;">
                            <div style="background:${progressBarColor}; width:${pct}%; height:100%; transition:width 0.5s ease-out;"></div>
                        </div>

                        <button class="btn btn-primary" style="width:100%; padding:0.8rem; font-weight:bold; box-shadow:0 4px 6px rgba(0,0,0,0.2); ${hasActive ? 'background:#eab308; border-color:#eab308; color:black;' : ''}" 
                            onclick="openUnitDetails(${JSON.stringify(u).replace(/"/g, '&quot;')})"
                        >
                            ${hasActive ? 'Continuar Lección ⏯' : (pct >= 100 ? 'Repasar Unidad' : 'Comenzar Unidad')}
                        </button>
                    </div>
                </div>
                `;
    }).join('')}
             ${currentUser.role === 'ADMIN' || currentUser.role === 'PROFESOR' ?
            `<div class="glass-card-hover" style="display:flex; align-items:center; justify-content:center; border:2px dashed rgba(255,255,255,0.1); cursor:pointer; min-height:220px; background:rgba(255,255,255,0.02); border-radius:16px;" onclick="showCreateUnitModal()">
                    <span style="font-size:1.5rem; color:var(--primary); font-weight:bold;">+ Nueva Unidad</span>
                </div>` : ''}
        </div>
    `;
};

window.openUnitDetails = (unit) => {
    let modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.9); z-index:2000; display:flex; justify-content:center; align-items:center;';

    // Check role
    const isStudent = currentUser.role === 'ESTUDIANTE';
    let content = '';

    if (isStudent) {
        // Find single quiz logic
        const singleQuiz = unit.activities && unit.activities.length === 1 && unit.activities[0].type === 'QUIZ' ? unit.activities[0] : null;
        let btnText = "Comenzar Unidad";
        let btnAction = `showUnitActivities(this, ${JSON.stringify(unit).replace(/"/g, "&quot;")})`;

        if (singleQuiz) {
            const sub = singleQuiz.user_submission;
            if (sub && sub.status === 'IN_PROGRESS') {
                btnText = "Continuar Cuestionario ⏯";
            } else if (sub && sub.status === 'COMPLETED') {
                btnText = `Reintentar Cuestionario (Nota: ${sub.grade || 0}%)`;
            } else {
                btnText = "Comenzar Cuestionario";
            }
            btnAction = `this.closest('.modal-overlay').remove(); openActivity(${singleQuiz.id})`;
        }

        content = `
            <div style="text-align:center;">
                <h2 style="font-size:2.5rem; margin-bottom:1rem; color:var(--primary);">${unit.title}</h2>
                <div style="font-size:6rem; margin-bottom:2rem; animation: float 3s ease-in-out infinite;">📖</div>
                <p style="font-size:1.2rem; color:#cbd5e1; margin-bottom:2rem;">Vas a empezar la <strong>${unit.title}</strong>.<br>Aquí encontrarás los recursos y cuestionarios.</p>
                <button class="btn btn-primary" style="font-size:1.2rem; padding:1rem 2rem; box-shadow:0 0 20px rgba(99,102,241,0.5);" onclick="${btnAction}">${btnText}</button>
                
                ${singleQuiz && singleQuiz.user_submission && singleQuiz.user_submission.status === 'IN_PROGRESS' ?
                `<p style="margin-top:1rem; color:#facc15;">Tienes un intento guardado.</p>` : ''}
            </div>
            <style>
                @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-20px); } 100% { transform: translateY(0px); } }
            </style>
        `;
    } else {
        // Admin view directly
        setTimeout(() => showUnitActivities(null, unit), 50);
        content = '<p style="text-align:center;">Cargando...</p>';
    }

    modal.innerHTML = `
        <div class="glass-card" style="width:90%; max-width:800px; max-height:90vh; overflow-y:auto; position:relative; min-height:500px; display:flex; flex-direction:column; background:rgba(15, 23, 42, 0.95); border:1px solid rgba(255,255,255,0.1);">
            <button onclick="this.closest('.modal-overlay').remove()" style="position:absolute; top:1.5rem; right:1.5rem; background:none; border:none; color:white; font-size:2rem; cursor:pointer; z-index:10; line-height:1;">&times;</button>
            <div id="unit-content-area" style="width:100%; flex:1; padding:2rem; display:flex; flex-direction:column; justify-content:center;">
                ${content}
            </div>
        </div>
    `;
    document.body.appendChild(modal);
};

window.showUnitActivities = (btn, unit) => {
    const container = document.getElementById('unit-content-area');
    if (!container) return; // safety

    // If was centered, reset
    container.style.justifyContent = 'flex-start';

    const isAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'PROFESOR';

    let html = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:1rem;">
            <h2 style="margin:0; color:white; font-size:2rem;">${unit.title}</h2>
            ${isAdmin ? `<button class="btn btn-primary" onclick="showCreateActivityModal(${unit.id})">+ Agregar Actividad</button>` : ''}
        </div>
        
        <div style="display:flex; flex-direction:column; gap:1.5rem; flex:1;">
            ${unit.activities && unit.activities.length > 0 ? unit.activities.map((a, i) => `
                <div onclick="openActivity(${a.id})" class="glass-card-hover" style="
                    background:rgba(255,255,255,0.03); 
                    padding:1.5rem; 
                    border-radius:16px; 
                    cursor:pointer; 
                    display:flex; 
                    align-items:center; 
                    gap:1.5rem;
                    transition:all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    border:1px solid rgba(255,255,255,0.05);
                    position:relative;
                    overflow:hidden;
                "
                onmouseover="this.style.background='rgba(255,255,255,0.08)'; this.style.borderColor='var(--primary)'; this.style.transform='translateX(5px)'"
                onmouseout="this.style.background='rgba(255,255,255,0.03)'; this.style.borderColor='rgba(255,255,255,0.05)'; this.style.transform='translateX(0)'"
                >
                    <div style="
                        font-size:1.8rem; 
                        min-width:60px; height:60px; 
                        background:${a.type === 'QUIZ' ? 'rgba(99,102,241,0.15)' : 'rgba(16,185,129,0.15)'}; 
                        color:${a.type === 'QUIZ' ? '#818cf8' : '#34d399'}; 
                        border-radius:16px; 
                        display:flex; justify-content:center; align-items:center;
                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                    ">
                        ${a.type === 'QUIZ' ? '📝' : '📤'}
                    </div>
                    
                    <div style="flex:1;">
                        <div style="font-weight:700; font-size:1.2rem; margin-bottom:0.4rem; color:white;">${a.title}</div>
                        <div style="color:#94a3b8; font-size:0.95rem;">${a.description || 'Sin descripción'}</div>
                    </div>

                    ${isAdmin ? `
                        <div style="display:flex; gap:0.5rem; margin-right:1rem;" onclick="event.stopPropagation()">
                             <button style="background:rgba(255,255,255,0.1); border:none; color:white; border-radius:50%; width:32px; height:32px; cursor:pointer;" title="Editar Actividad" onclick="editActivity(${a.id})">✏️</button>
                             <button style="background:rgba(255,255,255,0.1); border:none; color:white; border-radius:50%; width:32px; height:32px; cursor:pointer;" title="Eliminar Actividad" onclick="deleteActivity(${a.id})">🗑️</button>
                        </div>
                    ` : ''}
                    
                    <div style="font-size:1.5rem; color:rgba(255,255,255,0.2); margin-left:0.5rem;">›</div>
                </div>
            `).join('') : `
                <div style="text-align:center; padding:4rem; border:2px dashed rgba(255,255,255,0.05); border-radius:20px; color:#64748b;">
                    <div style="font-size:3rem; margin-bottom:1rem; opacity:0.5;">📭</div>
                    <p style="font-size:1.1rem;">No hay actividades disponibles en este momento.</p>
                </div>
            `}
        </div>
    `;

    container.innerHTML = html;
};

// ==========================================
// ADMIN EDITING FUNCTIONS
// ==========================================

window.deleteUnit = async (id) => {
    if (!await showConfirm('¿Eliminar unidad y todo su contenido?')) return;
    try {
        await apiRequest(`/v1/units/${id}`, 'DELETE');
        showToast('Unidad eliminada', 'success');
        reloadContext();
    } catch (e) { showToast(e.message, 'error'); }
};

window.editUnit = async (id) => {
    try {
        const unit = window.currentUnits ? window.currentUnits.find(u => u.id === id) : null;
        const currentTitle = unit ? unit.title : '';
        const currentDesc = unit ? (unit.description || '') : '';

        let modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.9); z-index:3000; display:flex; justify-content:center; align-items:center;';
        modal.innerHTML = `
            <div class="glass-card" style="width:400px;">
                <h3>Editar Unidad</h3>
                <label>Título</label>
                <input id="edit-unit-title" style="width:100%; margin-bottom:1rem;" placeholder="Título..." value="${currentTitle.replace(/"/g, '&quot;')}">
                <label>Descripción</label>
                <input id="edit-unit-desc" style="width:100%; margin-bottom:1rem;" placeholder="Descripción..." value="${currentDesc.replace(/"/g, '&quot;')}">
                <div style="display:flex; justify-content:flex-end; gap:1rem;">
                    <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
                    <button class="btn btn-primary" onclick="saveUnitChanges(${id})">Guardar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    } catch (e) { showToast(e.message, 'error'); }
};

window.saveUnitChanges = async (id) => {
    const title = document.getElementById('edit-unit-title').value;
    const desc = document.getElementById('edit-unit-desc').value;

    if (!title) return showToast('Título requerido', 'error');

    try {
        await apiRequest(`/v1/units/${id}`, 'PUT', { title, description: desc });
        showToast('Unidad actualizada', 'success');

        const modal = document.getElementById('edit-unit-title').closest('.modal-overlay');
        if (modal) modal.remove();

        reloadContext();
    } catch (e) { showToast(e.message, 'error'); }
};

// Activity Editor State
let editingActivity = null;

window.editActivity = async (id) => {
    try {
        const res = await apiRequest(`/v1/activities/${id}`);
        editingActivity = res.data;

        let modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'editor-modal';
        modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.95); z-index:2500; display:flex; justify-content:center; align-items:center;';

        modal.innerHTML = `
            <div class="glass-card" style="width:95%; max-width:900px; height:90vh; display:flex; flex-direction:column; background:#0f172a; border:1px solid rgba(255,255,255,0.1);">
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:1rem; margin-bottom:1rem;">
                    <h2 style="margin:0;">Editar Actividad</h2>
                    <div style="display:flex; gap:1rem;">
                        <button class="btn btn-secondary" onclick="document.getElementById('editor-modal').remove()">Cancelar</button>
                        <button class="btn btn-primary" onclick="saveActivityChanges()">💾 Guardar Cambios</button>
                    </div>
                </div>

                <div style="flex:1; overflow-y:auto; padding-right:1rem;">
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem; margin-bottom:1.5rem;">
                        <div class="input-group">
                            <label>Título</label>
                            <input id="edit-act-title" value="${editingActivity.title.replace(/"/g, '&quot;')}">
                        </div>
                        <div class="input-group">
                            <label>Descripción</label>
                            <input id="edit-act-desc" value="${(editingActivity.description || '').replace(/"/g, '&quot;')}">
                        </div>
                    </div>

                    ${editingActivity.type === 'QUIZ' ? `
                    <div style="background:rgba(255,255,255,0.03); padding:1rem; border-radius:8px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                            <h3>Preguntas (${editingActivity.questions.length})</h3>
                            <button class="btn btn-secondary" onclick="addQuestionToEditor()">+ Agregar Pregunta</button>
                        </div>
                        <div id="editor-questions-list" style="display:flex; flex-direction:column; gap:1rem;">
                            <!-- Render Questions -->
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        if (editingActivity.type === 'QUIZ') renderEditorQuestions();

    } catch (e) { alert(e.message); }
};

window.renderEditorQuestions = () => {
    const list = document.getElementById('editor-questions-list');
    if (!list) return;

    list.innerHTML = editingActivity.questions.map((q, i) => `
        <div style="background:rgba(0,0,0,0.3); padding:1rem; border-radius:8px; border:1px solid rgba(255,255,255,0.1);">
            <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                <span style="font-weight:bold; color:var(--primary);">Pregunta ${i + 1}</span>
                <div style="display:flex; gap:0.5rem;">
                    <button style="border:none; background:none; cursor:pointer;" onclick="editEditorQuestion(${i})">✏️</button>
                    <button style="border:none; background:none; cursor:pointer; color:#ef4444;" onclick="removeEditorQuestion(${i})">🗑️</button>
                </div>
            </div>
            <div style="margin-bottom:0.5rem; font-size:1.1rem;">${q.text}</div>
            <div style="font-size:0.9rem; color:#94a3b8;">
                ${q.options.map(o => `
                    <span style="display:inline-block; margin-right:1rem; color:${o.isCorrect ? '#4ade80' : 'inherit'}">
                         ${o.isCorrect ? '✅' : '○'} ${o.text}
                    </span>
                `).join('')}
            </div>
        </div>
    `).join('');
};

window.removeEditorQuestion = async (idx) => {
    if (!await showConfirm('Borrar pregunta?')) return;
    editingActivity.questions.splice(idx, 1);
    renderEditorQuestions();
};

window.addQuestionToEditor = () => {
    const newQ = { text: 'Nueva Pregunta', options: [{ text: 'Opción 1', isCorrect: true }, { text: 'Opción 2', isCorrect: false }], id: Date.now() };
    editingActivity.questions.push(newQ);
    renderEditorQuestions();
    editEditorQuestion(editingActivity.questions.length - 1);
};

window.editEditorQuestion = (idx) => {
    const q = editingActivity.questions[idx];

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.9); z-index:3000; display:flex; justify-content:center; align-items:center;';
    modal.innerHTML = `
        <div class="glass-card" style="width:500px; background:#1e293b;">
            <h3>Editar Pregunta</h3>
            <label>Texto</label>
            <textarea id="edit-q-text" style="width:100%; margin-bottom:1rem; color:black;">${q.text}</textarea>
            
            <label>Opciones (Marca la correcta)</label>
            <div id="edit-q-opts">
                ${q.options.map((o, optIdx) => `
                    <div style="display:flex; gap:0.5rem; margin-bottom:0.5rem;">
                        <input type="radio" name="edit-q-correct" value="${optIdx}" ${o.isCorrect ? 'checked' : ''}>
                        <input type="text" class="edit-q-opt-val" value="${o.text}" style="color:black; flex:1;">
                        <button onclick="this.parentElement.remove()" style="color:red; background:none; border:none;">x</button>
                    </div>
                `).join('')}
            </div>
            <button class="btn btn-secondary" style="margin-bottom:1rem; font-size:0.8rem;" onclick="addOptionToEditorModal()">+ Opción</button>
            
            <div style="display:flex; gap:1rem;">
                 <button class="btn btn-primary" onclick="window.saveEditorQuestion(${idx}, this)">Guardar</button>
                 <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Helper needed for the dynamic modal
    window.addOptionToEditorModal = () => {
        const div = document.createElement('div');
        div.style.cssText = "display:flex; gap:0.5rem; margin-bottom:0.5rem;";
        div.innerHTML = `
            <input type="radio" name="edit-q-correct" value="999">
            <input type="text" class="edit-q-opt-val" value="Nueva Opción" style="color:black; flex:1;">
            <button onclick="this.parentElement.remove()" style="color:red; background:none; border:none;">x</button>
         `;
        document.getElementById('edit-q-opts').appendChild(div);
        // Re-index radios logic strictly not needed if we iterate inputs.
    };

    window.saveEditorQuestion = (qIndex, btn) => {
        const modalEl = btn.closest('.glass-card');
        const txt = modalEl.querySelector('#edit-q-text').value;
        const optRows = modalEl.querySelectorAll('#edit-q-opts > div');

        if (!txt) return showToast('Texto requerido', 'error');

        const newOpts = [];
        let hasCorrect = false;

        optRows.forEach((row, i) => {
            const radio = row.querySelector('input[type="radio"]');
            const inp = row.querySelector('input[type="text"]');

            if (radio.checked) hasCorrect = true;
            newOpts.push({
                text: inp.value,
                isCorrect: radio.checked
            });
        });

        if (!hasCorrect && newOpts.length > 0) newOpts[0].isCorrect = true; // Fallback

        editingActivity.questions[qIndex].text = txt;
        editingActivity.questions[qIndex].options = newOpts;
        renderEditorQuestions();
        btn.closest('.modal-overlay').remove();
    };
};

window.saveActivityChanges = async () => {
    const title = document.getElementById('edit-act-title').value;
    const desc = document.getElementById('edit-act-desc').value;

    // Clean data
    const payload = {
        title,
        description: desc,
        questions: editingActivity.questions
    };

    try {
        await apiRequest(`/v1/activities/${editingActivity.id}`, 'PUT', payload);
        showToast('Cambios guardados', 'success');
        document.getElementById('editor-modal').remove();
        reloadContext();
    } catch (e) { showToast(e.message, 'error'); }
};

window.editCourse = async (id) => {
    const course = window.currentCourses.find(c => c.id === id);
    if (!course) return;

    try {
        // Fetch professors
        const resUsers = await apiRequest('/v1/users');
        const professors = (resUsers.data || []).filter(u => u.role === 'PROFESOR');

        let modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.9); z-index:3000; display:flex; justify-content:center; align-items:center;';

        const inputStyle = 'width:100%; margin-bottom:1rem; background:rgba(0,0,0,0.3); color:white; border:1px solid rgba(255,255,255,0.2); padding:0.5rem; border-radius:4px;';

        modal.innerHTML = `
            <div class="glass-card" style="width:400px;">
                <h3>Editar Curso</h3>
                <label>Nombre del Curso</label>
                <input id="edit-course-name" style="${inputStyle}" value="${course.name.replace(/"/g, '&quot;')}">
                
                <label>Horario (Descripción)</label>
                <input id="edit-course-schedule" style="${inputStyle}" value="${(course.schedule_description || '').replace(/"/g, '&quot;')}">
                
                <label>Profesor</label>
                <select id="edit-course-teacher" style="${inputStyle}">
                    <option value="">-- Sin asignar --</option>
                    ${professors.map(p => `
                        <option value="${p.id}" ${course.teacher_id === p.id ? 'selected' : ''}>${p.full_name}</option>
                    `).join('')}
                </select>

                <div style="display:flex; justify-content:flex-end; gap:1rem;">
                    <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
                    <button class="btn btn-primary" onclick="saveCourseChanges(${id})">Guardar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    } catch (e) { showToast('Error cargando datos: ' + e.message, 'error'); }
};

window.saveCourseChanges = async (id) => {
    const name = document.getElementById('edit-course-name').value;
    const schedule_description = document.getElementById('edit-course-schedule').value;
    const teacher_id = document.getElementById('edit-course-teacher').value;

    if (!name) return showToast('Nombre requerido', 'error');

    try {
        await apiRequest(`/v1/courses/${id}`, 'PUT', { name, schedule_description, teacher_id: teacher_id || null });
        showToast('Curso actualizado', 'success');
        document.getElementById('edit-course-name').closest('.modal-overlay').remove();
        loadView('courses'); // Refresh list
    } catch (e) { showToast(e.message, 'error'); }
};

window.reloadContext = async () => {
    if (window.currentCourseId) {
        await enterCourse(window.currentCourseId);
    } else {
        location.reload();
    }
};

// ==========================================
// HOMEWORK SYSTEM
// ==========================================

window.renderHomeworkTab = (courseId) => {
    const area = document.getElementById('homework-area');
    if (!area) return;

    if (currentUser.role === 'ESTUDIANTE') {
        renderStudentAssignments(area);
    } else if (currentUser.role === 'PROFESOR') {
        renderProfessorHomeworkView(area, courseId);
    } else {
        // ADMIN
        renderAdminHomeworkView(area);
    }
};

// --- PROFESOR VIEW ---
window.renderProfessorHomeworkView = (area, courseId) => {
    const assignments = window.currentAssignments || [];

    area.innerHTML = `
        <div style="display:grid; grid-template-columns: 1fr; gap:2rem;">
            <!-- CREATE ASSIGNMENT -->
            <div class="glass-card">
                <h3 style="color:var(--primary); margin-bottom:1rem;">Asignar Deber</h3>
                <input id="new-assign-title" class="input-group" placeholder="Título del deber..." style="width:100%; margin-bottom:0.5rem; background:rgba(0,0,0,0.3); color:white; border:1px solid rgba(255,255,255,0.2); padding:0.5rem; border-radius:4px;">
                <textarea id="new-assign-desc" class="input-group" placeholder="Descripción..." style="width:100%; margin-bottom:0.5rem; min-height:80px; background:rgba(0,0,0,0.3); color:white; border:1px solid rgba(255,255,255,0.2); padding:0.5rem; border-radius:4px;"></textarea>
                <div style="display:flex; justify-content:flex-end;">
                    <button class="btn btn-primary" onclick="createAssignment(${courseId})">Enviar a Alumnos</button>
                </div>
            </div>

             <!-- LIST OF CREATED ASSIGNMENTS -->
            <div class="glass-card">
                <h3 style="color:var(--primary); margin-bottom:1rem;">Mis Asignaciones Creadas</h3>
                <div style="max-height:300px; overflow-y:auto;">
                    ${assignments.length === 0 ? '<p style="color:gray;">No has creado asignaciones.</p>' : ''}
                    ${assignments.map(a => `
                        <div style="background:rgba(255,255,255,0.02); padding:1rem; border-radius:8px; margin-bottom:0.5rem; border:1px solid rgba(255,255,255,0.05); display:flex; justify-content:space-between; align-items:center;">
                            <div>
                                <div style="font-weight:bold;">${a.title}</div>
                                <div style="font-size:0.8rem; color:#94a3b8;">${new Date(a.created_at).toLocaleDateString()}</div>
                            </div>
                            <div style="display:flex; gap:0.5rem;">
                                <button class="btn btn-secondary" style="padding:0.3rem 0.8rem; font-size:0.8rem;" onclick="viewAssignmentDetails(${a.id})">👁️ Ver Entregas</button>
                                <button class="btn btn-danger" style="padding:0.3rem 0.8rem; font-size:0.8rem;" onclick="deleteAssignment(${a.id}, ${courseId})">🗑️ Borrar</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- REVIEW SUBMISSIONS (Student List - Legacy/Alternate view) -->
            <div class="glass-card">
                <h3 style="color:var(--primary); margin-bottom:1rem;">Revisar por Estudiante</h3>
                <p style="color:gray; font-size:0.9rem; margin-bottom:1rem;">Selecciona un estudiante para ver todas sus entregas.</p>
                <div id="prof-student-list"></div>
            </div>
        </div>
    `;
    renderHomeworkStudentList(document.getElementById('prof-student-list'));
};

window.createAssignment = async (courseId) => {
    const title = document.getElementById('new-assign-title').value;
    const description = document.getElementById('new-assign-desc').value;

    if (!title) return showToast('El título es requerido', 'error');

    try {
        await apiRequest(`/v1/courses/${courseId}/assignments`, 'POST', { title, description });
        showToast('Deber asignado correctamente', 'success');

        // Refresh assignments locally
        const res = await apiRequest(`/v1/courses/${courseId}/assignments`);
        window.currentAssignments = res.data;
        renderHomeworkTab(courseId); // Re-render view
    } catch (e) { showToast(e.message, 'error'); }
};

window.deleteAssignment = async (assignId, courseId) => {
    if (!await showConfirm('¿Estás seguro de borrar esta asignación y todas las entregas asociadas?')) return;
    try {
        await apiRequest(`/v1/assignments/${assignId}`, 'DELETE');
        showToast('Asignación eliminada', 'success');
        // Refresh assignments locally
        const res = await apiRequest(`/v1/courses/${courseId}/assignments`);
        window.currentAssignments = res.data;
        renderHomeworkTab(courseId); // Re-render view
    } catch (e) { showToast(e.message, 'error'); }
};

window.viewAssignmentDetails = async (assignId) => {
    const area = document.getElementById('homework-area');
    area.innerHTML = '<p>Cargando detalles...</p>';
    try {
        const res = await apiRequest(`/v1/assignments/${assignId}/submissions`);
        const { data: submissions, assignment } = res; // API returns data (list) and assignment details

        area.innerHTML = `
            <button class="btn btn-secondary" style="margin-bottom:1rem;" onclick="renderHomeworkTab(window.currentCourseId)">⬅ Volver a Panel</button>
            <div class="glass-card">
                <h2 style="color:var(--primary); margin-bottom:0.5rem;">${assignment.title}</h2>
                <p style="color:#cbd5e1; margin-bottom:1.5rem;">${assignment.description || ''}</p>
                
                <h4 style="margin-bottom:1rem;">Entregas de Estudiantes</h4>
                <div style="display:flex; flex-direction:column; gap:0.5rem;">
                    ${submissions.map(item => {
            const s = item.student;
            const sub = item.submission;
            return `
                        <div style="background:rgba(255,255,255,0.02); padding:1rem; border-radius:8px; border-bottom:1px solid rgba(255,255,255,0.05); display:flex; justify-content:space-between; align-items:flex-start;">
                            <div>
                                <div style="font-weight:bold;">${s.full_name}</div>
                                <div style="font-size:0.8rem; color:#94a3b8;">${s.email}</div>
                            </div>
                            <div style="text-align:right;">
                                ${sub ? `
                                    <div style="color:#4ade80; font-size:0.9rem; margin-bottom:0.3rem;">✅ Entregado: ${new Date(sub.submitted_at).toLocaleDateString()}</div>
                                    <a href="${sub.file_url}" target="_blank" style="color:var(--secondary); font-size:0.8rem; text-decoration:underline;">Ver Archivo (${sub.file_type.split('/')[1] || 'd'})</a>
                                    
                                    <div style="margin-top:0.5rem; display:flex; align-items:center; gap:0.5rem; justify-content:flex-end;">
                                        <input id="grade-${sub.id}" type="number" placeholder="Nota" style="width:60px; padding:2px; background:rgba(0,0,0,0.5); color:white; border:1px solid gray;" value="${sub.grade || ''}">
                                        <button class="btn btn-primary" style="padding:2px 8px; font-size:0.7rem;" onclick="gradeSubmission(${sub.id})">Guardar Nota</button>
                                    </div>
                                    <div style="font-size:0.7rem; color:gray; margin-top:0.2rem;">${sub.grade ? `Nota actual: ${sub.grade}` : 'Sin calificar'}</div>

                                ` : '<div style="color:#facc15; font-size:0.9rem;">⚠️ Pendiente</div>'}
                            </div>
                        </div>
                        `;
        }).join('')}
                </div>
            </div>
        `;
    } catch (e) { showToast(e.message, 'error'); }
};

window.gradeSubmission = async (subId) => {
    const gradeVal = document.getElementById(`grade-${subId}`).value;
    if (gradeVal === '') return showToast('Ingresa una nota', 'error');

    try {
        await apiRequest(`/v1/submissions/${subId}/grade`, 'POST', { grade: gradeVal });
        showToast('Nota guardada', 'success');
    } catch (e) { showToast(e.message, 'error'); }
};

// --- ADMIN VIEW ---
window.renderAdminHomeworkView = (area) => {
    area.innerHTML = '<div id="admin-student-list"></div>';
    renderHomeworkStudentList(document.getElementById('admin-student-list'));
};

// --- SHARED STUDENT LIST (Prof/Admin) ---
window.renderHomeworkStudentList = (container) => {
    if (!window.currentCourseProgress) return;
    const students = window.currentCourseProgress; // We use progress roster for list

    if (students.length === 0) {
        container.innerHTML = '<p>No hay estudiantes matriculados.</p>';
        return;
    }

    container.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:0.5rem;">
            ${students.map(s => `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:0.8rem; background:rgba(255,255,255,0.02); border-bottom:1px solid rgba(255,255,255,0.05); border-radius:8px;">
                    <div>
                        <div style="font-weight:bold;">${s.full_name}</div>
                        <div style="font-size:0.8rem; color:#94a3b8;">${s.email}</div>
                    </div>
                    <button class="btn btn-primary" style="padding:0.3rem 0.8rem; font-size:0.9rem;" onclick="viewStudentHomework(${s.student_id}, '${s.full_name}')">Ver Deberes</button>
                </div>
            `).join('')}
        </div>
    `;
};

// --- VIEW STUDENT SUBMISSIONS (Admin/Prof Logic) ---
window.viewStudentHomework = async (studentId, studentName) => {
    const area = document.getElementById('homework-area');
    area.innerHTML = '<p>Cargando entregas...</p>';

    try {
        const res = await apiRequest(`/v1/courses/${window.currentCourseId}/students/${studentId}/submissions`);
        const items = res.data || [];

        let content = '';
        if (items.length === 0) {
            content = '<div class="glass-card"><p>Aún no hay asignaciones en esta zona de deberes.</p></div>';
        } else {
            content = items.map(item => {
                const a = item.assignment;
                const s = item.submission;

                let statusHtml = '<span style="color:orange">Pendiente</span>';
                if (s) statusHtml = `<span style="color:lightgreen">Entregado: ${new Date(s.submitted_at).toLocaleDateString()}</span>`;

                return `
                <div class="glass-card" style="margin-bottom:1rem; border-left:4px solid var(--primary);">
                    <h4 style="margin-bottom:0.5rem;">${a.title}</h4>
                    <p style="font-size:0.9rem; color:#cbd5e1; margin-bottom:0.5rem;">${a.description || ''}</p>
                    <div style="font-size:0.9rem; margin-bottom:1rem;">Estado: ${statusHtml}</div>
                    ${s ? `
                        <div style="background:rgba(0,0,0,0.3); padding:0.5rem; border-radius:4px;">
                            <a href="${s.file_url}" target="_blank" class="btn btn-secondary" style="font-size:0.8rem;">📄 Ver Archivo (${s.file_type.split('/')[1] || 'file'})</a>
                        </div>
                    ` : ''}
                </div>`;
            }).join('');
        }

        area.innerHTML = `
            <button class="btn btn-secondary" style="margin-bottom:1rem;" onclick="renderHomeworkTab(window.currentCourseId)">⬅ Volver a Lista</button>
            <h3 style="margin-bottom:1rem; color:var(--primary);">Deberes de: ${studentName}</h3>
            ${content}
        `;

    } catch (e) {
        area.innerHTML = `<p style="color:red">Error: ${e.message}</p> <button class="btn btn-secondary" onclick="renderHomeworkTab(window.currentCourseId)">Volver</button>`;
    }
};

// --- STUDENT VIEW (Assignments List + Upload) ---
window.renderStudentAssignments = (area) => {
    const assignments = window.currentAssignments || [];

    if (assignments.length === 0) {
        area.innerHTML = '<div class="glass-card"><p>No hay deberes asignados por el profesor.</p></div>';
        return;
    }

    area.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:1.5rem;">
            ${assignments.map(a => {
        const sub = a.submission; // Attached in backend getCourseAssignments
        return `
                <div class="glass-card">
                     <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1rem;">
                        <div>
                            <h3 style="color:var(--primary); margin-bottom:0.5rem;">${a.title}</h3>
                            <p style="color:#cbd5e1;">${a.description || ''}</p>
                            <div style="font-size:0.8rem; color:gray; margin-top:0.5rem;">Asignado: ${new Date(a.created_at).toLocaleDateString()}</div>
                        </div>
                        ${sub ? '<span style="background:green; color:white; padding:2px 8px; border-radius:4px; font-size:0.8rem;">Entregado</span>' : '<span style="background:orange; color:white; padding:2px 8px; border-radius:4px; font-size:0.8rem;">Pendiente</span>'}
                     </div>

                     <div style="background:rgba(255,255,255,0.05); padding:1rem; border-radius:8px;">
                        ${sub ? `
                            <p style="margin-bottom:0.5rem;"><strong>Tu entrega:</strong></p>
                            <a href="${sub.file_url}" target="_blank" style="color:var(--secondary); text-decoration:underline;">Ver archivo enviado</a>
                            <p style="font-size:0.8rem; color:gray; margin-top:0.5rem;">Enviado el: ${new Date(sub.submitted_at).toLocaleString()}</p>
                            <button class="btn btn-secondary" style="font-size:0.8rem; margin-top:1rem;" onclick="toggleUploadForm(${a.id})">Re-enviar</button>
                        ` : `
                            <p style="margin-bottom:0.5rem;">Subir tarea (PDF o Video):</p>
                        `}
                        
                        <div id="upload-form-${a.id}" class="${sub ? 'hidden' : ''}" style="margin-top:1rem;">
                            <input type="file" id="file-${a.id}" accept=".pdf,video/*" style="color:white; margin-bottom:0.5rem;">
                            <button class="btn btn-primary" onclick="submitAssignment(${a.id})">Enviar Tarea</button>
                        </div>
                     </div>
                </div>
                `;
    }).join('')}
        </div>
    `;
};

window.toggleUploadForm = (id) => {
    const el = document.getElementById(`upload-form-${id}`);
    if (el) el.classList.toggle('hidden');
};

window.submitAssignment = async (assignmentId) => {
    const fileInput = document.getElementById(`file-${assignmentId}`);
    if (fileInput.files.length === 0) return showToast('Selecciona un archivo', 'error');

    const file = fileInput.files[0];
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) return showToast('El archivo es demasiado grande (Máx 50MB)', 'error');

    const formData = new FormData();
    formData.append('file', file);

    const btn = document.querySelector(`#upload-form-${assignmentId} button`);
    const originalText = btn.innerText;
    btn.innerText = 'Subiendo...';
    btn.disabled = true;

    try {
        const res = await fetch(`/api/v1/assignments/${assignmentId}/submit`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: formData
        });

        const data = await res.json().catch(() => ({})); // Handle non-JSON responses

        if (res.ok && data.success) {
            showToast('Deber enviado correctamente', 'success');
            enterCourse(window.currentCourseId);
        } else {
            // Prefer server message, fallback to status text
            const msg = data.message || `Error del servidor: ${res.status} ${res.statusText}`;
            showToast(msg, 'error');
        }
    } catch (e) {
        console.error(e);
        showToast('Error de red o conexión fallida', 'error');
    } finally {
        if (btn) {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    }
};

// ==========================================
// CUSTOM UI MODALS (Toast, Confirm, Prompt)
// ==========================================

const style = document.createElement('style');
style.textContent = `
    @keyframes slideInDown { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
    .toast-container { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 10000; display: flex; flex-direction: column; gap: 10px; pointer-events: none; }
    .custom-toast { 
        background: rgba(15, 23, 42, 0.95); 
        border: 1px solid rgba(255,255,255,0.1); 
        backdrop-filter: blur(10px);
        color: white; 
        padding: 0.8rem 1.5rem; 
        border-radius: 50px; 
        box-shadow: 0 10px 25px rgba(0,0,0,0.5); 
        display: flex; align-items: center; gap: 12px;
        animation: slideInDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        min-width: 300px;
        pointer-events: auto;
    }
    .custom-toast.success { border: 1px solid #22c55e; box-shadow: 0 0 15px rgba(34, 197, 94, 0.3); }
    .custom-toast.error { border: 1px solid #ef4444; box-shadow: 0 0 15px rgba(239, 68, 68, 0.3); }
`;
document.head.appendChild(style);

const toastContainer = document.createElement('div');
toastContainer.className = 'toast-container';
document.body.appendChild(toastContainer);

window.showToast = (message, type = 'info') => {
    const toast = document.createElement('div');
    toast.className = `custom-toast ${type}`;
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';
    toast.innerHTML = `<span style="font-size:1.2rem;">${icon}</span> <span style="font-weight:500;">${message}</span>`;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.5s ease-out forwards';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
};

window.showConfirm = (message) => {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.8); z-index:10000; display:flex; justify-content:center; align-items:center; animation: fadeIn 0.2s;';
        modal.innerHTML = `
            <div class="glass-card" style="width:400px; max-width:90%; border:1px solid rgba(255,255,255,0.1);">
                <h3 style="margin-bottom:1rem; color:var(--primary);">Confirmación</h3>
                <p style="margin-bottom:2rem; color:#cbd5e1; font-size:1.05rem;">${message}</p>
                <div style="display:flex; justify-content:flex-end; gap:1rem;">
                    <button id="btn-cancel" class="btn btn-secondary">Cancelar</button>
                    <button id="btn-ok" class="btn btn-primary">Aceptar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const close = (val) => { modal.remove(); resolve(val); };
        modal.querySelector('#btn-cancel').onclick = () => close(false);
        modal.querySelector('#btn-ok').onclick = () => close(true);
    });
};

window.showPrompt = (message, defaultVal = '') => {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.8); z-index:10000; display:flex; justify-content:center; align-items:center; animation: fadeIn 0.2s;';
        modal.innerHTML = `
            <div class="glass-card" style="width:400px; max-width:90%; border:1px solid rgba(255,255,255,0.1);">
                <h3 style="margin-bottom:1rem; color:var(--primary);">${message}</h3>
                <input id="prompt-input" type="text" value="${defaultVal}" style="width:100%; padding:0.8rem; margin-bottom:1.5rem; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.2); color:white; border-radius:8px;">
                <div style="display:flex; justify-content:flex-end; gap:1rem;">
                    <button id="btn-cancel" class="btn btn-secondary">Cancelar</button>
                    <button id="btn-ok" class="btn btn-primary">Aceptar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        const input = modal.querySelector('input');
        input.focus();

        const close = (val) => { modal.remove(); resolve(val); };
        modal.querySelector('#btn-cancel').onclick = () => close(null);
        modal.querySelector('#btn-ok').onclick = () => close(input.value);
        input.onkeydown = (e) => {
            if (e.key === 'Enter') close(input.value);
            if (e.key === 'Escape') close(null);
        };
    });
};
