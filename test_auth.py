#!/usr/bin/env python3
"""
Test script for the authentication system.
Run this to verify that user signup, signin, and model saving works.
"""

import requests
import json

# Base URL for the API
BASE_URL = "http://localhost:8000/api/v1/auth"

def test_signup():
    """Test user signup."""
    print("🧪 Testing user signup...")
    
    data = {
        'username': 'testuser',
        'password': 'testpass123',
        'email': 'test@example.com'
    }
    
    response = requests.post(f"{BASE_URL}/signup", data=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    
    if response.status_code == 201:
        print("✅ Signup successful!")
        return True
    else:
        print("❌ Signup failed!")
        return False

def test_signin():
    """Test user signin."""
    print("\n🧪 Testing user signin...")
    
    data = {
        'username': 'testuser',
        'password': 'testpass123'
    }
    
    response = requests.post(f"{BASE_URL}/signin", data=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    
    if response.status_code == 200:
        print("✅ Signin successful!")
        # Extract session cookie
        cookies = response.cookies
        session_id = cookies.get('session_id')
        if session_id:
            print(f"Session ID: {session_id}")
            return session_id
    else:
        print("❌ Signin failed!")
        return None

def test_save_model(session_id):
    """Test model saving."""
    print("\n🧪 Testing model saving...")
    
    data = {
        'model_name': 'Test Model',
        'theta_0': 1.5,
        'theta_1': 2.3,
        'rmse': 0.123,
        'mae': 0.098,
        'r2_score': 0.892,
        'sklearn_rmse': 0.120,
        'sklearn_mae': 0.095,
        'sklearn_r2': 0.895,
        'equation': 'y = 2.3x + 1.5'
    }
    
    cookies = {'session_id': session_id}
    response = requests.post(f"{BASE_URL}/save-model", data=data, cookies=cookies)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    
    if response.status_code == 200:
        print("✅ Model saved successfully!")
        return True
    else:
        print("❌ Model saving failed!")
        return False

def test_get_models(session_id):
    """Test getting user models."""
    print("\n🧪 Testing get user models...")
    
    cookies = {'session_id': session_id}
    response = requests.get(f"{BASE_URL}/models", cookies=cookies)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    
    if response.status_code == 200:
        print("✅ Models retrieved successfully!")
        return True
    else:
        print("❌ Failed to retrieve models!")
        return False

def test_signout(session_id):
    """Test user signout."""
    print("\n🧪 Testing user signout...")
    
    cookies = {'session_id': session_id}
    response = requests.post(f"{BASE_URL}/signout", cookies=cookies)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    
    if response.status_code == 200:
        print("✅ Signout successful!")
        return True
    else:
        print("❌ Signout failed!")
        return False

def main():
    """Run all tests."""
    print("🚀 Starting Authentication System Tests\n")
    
    # Test signup
    if not test_signup():
        print("❌ Cannot continue without successful signup")
        return
    
    # Test signin
    session_id = test_signin()
    if not session_id:
        print("❌ Cannot continue without successful signin")
        return
    
    # Test model saving
    if not test_save_model(session_id):
        print("❌ Model saving test failed")
        return
    
    # Test getting models
    if not test_get_models(session_id):
        print("❌ Getting models test failed")
        return
    
    # Test signout
    if not test_signout(session_id):
        print("❌ Signout test failed")
        return
    
    print("\n🎉 All tests passed! Authentication system is working correctly.")

if __name__ == "__main__":
    main()
