import React from 'react';

const Table = ({ 
  data = [], 
  columns = [], 
  onEdit, 
  onDelete, 
  onView,
  actions = true,
  emptyMessage = "No hay datos disponibles" 
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
        <p className="text-gray-500 text-lg">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.title}
                </th>
              ))}
              {actions && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, index) => (
              <tr key={item.id || index} className="hover:bg-gray-50 transition-colors">
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {column.render ? column.render(item[column.key], item) : item[column.key]}
                  </td>
                ))}
                {actions && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {onView && (
                        <button
                          onClick={() => onView(item)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          title="Ver detalles"
                        >
                          👁️
                        </button>
                      )}
                      {onEdit && (
                        <button
                          onClick={() => onEdit(item)}
                          className="text-green-600 hover:text-green-900 transition-colors"
                          title="Editar"
                        >
                          ✏️
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(item)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;