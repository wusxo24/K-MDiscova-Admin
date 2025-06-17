import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Card from '@/components/common/Card';
import Pagination from '@/components/common/Pagination';
import Table from '@/components/common/Table';

const Parents = () => {
  const [parents, setParents] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    email: '',
    first_name: '',
    city: '',
  });
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchParents = async () => {
      try {
        const response = await api.getAllParents(currentPage, filters);
        setParents(response.results || []);
        setTotalCount(response.count || 0);
      } catch (error) {
        console.error('Error fetching parents:', error);
      }
    };
    fetchParents();
  }, [currentPage, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Parents Management</h1>
      <Card title="Filters">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            name="email"
            placeholder="Search by email"
            value={filters.email}
            onChange={handleFilterChange}
            className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="text"
            name="first_name"
            placeholder="Search by first name"
            value={filters.first_name}
            onChange={handleFilterChange}
            className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="text"
            name="city"
            placeholder="Search by city"
            value={filters.city}
            onChange={handleFilterChange}
            className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </Card>
      <div className="mt-6">
        <Table
          data={parents}
          columns={['Name', 'Email', 'City', 'Country', 'Created At']}
          columnKeys={[
            'full_name',
            'email',
            'city',
            'country',
            (row) => new Date(row.created_at).toLocaleDateString(),
          ]}
        />
        <Pagination totalPages={totalPages} currentPage={currentPage} onPageChange={setCurrentPage} />
      </div>
    </div>
  );
};

export default Parents;