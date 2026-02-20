from fastapi import APIRouter, Form, HTTPException, Cookie
from fastapi.responses import JSONResponse
from auth_controller import auth_controller
from database import db
from typing import Optional

auth_router = APIRouter()

@auth_router.post("/signup")
async def signup(
    username: str = Form(...),
    password: str = Form(...),
    email: Optional[str] = Form(None)
):
    """User signup endpoint."""
    try:
        result = auth_controller.signup(username, password, email)
        return JSONResponse(content=result, status_code=201)
    except HTTPException as e:
        return JSONResponse(content={"success": False, "detail": e.detail}, status_code=e.status_code)

@auth_router.post("/signin")
async def signin(
    username: str = Form(...),
    password: str = Form(...)
):
    """User signin endpoint."""
    try:
        result = auth_controller.signin(username, password)
        response = JSONResponse(content=result, status_code=200)
        # Set session cookie
        response.set_cookie(key="session_id", value=result["session_id"], httponly=True, max_age=3600*24*7)  # 7 days
        return response
    except HTTPException as e:
        return JSONResponse(content={"success": False, "detail": e.detail}, status_code=e.status_code)

@auth_router.post("/signout")
async def signout(session_id: Optional[str] = Cookie(None)):
    """User signout endpoint."""
    if not session_id:
        return JSONResponse(content={"success": False, "detail": "No active session"}, status_code=400)
    
    result = auth_controller.signout(session_id)
    response = JSONResponse(content=result, status_code=200)
    # Clear session cookie
    response.delete_cookie(key="session_id")
    return response

@auth_router.get("/me")
async def get_current_user(session_id: Optional[str] = Cookie(None)):
    """Get current user information."""
    if not session_id:
        return JSONResponse(content={"authenticated": False}, status_code=200)
    
    user = auth_controller.get_current_user(session_id)
    if user:
        return JSONResponse(content={
            "authenticated": True,
            "user": {
                "id": user["id"],
                "username": user["username"],
                "email": user["email"]
            }
        }, status_code=200)
    else:
        return JSONResponse(content={"authenticated": False}, status_code=200)

@auth_router.post("/save-model")
async def save_model(
    model_name: str = Form(...),
    theta_0: float = Form(...),
    theta_1: float = Form(...),
    rmse: float = Form(...),
    mae: float = Form(...),
    r2_score: float = Form(...),
    sklearn_rmse: Optional[float] = Form(None),
    sklearn_mae: Optional[float] = Form(None),
    sklearn_r2: Optional[float] = Form(None),
    session_id: Optional[str] = Cookie(None)
):
    """Save a trained model for the current user."""
    if not session_id:
        return JSONResponse(content={"success": False, "detail": "Authentication required"}, status_code=401)
    
    user = auth_controller.get_current_user(session_id)
    if not user:
        return JSONResponse(content={"success": False, "detail": "Invalid session"}, status_code=401)
    
    model_data = {
        "theta_0": theta_0,
        "theta_1": theta_1,
        "rmse": rmse,
        "mae": mae,
        "r2_score": r2_score,
        "sklearn_rmse": sklearn_rmse,
        "sklearn_mae": sklearn_mae,
        "sklearn_r2": sklearn_r2
    }
    
    success = db.save_model(user["id"], model_name, model_data)
    
    if success:
        return JSONResponse(content={"success": True, "message": "Model saved successfully"}, status_code=200)
    else:
        return JSONResponse(content={"success": False, "detail": "Failed to save model"}, status_code=500)

@auth_router.get("/models")
async def get_user_models(session_id: Optional[str] = Cookie(None)):
    """Get all models for the current user."""
    if not session_id:
        return JSONResponse(content={"success": False, "detail": "Authentication required"}, status_code=401)
    
    user = auth_controller.get_current_user(session_id)
    if not user:
        return JSONResponse(content={"success": False, "detail": "Invalid session"}, status_code=401)
    
    models = db.get_user_models(user["id"])
    return JSONResponse(content={"success": True, "models": models}, status_code=200)

@auth_router.get("/models/{model_id}")
async def get_model(model_id: int, session_id: Optional[str] = Cookie(None)):
    """Get a specific model by ID."""
    if not session_id:
        return JSONResponse(content={"success": False, "detail": "Authentication required"}, status_code=401)
    
    user = auth_controller.get_current_user(session_id)
    if not user:
        return JSONResponse(content={"success": False, "detail": "Invalid session"}, status_code=401)
    
    model = db.get_model_by_id(model_id, user["id"])
    if not model:
        return JSONResponse(content={"success": False, "detail": "Model not found"}, status_code=404)
    
    return JSONResponse(content={"success": True, "model": model}, status_code=200)

@auth_router.delete("/models/{model_id}")
async def delete_model(model_id: int, session_id: Optional[str] = Cookie(None)):
    """Delete a model by ID."""
    if not session_id:
        return JSONResponse(content={"success": False, "detail": "Authentication required"}, status_code=401)
    
    user = auth_controller.get_current_user(session_id)
    if not user:
        return JSONResponse(content={"success": False, "detail": "Authentication required"}, status_code=401)
    
    success = db.delete_model(model_id, user["id"])
    if success:
        return JSONResponse(content={"success": True, "message": "Model deleted successfully"}, status_code=200)
    else:
        return JSONResponse(content={"success": False, "detail": "Model not found or deletion failed"}, status_code=404)
