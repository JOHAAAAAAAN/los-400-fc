# ⚽ Los 400 FC

Tabla, rachas, goleadores y partidos del grupo. Página 100 % estática: se publica gratis con **GitHub Pages**, sin servidor, sin base de datos y sin nada que pagar.

**Temporada desde octubre 2026.**

## Qué trae

- **Tabla** de la temporada y de cada mes, con podio, % de rendimiento, forma (últimos 5), racha actual 🔥/❄️ y flechas de quién subió o bajó en el último partido.
- **Premios** automáticos: Líder 👑, Pichichi 👟, En llamas 🔥, Más efectivo 🎯, Invicto 🛡️, Infaltable 🏃 y Pecho frío 🧊.
- **Campeones del mes** 🏆: al terminar cada mes, el #1 suma un título que queda en la tabla y en su ficha.
- **Gráfico de evolución** (% de rendimiento o puntos) partido a partido.
- **Partidos**: historial con quién ganó, quién perdió, los goles y la figura ⭐.
- **Plantel** y **ficha de cada jugador**: estadísticas, goles por partido, mes a mes, mejor y peor racha, y química/duelos con cada compañero.
- **Compartir**: copia la tabla lista para WhatsApp o descarga una **imagen** de la tabla.
- Se ve bien en celular (menú abajo, como app) y se puede "Agregar a pantalla de inicio".
- Si `data.js` tiene algún error de tipeo, la página avisa qué revisar en vez de quedar en blanco.

## Publicarla en GitHub (repo nuevo)

1. En GitHub: **+ → New repository**. Nombre: `los-400-fc`, **Public**, sin README. **Create repository**.
2. En el repo vacío, toca **uploading an existing file** y arrastra **todo lo que hay dentro de esta carpeta** (no la carpeta en sí): `index.html`, `manifest.webmanifest`, `README.md`, `.nojekyll` y las carpetas `css`, `js` e `img`. Luego **Commit changes**.
3. Ve a **Settings → Pages**. En *Build and deployment* elige **Source: Deploy from a branch**, **Branch: main** y carpeta **/(root)**. **Save**.
4. En 1–2 minutos queda en <https://johaaaaaaan.github.io/los-400-fc/>.

> `.nojekyll` empieza con punto y en Mac está oculto: en el Finder aprieta `Cmd + Shift + .` para verlo. Si se te queda afuera no pasa nada grave.

Si le pones otro nombre al repo, cambia la dirección en las líneas `og:url` y `og:image` de `index.html` (es la vista previa del link en WhatsApp) y `LIGA.repo` en `js/data.js`.

## Cargar un partido (lo de todos los días)

1. En GitHub abre `js/data.js` y toca el lápiz ✏️.
2. Agrega una línea al final de la lista `PARTIDOS` (**V** ganó · **E** empató · **D** perdió, y los goles).
3. Aprieta **Commit changes**. En 1–2 minutos la página se actualiza sola.

La línea se ve así (si alguien no jugó, simplemente no aparece):

```js
{ fecha: "2026-10-26", Isra: ["V", 1], Mois: ["D", 0], Seba: ["V", 3], Mai: ["D", 2] },
```

Si no te acuerdas del día, puedes poner solo el mes: `fecha: "2026-10"`.

## Agregar un jugador

1. Sube su foto a la carpeta `img/` (cuadrada idealmente, ej. `img/juan.jpg`).
2. En `js/data.js`, agrégalo a `JUGADORES`:

```js
{ id: "Juan", foto: "img/juan.jpg", color: "#34d399" },
```

> Ojo: GitHub distingue mayúsculas. `img/Juan.jpg` no es lo mismo que `img/juan.jpg`.

## Probarla en tu compu

Basta con abrir `index.html` con doble clic. Todo funciona igual, salvo la imagen para compartir, que sale sin fotos (el navegador lo bloquea en archivos locales). Publicada en GitHub sale completa.

## Cómo se calcula

- **Puntos**: V = 3, E = 1, D = 0. **% Rend.** = puntos / puntos posibles.
- **Orden de la tabla**: % de rendimiento → puntos → victorias → goles. Quien no ha jugado queda al final sin puesto.
- **Rachas**: los empates no cortan ni suman la racha.
- **Juntos / en contra** (en la ficha): si dos jugadores ganaron o perdieron el mismo partido se asume que jugaron en el mismo equipo; si uno ganó y el otro perdió, que jugaron en contra.

## Archivos

| Archivo | Para qué |
| --- | --- |
| `js/data.js` | **Los datos: lo único que se edita.** |
| `js/stats.js` | Cálculo de estadísticas. |
| `js/app.js` | Dibuja la página. |
| `css/styles.css` | Diseño. |
| `img/` | Fotos, íconos e imagen para compartir el link. |
