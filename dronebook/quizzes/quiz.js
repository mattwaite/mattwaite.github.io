// Shared quiz engine for the Drone Journalism quiz supplement.
// Expects a global element #quiz-root and a data attribute pointing at the JSON file.

(function () {
  const root = document.getElementById('quiz-root');
  if (!root) return;

  const dataUrl = root.dataset.quizSrc;
  const state = {
    title: '',
    questions: [],
    order: [],
    current: 0,
    answers: [], // { choiceId, correct }
  };

  function shuffledOrder(n) {
    const order = Array.from({ length: n }, (_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return order;
  }

  function start(data) {
    state.title = data.title;
    state.questions = data.questions;
    state.order = shuffledOrder(data.questions.length);
    state.current = 0;
    state.answers = [];
    renderQuestion();
  }

  function currentQuestion() {
    return state.questions[state.order[state.current]];
  }

  function renderQuestion() {
    const q = currentQuestion();
    const total = state.questions.length;
    const num = state.current + 1;
    const pct = Math.round((state.current / total) * 100);

    const choicesHtml = q.choices
      .map(
        (c) => `<button type="button" class="btn btn-outline-primary w-100 choice-btn" data-choice-id="${c.id}">${c.text}</button>`
      )
      .join('');

    root.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-2">
        <span class="quiz-progress-label">Question ${num} of ${total}</span>
        <span class="quiz-progress-label">${pct}% complete</span>
      </div>
      <div class="progress mb-4" style="height: 6px;">
        <div class="progress-bar" role="progressbar" style="width: ${pct}%;"></div>
      </div>
      <div class="card quiz-card">
        <div class="card-body">
          <div class="quiz-question-text mb-4">${q.question}</div>
          <div id="choices-container">${choicesHtml}</div>
          <div id="feedback-container" class="mt-3"></div>
          <div class="mt-4 text-end">
            <button type="button" id="next-btn" class="btn btn-primary" disabled>Next</button>
          </div>
        </div>
      </div>
    `;

    document.querySelectorAll('.choice-btn').forEach((btn) => {
      btn.addEventListener('click', () => onChoiceClick(btn, q));
    });
    document.getElementById('next-btn').addEventListener('click', onNext);
  }

  function onChoiceClick(btn, q) {
    if (btn.disabled) return;
    const choiceId = btn.dataset.choiceId;
    const isCorrect = q.correct.includes(choiceId);

    document.querySelectorAll('.choice-btn').forEach((b) => {
      b.disabled = true;
      if (q.correct.includes(b.dataset.choiceId)) {
        b.classList.add('correct-choice');
      } else if (b === btn) {
        b.classList.add('incorrect-choice');
      }
    });

    const feedback = document.getElementById('feedback-container');
    if (isCorrect) {
      feedback.innerHTML = `<div class="alert alert-success mb-0"><i class="bi bi-check-circle-fill me-1"></i> Correct!</div>`;
    } else {
      const correctChoice = q.choices.find((c) => q.correct.includes(c.id));
      feedback.innerHTML = `<div class="alert alert-danger mb-0"><i class="bi bi-x-circle-fill me-1"></i> Not quite. The correct answer is: <strong>${correctChoice.text}</strong></div>`;
    }

    state.answers.push({ choiceId, correct: isCorrect });
    document.getElementById('next-btn').disabled = false;
  }

  function onNext() {
    if (state.current < state.questions.length - 1) {
      state.current += 1;
      renderQuestion();
    } else {
      renderResults();
    }
  }

  function renderResults() {
    const total = state.questions.length;
    const correctCount = state.answers.filter((a) => a.correct).length;
    const pct = Math.round((correctCount / total) * 100);

    const reviewHtml = state.order
      .map((qIndex, i) => {
        const q = state.questions[qIndex];
        const answer = state.answers[i];
        const chosenChoice = q.choices.find((c) => c.id === answer.choiceId);
        const correctChoice = q.choices.find((c) => q.correct.includes(c.id));
        const statusClass = answer.correct ? 'is-correct' : 'is-incorrect';
        const icon = answer.correct
          ? '<i class="bi bi-check-circle-fill text-success"></i>'
          : '<i class="bi bi-x-circle-fill text-danger"></i>';
        const yourAnswerLine = answer.correct
          ? ''
          : `<div class="small text-muted">Your answer: ${chosenChoice.text}</div>`;
        return `
          <div class="review-item ${statusClass} p-3 mb-2">
            <div class="mb-1">${icon} <span class="quiz-question-text">${q.question}</span></div>
            ${yourAnswerLine}
            <div class="small text-muted">Correct answer: ${correctChoice.text}</div>
          </div>
        `;
      })
      .join('');

    root.innerHTML = `
      <div class="card quiz-card">
        <div class="card-body text-center">
          <h2 class="h4 mb-3">${state.title} — Results</h2>
          <div class="score-circle">${pct}%</div>
          <p class="lead mb-4">You got ${correctCount} out of ${total} correct.</p>
          <button type="button" id="retake-btn" class="btn btn-primary me-2">Retake Quiz</button>
          <a href="index.html" class="btn btn-outline-secondary">Back to All Quizzes</a>
        </div>
      </div>
      <h3 class="h5 mt-4 mb-3">Review Your Answers</h3>
      ${reviewHtml}
    `;

    document.getElementById('retake-btn').addEventListener('click', () => {
      state.order = shuffledOrder(state.questions.length);
      state.current = 0;
      state.answers = [];
      renderQuestion();
    });
  }

  root.innerHTML = '<p class="text-muted">Loading quiz…</p>';
  fetch(dataUrl)
    .then((r) => r.json())
    .then(start)
    .catch((err) => {
      root.innerHTML = `<div class="alert alert-danger">Could not load quiz data (${err}).</div>`;
    });
})();
