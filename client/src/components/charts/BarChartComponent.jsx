import React from 'react';
import ReactApexChart from 'react-apexcharts';

const BarChartComponent = ({ data }) => {
  console.log('BarChartComponent received data:', data);
  
  // Handle empty or invalid data
  if (!data || data.length === 0) {
    return (
      <div style={{ height: '300px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="text-gray-500">No data available</div>
      </div>
    );
  }

  // Filter out zero values
  const filteredData = data.filter(item => item.value > 0);
  
  if (filteredData.length === 0) {
    return (
      <div style={{ height: '300px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="text-gray-500">No data to display</div>
      </div>
    );
  }

  const options = {
    chart: {
      type: 'bar',
      toolbar: {
        show: false
      },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
      }
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: false,
        columnWidth: '55%',
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent']
    },
    xaxis: {
      categories: filteredData.map(item => item.name),
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      }
    },
    yaxis: {
      title: {
        text: 'Bookings'
      }
    },
    fill: {
      opacity: 1,
      colors: ['#4f46e5']
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return val + " bookings"
        }
      }
    },
    grid: {
      borderColor: '#f1f1f1',
      strokeDashArray: 4,
    }
  };

  const series = [{
    name: 'Bookings',
    data: filteredData.map(item => item.value)
  }];

  return (
    <div style={{ height: '300px', width: '100%' }}>
      <ReactApexChart
        options={options}
        series={series}
        type="bar"
        height="100%"
      />
    </div>
  );
};

export default BarChartComponent;