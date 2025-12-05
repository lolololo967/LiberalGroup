// admin.js - управление пользователями без эмодзи
const SUPABASE_URL = 'https://eqkanneloooeopkhhpuc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxa2FubmVsb29vZW9wa2hocHVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5MDk1MDgsImV4cCI6MjA4MDQ4NTUwOH0.EL7ZR9iyRSPIOYudaFWDQC4z1hXzu0PPtE1McoVvGp0';

// Создаем клиент Supabase с правильными настройками
let supabase;
try {
    if (window.supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
            auth: {
                persistSession: false,
                autoRefreshToken: false
            },
            global: {
                headers: {
                    'apikey': SUPABASE_KEY
                }
            }
        });
    } else {
        console.error('Supabase client не найден');
    }
} catch (error) {
    console.error('Ошибка создания Supabase клиента:', error);
}

// Пароль администратора
let ADMIN_PASSWORD = 'admin123'; // По умолчанию для разработки
let isAdmin = false;

// ============ УТИЛИТЫ ============
function showStatus(message, type = 'info') {
    const statusElement = document.getElementById('statusMessage');
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.className = 'admins-status admins-' + type;
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString, showTime = false) {
    if (!dateString) return 'никогда';
    try {
        const date = new Date(dateString);
        if (showTime) {
            return date.toLocaleDateString('ru-RU') + ' ' + date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleDateString('ru-RU');
    } catch (e) {
        return 'неверная дата';
    }
}

function showAlert(message, type = 'info') {
    // Удаляем старые алерты
    const oldAlerts = document.querySelectorAll('.custom-alert');
    oldAlerts.forEach(alert => alert.remove());
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `custom-alert custom-alert-${type}`;
    alertDiv.innerHTML = `
        <div class="alert-content">
            ${message}
            <button class="alert-close" onclick="this.parentElement.parentElement.remove()">X</button>
        </div>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Автоудаление через 5 секунд
    setTimeout(() => {
        if (alertDiv.parentElement) {
            alertDiv.remove();
        }
    }, 5000);
}

// ============ СТИЛИ ============
function addStyles() {
    if (!document.querySelector('#admin-custom-styles')) {
        const style = document.createElement('style');
        style.id = 'admin-custom-styles';
        style.textContent = `
            .custom-alert {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 5px;
                color: white;
                font-weight: bold;
                z-index: 99999;
                min-width: 300px;
                max-width: 500px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                animation: slideInRight 0.3s ease-out;
            }
            
            .alert-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .alert-close {
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                margin-left: 15px;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0.8;
            }
            
            .alert-close:hover {
                opacity: 1;
            }
            
            .custom-alert-success {
                background: #4CAF50;
                border-left: 5px solid #2E7D32;
            }
            
            .custom-alert-error {
                background: #f44336;
                border-left: 5px solid #c62828;
            }
            
            .custom-alert-info {
                background: #2196F3;
                border-left: 5px solid #1565C0;
            }
            
            .custom-alert-warning {
                background: #ff9800;
                border-left: 5px solid #ef6c00;
            }
            
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            .user-item {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 165, 0, 0.3);
                border-radius: 6px;
                padding: 15px;
                margin-bottom: 10px;
                transition: all 0.3s ease;
            }
            
            .user-item:hover {
                border-color: rgba(255, 165, 0, 0.6);
                box-shadow: 0 2px 8px rgba(255, 165, 0, 0.2);
            }
            
            .user-header {
                display: flex;
                align-items: center;
                margin-bottom: 10px;
            }
            
            .user-avatar {
                width: 40px;
                height: 40px;
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 18px;
                margin-right: 12px;
            }
            
            .user-info {
                flex: 1;
            }
            
            .user-name {
                color: #ffa500;
                margin: 0 0 5px 0;
                font-size: 16px;
                font-weight: 600;
            }
            
            .user-password {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 14px;
            }
            
            .user-password code {
                background: rgba(0, 0, 0, 0.3);
                padding: 3px 8px;
                border-radius: 4px;
                font-family: monospace;
                color: #4CAF50;
                font-weight: bold;
            }
            
            .copy-btn {
                background: none;
                border: 1px solid #4CAF50;
                color: #4CAF50;
                padding: 2px 8px;
                border-radius: 3px;
                cursor: pointer;
                font-size: 12px;
            }
            
            .copy-btn:hover {
                background: rgba(76, 175, 80, 0.1);
            }
            
            .user-stats {
                display: flex;
                justify-content: space-between;
                background: rgba(0, 0, 0, 0.2);
                padding: 8px;
                border-radius: 4px;
                margin: 10px 0;
            }
            
            .stat {
                text-align: center;
                flex: 1;
            }
            
            .stat strong {
                display: block;
                color: white;
                font-size: 14px;
            }
            
            .stat small {
                color: #aaa;
                font-size: 11px;
            }
            
            .user-actions {
                display: flex;
                gap: 8px;
                margin-top: 10px;
            }
            
            .action-btn {
                flex: 1;
                padding: 8px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 13px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 5px;
                transition: all 0.2s ease;
            }
            
            .action-btn:hover {
                transform: translateY(-1px);
            }
            
            .copy-all {
                background: #2196F3;
                color: white;
            }
            
            .copy-all:hover {
                background: #1976D2;
            }
            
            .delete-btn {
                background: #f44336;
                color: white;
            }
            
            .delete-btn:hover {
                background: #d32f2f;
            }
            
            .user-item:last-child {
                margin-bottom: 0;
            }
            
            .users-empty {
                text-align: center;
                padding: 40px 20px;
                color: #ffa500;
            }
            
            .users-loading {
                text-align: center;
                padding: 20px;
                color: #ffa500;
            }
            
            .users-error {
                text-align: center;
                padding: 20px;
                color: #f44336;
                background: rgba(244, 67, 54, 0.1);
                border-radius: 4px;
                margin: 10px 0;
            }
        `;
        document.head.appendChild(style);
    }
}

// ============ ФУНКЦИИ ДЛЯ РАБОТЫ С ПОЛЬЗОВАТЕЛЯМИ ============
async function loadUserList() {
    const userList = document.getElementById('userList');
    if (!userList) return;
    
    userList.innerHTML = '<div class="users-loading">Загрузка пользователей...</div>';
    
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            throw new Error(error.message || 'Ошибка загрузки пользователей');
        }
        
        if (!users || users.length === 0) {
            userList.innerHTML = `
                <div class="users-empty">
                    <p style="font-size: 16px; margin-bottom: 10px;">Пользователей пока нет</p>
                    <small>Добавьте первого пользователя используя форму выше</small>
                </div>
            `;
            return;
        }
        
        const usersHTML = users.map(user => `
            <div class="user-item" data-user-id="${user.id}">
                <div class="user-header">
                    <div class="user-avatar">${user.username.charAt(0).toUpperCase()}</div>
                    <div class="user-info">
                        <h4 class="user-name">${escapeHtml(user.username)}</h4>
                        <div class="user-password">
                            <span>Пароль:</span>
                            <code>${escapeHtml(user.password)}</code>
                            <button onclick="copyPassword('${escapeHtml(user.password)}')" 
                                    class="copy-btn" title="Копировать пароль">
                                Копировать
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="user-stats">
                    <span class="stat">
                        <strong>${user.tests_taken || 0}</strong>
                        <small>тестов пройдено</small>
                    </span>
                    <span class="stat">
                        <strong>${user.last_test ? formatDate(user.last_test, true) : '—'}</strong>
                        <small>последний тест</small>
                    </span>
                    <span class="stat">
                        <strong>${formatDate(user.created_at, false)}</strong>
                        <small>дата создания</small>
                    </span>
                </div>
                
                <div class="user-actions">
                    <button onclick="copyUserInfo('${escapeHtml(user.username)}', '${escapeHtml(user.password)}')" 
                            class="action-btn copy-all">
                        Копировать данные
                    </button>
                    <button onclick="deleteUser(${user.id}, '${escapeHtml(user.username)}')" 
                            class="action-btn delete-btn">
                        Удалить
                    </button>
                </div>
            </div>
        `).join('');
        
        userList.innerHTML = usersHTML;
        
    } catch (error) {
        console.error('Ошибка загрузки пользователей:', error);
        userList.innerHTML = `<div class="users-error">Ошибка: ${error.message}</div>`;
    }
}

async function addNewUser() {
    const usernameInput = document.getElementById('newUsername');
    const passwordInput = document.getElementById('newPassword');
    const errorElement = document.getElementById('userError');
    
    if (!usernameInput || !passwordInput || !errorElement) return;
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    
    // Валидация
    if (!username || !password) {
        errorElement.textContent = 'Заполните все поля';
        errorElement.style.color = '#f44336';
        return;
    }
    
    if (username.length < 2 || username.length > 20) {
        errorElement.textContent = 'Имя пользователя должно быть от 2 до 20 символов';
        errorElement.style.color = '#f44336';
        usernameInput.focus();
        return;
    }
    
    if (password.length < 4) {
        errorElement.textContent = 'Пароль должен быть минимум 4 символа';
        errorElement.style.color = '#f44336';
        passwordInput.focus();
        return;
    }
    
    try {
        errorElement.textContent = 'Добавление пользователя...';
        errorElement.style.color = '#ff9800';
        
        // Проверяем существование пользователя
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('username', username)
            .single();
        
        if (existingUser) {
            errorElement.textContent = 'Это имя пользователя уже занято';
            errorElement.style.color = '#f44336';
            usernameInput.focus();
            usernameInput.select();
            return;
        }
        
        // Создаем пользователя
        const { data, error } = await supabase
            .from('users')
            .insert([{
                username: username,
                password: password,
                created_by: 'admin',
                tests_taken: 0,
                created_at: new Date().toISOString(),
                last_test: null
            }])
            .select();
        
        if (error) {
            if (error.code === '23505') { // unique violation
                errorElement.textContent = 'Это имя пользователя уже существует';
                errorElement.style.color = '#f44336';
            } else {
                throw error;
            }
            return;
        }
        
        // Успешно добавлено
        errorElement.textContent = 'Пользователь успешно добавлен';
        errorElement.style.color = '#4CAF50';
        
        // Очищаем поля
        usernameInput.value = '';
        passwordInput.value = '';
        usernameInput.focus();
        
        // Обновляем список
        setTimeout(() => {
            loadUserList();
            errorElement.textContent = '';
        }, 2000);
        
        showAlert(`Пользователь "${username}" успешно создан`, 'success');
        
    } catch (error) {
        console.error('Ошибка добавления пользователя:', error);
        errorElement.textContent = `Ошибка: ${error.message || 'Неизвестная ошибка'}`;
        errorElement.style.color = '#f44336';
    }
}

async function deleteUser(userId, username) {
    if (!confirm(`Удалить пользователя "${username}"?\n\nВсе результаты тестов этого пользователя также будут удалены.\nЭто действие нельзя отменить.`)) {
        return;
    }
    
    try {
        showAlert(`Удаление пользователя "${username}"...`, 'warning');
        
        // Удаляем результаты тестов пользователя
        await supabase
            .from('test_results')
            .delete()
            .eq('username', username);
        
        // Удаляем пользователя
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', userId);
        
        if (error) throw error;
        
        // Обновляем список пользователей
        loadUserList();
        
        showAlert(`Пользователь "${username}" успешно удален`, 'success');
        
    } catch (error) {
        console.error('Ошибка удаления пользователя:', error);
        showAlert(`Ошибка удаления: ${error.message}`, 'error');
    }
}

function copyPassword(password) {
    navigator.clipboard.writeText(password).then(() => {
        showAlert('Пароль скопирован в буфер обмена', 'success');
    }).catch(err => {
        console.error('Ошибка копирования:', err);
        showAlert('Ошибка копирования', 'error');
    });
}

function copyUserInfo(username, password) {
    const text = `Данные для входа:\n\nИмя пользователя: ${username}\nПароль: ${password}\n\nСохраните эти данные для пользователя.`;
    
    navigator.clipboard.writeText(text).then(() => {
        showAlert(`Данные пользователя "${username}" скопированы`, 'success');
    }).catch(err => {
        console.error('Ошибка копирования:', err);
        showAlert('Ошибка копирования', 'error');
    });
}

function generatePassword() {
    const length = 8;
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    
    // Гарантируем наличие цифры
    password += Math.floor(Math.random() * 10);
    
    // Добавляем буквы
    for (let i = 1; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    // Перемешиваем
    password = password.split('').sort(() => 0.5 - Math.random()).join('');
    
    const passwordInput = document.getElementById('newPassword');
    if (passwordInput) {
        passwordInput.value = password;
        passwordInput.select();
    }
}

// ============ СОЗДАНИЕ ПАНЕЛИ УПРАВЛЕНИЯ ============
function createUserManagerPanel() {
    if (document.getElementById('userManagerPanel')) return;
    
    const panelHTML = `
        <div id="userManagerPanel" class="admins-admin-panel admins-hidden">
            <div class="admins-panel-header">
                <h3>Управление пользователями</h3>
                <button onclick="toggleUserManager(false)" class="admins-btn-small">Закрыть</button>
            </div>
            
            <div class="panel-content">
                <div class="add-user-section">
                    <h4>Добавить нового пользователя</h4>
                    <div class="form-group">
                        <input type="text" id="newUsername" class="admins-input-field" 
                               placeholder="Введите имя пользователя" maxlength="20">
                    </div>
                    <div class="form-group">
                        <div class="password-group">
                            <input type="text" id="newPassword" class="admins-input-field" 
                                   placeholder="Введите пароль или сгенерируйте">
                            <button onclick="generatePassword()" class="admins-btn-small" type="button">
                                Сгенерировать
                            </button>
                        </div>
                    </div>
                    <button onclick="addNewUser()" class="admins-btn admins-btn-success">
                        Добавить пользователя
                    </button>
                    <div id="userError" class="error-message"></div>
                </div>
                
                <div class="users-list-section">
                    <h4>Существующие пользователи</h4>
                    <div id="userList" class="users-list">
                        <div class="users-loading">Загрузка...</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const panel = document.createElement('div');
    panel.innerHTML = panelHTML;
    document.body.appendChild(panel.firstElementChild);
    
    // Добавляем дополнительные стили для панели
    const panelStyle = document.createElement('style');
    panelStyle.textContent = `
        #userManagerPanel {
            position: fixed;
            top: 100px;
            right: 20px;
            width: 500px;
            max-height: 80vh;
            overflow-y: auto;
            z-index: 10001;
            background: rgba(0, 0, 0, 0.95);
            border: 2px solid #ffa500;
            border-radius: 8px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        }
        
        .panel-content {
            padding: 20px;
        }
        
        .add-user-section {
            background: rgba(255, 165, 0, 0.1);
            padding: 20px;
            border-radius: 6px;
            margin-bottom: 25px;
            border: 1px solid rgba(255, 165, 0, 0.3);
        }
        
        .add-user-section h4 {
            color: #ffa500;
            margin: 0 0 15px 0;
            font-size: 16px;
            font-weight: 600;
        }
        
        .form-group {
            margin-bottom: 15px;
        }
        
        .password-group {
            display: flex;
            gap: 10px;
        }
        
        .password-group input {
            flex: 1;
        }
        
        .error-message {
            margin-top: 10px;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 14px;
            min-height: 20px;
        }
        
        .users-list-section h4 {
            color: #ffa500;
            margin: 0 0 15px 0;
            font-size: 16px;
            font-weight: 600;
        }
        
        .users-list {
            max-height: 400px;
            overflow-y: auto;
            padding-right: 5px;
        }
        
        .users-list::-webkit-scrollbar {
            width: 6px;
        }
        
        .users-list::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 3px;
        }
        
        .users-list::-webkit-scrollbar-thumb {
            background: rgba(255, 165, 0, 0.5);
            border-radius: 3px;
        }
        
        .users-list::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 165, 0, 0.7);
        }
    `;
    document.head.appendChild(panelStyle);
}

