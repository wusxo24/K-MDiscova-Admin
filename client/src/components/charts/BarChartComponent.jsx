import React from 'react';
import ReactApexChart from 'react-apexcharts';

const BarChartComponent = ({ data }) => {
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
    data: data.map(item => item.value)
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