import { db } from '../db.js';

export async function renderSettingsView() {
    const user = db.getUser();
    const isAdmin = user && user.role === 'admin';
    const appUsers = isAdmin ? await db.getAppUsers() : [];
    
    let html = `
        <div class="page-header">
            <div>
                <h1>Settings</h1>
                <p>Manage system preferences and user access.</p>
            </div>
        </div>

        <div style="display:grid; grid-template-columns: 1fr; gap:24px;">
            <div class="glass-panel">
                <h3 style="margin-bottom:20px;">User Profile</h3>
                <div style="display:flex; align-items:center; gap:20px; padding:15px; background:rgba(255,255,255,0.05); border-radius:12px;">
                    <div style="width:60px; height:60px; border-radius:50%; background:var(--primary); display:flex; align-items:center; justify-content:center; font-size:24px; font-weight:700;">
                        ${user.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h4 style="font-size:18px;">${user.username}</h4>
                        <p style="color:var(--text-muted); font-size:14px; text-transform:capitalize;">${user.role} Account</p>
                    </div>
                </div>
            </div>

            ${isAdmin ? `
            <div class="glass-panel">
                <div class="panel-header">
                    <h3>User Management</h3>
                    <button class="btn-primary" id="btn-add-user" style="padding:6px 12px; font-size:12px;">
                        <i class="fas fa-plus"></i> Create User
                    </button>
                </div>
                <p style="color:var(--text-muted); font-size:13px; margin-bottom:20px;">
                    Generate credentials for your staff members to access the cloud dashboard.
                </p>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Username</th>
                                <th>Password</th>
                                <th>Role</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${appUsers.map(u => `
                                <tr>
                                    <td style="font-weight:600; color:var(--primary);">${u.username}</td>
                                    <td style="font-family:monospace;">${u.password}</td>
                                    <td style="text-transform:capitalize;">${u.role}</td>
                                    <td>
                                        ${u.username === 'admin' ? '<span style="font-size:10px; color:var(--text-muted);">Protected</span>' : `
                                        <button class="btn-remove-user" data-id="${u.username}" style="background:none; border:none; color:var(--danger); cursor:pointer;">
                                            <i class="fas fa-trash-can"></i>
                                        </button>
                                        `}
                                    </td>
                                </tr>
                            `).join('') || '<tr><td colspan="4" style="text-align:center; padding:20px; color:var(--text-muted);">No staff users created yet.</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
            ` : `
            <div class="glass-panel" style="border-color:var(--warning);">
                <p style="color:var(--warning); text-align:center; padding:20px;">
                    <i class="fas fa-lock"></i> User management is restricted to Administrators only.
                </p>
            </div>
            `}
        </div>

        <!-- Add User Modal -->
        <div id="user-modal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.8); backdrop-filter:blur(5px); z-index:1000; align-items:center; justify-content:center;">
            <div class="glass-panel" style="width:400px; padding:30px;">
                <h3 style="margin-bottom:20px;">Create New User</h3>
                <div class="form-group" style="margin-bottom:15px;">
                    <label style="display:block; font-size:12px; color:var(--text-muted); margin-bottom:5px;">Username</label>
                    <input type="text" id="nu-name" placeholder="e.g. kamal_staff" style="width:100%; padding:10px; border-radius:8px; border:1px solid var(--border); background:var(--bg-dark); color:white;">
                </div>
                <div class="form-group" style="margin-bottom:15px;">
                    <label style="display:block; font-size:12px; color:var(--text-muted); margin-bottom:5px;">Password</label>
                    <input type="text" id="nu-pass" placeholder="Enter password" style="width:100%; padding:10px; border-radius:8px; border:1px solid var(--border); background:var(--bg-dark); color:white;">
                </div>
                <div class="form-group" style="margin-bottom:20px;">
                    <label style="display:block; font-size:12px; color:var(--text-muted); margin-bottom:5px;">Role</label>
                    <select id="nu-role" style="width:100%; padding:10px; border-radius:8px; border:1px solid var(--border); background:var(--bg-dark); color:white;">
                        <option value="staff">Staff</option>
                        <option value="admin">Administrator</option>
                    </select>
                </div>
                <div style="display:flex; justify-content:flex-end; gap:10px;">
                    <button onclick="document.getElementById('user-modal').style.display='none'" style="padding:10px 20px; border-radius:8px; background:var(--surface-light); border:none; color:white; cursor:pointer;">Cancel</button>
                    <button id="btn-save-user" class="btn-primary">Create Account</button>
                </div>
            </div>
        </div>
    `;

    const viewEl = document.getElementById('view-settings');
    if(viewEl) viewEl.innerHTML = html;

    // Event Listeners
    if (isAdmin) {
        document.getElementById('btn-add-user').onclick = () => {
            document.getElementById('user-modal').style.display = 'flex';
        };

        document.getElementById('btn-save-user').onclick = async () => {
            const username = document.getElementById('nu-name').value.trim();
            const password = document.getElementById('nu-pass').value.trim();
            const role = document.getElementById('nu-role').value;

            if (!username || !password) return alert("Username and Password are required.");
            
            await db.saveAppUser({ username, password, role });
            document.getElementById('user-modal').style.display = 'none';
            renderSettingsView();
        };

        document.querySelectorAll('.btn-remove-user').forEach(btn => {
            btn.onclick = async () => {
                const id = btn.getAttribute('data-id');
                if (confirm(`Delete user account "${id}"?`)) {
                    await db.deleteAppUser(id);
                    renderSettingsView();
                }
            };
        });
    }
}
