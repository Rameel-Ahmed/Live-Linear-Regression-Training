import {
  setupSidebarToggle,
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  showInfoToast,
} from "./helping_functions.js";
import {
  showVisualizationSection,
  createScatterPlot,
  createDensityPlot,
  createRangePlot,
  createStatisticalSummary,
} from "./visualization-functions.js";
import { loadState, saveState, resetState, advanceStep } from "./state.js";

// Global variables
let csvData = [];
let headers = [];

// API configuration
const API_BASE_URL = "http://localhost:8000/api/v1";

// ============================================================================
// INITIALIZATION & SETUP
// ============================================================================

// Initialize when DOM loads
document.addEventListener("DOMContentLoaded", function () {
  setupSidebarToggle();
  console.log("=== APP STARTING ===");

  // THEME TOGGLE
  const themeBtn = document.getElementById("themeBtn");
  console.log("Theme button found:", !!themeBtn);

  if (themeBtn) {
    themeBtn.onclick = function () {
      console.log("🎯 THEME CLICKED!");
      const current =
        document.documentElement.getAttribute("data-theme") || "light";
      const newTheme = current === "light" ? "dark" : "light";

      document.documentElement.setAttribute("data-theme", newTheme);
      localStorage.setItem("theme", newTheme);
      this.textContent = newTheme === "light" ? "🌙" : "☀️";

      // Update chart colors when theme changes
      updateChartColors();

      console.log("Theme changed:", current, "->", newTheme);
    };
  }

  // Initialize theme
  const savedTheme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  if (themeBtn) {
    themeBtn.textContent = savedTheme === "light" ? "🌙" : "☀️";
  }

  // resume if user comes back from later steps via proper navigation
  const st = loadState();
  const cameFromNavigation = sessionStorage.getItem("navigatedFromPage");

  if (st.step >= 2 && st.trainingData && cameFromNavigation) {
    console.log("🔄 Resuming upload page from saved state");
    window.cleanedData = {
      x_values: st.trainingData.statistics.x_data,
      y_values: st.trainingData.statistics.y_data,
    };
    window.cleanedDataColumns = {
      x_column: st.trainingData.columns.x_column,
      y_column: st.trainingData.columns.y_column,
    };
    window.cleanedStats = {
      x_mean: st.trainingData.statistics.x_mean,
      y_mean: st.trainingData.statistics.y_mean,
      x_std: st.trainingData.statistics.x_std,
      y_std: st.trainingData.statistics.y_std,
    };
    showVisualizationSection();
    setTimeout(() => {
      createScatterPlot();
      createDensityPlot();
      createRangePlot();
      createStatisticalSummary();
    }, 50);
    // Clear the navigation flag after use
    sessionStorage.removeItem("navigatedFromPage");
  } else if (!cameFromNavigation) {
    // On fresh page load/reload, reset to initial state
    console.log("🔄 Fresh page load - resetting to initial state");
    resetState();
  }

  setupEventListeners();
  console.log("=== APP READY ===");
});

// ============================================================================
// DOM ELEMENTS & EVENT LISTENERS
// ============================================================================

// DOM Elements
const elements = {
  get fileInput() {
    return document.getElementById("fileInput");
  },
  get uploadZone() {
    return document.getElementById("uploadZone");
  },
  get previewSection() {
    return document.getElementById("previewSection");
  },
  get columnSection() {
    return document.getElementById("columnSection");
  },
  get dataQualitySection() {
    return document.getElementById("dataQualitySection");
  },
  get cleaningSection() {
    return document.getElementById("cleaningSection");
  },
  get visualizationSection() {
    return document.getElementById("visualizationSection");
  },
  get tableHead() {
    return document.getElementById("tableHead");
  },
  get tableBody() {
    return document.getElementById("tableBody");
  },
  get rowCount() {
    return document.getElementById("rowCount");
  },
  get colCount() {
    return document.getElementById("colCount");
  },
  get xColumn() {
    return document.getElementById("xColumn");
  },
  get yColumn() {
    return document.getElementById("yColumn");
  },
  get analyzeDataBtn() {
    return document.getElementById("analyzeDataBtn");
  },
  get cleanDataBtn() {
    return document.getElementById("cleanDataBtn");
  },
  get noIssuesMessage() {
    return document.getElementById("noIssuesMessage");
  },
  get duplicatesOption() {
    return document.getElementById("duplicatesOption");
  },
  get missingValuesOption() {
    return document.getElementById("missingValuesOption");
  },
  get outliersOption() {
    return document.getElementById("outliersOption");
  },
};

