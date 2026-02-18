import React, { useState, createContext, useContext, ReactNode, useEffect } from 'react';
import { usuarioService, usuarioHospitaisService, supabase, auditService } from '../services/supabase';
import ImageWithFallback from './ImageWithFallback';
import { Button, Input, Card } from './ui';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================
export type UserRole = 'admin' | 'recepcao' | 'triagem' | 'faturamento' | 'faturamento_local' | 'agendamento_local' | 'coordenacao' | 'diretoria' | 'diretriz' | 'anestesista';

interface Hospital {
  id: string;
  nome: string;
  cidade: string;
  cnpj: string;
}

interface Usuario {
  id: string;
  email: string;
  hospital_id: string;
  hospital?: Hospital;
  role: UserRole; // Novo campo para controle de acesso
}

interface AuthContextType {
  usuario: Usuario | null;
  hospitalSelecionado: Hospital | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  userRole: UserRole | null; // Novo campo para facilitar acesso
  hospitaisDisponiveis: Hospital[];
  login: (email: string) => Promise<void>;
  selecionarHospital: (hospital: Hospital) => void;
  logout: () => void;
}

interface LoginResponse {
  success: boolean;
  data: {
    usuario: Usuario;
    hospitais: Hospital[];
  };
  message?: string;
  error?: string;
}

// ============================================================================
// CONTEXT DE AUTENTICAÇÃO PREMIUM
// ============================================================================
const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};

