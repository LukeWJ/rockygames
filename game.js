// 游戏状态管理
class GameState {
    constructor() {
        this.currentScreen = 'setup';
        this.selectedItems = [];
        this.gameItems = [];
        this.circles = [];
        this.hitItems = [];
        this.score = 0;
        this.circleCount = 10;
        this.timeLeft = 60;
        this.gameTimer = null;
        this.isGameRunning = false;
        this.shotsFired = 0;
        this.currentAimAngle = 270; // 默认270度（朝上）
        this.enlargedItem = null;
        this.enlargeTimer = null;
        this.bombCount = 2; // 默认炸弹数量
    }

    reset() {
        this.gameItems = [];
        this.circles = [];
        this.hitItems = [];
        this.score = 0;
        this.circleCount = 10;
        this.timeLeft = 60;
        this.shotsFired = 0;
        this.isGameRunning = false;
        this.currentAimAngle = 270; // 重置为270度（朝上）
        this.enlargedItem = null;
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
        if (this.enlargeTimer) {
            clearTimeout(this.enlargeTimer);
            this.enlargeTimer = null;
        }
    }
}

// 游戏物品类
class GameItem {
    constructor(type, name, emoji, color = null, isBomb = false) {
        this.type = type;
        this.name = name;
        this.emoji = emoji;
        this.color = color;
        this.isBomb = isBomb;
        // 确保物品在发射台上方生成，保持一定高度
        this.x = Math.random() * (canvas.width - 60) + 30;
        this.y = Math.random() * (canvas.height / 2 - 60) + 30; // 只在上半部分生成
        this.vx = (Math.random() - 0.5) * 3;
        this.vy = (Math.random() - 0.5) * 3;
        this.size = 40;
        this.isHit = false;
        this.isEnlarged = false;
        this.enlargeScale = 1;
    }

    update() {
        if (this.isHit) return;
        
        this.x += this.vx;
        this.y += this.vy;

        // 边界反弹
        if (this.x <= this.size/2 || this.x >= canvas.width - this.size/2) {
            this.vx = -this.vx;
            this.x = Math.max(this.size/2, Math.min(canvas.width - this.size/2, this.x));
        }
        if (this.y <= this.size/2 || this.y >= canvas.height - this.size/2) {
            this.vy = -this.vy;
            this.y = Math.max(this.size/2, Math.min(canvas.height - this.size/2, this.y));
        }
    }

