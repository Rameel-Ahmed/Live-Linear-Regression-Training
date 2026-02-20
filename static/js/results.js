import { setupSidebarToggle } from "./helping_functions.js";
import { loadState } from "./state.js";

// Global variables
let trainingResults = null;
let modelData = null;
let batchPredictions = [];

// Initialize when DOM loads
document.addEventListener("DOMContentLoaded", function () {
  setupSidebarToggle();
  initializeTheme();

  // Ensure modelData is available for predictions from session data
  const comprehensiveResults = localStorage.getItem("comprehensiveResults");
  const allTrainingData = localStorage.getItem("allTrainingData");
  const selectedModelId = localStorage.getItem("selectedModelId");
  
  // If we have a selected model ID, prioritize that data
  if (selectedModelId && allTrainingData) {
    try {
      const trainingData = JSON.parse(allTrainingData);
      
      modelData = {
        theta0: trainingData.final_theta0 || 0,
        theta1: trainingData.final_theta1 || 0,
        equation: trainingData.equation || "y = 0x + 0",
      };
      console.log("🔄 modelData set from saved model:", modelData);
      
      showSuccessToast(
        "Model Loaded Successfully!",
        "Your saved model is ready for predictions"
      );
    } catch (e) {
      console.error("Error parsing saved model data:", e);
    }
  } else if (allTrainingData && !selectedModelId) {
    // Regular training data (no saved model)
    try {
      const trainingData = JSON.parse(allTrainingData);
      
      modelData = {
        theta0: trainingData.final_theta0 || 0,
        theta1: trainingData.final_theta1 || 0,
        equation: trainingData.equation || "y = 0x + 0",
      };
      console.log("🔄 modelData set from training data:", modelData);
      
      showSuccessToast(
        "Training Completed Successfully!",
        "Your linear regression model is ready for predictions"
      );
    } catch (e) {
      console.error("Error parsing training data:", e);
    }
  } else if (comprehensiveResults) {
    try {
      const compData = JSON.parse(comprehensiveResults);
      const trainingData = JSON.parse(compData.allTrainingData || "{}");

      modelData = {
        theta0: trainingData.final_theta0 || 0,
        theta1: trainingData.final_theta1 || 0,
        equation: trainingData.equation || "y = 0x + 0",
      };
      console.log("🔄 modelData set from session data:", modelData);

      // Show success toast instead of banner
      showSuccessToast(
        "Training Completed Successfully!",
        "Your linear regression model is ready for predictions"
      );
    } catch (e) {
      console.error("Error parsing session data:", e);
    }
  }

  loadTrainingResults();
  setupEventListeners();
  displayModelSummary();
});

function initializeTheme() {
  const themeBtn = document.getElementById("themeBtn");
  const savedTheme = localStorage.getItem("theme") || "light";

  document.documentElement.setAttribute("data-theme", savedTheme);
  if (themeBtn) {
    themeBtn.textContent = savedTheme === "light" ? "🌙" : "☀️";
    themeBtn.onclick = function () {
      const current =
        document.documentElement.getAttribute("data-theme") || "light";
      const newTheme = current === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", newTheme);
      localStorage.setItem("theme", newTheme);
      this.textContent = newTheme === "light" ? "🌙" : "☀️";
    };
  }
}

async function loadTrainingResults() {
  try {
    // Check if we're loading from a saved model
    const selectedModelId = localStorage.getItem("selectedModelId");
    
    if (selectedModelId) {
      // Loading from saved model - use allTrainingData
      const allTrainingData = localStorage.getItem("allTrainingData");
      
      if (!allTrainingData) {
        alert('No model data found. Please try selecting the model again.');
        window.location.href = "/static/saved-models.html";
        return;
      }
      
      // Clear old training data to ensure fresh loading
      localStorage.removeItem("comprehensiveResults");
      
      // Parse the training data
      const trainingData = JSON.parse(allTrainingData);
      console.log("📊 Loading from saved model:", trainingData);
      
      // Store the data in the expected format
      trainingResults = trainingData;
      window.sklearnResults = trainingData.sklearn_comparison;
      
      // Display results
      displayModelSummary();
      
      // Display sklearn comparison if available
      if (trainingData.sklearn_comparison && trainingData.sklearn_comparison.sklearn_results) {
        displaySklearnComparison(trainingData.sklearn_comparison);
      }
      
      // Also update the sklearn comparison table if it exists
      if (trainingData.sklearn_comparison?.sklearn_results) {
        const sklearnResults = trainingData.sklearn_comparison.sklearn_results;
        
        // Update sklearn metrics in the comparison table
        const sklearnRmseElement = document.getElementById('sklearnRmse');
        if (sklearnRmseElement && sklearnResults.rmse !== null) {
          sklearnRmseElement.textContent = sklearnResults.rmse.toFixed(6);
        }
        
        const sklearnMaeElement = document.getElementById('sklearnMae');
        if (sklearnMaeElement && sklearnResults.mae !== null) {
          sklearnMaeElement.textContent = sklearnResults.mae.toFixed(6);
        }
        
        const sklearnR2Element = document.getElementById('sklearnR2');
        if (sklearnR2Element && sklearnResults.r2_score !== null) {
          sklearnR2Element.textContent = sklearnResults.r2_score.toFixed(4);
        }
      }
      
      // Clear the selected model ID to avoid confusion
      localStorage.removeItem("selectedModelId");
      
      return;
    }
    
    // Load comprehensive results from localStorage (normal training flow)
    const comprehensiveResults = localStorage.getItem("comprehensiveResults");

    if (!comprehensiveResults) {
      alert(
        'No comprehensive results found. Please complete training and click "View Results Summary" first.'
      );
      window.location.href = "training.html";
      return;
    }

    // Parse comprehensive data
    const comprehensiveData = JSON.parse(comprehensiveResults);
    console.log("📊 Comprehensive results loaded:", comprehensiveData);

    // Store all data
    trainingResults = comprehensiveData.trainingData;
    window.sklearnResults = comprehensiveData.sklearnResults;

    // Display all results
    displayModelSummary();

    // Display sklearn comparison if available
    if (
      comprehensiveData.sklearnResults &&
      comprehensiveData.sklearnResults.sklearn_results
    ) {
      displaySklearnComparison(comprehensiveData.sklearnResults);
    } else if (comprehensiveData.sklearnResults === null) {
      displaySklearnError(
        "Sklearn comparison was not available during training"
      );
    } else {
      // Try to get sklearn comparison from the training data
      const trainingData = JSON.parse(comprehensiveData.allTrainingData);
      if (trainingData.sklearn_comparison) {
        console.log(
          "🔍 Found sklearn comparison in training data:",
          trainingData.sklearn_comparison
        );
        displaySklearnComparison(trainingData.sklearn_comparison);
      } else {
        displaySklearnError("Sklearn comparison not found in training data");
      }
    }

    console.log("✅ All results displayed successfully");

    // Debug: Show what's actually in localStorage
    console.log("🔍 Debug: localStorage contents:");
    console.log(
      "- comprehensiveResults:",
      localStorage.getItem("comprehensiveResults")
    );
    console.log("- allTrainingData:", localStorage.getItem("allTrainingData"));
    console.log("- trainingParams:", localStorage.getItem("trainingParams"));
  } catch (error) {
    console.error("❌ Error loading comprehensive results:", error);
    alert("Error loading results. Please try again.");
    window.location.href = "training.html";
  }
}

