import React, { useEffect, useRef } from 'react';

export default function BackgroundCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let W = 0, H = 0;
    const mouse = { x: -9999, y: -9999, vx: 0, vy: 0 };
    const ripples = [], streaks = [];
    let prevSpeed = 0, t = 0;

    const COLS = 20, ROWS = 13;
    let nodes = [];

    // ── 3D rotating wireframe shapes ──
    const SHAPE_DEFS = [
      { type: 'octa',  col: 'rgba(26,86,219,',   scale: 52, rx: 0.003, ry: 0.005, rz: 0.002 },
      { type: 'cube',  col: 'rgba(59,130,246,',  scale: 38, rx: 0.006, ry: 0.003, rz: 0.004 },
      { type: 'tetra', col: 'rgba(139,92,246,',  scale: 34, rx: 0.004, ry: 0.007, rz: 0.003 },
      { type: 'octa',  col: 'rgba(99,102,241,',  scale: 28, rx: 0.007, ry: 0.002, rz: 0.006 },
      { type: 'cube',  col: 'rgba(16,185,129,',  scale: 22, rx: 0.005, ry: 0.006, rz: 0.002 },
    ];

    const SHAPES = SHAPE_DEFS.map(def => ({
      ...def,
      x: Math.random() * 800, y: Math.random() * 600,
      vx: (Math.random() - .5) * .18, vy: (Math.random() - .5) * .14,
      ax: Math.random() * Math.PI * 2, ay: Math.random() * Math.PI * 2, az: Math.random() * Math.PI * 2,
      phase: Math.random() * Math.PI * 2, speed: 0.0003 + Math.random() * .0003
    }));

    function buildGrid() {
      nodes = [];
      for (let r = 0; r <= ROWS; r++) {
        for (let c = 0; c <= COLS; c++) {
          nodes.push({
            ox: (c / COLS) * W,
            oy: (r / ROWS) * H,
            x: (c / COLS) * W,
            y: (r / ROWS) * H,
            vx: 0,
            vy: 0,
            phase: Math.random() * Math.PI * 2
          });
        }
      }
    }

    function resize() {
      if (!canvas) return;
      W = canvas.width = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
      buildGrid();
      if (W > 100 && H > 100) {
        SHAPES.forEach(s => {
          if (s.x < 0 || s.x > W || s.y < 0 || s.y > H) {
            s.x = 50 + Math.random() * (W - 100);
            s.y = 50 + Math.random() * (H - 100);
          }
        });
      }
    }

    // Raw 3D vertices for each primitive
    function octaVerts(s) { const h = s * 1.414; return [[0, h, 0], [s, 0, s], [s, 0, -s], [-s, 0, -s], [-s, 0, s], [0, -h, 0]]; }
    function octaEdges() { return [[0, 1], [0, 2], [0, 3], [0, 4], [1, 2], [2, 3], [3, 4], [4, 1], [5, 1], [5, 2], [5, 3], [5, 4]]; }
    function cubeVerts(s) { return [[-s, -s, -s], [s, -s, -s], [s, s, -s], [-s, s, -s], [-s, -s, s], [s, -s, s], [s, s, s], [-s, s, s]]; }
    function cubeEdges() { return [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]]; }
    function tetraVerts(s) { const h = s * 0.816; return [[0, s, 0], [s * 0.943, -h / 2, s * 0.333], [-s * 0.943, -h / 2, s * 0.333], [0, -h / 2, -s * 0.667]]; }
    function tetraEdges() { return [[0, 1], [0, 2], [0, 3], [1, 2], [2, 3], [3, 1]]; }

    function rot3(p, ax, ay, az) {
      let [x, y, z] = p;
      let y2 = y * Math.cos(ax) - z * Math.sin(ax), z2 = y * Math.sin(ax) + z * Math.cos(ax);
      [y, z] = [y2, z2];
      let x2 = x * Math.cos(ay) + z * Math.sin(ay), z3 = -x * Math.sin(ay) + z * Math.cos(ay);
      [x, z] = [x2, z3];
      let x3 = x * Math.cos(az) - y * Math.sin(az), y3 = x * Math.sin(az) + y * Math.cos(az);
      return [x3, y3, z];
    }

    function project(p3, cx, cy, fov = 320) {
      const [x, y, z] = p3;
      const scale = fov / (fov + z);
      return [cx + x * scale, cy - y * scale];
    }

    function drawShape(shape) {
      const breathe = 1 + .04 * Math.sin(t * shape.speed * 5000 + shape.phase);
      const s = shape.scale * breathe;

      let verts, edges;
      if (shape.type === 'octa') { verts = octaVerts(s); edges = octaEdges(); }
      else if (shape.type === 'cube') { verts = cubeVerts(s); edges = cubeEdges(); }
      else { verts = tetraVerts(s); edges = tetraEdges(); }

      const rotated = verts.map(v => rot3(v, shape.ax, shape.ay, shape.az));
      const proj = rotated.map(v => project(v, shape.x, shape.y, 280));

      const a = .018 + .008 * Math.sin(t * shape.speed * 3000 + shape.phase);
      const gr = ctx.createRadialGradient(shape.x, shape.y, 0, shape.x, shape.y, s * 2.2);
      gr.addColorStop(0, shape.col + (a + .012) + ')');
      gr.addColorStop(1, shape.col + '0)');
      ctx.beginPath(); ctx.arc(shape.x, shape.y, s * 2.2, 0, Math.PI * 2);
      ctx.fillStyle = gr; ctx.fill();

      edges.forEach(([ai, bi]) => {
        const avgZ = (rotated[ai][2] + rotated[bi][2]) / (2 * s);
        const alpha = (.08 + (.22 * (avgZ + 1) / 2)).toFixed(3);
        ctx.beginPath();
        ctx.moveTo(proj[ai][0], proj[ai][1]);
        ctx.lineTo(proj[bi][0], proj[bi][1]);
        ctx.strokeStyle = shape.col + alpha + ')';
        ctx.lineWidth = 1 + avgZ * .5;
        ctx.stroke();
      });

      rotated.forEach((v, vi) => {
        if (v[2] > -s * .2) {
          ctx.beginPath();
          ctx.arc(proj[vi][0], proj[vi][1], 1.2, 0, Math.PI * 2);
          ctx.fillStyle = shape.col + '.4)';
          ctx.fill();
        }
      });
    }

    let animationFrameId;

    function draw() {
      if (!canvas) return;
      if (!W) { resize(); }
      ctx.clearRect(0, 0, W, H);
      const spd = Math.sqrt(mouse.vx * mouse.vx + mouse.vy * mouse.vy);
      prevSpeed = prevSpeed * .85 + spd * .15;

      SHAPES.forEach(shape => {
        if (mouse.x > -1000) {
          const dx = mouse.x - shape.x, dy = mouse.y - shape.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          const f = Math.min(.28, 90 / (d + 100));
          shape.vx += dx * f * .0004; shape.vy += dy * f * .0004;
        }
        shape.vx *= .97; shape.vy *= .97;
        shape.vx += (Math.random() - .5) * .022; shape.vy += (Math.random() - .5) * .018;
        shape.x += shape.vx; shape.y += shape.vy;

        if (shape.x < -shape.scale * 3) shape.x = W + shape.scale * 3;
        if (shape.x > W + shape.scale * 3) shape.x = -shape.scale * 3;
        if (shape.y < -shape.scale * 3) shape.y = H + shape.scale * 3;
        if (shape.y > H + shape.scale * 3) shape.y = -shape.scale * 3;

        const spinBoost = 1 + prevSpeed * .035;
        shape.ax += shape.rx * spinBoost;
        shape.ay += shape.ry * spinBoost;
        shape.az += shape.rz * spinBoost;
        drawShape(shape);
      });

      const WC = COLS + 1;
      nodes.forEach(n => {
        if (mouse.x > -9000) {
          const dx = mouse.x - n.ox, dy = mouse.y - n.oy;
          const d = Math.sqrt(dx * dx + dy * dy);
          const inf = Math.exp(-d * d / (2 * 155 * 155));
          n.tx = n.ox - dx * .08 * inf + mouse.vx * .11 * inf + Math.sin(t * .015 + n.phase) * 3;
          n.ty = n.oy - dy * .08 * inf + mouse.vy * .11 * inf + Math.cos(t * .013 + n.phase * 1.3) * 3;
        } else {
          n.tx = n.ox + Math.sin(t * .015 + n.phase) * 3;
          n.ty = n.oy + Math.cos(t * .013 + n.phase * 1.3) * 3;
        }
        n.x += (n.tx - n.x) * .08; n.y += (n.ty - n.y) * .08;
      });

      ctx.lineWidth = .4;
      for (let r = 0; r <= ROWS; r++) {
        for (let c = 0; c <= COLS; c++) {
          const n = nodes[r * WC + c];
          if (c < COLS) {
            const nr = nodes[r * WC + c + 1];
            const mdx = (n.x + nr.x) / 2 - (mouse.x || W / 2), mdy = (n.y + nr.y) / 2 - (mouse.y || H / 2);
            const prox = Math.exp(-(mdx * mdx + mdy * mdy) / (2 * 190 * 190));
            ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(nr.x, nr.y);
            ctx.strokeStyle = `rgba(26,86,219,${(.055 + prox * .18).toFixed(3)})`; ctx.stroke();
          }
          if (r < ROWS) {
            const nb = nodes[(r + 1) * WC + c];
            const mdx = (n.x + nb.x) / 2 - (mouse.x || W / 2), mdy = (n.y + nb.y) / 2 - (mouse.y || H / 2);
            const prox = Math.exp(-(mdx * mdx + mdy * mdy) / (2 * 190 * 190));
            ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(nb.x, nb.y);
            ctx.strokeStyle = `rgba(26,86,219,${(.055 + prox * .18).toFixed(3)})`; ctx.stroke();
          }
        }
      }

      if (mouse.x > -9000) {
        const hr = 100 + prevSpeed * 2.8;
        const hg = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, hr);
        hg.addColorStop(0, 'rgba(59,130,246,0.17)');
        hg.addColorStop(.45, 'rgba(26,86,219,0.07)');
        hg.addColorStop(1, 'rgba(17,68,160,0)');
        ctx.beginPath(); ctx.arc(mouse.x, mouse.y, hr, 0, Math.PI * 2);
        ctx.fillStyle = hg; ctx.fill();
        ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(59,130,246,0.55)'; ctx.fill();
        if (prevSpeed > 5.5) ripples.push({ x: mouse.x, y: mouse.y, r: 0, maxR: 55 + prevSpeed * 1.8, life: 1 });
      }

      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.r += (rp.maxR - rp.r) * .065; rp.life -= .038;
        if (rp.life <= 0) { ripples.splice(i, 1); continue; }
        ctx.beginPath(); ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(59,130,246,${(rp.life * .32).toFixed(3)})`;
        ctx.lineWidth = 1.2; ctx.stroke();
      }

      if (spd > 3.5 && mouse.x > -9000) {
        streaks.push({ x: mouse.x, y: mouse.y, dx: -mouse.vx, dy: -mouse.vy, len: spd * 3.2, life: 1, w: Math.min(spd * .14, 1.8) });
      }
      for (let i = streaks.length - 1; i >= 0; i--) {
        const s = streaks[i]; s.life -= .08;
        if (s.life <= 0) { streaks.splice(i, 1); continue; }
        ctx.beginPath(); ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x + s.dx * (s.len / (spd || 1) + 1) * s.life, s.y + s.dy * (s.len / (spd || 1) + 1) * s.life);
        ctx.strokeStyle = `rgba(147,197,253,${(s.life * .45).toFixed(3)})`;
        ctx.lineWidth = s.w * s.life; ctx.lineCap = 'round'; ctx.stroke();
      }

      t++;
      animationFrameId = requestAnimationFrame(draw);
    }

    const handleMouseMove = (e) => {
      if (!canvas) return;
      const r = canvas.getBoundingClientRect();
      const mx = e.clientX - r.left, my = e.clientY - r.top;
      mouse.vx = mx - mouse.x; mouse.vy = my - mouse.y;
      mouse.x = mx; mouse.y = my;
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);

    resize();
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1
      }}
    />
  );
}
