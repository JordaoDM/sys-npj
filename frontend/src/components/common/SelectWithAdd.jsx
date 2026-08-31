import React from "react";
import { normalizeBrazilianText } from "@/utils/commonUtils";

const SelectWithAdd = ({
  label,
  stateKey,
  value,
  onChange,
  options,
  showAddForm,
  onToggleAddForm,
  newValue,
  onNewValueChange,
  onAddNew,
  placeholder,
  loading,
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <select
        name={stateKey}
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
        required
      >
        <option value="">Selecione...</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {normalizeBrazilianText(option.nome)}
          </option>
        ))}
      </select>

      {!showAddForm ? (
        <button
          type="button"
          onClick={() => onToggleAddForm(true)}
          className="mt-2 text-xs font-medium bg-blue-700 text-white hover:bg-blue-800 border border-blue-800 rounded px-2 py-1"
        >
          Adicionar Novo
        </button>
      ) : (
        <div className="mt-2 bg-gray-50 p-2 rounded border border-gray-200">
          <div className="mb-2">
            <h4 className="text-xs font-medium text-gray-800">
              Novo {placeholder}
            </h4>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newValue}
              onChange={onNewValueChange}
              placeholder="Digite o nome"
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onAddNew();
                }
              }}
            />
            <button
              type="button"
              onClick={onAddNew}
              disabled={!newValue.trim() || loading}
              className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:opacity-50 text-xs font-medium"
            >
              {loading ? "..." : "Salvar"}
            </button>
            <button
              type="button"
              onClick={() => onToggleAddForm(false)}
              className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-1 focus:ring-red-500 text-xs font-medium"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectWithAdd;