// ============ ОСНОВНЫЕ ФУНКЦИИ ============
function toggleUserManager(show) {
    if (!document.getElementById('userManagerPanel')) {
        createUserManagerPanel();
        addStyles();
    }
    
    const panel = document.getElementById('userManagerPanel');
    if (!panel) return;
    
    if (show) {
        panel.classList.remove('admins-hidden');
        loadUserList();
    } else {
        panel.classList.add('admins-hidden');
    }
}

function addUserManagerButton() {
    if (document.querySelector('#userManagerBtn')) return;
    
    const userBtn = document.createElement('button');
    userBtn.id = 'userManagerBtn';
    userBtn.textContent = 'Управление пользователями';
    userBtn.className = 'admins-btn admins-btn-primary';
    userBtn.style.cssText = `
        margin-top: 10px;
        width: 100%;
        padding: 12px;
        font-size: 16px;
        background: linear-gradient(135deg, #667eea, #764ba2);
        border: none;
        color: white;
        cursor: pointer;
        border-radius: 4px;
        font-weight: 600;
    `;
    
    userBtn.onmouseover = function() {
        this.style.transform = 'translateY(-1px)';
        this.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
    };
    
    userBtn.onmouseout = function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = 'none';
    };
    
    userBtn.onclick = () => toggleUserManager(true);
    
    const controls = document.querySelector('.admins-controls');
    if (controls) {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            controls.insertBefore(userBtn, logoutBtn);
        } else {
            controls.appendChild(userBtn);
        }
    }
}

