/* ============================================================
   WHISKERSTAGRAM — game3-reels.js
   Bölüm 3: Reels Editörü — klip sırala, filtre/açıklama/etiket seç
   ============================================================ */

const Game3 = (() => {

  const FILTERS = ["Doğal", "Pastel", "Retro", "Neon"];
  const FILTER_GRADIENTS = {
    "Doğal": "linear-gradient(120deg,#FFE8C7,#FFD59E)",
    "Pastel": "linear-gradient(120deg,#FFD6E8,#D6E8FF)",
    "Retro": "linear-gradient(120deg,#E8C79E,#8A6A4F)",
    "Neon": "linear-gradient(120deg,#B57BFF,#4FE3D0)"
  };

  const SCENARIOS = [
    {
      hint: "Kedin bugün enerji doluydu: önce uyandı, sonra oynadı, sonra atıştırdı, en sonunda yine kestirdi.",
      clips: [
        { id: "a", emoji: "🥱", label: "Uyanış" },
        { id: "b", emoji: "🧶", label: "Oyun Zamanı" },
        { id: "c", emoji: "🍪", label: "Atıştırma" },
        { id: "d", emoji: "😴", label: "Şekerleme" }
      ],
      idealFilter: "Doğal",
      captions: [
        { text: "Günün özeti: uyan, oyna, ye, tekrar uyu 😴", tier: "perfect" },
        { text: "Bugün hava çok güzeldi.", tier: "bad" },
        { text: "Kedim biraz yoruldu galiba.", tier: "ok" }
      ],
      hashtags: [
        { tag: "#kedigünlüğü", relevant: true },
        { tag: "#enerjikkedi", relevant: true },
        { tag: "#uykucukedi", relevant: true },
        { tag: "#yemektarifi", relevant: false },
        { tag: "#seyahat", relevant: false },
        { tag: "#spor", relevant: false }
      ]
    },
    {
      hint: "Kedin dışarıdan eve geldi: önce ayakkabı kokladı, sonra suyunu içti, sonra pencereden dışarı baktı, en son tüylerini temizledi.",
      clips: [
        { id: "a", emoji: "👃", label: "Ayakkabı Koklama" },
        { id: "b", emoji: "💧", label: "Su İçme" },
        { id: "c", emoji: "🪟", label: "Pencereden Bakış" },
        { id: "d", emoji: "🧼", label: "Temizlik" }
      ],
      idealFilter: "Pastel",
      captions: [
        { text: "Eve dönüş rutini tam 4 adım 🐾", tier: "perfect" },
        { text: "Bugün markete gittim.", tier: "bad" },
        { text: "Kedim biraz meraklıydı.", tier: "ok" }
      ],
      hashtags: [
        { tag: "#evrutini", relevant: true },
        { tag: "#meraklıkedi", relevant: true },
        { tag: "#pencerekedisi", relevant: true },
        { tag: "#konser", relevant: false },
        { tag: "#araba", relevant: false },
        { tag: "#kitap", relevant: false }
      ]
    },
    {
      hint: "Kedin bugün antrenman yaptı: ısındı, kutuya zıpladı, av oyuncağını yakaladı, sonunda gururla uzandı.",
      clips: [
        { id: "a", emoji: "🤸", label: "Isınma" },
        { id: "b", emoji: "📦", label: "Kutuya Zıplama" },
        { id: "c", emoji: "🎯", label: "Avı Yakalama" },
        { id: "d", emoji: "🛋️", label: "Rahat Uzanma" }
      ],
      idealFilter: "Neon",
      captions: [
        { text: "Bugünün antrenörü: benim kedim 💪🐾", tier: "perfect" },
        { text: "Hava durumu çok değişkendi.", tier: "bad" },
        { text: "Kedim biraz hareket etti.", tier: "ok" }
      ],
      hashtags: [
        { tag: "#kedisporu", relevant: true },
        { tag: "#avustası", relevant: true },
        { tag: "#kutukedisi", relevant: true },
        { tag: "#tatlı", relevant: false },
        { tag: "#müzik", relevant: false },
        { tag: "#yemek", relevant: false }
      ]
    }
  ];

  let cleanupFns = [];
  function cleanup(){ cleanupFns.forEach(fn => fn()); cleanupFns = []; }

  function start(container, onFinish){
    cleanup();
    const scenario = Utils.pick(SCENARIOS);
    const run = {
      order: Utils.shuffle(scenario.clips.map(c => c.id)),
      filter: null,
      captionIdx: null,
      tags: new Set()
    };

    container.innerHTML = `
      <div class="game-topbar">
        <div class="profile-chip">
          <div class="chip-avatar" style="${App.state.avatarURL ? `background-image:url(${App.state.avatarURL})` : ""}"></div>
          <div class="chip-name">@${Utils.escapeHtml(App.state.username || "sen")}</div>
        </div>
        <div class="viewer-chip">✂️ Reels Editörü</div>
      </div>

      <div class="g3-wrap">
        <div class="g3-stagehint">🎬 <b>Hikaye:</b> ${Utils.escapeHtml(scenario.hint)}</div>

        <div class="g3-section-title">1. Klipleri Doğru Sıraya Diz</div>
        <div class="clip-row" id="g3-clips"></div>

        <div class="g3-section-title">2. Filtre Seç</div>
        <div class="choice-row" id="g3-filters"></div>

        <div class="g3-section-title">3. Açıklama Seç</div>
        <div class="choice-row" id="g3-captions"></div>

        <div class="g3-section-title">4. Etiket Seç (en fazla 3)</div>
        <div class="tag-row" id="g3-tags"></div>
      </div>

      <div class="g3-footer">
        <button class="btn btn-primary btn-big" id="g3-publish-btn">Paylaş</button>
      </div>
    `;

    renderClips(container, scenario, run);
    renderFilters(container, run);
    renderCaptions(container, scenario, run);
    renderTags(container, scenario, run);

    container.querySelector("#g3-publish-btn").addEventListener("click", () => {
      const score = evaluate(scenario, run);
      cleanup();
      onFinish(score);
    });
  }

  function renderClips(container, scenario, run){
    const row = container.querySelector("#g3-clips");
    const byId = Object.fromEntries(scenario.clips.map(c => [c.id, c]));

    function draw(){
      row.innerHTML = "";
      run.order.forEach((id, i) => {
        const c = byId[id];
        const card = Utils.el("div", "clip-card", `
          <div class="clip-order-badge">${i + 1}</div>
          <span class="emoji">${c.emoji}</span>
          <span class="clip-label">${c.label}</span>
          <div class="clip-move-btns">
            <button data-dir="-1" ${i === 0 ? "disabled" : ""}>◀</button>
            <button data-dir="1" ${i === run.order.length - 1 ? "disabled" : ""}>▶</button>
          </div>
        `);
        card.querySelectorAll("button").forEach(btn => {
          btn.addEventListener("click", () => {
            const dir = parseInt(btn.dataset.dir, 10);
            const j = i + dir;
            [run.order[i], run.order[j]] = [run.order[j], run.order[i]];
            draw();
          });
        });
        row.appendChild(card);
      });
    }
    draw();
  }

  function renderFilters(container, run){
    const row = container.querySelector("#g3-filters");
    FILTERS.forEach(name => {
      const card = Utils.el("div", "choice-card", `
        <div class="filter-swatch" style="background:${FILTER_GRADIENTS[name]}"></div>
        ${name}
      `);
      card.addEventListener("click", () => {
        row.querySelectorAll(".choice-card").forEach(c => c.classList.remove("selected"));
        card.classList.add("selected");
        run.filter = name;
      });
      row.appendChild(card);
    });
  }

  function renderCaptions(container, scenario, run){
    const row = container.querySelector("#g3-captions");
    const shuffled = Utils.shuffle(scenario.captions.map((c, i) => ({ ...c, idx: i })));
    shuffled.forEach(cap => {
      const card = Utils.el("div", "choice-card", `"${Utils.escapeHtml(cap.text)}"`);
      card.addEventListener("click", () => {
        row.querySelectorAll(".choice-card").forEach(c => c.classList.remove("selected"));
        card.classList.add("selected");
        run.captionIdx = cap.idx;
      });
      row.appendChild(card);
    });
  }

  function renderTags(container, scenario, run){
    const row = container.querySelector("#g3-tags");
    const shuffled = Utils.shuffle(scenario.hashtags);
    shuffled.forEach(tagInfo => {
      const chip = Utils.el("div", "tag-chip", tagInfo.tag);
      chip.addEventListener("click", () => {
        if(run.tags.has(tagInfo.tag)){
          run.tags.delete(tagInfo.tag);
          chip.classList.remove("selected");
        } else {
          if(run.tags.size >= 3) return;
          run.tags.add(tagInfo.tag);
          chip.classList.add("selected");
        }
      });
      row.appendChild(chip);
    });
  }

  function evaluate(scenario, run){
    // sıralama skoru
    const correctIds = scenario.clips.map(c => c.id);
    let matches = 0;
    run.order.forEach((id, i) => { if(id === correctIds[i]) matches++; });
    const orderScore = (matches / correctIds.length) * 100;

    // filtre skoru
    const filterScore = run.filter === scenario.idealFilter ? 100 : (run.filter ? 45 : 0);

    // açıklama skoru
    let captionScore = 0;
    if(run.captionIdx !== null){
      const tier = scenario.captions[run.captionIdx].tier;
      captionScore = tier === "perfect" ? 100 : tier === "ok" ? 55 : 15;
    }

    // etiket skoru
    const relevantTags = scenario.hashtags.filter(h => h.relevant).map(h => h.tag);
    let relevantHit = 0, irrelevantHit = 0;
    run.tags.forEach(t => {
      if(relevantTags.includes(t)) relevantHit++; else irrelevantHit++;
    });
    const hashtagScore = Utils.clamp((relevantHit / relevantTags.length) * 100 - irrelevantHit * 20, 0, 100);

    return orderScore * 0.4 + filterScore * 0.15 + captionScore * 0.25 + hashtagScore * 0.2;
  }

  return { start };
})();
