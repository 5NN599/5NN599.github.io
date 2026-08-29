const savedTheme = localStorage.getItem('minig-theme');
if (savedTheme && savedTheme !== 'white') {
    document.documentElement.setAttribute('data-theme', savedTheme);
}
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let bgmInterval = null, bgmStep = 0, bgmGain = null;

function startBGM() {
    if(bgmInterval) return;
    try {
        bgmGain = audioCtx.createGain();
        bgmGain.gain.setValueAtTime(0.012, audioCtx.currentTime);
        bgmGain.connect(audioCtx.destination);
    } catch(e){}
    bgmInterval = setInterval(() => {
        if(gameState !== 'play' || isOver) return;
        const shop = document.getElementById("shopModal");
        if(shop.style.display === "flex") return;
        try {
            const osc = audioCtx.createOscillator();
            osc.connect(bgmGain); osc.type = 'square';
            const notes =;
            const f = notes[bgmStep % notes.length];
            osc.frequency.setValueAtTime(f, audioCtx.currentTime);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.11);
            bgmStep++;
        } catch(e){}
    }, 140);
}
function playSound(type) {
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain); gain.connect(audioCtx.destination);
        const now = audioCtx.currentTime;
        if (type === 'laser') {
            osc.type = 'square'; osc.frequency.setValueAtTime(880, now);
            osc.frequency.exponentialRampToValueAtTime(220, now + 0.05);
            gain.gain.setValueAtTime(0.015, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.05);
            osc.start(now); osc.stop(now + 0.05);
        } else if (type === 'hit') {
            osc.type = 'triangle'; osc.frequency.setValueAtTime(180, now);
            gain.gain.setValueAtTime(0.06, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.05);
            osc.start(now); osc.stop(now + 0.05);
        } else if (type === 'explode') {
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(300, now);
            osc.frequency.linearRampToValueAtTime(40, now + 0.1);
            gain.gain.setValueAtTime(0.04, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.1);
            osc.start(now); osc.stop(now + 0.1);
        } else if (type === 'win') {
            osc.type = 'square'; osc.frequency.setValueAtTime(523, now);
            osc.frequency.setValueAtTime(659, now+0.06);
            osc.frequency.setValueAtTime(783, now+0.12);
            gain.gain.setValueAtTime(0.03, now);
            gain.gain.linearRampToValueAtTime(0, now+0.2);
            osc.start(now); osc.stop(now + 0.2);
        } else if (type === 'over') {
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, now);
            osc.frequency.linearRampToValueAtTime(20, now + 0.4);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.4);
            osc.start(now); osc.stop(now + 0.4);
        } else if (type === 'talk') {
            osc.type = 'sine'; osc.frequency.setValueAtTime(450, now);
            gain.gain.setValueAtTime(0.01, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.03);
            osc.start(now); osc.stop(now + 0.03);
        } else if (type === 'start') {
            osc.type = 'square'; osc.frequency.setValueAtTime(523, now);
            osc.frequency.setValueAtTime(783, now + 0.08);
            gain.gain.setValueAtTime(0.04, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.12);
            osc.start(now); osc.stop(now + 0.12);
        }
    } catch(e){}
}
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
let player = { x: 180, y: 380, w: 32, h: 32, speed: 6, hp: 10,
               maxHp: 10, invuln: 0, currentWeapon: '기본 레이저',
               dmg: 1, upgProbLv: 0, superTimer: 0 };
