// goal-script.js

document.getElementById('calculateBtn').addEventListener('click', function() {
  const goalAmount = parseFloat(document.getElementById('goalAmount').value);
  const currentSavings = parseFloat(document.getElementById('currentSavings').value) || 0;
  const tenure = parseFloat(document.getElementById('tenure').value);
  const tenureType = document.getElementById('tenureType').value;
  const inflationRate = parseFloat(document.getElementById('inflationRate').value) || 0;

  if (!goalAmount || !tenure) {
    alert('Please fill all required fields');
    return;
  }

  let months = tenureType === 'years' ? tenure * 12 : tenure;
  let inflatedGoal = goalAmount * Math.pow(1 + (inflationRate / 100), tenureType === 'years' ? tenure : tenure / 12);
  let amountNeeded = inflatedGoal - currentSavings;
  let monthlySaving = amountNeeded / months;

  monthlySaving = Math.max(monthlySaving, 0);

  document.getElementById('suggestions').innerHTML = `
    <h3>Saving Plan:</h3>
    <p>Goal Amount (adjusted for inflation): ₹${inflatedGoal.toFixed(2)}</p>
    <p>Required Monthly Saving: ₹${monthlySaving.toFixed(2)}</p>
    <h3>Suggestion:</h3>
    <ul>
      <li>FD for short term (less than 2 years)</li>
      <li>RD if you want disciplined saving</li>
      <li>Mutual Funds (SIP) for long term (more than 2 years)</li>
    </ul>
  `;

  let savedAmount = currentSavings;
  let progress = (savedAmount / inflatedGoal) * 100;
  progress = Math.min(progress, 100);
  
  document.getElementById('progressFill').style.width = `${progress}%`;
  document.getElementById('progressText').textContent = `${progress.toFixed(1)}% achieved`;
});

// Dark mode toggle
const darkToggle = document.getElementById('darkToggle');

darkToggle.addEventListener('change', () => {
  document.body.classList.toggle('dark-mode', darkToggle.checked);
});
