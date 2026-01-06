import { SimpleGrid } from '@mantine/core';
import { FinancialChart } from './FinancialChart';

export function FinancialsGrid({ data }) {
  if (!data) return null;

  // Configuration Array: Easy to add/remove charts later
  const metrics = [
    { title: "Total Revenue", data: data.revenue, color: "#fcc419" },
    { title: "Free Cash Flow", data: data.fcf, color: "#f76707" },
    { title: "Earnings Per Share (Diluted)", data: data.eps, color: "#82c91e", isCurrency: true },
    { title: "Shares Outstanding", data: data.shares, color: "#20c997" }
  ];

  return (
    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" mb="lg">
      {metrics.map((m) => (
        <FinancialChart 
          key={m.title}
          title={m.title} 
          data={m.data} 
          color={m.color} 
          formatCurrency={m.isCurrency} 
        />
      ))}
    </SimpleGrid>
  );
}