const canvas = document.getElementById('reptile-canvas');
const ctx = canvas.getContext('2d');

const NUM_SEGMENTS = 24;  // Number of "bones"
const SEGMENT_LENGTH = 20;
const legsLength = 18;
const segments = [];

// Initialize segments
for (let i = 0; i < NUM_SEGMENTS; i++) {
  segments.push({ x: canvas.width / 2, y: canvas.height / 2, angle: 0 });
}

let mouse = { x: canvas.width / 2, y: canvas.height / 2 };

// Listen for mouse movement
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
});

function drawLegs(x, y, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  ctx.strokeStyle = '#aaa';
  ctx.lineWidth = 2;
  // Draw left leg
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-legsLength, -8);
  ctx.moveTo(-legsLength, -8);
  ctx.lineTo(-legsLength + 5, -15);
  ctx.moveTo(-legsLength, -8);
  ctx.lineTo(-legsLength - 5, -15);
  ctx.stroke();

  // Draw right leg
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(legsLength, -8);
  ctx.moveTo(legsLength, -8);
  ctx.lineTo(legsLength + 5, -15);
  ctx.moveTo(legsLength, -8);
  ctx.lineTo(legsLength - 5, -15);
  ctx.stroke();

  ctx.restore();
}

function animate() {
  // Follow mouse with head segment
  segments[0].x += (mouse.x - segments[0].x) * 0.25;
  segments[0].y += (mouse.y - segments[0].y) * 0.25;

  // Each segment follows the previous one
  for (let i = 1; i < segments.length; i++) {
    const prev = segments[i - 1];
    const seg = segments[i];
    const dx = prev.x - seg.x;
    const dy = prev.y - seg.y;
    seg.angle = Math.atan2(dy, dx);
    seg.x = prev.x - Math.cos(seg.angle) * SEGMENT_LENGTH;
    seg.y = prev.y - Math.sin(seg.angle) * SEGMENT_LENGTH;
  }

  // Clear and draw
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = segments.length - 1; i >= 0; i--) {
    const seg = segments[i];

    // Draw body segment (circle)
    ctx.beginPath();
    ctx.arc(seg.x, seg.y, 8, 0, Math.PI * 2);
    ctx.strokeStyle = '#aaa';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw "legs" every few segments
    if (i % 3 === 0 && i !== 0) {
      drawLegs(seg.x, seg.y, seg.angle + Math.PI / 2);
    }
  }

  requestAnimationFrame(animate);
}

animate();
