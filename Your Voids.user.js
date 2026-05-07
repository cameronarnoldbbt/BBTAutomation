// ==UserScript==
// @name         Your Voids
// @match        https://edge.bigbrandtire.com/pos/*
// @version      1.0
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRMetfRl9lkfY9Fu4bJnAopzPqMhl0QyvFkXjWfeLx8O0op2hPQfUsHo9WfnPp53qdvM2clATouCMhw/pub?output=csv';

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
        return rows.slice(1).filter(row => {
            return (row[0] || '').toUpperCase().includes(`(${userCode})`);
        });
    }

    function buildRow(row) {
        const customer = row[0];     // Agent
        const store = row[1];        // StoreNumber
        const estimate = row[2];     // Estimate
        const phone = row[3];        // CustomerPhoneNumber
        const created = row[4];      // Date Created
        const total = row[8];        // Estimate Total

        return `
        <div class="invoiceDetailRows row label-invoice-warning">
            <div class="col-lg-1 invoiceBorderRight centerVertical">${estimate}</div>

            <div class="col-lg-2 invoiceBorderRight">${customer}</div>

            <div class="col-lg-1 invoiceBorderRight">$${total}</div>

            <!-- Created (FIXED) -->
            <div class="col-lg-1 invoiceBorderRight">${created}</div>

            <!-- Phone -->
            <div class="col-lg-2 invoiceBorderRight">${phone}</div>

            <!-- Store -->
            <div class="col-lg-2 invoiceBorderRight">${store}</div>

            <div class="col-lg-2 invoiceBorderRight">-</div>

            <div class="col-lg-1">${localStorage.getItem('bbtUserCode')}</div>
        </div>
        `;
    }

    async function loadCustomData() {
        const container = document.querySelector('.indexv2Container');

        if (!container) {
            console.warn('❌ Could not find indexv2Container');
            return;
        }

        const userCode = getUserCode();
        const rows = await fetchCSV();
        const filtered = filterRows(rows, userCode);

        container.innerHTML = '';

        if (filtered.length === 0) {
            container.innerHTML = `<div style="padding:20px;">No results found</div>`;
            return;
        }

        container.innerHTML = filtered.map(buildRow).join('');

        updateBadge(filtered.length);
    }

  function updateHeaders() {
    const headers = document.querySelectorAll('.invoiceResultHeaders');

    headers.forEach(header => {
        const text = header.innerText.trim();

        // Appt Time → Phone
        if (text.startsWith('Appt')) {
            header.innerHTML = 'Phone&nbsp;&nbsp;&nbsp;<i class="fa"></i>';
        }

        // Prom Time Last Touched → Store (FULL REPLACE)
        if (text.includes('Prom')) {
            header.innerHTML = 'Store&nbsp;&nbsp;&nbsp;<i class="fa"></i>';
        }
    });

    console.log('✅ Headers fully updated');
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