// Инициализация Vanta.js эффекта
VANTA.NET({
    el: "#body",
    mouseControls: true,
    touchControls: true,
    gyroControls: false,
    minHeight: 200.00,
    minWidth: 200.00,
    scale: 1.00,
    scaleMobile: 1.00,
    color: 0xff000a,
    backgroundColor: 0xe0000,
    points: 20.00,
    spacing: 18.00,
    showDots: false
});
window.scrollTo(0, 0);
document.addEventListener("DOMContentLoaded", () => {
  const text = "Liberal Group";
  const container = document.querySelector(".typewriter");
  const navContainer = document.querySelector(".nav-container");

  for (let char of text) {
    const span = document.createElement("span");
    span.textContent = char;
    container.appendChild(span);
  }

  const spans = container.querySelectorAll("span");
  let index = 0;

// В функции showNext (где появляется навигация) добавьте:
function showNext() {
    if (index < spans.length) {
        spans[index].classList.add("visible");
        index++;
        setTimeout(showNext, 100);
    } else {
        setTimeout(() => {
            navContainer.style.opacity = "1";
            squareContainer.style.opacity = "1";
            document.querySelector('.tests-button').style.opacity = "1"; // Добавьте эту строку
            document.querySelector('.tests-button').style.pointerEvents = "all"; // И эту
        }, 200);
    }
}

  setTimeout(showNext, 100);
});

  const buttons = document.querySelectorAll('.nav-buttons button');
const squareContainer = document.querySelector('.square-container');

let intervalsMap = new Map();
let activeButton = null;
let hoverButton = null;

function startSquares(button) {
  if (intervalsMap.has(button)) return;

  const interval = setInterval(() => {
    const rect = button.getBoundingClientRect();

    const square = document.createElement('div');
    const size = Math.random() * 10 + 5;
    const left = rect.left + Math.random() * rect.width;
    const top = -size;
    const duration = Math.random() * 1.5 + 0.8;

    square.classList.add('falling-square');
    square.style.width = `${size}px`;
    square.style.height = `${size}px`;
    square.style.left = `${left}px`;
    square.style.top = `${top}px`;
    square.style.animationDuration = `${duration}s`;
    square.style.transform = `rotate(${Math.random() * 360}deg)`;
    square.style.opacity = 1;

    squareContainer.appendChild(square);

    setTimeout(() => {
      square.remove();
    }, duration * 1000);
  }, 80);

  intervalsMap.set(button, interval);
}

function stopSquares(button) {
  if (!intervalsMap.has(button)) return;

  clearInterval(intervalsMap.get(button));
  intervalsMap.delete(button);

  const squares = squareContainer.querySelectorAll('.falling-square');
  squares.forEach(square => {
    square.style.transition = 'opacity 0.3s ease';
    square.style.opacity = 0;
    setTimeout(() => square.remove(), 300);
  });
}

buttons.forEach(button => {
  button.addEventListener('mouseenter', () => {
    hoverButton = button;

    if (activeButton && activeButton !== button) {
      stopSquares(activeButton);
      activeButton.classList.remove('active');
    }

    startSquares(button);
  });

  button.addEventListener('mouseleave', () => {
    hoverButton = null;

    if (activeButton !== button) {
      stopSquares(button);
    }

    if (activeButton && activeButton !== button) {
      startSquares(activeButton);
      activeButton.classList.add('active');
    }
  });

  button.addEventListener('click', () => {
    if (activeButton && activeButton !== button) {
      stopSquares(activeButton);
      activeButton.classList.remove('active');
    }

    activeButton = button;
    button.classList.add('active');

    startSquares(button);
  });
});
// Установить кнопку "Главная" активной при загрузке
document.addEventListener("DOMContentLoaded", () => {
  const homeButton = Array.from(buttons).find(btn => btn.textContent.trim() === "Главная");
  if (homeButton) {
    activeButton = homeButton;
    homeButton.classList.add("active");
    startSquares(homeButton);
  }
});

// Модальные окна
const navButtons = document.querySelectorAll('.nav-buttons button');
const modals = document.querySelectorAll('.modal');
const header = document.querySelector('.header');
let currentModal = null;

