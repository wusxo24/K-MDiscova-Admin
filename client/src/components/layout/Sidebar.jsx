import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar = () => {
  return (
    <aside className="bg-gray-800 text-white w-64 p-4 flex-shrink-0">
      <nav>
        <ul className="space-y-2">
          <li>
            <Link to="/dashboard" className="block p-2 hover:bg-gray-700 rounded">
              Dashboard
            </Link>
          </li>
          <li>
            <Link to="/psychologists" className="block p-2 hover:bg-gray-700 rounded">
              Psychologists
            </Link>
          </li>
          <li>
            <Link to="/parents" className="block p-2 hover:bg-gray-700 rounded">
              Parents
            </Link>
          </li>
          <li>
            <Link to="/settings" className="block p-2 hover:bg-gray-700 rounded">
              Settings
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;