import React, { memo, useMemo, useState, useCallback } from "react";
import { usePagination, useFilters } from "../../hooks/useUiStateHooks";

const DataTable = memo(
  ({
    data = [],
    columns = [],
    itemsPerPage = 10,
    searchableColumns = [],
    sortableColumns = [],
    onRowClick = null,
    loading = false,
    emptyMessage = "Nenhum item encontrado",
  }) => {
    const normalizedData = Array.isArray(data) ? data : [];
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState({
      key: null,
      direction: "asc",
    });

    const filteredData = useMemo(() => {
      if (!searchTerm) return normalizedData;

      return normalizedData.filter((item) =>
        searchableColumns.some((column) =>
          item[column]
            ?.toString()
            .toLowerCase()
            .includes(searchTerm.toLowerCase()),
        ),
      );
    }, [normalizedData, searchTerm, searchableColumns]);

    const sortedData = useMemo(() => {
      if (!sortConfig.key) return filteredData;

      return [...filteredData].sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }, [filteredData, sortConfig]);

    const pagination = usePagination(sortedData.length, itemsPerPage);

    const paginatedData = useMemo(() => {
      return sortedData.slice(pagination.startIndex, pagination.endIndex + 1);
    }, [sortedData, pagination.startIndex, pagination.endIndex]);

    const handleSort = useCallback(
      (key) => {
        if (!sortableColumns.includes(key)) return;

        setSortConfig((prev) => ({
          key,
          direction:
            prev.key === key && prev.direction === "asc" ? "desc" : "asc",
        }));
      },
      [sortableColumns],
    );

    if (loading) {
      return (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "200px",
            fontSize: "1.1rem",
            color: "#666",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "2rem", marginBottom: "10px" }}></div>
            Carregando dados...
          </div>
        </div>
      );
    }

    return (
      <div style={{ width: "100%" }}>
        {searchableColumns.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <input
              type="text"
              placeholder={`Buscar por ${searchableColumns.join(", ")}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "2px solid #e9ecef",
                borderRadius: "8px",
                fontSize: "1rem",
                outline: "none",
                transition: "border-color 0.3s ease",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#007bff")}
              onBlur={(e) => (e.target.style.borderColor = "#e9ecef")}
            />
          </div>
        )}

        {sortedData.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px",
              color: "#666",
              fontSize: "1.1rem",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "20px" }}></div>
            {emptyMessage}
          </div>
        ) : (
          <>
            <div
              style={{
                overflowX: "auto",
                border: "1px solid #e9ecef",
                borderRadius: "8px",
                marginBottom: "20px",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  backgroundColor: "white",
                }}
              >
                <thead style={{ backgroundColor: "#f8f9fa" }}>
                  <tr>
                    {columns.map((column) => (
                      <th
                        key={column.key}
                        onClick={() => handleSort(column.key)}
                        style={{
                          padding: "15px",
                          textAlign: "left",
                          fontWeight: "bold",
                          color: "#333",
                          cursor: sortableColumns.includes(column.key)
                            ? "pointer"
                            : "default",
                          borderBottom: "2px solid #e9ecef",
                          userSelect: "none",
                          position: "relative",
                        }}
                      >
                        {column.label}
                        {sortableColumns.includes(column.key) && (
                          <span
                            style={{
                              marginLeft: "8px",
                              color:
                                sortConfig.key === column.key
                                  ? "#007bff"
                                  : "#ccc",
                            }}
                          >
                            {sortConfig.key === column.key
                              ? sortConfig.direction === "asc"
                                ? "↑"
                                : "↓"
                              : ""}
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((item, index) => (
                    <tr
                      key={item.id || index}
                      onClick={() => onRowClick?.(item)}
                      style={{
                        cursor: onRowClick ? "pointer" : "default",
                        borderBottom: "1px solid #e9ecef",
                        transition: "background-color 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (onRowClick)
                          e.target.style.backgroundColor = "#f8f9fa";
                      }}
                      onMouseLeave={(e) => {
                        if (onRowClick)
                          e.target.style.backgroundColor = "transparent";
                      }}
                    >
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          style={{
                            padding: "15px",
                            color: "#333",
                            fontSize: "0.9rem",
                          }}
                        >
                          {column.render
                            ? column.render(item[column.key], item)
                            : typeof item[column.key] === "object" &&
                                item[column.key] !== null
                              ? item[column.key].nome ||
                                item[column.key].name ||
                                JSON.stringify(item[column.key])
                              : item[column.key] || "-"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.totalPages > 1 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <div style={{ color: "#666", fontSize: "0.9rem" }}>
                  Mostrando {pagination.startIndex + 1} a{" "}
                  {pagination.endIndex + 1} de {sortedData.length} itens
                </div>

                <div style={{ display: "flex", gap: "5px" }}>
                  <button
                    onClick={pagination.prevPage}
                    disabled={!pagination.hasPrev}
                    style={{
                      padding: "8px 12px",
                      border: "1px solid #e9ecef",
                      backgroundColor: pagination.hasPrev ? "white" : "#f8f9fa",
                      color: pagination.hasPrev ? "#007bff" : "#ccc",
                      borderRadius: "4px",
                      cursor: pagination.hasPrev ? "pointer" : "not-allowed",
                      fontSize: "0.9rem",
                    }}
                  >
                    ← Anterior
                  </button>

                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "0 12px",
                      fontSize: "0.9rem",
                      color: "#666",
                    }}
                  >
                    {pagination.currentPage} / {pagination.totalPages}
                  </span>

                  <button
                    onClick={pagination.nextPage}
                    disabled={!pagination.hasNext}
                    style={{
                      padding: "8px 12px",
                      border: "1px solid #e9ecef",
                      backgroundColor: pagination.hasNext ? "white" : "#f8f9fa",
                      color: pagination.hasNext ? "#007bff" : "#ccc",
                      borderRadius: "4px",
                      cursor: pagination.hasNext ? "pointer" : "not-allowed",
                      fontSize: "0.9rem",
                    }}
                  >
                    Próxima →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  },
);

DataTable.displayName = "DataTable";

export default DataTable;

