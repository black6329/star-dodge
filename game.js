(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const overlay = document.getElementById("overlay");
  const hud = document.getElementById("hud");
  const touch = document.getElementById("touch");
  const scoreEl = document.getElementById("score");
  const bestEl = document.getElementById("best");
  const bestTitle = document.getElementById("bestTitle");
  const startBtn = document.getElementById("startBtn");
  const titleEl = overlay.querySelector("h1");
  const subEl = overlay.querySelector(".sub");
  const hintEl = overlay.querySelector(".hint");

  const W = canvas.width;
  const H = canvas.height;
  const BEST_KEY = "star-dodge-best";

  let best = Number(localStorage.getItem(BEST_KEY) || 0);
  bestEl.textContent = best;
  bestTitle.textContent = best;

  const state = {
    mode: "title",
    elapsed: 0,
    score: 0,
    scoreAcc: 0,
    ship: { x: W / 2, y: H - 70, r: 14, vx: 0 },
    rocks: [],
    stars: [],
    particles: [],
    keys: { left: false, right: false },
    spawnRock: 0,
    spawnStar: 0,
    shake: 0,
  };

  function setScore(n) {
    state.scoreAcc = Math.max(0, n);
    state.score = Math.floor(state.scoreAcc);
    scoreEl.textContent = String(state.score);
  }

  function reset() {
    state.elapsed = 0;
    setScore(0);
    state.ship.x = W / 2;
    state.ship.vx = 0;
    state.rocks = [];
    state.stars = [];
    state.particles = [];
    state.spawnRock = 0;
    state.spawnStar = 400;
    state.shake = 0;
  }

  function startGame() {
    reset();
    state.mode = "play";
    overlay.classList.add("hidden");
    hud.classList.remove("hidden");
    touch.classList.remove("hidden");
  }

  function gameOver() {
    state.mode = "over";
    if (state.score > best) {
      best = state.score;
      localStorage.setItem(BEST_KEY, String(best));
      bestEl.textContent = best;
      bestTitle.textContent = best;
    }
    titleEl.textContent = "게임 오버";
    subEl.textContent = `점수 ${state.score}`;
    hintEl.textContent = "다시 도전해 보세요";
    startBtn.textContent = "다시하기";
    overlay.classList.remove("hidden");
    touch.classList.add("hidden");
  }

  startBtn.addEventListener("click", startGame);

  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") state.keys.left = true;
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") state.keys.right = true;
    if ((e.key === "Enter" || e.key === " ") && state.mode !== "play") {
      e.preventDefault();
      startGame();
    }
  });
  window.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") state.keys.left = false;
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") state.keys.right = false;
  });

  const bindHold = (el, dir) => {
    const set = (v) => (e) => {
      e.preventDefault();
      state.keys[dir] = v;
    };
    el.addEventListener("pointerdown", set(true));
    el.addEventListener("pointerup", set(false));
    el.addEventListener("pointerleave", set(false));
    el.addEventListener("pointercancel", set(false));
  };
  bindHold(document.getElementById("leftBtn"), "left");
  bindHold(document.getElementById("rightBtn"), "right");

  canvas.addEventListener("pointerdown", (e) => {
    canvas.setPointerCapture(e.pointerId);
    moveToPointer(e);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (e.buttons || e.pressure > 0) moveToPointer(e);
  });

  function moveToPointer(e) {
    if (state.mode !== "play") return;
    const rect = canvas.getBoundingClientRect();
    state.ship.x = ((e.clientX - rect.left) / rect.width) * W;
  }

  function burst(x, y, color, n = 10) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 1 + Math.random() * 3;
      state.particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 30 + Math.random() * 20,
        color,
        r: 1.5 + Math.random() * 2,
      });
    }
  }

  function spawnRock() {
    const r = 10 + Math.random() * 18;
    state.rocks.push({
      x: r + Math.random() * (W - r * 2),
      y: -r,
      r,
      vy: 2.2 + Math.random() * 1.8 + state.elapsed * 0.0008,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.08,
    });
  }

  function spawnStar() {
    state.stars.push({
      x: 20 + Math.random() * (W - 40),
      y: -12,
      r: 8,
      vy: 2 + Math.random() * 1.2,
      pulse: Math.random() * Math.PI * 2,
    });
  }

  function hit(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return dx * dx + dy * dy < (a.r + b.r) * (a.r + b.r);
  }

  function drawBg() {
    ctx.clearRect(0, 0, W, H);
    for (let i = 0; i < 40; i++) {
      const x = (i * 97) % W;
      const y = (i * 53 + state.elapsed * 0.02 * ((i % 3) + 1)) % H;
      ctx.globalAlpha = 0.25 + (i % 5) * 0.08;
      ctx.fillStyle = "#cfe3ff";
      ctx.beginPath();
      ctx.arc(x, y, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawShip() {
    const s = state.ship;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.fillStyle = "#7cf0c2";
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(12, 12);
    ctx.lineTo(0, 6);
    ctx.lineTo(-12, 12);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#9ae6ff";
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.lineTo(5, 18 + Math.random() * 4);
    ctx.lineTo(-5, 18 + Math.random() * 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawRock(r) {
    ctx.save();
    ctx.translate(r.x, r.y);
    ctx.rotate(r.rot);
    ctx.fillStyle = "#8a93a8";
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const rad = r.r * (0.75 + (i % 2) * 0.25);
      const x = Math.cos(a) * rad;
      const y = Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawStarItem(s) {
    const pulse = 1 + Math.sin(s.pulse) * 0.15;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = "#ffe66d";
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
      const b = a + Math.PI / 5;
      ctx.lineTo(Math.cos(a) * 9, Math.sin(a) * 9);
      ctx.lineTo(Math.cos(b) * 4, Math.sin(b) * 4);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function draw() {
    ctx.save();
    if (state.shake > 0) {
      ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
    }
    drawBg();
    for (const r of state.rocks) drawRock(r);
    for (const s of state.stars) drawStarItem(s);
    for (const p of state.particles) {
      ctx.globalAlpha = Math.max(0, p.life / 40);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (state.mode === "play") drawShip();
    ctx.restore();
  }

  function update(dt) {
    if (state.mode === "play") {
      state.elapsed += dt;
      setScore(state.scoreAcc + dt * 0.04);

      const ship = state.ship;
      if (state.keys.left) ship.vx -= 0.55;
      if (state.keys.right) ship.vx += 0.55;
      ship.vx *= 0.86;
      ship.x += ship.vx * (dt / 16);
      ship.x = Math.max(ship.r + 4, Math.min(W - ship.r - 4, ship.x));

      state.spawnRock -= dt;
      state.spawnStar -= dt;
      if (state.spawnRock <= 0) {
        spawnRock();
        state.spawnRock = Math.max(280, 900 - state.elapsed * 0.04);
      }
      if (state.spawnStar <= 0) {
        spawnStar();
        state.spawnStar = 1800 + Math.random() * 1200;
      }

      for (const rock of state.rocks) {
        rock.y += rock.vy * (dt / 16);
        rock.rot += rock.vr;
      }
      for (const star of state.stars) {
        star.y += star.vy * (dt / 16);
        star.pulse += 0.12;
      }
      for (const p of state.particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
        p.life -= 1;
      }
      state.particles = state.particles.filter((p) => p.life > 0);
      state.rocks = state.rocks.filter((r) => r.y < H + 40);

      for (let i = state.stars.length - 1; i >= 0; i--) {
        const star = state.stars[i];
        if (hit(ship, star)) {
          state.stars.splice(i, 1);
          setScore(state.scoreAcc + 50);
          burst(star.x, star.y, "#ffe66d", 14);
        } else if (star.y >= H + 20) {
          state.stars.splice(i, 1);
        }
      }

      for (const rock of state.rocks) {
        if (hit(ship, { x: rock.x, y: rock.y, r: rock.r * 0.85 })) {
          burst(ship.x, ship.y, "#ff6b8a", 22);
          state.shake = 14;
          gameOver();
          break;
        }
      }
      if (state.shake > 0) state.shake -= 1;
    } else {
      state.elapsed += dt * 0.35;
    }
    draw();
  }

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(32, now - last);
    last = now;
    update(dt);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
