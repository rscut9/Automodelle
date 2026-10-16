# Automodelle

Archivo estático y responsive de automóviles. El inicio reúne todos los modelos; cada continente tiene su propia página y cada modelo puede tener una ficha individual.

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
│   ├── Europa/audi-rs2-avant-1994.html
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

Para añadir un modelo, crea su ficha en la carpeta correspondiente de `modelos/` y enlázala desde `index.html` y desde la página de su continente. Las páginas comparten `assets/css/styles.css`.
