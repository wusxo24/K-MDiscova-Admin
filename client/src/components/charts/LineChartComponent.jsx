import React from 'react';
import ReactApexChart from 'react-apexcharts';

const LineChartComponent = ({ data }) => {
  console.log('LineChartComponent received data:', data);
  
  // Handle empty or invalid data
  if (!data || data.length === 0) {
    return (
      <div style={{ height: '300px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="text-gray-500">No data available</div>
      </div>
    );
  }

  // For line charts, we want to show all data points even if they're zero
  const chartData = data;

  const options = {
    chart: {
      type: 'area',
      toolbar: {
        show: false
      },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
      }
    },
    stroke: {
      curve: 'smooth',
      width: 2,
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.3,
        stops: [0, 90, 100]
      }
    },
    dataLabels: {
      enabled: false
    },
    xaxis: {
      categories: chartData.map(item => item.name),
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
    },
    colors: ['#4f46e5']
  };

  const series = [{
    name: 'Bookings',
    data: chartData.map(item => item.value)
  }];

  return (
    <div style={{ height: '300px', width: '100%' }}>
      <ReactApexChart
        options={options}
        series={series}
        type="area"
        height="100%"
      />
    </div>
  );
};

export default LineChartComponent;