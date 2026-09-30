/* Lucas Almeida — Negócios Imobiliários (projeto demonstrativo) */
(() => {
  "use strict";

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const page = document.body.dataset.page;
  document.documentElement.classList.remove("no-js");

  /* ---------- Utilidades ---------- */
  const brl = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  const waLink = (msg) => `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(msg)}`;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const openWhatsApp = (msg) => window.open(waLink(msg), "_blank", "noopener");
  const PORTRAIT = IMG("1560250097-0b93528c311a", 900);

  const ICON = {
    wa: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.2h.01c5.46 0 9.91-4.45 9.91-9.91A9.86 9.86 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24a8.24 8.24 0 0 1 8.24 8.25c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.7-.8-.22-.09-.39-.13-.56.12-.16.25-.64.8-.78.97-.14.16-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.16.04-.31-.02-.43-.06-.13-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48a.92.92 0 0 0-.66.31c-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.57.13.16 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.48-.29Z"/></svg>',
    heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.3s-7.6-4.6-9.2-9.3C1.7 7.6 3.9 4.2 7.3 4.2c2 0 3.4 1.1 4.7 2.8 1.3-1.7 2.7-2.8 4.7-2.8 3.4 0 5.6 3.4 4.5 6.8-1.6 4.7-9.2 9.3-9.2 9.3Z"/></svg>',
    heartNav: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 20.3s-7.6-4.6-9.2-9.3C1.7 7.6 3.9 4.2 7.3 4.2c2 0 3.4 1.1 4.7 2.8 1.3-1.7 2.7-2.8 4.7-2.8 3.4 0 5.6 3.4 4.5 6.8-1.6 4.7-9.2 9.3-9.2 9.3Z"/></svg>',
    bed: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 18V6M3 14h18v4M21 14v-3a3 3 0 0 0-3-3h-7v6M7 11.5a1.5 1.5 0 1 0 0-.01"/></svg>',
    bath: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3ZM6 12V5.5A1.5 1.5 0 0 1 9 5M7 19l-1 2M17 19l1 2"/></svg>',
    car: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 16V11l2-5h10l2 5v5M3 16h18v3H3zM5 11h14M7 19v2M17 19v2"/></svg>',
    area: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16v16H4zM4 9h5V4M20 15h-5v5"/></svg>',
  };

  const imgTag = (id, alt, w = 1200, attrs = "") =>
    `<img src="${IMG(id, w)}" alt="${esc(alt)}" loading="lazy" decoding="async" ${attrs}>`;

  // Fallback elegante caso alguma imagem externa não carregue
  document.addEventListener("error", (e) => {
    const t = e.target;
    if (t.tagName === "IMG" && t.parentElement) t.parentElement.classList.add("img-fallback");
  }, true);

  /* ---------- Toast ---------- */
  const toastEl = document.createElement("div");
  toastEl.className = "toast";
  toastEl.setAttribute("role", "status");
  toastEl.setAttribute("aria-live", "polite");
  document.body.appendChild(toastEl);
  let toastTimer;
  const toast = (msg) => {
    toastEl.textContent = msg;
    toastEl.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("is-visible"), 2600);
  };

  /* ---------- Favoritos (salvos no navegador) ---------- */
  const FAV_KEY = "la-favoritos";
  const readFavs = () => { try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; } catch { return []; } };
  let favs = readFavs();
  const saveFavs = () => { try { localStorage.setItem(FAV_KEY, JSON.stringify(favs)); } catch { /* sem armazenamento */ } };
  const isFav = (id) => favs.includes(id);
  const updateFavCount = () => {
    $$("[data-fav-count]").forEach((el) => { el.textContent = favs.length; el.hidden = favs.length === 0; });
  };
  const toggleFav = (id) => {
    favs = isFav(id) ? favs.filter((f) => f !== id) : [...favs, id];
    saveFavs();
    updateFavCount();
    $$(`[data-fav="${id}"]`).forEach((b) => {
      b.setAttribute("aria-pressed", isFav(id));
      b.setAttribute("aria-label", isFav(id) ? "Remover dos favoritos" : "Salvar nos favoritos");
      b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop");
    });
    toast(isFav(id) ? "Imóvel salvo nos favoritos" : "Imóvel removido dos favoritos");
    document.dispatchEvent(new CustomEvent("favs:change"));
  };
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-fav]");
    if (!b) return;
    e.preventDefault();
    toggleFav(b.dataset.fav);
  });

  const favButton = (id) =>
    `<button class="fav-btn" type="button" data-fav="${id}" aria-pressed="${isFav(id)}" aria-label="${isFav(id) ? "Remover dos favoritos" : "Salvar nos favoritos"}">${ICON.heart}</button>`;

  /* ---------- Cards ---------- */
  const specsList = (p) => {
    const items = [];
    if (p.quartos) items.push([ICON.bed, `${p.quartos} ${p.quartos > 1 ? "quartos" : "quarto"}`]);
    if (p.banheiros) items.push([ICON.bath, `${p.banheiros} ${p.banheiros > 1 ? "banheiros" : "banheiro"}`]);
    if (p.vagas) items.push([ICON.car, `${p.vagas} ${p.vagas > 1 ? "vagas" : "vaga"}`]);
    items.push([ICON.area, `${p.area} m²`]);
    return `<ul class="specs">${items.map(([i, t]) => `<li>${i}${t}</li>`).join("")}</ul>`;
  };
  const locLabel = (p) => (p.bairro && !/condom|loteamento/i.test(p.bairro) ? `${p.bairro} · ${p.cidade} - SP` : `${p.cidade} - SP`);
  const detailUrl = (p) => `imovel.html?id=${p.id}`;

  const cardHTML = (p) => `
    <article class="card reveal">
      <div class="card__media">
        ${imgTag(p.imagens[0], `${p.titulo} em ${p.cidade} (imagem demonstrativa)`, 900)}
        <div class="card__tags">
          <span class="tag">${p.finalidade === "alugar" ? "Aluguel" : "Venda"}</span>
          ${p.destaque ? `<span class="tag tag--accent">${esc(p.destaque)}</span>` : ""}
        </div>
        ${favButton(p.id)}
      </div>
      <div class="card__body">
        <span class="card__type">${p.tipo}</span>
        <h3 class="card__title"><a href="${detailUrl(p)}">${esc(p.titulo)}</a></h3>
        <p class="card__loc">${esc(locLabel(p))}</p>
        <p class="card__price">${brl(p.preco)}</p>
        ${specsList(p)}
        <div class="card__foot">
          <span class="card__code">Cód. ${p.codigo}</span>
          <a class="btn btn--ghost btn--sm" href="${detailUrl(p)}">Ver imóvel</a>
        </div>
      </div>
    </article>`;

  /* ---------- Header / menu / footer ---------- */
  const NAV = [
    ["Início", "index.html#inicio", "home"],
    ["Imóveis", "imoveis.html", "imoveis"],
    ["Comprar", "imoveis.html?finalidade=comprar", ""],
    ["Vender", "index.html#vender", ""],
    ["Sobre", "index.html#sobre", ""],
    ["Contato", "index.html#contato", ""],
  ];
  const waGeneral = waLink(`Olá Lucas, vim pelo seu site e gostaria de conversar sobre imóveis.`);

  const renderChrome = () => {
    const demoClosed = (() => { try { return sessionStorage.getItem("la-demo-bar") === "0"; } catch { return false; } })();
    const header = `
      <div class="demo-bar" ${demoClosed ? "hidden" : ""}>
        <strong>Projeto demonstrativo.</strong> Nome, contatos, imóveis, imagens e depoimentos são fictícios.
        <button type="button" aria-label="Fechar aviso" data-close-demo>×</button>
      </div>
      <header class="header">
        <div class="container header__inner">
          <a class="logo" href="index.html" aria-label="Lucas Almeida Negócios Imobiliários — início">
            <span class="logo__name">LUCAS ALMEIDA</span>
            <span class="logo__tag">NEGÓCIOS IMOBILIÁRIOS</span>
          </a>
          <nav class="nav" aria-label="Principal">
            ${NAV.map(([t, h, k]) => `<a href="${h}" ${k && k === page ? 'aria-current="page"' : ""}>${t}</a>`).join("")}
          </nav>
          <div class="header__actions">
            <a class="fav-link" href="imoveis.html?favoritos=1" aria-label="Ver imóveis favoritos">${ICON.heartNav}<span class="fav-link__count" data-fav-count hidden>0</span></a>
            <a class="btn btn--primary btn--sm" href="${waGeneral}" target="_blank" rel="noopener">${ICON.wa}Falar no WhatsApp</a>
            <button class="menu-toggle" type="button" aria-label="Abrir menu" aria-expanded="false" aria-controls="mobile-nav"><span></span><span></span></button>
          </div>
        </div>
      </header>
      <div class="mobile-nav" id="mobile-nav" aria-hidden="true">
        ${NAV.map(([t, h]) => `<a href="${h}">${t}</a>`).join("")}
        <a class="btn btn--primary" href="${waGeneral}" target="_blank" rel="noopener">${ICON.wa}Falar no WhatsApp</a>
        <p class="mobile-nav__meta">${SITE.creci} · ${SITE.regiao}<br>Dados fictícios para demonstração.</p>
      </div>`;
    document.body.insertAdjacentHTML("afterbegin", header);

    const footer = `
      <footer class="footer">
        <div class="container">
          <div class="footer__grid">
            <div>
              <a class="logo" href="index.html"><span class="logo__name">LUCAS ALMEIDA</span><span class="logo__tag">NEGÓCIOS IMOBILIÁRIOS</span></a>
              <p class="footer__creci">${SITE.creci}<br>Atendimento em ${SITE.regiao}</p>
            </div>
            <div>
              <h4>Navegação</h4>
              <ul>${NAV.map(([t, h]) => `<li><a href="${h}">${t}</a></li>`).join("")}</ul>
            </div>
            <div>
              <h4>Contato</h4>
              <ul>
                <li><a href="https://instagram.com/${SITE.instagram}" target="_blank" rel="noopener">Instagram</a></li>
                <li><a href="${waGeneral}" target="_blank" rel="noopener">WhatsApp</a></li>
                <li><a href="mailto:${SITE.email}">E-mail</a></li>
              </ul>
            </div>
          </div>
          <div class="footer__bottom">
            <span>Projeto demonstrativo — informações fictícias.</span>
            <span>Imagens meramente ilustrativas.</span>
          </div>
        </div>
      </footer>
      <a class="wa-float" href="${waGeneral}" target="_blank" rel="noopener" aria-label="Falar no WhatsApp">${ICON.wa}<span>WhatsApp</span></a>`;
    document.body.insertAdjacentHTML("beforeend", footer);

    const toggle = $(".menu-toggle");
    const mnav = $("#mobile-nav");
    const setMenu = (open) => {
      document.body.classList.toggle("menu-open", open);
      toggle.setAttribute("aria-expanded", open);
      toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
      mnav.setAttribute("aria-hidden", !open);
      document.body.style.overflow = open ? "hidden" : "";
    };
    toggle.addEventListener("click", () => setMenu(!document.body.classList.contains("menu-open")));
    mnav.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

    $("[data-close-demo]")?.addEventListener("click", (e) => {
      e.currentTarget.parentElement.hidden = true;
      try { sessionStorage.setItem("la-demo-bar", "0"); } catch { /* ok */ }
    });

    const hdr = $(".header");
    const onScroll = () => hdr.classList.toggle("is-scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    updateFavCount();
  };

  /* ---------- Reveal ---------- */
  const io = "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      }), { rootMargin: "0px 0px -8% 0px" })
    : null;
  const observeReveals = (root = document) => $$(".reveal:not(.is-in)", root).forEach((el) => (io ? io.observe(el) : el.classList.add("is-in")));

  /* ---------- Links de WhatsApp declarativos ---------- */
  document.addEventListener("click", (e) => {
    const a = e.target.closest("[data-wa]");
    if (!a) return;
    e.preventDefault();
    openWhatsApp(a.dataset.wa || `Olá Lucas, vim pelo seu site e gostaria de conversar sobre imóveis.`);
  });

  /* ---------- Formulário de busca (home) ---------- */
  const initSearch = () => {
    const form = $("#search-form");
    if (!form) return;
    $(".search__more", form)?.addEventListener("click", (e) => {
      const s = form.closest(".search");
      s.classList.toggle("is-expanded");
      e.currentTarget.textContent = s.classList.contains("is-expanded") ? "Menos filtros" : "Mais filtros";
      e.currentTarget.setAttribute("aria-expanded", s.classList.contains("is-expanded"));
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const params = new URLSearchParams();
      new FormData(form).forEach((v, k) => { if (v) params.set(k, v); });
      const min = +params.get("min") || 0, max = +params.get("max") || 0;
      if (min && max && min > max) { params.set("min", max); params.set("max", min); }
      location.href = `imoveis.html?${params}`;
    });
  };

  /* ---------- Contato ---------- */
  const validate = (form) => {
    let ok = true;
    $$("[data-required]", form).forEach((f) => {
      const err = $(`#${f.id}-err`);
      let msg = "";
      const v = f.value.trim();
      if (!v) msg = "Preencha este campo.";
      else if (f.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) msg = "Informe um e-mail válido.";
      else if (f.dataset.phone !== undefined && v.replace(/\D/g, "").length < 10) msg = "Informe um número com DDD.";
      f.classList.toggle("is-invalid", !!msg);
      f.setAttribute("aria-invalid", !!msg);
      if (err) err.textContent = msg;
      if (msg && ok) { f.focus(); ok = false; }
    });
    return ok;
  };
  const maskPhone = (input) => input.addEventListener("input", () => {
    const d = input.value.replace(/\D/g, "").slice(0, 11);
    input.value = d.length > 10 ? d.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3")
      : d.length > 6 ? d.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3")
      : d.length > 2 ? d.replace(/(\d{2})(\d+)/, "($1) $2") : d;
  });
  $$("[data-phone]").forEach(maskPhone);

  const initContact = () => {
    const form = $("#contact-form");
    if (!form) return;
    $$("input, textarea", form).forEach((f) => f.addEventListener("input", () => {
      if (f.classList.contains("is-invalid")) { f.classList.remove("is-invalid"); const err = $(`#${f.id}-err`); if (err) err.textContent = ""; }
    }));
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!validate(form)) return;
      const d = Object.fromEntries(new FormData(form));
      const msg = `Olá Lucas, meu nome é ${d.nome}.\nTenho interesse em: ${d.interesse}.\n${d.mensagem ? `\n${d.mensagem}\n` : ""}\nWhatsApp: ${d.whatsapp}\nE-mail: ${d.email}`;
      const ok = $(".form-success", form);
      ok.hidden = false;
      ok.textContent = `Obrigado, ${d.nome.split(" ")[0]}! Sua mensagem foi preparada e o WhatsApp será aberto para concluir o envio. (Demonstração: nenhum dado é armazenado.)`;
      openWhatsApp(msg);
      form.reset();
    });
  };

  /* ---------- Home ---------- */
  const initHome = () => {
    const featured = $("#featured-grid");
    if (featured) featured.innerHTML = IMOVEIS.map(cardHTML).join("");
    const regions = $("#regions");
    if (regions) regions.innerHTML = REGIOES.map((r) => `
      <a class="region reveal" href="imoveis.html?local=${encodeURIComponent(r.nome)}">
        ${imgTag(r.img, `Paisagem ilustrativa — ${r.nome}`, 1000)}
        <div class="region__body"><h3>${r.nome} <span aria-hidden="true">→</span></h3><p>${r.texto}</p></div>
      </a>`).join("");
    initSearch();
  };

  /* ---------- Listagem ---------- */
  const initListing = () => {
    const form = $("#filters");
    const grid = $("#results");
    const count = $("#results-count");
    const chips = $("#active-filters");
    const sort = $("#sort");
    const params = new URLSearchParams(location.search);

    // Pré-preenche a partir da URL
    ["finalidade", "tipo", "local", "min", "max", "quartos"].forEach((k) => {
      const f = form.elements[k];
      if (f && params.has(k)) f.value = params.get(k);
    });
    if (params.get("favoritos") === "1") form.elements.favoritos.checked = true;
    if (params.has("ordem")) sort.value = params.get("ordem");

    const LABELS = {
      finalidade: (v) => (v === "alugar" ? "Alugar" : "Comprar"),
      tipo: (v) => v, local: (v) => v,
      min: (v) => `A partir de ${brl(+v)}`, max: (v) => `Até ${brl(+v)}`,
      quartos: (v) => `${v}+ quartos`, favoritos: () => "Favoritos",
    };

    const apply = (push = true) => {
      const fd = new FormData(form);
      const q = Object.fromEntries([...fd].filter(([, v]) => v));
      let list = IMOVEIS.filter((p) =>
        (!q.finalidade || p.finalidade === q.finalidade) &&
        (!q.tipo || p.tipo === q.tipo) &&
        (!q.local || p.cidade === q.local) &&
        (!q.min || p.preco >= +q.min) &&
        (!q.max || p.preco <= +q.max) &&
        (!q.quartos || p.quartos >= +q.quartos) &&
        (!q.favoritos || isFav(p.id)));
      const o = sort.value;
      if (o === "menor") list.sort((a, b) => a.preco - b.preco);
      if (o === "maior") list.sort((a, b) => b.preco - a.preco);
      if (o === "area") list.sort((a, b) => b.area - a.area);

      count.innerHTML = `<strong>${list.length}</strong> ${list.length === 1 ? "imóvel encontrado" : "imóveis encontrados"}`;
      chips.innerHTML = Object.entries(q).map(([k, v]) =>
        `<button type="button" data-clear="${k}" aria-label="Remover filtro ${esc(LABELS[k](v))}">${esc(LABELS[k](v))} <span aria-hidden="true">×</span></button>`).join("");

      grid.innerHTML = list.length ? list.map(cardHTML).join("") : `
        <div class="empty">
          <h3>${q.favoritos ? "Nenhum favorito ainda" : "Nenhum imóvel com esses filtros"}</h3>
          <p>${q.favoritos ? "Toque no coração dos imóveis que chamarem sua atenção para compará-los aqui depois." : "Ajuste os filtros ou conte o que você procura — novas oportunidades nem sempre aparecem no site."}</p>
          <button class="btn btn--ghost" type="button" data-reset>Limpar filtros</button>
          <a class="btn btn--primary" href="#" data-wa="Olá Lucas, não encontrei no site o imóvel que procuro. Pode me ajudar?">Pedir ajuda ao Lucas</a>
        </div>`;
      observeReveals(grid);

      if (push) {
        const u = new URLSearchParams(q);
        if (o !== "relevancia") u.set("ordem", o);
        history.replaceState(null, "", `${location.pathname}${u.toString() ? `?${u}` : ""}`);
      }
    };

    form.addEventListener("change", () => apply());
    form.addEventListener("submit", (e) => { e.preventDefault(); apply(); closeFilters(); });
    sort.addEventListener("change", () => apply());
    document.addEventListener("favs:change", () => { if (form.elements.favoritos.checked) apply(false); });
    document.addEventListener("click", (e) => {
      const c = e.target.closest("[data-clear]");
      if (c) { const f = form.elements[c.dataset.clear]; f.type === "checkbox" ? (f.checked = false) : (f.value = ""); apply(); }
      if (e.target.closest("[data-reset]")) { form.reset(); apply(); }
    });

    // Painel de filtros no mobile
    const panel = $(".filters");
    const scrim = $(".scrim");
    const openBtn = $(".filters-open");
    const openFilters = () => { panel.classList.add("is-open"); scrim.classList.add("is-open"); openBtn.setAttribute("aria-expanded", "true"); $(".filters__close").focus(); };
    const closeFilters = () => { panel.classList.remove("is-open"); scrim.classList.remove("is-open"); openBtn.setAttribute("aria-expanded", "false"); };
    openBtn.addEventListener("click", openFilters);
    scrim.addEventListener("click", closeFilters);
    $(".filters__close").addEventListener("click", closeFilters);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeFilters(); });

    apply(false);
  };

  /* ---------- Página do imóvel ---------- */
  const initProperty = () => {
    const root = $("#property");
    const id = new URLSearchParams(location.search).get("id");
    const p = IMOVEIS.find((i) => i.id === id);
    if (!p) {
      document.title = "Imóvel não encontrado · Lucas Almeida";
      root.innerHTML = `<div class="container"><div class="empty" style="margin:80px 0"><h3>Imóvel não encontrado</h3><p>Ele pode ter sido vendido ou removido. Veja outras opções disponíveis.</p><a class="btn btn--primary" href="imoveis.html">Ver todos os imóveis</a></div></div>`;
      return;
    }
    document.title = `${p.titulo} em ${p.cidade} · Lucas Almeida`;
    document.body.classList.add("has-sticky-bar");
    const interesse = `Olá Lucas, vi o imóvel ${p.titulo} (${p.codigo}) no seu site e gostaria de receber mais informações.`;
    const [lat, lng] = p.coords;
    const d = 0.012;
    const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d}%2C${lat - d}%2C${lng + d}%2C${lat + d}&layer=mapnik`;
    const shown = p.imagens.slice(0, 5);
    const facts = [
      p.quartos && [p.quartos, p.suites ? `quartos · ${p.suites} ${p.suites > 1 ? "suítes" : "suíte"}` : "quartos"],
      p.banheiros && [p.banheiros, p.banheiros > 1 ? "banheiros" : "banheiro"],
      p.vagas && [p.vagas, p.vagas > 1 ? "vagas" : "vaga"],
      [`${p.area}`, p.tipo === "Terreno" ? "m² de terreno" : "m² de área útil"],
    ].filter(Boolean);
    const similares = IMOVEIS.filter((i) => i.id !== p.id).sort((a, b) => (b.tipo === p.tipo) - (a.tipo === p.tipo) || Math.abs(a.preco - p.preco) - Math.abs(b.preco - p.preco)).slice(0, 3);

    root.innerHTML = `
      <div class="container">
        <nav class="breadcrumb" aria-label="Você está em"><a href="index.html">Início</a><span>/</span><a href="imoveis.html">Imóveis</a><span>/</span><span aria-current="page">${esc(p.titulo)}</span></nav>
        <div class="gallery-wrap">
        <div class="gallery ${shown.length < 5 ? "gallery--few" : ""}">
          ${shown.slice(0, shown.length < 5 ? 3 : 5).map((img, i) => `<button type="button" data-open="${i}" aria-label="Ampliar foto ${i + 1} de ${p.imagens.length}">${imgTag(img, `${p.titulo} — foto ${i + 1} (demonstrativa)`, i === 0 ? 1600 : 900, i === 0 ? 'fetchpriority="high" loading="eager"' : "")}</button>`).join("")}
        </div>
          <span class="tag gallery-count">${p.imagens.length} fotos · deslize</span>
          <button class="btn btn--light btn--sm gallery__all" type="button" data-open="0">Ver todas as ${p.imagens.length} fotos</button>
        </div>
        <div class="property">
          <div>
            <div class="property__head">
              <span class="card__type">${p.tipo} · Venda · Cód. ${p.codigo}</span>
              <h1>${esc(p.titulo)}</h1>
              <p class="property__loc">${esc(locLabel(p))}</p>
            </div>
            <div class="facts">${facts.map(([n, l]) => `<div><strong>${n}</strong><span>${l}</span></div>`).join("")}</div>
            <div class="prose">${p.descricao.map((t) => `<p>${esc(t)}</p>`).join("")}</div>
            <section class="block"><h2>Características do imóvel</h2><ul class="feature-list">${p.caracteristicas.map((c) => `<li>${esc(c)}</li>`).join("")}</ul></section>
            ${p.condominio ? `<section class="block"><h2>Condomínio</h2><ul class="feature-list">${p.condominio.map((c) => `<li>${esc(c)}</li>`).join("")}</ul></section>` : ""}
            <section class="block"><h2>Localização aproximada</h2>
              <div class="map"><iframe title="Mapa da região aproximada do imóvel" src="${mapSrc}" loading="lazy"></iframe></div>
              <p class="note">Por segurança, a localização exata é informada durante o atendimento. Mapa ilustrativo.</p>
            </section>
          </div>
          <aside class="aside" aria-label="Resumo e contato">
            <div class="aside__price"><small>Valor de venda</small><strong>${brl(p.preco)}</strong></div>
            <a class="btn btn--primary btn--block" href="${waLink(interesse)}" target="_blank" rel="noopener">${ICON.wa}Tenho interesse neste imóvel</a>
            <div class="aside__row">
              <button class="btn btn--ghost" type="button" data-visit>Agendar visita</button>
              <button class="btn btn--ghost" type="button" data-fav="${p.id}" aria-pressed="${isFav(p.id)}" aria-label="${isFav(p.id) ? "Remover dos favoritos" : "Salvar nos favoritos"}" style="flex:0 0 auto;width:48px;padding:0">${ICON.heartNav}</button>
              <button class="btn btn--ghost" type="button" data-share aria-label="Compartilhar imóvel" style="flex:0 0 auto;width:48px;padding:0">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg>
              </button>
            </div>
            <div class="aside__agent"><span class="aside__avatar">${imgTag("1560250097-0b93528c311a", "Retrato ilustrativo do corretor", 200)}</span><div><strong>${SITE.nome}</strong><span>${SITE.creci}</span></div></div>
            <p class="aside__disclaimer">Imóvel, valores e imagens fictícios — demonstração.</p>
          </aside>
        </div>
      </div>
      <section class="section--tight section--alt">
        <div class="container">
          <div class="section-head"><div><span class="chapter">Veja também</span><h2>Imóveis semelhantes</h2></div><a class="link-arrow" href="imoveis.html">Ver todos <span>→</span></a></div>
          <div class="grid">${similares.map(cardHTML).join("")}</div>
        </div>
      </section>
      <div class="sticky-bar">
        <button class="btn btn--ghost" type="button" data-visit>Agendar visita</button>
        <a class="btn btn--primary" href="${waLink(interesse)}" target="_blank" rel="noopener">${ICON.wa}Tenho interesse</a>
      </div>`;

    // Estilo do botão de favorito da lateral
    const favSide = $(`.aside [data-fav]`);
    const paintSide = () => { favSide.style.color = isFav(p.id) ? "var(--danger)" : ""; favSide.querySelector("svg").style.fill = isFav(p.id) ? "currentColor" : "none"; };
    paintSide();
    document.addEventListener("favs:change", paintSide);

    // Compartilhar
    $("[data-share]").addEventListener("click", async () => {
      const data = { title: document.title, text: `${p.titulo} — ${brl(p.preco)}`, url: location.href };
      try {
        if (navigator.share) await navigator.share(data);
        else { await navigator.clipboard.writeText(location.href); toast("Link copiado"); }
      } catch { /* cancelado */ }
    });

    // Lightbox
    const lb = $("#lightbox");
    const lbImg = $("img", lb);
    const lbCount = $("[data-lb-count]", lb);
    const thumbs = $(".lightbox__thumbs", lb);
    thumbs.innerHTML = p.imagens.map((img, i) => `<button type="button" data-go="${i}" aria-label="Foto ${i + 1}">${imgTag(img, "", 200)}</button>`).join("");
    let cur = 0, lastFocus;
    const show = (i) => {
      cur = (i + p.imagens.length) % p.imagens.length;
      lbImg.src = IMG(p.imagens[cur], 1800);
      lbImg.alt = `${p.titulo} — foto ${cur + 1} de ${p.imagens.length} (demonstrativa)`;
      lbCount.textContent = `${cur + 1} / ${p.imagens.length}`;
      $$("button", thumbs).forEach((b, j) => b.setAttribute("aria-current", j === cur));
    };
    const openLb = (i) => { lastFocus = document.activeElement; lb.classList.add("is-open"); document.body.style.overflow = "hidden"; show(i); $("[data-lb-close]", lb).focus(); };
    const closeLb = () => { lb.classList.remove("is-open"); document.body.style.overflow = ""; lastFocus?.focus(); };
    $$("[data-open]").forEach((b) => b.addEventListener("click", () => openLb(+b.dataset.open)));
    $("[data-lb-close]", lb).addEventListener("click", closeLb);
    $("[data-lb-prev]", lb).addEventListener("click", () => show(cur - 1));
    $("[data-lb-next]", lb).addEventListener("click", () => show(cur + 1));
    thumbs.addEventListener("click", (e) => { const b = e.target.closest("[data-go]"); if (b) show(+b.dataset.go); });
    let tx = 0;
    lb.addEventListener("touchstart", (e) => (tx = e.touches[0].clientX), { passive: true });
    lb.addEventListener("touchend", (e) => { const dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1)); });
    document.addEventListener("keydown", (e) => {
      if (!lb.classList.contains("is-open")) return;
      if (e.key === "Escape") closeLb();
      if (e.key === "ArrowRight") show(cur + 1);
      if (e.key === "ArrowLeft") show(cur - 1);
    });

    // Modal agendar visita
    const modal = $("#visit-modal");
    const vform = $("#visit-form");
    $("[data-visit-title]").textContent = `${p.titulo} · ${p.cidade}`;
    const dateInput = vform.elements.data;
    const tomorrow = new Date(Date.now() + 864e5);
    dateInput.min = tomorrow.toISOString().slice(0, 10);
    let vFocus;
    const openModal = () => { vFocus = document.activeElement; modal.classList.add("is-open"); document.body.style.overflow = "hidden"; vform.elements.nome.focus(); };
    const closeModal = () => { modal.classList.remove("is-open"); document.body.style.overflow = ""; vFocus?.focus(); };
    $$("[data-visit]").forEach((b) => b.addEventListener("click", openModal));
    $$("[data-modal-close]", modal).forEach((b) => b.addEventListener("click", closeModal));
    modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal(); });
    $$("input", vform).forEach((f) => f.addEventListener("input", () => { f.classList.remove("is-invalid"); const er = $(`#${f.id}-err`); if (er) er.textContent = ""; }));
    vform.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!validate(vform)) return;
      const v = Object.fromEntries(new FormData(vform));
      const dataFmt = new Date(`${v.data}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
      openWhatsApp(`Olá Lucas, vi o imóvel ${p.titulo} (${p.codigo}) no seu site e gostaria de agendar uma visita.\n\nNome: ${v.nome}\nData sugerida: ${dataFmt}\nPeríodo: ${v.periodo}`);
      closeModal();
      vform.reset();
      toast("Pedido de visita preparado no WhatsApp");
    });
  };

  /* ---------- Inicialização ---------- */
  renderChrome();
  if (page === "home") initHome();
  if (page === "imoveis") initListing();
  if (page === "imovel") initProperty();
  initContact();
  observeReveals();
})();
