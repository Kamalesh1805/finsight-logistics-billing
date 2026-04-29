import { db } from '../db.js';

export async function renderAnalyticsView() {
    const shipments = await db.getShipments();
    const invoices = await db.getInvoices();

    // Aggregate Service Types
    const serviceCounts = { Express: 0, Surface: 0, AirCargo: 0, Premium: 0 };
    shipments.forEach(s => {
        if(serviceCounts[s.serviceType] !== undefined) serviceCounts[s.serviceType]++;
    });

    // Aggregate Zones
    const zoneCounts = {};
    shipments.forEach(s => {
        zoneCounts[s.zone] = (zoneCounts[s.zone] || 0) + 1;
    });

    let html = `
        <div class="page-header">
            <div>
                <h1>Analytics</h1>
                <p>Detailed breakdown of shipments and revenue.</p>
            </div>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:24px; margin-bottom:24px;">
            <div class="glass-panel">
                <h3 style="margin-bottom:20px;">Shipments by Service Type</h3>
                <div style="display:flex; flex-direction:column; gap:15px;">
                    ${Object.entries(serviceCounts).map(([k, v]) => {
                        const pct = shipments.length ? Math.round((v / shipments.length) * 100) : 0;
                        return `
                        <div>
                            <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:5px;">
                                <span>${k}</span>
                                <span>${v} (${pct}%)</span>
                            </div>
                            <div style="width:100%; background:var(--bg-dark); height:8px; border-radius:4px; overflow:hidden;">
                                <div style="width:${pct}%; background:var(--primary); height:100%;"></div>
                            </div>
                        </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <div class="glass-panel">
                <h3 style="margin-bottom:20px;">Shipments by Zone</h3>
                <div style="display:flex; flex-direction:column; gap:15px; max-height:200px; overflow-y:auto; padding-right:10px;">
                    ${Object.entries(zoneCounts).sort((a,b)=>b[1]-a[1]).map(([k, v]) => {
                        const pct = shipments.length ? Math.round((v / shipments.length) * 100) : 0;
                        return `
                        <div>
                            <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:5px;">
                                <span>${k}</span>
                                <span>${v} (${pct}%)</span>
                            </div>
                            <div style="width:100%; background:var(--bg-dark); height:8px; border-radius:4px; overflow:hidden;">
                                <div style="width:${pct}%; background:var(--success); height:100%;"></div>
                            </div>
                        </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>

        <div class="glass-panel">
            <h3 style="margin-bottom:20px;">Revenue Timeline (Latest Invoices)</h3>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Invoice No</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${invoices.slice(-10).reverse().map(inv => `
                            <tr>
                                <td>${inv.date}</td>
                                <td style="color:var(--primary); font-weight:600;">${inv.invoiceNo}</td>
                                <td>₹${inv.totalAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                            </tr>
                        `).join('') || '<tr><td colspan="3" style="text-align:center;">No data available</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    const viewEl = document.getElementById('view-analytics');
    if(viewEl) viewEl.innerHTML = html;
}
