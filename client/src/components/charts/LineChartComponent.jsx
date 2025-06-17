import React from 'react';
import ReactApexChart from 'react-apexcharts';

const LineChartComponent = ({ data }) => {
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
      categories: data.map(item => item.name),
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
    data: data.map(item => item.value)
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