-- Perfil público del autor para la portada (spec.md, HU-14, HU-15 y HU-17).
-- Lo llena `npm run load:linkedin` desde la exportación oficial de LinkedIn: cada carga reemplaza todo.

-- Una sola fila: el sitio es el CV de una persona
CREATE TABLE IF NOT EXISTS profile (
  id         SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  full_name  TEXT NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 120),
  headline   TEXT NOT NULL CHECK (char_length(headline) BETWEEN 2 AND 220),
  location   TEXT,
  summary    TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Experiencia: el día siempre es 1, LinkedIn solo guarda año y mes
CREATE TABLE IF NOT EXISTS positions (
  id          SERIAL PRIMARY KEY,
  company     TEXT NOT NULL,
  title       TEXT NOT NULL,
  location    TEXT,
  description TEXT,
  started_on  DATE NOT NULL,
  finished_on DATE,
  CONSTRAINT positions_dates CHECK (finished_on IS NULL OR finished_on >= started_on)
);

-- Actualidad: publicaciones propias del autor en LinkedIn
CREATE TABLE IF NOT EXISTS profile_updates (
  id           SERIAL PRIMARY KEY,
  published_at TIMESTAMPTZ NOT NULL,
  text         TEXT NOT NULL CHECK (char_length(text) > 0),
  url          TEXT
);

CREATE INDEX IF NOT EXISTS profile_updates_published_idx ON profile_updates (published_at DESC);
