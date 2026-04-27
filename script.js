const API_BASE = "https://library-system-0dhu.onrender.com/api";

// 1. சென்டர் நோட்டிபிகேஷன் (SweetAlert2)
function notify(title, text, icon) {
    Swal.fire({
        title: title,
        text: text,
        icon: icon,
        confirmButtonColor: '#3b82f6',
        timer: 2000,
        showConfirmButton: false,
        position: 'center'
    });
}

// 2. செக்ஷன் மாற்றுவது (Nav Logic)
function showSection(id, element) {
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    if(element) element.classList.add('active');

    const sections = ['users', 'books', 'add', 'issue'];
    sections.forEach(s => {
        const el = document.getElementById(s + '-section');
        if(el) el.style.display = (s === id) ? 'block' : 'none';
    });

    const titleMap = { 'users': 'Registered Users', 'books': 'Library Inventory', 'add': 'Quick Registration', 'issue': 'Issue/Return Desk' };
    document.getElementById('page-title').innerText = titleMap[id] || 'Admin Dashboard';

    if(id === 'users') fetchUsers();
    if(id === 'books') fetchBooks();
}

// 3. Fetch Users
async function fetchUsers() {
    try {
        const res = await fetch(`${API_BASE}/users`);
        const users = await res.json();
        const tbody = document.getElementById('user-body');
        tbody.innerHTML = users.map(u => `
            <tr>
                <td>#${u.id}</td>
                <td><b>${u.name}</b></td>
                <td>${u.email}</td>
                <td>${u.phoneNumber}</td>
                <td>
                    <button class="action-btn btn-view" onclick="showUserHistory(${u.id})">History</button>
                    <button class="action-btn btn-del" onclick="deleteEntry('users', ${u.id})">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch (e) { console.error("Error fetching users", e); }
}

// 4. Fetch Books
async function fetchBooks() {
    try {
        const res = await fetch(`${API_BASE}/books`);
        const books = await res.json();
        const tbody = document.getElementById('book-body');
        tbody.innerHTML = books.map(b => `
            <tr>
                <td>#${b.id}</td>
                <td><b>${b.title}</b></td>
                <td>${b.author}</td>
                <td>${b.availableQuantity} / ${b.totalQuantity}</td>
                <td>
                    <button class="action-btn btn-view" onclick="showBookHistory(${b.id})">Track</button>
                    <button class="action-btn btn-del" onclick="deleteEntry('books', ${b.id})">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch (e) { console.error("Error fetching books", e); }
}

// 5. Submit User
async function handleUserSubmit(e) {
    e.preventDefault();
    const data = {
        name: document.getElementById('uName').value,
        email: document.getElementById('uEmail').value,
        phoneNumber: document.getElementById('uPhone').value,
        role: "STUDENT"
    };

    const res = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    });

    if(res.ok) {
        notify('Success!', 'Member registered! ✅', 'success');
        e.target.reset();
        showSection('users', document.querySelector('.nav-link'));
    } else {
        const err = await res.json();
        notify('Oops!', err.message || 'Duplicate data found', 'error');
    }
}

// 6. Submit Book
async function handleBookSubmit(e) {
    e.preventDefault();
    const data = {
        title: document.getElementById('bTitle').value,
        author: document.getElementById('bAuthor').value,
        category: document.getElementById('bCategory').value,
        isbn: document.getElementById('bIsbn').value,
        totalQuantity: parseInt(document.getElementById('bQty').value),
        availableQuantity: parseInt(document.getElementById('bQty').value)
    };

    const res = await fetch(`${API_BASE}/books`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    });

    if(res.ok) {
        notify('Success!', 'Book added to shelves! 📚', 'success');
        e.target.reset();
        showSection('books', document.querySelectorAll('.nav-link')[1]);
    } else {
        const err = await res.json();
        notify('Error', err.message || 'Failed to add', 'error');
    }
}

// 7. Issue Book
async function handleIssueSubmit(e) {
    e.preventDefault();
    const uId = document.getElementById('issueUId').value;
    const bId = document.getElementById('issueBId').value;
    const res = await fetch(`${API_BASE}/issue?userId=${uId}&bookId=${bId}`, { method: 'POST' });
    if(res.ok) {
        notify('Issued!', 'Book handover successful 📖', 'success');
        e.target.reset();
    } else {
        notify('Failed', await res.text(), 'warning');
    }
}

// 8. Delete Entry
async function deleteEntry(type, id) {
    const confirm = await Swal.fire({
        title: 'Delete this?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it!'
    });

    if(confirm.isConfirmed) {
        const res = await fetch(`${API_BASE}/${type}/${id}`, { method: 'DELETE' });
        if(res.ok) {
            notify('Deleted!', 'Record removed.', 'success');
            type === 'users' ? fetchUsers() : fetchBooks();
        } else {
            notify('Denied', await res.text(), 'error');
        }
    }
}

// 9. History Logic
async function showUserHistory(id) {
    const res = await fetch(`${API_BASE}/issues/user/${id}`);
    const data = await res.json();
    let html = `<h3>User History (ID: ${id})</h3><table><tr><th>Book</th><th>Action</th></tr>`;
    data.forEach(t => {
        html += `<tr><td>${t.book.title}</td><td>${t.returnDate ? 'Returned' : `<button onclick="returnBook(${t.id})">Return</button>`}</td></tr>`;
    });
    html += `</table>`;
    openModal(html);
}

async function showBookHistory(id) {
    const res = await fetch(`${API_BASE}/issues/book/${id}`);
    const data = await res.json();
    let html = `<h3>Book Track (ID: ${id})</h3><table><tr><th>User</th><th>Status</th></tr>`;
    data.forEach(t => {
        html += `<tr><td>${t.user.name}</td><td>${t.returnDate ? 'Returned' : 'Active'}</td></tr>`;
    });
    html += `</table>`;
    openModal(html);
}

async function returnBook(tId) {
    const res = await fetch(`${API_BASE}/return/${tId}`, { method: 'POST' });
    if(res.ok) { notify('Success!', 'Book Returned 🔄', 'success'); closeModal(); fetchBooks(); }
}

function openModal(content) {
    document.getElementById('modal-body').innerHTML = content;
    document.getElementById('details-modal').style.display = 'flex';
}
function closeModal() { document.getElementById('details-modal').style.display = 'none'; }

window.onload = () => fetchUsers();