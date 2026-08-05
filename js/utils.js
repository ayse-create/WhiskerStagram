/* ============================================================
   WHISKERSTAGRAM — utils.js
   Ortak yardımcı fonksiyonlar: rastgelelik, sayı animasyonu,
   uçan kalpler, akan canlı yorumlar.
   ============================================================ */

const Utils = (() => {

  function rand(min, max){
    return Math.random() * (max - min) + min;
  }
  function randInt(min, max){
    return Math.floor(rand(min, max + 1));
  }
  function pick(arr){
    return arr[randInt(0, arr.length - 1)];
  }
  function pickMany(arr, n){
    const copy = [...arr];
    const out = [];
    while(out.length < n && copy.length){
      out.push(copy.splice(randInt(0, copy.length - 1), 1)[0]);
    }
    return out;
  }
  function shuffle(arr){
    const a = [...arr];
    for(let i = a.length - 1; i > 0; i--){
      const j = randInt(0, i);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function clamp(v, min, max){
    return Math.max(min, Math.min(max, v));
  }

  /* Bir sayıyı animasyonlu şekilde artırarak gösterir */
  function animateNumber(el, from, to, duration = 900, prefix = "", suffix = ""){
    const start = performance.now();
    function tick(now){
      const p = clamp((now - start) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = Math.round(from + (to - from) * eased);
      el.textContent = prefix + val.toLocaleString("tr-TR") + suffix;
      if(p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* Belirli bir konteynerin içinde yukarı uçan kalp/emoji efekti başlatır */
  function startFlyingHearts(container, { emojis = ["❤️"], intervalMs = [280, 650] } = {}){
    let stopped = false;
    function spawn(){
      if(stopped) return;
      const heart = document.createElement("span");
      heart.className = "flying-heart";
      heart.textContent = pick(emojis);
      heart.style.left = rand(0, 100) + "%";
      heart.style.setProperty("--drift", (rand(-30, 30)) + "px");
      container.appendChild(heart);
      setTimeout(() => heart.remove(), 2500);
      setTimeout(spawn, rand(intervalMs[0], intervalMs[1]));
    }
    spawn();
    return () => { stopped = true; };
  }

  /* Akan canlı yorum kutusu: comments dizisinden rastgele seçip ekler */
  function startLiveComments(container, comments, { intervalMs = [900, 1800], max = 4 } = {}){
    let stopped = false;
    function spawn(){
      if(stopped) return;
      const c = pick(comments);
      const bubble = document.createElement("div");
      bubble.className = "live-comment";
      bubble.innerHTML = `<b>@${escapeHtml(c.user)}</b> ${escapeHtml(c.text)}`;
      container.appendChild(bubble);
      while(container.children.length > max){
        container.removeChild(container.firstChild);
      }
      setTimeout(spawn, rand(intervalMs[0], intervalMs[1]));
    }
    spawn();
    return () => { stopped = true; };
  }

  function escapeHtml(str){
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function el(tag, className, html){
    const e = document.createElement(tag);
    if(className) e.className = className;
    if(html !== undefined) e.innerHTML = html;
    return e;
  }

  return {
    rand, randInt, pick, pickMany, shuffle, clamp,
    animateNumber, startFlyingHearts, startLiveComments,
    escapeHtml, el
  };
})();
