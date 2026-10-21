/* =====================================================================
   LOS 400 FC · DATOS
   ---------------------------------------------------------------------
   Este es el ÚNICO archivo que tienes que editar para cargar partidos.
   ===================================================================== */

const LIGA = {
  nombre: "Los 400 FC",
  inicio: "2026-10",                 // la temporada parte en octubre 2026
  repo: "johaaaaaaan/los-400-fc",   // usuario/repositorio en GitHub
};

/* ---------------------------------------------------------------------
   JUGADORES
   id     → el nombre que usas en PARTIDOS (respeta mayúsculas)
   foto   → ruta de la imagen (cuadrada idealmente). Ojo: GitHub
            distingue mayúsculas, "img/Mai.jpg" ≠ "img/mai.jpg"
   color  → color de su línea en los gráficos
   --------------------------------------------------------------------- */
const JUGADORES = [
  { id: "Isra", foto: "img/isra.jpg", color: "#60a5fa" },
  { id: "Mois", foto: "img/mois.jpg", color: "#fbbf24" },
  { id: "Seba", foto: "img/seba.jpg", color: "#c084fc" },
  { id: "Mai",  foto: "img/mai.jpg",  color: "#fb7185" },
];

/* ---------------------------------------------------------------------
   PARTIDOS  (en orden: el más antiguo arriba, el más nuevo abajo)

   fecha  → "AAAA-MM-DD"  (o "AAAA-MM" si no te acuerdas del día)
   Para cada jugador que jugó:   Nombre: ["Resultado", goles]
       "V" = ganó   ·   "E" = empató   ·   "D" = perdió
   Si alguien no jugó, simplemente no lo pongas.
   Opcional:  nota: "texto"   (cancha, marcador, lo que quieras)

   Ejemplo:
   { fecha: "2026-10-26", Isra: ["V", 1], Mois: ["D", 0], Seba: ["V", 3], Mai: ["D", 2] },
   --------------------------------------------------------------------- */
const PARTIDOS = [
  // ── Octubre 2026 ──────────────────────────────────────────────
  { fecha: "2026-10", Isra: ["V", 1], Mois: ["V", 2], Seba: ["V", 5] },
  { fecha: "2026-10", Isra: ["D", 0], Mois: ["V", 0], Seba: ["V", 0] },
];
