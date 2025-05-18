// Configuration
const CONFIG = {
  workingCapitalMin: 30,
  workingCapitalMax: 100,
  machineryLoanMin: 10,
  machineryLoanMax: 100,
  businessTypesFile: './data/business-types.json',
  rawMaterialsFile: './data/raw-materials.json',
  languagesFolder: './languages/'
};

// Global variables
let currentLanguage = 'en';
let translations = {};
let businessTypes = [];
let rawMaterialsData = {};

// Initialize the application
async function initApp() {
  await loadLanguageFiles();
  await loadBusinessData();
  setupEventListeners();
  populateBusinessDropdown();
  updateUI();
}

// Load language files
async function loadLanguageFiles() {
  try {
    const response = await fetch(`${CONFIG.languagesFolder}${currentLanguage}.json`);
    translations = await response.json();
  } catch (error) {
    console.error("Error loading language file:", error);
    showError("Failed to load language translations");
  }
}

// Load business data files
async function loadBusinessData() {
  try {
    // Load business types
    const typesResponse = await fetch(CONFIG.businessTypesFile);
    const typesJson = await typesResponse.json();
    businessTypes = typesJson.businesses;
    
    // Load raw materials
    const materialsResponse = await fetch(CONFIG.rawMaterialsFile);
    rawMaterialsData = await materialsResponse.json();
    
  } catch (error) {
    console.error("Error loading business data:", error);
    showError("Failed to load business data files");
  }
}

// Setup event listeners
function setupEventListeners() {
  document.getElementById('generate-plan').addEventListener('click', generatePlan);
  document.getElementById('download-pdf').addEventListener('click', downloadPDF);
  document.getElementById('language-selector').addEventListener('change', async function() {
    currentLanguage = this.value;
    await loadLanguageFiles();
    updateUI();
    populateBusinessDropdown();
  });
}

// Populate business type dropdown
function populateBusinessDropdown() {
  const dropdown = document.getElementById('business-type');
  dropdown.innerHTML = `<option value="">${getTranslation('labels.selectBusiness', '-- Select --')}</option>`;
  
  businessTypes.forEach(business => {
    const option = document.createElement('option');
    option.value = business.id;
    option.textContent = getTranslation(`businessTypes.${business.id}`, business.name);
    dropdown.appendChild(option);
  });
}

// Get translation with fallback
function getTranslation(key, fallback) {
  const keys = key.split('.');
  let value = translations;
  
  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) return fallback;
  }
  return value || fallback;
}

// Update UI elements with translations
function updateUI() {
  // Form labels
  document.getElementById('title').textContent = getTranslation('title', 'Business Plan Generator');
  document.getElementById('lbl-business-name').textContent = getTranslation('labels.businessName', 'Business Name');
  document.getElementById('lbl-business-type').textContent = getTranslation('labels.businessType', 'Business Type');
  document.getElementById('lbl-production-capacity').textContent = getTranslation('labels.productionCapacity', 'Daily Production');
  document.getElementById('lbl-selling-price').textContent = getTranslation('labels.sellingPrice', 'Selling Price');
  document.getElementById('lbl-machinery-cost').textContent = getTranslation('labels.machineryCost', 'Machinery Cost');
  document.getElementById('lbl-working-capital').textContent = getTranslation('labels.workingCapital', 'Working Capital %');
  document.getElementById('lbl-machinery-loan').textContent = getTranslation('labels.machineryLoan', 'Machinery Loan %');
  
  // Buttons
  document.getElementById('generate-plan').textContent = getTranslation('buttons.generatePlan', 'Generate Plan');
  document.getElementById('download-pdf').textContent = getTranslation('buttons.downloadPdf', 'Download PDF');
  
  // Results section
  document.getElementById('results-title').textContent = getTranslation('titles.results', 'Your Business Plan');
}

// Generate business plan
async function generatePlan() {
  try {
    const inputs = getInputValues();
    if (!validateInputs(inputs)) return;
    
    const business = businessTypes.find(b => b.id === inputs.businessType);
    if (!business) {
      showError(getTranslation('errors.businessNotFound', 'Business type not found'));
      return;
    }
    
    const materials = rawMaterialsData.rawMaterials[inputs.businessType];
    if (!materials) {
      showError(getTranslation('errors.materialsNotFound', 'Materials data not found'));
      return;
    }
    
    const calculations = calculateFinancials(inputs, materials);
    displayResults(inputs, calculations, business);
    document.getElementById('results').classList.remove('hidden');
    
  } catch (error) {
    console.error("Error generating plan:", error);
    showError(getTranslation('errors.calculationError', 'Error generating plan'));
  }
}