function showModal(modalName) {
    const testsButton = document.querySelector('.tests-button');
    
    // Показывать кнопку "Тесты" только на главной
    if (modalName === 'Главная') {
        header.classList.remove('moved-down');
        header.classList.add('centered');
        testsButton.style.opacity = '1';
        testsButton.style.pointerEvents = 'all';
    } else {
        header.classList.remove('centered');
        header.classList.add('moved-down');
        testsButton.style.opacity = '0';
        testsButton.style.pointerEvents = 'none';
        
        // Если открываем не "Тесты", останавливаем квадратики
        if (modalName !== 'Тесты' && activeButton && activeButton.textContent.trim() === "Тесты") {
            stopSquares(activeButton);
            activeButton.classList.remove('active');
            activeButton = null;
        }
    }
    // Скрыть текущее модальное окно
    if (currentModal) {
        currentModal.classList.remove('active');
    }
    
    // Если не "Главная" - показать соответствующее окно
    if (modalName !== 'Главная') {
        const modalToShow = Array.from(modals).find(modal => 
            modal.dataset.modal === modalName
        );
        if (modalToShow) {
            modalToShow.classList.add('active');
            currentModal = modalToShow;
        }
    } else {
        currentModal = null;
    }
}

// Обработчики для кнопок навигации
navButtons.forEach(button => {
    button.addEventListener('click', () => {
        const buttonText = button.textContent.trim();
        showModal(buttonText);
        
        // Обновляем активную кнопку
        navButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
    });
});

// Инициализация - кнопка "Главная" активна при загрузке
document.addEventListener("DOMContentLoaded", () => {
    const homeButton = Array.from(navButtons).find(btn => btn.textContent.trim() === "Главная");
    if (homeButton) {
        homeButton.classList.add('active');
    }
});
document.addEventListener("DOMContentLoaded", () => {
  const part1 = document.querySelector(".part1");
  const part2 = document.querySelector(".part2");
  const part3 = document.querySelector(".part3");

  const info1 = document.getElementById("info-part1");
  const info2 = document.getElementById("info-part2");
  const info3 = document.getElementById("info-part3");

  part1.addEventListener("mouseenter", () => info1.style.opacity = "1");
  part1.addEventListener("mouseleave", () => info1.style.opacity = "0");

  part2.addEventListener("mouseenter", () => info2.style.opacity = "1");
  part2.addEventListener("mouseleave", () => info2.style.opacity = "0");

  part3.addEventListener("mouseenter", () => info3.style.opacity = "1");
  part3.addEventListener("mouseleave", () => info3.style.opacity = "0");
});
document.addEventListener("DOMContentLoaded", () => {
  const partMap = {
    part1: "Туториалы",
    part2: "Репутация",
    part3: "Роли"
  };

  Object.keys(partMap).forEach(partClass => {
    const partElement = document.querySelector(`.${partClass}`);
    partElement.addEventListener("click", () => {
      showModal(partMap[partClass]); // используем уже существующую функцию showModal()
    });
  });
});
document.addEventListener("DOMContentLoaded", () => {
  const backButtons = document.querySelectorAll(".modal-back");

  backButtons.forEach(button => {
    button.addEventListener("click", () => {
      showModal("Информация"); // Возврат в модальное окно "Информация"
    });
  });
});
const part1 = document.querySelector('.part1');
const part2 = document.querySelector('.part2');
const part3 = document.querySelector('.part3');
const triangle = document.querySelector('.triangle');

const baseAngles = {
  part1: 0,
  part2: -120,
  part3: 120,
};

let currentAngle = 0;

// Функция для нормализации угла в диапазон [-180, 180]
function normalizeAngle(angle) {
  angle = angle % 360;
  if (angle > 180) angle -= 360;
  if (angle <= -180) angle += 360;
  return angle;
}

// Функция для выбора кратчайшего поворота с учётом цикличности
function findClosestTargetAngle(current, targetBase) {
  // Возможные варианты целевого угла
  const candidates = [
    targetBase - 360,
    targetBase,
    targetBase + 360,
  ];

  // Ищем тот вариант, у которого разница с currentAngle нормализованная по модулю 360 минимальна
  let closest = candidates[0];
  let minDiff = Math.abs(normalizeAngle(current - candidates[0]));

  for (let i = 1; i < candidates.length; i++) {
    const diff = Math.abs(normalizeAngle(current - candidates[i]));
    if (diff < minDiff) {
      minDiff = diff;
      closest = candidates[i];
    }
  }
  return closest;
}

function rotateTriangleTo(partName) {
  const targetBaseAngle = baseAngles[partName];
  const targetAngle = findClosestTargetAngle(currentAngle, targetBaseAngle);

  // Вычисляем разницу между targetAngle и currentAngle с нормализацией
  let diff = normalizeAngle(targetAngle - currentAngle);

  // Новый угол — текущий + минимальный поворот
  currentAngle = currentAngle + diff;

  triangle.style.transform = `translate(-50%, -50%) rotate(${currentAngle}deg)`;
}

