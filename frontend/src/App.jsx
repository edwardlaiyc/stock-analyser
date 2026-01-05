import { useState } from 'react';
import { MantineProvider, Autocomplete, Card, Text, Loader, Center, SegmentedControl, Group, Badge } from '@mantine/core';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import '@mantine/core/styles.css';

function App() {
  const [searchValue, setSearchValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [stockData, setStockData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [timeframe, setTimeframe] = useState('1mo');
  const [loading, setLoading] = useState(false);
  const [percentChange, setPercentChange] = useState(null);

  const handleSearchChange = async (query) => {
    setSearchValue(query);
    if (query.length > 0) {
      try {
        const response = await fetch(`http://127.0.0.1:8000/search?q=${query}`);
        const data = await response.json();
        setSuggestions(data); 
      } catch (error) {
        console.error("Backend error:", error);
      }
    }
  };

  const fetchStockDetails = async (symbol, period) => {
    setLoading(true);
    try {
      const priceRes = await fetch(`http://127.0.0.1:8000/quote?symbol=${symbol}`);
      const priceData = await priceRes.json();
      setStockData(priceData);

      const historyRes = await fetch(`http://127.0.0.1:8000/history?symbol=${symbol}&period=${period}`);
      const historyData = await historyRes.json();
      setChartData(historyData);

      if (historyData.length > 0) {
        const startPrice = historyData[0].price;
        const endPrice = historyData[historyData.length - 1].price;
        const change = ((endPrice - startPrice) / startPrice) * 100;
        setPercentChange(change);
      }
      
    } catch (error) {
      console.error("Error fetching details", error);
    }
    setLoading(false);
  };

  const handleSelect = (item) => {
    setSelectedStock(item);
    fetchStockDetails(item, timeframe);
  };

  const handleTimeframeChange = (value) => {
    setTimeframe(value);
    if (selectedStock) {
        fetchStockDetails(selectedStock, value);
    }
  };

  return (
    <MantineProvider>
      {/* UPDATED: Background is now black for high contrast */}
      <Center mih="100vh" bg="#7E7F83" p="md"> 
        <div style={{ width: 700 }}>
          
          {/* Header removed entirely */}
          
          <Autocomplete
            // UPDATED: Placeholder text
            placeholder="Enter a stock ticker (e.g. TSLA)"
            data={suggestions}
            value={searchValue}
            onChange={handleSearchChange}
            onOptionSubmit={handleSelect}
            radius="md"
            size="lg"
            mb="50px" 
            comboboxProps={{ shadow: 'xl', transitionProps: { transition: 'pop', duration: 200 } }}
            styles={{ input: { borderColor: '#e0e0e0' } }}
          />

          {loading && <Center><Loader color="blue" type="bars" /></Center>}

          {stockData && !loading && (
            <Card 
                padding="xl" 
                radius="lg" 
                withBorder 
                shadow="sm" 
                style={{ borderColor: '#dee2e6' }}
            >
              
              <Group justify="space-between" mb="lg" align="flex-end">
                <div>
                    <Text size="xl" fw={700} c="dimmed">{stockData.symbol}</Text>
                    
                    <Group gap="xs" align="center">
                        <Text size="40px" fw={900} lh={1}>
                            ${stockData.price}
                        </Text>

                        {percentChange !== null && (
                            <Badge 
                                color={percentChange >= 0 ? 'green' : 'red'} 
                                variant="light" 
                                size="lg"
                                mb={5}
                            >
                                {percentChange > 0 ? '+' : ''}{percentChange.toFixed(2)}%
                            </Badge>
                        )}
                    </Group>
                </div>
                
                <SegmentedControl
                  value={timeframe}
                  onChange={handleTimeframeChange}
                  data={[
                    { label: '1W', value: '5d' },
                    { label: '1M', value: '1mo' },
                    { label: '6M', value: '6mo' },
                    { label: '1Y', value: '1y' },
                    { label: 'Max', value: 'max' },
                  ]}
                />
              </Group>

              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={percentChange >= 0 ? "#2f9e44" : "#fa5252"} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={percentChange >= 0 ? "#2f9e44" : "#fa5252"} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis 
                        dataKey="date" 
                        minTickGap={50}
                        tickFormatter={(str) => {
                            const date = new Date(str);
                            if (timeframe === '5d') return date.toLocaleDateString(undefined, {weekday: 'short'});
                            if (timeframe === '1y') return date.toLocaleDateString(undefined, {month: 'short'});
                            if (timeframe === 'max') return date.getFullYear().toString();
                            return date.toLocaleDateString(undefined, {month: 'short', day: 'numeric'});
                        }}
                    />
                    <YAxis domain={['auto', 'auto']} width={40} />
                    <Tooltip 
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
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

            </Card>
          )}

        </div>
      </Center>
    </MantineProvider>
  );
}

export default App;