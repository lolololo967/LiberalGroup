// admin.js - управление пользователями (никнейм + пароль)
const SUPABASE_URL = 'https://eqkanneloooeopkhhpuc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxa2FubmVsb29vZW9wa2hocHVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5MDk1MDgsImV4cCI6MjA4MDQ4NTUwOH0.EL7ZR9iyRSPIOYudaFWDQC4z1hXzu0PPtE1McoVvGp0';

// Создаем клиент с настройками CORS
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    headers: {
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json',
    }
});

let isAdmin = false;

// Получаем пароль админа из переменных окружения Vercel
const ADMIN_PASSWORD = (() => {
    // Пробуем получить из глобальных переменных Vercel
    if (typeof window !== 'undefined' && window.ENV && window.ENV.ADMIN_PASSWORD) {
        return window.ENV.ADMIN_PASSWORD;
    }
    
    // Для локальной разработки
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        return 'admin123'; // ваш локальный пароль
    }
    
    // Fallback (удалите в продакшене)
    return 'admin123';
})();

console.log('Admin password loaded:', ADMIN_PASSWORD ? 'YES' : 'NO');

// ============ УТИЛИТЫ ============
function showStatus(message, type = 'info') {
    const statusElement = document.getElementById('statusMessage');
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.className = 'admins-status admins-' + type;
    }
    // Также показываем уведомление
    showNotification(message, type);
}

