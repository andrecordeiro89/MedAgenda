import React, { useState, useEffect, useRef } from 'react';
import { Cidade } from '../types';
import { cidadeService } from '../services/supabase';

interface SelectCidadeProps {
  value: string;                    // Nome da cidade selecionada
  onChange: (cidade: string) => void; // Callback com nome da cidade
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

export const SelectCidade: React.FC<SelectCidadeProps> = ({
  value,
  onChange,
  placeholder = 'Digite para buscar...',
  className = '',
  disabled = false,
  required = false
}) => {
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [cidadesFiltradas, setCidadesFiltradas] = useState<Cidade[]>([]);
  const [inputValue, setInputValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Carregar todas as cidades ao montar
  useEffect(() => {
    loadCidades();
  }, []);

  // Sincronizar inputValue com value externo
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadCidades = async () => {
    setLoading(true);
    try {
      const data = await cidadeService.getAll(); // Carregar todas as cidades
      setCidades(data);
      setCidadesFiltradas(data);
      console.log('✅ Cidades carregadas para select:', data.length);
    } catch (error) {
      console.error('❌ Erro ao carregar cidades:', error);
      setCidades([]);
      setCidadesFiltradas([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setInputValue(term);
    setIsOpen(true);

    // Filtrar cidades localmente (busca case-insensitive)
    if (term.trim() === '') {
      setCidadesFiltradas(cidades);
    } else {
      const filtered = cidades.filter(cidade =>
        cidade.nome.toLowerCase().includes(term.toLowerCase())
      );
      setCidadesFiltradas(filtered);
    }
  };

  const handleSelectCidade = (cidade: Cidade) => {
    setInputValue(cidade.nome);
    onChange(cidade.nome); // Retorna o nome da cidade
    setIsOpen(false);
  };

  const handleFocus = () => {
    setIsOpen(true);
    setCidadesFiltradas(cidades);
  };

  const handleClear = () => {
    setInputValue('');
    onChange('');
    setCidadesFiltradas(cidades);
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      {/* Input */}
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled || loading}
          required={required}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors pr-20"
        />
        
        {/* Ícones de ação */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {/* Loading spinner */}
          {loading && (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
          )}
          
          {/* Botão limpar */}
          {inputValue && !loading && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Limpar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          
          {/* Ícone dropdown */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            disabled={loading}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title={isOpen ? "Fechar lista" : "Abrir lista"}
          >
            <svg 
              className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Dropdown de opções */}
      {isOpen && !loading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {cidadesFiltradas.length > 0 ? (
            <ul>
              {cidadesFiltradas.map((cidade) => (
                <li key={cidade.id}>
                  <button
                    type="button"
                    onClick={() => handleSelectCidade(cidade)}
                    className="w-full px-4 py-2 text-left hover:bg-blue-50 transition-colors group"
                  >
                    <span className="font-medium text-gray-900 group-hover:text-blue-600">
                      {cidade.nome}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-6 text-center text-gray-500">
              <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-sm font-medium">Nenhuma cidade encontrada</p>
              <p className="text-xs mt-1">Tente buscar por outro termo</p>
            </div>
          )}
        </div>
      )}
      
      {/* Indicador de quantidade de resultados */}
      {isOpen && !loading && cidadesFiltradas.length > 0 && inputValue.trim() && (
        <div className="absolute z-50 w-full mt-1 -top-6 right-0 text-right">
          <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded shadow-sm border border-gray-200">
            {cidadesFiltradas.length} {cidadesFiltradas.length === 1 ? 'cidade' : 'cidades'}
          </span>
        </div>
      )}
    </div>
  );
};

