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

const fixedMaps = {
    1: { p: [{x:0,y:310,w:100},{x:180,y:260,w:80},{x:340,y:210,w:80},{x:500,y:260,w:100}], s: [], pt: [] },
    2: { p: [{x:0,y:310,w:80},{x:150,y:310,w:60},{x:280,y:260,w:60},{x:400,y:210,w:60},{x:500,y:260,w:100}], s: [], pt: [] },
    3: { p: [{x:0,y:310,w:100},{x:180,y:240,w:60},{x:300,y:240,w:60},{x:420,y:240,w:60},{x:520,y:310,w:80}], s: [], pt: [] },
    4: { p: [{x:0,y:310,w:80},{x:140,y:270,w:50},{x:250,y:220,w:50},{x:360,y:170,w:50},{x:470,y:220,w:50},{x:550,y:280,w:50}], s: [], pt: [] },
    5: { p: [{x:0,y:310,w:120},{x:200,y:250,w:60},{x:340,y:190,w:60},{x:480,y:250,w:120}], s: [{x:220,y:230}], pt: [] },
    6: { p: [{x:0,y:310,w:80},{x:150,y:260,w:80},{x:300,y:260,w:80},{x:450,y:260,w:150}], s: [{x:330,y:240}], pt: [] },
    7: { p: [{x:0,y:310,w:100},{x:170,y:220,w:40},{x:280,y:220,w:40},{x:390,y:220,w:40},{x:480,y:310,w:120}], s: [{x:290,y:200}], pt: [] },
    8: { p: [{x:0,y:310,w:80},{x:150,y:260,w:50},{x:260,y:200,w:50},{x:370,y:260,w:50},{x:480,y:310,w:120}], s: [{x:160,y:240},{x:380,y:240}], pt: [] },
    9: { p: [{x:0,y:250,w:70},{x:130,y:290,w:70},{x:260,y:250,w:70},{x:390,y:210,w:70},{x:500,y:290,w:100}], s: [{x:280,y:230}], pt: [] },
    10: { p: [{x:0,y:310,w:100},{x:170,y:260,w:50},{x:280,y:200,w:50},{x:390,y:140,w:50},{x:480,y:230,w:120}], s: [{x:290,y:180}], pt: [] },
    11: { p: [{x:0,y:310,w:80},{x:140,y:260,w:60},{x:250,y:260,w:60},{x:360,y:260,w:60},{x:480,y:310,w:120}], s: [{x:260,y:240},{x:370,y:240}], pt: [] },
    12: { p: [{x:0,y:310,w:100},{x:180,y:250,w:40},{x:300,y:180,w:40},{x:420,y:250,w:40},{x:520,y:310,w:80}], s: [], pt: [{x:190,y:226,tx:430,ty:150}] },
    13: { p: [{x:0,y:310,w:70},{x:130,y:260,w:50},{x:240,y:210,w:50},{x:350,y:260,w:50},{x:460,y:310,w:140}], s: [{x:250,y:190}], pt: [{x:140,y:236,tx:480,ty:200}] },
    14: { p: [{x:0,y:310,w:90},{x:150,y:240,w:40},{x:240,y:180,w:40},{x:330,y:240,w:40},{x:440,y:310,w:160}], s: [{x:250,y:160}], pt: [] },
    15: { p: [{x:0,y:310,w:120},{x:180,y:250,w:50},{x:290,y:190,w:50},{x:400,y:250,w:50},{x:490,y:310,w:110}], s: [{x:200,y:230},{x:410,y:230}], pt: [] },
    16: { p: [{x:0,y:310,w:80},{x:140,y:250,w:40},{x:230,y:250,w:40},{x:320,y:250,w:40},{x:420,y:190,w:40},{x:500,y:290,w:100}], s: [{x:240,y:230},{x:330,y:230}], pt: [] },
    17: { p: [{x:0,y:310,w:100},{x:160,y:250,w:40},{x:260,y:190,w:40},{x:360,y:130,w:40},{x:460,y:220,w:40},{x:530,y:310,w:70}], s: [{x:270,y:170}], pt: [] },
    18: { p: [{x:0,y:310,w:70},{x:140,y:310,w:40},{x:250,y:250,w:40},{x:360,y:190,w:40},{x:470,y:250,w:130}], s: [{x:150,y:290}], pt: [] },
    19: { p: [{x:0,y:250,w:80},{x:140,y:210,w:40},{x:240,y:270,w:40},{x:340,y:210,w:40},{x:440,y:150,w:40},{x:520,y:250,w:80}], s: [{x:250,y:250}], pt: [] },
    20: { p: [{x:0,y:310,w:100},{x:160,y:250,w:40},{x:270,y:190,w:40},{x:380,y:250,w:40},{x:480,y:310,w:120}], s: [{x:170,y:230},{x:390,y:230}], pt: [] },
    21: { p: [{x:0,y:310,w:60},{x:120,y:250,w:40},{x:220,y:190,w:40},{x:320,y:130,w:40},{x:420,y:210,w:40},{x:500,y:290,w:100}], s: [{x:230,y:170}], pt: [] },
    22: { p: [{x:0,y:310,w:100},{x:160,y:260,w:40},{x:260,y:210,w:40},{x:360,y:260,w:40},{x:460,y:310,w:140}], s: [], pt: [{x:170,y:236,tx:470,ty:200}] },
    23: { p: [{x:0,y:310,w:80},{x:150,y:240,w:40},{x:250,y:180,w:40},{x:350,y:240,w:40},{x:450,y:310,w:150}], s: [{x:160,y:220},{x:360,y:220}], pt: [] },
    24: { p: [{x:0,y:310,w:120},{x:190,y:250,w:40},{x:290,y:190,w:40},{x:390,y:250,w:40},{x:480,y:310,w:120}], s: [{x:300,y:170}], pt: [] },
    25: { p: [{x:0,y:310,w:70},{x:130,y:250,w:40},{x:230,y:190,w:40},{x:330,y:250,w:40},{x:430,y:190,w:40},{x:520,y:290,w:80}], s: [{x:240,y:170},{x:340,y:230}], pt: [] },
    26: { p: [{x:0,y:310,w:100},{x:160,y:240,w:40},{x:260,y:240,w:40},{x:360,y:240,w:40},{x:470,y:310,w:130}], s: [{x:270,y:220}], pt: [] },
    27: { p: [{x:0,y:310,w:80},{x:140,y:250,w:40},{x:240,y:190,w:40},{x:340,y:130,w:40},{x:440,y:210,w:40},{x:520,y:290,w:80}], s: [{x:250,y:170}], pt: [] },
    28: { p: [{x:0,y:310,w:110},{x:180,y:260,w:40},{x:280,y:200,w:40},{x:380,y:260,w:40},{x:480,y:310,w:120}], s: [{x:190,y:240},{x:390,y:240}], pt: [] },
    29: { p: [{x:0,y:250,w:70},{x:130,y:210,w:40},{x:230,y:270,w:40},{x:330,y:210,w:40},{x:430,y:150,w:40},{x:510,y:250,w:90}], s: [{x:240,y:250}], pt: [] },
    30: { p: [{x:0,y:310,w:90},{x:160,y:250,w:40},{x:260,y:190,w:40},{x:360,y:250,w:40},{x:460,y:310,w:140}], s: [{x:270,y:170}], pt: [] },
    31: { p: [{x:0,y:310,w:70},{x:140,y:250,w:40},{x:240,y:190,w:40},{x:340,y:250,w:40},{x:440,y:310,w:160}], s: [{x:250,y:170}], pt: [] },
    32: { p: [{x:0,y:310,w:100},{x:170,y:240,w:45},{x:270,y:180,w:45},{x:370,y:240,w:45},{x:470,y:310,w:130}], s: [{x:280,y:160}], pt: [] },
    33: { p: [{x:0,y:310,w:80},{x:150,y:250,w:40},{x:250,y:190,w:40},{x:350,y:130,w:40},{x:440,y:210,w:40},{x:520,y:290,w:80}], s: [{x:260,y:170},{x:360,y:110}], pt: [] },
    34: { p: [{x:0,y:310,w:120},{x:190,y:260,w:40},{x:290,y:200,w:40},{x:390,y:260,w:40},{x:480,y:310,w:120}], s: [{x:200,y:240},{x:400,y:240}], pt: [] },
    35: { p: [{x:0,y:250,w:70},{x:140,y:210,w:40},{x:240,y:270,w:40},{x:340,y:210,w:40},{x:440,y:150,w:40},{x:520,y:250,w:80}], s: [{x:250,y:250}], pt: [] },
    36: { p: [{x:0,y:310,w:90},{x:160,y:250,w:40},{x:260,y:190,w:40},{x:360,y:250,w:40},{x:460,y:310,w:140}], s: [{x:270,y:170}], pt: [] },
    37: { p: [{x:0,y:310,w:70},{x:140,y:250,w:40},{x:240,y:190,w:40},{x:340,y:250,w:40},{x:440,y:310,w:160}], s: [{x:250,y:170}], pt: [] },
    38: { p: [{x:0,y:310,w:100},{x:170,y:240,w:45},{x:270,y:180,w:45},{x:370,y:240,w:45},{x:470,y:310,w:130}], s: [{x:280,y:160}], pt: [] },
    39: { p: [{x:0,y:310,w:80},{x:150,y:250,w:40},{x:250,y:190,w:40},{x:350,y:130,w:40},{x:440,y:210,w:40},{x:520,y:290,w:80}], s: [{x:260,y:170}], pt: [] },
    40: { p: [{x:0,y:310,w:120},{x:190,y:260,w:40},{x:290,y:200,w:40},{x:390,y:260,w:40},{x:480,y:310,w:120}], s: [{x:200,y:240},{x:400,y:240}], pt: [] },
    41: { p: [{x:0,y:250,w:70},{x:140,y:210,w:40},{x:240,y:270,w:40},{x:340,y:210,w:40},{x:440,y:150,w:40},{x:520,y:250,w:80}], s: [{x:250,y:250}], pt: [] },
    42: { p: [{x:0,y:310,w:90},{x:160,y:250,w:40},{x:260,y:190,w:40},{x:360,y:250,w:40},{x:460,y:310,w:140}], s: [{x:270,y:170}], pt: [] },
    43: { p: [{x:0,y:310,w:70},{x:140,y:250,w:40},{x:240,y:190,w:40},{x:340,y:250,w:40},{x:440,y:310,w:160}], s: [{x:250,y:170}], pt: [] },
    44: { p: [{x:0,y:310,w:100},{x:170,y:240,w:45},{x:270,y:180,w:45},{x:370,y:240,w:45},{x:470,y:310,w:130}], s: [{x:280,y:160}], pt: [] },
    45: { p: [{x:0,y:310,w:80},{x:150,y:250,w:40},{x:250,y:190,w:40},{x:350,y:130,w:40},{x:440,y:210,w:40},{x:520,y:290,w:80}], s: [{x:260,y:170}], pt: [] },
    46: { p: [{x:0,y:310,w:120},{x:190,y:260,w:40},{x:290,y:200,w:40},{x:390,y:260,w:40},{x:480,y:310,w:120}], s: [{x:200,y:240},{x:400,y:240}], pt: [] },
    47: { p: [{x:0,y:250,w:70},{x:140,y:210,w:40},{x:240,y:270,w:40},{x:340,y:210,w:40},{x:440,y:150,w:40},{x:520,y:250,w:80}], s: [{x:250,y:250}], pt: [] },
    48: { p: [{x:0,y:310,w:90},{x:160,y:250,w:40},{x:260,y:190,w:40},{x:360,y:250,w:40},{x:460,y:310,w:140}], s: [{x:270,y:170}], pt: [] },
    49: { p: [{x:0,y:310,w:70},{x:140,y:250,w:40},{x:240,y:190,w:40},{x:340,y:250,w:40},{x:440,y:310,w:160}], s: [{x:250,y:170}], pt: [] },
    50: { p: [{x:0,y:310,w:60},{x:120,y:260,w:30},{x:200,y:210,w:30},{x:280,y:160,w:30},{x:360,y:120,w:30},{x:440,y:180,w:30},{x:500,y:240,w:30},{x:550,y:300,w:50}], s: [{x:210,y:190},{x:370,y:100}], pt: [] }
};

