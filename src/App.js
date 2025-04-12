import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto';
import {
  Box,
  Container,
  Heading,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Flex,
  Input,
  Card,
  CardBody,
} from '@chakra-ui/react';

const socket = io('http://localhost:4000');

function App() {
  const [logs, setLogs] = useState([]);
  const [rawLogs, setRawLogs] = useState([]);
  const [filters, setFilters] = useState({ level: '', service: '', text: '' });
  const [stats, setStats] = useState({ perLevel: {}, averagePerSecond: 0, errorRate: 0 });

  useEffect(() => {
    fetchLogs();
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    socket.on('new_log', (log) => {
      setRawLogs(prev => [log, ...prev.slice(0, 49)]);
    });
    return () => {
      clearInterval(interval);
      socket.off('new_log');
    };
  }, []);

  useEffect(() => {
    applyFilters();
  }, [rawLogs, filters]);

  const fetchLogs = async () => {
    const res = await axios.get('http://localhost:4000/logs');
    setRawLogs(res.data.logs);
  };

  const fetchStats = async () => {
    const res = await axios.get('http://localhost:4000/logs/stats?seconds=60');
    setStats(res.data);
  };

  const applyFilters = () => {
    let filtered = [...rawLogs];
    if (filters.level) filtered = filtered.filter(log => log.level === filters.level);
    if (filters.service) filtered = filtered.filter(log => log.service === filters.service);
    if (filters.text) {
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(filters.text.toLowerCase())
      );
    }
    setLogs(filtered);
  };

  const chartData = {
    labels: Object.keys(stats.perLevel),
    datasets: [{
      label: 'Logs per Level',
      data: Object.values(stats.perLevel),
      backgroundColor: ['#48BB78', '#ED8936', '#F56565']
    }]
  };

  return (
    <Box bg="gray.50" minH="100vh" py={10}>
      <Container maxW="6xl">
        <Heading mb={6} textAlign="center">🚀 Real-Time Log Analyzer</Heading>

        <Flex gap={4} mb={6} flexWrap="wrap">
          <Select
            placeholder="All Levels"
            onChange={e => setFilters(prev => ({ ...prev, level: e.target.value }))}
            maxW="200px"
          >
            <option value="INFO">INFO</option>
            <option value="WARN">WARN</option>
            <option value="ERROR">ERROR</option>
          </Select>

          <Select
            placeholder="All Services"
            onChange={e => setFilters(prev => ({ ...prev, service: e.target.value }))}
            maxW="200px"
          >
            <option value="auth">auth</option>
            <option value="payments">payments</option>
            <option value="notifications">notifications</option>
          </Select>

          <Input
            placeholder="Search text..."
            onChange={e => setFilters(prev => ({ ...prev, text: e.target.value }))}
            maxW="200px"
          />
        </Flex>

        <Card mb={6}>
          <CardBody>
            <Bar data={chartData} />
            <Text mt={4}>
              <strong>Average logs/sec:</strong> {stats.averagePerSecond} &nbsp;|&nbsp;
              <strong>Error Rate:</strong> {stats.errorRate}
            </Text>
          </CardBody>
        </Card>

        <Box overflowX="auto" bg="white" rounded="md" shadow="md">
          <Table variant="simple">
            <Thead bg="gray.100">
              <Tr>
                <Th>Timestamp</Th>
                <Th>Level</Th>
                <Th>Service</Th>
                <Th>Message</Th>
              </Tr>
            </Thead>
            <Tbody>
              {logs.map(log => (
                <Tr key={log.id}>
                  <Td>{new Date(log.timestamp).toLocaleString()}</Td>
                  <Td>{log.level}</Td>
                  <Td>{log.service}</Td>
                  <Td>{log.message}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </Container>
    </Box>
  );
}

export default App;