import React from 'react';

const Card = ({ title, children }) => {
  return (
    <div className="bg-white shadow-lg rounded-lg p-4">
      <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
      {children}
    </div>
  );
};

export default Card;