// ============ ИНИЦИАЛИЗАЦИЯ ============
document.addEventListener('DOMContentLoaded', function() {
    console.log('Админ панель загружена');
    
    // Добавляем стили
    addStyles();
    
    // Проверяем наличие Supabase клиента
    if (!supabase) {
        console.error('Supabase клиент не инициализирован');
        showAlert('Ошибка: Supabase клиент не загружен', 'error');
        return;
    }
    
    // Загружаем контент
    loadContent().catch(console.error);
    
    // Инициализируем обработчики
    initEventHandlers();
});

function initEventHandlers() {
    // Вход в админ-панель
    document.getElementById('adminLoginBtn')?.addEventListener('click', function() {
        const loginModal = document.getElementById('loginModal');
        if (loginModal) {
            loginModal.classList.remove('admins-hidden');
            const passwordInput = document.getElementById('passwordInput');
            if (passwordInput) {
                passwordInput.value = '';
                passwordInput.focus();
            }
        }
    });
    
    // Кнопка входа
    document.getElementById('loginBtn')?.addEventListener('click', handleAdminLogin);
    
    // Отмена входа
    document.getElementById('cancelBtn')?.addEventListener('click', function() {
        document.getElementById('loginModal')?.classList.add('admins-hidden');
    });
    
    // Публикация изменений
    document.getElementById('publishBtn')?.addEventListener('click', publishChanges);
    
    // Выход из системы
    document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
    
    // Enter для ввода пароля
    document.getElementById('passwordInput')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleAdminLogin();
        }
    });
    
    // Закрытие модального окна по клику вне его
    document.getElementById('loginModal')?.addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.add('admins-hidden');
        }
    });
}

