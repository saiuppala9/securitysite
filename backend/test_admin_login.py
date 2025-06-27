import requests
import json

# Test admin login
def test_admin_login():
    print("Testing admin login...")
    
    # Login credentials
    credentials = {
        "email": "admin@cyphex.in",
        "password": "Sai@1234"
    }
    
    # Get JWT token
    response = requests.post(
        "http://localhost:8000/auth/jwt/create/", 
        json=credentials
    )
    
    print(f"Status code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        token_data = response.json()
        access_token = token_data.get("access")
        
        # Test user info endpoint
        user_response = requests.get(
            "http://localhost:8000/auth/users/me/",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        print("\nUser info:")
        print(f"Status code: {user_response.status_code}")
        print(f"Response: {user_response.text}")
    
if __name__ == "__main__":
    test_admin_login() 