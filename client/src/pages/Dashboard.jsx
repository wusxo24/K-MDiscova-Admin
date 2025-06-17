import React, { useState, useEffect } from 'react';
import api from '../services/api';
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
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const periods = ['daily', 'monthly', 'yearly'];
        const [revenueData, psychRegData, parentBookData, topPsychData] = await Promise.all([
          Promise.all(periods.map(p => api.getRevenue(p))),
          Promise.all(periods.map(p => api.getPsychologistsRegistered(p))),
          Promise.all(periods.map(p => api.getParentsBookings(p))),
          api.getTopPsychologists(filter),
        ]);

        setRevenue(Object.assign({}, ...revenueData));
        setPsychologistsRegistered(Object.assign({}, ...psychRegData));
        setParentsBookings(Object.assign({}, ...parentBookData));
        setTopPsychologists(topPsychData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };
    fetchData();
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

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <Filter options={['daily', 'monthly', 'yearly']} onChange={handleFilterChange} />
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <Card className="bg-green-500 text-white" title="Revenue">
          <p className="text-xl font-bold">${revenue[filter]}</p>
        </Card>
        <Card className="bg-blue-500 text-white" title="Psychologists Registered">
          <p className="text-xl font-bold">{psychologistsRegistered[filter]}</p>
        </Card>
        <Card className="bg-purple-500 text-white" title="Parents Bookings">
          <p className="text-xl font-bold">{parentsBookings[filter]}</p>
        </Card>
        {/* Optional: Add more cards here */}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* Bookings by Type (Bar) */}
        <Card title="Bookings Overview">
          <BarChartComponent
            data={[
              { name: 'Bookings', value: parentsBookings[filter] },
              { name: 'Psychologists', value: psychologistsRegistered[filter] },
            ]}
          />
        </Card>

        {/* Psychologists Growth (Line) */}
        <Card title="Psychologist Trend">
          <LineChartComponent
            data={[{ name: filter, value: psychologistsRegistered[filter] }]}
          />
        </Card>

        {/* Pie Chart: Booking Breakdown */}
        <Card title="Booking Distribution">
          <PieChartComponent
            data={[
              { name: 'Bookings', value: parentsBookings[filter] },
              { name: 'Registrations', value: psychologistsRegistered[filter] },
            ]}
          />
        </Card>
      </div>

      {/* Top Psychologists Table */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Top Psychologists</h2>
        <Table
          data={paginatedPsychologists}
          columns={['Name', 'Rating', `${filter.charAt(0).toUpperCase() + filter.slice(1)} Bookings`]}
          columnKeys={['name', 'rating', (row) => row.bookings[filter]]}
        />
        <Pagination totalPages={totalPages} currentPage={currentPage} onPageChange={setCurrentPage} />
      </div>
    </div>
  );
};

export default Dashboard;
