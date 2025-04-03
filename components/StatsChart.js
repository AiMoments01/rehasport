import React from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Cell
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const StatsChart = ({ 
  type = 'line', 
  data = [], 
  xKey = 'name', 
  yKey = 'value',
  dataKey = 'value',
  title,
  height = 300,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-md" style={{ height: `${height}px` }}></div>
      </div>
    );
  }

  let chart;
  
  switch (type) {
    case 'line':
      chart = (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                border: 'none', 
                borderRadius: '4px', 
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)' 
              }} 
            />
            <Legend wrapperStyle={{ paddingTop: 10 }} />
            <Line 
              type="monotone" 
              dataKey={yKey} 
              stroke="#0088FE" 
              strokeWidth={2}
              activeDot={{ r: 6 }} 
            />
          </LineChart>
        </ResponsiveContainer>
      );
      break;
      
    case 'bar':
      chart = (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                border: 'none', 
                borderRadius: '4px', 
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)' 
              }} 
            />
            <Legend wrapperStyle={{ paddingTop: 10 }} />
            <Bar dataKey={yKey} fill="#0088FE" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
      break;
      
    case 'pie':
      chart = (
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey={dataKey}
              nameKey={xKey}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                border: 'none', 
                borderRadius: '4px', 
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)' 
              }} 
            />
            <Legend wrapperStyle={{ paddingTop: 20 }} />
          </PieChart>
        </ResponsiveContainer>
      );
      break;
      
    default:
      chart = <div>Unbekannter Chart-Typ</div>;
  }
  
  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
      {title && <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-white">{title}</h3>}
      {chart}
    </div>
  );
};

export default StatsChart;
