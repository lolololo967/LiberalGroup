export async function POST(request) {
  try {
    const { password } = await request.json();
    
    console.log('Received password attempt');
    
    // Получаем пароль из переменных окружения Vercel
    const correctPassword = process.env.ADMIN_PASSWORD;
    
    if (!correctPassword) {
      console.error('ADMIN_PASSWORD not set in environment variables');
      return Response.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }
    
    console.log('Expected password:', correctPassword);
    console.log('Received password:', password);
    
    if (password && password === correctPassword) {
      console.log('Password correct');
      return Response.json({ 
        success: true,
        message: 'Login successful'
      });
    } else {
      console.log('Password incorrect');
      return Response.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Auth API error:', error);
    return Response.json(
      { success: false, error: 'Server error: ' + error.message },
      { status: 500 }
    );
  }
}
