-- Usuarios con sesión (spec.md, HU-02 a HU-05). Solo existe la cuenta del autor: no hay registro público.
-- La contraseña nunca se guarda en claro: password_hash contiene el resultado de scrypt (ver backend/src/infrastructure/security).

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Correos únicos sin distinguir mayúsculas
CREATE UNIQUE INDEX IF NOT EXISTS users_email_key ON users (lower(email));
