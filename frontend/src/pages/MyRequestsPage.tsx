import React, { useState, useEffect } from 'react';
import { Container, Title, Accordion, Text, Badge, Paper, Group, Button, Loader, Alert } from '@mantine/core';
import axiosInstance, { baseURL } from '../utils/axiosInstance';
import { notifications } from '@mantine/notifications';

import { IconAlertCircle, IconClock } from '@tabler/icons-react';

interface ServiceRequest {
  id: number;
  service_name: string;
  status: string;
  request_date: string;
  url: string;
  roles: string;
  notes: string;
  approved_at: string | null;
  report_file: string | null;
}

interface TimeLeft {
  hours?: number;
  minutes?: number;
  seconds?: number;
}

// Countdown timer component
const PaymentTimer = ({ approvedAt }: { approvedAt: string }) => {
  const calculateTimeLeft = (): TimeLeft => {
    const approvedTime = new Date(approvedAt).getTime();
    const now = new Date().getTime();
    const difference = approvedTime + 3 * 60 * 60 * 1000 - now;

    let timeLeft: TimeLeft = {};

    if (difference > 0) {
      timeLeft = {
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearTimeout(timer);
  });

  const timerComponents: React.ReactElement[] = [];

  Object.keys(timeLeft).forEach((interval) => {
    const key = interval as keyof TimeLeft;
    if (!timeLeft[key]) {
      return;
    }
    timerComponents.push(
      <span key={interval}>
        {timeLeft[key]} {interval}{" "}
      </span>
    );
  });

  return (
    <Alert icon={<IconClock size="1rem" />} title="Payment Window" color="orange" variant="light" mt="md">
      <Text>Please complete the payment within the time limit. Time remaining:</Text>
      <Text fw={700} ta="center" my="sm">
        {timerComponents.length ? timerComponents : <span>Time's up!</span>}
      </Text>
    </Alert>
  );
};

export function MyRequestsPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);

  const handleDownload = (fileUrl: string, fileName: string) => {
    axiosInstance.get(fileUrl, { responseType: 'blob' })
      .then(response => {
        const url = window.URL.createObjectURL(new Blob([response.data as BlobPart]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);
      })
      .catch(() => {
        notifications.show({
          title: 'Download Error',
          message: 'Failed to download the report.',
          color: 'red',
        });
      });
  };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    axiosInstance.get<ServiceRequest[]>('/api/service-requests/')
      .then(response => {
        setRequests(response.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch requests', err);
        setError('Failed to load your service requests. Please try again later.');
        setLoading(false);
      });


  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_approval': return 'yellow';
      case 'awaiting_payment': return 'orange';
      case 'in_progress': return 'blue';
      case 'completed': return 'green';
      case 'rejected':
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  };

  const postToPayU = (data: { [key: string]: string }) => {
    const payuUrl = data.payu_mode === 'LIVE' 
      ? 'https://secure.payu.in/_payment' 
      : 'https://test.payu.in/_payment';

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = payuUrl;

    Object.keys(data).forEach(key => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = data[key];
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  };

  const handlePayment = async (serviceRequestId: number) => {
    try {
      const response = await axiosInstance.post<{ [key: string]: string }>('/api/payu/initiate/', {
        service_request_id: serviceRequestId,
      });
      postToPayU(response.data);
    } catch (err: any) {
      notifications.show({
        title: 'Payment Error',
        message: err.response?.data?.error || 'Could not initiate payment.',
        color: 'red',
      });
    }
  };

  return (
    <Container my="xl">
      <Title ta="center" mb="xl">My Service Requests</Title>

      {loading && <Loader />}
      {error && <Alert icon={<IconAlertCircle size="1rem" />} title="Error!" color="red">{error}</Alert>}
      
      {!loading && !error && requests.length === 0 && (
        <Paper withBorder shadow="md" radius="md" p={40} mt={60} style={{ maxWidth: 500, margin: 'auto', textAlign: 'center' }}>
          <IconAlertCircle size={48} color="#868E96" style={{ marginBottom: 16 }} />
          <Title order={3} mb="xs">No Service Requests Yet</Title>
          <Text c="dimmed" mb="md">
            You haven’t made any service requests. Click <b>Request Service</b> above to get started!
          </Text>
        </Paper>
      )}

      {!loading && !error && requests.length > 0 && (
        <div style={{ maxWidth: 900, margin: 'auto' }}>
          {requests.map((request: ServiceRequest) => (
            <Paper withBorder shadow="md" radius="md" p={28} mb={32} key={request.id}>
              <Group justify="space-between" align="center" mb="sm">
                <Title order={4} fw={600}>{request.service_name}</Title>
                <Badge color={getStatusColor(request.status)} size="lg" radius="sm" style={{ fontSize: 14, letterSpacing: 1 }}>
                  {request.status.replace(/_/g, ' ').toUpperCase()}
                </Badge>
              </Group>
              <Text size="sm" c="dimmed" mb={8}>Requested on: {new Date(request.request_date).toLocaleDateString()}</Text>
              <Text size="sm" mb={4}><strong>URL:</strong> {request.url}</Text>
              <Text size="sm" mb={4}><strong>Roles:</strong> {request.roles}</Text>
              {request.notes && <Text size="sm" mb={4}><strong>Notes:</strong> {request.notes}</Text>}

              {request.status === 'awaiting_payment' && request.approved_at && (
                <>
                  <PaymentTimer approvedAt={request.approved_at} />
                  <Button fullWidth mt="md" onClick={() => handlePayment(request.id)}>
                    Pay Now
                  </Button>
                </>
              )}

              {request.status === 'completed' && request.report_file && (
                <Button 
                  onClick={() => request.report_file && handleDownload(request.report_file, `report-${request.id}.pdf`)}
                  variant="outline"
                  disabled={!request.report_file}
                >
                  Download Report
                </Button>
              )}
            </Paper>
          ))}
        </div>
      )}
    </Container>
  );
}
