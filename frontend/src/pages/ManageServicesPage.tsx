import { useState, useEffect } from 'react';
import { Container, Title, Table, Button, Group, Image, Modal, TextInput, Textarea, NumberInput, FileInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import axiosInstance from '../utils/axiosInstance';
import { notifications } from '@mantine/notifications';

interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string | null;
}

const ManageServicesPage = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [modalOpened, setModalOpened] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const form = useForm({
    initialValues: {
      name: '',
      description: '',
      price: 0,
      image: null as File | null,
    },
    validate: {
      name: (value: string) => (value.length < 2 ? 'Name must have at least 2 letters' : null),
      description: (value: string) => (value.length < 10 ? 'Description must have at least 10 letters' : null),
      price: (value: number) => (value <= 0 ? 'Price must be positive' : null),
    },
  });

  const fetchServices = async () => {
    try {
      const response = await axiosInstance.get<Service[]>('/api/services/');
      setServices(response.data);
    } catch (error) {
      notifications.show({
        title: 'Error fetching services',
        message: 'Could not load the list of services.',
        color: 'red',
      });
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleEdit = (service: Service) => {
    setEditingService(service);
    form.setValues({
      name: service.name,
      description: service.description,
      price: service.price,
      image: null,
    });
    setModalOpened(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await axiosInstance.delete(`/api/services/${id}/`);
      notifications.show({
        title: 'Service Deleted',
        message: 'The service has been successfully deleted.',
        color: 'green',
      });
      fetchServices();
    } catch (error) {
      notifications.show({
        title: 'Error deleting service',
        message: 'Could not delete the service.',
        color: 'red',
      });
    }
  };

  const handleSubmit = async (values: typeof form.values) => {
    const formData = new FormData();
    formData.append('name', values.name);
    formData.append('description', values.description);
    formData.append('price', values.price.toString());
    if (values.image) {
      formData.append('image', values.image);
    }

    try {
      if (editingService) {
        await axiosInstance.patch(`/api/services/${editingService.id}/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await axiosInstance.post('/api/services/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      notifications.show({
        title: editingService ? 'Service Updated' : 'Service Created',
        message: `Service has been successfully ${editingService ? 'updated' : 'created'}.`,
        color: 'green',
      });
      setModalOpened(false);
      setEditingService(null);
      form.reset();
      fetchServices();
    } catch (error) {
      notifications.show({
        title: 'Submission Error',
        message: 'There was an error submitting the form.',
        color: 'red',
      });
    }
  };

  const rows = services.map((service) => (
    <Table.Tr key={service.id}>
      <Table.Td>
        <Image src={service.image || ''} alt={service.name} width={50} height={50} fit="cover" radius="sm" />
      </Table.Td>
      <Table.Td>{service.name}</Table.Td>
      <Table.Td>{service.description.substring(0, 50)}...</Table.Td>
      <Table.Td>{service.price}</Table.Td>
      <Table.Td>
        <Group>
          <Button size="xs" onClick={() => handleEdit(service)}>Edit</Button>
          <Button size="xs" color="red" onClick={() => handleDelete(service.id)}>Delete</Button>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Container my="xl">
      <Group justify="space-between" mb="xl">
        <Title>Manage Services</Title>
        <Button onClick={() => setModalOpened(true)}>Add New Service</Button>
      </Group>

      <Modal
        opened={modalOpened}
        onClose={() => {
          setModalOpened(false);
          setEditingService(null);
          form.reset();
        }}
        title={editingService ? 'Edit Service' : 'Add New Service'}
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput label="Name" {...form.getInputProps('name')} required />
          <Textarea label="Description" {...form.getInputProps('description')} required mt="md" />
          <NumberInput label="Price" {...form.getInputProps('price')} required mt="md" min={0} step={0.01} />
          <FileInput label="Image" {...form.getInputProps('image')} mt="md" accept="image/*" />
          <Button type="submit" mt="xl" fullWidth>
            {editingService ? 'Update Service' : 'Create Service'}
          </Button>
        </form>
      </Modal>

      <Table striped withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Image</Table.Th>
            <Table.Th>Name</Table.Th>
            <Table.Th>Description</Table.Th>
            <Table.Th>Price</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </Container>
  );
};

export default ManageServicesPage;
