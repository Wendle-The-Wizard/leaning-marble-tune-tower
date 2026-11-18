// Step 5: a soft glow blooms when a note rings!
const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');

const tower = { cx: 200, baseY: 450, w: 160, h: 340 };
const WALL = 14;
const marble = { x: 200, vx: 0, r: 18 };
const floorY = tower.baseY - 20;
const minX = tower.cx - tower.w / 2 + WALL + marble.r;
const maxX = tower.cx + tower.w / 2 - WALL - marble.r;
let spin = 0;

const MAX_TILT = 0.3;
let tilt = 0.12;
let target = 0;
const held = { left: false, right: false };
let idle = 0;

function updateTarget() {
  target = ((held.right ? 1 : 0) - (held.left ? 1 : 0)) * MAX_TILT;
}

// ---- sound: a tiny Web Audio synth ----
let audio = null;
function getAudio() {
  if (!audio) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) audio = new AC();
  }
  if (audio && audio.state === 'suspended') audio.resume();
  return audio;
}
const NOTES = { left: 261.63, right: 392.0 }; // C4 and G4
function playNote(side, strength) {
  const a = getAudio();
  if (!a) return;
  const t = a.currentTime;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = 'triangle';
  osc.frequency.value = NOTES[side];
  const vol = Math.min(0.08 + strength / 900, 0.35);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
  osc.connect(gain);
  gain.connect(a.destination);
  osc.start(t);
  osc.stop(t + 0.85);
}

// glow state: how long ago and how strongly the last note rang
let lastSide = '';
let lastTime = -99999;
let lastPower = 0;
function showNote(side, strength) {
  lastSide = side;
  lastTime = performance.now();
  lastPower = Math.min(0.5 + strength / 400, 1);
}
// 1 right when a note rings, fading softly to 0 over about a second
function glowAmount() {
  const age = (performance.now() - lastTime) / 1000;
  if (age >= 1.1) return 0;
  const k = 1 - age / 1.1;
  return k * k * lastPower;
}

window.addEventListener('keydown', function (e) {
  if (e.key === 'ArrowLeft') { held.left = true; e.preventDefault(); }
  if (e.key === 'ArrowRight') { held.right = true; e.preventDefault(); }
  idle = 0;
  getAudio();
  updateTarget();
});
window.addEventListener('keyup', function (e) {
  if (e.key === 'ArrowLeft') held.left = false;
  if (e.key === 'ArrowRight') held.right = false;
  updateTarget();
});
window.addEventListener('blur', function () {
  held.left = false; held.right = false; updateTarget();
});

function hold(id, side) {
  const b = document.getElementById(id);
  const on = function (e) { e.preventDefault(); held[side] = true; idle = 0; getAudio(); updateTarget(); };
  const off = function () { held[side] = false; updateTarget(); };
  b.addEventListener('pointerdown', on);
  b.addEventListener('pointerup', off);
  b.addEventListener('pointerleave', off);
  b.addEventListener('pointercancel', off);
}
hold('btnLeft', 'left');
hold('btnRight', 'right');

