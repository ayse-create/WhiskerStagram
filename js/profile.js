/* ============================================================
   WHISKERSTAGRAM — profile.js
   Oyun sonu profil / sonuç ekranı
   ============================================================ */

const Profile = (() => {

  const LEVELS = [
    { min: 90, name: "Efsane Yayıncı" },
    { min: 75, name: "Viral" },
    { min: 55, name: "Fenomen" },
    { min: 35, name: "Popüler" },
    { min: 0,  name: "Yeni Başlayan" }
  ];

  function levelFor(avgPct){
    return LEVELS.find(l => avgPct >= l.min).name;
  }

  function render(container, state, { restart, goHome }){
    const totalLikes = state.chapterLikes.reduce((a, b) => a + b, 0);
    const avgPct = state.chapterPct.reduce((a, b) => a + b, 0) / state.chapterPct.length;

    // takipçi: performansa dayalı, küçük doğal dalgalanma ile
    const jitter = 1 + Utils.rand(-0.03, 0.03);
    const followers = Math.round(Math.pow(avgPct / 100, 1.3) * 42000 * jitter) + Utils.randInt(20, 90);

    const level = levelFor(avgPct);

    container.innerHTML = `
      <div class="profile-wrap">
        <div class="profile-avatar" style="${state.avatarURL ? `background-image:url(${state.avatarURL})` : ""}">
          ${state.avatarURL ? "" : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:34px;">🐱</div>`}
        </div>
        <div class="profile-username">@${Utils.escapeHtml(state.username || "sen")}</div>
        <div class="profile-followers"><b id="pf-followers">0</b> takipçi</div>
        <div class="profile-level" id="pf-level"></div>

        <div class="profile-stats">
          <div class="stat-card">
            <div class="num" id="pf-total-like">0</div>
            <div class="lbl">Toplam Like</div>
          </div>
          <div class="stat-card">
            <div class="num">${state.chapterLikes.map(n => "+" + n.toLocaleString("tr-TR")).join(" · ")}</div>
            <div class="lbl">Bölüm Bazlı</div>
          </div>
        </div>

        <div class="profile-actions">
          <button class="btn btn-secondary btn-big" id="pf-home-btn">Ana Sayfaya Dön</button>
          <button class="btn btn-primary btn-big" id="pf-restart-btn">Tekrar Oyna</button>
        </div>
      </div>
    `;

    const followersEl = container.querySelector("#pf-followers");
    const totalLikeEl = container.querySelector("#pf-total-like");
    setTimeout(() => {
      Utils.animateNumber(followersEl, 0, followers, 1300);
      Utils.animateNumber(totalLikeEl, 0, totalLikes, 1300);
    }, 200);

    const levelBadge = container.querySelector("#pf-level");
    levelBadge.textContent = level;
    levelBadge.style.opacity = "0";
    setTimeout(() => {
      levelBadge.style.transition = "opacity .5s ease, transform .5s cubic-bezier(.2,1.4,.4,1)";
      levelBadge.style.opacity = "1";
    }, 500);

    container.querySelector("#pf-restart-btn").addEventListener("click", restart);
    container.querySelector("#pf-home-btn").addEventListener("click", goHome);
  }

  return { render };
})();
