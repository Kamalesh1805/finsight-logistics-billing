import { db } from '../db.js';

export async function renderDashboardView() {
    const companies = await db.getCompanies();
    const shipments = await db.getShipments();
    const invoices = await db.getInvoices();

    const totalCompanies = companies.length;
    const totalShipments = shipments.length;
    const billedShipmentsCount = shipments.filter(s => s.status === 'Billed').length;
    
    const revenueThisMonth = invoices.reduce((sum, inv) => {
        return sum + (inv.totalAmount || 0);
    }, 0);

    const totalInvoices = invoices.length;

    let html = `
        <div class="page-header">
            <div>
                <h1>Overview</h1>
                <p>Welcome back! Here's what's happening with your billing today.</p>
            </div>
            <button class="btn-primary" onclick="switchView('invoices')">
                <i class="fas fa-plus"></i> Generate Invoice
            </button>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-wallet"></i></div>
                <div class="stat-value">₹ ${revenueThisMonth.toLocaleString('en-IN')}</div>
                <div class="stat-label">Total Revenue (This Month)</div>
                <div class="trend up"><i class="fas fa-arrow-up"></i> 12%</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon purple"><i class="fas fa-file-invoice"></i></div>
                <div class="stat-value">${totalInvoices}</div>
                <div class="stat-label">Invoices Generated</div>
                <div class="trend up"><i class="fas fa-arrow-up"></i> 5%</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon green"><i class="fas fa-truck-ramp-box"></i></div>
                <div class="stat-value">${totalShipments.toLocaleString('en-IN')}</div>
                <div class="stat-label">Active Shipments Processed</div>
                <div class="trend down"><i class="fas fa-arrow-down"></i> 2%</div>
            </div>
        </div>

        <div class="glass-panel">
            <div class="panel-header">
                <h3>Recent Invoices</h3>
                <a href="#" onclick="switchView('invoices')">View All</a>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Invoice ID</th>
                            <th>Company</th>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${invoices.slice(-5).reverse().map(inv => {
                            const c = companies.find(x => x.id === inv.companyId);
                            const cName = c ? c.name : 'Unknown';
                            const cInitial = cName.charAt(0).toUpperCase();
                            return `
                            <tr>
                                <td style="font-weight:600; color:var(--primary);">${inv.invoiceNo}</td>
                                <td>
                                    <div class="company-cell">
                                        <div class="company-logo">${cInitial}</div>
                                        ${cName}
                                    </div>
                                </td>
                                <td>${new Date(inv.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                                <td style="font-weight:600;">₹ ${inv.totalAmount.toLocaleString('en-IN')}</td>
                                <td><span class="status paid">Generated</span></td>
                                <td><button style="background:none;border:none;color:var(--primary);cursor:pointer;"><i class="fas fa-file-pdf"></i> PDF</button></td>
                            </tr>
                            `;
                        }).join('') || '<tr><td colspan="6" style="text-align:center; padding:40px; color:var(--text-muted);">No recent invoices found.</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    const viewEl = document.getElementById('view-dashboard');
    if(viewEl) viewEl.innerHTML = html;
}
