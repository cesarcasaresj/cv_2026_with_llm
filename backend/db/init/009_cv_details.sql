-- El CV completo en la portada, igual que el PDF para reclutadores (spec.md, HU-26).
-- Cada puesto: cliente (si lo hubo) y logros en viñetas. El perfil: habilidades, educación e idiomas.
-- Las columnas *_en guardan el inglés; si están vacías, la portada en inglés muestra el español.

ALTER TABLE positions
  ADD COLUMN IF NOT EXISTS client        TEXT,
  ADD COLUMN IF NOT EXISTS client_en     TEXT,
  ADD COLUMN IF NOT EXISTS highlights    TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS highlights_en TEXT[];

-- { "skills": [{ "group": "…", "items": ["…"] }], "education": [{ "degree", "school", "year" }], "languages": [{ "name", "level" }] }
ALTER TABLE profile
  ADD COLUMN IF NOT EXISTS details    JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS details_en JSONB;
