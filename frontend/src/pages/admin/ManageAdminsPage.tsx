import React, { useState, useEffect } from 'react';
import { Container, Title, Table, Button, Group, Alert, Loader, TextInput, PasswordInput, Select, Paper, Modal, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import axiosInstance from '../../utils/axiosInstance';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle } from '@tabler/icons-react';

interface AdminUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  group_name: string;
}

export function ManageAdminsPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAdmins = () => {
    setLoading(true);
    axiosInstance.get<AdminUser[]>('/api/admins/')
      .then(response => {
        setAdmins(response.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch admins', err);
        setError('Failed to load admins. You may not have permission to view this page.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const openDeleteModal = (admin: AdminUser) => {
    setAdminToDelete(admin);
    setDeleteModalOpened(true);
  };

  const handleDeleteAdmin = async () => {
    if (!adminToDelete) return;

    try {
      await axiosInstance.delete(`/api/admins/${adminToDelete.id}/`);
      notifications.show({
        title: 'Admin Deleted',
        message: `Admin ${adminToDelete.email} has been successfully deleted.`,
        color: 'green',
      });
      setAdmins(admins.filter(admin => admin.id !== adminToDelete.id)); // Optimistic UI update
      setDeleteModalOpened(false);
      setAdminToDelete(null);
    } catch (error) {
      notifications.show({
        title: 'Deletion Failed',
        message: 'There was an error deleting the admin.',
        color: 'red',
      });
    }
  };

  const form = useForm({
    initialValues: {
      email: '',
      first_name: '',
      last_name: '',
      group: '',
    },
    validate: {
      email: (value: string) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      first_name: (value: string) => (value.length > 0 ? null : 'First name is required'),
      last_name: (value: string) => (value.length > 0 ? null : 'Last name is required'),
      group: (value: string) => (value ? null : 'Group is required'),
    },
  });

  const handleAddAdmin = (values: typeof form.values) => {
    axiosInstance.post('/api/admins/', values)
      .then(() => {
        notifications.show({
          title: 'Admin Created',
          message: `${values.email} has been created successfully.`,
          color: 'green',
        });
        form.reset();
        fetchAdmins(); // Refresh the list
      })
      .catch(err => {
        console.error('Failed to create admin', err);
        notifications.show({
          title: 'Error',
          message: 'Failed to create admin. Please check the details and try again.',
          color: 'red',
        });
      });
  };

  const rows = admins.map((admin) => (
    <Table.Tr key={admin.id}>
      <Table.Td>{admin.id}</Table.Td>
      <Table.Td>{admin.email}</Table.Td>
      <Table.Td>{admin.first_name}</Table.Td>
      <Table.Td>{admin.last_name}</Table.Td>
      <Table.Td>{admin.group_name}</Table.Td>
      <Table.Td>
        <Button color="red" size="xs" onClick={() => openDeleteModal(admin)}>
          Delete
        </Button>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <>
      <Modal
        opened={deleteModalOpened}
        onClose={() => setDeleteModalOpened(false)}
        title="Confirm Deletion"
        centered
      >
        <Text>Are you sure you want to delete the admin account for <strong>{adminToDelete?.email}</strong>? This action cannot be undone.</Text>
        <Group mt="xl">
          <Button variant="outline" onClick={() => setDeleteModalOpened(false)} style={{ flex: 1 }}>
            Cancel
          </Button>
          <Button color="red" onClick={handleDeleteAdmin} style={{ flex: 1 }}>
            Delete Admin
          </Button>
        </Group>
      </Modal>

      <Container my="xl">
        <Title order={2} mb="lg">Manage Admins</Title>

        <Paper withBorder shadow="md" p={30} mt={30} radius="md">
          <Title order={3} mb="md">Add New Admin</Title>
          <form onSubmit={form.onSubmit(handleAddAdmin)}>
            <TextInput label="Email" placeholder="admin@example.com" {...form.getInputProps('email')} required />
            <TextInput label="First Name" placeholder="John" {...form.getInputProps('first_name')} required mt="md" />
            <TextInput label="Last Name" placeholder="Doe" {...form.getInputProps('last_name')} required mt="md" />
            <Select
              label="Access Level"
              placeholder="Pick one"
              data={[
                { value: 'Full Access Admin', label: 'Full Access' },
                { value: 'Partial Access Admin', label: 'Partial Access' },
              ]}
              {...form.getInputProps('group')}
              required
              mt="md"
            />
            <Button type="submit" fullWidth mt="xl">
              Create Admin
            </Button>
          </form>
        </Paper>

        <Title order={3} mt="xl" mb="md">Existing Admins</Title>
        {loading && <Loader />}
        {error && <Alert icon={<IconAlertCircle size="1rem" />} title="Error!" color="red">{error}</Alert>}
        {!loading && !error && (
          <Table striped highlightOnHover withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>ID</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>First Name</Table.Th>
                <Table.Th>Last Name</Table.Th>
                <Table.Th>Access Level</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
        )}
      </Container>
    </>
  );
}
