import { readFile, mkdir, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const continents = [
  ['Europa', 'europa'],
  ['América', 'america'],
  ['Asia', 'asia'],
  ['África', 'africa'],
  ['Oceanía', 'oceania'],
];
const continentSlugs = new Map(continents);
const firstDecade = 1900;
const decadeLimit = 2030;
const catalog = JSON.parse(await readFile(path.join(root, 'catalogo.json'), 'utf8'));
const modelTemplate = await readFile(path.join(root, 'plantillas', 'modelo.html'), 'utf8');

const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);
const safeSegment = value => typeof value === 'string' && /^[\p{L}\p{N}][\p{L}\p{N} ._-]*$/u.test(value) && !value.includes('..');
const safeImagePath = value => typeof value === 'string' && value.startsWith('assets/images/') && !value.split('/').includes('..');
const exists = async file => { try { await access(file); return true; } catch { return false; } };
const absolute = relative => path.join(root, relative);
const asset = (prefix, relative) => `${prefix}${relative.split(path.sep).join('/')}`;

async function writeIfChanged(relative, content) {
  const file = absolute(relative);
  await mkdir(path.dirname(file), { recursive: true });
  if (await exists(file) && await readFile(file, 'utf8') === content) return;
  await writeFile(file, content, 'utf8');
  console.log(`Actualizado: ${relative}`);
}

