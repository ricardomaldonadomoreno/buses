-- Drop existing RESTRICTIVE policies on users table
DROP POLICY IF EXISTS "Users can insert own record" ON users;
DROP POLICY IF EXISTS "Users can update own record" ON users;
DROP POLICY IF EXISTS "Users can view own record" ON users;

-- Create PERMISSIVE policies for users table
CREATE POLICY "Users can insert own record"
ON users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own record"
ON users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own record"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Drop existing RESTRICTIVE policies on wemove_transporters table
DROP POLICY IF EXISTS "Transporters can insert own record" ON wemove_transporters;
DROP POLICY IF EXISTS "Transporters can update own record" ON wemove_transporters;
DROP POLICY IF EXISTS "Transporters can view own record" ON wemove_transporters;

-- Create PERMISSIVE policies for wemove_transporters table
CREATE POLICY "Transporters can insert own record"
ON wemove_transporters
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Transporters can view own record"
ON wemove_transporters
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Transporters can update own record"
ON wemove_transporters
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);