function drawTower() {
  const left = tower.cx - tower.w / 2;
  const top = tower.baseY - tower.h;

  ctx.fillStyle = '#8f7ad9';
  ctx.fillRect(left, top, tower.w, tower.h);

  ctx.strokeStyle = '#6c57b8';
  ctx.lineWidth = 2;
  for (let y = top + 40; y < tower.baseY; y += 40) {
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(left + tower.w, y);
    ctx.stroke();
  }

  ctx.fillStyle = '#231d52';
  ctx.fillRect(left + WALL, top + 60, tower.w - WALL * 2, tower.h - 80);

  const glow = glowAmount();
  const wallTop = top + 60;
  const wallH = tower.h - 80;
  ctx.fillStyle = '#ffb36b';
  ctx.fillRect(left + WALL - 4, wallTop, 4, wallH);
  ctx.fillStyle = '#6bd6ff';
  ctx.fillRect(left + tower.w - WALL, wallTop, 4, wallH);

  if (glow > 0) {
    // soft light filling the room, brightest near the wall that rang
    const isLeft = lastSide === 'left';
    const wx = isLeft ? left + WALL : left + tower.w - WALL;
    const col = isLeft ? '255,179,107' : '107,214,255';
    ctx.save();
    ctx.beginPath();
    ctx.rect(left + WALL, wallTop, tower.w - WALL * 2, wallH);
    ctx.clip();
    const g = ctx.createRadialGradient(wx, floorY - 30, 4, wx, floorY - 30, 150);
    g.addColorStop(0, 'rgba(' + col + ',' + (glow * 0.7) + ')');
    g.addColorStop(1, 'rgba(' + col + ',0)');
    ctx.fillStyle = g;
    ctx.fillRect(left, wallTop, tower.w, wallH);
    ctx.restore();
    // the wall stripe itself shines, with a blur halo
    ctx.save();
    ctx.shadowColor = 'rgb(' + col + ')';
    ctx.shadowBlur = 25 * glow;
    ctx.fillStyle = 'rgba(255,255,255,' + (glow * 0.9) + ')';
    ctx.fillRect(isLeft ? left + WALL - 4 : left + tower.w - WALL, wallTop, 4, wallH);
    ctx.restore();
  }

  ctx.fillStyle = '#e05a7a';
  ctx.beginPath();
  ctx.moveTo(left - 14, top);
  ctx.lineTo(tower.cx, top - 90);
  ctx.lineTo(left + tower.w + 14, top);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#ffe27a';
  ctx.beginPath();
  ctx.arc(tower.cx, top - 90, 6 + glow * 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawMarble() {
  const y = floorY - marble.r;
  const glow = glowAmount();
  if (glow > 0) {
    // the marble gets a little halo too
    const h = ctx.createRadialGradient(marble.x, y, marble.r * 0.5, marble.x, y, marble.r * 2.6);
    h.addColorStop(0, 'rgba(255,255,255,' + (glow * 0.6) + ')');
    h.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = h;
    ctx.beginPath();
    ctx.arc(marble.x, y, marble.r * 2.6, 0, Math.PI * 2);
    ctx.fill();
  }
  const sx = marble.x + Math.cos(spin - 2.3) * 8;
  const sy = y + Math.sin(spin - 2.3) * 8;
  const g = ctx.createRadialGradient(sx, sy, 2, marble.x, y, marble.r);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(1, '#4fc3f7');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(marble.x, y, marble.r, 0, Math.PI * 2);
  ctx.fill();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(tower.cx, tower.baseY);
  ctx.rotate(tilt);
  ctx.translate(-tower.cx, -tower.baseY);
  drawTower();
  drawMarble();
  ctx.restore();

  // a note label so you can see which side rang
  if (performance.now() - lastTime < 700) {
    ctx.fillStyle = '#ffe27a';
    ctx.font = '20px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(lastSide === 'left' ? '♪ C (left)' : '♪ G (right)', 200, 30);
  }
}

const GRAVITY = 1400;
let last = performance.now();
let cooldown = 0;

function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  idle += dt;
  cooldown -= dt;

  if (idle > 4 && !held.left && !held.right) {
    target = Math.sin(now / 1200) * 0.2;
  } else if (!held.left && !held.right) {
    target = 0;
  }
  tilt += (target - tilt) * 0.12;

  marble.vx += GRAVITY * Math.sin(tilt) * dt;
  marble.vx *= Math.pow(0.6, dt);
  marble.x += marble.vx * dt;
  spin += (marble.vx * dt) / marble.r;

  if (marble.x < minX) {
    const hit = Math.abs(marble.vx);
    marble.x = minX; marble.vx = hit * 0.45;
    if (cooldown <= 0 && hit > 20) { playNote('left', hit); showNote('left', hit); cooldown = 0.12; }
  }
  if (marble.x > maxX) {
    const hit = Math.abs(marble.vx);
    marble.x = maxX; marble.vx = -hit * 0.45;
    if (cooldown <= 0 && hit > 20) { playNote('right', hit); showNote('right', hit); cooldown = 0.12; }
  }

  draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
