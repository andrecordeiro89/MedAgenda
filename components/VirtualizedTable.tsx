import React, { useMemo, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ProgressBar } from './ui';

interface Column {
  key: string;
  header: string;
  width?: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface VirtualizedTableProps {
  data: any[];
  columns: Column[];
  height?: number;
  itemHeight?: number;
  className?: string;
  showPagination?: boolean;
  pageSize?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  totalItems?: number;
  expandedRows?: Set<string>;
  onRowExpand?: (rowId: string) => void;
  renderExpandedContent?: (row: any) => React.ReactNode;
  expandedRowHeight?: number;
  loading?: boolean;
  progress?: {
    current: number;
    total: number;
    percentage: number;
    message?: string;
  };
}

export const VirtualizedTable: React.FC<VirtualizedTableProps> = ({
  data,
  columns,
  height = 400,
  itemHeight = 50,
  className = '',
  showPagination = false,
  pageSize = 50,
  currentPage = 1,
  onPageChange,
  totalItems,
  expandedRows = new Set(),
  onRowExpand,
  renderExpandedContent,
  expandedRowHeight = 200,
  loading = false,
  progress
}) => {
  const parentRef = React.useRef<HTMLDivElement>(null);

  // Para paginação virtual, usar apenas os dados da página atual
  const displayData = useMemo(() => {
    // Garantir que data é sempre um array
    const safeData = Array.isArray(data) ? data : [];
    
    if (showPagination && pageSize) {
      const startIndex = (currentPage - 1) * pageSize;
      return safeData.slice(startIndex, startIndex + pageSize);
    }
    return safeData;
  }, [data, showPagination, pageSize, currentPage]);

  // Simplified virtual items - only data rows
  const virtualItems = useMemo(() => {
    // Garantir que displayData é sempre um array antes de usar map
    if (!Array.isArray(displayData)) {
      return [];
    }
    
    return displayData.map((row, index) => ({
      type: 'row' as const,
      data: row,
      id: row.id || row.code || index.toString(),
      index
    }));
  }, [displayData]);

  const virtualizer = useVirtualizer({
    count: virtualItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan: 5,
  });

  const items = virtualizer.getVirtualItems();

  const totalPages = useMemo(() => {
    if (!showPagination) return 1;
    return Math.ceil((totalItems || data.length) / pageSize);
  }, [showPagination, totalItems, data.length, pageSize]);

  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gray-50 border-b">
        <div className="grid gap-4 p-3" style={{
          gridTemplateColumns: columns.map(col => col.width || '1fr').join(' ')
        }}>
          {columns.map((column) => (
            <div key={column.key} className="font-medium text-gray-700 text-sm">
              {column.header}
            </div>
          ))}
        </div>
      </div>

      {/* Virtualized Body */}
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{ height: `${height}px` }}
      >
        {loading ? (
          /* Loading State with Progress Bar */
          <div className="p-8 text-center bg-white">
            <div className="mb-6">
              <ProgressBar 
                progressInfo={{
                  current: progress?.current || 0,
                  total: progress?.total || data.length,
                  percentage: progress?.percentage || 0,
                  message: progress?.message || "Carregando dados..."
                }}
                className="max-w-md mx-auto"
                showPercentage={true}
              />
            </div>
            <p className="text-slate-500 text-sm">
              Aguarde enquanto os dados são carregados...
            </p>
          </div>
        ) : (
          /* Normal Table Content */
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {items.map((virtualItem) => {
              const item = virtualItems[virtualItem.index];
              const row = item.data;
              const rowId = item.id;
              const isExpanded = expandedRows.has(rowId);
              
              return (
                <div key={virtualItem.key}>
                  {/* Regular row */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualItem.size}px`,
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <div className="grid gap-4 p-3 h-full items-center" style={{
                      gridTemplateColumns: columns.map(col => col.width || '1fr').join(' ')
                    }}>
                      {columns.map((column) => (
                        <div key={column.key} className="text-sm text-gray-900 truncate">
                          {column.render 
                            ? column.render(row[column.key], row)
                            : row[column.key] || '-'
                          }
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Expanded content - positioned after the row */}
                  {isExpanded && renderExpandedContent && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: `${expandedRowHeight || 200}px`,
                        transform: `translateY(${virtualItem.start + virtualItem.size}px)`,
                        zIndex: 10,
                      }}
                      className="bg-gray-50 border-b border-gray-200 shadow-sm"
                    >
                      <div className="p-4">
                        {renderExpandedContent(row)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer with count and pagination */}
      <div className="bg-gray-50 border-t px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {showPagination ? (
              <>Mostrando {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, totalItems || data.length)} de {totalItems || data.length} registros</>
            ) : (
              <>Mostrando {data.length} registros</>
            )}
          </div>
          
          {showPagination && totalPages > 1 && onPageChange && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="px-2 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Anterior
              </button>
              <span className="text-sm text-gray-600">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="px-2 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Próxima
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};