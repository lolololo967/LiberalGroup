// admin.js - без эмоджи
const SUPABASE_URL = 'https://eqkanneloooeopkhhpuc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxa2FubmVsb29vZW9wa2hocHVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5MDk1MDgsImV4cCI6MjA4MDQ4NTUwOH0.EL7ZR9iyRSPIOYudaFWDQC4z1hXzu0PPtE1McoVvGp0';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let isAdmin = false;

function showStatus(message, type = 'info') {
    const statusElement = document.getElementById('statusMessage');
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.className = 'admins-status admins-' + type;
    }
}

async function loadContent() {
    try {
        showStatus('Загрузка контента...');
        
        const { data, error } = await supabase
            .from('site_content')
            .select('*');

        if (error) {
            throw new Error('Ошибка загрузки: ' + error.message);
        }

        if (data && data.length > 0) {
            data.forEach(item => {
                const elements = document.querySelectorAll(`[data-content-key="${item.content_key}"]`);
                elements.forEach(element => {
                    element.textContent = item.content_value;
                });
            });
            showStatus('Контент загружен', 'success');
        } else {
            showStatus('Контент не найден', 'error');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        showStatus('Ошибка загрузки: ' + error.message, 'error');
    }
}

async function saveContent(key, value) {
    try {
        const { error } = await supabase
            .from('site_content')
            .upsert({ 
                content_key: key, 
                content_value: value 
            }, {
                onConflict: 'content_key'
            });

        if (error) {
            throw new Error('Ошибка сохранения: ' + error.message);
        }
        
        return true;
    } catch (error) {
        console.error('Ошибка сохранения:', error);
        throw error;
    }
}

async function publishChanges() {
    try {
        showStatus('Публикация изменений...');
        
        const elements = document.querySelectorAll('[data-content-key]');
        let savedCount = 0;

        for (const element of elements) {
            const key = element.getAttribute('data-content-key');
            const value = element.textContent;
            
            await saveContent(key, value);
            savedCount++;
        }

        showStatus(`Успешно опубликовано ${savedCount} элементов!`, 'success');
        
        setTimeout(() => {
            if (isAdmin) {
                showStatus('Режим редактирования активен');
            }
        }, 3000);

    } catch (error) {
        console.error('Ошибка публикации:', error);
        showStatus('Ошибка: ' + error.message, 'error');
    }
}

function toggleEditMode(enable) {
    const elements = document.querySelectorAll('[data-content-key]');
    
    console.log(`Найдено ${elements.length} элементов для редактирования`);
    
    elements.forEach(element => {
        element.contentEditable = enable;
        if (enable) {
            element.classList.add('admins-editable');

            if (element.tagName === 'BUTTON') {
                // Для кнопок ничего не меняем
            }
        } else {
            element.classList.remove('admins-editable');

            if (element.tagName === 'BUTTON') {
                element.style.border = '';
            }
        }
    });
    
    if (enable) {
        document.getElementById('adminPanel').classList.remove('admins-hidden');

        const adminLoginBtns = document.querySelectorAll('#adminLoginBtn');
        adminLoginBtns.forEach(btn => {
            btn.style.display = 'none';
        });
        showStatus('Режим редактирования активен', 'info');
    } else {
        document.getElementById('adminPanel').classList.add('admins-hidden');

        const adminLoginBtns = document.querySelectorAll('#adminLoginBtn');
        adminLoginBtns.forEach(btn => {
            btn.style.display = 'block';
        });
        showStatus('Режим редактирования выключен', 'info');
    }
}

// ФУНКЦИИ ДЛЯ УПРАВЛЕНИЯ ПАРОЛЯМИ

function togglePasswordManager(show) {
    const passwordPanel = document.getElementById('passwordManagerPanel');
    if (!passwordPanel) return;
    
    if (show) {
        passwordPanel.classList.remove('admins-hidden');
        loadPasswordList();
    } else {
        passwordPanel.classList.add('admins-hidden');
    }
}

async function loadPasswordList() {
    try {
        const { data: passwords, error } = await supabase
            .from('user_passwords')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const passwordList = document.getElementById('passwordList');
        if (!passwordList) return;
        
        if (!passwords || passwords.length === 0) {
            passwordList.innerHTML = '<p style="color: #ffa500; padding: 10px;">Нет созданных паролей</p>';
            return;
        }
        
        const passwordsHTML = passwords.map(pwd => `
            <div class="password-item">
                <div class="password-info">
                    <strong>${escapeHtml(pwd.username)}</strong>
                    <span>${escapeHtml(pwd.password)}</span>
                </div>
                <div class="password-actions">
                    <button onclick="copyPassword('${escapeHtml(pwd.password)}')" class="admins-btn-small">Копировать</button>
                    <button onclick="deletePassword(${pwd.id})" class="admins-btn-small admins-btn-danger">Удалить</button>
                </div>
                <div class="password-meta">
                    <small>Создан: ${new Date(pwd.created_at).toLocaleDateString('ru-RU')}</small>
                </div>
            </div>
        `).join('');
        
        passwordList.innerHTML = passwordsHTML;
        
    } catch (error) {
        console.error('Ошибка загрузки паролей:', error);
        document.getElementById('passwordList').innerHTML = 
            '<p style="color: #ff4444; padding: 10px;">Ошибка: ' + error.message + '</p>';
    }
}

async function addNewPassword() {
    const username = document.getElementById('newUsername').value.trim();
    const password = document.getElementById('newPassword').value.trim();
    const errorElement = document.getElementById('passwordError');
    
    if (!username || !password) {
        errorElement.textContent = 'Заполните все поля';
        errorElement.style.color = '#ff4444';
        return;
    }
    
    try {
        errorElement.textContent = 'Добавление...';
        errorElement.style.color = '#ffa500';
        
        const { data, error } = await supabase
            .from('user_passwords')
            .insert([{
                username: username,
                password: password,
                created_by: 'admin'
            }]);
        
        if (error) throw error;
        
        errorElement.textContent = 'Пароль добавлен!';
        errorElement.style.color = '#4CAF50';
        
        document.getElementById('newUsername').value = '';
        document.getElementById('newPassword').value = '';
        
        setTimeout(() => {
            loadPasswordList();
            errorElement.textContent = '';
        }, 2000);
        
    } catch (error) {
        console.error('Ошибка добавления пароля:', error);
        errorElement.textContent = 'Ошибка: ' + error.message;
        errorElement.style.color = '#ff4444';
    }
}

async function deletePassword(passwordId) {
    if (!confirm('Удалить этот пароль?')) return;
    
    try {
        const { error } = await supabase
            .from('user_passwords')
            .delete()
            .eq('id', passwordId);
        
        if (error) throw error;
        
        showStatus('Пароль удален', 'success');
        loadPasswordList();
        
    } catch (error) {
        console.error('Ошибка удаления пароля:', error);
        showStatus('Ошибка удаления: ' + error.message, 'error');
    }
}

function copyPassword(password) {
    navigator.clipboard.writeText(password).then(() => {
        showStatus('Пароль скопирован', 'success');
    }).catch(err => {
        console.error('Ошибка копирования:', err);
    });
}

function generatePassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    document.getElementById('newPassword').value = password;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ОСНОВНАЯ ИНИЦИАЛИЗАЦИЯ

document.addEventListener('DOMContentLoaded', function() {
    console.log('Админ панель загружена');
    
    loadContent();
    
    const adminLoginBtn = document.getElementById('adminLoginBtn');
    const loginBtn = document.getElementById('loginBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const publishBtn = document.getElementById('publishBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // Вход в админ-панель
    adminLoginBtn.addEventListener('click', function() {
        document.getElementById('loginModal').classList.remove('admins-hidden');
        document.getElementById('passwordInput').value = '';
        document.getElementById('passwordInput').focus();
    });

    // Кнопка входа - используем пароль из Vercel
    loginBtn.addEventListener('click', async function() {
        const password = document.getElementById('passwordInput').value;
        
        if (!password) {
            alert('Введите пароль');
            return;
        }
        
        loginBtn.textContent = 'Проверка...';
        loginBtn.disabled = true;
        
        try {
            // Проверяем пароль через API Vercel
            const response = await fetch('/api/verify-admin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password: password.trim() })
            });
            
            const result = await response.json();
            
            if (result.success) {
                isAdmin = true;
                document.getElementById('loginModal').classList.add('admins-hidden');
                toggleEditMode(true);
                console.log('Успешный вход в админ-панель');
                
                // Создаем панель управления паролями
                createPasswordManagerPanel();
                
                // Добавляем кнопку управления паролями
                addPasswordManagerButton();
                
            } else {
                alert('Неверный пароль');
                document.getElementById('passwordInput').focus();
                document.getElementById('passwordInput').select();
            }
        } catch (error) {
            console.error('Ошибка проверки пароля:', error);
            alert('Ошибка соединения с сервером');
        } finally {
            loginBtn.textContent = 'Войти';
            loginBtn.disabled = false;
        }
    });

    cancelBtn.addEventListener('click', function() {
        document.getElementById('loginModal').classList.add('admins-hidden');
    });

    publishBtn.addEventListener('click', publishChanges);

    logoutBtn.addEventListener('click', function() {
        isAdmin = false;
        toggleEditMode(false);
        loadContent();
    });

    // Enter для ввода пароля
    document.getElementById('passwordInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            loginBtn.click();
        }
    });

    // Закрытие модального окна при клике вне его
    document.getElementById('loginModal').addEventListener('click', function(e) {
        if (e.target === this) {
            document.getElementById('loginModal').classList.add('admins-hidden');
        }
    });

    // Режим реального времени для контента
    supabase
        .channel('public:site_content')
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'site_content' }, 
            (payload) => {
                console.log('Получено обновление:', payload);
                if (!isAdmin) {
                    const newData = payload.new;
                    const elements = document.querySelectorAll(`[data-content-key="${newData.content_key}"]`);
                    elements.forEach(element => {
                        element.textContent = newData.content_value;
                    });
                }
            }
        )
        .subscribe();
});

