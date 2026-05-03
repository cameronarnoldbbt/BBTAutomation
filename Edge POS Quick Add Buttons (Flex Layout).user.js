// ==UserScript==
// @name         Edge POS Quick Add Buttons (2-Row Layout)
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Adds quick action buttons for common services (2 rows)
// @match        https://edge.bigbrandtire.com/pos/invoice/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    function createButton(label, itemId) {
        const btn = document.createElement('button');
        btn.textContent = label;

        btn.className = 'btn btn-info btn-sm';
        btn.style.padding = '4px 8px';
        btn.style.fontSize = '12px';
        btn.style.whiteSpace = 'nowrap';

        btn.addEventListener('click', () => {
            if (typeof addSingleItem === 'function') {
                addSingleItem(itemId);
            } else {
                const el = document.querySelector(`.info-box[onclick*="addSingleItem(${itemId})"]`);
                if (el) el.click();
                else console.warn(`Item ${itemId} not found`);
            }
        });

        return btn;
    }

    function injectButtons() {
        const alertBox = document.querySelector('#customerAlert');
        if (!alertBox) return;

        if (document.getElementById('tm-custom-buttons')) return;

        const container = document.createElement('div');
        container.id = 'tm-custom-buttons';

        // Main container styling
        container.style.display = 'flex';
        container.style.flexDirection = 'column'; // 👈 STACK ROWS
        container.style.gap = '6px';
        container.style.padding = '10px';
        container.style.marginBottom = '10px';
        container.style.background = '#222';
        container.style.border = '2px solid #5bc0de';
        container.style.borderRadius = '6px';

        // === ROW 1 ===
        const row1 = document.createElement('div');
        row1.style.display = 'flex';
        row1.style.flexWrap = 'nowrap';
        row1.style.gap = '8px';
        row1.style.overflowX = 'auto';

        row1.appendChild(createButton('Brake Inspection', 78));
        row1.appendChild(createButton('Tire Rotation', 65));
        row1.appendChild(createButton('Flat Repair', 82));
        row1.appendChild(createButton('OC Appointment', 35272));

        // === ROW 2 (ALIGNMENT) ===
        const row2 = document.createElement('div');
        row2.style.display = 'flex';
        row2.style.flexWrap = 'nowrap';
        row2.style.gap = '8px';
        row2.style.overflowX = 'auto';

        row2.appendChild(createButton('Alignment Check', 41));
        row2.appendChild(createButton('Alignment (Standard)', 62435));
        row2.appendChild(createButton('Alignment (Premium)', 62436));

        // Add rows to container
        container.appendChild(row1);
        container.appendChild(row2);

        // Insert above alert
        alertBox.parentNode.insertBefore(container, alertBox);
    }

    const observer = new MutationObserver(() => {
        injectButtons();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    injectButtons();
})();
