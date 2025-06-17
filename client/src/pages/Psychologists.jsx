import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Card from '@/components/common/Card';
import Pagination from '@/components/common/Pagination';
import Table from '@/components/common/Table';

const Psychologists = () => {
  const [psychologists, setPsychologists] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    name: '',
    verification_status: '',
    min_years_experience: '',
  });
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchPsychologists = async () => {
      try {
        const response = await api.getAllPsychologists(currentPage, filters);
        setPsychologists(response.results || []);
        setTotalCount(response.count || 0);
      } catch (error) {
        console.error('Error fetching psychologists:', error);
      }
    };
    fetchPsychologists();
  }, [currentPage, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Psychologists Management</h1>
      <Card title="Filters">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            name="name"
            placeholder="Search by name"
            value={filters.name}
            onChange={handleFilterChange}
            className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <select
            name="verification_status"
            value={filters.verification_status}
            onChange={handleFilterChange}
            className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
          <input
            type="number"
            name="min_years_experience"
            placeholder="Min Years Experience"
            value={filters.min_years_experience}
            onChange={handleFilterChange}
            className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </Card>
      <div className="mt-6">
        <Table
          data={psychologists}
          columns={['Name', 'Email', 'Verification Status', 'Years of Experience', 'Created At']}
          columnKeys={[
            'full_name',
            'email',
            'verification_status',
            'years_of_experience',
            (row) => new Date(row.created_at).toLocaleDateString(),
          ]}
        />
        <Pagination totalPages={totalPages} currentPage={currentPage} onPageChange={setCurrentPage} />
      </div>
    </div>
  );
};

export default Psychologists;