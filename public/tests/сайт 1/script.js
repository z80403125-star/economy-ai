const questions = [
  {
    question: "Что изучает экономика?",
    answers: [
      "Как люди и общества используют ограниченные ресурсы для удовлетворения потребностей",
      "Только работу банков и движение денег",
      "Историю возникновения государств"
    ],
    correct: 0
  },
  {
    question: "Почему ресурсы называют ограниченными?",
    answers: [
      "Их количество всегда уменьшается до нуля",
      "Их не хватает, чтобы одновременно удовлетворить все потребности",
      "Их могут использовать только предприятия"
    ],
    correct: 1
  },
  {
    question: "Какая задача относится к основным вопросам экономики?",
    answers: [
      "Кто будет принимать законы?",
      "Где будут проходить границы страны?",
      "Что, как и для кого производить?"
    ],
    correct: 2
  },
  {
    question: "Какова одна из главных функций экономики в обществе?",
    answers: [
      "Организовывать производство и распределение благ",
      "Заменять собой образование и здравоохранение",
      "Определять личные увлечения каждого человека"
    ],
    correct: 0
  },
  {
    question: "Что наиболее точно описывает рыночную экономику?",
    answers: [
      "Все цены и объёмы производства устанавливаются одним центральным органом",
      "Решения производителей и покупателей координируются рынком, спросом и предложением",
      "Товары распределяются исключительно по очереди"
    ],
    correct: 1
  },
  {
    question: "Как принимаются ключевые решения в командной экономике?",
    answers: [
      "Их определяют только отдельные покупатели",
      "Их автоматически устанавливают природные условия",
      "Их в основном задаёт государственный план"
    ],
    correct: 2
  },
  {
    question: "Что характерно для смешанной экономики?",
    answers: [
      "Сочетание рыночных механизмов и участия государства",
      "Полное отсутствие частных предприятий",
      "Производство только для собственного потребления"
    ],
    correct: 0
  },
  {
    question: "Что означает производство в экономике?",
    answers: [
      "Покупку готовых товаров в магазине",
      "Создание товаров и услуг с использованием ресурсов",
      "Перевод денег между счетами"
    ],
    correct: 1
  },
  {
    question: "Что такое распределение?",
    answers: [
      "Использование товара для удовлетворения потребности",
      "Создание нового продукта на предприятии",
      "Определение того, кому и в каком объёме достанутся произведённые блага"
    ],
    correct: 2
  },
  {
    question: "Что называют обменом в экономике?",
    answers: [
      "Получение товаров и услуг в обмен на деньги или другие блага",
      "Изменение места жительства работников",
      "Хранение продукции на складе"
    ],
    correct: 0
  },
  {
    question: "Что такое потребление?",
    answers: [
      "Продажа сырья другим предприятиям",
      "Использование товаров и услуг для удовлетворения потребностей",
      "Подсчёт доходов государственного бюджета"
    ],
    correct: 1
  },
  {
    question: "Как рассчитывается прибыль предприятия?",
    answers: [
      "Как сумма всех произведённых товаров",
      "Как разница между выручкой и затратами",
      "Как количество работников, умноженное на зарплату"
    ],
    correct: 1
  },
  {
    question: "Какую роль конкуренция обычно играет на рынке?",
    answers: [
      "Побуждает предприятия улучшать товары и эффективнее работать",
      "Полностью отменяет необходимость выбора для покупателей",
      "Гарантирует одинаковые цены у всех продавцов"
    ],
    correct: 0
  },
  {
    question: "Что такое спрос?",
    answers: [
      "Объём товаров, который предприятия уже произвели",
      "Количество товара, которое покупатели готовы и способны приобрести",
      "Сумма налогов, уплаченных продавцами"
    ],
    correct: 1
  },
  {
    question: "Что такое предложение на рынке?",
    answers: [
      "Потребность покупателя в конкретном товаре",
      "Количество денег в государственном бюджете",
      "Количество товара, которое продавцы готовы продать"
    ],
    correct: 2
  },
  {
    question: "Какую важную роль выполняют налоги?",
    answers: [
      "Формируют доходы бюджета для финансирования общественных услуг",
      "Гарантируют прибыль каждому предприятию",
      "Заменяют все цены на товары"
    ],
    correct: 0
  },
  {
    question: "Какой сектор играет заметную роль в экономике Казахстана?",
    answers: [
      "Добыча нефти, газа и других природных ресурсов",
      "Производство только морских судов",
      "Выращивание кофе в промышленных масштабах"
    ],
    correct: 0
  },
  {
    question: "Почему для Казахстана важна диверсификация экономики?",
    answers: [
      "Она позволяет отказаться от торговли и услуг",
      "Она помогает развивать разные отрасли и снижать зависимость от одного сектора",
      "Она делает природные ресурсы неограниченными"
    ],
    correct: 1
  },
  {
    question: "Что обычно понимают под производительностью труда?",
    answers: [
      "Количество работников, получивших премию",
      "Объём выпуска на единицу затраченного труда за определённое время",
      "Общую площадь территории предприятия"
    ],
    correct: 1
  },
  {
    question: "Как устойчивое развитие связано с экономикой?",
    answers: [
      "Оно учитывает долгосрочное благополучие людей и бережное использование ресурсов",
      "Оно требует производить как можно больше независимо от последствий",
      "Оно означает полный отказ от экономической деятельности"
    ],
    correct: 0
  }
];

