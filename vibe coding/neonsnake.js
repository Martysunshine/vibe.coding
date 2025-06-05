let isWigglingTongue = false;
let tongueWiggleStart = 0; // for controlling wiggle time


const canvas = document.getElementById('reptile-canvas');
const ctx = canvas.getContext('2d');

const NUM_SEGMENTS = 40; // increased for smoother body
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
  isWigglingTongue = true;
  tongueWiggleStart = performance.now();
  colorIndex = (colorIndex + 1) % NEON_COLORS.length;
  flashActive = true;
  if (flashTimeout) clearTimeout(flashTimeout);
  flashTimeout = setTimeout(() => flashActive = false, 500);
});
canvas.addEventListener('mouseup', () => {
  isWigglingTongue = false;
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
  // More gradual neck/head profile
  const headMaxWidth = 27;
  const neckWidth = 12;
  const tailWidth = 6;
  // Use a bell-curve or cosine for smooth transition
  if (i < 10) {
    // Smooth transition: use cosine easing
    let t = i / 9; // 0 to 1
    return neckWidth + (headMaxWidth - neckWidth) * (1 - Math.cos(Math.PI * t)) / 2;
  }
  return lerp(headMaxWidth, tailWidth, (i - 10) / (NUM_SEGMENTS - 10));
}


//drawing code for smooth snake baby - # no diddy

// Returns an array of interpolated points along the Catmull-Rom spline through the control points
function catmullRomSpline(points, samplesPerSegment = 8) {
  const splinePoints = [];
  const n = points.length;

  for (let i = 0; i < n - 1; i++) {
    // For end points, duplicate first/last for proper tangents
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < n ? i + 2 : n - 1];

    for (let t = 0; t < samplesPerSegment; t++) {
      const s = t / samplesPerSegment;
      const s2 = s * s, s3 = s2 * s;
      // Catmull-Rom spline formula
      const x = 0.5 * (
        (2 * p1.x) +
        (-p0.x + p2.x) * s +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * s2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * s3
      );
      const y = 0.5 * (
        (2 * p1.y) +
        (-p0.y + p2.y) * s +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * s2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * s3
      );
      splinePoints.push({ x, y });
    }
  }
  // Ensure last point is included
  splinePoints.push({ x: points[n-1].x, y: points[n-1].y });
  return splinePoints;
}


