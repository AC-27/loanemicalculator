let chart;

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById('calculator-form').addEventListener('submit', function (e) {
    e.preventDefault();
    calculateSolar();
  });

  document.getElementById('darkToggle').addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
  });

  // Show sample result on load
  document.getElementById('bill').value = 2000;
  document.getElementById('roofSize').value = 500;
  calculateSolar();
});

function calculateSolar() {
  const bill = parseFloat(document.getElementById('bill').value);
  const area = parseFloat(document.getElementById('roofSize').value);
  const offset = parseFloat(document.getElementById('offset').value);
  const region = document.getElementById('location').value;

  const costPerKW = 50000;
  const costPerSqFt = 1.2;
  const efficiency = 0.18;
  const subsidyPercent = getSubsidy(region);

  const usableKW = (area * costPerSqFt * efficiency * offset) / 1000;
  const estimatedCost = usableKW * costPerKW;
  const subsidy = (estimatedCost * subsidyPercent) / 100;
  const finalCost = estimatedCost - subsidy;

  const monthlySavings = bill * (offset / 100);
  const annualSavings = monthlySavings * 12;

  document.getElementById('systemSize').innerText = usableKW.toFixed(2) + ' kW';
  document.getElementById('totalCost').innerText = '₹' + estimatedCost.toLocaleString();
  document.getElementById('subsidy').innerText = '₹' + subsidy.toLocaleString();
  document.getElementById('netCost').innerText = '₹' + finalCost.toLocaleString();
  document.getElementById('annualSavings').innerText = annualSavings.toLocaleString();
  document.getElementById('totalSavings').innerText = (annualSavings * 25).toLocaleString();

  const savings = [], withoutSolar = [], labels = [];
  for (let i = 1; i <= 25; i++) {
    labels.push(`Year ${i}`);
    savings.push((annualSavings * i).toFixed(0));
    withoutSolar.push((bill * 12 * i).toFixed(0));
  }

  drawBarChart(labels, savings, withoutSolar);
}

function getSubsidy(region) {
  switch (region) {
    case 'north': return 40;
    case 'south': return 30;
    case 'east': return 35;
    case 'west': return 25;
    default: return 20;
  }
}

function drawBarChart(labels, withSolar, withoutSolar) {
  const ctx = document.getElementById('resultChart').getContext('2d');
  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'With Solar Savings (₹)',
          data: withSolar,
          backgroundColor: '#28a745'
        },
        {
          label: 'Without Solar (₹)',
          data: withoutSolar,
          backgroundColor: '#dc3545'
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: value => `₹${value.toLocaleString()}`
          }
        }
      }
    }
  });
}

function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Solar Cost Estimation Report", 10, 10);
  doc.setFontSize(12);

  const labels = chart.data.labels;
  const withSolar = chart.data.datasets[0].data;
  const withoutSolar = chart.data.datasets[1].data;

  // Create table
  const tableData = labels.map((label, i) => [
    label,
    `₹${Number(withSolar[i]).toLocaleString()}`,
    `₹${Number(withoutSolar[i]).toLocaleString()}`
  ]);

  doc.autoTable({
    startY: 20,
    head: [['Year', 'With Solar', 'Without Solar']],
    body: tableData,
    theme: 'striped'
  });

  doc.addPage();
  const chartCanvas = document.getElementById("resultChart");
  const chartImg = chartCanvas.toDataURL("image/png", 1.0);
  doc.addImage(chartImg, "PNG", 10, 20, 180, 90);

  doc.save("Solar_Estimation_Report.pdf");
}
