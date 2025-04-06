const translations = {
  en: {
    principal: "Principal Amount",
    interest: "Interest Amount",
    month: "Month",
    emi: "Your EMI is",
    totalInterest: "Total Interest",
    totalPayment: "Total Payment",
    download: "Download EMI Chart (PDF)"
  },
  hi: {
    principal: "मुख्य राशि",
    interest: "ब्याज राशि",
    month: "महीना",
    emi: "आपकी ईएमआई है",
    totalInterest: "कुल ब्याज",
    totalPayment: "कुल भुगतान",
    download: "ईएमआई चार्ट (पीडीएफ) डाउनलोड करें"
  },
  bn: {
    principal: "প্রধান পরিমাণ",
    interest: "সুদ পরিমাণ",
    month: "মাস",
    emi: "আপনার ইএমআই হল",
    totalInterest: "মোট সুদ",
    totalPayment: "মোট পেমেন্ট",
    download: "ইএমআই চার্ট (পিডিএফ) ডাউনলোড করুন"
  },
  as: {
    principal: "মূল পৰিমাণ",
    interest: "সুদৰ পৰিমাণ",
    month: "মাহ",
    emi: "আপোনাৰ ইএমআই হৈছে",
    totalInterest: "মুঠ সুদ",
    totalPayment: "মুঠ পৰিশোধ",
    download: "ইএমআই চাৰ্ট (PDF) ডাউনলোড কৰক"
  }
};

let pieChartInstance = null;
let monthlyChartInstance = null;

document.getElementById('calculateBtn').addEventListener('click', () => {
  const principal = parseFloat(document.getElementById('principal').value);
  const rate = parseFloat(document.getElementById('rate').value) / 1200;
  const tenure = parseInt(document.getElementById('tenure').value);
  const language = document.getElementById('chartLanguage').value;

  if (isNaN(principal) || isNaN(rate) || isNaN(tenure) || principal <= 0 || rate <= 0 || tenure <= 0) {
    alert('Please enter valid values.');
    return;
  }

  const emi = Math.round((principal * rate * Math.pow(1 + rate, tenure)) / (Math.pow(1 + rate, tenure) - 1));
  const totalPayment = emi * tenure;
  const interestAmount = totalPayment - principal;

  document.getElementById('resultContainer').innerHTML = `
    <div class="card">
      <h3 class="result-title emi-title">${translations[language].emi}</h3>
      <p class="amount emi-amount">₹${emi}</p>
    </div>
    <div class="card">
      <h3 class="result-title interest-title">${translations[language].totalInterest}</h3>
      <p class="amount interest-amount">₹${interestAmount}</p>
    </div>
    <div class="card">
      <h3 class="result-title payment-title">${translations[language].totalPayment}</h3>
      <p class="amount payment-amount">₹${totalPayment}</p>
    </div>
  `;

  applyDarkModeStyling(); // Ensure colors are correct even if dark mode was already on

  updatePieChart(principal, interestAmount, language);
  const emiData = updateMonthlyChart(tenure, principal, interestAmount, emi, rate, language);
  addDownloadButton(tenure, principal, interestAmount, emiData, language);
  updateSharingLinks(principal, interestAmount, totalPayment, emi);
});

function updatePieChart(principal, interestAmount, language) {
  const ctxPie = document.getElementById('pieChart').getContext('2d');
  if (pieChartInstance) pieChartInstance.destroy();

  pieChartInstance = new Chart(ctxPie, {
    type: 'pie',
    data: {
      labels: [translations[language].principal, translations[language].interest],
      datasets: [{
        data: [principal, interestAmount],
        backgroundColor: ['#007bff', '#ff6600']
      }]
    }
  });
}

function updateMonthlyChart(tenure, principal, interestAmount, emi, rate, language) {
  const ctxMonthly = document.getElementById('monthlyChart').getContext('2d');
  if (monthlyChartInstance) monthlyChartInstance.destroy();

  let remainingPrincipal = principal;
  const monthlyPrincipal = [];
  const monthlyInterest = [];
  const emiData = [];

  for (let i = 0; i < tenure; i++) {
    const interest = Math.round(remainingPrincipal * rate);
    const principalComponent = Math.round(emi - interest);
    monthlyInterest.push(interest);
    monthlyPrincipal.push(principalComponent);
    emiData.push([i + 1, emi, principalComponent, interest]);
    remainingPrincipal -= principalComponent;
  }

  monthlyChartInstance = new Chart(ctxMonthly, {
    type: 'bar',
    data: {
      labels: Array.from({ length: tenure }, (_, i) => `${translations[language].month} ${i + 1}`),
      datasets: [
        { label: translations[language].principal, data: monthlyPrincipal, backgroundColor: '#007bff' },
        { label: translations[language].interest, data: monthlyInterest, backgroundColor: '#ff6600' }
      ]
    }
  });

  return emiData;
}

