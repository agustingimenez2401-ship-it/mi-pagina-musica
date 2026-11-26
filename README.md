# Réplica del panel `/admin` · Cloudflare Pages

Este proyecto reproduce la experiencia de acceso y edición de la página de referencia. En `/admin/` aparece “Mi acceso”; tras iniciar sesión, se abre la página musical con los botones de administración y el editor. La portada pública está en `/`.

Incluye perfil, insignia animada, paletas y efectos, foto/logo y encuadre, fondo y firma, pantalla de entrada, tema fijado y recortes, playlist, sección destacada, dedicatorias, reacciones, modo cine y moderación de comentarios. La lista trae los 25 títulos de la página.

## Videos con letra

Desde el botón “Crear video para tu estado”, elegí una canción con audio guardado o cargá un archivo MP3, M4A o WAV de hasta 8 MB. Podés escuchar el audio dentro del editor, cargar letras sincronizadas `.LRC` o marcar cada línea con el cursor mientras suena la canción. El creador añade una portada, animaciones, fondo y formato, y descarga un MP4 de 12, 20, 30 o 60 segundos, a 60 fps cuando el dispositivo lo admite (30 fps como alternativa).

Los reproductores de YouTube y Spotify no entregan el audio al editor para incorporarlo a un archivo MP4. Para crear un video con sonido, hace falta cargar un archivo de audio propio o usar una canción a la que ya se le haya guardado su audio en la página.

## Archivos

- `public/`: página pública, pantalla `/admin/`, estilos y scripts.
- `functions/`: inicio de sesión, lectura/guardado, comentarios, reacciones y dedicatorias.
- `wrangler.toml`: configuración de Pages.

## Preparar Cloudflare Pages

1. Creá un proyecto Pages. Como este proyecto incluye Pages Functions, desplegalo con Wrangler o conectalo a Git. El método de arrastrar y soltar del panel no compila `functions`.
2. Desde la carpeta raíz, ejecutá `npx wrangler pages deploy public --project-name NOMBRE_DEL_PROYECTO`.
3. En Workers & Pages → tu proyecto → Settings → Functions, agregá una binding de KV llamada exactamente `MUSIC_DATA`.
4. En Settings → Variables and Secrets, agregá `ADMIN_PASSWORD` y `COOKIE_SECRET` como secretos. Elegí una clave para tu copia y una cadena aleatoria larga para firmar la sesión.
5. Desplegá de nuevo y abrí `tudominio.com/admin/`.

La clave no está escrita en los archivos públicos. KV hace que las personalizaciones, comentarios y aportes se compartan entre visitantes. Sin la binding `MUSIC_DATA`, la página abre con los datos iniciales, pero no sincroniza cambios.

Los audios propios aceptan hasta 8 MB. Las imágenes se guardan en KV.