const startScreen = document.querySelector("#start-screen");
const questionScreen = document.querySelector("#question-screen");
const resultScreen = document.querySelector("#result-screen");
const startButton = document.querySelector("#start-button");
const restartButton = document.querySelector("#restart-button");
const nextButton = document.querySelector("#next-button");
const answerList = document.querySelector("#answer-list");
const feedback = document.querySelector("#feedback");
const questionTitle = document.querySelector("#question-title");
const questionNumber = document.querySelector("#question-number");
const questionCurrent = document.querySelector("#question-current");
const progressTrack = document.querySelector(".progress-track");
const progressFill = document.querySelector("#progress-fill");
const footerHint = document.querySelector("#footer-hint");

let currentQuestion = 0;
let score = 0;
let hasAnswered = false;

document.querySelector("#question-total").textContent = String(questions.length);

function showScreen(screenToShow) {
  [startScreen, questionScreen, resultScreen].forEach((screen) => {
    const isActive = screen === screenToShow;
    screen.hidden = !isActive;
    screen.classList.toggle("screen--active", isActive);
  });
}

function startQuiz() {
  currentQuestion = 0;
  score = 0;
  hasAnswered = false;
  showScreen(questionScreen);
  renderQuestion();
}

function renderQuestion() {
  const item = questions[currentQuestion];
  const questionIndex = currentQuestion + 1;

  hasAnswered = false;
  questionNumber.textContent = String(questionIndex).padStart(2, "0");
  questionCurrent.textContent = String(questionIndex);
  questionTitle.textContent = item.question;
  progressFill.style.width = `${(currentQuestion / questions.length) * 100}%`;
  progressTrack.setAttribute("aria-valuenow", String(currentQuestion));
  answerList.replaceChildren();
  feedback.hidden = true;
  feedback.classList.remove("is-incorrect");
  feedback.textContent = "";
  nextButton.disabled = true;
  nextButton.innerHTML = currentQuestion === questions.length - 1
    ? 'Узнать результат <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 10h12m-5-5 5 5-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    : 'Следующий <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 10h12m-5-5 5 5-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  footerHint.textContent = "Выбери один вариант ответа";

  item.answers.forEach((answer, index) => {
    const option = document.createElement("button");
    const letter = document.createElement("span");
    const text = document.createElement("span");

    option.type = "button";
    option.className = "answer-option";
    letter.className = "answer-letter";
    letter.textContent = ["А", "Б", "В"][index];
    text.className = "answer-text";
    text.textContent = answer;
    option.append(letter, text);
    option.addEventListener("click", () => selectAnswer(index));
    answerList.append(option);
  });
}

function selectAnswer(selectedIndex) {
  if (hasAnswered) return;

  hasAnswered = true;
  const item = questions[currentQuestion];
  const options = answerList.querySelectorAll(".answer-option");
  const isCorrect = selectedIndex === item.correct;

  progressFill.style.width = `${((currentQuestion + 1) / questions.length) * 100}%`;
  progressTrack.setAttribute("aria-valuenow", String(currentQuestion + 1));
  options.forEach((option, index) => {
    option.disabled = true;
    if (index === item.correct) option.classList.add("is-correct");
    if (index === selectedIndex && !isCorrect) option.classList.add("is-incorrect");
  });

  if (isCorrect) {
    score += 1;
    feedback.textContent = "Верно! Отличный ответ.";
    footerHint.textContent = "Ответ принят";
  } else {
    feedback.textContent = `Не совсем. Правильный ответ: ${item.answers[item.correct]}`;
    feedback.classList.add("is-incorrect");
    footerHint.textContent = "Правильный ответ отмечен";
  }

  feedback.hidden = false;
  nextButton.disabled = false;
}

function showResult() {
  const percentage = Math.round((score / questions.length) * 100);
  const resultKicker = document.querySelector("#result-kicker");
  const resultDescription = document.querySelector("#result-description");
  const resultIcon = document.querySelector("#result-icon");

  document.querySelector("#score-count").textContent = `${score}/${questions.length}`;
  document.querySelector("#score-percent").textContent = `${percentage}%`;

  if (percentage >= 80) {
    resultIcon.classList.remove("is-learning");
    resultKicker.textContent = "Отличная работа!";
    resultDescription.textContent = "Ты уверенно ориентируешься в экономике. Так держать!";
  } else if (percentage >= 50) {
    resultIcon.classList.remove("is-learning");
    resultKicker.textContent = "Хороший результат!";
    resultDescription.textContent = "У тебя уже есть хорошая база. Ещё немного практики — и будет отлично.";
  } else {
    resultIcon.classList.add("is-learning");
    resultKicker.textContent = "Хорошее начало!";
    resultDescription.textContent = "Теперь ты знаешь, что повторить. Попробуй пройти викторину ещё раз!";
  }

  showScreen(resultScreen);
}

function goToNextQuestion() {
  if (!hasAnswered) return;

  if (currentQuestion === questions.length - 1) {
    showResult();
    return;
  }

  currentQuestion += 1;
  renderQuestion();
}

startButton.addEventListener("click", startQuiz);
restartButton.addEventListener("click", startQuiz);
nextButton.addEventListener("click", goToNextQuestion);
