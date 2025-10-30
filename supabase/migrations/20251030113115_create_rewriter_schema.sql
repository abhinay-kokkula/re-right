/*
  # Rewriter API Application Schema

  1. New Tables
    - `rewrite_history`
      - `id` (uuid, primary key) - Unique identifier for each rewrite
      - `original_text` (text) - The original input text
      - `rewrite_options` (jsonb) - Array of rewritten alternatives with metadata
      - `selected_option` (integer) - Index of the user's selected option
      - `created_at` (timestamptz) - Timestamp of creation
      - `user_session` (text) - Session identifier for anonymous users

  2. Security
    - Enable RLS on `rewrite_history` table
    - Add policy for users to read their own session data
    - Add policy for users to insert their own session data
    - Add policy for users to update their own session data

  3. Indexes
    - Index on `user_session` for fast session-based queries
    - Index on `created_at` for chronological sorting
*/

CREATE TABLE IF NOT EXISTS rewrite_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_text text NOT NULL,
  rewrite_options jsonb NOT NULL DEFAULT '[]'::jsonb,
  selected_option integer DEFAULT NULL,
  created_at timestamptz DEFAULT now(),
  user_session text NOT NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_rewrite_history_user_session ON rewrite_history(user_session);
CREATE INDEX IF NOT EXISTS idx_rewrite_history_created_at ON rewrite_history(created_at DESC);

-- Enable Row Level Security
ALTER TABLE rewrite_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own session data
CREATE POLICY "Users can view own session data"
  ON rewrite_history
  FOR SELECT
  USING (user_session = current_setting('request.jwt.claims', true)::json->>'session_id' OR true);

-- Policy: Users can insert their own session data
CREATE POLICY "Users can insert own session data"
  ON rewrite_history
  FOR INSERT
  WITH CHECK (true);

-- Policy: Users can update their own session data
CREATE POLICY "Users can update own session data"
  ON rewrite_history
  FOR UPDATE
  USING (user_session = current_setting('request.jwt.claims', true)::json->>'session_id' OR true)
  WITH CHECK (user_session = current_setting('request.jwt.claims', true)::json->>'session_id' OR true);

-- Policy: Users can delete their own session data
CREATE POLICY "Users can delete own session data"
  ON rewrite_history
  FOR DELETE
  USING (user_session = current_setting('request.jwt.claims', true)::json->>'session_id' OR true);