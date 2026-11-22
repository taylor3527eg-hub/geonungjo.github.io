import { createStompboxAudio } from './audio.js?v=10a92e424b69';

/* Two-link planar dynamics, SI units. Angles are relative to the downward
   vertical; q2 is relative to q1. Gravity is assumed fully compensated.
   M(q) q'' + C(q,q')q' + B q' + K(q-q0) = J(q)^T F.
   These illustrative parameters are not a calibrated model of a real robot. */
export function initRoboticStompbox(root) {
  'use strict';
  if (!root) throw new Error('Robotic Stompbox needs a container element.');
  const eventController = new AbortController();
  function listen(target, type, handler) {
    target.addEventListener(type, handler, { signal: eventController.signal });
  }

  const canvas = root.querySelector('[data-scene]');
  if (!canvas) throw new Error('Robotic Stompbox canvas is missing.');
  const ctx = canvas.getContext('2d');
  const forceMeter = root.querySelector('[data-force-meter]');
  const forceFill = root.querySelector('[data-force-fill]');
  // Read the supplied transparent atlases directly; source artwork is unchanged.
  const artwork = { parts: new Image(), notes: new Image() };
  artwork.parts.src = new URL('./assets/parts.png', import.meta.url).href;
  artwork.notes.src = new URL('./assets/notes.png', import.meta.url).href;
  const sprites = Object.freeze({
    guitar: { x: 8, y: 100, w: 425, h: 818, pivot: { x: 220, y: 705 } },
    pedal: { x: 449, y: 424, w: 306, h: 384, pivot: { x: 604, y: 706 } },
    thigh: { x: 763, y: 392, w: 320, h: 426, a: { x: 1000, y: 420 }, b: { x: 795, y: 790 } },
    shin: { x: 1079, y: 515, w: 153, h: 324, a: { x: 1130, y: 540 }, b: { x: 1170, y: 810 } },
    hip: { x: 1256, y: 408, w: 221, h: 235, pivot: { x: 1366, y: 525 } },
    knee: { x: 1284, y: 661, w: 178, h: 154, pivot: { x: 1373, y: 738 } },
  });
  const noteSprites = [
    { x: 185, y: 129, w: 346, h: 464 },
    { x: 716, y: 116, w: 493, h: 482 },
  ];
  const P = Object.freeze({
    l1: 0.86, l2: 0.78, m1: 2.0, m2: 1.35,
    rest: [-0.55, 1.05], radius: 0.63, forceGain: 22, maxForce: 32, footWidth: 15,
    step: 1 / 240,
  });
  // K and B are common joint-space constants, not a damping ratio.
  // Total mass scales both link masses and inertias at a fixed mass ratio.
  const defaults = Object.freeze({ stiffness: 18, damping: 2.4, mass: 3.35 });
  const parameters = { ...defaults };
  let sound;
  // Pedal bearing from the hip: 0° is vertically down; negative is left.
  const pedalAngle = -55 * Math.PI / 180;
  const parameterControls = Object.keys(defaults).map(name => ({
    name, input: root.querySelector(`[data-parameter="${name}"]`),
  }));
  function updateParameters() {
    for (const { name, input } of parameterControls) {
      const value = Math.max(Number(input.min), Math.min(Number(input.max), Number(input.value)));
      parameters[name] = Number.isFinite(value) ? value : defaults[name];
      input.setAttribute('aria-valuetext', String(parameters[name]));
    }
    sound?.setParameters(parameters);
  }
  const state = { q: [...P.rest], dq: [0, 0], force: { x: 0, y: 0 } };
  const fx = { on: false, pressed: false, releaseTime: 0, emissionTime: 0, notes: [] };
  const pointer = { inside: false, x: 0, y: 0, vx: 0, vy: 0, time: 0 };
  const keys = new Set();
  const view = { width: 1000, height: 560, scale: 205, unit: 1, hip: { x: 480, y: 135 } };
  let lastFrame = 0, accumulator = 0, animationFrame = 0;
  let forceLevel = 0;
  let destroyed = false;

  function joints(q = state.q) {
    const a = q[0], b = a + q[1];
    const knee = { x: P.l1 * Math.sin(a), y: P.l1 * Math.cos(a) };
    return { knee, ankle: { x: knee.x + P.l2 * Math.sin(b), y: knee.y + P.l2 * Math.cos(b) } };
  }
  function screen(p) { return { x: view.hip.x + p.x * view.scale, y: view.hip.y + p.y * view.scale }; }
  function visualUnit() { return view.unit; }
  function footTip(q = state.q) {
    const ankle = screen(joints(q).ankle);
    const length = 35 * visualUnit();
    const angle = q[0] + q[1];
    return { x: ankle.x - length * Math.cos(angle), y: ankle.y + length * Math.sin(angle) };
  }
  function resetInput() {
    pointer.inside = false; pointer.vx = pointer.vy = 0; pointer.time = 0; keys.clear();
    sound?.setForce(0);
  }
  function reset() {
    state.q = [...P.rest]; state.dq = [0, 0]; state.force = { x: 0, y: 0 };
    accumulator = 0; resetInput();
    fx.pressed = false; fx.releaseTime = 0;
  }
  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    view.width = rect.width; view.height = rect.height;
    // Presentation zoom scales geometry and hit areas together, in screen space.
    const requestedZoom = Number(root.dataset?.sceneZoom ?? 1);
    const zoom = Number.isFinite(requestedZoom) && requestedZoom > 0 ? requestedZoom : 1;
    const baseScale = Math.min(rect.width / 4.8, rect.height / 2.65);
    view.scale = baseScale * zoom;
    view.unit = Math.max(0.7, baseScale / 205) * zoom;
    const sceneOffsetY = Math.min(34, Math.max(0, (rect.width - 260) * 0.16));
    view.hip = { x: rect.width * 0.5, y: rect.height * 0.22 - sceneOffsetY };
    const guitar = guitarPosition();
    const guitarUnit = visualUnit();
    root.style.setProperty('--guitar-y', `${guitar.y}px`);
    root.style.setProperty('--controls-x', `${guitar.x + 64 * guitarUnit + 32}px`);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    resetInput();
  }

  function movePointer(event) {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left - view.hip.x) / view.scale;
    const y = (event.clientY - rect.top - view.hip.y) / view.scale;
    const now = performance.now();
    const dt = (now - pointer.time) / 1000;
    // A new entry establishes position only: no force from a cursor teleport.
    if (pointer.inside && dt > 0.001 && dt < 0.12) {
      let vx = (x - pointer.x) / dt, vy = (y - pointer.y) / dt;
      const speed = Math.hypot(vx, vy);
      if (speed > 5) { vx *= 5 / speed; vy *= 5 / speed; }
      const blend = 1 - Math.exp(-dt / 0.018);
      pointer.vx += (vx - pointer.vx) * blend;
      pointer.vy += (vy - pointer.vy) * blend;
    } else { pointer.vx = pointer.vy = 0; }
    pointer.x = x; pointer.y = y; pointer.time = now; pointer.inside = true;
  }

  function externalForce(now) {
    const ankle = joints().ankle;
    let x = 0, y = 0;
    if (pointer.inside) {
      const r = Math.min(1, Math.hypot(pointer.x - ankle.x, pointer.y - ankle.y) / P.radius);
      const weight = 1 - r * r * (3 - 2 * r);
      // Stop a stationary cursor applying a permanent force after its last event.
      const freshness = Math.exp(-Math.max(0, now - pointer.time - 18) / 28);
      x = pointer.vx * P.forceGain * weight * freshness;
      y = pointer.vy * P.forceGain * weight * freshness;
    }
    // Accessible alternative applies the same force at the same ankle point.
    x += (Number(keys.has('ArrowRight')) - Number(keys.has('ArrowLeft'))) * 18;
    y += (Number(keys.has('ArrowDown')) - Number(keys.has('ArrowUp'))) * 18;
    const magnitude = Math.hypot(x, y);
    if (magnitude > P.maxForce) { x *= P.maxForce / magnitude; y *= P.maxForce / magnitude; }
    return { x, y };
  }

  function updateForceGauge(elapsed) {
    if (!forceMeter || !forceFill) return;
    const target = Math.min(1, Math.hypot(state.force.x, state.force.y) / P.maxForce);
    // A quick rise and gentle fall keep this small indicator readable.
    const response = target > forceLevel ? 0.035 : 0.12;
    forceLevel += (target - forceLevel) * (1 - Math.exp(-elapsed / response));
    if (target === 0 && forceLevel < 0.002) forceLevel = 0;
    forceFill.style.transform = `scaleX(${forceLevel.toFixed(3)})`;
    forceMeter.setAttribute('aria-valuenow', forceLevel.toFixed(2));
  }

  function integrate(dt, force) {
    const [q1, q2] = state.q, [v1, v2] = state.dq;
    const { l1, l2 } = P;
    const massScale = parameters.mass / (P.m1 + P.m2);
    const m1 = P.m1 * massScale, m2 = P.m2 * massScale;
    const c1 = l1 / 2, c2 = l2 / 2;
    const i1 = m1 * l1 * l1 / 12, i2 = m2 * l2 * l2 / 12;
    const coupling = m2 * l1 * c2;
    const m11 = i1 + i2 + m1 * c1 * c1 + m2 * (l1 * l1 + c2 * c2 + 2 * l1 * c2 * Math.cos(q2));
    const m12 = i2 + m2 * (c2 * c2 + l1 * c2 * Math.cos(q2));
    const m22 = i2 + m2 * c2 * c2;
    const h = coupling * Math.sin(q2);
    const coriolis = [-h * (2 * v1 * v2 + v2 * v2), h * v1 * v1];
    const s = Math.sin(q1 + q2), c = Math.cos(q1 + q2);
    const torque = [
      (l1 * Math.cos(q1) + l2 * c) * force.x - (l1 * Math.sin(q1) + l2 * s) * force.y,
      l2 * c * force.x - l2 * s * force.y,
    ];
    const rhs = torque.map((t, i) => t - coriolis[i] - parameters.damping * state.dq[i] - parameters.stiffness * (state.q[i] - P.rest[i]));
    // Treat viscous damping implicitly: (M + dt B) Δv = dt (τ - Cv - Bv - Ke).
    // This remains stable for high damping and low mass within the slider range.
    const a11 = m11 + dt * parameters.damping, a22 = m22 + dt * parameters.damping;
    const det = a11 * a22 - m12 * m12;
    const acceleration = [(a22 * rhs[0] - m12 * rhs[1]) / det, (a11 * rhs[1] - m12 * rhs[0]) / det];
    // Fixed-step semi-implicit position update, independent of display rate.
    for (let i = 0; i < 2; i++) {
      state.dq[i] += acceleration[i] * dt;
      state.q[i] += state.dq[i] * dt;
    }
    // Inelastic joint stops prevent implausible self-folding under repeated pushes.
    const limits = [[-1.55, 1.55], [0.10, 2.65]];
    for (let i = 0; i < 2; i++) {
      if (state.q[i] < limits[i][0]) { state.q[i] = limits[i][0]; state.dq[i] = Math.max(0, state.dq[i]); }
      if (state.q[i] > limits[i][1]) { state.q[i] = limits[i][1]; state.dq[i] = Math.min(0, state.dq[i]); }
    }
    if (![...state.q, ...state.dq].every(Number.isFinite)) reset();
  }

  function line(a, b, color, width, dash = []) {
    ctx.beginPath(); ctx.setLineDash(dash); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke(); ctx.setLineDash([]);
  }
  function circle(p, radius, fill, stroke, width = 1) {
    ctx.beginPath(); ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
  }
  function drawSprite(sprite, position, scale) {
    if (!artwork.parts.complete || !artwork.parts.naturalWidth) return;
    ctx.drawImage(artwork.parts, sprite.x, sprite.y, sprite.w, sprite.h,
      position.x + (sprite.x - sprite.pivot.x) * scale,
      position.y + (sprite.y - sprite.pivot.y) * scale,
      sprite.w * scale, sprite.h * scale);
  }
  function drawLink(sprite, a, b) {
    if (!artwork.parts.complete || !artwork.parts.naturalWidth) return;
    const sourceAngle = Math.atan2(sprite.b.y - sprite.a.y, sprite.b.x - sprite.a.x);
    const targetAngle = Math.atan2(b.y - a.y, b.x - a.x);
    const scale = Math.hypot(b.x - a.x, b.y - a.y) / Math.hypot(sprite.b.x - sprite.a.x, sprite.b.y - sprite.a.y);
    ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(targetAngle - sourceAngle); ctx.scale(scale, scale);
    ctx.drawImage(artwork.parts, sprite.x, sprite.y, sprite.w, sprite.h,
      sprite.x - sprite.a.x, sprite.y - sprite.a.y, sprite.w, sprite.h);
    ctx.restore();
  }
  function radialPosition(angle) {
    const restTip = footTip(P.rest);
    const radius = Math.hypot(restTip.x - view.hip.x, restTip.y - view.hip.y);
    return {
      x: view.hip.x + radius * Math.sin(angle),
      y: view.hip.y + radius * Math.cos(angle),
    };
  }
  function guitarPosition(inset = 0.50) {
    const position = radialPosition(-pedalAngle);
    return { x: position.x - inset * view.scale, y: position.y };
  }
  function footSegment() {
    return { ankle: screen(joints().ankle), toe: footTip() };
  }
  function distanceToSegment(point, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const lengthSquared = dx * dx + dy * dy;
    const t = lengthSquared ? Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared)) : 0;
    return Math.hypot(point.x - a.x - t * dx, point.y - a.y - t * dy);
  }
  function spawnNote() {
    if (fx.notes.length >= 6) return;
    const side = Math.random() < 0.5 ? -1 : 1;
    fx.notes.push({
      x: side * (35 + Math.random() * 27), y: -125 + Math.random() * 55,
      vx: side * (3 + Math.random() * 7), vy: 28 + Math.random() * 20,
      age: 0, life: 2.6 + Math.random() * 0.8, opacity: 1,
      size: 17 + Math.random() * 8, angle: (Math.random() - 0.5) * 0.35,
      phase: Math.random() * Math.PI * 2, sprite: Math.floor(Math.random() * noteSprites.length),
    });
  }
  function toggleEffect() {
    fx.on = !fx.on; fx.emissionTime = 0;
    if (fx.on) for (let i = 0; i < 2; i++) spawnNote();
    sound?.setPedal(fx.on);
  }
  function updatePedalContact(previous, dt) {
    const target = radialPosition(pedalAngle);
    const current = footSegment();
    const u = visualUnit();
    const distance = distanceToSegment(target, current.ankle, current.toe);
    // Include the swept endpoints so a quick pass cannot skip the switch.
    const sweptDistance = Math.min(distance,
      distanceToSegment(target, previous.toe, current.toe),
      distanceToSegment(target, previous.ankle, current.ankle));
    const touching = sweptDistance <= (10 + P.footWidth / 2) * u;
    if (!fx.pressed && touching) {
      fx.pressed = true; fx.releaseTime = 0;
      toggleEffect();
    } else if (fx.pressed) {
      // A larger release radius and a brief clear interval avoid contact chatter.
      fx.releaseTime = !touching && distance > (18 + P.footWidth / 2) * u ? fx.releaseTime + dt : 0;
      if (fx.releaseTime >= 0.10) { fx.pressed = false; fx.releaseTime = 0; }
    }
  }
  function updateEffects(dt) {
    if (fx.on) {
      fx.emissionTime += dt;
      while (fx.emissionTime >= 0.60) { spawnNote(); fx.emissionTime -= 0.60; }
    }
    for (const note of fx.notes) {
      note.age += dt;
      note.x += note.vx * dt; note.y += note.vy * dt;
      note.vy += 13 * dt; // Positive canvas y is downward: the notes fall.
      if (!fx.on) note.opacity *= Math.exp(-dt / 0.20);
    }
    fx.notes = fx.notes.filter(note => note.age < note.life && note.opacity > 0.015);
  }
  function drawNotes() {
    if (!artwork.notes.complete || !artwork.notes.naturalWidth) return;
    const target = guitarPosition();
    const u = visualUnit();
    ctx.save(); ctx.translate(target.x, target.y); ctx.scale(u, u);
    for (const note of fx.notes) {
      const fadeIn = Math.min(1, note.age / 0.12);
      const fadeOut = Math.min(1, (note.life - note.age) / 0.65);
      ctx.save();
      ctx.globalAlpha = fadeIn * fadeOut * note.opacity * 0.9;
      ctx.translate(note.x + Math.sin(note.age * 2 + note.phase) * 5, note.y);
      ctx.rotate(note.angle + Math.sin(note.age * 1.5 + note.phase) * 0.15);
      const sprite = noteSprites[note.sprite];
      const height = note.size * 1.25, width = height * sprite.w / sprite.h;
      ctx.drawImage(artwork.notes, sprite.x, sprite.y, sprite.w, sprite.h,
        -width / 2, -height / 2, width, height);
      ctx.restore();
    }
    ctx.restore();
  }
  function drawPedal() {
    const target = radialPosition(pedalAngle);
    const u = visualUnit();
    // The sprite's white footswitch is anchored at the collision target.
    // It stays static; only the red LED changes when the effect is toggled.
    drawSprite(sprites.pedal, target, 0.25 * u);
    const led = { x: target.x, y: target.y - 20 * u };
    ctx.save();
    if (fx.on) {
      circle(led, 8 * u, '#ff233329');
      ctx.shadowColor = '#ff172c'; ctx.shadowBlur = 17 * u;
    }
    circle(led, 3.6 * u, fx.on ? '#ff263d' : '#681b22', '#3f161b', 0.7 * u);
    if (fx.on) {
      ctx.shadowBlur = 0;
      circle({ x: led.x - u, y: led.y - u }, 1.2 * u, '#ffd5d6');
    }
    ctx.restore();
    ctx.save();
    ctx.translate(target.x, target.y - 82 * u); ctx.rotate(-0.08);
    ctx.font = `${22 * u}px "Segoe Print", "Comic Sans MS", cursive`;
    ctx.textAlign = 'center'; ctx.fillStyle = fx.on ? '#d62b36' : '#243b31';
    ctx.fillText(fx.on ? 'ON!' : 'OFF', 0, 0);
    ctx.restore();
  }
  function drawGuitar() {
    const target = guitarPosition();
    const u = visualUnit();
    drawSprite(sprites.guitar, target, 0.23 * u);
  }
  function draw() {
    const { width, height, hip, scale } = view;
    ctx.clearRect(0, 0, width, height);
    const pose = joints(), knee = screen(pose.knee), ankle = screen(pose.ankle);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // This is the actual force radius, following the ankle; it never drives motion.
    if (pointer.inside || keys.size) {
      ctx.save(); ctx.setLineDash([3 * visualUnit(), 5 * visualUnit()]);
      circle(ankle, P.radius * view.scale, null, '#8b9d8059', 1);
      ctx.restore();
    }
    drawPedal();
    drawGuitar();
    drawNotes();

    const unit = visualUnit();
    drawLink(sprites.thigh, hip, knee);
    drawLink(sprites.shin, knee, ankle);
    // Clear the link outlines behind the transparent joint centers.
    circle(hip, 21 * unit, '#ffffff');
    circle(knee, 17 * unit, '#ffffff');
    drawSprite(sprites.hip, hip, 0.24 * unit);
    drawSprite(sprites.knee, knee, 0.25 * unit);
    const toe = footTip();
    line(ankle, toe, '#080909', P.footWidth * unit);
    circle(ankle, 13 * unit, '#e6753e', '#ffffff', 3 * unit);
    circle(ankle, 4 * unit, '#ffffff');
    ctx.save();
    const labelX = ankle.x + 90 * unit < width ? ankle.x + 23 * unit : ankle.x - 82 * unit;
    ctx.translate(labelX, ankle.y + 7 * unit); ctx.rotate(-0.10);
    ctx.font = `${20 * unit}px "Segoe Print", "Comic Sans MS", cursive`;
    ctx.fillStyle = '#243b31'; ctx.textAlign = 'left'; ctx.fillText('Push!', 0, 0);
    ctx.restore();
  }

  function frame(now) {
    if (destroyed) return;
    const elapsed = lastFrame ? Math.min((now - lastFrame) / 1000, 0.05) : 0;
    lastFrame = now; accumulator += elapsed;
    state.force = externalForce(now);
    while (accumulator >= P.step) {
      const previous = footSegment();
      integrate(P.step, state.force);
      updatePedalContact(previous, P.step);
      accumulator -= P.step;
    }
    updateEffects(elapsed);
    updateForceGauge(elapsed);
    sound?.setForce(Math.hypot(state.force.x, state.force.y) / P.maxForce);
    draw(); animationFrame = requestAnimationFrame(frame);
  }
  listen(canvas, 'pointermove', movePointer);
  listen(canvas, 'pointerleave', resetInput);
  listen(canvas, 'pointercancel', resetInput);
  listen(canvas, 'pointerup', event => { if (event.pointerType !== 'mouse') resetInput(); });
  listen(canvas, 'keydown', event => {
    if (event.key.startsWith('Arrow')) { event.preventDefault(); keys.add(event.key); }
  });
  listen(canvas, 'keyup', event => keys.delete(event.key));
  listen(canvas, 'blur', resetInput);
  listen(window, 'blur', resetInput);
  listen(document, 'visibilitychange', () => { resetInput(); lastFrame = 0; accumulator = 0; });
  for (const { input } of parameterControls) listen(input, 'input', updateParameters);
  updateParameters();
  if (root.dataset.audioSrc) sound = createStompboxAudio({
    root,
    sourceUrl: new URL(root.dataset.audioSrc, document.baseURI).href,
    reference: { ...parameters },
    ranges: Object.fromEntries(parameterControls.map(({ name, input }) => [name, { min: Number(input.min), max: Number(input.max) }])),
  });
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  resize(); animationFrame = requestAnimationFrame(frame);
  return {
    destroy() {
      destroyed = true;
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      eventController.abort();
      sound?.destroy();
      resetInput();
    },
  };
}
