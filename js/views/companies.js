import { db, GST_STATE_CODES } from '../db.js';

export async function renderCompaniesView() {
    const companies = await db.getCompanies();
    
    let html = `
        <div class="page-header">
            <div>
                <h1>Companies</h1>
                <p>Manage your client logistics companies.</p>
            </div>
            <button class="btn-primary" id="btn-add-company"><i class="fas fa-plus"></i> Add Company</button>
        </div>
    `;

    if (companies.length === 0) {
        html += `<div class="glass-panel"><p style="color:var(--text-muted);text-align:center;padding:40px;">No companies added yet. Click "Add Company" to get started.</p></div>`;
    } else {
        html += `
        <div class="glass-panel">
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Company Code</th>
                            <th>Company Name</th>
                            <th>Contact Person</th>
                            <th>Phone</th>
                            <th>GST No</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${companies.map(c => `
                        <tr>
                            <td style="font-weight:600;">${c.companyCode || '-'}</td>
                            <td>
                                <div class="company-cell">
                                    <div class="company-logo" style="background:var(--primary); color:white;">${c.name.charAt(0).toUpperCase()}</div>
                                    ${c.name}
                                </div>
                            </td>
                            <td>${c.contactPerson}</td>
                            <td>${c.phone || '-'}</td>
                            <td>${c.gstNo || '-'}</td>
                            <td>
                                <button class="btn-delete" data-id="${c.id}" style="background:none;border:none;color:var(--danger);cursor:pointer;padding:5px;"><i class="fas fa-trash"></i></button>
                            </td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        `;
    }

    // Modal HTML for adding company
    html += `
        <div id="company-modal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.5); backdrop-filter:blur(5px); z-index:100; align-items:center; justify-content:center;">
            <div class="glass-panel" style="width:500px; max-width:90%; padding:30px; position:relative;">
                <h3 style="margin-bottom:20px; font-size:18px;">Add New Company</h3>
                <div style="display:grid; gap:15px;">
                    <input type="text" id="comp-code" placeholder="Company Code *" style="width:100%; padding:10px; border-radius:8px; border:1px solid var(--border); background:var(--surface); color:white; font-family:Inter;">
                    <input type="text" id="comp-name" placeholder="Company Name *" style="width:100%; padding:10px; border-radius:8px; border:1px solid var(--border); background:var(--surface); color:white; font-family:Inter;">
                    <input type="text" id="comp-contact" placeholder="Contact Person *" style="width:100%; padding:10px; border-radius:8px; border:1px solid var(--border); background:var(--surface); color:white; font-family:Inter;">
                    <input type="text" id="comp-phone" placeholder="Phone Number" style="width:100%; padding:10px; border-radius:8px; border:1px solid var(--border); background:var(--surface); color:white; font-family:Inter;">
                    <input type="text" id="comp-email" placeholder="Email Address" style="width:100%; padding:10px; border-radius:8px; border:1px solid var(--border); background:var(--surface); color:white; font-family:Inter;">
                    <input type="text" id="comp-gst" placeholder="GST Number (15 Digits) *" style="width:100%; padding:10px; border-radius:8px; border:1px solid var(--border); background:var(--surface); color:white; font-family:Inter;">
                    <textarea id="comp-address" placeholder="Billing Address" style="width:100%; padding:10px; border-radius:8px; border:1px solid var(--border); background:var(--surface); color:white; min-height:80px; font-family:Inter;"></textarea>
                </div>
                <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
                    <button id="btn-cancel-comp" style="padding:10px 20px; border-radius:8px; background:var(--surface-light); border:none; color:white; cursor:pointer; font-weight:600;">Cancel</button>
                    <button id="btn-save-comp" class="btn-primary">Save Company</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('view-companies').innerHTML = html;

    // Event Delegation for Delete and Add
    const container = document.getElementById('view-companies');
    if (!container.dataset.listenersAttached) {
        container.dataset.listenersAttached = 'true';
        container.addEventListener('click', async (e) => {
            const target = e.target.closest('button');
            if (!target) return;

            if (target.id === 'btn-add-company') {
                document.getElementById('company-modal').style.display = 'flex';
            }

            if (target.id === 'btn-cancel-comp') {
                document.getElementById('company-modal').style.display = 'none';
            }

            if (target.id === 'btn-save-comp') {
                await saveCompany();
            }

            if (target.classList.contains('btn-delete')) {
                const id = target.getAttribute('data-id');
                if(confirm("Are you sure you want to delete this company?")) {
                    await db.deleteCompany(id);
                    await renderCompaniesView();
                }
            }
        });
    }

    async function saveCompany() {
        const code = document.getElementById('comp-code').value;
        const name = document.getElementById('comp-name').value;
        const contact = document.getElementById('comp-contact').value;
        const gst = document.getElementById('comp-gst').value.trim();
        
        if (!code || !name || !contact) return alert("Company Code, Name, and Contact Person are required.");
        if (gst && gst.length !== 15) return alert("GST Number must be exactly 15 characters long.");
        
        let stateCode = '';
        let stateName = '';
        if (gst) {
            stateCode = gst.substring(0, 2);
            stateName = GST_STATE_CODES[stateCode] || 'UNKNOWN STATE';
        }
        
        await db.saveCompany({
            companyCode: code.toUpperCase(),
            name,
            contactPerson: contact,
            phone: document.getElementById('comp-phone').value,
            email: document.getElementById('comp-email').value,
            gstNo: gst.toUpperCase(),
            stateName: stateName,
            stateCode: stateCode,
            placeOfSupply: stateName,
            address: document.getElementById('comp-address').value
        });
        
        await renderCompaniesView();
    }
}
