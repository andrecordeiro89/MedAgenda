import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Button, Modal } from './ui';
import { useToast } from '../contexts/ToastContext';

interface ProcedimentoExcelRow {
  procedimentos: string;
}

interface ProcedimentoImportData extends ProcedimentoExcelRow {
  rowNumber: number;
  status: 'pending' | 'success' | 'error';
  error?: string;
}

interface ExcelImportProcedimentosProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
  hospitalId: string;
}

const ExcelImportProcedimentos: React.FC<ExcelImportProcedimentosProps> = ({
  isOpen,
  onClose,
  onImportComplete,
  hospitalId
}) => {
  const { warning, error: toastError } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<ProcedimentoImportData[]>([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importComplete, setImportComplete] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      readExcelFile(selectedFile);
    }
  };

  const readExcelFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

        console.log('📊 Dados lidos do Excel:', jsonData);
        console.log('📋 Primeira linha (para debug das colunas):', jsonData[0]);
        
        if (jsonData.length > 0) {
          console.log('🔍 Colunas encontradas no Excel:', Object.keys(jsonData[0]));
        }

        // Função auxiliar para normalizar nomes de colunas
        const normalizeKey = (str: string): string => {
          return str
            .toLowerCase()
            .trim()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/g, '');
        };

        // Função para buscar valor em um objeto com múltiplas variações de chave
        const findValue = (row: any, ...keys: string[]): string => {
          // Primeiro tenta encontrar a chave exata
          for (const key of keys) {
            if (row[key] !== undefined && row[key] !== null) {
              return String(row[key]).trim();
            }
          }
          
          // Se não encontrar, tenta normalizar e buscar
          const normalizedKeys = keys.map(normalizeKey);
          const rowKeys = Object.keys(row);
          
          for (const rowKey of rowKeys) {
            const normalizedRowKey = normalizeKey(rowKey);
            if (normalizedKeys.includes(normalizedRowKey)) {
              const value = row[rowKey];
              return value !== undefined && value !== null ? String(value).trim() : '';
            }
          }
          
          return '';
        };

        // Mapear dados do Excel para o formato esperado
        const mappedData: ProcedimentoImportData[] = jsonData.map((row, index) => {
          const procedimentos = findValue(
            row, 
            'procedimentos', 'PROCEDIMENTOS', 'Procedimentos',
            'procedimento', 'PROCEDIMENTO', 'Procedimento',
            'nome', 'NOME', 'Nome',
            'procedure', 'PROCEDURE', 'Procedure'
          );
          
          console.log(`📝 Linha ${index + 2}:`, { procedimentos });
          
          return {
            procedimentos,
            rowNumber: index + 2,
            status: 'pending'
          };
        });

        console.log('✅ Dados mapeados:', mappedData);
        
        // Validar se conseguiu mapear pelo menos alguns dados
        const hasData = mappedData.some(row => row.procedimentos);
        
        if (!hasData) {
          warning('Não foi possível identificar a coluna do Excel. Verifique o console (F12) para mais detalhes');
        }
        
        setPreviewData(mappedData);
      } catch (error) {
        console.error('❌ Erro ao ler arquivo Excel:', error);
        toastError('Erro ao ler arquivo Excel. Verifique o formato');
      }
    };
    reader.readAsBinaryString(file);
  };

  const validateRow = (row: ProcedimentoImportData): string | null => {
    if (!row.procedimentos || row.procedimentos.trim() === '') {
      return 'Nome do procedimento é obrigatório';
    }
    return null;
  };

  const handleImport = async () => {
    setImporting(true);
    setImportProgress(0);

    const updatedData = [...previewData];
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < updatedData.length; i++) {
      const row = updatedData[i];
      
      // Validar linha
      const validationError = validateRow(row);
      if (validationError) {
        row.status = 'error';
        row.error = validationError;
        errorCount++;
        setPreviewData([...updatedData]);
        setImportProgress(((i + 1) / updatedData.length) * 100);
        continue;
      }

      try {
        // Importar o procedimento usando a API do Supabase
        const { supabase } = await import('../services/supabase');
        
        const procedimentoData = {
          nome: row.procedimentos.trim(),
          tipo: 'ambulatorial', // Valor padrão
          duracao_estimada_min: 30, // Valor padrão
          descricao: '', // Vazio por padrão
          especialidade: null,
          especialidade_id: null,
          hospital_id: hospitalId
        };

        console.log(`📝 Importando procedimento ${i + 1}/${updatedData.length}:`, procedimentoData);

        const { data, error } = await supabase
          .from('procedimentos')
          .insert([procedimentoData])
          .select()
          .single();

        if (error) {
          throw new Error(error.message);
        }

        row.status = 'success';
        successCount++;
        console.log(`✅ Procedimento importado com sucesso:`, data);
      } catch (error: any) {
        console.error(`❌ Erro ao importar procedimento da linha ${row.rowNumber}:`, error);
        row.status = 'error';
        row.error = error.message || 'Erro desconhecido';
        errorCount++;
      }

      setPreviewData([...updatedData]);
      setImportProgress(((i + 1) / updatedData.length) * 100);
    }

    setImporting(false);
    setImportComplete(true);

    console.log(`📊 Importação concluída: ${successCount} sucessos, ${errorCount} erros`);

    // Aguardar 2 segundos antes de fechar e atualizar
    setTimeout(() => {
      if (successCount > 0) {
        onImportComplete();
      }
    }, 2000);
  };

  const handleClose = () => {
    setFile(null);
    setPreviewData([]);
    setImporting(false);
    setImportProgress(0);
    setImportComplete(false);
    onClose();
  };

  const successCount = previewData.filter(r => r.status === 'success').length;
  const errorCount = previewData.filter(r => r.status === 'error').length;
  const pendingCount = previewData.filter(r => r.status === 'pending').length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Importar Procedimentos via Excel"
      size="large"
    >
      <div className="space-y-4">
        {/* Instruções */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">📋 Formato do Excel</h4>
          <p className="text-xs text-blue-800 mb-2">
            O arquivo Excel deve conter a seguinte coluna na primeira linha (cabeçalho):
          </p>
          <ul className="text-xs text-blue-800 list-disc list-inside space-y-1">
            <li><strong>procedimentos</strong>: Nome do procedimento</li>
          </ul>
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-xs text-yellow-800">
              💡 <strong>Informações importantes:</strong>
            </p>
            <ul className="text-xs text-yellow-800 list-disc list-inside mt-1 space-y-1">
              <li>O nome da coluna pode ter maiúsculas ou minúsculas</li>
              <li>Os procedimentos serão vinculados automaticamente ao seu hospital</li>
              <li>Tipo padrão: "ambulatorial" (pode ser alterado depois)</li>
              <li>Duração padrão: 30 minutos (pode ser alterado depois)</li>
            </ul>
          </div>
        </div>

        {/* Upload de arquivo */}
        {!file && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
              id="excel-upload-procedimentos"
            />
            <label
              htmlFor="excel-upload-procedimentos"
              className="cursor-pointer inline-flex flex-col items-center"
            >
              <svg
                className="w-12 h-12 text-gray-400 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <span className="text-sm font-medium text-gray-700">
                Clique para selecionar o arquivo Excel
              </span>
              <span className="text-xs text-gray-500 mt-1">
                Formatos aceitos: .xlsx, .xls
              </span>
            </label>
          </div>
        )}

        {/* Preview dos dados */}
        {file && previewData.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-900">
                Preview dos Dados ({previewData.length} procedimentos)
              </h4>
              {!importing && !importComplete && (
                <button
                  onClick={() => {
                    setFile(null);
                    setPreviewData([]);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Trocar arquivo
                </button>
              )}
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-gray-100 rounded p-2">
                <div className="font-semibold text-gray-600">Pendentes</div>
                <div className="text-lg font-bold text-gray-800">{pendingCount}</div>
              </div>
              <div className="bg-green-100 rounded p-2">
                <div className="font-semibold text-green-600">Sucessos</div>
                <div className="text-lg font-bold text-green-800">{successCount}</div>
              </div>
              <div className="bg-red-100 rounded p-2">
                <div className="font-semibold text-red-600">Erros</div>
                <div className="text-lg font-bold text-red-800">{errorCount}</div>
              </div>
            </div>

            {/* Barra de progresso */}
            {importing && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Importando...</span>
                  <span>{Math.round(importProgress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${importProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Tabela de preview */}
            <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Linha</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Procedimento</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row, index) => (
                    <tr
                      key={index}
                      className={`border-t ${
                        row.status === 'success'
                          ? 'bg-green-50'
                          : row.status === 'error'
                          ? 'bg-red-50'
                          : 'bg-white'
                      }`}
                    >
                      <td className="px-3 py-2 text-gray-600">{row.rowNumber}</td>
                      <td className="px-3 py-2">{row.procedimentos}</td>
                      <td className="px-3 py-2">
                        {row.status === 'pending' && (
                          <span className="text-gray-500">⏳ Pendente</span>
                        )}
                        {row.status === 'success' && (
                          <span className="text-green-600">✅ Sucesso</span>
                        )}
                        {row.status === 'error' && (
                          <span className="text-red-600" title={row.error}>
                            ❌ {row.error}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Botões de ação */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="secondary" onClick={handleClose} disabled={importing}>
            {importComplete ? 'Fechar' : 'Cancelar'}
          </Button>
          {previewData.length > 0 && !importComplete && (
            <Button
              onClick={handleImport}
              disabled={importing}
              className="bg-green-600 hover:bg-green-700"
            >
              {importing ? (
                <>
                  <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Importando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Importar {previewData.length} Procedimento(s)
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ExcelImportProcedimentos;

