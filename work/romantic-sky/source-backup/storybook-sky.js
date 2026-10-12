// A transparent, host-clock-driven sky shared by the lobby and both islands.
const TAU = Math.PI * 2;
const clamp = (n, low = 0, high = 1) => Math.min(high, Math.max(low, Number(n) || 0));
const smooth = (a, b, n) => { const t = clamp((n - a) / (b - a)); return t * t * (3 - 2 * t); };
function random(seed) {
  let n = (Number(seed) || 13729) >>> 0;
  return () => { n += 0x6D2B79F5; let t = n; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

export function createStorybookSky({ container, variant = 'night', seed = 13729 } = {}) {
  if (!container?.ownerDocument) throw new TypeError('The storybook sky needs a DOM container.');
  const doc = container.ownerDocument, win = doc.defaultView || window;
  const element = doc.createElement('canvas');
  element.className = 'storybook-sky';
  element.dataset.variant = variant;
  element.setAttribute('aria-hidden', 'true');
  element.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;z-index:0;';
  container.insertBefore(element, container.firstChild);
  const ctx = element.getContext('2d', { alpha: true });
  const motion = win.matchMedia?.('(prefers-reduced-motion: reduce)');
  const lobby = variant === 'lobby';
  let active = true, disposed = false, width = 0, height = 0, dpr = 1, mobile = false;
  let elapsed = 0, accumulator = 1, visibility = lobby ? 1 : 0, reduced = !!motion?.matches;
  let weatherDim = 1, lastVisibility = -1, needsDraw = true, nextMeteor = 12;
  let stars = [], dust = [], cloudSprites = [], cloudLayout = [], meteor = null;
  let moonSprite = null, moonRadius = 46, moonX = .86, moonY = .18;
  let rng = random(seed), lastEnv = {};
  const starSprites = new Map();

  function surface(w, h) {
    const canvas = doc.createElement('canvas');
    canvas.width = Math.ceil(w * dpr); canvas.height = Math.ceil(h * dpr);
    const c = canvas.getContext('2d'); c.scale(dpr, dpr);
    return { canvas, c };
  }

  function starSprite(radius, cool) {
    const key = `${radius}/${cool}`;
    if (starSprites.has(key)) return starSprites.get(key);
    const size = radius * 7, { canvas, c } = surface(size, size), center = size / 2;
    c.translate(center, center);
    const glow = c.createRadialGradient(0, 0, radius * .3, 0, 0, center);
    glow.addColorStop(0, cool ? '#d5e7ff38' : '#ffdf8238');
    glow.addColorStop(.4, cool ? '#a4bffd16' : '#ffc46d16');
    glow.addColorStop(1, '#ffeab500');
    c.fillStyle = glow; c.fillRect(-center, -center, size, size);
    c.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? radius * .46 : radius;
      if (i) c.lineTo(Math.cos(a) * r, Math.sin(a) * r); else c.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    c.closePath();
    const ink = c.createLinearGradient(-radius, -radius, radius * .6, radius);
    ink.addColorStop(0, cool ? '#f7f6e9' : '#fffbdc');
    ink.addColorStop(.65, cool ? '#dddfff' : '#ffedaf');
    ink.addColorStop(1, cool ? '#bacce9' : '#e8c87c');
    c.fillStyle = ink; c.fill();
    const sprite = { canvas, size }; starSprites.set(key, sprite); return sprite;
  }

  function createMoon() {
    const r = moonRadius, size = r * 5.8, { canvas, c } = surface(size, size), x = size / 2, y = x;
    const halo = c.createRadialGradient(x, y, r * .5, x, y, r * 2.8);
    halo.addColorStop(0, '#ffe6a436'); halo.addColorStop(.38, '#f7d49222'); halo.addColorStop(.7, '#efd9a90b'); halo.addColorStop(1, '#f6dca600');
    c.fillStyle = halo; c.fillRect(0, 0, size, size);
    // Draw the crescent on its own surface so its cutout never erases the sky.
    const cut = surface(r * 2.5, r * 2.5), center = r * 1.25;
    const light = cut.c.createLinearGradient(center - r, center - r, center + r, center + r);
    light.addColorStop(0, '#fffbd6'); light.addColorStop(.6, '#ffedac'); light.addColorStop(1, '#e8c777');
    cut.c.fillStyle = light; cut.c.beginPath(); cut.c.arc(center, center, r, 0, TAU); cut.c.fill();
    cut.c.globalCompositeOperation = 'destination-out';
    cut.c.beginPath(); cut.c.arc(center + r * .48, center - r * .29, r * .92, 0, TAU); cut.c.fill();
    c.save(); c.translate(x, y); c.rotate(-.16); c.drawImage(cut.canvas, -center, -center, r * 2.5, r * 2.5); c.restore();
    return { canvas, size };
  }

  function createCloud(index) {
    const w = 440, h = 202, { canvas, c } = surface(w, h);
    const shape = new Path2D();
    shape.moveTo(24, 151);
    shape.bezierCurveTo(3, 125, 15, 89, 52, 83);
    shape.bezierCurveTo(36, 46, 67, 21, 105, 38);
    shape.bezierCurveTo(123, -1, 181, 8, 188, 47);
    shape.bezierCurveTo(220, 14, 268, 34, 271, 67);
    shape.bezierCurveTo(311, 36, 357, 56, 357, 91);
    shape.bezierCurveTo(408, 72, 442, 117, 416, 153);
    shape.bezierCurveTo(408, 184, 364, 195, 335, 177);
    shape.bezierCurveTo(304, 203, 253, 192, 237, 173);
    shape.bezierCurveTo(203, 203, 155, 189, 141, 171);
    shape.bezierCurveTo(95, 197, 44, 186, 24, 151); shape.closePath();
    c.save(); c.clip(shape);
    const base = c.createLinearGradient(0, 0, w * .5, h);
    base.addColorStop(0, index % 2 ? '#5e6997' : '#626792'); base.addColorStop(.48, '#444f82'); base.addColorStop(1, '#30435e');
    c.fillStyle = base; c.fillRect(0, 0, w, h);
    for (const [x, y, r] of [[66,83,66],[137,58,70],[228,79,61],[309,100,65],[374,134,54]]) {
      const rim = c.createRadialGradient(x - 15, y - 21, 3, x, y, r);
      rim.addColorStop(0, '#bfbbd12d'); rim.addColorStop(.45, '#9eadd023'); rim.addColorStop(.81, '#878eab0b'); rim.addColorStop(1, '#8c9bae00');
      c.fillStyle = rim; c.fillRect(x-r,y-r,r*2,r*2);
    }
    const under = c.createLinearGradient(0, h * .42, 0, h);
    under.addColorStop(0, '#c9dab400'); under.addColorStop(.72, '#b4c2c013'); under.addColorStop(1, '#d8d7b93b');
    c.fillStyle = under; c.fillRect(0, 0, w, h);
    c.restore();
    c.strokeStyle = '#bfc3bc12'; c.lineWidth = 1.5; c.stroke(shape);
    return { canvas, width: w, height: h };
  }

  function rebuild() {
    rng = random(seed); starSprites.clear();
    mobile = width < 700 || height < 520;
    moonRadius = Math.min(mobile ? 38 : 48, Math.max(27, Math.min(width, height) * .082));
    moonX = mobile && height > width ? .855 : .87;
    // Keep the crescent clear of portrait lighting tools and short landscape headers.
    moonY = mobile && height > width ? (lobby ? .13 : .23) : Math.max(.22, (68 + moonRadius) / height);
    moonSprite = createMoon(); cloudSprites = [createCloud(0), createCloud(1)];
    stars = Array.from({ length: mobile ? 18 : 32 }, (_, i) => {
      let x = .035 + rng() * .93, y = .035 + rng() * .91;
      // Preserve the lobby's text column and the moon's negative space.
      if (lobby && x < .37 && y > .18 && y < .81) x = .40 + rng() * .55;
      if (Math.hypot((x - moonX) * width, (y - moonY) * height) < moonRadius * 1.9) y = clamp(y + .2, .035, .92);
      const r = i % 9 === 0 ? mobile ? 9 : 13 : 3 + Math.floor(rng() * (mobile ? 5 : 7));
      return { x, y, r, rotation: (rng() - .5) * .8, phase: rng() * TAU, speed: .18 + rng() * .18, alpha: .55 + rng() * .32, sprite: starSprite(r, i % 8 === 3) };
    });
    dust = Array.from({ length: mobile ? 170 : 420 }, () => ({ x: rng(), y: rng(), r: .35 + rng() * .8, a: .11 + rng() * .43, phase: rng() * TAU, cool: rng() > .65 }));
    cloudLayout = mobile && height > width
      ? [{ x:-.11,y:.035,s:.61,a:.72,i:0 },{ x:.92,y:.045,s:.69,a:.77,i:1 },{ x:1.04,y:.59,s:.54,a:.58,i:0 },{ x:-.13,y:.89,s:.69,a:.52,i:1 }]
      : [{ x:-.005,y:.005,s:.86,a:.79,i:0 },{ x:.45,y:-.095,s:1.12,a:.7,i:1 },{ x:1.04,y:.07,s:.94,a:.83,i:0 },{ x:-.055,y:.90,s:.80,a:.50,i:1 },{ x:1.06,y:.85,s:.96,a:.56,i:0 }];
    needsDraw = true;
  }

  function resize() {
    if (!active || disposed) return;
    const rect = container.getBoundingClientRect();
    const nextWidth = Math.max(0, Math.round(rect.width)), nextHeight = Math.max(0, Math.round(rect.height));
    const nextDpr = Math.min(1.5, win.devicePixelRatio || 1);
    if (width === nextWidth && height === nextHeight && nextDpr === dpr) return;
    width = nextWidth; height = nextHeight; dpr = nextDpr;
    element.width = Math.max(1, Math.round(width * dpr)); element.height = Math.max(1, Math.round(height * dpr));
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (width && height && ctx) rebuild();
  }

  function draw() {
    if (!ctx || !width || !height) return;
    ctx.clearRect(0, 0, width, height); lastVisibility = visibility;
    if (visibility < .003) return;
    const time = reduced ? 0 : elapsed;
    ctx.save(); ctx.globalAlpha = visibility;
    const velvet = ctx.createLinearGradient(0, 0, 0, height);
    velvet.addColorStop(0, lobby ? '#33355840' : '#20244280');
    velvet.addColorStop(.45, lobby ? '#39456222' : '#39366155');
    velvet.addColorStop(1, lobby ? '#69828b00' : '#4e69a624');
    ctx.fillStyle = velvet; ctx.fillRect(0, 0, width, height);
    for (const dot of dust) {
      const calm = lobby && dot.x < .37 && dot.y > .2 ? .36 : 1;
      ctx.globalAlpha = visibility * weatherDim * dot.a * calm * (.86 + Math.sin(time * .23 + dot.phase) * .14);
      ctx.fillStyle = dot.cool ? '#b7cee9' : '#ece5cc';
      ctx.beginPath(); ctx.arc(dot.x * width, dot.y * height, dot.r, 0, TAU); ctx.fill();
    }
    for (const star of stars) {
      const pulse = .88 + Math.sin(time * star.speed + star.phase) * .12;
      ctx.save(); ctx.globalAlpha = visibility * weatherDim * star.alpha * pulse;
      ctx.translate(star.x * width, star.y * height + Math.sin(time * .12 + star.phase) * (reduced ? 0 : 1.3));
      ctx.rotate(star.rotation + Math.sin(time * .11 + star.phase) * .035);
      ctx.drawImage(star.sprite.canvas, -star.sprite.size / 2, -star.sprite.size / 2, star.sprite.size, star.sprite.size); ctx.restore();
    }
    ctx.globalAlpha = visibility * (.6 + weatherDim * .4);
    ctx.drawImage(moonSprite.canvas, moonX * width - moonSprite.size / 2, moonY * height - moonSprite.size / 2, moonSprite.size, moonSprite.size);
    if (meteor) {
      const t = meteor.age / meteor.duration, len = Math.min(width, height) * .19;
      const x = meteor.x * width - t * width * .27, y = meteor.y * height + t * height * .25;
      const dx = len * .74, dy = -len * .67;
      ctx.globalAlpha = visibility * weatherDim * Math.sin(t * Math.PI) * .74;
      const trail = ctx.createLinearGradient(x, y, x + dx, y + dy);
      trail.addColorStop(0, '#fff5d9'); trail.addColorStop(.16, '#d6eaffc9'); trail.addColorStop(1, '#b6cbff00');
      ctx.strokeStyle = trail; ctx.lineWidth = 1.7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dx, y + dy); ctx.stroke();
      ctx.fillStyle = '#fff8e4'; ctx.beginPath(); ctx.arc(x, y, 1.6, 0, TAU); ctx.fill();
    }
    const scale = Math.min(width / 1000, height / 700, 1.5);
    for (let i = 0; i < cloudLayout.length; i++) {
      const cloud = cloudLayout[i], sprite = cloudSprites[cloud.i];
      const s = cloud.s * (mobile && height > width ? .82 : Math.max(.6, scale));
      const w = sprite.width * s, h = sprite.height * s;
      ctx.globalAlpha = visibility * cloud.a;
      ctx.drawImage(sprite.canvas, cloud.x * width - w / 2 + Math.sin(time * .033 + i * 1.7) * (reduced ? 0 : 11), cloud.y * height - h / 2, w, h);
    }
    ctx.restore();
  }

  const observer = typeof win.ResizeObserver === 'function' ? new win.ResizeObserver(resize) : null;
  function motionChanged(e) { reduced = e.matches; meteor = null; needsDraw = true; }
  function observe() { observer?.observe(container); if (!observer) win.addEventListener('resize', resize); motion?.addEventListener?.('change', motionChanged); }
  function disconnect() { observer?.disconnect(); win.removeEventListener('resize', resize); motion?.removeEventListener?.('change', motionChanged); }
  observe(); resize();

  return {
    element,
    update(dt = 0, env = lastEnv) {
      if (!active || disposed) return;
      lastEnv = env || {}; const delta = clamp(dt, 0, .25);
      const night = clamp(lastEnv.night), twilight = clamp(lastEnv.sunset ?? lastEnv.dusk);
      const target = lobby ? 1 : smooth(.35, .94, night) * (1 - twilight * .55);
      const dim = 1 - clamp(lastEnv.cloud) * .17 - clamp(lastEnv.rain) * .40 - clamp(lastEnv.snow) * .24;
      const previousDim = weatherDim;
      weatherDim += (Math.max(.22, dim) - weatherDim) * (1 - Math.exp(-delta * 3));
      // Full daylight clears immediately; dusk and night ease with the host lighting.
      visibility = target === 0 && night < .12 ? 0 : visibility + (target - visibility) * (1 - Math.exp(-delta * 3));
      if (Math.abs(target - visibility) < .001) visibility = target;
      elapsed += delta; accumulator += delta;
      if (!reduced && visibility > .7 && weatherDim > .55) {
        if (meteor) { meteor.age += delta; if (meteor.age >= meteor.duration) meteor = null; }
        else if (elapsed >= nextMeteor) { meteor = { x: .53 + rng() * .40, y: .07 + rng() * .15, age: 0, duration: 1.7 + rng() * .6 }; nextMeteor = elapsed + 13 + rng() * 8; }
      } else { meteor = null; nextMeteor = Math.max(nextMeteor, elapsed + 7); }
      const changed = Math.abs(visibility - lastVisibility) > .001 || Math.abs(previousDim - weatherDim) > .001;
      if (accumulator < 1 / 30 && !needsDraw) return;
      accumulator %= 1 / 30;
      if (needsDraw || changed || !reduced && visibility > .003) { draw(); needsDraw = false; }
    },
    setActive(value) {
      if (disposed || active === !!value) return;
      active = !!value; element.style.visibility = active ? '' : 'hidden';
      if (active) { reduced = !!motion?.matches; observe(); resize(); needsDraw = true; accumulator = 1; }
      else { disconnect(); meteor = null; }
    },
    getState() {
      return { variant, active, reducedMotion: reduced, width, height, dpr, stars: stars.length, dust: dust.length, moon: !!moonSprite, clouds: cloudLayout.length, visibility: Number(visibility.toFixed(3)), weatherDim: Number(weatherDim.toFixed(3)), meteors: meteor ? 1 : 0 };
    },
    dispose() { if (disposed) return; disposed = true; active = false; disconnect(); element.remove(); starSprites.clear(); stars = []; dust = []; cloudSprites = []; cloudLayout = []; moonSprite = null; meteor = null; }
  };
}
