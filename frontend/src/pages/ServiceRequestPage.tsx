import { useState, useEffect } from 'react';
import { Container, Title, TextInput, Textarea, Button, Paper, Group, Alert, Loader, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import axiosInstance from '../utils/axiosInstance';
import { notifications } from '@mantine/notifications';
import { useNavigate, useParams } from 'react-router-dom';
import { IconAlertCircle } from '@tabler/icons-react';

interface Service {
  id: number;
  name: string;
  description: string;
}

export function ServiceRequestPage() {
  const navigate = useNavigate();
  const { serviceId } = useParams<{ serviceId: string }>();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (serviceId) {
      setLoading(true);
      axiosInstance.get<Service>(`/api/services/${serviceId}/`)
        .then(response => {
          setService(response.data);
          setError(null);
          setLoading(false);
        })
        .catch(() => {
          setError('Could not load the details for the selected service.');
          setLoading(false);
        });
    } else {
      setError('No service ID was provided in the URL.');
      setLoading(false);
    }
  }, [serviceId]);

  const form = useForm({
    initialValues: {
      url: '',
      roles: '',
      notes: '',
      credentials: '',
    },
    validate: {
      url: (value: string) => (value.trim().length > 0 ? null : 'URL is required'),
      roles: (value: string) => (value.trim().length > 0 ? null : 'Login roles are required'),
      credentials: (value: string) => (value.trim().length > 0 ? null : 'Login credentials are required'),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    if (!serviceId) {
      setError('Cannot submit request without a service ID.');
      return;
    }
    try {
      const submissionData = {
        ...values,
        service_id: parseInt(serviceId, 10),
      };
      await axiosInstance.post('/api/service-requests/', submissionData);
      notifications.show({
        title: 'Request Submitted',
        message: 'Your service request has been submitted successfully. We will review it shortly.',
        color: 'green',
      });
      navigate('/my-requests');
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'An error occurred while submitting your request.';
      notifications.show({
        title: 'Submission Failed',
        message: errorMessage,
        color: 'red',
      });
    }
  };

  if (loading) {
    return <Container my="xl" style={{ textAlign: 'center' }}><Loader /></Container>;
  }

  if (error) {
    return (
      <Container my="xl">
        <Alert icon={<IconAlertCircle size="1rem" />} title="Error!" color="red">
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container my="xl">
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <Title ta="center" mb="lg">
          Request Service: {service?.name}
        </Title>
        <Text c="dimmed" ta="center" mb="xl">{service?.description}</Text>

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput
            label="URL"
            placeholder="https://example.com"
            required
            {...form.getInputProps('url')}
          />
          <Textarea
            label="Login Roles & Access Information"
            placeholder="e.g., admin, editor, viewer. Provide details on how to access the application."
            required
            mt="md"
            autosize
            minRows={3}
            {...form.getInputProps('roles')}
          />
          <Textarea
            label="Login Credentials"
            placeholder="Enter username and password, or other credentials. This will be encrypted."
            required
            mt="md"
            autosize
            minRows={3}
            {...form.getInputProps('credentials')}
          />
          <Textarea
            label="Additional Notes (Optional)"
            placeholder="Any other information we should know?"
            mt="md"
            autosize
            minRows={2}
            {...form.getInputProps('notes')}
          />

          <Group justify="flex-end" mt="xl">
            <Button type="submit">Submit Request</Button>
          </Group>
        </form>
      </Paper>
    </Container>
  );
}
