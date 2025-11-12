-- Run this to check if you applied the fix
-- This will tell you if the policies exist

SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '❌ NO POLICIES FOUND - You need to run RUN-THIS-NOW.sql'
    WHEN COUNT(*) < 4 THEN '⚠️ INCOMPLETE - Only ' || COUNT(*) || ' policies found, need 4'
    ELSE '✅ POLICIES EXIST - ' || COUNT(*) || ' policies found'
  END as status,
  STRING_AGG(policyname || ' (' || cmd || ')', ', ') as policies
FROM pg_policies 
WHERE tablename = 'files';
