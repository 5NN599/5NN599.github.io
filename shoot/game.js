const canvas = document.getElementById("gameCanvas"); const ctx = canvas.getContext("2d");
let player = { x: 180, y: 380, w: 32, h: 32, speed: 6, hp: 10, maxHp: 10, invuln: 0, currentWeapon: '기본 레이저', dmg: 1, upgProbLv: 0, superTimer: 0 };
let bullets = [], enemyBullets = [], enemies = [], stars = [], items = [], explosions = [], buildings = [];
let score = 0, keys = {}, isOver = false, gameId = null, boss = null, bossSpawned = false, shopPoints = 0, bossLevel = 1;
let gameState = 'story'; let storyIndex = 0; let textProgress = 0, pendingWeapon = null, enemiesKilled = 0;
let upgCost = { dmg: 5, prob: 5, hp: 5 }, upgLv = { dmg: 1, prob: 1, hp: 10 };
let transitionAlpha = 0, isTransitioning = false, moonMode = false, craterList = [];
const storyTexts = [ "서기 2026년... 지구 방위대 최후의 함선 '미니지호'..", "상점에서 확률 연구 시 커먼 확률은 줄어들고 레어/에픽/전설 확률이 일제히 상승한다!", "10레벨 보스를 격파하면 아군 함선은 달 기지 작전 구역으로 은밀히 하강 진입한다.", "달에 배치된 외계인의 전술 격납고 건물을 부수고 초강력 [S] 심볼 캡슐을 획득하라!", "👉 [Space] 또는 화면을 터치해 우주 전쟁을 시작하세요!" ];
document.addEventListener("keydown", e => { keys[e.key] = true; if(gameState==='story' && e.key===" ") { if(textProgress<storyTexts[storyIndex].length) textProgress=storyTexts[storyIndex].length; else { storyIndex++; textProgress=0; if(storyIndex>=storyTexts.length) { gameState='play'; playSound('start'); startBGM(); } } } else if(gameState==='play' && e.key===" " && !isOver && document.getElementById("weaponModal").style.display !== "flex" && document.getElementById("shopModal").style.display !== "flex") { fireWeapon(); } });
document.addEventListener("keyup", e => keys[e.key] = false);
function openShop() { document.getElementById("shopModal").style.display = "flex"; updateShopUI(); }
function closeShop() { document.getElementById("shopModal").style.display = "none"; keys[" "] = false; }
function updateShopUI() { let lg = 2 + player.upgProbLv * 0.5; document.getElementById("shopPoints").innerText = `보유 포인트: ${shopPoints} P`; document.getElementById("strLv").innerText = `⚔️ 공격력 Lv.${upgLv.dmg}`; document.getElementById("probLv").innerText = `🍀 확률업 Lv.${upgLv.prob} (${lg.toFixed(1)}%)`; document.getElementById("hpLv").innerText = `🛡️ 최대실드 Lv.${upgLv.hp}`; document.getElementById("dmgCostBtn").innerText = `${upgCost.dmg} P`; document.getElementById("probCostBtn").innerText = `${upgCost.prob} P`; document.getElementById("hpCostBtn").innerText = `${upgCost.hp} P`; }
function buyUpgrade(type) { if(shopPoints >= upgCost[type]) { shopPoints -= upgCost[type]; if(type === 'dmg') { upgLv.dmg++; player.dmg += 0.5; } else if(type === 'prob') { upgLv.prob++; player.upgProbLv++; } else if(type === 'hp') { upgLv.hp += 2; player.maxHp += 2; player.hp += 2; } upgCost[type] = Math.floor(upgCost[type] * 1.6); updateShopUI(); updateBoard(); playSound('start'); } }
function getRandomWeapon() {
    let rnd = Math.random() * 100; let cProb = Math.max(10, 50 - player.upgProbLv * 5); let rProb = 35 + player.upgProbLv * 3; let eProb = 13 + player.upgProbLv * 1.5;
    if (rnd < cProb) return Math.random() < 0.5 ? { wp: '기본 레이저', grade: '🟢 [커먼]' } : { wp: '🔱 3갈래 확산탄', grade: '🟢 [커먼]' };
    else if (rnd < cProb + rProb) { let r = Math.random(); if (r < 0.33) return { wp: '🚀 범위 미사일', grade: '🔵 [레어]' }; else if (r < 0.66) return { wp: '⚡ 관통 레이저', grade: '🔵 [레어]' }; else return { wp: '💣 기뢰 설치', grade: '🔵 [레어]' }; }
    else if (rnd < cProb + rProb + eProb) return Math.random() < 0.5 ? { wp: '🛡️ 유도 드론', grade: '🟣 [에픽]' } : { wp: 'CNG 블랙홀', grade: '🟣 [에픽]' };
    else return { wp: '💥 핵융합 폭탄', grade: '🟡 [전설]' };
}
function askEquip(g, wp) { pendingWeapon = wp; document.getElementById("weaponDesc").innerText = `${g} ${wp}`; document.getElementById("weaponModal").style.display = "flex"; }
function equipWeapon(yes) { if(yes && pendingWeapon) { player.currentWeapon = pendingWeapon; playSound('start'); } document.getElementById("weaponModal").style.display = "none"; pendingWeapon = null; keys[" "] = false; openShop(); }
function fireWeapon() {
    if(player.currentWeapon === '기본 레이저') { bullets.push({ x: player.x + 14, y: player.y, w: 4, h: 10, speed: 9, type: 'normal' }); playSound('laser'); }
    else if(player.currentWeapon === '🚀 범위 미사일') { bullets.push({ x: player.x + 10, y: player.y, w: 12, h: 16, speed: 7, type: 'missile' }); playSound('laser'); }
    else if(player.currentWeapon === '💣 기뢰 설치') { bullets.push({ x: player.x + 14, y: player.y + player.h, w: 10, h: 10, speed: -1, type: 'mine' }); playSound('hit'); }
    else if(player.currentWeapon === '⚡ 관통 레이저') { bullets.push({ x: player.x + 13, y: player.y, w: 6, h: 25, speed: 12, type: 'piece' }); playSound('laser'); }
    else if(player.currentWeapon === '🔱 3갈래 확산탄') { bullets.push({ x: player.x + 14, y: player.y, w: 4, h: 8, speed: 8, dx: -2, type: 'normal' }); bullets.push({ x: player.x + 14, y: player.y, w: 4, h: 10, speed: 9, dx: 0, type: 'normal' }); bullets.push({ x: player.x + 14, y: player.y, w: 4, h: 8, speed: 8, dx: 2, type: 'normal' }); playSound('laser'); }
    else if(player.currentWeapon === '🛡️ 유도 드론') { bullets.push({ x: player.x - 8, y: player.y + 10, w: 6, h: 6, speed: 7, type: 'drone' }); bullets.push({ x: player.x + player.w + 2, y: player.y + 10, w: 6, h: 6, speed: 7, type: 'drone' }); playSound('laser'); }
    else if(player.currentWeapon === 'CNG 블랙홀') { bullets.push({ x: player.x + 10, y: player.y, w: 12, h: 12, speed: 4, type: 'blackhole' }); playSound('hit'); }
    else if(player.currentWeapon === '💥 핵융합 폭탄') { explosions.push({ x: 200, y: 220, rad: 10, isNuke: true }); playSound('explode'); player.currentWeapon = '기본 레이저'; }
}
function initStars() { for(let i=0; i<25; i++) stars.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height, size: 1+Math.random()*1.5, speed: 1+Math.random()*2 }); for(let j=0; j<6; j++) craterList.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height, r: 15+Math.random()*20 }); }
function restart() {
    document.getElementById("overModal").style.display="none"; document.getElementById("weaponModal").style.display="none"; document.getElementById("shopModal").style.display="none";
    player.x = 180; player.y = 380; player.hp = 10; player.maxHp = 10; player.currentWeapon = '기본 레이저'; player.dmg = 1; player.upgProbLv = 0; player.superTimer = 0;
    upgCost={dmg:5,prob:5,hp:5}; upgLv={dmg:1,prob:1,hp:10}; bullets = []; enemyBullets = []; enemies = []; items = []; explosions = []; buildings = [];
    boss = null; bossSpawned = false; score = 0; enemiesKilled = 0; bossLevel = 1; shopPoints = 0; isOver = false; gameState = 'story'; storyIndex = 0; textProgress = 0; moonMode = false; transitionAlpha = 0; isTransitioning = false; updateBoard(); loop();
}
function updateBoard() { const b = document.getElementById("board"); let mHead = moonMode ? "🌕 달 표면 기지" : "🌌 은하계 대기실"; if(gameState==='story') b.innerText = "🌌 우주 상황실"; else if(bossSpawned && boss && boss.hp > 0) b.innerText = `${mHead} | 👾 BOSS Lv.${bossLevel}: ${Math.ceil(boss.hp)} / ${bossLevel * 30}`; else b.innerText = `${mHead} | 🏆 점수: ${score} | 잡몹: ${Math.max(0, 15 - enemiesKilled)}마리`; }
let frameCount = 0;
function loop() {
    if(isOver) return; gameId = requestAnimationFrame(loop); ctx.clearRect(0,0,canvas.width,canvas.height); if(player.superTimer > 0) player.superTimer--; if(player.superTimer > 0) player.invuln = 2;
    if(moonMode) { ctx.fillStyle = "#2b2d31"; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle = "#1e1f22"; craterList.forEach(c => { c.y += 0.8; if(c.y > canvas.height + 40) { c.y = -40; c.x = Math.random()*canvas.width; } ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI*2); ctx.fill(); ctx.closePath(); }); }
    else { ctx.fillStyle = "rgba(255,255,255,0.5)"; stars.forEach(s => { s.y += s.speed; if(s.y > canvas.height) { s.y = 0; s.x = Math.random()*canvas.width; } ctx.fillRect(s.x, s.y, s.size, s.size); }); }
    if(gameState === 'story') { updateBoard(); ctx.fillStyle = "rgba(0, 0, 0, 0.7)"; ctx.fillRect(20, 240, 360, 180); ctx.strokeStyle = "#00ffcc"; ctx.lineWidth = 2; ctx.strokeRect(20, 240, 360, 180); ctx.fillStyle = "#fff"; ctx.font = "15px sans-serif"; ctx.textAlign = "left"; let fText = storyTexts[storyIndex]; if(frameCount % 3 === 0 && textProgress < fText.length) { textProgress++; playSound('talk'); } frameCount++; let lines = []; for (let i = 0; i < textProgress; i += 18) { lines.push(fText.slice(i, i + 18)); } lines.forEach((line, idx) => { ctx.fillText(line, 40, 280 + (idx * 26)); }); ctx.save(); ctx.font = "60px sans-serif"; ctx.textAlign = "center"; ctx.fillText("🚀", 200, 140); ctx.restore(); return; }
    if(document.getElementById("weaponModal").style.display === "flex" || document.getElementById("shopModal").style.display === "flex") { keys = {}; return; }
    if(isTransitioning) { transitionAlpha += 0.02; ctx.fillStyle = `rgba(0, 0, 0, ${transitionAlpha})`; ctx.fillRect(0,0,canvas.width,canvas.height); if(transitionAlpha >= 1) { isTransitioning = false; moonMode = true; buildings.push({ x: 40, y: -80, hp: 50, maxHp: 50 }, { x: 300, y: -120, hp: 50, maxHp: 50 }); loop(); } return; }
    if(moonMode && transitionAlpha > 0) { transitionAlpha -= 0.02; ctx.fillStyle = `rgba(0, 0, 0, ${transitionAlpha})`; ctx.fillRect(0,0,canvas.width,canvas.height); }
    if(player.invuln > 0) player.invuln--; if((keys["ArrowLeft"] || keys["a"]) && player.x > 0) player.x -= player.speed; if((keys["ArrowRight"] || keys["d"]) && player.x < canvas.width - player.w) player.x += player.speed; if((keys["ArrowUp"] || keys["w"]) && player.y > 0) player.y -= player.speed; if((keys["ArrowDown"] || keys["s"]) && player.y < canvas.height - player.h) player.y += player.speed;
    if(player.invuln == 0 || Math.floor(player.invuln/4) % 2 == 0) { ctx.save(); ctx.font = "32px sans-serif"; ctx.fillText(player.superTimer > 0 ? "🔥" : "🚀", player.x, player.y + 26); ctx.restore(); }
    ctx.save(); ctx.fillStyle = "rgba(255, 255, 255, 0.15)"; ctx.fillRect(230, 8, 160, 28); ctx.strokeStyle = "#fcc419"; ctx.strokeRect(230, 8, 160, 28); ctx.fillStyle = "#fff"; ctx.font = "11px sans-serif"; ctx.textAlign = "center"; ctx.fillText(`장비: ${player.currentWeapon}`, 310, 26); ctx.restore();
    for(let e=explosions.length-1; e>=0; e--) { explosions[e].rad += explosions[e].isNuke ? 16 : 4; ctx.save(); ctx.beginPath(); ctx.arc(explosions[e].x, explosions[e].y, explosions[e].rad, 0, Math.PI*2); ctx.fillStyle = explosions[e].isNuke ? `rgba(255, 100, 0, ${1 - explosions[e].rad/400})` : `rgba(0, 255, 200, ${1 - explosions[e].rad/80})`; ctx.fill(); ctx.closePath(); ctx.restore(); if(explosions[e].isNuke && explosions[e].rad >= 400) explosions.splice(e, 1); else if(!explosions[e].isNuke && explosions[e].rad >= 80) explosions.splice(e, 1); }
    for(let i=bullets.length-1; i>=0; i--) { bullets[i].y -= bullets[i].speed; if(bullets[i].dx) bullets[i].x += bullets[i].dx; ctx.save(); ctx.shadowBlur = 8; ctx.shadowColor = "#00ffcc"; if(bullets[i].type === 'normal') { ctx.fillStyle = "#00ffcc"; ctx.fillRect(bullets[i].x, bullets[i].y, bullets[i].w, bullets[i].h); } else if(bullets[i].type === 'missile') { ctx.fillStyle = "#ff922b"; ctx.fillRect(bullets[i].x, bullets[i].y, bullets[i].w, bullets[i].h); ctx.font="11px sans-serif"; ctx.fillText("🚀", bullets[i].x-2, bullets[i].y+12); } else if(bullets[i].type === 'mine') { ctx.fillStyle = "#fcc419"; ctx.font="12px sans-serif"; ctx.fillText("💥", bullets[i].x-2, bullets[i].y); } else if(bullets[i].type === 'piece') { ctx.fillStyle = "#ff00ff"; ctx.fillRect(bullets[i].x, bullets[i].y, bullets[i].w, bullets[i].h); } else if(bullets[i].type === 'drone') { ctx.fillStyle = "#51cf66"; ctx.fillRect(bullets[i].x, bullets[i].y, bullets[i].w, bullets[i].h); if(enemies.length > 0 && enemies) { bullets[i].x += (enemies.x + 18 - bullets[i].x) * 0.12; bullets[i].y += (enemies.y + 16 - bullets[i].y) * 0.05; } else if(bossSpawned && boss && boss.hp > 0) { bullets[i].x += (boss.x + 32 - bullets[i].x) * 0.12; bullets[i].y += (boss.y + 22 - bullets[i].y) * 0.05; } else { bullets[i].y -= 4; } } else if(bullets[i].type === 'blackhole') { ctx.fillStyle = "#748ffc"; ctx.font="14px sans-serif"; ctx.fillText("🌀", bullets[i].x-2, bullets[i].y); enemies.forEach(en => { if(Math.abs(en.x - bullets[i].x) < 100) { en.x += (bullets[i].x - en.x) * 0.04; en.y += (bullets[i].y - en.y) * 0.02; } }); } ctx.restore(); if(bullets[i].y < -30 || bullets[i].y > canvas.height + 30) { bullets.splice(i, 1); continue; } }
    for(let j=bullets.length-1; j>=0; j--) {
      if(boss && boss.hp > 0 &&
         bullets[j].x < boss.x+boss.w &&
         bullets[j].x+bullets[j].w > boss.x &&
         bullets[j].y < boss.y+boss.h &&
         bullets[j].y+bullets[j].h > boss.y) {
        if(bullets[j].type === 'missile') {
          explosions.push({
            x: bullets[j].x,
            y: bullets[j].y, rad: 10
          });
        }
        let dmg = player.superTimer > 0 ?
          player.dmg * 2 : player.dmg;
        boss.hp -= dmg;
        if(bullets[j].type !== 'piece') {
          bullets.splice(j,1);
        }
        updateBoard(); playSound('hit');
        if(boss.hp <= 0) {
          score += (150 * bossLevel);
          shopPoints += (5 + bossLevel * 5);
          enemiesKilled = 0;
          bossSpawned = false;
          playSound('win');
          if(bossLevel === 10) {
            isTransitioning = true;
          }
          items.push({
            x: boss.x + boss.w/2 - 12,
            y: boss.y
          });
          bossLevel++; enemies = [];
          enemyBullets = []; updateBoard();
        } break;
      }
    }
  }
  if(!bossSpawned && Math.random() < 0.025) {
    let rType = Math.random();
    let type = 'sine';
    let spd = 2.2 + Math.random()*1.5;
    if(rType < 0.20) type = 'rush';
    else if(rType < 0.40) type = 'track';
    else if(rType < 0.65) type = 'diamond';
    else if(rType < 0.85) type = 'loop';
    if(type==='rush') spd = 4.5;
    enemies.push({
      x: Math.random()*(canvas.width-38),
      y: -40, w: 36, h: 32, speed: spd,
      pType: type, sinTimer: Math.random()*10,
      shotTimer: Math.floor(Math.random()*60),
      dx: Math.random() < 0.5 ? -2 : 2,
      dirY: 1
    });
  }
  if(moonMode && !bossSpawned &&
     buildings.length === 0 &&
     Math.random() < 0.01) {
    buildings.push({
      x: Math.random() < 0.5 ? 40 : 300,
      y: -50, hp: 50 + bossLevel*5,
      maxHp: 50 + bossLevel*5
    });
  }
  for(let i=enemies.length-1; i>=0; i--) {
    enemies[i].y += enemies[i].speed;
    if(enemies[i].pType === 'diamond') {
      enemies[i].y += enemies[i].speed * 0.7;
      enemies[i].x += enemies[i].dx;
      if(enemies[i].x < 10 ||
         enemies[i].x > canvas.width-45) {
        enemies[i].dx = -enemies[i].dx;
      }
    } else if(enemies[i].pType === 'loop') {
      enemies[i].sinTimer += 0.06;
      enemies[i].y += 
        enemies[i].speed * enemies[i].dirY;
      enemies[i].x += 
        Math.cos(enemies[i].sinTimer)*1.8;
      if(enemies[i].y > 180 &&
         enemies[i].dirY === 1) {
        enemies[i].dirY = -0.4;
      }
      if(enemies[i].y < 60 &&
         enemies[i].dirY < 0) {
        enemies[i].dirY = 1;
      }
    } else {
      enemies[i].y += enemies[i].speed;
      if(enemies[i].pType === 'sine') {
        enemies[i].sinTimer += 0.05;
        enemies[i].x += 
          Math.sin(enemies[i].sinTimer) * 2.5;
      } else if(enemies[i].pType === 'track') {
        enemies[i].x += 
          (player.x - enemies[i].x) * 0.015;
      }
    }
    if(enemies[i].x < 5) enemies[i].x = 5;
    if(enemies[i].x > canvas.width-40) {
      enemies[i].x = canvas.width-40;
    }
    enemies[i].shotTimer++; 
    if(!bossSpawned &&
       enemies[i].shotTimer >= 150 &&
       enemies[i].y < player.y - 30) {
      let dx = player.x + 16 -
               (enemies[i].x + 18);
      let dy = player.y + 16 -
               (enemies[i].y + 32);
      let dist = Math.sqrt(dx*dx + dy*dy);
      enemyBullets.push({
        x: enemies[i].x + 16,
        y: enemies[i].y + 32,
        w: 5, h: 5, speed: 3.2,
        dx: (dx/dist) * 1.6
      });
      enemies[i].shotTimer = 0;
    }
    ctx.save(); ctx.font = "36px sans-serif";
    ctx.fillText(
      "🛸", enemies[i].x, enemies[i].y + 30
    );
    ctx.restore();
    if(enemies[i].y > canvas.height) {
      enemies.splice(i,1); continue;
    }
    explosions.forEach(exp => {
      if(enemies[i]) {
        let d = Math.sqrt(
          (enemies[i].x+18-exp.x)**2 +
          (enemies[i].y+16-exp.y)**2
        );
        if(d <= exp.rad + 16) {
          enemies.splice(i,1); score += 10;
          enemiesKilled++; updateBoard();
          playSound('explode');
        }
      }
    });
    if(!enemies[i]) continue;
    if(player.invuln == 0 &&
       enemies[i].x < player.x+player.w &&
       enemies[i].x+enemies[i].w > player.x &&
       enemies[i].y < player.y+player.h &&
       enemies[i].y+enemies[i].h > player.y) {
      enemies.splice(i, 1); player.hp--;
      player.invuln = 60; updateBoard();
      playSound('hit');
      if(player.hp <= 0) {
        triggerGameOver(); return;
      } continue;
    }
    for(let j=bullets.length-1; j>=0; j--) {
      if(bullets[j].x < enemies[i].x+enemies[i].w &&
         bullets[j].x+bullets[j].w > enemies[i].x &&
         bullets[j].y < enemies[i].y+enemies[i].h &&
         bullets[j].y < enemies[i].y+enemies[i].h) {
        if(bullets[j].type === 'missile') {
          explosions.push({
            x: bullets[j].x,
            y: bullets[j].y, rad: 10
          });
        }
        enemies.splice(i,1);
        if(bullets[j].type !== 'piece') {
          bullets.splice(j,1);
        }
        score += 10; enemiesKilled++;
        updateBoard(); playSound('explode'); break;
      }
    }
  }
}
function triggerGameOver() {
  isOver = true;
  cancelAnimationFrame(gameId);
  playSound('over');
  const t = document.getElementById(
    "modalTitle"
  );
  t.innerText = "💥 GAME OVER";
  const s = document.getElementById(
    "finalScore"
  );
  s.innerText = 
    `최종 점수: ${score}점\n` +
    `처치한 보스: ${bossLevel-1}기`;
  document.getElementById(
    "overModal"
  ).style.display = "flex";
}
initStars(); restart();
