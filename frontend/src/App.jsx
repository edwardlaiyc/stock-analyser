import { useState } from 'react';
import { MantineProvider, Autocomplete, Card, Text, Loader, Center, SegmentedControl, Group, Badge, createTheme } from '@mantine/core';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AnalysisCard } from './components/AnalysisCard';
import { FinancialsGrid } from './components/FinancialsGrid';
import '@mantine/core/styles.css';

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const theme = createTheme({
  fontFamily: 'Inter, sans-serif',
  headings: { fontFamily: 'Poppins, sans-serif' },
});

const autocompleteStyles = { 
  input: { 
      border: 'none', 
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)', 
      fontFamily: 'Poppins, sans-serif',
      fontWeight: 500
  },
  dropdown: { border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' } 
};

function App() {
  const [searchValue, setSearchValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  
  const [stockData, setStockData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [fundamentals, setFundamentals] = useState(null);
  const [financials, setFinancials] = useState(null);

  const [timeframe, setTimeframe] = useState('1mo');
  const [loading, setLoading] = useState(false);
  const [chartLoading, setChartLoading] = useState(false);

  const handleSearchChange = async (query) => {
    setSearchValue(query);
    if (query.length > 0) {
      try {
        const response = await fetch(`${API_URL}/search?q=${query}`);
        const data = await response.json();
        setSuggestions(data); 
      } catch (error) {
        console.error("Search error:", error);
      }
    }
  };

  const fetchChartHistory = async (symbol, period) => {
    setChartLoading(true);
    try {
      const res = await fetch(`${API_URL}/history?symbol=${symbol}&period=${period}`);
      const data = await res.json();
      setChartData(data);
    } catch (error) {
      console.error("History error:", error);
    }
    setChartLoading(false);
  };

  const handleSelect = async (symbol) => {
    setSelectedStock(symbol);
    setLoading(true);
    setFundamentals(null);
    setFinancials(null);
    
    try {
      const [priceRes, histRes, fundRes, finRes] = await Promise.all([
        fetch(`${API_URL}/quote?symbol=${symbol}`),
        fetch(`${API_URL}/history?symbol=${symbol}&period=${timeframe}`),
        fetch(`${API_URL}/fundamentals?symbol=${symbol}`),
        fetch(`${API_URL}/financials?symbol=${symbol}`)
      ]);

      const priceData = await priceRes.json();
      const histData = await histRes.json();
      const fundData = await fundRes.json();
      const finData = await finRes.json();

      setStockData(priceData);
      setChartData(histData);
      setFundamentals(fundData);
      setFinancials(finData);
      
    } catch (error) {
      console.error("Error fetching details", error);
    }
    setLoading(false);
  };

  const handleTimeframeChange = (value) => {
    setTimeframe(value);
    if (selectedStock) {
        fetchChartHistory(selectedStock, value); 
    }
  };

  const hasData = stockData !== null;
  const percentChange = chartData.length > 0 
    ? ((chartData[chartData.length - 1].price - chartData[0].price) / chartData[0].price) * 100 
    : 0;

  return (
    <MantineProvider theme={theme}>
      <div style={{ 
          backgroundColor: '#BDBBB0', 
          minHeight: '100vh', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: hasData ? 'flex-start' : 'center', 
          padding: '20px',
          transition: 'all 0.5s ease'
      }}> 
        
        <div style={{ width: '100%', maxWidth: 1000, marginTop: hasData ? '50px' : '0px' }}> 
          
          <Autocomplete
            placeholder="Search Ticker (e.g. NVDA)"
            data={suggestions}
            value={searchValue}
            onChange={handleSearchChange}
            onOptionSubmit={handleSelect}
            radius="md"
            size="lg"
            mb="lg"
            comboboxProps={{ shadow: 'md', transitionProps: { transition: 'pop', duration: 200 } }}
            styles={autocompleteStyles}
          />

          {loading && <Center><Loader color="dark" type="dots" /></Center>}

          {stockData && !loading && (
            <>
                <Card padding="xl" radius="lg" shadow="sm" mb="lg" bg="white">
                    <Group justify="space-between" mb="lg" align="flex-end">
                        <div>
                            <Text size="xl" fw={700} ff="Poppins, sans-serif" c="dimmed">{stockData.symbol}</Text>
                            <Group gap="xs" align="center">
                                <Text size="40px" fw={700} ff="Poppins, sans-serif" lh={1} c="#333">
                                    ${stockData.price}
                                </Text>
                                <Badge 
                                    color={percentChange >= 0 ? 'green' : 'red'} 
                                    variant="light" 
                                    size="lg" 
                                    mb={5}
                                    style={{ fontFamily: 'Inter, sans-serif' }}
                                >
                                    {percentChange > 0 ? '+' : ''}{percentChange.toFixed(2)}%
                                </Badge>
                            </Group>
                        </div>
                        <SegmentedControl
                            value={timeframe}
                            onChange={handleTimeframeChange}
                            color="gray"
                            radius="md"
                            disabled={chartLoading}
                            data={[
                                { label: '1W', value: '5d' },
                                { label: '1M', value: '1mo' },
                                { label: '6M', value: '6mo' },
                                { label: '1Y', value: '1y' },
                                { label: 'Max', value: 'max' },
                            ]}
                        />
                    </Group>
                    
                    <div style={{ width: '100%', height: 300, position: 'relative' }}>
                        {chartLoading && (
                            <Center style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'rgba(255,255,255,0.8)' }}>
                                <Loader size="sm" color="gray" />
                            </Center>
                        )}
                        <ResponsiveContainer>
                        <AreaChart data={chartData}>
                            <defs>
                            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={percentChange >= 0 ? "#2f9e44" : "#fa5252"} stopOpacity={0.3}/>
                                <stop offset="95%" stopColor={percentChange >= 0 ? "#2f9e44" : "#fa5252"} stopOpacity={0}/>
                            </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                            <XAxis 
                                dataKey="date" 
                                minTickGap={120}
                                tickFormatter={(str) => {
                                    const date = new Date(str);
                                    if (timeframe === '5d') return date.toLocaleDateString(undefined, {weekday: 'short'});
                                    return date.toLocaleDateString(undefined, {month: 'short', day: 'numeric'});
                                }}
                                tick={{ fontSize: 12, fill: '#888' }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis 
                                domain={['auto', 'auto']} 
                                width={40} 
                                tick={{ fontSize: 12, fill: '#888' }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip 
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                                labelFormatter={(label) => new Date(label).toLocaleDateString()} 
                                formatter={(value) => [`$${value}`, "Price"]}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="price" 
                                stroke={percentChange >= 0 ? "#2f9e44" : "#fa5252"} 
                                strokeWidth={2} 
                                fillOpacity={1} 
                                fill="url(#colorPrice)" 
                                animationDuration={500}
                            />
                        </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {financials && <FinancialsGrid data={financials} />}
                {fundamentals && <AnalysisCard analysis={fundamentals.analysis} summary={fundamentals.summary} />}
            </>
          )}

        </div>
      </div>
    </MantineProvider>
  );
}

export default App;