function handleAdminLogin() {
    const passwordInput = document.getElementById('passwordInput');
    if (!passwordInput) return;
    
    const password = passwordInput.value;
    
    if (!ADMIN_PASSWORD) {
        showAlert('Ошибка: пароль администратора не настроен', 'error');
        return;
    }
    
    if (password === ADMIN_PASSWORD) {
        isAdmin = true;
        document.getElementById('loginModal')?.classList.add('admins-hidden');
        toggleEditMode(true);
        
        // Создаем панель управления пользователями
        createUserManagerPanel();
        
        // Добавляем кнопку управления пользователями
        addUserManagerButton();
        
        showAlert('Админ-панель активирована', 'success');
    } else {
        showAlert('Неверный пароль', 'error');
        passwordInput.focus();
        passwordInput.select();
    }
}

function handleLogout() {
    isAdmin = false;
    toggleEditMode(false);
    loadContent().catch(console.error);
    
    // Скрываем панель управления пользователями
    document.getElementById('userManagerPanel')?.classList.add('admins-hidden');
    
    showAlert('Вы вышли из админ-панели', 'info');
}

// ============ ФУНКЦИИ ДЛЯ РЕДАКТИРОВАНИЯ КОНТЕНТА ============
async function loadContent() {
    try {
        if (!supabase) {
            throw new Error('Supabase клиент не инициализирован');
        }
        
        const { data, error } = await supabase
            .from('site_content')
            .select('*');

        if (error) throw error;

        if (data && data.length > 0) {
            data.forEach(item => {
                const elements = document.querySelectorAll(`[data-content-key="${item.content_key}"]`);
                elements.forEach(element => {
                    element.textContent = item.content_value;
                });
            });
        }
    } catch (error) {
        console.error('Ошибка загрузки контента:', error);
        showAlert(`Ошибка загрузки контента: ${error.message}`, 'error');
    }
}

