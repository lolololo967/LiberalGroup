
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
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashedPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        const correctHash = 'f4f8666a93b223240062cf40d08e0bad551dd2e30bfef80d3fcc3f969aae1218';
        
        return hashedPassword === correctHash;
    } catch (error) {
        console.error('Ошибка проверки пароля:', error);
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
                if (await checkPassword(password)) {
                    isAdmin = true;
                    document.getElementById('loginModal').classList.add('admins-hidden');
                    toggleEditMode(true);
                    showLoginMessage('');
                } else {
                    document.getElementById('loginModal').classList.add('admins-hidden');
                }
            } catch (error) {
                showLoginMessage('Ошибка соединения', 'error');
            } finally {
                loginBtn.textContent = 'Войти';
                loginBtn.disabled = false;
                document.getElementById('passwordInput').value = '';
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