function head(title, description, cssPrefix) {
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="${escapeHtml(description)}" />
  <title>${escapeHtml(title)} — Automodelle</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Manrope:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,600;1,600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${cssPrefix}assets/css/styles.css" />
</head>
<body>`;
}

function continentNav(active, prefix) {
  const links = [['Todos', 'index.html'], ...continents.map(([name, slug]) => [name, `continentes/${slug}.html`])];
  return `<nav class="continent-filters" aria-label="Explorar por continente">
${links.map(([name, file]) => `        <a class="continent-filter${name === active ? ' active' : ''}" href="${prefix}${file}"${name === active ? ' aria-current="page"' : ''}>${name}</a>`).join('\n')}
      </nav>`;
}

function brandCard(brand, prefix) {
  const folder = `modelos/${brand.continente}/${brand.nombre}/index.html`;
  const count = brand.modelos.length;
  return `<a class="model-card brand-card" href="${prefix}${folder}" aria-label="Ver los modelos de ${escapeHtml(brand.nombre)}">
          <div class="brand-card-logo"><img src="${asset(prefix, brand.logo)}" alt="" loading="lazy" /></div>
          <div class="model-card-copy"><h2>${escapeHtml(brand.nombre)}</h2><p>${count} ${count === 1 ? 'modelo' : 'modelos'}</p></div>
        </a>`;
}

function modelCard(brand, model) {
  if (!model.archivo) return `<article class="model-card model-card-pending" aria-label="${escapeHtml(model.nombre)}, ficha en preparación">
        <div class="model-card-copy"><h3>${escapeHtml(model.nombre)}</h3><p>${modelPeriod(model)} · Ficha en preparación</p></div>
      </article>`;
  const cover = model.galeria[0];
  return `<a class="model-card" href="${escapeHtml(model.archivo)}" aria-label="Ver ficha del ${escapeHtml(model.nombre)} de ${modelPeriod(model)}">
        <img src="${asset('../../../', cover.archivo)}" alt="${escapeHtml(cover.alt)}" loading="lazy" />
        <div class="model-card-copy"><h3>${escapeHtml(model.nombre)}</h3><p>${modelPeriod(model)}</p></div>
      </a>`;
}

function modelPeriod(model) {
  return model.anioFin ? `${model.anio}–${model.anioFin}` : String(model.anio);
}

function modelDecade(model) {
  return Math.floor(model.anio / 10) * 10;
}

function decadeLabel(model) {
  const start = modelDecade(model);
  return `${start}–${start + 9}`;
}

function decadeSections(brand) {
  const decades = new Map();
  for (const model of brand.modelos) {
    const start = modelDecade(model);
    if (!decades.has(start)) decades.set(start, []);
    decades.get(start).push(model);
  }
  return [...decades.entries()].sort(([a], [b]) => a - b).map(([start, models]) => {
    const count = `${models.length} ${models.length === 1 ? 'modelo' : 'modelos'}`;
    return `<details class="brand-decade" open>
      <summary class="brand-decade-summary"><h2 class="brand-decade-title">${start}–${start + 9}</h2><span class="brand-decade-count">${count}</span></summary>
      <div class="catalogue-grid">
        ${models.sort((a, b) => a.anio - b.anio || a.nombre.localeCompare(b.nombre, 'es')).map(model => modelCard(brand, model)).join('\n        ')}
      </div>
    </details>`;
  }).join('\n    ');
}

function galleryFigures(model) {
  return model.galeria.map((photo, index) => {
    const caption = photo.descripcion || `${model.nombre} · ${modelPeriod(model)}`;
    const credit = photo.credito ? ` · ${photo.credito}` : '';
    return `          <figure>
            <img src="${asset('../../../', photo.archivo)}" alt="${escapeHtml(photo.alt)}"${index ? ' loading="lazy"' : ''} />
            <figcaption>${escapeHtml(caption + credit)}</figcaption>
          </figure>`;
  }).join('\n');
}

function updateGallery(content, model) {
  const start = '<!-- catalogo:galeria:inicio -->';
  const end = '<!-- catalogo:galeria:fin -->';
  const pattern = /<!-- catalogo:galeria:inicio -->[\s\S]*?<!-- catalogo:galeria:fin -->/;
  if (!pattern.test(content)) throw new Error(`La ficha ${model.archivo} no tiene los marcadores de galería.`);
  return content.replace(pattern, `${start}\n${galleryFigures(model)}\n          ${end}`);
}

function updateModelHeading(content, brand, model) {
  const pattern = /(<div class="model-detail-heading">\s*<p>)[\s\S]*?(<\/p>)/;
  if (!pattern.test(content)) throw new Error(`La ficha ${model.archivo} no tiene el encabezado del modelo.`);
  return content.replace(pattern, (_, start, end) => `${start}${escapeHtml(brand.continente.toUpperCase())} / ${escapeHtml(brand.nombre.toUpperCase())} / ${decadeLabel(model)}${end}`);
}

function updateModelPeriod(content, model) {
  const pattern = /(<div><dt>)(Año|Período)(<\/dt><dd>)[^<]*(<\/dd><\/div>)/;
  if (!pattern.test(content)) throw new Error(`La ficha ${model.archivo} no tiene el período del modelo.`);
  return content.replace(pattern, (_, start, _label, middle, end) => `${start}Período${middle}${modelPeriod(model)}${end}`);
}

function updateModelDocumentMetadata(content, model) {
  const description = `<meta name="description" content="Ficha de ${escapeHtml(model.nombre)} (${modelPeriod(model)}) en Automodelle." />`;
  const title = `<title>${escapeHtml(model.nombre)} (${modelPeriod(model)}) — Automodelle</title>`;
  if (!/<meta name="description" content="[^"]*" \/>/.test(content) || !/<title>[^<]*<\/title>/.test(content)) {
    throw new Error(`La ficha ${model.archivo} no tiene los metadatos esperados.`);
  }
  return content.replace(/<meta name="description" content="[^"]*" \/>/, description).replace(/<title>[^<]*<\/title>/, title);
}

function listPage(active, brands, prefix) {
  const all = active === 'Todos';
  const title = all ? 'Archivo del automóvil' : active;
  const content = brands.length
    ? `<div class="catalogue-grid">
        ${brands.map(brand => brandCard(brand, prefix)).join('\n        ')}
      </div>`
    : `<div class="catalogue-state" role="status"><div><h1>${escapeHtml(active)}: el catálogo está en camino.</h1><p>Pronto podrás descubrir aquí los modelos de ${escapeHtml(active)}.</p></div></div>`;
  return `${head(title, all ? 'Explora las marcas de automóviles de todo el mundo.' : `Explora las marcas de automóviles de ${active}.`, prefix)}
  <main>
    <section class="continents" aria-label="${all ? 'Archivo por continente' : `Archivo de ${escapeHtml(active)}`}">
      ${continentNav(active, prefix)}
      ${content}
    </section>
  </main>
</body>
</html>
`;
}

function brandPage(brand) {
  const slug = continentSlugs.get(brand.continente);
  const count = brand.modelos.length;
  return `${head(brand.nombre, `Explora los modelos de ${brand.nombre}.`, '../../../')}
  <main class="model-page">
    <nav class="breadcrumb" aria-label="Ruta de navegación">
      <a href="../../../index.html">Todos</a><span aria-hidden="true">/</span>
      <a href="../../../continentes/${slug}.html">${escapeHtml(brand.continente)}</a><span aria-hidden="true">/</span>
      <span aria-current="page">${escapeHtml(brand.nombre)}</span>
    </nav>
    <header class="brand-heading">
      <img src="${asset('../../../', brand.logo)}" alt="" />
      <div><h1>${escapeHtml(brand.nombre)}</h1><span>${count} ${count === 1 ? 'modelo' : 'modelos'} en el archivo</span></div>
    </header>
    <div aria-label="Modelos de ${escapeHtml(brand.nombre)}" class="brand-decades">
      ${decadeSections(brand)}
    </div>
  </main>
</body>
</html>
`;
}

function modelPage(brand, model) {
  const replacements = {
    MODELO: model.nombre, ANIO: model.anio, PERIODO: modelPeriod(model), DECADA: decadeLabel(model), CONTINENTE: brand.continente,
    CONTINENTE_SLUG: continentSlugs.get(brand.continente), MARCA: brand.nombre,
    CONTINENTE_MAYUS: brand.continente.toUpperCase(), MARCA_MAYUS: brand.nombre.toUpperCase(),
    GALERIA: galleryFigures(model),
  };
  return modelTemplate.replace(/\{\{([A-Z_]+)\}\}/g, (_, key) => {
    if (!(key in replacements)) throw new Error(`Marcador desconocido: ${key}`);
    return key === 'GALERIA' ? replacements[key] : escapeHtml(replacements[key]);
  });
}

const brandKeys = new Set();
for (const brand of catalog.marcas) {
  if (!continentSlugs.has(brand.continente) || !safeSegment(brand.nombre) || !Array.isArray(brand.modelos)) throw new Error(`Marca inválida: ${brand.nombre}`);
  const key = `${brand.continente}/${brand.nombre}`;
  if (brandKeys.has(key)) throw new Error(`Marca duplicada: ${key}`);
  brandKeys.add(key);
  if (!safeImagePath(brand.logo) || !await exists(absolute(brand.logo))) throw new Error(`Falta el logo o su ruta no es válida: ${brand.logo}`);
  const modelFiles = new Set();
  for (const model of brand.modelos) {
    if (!Number.isInteger(model.anio) || model.anio < firstDecade || model.anio >= decadeLimit || (model.anioFin !== undefined && (!Number.isInteger(model.anioFin) || model.anioFin < model.anio)) || !model.nombre || !Array.isArray(model.galeria) || (model.archivo && (!safeSegment(model.archivo) || !model.archivo.endsWith('.html') || !model.galeria.length)) || (!model.archivo && model.galeria.length)) throw new Error(`Modelo inválido: ${model.nombre}`);
    if (model.archivo && modelFiles.has(model.archivo)) throw new Error(`Ficha duplicada: ${model.archivo}`);
    if (model.archivo) modelFiles.add(model.archivo);
    for (const photo of model.galeria) {
      if (!safeImagePath(photo.archivo) || !photo.alt || !await exists(absolute(photo.archivo))) throw new Error(`Falta una imagen o su ruta o descripción no es válida: ${photo.archivo}`);
    }
  }
}

await writeIfChanged('index.html', listPage('Todos', catalog.marcas, ''));
for (const [name, slug] of continents) {
  await writeIfChanged(`continentes/${slug}.html`, listPage(name, catalog.marcas.filter(brand => brand.continente === name), '../'));
}
for (const brand of catalog.marcas) {
  const folder = `modelos/${brand.continente}/${brand.nombre}`;
  await writeIfChanged(`${folder}/index.html`, brandPage(brand));
  for (const model of brand.modelos) {
    if (!model.archivo) continue;
    const relative = `${folder}/${model.archivo}`;
    const current = await exists(absolute(relative)) ? await readFile(absolute(relative), 'utf8') : '';
    if (!current.trim()) {
      await writeIfChanged(relative, modelPage(brand, model));
    } else {
      await writeIfChanged(relative, updateModelDocumentMetadata(updateModelPeriod(updateModelHeading(updateGallery(current, model), brand, model), model), model));
    }
  }
}
