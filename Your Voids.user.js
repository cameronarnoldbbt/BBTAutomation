// ==UserScript==
// @name         Your Voids WORKING
// @match        https://edge.bigbrandtire.com/pos/*
// @version      1.0
// @updateURL    https://github.com/cameronarnoldbbt/BBTAutomation/raw/refs/heads/main/Your%20Voids.user.js
// @downloadURL  https://github.com/cameronarnoldbbt/BBTAutomation/raw/refs/heads/main/Your%20Voids.user.js
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRMetfRl9lkfY9Fu4bJnAopzPqMhl0QyvFkXjWfeLx8O0op2hPQfUsHo9WfnPp53qdvM2clATouCMhw/pub?output=csv';

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

    // ===== USER =====
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
            const agentMatch = (row[0] || '').toUpperCase().includes(`(${userCode})`);
            const notCleared = !cleared.includes(row[2]); // estimate

            return agentMatch && notCleared;
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
            <div class="col-lg-1">
                <button class="clearBtn" style="background:#28a745;color:white;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;">
                    ✓
                </button>
            </div>
        </div>
        `;
    }

    function attachClearHandlers() {
        document.querySelectorAll('.clearBtn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const rowEl = e.target.closest('.invoiceDetailRows');
                const estimate = rowEl.getAttribute('data-estimate');

                markCleared(estimate);

                // remove from UI instantly
                rowEl.remove();

                // update badge
                const remaining = document.querySelectorAll('.invoiceDetailRows').length;
                updateBadge(remaining);
            });
        });
    }

    async function loadCustomData() {
        const container = document.querySelector('.indexv2Container');
        if (!container) return;

        const userCode = getUserCode();
        const rows = await fetchCSV();
        const filtered = filterRows(rows, userCode);

        container.innerHTML = '';

        if (filtered.length === 0) {
            container.innerHTML = `<div style="padding:20px;">No results found</div>`;
            return;
        }

        container.innerHTML = filtered.map(buildRow).join('');

        attachClearHandlers();
        updateBadge(filtered.length);
    }

function updateHeaders() {
    const headers = document.querySelectorAll('.invoiceResultHeaders');

    headers.forEach(header => {
        const text = header.innerText.trim();

        // Appt Time → Phone
        if (text.startsWith('Appt')) {
            header.innerHTML = 'Phone&nbsp;&nbsp;&nbsp;';
        }

        // Prom Time → Store
        if (text.includes('Prom')) {
            header.innerHTML = 'Store&nbsp;&nbsp;&nbsp;';
        }

        // Vehicle → Clear
        if (text.startsWith('Vehicle')) {
            header.innerHTML = 'Clear&nbsp;&nbsp;&nbsp;';
        }
    });

    console.log('✅ Headers updated (Phone / Store / Clear)');
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

    const observer = new MutationObserver(addTab);
    observer.observe(document.body, { childList: true, subtree: true });

})();
