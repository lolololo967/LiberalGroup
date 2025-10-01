// api/auth.js
const { createClient } = require('@supabase/supabase-js');

// Инициализация Supabase клиента
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = async (req, res) => {
  // Разрешаем CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Обрабатываем preflight запросы
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Только POST запросы
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password required' });
    }

    console.log('Проверка пароля через API');

    // Проверяем пароль в базе данных
    const { data, error } = await supabase
      .from('admins')
      .select('password_hash')
      .eq('username', 'admin')
      .single();

    if (error || !data) {
      console.log('❌ Администратор не найден в базе');
      return res.status(200).json({ valid: false });
    }

    // Хешируем введенный пароль
    const crypto = require('crypto');
    const inputHash = crypto.createHash('sha256').update(password).digest('hex');
    
    console.log('📊 Сравнение хешей:');
    console.log('Введенный хеш:', inputHash);
    console.log('Хеш из базы:', data.password_hash);
    console.log('Результат:', inputHash === data.password_hash);

    res.status(200).json({ 
      valid: inputHash === data.password_hash 
    });

  } catch (error) {
    console.error('💥 Ошибка сервера:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};