
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
async function addNewPassword() {
    const username = document.getElementById('newUsername').value.trim();
    const password = document.getElementById('newPassword').value.trim();
    const errorElement = document.getElementById('passwordError');
    
    if (!username || !password) {
        errorElement.textContent = 'Заполните все поля';
        return;
    }
    
    try {
        errorElement.textContent = 'Добавление...';
        errorElement.style.color = '#ffa500';
        
        console.log('Попытка добавить пароль для:', username);
        
        // Простая вставка без проверок
        const { data, error } = await supabase
            .from('user_passwords')
            .insert([{
                username: username,
                password: password,
                created_by: 'admin'
            }]);
        
        if (error) {
            console.error('Ошибка при добавлении:', error);
            
            if (error.code === '23505') {
                errorElement.textContent = '❌ Этот пользователь уже существует';
            } else {
                errorElement.textContent = '❌ Ошибка: ' + error.message;
            }
            errorElement.style.color = '#ff4444';
            return;
        }
        
        console.log('Успешно добавлено:', data);
        errorElement.textContent = '✅ Пароль добавлен!';
        errorElement.style.color = '#4CAF50';
        
        // Очищаем поля
        document.getElementById('newUsername').value = '';
        document.getElementById('newPassword').value = '';
        
        // Обновляем список
        setTimeout(() => {
            loadPasswordList();
            errorElement.textContent = '';
        }, 2000);
        
    } catch (error) {
        console.error('Неожиданная ошибка:', error);
        errorElement.textContent = '❌ Неожиданная ошибка: ' + error.message;
        errorElement.style.color = '#ff4444';
    }
}

// Обновленная функция загрузки паролей
async function loadPasswordList() {
    try {
        const { data: passwords, error } = await supabase
            .from('user_passwords')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Ошибка загрузки паролей:', error);
            document.getElementById('passwordList').innerHTML = 
                '<p style="color: #ff4444;">Ошибка загрузки: ' + error.message + '</p>';
            return;
        }
        
        console.log('Загружено паролей:', passwords ? passwords.length : 0);
        
        const passwordList = document.getElementById('passwordList');
        if (!passwordList) return;
        
        if (!passwords || passwords.length === 0) {
            passwordList.innerHTML = '<p style="color: #ffa500;">Нет созданных паролей</p>';
            return;
        }
        
        const passwordsHTML = passwords.map(pwd => `
            <div class="password-item">
                <div class="password-info">
                    <strong style="color: #ffa500;">${pwd.username}</strong>
                    <span style="color: #4CAF50; font-family: monospace; background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 3px;">
                        ${pwd.password}
                    </span>
                </div>
                <div class="password-actions">
                    <button onclick="copyPassword('${pwd.password}')" style="padding: 4px 8px; background: rgba(76,175,80,0.2); border: 1px solid #4CAF50; color: #4CAF50; cursor: pointer;">Копировать</button>
                    <button onclick="deletePassword(${pwd.id})" style="padding: 4px 8px; background: rgba(244,67,54,0.2); border: 1px solid #f44336; color: #f44336; cursor: pointer;">Удалить</button>
                </div>
                <div style="font-size: 11px; color: #888; text-align: right; margin-top: 5px;">
                    <small>Создан: ${new Date(pwd.created_at).toLocaleDateString()}</small>
                </div>
            </div>
        `).join('');
        
        passwordList.innerHTML = passwordsHTML;
        
    } catch (error) {
        console.error('Ошибка в loadPasswordList:', error);
        document.getElementById('passwordList').innerHTML = 
            '<p style="color: #ff4444;">Ошибка: ' + error.message + '</p>';
    }
}
// Добавьте эту функцию в admin.js для проверки
async function testSupabaseConnection() {
    try {
        console.log('Тестирование подключения к Supabase...');
        
        // Проверяем подключение к таблице
        const { data, error } = await supabase
            .from('user_passwords')
            .select('count')
            .limit(1);
        
        if (error) {
            console.error('❌ Ошибка подключения:', error);
            showStatus('❌ Ошибка подключения к базе паролей: ' + error.message, 'error');
            return false;
        }
        
        console.log('✅ Подключение успешно');
        showStatus('✅ Подключение к базе паролей установлено', 'success');
        return true;
        
    } catch (error) {
        console.error('❌ Неожиданная ошибка:', error);
        showStatus('❌ Неожиданная ошибка: ' + error.message, 'error');
        return false;
    }
}

// Вызывайте при загрузке админки
document.addEventListener('DOMContentLoaded', async function() {
    // ... существующий код ...
    
    // Тестируем подключение
    await testSupabaseConnection();
});
