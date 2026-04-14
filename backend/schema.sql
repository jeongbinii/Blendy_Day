-- Blendy Day 데이터베이스 스키마
-- Supabase SQL Editor에서 실행하세요

CREATE TABLE users (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname       TEXT        NOT NULL,
  gender         TEXT,
  age            INT,
  hashtags       TEXT[]      NOT NULL DEFAULT '{}',
  custom_tags    TEXT[]      NOT NULL DEFAULT '{}',
  match_count    INT         NOT NULL DEFAULT 3,
  match_reset_at DATE        NOT NULL DEFAULT CURRENT_DATE,
  is_premium     BOOLEAN     NOT NULL DEFAULT FALSE,
  premium_until  TIMESTAMPTZ
);

-- 기존 유저에도 컬럼 추가 (이미 users 테이블이 있는 경우만 실행)
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS match_reset_at DATE NOT NULL DEFAULT CURRENT_DATE;

CREATE TABLE diaries (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id),
  content     TEXT        NOT NULL,
  mood        TEXT        NOT NULL,
  tags        TEXT[]      NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE rooms (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id   UUID        NOT NULL REFERENCES users(id),
  user_b_id   UUID        NOT NULL REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status      TEXT        NOT NULL DEFAULT 'active'
);

CREATE TABLE messages (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id     UUID        NOT NULL REFERENCES rooms(id),
  sender_id   UUID        NOT NULL REFERENCES users(id),
  content     TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
