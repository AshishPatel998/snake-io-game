// Game Variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const minimapCanvas = document.getElementById('minimapCanvas');
const minimapCtx = minimapCanvas.getContext('2d');
const scoreElement = document.getElementById('scoreValue');
const highScoreElement = document.getElementById('highScoreValue');
const startButton = document.getElementById('startButton');
const pauseButton = document.getElementById('pauseButton');
const skinSelect = document.getElementById('skinSelect');

// Game settings
const SNAKE_SIZE = 20;
const FOOD_SIZE = 20;
const INITIAL_SPEED = 150; // milliseconds between moves
let gameSpeed = INITIAL_SPEED;
let gameInterval;
let isPaused = false;
let isGameOver = true;

// Game state
let snake = [];
let direction = 'RIGHT';
let nextDirection = 'RIGHT';
let food = {};
let specialFood = {};
let hasSpecialFood = false;
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
highScoreElement.textContent = highScore;

// Snake skins
const skins = {
    neonGreen: '#39FF14',
    neonBlue: '#00FFFF',
    neonPink: '#FF00FF',
    rainbow: function(i) {
        const hue = (Date.now() / 20 + i * 30) % 360;
        return `hsl(${hue}, 100%, 50%)`;
    }
};

// Food colors
const foodColors = ['#FF0000', '#FFA500', '#FFFF00', '#00FF00', '#0000FF', '#800080'];

// Initialize the game
function initGame() {
    // Create initial snake
    snake = [
        {x: 10 * SNAKE_SIZE, y: 10 * SNAKE_SIZE},
        {x: 9 * SNAKE_SIZE, y: 10 * SNAKE_SIZE},
        {x: 8 * SNAKE_SIZE, y: 10 * SNAKE_SIZE}
    ];
    
    direction = 'RIGHT';
    nextDirection = 'RIGHT';
    score = 0;
    scoreElement.textContent = score;
    gameSpeed = INITIAL_SPEED;
    
    // Place initial food
    placeFood();
    
    // Clear any existing game loop
    if (gameInterval) {
        clearInterval(gameInterval);
    }
    
    // Start the game loop
    gameInterval = setInterval(gameLoop, gameSpeed);
    isGameOver = false;
    isPaused = false;
}

// Place food at random position
function placeFood() {
    const maxX = (canvas.width / SNAKE_SIZE) - 1;
    const maxY = (canvas.height / SNAKE_SIZE) - 1;
    
    let newFoodPosition;
    let isValidPosition = false;
    
    // Make sure food doesn't appear on snake
    while (!isValidPosition) {
        newFoodPosition = {
            x: Math.floor(Math.random() * maxX) * SNAKE_SIZE,
            y: Math.floor(Math.random() * maxY) * SNAKE_SIZE
        };
        
        isValidPosition = true;
        
        // Check if food position overlaps with snake
        for (let segment of snake) {
            if (segment.x === newFoodPosition.x && segment.y === newFoodPosition.y) {
                isValidPosition = false;
                break;
            }
        }
    }
    
    food = newFoodPosition;
    food.color = foodColors[Math.floor(Math.random() * foodColors.length)];
    
    // 10% chance to spawn special food
    if (Math.random() < 0.1 && !hasSpecialFood) {
        placeSpecialFood();
    }
}

// Place special food
function placeSpecialFood() {
    const maxX = (canvas.width / SNAKE_SIZE) - 1;
    const maxY = (canvas.height / SNAKE_SIZE) - 1;
    
    specialFood = {
        x: Math.floor(Math.random() * maxX) * SNAKE_SIZE,
        y: Math.floor(Math.random() * maxY) * SNAKE_SIZE,
        color: '#FFFFFF',
        glowColor: '#FFFFFF',
        points: 5
    };
    
    hasSpecialFood = true;
    
    // Special food disappears after 10 seconds
    setTimeout(() => {
        hasSpecialFood = false;
    }, 10000);
}

// Main game loop
function gameLoop() {
    if (isPaused || isGameOver) return;
    
    // Update direction
    direction = nextDirection;
    
    // Move snake
    moveSnake();
    
    // Check collisions
    if (checkCollision()) {
        gameOver();
        return;
    }
    
    // Check if snake eats food
    checkFood();
    
    // Draw everything
    draw();
    
    // Update minimap
    updateMinimap();
}

// Move the snake
function moveSnake() {
    const head = {...snake[0]};
    
    switch(direction) {
        case 'UP':
            head.y -= SNAKE_SIZE;
            break;
        case 'DOWN':
            head.y += SNAKE_SIZE;
            break;
        case 'LEFT':
            head.x -= SNAKE_SIZE;
            break;
        case 'RIGHT':
            head.x += SNAKE_SIZE;
            break;
    }
    
    // Add new head
    snake.unshift(head);
    
    // Remove tail unless food was eaten (handled in checkFood)
    if (!checkFood()) {
        snake.pop();
    }
}

// Check if snake collides with wall or itself
function checkCollision() {
    const head = snake[0];
    
    // Check wall collision
    if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height) {
        return true;
    }
    
    // Check self collision (start from index 1 as 0 is the head)
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            return true;
        }
    }
    
    return false;
}

// Check if snake eats food
function checkFood() {
    const head = snake[0];
    
    // Check regular food
    if (head.x === food.x && head.y === food.y) {
        score += 1;
        scoreElement.textContent = score;
        
        // Increase speed slightly
        if (gameSpeed > 50) {
            gameSpeed -= 2;
            clearInterval(gameInterval);
            gameInterval = setInterval(gameLoop, gameSpeed);
        }
        
        // Place new food
        placeFood();
        
        // Update high score if needed
        if (score > highScore) {
            highScore = score;
            highScoreElement.textContent = highScore;
            localStorage.setItem('snakeHighScore', highScore);
        }
        
        return true;
    }
    
    // Check special food
    if (hasSpecialFood && head.x === specialFood.x && head.y === specialFood.y) {
        score += specialFood.points;
        scoreElement.textContent = score;
        hasSpecialFood = false;
        
        // Update high score if needed
        if (score > highScore) {
            highScore = score;
            highScoreElement.textContent = highScore;
            localStorage.setItem('snakeHighScore', highScore);
        }
        
        return true;
    }
    
    return false;
}

