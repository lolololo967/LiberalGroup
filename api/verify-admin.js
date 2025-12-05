// api/verify-admin.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { password } = req.body;
    
    // Используем переменную из Vercel Environment Variables
    const correctPassword = process.env.ADMIN_PASSWORD;
    
    console.log('Проверка пароля. Ожидается:', correctPassword ? 'установлен' : 'не установлен');
    
    if (!correctPassword) {
      return res.status(500).json({ 
        success: false, 
        error: 'ADMIN_PASSWORD not configured on server' 
      });
    }
    
    if (password === correctPassword) {
      return res.status(200).json({ 
        success: true,
        message: 'Login successful'
      });
    } else {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid password' 
      });
    }
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      error: 'Server error' 
    });
  }
}