let bullets = [], enemyBullets = [], enemies = [];
let stars = [], items = [], explosions = [], buildings = [];
let score = 0, keys = {}, isOver = false, gameId = null;
let boss = null, bossSpawned = false, shopPoints = 0, bossLevel = 1;
let gameState = 'story'; let storyIndex = 0; let textProgress = 0;
let pendingWeapon = null, enemiesKilled = 0;
let upgCost = { dmg: 5, prob: 5, hp: 5 };
let upgLv = { dmg: 1, prob: 1, hp: 10 };
let transitionAlpha = 0, isTransitioning = false;
let moonMode = false, craterList = [];
const storyTexts = [
    "서기 2026년... 지구 방위대 최후의 함선 '미니지호'..",
    "상점에서 확률 연구 시 커먼 확률은 줄고 상위 무기가 뜬다!",
    "10레벨 보스를 격파하면 달 기지 작전 구역으로 진입한다.",
    "달에 배치된 격납고 건물을 부수고 초강력 [S] 캡슐을 얻어라!",
    "👉 [Space] 또는 화면을 터치해 전쟁을 시작하세요!"
];
document.addEventListener("keydown", e => {
    keys[e.key] = true;
    if(gameState==='story' && e.key===" ") {
        if(textProgress < storyTexts[storyIndex].length) {
            textProgress = storyTexts[storyIndex].length;
        } else {
            storyIndex++; textProgress = 0;
            if(storyIndex >= storyTexts.length) {
                gameState = 'play'; playSound('start'); startBGM();
            }
        }
    } else if(gameState==='play' && e.key===" " && !isOver) {
        const modalWp = document.getElementById("weaponModal");
        const modalSh = document.getElementById("shopModal");
        if(modalWp.style.display !== "flex" &&
           modalSh.style.display !== "flex") {
            fireWeapon();
        }
    }
});
document.addEventListener("keyup", e => keys[e.key] = false);

