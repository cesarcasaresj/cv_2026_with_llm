-- Artículos completos: anatomía, SEO, accesibilidad y etiquetas (spec.md, §5.1 y HU-10 a HU-13).

-- Nombre visible del autor (artículo y JSON-LD). El correo nunca se publica.
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT;

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS slug                TEXT,
  ADD COLUMN IF NOT EXISTS seo_title           TEXT,
  ADD COLUMN IF NOT EXISTS description         TEXT,
  ADD COLUMN IF NOT EXISTS body_markdown       TEXT,
  ADD COLUMN IF NOT EXISTS cover_image_path    TEXT,
  ADD COLUMN IF NOT EXISTS cover_image_alt     TEXT,
  ADD COLUMN IF NOT EXISTS cover_is_decorative BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cover_width         INTEGER,
  ADD COLUMN IF NOT EXISTS cover_height        INTEGER,
  ADD COLUMN IF NOT EXISTS author_id           INTEGER REFERENCES users (id),
  ADD COLUMN IF NOT EXISTS status              TEXT NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS published_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at          TIMESTAMPTZ NOT NULL DEFAULT now();

-- Las publicaciones de ejemplo anteriores no tienen descripción ni cuerpo: quedan como borrador
UPDATE posts SET slug = 'borrador-' || id WHERE slug IS NULL;
ALTER TABLE posts ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS posts_slug_key ON posts (slug);
CREATE INDEX IF NOT EXISTS posts_published_idx ON posts (status, published_at DESC);

-- Reglas de la anatomía del artículo (spec.md, §5.1). Con nombre, para poder recrearlas.
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_status_check;
ALTER TABLE posts ADD CONSTRAINT posts_status_check CHECK (status IN ('draft', 'published'));

ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_slug_format;
ALTER TABLE posts ADD CONSTRAINT posts_slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_title_length;
ALTER TABLE posts ADD CONSTRAINT posts_title_length CHECK (char_length(title) BETWEEN 10 AND 110);

ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_seo_title_length;
ALTER TABLE posts ADD CONSTRAINT posts_seo_title_length CHECK (seo_title IS NULL OR char_length(seo_title) <= 60);

-- Publicar exige lo que necesitan la página, el SEO y el JSON-LD
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_published_complete;
ALTER TABLE posts ADD CONSTRAINT posts_published_complete CHECK (
  status = 'draft' OR (
        char_length(description) BETWEEN 50 AND 160
    AND body_markdown IS NOT NULL
    AND author_id IS NOT NULL
    AND published_at IS NOT NULL
  )
);

-- Una portada necesita tamaño (evita saltos de diseño) y alt, salvo que sea decorativa (HU-13)
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_cover_complete;
ALTER TABLE posts ADD CONSTRAINT posts_cover_complete CHECK (
  cover_image_path IS NULL OR (
        cover_width > 0
    AND cover_height > 0
    AND (cover_is_decorative OR char_length(coalesce(cover_image_alt, '')) > 0)
  )
);

-- Etiquetas: taxonomía secundaria, muchos a muchos (HU-11). El máximo de 10 por artículo lo aplica el script de carga.
CREATE TABLE IF NOT EXISTS tags (
  id   SERIAL PRIMARY KEY,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 40),
  slug TEXT NOT NULL UNIQUE
);
CREATE UNIQUE INDEX IF NOT EXISTS tags_name_key ON tags (lower(name));

CREATE TABLE IF NOT EXISTS post_tags (
  post_id INTEGER NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
  tag_id  INTEGER NOT NULL REFERENCES tags (id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);
CREATE INDEX IF NOT EXISTS post_tags_tag_id_idx ON post_tags (tag_id);