async function publishChanges() {
    try {
        showAlert('Публикация изменений...', 'info');
        
        const elements = document.querySelectorAll('[data-content-key]');
        let savedCount = 0;

        for (const element of elements) {
            const key = element.getAttribute('data-content-key');
            const value = element.textContent;
            
            const { error } = await supabase
                .from('site_content')
                .upsert({ 
                    content_key: key, 
                    content_value: value 
                }, {
                    onConflict: 'content_key'
                });

            if (error) throw error;
            savedCount++;
        }

        showAlert(`Успешно опубликовано ${savedCount} элементов`, 'success');
        
    } catch (error) {
        console.error('Ошибка публикации:', error);
        showAlert(`Ошибка публикации: ${error.message}`, 'error');
    }
}

function toggleEditMode(enable) {
    const elements = document.querySelectorAll('[data-content-key]');
    
    elements.forEach(element => {
        element.contentEditable = enable;
        if (enable) {
            element.classList.add('admins-editable');
        } else {
            element.classList.remove('admins-editable');
        }
    });
    
    if (enable) {
        document.getElementById('adminPanel')?.classList.remove('admins-hidden');
        document.querySelectorAll('#adminLoginBtn').forEach(btn => {
            btn.style.display = 'none';
        });
    } else {
        document.getElementById('adminPanel')?.classList.add('admins-hidden');
        document.querySelectorAll('#adminLoginBtn').forEach(btn => {
            btn.style.display = 'block';
        });
    }
}

// ============ ЭКСПОРТ ФУНКЦИЙ ============
window.toggleUserManager = toggleUserManager;
window.loadUserList = loadUserList;
window.addNewUser = addNewUser;
window.deleteUser = deleteUser;
window.copyPassword = copyPassword;
window.copyUserInfo = copyUserInfo;
window.generatePassword = generatePassword;
