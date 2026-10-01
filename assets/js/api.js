/*
 * Camada de acesso aos imóveis no Supabase.
 * Usa a API REST do Supabase (PostgREST) com fetch — sem dependências.
 * Todas as funções devolvem Promises e lançam ApiError em caso de falha.
 *
 * Uso (no main.js):
 *   await API.listarDestaques()
 *   await API.listarParaListagem()
 *   await API.buscarImovel("casa-contemporanea-campinas")   // slug ou uuid
 */
(() => {
  "use strict";

  const CFG = window.APP_CONFIG || {};
  const BASE = String(CFG.SUPABASE_URL || "").trim().replace(/\/+$/, "");
  const KEY = String(CFG.SUPABASE_ANON_KEY || "").trim();
  const BUCKET = CFG.STORAGE_BUCKET || "imoveis";
  const TIMEOUT_MS = 12000;

  class ApiError extends Error {
    /** tipo: "config" | "rede" | "tempo" | "http" */
    constructor(tipo, message, detalhe) {
      super(message);
      this.name = "ApiError";
      this.tipo = tipo;
      this.detalhe = detalhe;
    }
  }

  // Trava de segurança: recusa rodar com uma chave secreta no frontend.
  const chaveSecreta = (() => {
    if (/^sb_secret_/i.test(KEY)) return true;
    try {
      const payload = JSON.parse(atob(KEY.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      return payload.role === "service_role";
    } catch { return false; }
  })();
  if (chaveSecreta) console.error("[api] SUPABASE_ANON_KEY contém uma chave SECRETA (service_role). Troque pela chave anon/publishable e gere uma nova chave secreta no Supabase.");

  const configurado = () => Boolean(BASE && KEY && !chaveSecreta);

  const headers = () => {
    const h = { apikey: KEY, Accept: "application/json" };
    if (KEY.startsWith("eyJ")) h.Authorization = `Bearer ${KEY}`; // chave anon legada (JWT)
    return h;
  };

  async function request(tabela, params) {
    if (!configurado()) {
      throw new ApiError("config", chaveSecreta
        ? "Chave secreta detectada no config.js — use a chave pública (anon)."
        : "Supabase ainda não configurado (preencha assets/js/config.js).");
    }
    const url = `${BASE}/rest/v1/${tabela}?${new URLSearchParams(params)}`;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    let res;
    try {
      res = await fetch(url, { headers: headers(), signal: ctrl.signal });
    } catch (e) {
      throw e.name === "AbortError"
        ? new ApiError("tempo", "O servidor demorou demais para responder.")
        : new ApiError("rede", "Não foi possível conectar ao servidor.", e);
    } finally {
      clearTimeout(timer);
    }
    if (!res.ok) {
      let detalhe = null;
      try { detalhe = await res.json(); } catch { /* corpo vazio */ }
      throw new ApiError("http", `Erro ${res.status} ao consultar ${tabela}.`, detalhe);
    }
    return res.json();
  }

  /* ---------- Fotos ---------- */
  // caminho = URL completa (ex.: Unsplash) ou "<id-do-imovel>/<arquivo>" no bucket do Storage
  const fotoUrl = (caminho, w = 1600) => {
    if (!caminho) return "";
    if (/^https?:\/\//i.test(caminho)) {
      try {
        const u = new URL(caminho);
        if (u.hostname === "images.unsplash.com") u.searchParams.set("w", w);
        return u.toString();
      } catch { return caminho; }
    }
    const path = caminho.replace(/^\/+/, "").replace(new RegExp(`^${BUCKET}/`), "");
    return `${BASE}/storage/v1/object/public/${BUCKET}/${path.split("/").map(encodeURIComponent).join("/")}`;
  };

  /* ---------- Normalização ---------- */
  // Converte a linha do banco no formato que o site já usava no data.js.
  const num = (v) => (v === null || v === undefined || v === "" ? null : Number(v));
  const normalizar = (r) => {
    const fotos = (r.fotos || []).slice().sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
    const lat = num(r.lat), lng = num(r.lng);
    const cond = Array.isArray(r.itens_condominio) ? r.itens_condominio : [];
    return {
      id: r.slug,                 // identificador público (URL e favoritos)
      uuid: r.id,
      codigo: r.codigo,
      tipo: r.tipo,
      titulo: r.titulo,
      finalidade: r.finalidade,
      status: r.status,
      preco: num(r.preco) ?? 0,
      condominioValor: num(r.condominio_valor),
      iptu: num(r.iptu),
      cidade: r.cidade,
      bairro: r.bairro || "",
      quartos: r.quartos || 0,
      suites: r.suites || 0,
      banheiros: r.banheiros || 0,
      vagas: r.vagas || 0,
      area: num(r.area) ?? 0,
      coords: lat !== null && lng !== null ? [lat, lng] : null,
      resumo: r.resumo || "",
      descricao: String(r.descricao || "").split(/\n\s*\n/).map((t) => t.trim()).filter(Boolean),
      caracteristicas: Array.isArray(r.caracteristicas) ? r.caracteristicas : [],
      condominio: cond.length ? cond : null,
      imagens: fotos.map((f) => f.caminho),
      legendas: fotos.map((f) => f.legenda || ""),
      destaque: r.destaque_rotulo || null,   // rótulo exibido no card
      emDestaque: Boolean(r.destaque),
      destaqueOrdem: r.destaque_ordem,
    };
  };

  const SELECT = "*,fotos:imovel_fotos(caminho,ordem,legenda)";
  const ORDEM_PADRAO = "destaque.desc,destaque_ordem.asc.nullslast,criado_em.desc";

  /* ---------- Consultas ---------- */

  /** Todos os imóveis publicados. opcoes.apenasDisponiveis filtra status = disponivel. */
  async function listarPublicados({ apenasDisponiveis = false } = {}) {
    const p = { select: SELECT, publicado: "eq.true", order: ORDEM_PADRAO, "fotos.order": "ordem.asc" };
    if (apenasDisponiveis) p.status = "eq.disponivel";
    return (await request("imoveis", p)).map(normalizar);
  }

  /** Imóveis da seção de destaque da home: publicados, disponíveis e marcados como destaque. */
  async function listarDestaques({ limite = 6 } = {}) {
    const rows = await request("imoveis", {
      select: SELECT, publicado: "eq.true", status: "eq.disponivel", destaque: "eq.true",
      order: "destaque_ordem.asc.nullslast,criado_em.desc", "fotos.order": "ordem.asc", limit: limite,
    });
    return rows.map(normalizar);
  }

  /**
   * Imóveis da página de listagem (publicados, em qualquer status).
   * Os filtros da página são aplicados no navegador sobre esta lista,
   * o que mantém a filtragem instantânea e os favoritos funcionando.
   */
  async function listarParaListagem() {
    return listarPublicados();
  }

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  /** Um imóvel publicado pelo slug (ou uuid). Retorna null se não existir. */
  async function buscarImovel(idOuSlug) {
    const v = String(idOuSlug || "").trim();
    if (!v) return null;
    const p = { select: SELECT, publicado: "eq.true", "fotos.order": "ordem.asc", limit: 1 };
    if (UUID_RE.test(v)) p.id = `eq.${v}`; else p.slug = `eq.${v.toLowerCase()}`;
    const rows = await request("imoveis", p);
    return rows.length ? normalizar(rows[0]) : null;
  }

  window.API = Object.freeze({
    configurado, listarPublicados, listarDestaques, listarParaListagem, buscarImovel, fotoUrl, ApiError,
  });
})();
