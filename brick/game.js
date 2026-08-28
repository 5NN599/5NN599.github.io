const savedTheme = localStorage.getItem('minig-theme');
if (savedTheme && savedTheme !== 'white') document.documentElement.setAttribute('data-theme', savedTheme);

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(f, d, t='normal') {
    try {
        const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
        osc.connect(gain); gain.connect(audioCtx.destination);
        if(t === 'item') osc.type = 'triangle';
        if(t === 'fail') osc.type = 'sawtooth'; // 죽었을 때 거친 소리 연출
        osc.frequency.setValueAtTime(f, audioCtx.currentTime); gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        if(t === 'fail') {
            osc.frequency.linearRampToValueAtTime(50, audioCtx.currentTime + d);
            gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        }
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + d); osc.start(); osc.stop(audioCtx.currentTime + d);
    } catch(e){}
}

const canvas = document.getElementById("gameCanvas"); const ctx = canvas.getContext("2d");
let ballRadius = 8; let x, y, dx, dy;
let paddleHeight = 10; let defaultPaddleWidth = 75; let paddleWidth, paddleX;
let rightPressed = false; let leftPressed = false;
let brickRowCount = 4; let brickColumnCount = 6; let brickWidth = 65; let brickHeight = 20; let brickPadding = 10; let brickOffsetTop = 30; let brickOffsetLeft = 20;
let bricks = [], items = [], score = 0, lives = 3, isOver = false, gameId = null;
const colors = ["#ff6b6b", "#fcc419", "#51cf66", "#339af0"];

// 🚀 신규 상태 변수: 공이 발사되었는지 여부 (false면 대기 상태)
let isBallLaunched = false;

document.addEventListener("keydown", e => { 
    if(e.key === "Right" || e.key === "ArrowRight") rightPressed = true; 
    else if(e.key === "Left" || e.key === "ArrowLeft") leftPressed = true;
    // 🚀 위쪽 화살표(↑)를 누르면 대기 상태 해제하고 발사!
    else if((e.key === "Up" || e.key === "ArrowUp") && !isBallLaunched && !isOver) {
        isBallLaunched = true;
        dx = 3; dy = -3; // 발사 속도와 각도 지정
        playSound(587, 0.1); // 발사할 때 가벼운 띵 소리
    }
});
document.addEventListener("keyup", e => { if(e.key === "Right" || e.key === "ArrowRight") rightPressed = false; else if(e.key === "Left" || e.key === "ArrowLeft") leftPressed = false; });

function initGame() {
    paddleWidth = defaultPaddleWidth; paddleX = (canvas.width - paddleWidth) / 2;
    // 🚀 초기 위치는 패들 바로 위 한가운데로 세팅
    x = paddleX + paddleWidth / 2; y = canvas.height - paddleHeight - ballRadius; 
    dx = 0; dy = 0; isBallLaunched = false;
    items = []; score = 0; lives = 3; isOver = false; updateStatus();
    for(let c = 0; c < brickColumnCount; c++) {
        bricks[c] = [];
        for(let r = 0; r < brickRowCount; r++) {
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
                    dy = -dy; b.status = 0; score += 10; updateStatus(); playSound(440, 0.08);
                    if(b.item > 0) items.push({ x: b.x + brickWidth / 2, y: b.y + brickHeight, type: b.item });
                }
            }
        }
    }
    if(allCleared && !isOver) { isOver = true; cancelAnimationFrame(gameId); showEndModal("🎉 STAGE CLEAR!", "#4dadf7"); }
}

