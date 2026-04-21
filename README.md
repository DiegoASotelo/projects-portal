# Portal de proyectos

Portal estático preparado para despliegue gratuito fuera de la VPS.

## Estructura
- `index.html`: índice principal
- `projects/tres-en-raya/`: proyecto 1
- `projects/snake/`: proyecto 2

## Despliegue recomendado
### Cloudflare Pages
- conectar repositorio GitHub
- framework preset: none
- build command: vacío
- output directory: `/`

### GitHub Pages
- publicar rama principal desde raíz del repo

## Idea de crecimiento
Cada proyecto nuevo vive en su propia carpeta bajo `projects/` y se enlaza desde `index.html`.
