// ==UserScript==
// @name         Edge POS Quick Add Buttons (Flex Layout)
// @namespace    http://tampermonkey.net/
// @version      2.1
// @description  Adds quick action buttons for common services
// @match        https://edge.bigbrandtire.com/pos/invoice/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    function createButton(label, itemId) {
        const btn = document.createElement('button');
        btn.textContent = label;

        // Bootstrap-style + tighter sizing
        btn.className = 'btn btn-info btn-sm';
        btn.style.padding = '4px 8px';
        btn.style.fontSize = '12px';
        btn.style.whiteSpace = 'nowrap'; // prevent text wrapping inside button

        btn.addEventListener('click', () => {
            // Preferred: direct function call
            if (typeof addSingleItem === 'function') {
                addSingleItem(itemId);
            } else {
                // Fallback: DOM click
                const el = document.querySelector(`.info-box[onclick*="addSingleItem(${itemId})"]`);
                if (el) {
                    el.click();
                } else {
                    console.warn(`Item ${itemId} not found`);
                }
            }
        });

        return btn;
    }

    function injectButtons() {
        const alertBox = document.querySelector('#customerAlert');
        if (!alertBox) return;

        // Prevent duplicates
        if (document.getElementById('tm-custom-buttons')) return;

        const container = document.createElement('div');
        container.id = 'tm-custom-buttons';

        // 🔥 FLEX LAYOUT (no wrapping, scroll if needed)
        container.style.display = 'flex';
        container.style.flexWrap = 'nowrap';
        container.style.alignItems = 'center';
        container.style.gap = '8px';
        container.style.overflowX = 'auto';

        // Visual styling
        container.style.padding = '10px';
        container.style.marginBottom = '10px';
        container.style.background = '#222';
        container.style.border = '2px solid #5bc0de';
        container.style.borderRadius = '6px';
        container.style.zIndex = '9999';

        // === BUTTONS ===
        container.appendChild(createButton('Brake Inspection', 78));
        container.appendChild(createButton('Tire Rotation', 65));
        container.appendChild(createButton('Flat Repair', 82));
        container.appendChild(createButton('Alignment Check', 41));
        container.appendChild(createButton('OC Appointment', 35272));

        // Insert ABOVE alert
        alertBox.parentNode.insertBefore(container, alertBox);
    }

    // Observe dynamic changes
    const observer = new MutationObserver(() => {
        injectButtons();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Initial run
    injectButtons();
})();