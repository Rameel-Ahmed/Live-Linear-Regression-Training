import sqlite3
import hashlib
import os
from datetime import datetime
from typing import Optional, List, Dict, Any

class Database:
    def __init__(self, db_path: str = "linear_regression.db"):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Initialize database tables if they don't exist."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Users table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                email TEXT UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Models table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS models (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                model_name TEXT NOT NULL,
                theta_0 REAL NOT NULL,
                theta_1 REAL NOT NULL,
                rmse REAL NOT NULL,
                mae REAL NOT NULL,
                r2_score REAL NOT NULL,
                sklearn_rmse REAL,
                sklearn_mae REAL,
                sklearn_r2 REAL,
                equation TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id),
                UNIQUE(user_id, model_name)
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def hash_password(self, password: str) -> str:
        """Hash password using SHA-256."""
        return hashlib.sha256(password.encode()).hexdigest()
    
    def verify_password(self, password: str, password_hash: str) -> bool:
        """Verify password against hash."""
        return self.hash_password(password) == password_hash
    
    def create_user(self, username: str, password: str, email: Optional[str] = None) -> bool:
        """Create a new user. Returns True if successful, False if username exists."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            password_hash = self.hash_password(password)
            
            cursor.execute(
                "INSERT INTO users (username, password_hash, email) VALUES (?, ?, ?)",
                (username, password_hash, email)
            )
            
            conn.commit()
            conn.close()
            return True
        except sqlite3.IntegrityError:
            # Username already exists
            return False
    
    def authenticate_user(self, username: str, password: str) -> Optional[int]:
        """Authenticate user and return user_id if successful."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute(
            "SELECT id, password_hash FROM users WHERE username = ?",
            (username,)
        )
        
        result = cursor.fetchone()
        conn.close()
        
        if result and self.verify_password(password, result[1]):
            return result[0]
        return None
    
    def get_user_by_id(self, user_id: int) -> Optional[Dict[str, Any]]:
        """Get user information by ID."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute(
            "SELECT id, username, email, created_at FROM users WHERE id = ?",
            (user_id,)
        )
        
        result = cursor.fetchone()
        conn.close()
        
        if result:
            return {
                "id": result[0],
                "username": result[1],
                "email": result[2],
                "created_at": result[3]
            }
        return None
    
    def save_model(self, user_id: int, model_name: str, model_data: Dict[str, Any]) -> bool:
        """Save a model for a user. Returns True if successful."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Generate equation from theta values
            equation = f"y = {model_data.get('theta_1', 0.0):.4f}x + {model_data.get('theta_0', 0.0):.4f}"
            
            cursor.execute('''
                INSERT OR REPLACE INTO models 
                (user_id, model_name, theta_0, theta_1, rmse, mae, r2_score, 
                 sklearn_rmse, sklearn_mae, sklearn_r2, equation)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                user_id, model_name,
                model_data.get('theta_0', 0.0),
                model_data.get('theta_1', 0.0),
                model_data.get('rmse', 0.0),
                model_data.get('mae', 0.0),
                model_data.get('r2_score', 0.0),
                model_data.get('sklearn_rmse'),
                model_data.get('sklearn_mae'),
                model_data.get('sklearn_r2'),
                equation
            ))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error saving model: {e}")
            return False
    
    def get_user_models(self, user_id: int) -> List[Dict[str, Any]]:
        """Get all models for a user."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, model_name, theta_0, theta_1, rmse, mae, r2_score,
                   sklearn_rmse, sklearn_mae, sklearn_r2, equation, created_at
            FROM models 
            WHERE user_id = ? 
            ORDER BY created_at DESC
        ''', (user_id,))
        
        results = cursor.fetchall()
        conn.close()
        
        models = []
        for result in results:
            models.append({
                "id": result[0],
                "model_name": result[1],
                "theta_0": result[2],
                "theta_1": result[3],
                "rmse": result[4],
                "mae": result[5],
                "r2_score": result[6],
                "sklearn_rmse": result[7],
                "sklearn_mae": result[8],
                "sklearn_r2": result[9],
                "equation": result[10],
                "created_at": result[11]
            })
        
        return models
    
    def get_model_by_id(self, model_id: int, user_id: int) -> Optional[Dict[str, Any]]:
        """Get a specific model by ID (ensuring user owns it)."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, model_name, theta_0, theta_1, rmse, mae, r2_score,
                   sklearn_rmse, sklearn_mae, sklearn_r2, equation, created_at
            FROM models 
            WHERE id = ? AND user_id = ?
        ''', (model_id, user_id))
        
        result = cursor.fetchone()
        conn.close()
        
        if result:
            return {
                "id": result[0],
                "model_name": result[1],
                "theta_0": result[2],
                "theta_1": result[3],
                "rmse": result[4],
                "mae": result[5],
                "r2_score": result[6],
                "sklearn_rmse": result[7],
                "sklearn_mae": result[8],
                "sklearn_r2": result[9],
                "equation": result[10],
                "created_at": result[11]
            }
        return None
    
    def delete_model(self, model_id: int, user_id: int) -> bool:
        """Delete a model (ensuring user owns it)."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute(
                "DELETE FROM models WHERE id = ? AND user_id = ?",
                (model_id, user_id)
            )
            
            deleted = cursor.rowcount > 0
            conn.commit()
            conn.close()
            return deleted
        except Exception as e:
            print(f"Error deleting model: {e}")
            return False

# Global database instance
db = Database()
