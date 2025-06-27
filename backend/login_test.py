import requests
import json

# The URL for the login endpoint
url = 'http://localhost:8000/auth/jwt/create/'

# The credentials to test with
credentials = {
    'email': 'saiuppala42@gmail.com',
    'password': 'Sai@1234'
}

print(f"Attempting to log in with email: {credentials['email']}")

try:
    # Send the POST request to the login endpoint
    response = requests.post(url, json=credentials)

    # Print the HTTP status code
    print(f"Status Code: {response.status_code}")

    # Try to print the JSON response from the server
    try:
        print("Response JSON:")
        print(json.dumps(response.json(), indent=2))
    except json.JSONDecodeError:
        print("Response Content (not JSON):")
        print(response.text)

except requests.exceptions.RequestException as e:
    print(f"An error occurred: {e}")
