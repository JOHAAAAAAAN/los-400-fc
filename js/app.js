/* =====================================================================
   LOS 400 FC · Interfaz
   Dibuja la página a partir de js/data.js usando el motor de js/stats.js.
   No necesitas editar este archivo para cargar partidos.
   ===================================================================== */
(function () {
  "use strict";

  const S = window.Stats400;
  const app = document.getElementById("app");
  const $ = (sel, el) => (el || document).querySelector(sel);
  const $$ = (sel, el) => Array.from((el || document).querySelectorAll(sel));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const reduceMotion = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);

  /* ================================================================
     1. DATOS
     ================================================================ */

  // Leemos data.js con cuidado: si tiene un error de tipeo, mostramos un aviso en vez de una página en blanco.
  const D = {};
  try { D.liga = typeof LIGA !== "undefined" ? LIGA : {}; } catch (e) { D.liga = {}; }
  try { D.jug = typeof JUGADORES !== "undefined" ? JUGADORES : null; } catch (e) { D.jug = null; }
  try { D.par = typeof PARTIDOS !== "undefined" ? PARTIDOS : null; } catch (e) { D.par = null; }

  if (!S || !Array.isArray(D.jug) || !Array.isArray(D.par)) {
    fatal();
    return;
  }

  const LIGA_C = Object.assign({ nombre: "Los 400 FC" }, D.liga || {});
  const DB = S.normalizar(LIGA_C, D.jug, D.par);
  const J = DB.jugadores;
  const P = DB.partidos;
  const porId = {};
  J.forEach((j) => { porId[j.id] = j; });

  const hoy = new Date();
  const HOY_MES = S.claveMes(hoy.getFullYear(), hoy.getMonth() + 1);
  const HOY_ORDEN = hoy.getFullYear() * 10000 + (hoy.getMonth() + 1) * 100 + hoy.getDate();
  P.forEach((p) => {
    if (p.fecha.orden > HOY_ORDEN) DB.avisos.push(`Partido #${p.idx + 1} tiene fecha futura (${p.fecha.larga}). ¿Error de tipeo?`);
  });
  const MESES = S.listaMeses(DB.inicio, P, HOY_MES);
  const GLOBAL = S.tabla(J, P);
  const GLOBAL_ID = {};
  GLOBAL.forEach((f) => { GLOBAL_ID[f.id] = f; });
  const RACHA_ACTUAL = {};
  GLOBAL.forEach((f) => { RACHA_ACTUAL[f.id] = f.racha; });
  const CAMPEONES = S.campeonesMes(J, P, HOY_MES);
  const TITULOS = {};
  CAMPEONES.forEach((c) => c.ids.forEach((id) => { TITULOS[id] = (TITULOS[id] || 0) + 1; }));

  /* ================================================================
     2. FORMATO Y PIEZAS
     ================================================================ */

  const pct = (n) => (n == null ? "—" : Math.round(n) + "%");
  const num = (n, dec) => (n == null ? "—" : Number(n).toLocaleString("es-CL", { minimumFractionDigits: dec || 0, maximumFractionDigits: dec || 0 }));
  const dec2 = (n) => (n == null ? "—" : Number(n).toLocaleString("es-CL", { maximumFractionDigits: 2 }));
  const plural = (n, s, p) => `${n} ${n === 1 ? s : (p || s + "s")}`;
  const nombre = (id) => (porId[id] ? porId[id].nombre : id);
  const urlJugador = (id) => "#/jugador/" + encodeURIComponent(id);
  const partidosDe = (scope) => (scope === "temporada" ? P : P.filter((p) => p.fecha.mes === scope));
  const R_TXT = { V: "Victoria", E: "Empate", D: "Derrota" };
  // Sin partidos en este periodo: ¿nunca jugó o solo no jugó este mes?
  const sinPartidos = (id) => (GLOBAL_ID[id] && GLOBAL_ID[id].pj ? "No jugó este mes" : "Por debutar");

  // Color según el rendimiento
  function colorRend(n) {
    if (n == null) return "#33403a";
    const r = Math.round(n);
    return r > 90 ? "#00e676" : r >= 70 ? "#2979ff" : r >= 60 ? "#ffea00" : r >= 50 ? "#ff9100" : "#ff1744";
  }

  const ICONOS = {
    share: '<circle cx="18" cy="5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="19" r="2.6"/><path d="M8.3 10.8l7.4-4.4M8.3 13.2l7.4 4.4"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
    left: '<path d="M15 5l-7 7 7 7"/>',
    right: '<path d="M9 5l7 7-7 7"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    github: '<path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/>',
  };
  const icon = (n) => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${ICONOS[n]}</svg>`;

  function iniciales(n) {
    const t = String(n || "?").trim();
    return t.slice(0, 2).toUpperCase();
  }

  function avatar(id, size, extra) {
    const j = porId[id] || { id, nombre: id, foto: "", color: "#8a9a91" };
    const s = size || 40;
    const st = `--c:${esc(j.color)};--s:${s}px`;
    const ini = esc(iniciales(j.nombre));
    if (!j.foto) return `<span class="av av-ini ${extra || ""}" style="${st}" aria-hidden="true">${ini}</span>`;
    return `<img class="av ${extra || ""}" style="${st}" src="${esc(j.foto)}" alt="" width="${s}" height="${s}" loading="lazy" decoding="async" data-ini="${ini}">`;
  }

  const pill = (rend) => `<span class="pill" style="--pc:${colorRend(rend)}">${pct(rend)}</span>`;

  function forma(arr, n) {
    n = n || 5;
    const out = [];
    for (let i = 0; i < n - arr.length; i++) out.push('<i class="fr fr-x"></i>');
    arr.forEach((r) => out.push(`<i class="fr fr-${r}" title="${R_TXT[r]}">${r}</i>`));
    const label = arr.length ? "Últimos resultados: " + arr.map((r) => R_TXT[r]).join(", ") : "Sin partidos";
    return `<span class="forma" role="img" aria-label="${label}">${out.join("")}</span>`;
  }

  function racha(r) {
    if (!r) return '<span class="dim">—</span>';
    const e = r.tipo === "V" ? "🔥" : "❄️";
    const txt = r.tipo === "V"
      ? plural(r.n, "victoria seguida", "victorias seguidas")
      : plural(r.n, "derrota seguida", "derrotas seguidas");
    const vis = r.n <= 4 ? e.repeat(r.n) : `${e}<b>×${r.n}</b>`;
    return `<span class="racha racha-${r.tipo}" title="${txt} (los empates no cortan la racha)" aria-label="${txt}">${vis}</span>`;
  }

  function movBadge(m) {
    if (m === undefined || m === 0) return "";
    if (m === "nuevo") return '<span class="mov mov-new" title="Entró a la tabla en el último partido">NEW</span>';
    if (m > 0) return `<span class="mov mov-up" title="Subió ${plural(m, "puesto")} en el último partido">▲${m}</span>`;
    return `<span class="mov mov-down" title="Bajó ${plural(-m, "puesto")} en el último partido">▼${-m}</span>`;
  }

  function titulos(id, grande) {
    const n = TITULOS[id];
    if (!n) return "";
    const meses = CAMPEONES.filter((c) => c.ids.includes(id)).map((c) => S.nombreMes(c.mes)).join(", ");
    return `<span class="tit ${grande ? "tit-l" : ""}" title="Campeón de: ${esc(meses)}">🏆${n > 1 ? "×" + n : ""}${grande ? ` <span>${plural(n, "título", "títulos")} del mes</span>` : ""}</span>`;
  }

  function vacio(emoji, titulo, texto) {
    return `<div class="empty"><span class="empty-ic" aria-hidden="true">${emoji}</span><h3>${esc(titulo)}</h3>${texto ? `<p>${texto}</p>` : ""}</div>`;
  }

  function chips(actual, base, labelTodos, hrefTodos) {
    const items = [{ k: "temporada", label: labelTodos, href: hrefTodos, n: P.length }].concat(
      MESES.slice().reverse().map((k) => ({ k, label: S.nombreMes(k), href: base + k, n: partidosDe(k).length })));
    return `<nav class="chips" aria-label="Periodo">${items.map((it) => {
      const on = it.k === actual;
      return `<a class="chip${on ? " on" : ""}" href="${it.href}"${on ? ' aria-current="page"' : ""}>${esc(it.label)}<span class="chip-n">${it.n}</span></a>`;
    }).join("")}</nav>`;
  }

  /* ================================================================
     3. VISTA: TABLA (temporada o mes)
     ================================================================ */

  function vistaTabla(scope) {
    const ps = partidosDe(scope);
    const filas = S.tabla(J, ps);
    const mov = S.movimientos(J, ps);
    const esActual = scope === "temporada" || scope === HOY_MES;
    const goles = ps.reduce((a, p) => a + Object.keys(p.res).reduce((b, k) => b + p.res[k].g, 0), 0);
    const ult = ps[ps.length - 1];
    const titulo = scope === "temporada" ? "Tabla de la temporada" : S.nombreMes(scope);
    const eyebrow = scope === "temporada"
      ? `${LIGA_C.nombre}${DB.inicio ? " · desde " + S.nombreMes(DB.inicio).toLowerCase() : ""}`
      : `${LIGA_C.nombre} · tabla del mes${scope === HOY_MES ? " (en juego)" : ""}`;

    const hero = `
      <section class="hero">
        <div class="hero-txt">
          <p class="eyebrow">${esc(eyebrow)}</p>
          <h1>${esc(titulo)}</h1>
        </div>
        ${ps.length ? `<div class="hero-act">
          <button class="btn" type="button" data-action="share" data-scope="${scope}">${icon("share")}<span>Compartir</span></button>
          <button class="btn btn-ghost" type="button" data-action="image" data-scope="${scope}">${icon("image")}<span>Imagen</span></button>
        </div>` : ""}
        <div class="kpis">
          ${kpi(ps.length, "Partidos")}
          ${kpi(goles, "Goles")}
          ${kpi(ps.length ? goles / ps.length : null, "Goles por partido", 1)}
          <div class="kpi"><span class="kpi-v kpi-txt">${ult ? esc(ult.fecha.corta) : "—"}</span><span class="kpi-l">Último partido</span></div>
        </div>
      </section>`;

    if (!ps.length) {
      return chips(scope, "#/mes/", "Temporada", "#/temporada") + hero +
        vacio("📅", scope === HOY_MES ? "Todavía no hay partidos este mes" : "No hubo partidos este mes",
          'Cuando jueguen, agrégalo en <code>js/data.js</code>.');
    }

    const rachaCol = esActual ? "Racha actual" : null;
    return chips(scope, "#/mes/", "Temporada", "#/temporada") + hero +
      podio(filas) +
      tablaHTML(filas, mov, rachaCol) +
      `<div class="grid2">${premiosHTML(filas, esActual ? RACHA_ACTUAL : null)}${evolucionHTML(ps, scope)}</div>` +
      ultimosHTML(ps, scope) +
      (scope === "temporada" ? palmaresHTML() : "");
  }

  function kpi(v, l, dec) {
    return `<div class="kpi"><span class="kpi-v" data-count="${v == null ? "" : v}" data-dec="${dec || 0}">${num(v, dec)}</span><span class="kpi-l">${l}</span></div>`;
  }

  function podio(filas) {
    const top = filas.filter((f) => f.pos != null).slice(0, 3);
    if (!top.length) return "";
    const medallas = ["🥇", "🥈", "🥉"];
    return `<section class="podium n${top.length}" aria-label="Podio">${top.map((f, i) => `
      <a class="pod pod-${i + 1}" href="${urlJugador(f.id)}" style="--c:${esc(f.jugador.color)}">
        <div class="pod-top">
          ${i === 0 ? '<span class="crown" aria-hidden="true">👑</span>' : ""}
          ${avatar(f.id, i === 0 ? 116 : 88, "pod-av")}
          <span class="medal" aria-hidden="true">${medallas[f.pos - 1] || ""}</span>
        </div>
        <div class="pod-name">${esc(f.jugador.nombre)}</div>
        <div class="pod-stat">${pill(f.rend)}<span class="pod-pts">${f.pts}/${f.ptsMax} pts</span></div>
        <div class="pod-meta">${f.v}V · ${f.e}E · ${f.d}D · ${f.goles} ⚽</div>
        <div class="pod-base" aria-hidden="true"><span>${f.pos}</span></div>
      </a>`).join("")}</section>`;
  }

  function tablaHTML(filas, mov, rachaCol) {
    const filasT = filas.map((f, i) => {
      const j = f.jugador;
      const idle = !f.pj;
      const r = RACHA_ACTUAL[f.id];
      return `<tr class="${f.pos === 1 ? "first" : ""}${idle ? " idle" : ""}" style="--i:${i}">
        <td class="c-rk"><span class="rk">${f.pos == null ? "–" : f.pos}</span>${movBadge(mov[f.id])}</td>
        <td class="c-pl"><a class="pl" href="${urlJugador(f.id)}">${avatar(f.id, 40)}<span class="pl-n">${esc(j.nombre)}</span>${f.pos === 1 ? '<span class="crown-s" title="Líder">👑</span>' : ""}${titulos(f.id)}</a>${idle ? `<span class="tag">${sinPartidos(f.id)}</span>` : ""}</td>
        <td class="c-rend">${idle ? '<span class="dim">—</span>' : `<div class="rend">${pill(f.rend)}<span class="rend-pts">${f.pts}/${f.ptsMax} pts</span></div><div class="bar"><i style="--w:${Math.round(f.rend)}%;--pc:${colorRend(f.rend)}"></i></div>`}</td>
        <td>${f.pj}</td>
        <td class="c-v">${f.v}</td>
        <td class="c-e">${f.e}</td>
        <td class="c-d">${f.d}</td>
        <td class="c-g">${f.goles}</td>
        <td class="dim">${idle ? "—" : dec2(f.gpp)}</td>
        <td>${idle ? '<span class="dim">—</span>' : forma(f.forma)}</td>
        ${rachaCol ? `<td>${idle ? '<span class="dim">—</span>' : racha(r)}</td>` : ""}
      </tr>`;
    }).join("");

    const filasM = filas.map((f, i) => {
      const idle = !f.pj;
      return `<li class="stm${f.pos === 1 ? " first" : ""}${idle ? " idle" : ""}" style="--i:${i}">
        <a class="stm-a" href="${urlJugador(f.id)}">
          <span class="stm-rk"><span class="rk">${f.pos == null ? "–" : f.pos}</span>${movBadge(mov[f.id])}</span>
          ${avatar(f.id, 46)}
          <span class="stm-main">
            <span class="stm-n">${esc(f.jugador.nombre)}${f.pos === 1 ? ' <span class="crown-s">👑</span>' : ""}${titulos(f.id)}</span>
            <span class="stm-s">${idle ? sinPartidos(f.id) : `${plural(f.pj, "PJ", "PJ")} · ${f.v}V ${f.e}E ${f.d}D · ${f.goles} ⚽`}</span>
            ${idle ? "" : `<span class="stm-f">${forma(f.forma)}${rachaCol ? racha(RACHA_ACTUAL[f.id]) : ""}</span>`}
          </span>
          <span class="stm-r">${idle ? '<span class="dim">—</span>' : `${pill(f.rend)}<small>${f.pts}/${f.ptsMax} pts</small>`}</span>
        </a>
      </li>`;
    }).join("");

    return `<section class="card">
      <header class="card-h"><h2>Clasificación</h2><span class="card-hint">V = 3 pts · E = 1 · D = 0</span></header>
      <div class="tbl-wrap tbl-desk">
        <table class="standings">
          <thead><tr>
            <th scope="col" class="c-rk">#</th>
            <th scope="col" class="c-pl">Jugador</th>
            <th scope="col" title="Porcentaje de los puntos posibles">% Rend.</th>
            <th scope="col" title="Partidos jugados">PJ</th>
            <th scope="col" title="Victorias">V</th>
            <th scope="col" title="Empates">E</th>
            <th scope="col" title="Derrotas">D</th>
            <th scope="col">Goles</th>
            <th scope="col" title="Goles por partido">G/PJ</th>
            <th scope="col" title="Últimos 5 partidos (el más reciente a la derecha)">Forma</th>
            ${rachaCol ? `<th scope="col" title="Los empates no cortan la racha">${rachaCol}</th>` : ""}
          </tr></thead>
          <tbody>${filasT}</tbody>
        </table>
      </div>
      <ol class="st-m">${filasM}</ol>
      <p class="note">Orden: % de rendimiento → puntos → victorias → goles. Quien no ha jugado queda al final.</p>
    </section>`;
  }

  const PREMIO_TXT = {
    lider: ["Mejor % de rendimiento", (v) => pct(v)],
    pichichi: ["Máximo goleador", (v) => plural(v, "gol", "goles")],
    efectivo: ["Más goles por partido", (v) => dec2(v) + " por PJ"],
    fuego: ["Racha de victorias activa", (v) => v + " seguidas"],
    invicto: ["No conoce la derrota", (v) => v + " PJ sin perder"],
    infaltable: ["El que más partidos jugó", (v) => plural(v, "partido")],
    frio: ["Racha de derrotas activa", (v) => v + " seguidas"],
  };

  function premiosHTML(filas, rachas) {
    const lista = S.premios(filas, rachas);
    if (!lista.length) return "";
    return `<section class="card awards">
      <header class="card-h"><h2>Premios</h2></header>
      <ul class="aw-list">${lista.map((p, i) => `
        <li class="aw aw-${p.id}" style="--i:${i}">
          <span class="aw-ic" aria-hidden="true">${p.icono}</span>
          <div class="aw-body"><span class="aw-t">${p.titulo}</span><span class="aw-d">${PREMIO_TXT[p.id][0]}</span></div>
          <div class="aw-who">
            <span class="aw-people">${p.ids.map((id) => `<a href="${urlJugador(id)}" class="aw-p">${avatar(id, 28)}<span>${esc(nombre(id))}</span></a>`).join("")}</span>
            <span class="aw-v">${PREMIO_TXT[p.id][1](p.valor)}</span>
          </div>
        </li>`).join("")}</ul>
    </section>`;
  }

  function evolucionHTML(ps, scope) {
    if (!ps.length) return "";
    const jug = J.filter((j) => ps.some((p) => p.res[j.id]));
    return `<section class="card chart-card" data-scope="${scope}">
      <header class="card-h"><h2>Evolución</h2>
        <div class="seg" role="group" aria-label="Qué mostrar">
          <button type="button" class="seg-b on" data-action="chart-mode" data-mode="rend" aria-pressed="true">% Rend.</button>
          <button type="button" class="seg-b" data-action="chart-mode" data-mode="pts" aria-pressed="false">Puntos</button>
        </div>
      </header>
      <div class="chart" data-mode="rend"></div>
      <ul class="legend">${jug.map((j) => `<li style="--c:${esc(j.color)}"><i></i>${esc(j.nombre)}</li>`).join("")}</ul>
    </section>`;
  }

  function ultimosHTML(ps, scope) {
    const last = ps.slice(-3).reverse();
    return `<section class="card">
      <header class="card-h"><h2>Últimos partidos</h2><a class="link" href="#/partidos${scope === "temporada" ? "" : "/" + scope}">Ver todos ${icon("right")}</a></header>
      <div class="matches">${last.map(matchCard).join("")}</div>
    </section>`;
  }

  function palmaresHTML() {
    const body = CAMPEONES.length
      ? `<ul class="palm">${CAMPEONES.slice().reverse().map((c) => `
          <li><span class="palm-m">${esc(S.nombreMes(c.mes))}</span>
            <span class="palm-w">${c.ids.map((id) => `<a href="${urlJugador(id)}">${avatar(id, 30)}<b>${esc(nombre(id))}</b></a>`).join("")}</span>
            <span class="palm-v">${pct(c.filas[0].rend)}</span></li>`).join("")}</ul>`
      : `<p class="muted">El primer campeón del mes se corona cuando termine ${esc(S.nombreMes(MESES[0] || HOY_MES).toLowerCase())}. 🏆</p>`;
    return `<section class="card"><header class="card-h"><h2>🏆 Campeones del mes</h2></header>${body}</section>`;
  }

  /* ================================================================
     4. TARJETA DE PARTIDO + VISTA PARTIDOS
     ================================================================ */

  function matchCard(p) {
    const r = S.resumenPartido(p, J);
    const g = r.grupos;
    const titulos = { V: ["Ganó", "Ganaron"], E: ["Empató", "Empataron"], D: ["Perdió", "Perdieron"] };
    const lado = (k) => {
      if (!g[k].length) return "";
      const t = titulos[k][g[k].length === 1 ? 0 : 1];
      return `<div class="side side-${k}"><h4><i class="fr fr-${k}">${k}</i>${t}</h4><ul>${g[k].map((x) => `
        <li><a href="${urlJugador(x.id)}">${avatar(x.id, 30)}<span>${esc(nombre(x.id))}</span></a>
          ${r.figuras.includes(x.id) ? '<span class="star" title="Figura del partido">⭐</span>' : ""}
          <span class="gl${x.g ? "" : " gl-0"}" title="${plural(x.g, "gol", "goles")}">${x.g} ⚽</span></li>`).join("")}</ul></div>`;
    };
    return `<article class="match">
      <header class="match-h"><span class="match-n">Partido ${p.num}</span><time datetime="${p.fecha.iso}">${esc(p.fecha.larga)}</time></header>
      ${p.nota ? `<p class="match-note">📝 ${esc(p.nota)}</p>` : ""}
      <div class="match-b">${lado("V")}${lado("E")}${lado("D")}</div>
      <footer class="match-f"><span>${plural(r.goles, "gol", "goles")} del grupo</span>${r.figuras.length ? `<span>⭐ Figura: ${r.figuras.map((id) => esc(nombre(id))).join(" y ")}</span>` : ""}</footer>
    </article>`;
  }

  function vistaPartidos(scope) {
    const ps = partidosDe(scope).slice().reverse();
    const goles = ps.reduce((a, p) => a + Object.keys(p.res).reduce((b, k) => b + p.res[k].g, 0), 0);
    return chips(scope, "#/partidos/", "Todos", "#/partidos") + `
      <section class="page-h">
        <p class="eyebrow">${esc(LIGA_C.nombre)}</p>
        <h1>Partidos${scope !== "temporada" ? ` <span class="h-sub">· ${esc(S.nombreMes(scope))}</span>` : ""}</h1>
        <p class="sub">${plural(ps.length, "partido")} · ${plural(goles, "gol", "goles")}</p>
      </section>` +
      (ps.length
        ? `<div class="matches matches-grid">${ps.map(matchCard).join("")}</div>`
        : vacio("📭", "No hay partidos en este periodo", "Se agregan en <code>js/data.js</code>."));
  }

  /* ================================================================
     5. VISTA: PLANTEL Y PERFIL
     ================================================================ */

  function vistaPlantel() {
    return `<section class="page-h">
        <p class="eyebrow">${esc(LIGA_C.nombre)} · temporada</p>
        <h1>Plantel</h1>
        <p class="sub">${plural(J.length, "jugador", "jugadores")} · toca uno para ver su ficha</p>
      </section>
      <div class="squad">${GLOBAL.map((f, i) => `
        <a class="pc" href="${urlJugador(f.id)}" style="--c:${esc(f.jugador.color)};--i:${i}">
          <div class="pc-top">${avatar(f.id, 96)}<span class="pc-rk">${f.pos ? "#" + f.pos : "Nuevo"}</span></div>
          <h3>${esc(f.jugador.nombre)}${f.pos === 1 ? " 👑" : ""} ${titulos(f.id)}</h3>
          <div class="pc-stats">
            <div><b>${pct(f.rend)}</b><span>Rend.</span></div>
            <div><b>${f.pj}</b><span>PJ</span></div>
            <div><b>${f.goles}</b><span>Goles</span></div>
          </div>
          ${f.pj ? forma(f.forma) : '<span class="tag">Por debutar</span>'}
        </a>`).join("")}</div>`;
  }

  function vistaJugador(id) {
    const j = porId[id];
    if (!j) return noEncontrado();
    const f = GLOBAL_ID[id];
    const ranked = GLOBAL.filter((x) => x.pos != null).length;
    const idx = J.indexOf(j);
    const prev = J[(idx - 1 + J.length) % J.length];
    const next = J[(idx + 1) % J.length];
    const tile = (v, l, extra) => `<div class="tile"><span class="tile-v">${v}</span><span class="tile-l">${l}</span>${extra ? `<span class="tile-x">${extra}</span>` : ""}</div>`;

    const cabecera = `
      <a class="back" href="#/jugadores">${icon("left")} Plantel</a>
      <section class="profile" style="--c:${esc(j.color)}">
        <div class="pf-av">${avatar(id, 132)}</div>
        <div class="pf-info">
          <p class="eyebrow">${f.pos ? `#${f.pos} de ${ranked} en la temporada` : "Todavía no debuta"}</p>
          <h1>${esc(j.nombre)}${f.pos === 1 ? ' <span class="h-crown" title="Líder">👑</span>' : ""}</h1>
          <div class="pf-badges">${titulos(id, true)}${f.racha ? racha(f.racha) : ""}</div>
          ${f.pj ? `<div class="pf-forma"><span class="muted">Forma</span>${forma(f.hist.slice(-10).map((h) => h.r), Math.min(10, Math.max(5, f.pj)))}</div>` : ""}
        </div>
        <div class="pf-gauge">${gauge(f.rend)}</div>
      </section>`;

    if (!f.pj) {
      return cabecera + vacio("🥾", `${j.nombre} todavía no juega esta temporada`, "Apenas juegue su primer partido aparecen acá sus estadísticas.") + navJugadores(prev, next);
    }

    const otros = J.filter((o) => o.id !== id);
    return cabecera + `
      <section class="tiles">
        ${tile(f.pj, "Partidos")}
        ${tile(`${f.v}<small>-</small>${f.e}<small>-</small>${f.d}`, "V - E - D")}
        ${tile(`${f.pts}<small>/${f.ptsMax}</small>`, "Puntos")}
        ${tile(pct(f.win), "Victorias")}
        ${tile(f.goles, "Goles")}
        ${tile(dec2(f.gpp), "Goles por partido")}
        ${tile(f.mejorV ? "🔥 " + f.mejorV : "—", "Mejor racha")}
        ${tile(f.peorD ? "❄️ " + f.peorD : "—", "Peor racha")}
        ${tile(`${f.conGol}<small>/${f.pj}</small>`, "Partidos con gol")}
        ${tile(f.maxGol, "Máx. goles en un partido")}
        ${tile(f.hat, "Hat-tricks", "3 o más goles")}
      </section>
      <div class="grid2">
        <section class="card"><header class="card-h"><h2>Goles por partido</h2></header>${barrasGoles(f.hist)}</section>
        <section class="card"><header class="card-h"><h2>Química y duelos</h2></header>${duelosHTML(id, otros)}</section>
      </div>
      ${porMesHTML(id)}
      <section class="card"><header class="card-h"><h2>Sus partidos</h2></header>
        <ul class="hist">${f.hist.slice().reverse().map((h) => `
          <li><i class="fr fr-${h.r}" title="${R_TXT[h.r]}">${h.r}</i>
            <span class="hist-f">Partido ${h.p.num} · ${esc(h.p.fecha.larga)}</span>
            <span class="gl${h.g ? "" : " gl-0"}">${h.g} ⚽</span></li>`).join("")}</ul>
      </section>` + navJugadores(prev, next);
  }

  function navJugadores(prev, next) {
    if (J.length < 2) return "";
    return `<nav class="pf-nav" aria-label="Otros jugadores">
      <a href="${urlJugador(prev.id)}">${icon("left")}${avatar(prev.id, 28)}<span>${esc(prev.nombre)}</span></a>
      <a href="${urlJugador(next.id)}"><span>${esc(next.nombre)}</span>${avatar(next.id, 28)}${icon("right")}</a>
    </nav>`;
  }

  function gauge(rend) {
    const r = 52, c = 2 * Math.PI * r, v = rend == null ? 0 : rend;
    return `<svg class="gauge" viewBox="0 0 120 120" role="img" aria-label="Rendimiento ${pct(rend)}">
      <circle cx="60" cy="60" r="${r}" class="g-track"/>
      <circle cx="60" cy="60" r="${r}" class="g-val" style="--pc:${colorRend(rend)};--len:${c.toFixed(2)};--off:${(c * (1 - v / 100)).toFixed(2)}" transform="rotate(-90 60 60)"/>
      <text x="60" y="62" class="g-num">${pct(rend)}</text>
      <text x="60" y="82" class="g-lbl">RENDIMIENTO</text>
    </svg>`;
  }

  function barrasGoles(hist) {
    const max = Math.max(1, ...hist.map((h) => h.g));
    return `<div class="bars-wrap"><div class="bars" role="img" aria-label="Goles en cada partido">${hist.map((h, i) => `
      <div class="bc" style="--i:${i}" title="Partido ${h.p.num} (${esc(h.p.fecha.corta)}): ${R_TXT[h.r]}, ${plural(h.g, "gol", "goles")}">
        <div class="bc-t" style="--h:${Math.max(3, (h.g / max) * 84)}%"><span class="bc-v">${h.g}</span><i class="bc-b b-${h.r}"></i></div>
        <span class="bc-x">P${h.p.num}</span>
      </div>`).join("")}</div></div>
      <p class="note"><i class="dot b-V"></i>Victoria <i class="dot b-E"></i>Empate <i class="dot b-D"></i>Derrota</p>`;
  }

  function duelosHTML(id, otros) {
    const filas = otros.map((o) => {
      const d = S.duelo(id, o.id, P);
      if (!d.comunes) {
        return `<li class="du"><a href="${urlJugador(o.id)}">${avatar(o.id, 36)}</a><div class="du-b"><span class="du-n">${esc(o.nombre)}</span><span class="du-s muted">Todavía no coinciden en un partido</span></div></li>`;
      }
      const juntos = d.juntos ? `${d.juntosV}G ${d.juntosD}P <em>(${pct((d.juntosV / d.juntos) * 100)})</em>` : "—";
      const contra = d.contraG + d.contraP ? `${d.contraG} – ${d.contraP}` : "—";
      return `<li class="du"><a href="${urlJugador(o.id)}">${avatar(o.id, 36)}</a><div class="du-b">
        <span class="du-n">${esc(o.nombre)} <span class="muted">· ${plural(d.comunes, "partido")} en común</span></span>
        <span class="du-s"><span title="Ambos ganaron o ambos perdieron">🤝 Juntos: ${juntos}</span><span title="Uno ganó y el otro perdió (ganados – perdidos)">⚔️ En contra: ${contra}</span>${d.empates ? `<span>🤷 Empates: ${d.empates}</span>` : ""}</span>
      </div></li>`;
    }).join("");
    return `<ul class="duels">${filas}</ul><p class="note">Se asume que jugaron juntos cuando ambos ganaron o ambos perdieron, y en contra cuando uno ganó y el otro perdió.</p>`;
  }

  function porMesHTML(id) {
    const meses = MESES.filter((k) => partidosDe(k).some((p) => p.res[id]));
    if (meses.length < 1) return "";
    const filas = meses.slice().reverse().map((k) => {
      const t = S.tabla(J, partidosDe(k));
      const f = t.find((x) => x.id === id);
      const campeon = CAMPEONES.some((c) => c.mes === k && c.ids.includes(id));
      return `<tr><th scope="row"><a href="#/mes/${k}">${esc(S.nombreMes(k))}</a></th><td>${f.pos}°${campeon ? " 🏆" : ""}</td><td>${pill(f.rend)}</td><td>${f.pj}</td><td>${f.v}-${f.e}-${f.d}</td><td>${f.goles}</td></tr>`;
    }).join("");
    return `<section class="card"><header class="card-h"><h2>Mes a mes</h2></header>
      <div class="tbl-wrap"><table class="mini"><thead><tr><th scope="col" class="l">Mes</th><th scope="col">Puesto</th><th scope="col">% Rend.</th><th scope="col">PJ</th><th scope="col">V-E-D</th><th scope="col">Goles</th></tr></thead><tbody>${filas}</tbody></table></div>
    </section>`;
  }

  function noEncontrado() {
    return vacio("🤔", "Esta página no existe", '<a href="#/">Volver a la tabla</a>');
  }

  /* ================================================================
     6. GRÁFICO DE EVOLUCIÓN (SVG hecho a mano, sin librerías)
     ================================================================ */

  function pasoBonito(max) {
    const pasos = [1, 2, 3, 5, 6, 10, 12, 15, 20, 25, 30, 50, 60, 100, 150, 200, 300, 500];
    return pasos.find((p) => max / p <= 5) || Math.ceil(max / 5);
  }

  function dibujarGrafico(card) {
    const cont = $(".chart", card);
    if (!cont) return;
    const scope = card.getAttribute("data-scope");
    const modo = cont.getAttribute("data-mode") || "rend";
    const ps = partidosDe(scope);
    const n = ps.length;
    const series = S.evolucion(J, ps).filter((s) => s.pts.some((v) => v != null));
    const W = Math.max(280, Math.round(cont.clientWidth || 640));
    const H = W < 420 ? 220 : 270, L = 42, R = 14, T = 14, B = 30;
    const iw = W - L - R, ih = H - T - B;
    const vals = (s) => (modo === "pts" ? s.pts : s.rend);
    let yMax = 100, paso = 25;
    if (modo === "pts") {
      const m = Math.max(3, ...series.map((s) => Math.max(...s.pts.filter((v) => v != null))));
      paso = pasoBonito(m);
      yMax = Math.ceil(m / paso) * paso;
    }
    const x = (i) => (n === 1 ? L + iw / 2 : L + (i * iw) / (n - 1));
    const y = (v) => T + ih - (v / yMax) * ih;

    let svg = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="chart-svg" role="img" aria-label="Evolución de ${modo === "pts" ? "puntos acumulados" : "% de rendimiento"} partido a partido">`;
    for (let v = 0; v <= yMax + 0.001; v += paso) {
      svg += `<line class="gl-y" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text class="ax" x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${v}${modo === "rend" ? "%" : ""}</text>`;
    }
    const cada = Math.max(1, Math.ceil(n / 12));
    ps.forEach((p, i) => {
      if (i % cada === 0 || i === n - 1) svg += `<text class="ax" x="${x(i)}" y="${H - 10}" text-anchor="middle">P${p.num}</text>`;
    });
    svg += `<line class="cross" x1="0" x2="0" y1="${T}" y2="${T + ih}" style="opacity:0"/>`;
    // Pequeño desplazamiento vertical para que las líneas iguales no se tapen
    const k = series.length;
    series.forEach((s, si) => {
      const off = (si - (k - 1) / 2) * 3;
      const v = vals(s);
      let d = "", pen = false;
      v.forEach((val, i) => {
        if (val == null) { pen = false; return; }
        d += `${pen ? "L" : "M"}${x(i).toFixed(1)},${(y(val) + off).toFixed(1)}`;
        pen = true;
      });
      svg += `<path class="ln" d="${d}" pathLength="1" style="--c:${esc(s.color)};--i:${si}"/>`;
      v.forEach((val, i) => {
        if (val == null) return;
        const ultimo = i === v.length - 1;
        svg += `<circle class="pt${ultimo ? " pt-last" : ""}" cx="${x(i).toFixed(1)}" cy="${(y(val) + off).toFixed(1)}" r="${ultimo ? 5 : 3.5}" style="--c:${esc(s.color)}"/>`;
      });
    });
    svg += `<rect class="hit" x="${L - 10}" y="0" width="${iw + 20}" height="${H}" fill="transparent"/></svg>`;
    cont.innerHTML = svg + '<div class="tip" hidden></div>';

    const el = $("svg", cont), tip = $(".tip", cont), cross = $(".cross", cont);
    const mostrar = (clientX) => {
      const rect = el.getBoundingClientRect();
      const px = ((clientX - rect.left) / rect.width) * W;
      const i = n === 1 ? 0 : Math.max(0, Math.min(n - 1, Math.round(((px - L) / iw) * (n - 1))));
      const p = ps[i];
      cross.setAttribute("x1", x(i)); cross.setAttribute("x2", x(i)); cross.style.opacity = 1;
      const filas = series.map((s) => ({ s, v: vals(s)[i], r: p.res[s.id] }))
        .filter((o) => o.v != null)
        .sort((a, b) => b.v - a.v);
      tip.innerHTML = `<b>Partido ${p.num}</b> <span class="muted">${esc(p.fecha.corta)}</span>` + filas.map((o) =>
        `<div class="tip-r" style="--c:${esc(o.s.color)}"><i></i>${esc(nombre(o.s.id))}<span>${modo === "pts" ? o.v + " pts" : pct(o.v)}</span>${o.r ? `<em class="fr fr-${o.r.r}">${o.r.r}</em>` : '<em class="fr fr-x">·</em>'}</div>`).join("");
      tip.hidden = false;
      const left = (x(i) / W) * rect.width;
      tip.style.left = Math.max(8, Math.min(rect.width - tip.offsetWidth - 8, left - tip.offsetWidth / 2)) + "px";
    };
    const ocultar = () => { tip.hidden = true; cross.style.opacity = 0; };
    el.addEventListener("pointermove", (e) => mostrar(e.clientX));
    el.addEventListener("pointerdown", (e) => mostrar(e.clientX));
    el.addEventListener("pointerleave", ocultar);
  }

  /* ================================================================
     7. COMPARTIR (texto para WhatsApp e imagen)
     ================================================================ */

  function urlDe(scope) {
    const base = location.href.split("#")[0];
    return base + (scope === "temporada" ? "#/temporada" : "#/mes/" + scope);
  }

  function textoCompartir(scope) {
    const ps = partidosDe(scope);
    const filas = S.tabla(J, ps);
    const medallas = ["🥇", "🥈", "🥉"];
    const titulo = scope === "temporada" ? `Temporada${DB.inicio ? ` (desde ${S.nombreMes(DB.inicio).toLowerCase()})` : ""}` : S.nombreMes(scope);
    const lineas = [`⚽ *${LIGA_C.nombre}* · ${titulo}`, `${plural(ps.length, "partido")} jugados`, ""];
    filas.forEach((f) => {
      if (!f.pj) { lineas.push(`▫️ ${f.jugador.nombre}: ${sinPartidos(f.id).toLowerCase()}`); return; }
      const m = f.pos <= 3 ? medallas[f.pos - 1] : `${f.pos}.`;
      lineas.push(`${m} *${f.jugador.nombre}*: ${pct(f.rend)} (${f.pts}/${f.ptsMax} pts) · ${f.v}V ${f.e}E ${f.d}D · ${plural(f.goles, "gol", "goles")}`);
    });
    const pr = S.premios(filas, scope === "temporada" || scope === HOY_MES ? RACHA_ACTUAL : null);
    const pich = pr.find((p) => p.id === "pichichi");
    const fuego = pr.find((p) => p.id === "fuego");
    const frio = pr.find((p) => p.id === "frio");
    if (pich || fuego || frio) lineas.push("");
    if (pich) lineas.push(`👟 Pichichi: ${pich.ids.map(nombre).join(" y ")} (${pich.valor})`);
    if (fuego) lineas.push(`🔥 En llamas: ${fuego.ids.map(nombre).join(" y ")} (${fuego.valor} seguidas)`);
    if (frio) lineas.push(`🧊 Pecho frío: ${frio.ids.map(nombre).join(" y ")} (${frio.valor} seguidas)`);
    lineas.push("", urlDe(scope));
    return lineas.join("\n");
  }

  async function copiar(texto) {
    try {
      if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(texto); return true; }
    } catch (e) { /* seguimos con el plan B */ }
    const ta = document.createElement("textarea");
    ta.value = texto;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;top:-1000px;opacity:0";
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    ta.remove();
    return ok;
  }

  async function compartirTexto(scope) {
    const texto = textoCompartir(scope);
    if (navigator.share && matchMedia("(pointer: coarse)").matches) {
      try { await navigator.share({ text: texto }); return; } catch (e) { if (e && e.name === "AbortError") return; }
    }
    toast((await copiar(texto)) ? "Tabla copiada ✅ Pégala en WhatsApp" : "No se pudo copiar 😕");
  }

  function cargarImagen(src) {
    return new Promise((res) => {
      if (!src) return res(null);
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = () => res(null);
      im.src = src;
    });
  }

  function rrect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  async function generarImagen(scope, conFotos) {
    const ps = partidosDe(scope);
    const filas = S.tabla(J, ps);
    const goles = ps.reduce((a, p) => a + Object.keys(p.res).reduce((b, k) => b + p.res[k].g, 0), 0);
    const W = 1080, rowH = 150, top = 330;
    const H = Math.max(1080, top + filas.length * rowH + 150);
    const cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const c = cv.getContext("2d");
    try {
      await Promise.all(["700 120px Teko", "600 56px Teko", "700 44px Barlow", "500 28px Barlow"].map((f) => document.fonts.load(f)));
    } catch (e) { /* si no cargan, usamos las del sistema */ }
    const fotos = {};
    if (conFotos) {
      await Promise.all(filas.map(async (f) => { fotos[f.id] = await cargarImagen(f.jugador.foto); }));
    }

    // fondo
    let g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#0c1d15"); g.addColorStop(1, "#050807");
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    g = c.createRadialGradient(W / 2, 140, 10, W / 2, 140, 720);
    g.addColorStop(0, "rgba(0,230,118,0.20)"); g.addColorStop(1, "rgba(0,230,118,0)");
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.strokeStyle = "rgba(0,230,118,0.07)"; c.lineWidth = 3;
    c.beginPath(); c.arc(W / 2, H / 2, 190, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.moveTo(0, H / 2); c.lineTo(W, H / 2); c.stroke();

    // título
    c.textAlign = "center"; c.textBaseline = "alphabetic";
    c.shadowColor = "rgba(0,230,118,0.55)"; c.shadowBlur = 34;
    c.fillStyle = "#eafff3"; c.font = "700 132px Teko, Impact, sans-serif";
    c.fillText(LIGA_C.nombre.toUpperCase(), W / 2, 158);
    c.shadowBlur = 0;
    c.fillStyle = "#00e676"; c.font = "600 56px Teko, Impact, sans-serif";
    c.fillText((scope === "temporada" ? "Tabla de la temporada" : S.nombreMes(scope)).toUpperCase(), W / 2, 226);
    c.fillStyle = "#93a89c"; c.font = "500 28px Barlow, Arial, sans-serif";
    c.fillText(`${plural(ps.length, "partido")} · ${plural(goles, "gol", "goles")}`, W / 2, 272);

    const colPos = ["#ffd54f", "#cfd8dc", "#e0a26b"];
    filas.forEach((f, i) => {
      const y = top + i * rowH, h = rowH - 22, cy = y + h / 2;
      rrect(c, 56, y, W - 112, h, 26);
      c.fillStyle = f.pos === 1 ? "rgba(255,213,79,0.09)" : "rgba(255,255,255,0.045)"; c.fill();
      c.lineWidth = 2; c.strokeStyle = f.pos === 1 ? "rgba(255,213,79,0.55)" : "rgba(255,255,255,0.08)"; c.stroke();

      c.textAlign = "center";
      c.fillStyle = f.pos ? (colPos[f.pos - 1] || "#e8efe9") : "#5d6b64";
      c.font = "700 76px Teko, Impact, sans-serif";
      c.fillText(f.pos ? String(f.pos) : "–", 122, cy + 26);

      const ax = 236, r = 46;
      c.save();
      c.beginPath(); c.arc(ax, cy, r + 5, 0, Math.PI * 2); c.fillStyle = f.jugador.color; c.fill();
      c.beginPath(); c.arc(ax, cy, r, 0, Math.PI * 2); c.clip();
      const im = fotos[f.id];
      if (im) c.drawImage(im, ax - r, cy - r, r * 2, r * 2);
      else {
        c.fillStyle = "#16201c"; c.fillRect(ax - r, cy - r, r * 2, r * 2);
        c.fillStyle = f.jugador.color; c.font = "700 40px Barlow, Arial, sans-serif"; c.textAlign = "center";
        c.fillText(iniciales(f.jugador.nombre), ax, cy + 14);
      }
      c.restore();

      c.textAlign = "left";
      c.fillStyle = "#f2f7f4"; c.font = "700 46px Barlow, Arial, sans-serif";
      c.fillText(f.jugador.nombre + (f.pos === 1 ? "  👑" : ""), 310, cy - 2);
      c.fillStyle = "#93a89c"; c.font = "500 28px Barlow, Arial, sans-serif";
      c.fillText(f.pj ? `${f.pj} PJ · ${f.v}V ${f.e}E ${f.d}D · ${plural(f.goles, "gol", "goles")}` : sinPartidos(f.id), 310, cy + 38);

      if (f.pj) {
        const pw = 172, ph = 66, px = W - 96 - pw, py = cy - ph / 2 - 12;
        rrect(c, px, py, pw, ph, 16); c.fillStyle = colorRend(f.rend); c.fill();
        c.fillStyle = "#06110b"; c.textAlign = "center"; c.font = "700 60px Teko, Impact, sans-serif";
        c.fillText(pct(f.rend), px + pw / 2, py + 52);
        c.fillStyle = "#93a89c"; c.font = "500 24px Barlow, Arial, sans-serif";
        c.fillText(`${f.pts}/${f.ptsMax} pts`, px + pw / 2, py + ph + 30);
      }
    });

    c.textAlign = "center"; c.fillStyle = "#5d6b64"; c.font = "500 26px Barlow, Arial, sans-serif";
    const url = location.host ? location.host + location.pathname.replace(/index\.html$/, "") : LIGA_C.nombre;
    c.fillText(`${url}  ·  ${hoy.toLocaleDateString("es-CL")}`, W / 2, H - 56);
    return cv;
  }

  const aBlob = (cv) => new Promise((res, rej) => {
    try { cv.toBlob((b) => (b ? res(b) : rej(new Error("vacío"))), "image/png"); } catch (e) { rej(e); }
  });

  async function compartirImagen(scope, btn) {
    if (btn) btn.disabled = true;
    toast("Generando imagen…");
    try {
      let blob = await aBlob(await generarImagen(scope, true)).catch(() => null);
      // Abriendo el archivo local (file://) el navegador bloquea las fotos: la hacemos sin fotos.
      if (!blob) blob = await aBlob(await generarImagen(scope, false)).catch(() => null);
      if (!blob) { toast("No se pudo generar la imagen 😕"); return; }
      const nombreArchivo = `los-400-fc-${scope}.png`;
      const file = typeof File === "function" ? new File([blob], nombreArchivo, { type: "image/png" }) : null;
      if (file && navigator.canShare && navigator.canShare({ files: [file] }) && matchMedia("(pointer: coarse)").matches) {
        try { await navigator.share({ files: [file], title: LIGA_C.nombre }); toast(""); return; }
        catch (e) { if (e && e.name === "AbortError") { toast(""); return; } }
      }
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = nombreArchivo;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
      toast("Imagen descargada ✅");
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    clearTimeout(toastTimer);
    if (!msg) { t.classList.remove("show"); return; }
    t.textContent = msg;
    t.classList.add("show");
    toastTimer = setTimeout(() => t.classList.remove("show"), 2800);
  }

  /* ================================================================
     8. NAVEGACIÓN, EVENTOS Y ARRANQUE
     ================================================================ */

  function scopePorDefecto() {
    return P.some((p) => p.fecha.mes === HOY_MES) ? HOY_MES : "temporada";
  }

  let primeraVez = true;
  function router() {
    const h = location.hash || "#/";
    let m, html, tab = "tabla", titulo = "Tabla";
    if (h === "#/" || h === "#" || h === "#app") { html = vistaTabla(scopePorDefecto()); }
    else if (/^#\/temporada\/?$/.test(h)) { html = vistaTabla("temporada"); titulo = "Temporada"; }
    else if ((m = /^#\/mes\/(\d{4}-\d{2})\/?$/.exec(h))) { html = vistaTabla(m[1]); titulo = S.nombreMes(m[1]); }
    else if ((m = /^#\/partidos(?:\/(\d{4}-\d{2}))?\/?$/.exec(h))) { tab = "partidos"; titulo = "Partidos"; html = vistaPartidos(m[1] || "temporada"); }
    else if (/^#\/jugadores\/?$/.test(h)) { tab = "plantel"; titulo = "Plantel"; html = vistaPlantel(); }
    else if ((m = /^#\/jugador\/([^/]+)\/?$/.exec(h))) {
      let id = m[1];
      try { id = decodeURIComponent(id); } catch (e) { /* lo dejamos como viene */ }
      tab = "plantel"; titulo = nombre(id); html = vistaJugador(id);
    }
    else { html = noEncontrado(); titulo = "No encontrado"; }

    app.innerHTML = html;
    document.title = `${titulo} · ${LIGA_C.nombre}`;
    $$(".tabs [data-tab]").forEach((a) => {
      const on = a.getAttribute("data-tab") === tab;
      a.classList.toggle("on", on);
      if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    if (!primeraVez) {
      window.scrollTo(0, 0);
      app.focus({ preventScroll: true });
    }
    primeraVez = false;
    despuesDeDibujar();
  }

  function despuesDeDibujar() {
    $$(".chart-card").forEach(dibujarGrafico);
    // números que suben
    $$("[data-count]").forEach((el) => {
      const fin = parseFloat(el.getAttribute("data-count"));
      const dec = +el.getAttribute("data-dec") || 0;
      if (!isFinite(fin) || reduceMotion || fin === 0) return;
      const t0 = performance.now(), dur = 900;
      const paso = (t) => {
        const k = Math.min(1, (t - t0) / dur);
        const e = 1 - Math.pow(1 - k, 3);
        el.textContent = num(fin * e, dec);
        if (k < 1) requestAnimationFrame(paso);
      };
      requestAnimationFrame(paso);
    });
    // chips: deja visible el que está activo
    const chipOn = $(".chip.on");
    if (chipOn && chipOn.scrollIntoView) {
      const nav = chipOn.parentElement;
      nav.scrollLeft = chipOn.offsetLeft - nav.clientWidth / 2 + chipOn.clientWidth / 2;
    }
  }

  document.addEventListener("click", (e) => {
    if (e.target.closest(".skip")) { e.preventDefault(); app.focus(); return; }
    const el = e.target.closest("[data-action]");
    if (!el) return;
    const a = el.getAttribute("data-action");
    if (a === "share") compartirTexto(el.getAttribute("data-scope"));
    else if (a === "image") compartirImagen(el.getAttribute("data-scope"), el);
    else if (a === "chart-mode") {
      const card = el.closest(".chart-card");
      $(".chart", card).setAttribute("data-mode", el.getAttribute("data-mode"));
      $$(".seg-b", card).forEach((b) => { const on = b === el; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
      dibujarGrafico(card);
    } else if (a === "close-avisos") {
      $("#avisos").innerHTML = "";
    }
  });

  // Si una foto no carga, mostramos las iniciales
  document.addEventListener("error", (e) => {
    const im = e.target;
    if (!im || im.tagName !== "IMG" || !im.classList.contains("av")) return;
    const span = document.createElement("span");
    span.className = im.className + " av-ini";
    span.setAttribute("style", im.getAttribute("style") || "");
    span.setAttribute("aria-hidden", "true");
    span.textContent = im.getAttribute("data-ini") || "?";
    im.replaceWith(span);
  }, true);

  function mostrarAvisos() {
    if (!DB.avisos.length) return;
    $("#avisos").innerHTML = `<div class="alert" role="alert">
      <div><b>⚠️ Revisa js/data.js</b> (${plural(DB.avisos.length, "detalle")}; lo demás se muestra igual):
      <ul>${DB.avisos.slice(0, 8).map((a) => `<li>${esc(a)}</li>`).join("")}${DB.avisos.length > 8 ? `<li>…y ${DB.avisos.length - 8} más</li>` : ""}</ul></div>
      <button type="button" class="alert-x" data-action="close-avisos" aria-label="Cerrar aviso">${icon("x")}</button>
    </div>`;
  }

  // Publicada en usuario.github.io/repo/ deducimos el repo de la dirección; si no, usamos LIGA.repo
  function repoGitHub() {
    const m = /^([a-z0-9-]+)\.github\.io$/i.exec(location.hostname);
    if (m) {
      const partes = location.pathname.split("/").filter(Boolean);
      if (partes.length && /\.html?$/i.test(partes[partes.length - 1])) partes.pop();
      if (partes.length) return { repo: `${m[1]}/${partes[0]}`, carpeta: partes.slice(1).map((x) => x + "/").join("") };
    }
    return LIGA_C.repo ? { repo: LIGA_C.repo, carpeta: "" } : null;
  }


  function pie() {
    const ult = P[P.length - 1];
    const gh = repoGitHub();
    const repo = gh ? `<a href="https://github.com/${esc(gh.repo)}" target="_blank" rel="noopener">${icon("github")} GitHub</a>` : "";
    $("#footer").innerHTML = `<span>⚽ ${esc(LIGA_C.nombre)}</span>
      <span>${ult ? `Último partido: ${esc(ult.fecha.larga)}` : "Sin partidos todavía"}</span>${repo}`;
  }

  function fatal() {
    const errores = (window.__erroresDatos || []).map((m) => `<li><code>${esc(m)}</code></li>`).join("");
    document.getElementById("app").innerHTML = `<div class="empty fatal">
      <span class="empty-ic" aria-hidden="true">🛠️</span>
      <h3>No pude leer los datos</h3>
      <p>Seguramente hay un error de tipeo en <code>js/data.js</code>: una coma, una comilla o un corchete que falta.
      Revisa el último cambio que hiciste.</p>
      ${errores ? `<ul class="fatal-err">${errores}</ul>` : ""}
    </div>`;
  }

  let resizeTimer, anchoPrevio = window.innerWidth;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (window.innerWidth === anchoPrevio) return;
      anchoPrevio = window.innerWidth;
      $$(".chart-card").forEach(dibujarGrafico);
    }, 150);
  });

  // Si la página quedó abierta (ej. desde la pantalla de inicio) y cambió el día, recargamos para tener fecha y datos al día
  const diaCarga = hoy.toDateString();
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && new Date().toDateString() !== diaCarga) location.reload();
  });

  window.addEventListener("hashchange", router);
  mostrarAvisos();
  pie();
  router();
})();