    draw(ctx) {
        if (this.isHit && !this.isEnlarged) return;
        
        ctx.save();
        
        // 如果是放大状态，应用缩放
        if (this.isEnlarged) {
            ctx.translate(this.x, this.y);
            ctx.scale(this.enlargeScale, this.enlargeScale);
            ctx.translate(-this.x, -this.y);
        }
        
        ctx.font = `${this.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // 添加阴影效果
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        // 炸弹特殊效果
        if (this.isBomb) {
            ctx.shadowColor = 'rgba(255, 0, 0, 0.8)';
            ctx.shadowBlur = 10;
            // 炸弹闪烁效果
            if (Math.floor(Date.now() / 200) % 2) {
                ctx.fillStyle = '#ff4757';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size/2 + 5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        if (this.type === 'cloud' && this.color) {
            // 绘制彩色云朵
            ctx.fillStyle = this.getCloudColor();
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size/2, 0, Math.PI * 2);
            ctx.fill();
            
            // 添加云朵纹理
            ctx.fillStyle = 'white';
            ctx.font = `${this.size * 0.6}px Arial`;
            ctx.fillText('☁️', this.x, this.y);
        } else {
            // 绘制emoji
            ctx.fillText(this.emoji, this.x, this.y);
        }
        
        ctx.restore();
    }

    getCloudColor() {
        const colors = {
            'red': '#ff6b6b',
            'green': '#51cf66',
            'blue': '#339af0',
            'purple': '#9775fa',
            'yellow': '#ffd43b',
            'orange': '#ff8c42'
        };
        return colors[this.color] || '#ffffff';
    }

    checkCollision(circle) {
        const dx = this.x - circle.x;
        const dy = this.y - circle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (this.size/2 + circle.size/2);
    }
}

// 圆圈类
class Circle {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.size = 15;
        this.speed = 8;
        this.angle = angle;
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        this.trail = [];
    }

    update() {
        // 添加轨迹点
        this.trail.push({x: this.x, y: this.y});
        if (this.trail.length > 10) {
            this.trail.shift();
        }
        
        this.x += this.vx;
        this.y += this.vy;
    }

    draw(ctx) {
        // 绘制轨迹
        ctx.save();
        for (let i = 0; i < this.trail.length; i++) {
            const alpha = i / this.trail.length * 0.5;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#ff6b6b';
            ctx.beginPath();
            ctx.arc(this.trail[i].x, this.trail[i].y, this.size * (i / this.trail.length), 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
        
        // 绘制圆圈
        ctx.save();
        ctx.fillStyle = '#ff4757';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // 添加发光效果
        ctx.shadowColor = '#ff4757';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    isOutOfBounds() {
        return this.x < -this.size || this.x > canvas.width + this.size ||
               this.y < -this.size || this.y > canvas.height + this.size;
    }
}

// 音效和语音管理
class AudioManager {
    constructor() {
        this.sounds = {
            shoot: this.createBeepSound(800, 0.1),
            hit: this.createBeepSound(1200, 0.2),
            gameOver: this.createBeepSound(400, 0.5)
        };
    }

    createBeepSound(frequency, duration) {
        return () => {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
        };
    }

    playSound(soundName) {
        if (this.sounds[soundName]) {
            this.sounds[soundName]();
        }
    }

    speakEnglish(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            utterance.rate = 0.8;
            utterance.pitch = 1.2;
            utterance.volume = 0.9;
            speechSynthesis.speak(utterance);
        }
    }
}

// 粒子效果类
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10;
        this.life = 1.0;
        this.decay = 0.02;
        this.color = color;
        this.size = Math.random() * 5 + 2;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.2; // 重力
        this.life -= this.decay;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    isDead() {
        return this.life <= 0;
    }
}

// 全局变量
let gameState = new GameState();
let audioManager = new AudioManager();
let canvas, ctx;
let particles = [];

// 物品数据
const itemData = {
    clouds: [
        { color: 'red', name: 'red cloud', emoji: '🔴' },
        { color: 'green', name: 'green cloud', emoji: '🟢' },
        { color: 'blue', name: 'blue cloud', emoji: '🔵' },
        { color: 'purple', name: 'purple cloud', emoji: '🟣' },
        { color: 'yellow', name: 'yellow cloud', emoji: '🟡' },
        { color: 'orange', name: 'orange cloud', emoji: '🟠' }
    ],
    zodiac: [
        { name: 'rat', emoji: '🐭' },
        { name: 'ox', emoji: '🐂' },
        { name: 'tiger', emoji: '🐅' },
        { name: 'rabbit', emoji: '🐰' },
        { name: 'dragon', emoji: '🐲' },
        { name: 'snake', emoji: '🐍' },
        { name: 'horse', emoji: '🐴' },
        { name: 'goat', emoji: '🐐' },
        { name: 'monkey', emoji: '🐵' },
        { name: 'rooster', emoji: '🐓' },
        { name: 'dog', emoji: '🐕' },
        { name: 'pig', emoji: '🐷' }
    ]
};

// 初始化游戏
function initGame() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    setupEventListeners();
    updateUI();
}

// 设置事件监听器
function setupEventListeners() {
    // 物品选择按钮
    document.querySelectorAll('.item-btn').forEach(btn => {
        btn.addEventListener('click', () => toggleItemSelection(btn));
    });

    // 炸弹数量控制按钮
    document.getElementById('decreaseBomb').addEventListener('click', () => {
        if (gameState.bombCount > 1) {
            gameState.bombCount--;
            document.getElementById('bombCount').textContent = gameState.bombCount;
        }
    });
    
    document.getElementById('increaseBomb').addEventListener('click', () => {
        if (gameState.bombCount < 10) {
            gameState.bombCount++;
            document.getElementById('bombCount').textContent = gameState.bombCount;
        }
    });

    // 开始游戏按钮
    document.getElementById('startGame').addEventListener('click', startGame);

    // 射击按钮
    document.getElementById('shootBtn').addEventListener('click', shoot);

    // 瞄准滑块
    const aimSlider = document.getElementById('aimSlider');
    aimSlider.addEventListener('input', (e) => {
        gameState.currentAimAngle = parseInt(e.target.value);
        document.getElementById('aimAngle').textContent = gameState.currentAimAngle + '°';
    });

    // 再玩一次按钮
    document.getElementById('playAgain').addEventListener('click', () => {
        gameState.reset();
        showScreen('setup');
        updateUI();
    });

    // 键盘控制
    document.addEventListener('keydown', (e) => {
        if (gameState.currentScreen === 'game') {
            if (e.code === 'Space') {
                e.preventDefault();
                shoot();
            } else if (e.code === 'ArrowLeft') {
                e.preventDefault();
                adjustAim(-5);
            } else if (e.code === 'ArrowRight') {
                e.preventDefault();
                adjustAim(5);
            }
        }
    });
}

// 切换物品选择
function toggleItemSelection(btn) {
    const type = btn.dataset.type;
    const name = btn.dataset.name;
    const color = btn.dataset.color;
    
    const itemKey = `${type}-${name}`;
    const existingIndex = gameState.selectedItems.findIndex(item => 
        `${item.type}-${item.name}` === itemKey
    );
    
    if (existingIndex >= 0) {
        // 取消选择
        gameState.selectedItems.splice(existingIndex, 1);
        btn.classList.remove('selected');
        // 恢复按钮原始大小
        btn.style.transform = 'scale(1)';
    } else {
        // 添加选择
        gameState.selectedItems.push({ type, name, color });
        btn.classList.add('selected');
        
        // 放大按钮并播放发音
        btn.style.transform = 'scale(1.2)';
        btn.style.transition = 'transform 0.3s ease';
        
        // 播放英语发音
        audioManager.speakEnglish(name);
        
        // 2秒后恢复原始大小
        setTimeout(() => {
            if (btn.classList.contains('selected')) {
                btn.style.transform = 'scale(1.1)';
            }
        }, 2000);
    }
    
    updateSelectedItemsDisplay();
}

// 更新已选择物品显示
function updateSelectedItemsDisplay() {
    const selectedList = document.getElementById('selectedList');
    selectedList.innerHTML = '';
    
    gameState.selectedItems.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'selected-item';
        
        let emoji = '';
        if (item.type === 'cloud') {
            const cloudData = itemData.clouds.find(c => c.color === item.color);
            emoji = cloudData ? cloudData.emoji : '☁️';
        } else {
            const zodiacData = itemData.zodiac.find(z => z.name === item.name);
            emoji = zodiacData ? zodiacData.emoji : '🐾';
        }
        
        itemDiv.innerHTML = `${emoji} ${item.name}`;
        selectedList.appendChild(itemDiv);
    });
}

// 开始游戏
function startGame() {
    if (gameState.selectedItems.length === 0) {
        alert('请至少选择一个目标物品！');
        return;
    }
    
    gameState.reset();
    gameState.currentScreen = 'game';
    gameState.isGameRunning = true;
    
    // 创建游戏物品
    createGameItems();
    
    // 开始游戏循环
    gameLoop();
    
    // 开始计时器
    startTimer();
    
    showScreen('game');
    updateUI();
}

// 创建游戏物品
function createGameItems() {
    gameState.gameItems = [];
    
    // 为每个选中的物品类型只创建一个实例
    gameState.selectedItems.forEach(selectedItem => {
        let emoji = '';
        if (selectedItem.type === 'cloud') {
            const cloudData = itemData.clouds.find(c => c.color === selectedItem.color);
            emoji = cloudData ? cloudData.emoji : '☁️';
        } else {
            const zodiacData = itemData.zodiac.find(z => z.name === selectedItem.name);
            emoji = zodiacData ? zodiacData.emoji : '🐾';
        }
        
        const item = new GameItem(
            selectedItem.type,
            selectedItem.name,
            emoji,
            selectedItem.color,
            false
        );
        gameState.gameItems.push(item);
    });
    
    // 添加炸弹道具（使用gameState.bombCount控制数量）
    for (let i = 0; i < gameState.bombCount; i++) {
        const bomb = new GameItem(
            'bomb',
            'bomb',
            '💣',
            null,
            true
        );
        gameState.gameItems.push(bomb);
    }
}

// 游戏主循环
function gameLoop() {
    if (!gameState.isGameRunning) return;
    
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制背景
    drawBackground();
    
    // 更新和绘制游戏物品
    gameState.gameItems.forEach(item => {
        item.update();
        item.draw(ctx);
    });
    
    // 绘制放大的物品（在最上层）
    if (gameState.enlargedItem && gameState.enlargedItem.isEnlarged) {
        gameState.enlargedItem.draw(ctx);
    }
    
    // 更新和绘制圆圈
    for (let i = gameState.circles.length - 1; i >= 0; i--) {
        const circle = gameState.circles[i];
        circle.update();
        circle.draw(ctx);
        
        // 检查碰撞
        checkCollisions(circle, i);
        
        // 移除超出边界的圆圈
        if (circle.isOutOfBounds()) {
            gameState.circles.splice(i, 1);
        }
    }
    
    // 更新和绘制粒子效果
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw(ctx);
        
        if (particles[i].isDead()) {
            particles.splice(i, 1);
        }
    }
    
    // 绘制瞄准线
    drawAimLine();
    
    requestAnimationFrame(gameLoop);
}

// 绘制背景
function drawBackground() {
    // 创建渐变背景
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87ceeb');
    gradient.addColorStop(0.3, '#98d8e8');
    gradient.addColorStop(0.6, '#90ee90');
    gradient.addColorStop(1, '#228b22');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 添加云朵装饰
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = '30px Arial';
    for (let i = 0; i < 5; i++) {
        const x = (i * 150) + 50;
        const y = 50 + Math.sin(Date.now() * 0.001 + i) * 10;
        ctx.fillText('☁️', x, y);
    }
}

// 绘制瞄准线
function drawAimLine() {
    const angle = gameState.currentAimAngle * Math.PI / 180;
    const startX = canvas.width / 2;
    const startY = canvas.height - 30;
    const endX = startX + Math.cos(angle) * 100;
    const endY = startY + Math.sin(angle) * 100;
    
    ctx.save();
    
    // 绘制发射器底座
    ctx.fillStyle = '#2f3542';
    ctx.beginPath();
    ctx.arc(startX, startY, 25, 0, Math.PI * 2);
    ctx.fill();
    
    // 绘制360度刻度
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    for (let i = 0; i < 360; i += 30) {
        const tickAngle = i * Math.PI / 180;
        const tickStartX = startX + Math.cos(tickAngle) * 20;
        const tickStartY = startY + Math.sin(tickAngle) * 20;
        const tickEndX = startX + Math.cos(tickAngle) * 30;
        const tickEndY = startY + Math.sin(tickAngle) * 30;
        
        ctx.beginPath();
        ctx.moveTo(tickStartX, tickStartY);
        ctx.lineTo(tickEndX, tickEndY);
        ctx.stroke();
        
        // 绘制度数标签
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const labelX = startX + Math.cos(tickAngle) * 35;
        const labelY = startY + Math.sin(tickAngle) * 35;
        ctx.fillText(i + '°', labelX, labelY);
    }
    
    // 绘制瞄准线
    ctx.strokeStyle = '#ff4757';
    ctx.lineWidth = 4;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    
    // 绘制箭头
    const arrowSize = 15;
    const arrowAngle1 = angle + Math.PI * 0.8;
    const arrowAngle2 = angle - Math.PI * 0.8;
    
    ctx.fillStyle = '#ff4757';
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(endX + Math.cos(arrowAngle1) * arrowSize, endY + Math.sin(arrowAngle1) * arrowSize);
    ctx.lineTo(endX + Math.cos(arrowAngle2) * arrowSize, endY + Math.sin(arrowAngle2) * arrowSize);
    ctx.closePath();
    ctx.fill();
    
    // 显示当前角度（在发射器中心）
    ctx.fillStyle = '#ffff00';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(gameState.currentAimAngle + '°', startX, startY);
    
    ctx.restore();
}

// 调整瞄准角度
function adjustAim(delta) {
    // 支持360度范围，循环处理
    gameState.currentAimAngle += delta;
    if (gameState.currentAimAngle >= 360) {
        gameState.currentAimAngle -= 360;
    } else if (gameState.currentAimAngle < 0) {
        gameState.currentAimAngle += 360;
    }
    document.getElementById('aimSlider').value = gameState.currentAimAngle;
    document.getElementById('aimAngle').textContent = gameState.currentAimAngle + '°';
}

// 射击
function shoot() {
    if (!gameState.isGameRunning || gameState.circleCount <= 0) return;
    
    const angle = gameState.currentAimAngle * Math.PI / 180;
    const startX = canvas.width / 2;
    const startY = canvas.height - 30;
    
    const circle = new Circle(startX, startY, angle);
    gameState.circles.push(circle);
    
    gameState.circleCount--;
    gameState.shotsFired++;
    
    audioManager.playSound('shoot');
    updateUI();
    
    // 检查游戏结束条件
    if (gameState.circleCount <= 0) {
        setTimeout(() => {
            if (gameState.circles.length === 0) {
                endGame();
            }
        }, 3000);
    }
}

// 检查碰撞
function checkCollisions(circle, circleIndex) {
    for (let i = 0; i < gameState.gameItems.length; i++) {
        const item = gameState.gameItems[i];
        if (!item.isHit && item.checkCollision(circle)) {
            // 命中！
            item.isHit = true;
            gameState.circles.splice(circleIndex, 1);
            
            if (item.isBomb) {
                // 命中炸弹，分数清零
                gameState.score = 0;
                gameState.hitItems = [];
                
                // 播放爆炸音效
                audioManager.playSound('gameOver');
                audioManager.speakEnglish('bomb');
                
                // 创建爆炸粒子效果
                createBombParticles(item.x, item.y);
                
                // 更新UI
                updateHitItemsDisplay();
                updateUI();
            } else {
                // 命中普通物品
                gameState.hitItems.push(item);
                gameState.score += 10;
                
                // 播放音效和语音
                audioManager.playSound('hit');
                audioManager.speakEnglish(item.name);
                
                // 放大展示物品
                enlargeItem(item);
                
                // 创建粒子效果
                createHitParticles(item.x, item.y);
                
                // 更新UI
                updateHitItemsDisplay();
                updateUI();
            }
            
            break;
        }
    }
}

// 放大展示物品
function enlargeItem(item) {
    // 清除之前的放大物品
    if (gameState.enlargedItem) {
        gameState.enlargedItem.isEnlarged = false;
        gameState.enlargedItem.enlargeScale = 1;
    }
    
    // 设置新的放大物品
    gameState.enlargedItem = item;
    item.isEnlarged = true;
    item.enlargeScale = 2;
    
    // 清除之前的计时器
    if (gameState.enlargeTimer) {
        clearTimeout(gameState.enlargeTimer);
    }
    
    // 2秒后恢复正常大小
    gameState.enlargeTimer = setTimeout(() => {
        if (gameState.enlargedItem) {
            gameState.enlargedItem.isEnlarged = false;
            gameState.enlargedItem.enlargeScale = 1;
            gameState.enlargedItem = null;
        }
    }, 2000);
}

// 创建命中粒子效果
function createHitParticles(x, y) {
    const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff'];
    
    for (let i = 0; i < 15; i++) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        particles.push(new Particle(x, y, color));
    }
}

// 创建炸弹爆炸粒子效果
function createBombParticles(x, y) {
    const colors = ['#ff4757', '#ff6348', '#ff7675', '#fd79a8', '#fdcb6e'];
    
    for (let i = 0; i < 30; i++) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        const particle = new Particle(x, y, color);
        particle.vx *= 2; // 爆炸粒子速度更快
        particle.vy *= 2;
        particle.size *= 1.5; // 爆炸粒子更大
        particles.push(particle);
    }
}

// 开始计时器
function startTimer() {
    gameState.gameTimer = setInterval(() => {
        gameState.timeLeft--;
        updateUI();
        
        if (gameState.timeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

// 结束游戏
function endGame() {
    gameState.isGameRunning = false;
    if (gameState.gameTimer) {
        clearInterval(gameState.gameTimer);
        gameState.gameTimer = null;
    }
    
    audioManager.playSound('gameOver');
    
    // 计算统计数据
    const accuracy = gameState.shotsFired > 0 ? 
        Math.round((gameState.hitItems.length / gameState.shotsFired) * 100) : 0;
    
    // 更新结束界面
    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('finalHits').textContent = gameState.hitItems.length;
    document.getElementById('accuracy').textContent = accuracy + '%';
    
    // 显示成就
    showAchievements(accuracy);
    
    gameState.currentScreen = 'end';
    showScreen('end');
}

// 显示成就
function showAchievements(accuracy) {
    const achievementList = document.getElementById('achievementList');
    achievementList.innerHTML = '';
    
    const achievements = [];
    
    if (gameState.score >= 100) achievements.push('🏆 得分达人');
    if (gameState.hitItems.length >= 10) achievements.push('🎯 神射手');
    if (accuracy >= 80) achievements.push('🎪 精准大师');
    if (gameState.hitItems.length >= 5) achievements.push('🌟 小能手');
    
    if (achievements.length === 0) {
        achievements.push('🎮 勇敢尝试者');
    }
    
    achievements.forEach(achievement => {
        const achievementDiv = document.createElement('div');
        achievementDiv.className = 'achievement';
        achievementDiv.textContent = achievement;
        achievementList.appendChild(achievementDiv);
    });
}

// 更新命中物品显示
function updateHitItemsDisplay() {
    const hitList = document.getElementById('hitList');
    hitList.innerHTML = '';
    
    gameState.hitItems.forEach(item => {
        if (!item.isBomb) { // 只显示非炸弹物品
            const hitDiv = document.createElement('div');
            hitDiv.className = 'hit-item';
            hitDiv.innerHTML = `${item.emoji} ${item.name}`;
            hitList.appendChild(hitDiv);
        }
    });
}

// 更新UI
function updateUI() {
    document.getElementById('circleCount').textContent = gameState.circleCount;
    document.getElementById('timeLeft').textContent = gameState.timeLeft;
    document.getElementById('score').textContent = gameState.score;
    
    // 更新瞄准角度显示
    document.getElementById('aimSlider').value = gameState.currentAimAngle;
    document.getElementById('aimAngle').textContent = gameState.currentAimAngle + '°';
    
    // 更新射击按钮状态
    const shootBtn = document.getElementById('shootBtn');
    if (gameState.circleCount <= 0 || !gameState.isGameRunning) {
        shootBtn.disabled = true;
    } else {
        shootBtn.disabled = false;
    }
}

// 显示指定界面
function showScreen(screenName) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
    });
    
    document.getElementById(screenName + 'Screen').classList.remove('hidden');
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initGame);