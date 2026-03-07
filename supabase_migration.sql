-- ============================================================
-- Esoterica OS — Database Migration
-- Запусти в Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. userProfiles
CREATE TABLE IF NOT EXISTS "userProfiles" (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "userId"           text UNIQUE NOT NULL,
  "displayName"      text,
  archetype          text DEFAULT 'seeker',
  tradition          text DEFAULT 'eclectic',
  language           text DEFAULT 'en',
  "initiationLevel"  integer DEFAULT 1,
  "practiceStreak"   integer DEFAULT 0,
  "lastPracticeDate" text,
  "totalRituals"     integer DEFAULT 0,
  "createdAt"        timestamptz DEFAULT now(),
  "updatedAt"        timestamptz DEFAULT now()
);
ALTER TABLE "userProfiles" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "userProfiles: owner access" ON "userProfiles"
  USING (auth.uid()::text = "userId")
  WITH CHECK (auth.uid()::text = "userId");

-- 2. rituals
CREATE TABLE IF NOT EXISTS "rituals" (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "userId"     text NOT NULL,
  title        text,
  type         text,
  intention    text,
  "moonPhase"  text,
  "energyLevel" integer,
  outcome      text,
  notes        text,
  "createdAt"  timestamptz DEFAULT now()
);
ALTER TABLE "rituals" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rituals: owner access" ON "rituals"
  USING (auth.uid()::text = "userId")
  WITH CHECK (auth.uid()::text = "userId");

-- 3. journals
CREATE TABLE IF NOT EXISTS "journals" (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "userId"    text NOT NULL,
  title       text,
  content     text,
  type        text,
  mood        text,
  symbols     text,
  "createdAt" timestamptz DEFAULT now()
);
ALTER TABLE "journals" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "journals: owner access" ON "journals"
  USING (auth.uid()::text = "userId")
  WITH CHECK (auth.uid()::text = "userId");

-- 4. sigils
CREATE TABLE IF NOT EXISTS "sigils" (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "userId"    text NOT NULL,
  intention   text,
  "svgData"   text,
  "isCharged" integer DEFAULT 0,
  "chargedAt" timestamptz,
  "createdAt" timestamptz DEFAULT now()
);
ALTER TABLE "sigils" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sigils: owner access" ON "sigils"
  USING (auth.uid()::text = "userId")
  WITH CHECK (auth.uid()::text = "userId");

-- 5. forumCategories (публичное чтение, запись для авторизованных)
CREATE TABLE IF NOT EXISTS "forumCategories" (
  id             text PRIMARY KEY,
  name           text,
  "nameEn"       text,
  "nameRu"       text,
  "descriptionEn" text,
  "descriptionRu" text,
  icon           text DEFAULT '📚',
  "sortOrder"    integer DEFAULT 0,
  "topicCount"   integer DEFAULT 0,
  "postCount"    integer DEFAULT 0,
  "createdBy"    text,
  "createdAt"    timestamptz DEFAULT now(),
  "updatedAt"    timestamptz DEFAULT now()
);
ALTER TABLE "forumCategories" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "forumCategories: public read" ON "forumCategories"
  FOR SELECT USING (true);
CREATE POLICY "forumCategories: auth write" ON "forumCategories"
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "forumCategories: auth update" ON "forumCategories"
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "forumCategories: auth delete" ON "forumCategories"
  FOR DELETE USING (auth.role() = 'authenticated');

-- 6. forumTopics
CREATE TABLE IF NOT EXISTS "forumTopics" (
  id                 text PRIMARY KEY,
  "categoryId"       text REFERENCES "forumCategories"(id) ON DELETE CASCADE,
  "userId"           text NOT NULL,
  title              text,
  content            text,
  "isPinned"         boolean DEFAULT false,
  "isLocked"         boolean DEFAULT false,
  "viewCount"        integer DEFAULT 0,
  "replyCount"       integer DEFAULT 0,
  "lastPostAt"       text,
  "lastPostUserId"   text,
  "createdAt"        timestamptz DEFAULT now(),
  "updatedAt"        timestamptz DEFAULT now()
);
ALTER TABLE "forumTopics" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "forumTopics: auth read" ON "forumTopics"
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "forumTopics: owner insert" ON "forumTopics"
  FOR INSERT WITH CHECK (auth.uid()::text = "userId");
-- UPDATE разрешён всем авторизованным (нужно для viewCount)
CREATE POLICY "forumTopics: auth update" ON "forumTopics"
  FOR UPDATE USING (auth.role() = 'authenticated');

