/**
 * Creates a test file for debugging file uploads
 * @param {string} filename - The name of the file to create
 * @param {string} type - The MIME type of the file (e.g., 'application/pdf')
 * @param {number} size - The approximate size of the file in bytes
 * @returns {File} - A File object
 */
export const createTestFile = (filename = 'test.pdf', type = 'application/pdf', size = 1024) => {
  // Create some content for the file
  const content = new Array(size).fill('A').join('');
  
  // Create a Blob with the content
  const blob = new Blob([content], { type });
  
  // Create a File from the Blob
  const file = new File([blob], filename, { type });
  
  console.log('Created test file:', {
    name: file.name,
    size: file.size,
    type: file.type
  });
  
  return file;
};

export default createTestFile; 