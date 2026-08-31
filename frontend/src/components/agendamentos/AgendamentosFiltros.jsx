import React, { useState, useEffect } from "react";

const AgendamentosFiltros = ({
  onFilterChange,
  currentFilters = {},
  loading = false,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    status: "todos",
    tipo: "",
    local: "",
    data_inicio: "",
    data_fim: "",
    incluir_cancelados: false,
  });

  const [filterOptions, setFilterOptions] = useState({
    status: ["em_analise", "pendente", "enviando_convites", "marcado", "finalizado"],
    tipos: ["reuniao", "audiencia", "prazo", "outro"],
    locais: [],
  });

  useEffect(() => {
    setFilters((prev) => ({ ...prev, ...currentFilters }));
  }, [currentFilters]);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("/api/agendamentos/filtros", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setFilterOptions((prev) => ({
              ...prev,
              status: data.data.status || prev.status,
              tipos: data.data.tipos || prev.tipos,
              locais: data.data.locais || prev.locais,
            }));
          }
        }
      } catch (error) {
        console.error("Erro ao carregar opções de filtros:", error);
      }
    };

    fetchFilterOptions();
  }, []);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    onFilterChange(filters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      search: "",
      status: "todos",
      tipo: "",
      local: "",
      data_inicio: "",
      data_fim: "",
      incluir_cancelados: false,
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const getStatusLabel = (status) => {
    const labels = {
      em_analise: "Em Análise",
      pendente: "Pendente",
      enviando_convites: "Enviando Convites",
      marcado: "Marcado",
      cancelado: "Cancelado",
      finalizado: "Finalizado",
      todos: "Todos os Status",
    };
    return labels[status] || status;
  };

  const getTipoLabel = (tipo) => {
    const labels = {
      reuniao: "Reunião",
      audiencia: "Audiência",
      prazo: "Prazo",
      outro: "Outro",
    };
    return labels[tipo] || tipo;
  };

  const hasActiveFilters =
    filters.search ||
    filters.status !== "todos" ||
    filters.tipo ||
    filters.local ||
    filters.data_inicio ||
    filters.data_fim ||
    filters.incluir_cancelados;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <form onSubmit={handleSearch} className="flex gap-3 items-center mb-4">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></span>
          <input
            type="text"
            placeholder="Buscar por título, descrição, local..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
            showFilters || hasActiveFilters
              ? "bg-blue-50 border-blue-300 text-blue-700"
              : "bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100"
          }`}
        >
          <span className="text-gray-500"></span>
          Filtros
          {hasActiveFilters && (
            <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              !
            </span>
          )}
          <span
            className={`transition-transform ${showFilters ? "rotate-180" : ""}`}
          >
            ▼
          </span>
        </button>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Buscando..." : "Buscar"}
        </button>
      </form>

      {showFilters && (
        <div className="border-t pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="todos">Todos os Status</option>
                {filterOptions.status.map((status) => (
                  <option key={status} value={status}>
                    {getStatusLabel(status)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo
              </label>
              <select
                value={filters.tipo}
                onChange={(e) => handleFilterChange("tipo", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos os tipos</option>
                {filterOptions.tipos.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {getTipoLabel(tipo)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Início
              </label>
              <input
                type="date"
                value={filters.data_inicio}
                onChange={(e) =>
                  handleFilterChange("data_inicio", e.target.value)
                }
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Fim
              </label>
              <input
                type="date"
                value={filters.data_fim}
                onChange={(e) => handleFilterChange("data_fim", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Local
              </label>
              <input
                type="text"
                placeholder="Filtrar por local..."
                value={filters.local}
                onChange={(e) => handleFilterChange("local", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="incluir_cancelados"
              checked={filters.incluir_cancelados}
              onChange={(e) =>
                handleFilterChange("incluir_cancelados", e.target.checked)
              }
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <label
              htmlFor="incluir_cancelados"
              className="text-sm text-gray-700"
            >
              Mostrar apenas agendamentos cancelados
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <span>×</span>
              Limpar Filtros
            </button>
            <div className="text-sm text-gray-500 py-2">
              {hasActiveFilters
                ? "Filtros ativos aplicados"
                : "Usando filtros padrão (apenas marcados)"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgendamentosFiltros;
