/*
  # Create favorites table

  1. New Tables
    - `favorites`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `auction_id` (text, not null)
      - `auction_type` (text, 'property' or 'vehicle')
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `favorites` table
    - Add policy for users to manage their own favorites
    - Add unique constraint to prevent duplicate favorites

  3. Indexes
    - Index on user_id for fast user queries
    - Index on auction_id for fast auction queries
    - Composite index on user_id + auction_id for uniqueness
*/

-- Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  auction_id text NOT NULL,
  auction_type text NOT NULL CHECK (auction_type IN ('property', 'vehicle')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Create unique constraint to prevent duplicate favorites
CREATE UNIQUE INDEX IF NOT EXISTS idx_favorites_user_auction 
  ON favorites(user_id, auction_id);

-- Create policies
CREATE POLICY "Users can read own favorites"
  ON favorites
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
  ON favorites
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON favorites
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_auction_id ON favorites(auction_id);
CREATE INDEX IF NOT EXISTS idx_favorites_auction_type ON favorites(auction_type);
CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON favorites(created_at DESC);