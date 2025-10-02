let conversationHistory = [];

// Функция отправки сообщения
async function sendMessage() {
  const input = document.getElementById('chatInput');
  const message = input.value.trim();
  
  if (!message) return;

  // Добавляем сообщение пользователя
  addMessage(message, 'user');
  input.value = '';

  // Показываем загрузку
  const loadingId = addMessage('Думаю...', 'assistant', true);

  try {
    const response = await fetch('/api/assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: message,
        history: conversationHistory
      })
    });

    const result = await response.json();

    // Удаляем индикатор загрузки
    removeMessage(loadingId);

    if (result.success) {
      addMessage(result.answer, 'assistant');
      // Обновляем историю
      conversationHistory.push(
        { role: 'user', content: message },
        { role: 'assistant', content: result.answer }
      );
    } else {
      addMessage('Ой, что-то пошло не так! Попробуй ещё раз.', 'assistant');
    }
  } catch (error) {
    removeMessage(loadingId);
    addMessage('Ошибка соединения. Проверьте интернет.', 'assistant');
  }
}

// Вспомогательные функции
function addMessage(text, sender, isTemp = false) {
  const messagesContainer = document.getElementById('chatMessages');
  const messageDiv = document.createElement('div');
  const messageId = isTemp ? 'temp-' + Date.now() : null;
  
  messageDiv.className = `message ${sender}`;
  if (isTemp) messageDiv.classList.add('loading');
  messageDiv.textContent = text;
  
  if (messageId) {
    messageDiv.id = messageId;
  }
  
  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  
  return messageId;
}

function removeMessage(id) {
  const element = document.getElementById(id);
  if (element) {
    element.remove();
  }
}

// Инициализация чата
document.addEventListener('DOMContentLoaded', function() {
  const openChatBtn = document.getElementById('openChat');
  const chatWidget = document.getElementById('chatAssistant');
  const closeChat = document.getElementById('closeChat');
  const sendBtn = document.getElementById('sendMessage');
  const chatInput = document.getElementById('chatInput');

  openChatBtn.addEventListener('click', () => {
    chatWidget.classList.add('active');
  });

  closeChat.addEventListener('click', () => {
    chatWidget.classList.remove('active');
  });

  sendBtn.addEventListener('click', sendMessage);

  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });
});