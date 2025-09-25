import * as XLSX from 'xlsx';
import { ExternalProcedureRecord } from '../types';

export interface ExcelExportOptions {
  filename?: string;
  sheetName?: string;
}

export function exportProceduresToExcel(
  procedures: ExternalProcedureRecord[],
  options: ExcelExportOptions = {}
) {
  const {
    filename = `Procedimentos_Unicos_${new Date().toISOString().split('T')[0]}.xlsx`,
    sheetName = 'Procedimentos Únicos'
  } = options;

  try {
    // Preparar os dados para exportação com as 2 colunas principais
    const exportData = procedures.map((procedure, index) => ({
      'Nº': index + 1,
      'Código do Procedimento': procedure.codigo_procedimento_original || '',
      'Descrição': procedure.procedure_description || ''
    }));

    // Criar workbook e worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Configurar largura das colunas
    const columnWidths = [
      { wch: 5 },   // Nº
      { wch: 20 },  // Código do Procedimento
      { wch: 60 }   // Descrição
    ];
    worksheet['!cols'] = columnWidths;

    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Gerar e baixar o arquivo
    XLSX.writeFile(workbook, filename);

    return {
      success: true,
      filename,
      recordCount: procedures.length,
      message: `Relatório exportado com sucesso! ${procedures.length} registros salvos em ${filename}`
    };

  } catch (error) {
    console.error('Erro ao exportar para Excel:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      message: 'Erro ao gerar o relatório Excel'
    };
  }
}

export function exportAllProceduresToExcel(
  allProcedures: ExternalProcedureRecord[],
  filteredProcedures: ExternalProcedureRecord[],
  options: ExcelExportOptions = {}
) {
  const {
    filename = `Relatorio_Procedimentos_${new Date().toISOString().split('T')[0]}.xlsx`,
    sheetName = 'Procedimentos'
  } = options;

  try {
    // Usar os dados filtrados se houver filtros aplicados, senão usar todos
    const dataToExport = filteredProcedures.length < allProcedures.length ? filteredProcedures : allProcedures;
    
    return exportProceduresToExcel(dataToExport, { filename, sheetName });

  } catch (error) {
    console.error('Erro ao exportar todos os procedimentos:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      message: 'Erro ao gerar o relatório completo'
    };
  }
}