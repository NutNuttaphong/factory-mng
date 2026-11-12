import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, X, Filter } from 'lucide-react';

export interface TableProps {
  headers: string[];
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
}

export const Table: React.FC<TableProps> = ({
  headers,
  children,
  className = '',
  containerClassName = ''
}) => {
  return (
    <div className={`table-responsive ${containerClassName}`}>
      <table className={`custom-table ${className}`}>
        <thead>
          <tr>
            {headers.map((header, idx) => (
              <th key={idx}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
};

export interface FilterOption<T> {
  label: string;
  options: string[];
  filterFn: (item: T, selected: string) => boolean;
}

export interface DataTableProps<T> {
  data: T[];
  headers: string[];
  renderRow: (item: T, index: number) => React.ReactNode;
  searchPlaceholder?: string;
  searchFilter?: (item: T, query: string) => boolean;
  filterOptions?: FilterOption<T>[];
  initialPageSize?: number;
  pageSize?: number;
  emptyMessage?: string;
  className?: string;
  containerClassName?: string;
}

export function DataTable<T>({
  data,
  headers,
  renderRow,
  searchPlaceholder = 'Search...',
  searchFilter,
  filterOptions = [],
  initialPageSize,
  pageSize: customPageSize,
  emptyMessage = 'No matching records found.',
  className = '',
  containerClassName = ''
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<Record<number, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(customPageSize || initialPageSize || 8);

  // Filtered dataset
  const filteredData = useMemo(() => {
    let result = data;

    // 1. Text search
    if (searchQuery.trim() && searchFilter) {
      result = result.filter((item) => searchFilter(item, searchQuery.trim()));
    }

    // 2. Custom filters
    filterOptions.forEach((f, idx) => {
      const selected = selectedFilters[idx];
      if (selected && selected !== 'ALL') {
        result = result.filter((item) => f.filterFn(item, selected));
      }
    });

    return result;
  }, [data, searchQuery, searchFilter, filterOptions, selectedFilters]);

  // Pagination calculation
  const totalItems = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * pageSize;
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, validCurrentPage, pageSize]);

  const handleFilterChange = (index: number, value: string) => {
    setSelectedFilters((prev) => ({ ...prev, [index]: value }));
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedFilters({});
    setCurrentPage(1);
  };

  const startEntry = totalItems === 0 ? 0 : (validCurrentPage - 1) * pageSize + 1;
  const endEntry = Math.min(totalItems, validCurrentPage * pageSize);

  const hasActiveFilters = searchQuery.trim() !== '' || Object.values(selectedFilters).some((v) => v && v !== 'ALL');

  return (
    <div className={`data-table-wrapper ${containerClassName}`}>
      {(searchFilter || filterOptions.length > 0) && (
        <div className="data-table-toolbar">
          <div className="data-table-search-group">
            {searchFilter && (
              <div className="data-table-search">
                <Search size={15} className="data-table-search-icon" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  className="data-table-search-input"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={() => handleSearchChange('')}
                    className="data-table-search-clear"
                    title="Clear search"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            )}

            {filterOptions.map((opt, idx) => (
              <div key={idx} className="data-table-filter-item">
                <Filter size={13} className="data-table-filter-icon" />
                <select
                  className="data-table-filter-select"
                  value={selectedFilters[idx] || 'ALL'}
                  onChange={(e) => handleFilterChange(idx, e.target.value)}
                >
                  {opt.options.map((o) => (
                    <option key={o} value={o}>
                      {o === 'ALL' ? `All ${opt.label}` : o}
                    </option>
                  ))}
                </select>
              </div>
            ))}

            {hasActiveFilters && (
              <button onClick={resetFilters} className="data-table-reset-btn" title="Reset all filters">
                Clear filters
              </button>
            )}
          </div>

          <div className="data-table-info-badge">
            {totalItems} {totalItems === 1 ? 'record' : 'records'}
          </div>
        </div>
      )}

      <div className="table-responsive">
        <table className={`custom-table ${className}`}>
          <thead>
            <tr>
              {headers.map((header, idx) => (
                <th key={idx}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="data-table-empty">
                  <div className="data-table-empty-content">
                    <p>{emptyMessage}</p>
                    {hasActiveFilters && (
                      <button onClick={resetFilters} className="data-table-empty-reset">
                        Reset filters & search
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((item, index) => renderRow(item, index))
            )}
          </tbody>
        </table>
      </div>

      {totalItems > 0 && (
        <div className="data-table-pagination">
          <div className="data-table-page-info">
            Showing <span className="highlight">{startEntry}</span> to <span className="highlight">{endEntry}</span> of <span className="highlight">{totalItems}</span> entries
          </div>

          <div className="data-table-page-controls">
            <div className="data-table-page-size">
              <label>Rows:</label>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={5}>5</option>
                <option value={8}>8</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
              </select>
            </div>

            <div className="data-table-page-nav">
              <button
                className="data-table-page-btn"
                disabled={validCurrentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                title="Previous page"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="data-table-page-number">
                {validCurrentPage} / {totalPages}
              </span>
              <button
                className="data-table-page-btn"
                disabled={validCurrentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                title="Next page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

