const canvas = document.getElementById('reptile-canvas');
const ctx = canvas.getContext('2d');

const NUM_SEGMENTS = 24;
const SEGMENT_LENGTH = 20;
const segments = [];

// Neon colors for PATCHES
const NEON_COLORS = [
  '#39FF14',   // neon green
  '#FFFF00',   // neon yellow
  '#FF9900',   // neon orange
  '#FF3131',   // neon red
  '#00E6FF',   // neon blue
  '#B026FF',   // neon violet
  '#00FFD0',   // neon teal
  'cyberpunk'  // special gradient
];
let colorIndex = 0;
let flashActive = false;
let flashTimeout = null;

// Natural colors for PATCHES (brown snake spots)
const PATCH_BASE_COLORS = [
  '#d2a869', '#a97a50', '#7c5832', '#e6cd99', '#5b3c17'
];

// Generate segments
for (let i = 0; i < NUM_SEGMENTS; i++) {
  segments.push({ x: canvas.width / 2, y: canvas.height / 2, angle: 0 });
}

let mouse = { x: canvas.width / 2, y: canvas.height / 2 };

canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', () => {
  colorIndex = (colorIndex + 1) % NEON_COLORS.length;
  flashActive = true;
  if (flashTimeout) clearTimeout(flashTimeout);
  flashTimeout = setTimeout(() => flashActive = false, 500);
});

function getCurrentPatchColor() {
  let color = NEON_COLORS[colorIndex];
  if (color === 'cyberpunk') {
    // Neon cyberpunk blend
    let grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#FFFF00');
    grad.addColorStop(0.5, '#00E6FF');
    grad.addColorStop(1, '#FF3131');
    return grad;
  }
  return color;
}

function lerp(a, b, t) { return a + (b - a) * t; }

function getWidthAtSegment(i) {
  // Head is thick, tail is thin
  const headWidth = 22;
  const tailWidth = 6;
  return lerp(headWidth, tailWidth, i / (NUM_SEGMENTS - 1));
}

