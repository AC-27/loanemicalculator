function calculateEMI(P, R, N) {
  let r = R / (12 * 100);
  return (P * r * Math.pow(1 + r, N)) / (Math.pow(1 + r, N) - 1);
}

function calculate() {
  let loanAmount = parseFloat(document.getElementById('loanAmount').value);
  let interestRate = parseFloat(document.getElementById('interestRate').value);
  let loanTenure = parseInt(document.getElementById('loanTenure').value);
  let prepayment = parseFloat(document.getElementById('prepaymentAmount').value);
  let prepaymentMonth = parseInt(document.getElementById('prepaymentMonth').value);

  let r = interestRate / (12 * 100);
  let emi = calculateEMI(loanAmount, interestRate, loanTenure);

  let balance = loanAmount;
  let totalInterest = 0;
  let schedule = [];

  for (let i = 1; i <= loanTenure; i++) {
    let interest = balance * r;
    let principal = emi - interest;
    balance -= principal;
    totalInterest += interest;
    schedule.push({ month: i, balance: balance });

    if (i === prepaymentMonth) {
      balance -= prepayment;
    }

    if (balance <= 0) {
      schedule.push({ month: i, balance: 0 });
      break;
    }
  }

  let balance2 = loanAmount;
  let totalInterest2 = 0;
  let schedule2 = [];

  for (let i = 1; i <= loanTenure; i++) {
    let interest = balance2 * r;
    let principal = emi - interest;
    balance2 -= principal;
    totalInterest2 += interest;
    schedule2.push({ month: i, balance: balance2 });

    if (balance2 <= 0) break;
  }

  document.getElementById('originalInterest').textContent = totalInterest2.toFixed(2);
  document.getElementById('newInterest').textContent = totalInterest.toFixed(2);
  document.getElementById('interestSaved').textContent = (totalInterest2 - totalInterest).toFixed(2);
  document.getElementById('monthsSaved').textContent = (schedule2.length - schedule.length);

  drawChart(schedule2, schedule);
}

function drawChart(original, prepay) {
  const ctx = document.getElementById('prepaymentChart').getContext('2d');
  if (window.myChart) window.myChart.destroy();

  const isDark = document.body.classList.contains('dark');
  const fontColor = isDark ? '#ffffff' : '#000000';

  window.myChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: original.map(e => 'Month ' + e.month),
      datasets: [
        {
          label: 'Original',
          data: original.map(e => e.balance),
          borderColor: 'red',
          borderWidth: 2,
          fill: false
        },
        {
          label: 'With Prepayment',
          data: prepay.map(e => e.balance),
          borderColor: 'green',
          borderWidth: 2,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: fontColor },
          position: 'bottom'
        },
        title: {
          display: true,
          text: 'Loan Balance Comparison',
          color: fontColor
        }
      },
      scales: {
        x: {
          ticks: { color: fontColor },
          grid: { color: isDark ? '#555' : '#ddd' }
        },
        y: {
          ticks: { color: fontColor },
          grid: { color: isDark ? '#555' : '#ddd' }
        }
      }
    }
  });
}

function resetForm() {
  const fields = ['loanAmount', 'interestRate', 'loanTenure', 'prepaymentAmount', 'prepaymentMonth'];
  fields.forEach(id => document.getElementById(id).value = '');
  document.getElementById('originalInterest').textContent = '';
  document.getElementById('newInterest').textContent = '';
  document.getElementById('interestSaved').textContent = '';
  document.getElementById('monthsSaved').textContent = '';
  if (window.myChart) window.myChart.destroy();
}

function toggleDarkMode() {
  document.body.classList.toggle('dark');
  if (window.myChart) {
    calculate(); // Redraw chart with new dark mode settings
  }
}
