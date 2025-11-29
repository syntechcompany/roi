(function() {
    const platformPrices = { growth: 750, enterprise: 1650, unlimited: 2550 };
    const portalCosts = { '0': 0, '250': 16667, '1000': 33333, '10000': 66667, '50000': 166667, '100000': 250000, '200000': 333333, 'unlimited': 500000 };

    function init() {
        document.querySelectorAll('.platform-radio').forEach(radio => {
            radio.addEventListener('change', function() {
                document.querySelectorAll('.platform-card').forEach(card => card.classList.remove('selected'));
                this.closest('.platform-card').classList.add('selected');
                const platformQtyInput = document.getElementById('platformQty');
                if (this.value === 'unlimited') {
                    platformQtyInput.min = 50;
                    if (parseInt(platformQtyInput.value) < 50) platformQtyInput.value = 50;
                } else {
                    platformQtyInput.min = 5;
                }
                calculateTotalCost();
            });
        });

        document.querySelectorAll('.product-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const productItem = this.closest('.product-item');
                const productId = this.id.replace('Check', '');
                const quantityControl = document.getElementById(productId + 'Quantity');
                const quantityInput = document.getElementById(productId + 'Qty');
                if (productItem) productItem.classList.toggle('selected', this.checked);
                if (quantityControl) {
                    quantityControl.classList.toggle('visible', this.checked);
                    if (quantityInput) quantityInput.value = this.checked ? 1 : 0;
                }
                calculateTotalCost();
            });
        });

        const portalCheck = document.getElementById('portalCheck');
        if (portalCheck) {
            portalCheck.addEventListener('change', function() {
                const container = document.getElementById('portalPackageContainer');
                const item = document.getElementById('portalItem');
                container.style.display = this.checked ? 'block' : 'none';
                item.classList.toggle('selected', this.checked);
                if (!this.checked) document.getElementById('portalPackage').selectedIndex = 0;
                calculateTotalCost();
            });
        }

        const calcBtn = document.getElementById('calculateROI');
        if (calcBtn) calcBtn.addEventListener('click', calculateROI);

        document.querySelectorAll('.roi-calculator input, .roi-calculator select').forEach(element => {
            element.addEventListener('change', calculateTotalCost);
            if (element.type === 'number') element.addEventListener('input', calculateTotalCost);
        });

        calculateTotalCost();
    }

    window.incrementQuantity = function(inputId) {
        const input = document.getElementById(inputId);
        input.value = parseInt(input.value || 0) + 1;
        calculateTotalCost();
    };

    window.decrementQuantity = function(inputId) {
        const input = document.getElementById(inputId);
        const min = parseInt(input.min) || 0;
        const newValue = parseInt(input.value || 0) - 1;
        if (newValue >= min) { input.value = newValue; calculateTotalCost(); }
    };

    function formatMoney(amount) {
        return new Intl.NumberFormat('uk-UA', { style: 'decimal', maximumFractionDigits: 0 }).format(amount) + ' ₴';
    }

    function formatPercent(value) { return value.toFixed(1) + '%'; }

    function calculateTotalCost() {
        const platformRadio = document.querySelector('input[name="platform"]:checked');
        if (!platformRadio) return null;
        
        const platformType = platformRadio.value;
        const platformQty = parseInt(document.getElementById('platformQty').value) || 0;
        const platformPrice = platformPrices[platformType];
        const platformCost = platformPrice * platformQty;

        const products = [{ id: 'sales', price: 450 }, { id: 'marketing', price: 450 }, { id: 'service', price: 450 }];
        let productsCost = 0;
        products.forEach(function(product) {
            const checkbox = document.getElementById(product.id + 'Check');
            const qty = parseInt((document.getElementById(product.id + 'Qty') || {}).value || 0);
            if (checkbox && checkbox.checked) productsCost += qty * product.price;
        });

        const limitedCheck = document.getElementById('limitedCheck');
        const limitedQty = parseInt((document.getElementById('limitedQty') || {}).value || 0);
        const limitedCost = (limitedCheck && limitedCheck.checked) ? limitedQty * 500 : 0;

        const portalPackage = (document.getElementById('portalPackage') || {}).value || '0';
        const portalCost = portalCosts[portalPackage] || 0;

        const supportLevel = parseInt((document.getElementById('supportLevel') || {}).value || 0);
        const baseCost = platformCost + productsCost + limitedCost + portalCost;
        const supportCost = (baseCost * supportLevel) / 100;

        const implementationCost = parseInt((document.getElementById('implementationCost') || {}).value || 0);
        const additionalYearlyCost = parseInt((document.getElementById('additionalYearlyCost') || {}).value || 0);

        const monthlyTotal = baseCost + supportCost;
        const yearlyLicenses = monthlyTotal * 12;
        const year1Total = yearlyLicenses + implementationCost + additionalYearlyCost;
        const year3Total = (yearlyLicenses * 3) + implementationCost + (additionalYearlyCost * 3);

        const totalUsers = platformQty + 
            ((document.getElementById('salesCheck') || {}).checked ? parseInt((document.getElementById('salesQty') || {}).value || 0) : 0) +
            ((document.getElementById('marketingCheck') || {}).checked ? parseInt((document.getElementById('marketingQty') || {}).value || 0) : 0) +
            ((document.getElementById('serviceCheck') || {}).checked ? parseInt((document.getElementById('serviceQty') || {}).value || 0) : 0) +
            ((limitedCheck || {}).checked ? limitedQty : 0);

        const perUserYear = totalUsers > 0 ? year1Total / totalUsers : 0;

        const el = function(id) { return document.getElementById(id); };
        if (el('totalMonthly')) el('totalMonthly').textContent = formatMoney(monthlyTotal);
        if (el('totalYear1')) el('totalYear1').textContent = formatMoney(year1Total);
        if (el('totalYear3')) el('totalYear3').textContent = formatMoney(year3Total);
        if (el('perUserYear')) el('perUserYear').textContent = formatMoney(perUserYear);

        const warning = el('minCheckWarning');
        if (warning) {
            if (year1Total < 420000 && year1Total > 0) warning.classList.add('active');
            else warning.classList.remove('active');
        }

        return { monthlyTotal: monthlyTotal, yearlyLicenses: yearlyLicenses, year1Total: year1Total, year3Total: year3Total, implementationCost: implementationCost, additionalYearlyCost: additionalYearlyCost, supportCost: supportCost * 12, platformQty: platformQty };
    }

    function calculateROI() {
        const costs = calculateTotalCost();
        if (!costs) return;

        const el = function(id) { return document.getElementById(id); };
        const monthlyDeals = parseInt((el('monthlyDeals') || {}).value || 0);
        const avgDealSize = parseInt((el('avgDealSize') || {}).value || 0);
        const currentConversion = parseFloat((el('conversion') || {}).value || 0);
        const lostDeals = parseFloat((el('lostDeals') || {}).value || 0);
        const managerSalary = parseInt((el('managerSalary') || {}).value || 0);
        const routineTime = parseFloat((el('routineTime') || {}).value || 0);

        if (costs.year1Total <= 0) { alert('Будь ласка, оберіть тарифний план та кількість користувачів'); return; }

        const conversionImprovement = 0.20, lostDealsReduction = 0.30, routineTimeReduction = 0.50;
        const newConversion = currentConversion * (1 + conversionImprovement);
        const newLostDeals = lostDeals * (1 - lostDealsReduction);
        const newRoutineTime = routineTime * (1 - routineTimeReduction);
        const timeSavedPercent = routineTime - newRoutineTime;
        const yearlyDeals = monthlyDeals * 12;

        if (currentConversion <= 0 || yearlyDeals <= 0 || avgDealSize <= 0) {
            var netYear1 = -costs.year1Total;
            var yearlyOperatingCost = costs.yearlyLicenses + costs.additionalYearlyCost;
            if (el('roiYear1')) { el('roiYear1').textContent = '-100.0%'; el('roiYear1').style.color = 'var(--danger)'; }
            if (el('roiYear3')) { el('roiYear3').textContent = '-100.0%'; el('roiYear3').style.color = 'var(--danger)'; }
            if (el('paybackPeriod')) el('paybackPeriod').textContent = 'Н/Д';
            if (el('npvValue')) { el('npvValue').textContent = formatMoney(-costs.year3Total); el('npvValue').style.color = 'var(--danger)'; }
            if (el('additionalRevenue')) el('additionalRevenue').textContent = '0 ₴';
            if (el('savedRevenue')) el('savedRevenue').textContent = '0 ₴';
            if (el('salarySavings')) el('salarySavings').textContent = '0 ₴';
            if (el('totalBenefit')) el('totalBenefit').textContent = '0 ₴';
            if (el('newConversion')) el('newConversion').textContent = '0.0%';
            if (el('newLostDeals')) el('newLostDeals').textContent = '0.0%';
            if (el('timeSaved')) el('timeSaved').textContent = '0.0%';
            if (el('extraDeals')) el('extraDeals').textContent = '0';
            if (el('netYear1')) { el('netYear1').textContent = formatMoney(netYear1); el('netYear1').className = 'metric-value negative'; }
            if (el('netYear2')) { el('netYear2').textContent = formatMoney(-yearlyOperatingCost); el('netYear2').className = 'metric-value negative'; }
            if (el('netYear3')) { el('netYear3').textContent = formatMoney(-yearlyOperatingCost); el('netYear3').className = 'metric-value negative'; }
            if (el('totalNet3Years')) { el('totalNet3Years').textContent = formatMoney(netYear1 - yearlyOperatingCost * 2); el('totalNet3Years').className = 'metric-value negative'; }
            if (el('recommendationTitle')) el('recommendationTitle').textContent = '⚠️ Недостатньо даних';
            if (el('recommendationText')) el('recommendationText').textContent = 'Введіть реальні бізнес-параметри для розрахунку ROI.';
            if (el('roiResults')) el('roiResults').classList.add('visible');
            if (el('roiResults')) el('roiResults').scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
        }

        const conversionGainAbsolute = newConversion - currentConversion;
        const additionalDealsFromConversion = yearlyDeals * (conversionGainAbsolute / currentConversion);
        const additionalRevenue = additionalDealsFromConversion * avgDealSize;

        const lostDealsReductionAbsolute = lostDeals - newLostDeals;
        const savedDeals = yearlyDeals * (lostDealsReductionAbsolute / 100);
        const savedRevenue = savedDeals * avgDealSize;

        const productivityGainFactor = 0.3;
        const additionalDealsFromProductivity = yearlyDeals * (timeSavedPercent / 100) * productivityGainFactor;
        const productivityRevenue = additionalDealsFromProductivity * avgDealSize;

        const operationalSavingsFactor = 0.05;
        const operationalSavings = managerSalary * 12 * costs.platformQty * operationalSavingsFactor;

        const profitMargin = (parseFloat((el('profitMarginInput') || {}).value || 25)) / 100;
        const revenueGain = additionalRevenue + savedRevenue + productivityRevenue;
        const profitFromRevenue = revenueGain * profitMargin;
        const totalYearlyBenefit = profitFromRevenue + operationalSavings;

        var netYear1 = totalYearlyBenefit - costs.year1Total;
        var yearlyOperatingCost = costs.yearlyLicenses + costs.additionalYearlyCost;
        const netYear2 = totalYearlyBenefit - yearlyOperatingCost;
        const netYear3 = totalYearlyBenefit - yearlyOperatingCost;
        const totalNet3Years = netYear1 + netYear2 + netYear3;

        const roiYear1 = costs.year1Total > 0 ? ((totalYearlyBenefit - costs.year1Total) / costs.year1Total) * 100 : 0;
        const total3YearsBenefit = totalYearlyBenefit * 3;
        const roiYear3 = costs.year3Total > 0 ? ((total3YearsBenefit - costs.year3Total) / costs.year3Total) * 100 : 0;

        const rampUpMonths = 3;
        const monthlyBenefitAfterRampUp = totalYearlyBenefit / 12;
        var paybackMonths;
        if (monthlyBenefitAfterRampUp <= 0) paybackMonths = Infinity;
        else paybackMonths = rampUpMonths + Math.ceil(Math.max(0, costs.year1Total) / monthlyBenefitAfterRampUp);
        if (paybackMonths > 60 || !isFinite(paybackMonths)) paybackMonths = 60;

        const discountRate = 0.15;
        const yearlyNetBenefit = totalYearlyBenefit - yearlyOperatingCost;
        const npv = -costs.implementationCost + yearlyNetBenefit / (1 + discountRate) + yearlyNetBenefit / Math.pow(1 + discountRate, 2) + yearlyNetBenefit / Math.pow(1 + discountRate, 3);

        const totalExtraDeals = additionalDealsFromConversion + savedDeals + additionalDealsFromProductivity;

        if (el('roiYear1')) { el('roiYear1').textContent = formatPercent(roiYear1); el('roiYear1').style.color = roiYear1 >= 0 ? 'var(--primary)' : 'var(--danger)'; }
        if (el('roiYear3')) { el('roiYear3').textContent = formatPercent(roiYear3); el('roiYear3').style.color = roiYear3 >= 0 ? 'var(--primary)' : 'var(--danger)'; }
        if (el('paybackPeriod')) { el('paybackPeriod').textContent = paybackMonths >= 60 ? '60+ міс' : paybackMonths + ' міс'; el('paybackPeriod').style.color = paybackMonths <= 24 ? 'var(--success)' : (paybackMonths <= 36 ? 'var(--warning)' : 'var(--danger)'); }
        if (el('npvValue')) { el('npvValue').textContent = formatMoney(npv); el('npvValue').style.color = npv >= 0 ? 'var(--success)' : 'var(--danger)'; }

        if (el('additionalRevenue')) el('additionalRevenue').textContent = formatMoney(additionalRevenue);
        if (el('savedRevenue')) el('savedRevenue').textContent = formatMoney(savedRevenue + productivityRevenue);
        if (el('salarySavings')) el('salarySavings').textContent = formatMoney(operationalSavings);
        if (el('totalBenefit')) el('totalBenefit').textContent = formatMoney(totalYearlyBenefit);
        if (el('marginDisplay')) el('marginDisplay').textContent = Math.round(profitMargin * 100);

        if (el('newConversion')) el('newConversion').textContent = formatPercent(newConversion);
        if (el('newLostDeals')) el('newLostDeals').textContent = formatPercent(newLostDeals);
        if (el('timeSaved')) el('timeSaved').textContent = formatPercent(timeSavedPercent);
        if (el('extraDeals')) el('extraDeals').textContent = Math.round(totalExtraDeals);

        var efficiency = 0;
        if (currentConversion > 0 && lostDeals > 0) efficiency = Math.min(100, (newConversion / currentConversion) * 50 + ((lostDeals - newLostDeals) / lostDeals) * 50);
        if (el('efficiencyPercent')) el('efficiencyPercent').textContent = formatPercent(efficiency);
        if (el('efficiencyBar')) el('efficiencyBar').style.width = efficiency + '%';

        if (el('licenseCost')) el('licenseCost').textContent = formatMoney(costs.yearlyLicenses);
        if (el('supportCost')) el('supportCost').textContent = formatMoney(costs.supportCost);
        if (el('implCost')) el('implCost').textContent = formatMoney(costs.implementationCost);
        if (el('addCost')) el('addCost').textContent = formatMoney(costs.additionalYearlyCost);

        if (el('netYear1')) { el('netYear1').textContent = formatMoney(netYear1); el('netYear1').className = 'metric-value ' + (netYear1 >= 0 ? 'positive' : 'negative'); }
        if (el('netYear2')) { el('netYear2').textContent = formatMoney(netYear2); el('netYear2').className = 'metric-value ' + (netYear2 >= 0 ? 'positive' : 'negative'); }
        if (el('netYear3')) { el('netYear3').textContent = formatMoney(netYear3); el('netYear3').className = 'metric-value ' + (netYear3 >= 0 ? 'positive' : 'negative'); }
        if (el('totalNet3Years')) { el('totalNet3Years').textContent = formatMoney(totalNet3Years); el('totalNet3Years').className = 'metric-value ' + (totalNet3Years >= 0 ? 'positive' : 'negative'); }

        var recTitle, recText;
        if (roiYear1 > 100) {
            recTitle = '🎯 Відмінна інвестиція!';
            recText = 'ROI ' + formatPercent(roiYear1) + ' за перший рік. Окупність за ' + paybackMonths + ' місяців. Прибуток за 3 роки: ' + formatMoney(totalNet3Years) + '.';
        } else if (roiYear1 > 50) {
            recTitle = '✅ Вигідна інвестиція';
            recText = 'ROI ' + formatPercent(roiYear1) + ' — гарний показник. Окупність ' + paybackMonths + ' місяців. Прибуток за 3 роки: ' + formatMoney(totalNet3Years) + '.';
        } else if (roiYear1 > 0) {
            recTitle = '⚠️ Помірний ROI';
            recText = 'ROI ' + formatPercent(roiYear1) + '. Інвестиція окупиться. Для кращих результатів збільшіть обсяги продажів.';
        } else if (roiYear1 > -50) {
            recTitle = '⚠️ Негативний ROI за 1 рік';
            recText = 'ROI ' + formatPercent(roiYear1) + ' негативний через початкові витрати. ROI за 3 роки: ' + formatPercent(roiYear3) + '.';
        } else {
            recTitle = '❌ Інвестиція не окупається';
            recText = 'ROI ' + formatPercent(roiYear1) + '. Рекомендуємо збільшити угоди/чек або зменшити витрати.';
        }

        if (el('recommendationTitle')) el('recommendationTitle').textContent = recTitle;
        if (el('recommendationText')) el('recommendationText').textContent = recText;

        const recCard = el('recommendationCard');
        if (recCard) {
            if (roiYear1 > 50) {
                recCard.style.background = 'linear-gradient(135deg, rgba(0,200,83,0.1) 0%, var(--bg-card) 100%)';
                recCard.style.borderColor = 'rgba(0,200,83,0.3)';
            } else if (roiYear1 > 0) {
                recCard.style.background = 'linear-gradient(135deg, rgba(255,193,7,0.1) 0%, var(--bg-card) 100%)';
                recCard.style.borderColor = 'rgba(255,193,7,0.3)';
            } else {
                recCard.style.background = 'linear-gradient(135deg, rgba(244,67,54,0.1) 0%, var(--bg-card) 100%)';
                recCard.style.borderColor = 'rgba(244,67,54,0.3)';
            }
        }

        if (el('roiResults')) el('roiResults').classList.add('visible');
        if (el('roiResults')) el('roiResults').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();