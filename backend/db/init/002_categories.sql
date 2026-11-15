-- Categorías: cada publicación pertenece a exactamente una (spec.md, HU-06 a HU-09).
-- Se ejecuta después de 001_create_posts.sql, así que también funciona sobre una base ya creada.

CREATE TABLE IF NOT EXISTS categories (
  id   SERIAL PRIMARY KEY,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 40),
  slug TEXT NOT NULL UNIQUE
);

-- Nombres únicos sin distinguir mayúsculas (spec.md, HU-09)
CREATE UNIQUE INDEX IF NOT EXISTS categories_name_key ON categories (lower(name));

-- Categoría provisional para las publicaciones que ya existían; el autor la reasigna (HU-08)
INSERT INTO categories (name, slug) VALUES ('Sin clasificar', 'sin-clasificar')
  ON CONFLICT (slug) DO NOTHING;

ALTER TABLE posts ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES categories (id);

UPDATE posts
   SET category_id = (SELECT id FROM categories WHERE slug = 'sin-clasificar')
 WHERE category_id IS NULL;

-- Obligatoria: una publicación siempre tiene categoría (spec.md, §7 decisión B)
ALTER TABLE posts ALTER COLUMN category_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS posts_category_id_idx ON posts (category_id);