// Создание панели управления паролями
function createPasswordManagerPanel() {
    if (document.getElementById('passwordManagerPanel')) return;
    
    const passwordPanelHTML = `
        <div id="passwordManagerPanel" class="password-manager-panel admins-hidden">
            <div class="admins-panel-header">
                <h3>Управление паролями</h3>
                <button onclick="togglePasswordManager(false)" class="admins-btn-small">X</button>
            </div>
            
            <div class="password-manager-section">
                <h4>Добавить новый пароль</h4>
                <div class="password-form">
                    <input type="text" id="newUsername" class="admins-input-field" placeholder="Никнейм пользователя" maxlength="20">
                    <div class="password-input-group">
                        <input type="text" id="newPassword" class="admins-input-field" placeholder="Пароль">
                        <button onclick="generatePassword()" class="admins-btn-small" type="button">Сгенерировать</button>
                    </div>
                    <button onclick="addNewPassword()" class="admins-btn admins-btn-success">Добавить пароль</button>
                    <div id="passwordError" style="margin-top: 10px; min-height: 20px;"></div>
                </div>
            </div>
            
            <div class="password-manager-section">
                <h4>Существующие пароли</h4>
                <div id="passwordList" class="password-list">
                    <p style="color: #ffa500; padding: 10px;">Загрузка...</p>
                </div>
            </div>
        </div>
    `;
    
    const panel = document.createElement('div');
    panel.innerHTML = passwordPanelHTML;
    document.body.appendChild(panel);
    
    // Добавляем стили
    addPasswordManagerStyles();
}

