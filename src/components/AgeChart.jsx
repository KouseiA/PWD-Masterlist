import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

/**
 * Age Distribution Chart component for PWD Masterlist Dashboard.
 * Categorizes PWD members into demographic brackets: Children, Young Adults, Adults, and Seniors.
 */

const calculateAge = (birthday) => {
  if (!birthday) return null;
  const today = new Date();
  const birthDate = new Date(birthday);
  if (isNaN(birthDate.getTime())) return null;
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const AgeChart = ({ members }) => {
  const data = [
    { name: '0-17',   full: 'Children', count: 0, color: '#10b981' }, // Emerald
    { name: '18-30',  full: 'Young Adults', count: 0, color: '#3b82f6' }, // Blue
    { name: '31-59',  full: 'Adults', count: 0, color: '#f59e0b' }, // Amber
    { name: '60+',    full: 'Seniors', count: 0, color: '#ef4444' }, // Red
  ];

  members.forEach(m => {
    const age = calculateAge(m.birthday);
    if (age === null || age < 0) return;
    if (age <= 17) data[0].count++;
    else if (age <= 30) data[1].count++;
    else if (age <= 59) data[2].count++;
    else data[3].count++;
  });

  return (
    <div className="age-chart-container" style={{ height: 260, width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
          barSize={40}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} 
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            allowDecimals={false}
          />
          <Tooltip 
            cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }}
            contentStyle={{ 
              borderRadius: '12px', 
              border: '1px solid #E2E8F0', 
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)',
              fontSize: '12px',
              padding: '8px 12px'
            }}
            itemStyle={{ fontWeight: 600, color: '#1e293b' }}
            labelStyle={{ display: 'none' }}
            formatter={(value, name, props) => [value, props.payload.full]}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]} animationDuration={1000}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AgeChart;
