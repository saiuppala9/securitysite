import { Container, Title, Table, Button, Group, Alert, Badge, Collapse, Box, Text, FileInput } from '@mantine/core';
import { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { notifications } from '@mantine/notifications';
import { IconChevronUp, IconChevronDown, IconX } from '@tabler/icons-react';

interface ServiceRequest {
  id: number;
  client: string; // This is the client's email
  service_name: string;
  status: string;
  request_date: string;
  url: string;
  roles: string;
  notes: string;
  report_file: string | null;
}

export function ServiceRequestsPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [opened, setOpened] = useState<number[]>([]);
  const [uploading, setUploading] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const fetchRequests = () => {
    axiosInstance.get<ServiceRequest[]>('/api/service-requests/')
      .then(response => setRequests(response.data))
      .catch(() => setError('Failed to fetch service requests.'));
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleUpdateRequestStatus = async (id: number, newStatus: 'awaiting_payment' | 'rejected') => {
    try {
      await axiosInstance.post(`/api/service-requests/${id}/update_status/`, { status: newStatus });
      notifications.show({
        title: 'Status Updated',
        message: `Request #${id} has been ${newStatus === 'awaiting_payment' ? 'approved' : 'rejected'}.`,
        color: 'green',
      });
      fetchRequests(); // Refresh the list
    } catch (err: any) {
      notifications.show({
        title: 'Update Failed',
        message: err.response?.data?.error || 'Failed to update status.',
        color: 'red',
      });
    }
  };

  const handleUploadReport = async (id: number) => {
    if (!file) {
      notifications.show({
        title: 'No file selected',
        message: 'Please select a PDF file to upload.',
        color: 'orange',
      });
      return;
    }

    setUploading(id);
    const formData = new FormData();
    formData.append('report_file', file);

    try {
      await axiosInstance.post(`/api/service-requests/${id}/upload_report/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      notifications.show({
        title: 'Report Uploaded',
        message: 'The report has been uploaded and the request is marked as completed.',
        color: 'green',
      });
      fetchRequests(); // Refresh the list
      setFile(null);
    } catch (err: any) {
      notifications.show({
        title: 'Upload Failed',
        message: err.response?.data?.error || 'Failed to upload the report.',
        color: 'red',
      });
    } finally {
      setUploading(null);
    }
  };

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

  const rows = requests.map((request) => (
    <>
      <Table.Tr key={request.id}>
        <Table.Td>
          <Button
            variant="subtle"
            size="xs"
            onClick={() => setOpened(o => o.includes(request.id) ? o.filter((item: any) => item !== request.id) : [...o, request.id])}
          >
            {opened.includes(request.id) ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
          </Button>
        </Table.Td>
        <Table.Td>{request.id}</Table.Td>
        <Table.Td>{request.client}</Table.Td>
        <Table.Td>{request.service_name}</Table.Td>
        <Table.Td>{new Date(request.request_date).toLocaleDateString()}</Table.Td>
        <Table.Td>
          <Badge color={getStatusColor(request.status)} variant="light">
            {request.status.replace(/_/g, ' ').toUpperCase()}
          </Badge>
        </Table.Td>
        <Table.Td>
          {request.status === 'pending_approval' && (
            <Group gap="xs">
              <Button size="xs" color="green" onClick={() => handleUpdateRequestStatus(request.id, 'awaiting_payment')}>Approve</Button>
              <Button size="xs" color="red" onClick={() => handleUpdateRequestStatus(request.id, 'rejected')}>Reject</Button>
            </Group>
          )}
          {request.status === 'in_progress' && (
            <Group gap="xs">
               <FileInput size="xs" placeholder="Select report PDF" onChange={setFile} accept=".pdf" disabled={uploading === request.id} />
              <Button 
                size="xs" 
                onClick={() => handleUploadReport(request.id)}
                loading={uploading === request.id}
                disabled={!file}
              >
                Upload & Complete
              </Button>
            </Group>
          )}
        </Table.Td>
      </Table.Tr>
      <Table.Tr key={`${request.id}-details`}>
        <Table.Td colSpan={7} p={0}>
          <Collapse in={opened.includes(request.id)}>
            <Box p="md" bg="var(--mantine-color-dark-6)" c="var(--mantine-color-white)">
              <Text><strong>URL:</strong> {request.url}</Text>
              <Text mt="xs"><strong>Roles:</strong> {request.roles}</Text>
              {request.notes && <Text mt="xs"><strong>Notes:</strong> {request.notes}</Text>}
            </Box>
          </Collapse>
        </Table.Td>
      </Table.Tr>
    </>
  ));

  return (
    <Container fluid>
      <Title order={2} mb="xl">Service Requests</Title>
      {error && (
        <Alert icon={<IconX size="1rem" />} title="Error" color="red" withCloseButton onClose={() => setError(null)} mb="md">
          {error}
        </Alert>
      )}
      <Table striped withTableBorder withColumnBorders>
        <Table.Thead>
          <Table.Tr>
            <Table.Th />
            <Table.Th>ID</Table.Th>
            <Table.Th>Client</Table.Th>
            <Table.Th>Service</Table.Th>
            <Table.Th>Date</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </Container>
  );
}
