// Utility to decode JWT tokens
// Run this in the browser console to check the token contents

function decodeJWT() {
  const tokens = localStorage.getItem('authTokens');
  if (!tokens) {
    console.error('No tokens found in localStorage');
    return null;
  }
  
  try {
    const parsedTokens = JSON.parse(tokens);
    const accessToken = parsedTokens.access;
    
    // Split the token into header, payload, and signature
    const parts = accessToken.split('.');
    if (parts.length !== 3) {
      console.error('Invalid JWT format');
      return null;
    }
    
    // Decode the payload (second part)
    const payload = JSON.parse(atob(parts[1]));
    
    console.log('Token payload:', payload);
    console.log('User ID:', payload.user_id);
    console.log('Is Staff:', payload.is_staff);
    console.log('Email:', payload.email);
    console.log('First Name:', payload.first_name);
    console.log('Last Name:', payload.last_name);
    console.log('Expiration:', new Date(payload.exp * 1000).toLocaleString());
    
    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      console.error('Token is expired!');
    } else {
      console.log('Token is valid. Expires in:', Math.round((payload.exp - now) / 60), 'minutes');
    }
    
    return payload;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

// Usage: decodeJWT() 