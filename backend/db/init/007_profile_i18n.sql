-- Perfil en inglés (spec.md, HU-18). El español es el idioma base: siempre existe.
-- Las columnas *_en son opcionales: si faltan, la API sirve el texto en español.
-- Una columna por idioma es lo más simple mientras el sitio tenga solo dos (no hace falta una tabla de traducciones).

ALTER TABLE profile
  ADD COLUMN IF NOT EXISTS headline_en TEXT CHECK (headline_en IS NULL OR char_length(headline_en) BETWEEN 2 AND 220),
  ADD COLUMN IF NOT EXISTS summary_en  TEXT;

ALTER TABLE positions
  ADD COLUMN IF NOT EXISTS title_en       TEXT,
  ADD COLUMN IF NOT EXISTS description_en TEXT;
