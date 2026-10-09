# Julio Cubas — portafolio personal

Sitio estático de la carta personal de Julio Cubas: desarrollador fullstack (frontend, backend y servidor).

## Sitio publicado

- **Producción:** https://cubasmx.github.io/julio-cubas/

## Estructura

```
index.html      # Página única (hero, servicios, trabajo, stack, contacto)
styles.css      # Estilos del sitio
script.js       # Interacciones (menú, reveals, etc.)
.github/workflows/deploy.yml   # Publicación automática a GitHub Pages
```

Sin build ni dependencias: HTML, CSS y JS planos.

## Vista previa local

```bash
python3 -m http.server 4173
```

Después abrir `http://localhost:4173` dentro de esta carpeta.

## Deploy

La publicación es automática por **GitHub Actions** (`deploy.yml`):

1. Cada push a `main` (o un `workflow_dispatch` manual) dispara el workflow.
2. El job `build` copia `index.html`, `styles.css` y `script.js` a `dist/`.
3. El job `deploy` publica ese contenido en GitHub Pages.

GitHub Pages está configurado con origen **GitHub Actions**, así que el workflow es la única ruta de publicación: no hay rama `gh-pages` y no se sirve nada directamente desde `main`.