// Добавление кнопки управления паролями
function addPasswordManagerButton() {
    const passwordBtn = document.createElement('button');
    passwordBtn.innerHTML = 'Управление паролями';
    passwordBtn.className = 'admins-btn admins-btn-primary';
    passwordBtn.style.marginTop = '10px';
    passwordBtn.onclick = () => togglePasswordManager(true);
    
    const controls = document.querySelector('.admins-controls');
    if (controls) {
        controls.appendChild(passwordBtn);
    }
}

// Добавление стилей для панели паролей
function addPasswordManagerStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .password-manager-panel {
            position: fixed;
            top: 70px;
            left: 20px;
            width: 350px;
            max-height: 80vh;
            overflow-y: auto;
            background: rgba(1, 1, 1, 0.95);
            border: 1px solid #ffa500;
            z-index: 9999;
            padding: 20px;
            backdrop-filter: blur(3px);
            clip-path: polygon(0 0, 99% 1%, 100% 100%, 1% 99%);
        }
        
        .password-manager-section {
            margin: 20px 0;
            padding: 15px;
            border: 1px solid rgba(255, 165, 0, 0.3);
            background: rgba(0, 0, 0, 0.5);
        }
        
        .password-manager-section h4 {
            color: #ffa500;
            margin-bottom: 15px;
            font-weight: 100;
            border-bottom: 1px dashed rgba(255, 165, 0, 0.3);
            padding-bottom: 5px;
        }
        
        .password-form {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .password-input-group {
            display: flex;
            gap: 5px;
        }
        
        .password-input-group input {
            flex: 1;
        }
        
        .password-list {
            max-height: 300px;
            overflow-y: auto;
            margin-top: 10px;
        }
        
        .password-item {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 165, 0, 0.2);
            padding: 10px;
            margin-bottom: 10px;
            border-radius: 4px;
        }
        
        .password-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
        }
        
        .password-info strong {
            color: #ffa500;
        }
        
        .password-info span {
            color: #4CAF50;
            font-family: monospace;
            background: rgba(0, 0, 0, 0.3);
            padding: 2px 6px;
            border-radius: 3px;
        }
        
        .password-actions {
            display: flex;
            gap: 5px;
            margin: 8px 0;
        }
        
        .password-actions button {
            flex: 1;
            padding: 4px 8px;
            font-size: 12px;
        }
        
        .password-meta {
            font-size: 11px;
            color: #888;
            text-align: right;
        }
        
        .admins-btn-small {
            padding: 4px 8px !important;
            font-size: 12px !important;
            border: 1px solid #666 !important;
        }
    `;
    document.head.appendChild(style);
}