function drawSnakeBody() {
  ctx.save();
  ctx.beginPath();
  // Left side
  for (let i = 0; i < segments.length; i++) {
    let seg = segments[i];
    let angle = seg.angle - Math.PI/2;
    let width = getWidthAtSegment(i);
    let x = seg.x + Math.cos(angle) * width;
    let y = seg.y + Math.sin(angle) * width;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  // Right side (reverse)
  for (let i = segments.length-1; i >= 0; i--) {
    let seg = segments[i];
    let angle = seg.angle + Math.PI/2;
    let width = getWidthAtSegment(i);
    let x = seg.x + Math.cos(angle) * width;
    let y = seg.y + Math.sin(angle) * width;
    ctx.lineTo(x, y);
  }
  ctx.closePath();

  // Fill body color (gradient brown)
  let grad = ctx.createLinearGradient(segments[0].x, segments[0].y, segments[segments.length-1].x, segments[segments.length-1].y);
  grad.addColorStop(0, '#89683e');
  grad.addColorStop(1, '#3b230c');
  ctx.fillStyle = grad;
  ctx.shadowColor = '#a37b45';
  ctx.shadowBlur = 20;
  ctx.fill();

  // Outline
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#241808';
  ctx.lineWidth = 3.2;
  ctx.stroke();
  ctx.restore();
}

function drawSnakeHead() {
  // Head is at segments[0]
  const head = segments[0];
  const angle = head.angle;
  ctx.save();
  ctx.translate(head.x, head.y);
  ctx.rotate(angle);
  // Draw big flat snake head
  ctx.beginPath();
  ctx.ellipse(0, 0, 18, 14, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#6d4a1b';
  ctx.shadowColor = '#8e7041';
  ctx.shadowBlur = 10;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#3b230c';
  ctx.lineWidth = 3.5;
  ctx.stroke();

  // Eyes
  ctx.beginPath();
  ctx.arc(6, -4, 2.7, 0, Math.PI * 2);
  ctx.arc(6, 4, 2.7, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(6.7, -4, 1.2, 0, Math.PI * 2);
  ctx.arc(6.7, 4, 1.2, 0, Math.PI * 2);
  ctx.fillStyle = '#000';
  ctx.fill();

  // (Optional) Tongue
  ctx.strokeStyle = '#ff3344';
  ctx.lineWidth = 2.1;
  ctx.beginPath();
  ctx.moveTo(18, 0);
  ctx.lineTo(26, -2);
  ctx.moveTo(18, 0);
  ctx.lineTo(26, 2);
  ctx.stroke();
  ctx.restore();
}

function drawWigglingTongue(time) {
  const head = segments[0];
  const angle = head.angle;

  // Tongue parameters
  const baseX = head.x + Math.cos(angle) * 18;
  const baseY = head.y + Math.sin(angle) * 18;
  const len = 44; // tongue length
  // Animate a wavy path (3 points: base, middle, tip)
  const waveFreq = 0.012;
  const waveAmp = 7;
  const t = time * waveFreq;

  const midLen = len * 0.55;
  const tipLen = len;
  const midAngle = angle + Math.sin(t) * 0.24;
  const tipAngle = angle + Math.sin(t + 1.5) * 0.44;

  const midX = baseX + Math.cos(midAngle) * midLen;
  const midY = baseY + Math.sin(midAngle) * midLen;
  const tipX = baseX + Math.cos(tipAngle) * tipLen;
  const tipY = baseY + Math.sin(tipAngle) * tipLen;

  // Forks
  const forkSpread = 11 + Math.sin(t * 1.6) * 3;
  const leftForkAngle = tipAngle - 0.24;
  const rightForkAngle = tipAngle + 0.24;
  const forkLen = 14;
  const leftForkX = tipX + Math.cos(leftForkAngle) * forkLen;
  const leftForkY = tipY + Math.sin(leftForkAngle) * forkLen;
  const rightForkX = tipX + Math.cos(rightForkAngle) * forkLen;
  const rightForkY = tipY + Math.sin(rightForkAngle) * forkLen;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalAlpha = 0.95;
  ctx.shadowBlur = flashActive ? 15 : 0;
  ctx.shadowColor = flashActive ? (typeof getCurrentPatchColor() === 'string' ? getCurrentPatchColor() : '#fff') : 'transparent';

  // Color
  let tongueColor = flashActive ? getCurrentPatchColor() : '#ff3344';
  ctx.strokeStyle = tongueColor;
  ctx.lineWidth = 3.2;

  // Main tongue (bezier for wiggle)
  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  ctx.quadraticCurveTo(midX, midY, tipX, tipY);
  ctx.stroke();

  // Forks
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(leftForkX, leftForkY);
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(rightForkX, rightForkY);
  ctx.lineWidth = 2.1;
  ctx.stroke();
  ctx.restore();
}

function drawSnakePatches(time) {
  // Draw spots/patches (brown, but neon when flashActive)
  for (let i = 2; i < segments.length - 1; i += 2) {
    let seg = segments[i];
    let width = getWidthAtSegment(i) * 0.7;
    let angle = seg.angle;
    // Wobble patches a bit for organic feel
    let dx = Math.cos(time/700 + i) * width * 0.25;
    let dy = Math.sin(time/770 + i) * width * 0.2;
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(seg.x + dx, seg.y + dy, width*0.7, width*0.45, angle, 0, Math.PI * 2);
    if (flashActive) {
      let patchColor = getCurrentPatchColor();
      ctx.shadowColor = typeof patchColor === 'string' ? patchColor : '#fff';
      ctx.shadowBlur = 12;
      ctx.fillStyle = patchColor;
    } else {
      ctx.shadowBlur = 0;
      ctx.fillStyle = PATCH_BASE_COLORS[i % PATCH_BASE_COLORS.length];
    }
    ctx.globalAlpha = 0.83;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}

function animate(time) {
  // Move head towards mouse
  segments[0].x += (mouse.x - segments[0].x) * 0.25;
  segments[0].y += (mouse.y - segments[0].y) * 0.25;

  // Each segment follows previous
  for (let i = 1; i < segments.length; i++) {
    const prev = segments[i - 1];
    const seg = segments[i];
    const dx = prev.x - seg.x;
    const dy = prev.y - seg.y;
    seg.angle = Math.atan2(dy, dx);
    seg.x = prev.x - Math.cos(seg.angle) * SEGMENT_LENGTH;
    seg.y = prev.y - Math.sin(seg.angle) * SEGMENT_LENGTH;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawSnakeBody();
  drawSnakePatches(time);
  drawWigglingTongue(time);
  drawSnakeHead();

  requestAnimationFrame(animate);
}

animate(performance.now());

