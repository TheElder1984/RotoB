// Game Configuration
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Cookie helper functions
function getCookieValue(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';')[0];
    return null;
}

function getHighScoreFromCookie() {
    const highScore = getCookieValue('rotoBHighScore');
    return highScore !== null ? parseInt(highScore) : 0;
}
const SIZE = 20;
const MAZE_SIZE = 15;
const COLS = 4 + (MAZE_SIZE - 2) * 2 + 1;
const ROWS = 2 + (MAZE_SIZE - 2) * 2 + 1;

canvas.width = COLS * SIZE;
canvas.height = ROWS * SIZE;

let robot = {
    x: 1,
    y: 1,
    emoji: '🤖'
};

let coins = [];
let walls = [];

// Scientists (like Pac-Man ghosts)
let scientists = [];
const MAX_SCIENTISTS = 4;
const SCIENTIST_EMOJI = '👨‍🔬';

// Track robot moves for scientist movement
let robotMoveCount = 0;
const SCIENTIST_MOVE_RATIO = 2; // Scientist moves every N robot moves

// Generate maze using randomized obstacle placement
function generateMaze() {
    // Initialize all cells as open passages (0)
    walls = [];
    for (let y = 0; y < ROWS; y++) {
        let row = [];
        for (let x = 0; x < COLS; x++) {
            row.push(0);
        }
        walls.push(row);
    }

    // Randomly place walls with lower density for more open maze
    const wallDensity = 0.25; // 25% of cells become walls

    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            // Keep border around the maze open
            if (x <= 1 || x >= COLS - 2 || y <= 1 || y >= ROWS - 2) {
                walls[y][x] = 0;
            }
            // Randomly decide if this cell should be a wall
            else if (Math.random() < wallDensity) {
                walls[y][x] = 1;
            }
        }
    }

    // Ensure start position is always open
    walls[1][1] = 0;

    // Clean up disconnected areas near start (flood fill from start)
    findReachableArea();

    // Spawn scientists at random locations
    spawnScientists();
}

// Spawn scientists at random positions
function spawnScientists() {
    scientists = [];

    // Find all reachable open cells
    const reachable = findReachableArea();
    const reachableArray = Array.from(reachable).map(s => {
        const [x, y] = s.split(',').map(Number);
        return { x, y };
    });

    // Filter out positions too close to start (at least 3 cells away)
    const qualifiedPositions = reachableArray.filter(pos => {
        const dist = Math.sqrt(
            Math.pow(pos.x - 1, 2) +
            Math.pow(pos.y - 1, 2)
        );
        return dist >= 3;
    });

    // Shuffle qualified positions
    qualifiedPositions.sort(() => Math.random() - 0.5);

    // Spawn scientists at qualified positions
    for (let i = 0; i < MAX_SCIENTISTS && i < qualifiedPositions.length; i++) {
        scientists.push({
            x: qualifiedPositions[i].x,
            y: qualifiedPositions[i].y,
            speed: 0.5 // Move slower than robot
        });
    }
}

function findReachableArea() {
    const reachable = new Set();
    const queue = [{ x: 1, y: 1 }];
    reachable.add(`${1},${1}`);
    let head = 0;

    while (head < queue.length) {
        const current = queue[head++];
        
        const neighbors = [
            { x: current.x, y: current.y - 2 },
            { x: current.x - 2, y: current.y },
            { x: current.x, y: current.y + 2 },
            { x: current.x + 2, y: current.y }
        ];

        for (const neighbor of neighbors) {
            const key = `${neighbor.x},${neighbor.y}`;
            if (neighbor.x > 0 && neighbor.y > 0 &&
                neighbor.x < COLS - 1 && neighbor.y < ROWS - 1 &&
                walls[neighbor.y][neighbor.x] === 0 &&
                !reachable.has(key)) {
                reachable.add(key);
                queue.push(neighbor);
            }
        }
    }

    return reachable;
}

// Place coins to make them collectible
function placeCoins() {
    coins = [];

    // Count reachable cells
    const reachable = findReachableArea();
    const totalReachable = reachable.size;

    // Place fewer coins to make maze less dense
    const numCoins = Math.floor(totalReachable * 0.35);

    let reachableArray = Array.from(reachable).map(s => {
        const [x, y] = s.split(',').map(Number);
        return { x, y };
    });

    // Shuffle and select coins
    reachableArray.sort(() => Math.random() - 0.5);
    for (let i = 0; i < numCoins; i++) {
        coins.push({
            x: reachableArray[i].x,
            y: reachableArray[i].y
        });
    }
}

function drawRobot() {
    ctx.font = `${SIZE - 4}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const centerX = robot.x * SIZE + SIZE / 2;
    const centerY = robot.y * SIZE + SIZE / 2;

    ctx.fillText(robot.emoji, centerX, centerY + 3);
}

function drawCoins() {
    for (const coin of coins) {
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const centerX = coin.x * SIZE + SIZE / 2;
        const centerY = coin.y * SIZE + SIZE / 2 + 2;

        ctx.fillText('🟡', centerX, centerY);
    }
}

// Draw scientists (ghosts)
function drawScientists() {
    for (const scientist of scientists) {
        const centerX = scientist.x * SIZE + SIZE / 2;
        const centerY = scientist.y * SIZE + SIZE / 2 + 3;

        ctx.fillText(SCIENTIST_EMOJI, centerX, centerY);
    }
}

function drawWalls() {
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (walls[y][x] === 1) {
                const padding = 2;
                ctx.fillStyle = '#2a2a4e';
                ctx.fillRect(
                    x * SIZE + padding,
                    y * SIZE + padding,
                    SIZE - padding * 2,
                    SIZE - padding * 2
                );
                
                // Add inner detail
                ctx.fillStyle = '#3a3a6e';
                ctx.fillRect(
                    x * SIZE + padding + 2,
                    y * SIZE + padding + 2,
                    SIZE - padding * 4,
                    SIZE - padding * 4
                );
            }
        }
    }
}

function drawBackground() {
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Show game over popup
function showGameOverPopup() {
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    overlay.innerHTML = `
        <div class="popup popup-danger">
            <div class="popup-content">
                <div class="popup-icon">⚠️ CAUGHT BY A SCIENTIST!</div>
                <div class="popup-message">Game Over!</div>
                <button class="popup-button" onclick="this.closest('.popup-overlay').remove(); initGame()">Play Again</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
}

