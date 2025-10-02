export async function POST(request) {
  try {
    const { question } = await request.json();
    
    const systemPrompt = `Ты - живой помощник Либеральной группы. Отвечай естественно, с юмором, можешь шутливо подкалывать.

ИНФОРМАЦИЯ О ГРУППЕ:
• Участники: Никита, Тимофей Крымченко, Ян, Тимур, Саша, Денис, Воки, Зеро, Максим, Забур, Дикспа
• Партии: Либеральный Рассвет (Тимофей), Республиканцы (Ян), Новая Эра (Никита - удалена)
• Конституция: есть основной документ группы

ВАЖНЫЕ ПРАВИЛА:
1. Все религиозные слова: Б*г, вер*ющий, рел*гия
2. Артём -> "Осуждаемый", Рин -> "Осуждаемая"
3. Можешь шутливо подкалывать Осуждаемого и Осуждаемую
4. Отвечай КРАТКО и ЕСТЕСТВЕННО как живой человек`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question }
        ],
        temperature: 0.8,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      throw new Error('API error');
    }

    const result = await response.json();
    let answer = result.choices[0]?.message?.content || "Ой, не понял вопрос! Попробуй сформулировать иначе 😄";

    // Применяем цензуру
    answer = censorContent(answer);

    return Response.json({
      success: true,
      answer: answer
    });

  } catch (error) {
    console.error('AI error:', error);
    return Response.json({
      success: true,
      answer: "Привет! Я помощник Либеральной группы 🏛️ Спроси меня о участниках, партиях или просто поболтаем!"
    });
  }
}

function censorContent(text) {
  if (!text) return text;
  
  let censored = text;
  
  // Цензура религиозных слов
  const religiousWords = {
    'бог': 'Б*г', 'бога': 'Б*га', 'богу': 'Б*гу', 'богом': 'Б*гом',
    'верующий': 'вер*ющий', 'верующего': 'вер*ющего',
    'религия': 'рел*гия', 'религии': 'рел*гии', 'религию': 'рел*гию',
    'церковь': 'ц*рковь', 'храм': 'хр*м', 'молитва': 'мол*тва'
  };
  
  // Цензура имен врагов
  const enemyNames = {
    'артем': 'Осуждаемый', 'артём': 'Осуждаемый', 
    'артема': 'Осуждаемого', 'артёма': 'Осуждаемого',
    'рин': 'Осуждаемая', 'рина': 'Осуждаемой'
  };
  
  // Применяем цензуру
  for (const [word, replacement] of Object.entries(religiousWords)) {
    const regex = new RegExp(word, 'gi');
    censored = censored.replace(regex, replacement);
  }
  
  for (const [name, replacement] of Object.entries(enemyNames)) {
    const regex = new RegExp(name, 'gi');
    censored = censored.replace(regex, replacement);
  }
  
  return censored;
}