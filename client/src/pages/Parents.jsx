import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import Card from '@/components/common/Card';
import Pagination from '@/components/common/Pagination';
import Table from '@/components/common/Table';

const Parents = () => {
  const [parents, setParents] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    email: '',
    first_name: '',
    city: '',
  });
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchParents = async () => {
      setIsLoading(true);
      setError(null);
      try {
        console.log('Fetching parents with filters:', filters, 'page:', currentPage);
        const response = await apiService.getAllParents(currentPage, filters);
        console.log('Parents API response:', response);
        console.log('Response count:', response.count);
        console.log('Response results:', response.results);
        
        setParents(response.results || []);
        setTotalCount(response.count || 0);
        
        console.log('State updated - parents:', response.results || []);
        console.log('State updated - totalCount:', response.count || 0);
      } catch (error) {
        console.error('Error fetching parents:', error);
        setError('Failed to load parents data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchParents();
  }, [currentPage, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const handleDeleteParent = async (id) => {
    if (window.confirm('Are you sure you want to delete this parent?')) {
      try {
        await apiService.deleteParent(id);
        // Refresh the list
        const response = await apiService.getAllParents(currentPage, filters);
        setParents(response.results || []);
        setTotalCount(response.count || 0);
      } catch (error) {
        console.error('Error deleting parent:', error);
        alert('Failed to delete parent. Please try again.');
      }
    }
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  if (isLoading) {
    return (
      <div className="p-6 bg-gray-100 min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading parents data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-100 min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

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
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Total Parents: {totalCount}
          </h2>
        </div>
        
        <Table
          data={parents}
          columns={['Name', 'Email', 'City', 'Country', 'Created At', 'Actions']}
          columnKeys={[
            'full_name',
            'email',
            'city',
            'country',
            (row) => new Date(row.created_at).toLocaleDateString(),
            (row) => (
              <div className="flex space-x-2">
                <button
                  onClick={() => handleDeleteParent(row.id)}
                  className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            )
          ]}
        />
        
        {console.log('Table data being passed:', parents)}
        {console.log('Table totalCount:', totalCount)}
        
        <Pagination 
          totalPages={totalPages} 
          currentPage={currentPage} 
          onPageChange={setCurrentPage} 
        />
      </div>
    </div>
  );
};

export default Parents;