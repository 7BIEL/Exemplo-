(function () {
  var NQ = window.NQ || {};
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var esc = function (t) { var d = document.createElement("div"); d.textContent = t == null ? "" : t; return d.innerHTML; };
  document.documentElement.classList.add("js");

  /* ---------- links oficiais ---------- */
  var addr = NQ.endereco || {};
  var q = encodeURIComponent([addr.rua, addr.bairro, addr.cidade + " - " + addr.uf].join(", "));
  var links = {
    instagram: NQ.instagram,
    maps: "https://www.google.com/maps/search/?api=1&query=" + q,
    reserva: NQ.whatsapp ? "https://wa.me/" + NQ.whatsapp + "?text=" + encodeURIComponent(NQ.whatsappMensagem || "") : NQ.instagram,
    ifood: NQ.ifood || NQ.instagram,
    spotify: NQ.spotify || NQ.instagram,
    cardapio: NQ.cardapioUrl || NQ.ifood || NQ.instagram
  };
  document.querySelectorAll("[data-link]").forEach(function (a) {
    var k = a.getAttribute("data-link");
    if (links[k]) { a.href = links[k]; a.target = "_blank"; a.rel = "noopener"; }
  });
  if (!NQ.whatsapp) {
    var nota = $("#reserva-nota");
    if (nota) nota.textContent = "Reservas pelo Instagram @nossoquintallimeira até o WhatsApp oficial entrar no ar.";
  }

  /* ---------- nossa história ---------- */
  var HIST = [
    ["comoNasceu", "Como nasceu o Nosso Quintal"], ["quemIdealizou", "Quem idealizou o espaço"],
    ["porQueONome", "Por que o nome Nosso Quintal"], ["evolucao", "A evolução da casa"],
    ["filosofia", "Nossa filosofia"], ["momentos", "Momentos importantes"]
  ];
  var h = NQ.historia || {};
  var hl = $("#historia-list");
  if (hl) hl.innerHTML = HIST.map(function (i) {
    return h[i[0]] ? "<li><b>" + i[1] + ".</b> " + esc(h[i[0]]) + "</li>"
                   : '<li><b>' + i[1] + '.</b> <span class="pend">A contar, com as palavras de quem fez.</span></li>';
  }).join("");

  /* ---------- helpers de foto/prato ---------- */
  function foto(src, alt, ratio, label) {
    return '<figure class="slot" style="--r:' + ratio + '">' +
      (src ? '<img src="' + esc(src) + '" alt="' + esc(alt) + '" loading="lazy" onerror="this.remove()">' : "") +
      '<span class="slot__ph" aria-hidden="true"><b>' + esc(label || "Foto oficial do prato") + '</b><i>images/pratos/</i></span></figure>';
  }

  /* ---------- destaques ---------- */
  var dg = $("#dest-grid");
  if (NQ.destaquesOficiais) $("#dest-eyebrow").textContent = "Carros-chefes";
  if (dg) {
    var dest = (NQ.destaques || []).slice(0, 3);
    if (!dest.length) {
      dg.innerHTML = [1, 2, 3].map(function (n) {
        return '<article class="prato reveal">' + foto(null, "", n === 1 ? "4/3" : "16/10", "Prato em destaque " + n) +
          '<span class="pend">Foto, nome e preço entram aqui assim que forem confirmados pela casa.</span></article>';
      }).join("");
    } else {
      dg.innerHTML = dest.map(function (p, i) {
        return '<article class="prato reveal">' + foto(p.imagem, p.nome, i === 0 ? "4/3" : "16/10") +
          "<h3>" + esc(p.nome) + "</h3>" + (p.descricao ? "<p>" + esc(p.descricao) + "</p>" : "") +
          (p.preco ? '<span class="preco">' + esc(p.preco) + "</span>" : "") +
          '<a class="mais" href="#cardapio">Ver no cardápio →</a></article>';
      }).join("");
    }
  }

  /* ---------- cardápio ---------- */
  var tabs = $("#card-tabs"), list = $("#card-list"), cats = NQ.cardapio || [];
  function renderCat(i) {
    list.innerHTML = cats[i].itens.map(function (it) {
      return '<article class="item">' + foto(it.imagem, it.nome, "4/3") +
        (it.destaque ? '<span class="tag tag--casa">Destaque da casa</span>' : "") +
        (it.vegetariano ? '<span class="tag">Vegetariano</span>' : "") +
        "<h3>" + esc(it.nome) + "</h3>" + (it.descricao ? "<p>" + esc(it.descricao) + "</p>" : "") +
        (it.preco ? '<span class="preco">' + esc(it.preco) + "</span>" : "") + "</article>";
    }).join("");
  }
  if (!cats.length) {
    tabs.remove();
    list.innerHTML = '<div class="vazio"><h3>Cardápio chegando aqui.</h3><p>Cada prato entra com foto, nome, descrição e preço confirmados pela casa. Enquanto isso, o cardápio oficial está a um clique.</p></div>';
  } else {
    tabs.innerHTML = cats.map(function (c, i) {
      return '<button role="tab" aria-selected="' + (i === 0) + '" data-i="' + i + '">' + esc(c.nome) + "</button>";
    }).join("");
    tabs.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      tabs.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-selected", x === b); });
      renderCat(+b.dataset.i);
    });
    renderCat(0);
  }

  /* ---------- avaliações ---------- */
  var dep = $("#dep-grid"), av = (NQ.avaliacoes || []).slice(0, 5);
  dep.innerHTML = av.length ? av.map(function (a) {
    return '<blockquote class="reveal">“' + esc(a.texto) + "”<cite>" + esc(a.autor || "") + (a.fonte ? " · " + esc(a.fonte) : "") + "</cite></blockquote>";
  }).join("") : '<div class="vazio"><h3>As melhores palavras são de quem veio.</h3><p>Aqui entram avaliações reais de clientes, copiadas das plataformas da casa ou autorizadas por eles. Nenhuma foi escrita por nós.</p></div>';

  /* ---------- horários ---------- */
  var hz = $("#horarios");
  hz.innerHTML = (NQ.horarios || []).map(function (d) {
    return "<dt>" + esc(d.dia) + "</dt><dd" + (d.texto ? "" : ' class="fechado"') + ">" + esc(d.texto || "Fechado") + "</dd>";
  }).join("");
  if (!NQ.horariosConfirmados) $("#horarios-nota").textContent = "Confira no Instagram antes de vir, os horários podem mudar.";

  /* ---------- navegação ---------- */
  var nav = $("#nav"), burger = $("#burger"), menu = $("#menu");
  function onScroll() { nav.classList.toggle("is-solid", window.scrollY > 60); }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
  burger.addEventListener("click", function () {
    var open = menu.classList.toggle("open");
    burger.setAttribute("aria-expanded", open); nav.classList.toggle("menu-open", open);
  });
  menu.addEventListener("click", function (e) { if (e.target.tagName === "A") { menu.classList.remove("open"); burger.setAttribute("aria-expanded", false); nav.classList.remove("menu-open"); } });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { menu.classList.remove("open"); burger.setAttribute("aria-expanded", false); } });

  /* ---------- revelar ao rolar ---------- */
  var els = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (el) { io.observe(el); });
  } else els.forEach(function (el) { el.classList.add("in"); });

  /* ---------- parallax leve ---------- */
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var px = document.querySelectorAll("[data-parallax]"), tick = false;
  if (!reduce && px.length) {
    window.addEventListener("scroll", function () {
      if (tick) return; tick = true;
      requestAnimationFrame(function () {
        px.forEach(function (el) {
          var r = el.getBoundingClientRect();
          if (r.bottom < 0 || r.top > innerHeight) return;
          var d = (r.top + r.height / 2 - innerHeight / 2) * parseFloat(el.dataset.parallax);
          var im = el.querySelector("img"), ph = el.querySelector(".slot__ph");
          [im, ph].forEach(function (t) { if (t) t.style.transform = "translate3d(0," + (-d).toFixed(1) + "px,0) scale(1.12)"; });
        });
        tick = false;
      });
    }, { passive: true });
  }
})();
