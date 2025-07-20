-- Add unique constraint on name column for boundaries table
ALTER TABLE public.boundaries ADD CONSTRAINT boundaries_name_unique UNIQUE (name);