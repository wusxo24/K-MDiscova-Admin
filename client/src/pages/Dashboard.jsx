import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import Filter from '@/components/common/Filter';
import Card from '@/components/common/Card';
import Pagination from '@/components/common/Pagination';
import Table from '@/components/common/Table';
import BarChartComponent from '@/components/charts/BarChartComponent';
import LineChartComponent from '@/components/charts/LineChartComponent';
import PieChartComponent from '@/components/charts/PieChartComponent';

const Dashboard = () => {
  const [revenue, setRevenue] = useState({ daily: 0, monthly: 0, yearly: 0 });
  const [psychologistsRegistered, setPsychologistsRegistered] = useState({ daily: 0, monthly: 0, yearly: 0 });
  const [parentsBookings, setParentsBookings] = useState({ daily: 0, monthly: 0, yearly: 0 });
  const [topPsychologists, setTopPsychologists] = useState([]);
  const [filter, setFilter] = useState('daily');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        console.log('Fetching dashboard data with filter:', filter);
        
        // Fetch revenue data from Orders and Payments tables
        const revenueData = await apiService.getRevenue(filter);
        console.log('Revenue data:', revenueData);
        setRevenue(revenueData);

        // Fetch psychologist registration data
        const psychData = await apiService.getPsychologistsRegistered(filter);
        console.log('Psychologists registered data:', psychData);
        setPsychologistsRegistered(psychData);

        // Fetch booking data from Appointments table
        const bookingData = await apiService.getParentsBookings(filter);
        console.log('Parents bookings data:', bookingData);
        setParentsBookings(bookingData);

        // Fetch top psychologists based on reviews and bookings
        const topPsychData = await apiService.getTopPsychologists(filter);
        console.log('Top psychologists data:', topPsychData);
        console.log('Top psychologists data type:', typeof topPsychData);
        console.log('Top psychologists data length:', Array.isArray(topPsychData) ? topPsychData.length : 'Not an array');
        setTopPsychologists(topPsychData);
        console.log('Top psychologists state set to:', topPsychData);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [filter]);

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const paginatedPsychologists = topPsychologists.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(topPsychologists.length / itemsPerPage);

  if (isLoading) {
    return (
      <div className="p-6 bg-gray-100 min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading dashboard data...</div>
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

  // Prepare chart data with better error handling
  const bookingTypesData = [
    { name: 'Online Meeting', value: parentsBookings[filter]?.online || 0 },
    { name: 'Initial Consultation', value: parentsBookings[filter]?.initial || 0 }
  ];

  console.log('Booking types data for chart:', bookingTypesData);
  console.log('Raw parentsBookings data:', parentsBookings);

  const trendData = [
    { name: 'Mon', value: parentsBookings[filter]?.trend?.monday || 0 },
    { name: 'Tue', value: parentsBookings[filter]?.trend?.tuesday || 0 },
    { name: 'Wed', value: parentsBookings[filter]?.trend?.wednesday || 0 },
    { name: 'Thu', value: parentsBookings[filter]?.trend?.thursday || 0 },
    { name: 'Fri', value: parentsBookings[filter]?.trend?.friday || 0 },
    { name: 'Sat', value: parentsBookings[filter]?.trend?.saturday || 0 },
    { name: 'Sun', value: parentsBookings[filter]?.trend?.sunday || 0 }
  ];

  console.log('Trend data for chart:', trendData);

  const statusDistributionData = [
    { name: 'Completed', value: parentsBookings[filter]?.status?.completed || 0 },
    { name: 'Scheduled', value: parentsBookings[filter]?.status?.scheduled || 0 },
    { name: 'Cancelled', value: parentsBookings[filter]?.status?.cancelled || 0 },
    { name: 'No Show', value: parentsBookings[filter]?.status?.no_show || 0 }
  ];

  console.log('Status distribution data for chart:', statusDistributionData);
  console.log('Top psychologists data:', topPsychologists);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <Filter options={['daily', 'monthly', 'yearly']} onChange={handleFilterChange} />
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-green-500 text-white" title="Revenue">
          <p className="text-xl font-bold">${revenue[filter]?.total?.toLocaleString() || 0}</p>
          <p className="text-sm opacity-80">
            {revenue[filter]?.count || 0} transactions
          </p>
        </Card>
        <Card className="bg-blue-500 text-white" title="Psychologists Registered">
          <p className="text-xl font-bold">{psychologistsRegistered[filter]?.total || 0}</p>
          <p className="text-sm opacity-80">
            {psychologistsRegistered[filter]?.verified || 0} verified
          </p>
        </Card>
        <Card className="bg-purple-500 text-white" title="Parents Bookings">
          <p className="text-xl font-bold">{parentsBookings[filter]?.total || 0}</p>
          <p className="text-sm opacity-80">
            {parentsBookings[filter]?.unique_parents || 0} unique parents
          </p>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Bookings Overview */}
        <div className="bg-white rounded-lg shadow-lg p-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Booking Types</h2>
          <div className="h-[400px]">
            <BarChartComponent data={bookingTypesData} />
          </div>
        </div>

        {/* Booking Trend */}
        <div className="bg-white rounded-lg shadow-lg p-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Weekly Booking Trend</h2>
          <div className="h-[400px]">
            <LineChartComponent data={trendData} />
          </div>
        </div>

        {/* Booking Status Distribution */}
        <div className="bg-white rounded-lg shadow-lg p-4 lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Booking Status Distribution</h2>
          <div className="h-[400px]">
            <PieChartComponent data={statusDistributionData} />
          </div>
        </div>
      </div>

      {/* Top Psychologists Table */}
      <div className="bg-white rounded-lg shadow-lg p-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Top Psychologists</h2>
        {console.log('Top psychologists before pagination:', topPsychologists)}
        {console.log('Paginated psychologists:', paginatedPsychologists)}
        {console.log('Total pages:', totalPages)}
        <Table
          data={paginatedPsychologists}
          columns={[
            'Name',
            'Rating',
            'Total Bookings',
            'Completion Rate',
            'Average Session Duration'
          ]}
          columnKeys={[
            (row) => {
              console.log('Top psychologist row:', row);
              const fullName = row.full_name || row.name || row.user?.full_name || row.user?.name || `${row.first_name || row.user?.first_name || ''} ${row.last_name || row.user?.last_name || ''}`.trim();
              return fullName || 'N/A';
            },
            'rating',
            'total_bookings',
            (row) => `${row.completion_rate || 0}%`,
            (row) => `${row.avg_session_duration || 0} min`
          ]}
        />
        <Pagination totalPages={totalPages} currentPage={currentPage} onPageChange={setCurrentPage} />
      </div>
    </div>
  );
};

export default Dashboard;