function openShop() {
    document.getElementById("shopModal").style.display = "flex";
    updateShopUI();
}
function closeShop() {
    document.getElementById("shopModal").style.display = "none";
    keys[" "] = false;
}
function updateShopUI() { 
    let lg = 2 + player.upgProbLv * 0.5;
    document.getElementById("shopPoints").innerText = 
        `보유 포인트: ${shopPoints} P`;
    document.getElementById("strLv").innerText = 
        `⚔️ 공격력 Lv.${upgLv.dmg}`;
    document.getElementById("probLv").innerText = 
        `🍀 확률업 Lv.${upgLv.prob} (${lg.toFixed(1)}%)`;
    document.getElementById("hpLv").innerText = 
        `🛡️ 최대실드 Lv.${upgLv.hp}`;
    document.getElementById("dmgCostBtn").innerText = 
        `${upgCost.dmg} P`;
    document.getElementById("probCostBtn").innerText = 
        `${upgCost.prob} P`;
    document.getElementById("hpCostBtn").innerText = 
        `${upgCost.hp} P`; 
}
function buyUpgrade(type) {
    if(shopPoints >= upgCost[type]) {
        shopPoints -= upgCost[type];
        if(type === 'dmg') { upgLv.dmg++; player.dmg += 0.5; }
        else if(type === 'prob') { upgLv.prob++; player.upgProbLv++; }
        else if(type === 'hp') { 
            upgLv.hp += 2; player.maxHp += 2; player.hp += 2; 
        }
        upgCost[type] = Math.floor(upgCost[type] * 1.6);
        updateShopUI(); updateBoard(); playSound('start');
    }
}
function getRandomWeapon() {
    let rnd = Math.random() * 100;
    let cProb = Math.max(10, 50 - player.upgProbLv * 5);
    let rProb = 35 + player.upgProbLv * 3;
    let eProb = 13 + player.upgProbLv * 1.5;
    if (rnd < cProb) {
        if (Math.random() < 0.5) {
            return { wp: '기본 레이저', grade: '🟢 [커먼]' };
        } else {
            return { wp: '🔱 3갈래 확산탄', grade: '🟢 [커먼]' };
        }
    } else if (rnd < cProb + rProb) {
        let r = Math.random();
        if (r < 0.33) return { wp: '🚀 범위 미사일', grade: '🔵 [레어]' };
        else if (r < 0.66) return { wp: '⚡ 관통 레이저', grade: '🔵 [레어]' };
        else return { wp: '💣 기뢰 설치', grade: '🔵 [레어]' };
    } else if (rnd < cProb + rProb + eProb) {
        if (Math.random() < 0.5) {
            return { wp: '🛡️ 유도 드론', grade: '🟣 [에픽]' };
        } else {
            return { wp: 'CNG 블랙홀', grade: '🟣 [에픽]' };
        }
    } else return { wp: '💥 핵융합 폭탄', grade: '🟡 [전설]' };
}
function fireWeapon() {
    if(player.currentWeapon === '기본 레이저') {
        bullets.push({ x: player.x + 14, y: player.y, w: 4, h: 10, speed: 9, type: 'normal' });
        playSound('laser');
    } else if(player.currentWeapon === '🚀 범위 미사일') {
        bullets.push({ x: player.x + 10, y: player.y, w: 12, h: 16, speed: 7, type: 'missile' });
        playSound('laser');
    } else if(player.currentWeapon === '💣 기뢰 설치') {
        bullets.push({ x: player.x + 14, y: player.y + player.h, w: 10, h: 10, speed: -1, type: 'mine' });
        playSound('hit');
    } else if(player.currentWeapon === '⚡ 관통 레이저') {
        bullets.push({ x: player.x + 13, y: player.y, w: 6, h: 25, speed: 12, type: 'piece' });
        playSound('laser');
    } else if(player.currentWeapon === '🔱 3갈래 확산탄') {
        bullets.push({ x: player.x + 14, y: player.y, w: 4, h: 8, speed: 8, dx: -2, type: 'normal' });
        bullets.push({ x: player.x + 14, y: player.y, w: 4, h: 10, speed: 9, dx: 0, type: 'normal' });
        bullets.push({ x: player.x + 14, y: player.y, w: 4, h: 8, speed: 8, dx: 2, type: 'normal' });
        playSound('laser');
    } else if(player.currentWeapon === '🛡️ 유도 드론') {
        bullets.push({ x: player.x - 8, y: player.y + 10, w: 6, h: 6, speed: 7, type: 'drone' });
        bullets.push({ x: player.x + player.w + 2, y: player.y + 10, w: 6, h: 6, speed: 7, type: 'drone' });
        playSound('laser');
    } else if(player.currentWeapon === 'CNG 블랙홀') {
        bullets.push({ x: player.x + 10, y: player.y, w: 12, h: 12, speed: 4, type: 'blackhole' });
        playSound('hit');
    } else if(player.currentWeapon === '💥 핵융합 폭탄') {
        explosions.push({ x: 200, y: 220, rad: 10, isNuke: true });
        playSound('explode'); player.currentWeapon = '기본 레이저';
    }
}
function askEquip(g, wp) {
    pendingWeapon = wp;
    document.getElementById("weaponDesc").innerText = `${g} ${wp}`;
    document.getElementById("weaponModal").style.display = "flex";
}
function equipWeapon(yes) {
    if(yes && pendingWeapon) { 
        player.currentWeapon = pendingWeapon; playSound('start'); 
    }
    document.getElementById("weaponModal").style.display = "none";
    pendingWeapon = null; keys[" "] = false; openShop();
}
function initStars() {
    for(let i=0; i<25; i++) {
        stars.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height,
                     size: 1+Math.random()*1.5, speed: 1+Math.random()*2 });
    }
    for(let j=0; j<6; j++) {
        craterList.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height,
                          r: 15+Math.random()*20 });
    }
}
function restart() {
    document.getElementById("overModal").style.display="none";
    document.getElementById("weaponModal").style.display="none";
    document.getElementById("shopModal").style.display="none";
    player.x = 180; player.y = 380; player.hp = 10; player.maxHp = 10;
    player.currentWeapon = '기본 레이저'; player.dmg = 1; player.upgProbLv = 0; player.superTimer = 0;
    upgCost={dmg:5,prob:5,hp:5}; upgLv={dmg:1,prob:1,hp:10};
    bullets = []; enemyBullets = []; enemies = []; items = []; explosions = []; buildings = [];
    boss = null; bossSpawned = false; score = 0; enemiesKilled = 0; bossLevel = 1; shopPoints = 0;
    isOver = false; gameState = 'story'; storyIndex = 0; textProgress = 0; moonMode = false;
    transitionAlpha = 0; isTransitioning = false; updateBoard(); loop();
}
function updateBoard() {
    const b = document.getElementById("board");
    let mHead = moonMode ? "🌕 달 표면 전술기지" : "🌌 은하계 대기실";
    if(gameState==='story') b.innerText = "🌌 우주 상황실";
    else if(bossSpawned && boss && boss.hp > 0) {
        b.innerText = `${mHead} | 👾 BOSS Lv.${bossLevel}: ${Math.ceil(boss.hp)} / ${bossLevel * 30}`;
    } else {
        b.innerText = `${mHead} | 🏆 점수: ${score} | 다음 습격 잡몹: ${Math.max(0, 15 - enemiesKilled)}마리`;
    }
}
let frameCount = 0;
function loop() {
    if(isOver) return; gameId = requestAnimationFrame(loop); ctx.clearRect(0,0,canvas.width,canvas.height);
    if(player.superTimer > 0) player.superTimer--; if(player.superTimer > 0) player.invuln = 2;
    if(moonMode) {
        ctx.fillStyle = "#2b2d31"; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle = "#1e1f22";
        craterList.forEach(c => {
            c.y += 0.8; if(c.y > canvas.height + 40) { c.y = -40; c.x = Math.random()*canvas.width; }
            ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI*2); ctx.fill(); ctx.closePath();
        });
    } else {
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        stars.forEach(s => {
            s.y += s.speed; if(s.y > canvas.height) { s.y = 0; s.x = Math.random()*canvas.width; }
            ctx.fillRect(s.x, s.y, s.size, s.size);
        });
    }
    if(gameState === 'story') {
        updateBoard(); ctx.fillStyle = "rgba(0, 0, 0, 0.7)"; ctx.fillRect(20, 240, 360, 180);
        ctx.strokeStyle = "#00ffcc"; ctx.lineWidth = 2; ctx.strokeRect(20, 240, 360, 180);
        ctx.fillStyle = "#fff"; ctx.font = "15px sans-serif"; ctx.textAlign = "left";
        let fText = storyTexts[storyIndex];
        if(frameCount % 3 === 0 && textProgress < fText.length) { textProgress++; playSound('talk'); }
        frameCount++; let lines = []; for (let i = 0; i < textProgress; i += 18) { lines.push(fText.slice(i, i + 18)); }
        lines.forEach((line, idx) => { ctx.fillText(line, 40, 280 + (idx * 26)); });
        ctx.save(); ctx.font = "60px sans-serif"; ctx.textAlign = "center"; ctx.fillText("🚀", 200, 140); ctx.restore(); return;
    }
    if(document.getElementById("weaponModal").style.display === "flex" ||
       document.getElementById("shopModal").style.display === "flex") { keys = {}; return; }
    if(isTransitioning) {
        transitionAlpha += 0.02; ctx.fillStyle = `rgba(0, 0, 0, ${transitionAlpha})`; ctx.fillRect(0,0,canvas.width,canvas.height);
        if(transitionAlpha >= 1) {
            isTransitioning = false; moonMode = true;
            buildings.push({ x: 40, y: -80, hp: 50, maxHp: 50 }, { x: 300, y: -120, hp: 50, maxHp: 50 });
            loop();
        } return;
    }
    if(moonMode && transitionAlpha > 0) {
        transitionAlpha -= 0.02; ctx.fillStyle = `rgba(0, 0, 0, ${transitionAlpha})`; ctx.fillRect(0,0,canvas.width,canvas.height);
    }
    if(player.invuln > 0) player.invuln--;
    if((keys["ArrowLeft"] || keys["a"]) && player.x > 0) player.x -= player.speed;
    if((keys["ArrowRight"] || keys["d"]) && player.x < canvas.width - player.w) player.x += player.speed;
    if((keys["ArrowUp"] || keys["w"]) && player.y > 0) player.y -= player.speed;
    if((keys["ArrowDown"] || keys["s"]) && player.y < canvas.height - player.h) player.y += player.speed;
    if(player.invuln == 0 || Math.floor(player.invuln/4) % 2 == 0) {
        ctx.save(); ctx.font = "32px sans-serif"; ctx.fillText(player.superTimer > 0 ? "🔥" : "🚀", player.x, player.y + 26); ctx.restore();
    }
    ctx.save(); ctx.fillStyle = "rgba(255, 255, 255, 0.15)"; ctx.fillRect(230, 8, 160, 28);
    ctx.strokeStyle = "#fcc419"; ctx.strokeRect(230, 8, 160, 28); ctx.fillStyle = "#fff";
    ctx.font = "11px sans-serif"; ctx.textAlign = "center"; ctx.fillText(`장비: ${player.currentWeapon}`, 310, 26); ctx.restore();
    for(let e=explosions.length-1; e>=0; e--) {
        explosions[e].rad += explosions[e].isNuke ? 16 : 4; ctx.save(); ctx.beginPath();
        ctx.arc(explosions[e].x, explosions[e].y, explosions[e].rad, 0, Math.PI*2);
        ctx.fillStyle = explosions[e].isNuke ? `rgba(255, 100, 0, ${1 - explosions[e].rad/400})` : `rgba(0, 255, 200, ${1 - explosions[e].rad/80})`;
        ctx.fill(); ctx.closePath(); ctx.restore();
        if(explosions[e].isNuke && explosions[e].rad >= 400) explosions.splice(e, 1);
        else if(!explosions[e].isNuke && explosions[e].rad >= 80) explosions.splice(e, 1);
    }
    for(let i=bullets.length-1; i>=0; i--) {
        bullets[i].y -= bullets[i].speed; if(bullets[i].dx) bullets[i].x += bullets[i].dx;
        ctx.save(); ctx.shadowBlur = 8; ctx.shadowColor = "#00ffcc";
        if(bullets[i].type === 'normal') { ctx.fillStyle = "#00ffcc"; ctx.fillRect(bullets[i].x, bullets[i].y, bullets[i].w, bullets[i].h); }
        else if(bullets[i].type === 'missile') { ctx.fillStyle = "#ff922b"; ctx.fillRect(bullets[i].x, bullets[i].y, bullets[i].w, bullets[i].h); ctx.font="11px sans-serif"; ctx.fillText("🚀", bullets[i].x-2, bullets[i].y+12); }
        else if(bullets[i].type === 'mine') { ctx.fillStyle = "#fcc419"; ctx.font="12px sans-serif"; ctx.fillText("💥", bullets[i].x-2, bullets[i].y); }
        else if(bullets[i].type === 'piece') { ctx.fillStyle = "#ff00ff"; ctx.fillRect(bullets[i].x, bullets[i].y, bullets[i].w, bullets[i].h); }
        else if(bullets[i].type === 'drone') {
            ctx.fillStyle = "#51cf66"; ctx.fillRect(bullets[i].x, bullets[i].y, bullets[i].w, bullets[i].h);
            if(enemies.length > 0 && enemies) { bullets[i].x += (enemies.x + 18 - bullets[i].x) * 0.12; bullets[i].y += (enemies.y + 16 - bullets[i].y) * 0.05; }
            else if(bossSpawned && boss && boss.hp > 0) { bullets[i].x += (boss.x + 32 - bullets[i].x) * 0.12; bullets[i].y += (boss.y + 22 - bullets[i].y) * 0.05; }
            else { bullets[i].y -= 4; }
        } else if(bullets[i].type === 'blackhole') {
            ctx.fillStyle = "#748ffc"; ctx.font="14px sans-serif"; ctx.fillText("🌀", bullets[i].x-2, bullets[i].y);
            enemies.forEach(en => { if(Math.abs(en.x - bullets[i].x) < 100) { en.x += (bullets[i].x - en.x) * 0.04; en.y += (bullets[i].y - en.y) * 0.02; } });
        }
        ctx.restore(); if(bullets[i].y < -30 || bullets[i].y > canvas.height + 30) { bullets.splice(i, 1); continue; }
    }
