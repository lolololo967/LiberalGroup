
        const SUPABASE_URL = 'https://pwawgeyxzjntystktciz.supabase.co';
        const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3YXdnZXl4empudHlzdGt0Y2l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMjU2NTQsImV4cCI6MjA3NDkwMTY1NH0.nS4TpZT7hq1PW4lLUiDccUmJSobnXWm1GFTWskYy8jI';

        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let isAdmin = false;

function showStatus(message, type = 'info') {
    const statusElement = document.getElementById('statusMessage');
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.className = 'admins-status admins-' + type;
    }
}


function showLoginMessage(message, type = 'error') {
    const messageElement = document.getElementById('loginMessage');
    if (messageElement) {
        messageElement.textContent = message;
        messageElement.className = 'admins-status admins-' + type;
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

async function checkPassword(password) {
    try {
        const response = await fetch('/api/auth', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ password: password.trim() })
        });

        const result = await response.json();
        
        if (!response.ok) {
            // Если сервер вернул ошибку
            throw new Error(result.error || 'Auth failed');
        }
        
        return result.success;
    } catch (error) {
        console.error('Auth error:', error);
        showLoginMessage('Ошибка соединения с сервером', 'error');
        return false;
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


document.addEventListener('DOMContentLoaded', function() {
    console.log('Админ панель загружена. Supabase URL:', SUPABASE_URL);
    

    loadContent();
    

    const adminLoginBtn = document.getElementById('adminLoginBtn');
    const loginBtn = document.getElementById('loginBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const publishBtn = document.getElementById('publishBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (!adminLoginBtn) {
        console.error('Кнопка adminLoginBtn не найдена!');
        return;
    }
    
    adminLoginBtn.addEventListener('click', function() {
        console.log('Кнопка входа нажата');
        document.getElementById('loginModal').classList.remove('admins-hidden');
        document.getElementById('passwordInput').value = '';
        document.getElementById('passwordInput').focus();
        showLoginMessage('');
    });

    if (loginBtn) {
    loginBtn.addEventListener('click', async function() {
        const password = document.getElementById('passwordInput').value;
        
        if (!password) {
            showLoginMessage('Введите пароль', 'error');
            return;
        }
        
        loginBtn.textContent = 'Проверка...';
        loginBtn.disabled = true;
        
        try {
            const isValid = await checkPassword(password);
            
            if (isValid) {
                isAdmin = true;
                document.getElementById('loginModal').classList.add('admins-hidden');
                toggleEditMode(true);
                showLoginMessage('');
                console.log('Успешный вход в админ-панель');
            } else {
                showLoginMessage('Неверный пароль', 'error');
                // Не очищаем поле, чтобы пользователь мог исправить
                document.getElementById('passwordInput').focus();
                document.getElementById('passwordInput').select();
            }
        } catch (error) {
            console.error('Ошибка при проверке пароля:', error);
            showLoginMessage('Ошибка соединения: ' + error.message, 'error');
        } finally {
            loginBtn.textContent = 'Войти';
            loginBtn.disabled = false;
        }
    });
}

    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            document.getElementById('loginModal').classList.add('admins-hidden');
            document.getElementById('passwordInput').value = '';
            showLoginMessage('');
        });
    }

    if (publishBtn) {
        publishBtn.addEventListener('click', publishChanges);
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            isAdmin = false;
            toggleEditMode(false);
            loadContent();
        });
    }

    const passwordInput = document.getElementById('passwordInput');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                if (loginBtn) loginBtn.click();
            }
        });
    }

    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
        loginModal.addEventListener('click', function(e) {
            if (e.target.id === 'loginModal') {
                document.getElementById('loginModal').classList.add('admins-hidden');
            }
        });
    }

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
// В существующий admin.js добавляем:

// === ФУНКЦИИ УПРАВЛЕНИЯ ПАРОЛЯМИ ===

// Показать/скрыть панель управления паролями
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

// Загрузить список паролей
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
            passwordList.innerHTML = '<p class="admins-info">Нет созданных паролей</p>';
            return;
        }
        
        const passwordsHTML = passwords.map(pwd => `
            <div class="password-item">
                <div class="password-info">
                    <strong>${pwd.username}</strong>
                    <span>${pwd.password}</span>
                </div>
                <div class="password-actions">
                    <button onclick="copyPassword('${pwd.password}')" class="admins-btn-small">Копировать</button>
                    <button onclick="deletePassword(${pwd.id})" class="admins-btn-small admins-btn-danger">Удалить</button>
                </div>
                <div class="password-meta">
                    <small>Создан: ${new Date(pwd.created_at).toLocaleDateString()}</small>
                </div>
            </div>
        `).join('');
        
        passwordList.innerHTML = passwordsHTML;
        
    } catch (error) {
        console.error('Ошибка загрузки паролей:', error);
        document.getElementById('passwordList').innerHTML = 
            '<p class="admins-error">Ошибка загрузки: ' + error.message + '</p>';
    }
}

