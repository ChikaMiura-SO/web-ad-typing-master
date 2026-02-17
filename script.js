// Game Data
// Game Data
// Game Data
let selectedCategory = ''; // 'marketing' or 'compliance'
let currentQuestions = [];

// Game State
let score = 0;
let timeLeft = 60;
let isPlaying = false;
let timerInterval = null;
let currentTermIndex = 0;
let typingState = null; // Current typing state from TypingEngine
let usedTerms = []; // To track terms used in the current session for the result screen
let completedQuestions = []; // Track successfully completed questions
let keyStats = {}; // { 'a': { correct: 0, miss: 0 }, ... }
let currentLevel = 1; // Track selected level for UI hints
let totalTime = 60; // Total time for the current game (used for progress bar)

// DOM Elements
// DOM Elements
// DOM Elements
const categoryScreen = document.getElementById('category-selection');
const levelScreen = document.getElementById('level-selection');
const gameScreen = document.getElementById('game-container'); // Renamed from game-screen
const resultScreen = document.getElementById('result-screen');
const levelSubtitle = document.getElementById('level-subtitle');

// Category Buttons
const catMarketingBtn = document.getElementById('cat-marketing');
const catComplianceBtn = document.getElementById('cat-compliance');

// Level Buttons
const level1Btn = document.getElementById('level-1');
const level2Btn = document.getElementById('level-2');
const level3Btn = document.getElementById('level-3');

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
const levelHint = document.getElementById('level-hint');

// State for selection


// Audio
const sounds = {
    tap: new Audio('sounds/typing_tap.mp3'),
    miss: new Audio('sounds/miss_sound.mp3'),
    complete: new Audio('sounds/word_complete.mp3'),
    finish: new Audio('sounds/game_finish.mp3')
};

// Preload sounds
Object.values(sounds).forEach(sound => sound.load());

function playSound(type) {
    const sound = sounds[type];
    if (sound) {
        sound.currentTime = 0; // Reset to start for rapid playback
        sound.play().catch(e => console.log('Sound play failed:', e));
    }
}

// Event Listeners
catMarketingBtn.addEventListener('click', () => selectCategory('marketing'));
catComplianceBtn.addEventListener('click', () => selectCategory('compliance'));

level1Btn.addEventListener('click', () => startGame(1));
level2Btn.addEventListener('click', () => startGame(2));
level3Btn.addEventListener('click', () => startGame(3));

restartBtn.addEventListener('click', resetGame);
document.addEventListener('keydown', handleInput);

// Functions
function showScreen(screenId) {
    // Hide all screens
    [categoryScreen, levelScreen, gameScreen, resultScreen].forEach(screen => {
        screen.classList.add('hidden');
        screen.classList.remove('active');
    });

    // Show target screen
    const target = document.getElementById(screenId);
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('active');
    }
}

function selectCategory(category) {
    selectedCategory = category;

    // Update level screen subtitle
    const categoryName = category === 'marketing' ? 'Webマーケティング用語' : 'コンプライアンス';
    levelSubtitle.textContent = `${categoryName} - 難易度を選択`;

    showScreen('level-selection');
}



// Functions
function initGame() {
    score = 0;
    // 中級・上級は3分（180秒）、初級は1分（60秒）
    totalTime = (currentLevel >= 2) ? 120 : 60;
    timeLeft = totalTime;
    isPlaying = false;
    usedTerms = [];
    completedQuestions = [];
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

async function startGame(selectedLevel) {
    // Prevent Enter key from triggering button click again
    if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
    }

    // Clear any existing timer to prevent multiple intervals
    if (timerInterval) {
        clearInterval(timerInterval);
    }

    // Store current level for UI hints
    currentLevel = selectedLevel;

    try {
        let allQuestions = [];

        // Try to fetch from Firestore first
        if (typeof FirestoreService !== 'undefined' && FirestoreService.fetchQuestionsFromFirestore) {
            console.log('Fetching from Firestore...');
            allQuestions = await FirestoreService.fetchQuestionsFromFirestore(selectedCategory, selectedLevel);
            console.log(`Fetched ${allQuestions.length} questions from Firestore`);
        }

        // Fallback to questions.json if Firestore returns empty or fails
        if (allQuestions.length === 0) {
            console.log('Falling back to questions.json...');
            const response = await fetch('questions.json?t=' + new Date().getTime());
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const jsonQuestions = await response.json();

            // Filter questions based on selected category and level
            allQuestions = jsonQuestions.filter(q => (q.category || 'marketing') === selectedCategory && q.level === selectedLevel);
        }

        currentQuestions = allQuestions;

        if (currentQuestions.length === 0) {
            throw new Error('条件に一致する問題がありません。');
        }

        initGame();
        isPlaying = true;

        showScreen('game-container');

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
        const progressPercentage = (timeLeft / totalTime) * 100;
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
        // すべての問題をクリアしたらゲーム終了
        endGame();
        return;
    }

    const currentTerm = currentQuestions[currentTermIndex];
    usedTerms.push(currentTerm); // Track for review

    // Display level-specific hint
    if (levelHint) {
        if (currentLevel === 2 || currentLevel === 3) {
            levelHint.textContent = '💡 文章を読んでタイピングしてください';
        } else {
            levelHint.textContent = '';
        }
    }

    // Use question_text for display, fallback to term for compatibility
    termDisplay.textContent = currentTerm.question_text || currentTerm.term;

    // Get reading from correct_answer (hiragana) - fallback to reading/roman for compatibility
    const reading = currentTerm.correct_answer || currentTerm.reading || currentTerm.roman || '';
    readingDisplay.textContent = reading; // Show hiragana reading

    // Generate typing state from hiragana
    typingState = TypingEngine.generateTypingState(reading);
    updateRomajiDisplay();
}

