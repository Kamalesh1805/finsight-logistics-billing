import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, collection, doc, getDocs, setDoc, deleteDoc, 
    query, where, getDoc, updateDoc, onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Initialize Firebase
let app;
let firestore;
let isCloudEnabled = false;

if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY") {
    app = initializeApp(firebaseConfig);
    firestore = getFirestore(app);
    isCloudEnabled = true;
    console.log("LogisBill Pro: Cloud Sync Enabled.");
} else {
    console.warn("LogisBill Pro: Cloud Sync Disabled. Using Local Storage.");
}

const DB_KEY = 'logisbill_pro_db';

const defaultData = {
    companies: [],
    rateCards: [],
    shipments: [],
    invoices: [],
    users: []
};

// --- Local Storage Helpers (Fallback) ---
function getLocalDb() {
    const data = localStorage.getItem(DB_KEY);
    const parsed = data ? JSON.parse(data) : defaultData;
    if (!parsed.users) parsed.users = []; // Migrating older local DBs
    return parsed;
}

function saveLocalDb(data) {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
}

export const GST_STATE_CODES = {
    '01': 'JAMMU AND KASHMIR', '02': 'HIMACHAL PRADESH', '03': 'PUNJAB', '04': 'CHANDIGARH',
    '05': 'UTTARAKHAND', '06': 'HARYANA', '07': 'DELHI', '08': 'RAJASTHAN', '09': 'UTTAR PRADESH',
    '10': 'BIHAR', '11': 'SIKKIM', '12': 'ARUNACHAL PRADESH', '13': 'NAGALAND', '14': 'MANIPUR',
    '15': 'MIZORAM', '16': 'TRIPURA', '17': 'MEGHALAYA', '18': 'ASSAM', '19': 'WEST BENGAL',
    '20': 'JHARKHAND', '21': 'ODISHA', '22': 'CHHATTISGARH', '23': 'MADHYA PRADESH', '24': 'GUJARAT',
    '25': 'DAMAN AND DIU', '26': 'DADRA AND NAGAR HAVELI AND DAMAN AND DIU', '27': 'MAHARASHTRA', 
    '29': 'KARNATAKA', '30': 'GOA', '31': 'LAKSHADWEEP', '32': 'KERALA', '33': 'TAMIL NADU', 
    '34': 'PUDUCHERRY', '35': 'ANDAMAN AND NICOBAR ISLANDS', '36': 'TELANGANA', '37': 'ANDHRA PRADESH', 
    '38': 'LADAKH'
};

let memoryPincodes = [];
fetch('js/pincodes.json').then(r => r.json()).then(data => {
    memoryPincodes = data;
}).catch(err => console.error("Failed to load pincodes:", err));