// Добавить новый пароль
async function addNewPassword() {
    const username = document.getElementById('newUsername').value.trim();
    const password = document.getElementById('newPassword').value.trim();
    const errorElement = document.getElementById('passwordError');
    
    if (!username || !password) {
        errorElement.textContent = 'Заполните все поля';
        return;
    }
    
    if (username.length < 2 || username.length > 20) {
        errorElement.textContent = 'Никнейм: 2-20 символов';
        return;
    }
    
    if (password.length < 4) {
        errorElement.textContent = 'Пароль минимум 4 символа';
        return;
    }
    
    try {
        errorElement.textContent = 'Добавление...';
        errorElement.className = 'admins-status admins-info';
        
        const { data, error } = await supabase
            .from('user_passwords')
            .insert([{
                username: username,
                password: password,
                created_by: 'admin'
            }]);
        
        if (error) throw error;
        
        errorElement.textContent = '✅ Пароль добавлен!';
        errorElement.className = 'admins-status admins-success';
        
        // Очищаем поля
        document.getElementById('newUsername').value = '';
        document.getElementById('newPassword').value = '';
        
        // Обновляем список
        loadPasswordList();
        
        // Автоматически скрываем сообщение через 3 секунды
        setTimeout(() => {
            errorElement.textContent = '';
        }, 3000);
        
    } catch (error) {
        console.error('Ошибка добавления пароля:', error);
        
        if (error.code === '23505') { // Ошибка уникальности
            errorElement.textContent = '❌ Этот пользователь уже существует';
        } else {
            errorElement.textContent = '❌ Ошибка: ' + error.message;
        }
        errorElement.className = 'admins-status admins-error';
    }
}

// Удалить пароль
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

// Скопировать пароль в буфер обмена
function copyPassword(password) {
    navigator.clipboard.writeText(password).then(() => {
        showStatus('Пароль скопирован', 'success');
    }).catch(err => {
        console.error('Ошибка копирования:', err);
    });
}

// Генерация случайного пароля
function generatePassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    document.getElementById('newPassword').value = password;
}

// === ОБНОВЛЕНИЕ ИНИЦИАЛИЗАЦИИ ===

// В конец DOMContentLoaded функции добавьте:
document.addEventListener('DOMContentLoaded', function() {
    // ... существующий код ...
    
    // Создаем панель управления паролями
    createPasswordManagerPanel();
    
    // Добавляем кнопку в админ-панель
    addPasswordManagerButton();
});

// Создать панель управления паролями
function createPasswordManagerPanel() {
    const passwordPanelHTML = `
        <div id="passwordManagerPanel" class="password-manager-panel admins-hidden">
            <div class="admins-panel-header">
                <h3>🎫 Управление паролями</h3>
                <button onclick="togglePasswordManager(false)" class="admins-btn-small">✕</button>
            </div>
            
            <div class="password-manager-section">
                <h4>Добавить новый пароль</h4>
                <div class="password-form">
                    <input type="text" id="newUsername" class="admins-input-field" placeholder="Никнейм пользователя" maxlength="20">
                    <div class="password-input-group">
                        <input type="text" id="newPassword" class="admins-input-field" placeholder="Пароль">
                        <button onclick="generatePassword()" class="admins-btn-small" type="button">🎲 Сгенерировать</button>
                    </div>
                    <button onclick="addNewPassword()" class="admins-btn admins-btn-success">Добавить пароль</button>
                    <div id="passwordError" class="admins-status"></div>
                </div>
            </div>
            
            <div class="password-manager-section">
                <h4>Существующие пароли</h4>
                <div id="passwordList" class="password-list">
                    Загрузка...
                </div>
            </div>
        </div>
    `;
    
    // Добавляем панель в body
    const panel = document.createElement('div');
    panel.innerHTML = passwordPanelHTML;
    document.body.appendChild(panel.firstElementChild);
}

// Добавить кнопку управления паролями в админ-панель
function addPasswordManagerButton() {
    const adminPanel = document.getElementById('adminPanel');
    if (!adminPanel) return;
    
    const passwordBtn = document.createElement('button');
    passwordBtn.innerHTML = '🎫 Управление паролями';
    passwordBtn.className = 'admins-btn admins-btn-primary';
    passwordBtn.style.marginTop = '10px';
    passwordBtn.onclick = () => togglePasswordManager(true);
    
    const controls = adminPanel.querySelector('.admins-controls');
    if (controls) {
        controls.appendChild(passwordBtn);
    }
}