function addDownloadButton(tenure, principal, interestAmount, emiData, language) {
  const area = document.getElementById('downloadArea');
  area.innerHTML = '';

  const btn = document.createElement('button');
  btn.id = 'downloadButton';
  btn.innerHTML = `<i class="fas fa-file-pdf"></i> ${translations[language].download}`;
  btn.onclick = () => generatePDF(tenure, principal, interestAmount, emiData, language);

  area.appendChild(btn);
}

function generatePDF(tenure, principal, interestAmount, emiData, language) {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();
  pdf.setFontSize(18);
  pdf.text("EMI Chart", 14, 20);
  pdf.setFontSize(12);
  pdf.text(`Principal Amount: ₹${principal}`, 14, 30);
  pdf.text(`Interest Amount: ₹${interestAmount}`, 14, 40);
  pdf.text(`Total Payment: ₹${principal + interestAmount}`, 14, 50);
  pdf.text("Breakup:", 14, 60);

  pdf.autoTable({
    head: [["Month", "EMI (₹)", "Principal (₹)", "Interest (₹)"]],
    body: emiData,
    startY: 70
  });

  pdf.save("EMI_Chart.pdf");
}

document.getElementById('darkToggle').addEventListener('change', () => {
  const isDark = document.getElementById('darkToggle').checked;
  document.body.classList.toggle('dark-mode', isDark);
  document.getElementById('calculateBtn').classList.toggle('dark-mode-btn', isDark);
  document.getElementById('resetBtn').classList.toggle('dark-mode-reset', isDark);
  applyDarkModeStyling();
});

function applyDarkModeStyling() {
  const isDark = document.getElementById('darkToggle').checked;

  const emiTitle = document.querySelector('.emi-title');
  const interestTitle = document.querySelector('.interest-title');
  const paymentTitle = document.querySelector('.payment-title');

  const emiAmount = document.querySelector('.emi-amount');
  const interestAmount = document.querySelector('.interest-amount');
  const paymentAmount = document.querySelector('.payment-amount');

  if (emiTitle) emiTitle.style.color = isDark ? '#00e5ff' : '';
  if (interestTitle) interestTitle.style.color = isDark ? '#ffeb3b' : '';
  if (paymentTitle) paymentTitle.style.color = isDark ? '#76ff03' : '';

  if (emiAmount) emiAmount.style.color = isDark ? '#00e5ff' : '';
  if (interestAmount) interestAmount.style.color = isDark ? '#ffeb3b' : '';
  if (paymentAmount) paymentAmount.style.color = isDark ? '#76ff03' : '';
}

function updateSharingLinks(principal, interest, total, emi) {
  const userMessage = encodeURIComponent(
    `Try this amazing EMI Calculator to plan your loans smartly!\n\nLoan: ₹${principal}\nEMI: ₹${emi}\nInterest: ₹${interest}\nTotal: ₹${total}`
  );
  const pageUrl = encodeURIComponent("https://ac-27.github.io/loanemicalculator/");

  document.getElementById('shareEmail').href = `mailto:?subject=EMI Calculator&body=${userMessage}%0A%0ACheck it out here: ${pageUrl}`;
  document.getElementById('shareWhatsapp').href = `https://wa.me/?text=${userMessage}%0A%0ACheck it out here: ${pageUrl}`;
  document.getElementById('shareFacebook').href = `https://www.facebook.com/sharer/sharer.php?u=${pageUrl}&quote=${userMessage}`;
  document.getElementById('shareX').href = `https://twitter.com/intent/tweet?text=${userMessage}&url=${pageUrl}`;
}

document.getElementById('resetBtn').addEventListener('click', () => {
  document.getElementById('principal').value = '';
  document.getElementById('rate').value = '';
  document.getElementById('tenure').value = '';
  document.getElementById('resultContainer').innerHTML = '';
  document.getElementById('downloadArea').innerHTML = '';
  if (pieChartInstance) pieChartInstance.destroy();
  if (monthlyChartInstance) monthlyChartInstance.destroy();
});
