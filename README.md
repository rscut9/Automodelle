# Automodelle

Archivo estático y responsive de automóviles. El inicio reúne las marcas; cada continente muestra sus marcas y cada marca lista sus modelos y fichas individuales.

## Tecnología

- HTML para la estructura.
- CSS compartido para el diseño responsive.

## Estructura

```text
Automodelle/
├── index.html
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

Para añadir un modelo, crea su ficha en `modelos/Continente/Marca/` y enlázala desde el `index.html` de esa marca. Para añadir una marca, crea su carpeta y página, y enlázala desde el inicio y la página de su continente. Las páginas comparten `assets/css/styles.css`.
