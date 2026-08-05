/* ============================================================
   WHISKERSTAGRAM — game2-draw.js
   Bölüm 2: Kedi Çizimi
   ============================================================ */

const Game2 = (() => {

  const COLORS = ["#241933", "#FF5C8A", "#FFB15E", "#4FD8AE", "#8FB8FF", "#FFFFFF"];
  const COMMENTS = [
    { user: "cizimsever", text: "kulaklar çok tatlı!" },
    { user: "sanatkedi", text: "renklere bayıldım 🎨" },
    { user: "furkan_art", text: "kuyruğu da ekle bence" },
    { user: "mırnav99", text: "bu tuvalin en iyisi" },
    { user: "patifan", text: "devam et devam et!" }
  ];

  let cleanupFns = [];
  function cleanup(){ cleanupFns.forEach(fn => fn()); cleanupFns = []; }

  function start(container, onFinish){
    cleanup();

    container.innerHTML = `
      <div class="game-topbar">
        <div class="profile-chip">
          <div class="chip-avatar" style="${App.state.avatarURL ? `background-image:url(${App.state.avatarURL})` : ""}"></div>
          <div class="chip-name">@${Utils.escapeHtml(App.state.username || "sen")}</div>
        </div>
        <div class="live-badge"><span class="live-dot"></span>LIVE</div>
      </div>

      <div class="g2-wrap">
        <div class="g2-toolbar">
          <button class="tool-btn active" id="tool-pen" title="Kalem">✏️</button>
          <button class="tool-btn" id="tool-eraser" title="Silgi">🧽</button>
          <div class="tool-swatches" id="tool-swatches"></div>
          <div class="brush-size-row">
            <input type="range" min="2" max="26" value="8" id="brush-size">
            <span>Fırça</span>
          </div>
          <button class="tool-btn" id="tool-clear" title="Temizle">🗑️</button>
        </div>
        <div class="g2-canvas-wrap">
          <canvas id="draw-canvas"></canvas>
        </div>
      </div>

      <div class="g2-footer">
        <div class="g2-checklist" id="g2-checklist">
          <span data-k="ear">🐾 Kulak</span>
          <span data-k="eye">👀 Göz</span>
          <span data-k="tail">〰️ Kuyruk</span>
          <span data-k="color">🎨 Renk</span>
        </div>
        <button class="btn btn-primary btn-big" id="g2-share-btn">Paylaş</button>
      </div>

      <div class="live-overlay" id="g2-comments"></div>
      <div class="heart-field" id="g2-hearts"></div>
    `;

    const stopHearts = Utils.startFlyingHearts(container.querySelector("#g2-hearts"), { emojis: ["❤️","✨","💗"], intervalMs:[500,1000] });
    const stopComments = Utils.startLiveComments(container.querySelector("#g2-comments"), COMMENTS, { intervalMs:[1400,2400] });
    cleanupFns.push(stopHearts, stopComments);

    const canvas = container.querySelector("#draw-canvas");
    const ctx = canvas.getContext("2d");
    const wrap = container.querySelector(".g2-canvas-wrap");

    function sizeCanvas(){
      const rect = wrap.getBoundingClientRect();
      canvas.width = Math.max(280, Math.floor(rect.width));
      canvas.height = Math.max(180, Math.floor(rect.height));
      ctx.fillStyle = "#fdf6ec";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    sizeCanvas();

    const run = { strokeCount: 0, colorsUsed: new Set(), erasing: false, color: COLORS[0], size: 8 };

    // renk paleti
    const swatchWrap = container.querySelector("#tool-swatches");
    COLORS.forEach((c, i) => {
      const sw = Utils.el("div", "swatch" + (i === 0 ? " active" : ""));
      sw.style.background = c;
      sw.addEventListener("click", () => {
        swatchWrap.querySelectorAll(".swatch").forEach(s => s.classList.remove("active"));
        sw.classList.add("active");
        run.color = c;
        run.erasing = false;
        container.querySelector("#tool-pen").classList.add("active");
        container.querySelector("#tool-eraser").classList.remove("active");
      });
      swatchWrap.appendChild(sw);
    });

    container.querySelector("#tool-pen").addEventListener("click", () => {
      run.erasing = false;
      container.querySelector("#tool-pen").classList.add("active");
      container.querySelector("#tool-eraser").classList.remove("active");
    });
    container.querySelector("#tool-eraser").addEventListener("click", () => {
      run.erasing = true;
      container.querySelector("#tool-eraser").classList.add("active");
      container.querySelector("#tool-pen").classList.remove("active");
    });
    container.querySelector("#brush-size").addEventListener("input", (e) => {
      run.size = parseInt(e.target.value, 10);
    });
    container.querySelector("#tool-clear").addEventListener("click", () => {
      sizeCanvas();
      run.strokeCount = 0;
      run.colorsUsed.clear();
      updateChecklist(container, run);
    });

    // çizim mantığı
    let drawing = false, lastX = 0, lastY = 0;
    function getPos(evt){
      const rect = canvas.getBoundingClientRect();
      const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
      const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;
      return {
        x: (clientX - rect.left) * (canvas.width / rect.width),
        y: (clientY - rect.top) * (canvas.height / rect.height)
      };
    }
    function pointerDown(evt){
      drawing = true;
      const p = getPos(evt);
      lastX = p.x; lastY = p.y;
      run.strokeCount++;
      if(!run.erasing) run.colorsUsed.add(run.color);
      updateChecklist(container, run);
      drawDot(p.x, p.y);
    }
    function pointerMove(evt){
      if(!drawing) return;
      const p = getPos(evt);
      drawLine(lastX, lastY, p.x, p.y);
      lastX = p.x; lastY = p.y;
    }
    function pointerUp(){ drawing = false; }

    function drawDot(x, y){
      ctx.beginPath();
      ctx.fillStyle = run.erasing ? "#fdf6ec" : run.color;
      ctx.arc(x, y, run.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    function drawLine(x1, y1, x2, y2){
      ctx.beginPath();
      ctx.strokeStyle = run.erasing ? "#fdf6ec" : run.color;
      ctx.lineWidth = run.size;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    canvas.addEventListener("pointerdown", pointerDown);
    canvas.addEventListener("pointermove", pointerMove);
    window.addEventListener("pointerup", pointerUp);
    cleanupFns.push(() => {
      canvas.removeEventListener("pointerdown", pointerDown);
      canvas.removeEventListener("pointermove", pointerMove);
      window.removeEventListener("pointerup", pointerUp);
    });

    container.querySelector("#g2-share-btn").addEventListener("click", () => {
      const score = evaluateDrawing(ctx, canvas, run);
      cleanup();
      onFinish(score);
    });
  }

  function updateChecklist(container, run){
    const list = container.querySelector("#g2-checklist");
    const s = run.strokeCount;
    setActive(list, "ear", s >= 2);
    setActive(list, "eye", s >= 4);
    setActive(list, "tail", s >= 7);
    setActive(list, "color", run.colorsUsed.size >= 2);
  }
  function setActive(list, key, active){
    const node = list.querySelector(`[data-k="${key}"]`);
    if(!node) return;
    node.style.opacity = active ? "1" : ".4";
    node.style.color = active ? "var(--mint)" : "";
  }

  /* Tuvali örnekleyerek kabaca bir "kalite" skoru üretir */
  function evaluateDrawing(ctx, canvas, run){
    const step = 6;
    let colored = 0, total = 0;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    for(let y = 0; y < canvas.height; y += step){
      for(let x = 0; x < canvas.width; x += step){
        const idx = (y * canvas.width + x) * 4;
        const r = data[idx], g = data[idx+1], b = data[idx+2];
        total++;
        // arka plan rengi ~ (253,246,236) değilse "boyanmış" sayılır
        if(Math.abs(r-253) > 14 || Math.abs(g-246) > 14 || Math.abs(b-236) > 14) colored++;
      }
    }
    const coverage = total ? colored / total : 0; // 0..1

    // kapsama alanı için üçgen skor: %10-%45 arası ideal bant
    let coverageScore;
    if(coverage < 0.10) coverageScore = (coverage / 0.10) * 70;
    else if(coverage <= 0.45) coverageScore = 70 + ((coverage - 0.10) / 0.35) * 30;
    else coverageScore = Utils.clamp(100 - (coverage - 0.45) * 90, 30, 100);

    const colorScore = Utils.clamp((run.colorsUsed.size / 4) * 100, 0, 100);
    const strokeScore = Utils.clamp((run.strokeCount / 8) * 100, 0, 100);

    return coverageScore * 0.4 + colorScore * 0.25 + strokeScore * 0.35;
  }

  return { start };
})();
