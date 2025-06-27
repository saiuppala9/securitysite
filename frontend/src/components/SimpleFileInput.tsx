import React from 'react';
import { Box, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';

interface SimpleFileInputProps {
  onFileChange: (file: File | null) => void;
  accept?: string;
  maxSize?: number; // in bytes
}

export function SimpleFileInput({ 
  onFileChange, 
  accept = '.pdf,.jpg,.jpeg,.png', 
  maxSize = 10 * 1024 * 1024 
}: SimpleFileInputProps) {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    
    if (file) {
      // Validate file size
      if (file.size > maxSize) {
        notifications.show({
          title: 'File too large',
          message: `File must be smaller than ${maxSize / (1024 * 1024)}MB`,
          color: 'red'
        });
        event.target.value = '';
        return;
      }
      
      notifications.show({
        title: 'File selected',
        message: `Selected ${file.name}`,
        color: 'green'
      });
    }
    
    onFileChange(file);
  };

  return (
    <Box>
      <input
        type="file"
        onChange={handleFileChange}
        accept={accept}
        style={{
          width: '100%',
          padding: '10px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      />
      <Text size="xs" mt={5} color="dimmed" ta="center">
        Accepted formats: {accept.split(',').join(', ')}
      </Text>
    </Box>
  );
} 