-- 7. forumPosts
CREATE TABLE IF NOT EXISTS "forumPosts" (
  id          text PRIMARY KEY,
  "topicId"   text REFERENCES "forumTopics"(id) ON DELETE CASCADE,
  "userId"    text NOT NULL,
  "parentId"  text,
  content     text,
  "imageUrl"  text,
  "likeCount" integer DEFAULT 0,
  "isDeleted" boolean DEFAULT false,
  "isEdited"  boolean DEFAULT false,
  "editedAt"  timestamptz,
  "createdAt" timestamptz DEFAULT now()
);
ALTER TABLE "forumPosts" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "forumPosts: auth read" ON "forumPosts"
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "forumPosts: owner insert" ON "forumPosts"
  FOR INSERT WITH CHECK (auth.uid()::text = "userId");
-- UPDATE разрешён всем авторизованным (нужно для likeCount)
CREATE POLICY "forumPosts: auth update" ON "forumPosts"
  FOR UPDATE USING (auth.role() = 'authenticated');

-- 8. forumLikes (уникальная пара postId + userId)
CREATE TABLE IF NOT EXISTS "forumLikes" (
  id          text PRIMARY KEY,
  "postId"    text REFERENCES "forumPosts"(id) ON DELETE CASCADE,
  "userId"    text NOT NULL,
  "createdAt" timestamptz DEFAULT now(),
  UNIQUE("postId", "userId")
);
ALTER TABLE "forumLikes" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "forumLikes: auth read" ON "forumLikes"
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "forumLikes: owner write" ON "forumLikes"
  FOR ALL USING (auth.uid()::text = "userId")
  WITH CHECK (auth.uid()::text = "userId");

-- 9. forumNotifications
CREATE TABLE IF NOT EXISTS "forumNotifications" (
  id            text PRIMARY KEY,
  "userId"      text NOT NULL,
  type          text,
  "postId"      text,
  "topicId"     text,
  "fromUserId"  text,
  "isRead"      integer DEFAULT 0,
  "createdAt"   timestamptz DEFAULT now()
);
ALTER TABLE "forumNotifications" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "forumNotifications: owner access" ON "forumNotifications"
  FOR ALL USING (auth.uid()::text = "userId")
  WITH CHECK (auth.uid()::text = "userId");
-- Позволяет другим авторизованным пользователям создавать уведомления для получателя
CREATE POLICY "forumNotifications: auth insert" ON "forumNotifications"
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 10. forumReports
CREATE TABLE IF NOT EXISTS "forumReports" (
  id          text PRIMARY KEY,
  "postId"    text REFERENCES "forumPosts"(id) ON DELETE CASCADE,
  "userId"    text NOT NULL,
  reason      text,
  status      text DEFAULT 'pending',
  "createdAt" timestamptz DEFAULT now()
);
ALTER TABLE "forumReports" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "forumReports: owner read" ON "forumReports"
  FOR SELECT USING (auth.uid()::text = "userId");
CREATE POLICY "forumReports: auth insert" ON "forumReports"
  FOR INSERT WITH CHECK (auth.uid()::text = "userId");

-- 11. badges
CREATE TABLE IF NOT EXISTS "badges" (
  project_id      text PRIMARY KEY,
  badge_eligible  boolean DEFAULT false
);
ALTER TABLE "badges" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "badges: public read" ON "badges"
  FOR SELECT USING (true);

-- ============================================================
-- Seed: начальные категории форума
-- ============================================================
INSERT INTO "forumCategories" (id, name, "nameEn", "nameRu", "descriptionEn", "descriptionRu", icon, "sortOrder")
VALUES
  ('cat_general',   'General',       'General',         'Общее',          'General discussion',           'Общие обсуждения',          '🌐', 1),
  ('cat_rituals',   'Rituals',       'Rituals',         'Ритуалы',        'Share and discuss rituals',    'Ритуалы и практики',        '🕯️', 2),
  ('cat_dreams',    'Dream Journal', 'Dream Journal',   'Сны',            'Dream interpretations',        'Интерпретация снов',        '🌙', 3),
  ('cat_sigils',    'Sigil Lab',     'Sigil Lab',       'Сигилы',         'Sigil creation and charging',  'Создание и зарядка сигилов','✨', 4),
  ('cat_astrology', 'Astrology',     'Astrology',       'Астрология',     'Astrology and moon cycles',    'Астрология и циклы луны',   '⭐', 5)
ON CONFLICT (id) DO NOTHING;