function displaySklearnError(errorMessage) {
  try {
    console.log("⚠️ Displaying sklearn error:", errorMessage);

    // Create error section
    const errorSection = document.createElement("div");
    errorSection.className = "card error-card";
    errorSection.innerHTML = `
            <h3>⚠️ Sklearn Comparison Unavailable</h3>
            <div class="error-message">
                <p><strong>Error:</strong> ${errorMessage}</p>
                <p>This usually happens when:</p>
                <ul>
                    <li>Training was not completed properly</li>
                    <li>Backend session data was cleared</li>
                    <li>There was a server error</li>
                </ul>
                <p>You can still view your training results below.</p>
            </div>
        `;

    // Find where to insert the error section
    const resultsLeft = document.querySelector(".results-left");
    if (resultsLeft) {
      // Insert after the model summary card
      const modelSummaryCard = resultsLeft.querySelector(".model-summary-card");
      if (modelSummaryCard && modelSummaryCard.nextSibling) {
        resultsLeft.insertBefore(errorSection, modelSummaryCard.nextSibling);
      } else {
        resultsLeft.appendChild(errorSection);
      }
    }
  } catch (error) {
    console.error("❌ Error displaying sklearn error:", error);
  }
}

function displaySklearnComparison(sklearnResults) {
  try {
    console.log("📊 Displaying sklearn comparison:", sklearnResults);

    // Extract sklearn model data from the new structure
    const sklearnModel = sklearnResults.sklearn_results;
    console.log("─".repeat(60));
    console.log(sklearnModel);
    const comparisonAnalysis = sklearnResults.comparison_analysis;

    if (sklearnModel) {
      // Add sklearn equation to the model summary
      const sklearnEquation = document.createElement("div");
      sklearnEquation.className = "sklearn-equation";
      sklearnEquation.innerHTML = `
    <h4>🤖 Sklearn Model</h4>
    <div class="equation-display">${sklearnModel.equation}</div>
    <div class="sklearn-metrics">
        <div class="metric-item">
            <div class="metric-value">${
              sklearnModel.metrics?.r2?.toFixed(4) || "N/A"
            }</div>
            <div class="metric-label">Sklearn R²</div>
        </div>
        <div class="metric-item">
            <div class="metric-value">${
              sklearnModel.metrics?.rmse?.toFixed(4) || "N/A"
            }</div>
            <div class="metric-label">Sklearn RMSE</div>
        </div>
        <div class="metric-item">
            <div class="metric-value">${
              sklearnModel.metrics?.mae?.toFixed(6) || "N/A"
            }</div>
            <div class="metric-label">Sklearn MAE</div>
        </div>
    </div>
`;

      // Find the model summary card and add sklearn comparison
      const modelSummaryCard = document.querySelector(".model-summary-card");
      if (modelSummaryCard) {
        // Check if sklearn comparison already exists
        const existingSklearn =
          modelSummaryCard.querySelector(".sklearn-equation");
        if (existingSklearn) {
          existingSklearn.remove();
        }
        modelSummaryCard.appendChild(sklearnEquation);
      }

      // Display comparison analysis if available
      if (comparisonAnalysis) {
        displayComparisonAnalysis(comparisonAnalysis);
      }
    }
  } catch (error) {
    console.error("❌ Error displaying sklearn comparison:", error);
  }
}

