-- ============================================================
-- Migration 014c: Fix client self-join RLS on trainer_clients
-- The INSERT policy was missing for clients joining via invite code.
-- Run this in Supabase SQL Editor AFTER 014.
-- ============================================================

-- Allow a client to INSERT a row where they are the client
DROP POLICY IF EXISTS "Client inserts own join request" ON public.trainer_clients;

CREATE POLICY "Client inserts own join request"
  ON public.trainer_clients FOR INSERT
  WITH CHECK (client_id = auth.uid());
