(function () {
  "use strict";

  const WORDS = [
    { baby: "Бабайя", adult: "банан", decoys: ["папайя", "бабайка", "бабушка"] },
    { baby: "Дюдю", adult: "облиться", decoys: ["дудеть", "дуть", "индюк"] },
    { baby: "Афейка", adult: "собака", decoys: ["скамейка", "копейка", "индейка"] },
    { baby: "Кавейка", adult: "наклейка", decoys: ["скамейка", "копейка", "батарейка"] },
    { baby: "Мяу", adult: "кот", decoys: ["мяч", "мята", "мясо"] },
    { baby: "Биби", adult: "собака", decoys: ["бибика", "бигуди", "билет"] },
    { baby: "Флагака", adult: "флаг", decoys: ["фляга", "бумага", "лягушка"] },
    { baby: "Пизза", adult: "пицца", decoys: ["киса", "лиса", "виза"] },
    { baby: "Дём", adult: "дом", decoys: ["дым", "день", "гром"] },
    { baby: "Магак", adult: "гамак", decoys: ["маяк", "мак", "рюкзак"] },
    { baby: "Го-во-ва", adult: "голова", decoys: ["корова", "подкова", "сова"] },
    { baby: "Бать", adult: "спать", decoys: ["брать", "дать", "встать"] },
    { baby: "Пипи", adult: "покупать", decoys: ["пить", "писать", "пищать"] },
    { baby: "Га", adult: "гадость", decoys: ["гавкать", "газ", "гаечка"] },
    { baby: "Кака", adult: "говно", decoys: ["каска", "кашка", "качели"] },
    { baby: "Папая", adult: "папа", decoys: ["папайя", "попугай", "бабайка"] },
    { baby: "Тиньда", adult: "Тильда", decoys: ["Линда", "Тина", "Дина"] },
    { baby: "Здись", adult: "здесь", decoys: ["свист", "кисть", "лист"] },
    { baby: "Ваванда", adult: "лаванда", decoys: ["веранда", "команда", "гирлянда"] },
    { baby: "Дайййй", adult: "большой", decoys: ["дальний", "длинный", "дай"] },
    { baby: "Няй", adult: "маленький", decoys: ["няня", "чай", "край"] },
    { baby: "Митька", adult: "мишка", decoys: ["мышка", "книжка", "шишка"] }
  ];

  const screens = {
    welcome: document.getElementById("welcome-screen"),
    quiz: document.getElementById("quiz-screen"),
    result: document.getElementById("result-screen"),
    leaderboard: document.getElementById("leaderboard-screen")
  };

  const state = {
    name: "",
    questions: [],
    index: 0,
    score: 0,
    streak: 0,
    startedAt: 0,
    seconds: 0,
    mistakes: [],
    answered: false,
    sounds: true
  };

  const config = window.QUIZ_CONFIG || {};
  const $ = (id) => document.getElementById(id);

  function shuffle(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function showScreen(name) {
    Object.entries(screens).forEach(([key, element]) => {
      element.classList.toggle("screen--active", key === name);
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cleanName(value) {
    return value.replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 24);
  }

  function tone(frequency, duration, type) {
    if (!state.sounds || !window.AudioContext) return;
    const audio = tone.context || (tone.context = new AudioContext());
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = type || "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(.08, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + duration);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + duration);
  }

  function playCorrectSound() {
    tone(523, .16, "sine");
    window.setTimeout(() => tone(659, .18, "sine"), 90);
  }

  function playWrongSound() { tone(180, .22, "triangle"); }

  function startQuiz() {
    state.questions = shuffle(WORDS);
    state.index = 0;
    state.score = 0;
    state.streak = 0;
    state.startedAt = Date.now();
    state.seconds = 0;
    state.mistakes = [];
    showScreen("quiz");
    renderQuestion();
  }

  function renderQuestion() {
    state.answered = false;
    const question = state.questions[state.index];
    const progress = ((state.index + 1) / state.questions.length) * 100;
    $("progress-text").textContent = `${state.index + 1} из ${state.questions.length}`;
    $("score-text").textContent = state.score;
    $("progress-bar").style.width = `${progress}%`;
    $("question-title").textContent = question.baby;
    $("feedback").textContent = "";
    $("feedback").className = "feedback";
    $("next-question").hidden = true;
    $("mascot").className = "mascot";
    $("streak-text").textContent = state.streak >= 2 ? `🔥 Серия: ${state.streak}` : "";

    const answers = shuffle([question.adult, ...question.decoys]);
    const holder = $("answers");
    holder.innerHTML = "";
    answers.forEach((answer, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "answer-button";
      button.dataset.letter = ["А", "Б", "В", "Г"][index];
      button.textContent = answer;
      button.addEventListener("click", () => chooseAnswer(button, answer));
      holder.appendChild(button);
    });
  }

  const CORRECT_LINES = [
    "Точно! Тильда одобряет перевод.",
    "Блестяще! Почти носитель языка.",
    "Да! Словарик вами гордится.",
    "Попадание в самое бабайя!"
  ];

  const WRONG_LINES = [
    "Ой! Семейный словарь слегка задымился.",
    "Почти! Тильда меняет правила на ходу.",
    "Не беда — даже взрослые путаются.",
    "Хитрое словечко! Запоминаем."
  ];

  function chooseAnswer(button, answer) {
    if (state.answered) return;
    state.answered = true;
    const question = state.questions[state.index];
    const isCorrect = answer === question.adult;
    const buttons = [...document.querySelectorAll(".answer-button")];

    buttons.forEach((item) => {
      item.disabled = true;
      if (item.textContent === question.adult) item.classList.add("answer-button--correct");
    });

    if (isCorrect) {
      state.score += 1;
      state.streak += 1;
      $("score-text").textContent = state.score;
      $("feedback").textContent = CORRECT_LINES[Math.floor(Math.random() * CORRECT_LINES.length)];
      $("feedback").classList.add("feedback--correct");
      $("mascot").classList.add("mascot--happy");
      playCorrectSound();
    } else {
      state.streak = 0;
      button.classList.add("answer-button--wrong");
      state.mistakes.push({ baby: question.baby, adult: question.adult, answer });
      $("feedback").textContent = `${WRONG_LINES[Math.floor(Math.random() * WRONG_LINES.length)]} «${question.baby}» — это «${question.adult}».`;
      $("feedback").classList.add("feedback--wrong");
      $("mascot").classList.add("mascot--oops");
      playWrongSound();
    }

    $("next-question").textContent = state.index === state.questions.length - 1 ? "Узнать результат →" : "Дальше →";
    $("next-question").hidden = false;
    $("next-question").focus({ preventScroll: true });
  }

  function nextQuestion() {
    if (!state.answered) return;
    if (state.index < state.questions.length - 1) {
      state.index += 1;
      renderQuestion();
      return;
    }
    finishQuiz();
  }

  function getRank(score) {
    const ratio = score / WORDS.length;
    if (ratio === 1) return { title: "Верховный\nтиньдолог", emoji: "👑", copy: "Ни одной ошибки. Возможно, это сама Тильда под прикрытием." };
    if (ratio >= .86) return { title: "Академик\nтиньдологии", emoji: "🏆", copy: "Словарный запас внушительный. Можно вести переговоры без переводчика." };
    if (ratio >= .68) return { title: "Переводчик\nвысшей категории", emoji: "🎓", copy: "Очень уверенно! Ещё пара семейных чаепитий — и будет свободное владение." };
    if (ratio >= .45) return { title: "Смелый\nсловолаз", emoji: "🧗", copy: "База есть, характер есть. Осталось подружиться с самыми хитрыми словами." };
    return { title: "Юный\nтиньдолог", emoji: "🐣", copy: "Начало положено! Тильда назначает пересдачу с печеньем." };
  }

  async function finishQuiz() {
    state.seconds = Math.max(1, Math.round((Date.now() - state.startedAt) / 1000));
    const rank = getRank(state.score);
    $("result-title").innerHTML = rank.title.replace("\n", "<br>");
    $("result-emoji").textContent = rank.emoji;
    $("final-score").textContent = state.score;
    $("result-copy").textContent = `${rank.copy} Время: ${formatTime(state.seconds)}.`;
    $("show-mistakes").hidden = state.mistakes.length === 0;
    renderMistakes();
    showScreen("result");
    launchConfetti();
    saveLocalResult();
    await submitResult();
    await loadLeaderboard();
  }

  function renderMistakes() {
    const holder = $("mistakes");
    holder.hidden = true;
    holder.innerHTML = "";
    if (!state.mistakes.length) return;
    const heading = document.createElement("h3");
    heading.textContent = "Шпаргалка на будущее";
    holder.appendChild(heading);
    state.mistakes.forEach((mistake) => {
      const row = document.createElement("p");
      row.innerHTML = `<strong>${escapeHtml(mistake.baby)}</strong> — ${escapeHtml(mistake.adult)} <span aria-label="ваш ответ">(вы выбрали: ${escapeHtml(mistake.answer)})</span>`;
      holder.appendChild(row);
    });
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, "0")}`;
  }

  function saveLocalResult() {
    const result = { name: state.name, score: state.score, seconds: state.seconds, finishedAt: new Date().toISOString() };
    const existing = getLocalResults();
    existing.push(result);
    localStorage.setItem("tilda-quiz-results", JSON.stringify(existing.slice(-30)));
  }

  function getLocalResults() {
    try { return JSON.parse(localStorage.getItem("tilda-quiz-results") || "[]"); }
    catch (error) { return []; }
  }

  async function submitResult() {
    const fields = config.formFields || {};
    if (!config.formUrl || !fields.name || !fields.score || !fields.seconds || !fields.finishedAt) {
      $("save-status").textContent = "Результат сохранён на этом устройстве.";
      return;
    }

    const body = new URLSearchParams();
    body.set(fields.name, state.name);
    body.set(fields.score, String(state.score));
    body.set(fields.seconds, String(state.seconds));
    body.set(fields.finishedAt, new Date().toISOString());

    try {
      await fetch(config.formUrl, { method: "POST", mode: "no-cors", body });
      $("save-status").textContent = "✓ Результат улетел на семейный пьедестал";
    } catch (error) {
      $("save-status").textContent = "Не получилось отправить результат. Он сохранён на этом устройстве.";
    }
  }

  async function loadLeaderboard(target) {
    let results = getLocalResults();
    if (config.leaderboardCsvUrl) {
      try {
        const response = await fetch(`${config.leaderboardCsvUrl}${config.leaderboardCsvUrl.includes("?") ? "&" : "?"}t=${Date.now()}`, { cache: "no-store" });
        if (!response.ok) throw new Error("Leaderboard unavailable");
        const text = await response.text();
        const remote = parseCsv(text);
        if (remote.length) results = remote;
      } catch (error) {
        // Локальный результат остаётся виден, даже если сеть временно пропала.
      }
    }

    const ranked = bestAttempts(results).slice(0, 10);
    renderLeaderboard($("leaderboard"), $("leaderboard-empty"), ranked);
    renderLeaderboard($("standalone-leaderboard"), $("standalone-leaderboard-empty"), ranked);
    if (target) target.blur();
  }

  function parseCsv(text) {
    const rows = [];
    let row = [], cell = "", quoted = false;
    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];
      const next = text[i + 1];
      if (char === '"' && quoted && next === '"') { cell += '"'; i += 1; }
      else if (char === '"') quoted = !quoted;
      else if (char === "," && !quoted) { row.push(cell); cell = ""; }
      else if ((char === "\n" || char === "\r") && !quoted) {
        if (char === "\r" && next === "\n") i += 1;
        row.push(cell); rows.push(row); row = []; cell = "";
      } else cell += char;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    if (rows.length < 2) return [];

    const headers = rows[0].map((value) => value.trim().toLowerCase());
    const findColumn = (terms) => headers.findIndex((header) => terms.some((term) => header.includes(term)));
    const nameIndex = findColumn(["имя", "name"]);
    const scoreIndex = findColumn(["счёт", "счет", "score"]);
    const secondsIndex = findColumn(["секунд", "seconds", "время"]);
    const dateIndex = findColumn(["отметка времени", "timestamp", "дата", "finished"]);
    if (nameIndex < 0 || scoreIndex < 0 || secondsIndex < 0) return [];

    return rows.slice(1).map((values) => ({
      name: cleanName(values[nameIndex] || "Игрок"),
      score: Number.parseInt(values[scoreIndex], 10) || 0,
      seconds: Number.parseInt(values[secondsIndex], 10) || 99999,
      finishedAt: dateIndex >= 0 ? values[dateIndex] : ""
    })).filter((item) => item.name && !item.name.startsWith("__") && item.score >= 0);
  }

  function bestAttempts(results) {
    const best = new Map();
    results.forEach((item) => {
      const normalized = cleanName(item.name || "Игрок");
      const key = normalized.toLocaleLowerCase("ru");
      const candidate = { name: normalized, score: Number(item.score) || 0, seconds: Number(item.seconds) || 99999, finishedAt: item.finishedAt || "" };
      const current = best.get(key);
      if (!current || candidate.score > current.score || (candidate.score === current.score && candidate.seconds < current.seconds)) best.set(key, candidate);
    });
    return [...best.values()].sort((a, b) => b.score - a.score || a.seconds - b.seconds || String(a.finishedAt).localeCompare(String(b.finishedAt)));
  }

  function renderLeaderboard(list, empty, results) {
    list.innerHTML = "";
    empty.hidden = results.length > 0;
    results.forEach((item) => {
      const row = document.createElement("li");
      const person = document.createElement("div");
      person.innerHTML = `<div class="leaderboard__name">${escapeHtml(item.name)}</div><div class="leaderboard__meta">${formatTime(item.seconds)}</div>`;
      const score = document.createElement("div");
      score.className = "leaderboard__score";
      score.textContent = `${item.score}/${WORDS.length}`;
      row.append(person, score);
      list.appendChild(row);
    });
  }

  async function shareResult() {
    const text = `${state.name} — ${state.score}/${WORDS.length} в квизе «Кто тут главный тиньдолог?» за ${formatTime(state.seconds)}. Сможете лучше?`;
    const shareData = { title: "Квиз Тильды", text, url: window.location.href };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(`${text} ${window.location.href}`);
        $("share-result").textContent = "Скопировано! ✓";
        window.setTimeout(() => { $("share-result").textContent = "Поделиться результатом"; }, 1800);
      }
    } catch (error) {
      // Пользователь мог просто закрыть системное меню «Поделиться».
    }
  }

  function launchConfetti() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = $("confetti");
    const context = canvas.getContext("2d");
    const ratio = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * ratio;
    canvas.height = window.innerHeight * ratio;
    context.scale(ratio, ratio);
    const colors = ["#ff6b8a", "#ffd34f", "#77d8bd", "#83c8ff", "#c9b1ff"];
    const pieces = Array.from({ length: 75 }, () => ({
      x: Math.random() * window.innerWidth,
      y: -20 - Math.random() * window.innerHeight * .35,
      size: 6 + Math.random() * 8,
      speed: 2.2 + Math.random() * 3.7,
      drift: -1.5 + Math.random() * 3,
      spin: Math.random() * Math.PI,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));
    let frame = 0;
    function draw() {
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      pieces.forEach((piece) => {
        piece.y += piece.speed;
        piece.x += piece.drift;
        piece.spin += .08;
        context.save();
        context.translate(piece.x, piece.y);
        context.rotate(piece.spin);
        context.fillStyle = piece.color;
        context.fillRect(-piece.size / 2, -piece.size / 3, piece.size, piece.size * .66);
        context.restore();
      });
      frame += 1;
      if (frame < 170) requestAnimationFrame(draw);
      else context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
    draw();
  }

  $("name-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const name = cleanName($("player-name").value);
    if (name.length < 2) {
      $("name-hint").textContent = "Напишите хотя бы две буквы — пьедестал должен знать героя!";
      $("name-hint").classList.add("field-hint--error");
      return;
    }
    state.name = name;
    $("name-hint").classList.remove("field-hint--error");
    startQuiz();
  });

  $("next-question").addEventListener("click", nextQuestion);
  $("share-result").addEventListener("click", shareResult);
  $("show-mistakes").addEventListener("click", () => {
    const holder = $("mistakes");
    holder.hidden = !holder.hidden;
    $("show-mistakes").textContent = holder.hidden ? "Разобрать промахи" : "Спрятать шпаргалку";
  });
  $("play-again").addEventListener("click", () => { showScreen("welcome"); $("player-name").focus(); });
  $("open-leaderboard").addEventListener("click", async () => { showScreen("leaderboard"); await loadLeaderboard(); });
  $("close-leaderboard").addEventListener("click", () => showScreen("welcome"));
  $("refresh-leaderboard").addEventListener("click", (event) => loadLeaderboard(event.currentTarget));
  $("refresh-standalone").addEventListener("click", (event) => loadLeaderboard(event.currentTarget));
  $("sound-toggle").addEventListener("click", (event) => {
    state.sounds = !state.sounds;
    event.currentTarget.setAttribute("aria-pressed", String(state.sounds));
    event.currentTarget.setAttribute("aria-label", state.sounds ? "Выключить звуки" : "Включить звуки");
    event.currentTarget.textContent = state.sounds ? "♪" : "×";
    if (state.sounds) tone(440, .12, "sine");
  });

  loadLeaderboard();
})();