part1.addEventListener('mouseenter', () => rotateTriangleTo('part1'));
part2.addEventListener('mouseenter', () => rotateTriangleTo('part2'));
part3.addEventListener('mouseenter', () => rotateTriangleTo('part3'));
(function() {
  const container = document.querySelector('.modal .seats-container');
  const tooltip = container.querySelector('.tooltip-global');
  const centerX = 150;
  const centerY = 165;

  // Функция для вычисления позиции сидения
  function getPosition(radius, angleDeg) {
    const angleRad = angleDeg * Math.PI / 180;
    return {
      x: centerX + radius * Math.cos(angleRad) - 12,
      y: centerY - radius * Math.sin(angleRad) - 12
    };
  }

function showTooltip(seat, text) {
  const left = seat.offsetLeft + seat.offsetWidth + 10;
  const top = seat.offsetTop + seat.offsetHeight / 2;

  tooltip.style.left = left + 'px';
  tooltip.style.top = top + 'px';
  tooltip.style.opacity = '1';
  tooltip.style.transform = 'translateY(-50%) translateX(10px)';

  tooltip.innerHTML = text.replace(/\n/g, '<br>');
}
  // Функция скрытия тултипа
  function hideTooltip() {
    tooltip.style.opacity = '0';
    tooltip.style.transform = 'translateY(-50%) translateX(0)';
  }

  // Здесь задаём тексты для каждого места (индексы соответствуют порядку создания)
  const seatTexts = [
    'ЛР \n Timofey',
    'ЛР \n Timofey',
    'ЛР \n Timofey',
    'ЛР \n Krolituki',
    'ЛР \n Krolituki',
    'ЛР \n Krolituki',

    'ЛР \n Wer5fg',
    'ЛР \n Wer5fg',
    'ЛР \n Wer5fg',
    'ЛР \n Wer5fg',
  ];

  // Создаём верхний ряд сидений
  const topSeatsCount = 6;
  const topRadius = 115;
  for (let i = 0; i < topSeatsCount; i++) {
    const angle = 180 - i * (180 / (topSeatsCount - 1));
    const pos = getPosition(topRadius, angle);
    const seat = document.createElement('div');
    seat.className = `seat seat-${i}`;
    seat.style.left = pos.x + 'px';
    seat.style.top = pos.y + 'px';

    seat.addEventListener('mouseenter', () => showTooltip(seat, seatTexts[i] || 'Место ' + (i + 1)));
    seat.addEventListener('mouseleave', hideTooltip);

    container.appendChild(seat);
  }

  // Создаём нижний ряд сидений
  const bottomSeatsCount = 4;
  const bottomRadius = 55;
  for (let i = 0; i < bottomSeatsCount; i++) {
    const index = topSeatsCount + i;
    const angle = 180 - i * (180 / (bottomSeatsCount - 1));
    const pos = getPosition(bottomRadius, angle);
    const seat = document.createElement('div');
    seat.className = `seat seat-${index}`;
    seat.style.left = pos.x + 'px';
    seat.style.top = pos.y + 'px';

    seat.addEventListener('mouseenter', () => showTooltip(seat, seatTexts[index] || 'Место ' + (index + 1)));
    seat.addEventListener('mouseleave', hideTooltip);

    container.appendChild(seat);
  }
})();
document.addEventListener("DOMContentLoaded", () => {
    const testsButton = document.querySelector('.tests-button');
    
    // Показываем кнопку вместе с навигацией
    function showNext() {
        if (index < spans.length) {
            spans[index].classList.add("visible");
            index++;
            setTimeout(showNext, 100);
        } else {
            setTimeout(() => {
                navContainer.style.opacity = "1";
                squareContainer.style.opacity = "1";
                testsButton.style.opacity = "1";
                testsButton.style.pointerEvents = "all";
            }, 200);
        }
    }
    
    // Обработчик клика по кнопке "Тесты"
    testsButton.addEventListener('click', () => {
        // Останавливаем квадратики для текущей активной кнопки
        if (activeButton) {
            stopSquares(activeButton);
            activeButton.classList.remove('active');
        }
        
        // Показываем модальное окно
        showModal('Тесты');
        
        // Скрываем кнопку "Тесты" при открытии модального окна
        testsButton.style.opacity = '0';
        testsButton.style.pointerEvents = 'none';
    });
    
    // Модифицируем showModal для управления кнопкой
    const originalShowModal = showModal;
    showModal = function(modalName) {
        originalShowModal(modalName);
        
        if (modalName === 'Главная') {
            testsButton.style.opacity = '1';
            testsButton.style.pointerEvents = 'all';
        } else if (modalName !== 'Тесты') {
            testsButton.style.opacity = '0';
            testsButton.style.pointerEvents = 'none';
        }
    };
});
const points = document.querySelectorAll('.activity-points div');
  const fill = document.querySelector('.activity-fill');
  const tooltip = document.getElementById('activity-tooltip');

  const colors = [
    '#444',
    '#660000',
    '#aa4a00ff',
    '#cc7e00ff',
    '#c9cc00ff',
    '#74b200ff',
    '#5aa800ff',
    '#008200ff',
    '#005100ff',
    '#004100ff',
    '#002c00ff'
  ];

  let typewriterInterval;
  let typewriterTimeout;

  points.forEach(point => {
    point.addEventListener('mouseenter', () => {
      clearInterval(typewriterInterval);
      clearTimeout(typewriterTimeout);

      const level = parseInt(point.dataset.level);
      const fullLabel = point.dataset.label;
      const percent = (level / 10) * 100;

      // Обновление полосы
      fill.style.width = `${percent}%`;
      fill.style.backgroundColor = colors[level];

      // Разделение текста
      const [title, description] = fullLabel.split('(');
      tooltip.textContent = title.trim();
      tooltip.style.opacity = '1';

      // Старт печати через 1 сек
      if (description) {
        const fullText = ` (${description.trim().replace(/\)$/, '')})`;
        let index = 0;

        typewriterTimeout = setTimeout(() => {
          typewriterInterval = setInterval(() => {
            if (index <= fullText.length) {
              tooltip.textContent = title.trim() + fullText.substring(0, index);
              index++;
            } else {
              clearInterval(typewriterInterval);
            }
          }, 40); // скорость печати
        }, 500); // задержка перед началом печати
      }
    });

    point.addEventListener('mouseleave', () => {
      clearInterval(typewriterInterval);
      clearTimeout(typewriterTimeout);
      fill.style.width = '0%';
      fill.style.backgroundColor = '#555';
      tooltip.textContent = '';
      tooltip.style.opacity = '0';
    });
  });
  // Add this to your existing script.js
