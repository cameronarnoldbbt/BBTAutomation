
// ==UserScript==
// @name         Tire → USAF Button (Final)
// @match        *://edge.bigbrandtire.com/POS/Tire/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    function injectButton() {
        const sizeEl = document.getElementById('currentTireSize');
        if (!sizeEl) return;

        if (document.getElementById('usaf-btn')) return;

        const storeEl = document.getElementById('storeNumber');
        if (!storeEl) return;

        const btn = document.createElement('button');
        btn.id = 'usaf-btn';
        btn.innerText = 'Search USAF';
        btn.style.marginLeft = '10px';
        btn.style.padding = '4px 8px';
        btn.style.cursor = 'pointer';

        btn.onclick = () => {
            const rawSize = sizeEl.innerText.trim(); // 215/45R18
            const store = storeEl.innerText.trim();

            // Convert → 2154518
            const formatted = rawSize
                .replace('/', '')
                .replace('R', '');

            const url = `https://shop.usautoforce.com/Tires/Search/ByTireSize?tireSize=${formatted}&store=${store}`;

            console.log("[TM] Opening USAF:", url);

            window.open(url, '_blank');
        };

        sizeEl.parentElement.appendChild(btn);

        console.log("[TM] USAF button injected");
    }

    const observer = new MutationObserver(injectButton);
    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(injectButton, 1000);

})();