function displayComparisonAnalysis(comparison) {
  try {
    console.log("📊 Displaying comparison analysis:", comparison);

    // Create comparison section
    const comparisonSection = document.createElement("div");
    comparisonSection.className = "card comparison-card";
    comparisonSection.innerHTML = `
            <h3>🔍 Model Comparison Analysis</h3>
            <div class="comparison-grid">
                <div class="comparison-item">
                    <h4>📉 RMSE Comparison</h4>
                    <div class="comparison-metrics">
                        <div class="metric-row">
                            <span>Custom Model:</span>
                            <span class="metric-value">${
                              comparison.rmse_comparison?.custom_rmse?.toFixed(
                                4
                              ) || "N/A"
                            }</span>
                        </div>
                        <div class="metric-row">
                            <span>Sklearn Model:</span>
                            <span class="metric-value">${
                              comparison.rmse_comparison?.sklearn_rmse?.toFixed(
                                4
                              ) || "N/A"
                            }</span>
                        </div>
                        <div class="metric-row winner">
                            <span>Winner:</span>
                            <span class="winner-badge ${
                              comparison.rmse_comparison?.better_model || "tie"
                            }">${
      comparison.rmse_comparison?.better_model?.toUpperCase() || "TIE"
    }</span>
                        </div>
                    </div>
                </div>
                
                <div class="comparison-item">
                    <h4>🎯 R² Comparison</h4>
                    <div class="comparison-metrics">
                        <div class="metric-row">
                            <span>Custom Model:</span>
                            <span class="metric-value">${
                              comparison.r2_comparison?.custom_r2?.toFixed(4) ||
                              "N/A"
                            }</span>
                        </div>
                        <div class="metric-row">
                            <span>Sklearn Model:</span>
                            <span>${
                              comparison.r2_comparison?.sklearn_r2?.toFixed(
                                4
                              ) || "N/A"
                            }</span>
                        </div>
                        <div class="metric-row winner">
                            <span>Winner:</span>
                            <span class="winner-badge ${
                              comparison.r2_comparison?.better_model || "tie"
                            }">${
      comparison.r2_comparison?.better_model?.toUpperCase() || "TIE"
    }</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="overall-winner">
                <h4>🏆 Overall Assessment</h4>
                <div class="winner-display">
                    <span class="winner-label">Best Model:</span>
                    <span class="winner-badge ${
                      comparison.overall_assessment?.winner || "tie"
                    }">${
      comparison.overall_assessment?.winner?.toUpperCase() || "TIE"
    }</span>
                </div>
                <div class="score-display">
                    <span>Custom: ${
                      comparison.overall_assessment?.custom_score || 0
                    }</span>
                    <span>Sklearn: ${
                      comparison.overall_assessment?.sklearn_score || 0
                    }</span>
                </div>
            </div>
        `;

    // Find where to insert the comparison section
    const resultsLeft = document.querySelector(".results-left");
    if (resultsLeft) {
      // Insert after the model summary card
      const modelSummaryCard = resultsLeft.querySelector(".model-summary-card");
      if (modelSummaryCard && modelSummaryCard.nextSibling) {
        resultsLeft.insertBefore(
          comparisonSection,
          modelSummaryCard.nextSibling
        );
      } else {
        resultsLeft.appendChild(comparisonSection);
      }
    }
  } catch (error) {
    console.error("❌ Error displaying comparison analysis:", error);
  }
}

function setupEventListeners() {
  // Prediction inputs
  document
    .getElementById("predictSingle")
    ?.addEventListener("click", makeSinglePrediction);
  document
    .getElementById("clearSingle")
    ?.addEventListener("click", clearSinglePrediction);

  // Batch upload
  const batchUploadZone = document.getElementById("batchUploadZone");
  const batchFileInput = document.getElementById("batchFileInput");

  if (batchUploadZone && batchFileInput) {
    batchUploadZone.onclick = () => batchFileInput.click();
    batchUploadZone.ondragover = handleBatchDragOver;
    batchUploadZone.ondragleave = handleBatchDragLeave;
    batchUploadZone.ondrop = handleBatchDrop;
    batchFileInput.onchange = handleBatchFileSelect;
  }

  // Download buttons
  const downloadPDFBtn = document.getElementById("downloadPDF");
  if (downloadPDFBtn) {
    console.log("🔗 Setting up downloadPDF event listener");
    downloadPDFBtn.addEventListener("click", function (e) {
      console.log("🖱️ Download PDF button clicked!");
      downloadPDFReport();
    });
  } else {
    console.warn("⚠️ downloadPDF button not found");
  }

  document
    .getElementById("downloadCSV")
    ?.addEventListener("click", downloadCSVResults);
  document
    .getElementById("downloadBatchResults")
    ?.addEventListener("click", downloadBatchPredictions);

  // Column selection and prediction generation
  const xColumnSelect = document.getElementById("xColumnSelect");
  const generatePredictionsBtn = document.getElementById("generatePredictions");

  if (xColumnSelect && generatePredictionsBtn) {
    xColumnSelect.onchange = () => {
      generatePredictionsBtn.disabled = !xColumnSelect.value;
    };
    generatePredictionsBtn.onclick = generateBatchPredictions;
  }

  // Enter key for single prediction
  document.getElementById("xValue")?.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      makeSinglePrediction();
    }
  });
}

