/*
 * Painel administrativo — Lucas Almeida · Negócios Imobiliários
 *
 * Usa o cliente oficial do Supabase (assets/vendor) com a chave PÚBLICA
 * definida em config.js. Quem garante a segurança são as políticas RLS
 * do banco: só usuários presentes na tabela "admins" conseguem gravar.
 */
(() => {
  "use strict";

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const page = document.body.dataset.admin;

  /* ---------- Configuração e cliente ---------- */
  const CFG = window.APP_CONFIG || {};
  const URL_SB = String(CFG.SUPABASE_URL || "").trim().replace(/\/+$/, "");
  const KEY = String(CFG.SUPABASE_ANON_KEY || "").trim();
  const BUCKET = CFG.STORAGE_BUCKET || "imoveis";

  const chaveSecreta = (() => {
    if (/^sb_secret_/i.test(KEY)) return true;
    try {
      const p = JSON.parse(atob(KEY.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      return p.role === "service_role";
    } catch { return false; }
  })();

  const fatal = (msg) => {
    document.body.classList.remove("is-checking");
    document.body.innerHTML = `<div class="container" style="padding:80px 16px;max-width:560px"><h1 style="font-size:2rem">Painel indisponível</h1><p style="margin-top:12px;color:var(--muted)">${msg}</p></div>`;
  };

  if (!URL_SB || !KEY) return fatal("Preencha a Project URL e a chave pública em <code>assets/js/config.js</code>.");
  if (chaveSecreta) return fatal("O config.js contém uma chave <strong>secreta</strong>. Troque pela chave pública (anon/publishable) e gere uma nova chave secreta no Supabase.");
  if (!window.supabase?.createClient) return fatal("Não foi possível carregar a biblioteca do Supabase.");

  const sb = window.supabase.createClient(URL_SB, KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });

  /* ---------- Utilidades ---------- */
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const brl = (v) => (v === null || v === undefined || v === "" ? "—" : Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: Number(v) % 1 ? 2 : 0 }));
  const semAcento = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const slugify = (s) => semAcento(s).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90).replace(/-+$/g, "");
  const dataBR = (iso) => {
    const d = new Date(iso);
    const diff = (Date.now() - d) / 1000;
    if (diff < 60) return "agora";
    if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`;
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: d.getFullYear() === new Date().getFullYear() ? undefined : "numeric" });
  };
  const STATUS = { disponivel: "Disponível", reservado: "Reservado", vendido: "Vendido", alugado: "Alugado" };

  const fotoUrl = (caminho) => {
    if (!caminho) return "";
    if (/^https?:\/\//i.test(caminho)) {
      try { const u = new URL(caminho); if (u.hostname === "images.unsplash.com") u.searchParams.set("w", "400"); return u.toString(); } catch { return caminho; }
    }
    return sb.storage.from(BUCKET).getPublicUrl(caminho.replace(/^\/+/, "")).data.publicUrl;
  };
  const ordenarFotos = (fotos) => (fotos || []).slice().sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
  const capa = (im) => ordenarFotos(im.fotos)[0]?.caminho || "";

  // Fallback para imagens que não carregam
  document.addEventListener("error", (e) => {
    const t = e.target;
    if (t.tagName === "IMG" && t.parentElement) { t.parentElement.classList.add("img-fallback"); t.remove(); }
  }, true);

  const ICON = {
    star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/></svg>',
    edit: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4"/></svg>',
    eye: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>',
    trash: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
    left: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg>',
    right: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>',
  };

  /* ---------- Mensagens de erro em português ---------- */
  const errText = (e) => {
    if (!e) return "Ocorreu um erro inesperado.";
    const m = String(e.message || e.error_description || e);
    if (/failed to fetch|networkerror|load failed|network request failed/i.test(m)) return "Sem conexão com o servidor. Verifique a internet e tente de novo.";
    if (/invalid login credentials/i.test(m)) return "E-mail ou senha incorretos.";
    if (/email not confirmed/i.test(m)) return "Confirme seu e-mail antes de entrar (veja o link enviado pelo Supabase).";
    if (/rate limit|too many/i.test(m)) return "Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo.";
    if (/jwt expired|invalid jwt|session/i.test(m) && /expired|missing|not found/i.test(m)) return "Sua sessão expirou. Entre novamente.";
    if (e.code === "23505") return "Já existe um imóvel com esse código ou endereço de página.";
    if (e.code === "23514") return "Algum valor está fora do formato permitido.";
    if (e.code === "42501" || /row-level security|permission denied|unauthorized/i.test(m)) return "Sua conta não tem permissão para esta ação.";
    if (/payload too large|exceeded the maximum allowed size/i.test(m)) return "Arquivo grande demais (máximo 10 MB).";
    if (/mime type|invalid_mime_type/i.test(m)) return "Formato de imagem não aceito.";
    return m;
  };

  /* ---------- Toast ---------- */
  const toastEl = document.createElement("div");
  toastEl.className = "toast";
  toastEl.setAttribute("role", "status");
  toastEl.setAttribute("aria-live", "polite");
  document.body.appendChild(toastEl);
  let toastTimer;
  const toast = (msg, ms = 3000) => {
    toastEl.textContent = msg;
    toastEl.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("is-visible"), ms);
  };
  const flash = (msg) => { try { sessionStorage.setItem("adm-flash", msg); } catch { /* ok */ } };
  const showFlash = () => { try { const m = sessionStorage.getItem("adm-flash"); if (m) { sessionStorage.removeItem("adm-flash"); toast(m); } } catch { /* ok */ } };

  /* ---------- Diálogo de confirmação ---------- */
  const confirmar = ({ titulo, texto, ok = "Confirmar", perigo = false }) => new Promise((resolve) => {
    const wrap = document.createElement("div");
    wrap.className = "confirm is-open";
    wrap.innerHTML = `
      <div class="confirm__panel" role="alertdialog" aria-modal="true" aria-labelledby="cf-t" aria-describedby="cf-d">
        <h2 id="cf-t">${esc(titulo)}</h2>
        <p id="cf-d">${esc(texto)}</p>
        <div class="confirm__actions">
          <button class="btn btn--ghost" type="button" data-r="0">Cancelar</button>
          <button class="btn ${perigo ? "btn--danger" : "btn--primary"}" type="button" data-r="1">${esc(ok)}</button>
        </div>
      </div>`;
    const last = document.activeElement;
    const fechar = (r) => { wrap.remove(); document.removeEventListener("keydown", onKey); last?.focus?.(); resolve(r); };
    const onKey = (e) => { if (e.key === "Escape") fechar(false); };
    wrap.addEventListener("click", (e) => {
      const b = e.target.closest("[data-r]");
      if (b) fechar(b.dataset.r === "1");
      else if (e.target === wrap) fechar(false);
    });
    document.addEventListener("keydown", onKey);
    document.body.appendChild(wrap);
    $('[data-r="0"]', wrap).focus();
  });

  const busy = (btn, on) => { if (!btn) return; btn.setAttribute("aria-busy", on ? "true" : "false"); btn.disabled = on; };

  /* ---------- Autenticação ---------- */
  const NEXT_OK = /^(painel|imoveis|imovel)\.html(\?[\w=&%.-]*)?$/;

  async function verificarAdmin(user) {
    const { data, error } = await sb.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
    if (error) throw error;
    return Boolean(data);
  }

  /** Protege as páginas do painel: exige sessão válida e usuário em "admins". */
  async function exigirAdmin() {
    const gate = $(".admin-gate");
    try {
      const { data: { user }, error } = await sb.auth.getUser();
      if (error || !user) {
        const next = location.pathname.split("/").pop() + location.search;
        location.replace(`index.html${NEXT_OK.test(next) ? `?next=${encodeURIComponent(next)}` : ""}`);
        return null;
      }
      if (!(await verificarAdmin(user))) {
        await sb.auth.signOut();
        location.replace("index.html?erro=sem-permissao");
        return null;
      }
      document.body.classList.remove("is-checking");
      return user;
    } catch (e) {
      if (gate) gate.innerHTML = `<div style="text-align:center;padding:16px"><p>${esc(errText(e))}</p><button class="btn btn--ghost btn--sm" style="margin-top:12px" onclick="location.reload()">Tentar de novo</button></div>`;
      return null;
    }
  }

  // Sair em outra aba encerra esta também
  let saindo = false;
  sb.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT" && page !== "login" && !saindo) location.replace("index.html");
  });

  /* ---------- Barra do painel ---------- */
  function renderBarra(user) {
    const editando = page === "imovel" && new URLSearchParams(location.search).get("id");
    const links = [
      ["Visão geral", "painel.html", page === "painel"],
      ["Imóveis", "imoveis.html", page === "imoveis" || editando],
      ["Novo imóvel", "imovel.html", page === "imovel" && !editando],
    ];
    document.body.insertAdjacentHTML("afterbegin", `
      <header class="adm-bar">
        <div class="container adm-bar__inner">
          <a class="logo" href="painel.html" aria-label="Painel — visão geral"><span class="logo__name">LUCAS ALMEIDA</span><span class="logo__tag">PAINEL</span></a>
          <nav class="adm-nav" aria-label="Painel">
            ${links.map(([t, h, cur]) => `<a href="${h}" ${cur ? 'aria-current="page"' : ""}>${t}</a>`).join("")}
            <a href="../index.html" target="_blank" rel="noopener">Ver site ↗</a>
          </nav>
          <div class="adm-user">
            <span class="adm-user__email" title="${esc(user.email)}">${esc(user.email)}</span>
            <button class="btn btn--ghost btn--sm" type="button" id="logout">Sair</button>
          </div>
        </div>
      </header>`);
    $("#logout").addEventListener("click", async (e) => {
      if (window.__admDirty && !(await confirmar({ titulo: "Sair sem salvar?", texto: "Há alterações que ainda não foram salvas.", ok: "Sair", perigo: true }))) return;
      window.__admDirty = false;
      saindo = true;
      busy(e.currentTarget, true);
      await sb.auth.signOut();
      location.replace("index.html");
    });
  }

  /* ---------- Dados ---------- */
  const SELECT_LISTA = "id,slug,codigo,titulo,tipo,finalidade,status,destaque,destaque_rotulo,destaque_ordem,publicado,preco,cidade,bairro,descricao,atualizado_em,criado_em,fotos:imovel_fotos(id,caminho,ordem)";

  async function listarImoveis() {
    const { data, error } = await sb.from("imoveis").select(SELECT_LISTA).order("atualizado_em", { ascending: false });
    if (error) throw error;
    return data;
  }

  /** Atualiza campos de um imóvel e confirma que a linha foi realmente alterada (RLS). */
  async function atualizarImovel(id, campos) {
    const { data, error } = await sb.from("imoveis").update(campos).eq("id", id).select(SELECT_LISTA);
    if (error) throw error;
    if (!data?.length) throw Object.assign(new Error("permission denied"), { code: "42501" });
    return data[0];
  }

  const caminhoNoBucket = (c) => c && !/^https?:\/\//i.test(c) ? c.replace(/^\/+/, "") : null;

  /** Exclui o imóvel (as fotos no banco saem em cascata) e limpa a pasta no Storage. */
  async function excluirImovel(im) {
    const caminhos = new Set((im.fotos || []).map((f) => caminhoNoBucket(f.caminho)).filter(Boolean));
    try {
      const { data: arquivos } = await sb.storage.from(BUCKET).list(im.id, { limit: 1000 });
      (arquivos || []).forEach((a) => a.id && caminhos.add(`${im.id}/${a.name}`));
    } catch { /* segue com o que já sabemos */ }

    const { data, error } = await sb.from("imoveis").delete().eq("id", im.id).select("id");
    if (error) throw error;
    if (!data?.length) throw Object.assign(new Error("permission denied"), { code: "42501" });

    if (caminhos.size) {
      const { error: errSt } = await sb.storage.from(BUCKET).remove([...caminhos]);
      if (errSt) return { avisoFotos: true };
    }
    return { avisoFotos: false };
  }

  async function pedirExclusao(im) {
    const ok = await confirmar({
      titulo: "Excluir imóvel?",
      texto: `“${im.titulo}” (${im.codigo}) e todas as fotos serão removidos definitivamente.`,
      ok: "Excluir", perigo: true,
    });
    if (!ok) return false;
    const r = await excluirImovel(im);
    return r;
  }

  /* =========================================================
     LOGIN
     ========================================================= */
  async function initLogin() {
    const params = new URLSearchParams(location.search);
    const nextRaw = params.get("next") || "";
    const destino = NEXT_OK.test(nextRaw) ? nextRaw : "painel.html";
    const views = { login: $("#view-login"), reset: $("#view-reset"), nova: $("#view-nova") };
    const mostrar = (v) => {
      Object.entries(views).forEach(([k, el]) => (el.hidden = k !== v));
      $("input", views[v])?.focus();
    };
    const msg = (el, texto, tipo = "error") => {
      el.hidden = !texto;
      el.textContent = texto || "";
      el.className = `form-msg form-msg--${tipo}`;
    };
    $$("[data-view]").forEach((b) => b.addEventListener("click", () => mostrar(b.dataset.view)));

    let recuperando = /type=recovery/.test(location.hash);
    sb.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") { recuperando = true; mostrar("nova"); }
    });
    if (recuperando) mostrar("nova");

    if (params.get("erro") === "sem-permissao") {
      msg($("#login-msg"), "Esta conta não tem acesso ao painel. Fale com o responsável pelo site.");
    }

    // Já logado como admin? Vai direto para o painel.
    if (!recuperando) {
      try {
        const { data: { session } } = await sb.auth.getSession();
        if (session && !recuperando && await verificarAdmin(session.user)) { location.replace(destino); return; }
      } catch { /* mostra o formulário */ }
    }

    $("#login-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.currentTarget;
      const email = f.email.value.trim(), senha = f.senha.value;
      const box = $("#login-msg");
      if (!email || !senha) return msg(box, "Informe e-mail e senha.");
      const btn = $('[type="submit"]', f);
      busy(btn, true); msg(box, "");
      try {
        const { data, error } = await sb.auth.signInWithPassword({ email, password: senha });
        if (error) throw error;
        if (!(await verificarAdmin(data.user))) {
          await sb.auth.signOut();
          throw new Error("Esta conta não tem acesso ao painel.");
        }
        location.replace(destino);
      } catch (err) {
        msg(box, errText(err));
        f.senha.value = "";
        f.senha.focus();
        busy(btn, false);
      }
    });

    $("#reset-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.currentTarget;
      const email = f.email.value.trim();
      const box = $("#reset-msg");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return msg(box, "Informe um e-mail válido.");
      const btn = $('[type="submit"]', f);
      busy(btn, true);
      const redirectTo = location.origin + location.pathname;
      const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo });
      busy(btn, false);
      if (error) return msg(box, errText(error));
      msg(box, "Se este e-mail estiver cadastrado, você receberá um link em instantes. Verifique também a caixa de spam.", "ok");
    });

    $("#nova-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.currentTarget;
      const box = $("#nova-msg");
      if (f.senha.value.length < 8) return msg(box, "A senha precisa ter pelo menos 8 caracteres.");
      if (f.senha.value !== f.senha2.value) return msg(box, "As senhas não são iguais.");
      const btn = $('[type="submit"]', f);
      busy(btn, true);
      const { error } = await sb.auth.updateUser({ password: f.senha.value });
      busy(btn, false);
      if (error) return msg(box, errText(error));
      history.replaceState(null, "", location.pathname);
      msg(box, "Senha alterada. Entrando no painel…", "ok");
      setTimeout(() => location.replace("painel.html"), 900);
    });
  }

  /* =========================================================
     VISÃO GERAL
     ========================================================= */
  async function initPainel(user) {
    $("#dash-hello").textContent = `Conectado como ${user.email}`;
    const stats = $("#stats");
    stats.innerHTML = Array.from({ length: 4 }, () => `<div class="stat"><span class="sk sk--lg"></span><span class="sk sk--md"></span></div>`).join("");
    let lista;
    try { lista = await listarImoveis(); } catch (e) {
      stats.innerHTML = `<div class="panel" style="grid-column:1/-1"><div class="panel__body">${esc(errText(e))} <button class="btn btn--ghost btn--sm" onclick="location.reload()">Tentar de novo</button></div></div>`;
      return;
    }

    const pub = lista.filter((i) => i.publicado);
    const naHome = pub.filter((i) => i.destaque && i.status === "disponivel");
    stats.innerHTML = [
      [lista.length, "imóveis cadastrados", "imoveis.html"],
      [pub.length, "publicados no site", "imoveis.html?pub=1"],
      [lista.length - pub.length, "rascunhos", "imoveis.html?pub=0"],
      [naHome.length, "em destaque na página inicial", "imoveis.html?pub=destaque"],
    ].map(([n, t, h]) => `<a class="stat" href="${h}"><strong>${n}</strong><span>${t}</span></a>`).join("");

    const recent = $("#recent");
    if (!lista.length) {
      recent.innerHTML = `<div class="empty-adm"><h3>Nenhum imóvel cadastrado</h3><p>Cadastre o primeiro imóvel para ele aparecer aqui e, depois de publicado, no site.</p><a class="btn btn--primary" href="imovel.html">+ Cadastrar imóvel</a></div>`;
    } else {
      recent.innerHTML = `<ul class="todo" style="padding:4px 22px">${lista.slice(0, 6).map((i) => `
        <li><a href="imovel.html?id=${i.id}">
          <span class="prop-cell" style="min-width:0">
            <span class="thumb">${capa(i) ? `<img src="${esc(fotoUrl(capa(i)))}" alt="" loading="lazy">` : "sem foto"}</span>
            <span><strong>${esc(i.titulo)}</strong><small>${esc(i.codigo)} · ${brl(i.preco)} · ${i.publicado ? "Publicado" : "Rascunho"}</small></span>
          </span>
          <small>${dataBR(i.atualizado_em)}</small>
        </a></li>`).join("")}</ul>`;
    }

    const total = lista.length || 1;
    $("#status-bars").innerHTML = Object.entries(STATUS).map(([k, t]) => {
      const n = lista.filter((i) => i.status === k).length;
      return `<li><span>${t}</span><span class="track"><span class="fill" style="width:${(n / total) * 100}%"></span></span><b>${n}</b></li>`;
    }).join("");

    const pend = [];
    lista.forEach((i) => {
      const link = `imovel.html?id=${i.id}`;
      if (i.publicado && !(i.fotos || []).length) pend.push([link, i, "Publicado sem fotos"]);
      if (i.destaque && (!i.publicado || i.status !== "disponivel")) pend.push([link, i, i.publicado ? `Destaque, mas ${STATUS[i.status].toLowerCase()}` : "Destaque em rascunho"]);
      if (i.publicado && !String(i.descricao || "").trim()) pend.push([link, i, "Sem descrição"]);
    });
    $("#todo").innerHTML = pend.length
      ? pend.slice(0, 8).map(([h, i, t]) => `<li><a href="${h}"><strong>${esc(i.titulo)}</strong><small>${esc(t)}</small></a></li>`).join("")
      : `<li style="padding:4px 0;color:var(--muted);font-size:.92rem">Nada pendente. ${lista.length ? "Todos os imóveis publicados têm fotos e descrição." : ""}</li>`;
    showFlash();
  }

  /* =========================================================
     LISTAGEM
     ========================================================= */
  async function initLista() {
    const panel = $("#list-panel");
    const q = $("#q"), fStatus = $("#f-status"), fPub = $("#f-pub");
    const params = new URLSearchParams(location.search);
    if (params.has("q")) q.value = params.get("q");
    if (params.has("status")) fStatus.value = params.get("status");
    if (params.has("pub")) fPub.value = params.get("pub");
    let lista = [];

    panel.innerHTML = `<div class="panel__body">${Array.from({ length: 4 }, () => `<span class="sk sk--lg"></span><span class="sk sk--md"></span>`).join("")}</div>`;

    const filtrar = () => {
      const termo = semAcento(q.value.trim());
      return lista.filter((i) =>
        (!termo || semAcento(`${i.titulo} ${i.codigo} ${i.bairro || ""} ${i.cidade} ${i.slug}`).includes(termo)) &&
        (!fStatus.value || i.status === fStatus.value) &&
        (fPub.value === "" || (fPub.value === "destaque" ? i.destaque : String(Number(i.publicado)) === fPub.value)));
    };

    const linha = (i) => `
      <tr data-id="${i.id}">
        <td data-col="imovel">
          <div class="prop-cell">
            <a class="thumb" href="imovel.html?id=${i.id}" tabindex="-1" aria-hidden="true">${capa(i) ? `<img src="${esc(fotoUrl(capa(i)))}" alt="" loading="lazy">` : "sem foto"}</a>
            <a href="imovel.html?id=${i.id}"><strong>${esc(i.titulo)}</strong><small>${esc(i.codigo)} · ${esc(i.tipo)} · ${i.finalidade === "alugar" ? "Aluguel" : "Venda"}${(i.fotos || []).length ? ` · ${i.fotos.length} foto${i.fotos.length > 1 ? "s" : ""}` : ""}</small></a>
          </div>
        </td>
        <td data-col="cidade">${esc(i.bairro ? `${i.bairro}, ${i.cidade}` : i.cidade)}</td>
        <td data-col="preco" class="num">${brl(i.preco)}</td>
        <td data-col="status">
          <label class="sr-only" for="st-${i.id}">Situação de ${esc(i.titulo)}</label>
          <select class="select select--sm" id="st-${i.id}" data-act="status">
            ${Object.entries(STATUS).map(([k, t]) => `<option value="${k}" ${i.status === k ? "selected" : ""}>${t}</option>`).join("")}
          </select>
        </td>
        <td data-col="publicado">
          <label class="switch"><input type="checkbox" data-act="publicado" ${i.publicado ? "checked" : ""}><span class="switch__track"></span><span class="pub-label">${i.publicado ? "Publicado" : "Rascunho"}</span></label>
        </td>
        <td data-col="acoes">
          <div class="row-actions">
            <button class="icon-toggle" type="button" data-act="destaque" aria-pressed="${i.destaque}" aria-label="${i.destaque ? "Remover dos destaques" : "Marcar como destaque"}" title="${i.destaque ? "Em destaque" : "Marcar como destaque"}">${ICON.star}</button>
            <a class="icon-btn-adm" href="imovel.html?id=${i.id}" aria-label="Editar ${esc(i.titulo)}" title="Editar">${ICON.edit}</a>
            ${i.publicado ? `<a class="icon-btn-adm" href="../imovel.html?id=${encodeURIComponent(i.slug)}" target="_blank" rel="noopener" aria-label="Ver no site" title="Ver no site">${ICON.eye}</a>` : ""}
            <button class="icon-btn-adm icon-btn-adm--danger" type="button" data-act="excluir" aria-label="Excluir ${esc(i.titulo)}" title="Excluir">${ICON.trash}</button>
          </div>
        </td>
      </tr>`;

    const render = () => {
      const r = filtrar();
      $("#result-line").textContent = lista.length ? `${r.length} de ${lista.length} imóve${lista.length > 1 ? "is" : "l"}` : "";
      const u = new URLSearchParams();
      if (q.value.trim()) u.set("q", q.value.trim());
      if (fStatus.value) u.set("status", fStatus.value);
      if (fPub.value) u.set("pub", fPub.value);
      history.replaceState(null, "", `${location.pathname}${u.toString() ? `?${u}` : ""}`);

      if (!lista.length) {
        panel.innerHTML = `<div class="empty-adm"><h3>Nenhum imóvel cadastrado</h3><p>Os imóveis cadastrados aqui aparecem no site depois de publicados.</p><a class="btn btn--primary" href="imovel.html">+ Cadastrar imóvel</a></div>`;
        return;
      }
      if (!r.length) {
        panel.innerHTML = `<div class="empty-adm"><h3>Nenhum resultado</h3><p>Nenhum imóvel corresponde à busca e aos filtros escolhidos.</p><button class="btn btn--ghost" type="button" data-act="limpar">Limpar filtros</button></div>`;
        return;
      }
      panel.innerHTML = `<div class="table-wrap"><table class="tbl">
        <thead><tr><th scope="col">Imóvel</th><th scope="col">Local</th><th scope="col" class="num">Preço</th><th scope="col">Situação</th><th scope="col">Publicação</th><th scope="col"><span class="sr-only">Ações</span></th></tr></thead>
        <tbody>${r.map(linha).join("")}</tbody></table></div>`;
    };

    const substituir = (novo) => { lista = lista.map((i) => (i.id === novo.id ? novo : i)); };

    q.addEventListener("input", render);
    fStatus.addEventListener("change", render);
    fPub.addEventListener("change", render);

    panel.addEventListener("click", async (e) => {
      if (e.target.closest('[data-act="limpar"]')) { q.value = ""; fStatus.value = ""; fPub.value = ""; render(); return; }
      const btn = e.target.closest('button[data-act]');
      if (!btn) return;
      const tr = btn.closest("tr");
      const im = lista.find((i) => i.id === tr?.dataset.id);
      if (!im) return;

      if (btn.dataset.act === "destaque") {
        const ligar = !im.destaque;
        const campos = { destaque: ligar };
        if (ligar && (im.destaque_ordem === null || im.destaque_ordem === undefined)) {
          campos.destaque_ordem = Math.max(0, ...lista.map((i) => i.destaque_ordem ?? 0)) + 1;
        }
        tr.classList.add("is-busy");
        try {
          substituir(await atualizarImovel(im.id, campos));
          toast(ligar ? (im.publicado && im.status === "disponivel" ? "Imóvel em destaque na página inicial" : "Marcado como destaque (aparece na home quando publicado e disponível)") : "Removido dos destaques");
        } catch (err) { toast(errText(err)); }
        render();
      }

      if (btn.dataset.act === "excluir") {
        try {
          const r = await pedirExclusao(im);
          if (!r) return;
          lista = lista.filter((i) => i.id !== im.id);
          render();
          toast(r.avisoFotos ? "Imóvel excluído. Algumas fotos não puderam ser apagadas do armazenamento." : "Imóvel excluído");
        } catch (err) { toast(errText(err)); }
      }
    });

    panel.addEventListener("change", async (e) => {
      const el = e.target.closest("[data-act]");
      if (!el) return;
      const tr = el.closest("tr");
      const im = lista.find((i) => i.id === tr?.dataset.id);
      if (!im) return;
      const campos = el.dataset.act === "status" ? { status: el.value } : { publicado: el.checked };
      tr.classList.add("is-busy");
      try {
        const novo = await atualizarImovel(im.id, campos);
        substituir(novo);
        if ("publicado" in campos) toast(novo.publicado ? ((novo.fotos || []).length ? "Imóvel publicado no site" : "Publicado — lembre de adicionar fotos") : "Imóvel voltou para rascunho");
        else toast(`Situação alterada para ${STATUS[novo.status]}`);
      } catch (err) { toast(errText(err)); }
      render();
    });

    try {
      lista = await listarImoveis();
      render();
    } catch (e) {
      panel.innerHTML = `<div class="empty-adm"><h3>Não foi possível carregar</h3><p>${esc(errText(e))}</p><button class="btn btn--ghost" onclick="location.reload()">Tentar de novo</button></div>`;
    }
    showFlash();
  }

  /* =========================================================
     CADASTRO / EDIÇÃO
     ========================================================= */
  const MAX_LADO = 1920;
  const MAX_ENTRADA = 30 * 1024 * 1024;
  const MAX_BUCKET = 10 * 1024 * 1024;

  const canvasParaBlob = (canvas, tipo, q) => new Promise((r) => canvas.toBlob(r, tipo, q));

  /** Reduz a foto para no máximo 1920 px e converte para WebP (ou JPEG, se o navegador não gerar WebP). */
  async function otimizarFoto(file) {
    if (!/^image\//.test(file.type) && !/\.(jpe?g|png|webp|avif|heic|heif)$/i.test(file.name)) throw new Error("O arquivo não é uma imagem.");
    if (file.size > MAX_ENTRADA) throw new Error("Imagem grande demais (máximo 30 MB).");
    let bmp;
    try { bmp = await createImageBitmap(file, { imageOrientation: "from-image" }); } catch {
      throw new Error("Formato não suportado. Use JPG, PNG ou WebP.");
    }
    const escala = Math.min(1, MAX_LADO / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * escala);
    canvas.height = Math.round(bmp.height * escala);
    canvas.getContext("2d").drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close?.();
    let blob = await canvasParaBlob(canvas, "image/webp", 0.82);
    if (!blob || blob.type !== "image/webp") blob = await canvasParaBlob(canvas, "image/jpeg", 0.85);
    if (!blob) throw new Error("Não foi possível processar a imagem.");
    if (blob.size > MAX_BUCKET) throw new Error("Imagem grande demais mesmo após otimizar.");
    return blob;
  }

  // Valores em reais: aceita "1.250.000", "1250000", "450,50", "1.250.000,00"
  const lerDinheiro = (s) => {
    let t = String(s || "").replace(/[R$\s]/g, "");
    if (!t) return null;
    if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
    else if ((t.match(/\./g) || []).length > 1 || /\.\d{3}$/.test(t)) t = t.replace(/\./g, "");
    const n = Number(t);
    return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN;
  };
  const fmtDinheiro = (n) => (n === null || n === undefined || n === "" ? "" : Number(n).toLocaleString("pt-BR", { minimumFractionDigits: Number(n) % 1 ? 2 : 0, maximumFractionDigits: 2 }));
  const lerDecimal = (s) => {
    const t = String(s ?? "").trim().replace(",", ".");
    if (!t) return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : NaN;
  };
  const lerLinhas = (s) => [...new Set(String(s || "").split(/\r?\n/).map((l) => l.replace(/^[-•*\s]+/, "").trim()).filter(Boolean))];

  async function initForm() {
    const form = $("#imovel-form");
    const F = form.elements;
    const alertBox = $("#form-alert");
    const saveState = $("#save-state");
    const params = new URLSearchParams(location.search);
    let imovelId = params.get("id");
    let atual = null;           // registro salvo
    let slugManual = Boolean(imovelId);
    let salvando = false;

    /* ----- estado "alterações não salvas" ----- */
    let dirty = false;
    const setDirty = (v) => {
      dirty = v;
      window.__admDirty = v || fotos.some((f) => f.estado === "pendente" || f.estado === "enviando");
      saveState.textContent = v ? "Alterações não salvas" : (atual ? `Salvo ${dataBR(atual.atualizado_em)}` : "");
      saveState.classList.toggle("is-dirty", v);
    };
    window.addEventListener("beforeunload", (e) => {
      if (window.__admDirty) { e.preventDefault(); e.returnValue = ""; }
    });

    /* ----- campos dependentes ----- */
    const aplicarTipo = () => {
      $$("[data-hide-for]", form).forEach((el) => el.classList.toggle("is-hidden-by-type", el.dataset.hideFor.split(" ").includes(F.tipo.value)));
    };
    const aplicarFinalidade = () => {
      $("#preco-label").textContent = form.querySelector('[name="finalidade"]:checked').value === "alugar" ? "Aluguel mensal" : "Preço de venda";
    };
    const aplicarDestaque = () => { $("#destaque-extra").hidden = !F.destaque.checked; };
    const atualizarContador = () => { $('[data-counter="resumo"]').textContent = `${F.resumo.value.length}/160`; };
    const sugerirSlug = () => { if (!slugManual) { F.slug.value = slugify(`${F.titulo.value} ${F.cidade.value}`); if (F.slug.value) erroCampo("slug", ""); } };

    F.tipo.addEventListener("change", aplicarTipo);
    $$('[name="finalidade"]', form).forEach((r) => r.addEventListener("change", aplicarFinalidade));
    F.destaque.addEventListener("change", aplicarDestaque);
    F.resumo.addEventListener("input", atualizarContador);
    F.titulo.addEventListener("input", sugerirSlug);
    F.cidade.addEventListener("input", sugerirSlug);
    F.slug.addEventListener("input", () => { slugManual = true; });
    F.slug.addEventListener("blur", () => { F.slug.value = slugify(F.slug.value); });
    F.codigo.addEventListener("blur", () => { F.codigo.value = F.codigo.value.trim().toUpperCase(); });
    $$("[data-money]", form).forEach((el) => el.addEventListener("blur", () => {
      const n = lerDinheiro(el.value);
      if (n !== null && !Number.isNaN(n)) el.value = fmtDinheiro(n);
    }));
    // Colar "-22.90, -47.06" na latitude preenche os dois campos
    F.lat.addEventListener("input", () => {
      const m = F.lat.value.match(/^\s*(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)\s*$/);
      if (m) { F.lat.value = m[1]; F.lng.value = m[2]; }
    });
    form.addEventListener("input", () => { setDirty(true); if (!$(".is-invalid", form)) alertBox.hidden = true; });
    form.addEventListener("change", (e) => { if (e.target.id !== "photo-input") setDirty(true); });

    /* ----- preencher ----- */
    const preencher = (r) => {
      F.titulo.value = r.titulo || "";
      F.tipo.value = r.tipo || "Casa";
      $$('[name="finalidade"]', form).forEach((el) => (el.checked = el.value === (r.finalidade || "comprar")));
      F.codigo.value = r.codigo || "";
      F.slug.value = r.slug || "";
      F.preco.value = fmtDinheiro(r.preco);
      F.condominio_valor.value = fmtDinheiro(r.condominio_valor);
      F.iptu.value = fmtDinheiro(r.iptu);
      F.cidade.value = r.cidade || "";
      F.bairro.value = r.bairro || "";
      F.lat.value = r.lat ?? "";
      F.lng.value = r.lng ?? "";
      ["quartos", "suites", "banheiros", "vagas"].forEach((k) => (F[k].value = r[k] ?? 0));
      F.area.value = r.area ?? "";
      F.resumo.value = r.resumo || "";
      F.descricao.value = r.descricao || "";
      F.caracteristicas.value = (r.caracteristicas || []).join("\n");
      F.itens_condominio.value = (r.itens_condominio || []).join("\n");
      F.publicado.checked = Boolean(r.publicado);
      F.status.value = r.status || "disponivel";
      F.destaque.checked = Boolean(r.destaque);
      F.destaque_rotulo.value = r.destaque_rotulo || "";
      F.destaque_ordem.value = r.destaque_ordem ?? "";
      aplicarTipo(); aplicarFinalidade(); aplicarDestaque(); atualizarContador();
    };

    const modoEdicao = () => {
      $("#form-title").textContent = atual.titulo;
      $("#form-sub").textContent = `${atual.codigo} · ${atual.publicado ? "Publicado" : "Rascunho"} · ${STATUS[atual.status]}`;
      document.title = `${atual.titulo} · Painel Lucas Almeida`;
      $("#danger").hidden = false;
      const view = $("#view-btn");
      view.hidden = !atual.publicado;
      view.href = `../imovel.html?id=${encodeURIComponent(atual.slug)}`;
      $("#save-btn").textContent = "Salvar alterações";
      $$(".adm-nav a").forEach((a) => a.removeAttribute("aria-current"));
      $('.adm-nav a[href="imoveis.html"]')?.setAttribute("aria-current", "page");
    };

    /* ----- validação ----- */
    const erroCampo = (nome, texto) => {
      const el = F[nome];
      const box = $(`#${nome}-err`);
      el?.classList.toggle("is-invalid", Boolean(texto));
      el?.setAttribute("aria-invalid", Boolean(texto));
      if (box) box.textContent = texto || "";
    };
    $$(".input, .select, .textarea", form).forEach((el) => el.addEventListener("input", () => { if (el.classList.contains("is-invalid")) erroCampo(el.name, ""); }));

    const montarDados = () => {
      const tipo = F.tipo.value;
      const oculto = (k) => $(`[data-hide-for] #${k}`, form)?.closest("[data-hide-for]")?.dataset.hideFor.split(" ").includes(tipo);
      const inteiro = (k) => (oculto(k) ? 0 : Math.max(0, parseInt(F[k].value, 10) || 0));
      const ordem = F.destaque_ordem.value.trim();
      return {
        titulo: F.titulo.value.trim(),
        tipo,
        finalidade: form.querySelector('[name="finalidade"]:checked').value,
        codigo: F.codigo.value.trim().toUpperCase(),
        slug: slugify(F.slug.value),
        preco: lerDinheiro(F.preco.value),
        condominio_valor: lerDinheiro(F.condominio_valor.value),
        iptu: lerDinheiro(F.iptu.value),
        cidade: F.cidade.value.trim(),
        bairro: F.bairro.value.trim() || null,
        lat: lerDecimal(F.lat.value),
        lng: lerDecimal(F.lng.value),
        quartos: inteiro("quartos"),
        suites: inteiro("suites"),
        banheiros: inteiro("banheiros"),
        vagas: inteiro("vagas"),
        area: lerDecimal(F.area.value),
        resumo: F.resumo.value.trim() || null,
        descricao: F.descricao.value.replace(/\r\n/g, "\n").trim() || null,
        caracteristicas: lerLinhas(F.caracteristicas.value),
        itens_condominio: lerLinhas(F.itens_condominio.value),
        publicado: F.publicado.checked,
        status: F.status.value,
        destaque: F.destaque.checked,
        destaque_rotulo: F.destaque_rotulo.value.trim() || null,
        destaque_ordem: ordem === "" ? null : Math.max(0, parseInt(ordem, 10) || 0),
      };
    };

    const validar = (d) => {
      const erros = {};
      if (!d.titulo) erros.titulo = "Informe o título.";
      if (!d.codigo) erros.codigo = "Informe o código.";
      if (!d.slug) erros.slug = "Informe o endereço da página.";
      else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(d.slug)) erros.slug = "Use apenas letras minúsculas, números e hífens.";
      if (d.preco === null) erros.preco = "Informe o valor.";
      else if (Number.isNaN(d.preco) || d.preco < 0) erros.preco = "Valor inválido.";
      if (!d.cidade) erros.cidade = "Informe a cidade.";
      if (Number.isNaN(d.lat) || (d.lat !== null && (d.lat < -90 || d.lat > 90))) erros.lat = "Latitude inválida.";
      if (Number.isNaN(d.lng) || (d.lng !== null && (d.lng < -180 || d.lng > 180))) erros.lng = "Longitude inválida.";
      if ((d.lat === null) !== (d.lng === null) && !erros.lat && !erros.lng) erros[d.lat === null ? "lat" : "lng"] = "Preencha latitude e longitude juntas.";
      if (Number.isNaN(d.area) || (d.area !== null && d.area < 0)) erros.area = "Área inválida.";
      ["condominio_valor", "iptu"].forEach((k) => { if (Number.isNaN(d[k])) d[k] = null; });
      ["titulo", "codigo", "slug", "preco", "cidade", "lat", "lng", "area"].forEach((k) => erroCampo(k, erros[k]));
      const primeiro = Object.keys(erros)[0];
      if (primeiro) F[primeiro].focus();
      return !primeiro;
    };

    /* ----- fotos ----- */
    const lista = $("#photos");
    let fotos = [];   // { key, id?, caminho?, blob?, url, estado: ok|processando|pendente|enviando|erro, erro? }
    let fila = Promise.resolve();
    const novaChave = () => Math.random().toString(36).slice(2, 10);

    const renderFotos = () => {
      $("#photo-count").textContent = fotos.length ? `${fotos.length} foto${fotos.length > 1 ? "s" : ""}` : "";
      lista.innerHTML = fotos.map((f, i) => {
        const ocupado = ["processando", "enviando"].includes(f.estado);
        const rotulo = { processando: "Otimizando…", enviando: "Enviando…", pendente: "", erro: "", ok: "" }[f.estado];
        return `
        <li class="photo ${ocupado ? "is-busy" : ""} ${f.estado === "erro" ? "is-error" : ""}" data-key="${f.key}">
          <div class="photo__img" data-state="${rotulo}">
            ${f.url ? `<img src="${esc(f.url)}" alt="Foto ${i + 1}">` : ""}
            ${i === 0 ? '<span class="tag tag--accent photo__badge">Capa</span>' : f.estado === "pendente" ? '<span class="tag photo__badge">Aguardando salvar</span>' : ""}
          </div>
          ${f.estado === "erro" ? `<p class="photo__err">${esc(f.erro)}</p>` : ""}
          <div class="photo__bar">
            <button type="button" data-ph="esq" ${i === 0 || ocupado ? "disabled" : ""} aria-label="Mover para a esquerda">${ICON.left}</button>
            <button type="button" data-ph="capa" ${i === 0 || ocupado || f.estado === "erro" ? "disabled" : ""} aria-label="Usar como capa" title="Usar como capa">${ICON.star}</button>
            <button type="button" data-ph="dir" ${i === fotos.length - 1 || ocupado ? "disabled" : ""} aria-label="Mover para a direita">${ICON.right}</button>
            <button type="button" class="danger" data-ph="remover" ${ocupado ? "disabled" : ""} aria-label="Excluir foto ${i + 1}">${ICON.trash}</button>
          </div>
        </li>`;
      }).join("");
      window.__admDirty = dirty || fotos.some((f) => f.estado === "pendente" || f.estado === "enviando");
    };

    /** Grava a ordem atual das fotos já salvas no banco (somente as que mudaram). */
    const salvarOrdem = async () => {
      if (!imovelId) return;
      const salvas = fotos.filter((f) => f.id);
      const mudancas = salvas.map((f, i) => ({ f, i })).filter(({ f, i }) => f.ordem !== i);
      if (!mudancas.length) return;
      const res = await Promise.all(mudancas.map(({ f, i }) => sb.from("imovel_fotos").update({ ordem: i }).eq("id", f.id).select("id")));
      const falha = res.find((r) => r.error || !r.data?.length);
      if (falha) throw falha.error || Object.assign(new Error("permission denied"), { code: "42501" });
      mudancas.forEach(({ f, i }) => (f.ordem = i));
    };

    const enviarFoto = async (f) => {
      f.estado = "enviando"; renderFotos();
      const ext = f.blob.type === "image/webp" ? "webp" : "jpg";
      const caminho = `${imovelId}/${Date.now().toString(36)}-${novaChave()}.${ext}`;
      try {
        const up = await sb.storage.from(BUCKET).upload(caminho, f.blob, { contentType: f.blob.type, cacheControl: "31536000", upsert: false });
        if (up.error) throw up.error;
        const ordem = fotos.filter((x) => x.id).length;
        const { data, error } = await sb.from("imovel_fotos").insert({ imovel_id: imovelId, caminho, ordem }).select("id,caminho,ordem").single();
        if (error) { await sb.storage.from(BUCKET).remove([caminho]); throw error; }
        Object.assign(f, { id: data.id, caminho: data.caminho, ordem: data.ordem, estado: "ok", blob: null });
      } catch (e) {
        Object.assign(f, { estado: "erro", erro: errText(e) });
      }
      renderFotos();
    };

    const adicionarArquivos = (files) => {
      const imgs = [...files];
      if (!imgs.length) return;
      imgs.forEach((file) => {
        const f = { key: novaChave(), estado: "processando", url: "" };
        fotos.push(f);
        fila = fila.then(async () => {
          try {
            f.blob = await otimizarFoto(file);
            f.url = URL.createObjectURL(f.blob);
            f.estado = "pendente";
            renderFotos();
            if (imovelId) await enviarFoto(f);
          } catch (e) {
            Object.assign(f, { estado: "erro", erro: errText(e) });
            renderFotos();
          }
        });
      });
      renderFotos();
      fila = fila.then(async () => {
        try { await salvarOrdem(); } catch (e) { toast(errText(e)); }
        const enviadas = fotos.filter((x) => x.estado === "ok").length;
        if (imovelId && enviadas) toast("Fotos enviadas");
      });
    };

    const input = $("#photo-input");
    input.addEventListener("change", () => { adicionarArquivos(input.files); input.value = ""; });
    const dz = $("#dropzone");
    ["dragenter", "dragover"].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add("is-over"); }));
    ["dragleave", "drop"].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove("is-over"); }));
    dz.addEventListener("drop", (e) => adicionarArquivos(e.dataTransfer?.files || []));

    lista.addEventListener("click", async (e) => {
      const b = e.target.closest("[data-ph]");
      if (!b) return;
      const key = b.closest("[data-key]").dataset.key;
      const i = fotos.findIndex((f) => f.key === key);
      if (i < 0) return;
      const f = fotos[i];
      const anterior = fotos.slice();

      if (b.dataset.ph === "remover") {
        if (f.id) {
          if (!(await confirmar({ titulo: "Excluir foto?", texto: "A foto será removida do imóvel e do armazenamento.", ok: "Excluir", perigo: true }))) return;
          f.estado = "enviando"; renderFotos();
          const { data, error } = await sb.from("imovel_fotos").delete().eq("id", f.id).select("id");
          if (error || !data?.length) { f.estado = "ok"; renderFotos(); return toast(errText(error || { code: "42501" })); }
          const path = caminhoNoBucket(f.caminho);
          if (path) { const r = await sb.storage.from(BUCKET).remove([path]); if (r.error) toast("Foto removida do imóvel, mas o arquivo não foi apagado do armazenamento."); }
          toast("Foto excluída");
        }
        if (f.url?.startsWith("blob:")) URL.revokeObjectURL(f.url);
        fotos.splice(fotos.indexOf(f), 1);
      } else {
        const destino = b.dataset.ph === "capa" ? 0 : b.dataset.ph === "esq" ? i - 1 : i + 1;
        fotos.splice(i, 1);
        fotos.splice(destino, 0, f);
      }
      renderFotos();
      try { await salvarOrdem(); } catch (err) { fotos = anterior; renderFotos(); toast(errText(err)); }
    });

    /* ----- salvar ----- */
    const traduzirErroSalvar = (e) => {
      const m = `${e?.message || ""} ${e?.details || ""}`;
      if (e?.code === "23505" && /slug/i.test(m)) { erroCampo("slug", "Este endereço já está em uso por outro imóvel."); F.slug.focus(); return "Corrija o endereço da página."; }
      if (e?.code === "23505" && /codigo/i.test(m)) { erroCampo("codigo", "Este código já está em uso."); F.codigo.focus(); return "Corrija o código."; }
      return errText(e);
    };

    const salvar = async () => {
      if (salvando) return;
      alertBox.hidden = true;
      const d = montarDados();
      if (!validar(d)) { alertBox.hidden = false; alertBox.textContent = "Revise os campos destacados."; return; }
      if (d.destaque && d.destaque_ordem === null) d.destaque_ordem = 1;
      salvando = true;
      const btn = $("#save-btn");
      busy(btn, true);
      try {
        let row;
        if (imovelId) {
          const { data, error } = await sb.from("imoveis").update(d).eq("id", imovelId).select("*").maybeSingle();
          if (error) throw error;
          if (!data) throw Object.assign(new Error("permission denied"), { code: "42501" });
          row = data;
        } else {
          const { data, error } = await sb.from("imoveis").insert(d).select("*").single();
          if (error) throw error;
          row = data;
          imovelId = row.id;
          history.replaceState(null, "", `imovel.html?id=${row.id}`);
        }
        atual = row;
        slugManual = true;
        preencher(row);
        modoEdicao();
        setDirty(false);

        const pendentes = fotos.filter((f) => f.estado === "pendente");
        if (pendentes.length) {
          saveState.textContent = "Enviando fotos…";
          await fila;
          for (const f of pendentes) await enviarFoto(f);
          await salvarOrdem();
          const falhas = fotos.filter((f) => f.estado === "erro").length;
          toast(falhas ? `Imóvel salvo. ${falhas} foto(s) não foram enviadas.` : "Imóvel e fotos salvos");
        } else {
          toast(row.publicado ? "Imóvel salvo e publicado" : "Imóvel salvo como rascunho");
        }
        setDirty(false);
      } catch (e) {
        alertBox.hidden = false;
        alertBox.textContent = traduzirErroSalvar(e);
        alertBox.scrollIntoView({ behavior: "smooth", block: "center" });
      } finally {
        salvando = false;
        busy(btn, false);
      }
    };

    form.addEventListener("submit", (e) => { e.preventDefault(); salvar(); });
    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); salvar(); }
    });

    $("#delete-btn").addEventListener("click", async (e) => {
      if (!atual) return;
      const btn = e.currentTarget;
      try {
        busy(btn, true);
        const r = await pedirExclusao({ ...atual, fotos: fotos.filter((f) => f.id).map((f) => ({ caminho: f.caminho })) });
        if (!r) return;
        window.__admDirty = false;
        flash(r.avisoFotos ? "Imóvel excluído. Algumas fotos não puderam ser apagadas do armazenamento." : "Imóvel excluído");
        location.replace("imoveis.html");
      } catch (err) { toast(errText(err)); } finally { busy(btn, false); }
    });

    /* ----- carregar ----- */
    aplicarTipo(); aplicarFinalidade(); aplicarDestaque(); atualizarContador();
    if (imovelId) {
      form.inert = true;
      try {
        const { data, error } = await sb.from("imoveis").select("*, fotos:imovel_fotos(id,caminho,ordem,legenda)").eq("id", imovelId).maybeSingle();
        if (error) throw error;
        if (!data) {
          $("#form-title").textContent = "Imóvel não encontrado";
          $("#form-sub").textContent = "Ele pode ter sido excluído.";
          form.innerHTML = `<div class="panel empty-adm" style="grid-column:1/-1"><a class="btn btn--primary" href="imoveis.html">Voltar para a lista</a></div>`;
          return;
        }
        atual = data;
        preencher(data);
        fotos = ordenarFotos(data.fotos).map((f) => ({ key: novaChave(), id: f.id, caminho: f.caminho, ordem: f.ordem, url: fotoUrl(f.caminho), estado: "ok" }));
        renderFotos();
        modoEdicao();
        setDirty(false);
      } catch (e) {
        alertBox.hidden = false;
        alertBox.textContent = errText(e);
      } finally {
        form.inert = false;
      }
    } else {
      // Sugere o próximo código (LA-101, LA-102…)
      try {
        const { data } = await sb.from("imoveis").select("codigo");
        const nums = (data || []).map((r) => parseInt(String(r.codigo).match(/(\d+)\s*$/)?.[1], 10)).filter(Number.isFinite);
        if (!F.codigo.value) F.codigo.value = `LA-${nums.length ? Math.max(...nums) + 1 : 101}`;
      } catch { /* o usuário digita */ }
      F.titulo.focus();
    }
  }

  /* ---------- Inicialização ---------- */
  (async () => {
    if (page === "login") return initLogin();
    const user = await exigirAdmin();
    if (!user) return;
    renderBarra(user);
    if (page === "painel") initPainel(user);
    if (page === "imoveis") initLista();
    if (page === "imovel") initForm();
  })();
})();
