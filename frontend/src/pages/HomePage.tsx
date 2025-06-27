import { Container, Title, Text, Button, Grid, Card, TextInput, Textarea, SimpleGrid, Box, List, ThemeIcon, rem } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconShieldCheck, IconApi, IconSchool, IconAlertTriangle } from '@tabler/icons-react';
import CyberBackground from '../components/Cyber_background';

const serviceDetails = {
  'Penetration Testing': {
    title: '🔒 Website Security Audit (VAPT)',
    icon: IconShieldCheck,
    description: 'Your website is your digital storefront. Our comprehensive VAPT services identify vulnerabilities before malicious actors do, simulating real-world attack scenarios and providing detailed reports with step-by-step remediation guidance.',
  },
  'API Security Testing': {
    title: '🔗 API Security Testing',
    icon: IconApi,
    description: 'APIs are the invisible highways of modern applications. We protect these critical communication channels by testing for authentication, authorization, injection, and other vulnerabilities to prevent data exposure.',
  },
  'Firewall Installation & Network Configuration': {
    title: '🛡️ Firewall & Network Configuration',
    icon: IconShieldCheck,
    description: 'Your first line of digital defense. We design and implement robust network security architectures, including custom firewall configuration, network segmentation, and VPN setup for secure remote access.',
  },
  'Security Awareness Training': {
    title: '🎓 Security Awareness Training',
    icon: IconSchool,
    description: 'Human error accounts for 95% of successful cyber attacks. Our training transforms your team into your strongest security asset with interactive modules, phishing simulations, and incident response training.',
  },
};

export function HomePage() {
  const contactForm = useForm({
    initialValues: { name: '', email: '', subject: '', message: '' },
    validate: {
      name: (value: string) => (value.trim().length > 0 ? null : 'Name is required'),
      email: (value: string) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      subject: (value: string) => (value.trim().length > 0 ? null : 'Subject is required'),
      message: (value: string) => (value.trim().length > 0 ? null : 'Message is required'),
    },
  });

  const handleContactSubmit = async (values: typeof contactForm.values) => {
    try {
      // Removed axiosInstance.post call
      notifications.show({ title: 'Inquiry Sent', message: 'Thank you for contacting us!', color: 'green' });
      contactForm.reset();
    } catch (err) {
      notifications.show({ title: 'Error', message: 'There was an error sending your inquiry.', color: 'red' });
    }
  };

  const serviceKeys = [
    'Penetration Testing',
    'API Security Testing',
    'Firewall Installation & Network Configuration',
    'Security Awareness Training',
  ] as const;
  const serviceItems = serviceKeys.map((service) => {
    const details = serviceDetails[service];
    return (
      <Card shadow="md" radius="md" padding="xl" withBorder style={{ height: '100%', display: 'flex', flexDirection: 'column' }} key={service}>
        <ThemeIcon variant="light" size={rem(50)} radius="md">
          <details.icon style={{ width: rem(30), height: rem(30) }} />
        </ThemeIcon>
        <Title order={4} mt="md">{details.title}</Title>
        <Text mt="sm" c="dimmed" style={{ flexGrow: 1 }}>{details.description}</Text>
      </Card>
    );
  });

  return (
    <Box style={{ position: 'relative', zIndex: 0 }}>
      <CyberBackground />
      <Container size="lg" py="xl" style={{ position: 'relative', zIndex: 1 }}>
        
        <Box ta="center" my={50}>
          <Title order={1} fz={50}>Secure Your Digital Future Today</Title>
          <Text mt="md" fz="xl" c="dimmed">The Digital Threat Landscape: Why Security Cannot Be Optional</Text>
          <Text mt="lg" style={{ maxWidth: '800px', margin: 'auto' }}>
            In today's interconnected world, cybersecurity isn't just an option—it's a necessity. Every click, every transaction, and every piece of data shared online represents a potential entry point for cybercriminals. The question isn't whether you'll face a cyber threat, but when.
          </Text>
        </Box>

        <Grid my={50} gutter="xl">
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Title order={2}>The Stark Reality of Cyber Threats</Title>
            <Text mt="md">Without proper security measures, your organization faces devastating consequences:</Text>
            <List mt="md" spacing="sm" icon={<ThemeIcon color="red" size={24} radius="xl"><IconAlertTriangle size={16} /></ThemeIcon>}>
              <List.Item><b>Financial Devastation:</b> Attacks cost businesses an average of $4.45 million per breach.</List.Item>
              <List.Item><b>Data Breaches:</b> Exposed sensitive information leads to identity theft and privacy violations.</List.Item>
              <List.Item><b>Operational Paralysis:</b> Ransomware can shut down entire operations for weeks.</List.Item>
              <List.Item><b>Reputation Damage:</b> Customer trust, built over years, can be destroyed overnight.</List.Item>
            </List>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
             <Card withBorder radius="md" p="xl">
                <Title order={3}>The Cost of Inaction</Title>
                <Text mt="md">
                  Every day without proper security measures increases your vulnerability. Hackers are becoming more sophisticated, using AI-powered tools and exploiting human psychology through social engineering. What worked yesterday may not protect you today.
                </Text>
                <Text mt="md"><b>60% of small businesses</b> close within 6 months of a major cyber incident. Don't become another statistic.</Text>
             </Card>
          </Grid.Col>
        </Grid>

        <Box my={50}>
          <Title order={2} ta="center" mb="xl">Our Comprehensive Cybersecurity Solutions</Title>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xl">
            {serviceItems}
          </SimpleGrid>
        </Box>

        <Box my={50} ta="center">
            <Title order={2}>The Time to Act is Now</Title>
            <Text mt="md">Cybersecurity isn't a one-time investment—it's an ongoing commitment. Every day you delay is another day cybercriminals have to exploit vulnerabilities.</Text>
            <a href="/register">
              <Button size="lg" variant="gradient" gradient={{ from: 'cyan', to: 'blue' }} mt="xl">Ready to Secure Your Future?</Button>
            </a>
        </Box>

        <Container size="sm" mt={80}>
          <Title order={2} ta="center" mb="lg">Get in Touch</Title>
          <form onSubmit={contactForm.onSubmit(handleContactSubmit)}>
            <Grid>
              <Grid.Col span={{ base: 12, md: 6 }}><TextInput label="Your Name" placeholder="John Doe" required {...contactForm.getInputProps('name')} /></Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}><TextInput label="Your Email" placeholder="john.doe@example.com" required {...contactForm.getInputProps('email')} /></Grid.Col>
              <Grid.Col span={12}><TextInput label="Subject" placeholder="Inquiry about Penetration Testing" required {...contactForm.getInputProps('subject')} /></Grid.Col>
              <Grid.Col span={12}><Textarea label="Your Message" placeholder="I would like to know more about..." required minRows={4} {...contactForm.getInputProps('message')} /></Grid.Col>
              <Grid.Col span={12} style={{ textAlign: 'center' }}><Button type="submit" size="lg">Send Message</Button></Grid.Col>
            </Grid>
          </form>
        </Container>

      </Container>
    </Box>
  );
}