function updateRomajiDisplay() {
    if (!typingState) return;

    const display = TypingEngine.getDisplayRomaji(typingState);

    let html = '';

    // Completed part (green)
    if (display.completed) {
        html += `<span class="char-correct">${display.completed}</span>`;
    }

    // Current input part (orange, active)
    if (display.current) {
        html += `<span class="char-correct">${display.current}</span>`;
    }

    // Remaining part - first char is active
    if (display.remaining) {
        html += `<span class="char-active">${display.remaining[0]}</span>`;
        if (display.remaining.length > 1) {
            html += `<span>${display.remaining.substring(1)}</span>`;
        }
    }

    romajiDisplay.innerHTML = html;
}

function handleInput(e) {
    if (!isPlaying || !typingState) return;

    // Ignore modifier keys and special keys
    if (e.key.length > 1) return;

    const key = e.key.toLowerCase();

    // Get the expected next character for stats tracking
    const display = TypingEngine.getDisplayRomaji(typingState);
    const targetChar = display.remaining ? display.remaining[0] : '';

    // Initialize stats for this char if not exists
    if (targetChar && !keyStats[targetChar]) {
        keyStats[targetChar] = { correct: 0, miss: 0 };
    }

    // Process input through typing engine
    const result = TypingEngine.processKeyInput(typingState, key);

    if (result.isCorrect) {
        // Correct
        playSound('tap');
        if (targetChar) keyStats[targetChar].correct++;
        typingState = result.newState;
        score += 10;
        scoreDisplay.textContent = score;

        // Score Flash Animation
        scoreDisplay.classList.remove('score-flash');
        void scoreDisplay.offsetWidth; // Trigger reflow
        scoreDisplay.classList.add('score-flash');

        if (result.isWordComplete) {
            // Word complete
            playSound('complete');
            const currentTerm = currentQuestions[currentTermIndex];
            completedQuestions.push(currentTerm); // Add to completed list
            score += 50; // Bonus for finishing word
            scoreDisplay.textContent = score;
            currentTermIndex++;

            // Visual flair for word complete
            typingArea.classList.remove('area-flash');
            void typingArea.offsetWidth; // Trigger reflow
            typingArea.classList.add('area-flash');

            typingArea.style.borderColor = '#3b82f6';
            setTimeout(() => typingArea.style.borderColor = 'rgba(255, 255, 255, 0.1)', 200);

            nextTerm();
        } else {
            updateRomajiDisplay();
        }
    } else {
        // Incorrect
        playSound('miss');
        if (targetChar) keyStats[targetChar].miss++;
        typingArea.classList.add('shake');
        typingArea.style.borderColor = '#ef4444';
        setTimeout(() => {
            typingArea.classList.remove('shake');
            typingArea.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        }, 300);
    }
}

function endGame() {
    playSound('finish');
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
    // Use usedTerms to show all attempted questions
    const uniqueAttemptedTerms = [...new Set(usedTerms)];

    if (uniqueAttemptedTerms.length === 0) {
        reviewList.innerHTML = '<li class="review-item" style="color: #64748b; text-align: center;">出題された問題はありません</li>';
        return;
    }

    uniqueAttemptedTerms.forEach(term => {
        const li = document.createElement('li');
        li.className = 'review-item';
        // Use new schema fields (question_text, correct_answer), fallback to old fields for compatibility
        const questionText = term.question_text || term.term || '';
        const answer = term.correct_answer || term.reading || term.roman || '';
        li.innerHTML = `
            <div class="review-term">${questionText}</div>
            <div class="review-meaning">${answer}</div>
        `;
        reviewList.appendChild(li);
    });
}

function resetGame() {
    restartBtn.blur();
    showScreen('category-selection');
}