// Calculate financials
function calculateFinancials(inputs, materials) {
  // Raw material calculations
  let materialCostPerDay = 0;
  const materialDetails = materials.map(item => {
    const quantity = item.quantity_per_unit * inputs.productionCapacity;
    const wastage = quantity * (item.wastage_percent / 100);
    const cost = (quantity + wastage) * item.rate;
    materialCostPerDay += cost;
    
    return {
      name: item.name,
      rate: item.rate,
      quantity: quantity,
      wastage: wastage,
      cost: cost,
      category: item.category
    };
  });

  // Working capital calculations
  const workingCapitalPerDay = (materialCostPerDay * 0.3); // 30% of material cost
  const workingCapitalContribution = (inputs.workingCapitalPercent / 100) * workingCapitalPerDay * 30;
  const workingCapitalLoan = (workingCapitalPerDay * 30) - workingCapitalContribution;

  // Machinery financing
  const machineryLoan = (inputs.machineryLoanPercent / 100) * inputs.machineryCost;
  const ownContribution = inputs.machineryCost - machineryLoan;

  // Profit calculations
  const dailyRevenue = inputs.productionCapacity * inputs.sellingPrice;
  const dailyCost = materialCostPerDay + workingCapitalPerDay;
  const dailyProfit = dailyRevenue - dailyCost;
  const breakEvenDays = dailyProfit <= 0 ? Infinity : (inputs.machineryCost / dailyProfit);

  return {
    materialDetails,
    materialCostPerDay,
    workingCapitalContribution,
    workingCapitalLoan,
    machineryLoan,
    ownContribution,
    dailyRevenue,
    dailyCost,
    dailyProfit,
    breakEvenDays,
    monthlyProfit: dailyProfit * 30,
    annualProfit: dailyProfit * 365
  };
}

