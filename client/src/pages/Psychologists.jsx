import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import Card from '@/components/common/Card';
import Pagination from '@/components/common/Pagination';
import Table from '@/components/common/Table';

const Psychologists = () => {
  const [psychologists, setPsychologists] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    name: '',
    verification_status: '',
    min_years_experience: '',
  });
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchPsychologists = async () => {
      setIsLoading(true);
      setError(null);
      try {
        console.log('Fetching psychologists with filters:', filters, 'page:', currentPage);
        const response = await apiService.getAllPsychologists(currentPage, filters);
        console.log('Psychologists API response:', response);
        console.log('Response count:', response.count);
        console.log('Response results:', response.results);
        
        setPsychologists(response.results || []);
        setTotalCount(response.count || 0);
        
        console.log('State updated - psychologists:', response.results || []);
        console.log('State updated - totalCount:', response.count || 0);
      } catch (error) {
        console.error('Error fetching psychologists:', error);
        setError('Failed to load psychologists data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchPsychologists();
  }, [currentPage, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const handleVerifyPsychologist = async (id, status) => {
    try {
      await apiService.verifyPsychologist(id, status);
      // Refresh the list
      const response = await apiService.getAllPsychologists(currentPage, filters);
      setPsychologists(response.results || []);
      setTotalCount(response.count || 0);
    } catch (error) {
      console.error('Error verifying psychologist:', error);
      alert('Failed to update verification status. Please try again.');
    }
  };

  const handleDeletePsychologist = async (id) => {
    if (window.confirm('Are you sure you want to delete this psychologist?')) {
      try {
        await apiService.deletePsychologist(id);
        // Refresh the list
        const response = await apiService.getAllPsychologists(currentPage, filters);
        setPsychologists(response.results || []);
        setTotalCount(response.count || 0);
      } catch (error) {
        console.error('Error deleting psychologist:', error);
        alert('Failed to delete psychologist. Please try again.');
      }
    }
  };

  const getVerificationStatusBadge = (status) => {
    const statusColors = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Approved': 'bg-green-100 text-green-800',
      'Rejected': 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status || 'Unknown'}
      </span>
    );
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  if (isLoading) {
    return (
      <div className="p-6 bg-gray-100 min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading psychologists data...</div>
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
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Total Psychologists: {totalCount}
          </h2>
        </div>
        
        <Table
          data={psychologists}
          columns={['Name', 'Email', 'Verification Status', 'Years of Experience', 'Created At', 'Actions']}
          columnKeys={[
            'full_name',
            'email',
            (row) => getVerificationStatusBadge(row.verification_status),
            'years_of_experience',
            (row) => new Date(row.created_at).toLocaleDateString(),
            (row) => (
              <div className="flex space-x-2">
                {row.verification_status === 'Pending' && (
                  <>
                    <button
                      onClick={() => handleVerifyPsychologist(row.id, 'Approved')}
                      className="bg-green-500 text-white px-2 py-1 rounded text-sm hover:bg-green-600"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleVerifyPsychologist(row.id, 'Rejected')}
                      className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
                    >
                      Reject
                    </button>
                  </>
                )}
                <button
                  onClick={() => handleDeletePsychologist(row.id)}
                  className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            )
          ]}
        />
        
        {console.log('Table data being passed:', psychologists)}
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

export default Psychologists;