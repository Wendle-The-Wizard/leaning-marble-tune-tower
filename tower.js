// Step 3: the marble rolls with gravity inside the leaning tower!
const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');

const tower = { cx: 200, baseY: 450, w: 160, h: 340 };
const WALL = 14; // thickness of the tower wall on each side
const marble = { x: 200, vx: 0, r: 18 };
// the marble lives in the tower's own space: x along the floor, floor at baseY - 20
const floorY = tower.baseY - 20;
const minX = tower.cx - tower.w / 2 + WALL + marble.r;
const maxX = tower.cx + tower.w / 2 - WALL - marble.r;
let spin = 0; // just for the little shine on the marble

const MAX_TILT = 0.3;
let tilt = 0;
let target = 0;
const held = { left: false, right: false };

function updateTarget() {
  target = ((held.right ? 1 : 0) - (held.left ? 1 : 0)) * MAX_TILT;
}

window.addEventListener('keydown', function (e) {
  if (e.key === 'ArrowLeft') { held.left = true; e.preventDefault(); }
  if (e.key === 'ArrowRight') { held.right = true; e.preventDefault(); }
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

// buttons for phones
function hold(id, side) {
  const b = document.getElementById(id);
  const on = function (e) { e.preventDefault(); held[side] = true; updateTarget(); };
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
  // the shine circles around as the marble rolls
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

  // rotate tower and marble together around the bottom middle of the tower
  ctx.save();
  ctx.translate(tower.cx, tower.baseY);
  ctx.rotate(tilt);
  ctx.translate(-tower.cx, -tower.baseY);
  drawTower();
  drawMarble();
  ctx.restore();
}

// gravity pulls the marble along the floor by sin(tilt)
const GRAVITY = 1400; // pixels per second squared
let last = performance.now();

function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;

  // ease toward the target so the lean feels soft
  tilt += (target - tilt) * 0.12;

  marble.vx += GRAVITY * Math.sin(tilt) * dt;
  marble.vx *= Math.pow(0.6, dt); // a little friction
  marble.x += marble.vx * dt;
  spin += (marble.vx * dt) / marble.r;

  // bounce softly off the walls
  if (marble.x < minX) { marble.x = minX; marble.vx = Math.abs(marble.vx) * 0.45; }
  if (marble.x > maxX) { marble.x = maxX; marble.vx = -Math.abs(marble.vx) * 0.45; }

  draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