// Display results
function displayResults(inputs, calculations, business) {
  const output = document.getElementById('dpr-output');
  output.innerHTML = '';

  // Header
  const header = document.createElement('div');
  header.innerHTML = `
    <h3>${inputs.businessName} (${getTranslation(`businessTypes.${business.id}`, business.name)})</h3>
    <p><strong>${getTranslation('labels.date', 'Date')}:</strong> ${new Date().toLocaleDateString()}</p>
    <p><strong>${getTranslation('labels.dailyProduction', 'Daily Production')}:</strong> 
    ${inputs.productionCapacity} ${getTranslation('labels.units', 'units')}</p>
  `;
  output.appendChild(header);

  // Raw Materials Table
  const materialsTable = createTable(
    getTranslation('tables.rawMaterials', 'Raw Materials'),
    [
      getTranslation('tables.material', 'Material'),
      getTranslation('tables.rate', 'Rate'),
      getTranslation('tables.quantity', 'Quantity'),
      getTranslation('tables.wastage', 'Wastage'),
      getTranslation('tables.cost', 'Cost'),
      getTranslation('tables.category', 'Category')
    ],
    calculations.materialDetails.map(item => [
      item.name,
      `₹${item.rate.toFixed(2)}`,
      item.quantity.toFixed(2),
      item.wastage.toFixed(2),
      `₹${item.cost.toFixed(2)}`,
      item.category
    ]),
    `${getTranslation('tables.totalRawMaterialCost', 'Total Raw Material Cost')}: ₹${calculations.materialCostPerDay.toFixed(2)}`
  );
  output.appendChild(materialsTable);

  // Financial Summary Table
  const financialTable = createTable(
    getTranslation('tables.financialProjections', 'Financial Projections'),
    [
      getTranslation('tables.category', 'Category'),
      getTranslation('tables.amount', 'Amount')
    ],
    [
      [getTranslation('tables.machineryCost', 'Machinery Cost'), `₹${inputs.machineryCost.toLocaleString()}`],
      [getTranslation('tables.workingCapital', 'Working Capital (Monthly)'), `₹${(calculations.materialCostPerDay * 30).toLocaleString()}`],
      [`${getTranslation('tables.workingCapitalContribution', 'Working Capital Contribution')} (${inputs.workingCapitalPercent}%)`, `₹${calculations.workingCapitalContribution.toLocaleString()}`],
      [getTranslation('tables.workingCapitalLoan', 'Working Capital Loan'), `₹${calculations.workingCapitalLoan.toLocaleString()}`],
      [`${getTranslation('tables.machineryLoan', 'Machinery Loan')} (${inputs.machineryLoanPercent}%)`, `₹${calculations.machineryLoan.toLocaleString()}`],
      [getTranslation('tables.ownContribution', 'Own Contribution'), `₹${calculations.ownContribution.toLocaleString()}`],
      [getTranslation('tables.totalInvestment', 'Total Investment'), `₹${(inputs.machineryCost + (calculations.materialCostPerDay * 30)).toLocaleString()}`]
    ]
  );
  output.appendChild(financialTable);

  // Profit/Loss Table
  const profitClass = calculations.dailyProfit >= 0 ? 'profit' : 'loss';
  const profitText = calculations.dailyProfit >= 0 ? 
    getTranslation('tables.profit', 'Profit') : 
    getTranslation('tables.loss', 'Loss');

  const profitLossTable = document.createElement('div');
  profitLossTable.className = 'profit-loss';
  profitLossTable.innerHTML = `
    <h4>${getTranslation('tables.profitLoss', 'Profit/Loss Projections')}</h4>
    ${createTableHTML(
      [
        getTranslation('tables.metric', 'Metric'),
        getTranslation('tables.daily', 'Daily'),
        getTranslation('tables.monthly', 'Monthly'),
        getTranslation('tables.annual', 'Annual')
      ],
      [
        [getTranslation('tables.revenue', 'Revenue'), 
         `₹${calculations.dailyRevenue.toFixed(2)}`, 
         `₹${(calculations.dailyRevenue * 30).toFixed(2)}`, 
         `₹${(calculations.dailyRevenue * 365).toFixed(2)}`],
        [getTranslation('tables.totalCost', 'Total Cost'), 
         `₹${calculations.dailyCost.toFixed(2)}`, 
         `₹${(calculations.dailyCost * 30).toFixed(2)}`, 
         `₹${(calculations.dailyCost * 365).toFixed(2)}`],
        [`<span class="${profitClass}">${profitText}</span>`, 
         `₹${Math.abs(calculations.dailyProfit).toFixed(2)}`, 
         `₹${Math.abs(calculations.monthlyProfit).toFixed(2)}`, 
         `₹${Math.abs(calculations.annualProfit).toFixed(2)}`]
      ]
    )}
  `;
  output.appendChild(profitLossTable);

  // Break-even Analysis
  const breakEvenDiv = document.createElement('div');
  breakEvenDiv.className = 'break-even';
  breakEvenDiv.innerHTML = `
    <h4>${getTranslation('tables.breakEvenAnalysis', 'Break-Even Analysis')}</h4>
    <p>
      ${calculations.breakEvenDays === Infinity ? 
        getTranslation('explanations.noBreakEven', 'Cannot calculate break-even (business is not profitable)') : 
        `${getTranslation('explanations.breakEvenText', 'You will recover your machinery investment in')} 
        <strong>${calculations.breakEvenDays.toFixed(1)}</strong> 
        ${getTranslation('explanations.days', 'days')}.`}
    </p>
  `;
  output.appendChild(breakEvenDiv);

  // Financial Explanation
  const explanationDiv = document.getElementById('financial-explanation');
  explanationDiv.innerHTML = `
    <h4>${getTranslation('explanations.financialSummary', 'Financial Summary')}</h4>
    ${calculations.dailyProfit < 0 ? `
      <div class="warning">
        <p>${getTranslation('explanations.lossWarning', 'Your business is projected to make a loss because:')}</p>
        <ul>
          <li>${getTranslation('explanations.costHigherThanRevenue', 'Your costs are higher than revenue')}</li>
          <li>${getTranslation('explanations.dailyLoss', 'Daily loss').replace('{amount}', `₹${Math.abs(calculations.dailyProfit).toFixed(2)}`)}</li>
        </ul>
        <p>${getTranslation('explanations.considerOptions', 'Consider these options:')}</p>
        <ul>
          <li>${getTranslation('explanations.increasePrice', 'Increase selling price')}</li>
          <li>${getTranslation('explanations.reduceCosts', 'Reduce raw material costs')}</li>
          <li>${getTranslation('explanations.increaseVolume', 'Increase production volume')}</li>
        </ul>
      </div>
    ` : `
      <div class="success">
        <p>${getTranslation('explanations.profitMessage', 'Your business is projected to be profitable!')}</p>
        <ul>
          <li>${getTranslation('explanations.dailyProfit', 'Daily profit').replace('{amount}', `₹${calculations.dailyProfit.toFixed(2)}`)}</li>
          <li>${getTranslation('explanations.monthlyProfit', 'Monthly profit').replace('{amount}', `₹${calculations.monthlyProfit.toFixed(2)}`)}</li>
        </ul>
      </div>
    `}
    <div class="investment-info">
      <h5>${getTranslation('explanations.investmentBreakdown', 'Investment Breakdown')}:</h5>
      <ul>
        <li>${getTranslation('explanations.machineryInvestment', 'Machinery Investment').replace('{amount}', `₹${inputs.machineryCost.toLocaleString()}`)}</li>
        <li>${getTranslation('explanations.workingCapitalNeeded', 'Working Capital Needed (1 month)').replace('{amount}', `₹${(calculations.materialCostPerDay * 30).toLocaleString()}`)}</li>
        <li>${getTranslation('explanations.totalInvestment', 'Total Investment').replace('{amount}', `₹${(inputs.machineryCost + (calculations.materialCostPerDay * 30)).toLocaleString()}`)}</li>
      </ul>
    </div>
  `;
}

