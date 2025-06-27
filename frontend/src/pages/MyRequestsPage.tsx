import React, { useState, useEffect } from 'react';
import { Container, Title, Accordion, Text, Badge, Paper, Group, Button, Loader, Alert } from '@mantine/core';
import axiosInstance from '../utils/axiosInstance';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconClock } from '@tabler/icons-react';
import classes from './MyRequestsPage.module.css';

interface ServiceRequest {
  id: number;
  service_name: string;
  status: string;
  request_date: string;
  url: string;
  roles: string;
  notes: string;
  approved_at: string | null;
  report_url: string | null;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = () => {
    setLoading(true);
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
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleDownload = (fileUrl: string, fileName: string) => {
    // First try direct download
    const link = document.createElement('a');
    link.href = fileUrl;
    link.setAttribute('download', fileName);
    link.setAttribute('target', '_blank'); // Fallback to opening in new tab
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Add error handling in case direct download fails
    link.onerror = () => {
      // Fallback to axios download
      axiosInstance.get<Blob>(fileUrl, { responseType: 'blob' })
        .then(response => {
          const blob = response.data as Blob;
          const url = window.URL.createObjectURL(blob);
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
            message: 'Failed to download the report. Please try again or contact support if the issue persists.',
            color: 'red',
          });
        });
    };
  };

  const handleWithdraw = async (serviceRequestId: number) => {
    if (window.confirm('Are you sure you want to withdraw this request? This action cannot be undone.')) {
      try {
        await axiosInstance.post(`/api/service-requests/${serviceRequestId}/withdraw/`);
        notifications.show({
          title: 'Request Withdrawn',
          message: 'Your service request has been successfully withdrawn.',
          color: 'green',
        });
        fetchRequests(); // Refresh the list of requests
      } catch (err: any) {
        notifications.show({
          title: 'Withdrawal Error',
          message: err.response?.data?.error || 'Could not withdraw the request.',
          color: 'red',
        });
      }
    }
  };

  const handlePayment = async (serviceRequestId: number) => {
    try {
      // Make sure we have the auth token set
      const authTokens = localStorage.getItem('authTokens');
      if (authTokens) {
        const tokens = JSON.parse(authTokens);
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${tokens.access}`;
      }
      
      // Send the request with the correct service request ID
      const response = await axiosInstance.post<{ [key: string]: string }>(`/api/service-requests/${serviceRequestId}/pay/`, {
        service_request_id: serviceRequestId
      });
      
      const payuData = response.data;
      console.log('Payment data received:', payuData);
      postToPayU(payuData);
    } catch (err: any) {
      console.error('Payment error:', err);
      notifications.show({
        title: 'Payment Error',
        message: err.response?.data?.error || 'Could not initiate payment.',
        color: 'red',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_approval': return 'yellow';
      case 'awaiting_payment': return 'orange';
      case 'in_progress': return 'blue';
      case 'completed': return 'green';
      case 'rejected':
      case 'cancelled':
      case 'withdrawn': return 'red';
      default: return 'gray';
    }
  };

  const postToPayU = (data: { [key: string]: string }) => {
    try {
      const payuUrl = data.payu_mode === 'LIVE' 
        ? 'https://secure.payu.in/_payment' 
        : 'https://test.payu.in/_payment';
  
      console.log('Submitting to PayU URL:', payuUrl);
      console.log('PayU form data:', data);
  
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
    } catch (error) {
      console.error('Error in postToPayU:', error);
      notifications.show({
        title: 'Payment Form Error',
        message: 'Failed to create payment form. Please try again.',
        color: 'red',
      });
    }
  };

  return (
    <Container my="xl" size="lg">
      <Title order={1} ta="center" mb="lg" c="violet.6">
        My Service Requests
      </Title>
      <Text c="dimmed" ta="center" size="xl" mb="xl">
        Track the status of your ongoing and past service requests.
      </Text>

      {loading && <Loader style={{ display: 'block', margin: 'auto' }} />}
      {error && <Alert icon={<IconAlertCircle size="1rem" />} title="Error!" color="red" variant="light">{error}</Alert>}
      
      {!loading && !error && requests.length === 0 && (
        <Paper className="glass-card" radius="md" p={40} mt={60} style={{ maxWidth: 500, margin: 'auto', textAlign: 'center' }}>
          <IconAlertCircle size={48} color="#868E96" style={{ marginBottom: 16 }} />
          <Title order={3} mb="xs">No Service Requests Yet</Title>
          <Text c="dimmed" mb="md">
            You haven't made any service requests. Click <b>Request Service</b> above to get started!
          </Text>
        </Paper>
      )}

      {!loading && !error && requests.length > 0 && (
        <Accordion variant="separated" radius="md" chevronPosition="left">
          {requests.map((request: ServiceRequest) => (
            <Accordion.Item value={String(request.id)} key={request.id} className={classes.accordionItem}>
              <Accordion.Control className={classes.accordionControl}>
                <Group justify="space-between" align="center">
                  <Title order={4} fw={600}>{request.service_name}</Title>
                  <Badge color={getStatusColor(request.status)} size="lg" radius="sm" className={classes.statusBadge}>
                    {request.status.replace(/_/g, ' ').toUpperCase()}
                  </Badge>
                </Group>
              </Accordion.Control>
              <Accordion.Panel className={classes.accordionPanel}>
                <Text size="sm" c="dimmed" mb={16}>Requested on: {new Date(request.request_date).toLocaleDateString()}</Text>
                
                <Paper p="md" radius="md" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
                    <Text mb={4}><strong>URL:</strong> {request.url}</Text>
                    <Text mb={4}><strong>Roles:</strong> {request.roles}</Text>
                    {request.notes && <Text mb={4}><strong>Notes:</strong> {request.notes}</Text>}
                </Paper>

                {request.status === 'pending_approval' && (
                  <Button
                    color="red"
                    variant="outline"
                    size="sm"
                    mt="sm"
                    onClick={() => handleWithdraw(request.id)}
                  >
                    Withdraw Request
                  </Button>
                )}

                {request.status === 'awaiting_payment' && request.approved_at && (
                  <>
                    <PaymentTimer approvedAt={request.approved_at} />
                    <Button fullWidth mt="md" onClick={() => handlePayment(request.id)} color="violet" size="md">
                      Proceed to Payment
                    </Button>
                  </>
                )}

                {request.status === 'completed' && request.report_url && (
                  <Button 
                    onClick={() => request.report_url && handleDownload(request.report_url, `report-${request.id}.pdf`)}
                    variant="filled"
                    color="violet"
                    size="sm"
                    disabled={!request.report_url}
                  >
                    Download Report
                  </Button>
                )}
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
      )}
    </Container>
  );
}
