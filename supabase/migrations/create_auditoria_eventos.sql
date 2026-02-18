CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.auditoria_eventos (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamptz NOT NULL DEFAULT now(),
  hospital_id uuid NULL,
  usuario_id uuid NULL,
  usuario_email text NULL,
  role text NULL,
  session_id text NULL,
  view text NULL,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id text NULL,
  payload jsonb NULL,
  meta jsonb NULL,
  user_agent text NULL,
  client_ts timestamptz NULL
);

CREATE INDEX IF NOT EXISTS idx_auditoria_eventos_created_at ON public.auditoria_eventos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_eventos_hospital_id ON public.auditoria_eventos(hospital_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_eventos_usuario_email ON public.auditoria_eventos(usuario_email);
CREATE INDEX IF NOT EXISTS idx_auditoria_eventos_session_id ON public.auditoria_eventos(session_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_eventos_entity ON public.auditoria_eventos(entity);
CREATE INDEX IF NOT EXISTS idx_auditoria_eventos_action ON public.auditoria_eventos(action);

GRANT SELECT, INSERT ON TABLE public.auditoria_eventos TO anon, authenticated;

