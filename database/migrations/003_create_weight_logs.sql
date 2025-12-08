CREATE TABLE IF NOT EXISTS public.weight_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  weight numeric NOT NULL,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT weight_logs_pkey PRIMARY KEY (id),
  CONSTRAINT weight_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_weight_logs_user_date ON public.weight_logs(user_id, log_date);
