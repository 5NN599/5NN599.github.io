const savedTheme = localStorage.getItem('minig-theme');
if (savedTheme && savedTheme !== 'white') document.documentElement.setAttribute('data-theme', savedTheme);
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
    try {
        const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
        osc.connect(gain); gain.connect(audioCtx.destination); const now = audioCtx.currentTime;
        if (type === 'launch') {
            osc.type = 'square'; osc.frequency.setValueAtTime(400, now); osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);
            gain.gain.setValueAtTime(0.04, now); gain.gain.linearRampToValueAtTime(0, now + 0.08); osc.start(now); osc.stop(now + 0.08);
        } else if (type === 'hit_wall') {
            osc.type = 'triangle'; osc.frequency.setValueAtTime(300, now); gain.gain.setValueAtTime(0.06, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.04); osc.start(now); osc.stop(now + 0.04);
        } else if (type === 'hit_brick') {
            osc.type = 'square'; osc.frequency.setValueAtTime(800, now); osc.frequency.linearRampToValueAtTime(150, now + 0.06);
            gain.gain.setValueAtTime(0.05, now); gain.gain.linearRampToValueAtTime(0, now + 0.06); osc.start(now); osc.stop(now + 0.06);
        } else if (type === 'hit_paddle') {
            osc.type = 'triangle'; osc.frequency.setValueAtTime(250, now); osc.frequency.exponentialRampToValueAtTime(450, now + 0.06);
            gain.gain.setValueAtTime(0.08, now); gain.gain.linearRampToValueAtTime(0, now + 0.06); osc.start(now); osc.stop(now + 0.06);
        } else if (type === 'item') {
            osc.type = 'square'; osc.frequency.setValueAtTime(523.25, now); osc.frequency.setValueAtTime(659.25, now + 0.06); osc.frequency.setValueAtTime(783.99, now + 0.12);
            gain.gain.setValueAtTime(0.03, now); gain.gain.linearRampToValueAtTime(0, now + 0.2); osc.start(now); osc.stop(now + 0.2);
        } else if (type === 'fail') {
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(300, now); osc.frequency.linearRampToValueAtTime(80, now + 0.25);
            gain.gain.setValueAtTime(0.08, now); gain.gain.linearRampToValueAtTime(0, now + 0.25); osc.start(now); osc.stop(now + 0.25);
        } else if (type === 'gameover') {
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(120, now); osc.frequency.linearRampToValueAtTime(30, now + 0.6);
            gain.gain.setValueAtTime(0.15, now); gain.gain.linearRampToValueAtTime(0, now + 0.6); osc.start(now); osc.stop(now + 0.6);
        }
    } catch(e){}
}
const canvas = document.getElementById("gameCanvas"); const ctx = canvas.getContext("2d");
let ballRadius = 8; let x, y, dx, dy, paddleWidth, paddleX;
let paddleHeight = 10; let defaultPaddleWidth = 75; let rightPressed = false; let leftPressed = false;
let brickRowCount = 4; let brickColumnCount = 6; let brickWidth = 65; let brickHeight = 20; let brickPadding = 10; let brickOffsetTop = 30; let brickOffsetLeft = 20;
let bricks = [], items = [], score = 0, lives = 3, isOver = false, gameId = null, isBallLaunched = false;
const colors = ["#ff6b6b", "#fcc419", "#51cf66", "#339af0"];
document.addEventListener("keydown", e => { 
    if(e.key === "Right" || e.key === "ArrowRight") rightPressed = true; 
    else if(e.key === "Left" || e.key === "ArrowLeft") leftPressed = true;
    else if((e.key === "Up" || e.key === "ArrowUp") && !isBallLaunched && !isOver) { isBallLaunched = true; dx = 3; dy = -3; playSound('launch'); }
});
document.addEventListener("keyup", e => { if(e.key === "Right" || e.key === "ArrowRight") rightPressed = false; else if(e.key === "Left" || e.key === "ArrowLeft") leftPressed = false; });
function initGame() {
    paddleWidth = defaultPaddleWidth; paddleX = (canvas.width - paddleWidth) / 2;
    x = paddleX + paddleWidth / 2; y = canvas.height - paddleHeight - ballRadius; dx = 0; dy = 0; isBallLaunched = false; items = []; score = 0; lives = 3; isOver = false; updateStatus();
    for(let c = 0; c < brickColumnCount; c++) {
        bricks[c] = []; for(let r = 0; r < brickRowCount; r++) {
            let itemType = Math.random() < 0.25 ? Math.floor(Math.random() * 3) + 1 : 0;
            bricks[c][r] = { x: 0, y: 0, status: 1, item: itemType, color: colors[r % colors.length] };
        }
    }
}
function updateStatus() { document.getElementById("status-board").innerText = `❤️ 목숨: ${lives} | 🏆 점수: ${score}`; }
function collisionDetection() {
    let allCleared = true;
    for(let c = 0; c < brickColumnCount; c++) {
        for(let r = 0; r < brickRowCount; r++) {
            let b = bricks[c][r];
            if(b.status === 1) {
                allCleared = false;
                if(isBallLaunched && x > b.x && x < b.x + brickWidth && y > b.y && y < b.y + brickHeight) {
                    dy = -dy; b.status = 0; score += 10; updateStatus(); playSound('hit_brick');
                    if(b.item > 0) items.push({ x: b.x + brickWidth / 2, y: b.y + brickHeight, type: b.item });
                }
            }
        }
    }
    if(allCleared && !isOver) { isOver = true; cancelAnimationFrame(gameId); showEndModal("🎉 STAGE CLEAR!", "#4dadf7"); }
}
function draw() {
    if (isOver) return; ctx.clearRect(0, 0, canvas.width, canvas.height);
    for(let c = 0; c < brickColumnCount; c++) {
        for(let r = 0; r < brickRowCount; r++) {
            if(bricks[c][r].status === 1) {
                let brickX = (c * (brickWidth + brickPadding)) + brickOffsetLeft; let brickY = (r * (brickHeight + brickPadding)) + brickOffsetTop;
                bricks[c][r].x = brickX; bricks[c][r].y = brickY; ctx.fillStyle = bricks[c][r].color; ctx.fillRect(brickX, brickY, brickWidth, brickHeight);
                if(bricks[c][r].item > 0) { ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.fillRect(brickX + brickWidth/2 - 3, brickY + brickHeight/2 - 3, 6, 6); }
            }
        }
    }
    if (!isBallLaunched) { x = paddleX + paddleWidth / 2; y = canvas.height - paddleHeight - ballRadius; }
    ctx.beginPath(); ctx.arc(x, y, ballRadius, 0, Math.PI * 2); ctx.fillStyle = "#4dadf7"; ctx.fill(); ctx.closePath();
    ctx.fillStyle = "#343a40"; ctx.fillRect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
    if (!isBallLaunched) {
        ctx.save(); ctx.fillStyle = "rgba(0, 0, 0, 0.4)"; ctx.font = "14px sans-serif"; ctx.textAlign = "center";
        ctx.fillText("위쪽 화살표(↑)를 누르면 공이 발사됩니다!", canvas.width / 2, canvas.height / 2 + 40); ctx.restore();
    }
    for(let i = items.length - 1; i >= 0; i--) {
        items[i].y += 2; ctx.save(); ctx.textAlign = "center";
        if(items[i].type === 1) { ctx.font = "14px sans-serif"; ctx.fillText("❤️", items[i].x, items[i].y); }
        else if(items[i].type === 2) { ctx.font = "14px sans-serif"; ctx.fillText("↔️", items[i].x, items[i].y); }
        else if(items[i].type === 3) { ctx.font = "14px sans-serif"; ctx.fillText("⏳", items[i].x, items[i].y); }
        ctx.restore();
        if(items[i].y >= canvas.height - paddleHeight && items[i].x >= paddleX && items[i].x <= paddleX + paddleWidth) {
            if(items[i].type === 1) { lives++; } else if(items[i].type === 2) { paddleWidth = 120; setTimeout(() => { paddleWidth = defaultPaddleWidth; }, 8000); }
            else if(items[i].type === 3) { dx *= 0.6; dy *= 0.6; setTimeout(() => { dx = dx > 0 ? 3 : -3; dy = dy > 0 ? 3 : -3; }, 6000); }
            playSound('item'); items.splice(i, 1); updateStatus(); continue;
        }
        if(items[i].y > canvas.height) items.splice(i, 1);
    }
    collisionDetection();
    if (isBallLaunched) {
        if(x + dx > canvas.width - ballRadius || x + dx < ballRadius) { dx = -dx; playSound('hit_wall'); }
        if(y + dy < ballRadius) { dy = -dy; playSound('hit_wall'); }
        else if(y + dy > canvas.height - ballRadius) {
            if(x >= paddleX && x <= paddleX + paddleWidth) { 
                let hitPos = (x - paddleX) / (paddleWidth || 1); dx = 6 * (hitPos - 0.5); dy = -dy; playSound('hit_paddle');
            } else {
                lives--; updateStatus();
                if(lives <= 0) { isOver = true; cancelAnimationFrame(gameId); playSound('gameover'); showEndModal("💥 GAME OVER", "#ff6b6b"); return; }
                else { playSound('fail'); isBallLaunched = false; dx = 0; dy = 0; paddleWidth = defaultPaddleWidth; paddleX = (canvas.width - paddleWidth) / 2; }
            }
        }
    }
    if(rightPressed && paddleX < canvas.width - paddleWidth) paddleX += 6; else if(leftPressed && paddleX > 0) paddleX -= 6;
    if (isBallLaunched) { x += dx; y += dy; } gameId = requestAnimationFrame(draw);
}
function showEndModal(text, color) {
    const title = document.getElementById("modalTitle"); title.innerText = text; title.style.color = color;
    document.getElementById("finalScore").innerText = `최종 획득 점수: ${score}점`; document.getElementById("overModal").style.display = "flex";
}
function restart() { document.getElementById("overModal").style.display = "none"; initGame(); draw(); }
initGame(); draw();