function showNotification(message, type = 'info') {
    // Удаляем старые уведомления
    const oldNotifications = document.querySelectorAll('.admin-notification');
    oldNotifications.forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `admin-notification admin-notification-${type}`;
    notification.innerHTML = `
        <div class="admin-notification-content">
            ${message}
            <button onclick="this.parentElement.parentElement.remove()" style="margin-left: 10px; background: none; border: none; color: white; cursor: pointer;">×</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Автоматическое скрытие через 5 секунд
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// ============ СТИЛИ ДЛЯ УВЕДОМЛЕНИЙ ============
function addNotificationStyles() {
    if (!document.querySelector('#admin-notification-styles')) {
        const style = document.createElement('style');
        style.id = 'admin-notification-styles';
        style.textContent = `
            .admin-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 4px;
                color: white;
                font-weight: bold;
                z-index: 99999;
                min-width: 300px;
                max-width: 400px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                animation: slideIn 0.3s ease-out;
            }
            
            .admin-notification-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .admin-notification-success {
                background: linear-gradient(135deg, #4CAF50, #2E7D32);
                border-left: 5px solid #2E7D32;
            }
            
            .admin-notification-error {
                background: linear-gradient(135deg, #f44336, #c62828);
                border-left: 5px solid #c62828;
            }
            
            .admin-notification-info {
                background: linear-gradient(135deg, #2196F3, #1565C0);
                border-left: 5px solid #1565C0;
            }
            
            .admin-notification-warning {
                background: linear-gradient(135deg, #ff9800, #ef6c00);
                border-left: 5px solid #ef6c00;
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// ============ ОБРАБОТКА ОШИБОК ============
async function handleSupabaseError(operation, error) {
    console.error(`Ошибка ${operation}:`, error);
    
    let errorMessage = `Ошибка ${operation}: `;
    
    if (error.message && error.message.includes('Failed to fetch')) {
        errorMessage += 'Нет соединения с сервером. Проверьте интернет-соединение.';
    } else if (error.code === '23505') {
        errorMessage += 'Запись уже существует.';
    } else if (error.message) {
        errorMessage += error.message;
    } else {
        errorMessage += 'Неизвестная ошибка сервера.';
    }
    
    showStatus(errorMessage, 'error');
    return null;
}

// ============ УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ ============
async function loadUserList() {
    try {
        showNotification('Загрузка пользователей...', 'info');
        
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            throw error;
        }
        
        const userList = document.getElementById('userList');
        if (!userList) return;
        
        if (!users || users.length === 0) {
            userList.innerHTML = `
                <div style="text-align: center; padding: 30px; color: #ffa500;">
                    <p>Нет созданных пользователей</p>
                    <small>Добавьте первого пользователя</small>
                </div>
            `;
            return;
        }
        
        const usersHTML = users.map(user => `
            <div class="user-item" data-user-id="${user.id}">
                <div class="user-info">
                    <strong>${escapeHtml(user.username)}</strong>
                    <span class="user-password">${escapeHtml(user.password)}</span>
                </div>
                <div class="user-stats">
                    <small>Тестов пройдено: ${user.tests_taken || 0}</small>
                    <small>Последний тест: ${user.last_test ? formatDate(user.last_test) : 'никогда'}</small>
                </div>
                <div class="user-actions">
                    <button onclick="copyPassword('${escapeHtml(user.password)}')" class="admins-btn-small">
                        <span>📋</span> Пароль
                    </button>
                    <button onclick="copyUserInfo('${escapeHtml(user.username)}', '${escapeHtml(user.password)}')" class="admins-btn-small">
                        <span>👤</span> Данные
                    </button>
                    <button onclick="deleteUser(${user.id})" class="admins-btn-small admins-btn-danger">
                        <span>🗑️</span> Удалить
                    </button>
                </div>
                <div class="user-meta">
                    <small>ID: ${user.id} • Создан: ${formatDate(user.created_at)}</small>
                </div>
            </div>
        `).join('');
        
        userList.innerHTML = usersHTML;
        showNotification(`Загружено ${users.length} пользователей`, 'success');
        
    } catch (error) {
        handleSupabaseError('загрузки пользователей', error);
    }
}

async function addNewUser() {
    const usernameInput = document.getElementById('newUsername');
    const passwordInput = document.getElementById('newPassword');
    const errorElement = document.getElementById('userError');
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    
    // Валидация
    if (!username || !password) {
        errorElement.textContent = 'Заполните все поля';
        errorElement.className = 'admins-error';
        return;
    }
    
    if (username.length < 2 || username.length > 20) {
        errorElement.textContent = 'Имя пользователя: 2-20 символов';
        errorElement.className = 'admins-error';
        return;
    }
    
    if (password.length < 4) {
        errorElement.textContent = 'Пароль минимум 4 символа';
        errorElement.className = 'admins-error';
        return;
    }
    
    try {
        errorElement.textContent = 'Добавление...';
        errorElement.className = 'admins-info';
        
        // Проверяем существование пользователя
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('username', username)
            .single();
        
        if (existingUser) {
            errorElement.textContent = 'Это имя пользователя уже занято';
            errorElement.className = 'admins-error';
            usernameInput.focus();
            return;
        }
        
        // Добавляем пользователя
        const { data, error } = await supabase
            .from('users')
            .insert([{
                username: username,
                password: password,
                created_by: 'admin',
                tests_taken: 0,
                created_at: new Date().toISOString()
            }])
            .select();
        
        if (error) throw error;
        
        errorElement.textContent = '✓ Пользователь добавлен';
        errorElement.className = 'admins-success';
        
        // Очищаем поля
        usernameInput.value = '';
        passwordInput.value = '';
        usernameInput.focus();
        
        // Обновляем список
        setTimeout(() => {
            loadUserList();
            errorElement.textContent = '';
            errorElement.className = '';
        }, 2000);
        
    } catch (error) {
        handleSupabaseError('добавления пользователя', error);
        errorElement.textContent = 'Ошибка при добавлении пользователя';
        errorElement.className = 'admins-error';
    }
}

async function deleteUser(userId) {
    if (!confirm('Удалить этого пользователя и все его результаты?\n\nЭто действие нельзя отменить.')) {
        return;
    }
    
    try {
        showNotification('Удаление пользователя...', 'warning');
        
        // Удаляем результаты тестов пользователя
        const userItem = document.querySelector(`.user-item[data-user-id="${userId}"]`);
        const username = userItem ? userItem.querySelector('strong').textContent : null;
        
        if (username) {
            await supabase
                .from('test_results')
                .delete()
                .eq('username', username);
        }
        
        // Удаляем пользователя
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', userId);
        
        if (error) throw error;
        
        showNotification('Пользователь удален', 'success');
        loadUserList();
        
    } catch (error) {
        handleSupabaseError('удаления пользователя', error);
    }
}

// ============ ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ============
function formatDate(dateString) {
    if (!dateString) return 'никогда';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function copyPassword(password) {
    navigator.clipboard.writeText(password).then(() => {
        showNotification('Пароль скопирован в буфер обмена', 'success');
    }).catch(err => {
        console.error('Ошибка копирования:', err);
        showNotification('Ошибка копирования', 'error');
    });
}

function copyUserInfo(username, password) {
    const text = `Имя пользователя: ${username}\nПароль: ${password}\n\nСообщите эти данные пользователю для входа в систему.`;
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Данные пользователя скопированы', 'success');
    }).catch(err => {
        console.error('Ошибка копирования:', err);
        showNotification('Ошибка копирования', 'error');
    });
}

function generatePassword() {
    const length = 8;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    
    // Добавляем хотя бы одну цифру
    password += Math.floor(Math.random() * 10);
    
    // Добавляем остальные символы
    for (let i = 1; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    // Перемешиваем
    password = password.split('').sort(() => 0.5 - Math.random()).join('');
    
    document.getElementById('newPassword').value = password;
    
    // Автоматически выделяем для удобства копирования
    setTimeout(() => {
        document.getElementById('newPassword').select();
    }, 100);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============ СОЗДАНИЕ ПАНЕЛИ УПРАВЛЕНИЯ ============
function createUserManagerPanel() {
    if (document.getElementById('userManagerPanel')) return;
    
    const userPanelHTML = `
        <div id="userManagerPanel" class="admins-admin-panel admins-hidden" style="position: fixed; top: 100px; right: 20px; width: 500px; max-height: 80vh; overflow-y: auto; z-index: 10001;">
            <div class="admins-panel-header" style="cursor: move; padding: 15px; background: rgba(255, 165, 0, 0.2);">
                <h3 style="margin: 0; color: #ffa500;">👥 Управление пользователями</h3>
                <button onclick="toggleUserManager(false)" class="admins-btn-small" style="padding: 5px 10px; background: transparent; border: 1px solid #ffa500; color: #ffa500;">✕</button>
            </div>
            
            <div style="padding: 15px;">
                <div style="margin-bottom: 25px; background: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 4px;">
                    <h4 style="color: #ffa500; margin: 0 0 15px 0; font-weight: 100; font-size: 16px;">➕ Добавить нового пользователя</h4>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <input type="text" 
                               id="newUsername" 
                               class="admins-input-field" 
                               placeholder="Введите имя пользователя" 
                               maxlength="20"
                               style="padding: 10px;">
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <input type="text" 
                                   id="newPassword" 
                                   class="admins-input-field" 
                                   placeholder="Введите пароль" 
                                   style="flex: 1; padding: 10px;">
                            <button onclick="generatePassword()" 
                                    class="admins-btn-small" 
                                    type="button"
                                    style="padding: 10px 15px; white-space: nowrap;">
                                🎲 Сгенерировать
                            </button>
                        </div>
                        <button onclick="addNewUser()" 
                                class="admins-btn admins-btn-success"
                                style="padding: 12px; font-size: 16px;">
                            ➕ Добавить пользователя
                        </button>
                        <div id="userError" style="margin-top: 10px; min-height: 20px; padding: 5px; border-radius: 3px;"></div>
                    </div>
                </div>
                
                <div style="background: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 4px;">
                    <h4 style="color: #ffa500; margin: 0 0 15px 0; font-weight: 100; font-size: 16px;">📋 Существующие пользователи (${document.querySelectorAll('.user-item')?.length || 0})</h4>
                    <div id="userList" style="max-height: 400px; overflow-y: auto; margin-top: 10px; padding-right: 5px;">
                        <p style="color: #ffa500; padding: 20px; text-align: center;">Загрузка...</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const panel = document.createElement('div');
    panel.innerHTML = userPanelHTML;
    document.body.appendChild(panel.firstElementChild);
    
    // Добавляем стили
    addUserPanelStyles();
    addNotificationStyles();
}

function addUserPanelStyles() {
    if (!document.querySelector('#user-panel-styles')) {
        const style = document.createElement('style');
        style.id = 'user-panel-styles';
        style.textContent = `
            .user-item {
                background: linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,165,0,0.05));
                border: 1px solid rgba(255, 165, 0, 0.3);
                padding: 12px;
                margin-bottom: 12px;
                border-radius: 6px;
                transition: all 0.3s ease;
            }
            
            .user-item:hover {
                border-color: rgba(255, 165, 0, 0.6);
                box-shadow: 0 2px 8px rgba(255, 165, 0, 0.2);
            }
            
            .user-info {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
            }
            
            .user-info strong {
                color: #ffa500;
                font-size: 18px;
                font-weight: 600;
            }
            
            .user-password {
                color: #4CAF50;
                font-family: 'Courier New', monospace;
                background: rgba(0, 0, 0, 0.4);
                padding: 4px 10px;
                border-radius: 4px;
                font-weight: bold;
                letter-spacing: 1px;
            }
            
            .user-stats {
                display: flex;
                justify-content: space-between;
                font-size: 13px;
                color: #aaa;
                margin: 6px 0;
                padding: 4px 0;
                border-bottom: 1px solid rgba(255,255,255,0.1);
            }
            
            .user-actions {
                display: flex;
                gap: 6px;
                margin: 10px 0;
            }
            
            .user-actions button {
                flex: 1;
                padding: 6px 10px;
                font-size: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 5px;
            }
            
            .user-actions button span {
                font-size: 14px;
            }
            
            .user-meta {
                font-size: 11px;
                color: #888;
                text-align: center;
                padding-top: 5px;
                border-top: 1px dashed rgba(255,255,255,0.1);
            }
            
            .admins-success {
                color: #4CAF50 !important;
                background: rgba(76, 175, 80, 0.1) !important;
                padding: 8px !important;
                border-radius: 4px !important;
                border-left: 4px solid #4CAF50 !important;
            }
            
            .admins-error {
                color: #f44336 !important;
                background: rgba(244, 67, 54, 0.1) !important;
                padding: 8px !important;
                border-radius: 4px !important;
                border-left: 4px solid #f44336 !important;
            }
            
            .admins-info {
                color: #2196F3 !important;
                background: rgba(33, 150, 243, 0.1) !important;
                padding: 8px !important;
                border-radius: 4px !important;
                border-left: 4px solid #2196F3 !important;
            }
        `;
        document.head.appendChild(style);
    }
}

// ============ ДОБАВЛЕНИЕ КНОПКИ УПРАВЛЕНИЯ ============
function addUserManagerButton() {
    if (document.querySelector('#userManagerBtn')) return;
    
    const userBtn = document.createElement('button');
    userBtn.id = 'userManagerBtn';
    userBtn.innerHTML = '👥 Управление пользователями';
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
        transition: all 0.3s ease;
    `;
    
    userBtn.onmouseover = function() {
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
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

// ============ ОСНОВНЫЕ ФУНКЦИИ ============
function toggleUserManager(show) {
    const userPanel = document.getElementById('userManagerPanel');
    if (!userPanel) {
        createUserManagerPanel();
        return toggleUserManager(show);
    }
    
    if (show) {
        userPanel.classList.remove('admins-hidden');
        loadUserList();
    } else {
        userPanel.classList.add('admins-hidden');
    }
}

// ============ ИНИЦИАЛИЗАЦИЯ ============
document.addEventListener('DOMContentLoaded', function() {
    console.log('Админ панель загружена');
    
    // Добавляем стили уведомлений
    addNotificationStyles();
    
    // Загружаем контент
    loadContent().catch(console.error);
    
    // Инициализируем обработчики событий
    initEventListeners();
    
    // Подписываемся на обновления в реальном времени
    initRealtimeSubscription();
});

function initEventListeners() {
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
    
    // Закрытие модального окна
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
        showNotification('Системная ошибка: пароль администратора не настроен', 'error');
        return;
    }
    
    if (password === ADMIN_PASSWORD) {
        isAdmin = true;
        document.getElementById('loginModal')?.classList.add('admins-hidden');
        toggleEditMode(true);
        console.log('Успешный вход в админ-панель');
        
        // Создаем панель управления пользователями
        createUserManagerPanel();
        
        // Добавляем кнопку управления пользователями
        addUserManagerButton();
        
        showNotification('Админ-панель активирована', 'success');
    } else {
        showNotification('Неверный пароль', 'error');
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
    
    showNotification('Вы вышли из админ-панели', 'info');
}

function initRealtimeSubscription() {
    try {
        supabase
            .channel('public:site_content')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'site_content' }, 
                (payload) => {
                    if (!isAdmin) {
                        const newData = payload.new;
                        const elements = document.querySelectorAll(`[data-content-key="${newData.content_key}"]`);
                        elements.forEach(element => {
                            element.textContent = newData.content_value;
                        });
                    }
                }
            )
            .subscribe((status) => {
                console.log('Realtime subscription status:', status);
            });
    } catch (error) {
        console.error('Ошибка подписки на обновления:', error);
    }
}

// ============ ФУНКЦИИ ДЛЯ РЕДАКТИРОВАНИЯ КОНТЕНТА ============
async function loadContent() {
    try {
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
        handleSupabaseError('загрузки контента', error);
    }
}

async function publishChanges() {
    try {
        showNotification('Публикация изменений...', 'info');
        
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

        showNotification(`Успешно опубликовано ${savedCount} элементов!`, 'success');
        
    } catch (error) {
        handleSupabaseError('публикации изменений', error);
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

// Экспортируем функции для использования в HTML
window.toggleUserManager = toggleUserManager;
window.loadUserList = loadUserList;
window.addNewUser = addNewUser;
window.deleteUser = deleteUser;
window.copyPassword = copyPassword;
window.copyUserInfo = copyUserInfo;
window.generatePassword = generatePassword;