// ============================================================================
// PROVIDER DE AUTENTICAÇÃO
// ============================================================================
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [hospitalSelecionado, setHospitalSelecionado] = useState<Hospital | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hospitaisDisponiveis, setHospitaisDisponiveis] = useState<Hospital[]>([]);
  const [rolesPorHospital, setRolesPorHospital] = useState<Record<string, UserRole>>({});

  // PERSISTÊNCIA: Carregar dados do localStorage ao inicializar
  useEffect(() => {
    const savedAuth = localStorage.getItem('medagenda-auth');
    if (savedAuth) {
      try {
        const authData = JSON.parse(savedAuth);
        setUsuario(authData.usuario);
        setHospitalSelecionado(authData.hospital);
        setHospitaisDisponiveis(authData.hospitais || []);
        setRolesPorHospital(authData.roles || {});
        setIsAuthenticated(true);
        console.log('🔄 Login restaurado do localStorage:', authData.hospital.nome);
      } catch (error) {
        console.error('Erro ao restaurar login:', error);
        localStorage.removeItem('medagenda-auth');
      }
    }
  }, []);

  const login = async (email: string): Promise<void> => {
    setIsLoading(true);
    try {
      const usuarioDb = await usuarioService.getByEmail(email);
      if (usuarioDb?.id) {
        const vinculos = await usuarioHospitaisService.getByUsuarioId(usuarioDb.id);
        let hospitais = vinculos.map(v => ({ id: v.hospital.id, nome: v.hospital.nome, cidade: v.hospital.cidade, cnpj: v.hospital.cnpj }));
        let rolesMap: Record<string, UserRole> = {};
        vinculos.forEach(v => { rolesMap[v.hospital.id] = v.role as UserRole; });

        if (hospitais.length < 2) {
          const MULTI_EMAIL_HOSPITAL_IDS: Record<string, { ids: string[]; role: UserRole }> = {
            'coordenacao@medagenda.com': { ids: [
              '3ea8c82a-02dd-41c3-9247-1ae07a1ecaba','4111b99d-8b4a-4b51-9561-a2fbd14e776e','4a2527c1-df09-4a36-a08f-adc63f555123','54ccade1-9f7a-47c7-9bba-7fe02bfa9eb7','8c4ddaaf-33cf-47e4-8c42-9ca31b244d4a','933de4fb-ebfd-4838-bb43-153a7354d333','bbe11a40-2689-48af-9aa8-5c6e7f2e48da','ece028c8-3c6d-4d0a-98aa-efaa3565b55f','09ab26a8-8c2c-4a67-94f7-d450a1be328e' ], role: 'coordenacao' },
            'diretoria@medagenda.com': { ids: [
              '3ea8c82a-02dd-41c3-9247-1ae07a1ecaba','4111b99d-8b4a-4b51-9561-a2fbd14e776e','4a2527c1-df09-4a36-a08f-adc63f555123','54ccade1-9f7a-47c7-9bba-7fe02bfa9eb7','8c4ddaaf-33cf-47e4-8c42-9ca31b244d4a','933de4fb-ebfd-4838-bb43-153a7354d333','bbe11a40-2689-48af-9aa8-5c6e7f2e48da','ece028c8-3c6d-4d0a-98aa-efaa3565b55f','09ab26a8-8c2c-4a67-94f7-d450a1be328e' ], role: 'diretoria' },
            'juliane@medagenda.com': { ids: [
              '3ea8c82a-02dd-41c3-9247-1ae07a1ecaba','4111b99d-8b4a-4b51-9561-a2fbd14e776e','4a2527c1-df09-4a36-a08f-adc63f555123','54ccade1-9f7a-47c7-9bba-7fe02bfa9eb7','8c4ddaaf-33cf-47e4-8c42-9ca31b244d4a','933de4fb-ebfd-4838-bb43-153a7354d333','bbe11a40-2689-48af-9aa8-5c6e7f2e48da','ece028c8-3c6d-4d0a-98aa-efaa3565b55f','09ab26a8-8c2c-4a67-94f7-d450a1be328e' ], role: 'diretoria' },
            'helluany@medagenda.com': { ids: ['933de4fb-ebfd-4838-bb43-153a7354d333','ece028c8-3c6d-4d0a-98aa-efaa3565b55f'], role: 'diretoria' },
            'sabrina@medagenda.com': { ids: ['933de4fb-ebfd-4838-bb43-153a7354d333','4a2527c1-df09-4a36-a08f-adc63f555123'], role: 'faturamento_local' },
            'faturamento@medagenda.com': { ids: [
              '3ea8c82a-02dd-41c3-9247-1ae07a1ecaba','4111b99d-8b4a-4b51-9561-a2fbd14e776e','4a2527c1-df09-4a36-a08f-adc63f555123','54ccade1-9f7a-47c7-9bba-7fe02bfa9eb7','8c4ddaaf-33cf-47e4-8c42-9ca31b244d4a','933de4fb-ebfd-4838-bb43-153a7354d333','bbe11a40-2689-48af-9aa8-5c6e7f2e48da','ece028c8-3c6d-4d0a-98aa-efaa3565b55f','09ab26a8-8c2c-4a67-94f7-d450a1be328e' ], role: 'faturamento' },
            'faturamento01@medagenda.com': { ids: [
              '3ea8c82a-02dd-41c3-9247-1ae07a1ecaba','4111b99d-8b4a-4b51-9561-a2fbd14e776e','4a2527c1-df09-4a36-a08f-adc63f555123','54ccade1-9f7a-47c7-9bba-7fe02bfa9eb7','8c4ddaaf-33cf-47e4-8c42-9ca31b244d4a','933de4fb-ebfd-4838-bb43-153a7354d333','bbe11a40-2689-48af-9aa8-5c6e7f2e48da','ece028c8-3c6d-4d0a-98aa-efaa3565b55f','09ab26a8-8c2c-4a67-94f7-d450a1be328e' ], role: 'faturamento' },
          };
          const fallback = MULTI_EMAIL_HOSPITAL_IDS[email.toLowerCase()];
          if (fallback) {
            const { data: allHosp } = await supabase
              .from('hospitais')
              .select('id, nome, cidade, cnpj');
            const map = new Map<string, any>();
            (allHosp || []).forEach((h: any) => map.set(h.id, h));
            hospitais = fallback.ids.map(id => map.get(id)).filter(Boolean);
            hospitais.forEach(h => { rolesMap[h.id] = fallback.role; });
          }
        }

        if (hospitais.length > 0) {
          setRolesPorHospital(rolesMap);
          const hospitalInicial = hospitais[0];
          const roleInicial = rolesMap[hospitalInicial.id] || 'admin';
          const usuarioSupabase: Usuario = {
            id: usuarioDb.id,
            email: usuarioDb.email,
            hospital_id: hospitalInicial.id,
            hospital: hospitalInicial,
            role: roleInicial
          };
          const sessionId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
          setUsuario(usuarioSupabase);
          setHospitalSelecionado(hospitalInicial);
          setHospitaisDisponiveis(hospitais);
          setIsAuthenticated(true);
          localStorage.setItem('medagenda-auth', JSON.stringify({
            usuario: usuarioSupabase,
            hospital: hospitalInicial,
            hospitais,
            roles: rolesMap,
            sessionId
          }));
          auditService.log({
            action: 'LOGIN',
            entity: 'auth',
            entity_id: usuarioDb.id,
            hospital_id: hospitalInicial.id,
            meta: { source: 'usuarios/usuario_hospitais' }
          });
          setIsLoading(false);
          return;
        }
      }
      // Sistema simples sem autenticação real - mapear email para hospital + role
      const emailHospitalMap: { [key: string]: { id: string; nome: string; cidade: string; cnpj: string; role: UserRole } } = {
        // Hospitais de exemplo (manter para compatibilidade)
        'admin@hospitalsaopaulo.com': {
          id: '550e8400-e29b-41d4-a716-446655440001',
          nome: 'Hospital São Paulo',
          cidade: 'São Paulo',
          cnpj: '12.345.678/0001-90',
          role: 'admin'
        },
        'admin@hospitalrio.com': {
          id: '550e8400-e29b-41d4-a716-446655440002',
          nome: 'Hospital Rio de Janeiro',
          cidade: 'Rio de Janeiro',
          cnpj: '98.765.432/0001-10',
          role: 'admin'
        },
        'admin@hospitalbrasilia.com': {
          id: '550e8400-e29b-41d4-a716-446655440003',
          nome: 'Hospital Brasília',
          cidade: 'Brasília',
          cnpj: '11.222.333/0001-44',
          role: 'admin'
        },
        // Hospitais reais com IDs do banco
        'agendamento.sm@medagenda.com': {
          id: '3ea8c82a-02dd-41c3-9247-1ae07a1ecaba',
          nome: 'Hospital Municipal Santa Alice',
          cidade: 'Santa Mariana',
          cnpj: '14.736.446/0001-93',
          role: 'admin'
        },
        'agendamento.fax@medagenda.com': {
          id: '4111b99d-8b4a-4b51-9561-a2fbd14e776e',
          nome: 'Hospital Municipal Juarez Barreto de Macedo',
          cidade: 'Faxinal',
          cnpj: '14.736.446/0006-06',
          role: 'admin'
        },
        'agendamento.car@medagenda.com': {
          id: 'bbe11a40-2689-48af-9aa8-5c6e7f2e48da',
          nome: 'Hospital Municipal São José',
          cidade: 'Carlópolis',
          cnpj: '14.736.446/0007-89',
          role: 'admin'
        },
        'agendamento.ara@medagenda.com': {
          id: '8c4ddaaf-33cf-47e4-8c42-9ca31b244d4a',
          nome: 'Hospital Municipal 18 de Dezembro',
          cidade: 'Arapoti',
          cnpj: '14.736.446/0008-60',
          role: 'admin'
        },
        
        'agendamento.foz@medagenda.com': {
          id: 'ece028c8-3c6d-4d0a-98aa-efaa3565b55f',
          nome: 'Hospital Nossa Senhora Aparecida',
          cidade: 'Foz do Iguaçu',
          cnpj: '14.736.446/0009-40',
          role: 'agendamento_local'
        },
        'douglas.foz@medagenda.com': {
          id: 'ece028c8-3c6d-4d0a-98aa-efaa3565b55f',
          nome: 'Hospital Nossa Senhora Aparecida',
          cidade: 'Foz do Iguaçu',
          cnpj: '14.736.446/0009-40',
          role: 'anestesista'
        },
        'willer.foz@medagenda.com': {
          id: 'ece028c8-3c6d-4d0a-98aa-efaa3565b55f',
          nome: 'Hospital Nossa Senhora Aparecida',
          cidade: 'Foz do Iguaçu',
          cnpj: '14.736.446/0009-40',
          role: 'anestesista'
        },
        'lianara.foz@medagenda.com': {
          id: 'ece028c8-3c6d-4d0a-98aa-efaa3565b55f',
          nome: 'Hospital Nossa Senhora Aparecida',
          cidade: 'Foz do Iguaçu',
          cnpj: '14.736.446/0009-40',
          role: 'anestesista'
        },
        'recepcao.foz@medagenda.com': {
          id: 'ece028c8-3c6d-4d0a-98aa-efaa3565b55f',
          nome: 'Hospital Nossa Senhora Aparecida',
          cidade: 'Foz do Iguaçu',
          cnpj: '14.736.446/0009-40',
          role: 'recepcao' // ✅ Acesso restrito: Dashboard + Documentação
        },
        'triagem.foz@medagenda.com': {
          id: 'ece028c8-3c6d-4d0a-98aa-efaa3565b55f',
          nome: 'Hospital Nossa Senhora Aparecida',
          cidade: 'Foz do Iguaçu',
          cnpj: '14.736.446/0009-40',
          role: 'triagem' // ✅ Acesso restrito: Dashboard + Documentação
        },
        'tifoz@medagenda.com': {
          id: 'ece028c8-3c6d-4d0a-98aa-efaa3565b55f',
          nome: 'Hospital Nossa Senhora Aparecida',
          cidade: 'Foz do Iguaçu',
          cnpj: '14.736.446/0009-40',
          role: 'admin' // 🔧 Usuário TI - Acesso total + permissão especial para editar procedimentos base
        },
        'foz.ana.carolina@medagenda.com': {
          id: 'ece028c8-3c6d-4d0a-98aa-efaa3565b55f',
          nome: 'Hospital Nossa Senhora Aparecida',
          cidade: 'Foz do Iguaçu',
          cnpj: '14.736.446/0009-40',
          role: 'admin'
        },
        'foz.marcia@medagenda.com': {
          id: 'ece028c8-3c6d-4d0a-98aa-efaa3565b55f',
          nome: 'Hospital Nossa Senhora Aparecida',
          cidade: 'Foz do Iguaçu',
          cnpj: '14.736.446/0009-40',
          role: 'triagem'
        },
        'foz.roger@medagenda.com': {
          id: 'ece028c8-3c6d-4d0a-98aa-efaa3565b55f',
          nome: 'Hospital Nossa Senhora Aparecida',
          cidade: 'Foz do Iguaçu',
          cnpj: '14.736.446/0009-40',
          role: 'triagem'
        },
        'foz.mateus@medagenda.com': {
          id: 'ece028c8-3c6d-4d0a-98aa-efaa3565b55f',
          nome: 'Hospital Nossa Senhora Aparecida',
          cidade: 'Foz do Iguaçu',
          cnpj: '14.736.446/0009-40',
          role: 'triagem'
        },
        'foz.tamiris@medagenda.com': {
          id: 'ece028c8-3c6d-4d0a-98aa-efaa3565b55f',
          nome: 'Hospital Nossa Senhora Aparecida',
          cidade: 'Foz do Iguaçu',
          cnpj: '14.736.446/0009-40',
          role: 'triagem'
        },
        'faturamento.foz@medagenda.com': {
          id: 'ece028c8-3c6d-4d0a-98aa-efaa3565b55f',
          nome: 'Hospital Nossa Senhora Aparecida',
          cidade: 'Foz do Iguaçu',
          cnpj: '14.736.446/0009-40',
          role: 'faturamento_local' // ✅ Acesso restrito: Dashboard + Faturamento
        },
        'foz.carla@medagenda.com': {
          id: 'ece028c8-3c6d-4d0a-98aa-efaa3565b55f',
          nome: 'Hospital Nossa Senhora Aparecida',
          cidade: 'Foz do Iguaçu',
          cnpj: '14.736.446/0009-40',
          role: 'triagem'
        },
        'agendamento.frg@medagenda.com': {
          id: '933de4fb-ebfd-4838-bb43-153a7354d333',
          nome: 'Hospital Maternidade Nossa Senhora Aparecida',
          cidade: 'Fazenda Rio Grande',
          cnpj: '14.736.446/0010-84',
          role: 'admin'
        },
        'agendamento.rbs@medagenda.com': {
          id: '4a2527c1-df09-4a36-a08f-adc63f555123',
          nome: 'Hospital Maternidade Rio Branco do Sul',
          cidade: 'Rio Branco do Sul',
          cnpj: '14.736.446/0012-46',
          role: 'agendamento_local'
        },
        'faturamento.rbs@medagenda.com': {
          id: '4a2527c1-df09-4a36-a08f-adc63f555123',
          nome: 'Hospital Maternidade Rio Branco do Sul',
          cidade: 'Rio Branco do Sul',
          cnpj: '14.736.446/0012-46',
          role: 'faturamento_local'
        },
        'agendamento.apu@medagenda.com': {
          id: '54ccade1-9f7a-47c7-9bba-7fe02bfa9eb7',
          nome: 'Hospital Torao Tokuda',
          cidade: 'Apucarana',
          cnpj: '08325231001400',
          role: 'admin'
        },
        'coordenacao.sm@medagenda.com': {
          id: '3ea8c82a-02dd-41c3-9247-1ae07a1ecaba',
          nome: 'Hospital Municipal Santa Alice',
          cidade: 'Santa Mariana',
          cnpj: '14.736.446/0001-93',
          role: 'admin'
        },
        'coordenacao.fax@medagenda.com': {
          id: '4111b99d-8b4a-4b51-9561-a2fbd14e776e',
          nome: 'Hospital Municipal Juarez Barreto de Macedo',
          cidade: 'Faxinal',
          cnpj: '14.736.446/0006-06',
          role: 'admin'
        },
        'coordenacao.rbs@medagenda.com': {
          id: '4a2527c1-df09-4a36-a08f-adc63f555123',
          nome: 'Hospital Maternidade Rio Branco do Sul',
          cidade: 'Rio Branco do Sul',
          cnpj: '14.736.446/0012-46',
          role: 'admin'
        },
        'coordenacao.apu@medagenda.com': {
          id: '54ccade1-9f7a-47c7-9bba-7fe02bfa9eb7',
          nome: 'Hospital Torao Tokuda',
          cidade: 'Apucarana',
          cnpj: '08325231001400',
          role: 'admin'
        },
        'coordenacao.ara@medagenda.com': {
          id: '8c4ddaaf-33cf-47e4-8c42-9ca31b244d4a',
          nome: 'Hospital Municipal 18 de Dezembro',
          cidade: 'Arapoti',
          cnpj: '14.736.446/0008-60',
          role: 'admin'
        },
        'coordenacao.frg@medagenda.com': {
          id: '933de4fb-ebfd-4838-bb43-153a7354d333',
          nome: 'Hospital Maternidade Nossa Senhora Aparecida',
          cidade: 'Fazenda Rio Grande',
          cnpj: '14.736.446/0010-84',
          role: 'admin'
        },
        'auditoria.gua@medagenda.com': {
          id: '09ab26a8-8c2c-4a67-94f7-d450a1be328e',
          nome: 'Hospital Regional Centro Oeste',
          cidade: 'Guarapuava',
          cnpj: '76416866000140',
          role: 'admin'
        },
        'cc.frg@medagenda.com': {
          id: '933de4fb-ebfd-4838-bb43-153a7354d333',
          nome: 'Hospital Maternidade Nossa Senhora Aparecida',
          cidade: 'Fazenda Rio Grande',
          cnpj: '14.736.446/0010-84',
          role: 'agendamento_local'
        },
        'cf.frg@medagenda.com': {
          id: '933de4fb-ebfd-4838-bb43-153a7354d333',
          nome: 'Hospital Maternidade Nossa Senhora Aparecida',
          cidade: 'Fazenda Rio Grande',
          cnpj: '14.736.446/0010-84',
          role: 'agendamento_local'
        },
        'faturamento.frg@medagenda.com': {
          id: '933de4fb-ebfd-4838-bb43-153a7354d333',
          nome: 'Hospital Maternidade Nossa Senhora Aparecida',
          cidade: 'Fazenda Rio Grande',
          cnpj: '14.736.446/0010-84',
          role: 'faturamento_local'
        },
        'adm.frg@medagenda.com': {
          id: '933de4fb-ebfd-4838-bb43-153a7354d333',
          nome: 'Hospital Maternidade Nossa Senhora Aparecida',
          cidade: 'Fazenda Rio Grande',
          cnpj: '14.736.446/0010-84',
          role: 'admin'
        },
        'coordenacao.car@medagenda.com': {
          id: 'bbe11a40-2689-48af-9aa8-5c6e7f2e48da',
          nome: 'Hospital Municipal São José',
          cidade: 'Carlópolis',
          cnpj: '14.736.446/0007-89',
          role: 'admin'
        },
        'auditoria.foz@medagenda.com': {
          id: 'ece028c8-3c6d-4d0a-98aa-efaa3565b55f',
          nome: 'Hospital Nossa Senhora Aparecida',
          cidade: 'Foz do Iguaçu',
          cnpj: '14.736.446/0009-40',
          role: 'admin'
        },
        'coordenacao.foz@medagenda.com': {
          id: 'ece028c8-3c6d-4d0a-98aa-efaa3565b55f',
          nome: 'Hospital Nossa Senhora Aparecida',
          cidade: 'Foz do Iguaçu',
          cnpj: '14.736.446/0009-40',
          role: 'admin'
        },
        // Novo hospital: Hospital Regional Centro Oeste (Guarapuava)
        'agendamento.gua@medagenda.com': {
          id: '09ab26a8-8c2c-4a67-94f7-d450a1be328e',
          nome: 'Hospital Regional Centro Oeste',
          cidade: 'Guarapuava',
          cnpj: '76416866000140',
          role: 'admin'
        },
        'coordenacao.gua@medagenda.com': {
          id: '09ab26a8-8c2c-4a67-94f7-d450a1be328e',
          nome: 'Hospital Regional Centro Oeste',
          cidade: 'Guarapuava',
          cnpj: '76416866000140',
          role: 'admin'
        }
      };

      // Login de coordenação única com acesso a múltiplos hospitais
      if (email === 'coordenacao@medagenda.com') {
        const hospitais: Hospital[] = [
          { id: '3ea8c82a-02dd-41c3-9247-1ae07a1ecaba', nome: 'Hospital Municipal Santa Alice', cidade: 'Santa Mariana', cnpj: '14.736.446/0001-93' },
          { id: '4111b99d-8b4a-4b51-9561-a2fbd14e776e', nome: 'Hospital Municipal Juarez Barreto de Macedo', cidade: 'Faxinal', cnpj: '14.736.446/0006-06' },
          { id: '4a2527c1-df09-4a36-a08f-adc63f555123', nome: 'Hospital Maternidade Rio Branco do Sul', cidade: 'Rio Branco do Sul', cnpj: '14.736.446/0012-46' },
          { id: '54ccade1-9f7a-47c7-9bba-7fe02bfa9eb7', nome: 'Hospital Torao Tokuda', cidade: 'Apucarana', cnpj: '08325231001400' },
          { id: '8c4ddaaf-33cf-47e4-8c42-9ca31b244d4a', nome: 'Hospital Municipal 18 de Dezembro', cidade: 'Arapoti', cnpj: '14.736.446/0008-60' },
          { id: '933de4fb-ebfd-4838-bb43-153a7354d333', nome: 'Hospital Maternidade Nossa Senhora Aparecida', cidade: 'Fazenda Rio Grande', cnpj: '14.736.446/0010-84' },
          { id: 'bbe11a40-2689-48af-9aa8-5c6e7f2e48da', nome: 'Hospital Municipal São José', cidade: 'Carlópolis', cnpj: '14.736.446/0007-89' },
          { id: 'ece028c8-3c6d-4d0a-98aa-efaa3565b55f', nome: 'Hospital Nossa Senhora Aparecida', cidade: 'Foz do Iguaçu', cnpj: '14.736.446/0009-40' },
          { id: '09ab26a8-8c2c-4a67-94f7-d450a1be328e', nome: 'Hospital Regional Centro Oeste', cidade: 'Guarapuava', cnpj: '76416866000140' }
        ];

        const usuarioCoord: Usuario = {
          id: `user-${Date.now()}`,
          email,
          hospital_id: hospitais[0].id,
          hospital: hospitais[0],
          role: 'coordenacao'
        };

        setUsuario(usuarioCoord);
        setHospitalSelecionado(hospitais[0]);
        setHospitaisDisponiveis(hospitais);
        setIsAuthenticated(true);

        localStorage.setItem('medagenda-auth', JSON.stringify({
          usuario: usuarioCoord,
          hospital: hospitais[0],
          hospitais
        }));
        console.log('💾 Login coordenação com múltiplos hospitais:', hospitais.length);
        setIsLoading(false);
        return;
      }
      
      // Login de faturamento com acesso a múltiplos hospitais
      if (email === 'faturamento@medagenda.com' || email === 'faturamento01@medagenda.com') {
        const hospitais: Hospital[] = [
          { id: '3ea8c82a-02dd-41c3-9247-1ae07a1ecaba', nome: 'Hospital Municipal Santa Alice', cidade: 'Santa Mariana', cnpj: '14.736.446/0001-93' },
          { id: '4111b99d-8b4a-4b51-9561-a2fbd14e776e', nome: 'Hospital Municipal Juarez Barreto de Macedo', cidade: 'Faxinal', cnpj: '14.736.446/0006-06' },
          { id: '4a2527c1-df09-4a36-a08f-adc63f555123', nome: 'Hospital Maternidade Rio Branco do Sul', cidade: 'Rio Branco do Sul', cnpj: '14.736.446/0012-46' },
          { id: '54ccade1-9f7a-47c7-9bba-7fe02bfa9eb7', nome: 'Hospital Torao Tokuda', cidade: 'Apucarana', cnpj: '08325231001400' },
          { id: '8c4ddaaf-33cf-47e4-8c42-9ca31b244d4a', nome: 'Hospital Municipal 18 de Dezembro', cidade: 'Arapoti', cnpj: '14.736.446/0008-60' },
          { id: '933de4fb-ebfd-4838-bb43-153a7354d333', nome: 'Hospital Maternidade Nossa Senhora Aparecida', cidade: 'Fazenda Rio Grande', cnpj: '14.736.446/0010-84' },
          { id: 'bbe11a40-2689-48af-9aa8-5c6e7f2e48da', nome: 'Hospital Municipal São José', cidade: 'Carlópolis', cnpj: '14.736.446/0007-89' },
          { id: 'ece028c8-3c6d-4d0a-98aa-efaa3565b55f', nome: 'Hospital Nossa Senhora Aparecida', cidade: 'Foz do Iguaçu', cnpj: '14.736.446/0009-40' },
          { id: '09ab26a8-8c2c-4a67-94f7-d450a1be328e', nome: 'Hospital Regional Centro Oeste', cidade: 'Guarapuava', cnpj: '76416866000140' }
        ];
        
        const usuarioFat: Usuario = {
          id: `user-${Date.now()}`,
          email,
          hospital_id: hospitais[0].id,
          hospital: hospitais[0],
          role: 'faturamento'
        };
        
        setUsuario(usuarioFat);
        setHospitalSelecionado(hospitais[0]);
        setHospitaisDisponiveis(hospitais);
        setIsAuthenticated(true);
        
        localStorage.setItem('medagenda-auth', JSON.stringify({
          usuario: usuarioFat,
          hospital: hospitais[0],
          hospitais
        }));
        console.log('💾 Login faturamento com múltiplos hospitais:', hospitais.length);
        setIsLoading(false);
        return;
      }
      
      if (email === 'diretriz@medagenda.com') {
        const hospitais: Hospital[] = [
          { id: '3ea8c82a-02dd-41c3-9247-1ae07a1ecaba', nome: 'Hospital Municipal Santa Alice', cidade: 'Santa Mariana', cnpj: '14.736.446/0001-93' },
          { id: '4111b99d-8b4a-4b51-9561-a2fbd14e776e', nome: 'Hospital Municipal Juarez Barreto de Macedo', cidade: 'Faxinal', cnpj: '14.736.446/0006-06' },
          { id: '4a2527c1-df09-4a36-a08f-adc63f555123', nome: 'Hospital Maternidade Rio Branco do Sul', cidade: 'Rio Branco do Sul', cnpj: '14.736.446/0012-46' },
          { id: '54ccade1-9f7a-47c7-9bba-7fe02bfa9eb7', nome: 'Hospital Torao Tokuda', cidade: 'Apucarana', cnpj: '08325231001400' },
          { id: '8c4ddaaf-33cf-47e4-8c42-9ca31b244d4a', nome: 'Hospital Municipal 18 de Dezembro', cidade: 'Arapoti', cnpj: '14.736.446/0008-60' },
          { id: '933de4fb-ebfd-4838-bb43-153a7354d333', nome: 'Hospital Maternidade Nossa Senhora Aparecida', cidade: 'Fazenda Rio Grande', cnpj: '14.736.446/0010-84' },
          { id: 'bbe11a40-2689-48af-9aa8-5c6e7f2e48da', nome: 'Hospital Municipal São José', cidade: 'Carlópolis', cnpj: '14.736.446/0007-89' },
          { id: 'ece028c8-3c6d-4d0a-98aa-efaa3565b55f', nome: 'Hospital Nossa Senhora Aparecida', cidade: 'Foz do Iguaçu', cnpj: '14.736.446/0009-40' },
          { id: '09ab26a8-8c2c-4a67-94f7-d450a1be328e', nome: 'Hospital Regional Centro Oeste', cidade: 'Guarapuava', cnpj: '76416866000140' }
        ];
        
        const usuarioDirz: Usuario = {
          id: `user-${Date.now()}`,
          email,
          hospital_id: hospitais[0].id,
          hospital: hospitais[0],
          role: 'diretriz'
        };
        
        setUsuario(usuarioDirz);
        setHospitalSelecionado(hospitais[0]);
        setHospitaisDisponiveis(hospitais);
        setIsAuthenticated(true);
        
        localStorage.setItem('medagenda-auth', JSON.stringify({
          usuario: usuarioDirz,
          hospital: hospitais[0],
          hospitais
        }));
        console.log('💾 Login diretriz (consultoria) com múltiplos hospitais:', hospitais.length);
        setIsLoading(false);
        return;
      }
      
      if (email === 'diretoria@medagenda.com') {
        const hospitais: Hospital[] = [
          { id: '3ea8c82a-02dd-41c3-9247-1ae07a1ecaba', nome: 'Hospital Municipal Santa Alice', cidade: 'Santa Mariana', cnpj: '14.736.446/0001-93' },
          { id: '4111b99d-8b4a-4b51-9561-a2fbd14e776e', nome: 'Hospital Municipal Juarez Barreto de Macedo', cidade: 'Faxinal', cnpj: '14.736.446/0006-06' },
          { id: '4a2527c1-df09-4a36-a08f-adc63f555123', nome: 'Hospital Maternidade Rio Branco do Sul', cidade: 'Rio Branco do Sul', cnpj: '14.736.446/0012-46' },
          { id: '54ccade1-9f7a-47c7-9bba-7fe02bfa9eb7', nome: 'Hospital Torao Tokuda', cidade: 'Apucarana', cnpj: '08325231001400' },
          { id: '8c4ddaaf-33cf-47e4-8c42-9ca31b244d4a', nome: 'Hospital Municipal 18 de Dezembro', cidade: 'Arapoti', cnpj: '14.736.446/0008-60' },
          { id: '933de4fb-ebfd-4838-bb43-153a7354d333', nome: 'Hospital Maternidade Nossa Senhora Aparecida', cidade: 'Fazenda Rio Grande', cnpj: '14.736.446/0010-84' },
          { id: 'bbe11a40-2689-48af-9aa8-5c6e7f2e48da', nome: 'Hospital Municipal São José', cidade: 'Carlópolis', cnpj: '14.736.446/0007-89' },
          { id: 'ece028c8-3c6d-4d0a-98aa-efaa3565b55f', nome: 'Hospital Nossa Senhora Aparecida', cidade: 'Foz do Iguaçu', cnpj: '14.736.446/0009-40' },
          { id: '09ab26a8-8c2c-4a67-94f7-d450a1be328e', nome: 'Hospital Regional Centro Oeste', cidade: 'Guarapuava', cnpj: '76416866000140' }
        ];
        
        const usuarioDir: Usuario = {
          id: `user-${Date.now()}`,
          email,
          hospital_id: hospitais[0].id,
          hospital: hospitais[0],
          role: 'diretoria'
        };
        
        setUsuario(usuarioDir);
        setHospitalSelecionado(hospitais[0]);
        setHospitaisDisponiveis(hospitais);
        setIsAuthenticated(true);
        
        localStorage.setItem('medagenda-auth', JSON.stringify({
          usuario: usuarioDir,
          hospital: hospitais[0],
          hospitais
        }));
        console.log('💾 Login diretoria com múltiplos hospitais:', hospitais.length);
        setIsLoading(false);
        return;
      }
      
      if (email === 'tiago@medagenda.com') {
        const hospitais: Hospital[] = [
          { id: '3ea8c82a-02dd-41c3-9247-1ae07a1ecaba', nome: 'Hospital Municipal Santa Alice', cidade: 'Santa Mariana', cnpj: '14.736.446/0001-93' },
          { id: '4111b99d-8b4a-4b51-9561-a2fbd14e776e', nome: 'Hospital Municipal Juarez Barreto de Macedo', cidade: 'Faxinal', cnpj: '14.736.446/0006-06' },
          { id: '4a2527c1-df09-4a36-a08f-adc63f555123', nome: 'Hospital Maternidade Rio Branco do Sul', cidade: 'Rio Branco do Sul', cnpj: '14.736.446/0012-46' },
          { id: '54ccade1-9f7a-47c7-9bba-7fe02bfa9eb7', nome: 'Hospital Torao Tokuda', cidade: 'Apucarana', cnpj: '08325231001400' },
          { id: '8c4ddaaf-33cf-47e4-8c42-9ca31b244d4a', nome: 'Hospital Municipal 18 de Dezembro', cidade: 'Arapoti', cnpj: '14.736.446/0008-60' },
          { id: '933de4fb-ebfd-4838-bb43-153a7354d333', nome: 'Hospital Maternidade Nossa Senhora Aparecida', cidade: 'Fazenda Rio Grande', cnpj: '14.736.446/0010-84' },
          { id: 'bbe11a40-2689-48af-9aa8-5c6e7f2e48da', nome: 'Hospital Municipal São José', cidade: 'Carlópolis', cnpj: '14.736.446/0007-89' },
          { id: 'ece028c8-3c6d-4d0a-98aa-efaa3565b55f', nome: 'Hospital Nossa Senhora Aparecida', cidade: 'Foz do Iguaçu', cnpj: '14.736.446/0009-40' },
          { id: '09ab26a8-8c2c-4a67-94f7-d450a1be328e', nome: 'Hospital Regional Centro Oeste', cidade: 'Guarapuava', cnpj: '76416866000140' }
        ];
        const usuarioDirTiago: Usuario = {
          id: `user-${Date.now()}`,
          email,
          hospital_id: hospitais[0].id,
          hospital: hospitais[0],
          role: 'diretoria'
        };
        setUsuario(usuarioDirTiago);
        setHospitalSelecionado(hospitais[0]);
        setHospitaisDisponiveis(hospitais);
        setIsAuthenticated(true);
        localStorage.setItem('medagenda-auth', JSON.stringify({
          usuario: usuarioDirTiago,
          hospital: hospitais[0],
          hospitais
        }));
        console.log('💾 Login diretoria (tiago) com múltiplos hospitais:', hospitais.length);
        setIsLoading(false);
        return;
      }
      
      if (email === 'helluany@medagenda.com') {
        const hospitais: Hospital[] = [
          { id: '933de4fb-ebfd-4838-bb43-153a7354d333', nome: 'Hospital Maternidade Nossa Senhora Aparecida', cidade: 'Fazenda Rio Grande', cnpj: '14.736.446/0010-84' },
          { id: 'ece028c8-3c6d-4d0a-98aa-efaa3565b55f', nome: 'Hospital Nossa Senhora Aparecida', cidade: 'Foz do Iguaçu', cnpj: '14.736.446/0009-40' }
        ];
        const usuarioMulti: Usuario = {
          id: `user-${Date.now()}`,
          email,
          hospital_id: hospitais[0].id,
          hospital: hospitais[0],
          role: 'diretoria'
        };
        setUsuario(usuarioMulti);
        setHospitalSelecionado(hospitais[0]);
        setHospitaisDisponiveis(hospitais);
        setIsAuthenticated(true);
        localStorage.setItem('medagenda-auth', JSON.stringify({
          usuario: usuarioMulti,
          hospital: hospitais[0],
          hospitais
        }));
        setIsLoading(false);
        return;
      }

      // Login Sabrina - Acesso a Dashboard, Grade e Faturamento para FRG e RBS
      if (email === 'sabrina@medagenda.com') {
        const hospitais: Hospital[] = [
          { id: '933de4fb-ebfd-4838-bb43-153a7354d333', nome: 'Hospital Maternidade Nossa Senhora Aparecida', cidade: 'Fazenda Rio Grande', cnpj: '14.736.446/0010-84' },
          { id: '4a2527c1-df09-4a36-a08f-adc63f555123', nome: 'Hospital Maternidade Rio Branco do Sul', cidade: 'Rio Branco do Sul', cnpj: '14.736.446/0012-46' }
        ];
        const usuarioSabrina: Usuario = {
          id: `user-${Date.now()}`,
          email,
          hospital_id: hospitais[0].id,
          hospital: hospitais[0],
          role: 'faturamento_local' // Acesso: Dashboard + Grade + Faturamento
        };
        setUsuario(usuarioSabrina);
        setHospitalSelecionado(hospitais[0]);
        setHospitaisDisponiveis(hospitais);
        setIsAuthenticated(true);
        localStorage.setItem('medagenda-auth', JSON.stringify({
          usuario: usuarioSabrina,
          hospital: hospitais[0],
          hospitais
        }));
        console.log('💾 Login Sabrina com acesso a FRG e RBS (Dashboard, Grade, Faturamento)');
        setIsLoading(false);
        return;
      }

      const hospitalData = emailHospitalMap[email];
      
      if (!hospitalData) {
        throw new Error('Email não cadastrado no sistema');
      }

      // Criar usuário com role
      const usuario: Usuario = {
        id: `user-${Date.now()}`,
        email: email,
        hospital_id: hospitalData.id,
        hospital: hospitalData,
        role: hospitalData.role
      };

      setUsuario(usuario);
      setHospitalSelecionado(hospitalData);
      setHospitaisDisponiveis([hospitalData]);
      setIsAuthenticated(true);

      // PERSISTÊNCIA: Salvar no localStorage
      localStorage.setItem('medagenda-auth', JSON.stringify({
        usuario: usuario,
        hospital: hospitalData,
        hospitais: [hospitalData]
      }));
      console.log('💾 Login salvo no localStorage:', hospitalData.nome, `(${hospitalData.role})`);
      
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const selecionarHospital = (hospital: Hospital) => {
    setHospitalSelecionado(hospital);
    setIsAuthenticated(true);
    setUsuario(prev => prev ? { ...prev, hospital_id: hospital.id, hospital, role: rolesPorHospital[hospital.id] || prev.role } : prev);
  };

  const logout = () => {
    if (usuario || hospitalSelecionado) {
      auditService.log({
        action: 'LOGOUT',
        entity: 'auth',
        entity_id: usuario?.id ?? null,
        hospital_id: hospitalSelecionado?.id ?? usuario?.hospital_id ?? null,
        meta: { source: 'frontend' }
      });
    }
    setUsuario(null);
    setHospitalSelecionado(null);
    setIsAuthenticated(false);
    
    // PERSISTÊNCIA: Limpar localStorage
    localStorage.removeItem('medagenda-auth');
    console.log('🚪 Logout - localStorage limpo');
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        hospitalSelecionado,
        isAuthenticated,
        isLoading,
        userRole: usuario?.role || null,
        hospitaisDisponiveis,
        login,
        selecionarHospital,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ============================================================================
// HOOK PARA FILTROS POR HOSPITAL E PERMISSÕES
// ============================================================================
export const useHospitalFilter = () => {
  const { hospitalSelecionado, userRole, usuario } = useAuth();

  // Função para adicionar filtro de hospital em query string (URL)
  const addHospitalFilter = (url: string): string => {
    if (!hospitalSelecionado) return url;
    
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}hospitalId=${hospitalSelecionado.id}`;
  };

  // Verificar se usuário tem acesso a uma view
  const hasAccessToView = (viewName: string): boolean => {
    const emailLower = usuario?.email?.toLowerCase();
    if (emailLower === 'agendamento.frg@medagenda.com') {
      return viewName !== 'faturamento';
    }
    if (emailLower === 'cc.frg@medagenda.com') {
      return viewName !== 'faturamento';
    }
    if (emailLower === 'agendamento.rbs@medagenda.com') {
      return viewName === 'dashboard' || viewName === 'calendar' || viewName === 'documentacao';
    }
    if (usuario?.email?.toLowerCase() === 'auditoria.foz@medagenda.com') {
      if (viewName === 'calendar' || viewName === 'anestesista') return false;
      return true;
    }

    if (emailLower === 'radiologia.foz@medagenda.com') {
      return viewName === 'dashboard' || viewName === 'documentacao' || viewName === 'anestesista';
    }

    if (emailLower === 'anestesista.gua@medagenda.com') {
      return viewName === 'dashboard' || viewName === 'calendar' || viewName === 'anestesista';
    }
    if (!userRole) return false;
    
    if (emailLower === 'cf.frg@medagenda.com') {
      return viewName === 'dashboard' || viewName === 'calendar';
    }
    
    // Admin tem acesso a tudo
    if (userRole === 'admin') return true;
    if (userRole === 'coordenacao') return true;
    if (userRole === 'diretoria') return true;
    // Faturamento multi-hospital com acesso total, como coordenação
    if (userRole === 'faturamento') return true;
    // Consultoria (diretriz): acesso apenas a Dashboard e Faturamento
    if (userRole === 'diretriz') {
      return viewName === 'dashboard' || viewName === 'faturamento';
    }
    // Faturamento local: acesso apenas a Dashboard e Faturamento
    if (userRole === 'faturamento_local') {
      return viewName === 'dashboard' || viewName === 'faturamento' || viewName === 'calendar';
    }
    // Agendamento local: Dashboard, Grade e Agendamento
    if (userRole === 'agendamento_local') {
      return viewName === 'dashboard' || viewName === 'calendar' || viewName === 'documentacao';
    }
    
    // Recepcao e Triagem têm acesso apenas a Dashboard e Documentação
    if (userRole === 'recepcao' || userRole === 'triagem') {
      if (usuario?.email?.toLowerCase() === 'triagem.foz@medagenda.com') {
        return viewName === 'dashboard' || viewName === 'documentacao' || viewName === 'anestesista';
      }
      return viewName === 'dashboard' || viewName === 'documentacao';
    }
    // Anestesista: acesso a Dashboard e Anestesista
    if (userRole === 'anestesista') {
      return viewName === 'dashboard' || viewName === 'anestesista';
    }
    
    // Demais perfis
    
    return false;
  };

  return {
    hospitalSelecionado,
    addHospitalFilter,
    hasAccessToView,
    userRole
  };
};

// ============================================================================
// COMPONENTE DE LOGIN PREMIUM
// ============================================================================
interface PremiumLoginFormProps {
  onSuccess: (hospitais: Hospital[]) => void;
}

const PremiumLoginForm = ({ onSuccess }: PremiumLoginFormProps) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const { login, isLoading, hospitaisDisponiveis } = useAuth();

  // Animação de digitação
  useEffect(() => {
    if (email.length > 0) {
      setIsTyping(true);
      const timer = setTimeout(() => setIsTyping(false), 500);
      return () => clearTimeout(timer);
    }
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Email é obrigatório');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setError('Email deve ter formato válido');
      return;
    }
    setError('');

    try {
      await login(email);
      try {
        const saved = localStorage.getItem('medagenda-auth');
        const parsed = saved ? JSON.parse(saved) : {};
        const hs: Hospital[] = parsed.hospitais || hospitaisDisponiveis || [];
        onSuccess(hs);
      } catch {
        onSuccess(hospitaisDisponiveis || []);
      }
    } catch (err: any) {
      const msg = (err?.message || '').toLowerCase();
      const isRls = msg.includes('permission') || msg.includes('rls') || msg.includes('unauthorized') || msg.includes('401') || msg.includes('api key');
      if (isRls) {
        await login(email);
        return;
      }
      setError(err.message || 'Erro na autenticação');
    }
  };


  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-full max-w-6xl px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="flex justify-center">
            <ImageWithFallback
              baseName="imagem_de_login_2"
              alt="Ilustração de login"
              className="max-w-[620px] w-full object-contain select-none"
            />
          </div>
          <div className="w-full">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-slate-900">MedAgenda</h1>
              <p className="text-slate-600 text-sm mt-1">
                Seu dia cirúrgico organizado com eficiência e precisão
              </p>
            </div>
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campo de email */}
            <div className="space-y-2">
              <label className="text-slate-700 font-medium text-sm">Email Corporativo</label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="seu.email@hospital.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className={`w-full px-4 py-4 bg-white border border-gray-300 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all duration-300 ${
                    isTyping ? 'ring-2 ring-gray-400/50' : ''
                  } ${error ? 'ring-2 ring-red-400/50 border-red-400/50' : ''}`}
                  required
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
              </div>
              {error && (
                <div className="flex items-center space-x-2 text-red-600 text-sm animate-shake">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !email.trim()}
              className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 transform ${
                isLoading || !email.trim()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gray-800 hover:bg-black hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <svg className="animate-spin w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Entrando...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <span>Entrar no Sistema</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              )}
            </button>
          </form>


          <div className="mt-6 text-left">
            <p className="text-slate-600 text-sm">
              Acesse com seu email corporativo para gerenciar agendas e documentos com segurança.
            </p>
          </div>
        </div>
        </div>
          </div>
        </div>
    </div>
  );
};

// ============================================================================
// COMPONENTE DE SELEÇÃO DE HOSPITAL PREMIUM
// ============================================================================
interface PremiumHospitalSelectorProps {
  hospitais: Hospital[];
  onSelect: (hospital: Hospital) => void;
  onBack: () => void;
}

const PremiumHospitalSelector = ({ hospitais, onSelect, onBack }: PremiumHospitalSelectorProps) => {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-full max-w-6xl px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="flex justify-center">
            <ImageWithFallback
              baseName="imagem_de_login_2"
              alt="Ilustração de login"
              className="max-w-[620px] w-full object-contain select-none"
            />
          </div>
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-200">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 text-center">Selecione o Hospital</h2>
          <p className="text-slate-700 text-center">Escolha qual hospital deseja acessar</p>
        </div>
        <div className="space-y-4">
          {hospitais.map((hospital, index) => (
            <button
              key={hospital.id}
              onClick={() => onSelect(hospital)}
              className="w-full p-6 text-left bg-white hover:bg-gray-50 rounded-2xl border border-gray-200 hover:border-gray-300 transition-all duration-300 transform hover:scale-[1.02] group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-3 h-3 bg-gradient-to-r from-sky-300 to-emerald-300 rounded-full"></div>
                    <h3 className="text-slate-700 font-semibold text-lg">{hospital.nome}</h3>
                  </div>
                  <p className="text-slate-600 text-sm mb-1">{hospital.cidade}</p>
                  <p className="text-slate-500 text-xs">CNPJ: {hospital.cnpj}</p>
                </div>
                <svg className="w-6 h-6 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </button>
          ))}
        </div>

        {/* Botão voltar */}
        <button
          onClick={onBack}
          className="w-full mt-6 py-3 px-6 bg-gray-100 hover:bg-gray-200 rounded-xl border border-gray-300 hover:border-gray-400 text-slate-700 transition-all duration-200"
        >
          ← Voltar ao Login
        </button>
        </div>
        </div>
        </div>
    </div>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL DE LOGIN PREMIUM
// ============================================================================
export const PremiumLoginSystem = () => {
  const [hospitaisDisponiveis, setHospitaisDisponiveis] = useState<Hospital[]>([]);
  const [showHospitalSelector, setShowHospitalSelector] = useState(false);
  const { selecionarHospital } = useAuth();

  const handleLoginSuccess = (hospitais: Hospital[]) => {
    let hs = hospitais;
    try {
      const saved = localStorage.getItem('medagenda-auth');
      const parsed = saved ? JSON.parse(saved) : {};
      const lsHosp: Hospital[] = parsed.hospitais || [];
      if ((lsHosp || []).length > hs.length) hs = lsHosp;
    } catch {}
    setHospitaisDisponiveis(hs);
    if ((hs || []).length > 1) {
      setShowHospitalSelector(true);
    }
    // Se tem apenas 1 hospital, o AuthProvider já seleciona automaticamente
  };

  const handleHospitalSelect = (hospital: Hospital) => {
    selecionarHospital(hospital);
    setShowHospitalSelector(false);
  };

  const handleBack = () => {
    setShowHospitalSelector(false);
    setHospitaisDisponiveis([]);
  };

  if (showHospitalSelector) {
    return (
      <PremiumHospitalSelector
        hospitais={hospitaisDisponiveis}
        onSelect={handleHospitalSelect}
        onBack={handleBack}
      />
    );
  }

  return <PremiumLoginForm onSuccess={handleLoginSuccess} />;
};

// ============================================================================
// COMPONENTE DE CABEÇALHO PREMIUM
// ============================================================================
export const PremiumHospitalHeader = () => {
  const { usuario, hospitalSelecionado, hospitaisDisponiveis, selecionarHospital, logout } = useAuth();

  if (!hospitalSelecionado || !usuario) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-gray-700 to-gray-900 shadow-lg">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">
                {hospitalSelecionado.nome}
              </h1>
              <p className="text-blue-100 text-sm">
                {hospitalSelecionado.cidade} • {usuario.email}
              </p>
            </div>
          </div>
          
          {hospitaisDisponiveis.length > 1 && (
            <div className="flex items-center gap-3">
              <select
                value={hospitalSelecionado.id}
                onChange={(e) => {
                  const h = hospitaisDisponiveis.find(x => x.id === e.target.value);
                  if (h) selecionarHospital(h);
                }}
                className="px-3 py-2 bg-white/10 text-white rounded-lg border border-white/20 focus:outline-none"
                title="Trocar hospital"
              >
                {hospitaisDisponiveis.map(h => (
                  <option key={h.id} value={h.id} className="bg-gray-800 text-white">
                    {h.nome}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={logout}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg text-white transition-all duration-200 border border-white/20 hover:border-white/30"
          >
            Sair
          </button>
        </div>
      </div>
    </div>
  );
};