document.addEventListener("DOMContentLoaded", () => {
    // Handle role buttons in the "Роли" modal
    const roleButtons = document.querySelectorAll('.main-roles-buttons button, .game-roles-buttons button');
    
    roleButtons.forEach(button => {
        button.addEventListener('click', () => {
            const roleName = button.dataset.role;
            showModal(roleName);
        });
    });

    // Modify the showModal function to handle back navigation from role modals
    const originalShowModal = showModal;
    showModal = function(modalName) {
        originalShowModal(modalName);
        
        // If showing a role modal, hide the main "Роли" modal
        const rolesModal = document.querySelector('.modal[data-modal="Роли"]');
        if (rolesModal && modalName !== "Роли" && 
            (Array.from(roleButtons).some(btn => btn.dataset.role === modalName))) {
            rolesModal.classList.remove('active');
        }
    };

    // Handle back buttons in role modals
    const backButtons = document.querySelectorAll('.modal-back');
    backButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            // Find which modal we're in
            const currentModal = e.target.closest('.modal');
            const modalName = currentModal.dataset.modal;
            
            // For role modals, go back to "Роли"
            if (modalName !== "Роли" && 
                (Array.from(roleButtons).some(btn => btn.dataset.role === modalName))) {
                showModal("Роли");
            } 
            // For other modals, use their normal back behavior
            else if (modalName === "Активность" || modalName === "Репутация" || modalName === "Роли") {
                showModal("Информация");
            }
        });
    });
});
document.addEventListener('DOMContentLoaded', function() {
    const adminPanel = document.getElementById('adminPanel');
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    // Делаем заголовок панели областью для перетаскивания
    const header = adminPanel.querySelector('.admins-panel-header');
    
    header.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);
    
    header.style.cursor = 'move'; // Меняем курсор при наведении на заголовок

    function dragStart(e) {
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
        
        if (e.target === header || header.contains(e.target)) {
            isDragging = true;
        }
    }

    function drag(e) {
        if (isDragging) {
            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
            
            xOffset = currentX;
            yOffset = currentY;
            
            setTranslate(currentX, currentY, adminPanel);
        }
    }

    function setTranslate(xPos, yPos, el) {
        el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
    }

    function dragEnd(e) {
        initialX = currentX;
        initialY = currentY;
        isDragging = false;
    }
});