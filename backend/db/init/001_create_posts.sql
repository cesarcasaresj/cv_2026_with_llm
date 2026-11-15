-- Se ejecuta automáticamente la primera vez que se crea el contenedor de PostgreSQL.
CREATE TABLE IF NOT EXISTS posts (
  id         SERIAL PRIMARY KEY,
  title      TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Datos de ejemplo para desarrollo
INSERT INTO posts (title) VALUES
  ('Primer post de ejemplo'),
  ('Segundo post de ejemplo');