// Show win popup
function showWinPopup() {
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    overlay.innerHTML = `
        <div class="popup popup-success">
            <div class="popup-content">
                <div class="popup-icon">🎉 Congratulations!</div>
                <div class="popup-message">You found all coins!</div>
                <button class="popup-button" onclick="this.closest('.popup-overlay').remove(); initGame()">Play Again</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
}

// Move scientists toward the robot
function moveScientists() {
    // Increment robot move counter
    robotMoveCount++;

    // Scientist moves every SCIENTIST_MOVE_RATIO robot moves
    if (robotMoveCount % SCIENTIST_MOVE_RATIO === 0) {
        robotMoveCount = 0;

        for (const scientist of scientists) {
            // Calculate direction to robot
            const dx = robot.x - scientist.x;
            const dy = robot.y - scientist.y;

            // Only move if robot is not at same position
            if (dx !== 0 || dy !== 0) {
                // Use simple greedy movement - try to reduce distance
                const directions = [
                    { dx: 0, dy: -1 },
                    { dx: 0, dy: 1 },
                    { dx: -1, dy: 0 },
                    { dx: 1, dy: 0 }
                ];

                // Sort by how much they reduce distance to robot
                directions.sort((a, b) => {
                    const distA = Math.hypot((scientist.x + a.dx) - robot.x, (scientist.y + a.dy) - robot.y);
                    const distB = Math.hypot((scientist.x + b.dx) - robot.x, (scientist.y + b.dy) - robot.y);
                    return distA - distB;
                });

                for (const dir of directions) {
                    const nx = scientist.x + dir.dx;
                    const ny = scientist.y + dir.dy;

                    // Check if path is clear (not a wall and within bounds)
                    // Also check if no other scientist is already there
                    if (
                        nx > 0 && nx < COLS - 1 &&
                        ny > 0 && ny < ROWS - 1 &&
                        walls[ny][nx] === 0 &&
                        !scientists.some(s => s.x === nx && s.y === ny)
                    ) {
                        scientist.x = nx;
                        scientist.y = ny;
                        break;
                    }
                }
            }
        }
    }
}

function drawPassage() {
    ctx.fillStyle = '#1a1a3e';
}

function collectCoin(coin) {
    const coinIndex = coins.findIndex(c => c.x === coin.x && c.y === coin.y);
    if (coinIndex !== -1) {
        coins.splice(coinIndex, 1);
        return true;
    }
    return false;
}

function moveRobot(dx, dy) {
    const newX = robot.x + dx;
    const newY = robot.y + dy;

    // Check bounds
    if (newX < 0 || newX >= COLS - 1 || newY < 0 || newY >= ROWS - 1) {
        return;
    }

    // Check walls
    if (walls[newY][newX] === 1) {
        return;
    }

    robot.x = newX;
    robot.y = newY;

    // Collect coin
    const coinCollected = collectCoin(robot);
    if (coinCollected) {
        document.getElementById('score').textContent =
            parseInt(document.getElementById('score').textContent) + 10;
        updateHighScore();
    }

    // Check for scientist collision (game over)
    for (const scientist of scientists) {
        if (robot.x === scientist.x && robot.y === scientist.y) {
            showGameOverPopup();
            return;
        }
    }

// Check win condition
    if (coins.length === 0) {
        showWinPopup();
        return;
    }

    // Redraw the game to show robot at new position
    draw();
}

function updateHighScore() {
    const currentScore = parseInt(document.getElementById('score').textContent);

    // Save to cookie (expires in 30 days)
    const cookieName = 'rotoBHighScore';
    const cookieValue = currentScore.toString();
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${cookieName}=${cookieValue};expires=${expires};path=/;SameSite=Lax`;

    // Update display
    document.getElementById('highScore').textContent = currentScore;
}

function draw() {
    drawBackground();
    drawWalls();
    drawCoins();
    drawScientists();
    drawRobot();

    // Move scientists each frame
    moveScientists();
}

function initGame() {
    generateMaze();
    placeCoins();
    robot = { x: 1, y: 1, emoji: '🤖' };
    document.getElementById('score').textContent = '0';
    robotMoveCount = 0;

    // Load high score from cookie
    const highScore = getHighScoreFromCookie();
    document.getElementById('highScore').textContent = highScore;
    draw();
}

document.addEventListener('keydown', (e) => {
    switch(e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            moveRobot(0, -1);
            e.preventDefault();
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            moveRobot(0, 1);
            e.preventDefault();
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            moveRobot(-1, 0);
            e.preventDefault();
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            moveRobot(1, 0);
            e.preventDefault();
            break;
    }
});

document.getElementById('restartBtn').addEventListener('click', () => {
    initGame();
});

// Initialize on load
initGame();
