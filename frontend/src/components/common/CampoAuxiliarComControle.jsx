import React, { useState, useEffect } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useGlobalToast } from "@/contexts/ToastContext";
import { apiRequest } from "@/api/apiRequest";
import { normalizeBrazilianText } from "@/utils/commonUtils";
import { confirmAction } from "@/services/dialogService";

const CampoAuxiliarComControle = ({
  type,
  label,
  value,
  onChange,
  placeholder = "Selecione...",
  required = false,
}) => {
  const { token, user } = useAuthContext();
  const { showSuccess, showError } = useGlobalToast();
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({ nome: "", descricao: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin = () => {
    const userRole = user?.role?.nome || user?.role;
    return userRole === "Admin";
  };

  const isRestrito = () => {
    const userRole = user?.role?.nome || user?.role;
    return userRole === "Professor" || userRole === "Aluno";
  };

  const getEndpoint = () => {
    const endpoints = {
      materia: "materias",
      fase: "fases",
      diligencia: "diligencias",
      local_tramitacao: "locais-tramitacao",
    };
    return endpoints[type];
  };

  const loadOptions = async () => {
    setLoading(true);
    try {
      const endpoint = getEndpoint();
      const response = await apiRequest(`/api/tabelas-auxiliares/${endpoint}`, {
        method: "GET",
        token,
      });

      if (response.success) {
        const normalizedOptions = Array.isArray(response.data)
          ? response.data.map((item) => ({
              ...item,
              nome: normalizeBrazilianText(item?.nome),
              descricao: normalizeBrazilianText(item?.descricao),
            }))
          : [];
        setOptions(normalizedOptions);
      } else {
        console.error("Erro ao carregar opções:", response.message);
      }
    } catch (error) {
      console.error("Erro ao carregar opções:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItem.nome.trim()) {
      showError("Nome é obrigatório");
      return;
    }

    setIsSubmitting(true);
    try {
      const endpoint = getEndpoint();
      const payload = {
        ...newItem,
        nome: normalizeBrazilianText(newItem.nome),
        descricao: normalizeBrazilianText(newItem.descricao),
      };
      const response = await apiRequest(`/api/tabelas-auxiliares/${endpoint}`, {
        method: "POST",
        token,
        body: payload,
      });

      if (response.success) {
        showSuccess(response.message || "Item criado com sucesso!");
        setNewItem({ nome: "", descricao: "" });
        setShowAddForm(false);
        await loadOptions();
      } else {
        showError(response.message || "Erro ao criar item");
      }
    } catch (error) {
      showError(
        "Erro ao criar item: " + (error.message || "Erro desconhecido"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (itemId, itemNome) => {
    if (!(await confirmAction(`Tem certeza que deseja excluir "${itemNome}"?`, { title: "Excluir opção?", confirmLabel: "Excluir" }))) {
      return;
    }

    try {
      const endpoint = getEndpoint();
      const response = await apiRequest(
        `/api/tabelas-auxiliares/${endpoint}/${itemId}`,
        {
          method: "DELETE",
          token,
        },
      );

      if (response.success) {
        showSuccess(response.message || "Item excluído com sucesso!");
        await loadOptions();

        if (value === itemId) {
          onChange("");
        }
      } else {
        showError(response.message || "Erro ao excluir item");
      }
    } catch (error) {
      showError(
        "Erro ao excluir item: " + (error.message || "Erro desconhecido"),
      );
    }
  };

  useEffect(() => {
    loadOptions();
  }, [type, token]);

  const displayLabel = normalizeBrazilianText(label);
  const displayPlaceholder = normalizeBrazilianText(placeholder);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {displayLabel} {required && <span className="text-red-500">*</span>}
      </label>

      <div className="flex gap-2">
        <select
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={loading}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          required={required}
        >
          <option value="">
            {loading ? "Carregando..." : displayPlaceholder}
          </option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {normalizeBrazilianText(option.nome)}
            </option>
          ))}
        </select>

        {isAdmin() && !isRestrito() && (
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
            title="Adicionar Novo"
          >
            +
          </button>
        )}
      </div>

      {showAddForm && isAdmin() && !isRestrito() && (
        <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-md">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Adicionar Novo {displayLabel}
          </h4>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Nome *
              </label>
              <input
                type="text"
                value={newItem.nome}
                onChange={(e) =>
                  setNewItem((prev) => ({ ...prev, nome: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder={`Nome do ${displayLabel.toLowerCase()}`}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Descrição
              </label>
              <textarea
                value={newItem.descricao}
                onChange={(e) =>
                  setNewItem((prev) => ({ ...prev, descricao: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Descrição opcional"
                rows={2}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleAddItem}
                disabled={isSubmitting || !newItem.nome.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
              >
                {isSubmitting ? "Salvando..." : "Salvar"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setNewItem({ nome: "", descricao: "" });
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {isAdmin() && !isRestrito() && options.length > 0 && (
        <div className="mt-3">
          <details className="group">
            <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1">
              <span>
                Gerenciar {displayLabel} ({options.length} itens)
              </span>
              <span className="group-open:rotate-90 transition-transform"></span>
            </summary>

            <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md">
              {options.map((option) => (
                <div
                  key={option.id}
                  className="flex items-center justify-between px-3 py-2 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {normalizeBrazilianText(option.nome)}
                    </div>
                    {option.descricao && (
                      <div className="text-xs text-gray-500 truncate">
                        {normalizeBrazilianText(option.descricao)}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteItem(option.id, option.nome)}
                    className="ml-2 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                    title={`Excluir ${normalizeBrazilianText(option.nome)}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}

      {isRestrito() && (
        <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
          <span className="text-orange-500"></span>
          <span>Apenas administradores podem adicionar/remover opções</span>
        </div>
      )}
    </div>
  );
};

export default CampoAuxiliarComControle;
