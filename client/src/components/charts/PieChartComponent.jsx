import React from 'react';
import ReactApexChart from 'react-apexcharts';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444'];

const PieChartComponent = ({ data }) => {
  console.log('PieChartComponent received data:', data);
  
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
      type: 'donut',
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
      }
    },
    labels: filteredData.map(item => item.name),
    colors: COLORS,
    plotOptions: {
      pie: {
        donut: {
          size: '50%',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '14px',
              fontWeight: 600,
              offsetY: -10
            },
            value: {
              show: true,
              fontSize: '16px',
              fontWeight: 400,
              offsetY: 16,
              formatter: function (val) {
                return val + " bookings"
              }
            },
            total: {
              show: true,
              label: 'Total',
              fontSize: '16px',
              fontWeight: 600,
              formatter: function (w) {
                return w.globals.seriesTotals.reduce((a, b) => a + b, 0) + ' bookings'
              }
            }
          }
        }
      }
    },
    legend: {
      position: 'bottom',
      offsetY: 0,
      height: 40
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return val + " bookings"
        }
      }
    }
  };

  const series = filteredData.map(item => item.value);

  return (
    <div style={{ height: '300px', width: '100%' }}>
      <ReactApexChart
        options={options}
        series={series}
        type="donut"
        height="100%"
      />
    </div>
  );
};

export default PieChartComponent;