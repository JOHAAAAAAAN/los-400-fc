/* =====================================================================
   LOS 400 FC · Motor de estadísticas
   Funciones puras (no tocan la página), así se pueden probar aparte.
   No necesitas editar este archivo para cargar partidos.
   ===================================================================== */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Stats400 = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio",
    "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
  const DIAS_LARGOS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  const PUNTOS = { V: 3, E: 1, D: 0 };
  const PALETA = ["#60a5fa", "#fbbf24", "#c084fc", "#fb7185", "#34d399", "#f97316", "#a3e635", "#22d3ee"];

  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const claveMes = (y, m) => `${y}-${String(m).padStart(2, "0")}`;

  /* ---------- fechas ---------- */

  function parseMes(key) {
    const m = /^(\d{4})-(\d{1,2})$/.exec(String(key == null ? "" : key).trim());
    if (!m) return null;
    const y = +m[1], mo = +m[2];
    if (mo < 1 || mo > 12) return null;
    return { y, m: mo, key: claveMes(y, mo) };
  }

  function nombreMes(key, corto) {
    const p = parseMes(key);
    if (!p) return String(key);
    return corto ? `${MESES_CORTOS[p.m - 1]} ${p.y}` : `${cap(MESES[p.m - 1])} ${p.y}`;
  }

  /* "2026-10-26" o "2026-10" → objeto con todo lo necesario para ordenar y mostrar */
  function parseFecha(str) {
    const s = String(str == null ? "" : str).trim();
    const m = /^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?$/.exec(s);
    if (!m) return null;
    const y = +m[1], mo = +m[2], d = m[3] ? +m[3] : null;
    if (mo < 1 || mo > 12) return null;
    const mes = claveMes(y, mo);
    if (d === null) {
      return {
        y, m: mo, d: null, mes, orden: y * 10000 + mo * 100, iso: mes,
        corta: `${MESES_CORTOS[mo - 1]} ${y}`, larga: `${cap(MESES[mo - 1])} ${y}`,
      };
    }
    const dt = new Date(Date.UTC(y, mo - 1, d));
    if (d < 1 || dt.getUTCMonth() !== mo - 1) return null; // ej: 2026-02-30
    const wd = dt.getUTCDay();
    return {
      y, m: mo, d, mes, orden: y * 10000 + mo * 100 + d,
      iso: `${mes}-${String(d).padStart(2, "0")}`,
      corta: `${DIAS[wd]} ${d} ${MESES_CORTOS[mo - 1]}`,
      larga: `${cap(DIAS_LARGOS[wd])} ${d} de ${MESES[mo - 1]} ${y}`,
    };
  }

  /* ---------- lectura de data.js ---------- */

  /* Acepta ["V", 2]  (formato oficial), y por las dudas "V2" o { r: "V", g: 2 } */
  function parseEntrada(v) {
    let r, g;
    if (Array.isArray(v)) { r = v[0]; g = v[1]; }
    else if (typeof v === "string") {
      const m = /^\s*([VEDved])\s*(\d+)?\s*$/.exec(v);
      if (!m) return null;
      r = m[1]; g = m[2];
    } else if (v && typeof v === "object") {
      r = v.r != null ? v.r : v.resultado;
      g = v.g != null ? v.g : v.goles;
    } else return null;
    r = String(r == null ? "" : r).trim().toUpperCase();
    if (!Object.prototype.hasOwnProperty.call(PUNTOS, r)) return null;
    if (g === undefined || g === null || g === "") g = 0;
    g = Number(g);
    if (!Number.isInteger(g) || g < 0 || g > 99) return null;
    return { r, g };
  }

  /* Valida y ordena todo. Nunca se cae: lo que no entiende lo deja en "avisos". */
  function normalizar(liga, jugadores, partidos) {
    const avisos = [];
    const lista = [];
    const ids = new Set();

    (Array.isArray(jugadores) ? jugadores : []).forEach((j, i) => {
      if (!j || typeof j.id !== "string" || !j.id.trim()) {
        avisos.push(`El jugador #${i + 1} de JUGADORES no tiene "id".`);
        return;
      }
      if (ids.has(j.id)) { avisos.push(`"${j.id}" está repetido en JUGADORES.`); return; }
      ids.add(j.id);
      lista.push({
        id: j.id,
        nombre: typeof j.nombre === "string" && j.nombre.trim() ? j.nombre : j.id,
        foto: typeof j.foto === "string" ? j.foto : "",
        color: typeof j.color === "string" && j.color ? j.color : PALETA[lista.length % PALETA.length],
        orden: lista.length,
      });
    });

    const inicio = parseMes(liga && liga.inicio);
    if (liga && liga.inicio && !inicio) avisos.push(`LIGA.inicio (${JSON.stringify(liga.inicio)}) debe ser "AAAA-MM".`);
    const inicioOrden = inicio ? inicio.y * 10000 + inicio.m * 100 : 0;

    const out = [];
    (Array.isArray(partidos) ? partidos : []).forEach((p, i) => {
      const n = i + 1;
      if (!p || typeof p !== "object" || Array.isArray(p)) {
        avisos.push(`Partido #${n}: no tiene la forma { fecha: "AAAA-MM-DD", Nombre: ["V", 0] }.`);
        return;
      }
      const f = parseFecha(p.fecha);
      if (!f) {
        avisos.push(`Partido #${n}: la fecha ${JSON.stringify(p.fecha)} no es válida (usa "AAAA-MM-DD" o "AAAA-MM").`);
        return;
      }
      if (f.orden < inicioOrden) {
        avisos.push(`Partido #${n} (${f.corta}) es anterior al inicio de la temporada y no se cuenta.`);
        return;
      }
      const res = {};
      Object.keys(p).forEach((k) => {
        if (k === "fecha" || k === "nota") return;
        if (!ids.has(k)) {
          const sug = lista.find((j) => j.id.toLowerCase() === k.trim().toLowerCase());
          avisos.push(`Partido #${n} (${f.corta}): "${k}" no está en JUGADORES${sug ? `, ¿quisiste decir "${sug.id}"?` : "."}`);
          return;
        }
        const e = parseEntrada(p[k]);
        if (!e) {
          avisos.push(`Partido #${n} (${f.corta}): no entiendo el dato de ${k}: ${JSON.stringify(p[k])}. Debe ser como ["V", 2].`);
          return;
        }
        res[k] = e;
      });
      if (!Object.keys(res).length) {
        avisos.push(`Partido #${n} (${f.corta}): no tiene ningún jugador válido.`);
        return;
      }
      out.push({ idx: i, fecha: f, nota: typeof p.nota === "string" ? p.nota.trim() : "", res });
    });

    // orden cronológico; si dos partidos tienen la misma fecha, manda el orden del archivo
    out.sort((a, b) => a.fecha.orden - b.fecha.orden || a.idx - b.idx);
    out.forEach((p, i) => { p.num = i + 1; });

    return {
      jugadores: lista,
      partidos: out,
      avisos,
      inicio: inicio ? inicio.key : (out[0] ? out[0].fecha.mes : null),
      inicioConfig: inicio ? inicio.key : null,
    };
  }

  /* ---------- estadísticas ---------- */

  function statsJugador(id, partidos) {
    const hist = [];
    partidos.forEach((p) => { const x = p.res[id]; if (x) hist.push({ p, r: x.r, g: x.g }); });

    const pj = hist.length;
    let v = 0, e = 0, d = 0, goles = 0, conGol = 0, maxGol = 0, hat = 0;
    hist.forEach((h) => {
      if (h.r === "V") v++; else if (h.r === "E") e++; else d++;
      goles += h.g;
      if (h.g > 0) conGol++;
      if (h.g > maxGol) maxGol = h.g;
      if (h.g >= 3) hat++;
    });
    const pts = v * 3 + e;
    const ptsMax = pj * 3;

    // Rachas: los empates ni suman ni cortan la racha.
    const sinE = hist.filter((h) => h.r !== "E");
    let mejorV = 0, peorD = 0, cv = 0, cd = 0;
    sinE.forEach((h) => {
      if (h.r === "V") { cv++; cd = 0; if (cv > mejorV) mejorV = cv; }
      else { cd++; cv = 0; if (cd > peorD) peorD = cd; }
    });
    let racha = null;
    if (sinE.length) {
      const t = sinE[sinE.length - 1].r;
      let n = 0;
      for (let i = sinE.length - 1; i >= 0 && sinE[i].r === t; i--) n++;
      racha = { tipo: t, n };
    }

    return {
      id, pj, v, e, d, goles, pts, ptsMax,
      rend: pj ? (pts / ptsMax) * 100 : null,
      win: pj ? (v / pj) * 100 : null,
      gpp: pj ? goles / pj : null,
      conGol, maxGol, hat, mejorV, peorD, racha,
      forma: hist.slice(-5).map((h) => h.r),
      hist,
    };
  }

  /* Orden de la tabla: % rendimiento → puntos → victorias → goles.
     Quien no ha jugado va al final y no tiene puesto. */
  function comparar(a, b) {
    if (!a.pj !== !b.pj) return a.pj ? -1 : 1;
    return (b.rend || 0) - (a.rend || 0) || b.pts - a.pts || b.v - a.v || b.goles - a.goles || a.orden - b.orden;
  }
  const mismoPuesto = (a, b) => a.pj > 0 && b.pj > 0 &&
    a.rend === b.rend && a.pts === b.pts && a.v === b.v && a.goles === b.goles;

  function tabla(jugadores, partidos) {
    const filas = jugadores.map((j) => Object.assign({ jugador: j, orden: j.orden }, statsJugador(j.id, partidos)));
    filas.sort(comparar);
    let pos = 0;
    filas.forEach((f, i) => {
      if (!f.pj) { f.pos = null; return; }
      if (i === 0 || !mismoPuesto(filas[i - 1], f)) pos = i + 1;
      f.pos = pos;
    });
    return filas;
  }

  /* Cuántos puestos subió (+) o bajó (−) cada uno respecto de antes del último partido */
  function movimientos(jugadores, partidos) {
    const out = {};
    if (partidos.length < 2) return out;
    const antes = {};
    tabla(jugadores, partidos.slice(0, -1)).forEach((f) => { antes[f.id] = f.pos; });
    tabla(jugadores, partidos).forEach((f) => {
      if (f.pos == null) return;
      out[f.id] = antes[f.id] == null ? "nuevo" : antes[f.id] - f.pos;
    });
    return out;
  }

  /* Premios. `rachas` permite usar la racha actual de toda la temporada. */
  function premios(filas, rachas) {
    const jug = filas.filter((f) => f.pj > 0);
    if (!jug.length) return [];
    const rachaDe = (f) => (rachas && rachas[f.id] !== undefined ? rachas[f.id] : f.racha);
    const out = [];
    const mejores = (arr, val, min) => {
      const vals = arr.map(val).filter((x) => x != null);
      if (!vals.length) return [];
      const max = Math.max.apply(null, vals);
      if (!(max >= min)) return [];
      return arr.filter((f) => val(f) === max);
    };
    const add = (id, icono, titulo, ganadores, valor, extra) => {
      if (ganadores.length && ganadores.length <= 2) out.push(Object.assign({ id, icono, titulo, ids: ganadores.map((f) => f.id), valor }, extra || {}));
    };

    const lider = jug.filter((f) => f.pos === 1);
    if (lider.length) out.push({ id: "lider", icono: "👑", titulo: "Líder", ids: lider.map((f) => f.id), valor: lider[0].rend });

    const pich = mejores(jug, (f) => f.goles, 1);
    add("pichichi", "👟", "Pichichi", pich, pich.length ? pich[0].goles : 0);

    const maxPJ = Math.max.apply(null, jug.map((f) => f.pj));
    const minPJ = Math.max(1, Math.ceil(maxPJ / 2));
    const efec = mejores(jug.filter((f) => f.pj >= minPJ), (f) => f.gpp, 0.01);
    const mismo = (a, b) => a.length === b.length && a.every((x) => b.includes(x));
    if (efec.length && !mismo(efec, pich)) add("efectivo", "🎯", "Más efectivo", efec, efec[0].gpp);

    const fuego = mejores(jug, (f) => { const r = rachaDe(f); return r && r.tipo === "V" ? r.n : 0; }, 2);
    add("fuego", "🔥", "En llamas", fuego, fuego.length ? rachaDe(fuego[0]).n : 0);

    const inv = mejores(jug.filter((f) => f.d === 0), (f) => f.pj, 3);
    add("invicto", "🛡️", "Invicto", inv, inv.length ? inv[0].pj : 0);

    const pres = mejores(jug, (f) => f.pj, 1);
    if (pres.length === 1 && jug.length > 1) add("infaltable", "🏃", "Infaltable", pres, pres[0].pj);

    const frio = mejores(jug, (f) => { const r = rachaDe(f); return r && r.tipo === "D" ? r.n : 0; }, 2);
    add("frio", "🧊", "Pecho frío", frio, frio.length ? rachaDe(frio[0]).n : 0);

    return out;
  }

  /* Campeón de cada mes ya terminado (antes de `mesActual`) */
  function campeonesMes(jugadores, partidos, mesActual) {
    const meses = Array.from(new Set(partidos.map((p) => p.fecha.mes))).filter((k) => k < mesActual).sort();
    return meses.map((k) => {
      const t = tabla(jugadores, partidos.filter((p) => p.fecha.mes === k));
      return { mes: k, ids: t.filter((f) => f.pos === 1).map((f) => f.id), filas: t };
    });
  }

  /* Química y duelos entre dos jugadores.
     Mismo resultado (V-V o D-D) = jugaron en el mismo equipo.
     Uno ganó y el otro perdió = jugaron en contra. Empate-empate no se puede saber. */
  function duelo(a, b, partidos) {
    const o = { comunes: 0, juntos: 0, juntosV: 0, juntosD: 0, contraG: 0, contraP: 0, empates: 0 };
    partidos.forEach((p) => {
      const x = p.res[a], y = p.res[b];
      if (!x || !y) return;
      o.comunes++;
      if (x.r === "E" && y.r === "E") o.empates++;
      else if (x.r === y.r) { o.juntos++; if (x.r === "V") o.juntosV++; else o.juntosD++; }
      else if (x.r !== "E" && y.r !== "E") { if (x.r === "V") o.contraG++; else o.contraP++; }
    });
    return o;
  }

  /* Series para el gráfico (null = todavía no debuta) */
  function evolucion(jugadores, partidos) {
    return jugadores.map((j) => {
      let pts = 0, pj = 0;
      const ptsAcum = [], rend = [];
      partidos.forEach((p) => {
        const x = p.res[j.id];
        if (x) { pj++; pts += PUNTOS[x.r]; }
        ptsAcum.push(pj ? pts : null);
        rend.push(pj ? (pts / (pj * 3)) * 100 : null);
      });
      return { id: j.id, color: j.color, pts: ptsAcum, rend };
    });
  }

  /* Meses desde el inicio hasta hoy (o hasta el último partido, si es posterior) */
  function listaMeses(inicio, partidos, hoyKey) {
    const keys = partidos.map((p) => p.fecha.mes);
    const desde = parseMes(inicio || keys[0] || hoyKey);
    if (!desde) return [];
    let hasta = keys.concat([hoyKey]).filter(Boolean).sort().pop() || desde.key;
    if (hasta < desde.key) hasta = desde.key;
    const out = [];
    let y = desde.y, m = desde.m;
    while (claveMes(y, m) <= hasta && out.length < 600) {
      out.push(claveMes(y, m));
      m++; if (m > 12) { m = 1; y++; }
    }
    return out;
  }

  /* Resumen de un partido para mostrarlo */
  function resumenPartido(p, jugadores) {
    const grupos = { V: [], E: [], D: [] };
    let goles = 0, maxG = 0;
    jugadores.forEach((j) => {
      const x = p.res[j.id];
      if (!x) return;
      grupos[x.r].push({ id: j.id, g: x.g });
      goles += x.g;
      if (x.g > maxG) maxG = x.g;
    });
    const figuras = maxG > 0 ? jugadores.filter((j) => p.res[j.id] && p.res[j.id].g === maxG).map((j) => j.id) : [];
    const mezcla = grupos.E.length > 0 && (grupos.V.length + grupos.D.length) > 0;
    return { grupos, goles, maxG, figuras, mezcla };
  }

  return {
    MESES, MESES_CORTOS, PUNTOS, PALETA,
    claveMes, parseMes, nombreMes, parseFecha, parseEntrada, normalizar,
    statsJugador, comparar, mismoPuesto, tabla, movimientos, premios,
    campeonesMes, duelo, evolucion, listaMeses, resumenPartido,
  };
});
