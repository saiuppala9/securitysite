import axiosInstance from './axiosInstance';

/**
 * Test function to check file upload functionality
 * @param {File} file - The file to upload
 * @param {number} requestId - The service request ID
 * @returns {Promise} - The response from the server
 */
export const testFileUpload = async (file, requestId) => {
  console.log('Testing file upload with:', file, 'to request ID:', requestId);
  
  // Create FormData
  const formData = new FormData();
  formData.append('report_file', file);
  
  // Log FormData contents
  console.log('FormData entries:');
  for (const pair of formData.entries()) {
    console.log(pair[0], pair[1]);
  }
  
  try {
    // Make sure authorization header is set
    const authTokens = localStorage.getItem('authTokens');
    if (authTokens) {
      const tokens = JSON.parse(authTokens);
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${tokens.access}`;
    }
    
    // Make the request
    const response = await axiosInstance.post(
      `/api/service-requests/${requestId}/upload_report/`,
      formData
    );
    
    console.log('Upload successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Upload failed:', error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
};

export default testFileUpload; 