// Draw everything
function draw() {
    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw snake
    for (let i = 0; i < snake.length; i++) {
        const segment = snake[i];
        
        // Get skin color
        let skinColor;
        if (skinSelect.value === 'rainbow') {
            skinColor = skins.rainbow(i);
        } else {
            skinColor = skins[skinSelect.value];
        }
        
        // Draw segment
        ctx.fillStyle = skinColor;
        ctx.fillRect(segment.x, segment.y, SNAKE_SIZE, SNAKE_SIZE);
        
        // Add glow effect to head
        if (i === 0) {
            ctx.shadowBlur = 20;
            ctx.shadowColor = skinColor;
            ctx.fillRect(segment.x, segment.y, SNAKE_SIZE, SNAKE_SIZE);
            ctx.shadowBlur = 0;
        }
    }
    
    // Draw food with glow effect
    ctx.shadowBlur = 15;
    ctx.shadowColor = food.color;
    ctx.fillStyle = food.color;
    ctx.beginPath();
    ctx.arc(food.x + FOOD_SIZE/2, food.y + FOOD_SIZE/2, FOOD_SIZE/2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Draw special food with pulsating effect if it exists
    if (hasSpecialFood) {
        const pulseSize = 5 * Math.sin(Date.now() / 200) + FOOD_SIZE;
        
        ctx.shadowBlur = 20;
        ctx.shadowColor = specialFood.glowColor;
        ctx.fillStyle = specialFood.color;
        ctx.beginPath();
        ctx.arc(specialFood.x + FOOD_SIZE/2, specialFood.y + FOOD_SIZE/2, pulseSize/2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

// Update minimap
function updateMinimap() {
    // Clear minimap
    minimapCtx.fillStyle = '#000000';
    minimapCtx.fillRect(0, 0, minimapCanvas.width, minimapCanvas.height);
    
    // Calculate scale factors
    const scaleX = minimapCanvas.width / canvas.width;
    const scaleY = minimapCanvas.height / canvas.height;
    
    // Draw snake on minimap
    minimapCtx.fillStyle = skins[skinSelect.value];
    for (let segment of snake) {
        minimapCtx.fillRect(
            segment.x * scaleX, 
            segment.y * scaleY, 
            SNAKE_SIZE * scaleX, 
            SNAKE_SIZE * scaleY
        );
    }
    
    // Draw food on minimap
    minimapCtx.fillStyle = food.color;
    minimapCtx.beginPath();
    minimapCtx.arc(
        food.x * scaleX + (FOOD_SIZE * scaleX) / 2, 
        food.y * scaleY + (FOOD_SIZE * scaleY) / 2, 
        (FOOD_SIZE * scaleX) / 2, 
        0, 
        Math.PI * 2
    );
    minimapCtx.fill();
    
    // Draw special food on minimap if it exists
    if (hasSpecialFood) {
        minimapCtx.fillStyle = specialFood.color;
        minimapCtx.beginPath();
        minimapCtx.arc(
            specialFood.x * scaleX + (FOOD_SIZE * scaleX) / 2, 
            specialFood.y * scaleY + (FOOD_SIZE * scaleY) / 2, 
            (FOOD_SIZE * scaleX) / 2, 
            0, 
            Math.PI * 2
        );
        minimapCtx.fill();
    }
}

// Game over function
function gameOver() {
    isGameOver = true;
    clearInterval(gameInterval);
    
    // Draw game over message
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = '48px Arial';
    ctx.fillStyle = '#FF0000';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 50);
    
    ctx.font = '24px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2);
    ctx.fillText('Press Start to play again', canvas.width / 2, canvas.height / 2 + 50);
}

// Toggle pause
function togglePause() {
    isPaused = !isPaused;
    pauseButton.textContent = isPaused ? 'Resume' : 'Pause';
    
    if (isPaused && !isGameOver) {
        // Draw "Paused" message
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.font = '48px Arial';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
    }
}

// Handle keyboard input
document.addEventListener('keydown', (e) => {
    if (isGameOver) return;
    
    switch(e.key) {
        case 'ArrowUp':
            if (direction !== 'DOWN') nextDirection = 'UP';
            break;
        case 'ArrowDown':
            if (direction !== 'UP') nextDirection = 'DOWN';
            break;
        case 'ArrowLeft':
            if (direction !== 'RIGHT') nextDirection = 'LEFT';
            break;
        case 'ArrowRight':
            if (direction !== 'LEFT') nextDirection = 'RIGHT';
            break;
        case ' ':  // Spacebar to pause/resume
            togglePause();
            break;
    }
});

// Button event listeners
startButton.addEventListener('click', initGame);
pauseButton.addEventListener('click', togglePause);

// Initial draw
draw();
updateMinimap();

// Display start screen
ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
ctx.fillRect(0, 0, canvas.width, canvas.height);

ctx.font = '48px Arial';
ctx.fillStyle = '#39FF14';
ctx.textAlign = 'center';
ctx.fillText('SNAKE.IO GAME', canvas.width / 2, canvas.height / 2 - 50);

ctx.font = '24px Arial';
ctx.fillStyle = '#FFFFFF';
ctx.fillText('Press Start to play', canvas.width / 2, canvas.height / 2 + 50);
