# Exportación de LinkedIn de ejemplo

Datos **ficticios** con el mismo formato que la exportación oficial de LinkedIn, para que la portada funcione antes de cargar los tuyos.

```
npm run load:linkedin -- --dir ../content/linkedin-ejemplo
```

## Cargar tu perfil real

LinkedIn no ofrece una API pública para leer perfiles ni publicaciones, y extraer los datos de la web incumple sus condiciones. La vía oficial es la exportación:

1. En LinkedIn: **Ajustes → Privacidad de datos → Obtener una copia de tus datos**. Marca *Perfil*, *Cargos* y *Publicaciones* (o pide el archivo completo).
2. Descomprime el ZIP **fuera del repositorio** (trae datos privados, como tu correo y tus contactos).
3. Desde `backend/`:

   ```
   npm run load:linkedin -- --dir C:\ruta\a\la\exportacion
   ```

El script solo lee lo que muestra la portada:
- **`Profile.csv`:** nombre, titular, "Acerca de mí" y ubicación.
- **`Positions.csv`:** la experiencia.
- **`Shares.csv`:** las publicaciones, solo las visibles para cualquiera, como máximo 6 (`--max` para cambiarlo).

Nunca lee la fecha de nacimiento, la dirección ni el correo. Cada carga reemplaza la anterior: para actualizar la portada, exporta de nuevo y vuelve a ejecutarlo.

## Perfil en dos idiomas

LinkedIn exporta un solo idioma, así que `load:linkedin` deja vacío el inglés (la portada en inglés muestra el español). Para escribir el perfil a mano en español e inglés, edita [`content/perfil/perfil.json`](../perfil/perfil.json) y, desde `backend/`:

```
npm run load:profile
```

Si el archivo no trae `"experience"`, la experiencia cargada antes no se toca.
