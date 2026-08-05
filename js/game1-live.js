/* ============================================================
   WHISKERSTAGRAM — game1-live.js
   Bölüm 1: Canlı Yemek Yayını
   ============================================================ */

const Game1 = (() => {

  const RECIPES = [
    {
      hint: "Kediler turuncu ve tatlı şeyleri sever, ama çikolatadan uzak durmalı!",
      correct: [
        { emoji: "🥕", name: "Havuç" },
        { emoji: "🍯", name: "Bal" }
      ],
      wrong: [
        { emoji: "🍫", name: "Çikolata" },
        { emoji: "🧅", name: "Soğan" },
        { emoji: "🧄", name: "Sarımsak" },
        { emoji: "🍋", name: "Limon" },
        { emoji: "🧂", name: "Tuz" },
        { emoji: "🍌", name: "Muz" }
      ],
      idealMinutes: 5
    },
    {
      hint: "Kediler balık kokusuna bayılır, yanına biraz yumuşak protein de iyi gider.",
      correct: [
        { emoji: "🐟", name: "Balık" },
        { emoji: "🍗", name: "Tavuk" }
      ],
      wrong: [
        { emoji: "🍫", name: "Çikolata" },
        { emoji: "🧅", name: "Soğan" },
        { emoji: "🍋", name: "Limon" },
        { emoji: "🧂", name: "Tuz" },
        { emoji: "🥕", name: "Havuç" },
        { emoji: "🍌", name: "Muz" }
      ],
      idealMinutes: 7
    },
    {
      hint: "Kediler süt ürünlerini sever ama biraz lif eklemek de fena olmaz.",
      correct: [
        { emoji: "🥛", name: "Süt" },
        { emoji: "🌾", name: "Yulaf" }
      ],
      wrong: [
        { emoji: "🍫", name: "Çikolata" },
        { emoji: "🧄", name: "Sarımsak" },
        { emoji: "🍋", name: "Limon" },
        { emoji: "🧂", name: "Tuz" },
        { emoji: "🐟", name: "Balık" },
        { emoji: "🍇", name: "Üzüm" }
      ],
      idealMinutes: 3
    }
  ];

  const COMMENTS = [
    { user: "mirnav", text: "bu ne şimdi 😻" },
    { user: "patiliaşçı", text: "acele et yayıncı!" },
    { user: "kedigözü", text: "kokusu buradan geliyor" },
    { user: "tekirfan", text: "harika gidiyor!" },
    { user: "whiskerfan34", text: "ellerine sağlık 🔥" },
    { user: "minnoş_", text: "tarifi merak ettim" }
  ];

  let cleanupFns = [];

  function cleanup(){
    cleanupFns.forEach(fn => fn());
    cleanupFns = [];
  }

  function start(container, onFinish){
    cleanup();
    const recipe = Utils.pick(RECIPES);
    const run = { selected: new Set(), chopScore: 0, mixScore: 0, cookScore: 0, ingredientScore: 0 };

    container.innerHTML = `
      <div class="game-topbar">
        <div class="profile-chip">
          <div class="chip-avatar" style="${App.state.avatarURL ? `background-image:url(${App.state.avatarURL})` : ""}"></div>
          <div>
            <div class="chip-name">@${Utils.escapeHtml(App.state.username || "sen")}</div>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <div class="viewer-chip">👁 ${Utils.randInt(120, 980)}</div>
          <div class="live-badge"><span class="live-dot"></span>LIVE</div>
        </div>
      </div>

      <div class="g1-body">
        <div class="g1-hint">🐾 <div><b>İpucu:</b> ${Utils.escapeHtml(recipe.hint)}</div></div>
        <div class="g1-stepbar">
          <div class="g1-step-dot current" data-step="0"></div>
          <div class="g1-step-dot" data-step="1"></div>
          <div class="g1-step-dot" data-step="2"></div>
          <div class="g1-step-dot" data-step="3"></div>
        </div>
        <div class="g1-panel" id="g1-panel"></div>
        <div class="g1-footer" id="g1-footer"></div>
      </div>

      <div class="live-overlay" id="g1-comments"></div>
      <div class="heart-field" id="g1-hearts"></div>
    `;

    const stopHearts = Utils.startFlyingHearts(container.querySelector("#g1-hearts"), { emojis: ["❤️","💛","🧡"] });
    const stopComments = Utils.startLiveComments(container.querySelector("#g1-comments"), COMMENTS);
    cleanupFns.push(stopHearts, stopComments);

    setStep(container, 0);
    renderIngredientStep(container, recipe, run, onFinish);
  }

  function setStep(container, idx){
    container.querySelectorAll(".g1-step-dot").forEach((dot, i) => {
      dot.classList.remove("current", "done");
      if(i < idx) dot.classList.add("done");
      else if(i === idx) dot.classList.add("current");
    });
  }

  /* ---------------- ADIM 1: Malzeme seçimi ---------------- */
  function renderIngredientStep(container, recipe, run, onFinish){
    const panel = container.querySelector("#g1-panel");
    const footer = container.querySelector("#g1-footer");
    const items = Utils.shuffle([...recipe.correct, ...recipe.wrong]);

    panel.innerHTML = `
      <h3 style="margin-bottom:2px;">Malzemeleri Seç</h3>
      <p class="muted small" style="margin-bottom:8px;">İpucuna göre doğru malzemeleri işaretle.</p>
      <div class="g1-ingredients" id="g1-ingredients"></div>
    `;
    const grid = panel.querySelector("#g1-ingredients");
    items.forEach(item => {
      const card = Utils.el("div", "ingredient-card", `<span class="emoji">${item.emoji}</span><span class="name">${item.name}</span>`);
      card.addEventListener("click", () => {
        if(run.selected.has(item.name)){
          run.selected.delete(item.name);
          card.classList.remove("selected");
        } else {
          run.selected.add(item.name);
          card.classList.add("selected");
        }
      });
      grid.appendChild(card);
    });

    footer.innerHTML = `<button class="btn btn-primary btn-big" id="g1-next-1">Doğrama Aşamasına Geç</button>`;
    footer.querySelector("#g1-next-1").addEventListener("click", () => {
      const correctNames = recipe.correct.map(c => c.name);
      let correctHit = 0, wrongHit = 0;
      run.selected.forEach(name => {
        if(correctNames.includes(name)) correctHit++; else wrongHit++;
      });
      const raw = (correctHit / correctNames.length) * 100 - wrongHit * 25;
      run.ingredientScore = Utils.clamp(raw, 0, 100);
      setStep(container, 1);
      renderZoneStep(container, {
        title: "Malzemeleri Doğra",
        desc: "Bıçak doğru bölgedeyken 'Doğra!' butonuna bas.",
        emoji: "🔪",
        buttonLabel: "Doğra!",
        onDone: (score) => {
          run.chopScore = score;
          setStep(container, 2);
          renderZoneStep(container, {
            title: "Karıştır",
            desc: "Kepçe doğru bölgedeyken 'Karıştır!' butonuna bas.",
            emoji: "🥄",
            buttonLabel: "Karıştır!",
            onDone: (score2) => {
              run.mixScore = score2;
              setStep(container, 3);
              renderCookStep(container, recipe, run, onFinish);
            }
          }, container.querySelector("#g1-panel"), container.querySelector("#g1-footer"));
        }
      }, panel, footer);
    });
  }

  /* ---------------- ADIM 2 & 3: Doğrama / Karıştırma (bölgede yakala) ---------------- */
  function renderZoneStep(container, cfg, panel, footer){
    const zoneStart = Utils.randInt(30, 60);
    const zoneWidth = 22;

    panel.innerHTML = `
      <h3>${cfg.title}</h3>
      <p class="muted small">${cfg.desc}</p>
      <div class="g1-action-panel">
        <div class="action-emoji-plate shaking">${cfg.emoji}</div>
        <div class="progress-track" style="position:relative;">
          <div class="progress-fill" id="g1-zone-fill"></div>
          <div style="position:absolute; top:0; left:${zoneStart}%; width:${zoneWidth}%; height:100%; background:rgba(127,231,196,.45); border-radius:999px;"></div>
        </div>
      </div>
    `;
    footer.innerHTML = `<button class="btn btn-primary btn-big" id="g1-zone-btn">${cfg.buttonLabel}</button>`;

    let pos = 0, dir = 1, running = true;
    const fill = panel.querySelector("#g1-zone-fill");
    function frame(){
      if(!running) return;
      pos += dir * 1.8;
      if(pos >= 100){ pos = 100; dir = -1; }
      if(pos <= 0){ pos = 0; dir = 1; }
      fill.style.width = pos + "%";
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    footer.querySelector("#g1-zone-btn").addEventListener("click", () => {
      running = false;
      const zoneCenter = zoneStart + zoneWidth / 2;
      const dist = Math.abs(pos - zoneCenter);
      const score = Utils.clamp(100 - dist * 3.2, 0, 100);
      cfg.onDone(score);
    });
  }

  /* ---------------- ADIM 4: Pişirme süresi + fırın ---------------- */
  function renderCookStep(container, recipe, run, onFinish){
    const panel = container.querySelector("#g1-panel");
    const footer = container.querySelector("#g1-footer");
    let minutes = 5;

    panel.innerHTML = `
      <h3>Pişirme Süresini Ayarla</h3>
      <p class="muted small">İpucuna göre doğru süreyi tahmin et ve fırına koy.</p>
      <div class="g1-action-panel">
        <div class="g1-timer-select">
          <button class="timer-btn" id="g1-min-down">−</button>
          <div class="timer-value" id="g1-min-value">${minutes} <span>dk</span></div>
          <button class="timer-btn" id="g1-min-up">+</button>
        </div>
        <div class="g1-oven" id="g1-oven">🍪</div>
      </div>
    `;
    const valueEl = panel.querySelector("#g1-min-value");
    panel.querySelector("#g1-min-down").addEventListener("click", () => {
      minutes = Utils.clamp(minutes - 1, 1, 12);
      valueEl.innerHTML = `${minutes} <span>dk</span>`;
    });
    panel.querySelector("#g1-min-up").addEventListener("click", () => {
      minutes = Utils.clamp(minutes + 1, 1, 12);
      valueEl.innerHTML = `${minutes} <span>dk</span>`;
    });

    footer.innerHTML = `<button class="btn btn-primary btn-big" id="g1-bake-btn">Fırına Koy</button>`;
    footer.querySelector("#g1-bake-btn").addEventListener("click", () => {
      const oven = panel.querySelector("#g1-oven");
      oven.classList.add("baking");
      oven.innerHTML = `<div class="oven-glow"></div>🔥`;
      footer.querySelector("#g1-bake-btn").disabled = true;

      setTimeout(() => {
        const diff = Math.abs(minutes - recipe.idealMinutes);
        run.cookScore = Utils.clamp(100 - diff * 22, 0, 100);
        finishGame1(container, recipe, run, onFinish);
      }, 1800);
    });
  }

  function finishGame1(container, recipe, run, onFinish){
    const total =
      run.ingredientScore * 0.35 +
      run.chopScore * 0.2 +
      run.mixScore * 0.2 +
      run.cookScore * 0.25;

    cleanup();
    onFinish(total);
  }

  return { start };
})();
