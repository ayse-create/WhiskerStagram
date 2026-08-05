/* ============================================================
   WHISKERSTAGRAM — app.js
   Global state, ekran (screen) yönetimi ve bölüm akışının
   orkestrasyonu. game1-live.js / game2-draw.js / game3-reels.js
   modülleri kendi ekranlarını doldurur ve bittiğinde
   App.finishChapter(pct) çağırır.
   ============================================================ */

const App = (() => {

  const state = {
    username: "",
    avatarURL: null,
    chapterIndex: 0,          // 0,1,2
    chapterLikes: [0, 0, 0],  // her bölümden kazanılan like
    chapterPct: [0, 0, 0]     // her bölümün performans yüzdesi (0-100)
  };

  const MAX_LIKES = [500, 1000, 1500]; // bölüm başına üst sınır (spec örnekleriyle uyumlu)

  const CHAPTERS = [
    {
      key: "game1",
      eyebrow: "BÖLÜM 1 / 3",
      title: "Canlı Yemek Yayını",
      desc: "Takipçilerin için canlıya geç. İpucunu oku, doğru malzemeleri seç, doğra, karıştır ve doğru sürede pişir.",
      start: () => Game1.start(document.getElementById("screen-game1"), App.finishChapter)
    },
    {
      key: "game2",
      eyebrow: "BÖLÜM 2 / 3",
      title: "Kedi Çizimi",
      desc: "Boş tuvale takipçilerinin bayılacağı yaratıcı bir kedi çiz. Ne kadar özenli olursa o kadar Like!",
      start: () => Game2.start(document.getElementById("screen-game2"), App.finishChapter)
    },
    {
      key: "game3",
      eyebrow: "BÖLÜM 3 / 3",
      title: "Reels Editörü",
      desc: "Klipleri doğru sırala, en uygun filtreyi, açıklamayı ve etiketleri seç. Viral olmaya hazır mısın?",
      start: () => Game3.start(document.getElementById("screen-game3"), App.finishChapter)
    }
  ];

  /* ---------------- ekran yönetimi ---------------- */

  function showScreen(name){
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    const target = document.querySelector(`.screen[data-screen="${name}"]`);
    if(target) target.classList.add("active");
    const phoneScreen = document.getElementById("phone-screen");
    phoneScreen.scrollTop = 0;
  }

  /* ---------------- onboarding ---------------- */

  function initOnboarding(){
    const avatarInput = document.getElementById("avatar-input");
    const avatarPreview = document.getElementById("avatar-preview");
    const usernameInput = document.getElementById("username-input");
    const confirmBtn = document.getElementById("btn-confirm-onboarding");

    avatarInput.addEventListener("change", () => {
      const file = avatarInput.files[0];
      if(!file) return;
      const reader = new FileReader();
      reader.onload = e => {
        state.avatarURL = e.target.result;
        avatarPreview.style.backgroundImage = `url(${state.avatarURL})`;
        avatarPreview.querySelector(".avatar-placeholder").style.display = "none";
        validateOnboarding();
      };
      reader.readAsDataURL(file);
    });

    usernameInput.addEventListener("input", validateOnboarding);

    function validateOnboarding(){
      const name = usernameInput.value.trim();
      confirmBtn.disabled = name.length < 3;
    }

    confirmBtn.addEventListener("click", () => {
      state.username = usernameInput.value.trim();
      if(!state.avatarURL) state.avatarURL = null; // placeholder emoji kullanılacak
      state.chapterIndex = 0;
      goToChapterIntro(0);
    });

    document.getElementById("btn-start-onboarding").addEventListener("click", () => {
      showScreen("onboarding");
    });
  }

  /* ---------------- bölüm akışı ---------------- */

  function goToChapterIntro(index){
    const ch = CHAPTERS[index];
    document.getElementById("chapter-eyebrow").textContent = ch.eyebrow;
    document.getElementById("chapter-title").textContent = ch.title;
    document.getElementById("chapter-desc").textContent = ch.desc;
    showScreen("chapter-intro");

    const startBtn = document.getElementById("btn-chapter-start");
    startBtn.onclick = () => {
      showScreen(ch.key);
      ch.start();
    };
  }

  /* Oyun modülleri bölümü bitirince burayı çağırır. pct: 0-100 performans */
  function finishChapter(pct, opts = {}){
    pct = Utils.clamp(Math.round(pct), 0, 100);
    const idx = state.chapterIndex;

    // biraz doğal dalgalanma (performans temelli, tamamen rastgele değil)
    const jitter = Utils.rand(-0.04, 0.04);
    const effectivePct = Utils.clamp(pct / 100 + jitter, 0, 1);
    const likeAmount = Math.round(MAX_LIKES[idx] * effectivePct);

    state.chapterPct[idx] = pct;
    state.chapterLikes[idx] = likeAmount;

    showResult(pct, likeAmount, opts);
  }

  function showResult(pct, likeAmount, opts){
    let emoji, text;
    if(pct >= 85){ emoji = "😻"; text = "Çok beğendi!"; }
    else if(pct >= 65){ emoji = "😺"; text = "Beğendi"; }
    else if(pct >= 40){ emoji = "😼"; text = "Fena değil"; }
    else { emoji = "🙀"; text = "Hiç sevmedi"; }

    if(opts.emoji) emoji = opts.emoji;
    if(opts.text) text = opts.text;

    document.getElementById("result-cat-emoji").textContent = emoji;
    document.getElementById("result-reaction-text").textContent = text;
    const numberEl = document.getElementById("result-like-number");
    numberEl.textContent = "+0";

    showScreen("result");
    setTimeout(() => Utils.animateNumber(numberEl, 0, likeAmount, 1100, "+"), 150);

    const continueBtn = document.getElementById("btn-result-continue");
    continueBtn.onclick = () => {
      const nextIndex = state.chapterIndex + 1;
      if(nextIndex < CHAPTERS.length){
        state.chapterIndex = nextIndex;
        goToChapterIntro(nextIndex);
      } else {
        Profile.render(document.getElementById("screen-profile"), state, {
          restart: restartFromChapters,
          goHome: goHome
        });
        showScreen("profile");
      }
    };
  }

  function restartFromChapters(){
    state.chapterIndex = 0;
    state.chapterLikes = [0, 0, 0];
    state.chapterPct = [0, 0, 0];
    goToChapterIntro(0);
  }

  function goHome(){
    state.username = "";
    state.avatarURL = null;
    state.chapterIndex = 0;
    state.chapterLikes = [0, 0, 0];
    state.chapterPct = [0, 0, 0];
    document.getElementById("username-input").value = "";
    const avatarPreview = document.getElementById("avatar-preview");
    avatarPreview.style.backgroundImage = "";
    avatarPreview.querySelector(".avatar-placeholder").style.display = "";
    document.getElementById("btn-confirm-onboarding").disabled = true;
    showScreen("welcome");
  }

  function init(){
    initOnboarding();
    showScreen("welcome");
  }

  document.addEventListener("DOMContentLoaded", init);

  return { state, finishChapter, showScreen };
})();
