const savedTheme = localStorage.getItem('minig-theme');
if (savedTheme && savedTheme !== 'white') document.documentElement.setAttribute('data-theme', savedTheme);
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
    try {
        const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain(); osc.connect(gain); gain.connect(audioCtx.destination); const now = audioCtx.currentTime;
        if (type === 'jump') { osc.type = 'triangle'; osc.frequency.setValueAtTime(200, now); osc.frequency.exponentialRampToValueAtTime(600, now + 0.1); gain.gain.setValueAtTime(0.06, now); gain.gain.linearRampToValueAtTime(0, now + 0.1); osc.start(now); osc.stop(now + 0.1); }
        else if (type === 'next') { osc.type = 'square'; osc.frequency.setValueAtTime(523, now); osc.frequency.setValueAtTime(659, now + 0.06); osc.frequency.setValueAtTime(783, now + 0.12); gain.gain.setValueAtTime(0.04, now); gain.gain.linearRampToValueAtTime(0, now + 0.2); osc.start(now); osc.stop(now + 0.2); }
        else if (type === 'fall') { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(250, now); osc.frequency.linearRampToValueAtTime(70, now + 0.2); gain.gain.setValueAtTime(0.08, now); gain.gain.linearRampToValueAtTime(0, now + 0.2); osc.start(now); osc.stop(now + 0.2); }
        else if (type === 'portal') { osc.type = 'sine'; osc.frequency.setValueAtTime(400, now); osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15); gain.gain.setValueAtTime(0.05, now); gain.gain.linearRampToValueAtTime(0, now + 0.15); osc.start(now); osc.stop(now + 0.15); }
    } catch(e){}
}
const canvas = document.getElementById("gameCanvas"); const ctx = canvas.getContext("2d");
let stage = 1; let keys = {};
let player = { x: 30, y: 250, w: 26, h: 26, vx: 0, vy: 0, grounded: false, speed: 4.5, jumpForce: -10.5, gravity: 0.5 };
let goal = { x: 540, y: 300, w: 32, h: 32 };
let platforms = [], spikes = [], portals = [];
document.addEventListener("keydown", e => keys[e.key] = true); document.addEventListener("keyup", e => keys[e.key] = false);
function makeMap() {
    document.getElementById("info").innerText = `STAGE: ${stage} / 50`;
    player.x = 25; player.y = 200; player.vx = 0; player.vy = 0; player.grounded = false;
    platforms = [{x:0,y:310,w:90,h:50}]; spikes = []; portals = [];
    let curX = 90; let curY = 310;
    while(curX < 480) {
        let jumpDist = 70 + Math.random() * 50 + Math.min(stage * 1.5, 40);
        let nextW = 50 + Math.random() * 40;
        let nextY = curY + (Math.random() * 80 - 40);
        if(nextY > 310) nextY = 310; if(nextY < 120) nextY = 120;
        platforms.push({x: curX + jumpDist, y: nextY, w: nextW, h: 200});
        if(stage > 5 && Math.random() < 0.35 && nextW > 60) {
            spikes.push({x: curX + jumpDist + 20, y: nextY - 20, w: 20, h: 20});
        }
        if(stage > 12 && Math.random() < 0.20 && portals.length === 0) {
            portals.push({x: curX + jumpDist + 5, y: nextY - 24, w: 24, h: 24, tx: curX + jumpDist + nextW + 80, ty: nextY - 60});
        }
        curX += jumpDist + nextW; curY = nextY;
    }
    platforms.push({x:520,y:280,w:80,h:100});
    goal.x = 545; goal.y = 248;
}
function update() {
    if(keys["ArrowLeft"] || keys["a"]) player.vx = -player.speed; else if(keys["ArrowRight"] || keys["d"]) player.vx = player.speed; else player.vx = 0;
    if((keys[" "] || keys["ArrowUp"] || keys["w"]) && player.grounded) { player.vy = player.jumpForce; player.grounded = false; playSound('jump'); }
    player.vy += player.gravity; player.x += player.vx; player.y += player.vy; player.grounded = false;
    if(player.y > canvas.height) { playSound('fall'); makeMap(); return; }
    platforms.forEach(p => {
        if(player.x < p.x+p.w && player.x+player.w > p.x && player.y < p.y+p.h && player.y+player.h > p.y) {
            if(player.vy > 0 && player.y + player.h - player.vy <= p.y + 5) { player.y = p.y - player.h; player.vy = 0; player.grounded = true; }
        }
    });
    spikes.forEach(s => {
        if(player.x < s.x+s.w-4 && player.x+player.w > s.x+4 && player.y < s.y+s.h && player.y+player.h > s.y) { playSound('fall'); makeMap(); }
    });
    portals.forEach(pt => {
        if(player.x < pt.x+pt.w && player.x+player.w > pt.x && player.y < pt.y+pt.h && player.y+player.h > pt.y) {
            playSound('portal'); player.x = pt.tx; player.y = pt.ty; player.vy = -3;
        }
    });
    if(player.x < goal.x+goal.w && player.x+player.w > goal.x && player.y < goal.y+goal.h && player.y+player.h > goal.y) {
        if(stage < 50) { stage++; playSound('next'); makeMap(); } else { document.getElementById("winModal").style.display = "flex"; }
    }
}
function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.font = "26px sans-serif";
    platforms.forEach(p => { for(let i=0; i<p.w; i+=24) { ctx.fillText("🧱", p.x + i, p.y + 22); } });
    spikes.forEach(s => ctx.fillText("⚠️", s.x, s.y + 22));
    portals.forEach(pt => ctx.fillText("🌀", pt.x, pt.y + 22));
    ctx.fillText("🎁", goal.x, goal.y + 28);
    ctx.fillText("🏃", player.x, player.y + 24);
}
function gameLoop() { update(); draw(); requestAnimationFrame(gameLoop); }
makeMap(); gameLoop();
