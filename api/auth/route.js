export async function POST(request) {
  try {
    const { password } = await request.json();
    
    // Получаем пароль из переменных окружения Vercel
    const correctPassword = process.env.ADMIN_PASSWORD;
    
    if (!correctPassword) {
      return Response.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }
    
    if (password === correctPassword) {
      return Response.json({ 
        success: true,
        message: 'Login successful'
      });
    } else {
      return Response.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      );
    }
  } catch (error) {
    return Response.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}