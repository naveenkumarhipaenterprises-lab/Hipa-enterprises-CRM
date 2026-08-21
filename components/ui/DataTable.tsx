import React from 'react';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  isLoading?: boolean;
  emptyMessage?: string;
  currentPage?: number;
  totalPages?: number;
  totalEntries?: number;
  onPageChange?: (page: number) => void;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyMessage = "No records found.",
  currentPage = 1,
  totalPages = 1,
  totalEntries = 0,
  onPageChange,
}: DataTableProps<T>) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-[0_4px_12px_rgba(51,51,51,0.04)] overflow-hidden flex flex-col">
      <div className="overflow-x-auto w-full custom-scrollbar">
        <table className="w-full text-left border-collapse whitespace-nowrap min-w-[800px]">
          <thead className="bg-surface-bright border-b border-outline-variant sticky top-0 z-10">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`p-4 font-label-md text-label-md text-on-surface-variant font-semibold uppercase text-[11px] tracking-wider ${
                    col.align === 'center'
                      ? 'text-center'
                      : col.align === 'right'
                      ? 'text-right'
                      : 'text-left'
                  } ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="font-body-md text-body-md text-on-surface divide-y divide-outline-variant/50">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="p-8 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined animate-spin text-[24px] text-primary">
                    progress_activity
                  </span>
                  <p className="mt-2 text-xs font-label-md">Loading entries...</p>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-8 text-center text-on-surface-variant font-body-md">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={keyExtractor(row)} className="table-row-hover transition-colors">
                  {columns.map((col, idx) => (
                    <td
                      key={idx}
                      className={`p-4 ${
                        col.align === 'center'
                          ? 'text-center'
                          : col.align === 'right'
                          ? 'text-right'
                          : 'text-left'
                      }`}
                    >
                      {col.cell
                        ? col.cell(row)
                        : col.accessorKey
                        ? String(row[col.accessorKey] ?? '')
                        : null}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 0 && (
        <div className="p-4 border-t border-outline-variant bg-surface-bright flex flex-col sm:flex-row justify-between items-center gap-4 text-body-sm text-on-surface-variant">
          <div>
            Showing {data.length > 0 ? (currentPage - 1) * 10 + 1 : 0} to{' '}
            {Math.min(currentPage * 10, totalEntries)} of {totalEntries} entries
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1 border border-outline-variant rounded hover:bg-surface-container-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <span className="w-8 h-8 flex items-center justify-center bg-primary text-on-primary rounded font-medium text-xs">
              {currentPage}
            </span>
            <button
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-1 border border-outline-variant rounded hover:bg-surface-container-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
