// Run this in the browser console to test admin login
async function testAdminLogin() {
  try {
    // Clear any existing tokens
    localStorage.removeItem('authTokens');
    
    console.log('Testing admin login...');
    
    // Get tokens
    const response = await fetch('http://localhost:8000/auth/jwt/create/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@cyphex.in',
        password: 'Sai@1234'
      })
    });
    
    if (!response.ok) {
      throw new Error(`Login failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Login response:', data);
    
    // Store tokens
    localStorage.setItem('authTokens', JSON.stringify({
      access: data.access,
      refresh: data.refresh
    }));
    
    // Get user info
    const userResponse = await fetch('http://localhost:8000/auth/users/me/', {
      headers: {
        'Authorization': `Bearer ${data.access}`
      }
    });
    
    if (!userResponse.ok) {
      throw new Error(`User fetch failed with status: ${userResponse.status}`);
    }
    
    const userData = await userResponse.json();
    console.log('User data:', userData);
    
    // Check if admin
    if (userData.is_staff) {
      console.log('User is admin, redirecting to dashboard...');
      window.location.href = '/admin/dashboard';
    } else {
      console.log('User is not admin');
      localStorage.removeItem('authTokens');
    }
    
  } catch (error) {
    console.error('Login test failed:', error);
    localStorage.removeItem('authTokens');
  }
}

// Usage: testAdminLogin() 