// Game Data
// Game Data
// Game Data
let currentQuestions = [];

// Game State
let score = 0;
let timeLeft = 30;
let isPlaying = false;
let timerInterval = null;
let currentTermIndex = 0;
let charIndex = 0;
let usedTerms = []; // To track terms used in the current session for the result screen
let keyStats = {}; // { 'a': { correct: 0, miss: 0 }, ... }

// DOM Elements
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const resultScreen = document.getElementById('result-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const timerDisplay = document.getElementById('timer');
const scoreDisplay = document.getElementById('score');
const finalScoreDisplay = document.getElementById('final-score');
const bestKeysList = document.getElementById('best-keys-list');
const worstKeysList = document.getElementById('worst-keys-list');
const termDisplay = document.getElementById('term-display');
const readingDisplay = document.getElementById('term-reading');
const romajiDisplay = document.getElementById('romaji-display');
const timeProgressBar = document.getElementById('time-progress');
const reviewList = document.getElementById('review-list');
const typingArea = document.querySelector('.typing-area');

// Audio (Optional - using simple Web Audio API for beeps if needed, but keeping it silent/visual for now as per plan)

// Event Listeners
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', resetGame);
document.addEventListener('keydown', handleInput);

// Functions
function initGame() {
    score = 0;
    timeLeft = 30;
    isPlaying = false;
    usedTerms = [];
    keyStats = {};
    scoreDisplay.textContent = score;
    timerDisplay.textContent = timeLeft;
    timeProgressBar.style.width = '100%';

    // Shuffle terms
    shuffleArray(currentQuestions);
    currentTermIndex = 0;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

async function startGame() {
    startBtn.blur();
    try {
        const response = await fetch('questions.json');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const allQuestions = await response.json();

        // Filter questions: category 'ad_term' AND level 1
        currentQuestions = allQuestions.filter(q => q.category === 'ad_term' && q.level === 1);

        if (currentQuestions.length === 0) {
            throw new Error('条件に一致する問題がありません。');
        }

        initGame();
        isPlaying = true;

        startScreen.classList.add('hidden');
        startScreen.classList.remove('active');
        gameScreen.classList.remove('hidden');
        gameScreen.classList.add('active');
        resultScreen.classList.add('hidden');
        resultScreen.classList.remove('active');

        nextTerm();
        startTimer();
    } catch (error) {
        console.error('Game Start Error:', error);
        alert('ゲームの開始に失敗しました: ' + error.message);
    }
}

function startTimer() {
    timerInterval = setInterval(() => {
        timeLeft--;
        timerDisplay.textContent = timeLeft;

        // Update progress bar
        const progressPercentage = (timeLeft / 30) * 100;
        timeProgressBar.style.width = `${progressPercentage}%`;

        if (timeLeft <= 5) {
            timerDisplay.style.color = '#ef4444'; // Red warning
        } else {
            timerDisplay.style.color = '#06b6d4'; // Reset color
        }

        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

function nextTerm() {
    if (currentTermIndex >= currentQuestions.length) {
        // Reshuffle if we run out of terms
        shuffleArray(currentQuestions);
        currentTermIndex = 0;
    }

    const currentTerm = currentQuestions[currentTermIndex];
    usedTerms.push(currentTerm); // Track for review

    termDisplay.textContent = currentTerm.term;
    readingDisplay.textContent = ''; // Reading removed in new data structure

    charIndex = 0;
    updateRomajiDisplay();
}

function updateRomajiDisplay() {
    const currentTerm = currentQuestions[currentTermIndex];
    const romaji = currentTerm.roman;

    let html = '';
    for (let i = 0; i < romaji.length; i++) {
        if (i < charIndex) {
            html += `<span class="char-correct">${romaji[i]}</span>`;
        } else if (i === charIndex) {
            html += `<span class="char-active">${romaji[i]}</span>`;
        } else {
            html += `<span>${romaji[i]}</span>`;
        }
    }
    romajiDisplay.innerHTML = html;
}

function handleInput(e) {
    if (!isPlaying) return;

    const currentTerm = currentQuestions[currentTermIndex];
    const targetChar = currentTerm.roman[charIndex];

    // Ignore modifier keys
    if (e.key.length > 1) return;

    // Initialize stats for this char if not exists
    if (!keyStats[targetChar]) {
        keyStats[targetChar] = { correct: 0, miss: 0 };
    }

    if (e.key.toLowerCase() === targetChar) {
        // Correct
        keyStats[targetChar].correct++;
        charIndex++;
        score += 10;
        scoreDisplay.textContent = score;

        if (charIndex >= currentTerm.roman.length) {
            // Word complete
            score += 50; // Bonus for finishing word
            scoreDisplay.textContent = score;
            currentTermIndex++;

            // Visual flair for word complete
            typingArea.style.borderColor = '#3b82f6';
            setTimeout(() => typingArea.style.borderColor = 'rgba(255, 255, 255, 0.1)', 200);

            nextTerm();
        } else {
            updateRomajiDisplay();
        }
    } else {
        // Incorrect
        keyStats[targetChar].miss++;
        typingArea.classList.add('shake');
        typingArea.style.borderColor = '#ef4444';
        setTimeout(() => {
            typingArea.classList.remove('shake');
            typingArea.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        }, 300);
    }
}

function endGame() {
    isPlaying = false;
    clearInterval(timerInterval);

    gameScreen.classList.add('hidden');
    gameScreen.classList.remove('active');
    resultScreen.classList.remove('hidden');
    resultScreen.classList.add('active');

    finalScoreDisplay.textContent = score;
    calculateAndRenderStats();
    generateReviewList();
}

function calculateAndRenderStats() {
    // Filter keys with at least 5 attempts (correct + miss)
    const validKeys = Object.keys(keyStats).filter(key => {
        const stats = keyStats[key];
        return (stats.correct + stats.miss) >= 5;
    });

    // Calculate accuracy for each key
    const statsArray = validKeys.map(key => {
        const stats = keyStats[key];
        const total = stats.correct + stats.miss;
        const accuracy = stats.correct / total;
        return { key, accuracy, miss: stats.miss, total };
    });

    // Sort for Best (High Accuracy)
    const bestKeys = [...statsArray].sort((a, b) => b.accuracy - a.accuracy).slice(0, 3);

    // Sort for Worst (High Miss Count)
    // If miss counts are equal, lower accuracy breaks tie (higher miss rate)
    const worstKeys = [...statsArray].sort((a, b) => {
        if (b.miss !== a.miss) return b.miss - a.miss;
        return a.accuracy - b.accuracy;
    }).slice(0, 3);

    renderKeyStats(bestKeysList, bestKeys, true);
    renderKeyStats(worstKeysList, worstKeys, false);
}

function renderKeyStats(container, keys, isBest) {
    container.innerHTML = '';
    if (keys.length === 0) {
        container.innerHTML = '<span style="color: #64748b; font-size: 0.9rem;">データ不足</span>';
        return;
    }

    keys.forEach(item => {
        const div = document.createElement('div');
        div.className = 'key-badge';
        const valueText = isBest
            ? `${Math.round(item.accuracy * 100)}%`
            : `${item.miss} Miss`;

        div.innerHTML = `
            <span class="key-char">${item.key.toUpperCase()}</span>
            <span class="key-stat">${valueText}</span>
        `;
        container.appendChild(div);
    });
}

function generateReviewList() {
    reviewList.innerHTML = '';
    // Filter unique terms just in case, though logic pushes sequentially
    const uniqueUsedTerms = [...new Set(usedTerms)];

    uniqueUsedTerms.forEach(term => {
        const li = document.createElement('li');
        li.className = 'review-item';
        li.innerHTML = `
            <div class="review-term">${term.term}</div>
            <div class="review-meaning">${term.explanation}</div>
        `;
        reviewList.appendChild(li);
    });
}

function resetGame() {
    restartBtn.blur();
    resultScreen.classList.add('hidden');
    resultScreen.classList.remove('active');
    startScreen.classList.remove('hidden');
    startScreen.classList.add('active');
}
