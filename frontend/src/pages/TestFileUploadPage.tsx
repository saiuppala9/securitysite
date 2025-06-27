import React, { useState } from 'react';
import { Box, Button, Container, Group, Paper, Text, TextInput, Title } from '@mantine/core';
import { SimpleFileInput } from '../components/SimpleFileInput';
import { testFileUpload } from '../utils/testFileUpload';
import { createTestFile } from '../utils/createTestFile';
import { notifications } from '@mantine/notifications';

export function TestFileUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [requestId, setRequestId] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);

  const handleUpload = async () => {
    if (!file) {
      notifications.show({
        title: 'No file selected',
        message: 'Please select a file to upload.',
        color: 'orange',
      });
      return;
    }

    if (!requestId || isNaN(parseInt(requestId))) {
      notifications.show({
        title: 'Invalid request ID',
        message: 'Please enter a valid request ID.',
        color: 'orange',
      });
      return;
    }

    setUploading(true);
    try {
      await testFileUpload(file, parseInt(requestId));
      
      notifications.show({
        title: 'Upload Successful',
        message: 'The file was uploaded successfully.',
        color: 'green',
      });
    } catch (error: any) {
      notifications.show({
        title: 'Upload Failed',
        message: error.response?.data?.error || 'An error occurred during upload.',
        color: 'red',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleCreateTestFile = () => {
    const testFile = createTestFile();
    setFile(testFile);
    
    notifications.show({
      title: 'Test File Created',
      message: `Created test file: ${testFile.name} (${testFile.size} bytes)`,
      color: 'blue',
    });
  };

  return (
    <Container size="md" py="xl">
      <Title order={2} mb="xl">File Upload Test Page</Title>
      
      <Paper p="md" withBorder mb="xl">
        <Text mb="md">This page is for testing the file upload functionality.</Text>
        
        <TextInput
          label="Service Request ID"
          placeholder="Enter a request ID"
          value={requestId}
          onChange={(e) => setRequestId(e.target.value)}
          mb="md"
        />
        
        <Box mb="md">
          <Text size="sm" fw={500} mb="xs">Select File</Text>
          <SimpleFileInput 
            onFileChange={setFile}
            maxSize={10 * 1024 * 1024}
            accept=".pdf,.jpg,.jpeg,.png"
          />
        </Box>
        
        <Group justify="apart" mt="xl">
          <Button 
            onClick={handleCreateTestFile}
            variant="outline"
          >
            Create Test File
          </Button>
          
          <Button 
            onClick={handleUpload}
            loading={uploading}
            disabled={!file || !requestId}
          >
            Upload File
          </Button>
        </Group>
      </Paper>
      
      <Paper p="md" withBorder>
        <Title order={4} mb="md">Debug Information</Title>
        
        <Text>
          <strong>File:</strong> {file ? `${file.name} (${file.size} bytes, ${file.type})` : 'None selected'}
        </Text>
        
        <Text>
          <strong>Request ID:</strong> {requestId || 'Not set'}
        </Text>
      </Paper>
    </Container>
  );
} 