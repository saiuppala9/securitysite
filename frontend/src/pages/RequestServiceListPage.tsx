import React, { useState, useEffect } from 'react';
import { Container, Title, SimpleGrid, Card, Text, Button, Loader, Alert } from '@mantine/core';
import { Link } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import { IconAlertCircle } from '@tabler/icons-react';

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
    <Container my="xl">
      <Title ta="center" mb="xl">Request a Service</Title>
      {loading && <Loader />}
      {error && <Alert icon={<IconAlertCircle size="1rem" />} title="Error!" color="red">{error}</Alert>}
      {!loading && !error && (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
          {services.map(service => {
            console.log(`Service: ${service.name}, Image URL: ${service.image}`);
            return (
              <Card shadow="sm" padding="lg" radius="md" withBorder key={service.id}>
                {service.image && (
                  <Card.Section>
                    <img
                      src={service.image}
                      style={{ height: '160px', width: '100%', objectFit: 'cover' }}
                      alt={service.name}
                    />
                  </Card.Section>
                )}
                <Text fw={500} mt="md">{service.name}</Text>
                <Text size="sm" c="dimmed" mt="xs">{service.description}</Text>
                <Button 
                  component={Link} 
                  to={`/service-request/${service.id}`}
                  variant="light" 
                  color="blue" 
                  fullWidth 
                  mt="md" 
                  radius="md"
                >
                  Request Service
                </Button>
              </Card>
            );
          })}
        </SimpleGrid>
      )}
    </Container>
  );
}
