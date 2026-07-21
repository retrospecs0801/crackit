-- Add new columns to rooms table for recently added features
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS custom_exam_label text;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS max_participants int DEFAULT 6;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS cam_mandatory boolean DEFAULT false NOT NULL;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS focus_mic_lock_enabled boolean DEFAULT true NOT NULL;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS focus_chat_lock_enabled boolean DEFAULT true NOT NULL;
