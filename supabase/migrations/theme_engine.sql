-- Migration: Add theme support to userProfiles
-- Run this in your Supabase SQL Editor

-- 1. Add themeId column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'userProfiles' AND column_name = 'themeId') THEN
    ALTER TABLE "userProfiles" ADD COLUMN "themeId" TEXT DEFAULT 'void';
  END IF;
END $$;

-- 2. Update existing profiles to have a default theme
UPDATE "userProfiles" SET "themeId" = 'void' WHERE "themeId" IS NULL;

-- 3. (Optional) Create a metadata table for premium themes or unlockable themes
CREATE TABLE IF NOT EXISTS "userUnlockedThemes" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  "themeId" TEXT NOT NULL,
  "unlockedAt" TIMESTAMPTZ DEFAULT now(),
  UNIQUE("userId", "themeId")
);

-- 4. RLS for unlocked themes
ALTER TABLE "userUnlockedThemes" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own unlocked themes"
  ON "userUnlockedThemes" FOR SELECT
  USING (auth.uid() = "userId");

CREATE POLICY "System can unlock themes for users"
  ON "userUnlockedThemes" FOR INSERT
  WITH CHECK (auth.uid() = "userId");