function draw() {
    if (isOver) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 1. 벽돌 그리기
    for(let c = 0; c < brickColumnCount; c++) {
        for(let r = 0; r < brickRowCount; r++) {
            if(bricks[c][r].status === 1) {
                let brickX = (c * (brickWidth + brickPadding)) + brickOffsetLeft;
                let brickY = (r * (brickHeight + brickPadding)) + brickOffsetTop;
                bricks[c][r].x = brickX; bricks[c][r].y = brickY;
                ctx.fillStyle = bricks[c][r].color; ctx.fillRect(brickX, brickY, brickWidth, brickHeight);
                if(bricks[c][r].item > 0) { ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.fillRect(brickX + brickWidth/2 - 3, brickY + brickHeight/2 - 3, 6, 6); }
            }
        }
    }
    
    // 🚀 2. 공 궤적 연산 (대기 상태일 때는 패들 중심을 따라다님)
    if (!isBallLaunched) {
        x = paddleX + paddleWidth / 2;
        y = canvas.height - paddleHeight - ballRadius;
    }
    ctx.beginPath(); ctx.arc(x, y, ballRadius, 0, Math.PI * 2); ctx.fillStyle = "#4dadf7"; ctx.fill(); ctx.closePath();
    
    // 3. 패들 그리기
    ctx.fillStyle = "#343a40"; ctx.fillRect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
    
    // 🚀 안내 텍스트 띄우기 (대기 상태일 때만)
    if (!isBallLaunched) {
        ctx.save(); ctx.fillStyle = "rgba(0, 0, 0, 0.4)"; ctx.font = "14px sans-serif"; ctx.textAlign = "center";
        ctx.fillText("위쪽 화살표(↑)를 누르면 공이 발사됩니다!", canvas.width / 2, canvas.height / 2 + 40); ctx.restore();
    }
    
    // 4. 아이템 처리
    for(let i = items.length - 1; i >= 0; i--) {
        items[i].y += 2; ctx.save(); ctx.textAlign = "center";
        if(items[i].type === 1) { ctx.font = "14px sans-serif"; ctx.fillText("❤️", items[i].x, items[i].y); }
        else if(items[i].type === 2) { ctx.font = "14px sans-serif"; ctx.fillText("↔️", items[i].x, items[i].y); }
        else if(items[i].type === 3) { ctx.font = "14px sans-serif"; ctx.fillText("⏳", items[i].x, items[i..y]); }
        ctx.restore();
        if(items[i].y >= canvas.height - paddleHeight && items[i].x >= paddleX && items[i].x <= paddleX + paddleWidth) {
            if(items[i].type === 1) { lives++; playSound(659, 0.15, 'item'); }
            else if(items[i].type === 2) { paddleWidth = 120; setTimeout(() => { paddleWidth = defaultPaddleWidth; }, 8000); playSound(587, 0.15, 'item'); }
            else if(items[i].type === 3) { dx *= 0.6; dy *= 0.6; setTimeout(() => { dx = dx > 0 ? 3 : -3; dy = dy > 0 ? 3 : -3; }, 6000); playSound(523, 0.15, 'item'); }
            items.splice(i, 1); updateStatus(); continue;
        }
        if(items[i].y > canvas.height) items.splice(i, 1);
    }
    
    collisionDetection();
    
    if (isBallLaunched) {
        if(x + dx > canvas.width - ballRadius || x + dx < ballRadius) { dx = -dx; playSound(350, 0.04); }
        if(y + dy < ballRadius) { dy = -dy; playSound(350, 0.04); }
        else if(y + dy > canvas.height - ballRadius) {
            if(x >= paddleX && x <= paddleX + paddleWidth) { 
                let hitPos = (x - paddleX) / (paddleWidth || 1); dx = 6 * (hitPos - 0.5); dy = -dy; playSound(520, 0.06); 
            } else {
                lives--; updateStatus();
                if(lives <= 0) { 
                    isOver = true; cancelAnimationFrame(gameId); playSound(180, 0.4, 'fail'); showEndModal("💥 GAME OVER", "#ff6b6b"); return; 
                } else {
                    // 🚀 목숨 잃었을 때 실감 나는 파괴 효과음 내고 대기 상태로 리셋
                    playSound(180, 0.3, 'fail');
                    isBallLaunched = false; dx = 0; dy = 0; paddleWidth = defaultPaddleWidth; paddleX = (canvas.width - paddleWidth) / 2;
                }
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
