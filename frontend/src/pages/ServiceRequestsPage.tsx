import { Box, Container, Title, Table, Button, Group, Alert, Badge, Collapse, Text, FileInput, Image, Modal, Select, Paper, ThemeIcon } from '@mantine/core';
import { useState, useEffect, useMemo, Fragment } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { notifications } from '@mantine/notifications';
import { IconChevronUp, IconChevronDown, IconX } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';

interface ServiceRequest {
  id: number;
  client: string;
  service_name: string;
  service_image: string | null;
  status: string;
  request_date: string;
  url: string;
  roles: string;
  notes: string;
  report_file: string | null;
  assigned_to_email: string | null;
  assigned_to: number | null;
}

interface AdminUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

export function ServiceRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [opened, setOpened] = useState<number[]>([]);
  const [uploading, setUploading] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  
  const [uploadModalOpened, setUploadModalOpened] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);

  const isPartialAdmin = user?.groups?.includes('Partial Access Admin');
  const isFullAdmin = user?.is_superuser || user?.groups?.includes('Main Admin') || user?.groups?.includes('Full Access Admin');

  const fetchRequests = () => {
    axiosInstance.get<ServiceRequest[]>('/api/service-requests/')
      .then(response => setRequests(response.data))
      .catch(() => setError('Failed to fetch service requests.'));
  };

  const fetchAdmins = () => {
    axiosInstance.get<AdminUser[]>('/api/admin/list-for-assignment/')
      .then(response => setAdmins(response.data))
      .catch(() => {
        console.error('Failed to fetch admins for assignment.');
      });
  };

  useEffect(() => {
    fetchRequests();
    if (isFullAdmin) {
      fetchAdmins();
    }
  }, [user, isFullAdmin]);

  const handleUpdateRequestStatus = async (id: number, newStatus: 'awaiting_payment' | 'rejected') => {
    try {
      await axiosInstance.post(`/api/service-requests/${id}/update_status/`, { status: newStatus });
      notifications.show({
        title: 'Status Updated',
        message: `Request #${id} has been ${newStatus === 'awaiting_payment' ? 'approved' : 'rejected'}.`,
        color: 'green',
      });
      fetchRequests();
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
      fetchRequests();
      setFile(null);
      setUploadModalOpened(false);
      setSelectedRequest(null);
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

  const handleOpenUploadModal = (request: ServiceRequest) => {
    setSelectedRequest(request);
    setUploadModalOpened(true);
  };

  const handleAssignRequest = async (requestId: number, adminId: string | null) => {
    if (!adminId) {
      notifications.show({
        title: 'Assignment Failed',
        message: 'No admin selected for assignment.',
        color: 'red',
      });
      return;
    }

    try {
      await axiosInstance.post(`/api/service-requests/${requestId}/assign/`, {
        admin_id: adminId,
      });
      notifications.show({
        title: 'Request Assigned',
        message: `Request #${requestId} has been assigned successfully.`,
        color: 'green',
      });
      fetchRequests();
    } catch (err: any) {
      notifications.show({
        title: 'Assignment Failed',
        message: err.response?.data?.error || 'Failed to assign the request.',
        color: 'red',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'teal';
      case 'in_progress': return 'blue';
      case 'pending_approval': return 'yellow';
      case 'awaiting_payment': return 'orange';
      case 'rejected': return 'red';
      default: return 'gray';
    }
  };

  const assignableAdmins = useMemo(() => {
    if (!user) return [];
    const otherAdmins = admins
      .filter(admin => admin.id !== user.id)
      .map(admin => ({
        value: String(admin.id),
        label: `${admin.first_name} ${admin.last_name}`,
      }));
    return [
      { value: String(user.id), label: 'Assign to Me' },
      ...otherAdmins,
    ];
  }, [admins, user]);

  const rows = requests.map((request) => {
    const isAssigned = !!request.assigned_to;
    const isAssignedToCurrentUser = user ? request.assigned_to === user.id : false;
    const nonAssignableStatuses = ['completed', 'rejected'];

    const canAssignOrReassign = isFullAdmin && !nonAssignableStatuses.includes(request.status);

    let assignedToContent;
    if (canAssignOrReassign) {
      assignedToContent = (
        <Select
          placeholder="Assign..."
          data={assignableAdmins}
          value={isAssigned ? String(request.assigned_to) : null}
          onChange={(value) => handleAssignRequest(request.id, value)}
          onClick={(e) => e.stopPropagation()}
          searchable
        />
      );
    } else {
      assignedToContent = request.assigned_to_email || 'Unassigned';
    }

    const actions = [];
    if (isFullAdmin && request.status === 'pending_approval' && isAssigned) {
      actions.push(
        <Button
          key="approve"
          size="xs"
          color="green"
          onClick={(e) => { e.stopPropagation(); handleUpdateRequestStatus(request.id, 'awaiting_payment'); }}
        >
          Approve
        </Button>,
        <Button
          key="reject"
          size="xs"
          color="red"
          onClick={(e) => { e.stopPropagation(); handleUpdateRequestStatus(request.id, 'rejected'); }}
        >
          Reject
        </Button>
      );
    }

    if (request.status === 'in_progress' && isAssignedToCurrentUser) {
      actions.push(
        <Button key="upload-report" size="xs" onClick={(e) => { e.stopPropagation(); handleOpenUploadModal(request); }}>
          Upload Report
        </Button>
      );
    }
    const actionsContent = <Group gap="xs">{actions}</Group>;

    return (
      <>
        <Table.Tr key={request.id} onClick={() => setOpened(o => o.includes(request.id) ? o.filter(id => id !== request.id) : [...o, request.id])} style={{ cursor: 'pointer' }}>
          <Table.Td>
            {opened.includes(request.id) ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
          </Table.Td>
          <Table.Td>{request.id}</Table.Td>
          <Table.Td>{request.client}</Table.Td>
          <Table.Td>
            <Group>
              {request.service_image && <Image src={request.service_image} h={40} w={40} radius="md" />}
              <Text>{request.service_name}</Text>
            </Group>
          </Table.Td>
          <Table.Td>{new Date(request.request_date).toLocaleDateString()}</Table.Td>
          <Table.Td>
            <Badge color={getStatusColor(request.status)} variant="light">
              {request.status.replace(/_/g, ' ')}
            </Badge>
          </Table.Td>
          {!isPartialAdmin && <Table.Td>{assignedToContent}</Table.Td>}
          <Table.Td>{actionsContent}</Table.Td>
        </Table.Tr>
        <Table.Tr key={`${request.id}-details`}>
          <Table.Td colSpan={isPartialAdmin ? 7 : 8} p={0}>
            <Collapse in={opened.includes(request.id)}>
              <Box p="md" bg="var(--mantine-color-dark-6)" c="var(--mantine-color-white)">
                <Text><strong>URL:</strong> {request.url}</Text>
                <Text mt="xs"><strong>Roles:</strong> {request.roles}</Text>
                {request.notes && <Text mt="xs"><strong>Notes:</strong> {request.notes}</Text>}
                {request.report_file && (
                  <Button component="a" href={request.report_file} target="_blank" size="xs" mt="sm">
                    View Report
                  </Button>
                )}
              </Box>
            </Collapse>
          </Table.Td>
        </Table.Tr>
      </>
    );
  });

  return (
    <>
      <Modal
        opened={uploadModalOpened}
        onClose={() => setUploadModalOpened(false)}
        title={`Upload Report for Request #${selectedRequest?.id}`}
      >
        <FileInput
          label="Report PDF"
          placeholder="Select report file"
          onChange={setFile}
          accept=".pdf"
          required
        />
        <Button
          fullWidth
          mt="md"
          onClick={() => selectedRequest && handleUploadReport(selectedRequest.id)}
          loading={uploading === selectedRequest?.id}
          disabled={!file}
        >
          Upload & Complete
        </Button>
      </Modal>

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
              {!isPartialAdmin && <Table.Th>Assigned To</Table.Th>}
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      </Container>
    </>
  );
}
