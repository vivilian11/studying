// 1. 准备数据：8对 emoji，共16张
const emojis = ['🍎','🍎','🍇','🍇','🍌','🍌','🍑','🍑','🍉','🍉','🍍','🍍','🥝','🥝','🍈','🍈'];

// 2. 获取 DOM 元素
const board = document.getElementById('board');
const movesElement = document.getElementById('moves');
const restartBtn = document.getElementById('restartBtn');
const timerElement = document.getElementById('timer');
const bestMovesElement=document.getElementById('bestMoves');
const bestTimerElement=document.getElementById('bestTimer');

//2.5 作业：添加翻页与成功的音效
const flipSound=new Audio('flipped.mp3');
const successSound=new Audio('success.mp3');

//2.75 作业：初始化存储的最短步数和时间
const historyMoves = localStorage.getItem('bestMoves');
bestMovesElement.innerText = historyMoves ? historyMoves : '--';
const historyTimer = localStorage.getItem('bestTimer');
bestTimerElement.innerText = historyTimer ? historyTimer : '--';

// 3. 游戏状态变量（用来记录游戏进行到哪一步了）
let cardsFlipped = []; // 当前翻开了几张牌？（存 DOM 元素）
let matchedPairs = 0;  // 配对了多少对？
let moves = 0;         // 走了几步？

// 4. ⏱ 计时器状态
let timerIntervalId = null;
let timerStarted = false;      // 是否已经在本局游戏中启动过计时
let startTimestampMs = 0;      // 计时开始的时间戳（ms）
let elapsedSeconds = 0;        // 已经过去的秒数（用于显示/归零）

// --- 计时器工具函数 ---
function pad2(n) {
    return String(n).padStart(2, '0');
}

function renderTime(totalSeconds) {
    const mm = Math.floor(totalSeconds / 60);
    const ss = totalSeconds % 60;
    timerElement.innerText = `${pad2(mm)}:${pad2(ss)}`;
}
//重置计时器：清零时间、关闭正在运行的计时器、更新显示内容。
function resetTimer() {
    elapsedSeconds = 0;
    timerStarted = false;
    startTimestampMs = 0;
    if (timerIntervalId) {
        clearInterval(timerIntervalId);
        timerIntervalId = null;
    }
    renderTime(0);
}

function startTimerIfNeeded() {
    // 只在“本局第一次有效翻牌”时启动
    if (timerStarted) return;

    timerStarted = true;
    startTimestampMs = Date.now(); // 从第一次翻牌时开始算

    // 先立刻刷新一次，避免 00:00 停留太久（可选）
    renderTime(0);

    timerIntervalId = setInterval(() => {
        elapsedSeconds = Math.floor((Date.now() - startTimestampMs) / 1000);
        renderTime(elapsedSeconds);
    }, 250); // 用更小的间隔刷新，显示更“跟手”，但秒数仍按 floor 计算
}

function stopTimer() {
    if (timerIntervalId) {
        clearInterval(timerIntervalId);
        timerIntervalId = null;
    }
}

// --- 核心函数 ---

// 洗牌函数：把数组顺序打乱
function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
}

// 初始化游戏：生成卡片 HTML
function initGame() {
    // 计时器：归零并等待下一次“第一次翻牌”
    resetTimer();

    // 1. 重置所有变量 (moves, matchedPairs, cardsFlipped)
    moves = 0;
    matchedPairs = 0;
    cardsFlipped = [];

    // 2. 更新步数显示
    movesElement.innerText = moves;

    // 3. 清空 board.innerHTML
    board.innerHTML = '';

    // 4. 打乱数据
    shuffle(emojis);

    // 5. 生成卡片
    emojis.forEach(emoji => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.dataset.value = emoji;

        card.innerHTML = `
            <div class="card-face card-front">❓</div>
            <div class="card-face card-back">${emoji}</div>
        `;

        card.addEventListener('click', flipCard);
        board.appendChild(card);
    });
}

// 翻牌逻辑
function flipCard() {
    const selected = this;

    // 如果已经翻了两张，或者这张已经翻开了，就不能再点了
    if (cardsFlipped.length === 2 || selected.classList.contains('flipped')) {
        return;
    }

    // ✅ 本局第一次“有效翻牌”时启动计时器
    startTimerIfNeeded();

    // 1. 翻牌
    selected.classList.add('flipped');
    flipSound.play();

    // 2. 记录翻牌
    cardsFlipped.push(selected);

    // 3. 翻到两张就检查
    if (cardsFlipped.length === 2) {
        checkMatch();
        moves++;
        movesElement.innerText = moves;
    }
}

// 检查匹配
function checkMatch() {
    const card1 = cardsFlipped[0];
    const card2 = cardsFlipped[1];

    const value1 = card1.dataset.value;
    const value2 = card2.dataset.value;

    if (value1 === value2) {
        // 匹配成功
        successSound.play();

        card1.classList.add('matched');
        card2.classList.add('matched');

        cardsFlipped = [];
        matchedPairs = matchedPairs + 1;

        // ✅ 游戏结束：停止计时器
        if (matchedPairs === 8) {
            stopTimer();
            win(elapsedSeconds,moves);
            saveMoves(moves);
            saveTimer(elapsedSeconds);
            return;
        }
    } else {
        // 匹配失败，1秒后翻回去
        setTimeout(() => {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            cardsFlipped = [];
        }, 1000);
    }
}

//比较时间并存储
function saveMoves(moves){
    // 1. 从仓库里拿出以前的记录
    let best = localStorage.getItem('bestMoves'); // 拿出来的是字符串，比如 "12"
    
    // 2. 判断：如果没有记录(null)，或者 现在的步数 < 以前的记录
    if (!best || moves < parseInt(best)) {
        // 3. 存入新纪录
        localStorage.setItem('bestMoves', moves);
        // 4. 更新界面上的显示
        bestMovesElement.innerText = moves;
    }
}

//比较步数并存储
function saveTimer(elapsedSeconds){
    let best = localStorage.getItem('bestTimer');
    
    // 同样的逻辑：如果没有记录，或者现在的秒数更少
    if (!best || elapsedSeconds < parseInt(best)) {
        localStorage.setItem('bestTimer', elapsedSeconds);
        bestTimerElement.innerText = elapsedSeconds;
    }
}

//游戏胜利弹窗
function win(elapsedSeconds, moves) {
    const div = document.createElement('div');
    div.classList.add('win');
    div.innerHTML = `
        <p>🎉 恭喜！</p>
        <p>耗时: ${elapsedSeconds}秒</p>
        <p>步数: ${moves}步</p>
    `;
    document.body.appendChild(div);

    const btn = document.createElement('button');
    btn.innerText = '确认';
    btn.classList.add('win-btn');
    
    div.appendChild(btn); 
    
    btn.addEventListener('click', () => div.remove());
}

// 绑定重置按钮
restartBtn.addEventListener('click', initGame);

// 页面加载时初始化（不启动计时器，等待第一次翻牌）
initGame();
