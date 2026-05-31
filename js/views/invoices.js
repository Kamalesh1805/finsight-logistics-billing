import { db, GST_STATE_CODES } from '../db.js';
import { DTDC_LOGO } from '../logo.js';

function numberToWords(num) {
    const a = ['', 'ONE ', 'TWO ', 'THREE ', 'FOUR ', 'FIVE ', 'SIX ', 'SEVEN ', 'EIGHT ', 'NINE ', 'TEN ', 'ELEVEN ', 'TWELVE ', 'THIRTEEN ', 'FOURTEEN ', 'FIFTEEN ', 'SIXTEEN ', 'SEVENTEEN ', 'EIGHTEEN ', 'NINETEEN '];
    const b = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
    
    if ((num = num.toString()).length > 9) return 'OVERFLOW';
    let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return; let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'CRORE ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'LAKH ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'THOUSAND ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'HUNDRED ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'AND ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    return str.trim() ? str.trim() + ' ONLY' : 'ZERO ONLY';
}

export async function renderInvoicesView() {
    const companies = await db.getCompanies();
    const invoices = await db.getInvoices();
    
    let html = `
        <div class="page-header">
            <div>
                <h1>Invoices</h1>
                <p>Generate new monthly invoices or view past invoices.</p>
            </div>
            <div style="display:flex; gap:10px;">
                <button id="tab-generate" class="btn-primary" style="background:var(--primary);">Generate</button>
                <button id="tab-history" class="btn-primary" style="background:var(--surface-light); color:var(--text-muted);">History</button>
            </div>
        </div>
    `;

    // --- Tab 1: Generate ---
    html += `<div id="view-generate" style="display:block;">`;
    if (companies.length === 0) {
        html += `<div class="glass-panel"><p style="color:var(--text-muted);text-align:center;padding:40px;">No companies available.</p></div>`;
    } else {
        const options = companies.map(c => `<option value="${c.id}">${c.name}${c.companyCode ? ` (${c.companyCode})` : ''}</option>`).join('');
        html += `
            <div class="glass-panel" style="margin-bottom:24px;">
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:15px; align-items:flex-end;">
                    <div>
                        <label style="font-size:12px; color:var(--text-muted); display:block; margin-bottom:5px;">Select Company</label>
                        <select id="inv-company" class="inv-input">
                            <option value="">Choose Company...</option>
                            ${options}
                        </select>
                    </div>
                    <div>
                        <label style="font-size:12px; color:var(--text-muted); display:block; margin-bottom:5px;">Invoice Number (Optional)</label>
                        <input type="text" id="inv-number-custom" placeholder="Auto-generated if empty" class="inv-input">
                    </div>
                    <div>
                        <label style="font-size:12px; color:var(--text-muted); display:block; margin-bottom:5px;">Invoice Date</label>
                        <input type="date" id="inv-date" value="${new Date().toISOString().split('T')[0]}" class="inv-input">
                    </div>
                    <div>
                        <label style="font-size:12px; color:var(--text-muted); display:block; margin-bottom:5px;">Period From</label>
                        <input type="date" id="inv-period-from" class="inv-input">
                    </div>
                    <div>
                        <label style="font-size:12px; color:var(--text-muted); display:block; margin-bottom:5px;">Period To</label>
                        <input type="date" id="inv-period-to" class="inv-input">
                    </div>
                    <div>
                        <button id="btn-preview-inv" class="btn-primary" style="height:42px; width:100%;">Preview</button>
                    </div>
                </div>
            </div>
            <div id="inv-preview-area"></div>
        `;
    }
    html += `</div>`;

    // --- Tab 2: History ---
    html += `<div id="view-history" style="display:none;">`;
    if (invoices.length === 0) {
        html += `<div class="glass-panel"><p style="color:var(--text-muted);text-align:center;padding:40px;">No invoices generated yet.</p></div>`;
    } else {
        html += `
            <div class="glass-panel">
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Invoice No</th>
                                <th>Date</th>
                                <th>Period</th>
                                <th>Company Name</th>
                                <th>Amount</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(await Promise.all(invoices.map(async inv => {
                                const c = await db.getCompanyById(inv.companyId);
                                const cName = c ? c.name : 'Unknown Company';
                                return `
                                <tr>
                                    <td style="font-weight:600; color:var(--primary);">${inv.invoiceNo}</td>
                                    <td>${inv.date}</td>
                                    <td><span style="font-size:12px; color:var(--text-muted);">${inv.periodFrom} to ${inv.periodTo}</span></td>
                                    <td>${cName}</td>
                                    <td style="font-weight:600;">₹${inv.totalAmount.toFixed(2)}</td>
                                    <td>
                                        <button class="btn-view-inv" data-id="${inv.id}" title="View in Web" style="background:none;border:none;color:var(--success);cursor:pointer;padding:5px;"><i class="fas fa-eye"></i></button>
                                        <button class="btn-download-inv" data-id="${inv.id}" title="Download PDF" style="background:none;border:none;color:var(--primary);cursor:pointer;padding:5px;"><i class="fas fa-download"></i></button>
                                        <button class="btn-delete-inv" data-id="${inv.id}" title="Delete Invoice" style="background:none;border:none;color:var(--danger);cursor:pointer;padding:5px;"><i class="fas fa-trash"></i></button>
                                    </td>
                                </tr>
                                `;
                            }))).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
    html += `</div>`;

    html += `
        <style>
            .inv-input { width:100%; padding:10px; border-radius:8px; border:1px solid var(--border); background:var(--bg-dark); color:white; font-family:Inter; }
            .inv-input:focus { outline:none; border-color:var(--primary); }
        </style>
    `;

    document.getElementById('view-invoices').innerHTML = html;

    // Event Delegation for Tabs and Delete
    const container = document.getElementById('view-invoices');
    if (!container.dataset.listenersAttached) {
        container.dataset.listenersAttached = 'true';
        container.addEventListener('click', async (e) => {
        const target = e.target.closest('button, a');
        if (!target) return;

        // Tabs
        if (target.id === 'tab-generate') {
            document.getElementById('tab-generate').style.background = 'var(--primary)'; 
            document.getElementById('tab-generate').style.color = '#fff';
            document.getElementById('tab-history').style.background = 'var(--surface-light)'; 
            document.getElementById('tab-history').style.color = 'var(--text-muted)';
            document.getElementById('view-generate').style.display = 'block';
            document.getElementById('view-history').style.display = 'none';
        }
        if (target.id === 'tab-history') {
            document.getElementById('tab-history').style.background = 'var(--primary)'; 
            document.getElementById('tab-history').style.color = '#fff';
            document.getElementById('tab-generate').style.background = 'var(--surface-light)'; 
            document.getElementById('tab-generate').style.color = 'var(--text-muted)';
            document.getElementById('view-generate').style.display = 'none';
            document.getElementById('view-history').style.display = 'block';
        }

        // Delete Invoice
        if (target.classList.contains('btn-delete-inv')) {
            const id = target.getAttribute('data-id');
            if(confirm("Are you sure you want to delete this invoice? Note: This will not revert the shipments back to 'Pending'.")) {
                await db.deleteInvoice(id);
                await renderInvoicesView();
                const historyBtn = document.getElementById('tab-history');
                if(historyBtn) historyBtn.click();
            }
        }

        // View/Download Past Invoice
        if (target.classList.contains('btn-view-inv') || target.classList.contains('btn-download-inv')) {
            const isDownload = target.classList.contains('btn-download-inv');
            const id = target.getAttribute('data-id');
            const allInvoices = await db.getInvoices();
            const inv = allInvoices.find(i => i.id === id);
            if (!inv) return;

            const company = await db.getCompanyById(inv.companyId);
            const allShipments = await db.getShipments();
            const shipments = allShipments.filter(s => s.invoiceNo === inv.invoiceNo);
            
            if (shipments.length === 0) return alert("No shipments found for this invoice.");

            // Recalculate Totals
            let sumBase = 0; let sumDocket = 0; let sumRisk = 0;
            shipments.forEach(s => { 
                sumBase += s.baseCharge || 0; 
                sumDocket += s.docketCharge || 0; 
                sumRisk += s.riskSurcharge || 0;
            });

            const rc = await db.getRateCardByCompanyId(inv.companyId);
            const fuelPct = rc ? (rc.fuelSurchargePct || 0) : 0;
            const totalCourier = sumBase + sumDocket;
            const fuelBase = totalCourier + sumRisk;
            const fuelSurcharge = (fuelBase * fuelPct) / 100;
            const subtotal = totalCourier + fuelSurcharge + sumRisk;
            
            let mappedStateCode = company.stateCode;
            if ((!mappedStateCode || mappedStateCode === '-') && company.gstNo && company.gstNo.length >= 2) {
                mappedStateCode = company.gstNo.substring(0, 2);
            }
            const isIgst = mappedStateCode && mappedStateCode !== '33';
            const igst = isIgst ? subtotal * 0.18 : 0;
            const cgst = !isIgst ? subtotal * 0.09 : 0;
            const sgst = !isIgst ? subtotal * 0.09 : 0;
            const grandTotalExact = subtotal + (isIgst ? igst : cgst + sgst);
            const grandTotalRounded = Math.round(grandTotalExact);
            const roundOff = grandTotalRounded - grandTotalExact;

            const totals = {
                fuelPct, sumBase, sumDocket, sumRisk, totalCourier, fuelSurcharge, subtotal, 
                isIgst, igst, cgst, sgst, roundOff, grandTotalRounded
            };

            if (isDownload) {
                await generateMonthlyInvoicePDF(company, shipments, totals, inv.date, inv.periodFrom, inv.periodTo, inv.invoiceNo, true);
            } else {
                window.openInvoiceWebview(company, shipments, totals, inv.date, inv.periodFrom, inv.periodTo, inv.invoiceNo);
            }
        }

        // Preview
        if (target.id === 'btn-preview-inv') {
            await handlePreview();
        }

        // Generate PDF
        if (target.id === 'btn-generate-pdf') {
            await generateMonthlyInvoicePDF(currentComp, currentPending, currentTotals, currentInvDate, currentPeriodFrom, currentPeriodTo, currentInvNo);
        }

        // Web View Preview
        if (target.id === 'btn-preview-webview') {
            window.openInvoiceWebview(currentComp, currentPending, currentTotals, currentInvDate, currentPeriodFrom, currentPeriodTo, currentInvNo);
        }

        // Delete Shipments from Preview
        if (target.classList.contains('btn-delete-preview-shipment')) {
            const id = target.getAttribute('data-id');
            if (confirm("Remove this consignment from database?")) {
                await db.deleteShipment(id);
                await handlePreview();
            }
        }

        // Delete ALL pending consignments
        if (target.id === 'btn-delete-all-pending') {
            if (confirm("Are you sure you want to delete ALL pending consignments for this company? This cannot be undone.")) {
                if(currentPending && currentPending.length > 0) {
                    for(const s of currentPending) {
                        await db.deleteShipment(s.id);
                    }
                    await handlePreview();
                }
            }
        }
    });
    }

    if(companies.length === 0) return;

    let currentComp = null;
    let currentPending = [];
    let currentTotals = {};
    let currentInvDate = '';
    let currentPeriodFrom = '';
    let currentPeriodTo = '';
    let currentInvNo = '';

    async function handlePreview() {
        const companyId = document.getElementById('inv-company').value;
        const pFrom = document.getElementById('inv-period-from').value;
        const pTo = document.getElementById('inv-period-to').value;
        const iDate = document.getElementById('inv-date').value;
        let cInvNo = document.getElementById('inv-number-custom').value.trim();

        if(!companyId) return alert("Select a company first.");
        if(!pFrom || !pTo) return alert("Please select Invoice Period From and To dates.");

        if(!cInvNo) {
            cInvNo = 'SE-' + new Date().getFullYear().toString().substr(-2) + '-' + Math.floor(1000 + Math.random() * 9000);
        }

        currentComp = await db.getCompanyById(companyId);
        const allShipments = await db.getShipments();
        currentPending = allShipments.filter(s => s.companyId === companyId && s.status === 'Pending');
        currentInvDate = iDate;
        currentPeriodFrom = pFrom;
        currentPeriodTo = pTo;
        currentInvNo = cInvNo;

        if(currentPending.length === 0) {
            document.getElementById('inv-preview-area').innerHTML = `<div class="glass-panel"><p style="color:var(--text-muted);text-align:center;">No pending consignments for this company.</p></div>`;
            return;
        }

        let sumBase = 0; let sumDocket = 0; let sumRisk = 0;
        currentPending.forEach(s => { 
            sumBase += s.baseCharge || 0; 
            sumDocket += s.docketCharge || 0; 
            sumRisk += s.riskSurcharge || 0;
        });

        const rc = await db.getRateCardByCompanyId(companyId);
        const fuelPct = rc ? (rc.fuelSurchargePct || 0) : 0;
        const totalCourier = sumBase + sumDocket;
        const fuelBase = totalCourier + sumRisk;
        const fuelSurcharge = (fuelBase * fuelPct) / 100;
        const subtotal = totalCourier + fuelSurcharge + sumRisk;
        
        let mappedStateCode = currentComp.stateCode;
        if ((!mappedStateCode || mappedStateCode === '-') && currentComp.gstNo && currentComp.gstNo.length >= 2) {
            mappedStateCode = currentComp.gstNo.substring(0, 2);
        }
        const isIgst = mappedStateCode && mappedStateCode !== '33';
        const igst = isIgst ? subtotal * 0.18 : 0;
        const cgst = !isIgst ? subtotal * 0.09 : 0;
        const sgst = !isIgst ? subtotal * 0.09 : 0;
        const grandTotalExact = subtotal + (isIgst ? igst : cgst + sgst);
        const grandTotalRounded = Math.round(grandTotalExact);
        const roundOff = grandTotalRounded - grandTotalExact;

        currentTotals = {
            fuelPct, sumBase, sumDocket, sumRisk, totalCourier, fuelSurcharge, subtotal, 
            isIgst, igst, cgst, sgst, roundOff, grandTotalRounded
        };

        let previewHtml = `
            <div style="display:grid; grid-template-columns: 2fr 1fr; gap:24px;">
                <div class="glass-panel">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                        <h3 style="margin:0;">Preview: ${currentInvNo}</h3>
                        <button id="btn-delete-all-pending" class="btn-primary" style="background:var(--danger); padding:6px 12px; font-size:12px;">
                            <i class="fas fa-trash-alt"></i> Delete All
                        </button>
                    </div>
                    <div style="max-height:400px; overflow-y:auto; font-size:13px;">
                        <table style="width:100%; border-collapse:collapse;">
                            <thead>
                                <tr style="background:rgba(0,0,0,0.2);">
                                    <th style="padding:10px;text-align:left;">AWB</th>
                                    <th style="padding:10px;text-align:right;">Courier</th>
                                    <th style="padding:10px;text-align:right;">Risk</th>
                                    <th style="padding:10px;text-align:center;">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${currentPending.map(s => `
                                    <tr style="border-bottom:1px solid var(--border);">
                                        <td style="padding:10px;">${s.awb}</td>
                                        <td style="padding:10px;text-align:right;">₹${((s.baseCharge||0)+(s.docketCharge||0)).toFixed(2)}</td>
                                        <td style="padding:10px;text-align:right;">₹${(s.riskSurcharge||0).toFixed(2)}</td>
                                        <td style="padding:10px;text-align:center;">
                                            <button class="btn-delete-preview-shipment" data-id="${s.id}" style="background:none; border:none; color:var(--danger); cursor:pointer;">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="glass-panel" style="background: rgba(30, 41, 59, 0.6); display:flex; flex-direction:column;">
                    <h3 style="margin-bottom:20px;">Summary</h3>
                    <div style="display:flex; justify-content:space-between; margin-bottom:10px; font-size:14px;"><span>Subtotal:</span><span>₹ ${subtotal.toFixed(2)}</span></div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:10px; font-size:14px;"><span>Tax:</span><span>₹ ${(grandTotalExact - subtotal).toFixed(2)}</span></div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:30px; font-size:18px; font-weight:bold; color:var(--primary);"><span>Total:</span><span>₹ ${grandTotalRounded.toFixed(2)}</span></div>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                        <button id="btn-preview-webview" class="btn-primary" style="width:100%; justify-content:center; background:var(--surface-light);"><i class="fas fa-eye"></i> Web View</button>
                        <button id="btn-generate-pdf" class="btn-primary" style="width:100%; justify-content:center;"><i class="fas fa-file-pdf"></i> PDF</button>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('inv-preview-area').innerHTML = previewHtml;
    }
}

async function generateMonthlyInvoicePDF(comp, shipments, totals, invDate, periodFrom, periodTo, invoiceNumber) {
    if(!window.jspdf) return alert("jsPDF library not loaded.");
    if(!comp) return alert("Company data missing.");
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

        // ---------- PAGE 1: TAX INVOICE ----------
        
        // Title
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.text("Tax Invoice", 105, 12, { align: "center" });

        // Shivani Enterprises Header (Left)
        doc.setFontSize(16);
        doc.text("SHIVANI ENTERPRISES", 14, 25);
        doc.setFontSize(9);
        doc.text("NO. 1/4 PILLAYAR KOIL STREET,", 14, 31);
        doc.text("PARIVAKKAM", 14, 36);
        doc.text("CHENNAI - 600056.", 14, 41);
        doc.text("TAMIL NADU, INDIA.", 14, 46);
        doc.text("MOBILE: +91 9841399206 / 9444457926", 14, 51);
        doc.text("MAIL ID: shivanienterprises036@gmail.com", 14, 56);
        
        doc.setFont("helvetica", "normal");
        doc.text("State Code: 33", 14, 62);
        doc.text("GSTIN: 33AISPG4898G1ZR", 14, 67);
        doc.text("PAN Number: AISPG4898G", 14, 72);

        // DTDC Logo (Right)
        if (typeof DTDC_LOGO !== 'undefined') {
            doc.addImage(DTDC_LOGO, 'PNG', 110, 18, 85, 38);
        }

        // Middle Boxes
        // Bill To Box
        doc.rect(14, 85, 90, 45);
        doc.setFont("helvetica", "bold");
        doc.text("Bill To,", 16, 90);
        doc.text((comp.name || '').toUpperCase(), 16, 96);
        doc.setFont("helvetica", "normal");
        const splitAddr = doc.splitTextToSize(comp.address || '', 85);
        doc.text(splitAddr, 16, 102);
        
        let boxY = 102 + (splitAddr.length * 4) + 2;
        doc.text(`State Name: ${(comp.stateName || 'TAMIL NADU').toUpperCase()}`, 16, boxY);
        doc.text(`State Code: ${comp.stateCode || '33'}`, 16, boxY + 4);
        doc.text(`GSTIN: ${comp.gstNo || ''}`, 16, boxY + 8);

        // Invoice Info Box
        doc.rect(106, 85, 90, 45);
        doc.setFont("helvetica", "normal");
        doc.text("Invoice No:", 108, 91); doc.text(invoiceNumber, 145, 91);
        doc.text("Invoice Date:", 108, 98); doc.text(invDate, 145, 98);
        doc.text("Invoice Period:", 108, 105); doc.text(`${periodFrom} to ${periodTo}`, 145, 105);
        doc.text("SAC No:", 108, 112); doc.text("9968", 145, 112);
        doc.text("Description of service:", 108, 119); doc.text("Courier service", 145, 119);
        doc.text("Place of Supply:", 108, 126); doc.text((comp.stateName || 'Tamil Nadu').toUpperCase(), 145, 126);

        // Summary Table
        const summaryBody = [
            [1, "COURIER SERVICE", "", (totals.sumBase + totals.sumDocket + totals.sumRisk).toFixed(2)]
        ];
        let idx = 2;
        if (totals.fuelSurcharge > 0) {
            summaryBody.push([idx++, "FUEL SURCHARGE", totals.fuelPct + "%", totals.fuelSurcharge.toFixed(2)]);
        }
        if (totals.isIgst) {
            summaryBody.push([idx++, "IGST @ 18%", "18%", totals.igst.toFixed(2)]);
        } else {
            summaryBody.push([idx++, "CGST @ 9%", "9%", totals.cgst.toFixed(2)]);
            summaryBody.push([idx++, "SGST @ 9%", "9%", totals.sgst.toFixed(2)]);
        }
        summaryBody.push(["", "ROUND OFF", "", totals.roundOff.toFixed(2)]);

        doc.autoTable({
            startY: 135,
            head: [['Sl No.', 'PARTICULARS', 'RATE (%)', 'AMT (RS)']],
            body: summaryBody,
            foot: [['', 'TOTAL INVOICE VALUE', '', totals.grandTotalRounded.toFixed(2)]],
            theme: 'grid',
            headStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' },
            footStyles: { fillColor: [255, 255, 255], textColor: 0, fontStyle: 'bold', fontSize: 10, halign: 'right' },
            columnStyles: { 
                0: { cellWidth: 15 },
                2: { cellWidth: 30 },
                3: { halign: 'right', cellWidth: 40 }
            },
            didParseCell: function (data) {
                if (data.section === 'foot' && data.column.index === 1) {
                    data.cell.styles.halign = 'left';
                }
            }
        });

        const finalY = doc.lastAutoTable.finalY;
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text("Net Amount in words:", 14, finalY + 10);
        doc.text(numberToWords(totals.grandTotalRounded), 55, finalY + 10);
        doc.setFont("helvetica", "bold");
        doc.text("Tax subject to reverse charge            NO", 14, finalY + 18);

        // Notes Box
        doc.rect(14, finalY + 25, 90, 25);
        doc.setFontSize(8);
        doc.text("NOTES:", 16, finalY + 30);
        doc.setFont("helvetica", "normal");
        doc.text("1. Payments should be made in favour of SHIVANI ENTERPRISES", 16, finalY + 36);
        doc.text("2. Payments are requested to be made within 15 working days", 16, finalY + 42);
        doc.text("after the receipt of invoice.", 16, finalY + 48);

        // Bank Details Box
        doc.rect(14, finalY + 55, 90, 30);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text("BANK DETAILS:", 16, finalY + 60);
        doc.setFont("helvetica", "normal");
        doc.text("BANK NAME     : BANK OF BARODA", 16, finalY + 66);
        doc.text("BRANCH NAME : NATHAMEDU BRANCH", 16, finalY + 72);
        doc.text("BANK A/C NO   : 69640200001348", 16, finalY + 78);
        doc.text("IFSC CODE     : BARB0VJNAME", 16, finalY + 84);

        // Signatory
        doc.setFont("helvetica", "bold");
        doc.text("For SHIVANI ENTERPRISES", 196, finalY + 60, { align: "right" });
        doc.text("Authorized Signatory", 196, finalY + 84, { align: "right" });

        // ---------- PAGE 2: ANNEXURE ----------
        doc.addPage();
        doc.setFontSize(18);
        doc.text("Consignment Summary Report", 105, 15, { align: "center" });
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Statement for the period of ${periodFrom} to ${periodTo}`, 14, 22);

        const hasReceiver = shipments.some(s => s.receiver && s.receiver.trim() !== '');
        const annexHead = ['Manifest Date', 'Consignment\nNumber', 'Destination', 'Service Type'];
        if (hasReceiver) annexHead.push('Receiver Name');
        annexHead.push('Pincode', 'Dox\nType', 'Weight\n(Kg)', 'Amount');

        const annexBody = shipments.map(s => {
            const pinData = db.getPincode(s.destPincode);
            const isRisk = (s.riskSurcharge || 0) > 0;
            const row = [
                s.date, 
                s.awb + (isRisk ? '*' : ''), 
                (pinData && pinData.district ? pinData.district : 'LOCAL').toUpperCase(), 
                s.serviceType
            ];
            if (hasReceiver) row.push(s.receiver || '-');
            row.push(
                s.destPincode, 
                (s.deadWeight <= 0.25 ? 'D' : 'N'), 
                s.deadWeight.toFixed(2), 
                ((s.baseCharge||0)+(s.docketCharge||0)+(s.riskSurcharge||0)).toFixed(2)
            );
            return row;
        });

        doc.autoTable({
            startY: 32,
            head: [annexHead],
            body: annexBody,
            theme: 'grid',
            styles: { fontSize: 7 },
            headStyles: { fillColor: [240, 240, 240], textColor: 0 },
            columnStyles: { [annexHead.length - 1]: { halign: 'right' } }
        });

        const finalY2 = doc.lastAutoTable.finalY;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("TOTAL", 150, finalY2 + 8);
        doc.text((totals.sumBase + totals.sumDocket + totals.sumRisk).toFixed(2), 196, finalY2 + 8, { align: "right" });

        // --- Risk Surcharge Breakup Table ---
        const riskShipments = shipments.filter(s => (s.riskSurcharge || 0) > 0);
        if (riskShipments.length > 0) {
            doc.setFont("helvetica", "bold");
            doc.text("* Includes Risk Surcharge for high value consignments", 14, finalY2 + 20);
            const riskHead = [['Manifest Date', 'Consignment Number', 'Shipment Charges', 'Risk Surcharge', 'Total Amount']];
            const riskBody = riskShipments.map(s => [
                s.date,
                s.awb,
                ((s.baseCharge || 0) + (s.docketCharge || 0)).toFixed(2),
                (s.riskSurcharge || 0).toFixed(2),
                ((s.baseCharge || 0) + (s.docketCharge || 0) + (s.riskSurcharge || 0)).toFixed(2)
            ]);

            doc.autoTable({
                startY: finalY2 + 25,
                head: riskHead,
                body: riskBody,
                theme: 'grid',
                styles: { fontSize: 7 },
                headStyles: { fillColor: [240, 240, 240], textColor: 0 },
                columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' } }
            });
        }

        const cleanInv = invoiceNumber.replace(/[^a-z0-9]/gi, '_');
        doc.save(`${cleanInv}.pdf`);

        if (!arguments[7]) { // skipSave
            for (const s of shipments) { s.status = 'Billed'; s.invoiceNo = invoiceNumber; await db.saveShipment(s); }
            await db.saveInvoice({
                invoiceNo: invoiceNumber, companyId: comp.id, date: invDate, periodFrom, periodTo,
                totalAmount: totals.grandTotalRounded, timestamp: Date.now()
            });
            alert("Invoice Saved Successfully.");
        }
        await renderInvoicesView();
    } catch (err) { alert("PDF Error: " + err.message); }
}

window.openInvoiceWebview = function(comp, shipments, totals, invDate, periodFrom, periodTo, invoiceNumber) {
    const hasReceiver = shipments.some(s => s.receiver && s.receiver.trim() !== '');
    const win = window.open('', '_blank');
    win.document.write(`
        <html>
        <head>
            <title>Invoice - ${invoiceNumber}</title>
            <style>
                body { font-family: 'Helvetica', sans-serif; padding: 40px; background: #f1f5f9; color: #000; }
                .page { background: white; width: 210mm; min-height: 297mm; padding: 15mm; margin: 0 auto 20px auto; box-shadow: 0 10px 30px rgba(0,0,0,0.1); position: relative; }
                .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
                .company-info h1 { margin: 0; font-size: 22px; }
                .company-info p { margin: 1px 0; font-size: 12px; }
                .bill-section { display: grid; grid-template-columns: 1fr 1fr; gap: 0; margin-bottom: 20px; }
                .bill-box { border: 1px solid #000; padding: 10px; min-height: 120px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid #000; }
                th { background: #eee; padding: 8px; text-align: left; font-size: 11px; border: 1px solid #000; }
                td { padding: 8px; border: 1px solid #000; font-size: 12px; }
                .total-row { font-weight: bold; }
                .footer { margin-top: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                .sign-area { text-align: right; margin-top: 40px; }
                .no-print { position: fixed; top: 20px; right: 20px; background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; }
                @media print { .no-print { display: none; } body { background: white; padding: 0; } .page { box-shadow: none; margin: 0; } }
            </style>
        </head>
        <body>
            <button class="no-print" onclick="window.print()">Print or Save as PDF</button>
            <div class="page">
                <h1 style="text-align:center; margin-bottom:30px;">Tax Invoice</h1>
                <div class="header">
                    <div class="company-info">
                        <h1>SHIVANI ENTERPRISES</h1>
                        <p>NO. 1/4 PILLAYAR KOIL STREET,</p>
                        <p>PARIVAKKAM</p>
                        <p>CHENNAI - 600056.</p>
                        <p>TAMIL NADU, INDIA.</p>
                        <p>MOBILE: +91 9841399206 / 9444457926</p>
                        <p>MAIL ID: shivanienterprises036@gmail.com</p>
                        <p>State Code: 33 | GSTIN: 33AISPG4898G1ZR</p>
                    </div>
                    <div>
                        <img src="${DTDC_LOGO}" style="width:280px; height:auto; max-height:100px;">
                    </div>
                </div>

                <div class="bill-section">
                    <div class="bill-box">
                        <p><strong>Bill To,</strong></p>
                        <p><strong>${comp.name}</strong></p>
                        <p>${comp.address}</p>
                        <p>State Name: ${comp.stateName || 'TAMIL NADU'}</p>
                        <p>State Code: ${comp.stateCode || '33'}</p>
                        <p>GSTIN: ${comp.gstNo || '-'}</p>
                    </div>
                    <div class="bill-box">
                        <p>Invoice No: ${invoiceNumber}</p>
                        <p>Invoice Date: ${invDate}</p>
                        <p>Invoice Period: ${periodFrom} to ${periodTo}</p>
                        <p>SAC No: 9968</p>
                        <p>Description of service: Courier service</p>
                        <p>Place of Supply: ${comp.stateName || 'TAMIL NADU'}</p>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Sl No.</th>
                            <th>PARTICULARS</th>
                            <th>RATE (%)</th>
                            <th style="text-align:right">AMT (RS)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>1</td>
                            <td>COURIER SERVICE</td>
                            <td>-</td>
                            <td style="text-align:right">${(totals.sumBase + totals.sumDocket + totals.sumRisk).toFixed(2)}</td>
                        </tr>
                        ${totals.fuelSurcharge > 0 ? `
                        <tr>
                            <td>2</td>
                            <td>FUEL SURCHARGE</td>
                            <td>${totals.fuelPct}%</td>
                            <td style="text-align:right">${totals.fuelSurcharge.toFixed(2)}</td>
                        </tr>
                        ` : ''}
                        ${totals.isIgst ? `
                        <tr>
                            <td>3</td>
                            <td>IGST @ 18%</td>
                            <td>18%</td>
                            <td style="text-align:right">${totals.igst.toFixed(2)}</td>
                        </tr>
                        ` : `
                        <tr>
                            <td>3</td>
                            <td>CGST @ 9%</td>
                            <td>9%</td>
                            <td style="text-align:right">${totals.cgst.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td>4</td>
                            <td>SGST @ 9%</td>
                            <td>9%</td>
                            <td style="text-align:right">${totals.sgst.toFixed(2)}</td>
                        </tr>
                        `}
                        <tr>
                            <td></td>
                            <td>ROUND OFF</td>
                            <td>-</td>
                            <td style="text-align:right">${totals.roundOff.toFixed(2)}</td>
                        </tr>
                        <tr class="total-row">
                            <td colspan="3">TOTAL INVOICE VALUE</td>
                            <td style="text-align:right">${totals.grandTotalRounded.toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>

                <p><strong>Net Amount in words:</strong> ${numberToWords(totals.grandTotalRounded)}</p>
                <p><strong>Tax subject to reverse charge:</strong> NO</p>

                <div class="footer">
                    <div class="bill-box" style="min-height:80px;">
                        <p><strong>NOTES:</strong></p>
                        <p>1. Payments should be made in favour of SHIVANI ENTERPRISES</p>
                        <p>2. Payments are requested to be made within 15 working days</p>
                    </div>
                    <div class="bill-box" style="min-height:80px;">
                        <p><strong>BANK DETAILS:</strong></p>
                        <p>BANK NAME : BANK OF BARODA</p>
                        <p>A/C NO : 69640200001348 | IFSC: BARB0VJNAME</p>
                    </div>
                </div>
                <div class="sign-area">
                    <p>For <strong>SHIVANI ENTERPRISES</strong></p>
                    <br/><br/>
                    <p>Authorized Signatory</p>
                </div>
            </div>

            <div class="page">
                <h1 style="text-align:center">Consignment Summary Report</h1>
                <p>Statement for the period of ${periodFrom} to ${periodTo}</p>
                <table>
                    <thead>
                        <tr>
                            <th>Manifest Date</th>
                            <th>Consignment Number</th>
                            <th>Destination</th>
                            <th>Service Type</th>
                            ${hasReceiver ? '<th>Receiver Name</th>' : ''}
                            <th>Pincode</th>
                            <th>Dox Type</th>
                            <th>Weight (Kg)</th>
                            <th style="text-align:right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${shipments.map(s => {
                            const pinData = db.getPincode(s.destPincode);
                            const isRisk = (s.riskSurcharge || 0) > 0;
                            return `
                            <tr>
                                <td>${s.date}</td>
                                <td>${s.awb}${isRisk ? '*' : ''}</td>
                                <td>${(pinData?.district || 'LOCAL').toUpperCase()}</td>
                                <td>${s.serviceType}</td>
                                ${hasReceiver ? `<td>${s.receiver || '-'}</td>` : ''}
                                <td>${s.destPincode}</td>
                                <td>${s.deadWeight <= 0.25 ? 'D' : 'N'}</td>
                                <td>${s.deadWeight.toFixed(2)}</td>
                                <td style="text-align:right">${((s.baseCharge||0)+(s.docketCharge||0)+(s.riskSurcharge||0)).toFixed(2)}</td>
                            </tr>
                        `}).join('')}
                        <tr class="total-row">
                            <td colspan="${hasReceiver ? 8 : 7}">TOTAL</td>
                            <td style="text-align:right">${(totals.sumBase + totals.sumDocket + totals.sumRisk).toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>

                ${shipments.filter(s => (s.riskSurcharge || 0) > 0).length > 0 ? `
                    <h3 style="margin-top:30px;">* Includes Risk Surcharge for high value consignments</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Manifest Date</th>
                                <th>Consignment Number</th>
                                <th style="text-align:right">Shipment Charges</th>
                                <th style="text-align:right">Risk Surcharge</th>
                                <th style="text-align:right">Total Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${shipments.filter(s => (s.riskSurcharge || 0) > 0).map(s => `
                                <tr>
                                    <td>${s.date}</td>
                                    <td>${s.awb}</td>
                                    <td style="text-align:right">${((s.baseCharge || 0) + (s.docketCharge || 0)).toFixed(2)}</td>
                                    <td style="text-align:right">${(s.riskSurcharge || 0).toFixed(2)}</td>
                                    <td style="text-align:right">${((s.baseCharge || 0) + (s.docketCharge || 0) + (s.riskSurcharge || 0)).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : ''}
            </div>
        </body>
        </html>
    `);
    win.document.close();
};
