// admin.js - управление пользователями (никнейм + пароль)
const SUPABASE_URL = 'https://client.falixnodes.net/verypleasedisable';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxa2FubmVsb29vZW9wa2hocHVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5MDk1MDgsImV4cCI6MjA4MDQ4NTUwOH0.EL7ZR9iyRSPIOYudaFWDQC4z1hXzu0PPtE1McoVvGp0';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let isAdmin = false;

// Получаем пароль админа из переменных окружения Vercel
// В Vercel установите переменную ADMIN_PASSWORD в настройках проекта
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 
                      import.meta.env?.VITE_ADMIN_PASSWORD || 
                      window.__ENV?.ADMIN_PASSWORD || 
                      'admin123'; // fallback для разработки

console.log('Admin password loaded:', ADMIN_PASSWORD ? '***' : 'NOT SET');

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
    
    elements.forEach(element => {
        element.contentEditable = enable;
        if (enable) {
            element.classList.add('admins-editable');
        } else {
            element.classList.remove('admins-editable');
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

// ФУНКЦИИ ДЛЯ УПРАВЛЕНИЯ ПОЛЬЗОВАТЕЛЯМИ

function toggleUserManager(show) {
    const userPanel = document.getElementById('userManagerPanel');
    if (!userPanel) return;
    
    if (show) {
        userPanel.classList.remove('admins-hidden');
        loadUserList();
    } else {
        userPanel.classList.add('admins-hidden');
    }
}

async function loadUserList() {
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const userList = document.getElementById('userList');
        if (!userList) return;
        
        if (!users || users.length === 0) {
            userList.innerHTML = '<p style="color: #ffa500; padding: 10px;">Нет созданных пользователей</p>';
            return;
        }
        
        const usersHTML = users.map(user => `
            <div class="user-item">
                <div class="user-info">
                    <strong>${escapeHtml(user.username)}</strong>
                    <span>${escapeHtml(user.password)}</span>
                </div>
                <div class="user-stats">
                    <small>Тестов пройдено: ${user.tests_taken || 0}</small>
                    <small>Последний тест: ${user.last_test ? new Date(user.last_test).toLocaleDateString('ru-RU') : 'никогда'}</small>
                </div>
                <div class="user-actions">
                    <button onclick="copyPassword('${escapeHtml(user.password)}')" class="admins-btn-small">Копировать пароль</button>
                    <button onclick="copyUserInfo('${escapeHtml(user.username)}', '${escapeHtml(user.password)}')" class="admins-btn-small">Копировать данные</button>
                    <button onclick="deleteUser(${user.id})" class="admins-btn-small admins-btn-danger">Удалить</button>
                </div>
                <div class="user-meta">
                    <small>Создан: ${new Date(user.created_at).toLocaleDateString('ru-RU')}</small>
                </div>
            </div>
        `).join('');
        
        userList.innerHTML = usersHTML;
        
    } catch (error) {
        console.error('Ошибка загрузки пользователей:', error);
        document.getElementById('userList').innerHTML = 
            '<p style="color: #ff4444; padding: 10px;">Ошибка: ' + error.message + '</p>';
    }
}

async function addNewUser() {
    const username = document.getElementById('newUsername').value.trim();
    const password = document.getElementById('newPassword').value.trim();
    const errorElement = document.getElementById('userError');
    
    if (!username || !password) {
        errorElement.textContent = 'Заполните все поля';
        errorElement.style.color = '#ff4444';
        return;
    }
    
    if (username.length < 2 || username.length > 20) {
        errorElement.textContent = 'Имя пользователя: 2-20 символов';
        errorElement.style.color = '#ff4444';
        return;
    }
    
    if (password.length < 4) {
        errorElement.textContent = 'Пароль минимум 4 символа';
        errorElement.style.color = '#ff4444';
        return;
    }
    
    try {
        errorElement.textContent = 'Добавление...';
        errorElement.style.color = '#ffa500';
        
        const { data, error } = await supabase
            .from('users')
            .insert([{
                username: username,
                password: password,
                created_by: 'admin',
                tests_taken: 0
            }]);
        
        if (error) throw error;
        
        errorElement.textContent = 'Пользователь добавлен!';
        errorElement.style.color = '#4CAF50';
        
        document.getElementById('newUsername').value = '';
        document.getElementById('newPassword').value = '';
        
        setTimeout(() => {
            loadUserList();
            errorElement.textContent = '';
        }, 2000);
        
    } catch (error) {
        console.error('Ошибка добавления пользователя:', error);
        if (error.code === '23505') {
            errorElement.textContent = 'Это имя пользователя уже занято';
        } else {
            errorElement.textContent = 'Ошибка: ' + error.message;
        }
        errorElement.style.color = '#ff4444';
    }
}

async function deleteUser(userId) {
    if (!confirm('Удалить этого пользователя и все его результаты?')) return;
    
    try {
        // Сначала удаляем результаты тестов пользователя
        const { error: resultsError } = await supabase
            .from('test_results')
            .delete()
            .eq('username', 'username_placeholder'); // Нужно сначала получить имя пользователя
        
        // Затем удаляем самого пользователя
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', userId);
        
        if (error) throw error;
        
        showStatus('Пользователь удален', 'success');
        loadUserList();
        
    } catch (error) {
        console.error('Ошибка удаления пользователя:', error);
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

function copyUserInfo(username, password) {
    const text = `Имя пользователя: ${username}\nПароль: ${password}\n\nСообщите эти данные пользователю.`;
    navigator.clipboard.writeText(text).then(() => {
        showStatus('Данные пользователя скопированы', 'success');
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
    console.log('Admin password available:', ADMIN_PASSWORD ? 'YES' : 'NO');
    
    loadContent();
    
    const adminLoginBtn = document.getElementById('adminLoginBtn');
    const loginBtn = document.getElementById('loginBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const publishBtn = document.getElementById('publishBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // Проверяем, доступен ли пароль админа
    if (!ADMIN_PASSWORD || ADMIN_PASSWORD === 'admin123') {
        console.warn('ВНИМАНИЕ: ADMIN_PASSWORD не установлен или используется пароль по умолчанию!');
        console.warn('Установите переменную окружения ADMIN_PASSWORD в настройках Vercel');
    }
    
    // Вход в админ-панель
    adminLoginBtn.addEventListener('click', function() {
        document.getElementById('loginModal').classList.remove('admins-hidden');
        document.getElementById('passwordInput').value = '';
        document.getElementById('passwordInput').focus();
    });

    // Кнопка входа
    loginBtn.addEventListener('click', function() {
        const password = document.getElementById('passwordInput').value;
        
        if (!ADMIN_PASSWORD || ADMIN_PASSWORD === '') {
            alert('Системная ошибка: пароль администратора не настроен');
            return;
        }
        
        if (password === ADMIN_PASSWORD) {
            isAdmin = true;
            document.getElementById('loginModal').classList.add('admins-hidden');
            toggleEditMode(true);
            console.log('Успешный вход в админ-панель');
            
            // Создаем панель управления пользователями
            createUserManagerPanel();
            
            // Добавляем кнопку управления пользователями
            addUserManagerButton();
            
        } else {
            alert('Неверный пароль');
            document.getElementById('passwordInput').focus();
            document.getElementById('passwordInput').select();
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

    // Закрытие модального окна
    document.getElementById('loginModal').addEventListener('click', function(e) {
        if (e.target === this) {
            document.getElementById('loginModal').classList.add('admins-hidden');
        }
    });

    // Режим реального времени
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
        .subscribe();
});

// Создание панели управления пользователями
function createUserManagerPanel() {
    if (document.getElementById('userManagerPanel')) return;
    
    const userPanelHTML = `
        <div id="userManagerPanel" class="user-manager-panel admins-hidden">
            <div class="admins-panel-header">
                <h3>Управление пользователями</h3>
                <button onclick="toggleUserManager(false)" class="admins-btn-small">X</button>
            </div>
            
            <div class="user-manager-section">
                <h4>Добавить нового пользователя</h4>
                <div class="user-form">
                    <input type="text" id="newUsername" class="admins-input-field" placeholder="Имя пользователя" maxlength="20">
                    <div class="user-input-group">
                        <input type="text" id="newPassword" class="admins-input-field" placeholder="Пароль">
                        <button onclick="generatePassword()" class="admins-btn-small" type="button">Сгенерировать</button>
                    </div>
                    <button onclick="addNewUser()" class="admins-btn admins-btn-success">Добавить пользователя</button>
                    <div id="userError" style="margin-top: 10px; min-height: 20px;"></div>
                </div>
            </div>
            
            <div class="user-manager-section">
                <h4>Существующие пользователи</h4>
                <div id="userList" class="user-list">
                    <p style="color: #ffa500; padding: 10px;">Загрузка...</p>
                </div>
            </div>
        </div>
    `;
    
    const panel = document.createElement('div');
    panel.innerHTML = userPanelHTML;
    document.body.appendChild(panel);
    
    addUserManagerStyles();
}

// Добавление кнопки управления пользователями
function addUserManagerButton() {
    const userBtn = document.createElement('button');
    userBtn.innerHTML = 'Управление пользователями';
    userBtn.className = 'admins-btn admins-btn-primary';
    userBtn.style.marginTop = '10px';
    userBtn.onclick = () => toggleUserManager(true);
    
    const controls = document.querySelector('.admins-controls');
    if (controls) {
        controls.appendChild(userBtn);
    }
}

// Добавление стилей
function addUserManagerStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .user-manager-panel {
            position: fixed;
            top: 70px;
            left: 20px;
            width: 400px;
            max-height: 80vh;
            overflow-y: auto;
            background: rgba(1, 1, 1, 0.95);
            border: 1px solid #ffa500;
            z-index: 9999;
            padding: 20px;
            backdrop-filter: blur(3px);
            clip-path: polygon(0 0, 99% 1%, 100% 100%, 1% 99%);
        }
        
        .user-manager-section {
            margin: 20px 0;
            padding: 15px;
            border: 1px solid rgba(255, 165, 0, 0.3);
            background: rgba(0, 0, 0, 0.5);
        }
        
        .user-manager-section h4 {
            color: #ffa500;
            margin-bottom: 15px;
            font-weight: 100;
            border-bottom: 1px dashed rgba(255, 165, 0, 0.3);
            padding-bottom: 5px;
        }
        
        .user-form {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .user-input-group {
            display: flex;
            gap: 5px;
        }
        
        .user-input-group input {
            flex: 1;
        }
        
        .user-list {
            max-height: 300px;
            overflow-y: auto;
            margin-top: 10px;
        }
        
        .user-item {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 165, 0, 0.2);
            padding: 10px;
            margin-bottom: 10px;
            border-radius: 4px;
        }
        
        .user-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
        }
        
        .user-info strong {
            color: #ffa500;
            font-size: 16px;
        }
        
        .user-info span {
            color: #4CAF50;
            font-family: monospace;
            background: rgba(0, 0, 0, 0.3);
            padding: 2px 6px;
            border-radius: 3px;
        }
        
        .user-stats {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: #888;
            margin: 5px 0;
        }
        
        .user-actions {
            display: flex;
            gap: 5px;
            margin: 8px 0;
        }
        
        .user-actions button {
            flex: 1;
            padding: 4px 8px;
            font-size: 11px;
        }
        
        .user-meta {
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
