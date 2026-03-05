/* ============================================================
   Game Engine — Invader × Breakout Portfolio Game
   ============================================================ */

(function () {
    'use strict';

    /* ==========================================================
       Work Data — pulled from the DOM
       ========================================================== */
    function getWorksData() {
        const items = document.querySelectorAll('.work-item');
        return Array.from(items).map((item) => ({
            title: item.querySelector('.work-item__title')?.textContent || '作品',
            desc: item.querySelector('.work-item__desc')?.textContent || '',
            image: item.querySelector('.work-item__image')?.src || '',
        }));
    }

    /* ==========================================================
       Constants
       ========================================================== */
    const PADDLE_HEIGHT = 16;
    const PADDLE_RADIUS = 12;
    const BALL_RADIUS = 8;
    const BALL_SPEED_INIT = 5;
    const BALL_SPEED_MAX = 9;
    const ENEMY_ROWS = 1;
    const ENEMY_PADDING = 18;
    const ENEMY_TOP_OFFSET = 80;
    const PARTICLE_COUNT = 20;
    const MAX_LIVES = 3;

    /* Color palette */
    const COLORS = {
        bg: '#0a0a1a',
        paddle: '#a855f7',
        paddleGlow: 'rgba(168, 85, 247, 0.5)',
        ball: '#ff6b6b',
        ballGlow: 'rgba(255, 107, 107, 0.5)',
        enemyColors: [
            ['#ff6b6b', '#ee5a6f'],
            ['#ffa751', '#ff6b6b'],
            ['#6c5ce7', '#a855f7'],
            ['#00d2ff', '#3a7bd5'],
            ['#f093fb', '#f5576c'],
        ],
        gridLine: 'rgba(255, 255, 255, 0.03)',
        star: 'rgba(255, 255, 255, 0.4)',
    };

    /* ==========================================================
       Game Class
       ========================================================== */
    class Game {
        constructor(canvas, overlay) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.overlay = overlay;

            /* State */
            this.state = 'start'; // start | playing | gameover | clear
            this.score = 0;
            this.lives = MAX_LIVES;
            this.shakeTimer = 0;
            this.animId = null;

            /* Data */
            this.worksData = getWorksData();

            /* Entities */
            this.paddle = null;
            this.ball = null;
            this.enemies = [];
            this.particles = [];
            this.stars = [];

            /* Resize */
            this.resize();
            window.addEventListener('resize', () => this.resize());

            /* Input */
            this.mouseX = 0;
            this.canvas.addEventListener('mousemove', (e) => {
                const rect = this.canvas.getBoundingClientRect();
                this.mouseX = e.clientX - rect.left;
            });
            this.canvas.addEventListener('touchmove', (e) => {
                e.preventDefault();
                const rect = this.canvas.getBoundingClientRect();
                this.mouseX = e.touches[0].clientX - rect.left;
            }, { passive: false });

            /* Generate stars */
            this.generateStars();
        }

        /* ---- Resize ---- */
        resize() {
            const maxW = 900;
            const maxH = 640;
            const w = Math.min(window.innerWidth - 40, maxW);
            const h = Math.min(window.innerHeight - 120, maxH);
            this.canvas.width = w;
            this.canvas.height = h;
            this.W = w;
            this.H = h;
        }

        /* ---- Stars background ---- */
        generateStars() {
            this.stars = [];
            for (let i = 0; i < 80; i++) {
                this.stars.push({
                    x: Math.random() * 900,
                    y: Math.random() * 640,
                    r: Math.random() * 1.5 + 0.5,
                    alpha: Math.random() * 0.5 + 0.2,
                    speed: Math.random() * 0.3 + 0.05,
                });
            }
        }

        /* ---- Init / Reset ---- */
        init() {
            this.score = 0;
            this.lives = MAX_LIVES;
            this.particles = [];
            this.shakeTimer = 0;

            /* Paddle */
            const pw = Math.min(140, this.W * 0.18);
            this.paddle = {
                x: this.W / 2 - pw / 2,
                y: this.H - 50,
                w: pw,
                h: PADDLE_HEIGHT,
            };

            /* Ball */
            this.resetBall();

            /* Enemies from works data */
            this.createEnemies();

            this.updateHUD();
        }

        resetBall() {
            this.ball = {
                x: this.W / 2,
                y: this.H - 80,
                r: BALL_RADIUS,
                dx: (Math.random() > 0.5 ? 1 : -1) * BALL_SPEED_INIT * 0.7,
                dy: -BALL_SPEED_INIT,
            };
        }

        createEnemies() {
            this.enemies = [];
            const data = this.worksData;
            if (data.length === 0) return;

            const cols = data.length;
            const ew = Math.min(160, (this.W - ENEMY_PADDING * (cols + 1)) / cols);
            const eh = 70;
            const totalW = cols * ew + (cols - 1) * ENEMY_PADDING;
            const startX = (this.W - totalW) / 2;

            for (let row = 0; row < ENEMY_ROWS; row++) {
                for (let col = 0; col < cols; col++) {
                    const colorPair = COLORS.enemyColors[col % COLORS.enemyColors.length];
                    this.enemies.push({
                        x: startX + col * (ew + ENEMY_PADDING),
                        y: ENEMY_TOP_OFFSET + row * (eh + ENEMY_PADDING),
                        w: ew,
                        h: eh,
                        alive: true,
                        dataIndex: col,
                        color1: colorPair[0],
                        color2: colorPair[1],
                        hp: 1,
                        hitAnim: 0,
                        /* Invader movement */
                        baseX: startX + col * (ew + ENEMY_PADDING),
                        moveDir: 1,
                        movePhase: Math.random() * Math.PI * 2,
                    });
                }
            }
        }

        /* ---- HUD Update ---- */
        updateHUD() {
            const scoreEl = document.getElementById('game-score');
            const livesEl = document.getElementById('game-lives');
            if (scoreEl) scoreEl.textContent = this.score;
            if (livesEl) livesEl.textContent = '❤️'.repeat(this.lives);
        }

        /* ---- Particles ---- */
        spawnParticles(x, y, color) {
            for (let i = 0; i < PARTICLE_COUNT; i++) {
                const angle = (Math.PI * 2 / PARTICLE_COUNT) * i + Math.random() * 0.5;
                const speed = Math.random() * 4 + 2;
                this.particles.push({
                    x, y,
                    dx: Math.cos(angle) * speed,
                    dy: Math.sin(angle) * speed,
                    r: Math.random() * 3 + 1.5,
                    color,
                    life: 1,
                    decay: Math.random() * 0.03 + 0.015,
                });
            }
        }

        /* ---- Show Work Modal ---- */
        showWorkModal(dataIndex) {
            const data = this.worksData[dataIndex];
            if (!data) return;

            const modal = document.getElementById('game-modal');
            const img = document.getElementById('game-modal-image');
            const title = document.getElementById('game-modal-title');
            const desc = document.getElementById('game-modal-desc');

            if (img) {
                img.src = data.image;
                img.alt = data.title;
            }
            if (title) title.textContent = data.title;
            if (desc) desc.textContent = data.desc;

            if (modal) modal.classList.add('is-visible');

            /* Pause game */
            this.state = 'paused';
        }

        resumeFromModal() {
            this.state = 'playing';
        }

        /* ---- Main Loop ---- */
        start() {
            this.state = 'start';
            this.showScreen('game-start-screen');
            this.loop();
        }

        stop() {
            if (this.animId) {
                cancelAnimationFrame(this.animId);
                this.animId = null;
            }
        }

        loop() {
            this.animId = requestAnimationFrame(() => this.loop());
            this.update();
            this.draw();
        }

        /* ---- Update ---- */
        update() {
            if (this.state !== 'playing') return;

            const dt = 1; // fixed timestep

            /* Shake decay */
            if (this.shakeTimer > 0) this.shakeTimer -= 0.05;

            /* Paddle follows mouse */
            const targetX = this.mouseX - this.paddle.w / 2;
            this.paddle.x += (targetX - this.paddle.x) * 0.2;
            this.paddle.x = Math.max(0, Math.min(this.W - this.paddle.w, this.paddle.x));

            /* Ball movement */
            this.ball.x += this.ball.dx * dt;
            this.ball.y += this.ball.dy * dt;

            /* Wall collision */
            if (this.ball.x - this.ball.r <= 0) {
                this.ball.x = this.ball.r;
                this.ball.dx = Math.abs(this.ball.dx);
            }
            if (this.ball.x + this.ball.r >= this.W) {
                this.ball.x = this.W - this.ball.r;
                this.ball.dx = -Math.abs(this.ball.dx);
            }
            if (this.ball.y - this.ball.r <= 0) {
                this.ball.y = this.ball.r;
                this.ball.dy = Math.abs(this.ball.dy);
            }

            /* Bottom — lose life */
            if (this.ball.y + this.ball.r >= this.H) {
                this.lives--;
                this.shakeTimer = 1;
                this.updateHUD();
                if (this.lives <= 0) {
                    this.state = 'gameover';
                    this.showScreen('game-over-screen');
                    return;
                }
                this.resetBall();
                return;
            }

            /* Paddle collision */
            if (
                this.ball.dy > 0 &&
                this.ball.y + this.ball.r >= this.paddle.y &&
                this.ball.y + this.ball.r <= this.paddle.y + this.paddle.h + 6 &&
                this.ball.x >= this.paddle.x - this.ball.r &&
                this.ball.x <= this.paddle.x + this.paddle.w + this.ball.r
            ) {
                /* Bounce angle depends on hit position */
                const hitPos = (this.ball.x - this.paddle.x) / this.paddle.w; // 0~1
                const angle = (hitPos - 0.5) * Math.PI * 0.7; // -63°~63°
                const speed = Math.min(
                    Math.sqrt(this.ball.dx ** 2 + this.ball.dy ** 2) + 0.15,
                    BALL_SPEED_MAX
                );
                this.ball.dx = Math.sin(angle) * speed;
                this.ball.dy = -Math.cos(angle) * speed;
                this.ball.y = this.paddle.y - this.ball.r;

                /* Paddle hit particles */
                this.spawnParticles(this.ball.x, this.paddle.y, COLORS.paddle);
            }

            /* Enemy movement (invader-style) */
            const time = performance.now() / 1000;
            this.enemies.forEach((e) => {
                if (!e.alive) return;
                e.x = e.baseX + Math.sin(time * 0.5 + e.movePhase) * 30;
                e.y += 0.02; // very slow descent
            });

            /* Enemy collision */
            this.enemies.forEach((e) => {
                if (!e.alive) return;
                if (
                    this.ball.x + this.ball.r > e.x &&
                    this.ball.x - this.ball.r < e.x + e.w &&
                    this.ball.y + this.ball.r > e.y &&
                    this.ball.y - this.ball.r < e.y + e.h
                ) {
                    e.alive = false;
                    this.ball.dy = -this.ball.dy;
                    this.score += 100;
                    this.shakeTimer = 0.5;
                    this.updateHUD();
                    this.spawnParticles(e.x + e.w / 2, e.y + e.h / 2, e.color1);

                    /* Show work modal */
                    setTimeout(() => this.showWorkModal(e.dataIndex), 300);
                }
            });

            /* Enemy hit animation decay */
            this.enemies.forEach((e) => {
                if (e.hitAnim > 0) e.hitAnim -= 0.05;
            });

            /* Check clear */
            if (this.enemies.every((e) => !e.alive)) {
                this.state = 'clear';
                this.showScreen('game-clear-screen');
            }

            /* Particles */
            this.particles.forEach((p) => {
                p.x += p.dx;
                p.y += p.dy;
                p.dy += 0.08; // gravity
                p.life -= p.decay;
            });
            this.particles = this.particles.filter((p) => p.life > 0);
        }

        /* ---- Drawing ---- */
        draw() {
            const ctx = this.ctx;
            const W = this.W;
            const H = this.H;

            /* Shake offset */
            let sx = 0, sy = 0;
            if (this.shakeTimer > 0) {
                sx = (Math.random() - 0.5) * 6 * this.shakeTimer;
                sy = (Math.random() - 0.5) * 6 * this.shakeTimer;
            }

            ctx.save();
            ctx.translate(sx, sy);

            /* Background */
            ctx.fillStyle = COLORS.bg;
            ctx.fillRect(-10, -10, W + 20, H + 20);

            /* Grid lines */
            ctx.strokeStyle = COLORS.gridLine;
            ctx.lineWidth = 1;
            for (let x = 0; x < W; x += 50) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, H);
                ctx.stroke();
            }
            for (let y = 0; y < H; y += 50) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(W, y);
                ctx.stroke();
            }

            /* Stars */
            this.stars.forEach((s) => {
                const sx2 = ((s.x + performance.now() * s.speed * 0.01) % (W + 20)) - 10;
                ctx.beginPath();
                ctx.arc(sx2, s.y, s.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,255,255,${s.alpha * (0.5 + 0.5 * Math.sin(performance.now() * 0.002 + s.x))})`;
                ctx.fill();
            });

            if (this.state === 'playing' || this.state === 'paused') {
                /* Enemies */
                this.enemies.forEach((e) => {
                    if (!e.alive) return;
                    const grad = ctx.createLinearGradient(e.x, e.y, e.x + e.w, e.y + e.h);
                    grad.addColorStop(0, e.color1);
                    grad.addColorStop(1, e.color2);

                    /* Glow */
                    ctx.shadowColor = e.color1;
                    ctx.shadowBlur = 15;

                    /* Body */
                    ctx.beginPath();
                    ctx.roundRect(e.x, e.y, e.w, e.h, 8);
                    ctx.fillStyle = grad;
                    ctx.fill();

                    /* Label */
                    ctx.shadowBlur = 0;
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 13px "Noto Sans JP", sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    const title = this.worksData[e.dataIndex]?.title || '???';
                    const maxLen = Math.floor(e.w / 14);
                    const displayTitle = title.length > maxLen ? title.slice(0, maxLen) + '…' : title;
                    ctx.fillText(displayTitle, e.x + e.w / 2, e.y + e.h / 2);
                });

                /* Paddle */
                ctx.shadowColor = COLORS.paddleGlow;
                ctx.shadowBlur = 20;
                ctx.beginPath();
                ctx.roundRect(this.paddle.x, this.paddle.y, this.paddle.w, this.paddle.h, PADDLE_RADIUS);
                const paddleGrad = ctx.createLinearGradient(
                    this.paddle.x, this.paddle.y,
                    this.paddle.x + this.paddle.w, this.paddle.y
                );
                paddleGrad.addColorStop(0, '#6c5ce7');
                paddleGrad.addColorStop(1, '#a855f7');
                ctx.fillStyle = paddleGrad;
                ctx.fill();
                ctx.shadowBlur = 0;

                /* Ball */
                ctx.shadowColor = COLORS.ballGlow;
                ctx.shadowBlur = 18;
                ctx.beginPath();
                ctx.arc(this.ball.x, this.ball.y, this.ball.r, 0, Math.PI * 2);
                const ballGrad = ctx.createRadialGradient(
                    this.ball.x - 2, this.ball.y - 2, 0,
                    this.ball.x, this.ball.y, this.ball.r
                );
                ballGrad.addColorStop(0, '#fff');
                ballGrad.addColorStop(0.4, COLORS.ball);
                ballGrad.addColorStop(1, '#ee5a6f');
                ctx.fillStyle = ballGrad;
                ctx.fill();
                ctx.shadowBlur = 0;

                /* Ball trail */
                ctx.beginPath();
                ctx.arc(this.ball.x - this.ball.dx * 0.5, this.ball.y - this.ball.dy * 0.5, this.ball.r * 0.7, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 107, 107, 0.3)';
                ctx.fill();
            }

            /* Particles */
            this.particles.forEach((p) => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.life;
                ctx.fill();
                ctx.globalAlpha = 1;
            });

            ctx.restore();
        }

        /* ---- Screen helpers ---- */
        showScreen(id) {
            ['game-start-screen', 'game-over-screen', 'game-clear-screen'].forEach((s) => {
                const el = document.getElementById(s);
                if (el) el.classList.toggle('is-visible', s === id);
            });
        }

        hideAllScreens() {
            ['game-start-screen', 'game-over-screen', 'game-clear-screen'].forEach((s) => {
                const el = document.getElementById(s);
                if (el) el.classList.remove('is-visible');
            });
        }
    }

    /* ==========================================================
       Boot
       ========================================================== */
    let game = null;

    function openGame() {
        const overlay = document.getElementById('game-overlay');
        const canvas = document.getElementById('game-canvas');
        const btn = document.getElementById('play-mode-btn');
        if (!overlay || !canvas) return;

        overlay.classList.add('is-visible');
        btn?.classList.add('is-active');
        document.body.style.overflow = 'hidden';

        if (!game) {
            game = new Game(canvas, overlay);
        } else {
            game.resize();
        }
        game.init();
        game.start();
    }

    function closeGame() {
        const overlay = document.getElementById('game-overlay');
        const btn = document.getElementById('play-mode-btn');
        if (!overlay) return;

        overlay.classList.remove('is-visible');
        btn?.classList.remove('is-active');
        document.body.style.overflow = '';

        if (game) {
            game.stop();
            game.hideAllScreens();
        }
    }

    /* ==========================================================
       Event Bindings (after DOM ready)
       ========================================================== */
    document.addEventListener('DOMContentLoaded', () => {
        /* Toggle button */
        const btn = document.getElementById('play-mode-btn');
        if (btn) {
            btn.addEventListener('click', () => {
                const overlay = document.getElementById('game-overlay');
                if (overlay?.classList.contains('is-visible')) {
                    closeGame();
                } else {
                    openGame();
                }
            });
        }

        /* Close button */
        const closeBtn = document.getElementById('game-close-btn');
        if (closeBtn) closeBtn.addEventListener('click', closeGame);

        /* Start button */
        const startBtn = document.getElementById('game-start-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                if (game) {
                    game.hideAllScreens();
                    game.init();
                    game.state = 'playing';
                }
            });
        }

        /* Retry button */
        const retryBtn = document.getElementById('game-retry-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                if (game) {
                    game.hideAllScreens();
                    game.init();
                    game.state = 'playing';
                }
            });
        }

        /* Clear — back to portfolio */
        const portfolioBtn = document.getElementById('game-portfolio-btn');
        if (portfolioBtn) portfolioBtn.addEventListener('click', closeGame);

        /* Clear — retry */
        const clearRetryBtn = document.getElementById('game-clear-retry-btn');
        if (clearRetryBtn) {
            clearRetryBtn.addEventListener('click', () => {
                if (game) {
                    game.hideAllScreens();
                    game.init();
                    game.state = 'playing';
                }
            });
        }

        /* Modal close */
        const modalClose = document.getElementById('game-modal-close');
        if (modalClose) {
            modalClose.addEventListener('click', () => {
                const modal = document.getElementById('game-modal');
                if (modal) modal.classList.remove('is-visible');
                if (game) game.resumeFromModal();
            });
        }

        /* Close modal on overlay click */
        const modal = document.getElementById('game-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('is-visible');
                    if (game) game.resumeFromModal();
                }
            });
        }

        /* ESC key to close */
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modal = document.getElementById('game-modal');
                if (modal?.classList.contains('is-visible')) {
                    modal.classList.remove('is-visible');
                    if (game) game.resumeFromModal();
                } else {
                    closeGame();
                }
            }
        });
    });
})();