// Helper function to create tables
function createTable(title, headers, rows, footer = '') {
  const tableDiv = document.createElement('div');
  tableDiv.innerHTML = `
    <h4>${title}</h4>
    ${createTableHTML(headers, rows, footer)}
  `;
  return tableDiv;
}

function createTableHTML(headers, rows, footer = '') {
  return `
    <table>
      <thead>
        <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
      </thead>
      <tbody>
        ${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
        ${footer ? `<tr class="total-row"><td colspan="${headers.length - 1}"><strong>${footer.split(':')[0]}:</strong></td><td><strong>${footer.split(':')[1]}</strong></td></tr>` : ''}
      </tbody>
    </table>
  `;
}

// Download PDF
function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(getTranslation('title', 'Business Plan Generator'), 105, 15, { align: "center" });
  
  // Date
  doc.setFontSize(12);
  doc.text(`${getTranslation('labels.date', 'Date')}: ${new Date().toLocaleDateString()}`, 105, 25, { align: "center" });
  
  // Content
  const content = document.getElementById('dpr-output');
  const tables = content.getElementsByTagName('table');
  
  let yPos = 35;
  
  // Add each table to PDF
  Array.from(tables).forEach(table => {
    const headers = [];
    const rows = [];
    
    // Extract headers
    const headerCells = table.querySelectorAll('thead th');
    headerCells.forEach(header => {
      headers.push(header.textContent);
    });
    
    // Extract rows
    const dataRows = table.querySelectorAll('tbody tr');
    dataRows.forEach(row => {
      const rowData = [];
      row.querySelectorAll('td').forEach(cell => {
        rowData.push(cell.textContent.replace('₹', ''));
      });
      if (rowData.length > 0) rows.push(rowData);
    });
    
    // Add table to PDF
    doc.autoTable({
      head: [headers],
      body: rows,
      startY: yPos,
      theme: "grid",
      headStyles: { 
        fillColor: [41, 128, 185], 
        textColor: 255,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 9,
        cellPadding: 4
      }
    });
    
    yPos = doc.lastAutoTable.finalY + 15;
  });
  
  // Save PDF
  doc.save(`${getTranslation('title', 'Business_Plan')}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

// Get input values
function getInputValues() {
  return {
    businessName: document.getElementById('business-name').value,
    businessType: document.getElementById('business-type').value,
    productionCapacity: parseFloat(document.getElementById('production-capacity').value),
    sellingPrice: parseFloat(document.getElementById('selling-price').value),
    machineryCost: parseFloat(document.getElementById('machinery-cost').value),
    workingCapitalPercent: parseFloat(document.getElementById('working-capital-percent').value),
    machineryLoanPercent: parseFloat(document.getElementById('machinery-loan-percent').value)
  };
}

// Validate inputs
function validateInputs(inputs) {
  if (!inputs.businessName || !inputs.businessType) {
    showError(getTranslation('errors.requiredFields', 'Please fill all required fields'));
    return false;
  }

  if (isNaN(inputs.productionCapacity) || inputs.productionCapacity <= 0) {
    showError(getTranslation('errors.invalidProduction', 'Invalid production capacity'));
    return false;
  }

  if (inputs.workingCapitalPercent < CONFIG.workingCapitalMin || 
      inputs.workingCapitalPercent > CONFIG.workingCapitalMax) {
    showError(getTranslation('errors.workingCapitalRange', 'Working capital must be between {min}% and {max}%')
      .replace('{min}', CONFIG.workingCapitalMin)
      .replace('{max}', CONFIG.workingCapitalMax));
    return false;
  }

  if (inputs.machineryLoanPercent < CONFIG.machineryLoanMin || 
      inputs.machineryLoanPercent > CONFIG.machineryLoanMax) {
    showError(getTranslation('errors.machineryLoanRange', 'Machinery loan must be between {min}% and {max}%')
      .replace('{min}', CONFIG.machineryLoanMin)
      .replace('{max}', CONFIG.machineryLoanMax));
    return false;
  }

  return true;
}

// Show error message
function showError(message) {
  alert(message);
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);