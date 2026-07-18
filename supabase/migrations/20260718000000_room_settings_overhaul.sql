-- Overhaul rooms table schema for new room settings & welcome message
ALTER TABLE public.rooms DROP COLUMN IF EXISTS description;

ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS welcome_message_enabled boolean DEFAULT false NOT NULL;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS welcome_message_text text;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS mic_disabled boolean DEFAULT false NOT NULL;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS camera_disabled boolean DEFAULT false NOT NULL;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS chat_disabled boolean DEFAULT false NOT NULL;
