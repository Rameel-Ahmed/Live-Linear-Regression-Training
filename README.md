# Linear Regression Model Training Platform


[![Framework](https://img.shields.io/badge/Framework-FastAPI-green?style=flat-square)](https://fastapi.tiangolo.com/)
[![Backend](https://img.shields.io/badge/Backend-Python-yellow?style=flat-square)](https://www.python.org/)
[![Frontend](https://img.shields.io/badge/Frontend-HTML%2FCSS%2FJS-orange?style=flat-square)](https://developer.mozilla.org/)

A comprehensive web-based platform for training and visualizing univariate linear regression models with real-time parameter optimization and interactive visualizations.

## Features

- **Interactive Data Upload**: Support for CSV file uploads with data validation
- **Real-time Training Visualization**: Live cost function plots and regression line updates
- **Parameter Optimization**: Configurable learning rate, epochs, and convergence settings
- **Model Performance Metrics**: RMSE, R², and other statistical measures
- **Responsive Web Interface**: Modern, mobile-friendly design with dark/light theme support
- **FastAPI Backend**: High-performance Python backend with RESTful API
- **Gradient Descent Implementation**: Custom optimization algorithm with early stopping

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Features in Detail](#features-in-detail)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [License](#license)

## 🛠️ Installation

### Prerequisites

- Python 3.8 or higher
- pip package manager

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Rameel-Ahmed/Live-Linear-Regression-Training.git
   cd Live-Linear-Regression-Training
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application**
   ```bash
   python main.py
   ```

4. **Access the application**
   Open your browser and navigate to `http://127.0.0.1:8000`

## Usage

### 1. Data Upload
- Navigate to the Data Upload page
- Upload your CSV file containing two columns (X and Y variables)
- The system will validate your data and provide quality reports
- Proceed to training setup once data is validated

### 2. Training Configuration
- Set learning rate (recommended: 0.01 - 0.1)
- Configure maximum epochs (recommended: 1000 - 5000)
- Enable/disable early stopping for convergence
- Set tolerance for convergence detection

### 3. Model Training
- Click "Start Training" to begin the optimization process
- Watch real-time updates of:
  - Cost function convergence
  - Regression line fitting
  - Model parameters (θ₀, θ₁)
  - Performance metrics

### 4. Results & Predictions
- View final model performance metrics
- Make predictions on new data points
- Export model parameters and results
- Compare with scikit-learn implementation

## Project Structure

```
linear-regression-final/
├── backend/                    # Core ML algorithms
│   ├── models/
│   │   ├── linear_regression.py    # Main regression model
│   │   ├── gradient_descent.py     # Optimization algorithm
│   │   ├── data_normalizer.py      # Data preprocessing
│   │   └── metrics_calculator.py   # Performance metrics
│   ├── utils/
│   │   ├── csv_loader.py           # Data loading utilities
│   │   └── sklearn_comparison.py   # Benchmarking tools
│   └── api_helpers.py              # API utility functions
├── controller/                 # Business logic layer
│   └── user_controller.py          # Request handling
├── routes/                     # API endpoints
│   └── user_routes.py             # REST API routes
├── static/                     # Frontend assets
│   ├── css/                        # Stylesheets
│   ├── js/                         # JavaScript modules
│   └── *.html                      # Web pages
├── main.py                     # Application entry point
└── requirements.txt            # Python dependencies
```

## 🔌 API Documentation

### Endpoints

- `POST /api/v1/upload` - Upload CSV data
- `POST /api/v1/train` - Train regression model
- `POST /api/v1/predict` - Make predictions

### Request/Response Examples

**Training Request:**
```json
{
  "learning_rate": 0.01,
  "max_epochs": 200,
  "tolerance": 1e-4,
  "early_stopping": Fals
}
```

**Training Response:**
```json
{
  "epoch": 150,
  "cost": 0.0234,
  "theta0": 2.45,
  "theta1": 1.67,
  "rmse": 0.153,
  "r2": 0.892
}
```

## Features in Detail

### Real-time Training Visualization
- **Cost Function Plot**: Shows convergence of the loss function over epochs
- **Regression Line**: Dynamic updates showing model fitting progress
- **Parameter Trajectory**: Visual representation of θ₀ and θ₁ optimization

### Advanced Optimization
- **Gradient Descent**: Custom implementation with momentum
- **Early Stopping**: Automatic convergence detection
- **Learning Rate Scheduling**: Adaptive learning rate adjustments
- **Data Normalization**: Z-score standardization for numerical stability

### Performance Metrics
- **RMSE**: Root Mean Square Error
- **R² Score**: Coefficient of determination
- **MAE**: Mean Absolute Error
- **Model Comparison**: Benchmarking against scikit-learn

## Mathematical Implementation

### Linear Regression Model
The core model implements univariate linear regression with the hypothesis function:

**Hypothesis Function:**
```
h(x) = theta_0 + theta_1 * x
```

Where:
- `theta_0` is the y-intercept (bias term)
- `theta_1` is the slope coefficient
- `x` is the input feature
- `h(x)` is the predicted output

### Cost Function (Mean Squared Error)
The model minimizes the Mean Squared Error (MSE) cost function:

**Cost Function:**
```
J(theta_0, theta_1) = (1/2m) * Σ(h(x^(i)) - y^(i))^2
```

Where:
- `m` is the number of training examples
- `h(x^(i))` is the predicted value for the i-th example
- `y^(i)` is the actual value for the i-th example
- The factor `1/2` is included for mathematical convenience in gradient calculation

### Gradient Descent Algorithm
The optimization uses batch gradient descent to update parameters:

**Parameter Update Rules:**
```
theta_0 := theta_0 - alpha * (1/m) * Σ(h(x^(i)) - y^(i))
theta_1 := theta_1 - alpha * (1/m) * Σ(h(x^(i)) - y^(i)) * x^(i)
```

Where:
- `alpha` is the learning rate
- The partial derivatives are computed simultaneously for all training examples

### Data Normalization
To ensure numerical stability and faster convergence, data is normalized using Z-score standardization:

**Normalization Formula:**
```
x_norm = (x - μ) / σ
```

Where:
- `μ` is the mean of the feature values
- `σ` is the standard deviation of the feature values

**Denormalization for Predictions:**
After training on normalized data, predictions are converted back to original scale:
```
y_pred_original = theta_0_original + theta_1_original * x_original
```

### Convergence Criteria
The training algorithm implements multiple convergence checks:

**Cost-based Convergence:**
```
|J(theta_0, theta_1)^t - J(theta_0, theta_1)^(t-1)| < tolerance
```

**Parameter-based Convergence:**
```
|theta^t - theta^(t-1)| < tolerance
```

**Early Stopping:**
Training stops if no improvement is observed for a specified number of epochs.

### Training Process Flow
1. **Data Preprocessing**: Load CSV, validate data types, handle missing values
2. **Normalization**: Apply Z-score standardization to features and targets
3. **Parameter Initialization**: Set θ₀ = 0, θ₁ = 0
4. **Gradient Computation**: Calculate partial derivatives for current parameters
5. **Parameter Update**: Apply gradient descent update rules
6. **Cost Evaluation**: Compute MSE for current parameters
7. **Convergence Check**: Evaluate stopping criteria
8. **Denormalization**: Convert parameters back to original scale
9. **Metrics Calculation**: Compute RMSE, R², and MAE on test set

### Mathematical Advantages
- **Vectorized Operations**: Efficient NumPy-based matrix operations
- **Numerical Stability**: Z-score normalization prevents overflow/underflow
- **Convergence Guarantee**: Gradient descent converges to local minimum for convex cost function
- **Scalability**: O(m) complexity per epoch, where m is training set size

## Screenshots & Page Descriptions

### 1. Data Upload Interface (`/static/index.html`)
**Purpose**: Main landing page for data ingestion and preprocessing
**Key Features**:
- CSV file upload with drag-and-drop support
- Column selection for X and Y variables
- Data quality validation and cleaning options
- Outlier detection and removal settings
- Data preview and statistics display

**Recommended Screenshots**:
- **Data Upload Form**: Show the clean upload interface with file selection
- **Column Selection**: Display the dropdown menus for X/Y variable selection
- **Data Preview**: Show sample data display with validation indicators
- **Quality Report**: Display data cleaning summary and statistics

### 2. Training Configuration (`/static/training.html`)
**Purpose**: Model parameter configuration and real-time training visualization
**Key Features**:
- Learning rate, epochs, and convergence settings
- Real-time cost function plotting during training
- Live regression line updates on scatter plots
- Training progress indicators and controls
- Parameter trajectory visualization

**Recommended Screenshots**:
- **Parameter Panel**: Show the training configuration controls
- **Cost Function Plot**: Display the live cost convergence graph
- **Regression Visualization**: Show the scatter plot with fitting line
- **Training Controls**: Display start/pause/stop buttons and progress bars

### 3. Results & Predictions (`/static/results.html`)
**Purpose**: Final model evaluation and prediction interface
**Key Features**:
- Complete model performance metrics (RMSE, R², MAE)
- Final regression equation display
- Prediction input for new data points
- Model comparison with scikit-learn
- Export functionality for results

**Recommended Screenshots**:
- **Metrics Dashboard**: Show all performance indicators in organized cards
- **Model Equation**: Display the final y = theta_0 + theta_1 * x equation
- **Prediction Interface**: Show input fields for new predictions
- **Comparison Charts**: Display side-by-side performance comparison

### 4. Navigation & Layout
**Purpose**: Consistent user experience across all pages
**Key Features**:
- Responsive sidebar navigation
- Dark/light theme toggle
- Mobile-friendly responsive design
- Toast notifications for user feedback

**Recommended Screenshots**:
- **Full Application**: Show the complete interface with sidebar
- **Mobile View**: Display responsive design on smaller screens
- **Theme Toggle**: Show dark/light mode switching
- **Navigation Flow**: Demonstrate the step-by-step user journey

### Image Requirements
- **Resolution**: Minimum 1200x800 pixels for desktop views
- **Format**: PNG or JPG with good compression
- **Content**: Include actual data and realistic training scenarios
- **Annotations**: Add helpful callouts for key features
- **Consistency**: Use the same theme (light or dark) across all screenshots

## Configuration

### Environment Variables
```bash
# Optional: Customize server settings
HOST=127.0.0.1
PORT=8000
LOG_LEVEL=INFO
```

### Model Parameters
```python
# Default training parameters
DEFAULT_LEARNING_RATE = 0.01
DEFAULT_MAX_EPOCHS = 200
DEFAULT_TOLERANCE = 1e-4
DEFAULT_EARLY_STOPPING = False
```

## Testing

### Run Tests
```bash
# Install test dependencies
pip install pytest pytest-asyncio

# Run test suite
pytest tests/
```

### Performance Benchmarking
```bash
# Compare with scikit-learn
python -m backend.utils.sklearn_comparison
```

## 🚀 Deployment

### Production Setup
```bash
# Install production dependencies
pip install gunicorn

# Run with Gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
```

### Docker Deployment
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["python", "main.py"]
```




---

**Built for machine learning education and research**
