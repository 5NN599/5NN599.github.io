const savedTheme = 
  localStorage.getItem('minig-theme');
if (savedTheme && savedTheme !== 'white') {
  document.documentElement.setAttribute(
    'data-theme', savedTheme
  );
}
const audioCtx = new (
  window.AudioContext || 
  window.webkitAudioContext
)();
let bgmInterval = null;
let bgmStep = 0;
let bgmGain = null;

function startBGM() {
  if(bgmInterval) return;
  try {
    bgmGain = audioCtx.createGain();
    bgmGain.gain.setValueAtTime(
      0.012, audioCtx.currentTime
    );
    bgmGain.connect(audioCtx.destination);
  } catch(e){}
  bgmInterval = setInterval(() => {
    if(gameState !== 'play' || isOver) return;
    const shop = document.getElementById(
      "shopModal"
    );
    if(shop.style.display === "flex") return;
    try {
      const osc = audioCtx.createOscillator();
      osc.connect(bgmGain);
      osc.type = 'square';
      const notes =;
      const f = notes[bgmStep % notes.length];
      osc.frequency.setValueAtTime(
        f, audioCtx.currentTime
      );
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
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    if (type === 'laser') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(
        220, now + 0.05
      );
      gain.gain.setValueAtTime(0.015, now);
      gain.gain.linearRampToValueAtTime(
        0, now + 0.05
      );
      osc.start(now); osc.stop(now + 0.05);
    } else if (type === 'hit') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, now);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.linearRampToValueAtTime(
        0, now + 0.05
      );
      osc.start(now); osc.stop(now + 0.05);
    } else if (type === 'explode') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(
        40, now + 0.1
      );
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.linearRampToValueAtTime(
        0, now + 0.1
      );
      osc.start(now); osc.stop(now + 0.1);
    } else if (type === 'win') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(523, now);
      osc.frequency.setValueAtTime(659, now+0.06);
      osc.frequency.setValueAtTime(783, now+0.12);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.linearRampToValueAtTime(
        0, now+0.2
      );
      osc.start(now); osc.stop(now + 0.2);
    } else if (type === 'over') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(
        20, now + 0.4
      );
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.linearRampToValueAtTime(
        0, now + 0.4
      );
      osc.start(now); osc.stop(now + 0.4);
    } else if (type === 'talk') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, now);
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(
        0, now + 0.03
      );
      osc.start(now); osc.stop(now + 0.03);
    } else if (type === 'start') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(523, now);
      osc.frequency.setValueAtTime(783, now + 0.08);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.linearRampToValueAtTime(
        0, now + 0.12
      );
      osc.start(now); osc.stop(now + 0.12);
    }
  } catch(e){}
}
