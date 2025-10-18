WITH normalized AS (
  SELECT id, license,
    UPPER(REGEXP_REPLACE(COALESCE(license, ''), '[^A-Z0-9]', '', 'g')) AS license_norm
  FROM public.drivers
)
SELECT license_norm, COUNT(*) AS cnt
FROM normalized
GROUP BY license_norm
HAVING COUNT(*) > 1;

CREATE UNIQUE INDEX IF NOT EXISTS drivers_license_norm_unique_idx
ON public.drivers (
  (UPPER(REGEXP_REPLACE(COALESCE(license, ''), '[^A-Z0-9]', '', 'g')))
);

ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS license_norm text
    GENERATED ALWAYS AS (UPPER(REGEXP_REPLACE(COALESCE(license, ''), '[^A-Z0-9]', '', 'g'))) STORED;

CREATE UNIQUE INDEX IF NOT EXISTS drivers_license_norm_unique_idx
ON public.drivers(license_norm);

WITH normalized_vehicles AS (
  SELECT id, plate,
    UPPER(REGEXP_REPLACE(COALESCE(plate, ''), '[^A-Z0-9]', '', 'g')) AS plate_norm
  FROM public.vehicles
)
SELECT plate_norm, COUNT(*) AS cnt
FROM normalized_vehicles
GROUP BY plate_norm
HAVING COUNT(*) > 1;

CREATE UNIQUE INDEX IF NOT EXISTS vehicles_plate_norm_unique_idx
ON public.vehicles (
  (UPPER(REGEXP_REPLACE(COALESCE(plate, ''), '[^A-Z0-9]', '', 'g')))
);

ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS plate_norm text
    GENERATED ALWAYS AS (UPPER(REGEXP_REPLACE(COALESCE(plate, ''), '[^A-Z0-9]', '', 'g'))) STORED;

CREATE UNIQUE INDEX IF NOT EXISTS vehicles_plate_norm_unique_idx
ON public.vehicles(plate_norm);

-- unique_constraints.sql
-- SQL to add normalized, case-insensitive uniqueness for driver license and vehicle plate.

-- 0) Quick sanity check: find normalized driver-license duplicates
WITH normalized AS (
  SELECT id, license,
    UPPER(REGEXP_REPLACE(COALESCE(license, ''), '[^A-Z0-9]', '', 'g')) AS license_norm
  FROM public.drivers
)
SELECT license_norm, COUNT(*) AS cnt
FROM normalized
GROUP BY license_norm
HAVING COUNT(*) > 1;

-- 1) Functional unique index
CREATE UNIQUE INDEX IF NOT EXISTS drivers_license_norm_unique_idx
ON public.drivers (
  (UPPER(REGEXP_REPLACE(COALESCE(license, ''), '[^A-Z0-9]', '', 'g')))
);

-- CONCURRENTLY variant (non-blocking) - cannot run inside a transaction
-- CREATE UNIQUE INDEX CONCURRENTLY drivers_license_norm_unique_idx
-- ON public.drivers (
--   (UPPER(REGEXP_REPLACE(COALESCE(license, ''), '[^A-Z0-9]', '', 'g')))
-- );

-- 2) Generated column + unique index
ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS license_norm text
    GENERATED ALWAYS AS (UPPER(REGEXP_REPLACE(COALESCE(license, ''), '[^A-Z0-9]', '', 'g'))) STORED;

CREATE UNIQUE INDEX IF NOT EXISTS drivers_license_norm_unique_idx
ON public.drivers(license_norm);

-- Optional: Normalization trigger example (create once if desired)
-- CREATE OR REPLACE FUNCTION public.normalize_driver_license()
-- RETURNS trigger AS $$
-- BEGIN
--   IF NEW.license IS NOT NULL THEN
--     NEW.license := UPPER(REGEXP_REPLACE(NEW.license, '[^A-Z0-9]', '', 'g'));
--   END IF;
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- Quick test (try inserting a duplicate normalized value):
-- INSERT INTO public.drivers (name, email, license, contact, status)
-- VALUES ('Test', 'test@example.com', 'sa1000005', '000', 'available');

-- Vehicle plate sanity check:
WITH normalized_vehicles AS (
  SELECT id, plate,
    UPPER(REGEXP_REPLACE(COALESCE(plate, ''), '[^A-Z0-9]', '', 'g')) AS plate_norm
  FROM public.vehicles
)
SELECT plate_norm, COUNT(*) AS cnt
FROM normalized_vehicles
GROUP BY plate_norm
HAVING COUNT(*) > 1;

-- Functional index for vehicle plates:
CREATE UNIQUE INDEX IF NOT EXISTS vehicles_plate_norm_unique_idx
ON public.vehicles (
  (UPPER(REGEXP_REPLACE(COALESCE(plate, ''), '[^A-Z0-9]', '', 'g')))
);

-- Generated column + index for vehicles example:
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS plate_norm text
    GENERATED ALWAYS AS (UPPER(REGEXP_REPLACE(COALESCE(plate, ''), '[^A-Z0-9]', '', 'g'))) STORED;

CREATE UNIQUE INDEX IF NOT EXISTS vehicles_plate_norm_unique_idx
ON public.vehicles(plate_norm);

-- End of file


