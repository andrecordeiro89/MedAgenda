-- MedAgenda: Tabela de vínculo usuário ↔ hospital (multi-hospital)
-- Cria relacionamento muitos-para-muitos e papel por hospital

CREATE TABLE IF NOT EXISTS public.usuario_hospitais (
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES public.hospitais(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN (
    'admin','coordenacao','diretoria','diretriz',
    'faturamento','faturamento_local','agendamento_local',
    'recepcao','triagem','anestesista'
  )),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (usuario_id, hospital_id)
);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_usuario_hospitais_usuario ON public.usuario_hospitais(usuario_id);
CREATE INDEX IF NOT EXISTS idx_usuario_hospitais_hospital ON public.usuario_hospitais(hospital_id);

-- Observação:
-- 1) Mantenha usuarios.hospital_id como hospital padrão (UX)
-- 2) Popular usuario_hospitais com os hospitais acessíveis por cada usuário
-- 3) Roles são por hospital, compatíveis com regras de acesso atuais do frontend

