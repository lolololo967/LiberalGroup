export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body;
  
  // Получаем пароль из переменных окружения Vercel
  const correctPassword = process.env.ADMIN_PASSWORD;

  try {
    if (password === correctPassword) {
      res.status(200).json({ 
        success: true,
        message: 'Login successful'
      });
    } else {
      res.status(401).json({ 
        success: false, 
        error: 'Invalid password' 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Server error' 
    });
  }
}
