// ==UserScript==
// @name         Your Voids WORKING
// @match        *://edge.bigbrandtire.com/*
// @version      1.0
// @updateURL    https://github.com/cameronarnoldbbt/BBTAutomation/raw/refs/heads/main/Your%20Voids.user.js
// @downloadURL  https://github.com/cameronarnoldbbt/BBTAutomation/raw/refs/heads/main/Your%20Voids.user.js
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRMetfRl9lkfY9Fu4bJnAopzPqMhl0QyvFkXjWfeLx8O0op2hPQfUsHo9WfnPp53qdvM2clATouCMhw/pub?output=csv';
    const INVOICE_KEY = 'invoice_reprint_flow';

    // ===== STORAGE =====
    function getCleared() {
        return JSON.parse(localStorage.getItem('bbtClearedVoids') || '[]');
    }

    function saveCleared(list) {
        localStorage.setItem('bbtClearedVoids', JSON.stringify(list));
    }

    function markCleared(estimate) {
        const cleared = getCleared();
        if (!cleared.includes(estimate)) {
            cleared.push(estimate);
            saveCleared(cleared);
        }
    }

    function getUserCode() {
        let code = localStorage.getItem('bbtUserCode');
        if (!code) {
            code = prompt('Enter your employee code (example: CA978)');
            if (code) {
                code = code.trim().toUpperCase();
                localStorage.setItem('bbtUserCode', code);
            }
        }
        return code;
    }

    function parseCSV(text) {
        return text.split('\n').map(r => r.split(','));
    }

    async function fetchCSV() {
        const res = await fetch(CSV_URL);
        const text = await res.text();
        return parseCSV(text);
    }

    function filterRows(rows, userCode) {
        const cleared = getCleared();

        return rows.slice(1).filter(row => {
            return (
                (row[0] || '').toUpperCase().includes(`(${userCode})`) &&
                !cleared.includes(row[2])
            );
        });
    }

    function buildRow(row) {
        const customer = row[0];
        const store = row[1];
        const estimate = row[2];
        const phone = row[3];
        const created = row[4];
        const total = row[8];

        return `
        <div class="invoiceDetailRows row label-invoice-warning" data-estimate="${estimate}">
            <div class="col-lg-1 invoiceBorderRight centerVertical">${estimate}</div>
            <div class="col-lg-2 invoiceBorderRight">${customer}</div>
            <div class="col-lg-1 invoiceBorderRight">$${total}</div>
            <div class="col-lg-1 invoiceBorderRight">${created}</div>
            <div class="col-lg-2 invoiceBorderRight">${phone}</div>
            <div class="col-lg-2 invoiceBorderRight">${store}</div>

            <!-- 🔍 SEARCH COLUMN -->
            <div class="col-lg-1 invoiceBorderRight">
                <button class="searchBtn" data-phone="${phone}"
                    style="background:#007bff;color:white;border:none;padding:4px 8px;border-radius:4px;">
                    🔍
                </button>
            </div>

            <!-- ✅ CLEAR COLUMN -->
            <div class="col-lg-1">
                <button class="clearBtn"
                    style="background:#28a745;color:white;border:none;padding:4px 8px;border-radius:4px;">
                    ✓
                </button>
            </div>
        </div>
        `;
    }

    function attachHandlers() {
        // SEARCH
        document.querySelectorAll('.searchBtn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const phone = e.target.getAttribute('data-phone');

                localStorage.setItem(INVOICE_KEY, JSON.stringify({
                    phone,
                    ts: Date.now()
                }));

                document.querySelector('a[href="/pos/main/invoicereprint"]')?.click();
            });
        });

        // CLEAR
        document.querySelectorAll('.clearBtn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const rowEl = e.target.closest('.invoiceDetailRows');
                const estimate = rowEl.getAttribute('data-estimate');

                markCleared(estimate);
                rowEl.remove();

                updateBadge(document.querySelectorAll('.invoiceDetailRows').length);
            });
        });
    }

    async function loadCustomData() {
        const container = document.querySelector('.indexv2Container');
        if (!container) return;

        const userCode = getUserCode();
        const rows = await fetchCSV();
        const filtered = filterRows(rows, userCode);

        container.innerHTML = filtered.map(buildRow).join('');

        attachHandlers();
        updateBadge(filtered.length);
    }

    function updateHeaders() {
        const headers = document.querySelectorAll('.invoiceResultHeaders');

        headers.forEach(header => {
            const text = header.innerText.trim();

            if (text.startsWith('Appt')) header.innerHTML = 'Phone';
            if (text.includes('Prom')) header.innerHTML = 'Store';
            if (text.startsWith('Vehicle')) header.innerHTML = 'Search 🔍';
            if (text.startsWith('Team')) header.innerHTML = 'Clear';
        });
    }

    function setActive(tab) {
        document.querySelectorAll('#ticketTypeSelector li')
            .forEach(el => el.classList.remove('active'));
        tab.classList.add('active');
    }

    function updateBadge(count) {
        const badge = document.querySelector('#yourVoidsTab span');
        if (badge) badge.textContent = count;
    }

    function addTab() {
        const nav = document.querySelector('#ticketTypeSelector');
        if (!nav) return;

        if (document.getElementById('yourVoidsTab')) return;

        const li = document.createElement('li');
        li.id = 'yourVoidsTab';

        li.innerHTML = `<a href="#">Your Voids <span>0</span></a>`;
        nav.appendChild(li);

        li.addEventListener('click', async () => {
            setActive(li);
            await loadCustomData();
            updateHeaders();
        });
    }

    new MutationObserver(addTab).observe(document.body, { childList: true, subtree: true });

})();
