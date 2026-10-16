# Automodelle

Archivo estático y responsive de automóviles. El inicio reúne las marcas; cada continente muestra sus marcas y cada marca lista sus modelos y fichas individuales. Los listados se generan a partir de `catalogo.json`.

## Tecnología

- HTML para la estructura.
- CSS compartido para el diseño responsive.

## Estructura

```text
Automodelle/
├── index.html
├── catalogo.json
├── scripts/generar-catalogo.mjs
├── plantillas/modelo.html
├── continentes/
│   ├── europa.html
│   ├── america.html
│   ├── asia.html
│   ├── africa.html
│   └── oceania.html
├── modelos/
│   ├── Europa/Audi/index.html
│   ├── Europa/Audi/audi-rs2-avant-1994.html
│   ├── América/
│   ├── Asia/
│   ├── África/
│   └── Oceanía/
├── assets/
│   ├── css/styles.css
│   └── images/
└── README.md
```

El proyecto no depende de un sistema de compilación: cualquier alojamiento de páginas estáticas puede servir directamente esta carpeta.

## Imágenes

Guarda las imágenes en `assets/images/`, organizadas por continente, marca y modelo. Por ejemplo: `assets/images/Europa/Audi/RS2/`. Usa archivos WebP o AVIF optimizados cuando puedas.

## Añadir contenido

1. Guarda el logo y las imágenes en `assets/images/Continente/Marca/`.
2. Añade la marca o el modelo a `catalogo.json`. Cada página de marca muestra décadas desplegables de 1900–1909 a 2020–2029, incluso si todavía están vacías; las décadas con modelos se abren inicialmente. Los modelos se colocan automáticamente según `anio`. Para una ficha completa, `archivo` es el nombre de su HTML y `galeria` contiene sus fotografías con un texto `alt` descriptivo; la primera será la portada. Para anunciar un modelo sin ficha ni imagen todavía, omite `archivo` y usa `"galeria": []`: aparecerá como «Ficha en preparación» sin enlace.
3. Ejecuta `node scripts/generar-catalogo.mjs` desde la raíz del proyecto.
4. Edita la ficha creada en `modelos/Continente/Marca/`: completa la historia, añade datos verificados y documenta las fuentes. Para añadir fotografías, actualiza `galeria` en `catalogo.json` y vuelve a ejecutar el generador.

El generador actualiza el inicio, las páginas de continentes, los índices de marcas y únicamente la zona marcada como galería dentro de cada ficha. Conserva la historia, los datos y las fuentes escritos a mano. La base de las fichas nuevas está en `plantillas/modelo.html`. Las páginas comparten `assets/css/styles.css`.

La ficha incluye galería, datos básicos, historia y fuentes. Los datos que aún no se hayan comprobado deben quedar fuera de la ficha hasta tener una fuente fiable.

Cada elemento de `galeria` puede incluir `descripcion` y `credito`. Si conoces al autor o la procedencia de una imagen, anótalo ahí y en la sección de fuentes de la ficha.
