// Drawing the tower and the marble. No movement yet, that's step 2 and 3!
const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');

// Everything I need to know about the tower's shape
const tower = { cx: 200, baseY: 450, w: 160, h: 340 };
// The marble sits at the bottom, in the middle
const marble = { x: 200, y: 0, r: 18 };
marble.y = tower.baseY - 20 - marble.r;

function drawStars() {
  ctx.fillStyle = '#fff';
  for (let i = 0; i < 25; i++) {
    // fixed pseudo-random spots so stars don't jump around
    const x = (i * 97) % 400;
    const y = (i * 53) % 200;
    ctx.fillRect(x, y, 2, 2);
  }
}

function drawTower() {
  const left = tower.cx - tower.w / 2;
  const top = tower.baseY - tower.h;

  // tower body
  ctx.fillStyle = '#8f7ad9';
  ctx.fillRect(left, top, tower.w, tower.h);

  // stone lines
  ctx.strokeStyle = '#6c57b8';
  ctx.lineWidth = 2;
  for (let y = top + 40; y < tower.baseY; y += 40) {
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(left + tower.w, y);
    ctx.stroke();
  }

  // the hollow inside where the marble rolls
  ctx.fillStyle = '#231d52';
  ctx.fillRect(left + 14, top + 60, tower.w - 28, tower.h - 80);

  // pointy wizard roof
  ctx.fillStyle = '#e05a7a';
  ctx.beginPath();
  ctx.moveTo(left - 14, top);
  ctx.lineTo(tower.cx, top - 90);
  ctx.lineTo(left + tower.w + 14, top);
  ctx.closePath();
  ctx.fill();

  // little star on the roof
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
  drawTower();
  drawMarble();
}

draw();
