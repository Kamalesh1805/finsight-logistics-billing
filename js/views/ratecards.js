import { db } from '../db.js';

const ZONES = ['LOCAL', 'REGIONAL', 'ZONAL', 'METRO', 'ROI', 'NE', 'SPL DEST'];

export async function renderRateCardsView() {
    const companies = await db.getCompanies();
    const rateCards = await db.getRateCards();
    
    let html = `
        <div class="page-header">
            <div>
                <h1>Advanced Rate Cards</h1>
                <p>Configure custom pricing slabs and per-kg rates for your companies.</p>
            </div>
            <button class="btn-primary" id="btn-add-ratecard"><i class="fas fa-plus"></i> Configure Rates</button>
        </div>
    `;

    if (companies.length === 0) {
        html += `<div class="glass-panel"><p style="color:var(--text-muted);text-align:center;padding:40px;">Please add a company first before configuring a Rate Card.</p></div>`;
    } else if (rateCards.length === 0) {
        html += `<div class="glass-panel"><p style="color:var(--text-muted);text-align:center;padding:40px;">No custom rate cards configured. Default manual billing will be used.</p></div>`;
    } else {
        html += `
        <div class="glass-panel">
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Company</th>
                            <th>Express Configured</th>
                            <th>Surface Configured</th>
                            <th>Air Configured</th>
                            <th>Premium Configured</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(await Promise.all(rateCards.map(async rc => {
                            const comp = await db.getCompanyById(rc.companyId);
                            if (!comp) return ''; 
                            const hasExp = rc.express && Object.keys(rc.express).length > 0 ? 'Yes' : 'No';
                            const hasSur = rc.surface && Object.keys(rc.surface).length > 0 ? 'Yes' : 'No';
                            const hasAir = rc.airCargo && Object.keys(rc.airCargo).length > 0 ? 'Yes' : 'No';
                            const hasPre = rc.premium && Object.keys(rc.premium).length > 0 ? 'Yes' : 'No';
                            return `
                            <tr>
                                <td style="font-weight:600;">${comp.name}</td>
                                <td>${hasExp}</td>
                                <td>${hasSur}</td>
                                <td>${hasAir}</td>
                                <td>${hasPre}</td>
                                <td><button class="btn-primary btn-edit-rc" data-id="${rc.companyId}" style="padding:4px 8px; font-size:12px;">Edit</button></td>
                            </tr>
                            `;
                        }))).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        `;
    }

    // Modal
    let options = companies.map(c => `<option value="${c.id}">${c.name}${c.companyCode ? ` (${c.companyCode})` : ''}</option>`).join('');
    html += `
        <div id="ratecard-modal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.7); backdrop-filter:blur(5px); z-index:100; align-items:center; justify-content:center;">
            <div class="glass-panel" style="width:900px; max-width:95%; max-height:90vh; overflow-y:auto; padding:30px; position:relative;">
                <h3 style="margin-bottom:20px; font-size:18px;">Configure Custom Rate Card</h3>
                
                <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:15px; margin-bottom:20px;">
                    <div>
                        <label style="font-size:13px; color:var(--text-muted); margin-bottom:5px; display:block;">Select Company</label>
                        <select id="rc-company" class="rc-input">
                            ${options}
                        </select>
                    </div>
                    <div>
                        <label style="font-size:13px; color:var(--text-muted); margin-bottom:5px; display:block;">Service Type</label>
                        <select id="rc-service" class="rc-input">
                            <option value="express">Express (Slabs)</option>
                            <option value="surface">Surface (Per KG)</option>
                            <option value="airCargo">Air Cargo (Per KG)</option>
                            <option value="premium">Premium (Hybrid)</option>
                        </select>
                    </div>
                    <div>
                        <label style="font-size:13px; color:var(--text-muted); margin-bottom:5px; display:block;">Fuel Surcharge (%)</label>
                        <input type="number" id="rc-fuel" class="rc-input" placeholder="e.g. 10">
                    </div>
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:15px; margin-bottom:20px; padding:15px; background:rgba(255,255,255,0.05); border-radius:8px;">
                    <div>
                        <label style="font-size:13px; color:var(--text-muted); margin-bottom:5px; display:block;">Owner's Risk (%)</label>
                        <input type="number" id="rc-owners-pct" class="rc-input" placeholder="0.1" step="0.01">
                    </div>
                    <div>
                        <label style="font-size:13px; color:var(--text-muted); margin-bottom:5px; display:block;">Owner's Risk Min (Rs)</label>
                        <input type="number" id="rc-owners-min" class="rc-input" placeholder="50">
                    </div>
                    <div>
                        <label style="font-size:13px; color:var(--text-muted); margin-bottom:5px; display:block;">Carrier Risk (%)</label>
                        <input type="number" id="rc-carrier-pct" class="rc-input" placeholder="0.2" step="0.01">
                    </div>
                </div>

                <div id="rc-grid-container" style="overflow-x:auto; margin-bottom:20px;">
                    <!-- Grid rendered by JS -->
                </div>

                <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
                    <button id="btn-cancel-rc" style="padding:10px 20px; border-radius:8px; background:var(--surface-light); border:none; color:white; cursor:pointer; font-weight:600;">Close</button>
                    <button id="btn-save-rc" class="btn-primary">Save Rates</button>
                </div>
            </div>
        </div>
        <style>
            .rc-input { width:100%; padding:10px; border-radius:8px; border:1px solid var(--border); background:var(--bg-dark); color:white; font-family:Inter; }
            .grid-input { width:70px; padding:6px; border-radius:4px; border:1px solid var(--border); background:var(--bg-dark); color:white; font-family:Inter; text-align:right; }
            .rc-table th, .rc-table td { padding: 10px; text-align: center; border-bottom: 1px solid var(--border); }
            .rc-table th { background: rgba(255,255,255,0.05); color: var(--text-muted); font-size:12px; }
        </style>
    `;

    document.getElementById('view-ratecards').innerHTML = html;

    // State for modal
    let currentCompanyId = companies.length > 0 ? companies[0].id : null;
    let currentService = 'express';
    let currentData = null; // Holds the currently loaded rate card

    const renderGrid = () => {
        if (!currentData) {
            currentData = { 
                express: {}, 
                surface: {}, 
                airCargo: {}, 
                premium: {}, 
                fuelSurchargePct: 0,
                ownersRiskPct: 0,
                ownersRiskMin: 0,
                carrierRiskPct: 0
            };
            ZONES.forEach(z => {
                currentData.express[z] = { upTo100:0, upTo250:0, upTo500:0, addtl500:0, docket:0 };
                currentData.surface[z] = { perKg:0, minWeight:0, docket:0 };
                currentData.airCargo[z] = { perKg:0, minWeight:0, docket:0 };
                currentData.premium[z] = { upTo100:0, upTo250:0, upTo500:0, addtl500:0, perKg:0, minWeight:0, docket:0 };
            });
        }

        let gridHtml = '<table class="rc-table" style="width:100%; border-collapse: collapse;">';
        
        if (currentService === 'express') {
            gridHtml += `<tr><th>ZONE</th><th>Upto 100g</th><th>Upto 250g</th><th>Upto 500g</th><th>Addtl 500g</th><th>Docket Charge</th></tr>`;
            ZONES.forEach(z => {
                const d = currentData.express[z] || {};
                gridHtml += `<tr>
                    <td style="font-weight:bold; font-size:13px; text-align:left;">${z}</td>
                    <td><input type="number" class="grid-input" data-zone="${z}" data-field="upTo100" value="${d.upTo100||0}"></td>
                    <td><input type="number" class="grid-input" data-zone="${z}" data-field="upTo250" value="${d.upTo250||0}"></td>
                    <td><input type="number" class="grid-input" data-zone="${z}" data-field="upTo500" value="${d.upTo500||0}"></td>
                    <td><input type="number" class="grid-input" data-zone="${z}" data-field="addtl500" value="${d.addtl500||0}"></td>
                    <td><input type="number" class="grid-input" data-zone="${z}" data-field="docket" value="${d.docket||0}"></td>
                </tr>`;
            });
        } else if (currentService === 'surface' || currentService === 'airCargo') {
            gridHtml += `<tr><th>ZONE</th><th>Price Per KG</th><th>Min Chargeable Weight (kg)</th><th>Docket Charge</th></tr>`;
            ZONES.forEach(z => {
                const d = currentData[currentService][z] || {};
                gridHtml += `<tr>
                    <td style="font-weight:bold; font-size:13px; text-align:left;">${z}</td>
                    <td><input type="number" class="grid-input" data-zone="${z}" data-field="perKg" value="${d.perKg||0}"></td>
                    <td><input type="number" class="grid-input" data-zone="${z}" data-field="minWeight" value="${d.minWeight||0}"></td>
                    <td><input type="number" class="grid-input" data-zone="${z}" data-field="docket" value="${d.docket||0}"></td>
                </tr>`;
            });
        } else if (currentService === 'premium') {
            gridHtml += `<tr><th>ZONE</th><th><100g</th><th><250g</th><th><500g</th><th>Addtl 500g</th><th>Per KG (>5kg)</th><th>Min Wgt(kg)</th><th>Docket</th></tr>`;
            ZONES.forEach(z => {
                const d = currentData.premium[z] || {};
                gridHtml += `<tr>
                    <td style="font-weight:bold; font-size:12px; text-align:left;">${z}</td>
                    <td><input type="number" class="grid-input" style="width:50px" data-zone="${z}" data-field="upTo100" value="${d.upTo100||0}"></td>
                    <td><input type="number" class="grid-input" style="width:50px" data-zone="${z}" data-field="upTo250" value="${d.upTo250||0}"></td>
                    <td><input type="number" class="grid-input" style="width:50px" data-zone="${z}" data-field="upTo500" value="${d.upTo500||0}"></td>
                    <td><input type="number" class="grid-input" style="width:50px" data-zone="${z}" data-field="addtl500" value="${d.addtl500||0}"></td>
                    <td><input type="number" class="grid-input" style="width:50px" data-zone="${z}" data-field="perKg" value="${d.perKg||0}"></td>
                    <td><input type="number" class="grid-input" style="width:50px" data-zone="${z}" data-field="minWeight" value="${d.minWeight||0}"></td>
                    <td><input type="number" class="grid-input" style="width:50px" data-zone="${z}" data-field="docket" value="${d.docket||0}"></td>
                </tr>`;
            });
        }
        gridHtml += '</table>';
        document.getElementById('rc-grid-container').innerHTML = gridHtml;
    };

    const saveGridToCurrentData = () => {
        const inputs = document.querySelectorAll('.grid-input');
        inputs.forEach(input => {
            const zone = input.getAttribute('data-zone');
            const field = input.getAttribute('data-field');
            const val = Number(input.value) || 0;
            if (!currentData[currentService][zone]) currentData[currentService][zone] = {};
            currentData[currentService][zone][field] = val;
        });
    };

    const loadCompanyData = async (cid) => {
        const rc = await db.getRateCardByCompanyId(cid);
        if (rc) {
            currentData = JSON.parse(JSON.stringify(rc)); // Deep copy
            if(!currentData.express) currentData.express = {};
            if(!currentData.surface) currentData.surface = {};
            if(!currentData.airCargo) currentData.airCargo = {};
            if(!currentData.premium) currentData.premium = {};
            if(currentData.fuelSurchargePct === undefined) currentData.fuelSurchargePct = 0;
        } else {
            currentData = null;
        }
        
        // Update fields if loaded
        const fuelInput = document.getElementById('rc-fuel');
        if(fuelInput) fuelInput.value = currentData ? (currentData.fuelSurchargePct || 0) : 0;
        
        const ownersPctInput = document.getElementById('rc-owners-pct');
        if(ownersPctInput) ownersPctInput.value = currentData ? (currentData.ownersRiskPct || 0) : 0;
        
        const ownersMinInput = document.getElementById('rc-owners-min');
        if(ownersMinInput) ownersMinInput.value = currentData ? (currentData.ownersRiskMin || 0) : 0;
        
        const carrierPctInput = document.getElementById('rc-carrier-pct');
        if(carrierPctInput) carrierPctInput.value = currentData ? (currentData.carrierRiskPct || 0) : 0;
        
        renderGrid();
    };

    const openModal = async (cid) => {
        currentCompanyId = cid;
        document.getElementById('rc-company').value = cid;
        await loadCompanyData(cid);
        document.getElementById('ratecard-modal').style.display = 'flex';
    };

    // Event Delegation
    const container = document.getElementById('view-ratecards');
    if (!container.dataset.listenersAttached) {
        container.dataset.listenersAttached = 'true';
        container.addEventListener('click', async (e) => {
            const target = e.target.closest('button');
            if (!target) return;

            if (target.id === 'btn-add-ratecard') {
                if(companies.length === 0) return alert("Please add a company first!");
                await openModal(companies[0].id);
            }

            if (target.classList.contains('btn-edit-rc')) {
                await openModal(target.getAttribute('data-id'));
            }

            if (target.id === 'btn-cancel-rc') {
                document.getElementById('ratecard-modal').style.display = 'none';
            }

            if (target.id === 'btn-save-rc') {
                await saveRateCard();
            }
        });

        container.addEventListener('change', async (e) => {
            if (e.target.id === 'rc-company') {
                currentCompanyId = e.target.value;
                await loadCompanyData(currentCompanyId);
            }
            if (e.target.id === 'rc-service') {
                saveGridToCurrentData();
                currentService = e.target.value;
                renderGrid();
            }
        });
    }

    async function saveRateCard() {
        saveGridToCurrentData();
        currentData.companyId = currentCompanyId;
        currentData.fuelSurchargePct = Number(document.getElementById('rc-fuel').value) || 0;
        currentData.ownersRiskPct = Number(document.getElementById('rc-owners-pct').value) || 0;
        currentData.ownersRiskMin = Number(document.getElementById('rc-owners-min').value) || 0;
        currentData.carrierRiskPct = Number(document.getElementById('rc-carrier-pct').value) || 0;
        await db.saveRateCard(currentData);
        await renderRateCardsView();
    }
}
