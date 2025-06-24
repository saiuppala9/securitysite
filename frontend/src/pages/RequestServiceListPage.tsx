import React, { useState, useEffect } from 'react';
import { Container, Title, SimpleGrid, Card, Text, Button, Loader, Alert, Image, Group } from '@mantine/core';
import { Link } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import { IconAlertCircle } from '@tabler/icons-react';
import classes from './RequestServiceListPage.module.css';

interface Service {
  id: number;
  name: string;
  description: string;
  image: string | null;
}

export function RequestServiceListPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axiosInstance.get<Service[]>('/api/services/')
      .then(response => {
        setServices(response.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch services', err);
        setError('Failed to load available services. Please try again later.');
        setLoading(false);
      });
  }, []);

  return (
    <Container size="xl" my="xl">
      <Title order={1} ta="center" mb="lg" c="violet.6">
        Our Security Services
      </Title>
      <Text c="dimmed" ta="center" size="xl" mb="xl">
        Select a service to get started. We offer a range of solutions to meet your security needs.
      </Text>

      {loading && <Loader style={{ display: 'block', margin: 'auto' }} />}
      {error && <Alert icon={<IconAlertCircle size="1rem" />} title="Error!" color="red" variant="light">{error}</Alert>}
      
      {!loading && !error && (
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
          {services.map(service => (
            <Card shadow="sm" padding="lg" radius="md" withBorder key={service.id} className={classes.card}>
              <Card.Section>
                <Image
                  src={service.image || 'https://via.placeholder.com/400x250?text=No+Image'}
                  height={200}
                  alt={service.name}
                />
              </Card.Section>

              <Group justify="space-between" mt="xl" mb="xs">
                <Title order={4} fw={700}>{service.name}</Title>
              </Group>

              <Text size="md" c="dimmed" style={{ minHeight: '120px' }}>
                {service.description}
              </Text>

              <Button
                component={Link}
                to={`/service-request/${service.id}`}
                variant="filled"
                color="violet"
                fullWidth
                mt="md"
                radius="md"
                size="lg"
              >
                Request This Service
              </Button>
            </Card>
          ))}
        </SimpleGrid>
      )}
    </Container>
  );
}