function setupEventListeners() {
  // File upload events
  if (elements.uploadZone) {
    elements.uploadZone.onclick = () => elements.fileInput?.click();
    elements.uploadZone.ondragover = handleDragOver;
    elements.uploadZone.ondragleave = handleDragLeave;
    elements.uploadZone.ondrop = handleDrop;
  }

  if (elements.fileInput) {
    elements.fileInput.onchange = handleFileSelect;
  }

  // Column selection events
  if (elements.xColumn) {
    elements.xColumn.onchange = checkColumnSelection;
  }

  if (elements.yColumn) {
    elements.yColumn.onchange = checkColumnSelection;
  }

  // Data quality analysis button
  if (elements.analyzeDataBtn) {
    elements.analyzeDataBtn.onclick = analyzeDataQuality;
  }

  // Clean data button
  if (elements.cleanDataBtn) {
    elements.cleanDataBtn.onclick = cleanData;
  }
}

// ============================================================================
// FILE HANDLING & CSV PROCESSING
// ============================================================================

// File handling functions
function handleDragOver(e) {
  e.preventDefault();
  elements.uploadZone.classList.add("dragover");
}

function handleDragLeave(e) {
  e.preventDefault();
  elements.uploadZone.classList.remove("dragover");
}

function handleDrop(e) {
  e.preventDefault();
  elements.uploadZone.classList.remove("dragover");
  const files = e.dataTransfer.files;
  if (files.length > 0 && files[0].name.endsWith(".csv")) {
    processFile(files[0]);
  }
}

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file) {
    processFile(file);
  }
}

function processFile(file) {
  if (file.size > 10 * 1024 * 1024) {
    alert("File size exceeds 10MB limit");
    return;
  }

  // Store the filename globally
  window.csvFileName = file.name;

  const reader = new FileReader();
  reader.onload = function (e) {
    parseCSV(e.target.result);
  };
  reader.readAsText(file);
}