function loadStage() {
    document.getElementById("info").innerText = `STAGE: ${stage} / 50`;
    let map = fixedMaps[stage];
    player.x = 25; player.y = 200; player.vx = 0; player.vy = 0; player.grounded = false;
    platforms = map.p.map(plat => ({x: plat.x, y: plat.y, w: plat.w, h: 200}));
    spikes = map.s.map(spk => ({x: spk.x, y: spk.y, w: 20, h: 20}));
    portals = map.pt.map(ptl => ({x: ptl.x, y: ptl.y, w: 24, h: 24, tx: ptl.tx, ty: ptl.ty}));
    let last = platforms[platforms.length-1];
    goal.x = last.x + last.w - 40; goal.y = last.y - goal.h;
}
function update() {
    if(keys["ArrowLeft"] || keys["a"]) player.vx = -player.speed; else if(keys["ArrowRight"] || keys["d"]) player.vx = player.speed; else player.vx = 0;
    if((keys[" "] || keys["ArrowUp"] || keys["w"]) && player.grounded) { player.vy = player.jumpForce; player.grounded = false; playSound('jump'); }
    player.vy += player.gravity; player.x += player.vx; player.y += player.vy; player.grounded = false;
    if(player.y > canvas.height) { playSound('fall'); loadStage(); return; }
    platforms.forEach(p => {
        if(player.x < p.x+p.w && player.x+player.w > p.x && player.y < p.y+p.h && player.y+player.h > p.y) {
            if(player.vy > 0 && player.y + player.h - player.vy <= p.y + 5) { player.y = p.y - player.h; player.vy = 0; player.grounded = true; }
        }
    });
    spikes.forEach(s => {
        if(player.x < s.x+s.w-4 && player.x+player.w > s.x+4 && player.y < s.y+s.h && player.y+player.h > s.y) { playSound('fall'); loadStage(); }
    });
    portals.forEach(pt => {
        if(player.x < pt.x+pt.w && player.x+player.w > pt.x && player.y < pt.y+pt.h && player.y+player.h > pt.y) {
            playSound('portal'); player.x = pt.tx; player.y = pt.ty; player.vy = -3;
        }
    });
    if(player.x < goal.x+goal.w && player.x+player.w > goal.x && player.y < goal.y+goal.h && player.y+player.h > goal.y) {
        if(stage < 50) { stage++; playSound('next'); loadStage(); } else { document.getElementById("winModal").style.display = "flex"; }
    }
}
function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height); ctx.font = "26px sans-serif";
    platforms.forEach(p => { for(let i=0; i<p.w; i+=24) { ctx.fillText("🧱", p.x + i, p.y + 22); } });
    spikes.forEach(s => ctx.fillText("⚠️", s.x, s.y + 22));
    portals.forEach(pt => ctx.fillText("🌀", pt.x, pt.y + 22));
    ctx.fillText("🎁", goal.x, goal.y + 28); ctx.fillText("🏃", player.x, player.y + 24);
}
function gameLoop() { update(); draw(); requestAnimationFrame(gameLoop); }
loadStage(); gameLoop();
