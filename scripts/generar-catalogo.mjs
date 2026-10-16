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
const catalog = JSON.parse(await readFile(path.join(root, 'catalogo.json'), 'utf8'));
const modelTemplate = await readFile(path.join(root, 'plantillas', 'modelo.html'), 'utf8');

const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);
const safeSegment = value => typeof value === 'string' && /^[\p{L}\p{N}][\p{L}\p{N} ._-]*$/u.test(value) && !value.includes('..');
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
          <div class="model-card-copy"><span>${escapeHtml(brand.continente.toUpperCase())} / MARCA</span><h2>${escapeHtml(brand.nombre)}</h2><p>${count} ${count === 1 ? 'modelo' : 'modelos'}</p></div>
        </a>`;
}

function modelCard(brand, model) {
  return `<a class="model-card" href="${escapeHtml(model.archivo)}" aria-label="Ver ficha del ${escapeHtml(model.nombre)} de ${model.anio}">
        <img src="${asset('../../../', model.imagen)}" alt="${escapeHtml(model.alt)}" loading="lazy" />
        <div class="model-card-copy"><span>${escapeHtml(brand.nombre.toUpperCase())} / ${model.anio}</span><h2>${escapeHtml(model.nombre)}</h2><p>${model.anio}</p></div>
      </a>`;
}

function listPage(active, brands, prefix) {
  const all = active === 'Todos';
  const title = all ? 'Archivo del automóvil' : active;
  const content = brands.length
    ? `<div class="catalogue-grid">
        ${brands.map(brand => brandCard(brand, prefix)).join('\n        ')}
      </div>`
    : `<div class="catalogue-state" role="status"><span class="catalogue-index">01 / ARCHIVO</span><div><h1>${escapeHtml(active)}: el catálogo está en camino.</h1><p>Pronto podrás descubrir aquí los modelos de ${escapeHtml(active)}.</p></div></div>`;
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
      <div><p>${escapeHtml(brand.continente.toUpperCase())} / MARCA</p><h1>${escapeHtml(brand.nombre)}</h1><span>${count} ${count === 1 ? 'modelo' : 'modelos'} en el archivo</span></div>
    </header>
    <section aria-label="Modelos de ${escapeHtml(brand.nombre)}" class="catalogue-grid">
      ${brand.modelos.map(model => modelCard(brand, model)).join('\n      ')}
    </section>
  </main>
</body>
</html>
`;
}

function modelPage(brand, model) {
  const replacements = {
    MODELO: model.nombre, ANIO: model.anio, CONTINENTE: brand.continente,
    CONTINENTE_SLUG: continentSlugs.get(brand.continente), MARCA: brand.nombre,
    CONTINENTE_MAYUS: brand.continente.toUpperCase(), MARCA_MAYUS: brand.nombre.toUpperCase(),
    IMAGEN: model.imagen, ALT: model.alt,
  };
  return modelTemplate.replace(/\{\{([A-Z_]+)\}\}/g, (_, key) => {
    if (!(key in replacements)) throw new Error(`Marcador desconocido: ${key}`);
    return escapeHtml(replacements[key]);
  });
}

const brandKeys = new Set();
for (const brand of catalog.marcas) {
  if (!continentSlugs.has(brand.continente) || !safeSegment(brand.nombre) || !Array.isArray(brand.modelos)) throw new Error(`Marca inválida: ${brand.nombre}`);
  const key = `${brand.continente}/${brand.nombre}`;
  if (brandKeys.has(key)) throw new Error(`Marca duplicada: ${key}`);
  brandKeys.add(key);
  if (!await exists(absolute(brand.logo))) throw new Error(`Falta el logo: ${brand.logo}`);
  const modelFiles = new Set();
  for (const model of brand.modelos) {
    if (!safeSegment(model.archivo) || !model.archivo.endsWith('.html') || !Number.isInteger(model.anio) || !model.nombre || !model.alt) throw new Error(`Modelo inválido: ${model.nombre}`);
    if (modelFiles.has(model.archivo)) throw new Error(`Ficha duplicada: ${model.archivo}`);
    modelFiles.add(model.archivo);
    if (!await exists(absolute(model.imagen))) throw new Error(`Falta la imagen: ${model.imagen}`);
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
    const relative = `${folder}/${model.archivo}`;
    if (!await exists(absolute(relative))) await writeIfChanged(relative, modelPage(brand, model));
  }
}