function drawSmoothSnakeBody() {
  ctx.save();

  // 1. Generate Catmull-Rom spline points along the spine
  const centerPts = segments.map(seg => ({ x: seg.x, y: seg.y }));
  const spine = catmullRomSpline(centerPts, 12); // higher sampling for smoothness

  // 2. For each spine point, compute tangent & offset left/right for body width
  const leftPts = [];
  const rightPts = [];
  const head = segments[0];
  const blendSteps = 12; // More points for longer, smoother neck transition

  for (let i = 0; i < spine.length; i++) {
    // Easing for blend (cosine smoothstep)
    let t = i / blendSteps;
    let blend = (i < blendSteps) ? (1 - Math.cos(Math.PI * t)) / 2 : 0;

    let prev = spine[i > 0 ? i - 1 : i];
    let next = spine[i < spine.length - 1 ? i + 1 : i];
    let dx = next.x - prev.x;
    let dy = next.y - prev.y;
    let angle = Math.atan2(dy, dx);

    let segIdx = (i / (spine.length - 1)) * (segments.length - 1);
    let width = getWidthAtSegment(segIdx);

    // Taper the neck for a snake look
    let neckTaper = (i < blendSteps) ? lerp(width, 5, blend) : width; // adjust '5' for thinness

    // Left outline
    leftPts.push({
      x:
        (spine[i].x + Math.cos(angle - Math.PI / 2) * neckTaper) * (1 - blend) +
        (head.x - 8) * blend, // offset -8 for head's wide jaw
      y:
        (spine[i].y + Math.sin(angle - Math.PI / 2) * neckTaper) * (1 - blend) +
        head.y * blend,
    });

    // Right outline
    rightPts.push({
      x:
        (spine[i].x + Math.cos(angle + Math.PI / 2) * neckTaper) * (1 - blend) +
        (head.x - 8) * blend,
      y:
        (spine[i].y + Math.sin(angle + Math.PI / 2) * neckTaper) * (1 - blend) +
        head.y * blend,
    });
  }

  // 3. Draw the smooth outline
  ctx.beginPath();
  ctx.moveTo(leftPts[0].x, leftPts[0].y);
  for (let i = 1; i < leftPts.length; i++) {
    ctx.lineTo(leftPts[i].x, leftPts[i].y);
  }
  for (let i = rightPts.length - 1; i >= 0; i--) {
    ctx.lineTo(rightPts[i].x, rightPts[i].y);
  }
  ctx.closePath();

  // Gradient fill
  let grad = ctx.createLinearGradient(
    segments[0].x, segments[0].y,
    segments[segments.length - 1].x, segments[segments.length - 1].y
  );
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
  const head = segments[0];
  const angle = head.angle;
  ctx.save();
  ctx.translate(head.x - 8, head.y); // offset -8 for overlap with neck
  ctx.rotate(angle);

  // Pear shape (wider at base, rounder at tip)
  ctx.beginPath();
  ctx.ellipse(0, 0, 22, 18, 0, Math.PI * 0.25, Math.PI * 1.75, false); // wide jaw
  ctx.ellipse(7, 0, 22, 14, 0, Math.PI * 1.75, Math.PI * 0.25, false); // round front
  ctx.closePath();
  ctx.fillStyle = '#6d4a1b';
  ctx.shadowColor = '#8e7041';
  ctx.shadowBlur = 14;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#3b230c';
  ctx.lineWidth = 3.5;
  ctx.stroke();

  // Eyes (cute, as before)
  ctx.beginPath();
  ctx.arc(9, -5.7, 2.3, 0, Math.PI * 2);
  ctx.arc(9,  5.7, 2.3, 0, Math.PI * 2);
  ctx.fillStyle = '#111';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(10, -6.4, 0.7, 0, Math.PI * 2);
  ctx.arc(10,  4.7, 0.7, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();

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

function drawStaticTongue() {
  const head = segments[0];
  const angle = head.angle;

  const baseX = head.x + Math.cos(angle) * 18;
  const baseY = head.y + Math.sin(angle) * 18;
  const len = 44;

  // Middle and tip in a straight line
  const midLen = len * 0.55;
  const tipLen = len;
  const midAngle = angle;
  const tipAngle = angle;

  const midX = baseX + Math.cos(midAngle) * midLen;
  const midY = baseY + Math.sin(midAngle) * midLen;
  const tipX = baseX + Math.cos(tipAngle) * tipLen;
  const tipY = baseY + Math.sin(tipAngle) * tipLen;

  // Forks
  const forkSpread = 11;
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

  // Main tongue (straight)
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
  // Desired position: head should be 'tongue length' behind the mouse
  const TONGUE_LEN = 44; // must match your tongue length

  // Calculate angle from head to mouse
  let dx = mouse.x - segments[0].x;
  let dy = mouse.y - segments[0].y;
  let angleToMouse = Math.atan2(dy, dx);

  // Calculate target position for head so that tongue tip will be at mouse
  let targetX = mouse.x - Math.cos(angleToMouse) * TONGUE_LEN;
  let targetY = mouse.y - Math.sin(angleToMouse) * TONGUE_LEN;

  // Move head toward this target position
  segments[0].x += (targetX - segments[0].x) * 0.18;
  segments[0].y += (targetY - segments[0].y) * 0.18;

  // Update head angle based on where the tongue will go
  segments[0].angle = angleToMouse;

  // Each other segment follows the previous
  for (let i = 1; i < segments.length; i++) {
    let prev = segments[i - 1];
    let seg = segments[i];
    let dx = prev.x - seg.x;
    let dy = prev.y - seg.y;
    let dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 0) {
      seg.angle = Math.atan2(dy, dx);
      seg.x = prev.x - Math.cos(seg.angle) * SEGMENT_LENGTH;
      seg.y = prev.y - Math.sin(seg.angle) * SEGMENT_LENGTH;
    }
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawSmoothSnakeBody();
  drawSnakePatches(time);

  // Tongue logic (wiggle on click)
  if (isWigglingTongue) {
    drawWigglingTongue(time - tongueWiggleStart);
  } else {
    drawStaticTongue();
  }

  drawSnakeHead();

  requestAnimationFrame(animate);
}


animate(performance.now());
