document.addEventListener('DOMContentLoaded', function() {
    // Initialize variables
    let annualCostChart = null;
    let cumulativeCostChart = null;
    
    // Check if Chart is loaded
    if (typeof Chart === 'undefined') {
        alert('Chart.js library failed to load. Please check your internet connection and refresh the page.');
        return;
    }

    const calculateBtn = document.getElementById('calculateBtn');
    const resetBtn = document.getElementById('resetBtn');
    
    if (!calculateBtn || !resetBtn) {
        alert('Error: Buttons not found!');
        return;
    }

    calculateBtn.addEventListener('click', calculateComparison);
    resetBtn.addEventListener('click', resetCalculator);
    
    // Update fuel header when selection changes
    const fuelType = document.getElementById('fuelType');
    if (fuelType) {
        fuelType.addEventListener('change', updateFuelHeaders);
        updateFuelHeaders(); // Initialize headers
    }

    function updateFuelHeaders() {
        const fuelHeaders = document.querySelectorAll('[id^="fuelHeader"]');
        const fuelText = fuelType.value === 'petrol' ? 'Petrol Vehicle' : 'Diesel Vehicle';
        fuelHeaders.forEach(header => {
            header.textContent = fuelText;
        });
    }

    function resetCalculator() {
        // Reset all input fields to their default values
        document.getElementById('distance').value = '50';
        document.getElementById('days').value = '5';
        document.getElementById('years').value = '5';
        document.getElementById('fuelType').value = 'petrol';
        document.getElementById('fuelPrice').value = '100';
        document.getElementById('fuelEfficiency').value = '15';
        document.getElementById('fuelCarPrice').value = '800000';
        document.getElementById('fuelMaintenance').value = '15000';
        document.getElementById('electricityPrice').value = '8';
        document.getElementById('evEfficiency').value = '8';
        document.getElementById('evCarPrice').value = '1200000';
        document.getElementById('evMaintenance').value = '5000';
        document.getElementById('batteryReplacement').value = '150000';
        document.getElementById('subsidy').value = '150000';
        
        // Hide results and show initial message
        document.getElementById('results').style.display = 'none';
        document.getElementById('initialMessage').style.display = 'block';
        
        // Reset charts if they exist
        if (annualCostChart) {
            annualCostChart.destroy();
            annualCostChart = null;
        }
        if (cumulativeCostChart) {
            cumulativeCostChart.destroy();
            cumulativeCostChart = null;
        }
        
        // Update fuel headers
        updateFuelHeaders();
    }

    function calculateComparison() {
        try {
            // Get all input values
            const inputs = {
                dailyDistance: getNumberValue('distance', 50),
                daysPerWeek: getNumberValue('days', 5),
                years: getNumberValue('years', 5),
                fuelType: document.getElementById('fuelType').value,
                fuelPrice: getNumberValue('fuelPrice', 100),
                fuelEfficiency: getNumberValue('fuelEfficiency', 15),
                fuelCarPrice: getNumberValue('fuelCarPrice', 800000),
                fuelMaintenance: getNumberValue('fuelMaintenance', 15000),
                electricityPrice: getNumberValue('electricityPrice', 8),
                evEfficiency: getNumberValue('evEfficiency', 8),
                evCarPrice: getNumberValue('evCarPrice', 1200000),
                evMaintenance: getNumberValue('evMaintenance', 5000),
                batteryReplacement: getNumberValue('batteryReplacement', 150000),
                subsidy: getNumberValue('subsidy', 150000)
            };

            // Calculate distances
            const weeklyDistance = inputs.dailyDistance * inputs.daysPerWeek;
            const annualDistance = weeklyDistance * 52;
            
            // Calculate fuel costs
            const annualFuelConsumption = annualDistance / inputs.fuelEfficiency;
            const annualFuelCost = annualFuelConsumption * inputs.fuelPrice;
            const totalFuelCost = annualFuelCost * inputs.years;
            const totalFuelMaintenance = inputs.fuelMaintenance * inputs.years;
            const totalFuelExpense = inputs.fuelCarPrice + totalFuelCost + totalFuelMaintenance;
            
            // Calculate EV costs
            const annualElectricityConsumption = annualDistance / inputs.evEfficiency;
            const annualEvCost = annualElectricityConsumption * inputs.electricityPrice;
            const totalEvCost = annualEvCost * inputs.years;
            const totalEvMaintenance = inputs.evMaintenance * inputs.years;
            
            // Calculate battery replacement (only if years > 8)
            const batteryCost = inputs.years > 8 ? inputs.batteryReplacement : 0;
            const totalEvExpense = (inputs.evCarPrice - inputs.subsidy) + totalEvCost + totalEvMaintenance + batteryCost;
            
            // Calculate savings
            const savings = totalFuelExpense - totalEvExpense;
            const annualSavings = (annualFuelCost + inputs.fuelMaintenance) - (annualEvCost + inputs.evMaintenance);
            
            // Calculate break-even point
            const priceDifference = (inputs.evCarPrice - inputs.subsidy) - inputs.fuelCarPrice;
            const annualOperatingSavings = (annualFuelCost + inputs.fuelMaintenance) - (annualEvCost + inputs.evMaintenance);
            const breakEvenYears = annualOperatingSavings > 0 ? priceDifference / annualOperatingSavings : Infinity;
            
            // Calculate emissions
            const fuelEmissions = inputs.fuelType === 'petrol' ? 
                annualFuelConsumption * 2.31 : // kg CO2 per liter petrol
                annualFuelConsumption * 2.68;  // kg CO2 per liter diesel
            const evEmissions = annualElectricityConsumption * 0.82; // kg CO2 per kWh (India average)
            
            // Show results section
            document.getElementById('results').style.display = 'block';
            document.getElementById('initialMessage').style.display = 'none';
            
            // Update years text
            document.querySelectorAll('[id^="yearsText"]').forEach(el => {
                el.textContent = inputs.years;
            });
            
            // Update all displayed values
            updateDisplay('annualFuelCost', annualFuelCost);
            updateDisplay('annualEvCost', annualEvCost);
            updateDisplay('annualFuelMaintenance', inputs.fuelMaintenance);
            updateDisplay('annualEvMaintenance', inputs.evMaintenance);
            updateDisplay('totalFuelCost', totalFuelCost);
            updateDisplay('totalEvCost', totalEvCost);
            updateDisplay('totalFuelMaintenance', totalFuelMaintenance);
            updateDisplay('totalEvMaintenance', totalEvMaintenance);
            updateDisplay('fuelVehiclePrice', inputs.fuelCarPrice);
            updateDisplay('evVehiclePrice', inputs.evCarPrice - inputs.subsidy);
            updateDisplay('batteryCost', batteryCost);
            updateDisplay('totalFuelExpense', totalFuelExpense, true);
            updateDisplay('totalEvExpense', totalEvExpense, true);
            
            // Update emissions
            document.getElementById('fuelEmissions').textContent = Math.round(fuelEmissions).toLocaleString('en-IN');
            document.getElementById('evEmissions').textContent = Math.round(evEmissions).toLocaleString('en-IN');
            
            // Update savings text
            let savingsText = '';
            if (savings > 0) {
                savingsText = `You could save ₹${Math.abs(savings).toLocaleString('en-IN')} over ${inputs.years} years by choosing an EV.<br>`;
                savingsText += `That's about ₹${Math.abs(annualSavings).toLocaleString('en-IN')} per year.`;
                
                if (breakEvenYears > 0 && breakEvenYears !== Infinity) {
                    savingsText += `<br>You'll break even after ${breakEvenYears.toFixed(1)} years.`;
                }
            } else {
                savingsText = `The ${inputs.fuelType} vehicle is ₹${Math.abs(savings).toLocaleString('en-IN')} cheaper over ${inputs.years} years.`;
            }
            document.getElementById('savingsText').innerHTML = savingsText;
            
            // Update recommendation
            let recommendationText = '';
            if (savings > 0) {
                recommendationText = `Based on your inputs, we recommend going with an Electric Vehicle. You'll save money in the long run and reduce your environmental impact.`;
            } else {
                recommendationText = `Based on your inputs, a ${inputs.fuelType} vehicle may be more cost-effective for your driving needs at this time.`;
                
                if (breakEvenYears !== Infinity && breakEvenYears < 10) {
                    recommendationText += ` However, if you plan to keep the vehicle for more than ${breakEvenYears.toFixed(1)} years, an EV would become the better choice.`;
                }
            }
            
            recommendationText += `<br><br><strong>Other factors to consider:</strong><ul>`;
            recommendationText += `<li>EVs typically have smoother acceleration and require less maintenance</li>`;
            recommendationText += `<li>Fuel prices may increase faster than electricity rates</li>`;
            recommendationText += `<li>Government policies may further incentivize EVs in coming years</li>`;
            recommendationText += `</ul>`;
            
            document.getElementById('recommendationText').innerHTML = recommendationText;
            
            // Create charts
            createCharts(inputs.years, annualFuelCost, annualEvCost, inputs.fuelMaintenance, inputs.evMaintenance, inputs.fuelCarPrice, inputs.evCarPrice - inputs.subsidy, batteryCost);
            
        } catch (error) {
            console.error('Error in calculation:', error);
            alert('An error occurred. Please check all inputs are valid numbers.');
        }
    }

    function createCharts(years, annualFuelCost, annualEvCost, fuelMaintenance, evMaintenance, fuelCarPrice, evCarPrice, batteryCost) {
        try {
            // Annual Cost Chart
            const annualCostCtx = document.getElementById('annualCostChart').getContext('2d');
            
            // Destroy previous chart if it exists
            if (annualCostChart) {
                annualCostChart.destroy();
            }
            
            annualCostChart = new Chart(annualCostCtx, {
                type: 'bar',
                data: {
                    labels: ['Fuel/Electricity', 'Maintenance'],
                    datasets: [
                        {
                            label: fuelType.value === 'petrol' ? 'Petrol Vehicle' : 'Diesel Vehicle',
                            data: [annualFuelCost, fuelMaintenance],
                            backgroundColor: ['rgba(234, 67, 53, 0.7)', 'rgba(234, 67, 53, 0.5)'],
                            borderColor: ['rgba(234, 67, 53, 1)', 'rgba(234, 67, 53, 1)'],
                            borderWidth: 1
                        },
                        {
                            label: 'Electric Vehicle',
                            data: [annualEvCost, evMaintenance],
                            backgroundColor: ['rgba(52, 168, 83, 0.7)', 'rgba(52, 168, 83, 0.5)'],
                            borderColor: ['rgba(52, 168, 83, 1)', 'rgba(52, 168, 83, 1)'],
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Annual Operating Costs Comparison'
                        },
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Cost (₹)'
                            }
                        }
                    }
                }
            });
            
            // Cumulative Cost Chart
            const cumulativeCostCtx = document.getElementById('cumulativeCostChart').getContext('2d');
            const labels = [];
            const fuelData = [];
            const evData = [];
            
            for (let i = 1; i <= years; i++) {
                labels.push(`Year ${i}`);
                const fuelCost = fuelCarPrice + (annualFuelCost + fuelMaintenance) * i;
                fuelData.push(fuelCost);
                
                let evCost = evCarPrice + (annualEvCost + evMaintenance) * i;
                if (i >= 8) evCost += batteryCost;
                evData.push(evCost);
            }
            
            // Destroy previous chart if it exists
            if (cumulativeCostChart) {
                cumulativeCostChart.destroy();
            }
            
            cumulativeCostChart = new Chart(cumulativeCostCtx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: fuelType.value === 'petrol' ? 'Petrol Vehicle' : 'Diesel Vehicle',
                            data: fuelData,
                            backgroundColor: 'rgba(234, 67, 53, 0.2)',
                            borderColor: 'rgba(234, 67, 53, 1)',
                            borderWidth: 2,
                            tension: 0.1,
                            fill: true
                        },
                        {
                            label: 'Electric Vehicle',
                            data: evData,
                            backgroundColor: 'rgba(52, 168, 83, 0.2)',
                            borderColor: 'rgba(52, 168, 83, 1)',
                            borderWidth: 2,
                            tension: 0.1,
                            fill: true
                        }
                    ]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Cumulative Cost Over Time'
                        },
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Total Cost (₹)'
                            }
                        }
                    }
                }
            });
            
        } catch (error) {
            console.error('Error creating charts:', error);
        }
    }

    // Helper functions
    function getNumberValue(id, defaultValue) {
        const value = parseFloat(document.getElementById(id).value);
        return isNaN(value) ? defaultValue : value;
    }

    function updateDisplay(id, value, isBold = false) {
        const element = document.getElementById(id);
        if (element) {
            const formattedValue = '₹' + value.toLocaleString('en-IN', {maximumFractionDigits: 0});
            element.innerHTML = isBold ? `<strong>${formattedValue}</strong>` : formattedValue;
        }
    }
});