function restart() {
  document.getElementById(
    "overModal"
  ).style.display="none";
  document.getElementById(
    "weaponModal"
  ).style.display="none";
  document.getElementById(
    "shopModal"
  ).style.display="none";
  player.x = 180; player.y = 380;
  player.hp = 10; player.maxHp = 10;
  player.currentWeapon = '기본 레이저';
  player.dmg = 1; player.upgProbLv = 0;
  player.superTimer = 0;
  upgCost={dmg:5,prob:5,hp:5};
  upgLv={dmg:1,prob:1,hp:10};
  bullets = []; enemyBullets = [];
  enemies = []; items = [];
  explosions = []; buildings = [];
  boss = null; bossSpawned = false;
  score = 0; enemiesKilled = 0;
  bossLevel = 1; shopPoints = 0;
  isOver = false; gameState = 'story';
  storyIndex = 0; textProgress = 0;
  moonMode = false; transitionAlpha = 0;
  isTransitioning = false;
  updateBoard(); loop();
}
function updateBoard() {
  const b = document.getElementById(
    "board"
  );
  let mHead = moonMode ? 
    "🌕 달 표면 기지" : 
    "🌌 은하계 대기실";
  if(gameState==='story') {
    b.innerText = "🌌 우주 상황실";
  } else if(bossSpawned && 
            boss && boss.hp > 0) {
    b.innerText = 
      `${mHead} | 👾 BOSS Lv.${bossLevel}: ` +
      `${Math.ceil(boss.hp)} / ` +
      `${bossLevel * 30}`;
  } else {
    b.innerText = 
      `${mHead} | 🏆 점수: ${score} | ` +
      `잡몹: ${Math.max(0, 15 - enemiesKilled)}마리`;
  }
}