function parseCSV(csvText) {
  try {
    // Reset everything when new file is uploaded
    resetWorkflow();

    const lines = csvText.trim().split("\n");
    if (lines.length < 2) {
      alert("CSV must have at least 2 rows (header + data)");
      return;
    }

    // Parse headers
    let separator = ",";
    if (lines[0].includes(";")) separator = ";";
    if (lines[0].includes("\t")) separator = "\t";

    headers = lines[0]
      .split(separator)
      .map((h) => h.trim().replace(/['"]/g, ""));

    // Parse data rows
    csvData = [];
    for (let i = 1; i < lines.length && i < 1001; i++) {
      const values = lines[i]
        .split(separator)
        .map((v) => v.trim().replace(/['"]/g, ""));

      if (values.length === headers.length) {
        const row = {};
        headers.forEach((header, index) => {
          const value = values[index];
          const numValue = parseFloat(value);
          row[header] = !isNaN(numValue) && value !== "" ? numValue : value;
        });
        csvData.push(row);
      }
    }

    if (csvData.length === 0) {
      alert("No valid data rows found in CSV");
      return;
    }

    updateDataPreview();
    populateColumnSelectors();
  } catch (error) {
    console.error("Error parsing CSV:", error);
    alert("Error parsing CSV file. Please check the format.");
  }
}

function resetWorkflow() {
  // when new CSV chosen, reset global workflow state
  advanceStep(1);
  // Hide all sections except preview
  if (elements.columnSection) elements.columnSection.style.display = "none";
  if (elements.dataQualitySection)
    elements.dataQualitySection.style.display = "none";
  if (elements.cleaningSection) elements.cleaningSection.style.display = "none";
  if (elements.visualizationSection)
    elements.visualizationSection.style.display = "none";

  // Hide cleaning preview
  const cleaningPreview = document.getElementById("cleaningPreview");
  if (cleaningPreview) cleaningPreview.style.display = "none";

  // Button is now static in HTML - no need to remove

  // Destroy existing charts
  if (
    window.scatterChart &&
    typeof window.scatterChart.destroy === "function"
  ) {
    window.scatterChart.destroy();
    window.scatterChart = null;
  }
  if (
    window.densityChart &&
    typeof window.densityChart.destroy === "function"
  ) {
    window.densityChart.destroy();
    window.densityChart = null;
  }
  if (window.rangeChart && typeof window.rangeChart.destroy === "function") {
    window.rangeChart.destroy();
    window.rangeChart = null;
  }

  // Clear stored data
  window.dataQualityAnalysis = null;
  window.cleanedData = null;
  window.cleanedDataColumns = null;
  window.cleanedStats = null;

  // Clear localStorage data from previous session
  localStorage.removeItem("trainingData");

  // Reset button states
  if (elements.analyzeDataBtn) elements.analyzeDataBtn.disabled = true;
  if (elements.cleanDataBtn) elements.cleanDataBtn.disabled = false;

  console.log("🔄 Workflow reset for new file");
}

function updateDataPreview() {
  elements.tableHead.innerHTML =
    "<tr>" + headers.map((h) => `<th>${h}</th>`).join("") + "</tr>";

  const previewRows = csvData.slice(0, 10);
  elements.tableBody.innerHTML = previewRows
    .map(
      (row) =>
        "<tr>" +
        headers
          .map(
            (h) =>
              `<td>${
                row[h] !== null && row[h] !== undefined ? row[h] : ""
              }</td>`
          )
          .join("") +
        "</tr>"
    )
    .join("");

  elements.rowCount.textContent = `Rows: ${csvData.length}`;
  elements.colCount.textContent = `Columns: ${headers.length}`;
  elements.previewSection.style.display = "block";
}

function populateColumnSelectors() {
  const numericColumns = [];
  headers.forEach((header) => {
    const numericCount = csvData.filter(
      (row) => typeof row[header] === "number" && !isNaN(row[header])
    ).length;

    if (numericCount > 0) {
      numericColumns.push(header);
    }
  });

  if (numericColumns.length < 2) {
    alert("Need at least 2 numeric columns for regression");
    return;
  }

  elements.xColumn.innerHTML = '<option value="">Select X column...</option>';
  elements.yColumn.innerHTML = '<option value="">Select Y column...</option>';

  numericColumns.forEach((column) => {
    elements.xColumn.innerHTML += `<option value="${column}">${column}</option>`;
    elements.yColumn.innerHTML += `<option value="${column}">${column}</option>`;
  });

  elements.columnSection.style.display = "block";
}

// ============================================================================
// COLUMN SELECTION & VALIDATION
// ============================================================================

function checkColumnSelection() {
  const xCol = elements.xColumn.value;
  const yCol = elements.yColumn.value;

  const hasSelection = xCol && yCol;
  const differentColumns = xCol !== yCol;

  elements.analyzeDataBtn.disabled = !(hasSelection && differentColumns);

  if (hasSelection && !differentColumns) {
    alert("X and Y columns must be different");
    return;
  }
}

// ============================================================================
// DATA QUALITY ANALYSIS
// ============================================================================

function analyzeDataQuality() {
  const xCol = elements.xColumn.value;
  const yCol = elements.yColumn.value;

  if (!xCol || !yCol || xCol === yCol) {
    alert("Please select different X and Y columns");
    return;
  }

  // Make API call to analyze data quality
  analyzeDataQualityAPI(xCol, yCol);
}

async function analyzeDataQualityAPI(xCol, yCol) {
  try {
    // Create FormData with file and column selection
    const formData = new FormData();
    const fileInput = document.getElementById("fileInput");
    const file = fileInput.files[0];

    formData.append("file", file);
    formData.append("x_column", xCol);
    formData.append("y_column", yCol);

    // Call the analyze endpoint
    const response = await fetch(`${API_BASE_URL}/analyze-data-quality`, {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      const analysisResult = await response.json();
      displayDataQualityReport(analysisResult);
    } else {
      const error = await response.json();
      showDataQualityError("Error analyzing data: " + error.detail);
    }
  } catch (error) {
    showDataQualityError("Network error: " + error.message);
  }
}

function displayDataQualityReport(analysis) {
  // Show toast notification with quality report
  showQualityToast(analysis);

  // Store analysis results
  window.dataQualityAnalysis = analysis;

  // Show cleaning section immediately after quality report
  showCleaningOptions();
}

function showQualityToast(analysis) {
  const toastContainer = document.getElementById("toastContainer");

  // Determine toast type based on issues
  const hasIssues = analysis.summary.some((item) => !item.includes("clean"));
  const toastType = hasIssues ? "warning" : "success";

  const toast = document.createElement("div");
  toast.className = `toast ${toastType}`;

  // Format each item on a new line with bullet points
  const issuesText = analysis.summary.map((item) => `• ${item}`).join("\n");

  toast.innerHTML = `
        <div class="toast-header">
            <h4 class="toast-title"> Data Quality Report</h4>
            <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
        <div class="toast-content"><strong>${analysis.total_rows} rows analyzed</strong>

${issuesText}</div>
    `;

  toastContainer.appendChild(toast);

  // Show toast with animation
  setTimeout(() => toast.classList.add("show"), 100);

  // Auto-remove toast after 15 seconds
  setTimeout(() => {
    if (toast.parentElement) {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }
  }, 15000);
}

function showDataQualityError(message) {
  const toastContainer = document.getElementById("toastContainer");

  const toast = document.createElement("div");
  toast.className = "toast error";

  toast.innerHTML = `
        <div class="toast-header">
            <h4 class="toast-title"> Analysis Failed</h4>
            <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
        <div class="toast-content">${
          message.includes(",")
            ? message
                .split(",")
                .map((m) => m.trim())
                .join("\n")
            : message
        }</div>
        <div class="toast-actions">
            <button class="btn btn-primary" onclick="analyzeDataQuality()">🔄 Retry</button>
        </div>
    </div>
    `;

  toastContainer.appendChild(toast);

  // Show toast with animation
  setTimeout(() => toast.classList.add("show"), 100);

  // Auto-remove toast after 10 seconds
  setTimeout(() => {
    if (toast.parentElement) {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }
  }, 10000);
}

// ============================================================================
// DATA CLEANING CONFIGURATION
// ============================================================================

function showCleaningOptions() {
  // Hide quality section, show cleaning section
  elements.dataQualitySection.style.display = "none";
  elements.cleaningSection.style.display = "block";

  // Set smart defaults based on quality report
  setCleaningDefaults();

  // Scroll to cleaning section
  setTimeout(() => {
    elements.cleaningSection.scrollIntoView({ behavior: "smooth" });
  }, 100);
}

function setCleaningDefaults() {
  const analysis = window.dataQualityAnalysis;
  if (!analysis || !analysis.summary) return;

  // Check if there are any issues
  const hasIssues = analysis.summary.some((issue) => !issue.includes("clean"));

  if (!hasIssues) {
    // No issues found - show message and set conservative defaults
    if (elements.noIssuesMessage) {
      elements.noIssuesMessage.style.display = "block";
    }
    // Hide all issue-specific options
    if (elements.missingValuesOption) {
      elements.missingValuesOption.style.display = "none";
    }
    if (elements.duplicatesOption) {
      elements.duplicatesOption.style.display = "none";
    }
    if (elements.outliersOption) {
      elements.outliersOption.style.display = "block";
    }
    document.getElementById("keepOutliers").checked = true;
    return;
  } else {
    // Issues found - hide the no issues message
    if (elements.noIssuesMessage) {
      elements.noIssuesMessage.style.display = "none";
    }
  }

  // Check for specific issues and show/hide options accordingly
  let hasMissingValues = false;
  let hasOutliers = false;
  let hasDuplicates = false;

  analysis.summary.forEach((issue) => {
    if (issue.includes("NaN") || issue.includes("missing")) {
      hasMissingValues = true;
      // If many missing values, suggest filling with mean
      const missingCount = parseInt(issue.match(/\d+/)?.[0] || "0");
      const totalRows = analysis.total_rows || 1000;
      const missingPercentage = (missingCount / totalRows) * 100;

      if (missingPercentage > 20) {
        // If more than 20% missing, suggest filling with mean
        document.getElementById("fillMean").checked = true;
      } else {
        // If less than 20% missing, suggest removing rows
        document.getElementById("removeMissing").checked = true;
      }
    }

    if (issue.includes("outliers")) {
      hasOutliers = true;
    }

    // Add duplicate detection
    if (issue.includes("duplicates") || issue.includes("duplicate")) {
      hasDuplicates = true;
    }
  });

  // Show/hide options based on detection
  if (elements.missingValuesOption) {
    elements.missingValuesOption.style.display = hasMissingValues
      ? "block"
      : "none";
  }

  // Add this for duplicates
  if (elements.duplicatesOption) {
    elements.duplicatesOption.style.display = hasDuplicates ? "block" : "none";
    if (hasDuplicates) {
      document.getElementById("removeDuplicates").checked = true; // Default to removing duplicates
    }
  }

  // Always show outliers option
  if (elements.outliersOption) {
    elements.outliersOption.style.display = "block";
  }

  document.getElementById("keepOutliers").checked = true;
}

// ============================================================================
// DATA CLEANING EXECUTION
// ============================================================================

function cleanData() {
  const xCol = elements.xColumn.value;
  const yCol = elements.yColumn.value;

  // Ensure user picked radio options
  const missingRadio = document.querySelector(
    'input[name="missingValues"]:checked'
  );
  const outlierRadio = document.querySelector('input[name="outliers"]:checked');
  const duplicateRadio = document.querySelector(
    'input[name="duplicates"]:checked'
  );

  if (!missingRadio || !outlierRadio) {
    alert(
      "Please choose how to handle missing values and outliers before cleaning."
    );
    return;
  }

  // Get user's cleaning choices
  const handleMissing = missingRadio.value;
  const handleOutliers = outlierRadio.value;

  // Read from radio buttons instead of hardcoding
  const removeDuplicates = duplicateRadio
    ? duplicateRadio.value === "remove"
    : true;
  const removeStrings = true; // Always remove strings

  // Temporarily disable to prevent double-click
  elements.cleanDataBtn.disabled = true;

  // Make API call to clean data
  cleanDataAPI(
    xCol,
    yCol,
    removeDuplicates,
    handleOutliers === "remove",
    handleMissing,
    removeStrings
  );
}

async function cleanDataAPI(
  xCol,
  yCol,
  removeDuplicates,
  removeOutliers,
  handleMissing,
  removeStrings
) {
  try {
    const formData = new FormData();
    const fileInput = document.getElementById("fileInput");
    const file = fileInput.files[0];

    formData.append("file", file);
    formData.append("x_column", xCol);
    formData.append("y_column", yCol);
    formData.append("remove_duplicates", removeDuplicates);
    formData.append("remove_outliers", removeOutliers);
    formData.append("handle_missing", handleMissing);
    formData.append("remove_strings", removeStrings);

    const response = await fetch(`${API_BASE_URL}/process-data`, {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      const result = await response.json();
      console.log("Full result:", result);

      // Show cleaning results
      showCleaningResults(result);

      // Show success toast with correct row count from backend
      const cleanedRowCount = result.file_info?.cleaned_shape?.[0] || 0;
      showSuccessToast("Data cleaned successfully!", cleanedRowCount);

      // Store for training page
      localStorage.setItem("trainingData", JSON.stringify(result));
      // Advance workflow state to step 2 (data processed)
      advanceStep(2, { trainingData: result });
    } else {
      const error = await response.json();
      showErrorToast("Error cleaning data: " + error.detail);
    }
  } catch (error) {
    showErrorToast("Error: " + error.message);
  } finally {
    // Reset button state
    elements.cleanDataBtn.disabled = false;
  }
}

function showCleaningResults(result) {
  // Update cleaning preview with actual results from backend response
  const originalRows = result.file_info?.original_shape?.[0] || 0;
  const cleanedRows = result.file_info?.cleaned_shape?.[0] || 0;
  const rowsRemoved = originalRows - cleanedRows;

  // Cleaning preview elements removed - no longer needed

  // Show the cleaning preview section
  const cleaningPreview = document.getElementById("cleaningPreview");
  if (cleaningPreview) {
    cleaningPreview.style.display = "block";
  }

  // Store cleaned data using correct backend response paths
  window.cleanedData = {
    x_values: result.statistics.x_data, // Correct path from backend
    y_values: result.statistics.y_data, // Correct path from backend
  };

  window.cleanedDataColumns = {
    x_column: result.columns?.x_column,
    y_column: result.columns?.y_column,
  };

  // Store the pre-calculated statistics from backend
  window.cleanedStats = {
    x_mean: result.statistics.x_mean,
    y_mean: result.statistics.y_mean,
    x_std: result.statistics.x_std,
    y_std: result.statistics.y_std,
  };

  // Enable the training button now that data is loaded
  const proceedBtn = document.getElementById('proceedToTrainBtn');
  if (proceedBtn) {
    proceedBtn.disabled = false;
    proceedBtn.textContent = 'Proceed to Model Training';
  }

  // Show visualization section and create charts
  showVisualizations();
}

// ============================================================================
// DATA VISUALIZATIONS
// ============================================================================

function showVisualizations() {
  // reveal the static section
  showVisualizationSection();

  // generate charts
  setTimeout(() => {
    createScatterPlot();
    createDensityPlot();
    createRangePlot();
    createStatisticalSummary();

    // Button is now in HTML - no need to insert dynamically
  }, 50);

  // Add proceed button and scroll (unchanged)
  setTimeout(
    () =>
      document
        .getElementById("visualizationSection")
        ?.scrollIntoView({ behavior: "smooth" }),
    300
  );
}

// ============================================================================
// TRAINING SETUP & NAVIGATION
// ============================================================================

function proceedToTraining() {
  advanceStep(2); // ensure state updated
  sessionStorage.setItem("navigatedFromPage", "upload");
  window.location.href = "/static/training.html";
}

// expose globally for inline HTML fallback
window.proceedToTraining = proceedToTraining;

// ============================================================================
// CHART THEME UPDATES
// ============================================================================

function updateChartColors() {
  // Recreate all charts with new theme colors
  if (window.cleanedData && window.cleanedDataColumns) {
    setTimeout(() => {
      createScatterPlot();
      createDensityPlot();
      createRangePlot();
      createStatisticalSummary();
    }, 100);
  }
}
