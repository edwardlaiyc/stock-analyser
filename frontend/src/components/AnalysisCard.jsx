import { Card, Text, Title, Accordion, Grid, Alert } from '@mantine/core';

const renderListItems = (items) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
    {items?.map((item, index) => (
      <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
        <Text size="sm" style={{ minWidth: '10px', lineHeight: '1.5' }}>•</Text>
        <Text size="sm" style={{ lineHeight: '1.5', fontFamily: 'Inter, sans-serif' }}>{item}</Text>
      </div>
    ))}
  </div>
);

export function AnalysisCard({ analysis, summary }) {
  if (!analysis) return null;

  const moatColor = (analysis.moat?.toLowerCase() || "").includes("wide") ? "green" : 
                    (analysis.moat?.toLowerCase() || "").includes("narrow") ? "yellow" : "gray";

  return (
    <Card padding="xl" radius="lg" shadow="sm" mb="lg" bg="white">
      
      <Title order={3} size="h4" mb="md">Company Analysis (by Gemini)</Title>

      <Alert 
        variant="light" 
        color={moatColor} 
        title={<Title order={5}>MOAT STATUS: {analysis.moat ? analysis.moat.split('.')[0] : "Unknown"}</Title>}
        mb="xl"
        radius="md"
      >
        <Text size="sm" style={{ fontFamily: 'Inter, sans-serif' }}>{analysis.moat}</Text>
      </Alert>

      <Grid gutter="xl" mb="xl">
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Title order={5} c="green" mb="sm">Growth Catalysts</Title>
          {renderListItems(analysis.catalysts)}
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Title order={5} c="red" mb="sm">Key Risks</Title>
          {renderListItems(analysis.risks)}
        </Grid.Col>
      </Grid>

      <Accordion variant="default" radius="md">
        <Accordion.Item value="summary">
          <Accordion.Control>
            <Text fw={600} size="sm" style={{ fontFamily: 'Poppins, sans-serif' }}>Read Company Profile</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Text size="sm" lh={1.6} c="dimmed" style={{ fontFamily: 'Inter, sans-serif' }}>
              {summary}
            </Text>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
      
    </Card>
  );
}