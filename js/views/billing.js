import { db } from '../db.js';

export async function renderBillingView() {
    const companies = await db.getCompanies();
    
    let html = `
        <div class="page-header">
            <div>
                <h1>Consignment Entry</h1>
                <p>Add shipments individually or via bulk Excel upload.</p>
            </div>
            <div style="display:flex; gap:10px;">
                <button id="tab-single" class="btn-primary" style="background:var(--primary);">Single Entry</button>
                <button id="tab-bulk" class="btn-primary" style="background:var(--surface-light); color:var(--text-muted);">Bulk Upload</button>
            </div>
        </div>
    `;

    if (companies.length === 0) {
        html += `<div class="glass-panel"><p style="color:var(--text-muted);text-align:center;padding:40px;">Please add a company first before creating a billing entry.</p></div>`;
        document.getElementById('view-billing').innerHTML = html;
        return;
    }

    const options = companies.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

    // Single Entry View
    html += `
        <div id="view-single" style="display:block;">
            <div style="display:grid; grid-template-columns: 2fr 1fr; gap:24px; margin-bottom:32px;">
                <div class="glass-panel">
                    <h3 style="margin-bottom:20px; border-bottom:1px solid var(--border); padding-bottom:10px;">Consignment Details</h3>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; margin-bottom:15px;">
                        <div>
                            <label style="font-size:12px; color:var(--text-muted); display:block; margin-bottom:5px;">Date</label>
                            <input type="date" id="bill-date" value="${new Date().toISOString().split('T')[0]}" class="bill-input">
                        </div>
                        <div>
                            <label style="font-size:12px; color:var(--text-muted); display:block; margin-bottom:5px;">Company</label>
                            <select id="bill-company" class="bill-input">
                                <option value="">Select Company...</option>
                                ${options}
                            </select>
                        </div>
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; margin-bottom:15px;">
                        <div>
                            <label style="font-size:12px; color:var(--text-muted); display:block; margin-bottom:5px;">Consignment (AWB) No</label>
                            <input type="text" id="bill-awb" placeholder="e.g. DTDC123456" class="bill-input">
                        </div>
                        <div>
                            <label style="font-size:12px; color:var(--text-muted); display:block; margin-bottom:5px;">Receiver Name (Optional)</label>
                            <input type="text" id="bill-receiver" placeholder="Receiver Name" class="bill-input">
                        </div>
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:15px; margin-bottom:15px;">
                        <div>
                            <label style="font-size:12px; color:var(--text-muted); display:block; margin-bottom:5px;">Dest. Pincode</label>
                            <input type="text" id="bill-pincode" placeholder="e.g. 400001" class="bill-input">
                        </div>
                        <div>
                            <label style="font-size:12px; color:var(--text-muted); display:block; margin-bottom:5px;">Zone</label>
                            <input type="text" id="bill-zone" placeholder="Auto-detected or enter" class="bill-input">
                        </div>
                        <div>
                            <label style="font-size:12px; color:var(--text-muted); display:block; margin-bottom:5px;">Service Type</label>
                            <select id="bill-service" class="bill-input">
                                <option value="express">Express</option>
                                <option value="surface">Surface</option>
                                <option value="airCargo">Air Cargo</option>
                                <option value="premium">Premium</option>
                            </select>
                        </div>
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:15px; margin-bottom:15px;">
                        <div>
                            <label style="font-size:12px; color:var(--text-muted); display:block; margin-bottom:5px;">Weight (kg)</label>
                            <input type="number" step="0.01" id="bill-weight" placeholder="e.g. 1.5" class="bill-input">
                        </div>
                        <div>
                            <label style="font-size:12px; color:var(--text-muted); display:block; margin-bottom:5px;">Invoice Value (Rs)</label>
                            <input type="number" id="bill-value" placeholder="e.g. 60000" class="bill-input">
                        </div>
                        <div>
                            <label style="font-size:12px; color:var(--text-muted); display:block; margin-bottom:5px;">Risk Type</label>
                            <select id="bill-risk-type" class="bill-input">
                                <option value="NONE">None</option>
                                <option value="OWNER">Owner's Risk</option>
                                <option value="CARRIER">Carrier Risk</option>
                            </select>
                        </div>
                    </div>
                    <div style="margin-bottom:15px;">
                        <label style="font-size:12px; color:var(--text-muted); display:block; margin-bottom:5px;">Manual Amount (Override)</label>
                        <input type="number" id="bill-manual" placeholder="Optional" class="bill-input" style="border-color:var(--warning);">
                    </div>
                    <button id="btn-calculate" class="btn-primary" style="margin-top:10px; width:100%; justify-content:center;">Calculate Base Charge</button>
                </div>
                <div class="glass-panel" style="background: rgba(30, 41, 59, 0.6); height: fit-content;">
                    <h3 style="margin-bottom:20px; border-bottom:1px solid var(--border); padding-bottom:10px;">Consignment Summary</h3>
                    <p style="color:var(--text-muted); font-size:13px; margin-bottom:20px;">Fuel surcharge and GST will be applied automatically during the consolidated monthly invoice generation.</p>
                    <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                        <span style="color:var(--text-muted); font-size:14px;">Courier Charge:</span>
                        <span id="sum-base" style="font-weight:600;">₹ 0.00</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                        <span style="color:var(--text-muted); font-size:14px;">Risk Surcharge:</span>
                        <span id="sum-risk" style="font-weight:600;">₹ 0.00</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                        <span style="color:var(--text-muted); font-size:14px;">Docket Charge:</span>
                        <span id="sum-docket" style="font-weight:600;">₹ 0.00</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:20px; border-top:1px dashed var(--border); padding-top:15px;">
                        <span style="font-size:16px; font-weight:700; color:var(--primary);">Total for this AWB:</span>
                        <span id="sum-total" style="font-size:16px; font-weight:700; color:var(--primary);">₹ 0.00</span>
                    </div>
                    <button id="btn-save-bill" class="btn-primary" style="width:100%; justify-content:center; background:linear-gradient(135deg, var(--success), #059669);" disabled>Save Consignment</button>
                </div>
            </div>

            <!-- Recent Shipments Table -->
            <div id="recent-shipments-area"></div>
        </div>
    `;

    // Bulk Upload View
    html += `
        <div id="view-bulk" style="display:none;">
            <div class="glass-panel" style="text-align:center; padding:50px;">
                <h2 style="margin-bottom:10px;">Bulk Consignment Upload</h2>
                <p style="color:var(--text-muted); margin-bottom:30px;">Upload an Excel file (.xlsx) with the following exact headers:<br/>
                <span style="color:white; font-family:monospace; font-size:14px;">Date | CompanyCode | AWB | DestPincode | ServiceType | Weight | InvoiceValue | RiskType | ManualAmount | ReceiverName</span>
                <br/><br/><i style="font-size:12px;">Note: RiskType must be: NONE, OWNER, or CARRIER.</i></p>
                <input type="file" id="bulk-file" accept=".xlsx, .xls" style="display:none;" />
                <button id="btn-browse-file" class="btn-primary" style="margin: 0 auto;"><i class="fas fa-file-excel"></i> Select Excel File</button>
                <div id="bulk-results" style="margin-top:30px; text-align:left;"></div>
            </div>
        </div>
        <style>
            .bill-input { width:100%; padding:10px; border-radius:8px; border:1px solid var(--border); background:var(--bg-dark); color:white; font-family:Inter; }
            .bill-input:focus { outline:none; border-color:var(--primary); }
        </style>
    `;

    document.getElementById('view-billing').innerHTML = html;
    await renderRecentShipments();

    // Event Delegation
    const container = document.getElementById('view-billing');
    if (!container.dataset.listenersAttached) {
        container.dataset.listenersAttached = 'true';
        container.addEventListener('click', async (e) => {
            const target = e.target.closest('button');
            if (!target) return;

            // Tabs
            if (target.id === 'tab-single') {
                document.getElementById('tab-single').style.background = 'var(--primary)';
                document.getElementById('tab-single').style.color = '#fff';
                document.getElementById('tab-bulk').style.background = 'var(--surface-light)';
                document.getElementById('tab-bulk').style.color = 'var(--text-muted)';
                document.getElementById('view-single').style.display = 'block';
                document.getElementById('view-bulk').style.display = 'none';
                await renderRecentShipments();
            }
            if (target.id === 'tab-bulk') {
                document.getElementById('tab-bulk').style.background = 'var(--primary)';
                document.getElementById('tab-bulk').style.color = '#fff';
                document.getElementById('tab-single').style.background = 'var(--surface-light)';
                document.getElementById('tab-single').style.color = 'var(--text-muted)';
                document.getElementById('view-single').style.display = 'none';
                document.getElementById('view-bulk').style.display = 'block';
            }

            // Calculate
            if (target.id === 'btn-calculate') {
                await handleCalculate();
            }

            // Save
            if (target.id === 'btn-save-bill') {
                await handleSave();
            }

            // Bulk Browse
            if (target.id === 'btn-browse-file') {
                document.getElementById('bulk-file').click();
            }

            // Delete Recent Shipment
            if (target.classList.contains('btn-delete-shipment')) {
                const id = target.getAttribute('data-id');
                if(confirm("Are you sure you want to delete this pending consignment?")) {
                    await db.deleteShipment(id);
                    await renderRecentShipments();
                }
            }
        });

        container.addEventListener('input', (e) => {
            if (e.target.id === 'bill-pincode') {
                const pin = e.target.value.trim();
                if(pin.length >= 6) {
                    const mapped = db.getPincode(pin);
                    if(mapped) document.getElementById('bill-zone').value = mapped.zone;
                }
            }
        });

        container.addEventListener('change', async (e) => {
            if (e.target.id === 'bulk-file') {
                await handleBulkUpload(e.target.files[0]);
            }
        });
    }


    let currentCalculation = null;

    async function handleCalculate() {
        const companyId = document.getElementById('bill-company').value;
        const weight = Number(document.getElementById('bill-weight').value) || 0;
        const zone = document.getElementById('bill-zone').value || 'LOCAL';
        const serviceType = document.getElementById('bill-service').value;
        const manual = Number(document.getElementById('bill-manual').value) || 0;
        const invVal = Number(document.getElementById('bill-value').value) || 0;
        const rType = document.getElementById('bill-risk-type').value;

        if(!companyId || !weight) return alert("Company and Weight are required.");
        if (invVal > 50000 && rType === 'NONE') return alert("Consignment value exceeds Rs. 50,000. Please select a Risk Type.");

        const res = await calcBaseCharge(companyId, zone, serviceType, weight, manual, invVal, rType);
        if (res.error) return alert("No rate card found for this service and zone.");

        const total = res.baseCharge + res.docketCharge + (res.riskSurcharge || 0);

        document.getElementById('sum-base').innerText = '₹ ' + res.baseCharge.toFixed(2);
        document.getElementById('sum-risk').innerText = '₹ ' + (res.riskSurcharge || 0).toFixed(2);
        document.getElementById('sum-docket').innerText = '₹ ' + res.docketCharge.toFixed(2);
        document.getElementById('sum-total').innerText = '₹ ' + total.toFixed(2);

        currentCalculation = {
            date: document.getElementById('bill-date').value,
            companyId,
            awb: document.getElementById('bill-awb').value,
            receiver: document.getElementById('bill-receiver').value,
            destPincode: document.getElementById('bill-pincode').value,
            zone: zone.toUpperCase(),
            serviceType: document.getElementById('bill-service').options[document.getElementById('bill-service').selectedIndex].text,
            deadWeight: weight,
            invoiceValue: invVal,
            riskType: rType,
            baseCharge: res.baseCharge,
            riskSurcharge: res.riskSurcharge || 0,
            docketCharge: res.docketCharge,
            status: 'Pending'
        };

        document.getElementById('btn-save-bill').disabled = false;
    }

    async function handleSave() {
        if(currentCalculation) {
            await db.saveShipment(currentCalculation);
            alert("Consignment saved successfully!");
            document.getElementById('bill-awb').value = '';
            document.getElementById('bill-weight').value = '';
            document.getElementById('bill-value').value = '';
            document.getElementById('bill-risk-type').value = 'NONE';
            document.getElementById('bill-manual').value = '';
            document.getElementById('btn-save-bill').disabled = true;
            currentCalculation = null;
            document.getElementById('sum-base').innerText = '₹ 0.00';
            document.getElementById('sum-risk').innerText = '₹ 0.00';
            document.getElementById('sum-docket').innerText = '₹ 0.00';
            document.getElementById('sum-total').innerText = '₹ 0.00';
            await renderRecentShipments();
        }
    }

    async function renderRecentShipments() {
        const area = document.getElementById('recent-shipments-area');
        if(!area) return;

        const allShipments = await db.getShipments();
        const pending = allShipments.filter(s => s.status === 'Pending').slice(-5).reverse();

        if (pending.length === 0) {
            area.innerHTML = '';
            return;
        }

        const companies = await db.getCompanies();

        let tableHtml = `
            <div class="glass-panel" style="margin-top:24px;">
                <h3 style="margin-bottom:15px;">Recently Added (Pending)</h3>
                <div class="table-container">
                    <table style="font-size:13px;">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>AWB</th>
                                <th>Company</th>
                                <th>Amount</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${pending.map(s => {
                                const c = companies.find(x => x.id === s.companyId);
                                return `
                                <tr>
                                    <td>${s.date}</td>
                                    <td style="font-weight:600; color:var(--primary);">${s.awb}</td>
                                    <td>${c ? c.name : 'Unknown'}</td>
                                    <td>₹${((s.baseCharge||0)+(s.docketCharge||0)+(s.riskSurcharge||0)).toFixed(2)}</td>
                                    <td>
                                        <button class="btn-delete-shipment" data-id="${s.id}" style="background:none; border:none; color:var(--danger); cursor:pointer;">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        area.innerHTML = tableHtml;
    }

    async function handleBulkUpload(file) {
        if(!file) return;
        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const data = evt.target.result;
                const workbook = window.XLSX.read(data, {type: 'binary', cellDates: true});
                const firstSheet = workbook.SheetNames[0];
                const rows = window.XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet]);
                
                let successCount = 0; let errorCount = 0;
                const shipmentsToSave = [];

                for (const row of rows) {
                    let dDate = (row.Date instanceof Date) ? row.Date.toISOString().split('T')[0] : (row.Date || new Date().toISOString().split('T')[0]);
                    const compCode = String(row.CompanyCode || '').trim().toUpperCase();
                    const sTypeRaw = String(row.ServiceType || '').toLowerCase().trim();
                    const sType = ['express','surface','aircargo','premium'].includes(sTypeRaw) ? (sTypeRaw==='aircargo'?'airCargo':sTypeRaw) : 'express';
                    const weight = Number(row.Weight) || 0;
                    const invVal = Number(row.InvoiceValue) || 0;
                    const rType = String(row.RiskType || 'NONE').toUpperCase().trim();
                    const comp = companies.find(c => (c.companyCode||'').toUpperCase() === compCode);
                    
                    if (!comp) { errorCount++; continue; }
                    let zone = 'LOCAL';
                    const pin = String(row.DestPincode || '');
                    if (pin.length >= 6) { const mapped = db.getPincode(pin); if (mapped) zone = mapped.zone; }

                    const res = await calcBaseCharge(comp.id, zone, sType, weight, Number(row.ManualAmount)||0, invVal, rType);
                    if (res.error) { errorCount++; continue; }

                    shipmentsToSave.push({
                        date: dDate, companyId: comp.id, awb: String(row.AWB || ''), receiver: String(row.ReceiverName || ''),
                        destPincode: pin, zone: zone.toUpperCase(), serviceType: sType.charAt(0).toUpperCase() + sType.slice(1),
                        deadWeight: weight, invoiceValue: invVal, riskType: rType, baseCharge: res.baseCharge,
                        riskSurcharge: res.riskSurcharge || 0, docketCharge: res.docketCharge, status: 'Pending'
                    });
                    successCount++;
                }

                if (shipmentsToSave.length > 0) await db.saveShipments(shipmentsToSave);
                document.getElementById('bulk-results').innerHTML = `<div style="background:var(--surface-light); padding:20px; border-radius:10px;">
                    <h4 style="color:var(--primary);">Upload Complete</h4>
                    <p>${successCount} saved. ${errorCount} failed.</p>
                </div>`;
                await renderRecentShipments();
            } catch(err) { alert("Error parsing Excel file."); console.error(err); }
        };
        reader.readAsBinaryString(file);
    }

    async function calcBaseCharge(companyId, zone, serviceType, weight, manual, invoiceValue = 0, riskType = 'NONE') {
        if (manual > 0) return { baseCharge: manual, docketCharge: 0, riskSurcharge: 0 };
        const rc = await db.getRateCardByCompanyId(companyId);
        const z = zone.toUpperCase();
        if(rc && rc[serviceType] && rc[serviceType][z]) {
            const rates = rc[serviceType][z];
            let baseCharge = 0;
            let docketCharge = rates.docket || 0;

            if (serviceType === 'express') {
                if (weight <= 0.1 && rates.upTo100) baseCharge = rates.upTo100;
                else if (weight <= 0.25 && rates.upTo250) baseCharge = rates.upTo250;
                else if (weight <= 0.5 && rates.upTo500) baseCharge = rates.upTo500;
                else {
                    baseCharge = rates.upTo500 || 0;
                    if (weight > 0.5) {
                        const extraSlabs = Math.ceil((weight - 0.5) / 0.5);
                        baseCharge += (extraSlabs * (rates.addtl500 || 0));
                    }
                }
            } else if (serviceType === 'surface' || serviceType === 'airCargo') {
                const billableWeight = Math.max(weight, rates.minWeight || 0);
                baseCharge = billableWeight * (rates.perKg || 0);
            } else if (serviceType === 'premium') {
                if (weight <= 5) {
                    if (weight <= 0.1 && rates.upTo100) baseCharge = rates.upTo100;
                    else if (weight <= 0.25 && rates.upTo250) baseCharge = rates.upTo250;
                    else if (weight <= 0.5 && rates.upTo500) baseCharge = rates.upTo500;
                    else {
                        baseCharge = rates.upTo500 || 0;
                        if (weight > 0.5) {
                            const extraSlabs = Math.ceil((weight - 0.5) / 0.5);
                            baseCharge += (extraSlabs * (rates.addtl500 || 0));
                        }
                    }
                } else {
                    const billableWeight = Math.max(weight, rates.minWeight || 0);
                    baseCharge = billableWeight * (rates.perKg || 0);
                }
            }
            
            let riskSurcharge = 0;
            if (invoiceValue > 50000 && riskType !== 'NONE') {
                if (riskType === 'OWNER') {
                    const pctAmt = invoiceValue * ((rc.ownersRiskPct || 0) / 100);
                    riskSurcharge = Math.max(pctAmt, rc.ownersRiskMin || 0);
                } else if (riskType === 'CARRIER') {
                    riskSurcharge = invoiceValue * ((rc.carrierRiskPct || 0) / 100);
                }
            }
            return { baseCharge, docketCharge, riskSurcharge };
        }
        return { error: true };
    }
}
