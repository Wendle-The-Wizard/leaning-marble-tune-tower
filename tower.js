// The tower now tilts! Arrow keys (or the buttons) lean it left and right.
const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');

const tower = { cx: 200, baseY: 450, w: 160, h: 340 };
const marble = { x: 200, y: 0, r: 18 };
marble.y = tower.baseY - 20 - marble.r;

// tilt in radians; target is where I'm leaning towards, tilt eases to it
const MAX_TILT = 0.35;
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

function drawStars() {
  ctx.fillStyle = '#fff';
  for (let i = 0; i < 25; i++) {
    const x = (i * 97) % 400;
    const y = (i * 53) % 200;
    ctx.fillRect(x, y, 2, 2);
  }
}

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
  ctx.fillRect(left + 14, top + 60, tower.w - 28, tower.h - 80);

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
  const g = ctx.createRadialGradient(marble.x - 6, marble.y - 6, 2, marble.x, marble.y, marble.r);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(1, '#4fc3f7');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(marble.x, marble.y, marble.r, 0, Math.PI * 2);
  ctx.fill();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawStars();

  // rotate tower and marble together around the bottom middle of the tower
  ctx.save();
  ctx.translate(tower.cx, tower.baseY);
  ctx.rotate(tilt);
  ctx.translate(-tower.cx, -tower.baseY);
  drawTower();
  drawMarble();
  ctx.restore();
}

function frame() {
  // ease toward the target so the lean feels soft
  tilt += (target - tilt) * 0.12;
  draw();
  requestAnimationFrame(frame);
}
frame();