// --- The Unified Database Interface ---
export const db = {
    isCloud: () => isCloudEnabled,

    // Auth Helpers
    getUser: () => JSON.parse(sessionStorage.getItem('finsight_session')),
    
    // User Management
    getAppUsers: async () => {
        if (!isCloudEnabled) return getLocalDb().users;
        const querySnapshot = await getDocs(collection(firestore, "app_users"));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    saveAppUser: async (userData) => {
        if (!isCloudEnabled) {
            const data = getLocalDb();
            const idx = data.users.findIndex(u => u.username === userData.username);
            if (idx > -1) data.users[idx] = userData;
            else data.users.push(userData);
            saveLocalDb(data);
            return;
        }
        await setDoc(doc(firestore, "app_users", userData.username), userData);
    },
    deleteAppUser: async (username) => {
        if (!isCloudEnabled) {
            const data = getLocalDb();
            data.users = data.users.filter(u => u.username !== username);
            saveLocalDb(data);
            return;
        }
        await deleteDoc(doc(firestore, "app_users", username));
    },

    // Companies
    getCompanies: async () => {
        if (!isCloudEnabled) return getLocalDb().companies;
        const querySnapshot = await getDocs(collection(firestore, "companies"));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    saveCompany: async (company) => {
        if (!isCloudEnabled) {
            const data = getLocalDb();
            if (company.id) {
                const idx = data.companies.findIndex(c => c.id === company.id);
                if (idx > -1) data.companies[idx] = company;
            } else {
                company.id = 'COMP-' + Date.now();
                data.companies.push(company);
            }
            saveLocalDb(data);
            return company.id;
        }
        const id = company.id || 'COMP-' + Date.now();
        await setDoc(doc(firestore, "companies", id), { ...company, id });
        return id;
    },
    deleteCompany: async (id) => {
        if (!isCloudEnabled) {
            const data = getLocalDb();
            data.companies = data.companies.filter(c => c.id !== id);
            saveLocalDb(data);
            return;
        }
        await deleteDoc(doc(firestore, "companies", id));
    },
    getCompanyById: async (id) => {
        if (!isCloudEnabled) return getLocalDb().companies.find(c => c.id === id);
        const docSnap = await getDoc(doc(firestore, "companies", id));
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    },

    // Rate Cards
    getRateCards: async () => {
        if (!isCloudEnabled) return getLocalDb().rateCards;
        const querySnapshot = await getDocs(collection(firestore, "rateCards"));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    getRateCardByCompanyId: async (companyId) => {
        if (!isCloudEnabled) return getLocalDb().rateCards.find(rc => rc.companyId === companyId);
        const q = query(collection(firestore, "rateCards"), where("companyId", "==", companyId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.empty ? null : { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
    },
    saveRateCard: async (rateCard) => {
        if (!isCloudEnabled) {
            const data = getLocalDb();
            const idx = data.rateCards.findIndex(rc => rc.companyId === rateCard.companyId);
            if (idx > -1) data.rateCards[idx] = rateCard;
            else {
                rateCard.id = 'RC-' + Date.now();
                data.rateCards.push(rateCard);
            }
            saveLocalDb(data);
            return;
        }
        const id = rateCard.id || 'RC-' + Date.now();
        await setDoc(doc(firestore, "rateCards", id), { ...rateCard, id });
    },

    // Pincodes
    getPincodes: () => memoryPincodes,
    getPincode: (pin) => memoryPincodes.find(p => String(p.pincode) === String(pin)),

    // Shipments
    getShipments: async () => {
        if (!isCloudEnabled) return getLocalDb().shipments || [];
        const querySnapshot = await getDocs(collection(firestore, "shipments"));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    saveShipment: async (shipment) => {
        if (!isCloudEnabled) {
            const data = getLocalDb();
            if (shipment.id) {
                const idx = data.shipments.findIndex(s => s.id === shipment.id);
                if (idx > -1) data.shipments[idx] = shipment;
            } else {
                shipment.id = 'SHP-' + Date.now() + '-' + Math.floor(Math.random()*1000);
                data.shipments.push(shipment);
            }
            saveLocalDb(data);
            return shipment.id;
        }
        const id = shipment.id || 'SHP-' + Date.now() + '-' + Math.floor(Math.random()*1000);
        await setDoc(doc(firestore, "shipments", id), { ...shipment, id });
        return id;
    },
    saveShipments: async (shipmentsArray) => {
        for (const s of shipmentsArray) {
            await db.saveShipment(s);
        }
    },
    deleteShipment: async (id) => {
        if (!isCloudEnabled) {
            const data = getLocalDb();
            data.shipments = data.shipments.filter(s => s.id !== id);
            saveLocalDb(data);
            return;
        }
        await deleteDoc(doc(firestore, "shipments", id));
    },

    // Invoices
    getInvoices: async () => {
        if (!isCloudEnabled) return getLocalDb().invoices || [];
        const querySnapshot = await getDocs(collection(firestore, "invoices"));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    saveInvoice: async (invoice) => {
        if (!isCloudEnabled) {
            const data = getLocalDb();
            if (invoice.id) {
                const idx = data.invoices.findIndex(i => i.id === invoice.id);
                if (idx > -1) data.invoices[idx] = invoice;
            } else {
                invoice.id = 'INV-' + Date.now();
                data.invoices.push(invoice);
            }
            saveLocalDb(data);
            return invoice.id;
        }
        const id = invoice.id || 'INV-' + Date.now();
        await setDoc(doc(firestore, "invoices", id), { ...invoice, id });
        return id;
    },
    deleteInvoice: async (id) => {
        const invoices = await db.getInvoices();
        const inv = invoices.find(i => i.id === id);
        if (!inv) return;
        const shipments = await db.getShipments();
        const relevantShipments = shipments.filter(s => s.invoiceNo === inv.invoiceNo);
        for (const s of relevantShipments) {
            s.status = 'Pending';
            delete s.invoiceNo;
            await db.saveShipment(s);
        }
        if (!isCloudEnabled) {
            const data = getLocalDb();
            data.invoices = data.invoices.filter(i => i.id !== id);
            saveLocalDb(data);
            return;
        }
        await deleteDoc(doc(firestore, "invoices", id));
    }
};
