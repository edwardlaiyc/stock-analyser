import { Card, Text } from '@mantine/core';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export function FinancialChart({ title, data, color = "#f08c00", formatCurrency = false }) {
  if (!data || data.length === 0) return null;

  const formatValue = (val) => {
    if (formatCurrency) return `$${val.toFixed(2)}`;
    return Math.abs(val) >= 1e9 ? `${(val / 1e9).toFixed(1)}B` :
           Math.abs(val) >= 1e6 ? `${(val / 1e6).toFixed(1)}M` : 
           val;
  };

  return (
    <Card padding="lg" radius="md" shadow="sm" bg="white" h="100%">
      <Text size="md" fw={700} c="black" tt="uppercase" mb="md" style={{ fontFamily: 'Poppins, sans-serif' }}>
        {title}
      </Text>

      <div style={{ width: '100%', height: 200 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
            <XAxis 
                dataKey="year" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#868e96' }}
                dy={10}
            />
            <YAxis 
                width={60} 
                axisLine={false} 
                tickLine={false} 
                tickFormatter={formatValue}
                tick={{ fontSize: 12, fill: '#868e96' }}
            />
            <Tooltip 
                cursor={{ fill: 'transparent' }}
                formatter={(val) => [formatValue(val), title]}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
            <Bar 
                dataKey="value" 
                fill={color} 
                radius={[4, 4, 0, 0]} 
                barSize={30}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}