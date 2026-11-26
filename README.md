# Página musical · Cloudflare Workers

La página se publica como un Worker con recursos estáticos y una API. La portada está en `/` y el acceso de administración en `/admin/`.

Incluye perfil, insignia animada, paletas y efectos, foto/logo, fondo y firma, pantalla de entrada, tema fijado, playlist, sección destacada, dedicatorias, reacciones, modo cine y moderación de comentarios.

## Estructura

- `public/`: páginas, estilos, scripts e imágenes.
- `functions/`: manejadores de la API (inicio de sesión, estado, comentarios y dedicatorias).
- `src/index.js`: entrada del Worker que conecta la API con los recursos estáticos.
- `wrangler.toml`: configuración de compilación y publicación.

## Configuración en Cloudflare

En el proyecto de Workers, abrí **Configuración → Bindings** y agregá una binding de KV llamada exactamente `MUSIC_DATA`. En **Variables y secretos**, guardá `ADMIN_PASSWORD` y `COOKIE_SECRET` como secretos. Elegí una clave de acceso y un valor aleatorio largo para firmar las sesiones.

Al subir cambios a la rama `main`, Cloudflare vuelve a publicar el sitio. La binding `MUSIC_DATA` conserva las personalizaciones y aportes de visitantes. Sin ella, el sitio muestra los datos iniciales pero no sincroniza cambios.
