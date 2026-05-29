import { renderCompaniesView } from './views/companies.js?v=3';
import { renderRateCardsView } from './views/ratecards.js?v=3';
import { renderBillingView } from './views/billing.js?v=3';
import { renderInvoicesView } from './views/invoices.js?v=3';
import { renderDashboardView } from './views/dashboard.js?v=3';
import { renderAnalyticsView } from './views/analytics.js?v=3';
import { renderSettingsView } from './views/settings.js?v=3';

window.switchView = async function(viewId, element) {
    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    if(element) {
        element.classList.add('active');
    } else {
        const navItems = document.querySelectorAll('.nav-item');
        for(let item of navItems) {
            if(item.getAttribute('onclick') && item.getAttribute('onclick').includes(viewId)) {
                item.classList.add('active');
                break;
            }
        }
    }

    // Hide all views
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    
    // Show target view
    const target = document.getElementById('view-' + viewId);
    if(target) target.classList.add('active');

    // Trigger view-specific render logic
    if (viewId === 'companies') {
        await renderCompaniesView();
    } else if (viewId === 'ratecards') {
        await renderRateCardsView();
    } else if (viewId === 'billing') {
        await renderBillingView();
    } else if (viewId === 'invoices') {
        await renderInvoicesView();
    } else if (viewId === 'dashboard') {
        await renderDashboardView();
    } else if (viewId === 'analytics') {
        await renderAnalyticsView();
    } else if (viewId === 'settings') {
        await renderSettingsView();
    }
};

window.logout = function() {
    sessionStorage.removeItem('finsight_session');
    window.location.href = 'index.html';
};

window.migrateData = async function() {
    try {
        const btn = document.querySelector('button[onclick="window.migrateData()"]');
        if (btn) {
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Pushing...';
            btn.disabled = true;
        }
        await db.migrateLocalToCloud();
        alert("Data successfully pushed to the Cloud Database!");
        if (btn) {
            btn.innerHTML = '<i class="fas fa-check"></i> Done';
            btn.style.background = '#059669';
        }
    } catch (err) {
        alert("Failed to push data. Please ensure Firebase Firestore Rules are unlocked.");
        console.error(err);
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize Dashboard as active view
    const session = JSON.parse(sessionStorage.getItem('finsight_session'));
    if (!session) {
        window.location.href = 'index.html';
        return;
    }

    // Render user profile info
    document.getElementById('user-name').innerText = session.username;
    document.getElementById('user-role').innerText = session.role === 'admin' ? 'Administrator' : 'Staff';
    document.getElementById('user-avatar').innerText = session.username.charAt(0).toUpperCase();

    // Init Dashboard
    await renderDashboardView();
});
