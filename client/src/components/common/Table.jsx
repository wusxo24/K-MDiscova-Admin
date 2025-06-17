import React from 'react';

const Table = ({ data, columns, columnKeys }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white shadow-md rounded-lg">
        <thead>
          <tr className="bg-gray-200">
            {columns.map((col) => (
              <th key={col} className="py-3 px-4 text-left text-gray-700 font-semibold">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index} className="border-b hover:bg-gray-50">
              {columnKeys.map((key, i) => (
                <td key={i} className="py-3 px-4 text-gray-600">
                  {typeof key === 'function' ? key(row) : row[key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;