function displayModelSummary() {
  try {
    console.log("📊 Displaying model summary...");

    // Check if we're loading from a saved model
    const allTrainingData = localStorage.getItem("allTrainingData");
    
    if (allTrainingData) {
      // Loading from saved model or existing training data
      const trainingData = JSON.parse(allTrainingData);
      console.log("🔍 Training data structure:", trainingData);
      
      // Extract data directly from the training data structure
      const finalTheta0 = trainingData.final_theta0;
      const finalTheta1 = trainingData.final_theta1;
      const equation = trainingData.equation;
      const finalRmse = trainingData.final_rmse;
      const finalMae = trainingData.final_mae;
      const finalR2 = trainingData.final_r2;
      
      // For saved models, we might not have all training parameters
      const testMse = trainingData.test_mse || null;
      const testR2 = trainingData.test_r2 || null;
      const totalEpochs = trainingData.total_epochs || null;
      const xColumn = trainingData.x_column || null;
      const yColumn = trainingData.y_column || null;
      
      // Training parameters (might not be available for saved models)
      const learningRate = trainingData.learning_rate || null;
      const epochs = trainingData.epochs || null;
      const tolerance = trainingData.tolerance || null;
      const earlyStopping = trainingData.early_stopping || null;
      const trainingSpeed = trainingData.training_speed || null;
      const trainSplit = trainingData.train_split || null;
      
      console.log("🔍 Extracted values from training data:", {
        finalTheta0,
        finalTheta1,
        equation,
        finalRmse,
        finalMae,
        finalR2,
        testMse,
        testR2,
      });
      
      // Update equation displays
      const equationDisplay = document.getElementById("finalEquation");
      if (equationDisplay && equation) {
        equationDisplay.textContent = equation;
      }

      const predictionEquationDisplay = document.getElementById("predictionEquation");
      if (predictionEquationDisplay && equation) {
        predictionEquationDisplay.textContent = equation;
      }

      // Set modelData for predictions
      modelData = {
        theta0: finalTheta0,
        theta1: finalTheta1,
        equation: equation,
      };

      // Update metrics
      const rSquared = document.getElementById("rSquared");
      if (rSquared) {
        rSquared.textContent = finalR2 ? finalR2.toFixed(4) : "N/A";
      }

      const finalRmseElement = document.getElementById("finalRmse");
      if (finalRmseElement) {
        finalRmseElement.textContent = finalRmse ? finalRmse.toFixed(6) : "N/A";
      }

      const finalMaeElement = document.getElementById("finalMae");
      if (finalMaeElement) {
        finalMaeElement.textContent = finalMae ? finalMae.toFixed(6) : "N/A";
      }

      const totalEpochsElement = document.getElementById("totalEpochs");
      if (totalEpochsElement && totalEpochs) {
        totalEpochsElement.textContent = totalEpochs;
      }

      // Update training parameters (only if available)
      const learningRateValue = document.getElementById("learningRateValue");
      if (learningRateValue && learningRate) {
        learningRateValue.textContent = learningRate;
      }

      const toleranceValue = document.getElementById("toleranceValue");
      if (toleranceValue && tolerance) {
        toleranceValue.textContent = tolerance;
      }

      const epochsValue = document.getElementById("epochsValue");
      if (epochsValue && epochs) {
        epochsValue.textContent = epochs;
      }

      const earlyStoppingValue = document.getElementById("earlyStoppingValue");
      if (earlyStoppingValue && earlyStopping !== null) {
        earlyStoppingValue.textContent = earlyStopping ? "Yes" : "No";
      }
      
      return; // Exit early since we've handled the saved model case
    }

    // Get comprehensive results (normal training flow)
    const comprehensiveResults = JSON.parse(
      localStorage.getItem("comprehensiveResults") || "{}"
    );
    console.log("🔍 Comprehensive results structure:", comprehensiveResults);

    // The training response structure has changed - look for the new structure
    if (!comprehensiveResults.allTrainingData) {
      console.warn("⚠️ No allTrainingData found in comprehensive results");
      return;
    }

    // Parse the allTrainingData to get the clean training data structure
    const trainingData = JSON.parse(comprehensiveResults.allTrainingData);
    console.log("🔍 Clean training data structure:", trainingData);

    // Extract data directly from the clean structure
    const finalTheta0 = trainingData.final_theta0;
    const finalTheta1 = trainingData.final_theta1;
    const equation = trainingData.equation;
    const finalRmse = trainingData.final_rmse;
    const finalMae = trainingData.final_mae;
    const finalR2 = trainingData.final_r2;
    const testMse = trainingData.test_mse;
    const testR2 = trainingData.test_r2;
    const totalEpochs = trainingData.total_epochs;
    const xColumn = trainingData.x_column;
    const yColumn = trainingData.y_column;

    // Training parameters
    const learningRate = trainingData.learning_rate;
    const epochs = trainingData.epochs;
    const tolerance = trainingData.tolerance;
    const earlyStopping = trainingData.early_stopping;
    const trainingSpeed = trainingData.training_speed;
    const trainSplit = trainingData.train_split;

    console.log("🔍 Extracted values:", {
      finalTheta0,
      finalTheta1,
      equation,
      finalRmse,
      finalMae,
      finalR2,
      testMse,
      testR2,
    });

    // Get training parameters
    const params = comprehensiveResults.trainingParams;

    // Update equation displays
    const equationDisplay = document.getElementById("finalEquation");
    if (equationDisplay && equation) {
      equationDisplay.textContent = equation;
    }

    const predictionEquationDisplay =
      document.getElementById("predictionEquation");
    if (predictionEquationDisplay && equation) {
      predictionEquationDisplay.textContent = equation;
    }

    // Set modelData for predictions
    modelData = {
      theta0: finalTheta0,
      theta1: finalTheta1,
      equation: equation,
    };

    // Update metrics - REPLACE the hardcoded values with real data
    const rSquared = document.getElementById("rSquared");
    if (rSquared) {
      rSquared.textContent = finalR2 ? finalR2.toFixed(4) : "N/A";
    }

    const finalRmseElement = document.getElementById("finalRmse");
    if (finalRmseElement) {
      finalRmseElement.textContent = finalRmse ? finalRmse.toFixed(6) : "N/A";
    }

    const finalMaeElement = document.getElementById("finalMae");
    if (finalMaeElement) {
      finalMaeElement.textContent = finalMae ? finalMae.toFixed(6) : "N/A";
    }

    const totalEpochsElement = document.getElementById("totalEpochs");
    if (totalEpochsElement) {
      totalEpochsElement.textContent = totalEpochs || "N/A";
    }

    // Update training parameters
    const learningRateValue = document.getElementById("learningRateValue");
    if (learningRateValue && learningRate) {
      learningRateValue.textContent = learningRate;
    }

    const toleranceValue = document.getElementById("toleranceValue");
    if (toleranceValue && tolerance) {
      toleranceValue.textContent = tolerance;
    }

    // Update other training parameters
    const epochsValue = document.getElementById("epochsValue");
    if (epochsValue && epochs) {
      epochsValue.textContent = epochs;
    }

    const earlyStoppingValue = document.getElementById("earlyStoppingValue");
    if (earlyStoppingValue && earlyStopping !== undefined) {
      earlyStoppingValue.textContent = earlyStopping ? "Yes" : "No";
    }

    const trainingSpeedValue = document.getElementById("trainingSpeedValue");
    if (trainingSpeedValue && trainingSpeed !== undefined) {
      trainingSpeedValue.textContent = trainingSpeed;
    }

    // Update column names
    const xColumnValue = document.getElementById("xColumnValue");
    if (xColumnValue && xColumn) {
      xColumnValue.textContent = xColumn;
    }

    const yColumnValue = document.getElementById("yColumnValue");
    if (yColumnValue && yColumn) {
      yColumnValue.textContent = yColumn;
    }

    // Update train split if available
    const trainSplitElement = document.getElementById("trainSplit");
    if (trainSplitElement && trainSplit) {
      trainSplitElement.textContent = `${(trainSplit * 100).toFixed(0)}%`;
    }

    // Update column names
    const xColumnDisplay = document.getElementById("xColumn");
    if (xColumnDisplay) {
      xColumnDisplay.textContent = xColumn || "X";
    }

    const yColumnDisplay = document.getElementById("yColumn");
    if (yColumnDisplay) {
      yColumnDisplay.textContent = yColumn || "Y";
    }

    // Update sklearn comparison values if available
    if (
      comprehensiveResults.sklearnResults &&
      comprehensiveResults.sklearnResults.sklearn_results
    ) {
      const sklearnModel = comprehensiveResults.sklearnResults.sklearn_results;

      // Update our model metrics in comparison table
      const ourModelR2 = document.getElementById("ourModelR2");
      if (ourModelR2) {
        ourModelR2.textContent = finalR2 ? finalR2.toFixed(4) : "N/A";
      }

      const ourModelRmse = document.getElementById("ourModelRmse");
      if (ourModelRmse) {
        ourModelRmse.textContent = finalRmse ? finalRmse.toFixed(6) : "N/A";
      }

      const ourModelMae = document.getElementById("ourModelMae");
      if (ourModelMae) {
        ourModelMae.textContent = finalMae ? finalMae.toFixed(6) : "N/A";
      }

      const ourModelEquation = document.getElementById("ourModelEquation");
      if (ourModelEquation) {
        ourModelEquation.textContent = equation || "N/A";
      }

      // Update sklearn model metrics in comparison table
      const sklearnR2 = document.getElementById("sklearnR2");
      if (sklearnR2) {
        sklearnR2.textContent = sklearnModel.metrics?.r2
          ? sklearnModel.metrics.r2
          : "N/A";
      }

      const sklearnRmse = document.getElementById("sklearnRmse");
      if (sklearnRmse) {
        sklearnRmse.textContent = sklearnModel.metrics?.rmse
          ? sklearnModel.metrics.rmse
          : "N/A";
      }

      const sklearnMae = document.getElementById("sklearnMae");
      if (sklearnMae) {
        sklearnMae.textContent = sklearnModel.metrics?.mae
          ? sklearnModel.metrics.mae
          : "N/A";
      }

      const sklearnEquation = document.getElementById("sklearnEquation");
      if (sklearnEquation) {
        sklearnEquation.textContent = sklearnModel.equation || "N/A";
      }

      // Update comparison note
      const comparisonNote = document.getElementById("comparisonNote");
      if (comparisonNote) {
        if (finalR2 && sklearnModel.r2) {
          if (finalR2 > sklearnModel.r2) {
            comparisonNote.textContent =
              "Our custom model performed better! 🎯";
          } else if (finalR2 < sklearnModel.r2) {
            comparisonNote.textContent = "Sklearn model performed better 🤖";
          } else {
            comparisonNote.textContent =
              "Both models performed equally well! 🎉";
          }
        }
      }
    } else {
      // Try to get sklearn comparison from training data
      if (trainingData.sklearn_comparison) {
        console.log("🔍 Displaying sklearn comparison from training data");
        displaySklearnComparison(trainingData.sklearn_comparison);
      }
    }

    // Display sklearn comparison in the model summary card
    if (
      trainingData.sklearn_comparison &&
      trainingData.sklearn_comparison.sklearn_results
    ) {
      const sklearnModel = trainingData.sklearn_comparison.sklearn_results;

      console.log("🔍 Sklearn metrics object:", sklearnModel.metrics);
      console.log("🔍 Sklearn R² from metrics:", sklearnModel.metrics?.r2);
      console.log("🔍 Sklearn RMSE from metrics:", sklearnModel.metrics?.rmse);
      console.log("🔍 Sklearn MAE from metrics:", sklearnModel.metrics?.mae);

      // Create sklearn comparison section
      const sklearnSection = document.createElement("div");
      sklearnSection.className = "sklearn-comparison";
      sklearnSection.innerHTML = `
                <h4>🤖 Sklearn Model</h4>
                <div class="comparison-grid">
                    <div class="comparison-item">
                        <div class="comparison-label">θ₀ (Intercept)</div>
                        <div class="comparison-value">${
                          sklearnModel.theta0
                            ? sklearnModel.theta0.toFixed(6)
                            : "N/A"
                        }</div>
                    </div>
                    <div class="comparison-item">
                        <div class="comparison-label">θ₁ (Coefficient)</div>
                        <div class="comparison-value">${
                          sklearnModel.theta1
                            ? sklearnModel.theta1.toFixed(6)
                            : "N/A"
                        }</div>
                    </div>
                    <div class="comparison-item">
                        <div class="comparison-label">R²</div>
                        <div class="comparison-value">${
                          sklearnModel.r2 ? sklearnModel.r2.toFixed(4) : "N/A"
                        }</div>
                    </div>
                    <div class="comparison-item">
                        <div class="comparison-label">RMSE</div>
                        <div class="comparison-value">${
                          sklearnModel.rmse
                            ? sklearnModel.rmse.toFixed(6)
                            : "N/A"
                        }</div>
                    </div>
                    <div class="comparison-item">
                        <div class="comparison-label">Equation</div>
                        <div class="comparison-value equation">${
                          sklearnModel.equation || "N/A"
                        }</div>
                    </div>
                </div>
            `;

      // Find the model summary card and add sklearn comparison
      const modelSummaryCard = document.querySelector(".model-summary-card");
      if (modelSummaryCard) {
        // Remove existing sklearn comparison if any
        const existingSklearn = modelSummaryCard.querySelector(
          ".sklearn-comparison"
        );
        if (existingSklearn) {
          existingSklearn.remove();
        }
        modelSummaryCard.appendChild(sklearnSection);
      }
    }

    console.log("✅ Model summary displayed with training response data");
  } catch (error) {
    console.error("❌ Error displaying model summary:", error);
    console.error("❌ Error details:", error.message);
    console.error("❌ Stack trace:", error.stack);
  }
}

