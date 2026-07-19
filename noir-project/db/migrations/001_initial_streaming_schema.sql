-- NOIR production-ready PostgreSQL schema blueprint.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email citext UNIQUE NOT NULL,
  password_hash text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user','premium','moderator','admin')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','blocked','deleted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_name text NOT NULL, avatar_url text, maturity_limit int NOT NULL DEFAULT 18,
  locale text NOT NULL DEFAULT 'ru-RU', is_kids boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE oauth_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('google','yandex','vk')), provider_user_id text NOT NULL,
  access_token_hash text, refresh_token_hash text, expires_at timestamptz, UNIQUE(provider, provider_user_id)
);
CREATE TABLE sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash text NOT NULL, ip inet, user_agent text, device_id uuid, expires_at timestamptz NOT NULL, revoked_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE genres (id bigserial PRIMARY KEY, slug text UNIQUE NOT NULL, name text NOT NULL);
CREATE TABLE countries (id bigserial PRIMARY KEY, iso_code char(2) UNIQUE NOT NULL, name text NOT NULL);
CREATE TABLE studios (id bigserial PRIMARY KEY, name text UNIQUE NOT NULL, country_id bigint REFERENCES countries(id));
CREATE TABLE people (id bigserial PRIMARY KEY, name text NOT NULL, original_name text, photo_url text, birth_date date);
CREATE TABLE titles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), type text NOT NULL CHECK (type IN ('movie','series','anime','show')),
  title text NOT NULL, original_title text NOT NULL, slug text UNIQUE NOT NULL, overview text NOT NULL,
  poster_url text, backdrop_url text, logo_url text, age_rating text, release_date date, release_year int,
  runtime_minutes int, status text NOT NULL DEFAULT 'released', popularity numeric(10,3) NOT NULL DEFAULT 0,
  imdb_rating numeric(3,1), noir_rating numeric(3,1), external_tmdb_id text, external_balancer_id text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX titles_search_idx ON titles USING gin (to_tsvector('simple', title || ' ' || original_title || ' ' || overview));
CREATE INDEX titles_popularity_idx ON titles (popularity DESC, release_year DESC);
CREATE TABLE title_genres (title_id uuid REFERENCES titles(id) ON DELETE CASCADE, genre_id bigint REFERENCES genres(id), PRIMARY KEY(title_id, genre_id));
CREATE TABLE title_countries (title_id uuid REFERENCES titles(id) ON DELETE CASCADE, country_id bigint REFERENCES countries(id), PRIMARY KEY(title_id, country_id));
CREATE TABLE title_studios (title_id uuid REFERENCES titles(id) ON DELETE CASCADE, studio_id bigint REFERENCES studios(id), PRIMARY KEY(title_id, studio_id));
CREATE TABLE credits (title_id uuid REFERENCES titles(id) ON DELETE CASCADE, person_id bigint REFERENCES people(id), role text NOT NULL CHECK(role IN ('actor','director','writer','producer')), character_name text, sort_order int DEFAULT 0, PRIMARY KEY(title_id, person_id, role));
CREATE TABLE seasons (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title_id uuid NOT NULL REFERENCES titles(id) ON DELETE CASCADE, season_number int NOT NULL, name text, overview text, poster_url text, release_date date, UNIQUE(title_id, season_number));
CREATE TABLE episodes (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), season_id uuid NOT NULL REFERENCES seasons(id) ON DELETE CASCADE, episode_number int NOT NULL, title text NOT NULL, overview text, still_url text, runtime_minutes int, release_date date, UNIQUE(season_id, episode_number));
CREATE TABLE video_sources (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title_id uuid REFERENCES titles(id) ON DELETE CASCADE, episode_id uuid REFERENCES episodes(id) ON DELETE CASCADE, provider text NOT NULL, external_id text NOT NULL, translation text, quality text, manifest_url text, status text NOT NULL DEFAULT 'available', UNIQUE(provider, external_id, translation, quality));
CREATE TABLE watch_history (profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE, title_id uuid REFERENCES titles(id) ON DELETE CASCADE, episode_id uuid REFERENCES episodes(id) ON DELETE CASCADE, position_seconds int NOT NULL DEFAULT 0, duration_seconds int NOT NULL DEFAULT 0, completed boolean NOT NULL DEFAULT false, updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(profile_id, title_id, episode_id));
CREATE TABLE favorites (profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE, title_id uuid REFERENCES titles(id) ON DELETE CASCADE, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(profile_id, title_id));
CREATE TABLE collections (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL, title text NOT NULL, description text, visibility text NOT NULL DEFAULT 'private');
CREATE TABLE collection_items (collection_id uuid REFERENCES collections(id) ON DELETE CASCADE, title_id uuid REFERENCES titles(id) ON DELETE CASCADE, sort_order int NOT NULL DEFAULT 0, PRIMARY KEY(collection_id, title_id));
CREATE TABLE reviews (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE, title_id uuid REFERENCES titles(id) ON DELETE CASCADE, rating int CHECK(rating BETWEEN 1 AND 10), body text NOT NULL, status text NOT NULL DEFAULT 'published', created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE comments (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE, title_id uuid REFERENCES titles(id) ON DELETE CASCADE, parent_id uuid REFERENCES comments(id) ON DELETE CASCADE, body text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE subscriptions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES users(id) ON DELETE CASCADE, plan text NOT NULL, status text NOT NULL, current_period_end timestamptz);
CREATE TABLE devices (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES users(id) ON DELETE CASCADE, name text, platform text, last_seen_at timestamptz);
CREATE TABLE notifications (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE, type text NOT NULL, payload jsonb NOT NULL DEFAULT '{}', read_at timestamptz, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE search_queries (id bigserial PRIMARY KEY, profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL, query text NOT NULL, result_count int NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE audit_logs (id bigserial PRIMARY KEY, actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL, action text NOT NULL, entity_type text, entity_id text, metadata jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now());
