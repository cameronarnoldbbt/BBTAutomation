// ==UserScript==
// @name         Store Message Dialog
// @match        https://edge.bigbrandtire.com/pos/invoice/*
// @version      2.0
// @updateURL    https://github.com/cameronarnoldbbt/BBTAutomation/raw/refs/heads/main/Store%20Message%20Dialog-0.0.user.js
// @downloadURL  https://github.com/cameronarnoldbbt/BBTAutomation/raw/refs/heads/main/Store%20Message%20Dialog-0.0.user.js
// @grant        GM_xmlhttpRequest
// @connect      docs.google.com
// @connect      googleusercontent.com
// ==/UserScript==

(function () {
    'use strict';

    const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTWUMREqBvkZp3KC-TbafN_tOwT0nDL1TP-qlS-d12-vrN77LZZHYZRnj1T-yBkHy2pMTQ2hpPw9b_-/pub?output=csv';
    const REFRESH_INTERVAL = 60000;

    let cachedMessage = null;
    let lastAcknowledgedMessage = null;

    // ✅ Get store
    function getMainStore() {
        const el = document.querySelector('#storeNumber');
        return el ? el.innerText.trim() : null;
    }

    // ✅ Parse CSV
    function parseCSV(text) {
        return text.split('\n').map(r => r.split(','));
    }

 function findMessage(rows, storeNumber) {
    const MAX_ROW = 31; // 👈 stops before row 32 (0-index handled below)

    for (let i = 0; i < rows.length; i++) {
        if (i >= MAX_ROW) break; // 👈 ignore B32+

        const row = rows[i];

        const store = row[1]?.trim();
        const message = row[2]?.trim();

        if (store === storeNumber && message) {
            return message;
        }
    }
    return null;
}

    // ✅ Preload
    function preloadMessage() {
        const store = getMainStore();
        if (!store) return;

        GM_xmlhttpRequest({
            method: 'GET',
            url: SHEET_URL + '&t=' + Date.now(),
            onload: function (res) {
                const rows = parseCSV(res.responseText);
                cachedMessage = findMessage(rows, store) || null;

                console.log('[Preloaded]', store, cachedMessage);
            }
        });
    }

    // ✅ Modal popup (FORCE ON TOP)
    function showDialog(message) {
        if (!message) return;
        if (message === lastAcknowledgedMessage) return;
        if (document.getElementById('store-message-modal')) return;

        const overlay = document.createElement('div');
        overlay.id = 'store-message-modal';

        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.background = 'rgba(0,0,0,0.7)';
        overlay.style.zIndex = '2147483647'; // 🔥 max z-index
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';

        const box = document.createElement('div');
        box.style.background = '#fff';
        box.style.padding = '30px';
        box.style.borderRadius = '10px';
        box.style.textAlign = 'center';
        box.style.maxWidth = '500px';

        const text = document.createElement('div');
        text.innerText = message;
        text.style.color = 'red';
        text.style.fontSize = '22px';
        text.style.fontWeight = 'bold';
        text.style.marginBottom = '20px';

        const button = document.createElement('button');
        button.innerText = 'Acknowledge';
        button.style.padding = '10px 20px';
        button.style.fontSize = '16px';

        button.onclick = function () {
            lastAcknowledgedMessage = message;
            overlay.remove();
        };

        box.appendChild(text);
        box.appendChild(button);
        overlay.appendChild(box);
        document.body.appendChild(overlay);
    }

    // ✅ Detect appointment modal OPEN (reliable)
    function observeAppointmentsModal() {
        const observer = new MutationObserver(() => {
            const modal = document.querySelector('.modal.in'); // 🔥 only visible modals
            if (!modal) return;

            const title = modal.querySelector('.modal-title');
            if (!title || !title.innerText.includes('Set Appointment')) return;

            console.log('[Appointment Modal Detected]');

            // 🔥 slight delay ensures it's fully rendered
            setTimeout(() => {
                if (cachedMessage) {
                    console.log('[Showing Cached Message]', cachedMessage);
                    showDialog(cachedMessage);
                } else {
                    console.log('[No Cached Message Yet]');
                }
            }, 150);
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // ✅ Init
    function init() {
        const interval = setInterval(() => {
            const store = getMainStore();
            if (store) {
                clearInterval(interval);

                preloadMessage();
                setInterval(preloadMessage, REFRESH_INTERVAL);
                observeAppointmentsModal();
            }
        }, 500);
    }

    init();

})();