function displayModelSummaryFrom(data) {
  // reuse logic from displayModelSummary but using provided data; quick call:
  localStorage.setItem("allTrainingData", JSON.stringify(data));
  displayModelSummary();
}

function makeSinglePrediction() {
  console.log("🔮 Making single prediction...");
  console.log("🔮 modelData:", modelData);

  const xInput = document.getElementById("xValue");
  const resultDiv = document.getElementById("predictionResult");
  const predictedValueSpan = document.getElementById("predictedValue");

  console.log("🔮 Elements found:", { xInput, resultDiv, predictedValueSpan });

  if (!xInput || !modelData) {
    console.error("❌ Missing required data:", {
      xInput: !!xInput,
      modelData: !!modelData,
    });
    return;
  }

  const xValue = parseFloat(xInput.value);
  console.log("🔮 X value entered:", xValue);

  if (isNaN(xValue)) {
    alert("Please enter a valid number for X value");
    return;
  }

  // Make prediction using trained model
  const prediction = modelData.theta0 + modelData.theta1 * xValue;
  console.log(
    "🔮 Prediction calculated:",
    prediction,
    "using theta0:",
    modelData.theta0,
    "theta1:",
    modelData.theta1
  );

  predictedValueSpan.textContent = prediction.toFixed(4);
  resultDiv.style.display = "block";

  console.log("🔮 Prediction result displayed");

  // Scroll to result
  setTimeout(() => {
    resultDiv.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, 100);
}

function clearSinglePrediction() {
  document.getElementById("xValue").value = "";
  document.getElementById("predictionResult").style.display = "none";
}

// Batch prediction functions
function handleBatchDragOver(e) {
  e.preventDefault();
  document.getElementById("batchUploadZone").classList.add("dragover");
}

function handleBatchDragLeave(e) {
  e.preventDefault();
  document.getElementById("batchUploadZone").classList.remove("dragover");
}

function handleBatchDrop(e) {
  e.preventDefault();
  document.getElementById("batchUploadZone").classList.remove("dragover");
  const files = e.dataTransfer.files;
  if (files.length > 0 && files[0].name.endsWith(".csv")) {
    processBatchFile(files[0]);
  }
}

function handleBatchFileSelect(e) {
  const file = e.target.files[0];
  if (file) {
    processBatchFile(file);
  }
}

function processBatchFile(file) {
  if (file.size > 10 * 1024 * 1024) {
    alert("File size exceeds 10MB limit");
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    parseBatchCSV(e.target.result);
  };
  reader.readAsText(file);
}

function parseBatchCSV(csvText) {
  try {
    const lines = csvText.trim().split("\n");
    if (lines.length < 2) {
      alert("CSV must have at least 2 rows (header + data)");
      return;
    }

    const headers = lines[0]
      .split(",")
      .map((h) => h.trim().replace(/['"]/g, ""));
    const dataRows = lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim().replace(/['"]/g, ""));
      const rowObj = {};
      headers.forEach((header, index) => {
        rowObj[header] = values[index] || "";
      });
      return rowObj;
    });

    // Store the parsed data globally for later use
    window.batchCSVData = {
      headers: headers,
      data: dataRows,
      rawText: csvText,
    };

    // Show column selection
    showColumnSelection(headers);

    // Show CSV preview
    showCSVPreview(headers, dataRows.slice(0, 10), dataRows.length); // Show first 10 rows
  } catch (error) {
    console.error("Error parsing CSV:", error);
    alert("Error parsing CSV file. Please check the format.");
  }
}

function showColumnSelection(headers) {
  const columnSelection = document.getElementById("columnSelection");
  const xColumnSelect = document.getElementById("xColumnSelect");

  if (columnSelection && xColumnSelect) {
    // Clear existing options
    xColumnSelect.innerHTML = '<option value="">-- Select X Column --</option>';

    // Add column options
    headers.forEach((header) => {
      const option = document.createElement("option");
      option.value = header;
      option.textContent = header;
      xColumnSelect.appendChild(option);
    });

    // Show column selection
    columnSelection.style.display = "block";

    // Scroll to column selection
    setTimeout(() => {
      columnSelection.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }
}

function showCSVPreview(headers, dataRows, totalRows) {
  const csvPreview = document.getElementById("csvPreview");
  const previewTableHead = document.getElementById("previewTableHead");
  const previewTableBody = document.getElementById("previewTableBody");
  const csvRowCount = document.getElementById("csvRowCount");
  const csvColCount = document.getElementById("csvColCount");

  if (csvPreview && previewTableHead && previewTableBody) {
    // Create header row
    previewTableHead.innerHTML = `<tr>${headers
      .map((header) => `<th>${header}</th>`)
      .join("")}</tr>`;

    // Create data rows
    previewTableBody.innerHTML = dataRows
      .map(
        (row) =>
          `<tr>${headers
            .map((header) => {
              const value = row[header] || "";
              // Truncate very long values for display
              const displayValue =
                typeof value === "string" && value.length > 50
                  ? value.substring(0, 47) + "..."
                  : value;
              return `<td title="${value}">${displayValue}</td>`;
            })
            .join("")}</tr>`
      )
      .join("");

    // Update row and column counts
    if (csvRowCount && csvColCount) {
      csvRowCount.textContent = `Rows: ${totalRows || 0}`;
      csvColCount.textContent = `Columns: ${headers.length}`;
    }

    // Show CSV preview
    csvPreview.style.display = "block";
  }
}

function generateBatchPredictions() {
  const xColumnSelect = document.getElementById("xColumnSelect");
  const selectedColumn = xColumnSelect.value;

  if (!selectedColumn) {
    alert("Please select an X column");
    return;
  }

  if (!window.batchCSVData || !window.batchCSVData.data) {
    alert("No CSV data available");
    return;
  }

  // Validate the selected column
  const validation = validateCSVData(
    window.batchCSVData.data,
    window.batchCSVData.headers,
    selectedColumn
  );

  if (!validation.valid) {
    const errorMessage = formatValidationMessage(
      validation.errors,
      validation.warnings
    );
    alert(errorMessage);
    return;
  }

  // Extract X values and make predictions
  const xValues = extractXValues(window.batchCSVData.data, selectedColumn);

  if (xValues.length === 0) {
    alert("No valid numeric data found in the selected column");
    return;
  }

  // Generate predictions
  batchPredictions = xValues.map((x) => ({
    x: x,
    y: modelData.theta0 + modelData.theta1 * x,
  }));

  // Display results
  displayBatchResults();
}

function displayBatchResults() {
  const resultsDiv = document.getElementById("batchResults");
  const countSpan = document.getElementById("batchCount");
  const tableBody = document.getElementById("batchTableBody");

  countSpan.textContent = `${batchPredictions.length} predictions made`;

  // Show preview (first 10 rows)
  const previewData = batchPredictions.slice(0, 10);
  tableBody.innerHTML = previewData
    .map(
      (pred) =>
        `<tr>
            <td>${pred.x.toFixed(4)}</td>
            <td>${pred.y.toFixed(4)}</td>
        </tr>`
    )
    .join("");

  if (batchPredictions.length > 10) {
    tableBody.innerHTML += `<tr><td colspan="2" style="text-align: center; font-style: italic;">... and ${
      batchPredictions.length - 10
    } more rows</td></tr>`;
  }

  resultsDiv.style.display = "block";

  // Scroll to results
  setTimeout(() => {
    resultsDiv.scrollIntoView({ behavior: "smooth" });
  }, 100);
}

// Helper functions for validation
function validateCSVData(data, headers, xColumn) {
  const errors = [];
  const warnings = [];

  // Check if required columns exist
  if (!headers.includes(xColumn)) {
    errors.push(`X column '${xColumn}' not found in CSV`);
  }

  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  // Validate X column data
  const xColumnData = data
    .map((row) => row[xColumn])
    .filter((val) => val !== "");
  const xNumericData = xColumnData.filter((val) => !isNaN(parseFloat(val)));

  if (xNumericData.length === 0) {
    errors.push(`No valid numeric data found in X column '${xColumn}'`);
  } else if (xNumericData.length < xColumnData.length) {
    warnings.push(
      `${
        xColumnData.length - xNumericData.length
      } non-numeric values found in X column '${xColumn}'`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    validRowCount: xNumericData.length,
  };
}

function extractXValues(data, xColumn) {
  if (!data || !xColumn) {
    return [];
  }

  return data
    .map((row) => parseFloat(row[xColumn]))
    .filter((val) => !isNaN(val));
}

function formatValidationMessage(errors, warnings = []) {
  let message = "";

  if (errors.length > 0) {
    message += "❌ Errors:\n" + errors.map((err) => `• ${err}`).join("\n");
  }

  if (warnings.length > 0) {
    if (message) message += "\n\n";
    message +=
      "⚠️ Warnings:\n" + warnings.map((warn) => `• ${warn}`).join("\n");
  }

  return message;
}

// Download functions
function downloadPDFReport() {
  console.log("🚀 NEW downloadPDFReport function called!");
  console.log("📊 trainingResults:", trainingResults);
  console.log("🤖 modelData:", modelData);
  console.log("📚 jsPDF available:", !!window.jspdf);

  try {
    if (!trainingResults || !modelData) {
      alert("No results data available for PDF generation");
      return;
    }

    // Check if jsPDF is available
    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert(
        "PDF generation library not loaded. Please refresh the page and try again."
      );
      return;
    }

    // Validate model data
    if (!modelData.equation || !modelData.theta0 || !modelData.theta1) {
      alert(
        "Model data is incomplete. Please ensure training is completed first."
      );
      return;
    }

    // Check if required DOM elements exist
    const requiredElements = [
      "learningRateValue",
      "epochsValue",
      "toleranceValue",
      "earlyStoppingValue",
      "trainingSpeedValue",
      "trainSplit",
      "xColumnValue",
      "yColumnValue",
      "ourModelR2",
      "ourModelRmse",
      "ourModelMae",
    ];

    const missingElements = requiredElements.filter(
      (id) => !document.getElementById(id)
    );
    if (missingElements.length > 0) {
      console.warn("⚠️ Missing DOM elements:", missingElements);
      alert(
        `Some data elements are missing: ${missingElements.join(
          ", "
        )}. Please refresh the page and try again.`
      );
      return;
    }

    // Create new PDF document
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Set title
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Linear Regression Model Summary", 105, 20, { align: "center" });

    // Add model equation
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Model Equation:", 20, 40);
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.text(modelData.equation, 20, 50);

    // Add training parameters
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Training Parameters:", 20, 70);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");

    let yPos = 80;

    // Safely get parameter values with fallbacks
    const getParamValue = (elementId, fallback = "N/A") => {
      try {
        const element = document.getElementById(elementId);
        if (!element) {
          console.warn(
            `⚠️ Element with ID '${elementId}' not found, using fallback: ${fallback}`
          );
          return fallback;
        }
        const value = element.textContent?.trim();
        return value || fallback;
      } catch (error) {
        console.warn(`⚠️ Error reading element '${elementId}':`, error);
        return fallback;
      }
    };

    const params = [
      `Learning Rate: ${getParamValue("learningRateValue", "N/A")}`,
      `Epochs: ${getParamValue("epochsValue", "N/A")}`,
      `Tolerance: ${getParamValue("toleranceValue", "N/A")}`,
      `Early Stopping: ${getParamValue("earlyStoppingValue", "N/A")}`,
      `Training Speed: ${getParamValue("trainingSpeedValue", "N/A")}`,
      `Train Split: ${getParamValue("trainSplit", "80%")}`,
      `X Column: ${getParamValue("xColumnValue", "X")}`,
      `Y Column: ${getParamValue("yColumnValue", "Y")}`,
    ];

    params.forEach((param) => {
      doc.text(param, 20, yPos);
      yPos += 8;
    });

    // Add model performance metrics
    yPos += 10;
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Model Performance:", 20, yPos);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    yPos += 10;

    const metrics = [
      `R² Score (Our Model): ${getParamValue("ourModelR2", "N/A")}`,
      `RMSE (Our Model): ${getParamValue("ourModelRmse", "N/A")}`,
      `MAE (Our Model): ${getParamValue("ourModelMae", "N/A")}`,
    ];

    metrics.forEach((metric) => {
      doc.text(metric, 20, yPos);
      yPos += 8;
    });

    // Add sklearn comparison if available
    if (window.sklearnResults) {
      yPos += 10;
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Scikit-Learn Comparison:", 20, yPos);
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      yPos += 10;

      const sklearnMetrics = [
        `R² Score (Sklearn): ${getParamValue("sklearnR2", "N/A")}`,
        `RMSE (Sklearn): ${getParamValue("sklearnRmse", "N/A")}`,
        `MAE (Sklearn): ${getParamValue("sklearnMae", "N/A")}`,
      ];

      sklearnMetrics.forEach((metric) => {
        doc.text(metric, 20, yPos);
        yPos += 8;
      });
    }

    // Add data summary
    yPos += 10;
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Data Summary:", 20, yPos);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    yPos += 8;

    if (trainingResults.csvData && Array.isArray(trainingResults.csvData)) {
      const totalPoints = trainingResults.csvData.length;
      const trainSplitText = getParamValue("trainSplit", "80%");
      const trainSplitPercent = parseFloat(trainSplitText) || 80;

      doc.text(`Total Data Points: ${totalPoints}`, 20, yPos);
      yPos += 8;
      doc.text(
        `Training Data Points: ${Math.floor(
          totalPoints * (trainSplitPercent / 100)
        )}`,
        20,
        yPos
      );
      yPos += 8;
      doc.text(
        `Test Data Points: ${Math.ceil(
          totalPoints * (1 - trainSplitPercent / 100)
        )}`,
        20,
        yPos
      );
    } else {
      doc.text("Data Summary: Not available", 20, yPos);
    }

    // Add timestamp
    yPos += 15;
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.text(`Report generated on: ${new Date().toLocaleString()}`, 20, yPos);

    // Save the PDF
    doc.save("linear_regression_model_summary.pdf");

    // Show success message
    alert("PDF Generated Successfully! Model summary has been downloaded.");
  } catch (error) {
    console.error("❌ Error generating PDF:", error);
    console.error("❌ Error details:", {
      message: error.message,
      stack: error.stack,
      trainingResults: !!trainingResults,
      modelData: !!modelData,
      jsPDF: !!window.jspdf,
    });

    // Show more specific error message
    let errorMessage = "Error generating PDF report. ";
    if (error.message.includes("jsPDF")) {
      errorMessage += "PDF library error. Please refresh the page.";
    } else if (error.message.includes("text")) {
      errorMessage += "Text rendering error. Please try again.";
    } else {
      errorMessage += "Please try again.";
    }

    alert(errorMessage);
  }
}

function downloadCSVResults() {
  if (!trainingResults || !modelData) {
    alert("No results data available");
    return;
  }

  try {
    // Generate CSV content with training data and predictions
    const validData = trainingResults.csvData.filter(
      (row) =>
        typeof row[trainingResults.xColumn] === "number" &&
        typeof row[trainingResults.yColumn] === "number"
    );

    const csvContent = [
      ["X", "Y_Actual", "Y_Predicted", "Residual"].join(","),
      ...validData.map((row) => {
        const x = row[trainingResults.xColumn];
        const yActual = row[trainingResults.yColumn];
        const yPredicted = modelData.theta0 + modelData.theta1 * x;
        const residual = yActual - yPredicted;
        return [x, yActual, yPredicted.toFixed(6), residual.toFixed(6)].join(
          ","
        );
      }),
    ].join("\n");

    downloadCSVFile(csvContent, "training_results.csv");
  } catch (error) {
    console.error("Error generating CSV:", error);
    alert("Error generating CSV results");
  }
}

function downloadBatchPredictions() {
  if (batchPredictions.length === 0) {
    alert("No batch predictions available");
    return;
  }

  try {
    const csvContent = [
      ["X_Value", "Predicted_Y"].join(","),
      ...batchPredictions.map((pred) => [pred.x, pred.y.toFixed(6)].join(",")),
    ].join("\n");

    downloadCSVFile(csvContent, "batch_predictions.csv");
  } catch (error) {
    console.error("Error downloading batch predictions:", error);
    alert("Error downloading batch predictions");
  }
}

function downloadCSVFile(content, filename) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

function closeBanner() {
  document.getElementById("successBanner").style.display = "none";
}

// Make the function available globally for inline onclick handler
window.closeBanner = closeBanner;
window.downloadPDFReport = downloadPDFReport;
