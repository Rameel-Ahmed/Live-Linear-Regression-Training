from typing import Optional, Dict, Any
from fastapi import HTTPException, Form
from database import db
import json

class AuthController:
    """Handle user authentication and session management."""
    
    def __init__(self):
        self.active_sessions = {}  # Simple in-memory session storage
    
    def create_session(self, user_id: int, username: str) -> str:
        """Create a new session and return session ID."""
        import uuid
        session_id = str(uuid.uuid4())
        
        self.active_sessions[session_id] = {
            "user_id": user_id,
            "username": username,
            "created_at": "2024-01-01"  # Simplified timestamp
        }
        
        return session_id
    
    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session data by session ID."""
        return self.active_sessions.get(session_id)
    
    def delete_session(self, session_id: str):
        """Delete a session."""
        if session_id in self.active_sessions:
            del self.active_sessions[session_id]
    
    def signup(self, username: str, password: str, email: Optional[str] = None) -> Dict[str, Any]:
        """Handle user signup."""
        if len(username) < 3:
            raise HTTPException(status_code=400, detail="Username must be at least 3 characters")
        
        if len(password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
        
        # Create user in database
        success = db.create_user(username, password, email)
        
        if not success:
            raise HTTPException(status_code=400, detail="Username already exists")
        
        # Get the created user
        user = db.get_user_by_id(db.authenticate_user(username, password))
        
        return {
            "success": True,
            "message": "User created successfully",
            "user": {
                "id": user["id"],
                "username": user["username"],
                "email": user["email"]
            }
        }
    
    def signin(self, username: str, password: str) -> Dict[str, Any]:
        """Handle user signin."""
        user_id = db.authenticate_user(username, password)
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid username or password")
        
        # Get user details
        user = db.get_user_by_id(user_id)
        
        # Create session
        session_id = self.create_session(user_id, user["username"])
        
        return {
            "success": True,
            "message": "Sign in successful",
            "session_id": session_id,
            "user": {
                "id": user["id"],
                "username": user["username"],
                "email": user["email"]
            }
        }
    
    def signout(self, session_id: str) -> Dict[str, Any]:
        """Handle user signout."""
        if session_id in self.active_sessions:
            self.delete_session(session_id)
            return {"success": True, "message": "Sign out successful"}
        else:
            return {"success": False, "message": "Session not found"}
    
    def get_current_user(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get current user from session."""
        session = self.get_session(session_id)
        if session:
            return db.get_user_by_id(session["user_id"])
        return None
    
    def is_authenticated(self, session_id: str) -> bool:
        """Check if user is authenticated."""
        return session_id in self.active_sessions

# Global auth controller instance
auth_controller = AuthController()
