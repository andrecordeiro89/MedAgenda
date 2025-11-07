# 💻 MELHORIAS TELA AGENDA - Exemplos de Código

## 📋 Índice Rápido

1. [Correções Críticas](#correções-críticas)
2. [Sistema de Filtros](#sistema-de-filtros)
3. [Múltiplas Visualizações](#múltiplas-visualizações)
4. [Refatoração em Componentes](#refatoração-em-componentes)
5. [Performance com useMemo](#performance)
6. [Tooltips Informativos](#tooltips)
7. [Ações Rápidas](#ações-rápidas)
8. [Responsividade](#responsividade)

---

## 🔴 CORREÇÕES CRÍTICAS

### 1. Remover console.log e criar sistema de debug

```typescript
// utils/debug.ts
const IS_DEV = import.meta.env.DEV;

export const debug = {
  log: (...args: any[]) => {
    if (IS_DEV) console.log(...args);
  },
  warn: (...args: any[]) => {
    if (IS_DEV) console.warn(...args);
  },
  error: (...args: any[]) => {
    console.error(...args); // Sempre mostrar erros
  }
};

// CalendarView.tsx
import { debug } from '../utils/debug';

debug.log('📊 CalendarView - Metas carregadas:', metasEspecialidades.length);
```

### 2. Service para Grades Cirúrgicas

```typescript
// services/gradeCirurgicaStorage.ts
import { DiaSemana } from '../types';

export class GradeCirurgicaStorageService {
  private static readonly PREFIX = 'grade';
  
  private static getStorageKey(
    hospitalId: string,
    diaSemana: DiaSemana,
    year: number,
    month: number // 0-11 (Janeiro = 0)
  ): string {
    const mesFormatado = String(month + 1).padStart(2, '0');
    return `${this.PREFIX}_${hospitalId}_${diaSemana}_${year}-${mesFormatado}`;
  }
  
  static getDiasComGrade(
    hospitalId: string,
    year: number,
    month: number
  ): Set<number> {
    const diasComGrade = new Set<number>();
    const diasSemana: DiaSemana[] = [
      'domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'
    ];
    
    for (let dia = 0; dia <= 6; dia++) {
      const key = this.getStorageKey(hospitalId, diasSemana[dia], year, month);
      const saved = localStorage.getItem(key);
      
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.some(g => g.itens?.length > 0)) {
            diasComGrade.add(dia);
          }
        } catch (error) {
          console.error(`Erro ao parsear grade ${key}:`, error);
        }
      }
    }
    
    return diasComGrade;
  }
  
  static getGrade(
    hospitalId: string,
    diaSemana: DiaSemana,
    year: number,
    month: number
  ): any | null {
    const key = this.getStorageKey(hospitalId, diaSemana, year, month);
    const saved = localStorage.getItem(key);
    
    if (!saved) return null;
    
    try {
      return JSON.parse(saved);
    } catch (error) {
      console.error(`Erro ao parsear grade ${key}:`, error);
      return null;
    }
  }
  
  static saveGrade(
    hospitalId: string,
    diaSemana: DiaSemana,
    year: number,
    month: number,
    data: any
  ): void {
    const key = this.getStorageKey(hospitalId, diaSemana, year, month);
    localStorage.setItem(key, JSON.stringify(data));
  }
}

// CalendarView.tsx - Usar o service
import { GradeCirurgicaStorageService } from '../services/gradeCirurgicaStorage';

const diasComGrade = useMemo(() => 
  GradeCirurgicaStorageService.getDiasComGrade(
    hospitalId,
    currentDate.getFullYear(),
    currentDate.getMonth()
  ),
  [hospitalId, currentDate]
);
```

---

## 🎯 SISTEMA DE FILTROS

### Tipos e Estado

```typescript
// types.ts
export interface CalendarFilters {
  medicos: string[];
  especialidades: string[];
  tiposProcedimento: ('cirurgico' | 'ambulatorial')[];
  statusLiberacao: ('liberado' | 'pendente')[];
  mostrarSomenteComGrade: boolean;
  mostrarSomenteComAgendamentos: boolean;
  searchTerm: string;
}

// CalendarView.tsx
const [filters, setFilters] = useState<CalendarFilters>({
  medicos: [],
  especialidades: [],
  tiposProcedimento: [],
  statusLiberacao: [],
  mostrarSomenteComGrade: false,
  mostrarSomenteComAgendamentos: false,
  searchTerm: ''
});

// Função para aplicar filtros
const agendamentosFiltrados = useMemo(() => {
  return agendamentos.filter(agendamento => {
    // Filtro por médico
    if (filters.medicos.length > 0 && !filters.medicos.includes(agendamento.medicoId)) {
      return false;
    }
    
    // Filtro por especialidade
    if (filters.especialidades.length > 0) {
      const medico = medicos.find(m => m.id === agendamento.medicoId);
      if (!medico || !filters.especialidades.includes(medico.especialidadeId || '')) {
        return false;
      }
    }
    
    // Filtro por tipo
    if (filters.tiposProcedimento.length > 0) {
      const procedimento = procedimentos.find(p => p.id === agendamento.procedimentoId);
      if (!procedimento || !filters.tiposProcedimento.includes(procedimento.tipo)) {
        return false;
      }
    }
    
    // Filtro por status
    if (filters.statusLiberacao.length > 0) {
      const status = agendamento.statusLiberacao === 'v' ? 'liberado' : 'pendente';
      if (!filters.statusLiberacao.includes(status)) {
        return false;
      }
    }
    
    // Filtro por busca
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      const medico = medicos.find(m => m.id === agendamento.medicoId);
      const procedimento = procedimentos.find(p => p.id === agendamento.procedimentoId);
      
      const matches = 
        agendamento.nome.toLowerCase().includes(term) ||
        medico?.nome.toLowerCase().includes(term) ||
        procedimento?.nome.toLowerCase().includes(term);
      
      if (!matches) return false;
    }
    
    return true;
  });
}, [agendamentos, filters, medicos, procedimentos]);
```

### Componente de Filtros

```typescript
// components/CalendarFilters.tsx
import React from 'react';
import { CalendarFilters, Medico, Especialidade } from '../types';
import { Input, Select } from './ui';

interface CalendarFiltersProps {
  filters: CalendarFilters;
  onChange: (filters: CalendarFilters) => void;
  medicos: Medico[];
  especialidades: Especialidade[];
}

export const CalendarFiltersComponent: React.FC<CalendarFiltersProps> = ({
  filters,
  onChange,
  medicos,
  especialidades
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      {/* Barra de busca sempre visível */}
      <div className="flex gap-2 mb-2">
        <Input
          type="text"
          placeholder="🔍 Buscar paciente, médico ou procedimento..."
          value={filters.searchTerm}
          onChange={(e) => onChange({ ...filters, searchTerm: e.target.value })}
          className="flex-1"
        />
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium"
        >
          Filtros {isExpanded ? '▲' : '▼'}
        </button>
        
        {/* Contador de filtros ativos */}
        {getActiveFiltersCount(filters) > 0 && (
          <span className="px-3 py-2 bg-primary text-white rounded-lg">
            {getActiveFiltersCount(filters)}
          </span>
        )}
      </div>
      
      {/* Filtros expandidos */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {/* Filtro por médico */}
          <div>
            <label className="block text-sm font-medium mb-2">Médicos</label>
            <Select
              multiple
              value={filters.medicos}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value);
                onChange({ ...filters, medicos: selected });
              }}
              className="w-full"
            >
              <option value="">Todos</option>
              {medicos.map(m => (
                <option key={m.id} value={m.id}>{m.nome}</option>
              ))}
            </Select>
          </div>
          
          {/* Filtro por especialidade */}
          <div>
            <label className="block text-sm font-medium mb-2">Especialidades</label>
            <Select
              multiple
              value={filters.especialidades}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value);
                onChange({ ...filters, especialidades: selected });
              }}
              className="w-full"
            >
              <option value="">Todas</option>
              {especialidades.map(e => (
                <option key={e.id} value={e.id}>{e.nome}</option>
              ))}
            </Select>
          </div>
          
          {/* Filtro por tipo */}
          <div>
            <label className="block text-sm font-medium mb-2">Tipo de Procedimento</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.tiposProcedimento.includes('cirurgico')}
                  onChange={(e) => {
                    const tipos = e.target.checked
                      ? [...filters.tiposProcedimento, 'cirurgico']
                      : filters.tiposProcedimento.filter(t => t !== 'cirurgico');
                    onChange({ ...filters, tiposProcedimento: tipos });
                  }}
                  className="mr-2"
                />
                Cirúrgico
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.tiposProcedimento.includes('ambulatorial')}
                  onChange={(e) => {
                    const tipos = e.target.checked
                      ? [...filters.tiposProcedimento, 'ambulatorial']
                      : filters.tiposProcedimento.filter(t => t !== 'ambulatorial');
                    onChange({ ...filters, tiposProcedimento: tipos });
                  }}
                  className="mr-2"
                />
                Ambulatorial
              </label>
            </div>
          </div>
          
          {/* Opções adicionais */}
          <div className="md:col-span-3">
            <label className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={filters.mostrarSomenteComGrade}
                onChange={(e) => onChange({ ...filters, mostrarSomenteComGrade: e.target.checked })}
                className="mr-2"
              />
              Mostrar apenas dias com grade cirúrgica
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.mostrarSomenteComAgendamentos}
                onChange={(e) => onChange({ ...filters, mostrarSomenteComAgendamentos: e.target.checked })}
                className="mr-2"
              />
              Mostrar apenas dias com agendamentos
            </label>
          </div>
          
          {/* Botão limpar filtros */}
          <div className="md:col-span-3 flex justify-end">
            <button
              onClick={() => onChange({
                medicos: [],
                especialidades: [],
                tiposProcedimento: [],
                statusLiberacao: [],
                mostrarSomenteComGrade: false,
                mostrarSomenteComAgendamentos: false,
                searchTerm: ''
              })}
              className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
            >
              Limpar todos os filtros
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

function getActiveFiltersCount(filters: CalendarFilters): number {
  let count = 0;
  if (filters.medicos.length > 0) count++;
  if (filters.especialidades.length > 0) count++;
  if (filters.tiposProcedimento.length > 0) count++;
  if (filters.statusLiberacao.length > 0) count++;
  if (filters.mostrarSomenteComGrade) count++;
  if (filters.mostrarSomenteComAgendamentos) count++;
  if (filters.searchTerm) count++;
  return count;
}
```

---

## 📊 MÚLTIPLAS VISUALIZAÇÕES

### Tipos e Componentes

```typescript
// types.ts
export type CalendarViewMode = 'compact' | 'detailed' | 'by-doctor' | 'weekly';

// CalendarView.tsx
const [viewMode, setViewMode] = useState<CalendarViewMode>('compact');

// Componente seletor de visualização
const ViewModeSelector: React.FC<{
  mode: CalendarViewMode;
  onChange: (mode: CalendarViewMode) => void;
}> = ({ mode, onChange }) => (
  <div className="flex gap-2 bg-slate-100 rounded-lg p-1">
    <button
      onClick={() => onChange('compact')}
      className={`px-4 py-2 rounded-lg transition-colors ${
        mode === 'compact' ? 'bg-white shadow-sm' : 'hover:bg-slate-200'
      }`}
    >
      📅 Compacta
    </button>
    <button
      onClick={() => onChange('detailed')}
      className={`px-4 py-2 rounded-lg transition-colors ${
        mode === 'detailed' ? 'bg-white shadow-sm' : 'hover:bg-slate-200'
      }`}
    >
      📋 Detalhada
    </button>
    <button
      onClick={() => onChange('by-doctor')}
      className={`px-4 py-2 rounded-lg transition-colors ${
        mode === 'by-doctor' ? 'bg-white shadow-sm' : 'hover:bg-slate-200'
      }`}
    >
      👨‍⚕️ Por Médico
    </button>
    <button
      onClick={() => onChange('weekly')}
      className={`px-4 py-2 rounded-lg transition-colors ${
        mode === 'weekly' ? 'bg-white shadow-sm' : 'hover:bg-slate-200'
      }`}
    >
      📆 Semanal
    </button>
  </div>
);

// Renderização condicional
return (
  <div>
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-3xl font-bold text-slate-800">Calendário de Agendamentos</h2>
      <ViewModeSelector mode={viewMode} onChange={setViewMode} />
    </div>
    
    {viewMode === 'compact' && <CalendarCompactView {...props} />}
    {viewMode === 'detailed' && <CalendarDetailedView {...props} />}
    {viewMode === 'by-doctor' && <CalendarByDoctorView {...props} />}
    {viewMode === 'weekly' && <CalendarWeeklyView {...props} />}
  </div>
);
```

### Visualização Detalhada

```typescript
// components/CalendarDetailedView.tsx
export const CalendarDetailedView: React.FC<CalendarViewProps> = ({
  agendamentos,
  medicos,
  procedimentos,
  currentDate
}) => {
  // Agrupar por dia
  const agendamentosPorDia = useMemo(() => {
    const map = new Map<string, Agendamento[]>();
    agendamentos.forEach(a => {
      if (!map.has(a.dataAgendamento)) {
        map.set(a.dataAgendamento, []);
      }
      map.get(a.dataAgendamento)!.push(a);
    });
    return map;
  }, [agendamentos]);
  
  return (
    <div className="space-y-4">
      {Array.from(agendamentosPorDia.entries()).map(([dateString, dayAgendamentos]) => {
        const date = new Date(dateString);
        
        return (
          <div key={dateString} className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-bold mb-3">
              {date.toLocaleDateString('pt-BR', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long' 
              })}
            </h3>
            
            <div className="space-y-2">
              {dayAgendamentos.map(agendamento => {
                const medico = medicos.find(m => m.id === agendamento.medicoId);
                const procedimento = procedimentos.find(p => p.id === agendamento.procedimentoId);
                
                return (
                  <div
                    key={agendamento.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border-l-4 border-primary"
                  >
                    <div>
                      <p className="font-semibold">{agendamento.nome}</p>
                      <p className="text-sm text-slate-600">
                        {medico?.nome} • {procedimento?.nome}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        procedimento?.tipo === 'cirurgico' 
                          ? 'bg-red-100 text-red-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {procedimento?.tipo === 'cirurgico' ? 'Cirúrgico' : 'Ambulatorial'}
                      </span>
                      
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        agendamento.statusLiberacao === 'v'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {agendamento.statusLiberacao === 'v' ? 'Liberado' : 'Pendente'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
```

---

## ⚡ PERFORMANCE COM USEMEMO

```typescript
// CalendarView.tsx - Versão otimizada

// 1. Memoizar dias com grade
const diasComGrade = useMemo(() => 
  GradeCirurgicaStorageService.getDiasComGrade(
    hospitalId,
    currentDate.getFullYear(),
    currentDate.getMonth()
  ),
  [hospitalId, currentDate]
);

// 2. Pré-processar agendamentos por data
const agendamentosPorData = useMemo(() => {
  const map = new Map<string, Agendamento[]>();
  agendamentosFiltrados.forEach(a => {
    if (!map.has(a.dataAgendamento)) {
      map.set(a.dataAgendamento, []);
    }
    map.get(a.dataAgendamento)!.push(a);
  });
  return map;
}, [agendamentosFiltrados]);

// 3. Pré-processar metas por dia da semana
const metasPorDiaSemana = useMemo(() => {
  const map = new Map<DiaSemana, MetaEspecialidade[]>();
  metasEspecialidades.filter(m => m.ativo).forEach(m => {
    if (!map.has(m.diaSemana)) {
      map.set(m.diaSemana, []);
    }
    map.get(m.diaSemana)!.push(m);
  });
  return map;
}, [metasEspecialidades]);

// 4. Mapear médicos por ID
const medicosMap = useMemo(() => {
  const map = new Map<string, Medico>();
  medicos.forEach(m => map.set(m.id, m));
  return map;
}, [medicos]);

// 5. Mapear procedimentos por ID
const procedimentosMap = useMemo(() => {
  const map = new Map<string, Procedimento>();
  procedimentos.forEach(p => map.set(p.id, p));
  return map;
}, [procedimentos]);

// Usar nos loops
for (let day = 1; day <= daysInMonth; day++) {
  const dateString = date.toISOString().split('T')[0];
  const dayAppointments = agendamentosPorData.get(dateString) || [];
  const diaSemana = diaSemanaMap[date.getDay()];
  const metasDoDia = metasPorDiaSemana.get(diaSemana) || [];
  
  // Agrupar por médico
  const agendamentosPorMedico = dayAppointments.reduce((acc, agendamento) => {
    const medico = medicosMap.get(agendamento.medicoId);
    if (medico) {
      if (!acc[medico.id]) {
        acc[medico.id] = {
          medico,
          count: 0,
          especialidadeId: medico.especialidadeId || ''
        };
      }
      acc[medico.id].count++;
    }
    return acc;
  }, {} as Record<string, { medico: Medico; count: number; especialidadeId: string }>);
  
  // Renderizar dia...
}
```

---

## 💬 TOOLTIPS INFORMATIVOS

```typescript
// components/ui/Tooltip.tsx
import React, { useState } from 'react';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      
      {isVisible && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg shadow-lg whitespace-nowrap">
          {content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800"></div>
        </div>
      )}
    </div>
  );
};

// Uso no CalendarView
<Tooltip
  content={
    <div className="space-y-1">
      <div className="font-bold">{medico.nome}</div>
      <div>Especialidade: {especialidade?.nome}</div>
      <div>Agendamentos: {count}/{metaQuantidade}</div>
      <div className={count >= metaQuantidade ? 'text-green-400' : 'text-red-400'}>
        {count >= metaQuantidade ? '✓ Meta atingida' : `⚠ Faltam ${metaQuantidade - count}`}
      </div>
    </div>
  }
>
  <div className="text-[8px] leading-tight">
    <div className="truncate font-medium text-slate-700">
      {medico.nome.split(' ')[0]}
    </div>
    {/* Barra de progresso... */}
  </div>
</Tooltip>
```

---

## ⚡ AÇÕES RÁPIDAS

```typescript
// CalendarDay.tsx - Versão com ações
<div
  className="border-r border-b p-1 relative overflow-hidden group"
>
  {/* Número do dia */}
  <div className="flex justify-center items-center">
    {day}
  </div>
  
  {/* Botões de ação (aparecem no hover) */}
  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
    <div className="flex gap-1">
      {/* Visualizar agendamentos */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleViewAppointments(date);
        }}
        className="w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center"
        title="Ver agendamentos"
      >
        👁️
      </button>
      
      {/* Novo agendamento */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleCreateAppointment(date);
        }}
        className="w-8 h-8 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center"
        title="Novo agendamento"
      >
        +
      </button>
      
      {/* Configurar grade */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleConfigureGrade(date);
        }}
        className="w-8 h-8 bg-purple-500 hover:bg-purple-600 text-white rounded-full shadow-lg flex items-center justify-center"
        title="Configurar grade cirúrgica"
      >
        ⚙️
      </button>
    </div>
  </div>
  
  {/* Conteúdo do dia (barras de progresso, etc) */}
  {/* ... */}
</div>
```

---

## 📱 RESPONSIVIDADE

```typescript
// hooks/useMediaQuery.ts
import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  
  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);
  
  return matches;
}

// CalendarView.tsx
import { useMediaQuery } from '../hooks/useMediaQuery';

const CalendarView: React.FC<CalendarViewProps> = (props) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(max-width: 1024px)');
  
  if (isMobile) {
    return <CalendarListView {...props} />;
  }
  
  return (
    <div className={`
      ${isMobile ? 'text-sm' : 'text-base'}
      ${isTablet ? 'p-2' : 'p-4'}
    `}>
      {/* Calendário normal */}
    </div>
  );
};

// CalendarListView.tsx - Versão mobile
export const CalendarListView: React.FC<CalendarViewProps> = ({
  agendamentos,
  medicos,
  procedimentos,
  currentDate
}) => {
  return (
    <div className="space-y-4">
      <div className="sticky top-0 bg-white z-10 pb-4 border-b">
        <h2 className="text-2xl font-bold">
          {currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
        </h2>
      </div>
      
      {agendamentos.map(agendamento => {
        const medico = medicos.find(m => m.id === agendamento.medicoId);
        const procedimento = procedimentos.find(p => p.id === agendamento.procedimentoId);
        
        return (
          <div key={agendamento.id} className="bg-white rounded-lg shadow-md p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-bold text-lg">{agendamento.nome}</p>
                <p className="text-sm text-slate-600">
                  {new Date(agendamento.dataAgendamento).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs ${
                agendamento.statusLiberacao === 'v'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-orange-100 text-orange-700'
              }`}>
                {agendamento.statusLiberacao === 'v' ? 'Liberado' : 'Pendente'}
              </span>
            </div>
            
            <div className="space-y-1 text-sm">
              <p className="flex items-center gap-2">
                <span className="font-medium">👨‍⚕️ Médico:</span>
                {medico?.nome}
              </p>
              <p className="flex items-center gap-2">
                <span className="font-medium">🏥 Procedimento:</span>
                {procedimento?.nome}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
```

---

## 🎯 CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1 - Correções (1-2 dias)
- [ ] Implementar debug.ts
- [ ] Criar GradeCirurgicaStorageService
- [ ] Adicionar useMemo para performance
- [ ] Corrigir cálculo de mês
- [ ] Remover código morto

### Fase 2 - Filtros (2-3 dias)
- [ ] Criar CalendarFiltersComponent
- [ ] Implementar lógica de filtros
- [ ] Adicionar busca
- [ ] Testar todas as combinações

### Fase 3 - Visualizações (3-5 dias)
- [ ] Criar ViewModeSelector
- [ ] Implementar CalendarDetailedView
- [ ] Implementar CalendarByDoctorView
- [ ] Implementar CalendarWeeklyView

### Fase 4 - UX (2-3 dias)
- [ ] Implementar Tooltip
- [ ] Adicionar ações rápidas
- [ ] Melhorar indicadores visuais
- [ ] Testar em dispositivos reais

### Fase 5 - Responsividade (2-3 dias)
- [ ] Criar useMediaQuery hook
- [ ] Implementar CalendarListView
- [ ] Testar em diferentes tamanhos
- [ ] Ajustar fontes e espaçamentos

---

**Total estimado:** 10-16 dias de desenvolvimento

**Prioridade:** Começar pelas correções críticas e filtros básicos

