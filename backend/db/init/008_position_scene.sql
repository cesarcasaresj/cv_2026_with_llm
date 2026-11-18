-- Diorama de cada puesto en el viaje de la experiencia (spec.md, HU-20). Opcional: sin él, la portada usa el escritorio.
-- La lista coincide con LevelScene en contracts/openapi.yaml.

ALTER TABLE positions
  ADD COLUMN IF NOT EXISTS scene TEXT
    CHECK (scene IS NULL OR scene IN ('tower', 'vanity', 'exchange', 'lab', 'antenna', 'billboard', 'phone', 'payment', 'desk'));
