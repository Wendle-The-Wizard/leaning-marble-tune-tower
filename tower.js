// Step 4: each wall plays its own note when the marble touches it!
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
let tilt = 0.12; // start leaning a bit so the marble rolls right away
let target = 0;
const held = { left: false, right: false };
let idle = 0; // seconds since the player last touched anything

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
// low note on the left wall, higher note on the right wall
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

let lastSide = '';
let lastTime = 0;
function showNote(side) {
  lastSide = side;
  lastTime = performance.now();
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

  // the two walls get a colour stripe that brightens when they ring
  const age = (performance.now() - lastTime) / 1000;
  const lit = age < 0.4 ? 1 - age / 0.4 : 0;
  const wallTop = top + 60;
  const wallH = tower.h - 80;
  ctx.fillStyle = '#ffb36b';
  ctx.fillRect(left + WALL - 4, wallTop, 4, wallH);
  ctx.fillStyle = '#6bd6ff';
  ctx.fillRect(left + tower.w - WALL, wallTop, 4, wallH);
  if (lit > 0) {
    ctx.fillStyle = 'rgba(255,255,255,' + (lit * 0.8) + ')';
    const wx = lastSide === 'left' ? left + WALL - 4 : left + tower.w - WALL;
    ctx.fillRect(wx, wallTop, 4, wallH);
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
  ctx.arc(tower.cx, top - 90, 6, 0, Math.PI * 2);
  ctx.fill();
}

function drawMarble() {
  const y = floorY - marble.r;
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
let cooldown = 0; // keeps a resting marble from rattling the note

function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  idle += dt;
  cooldown -= dt;

  // before anyone presses anything, the tower gently rocks by itself
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

  // bounce off the walls and ring that wall's note
  if (marble.x < minX) {
    const hit = Math.abs(marble.vx);
    marble.x = minX; marble.vx = hit * 0.45;
    if (cooldown <= 0 && hit > 20) { playNote('left', hit); showNote('left'); cooldown = 0.12; }
  }
  if (marble.x > maxX) {
    const hit = Math.abs(marble.vx);
    marble.x = maxX; marble.vx = -hit * 0.45;
    if (cooldown <= 0 && hit > 20) { playNote('right', hit); showNote('right'); cooldown = 0.12; }
  }

  draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
