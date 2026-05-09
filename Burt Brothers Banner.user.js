
// ==UserScript==
// @name         Burt Brothers Banner
// @match        *://edge.bigbrandtire.com/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    function injectBanner() {
        const regionEl = document.querySelector('.regionTitle');
        if (!regionEl) return;

        const text = regionEl.innerText || "";

        // Only run if Burt Brothers
        if (!text.includes("Burt Brothers")) return;

        // Prevent duplicate banner
        if (document.getElementById('burts-banner')) return;

        // Target container (the flex header you provided)
        const header = regionEl.closest('body')?.querySelector('div[style*="display: flex"][style*="justify-content: space-between"]');
        if (!header) return;

        // Create banner
        const banner = document.createElement('div');
        banner.id = 'burts-banner';
        banner.innerText = "Burt's Brothers";
        banner.style.background = '#d32f2f';
        banner.style.color = 'white';
        banner.style.fontWeight = 'bold';
        banner.style.textAlign = 'center';
        banner.style.padding = '6px';
        banner.style.width = '100%';

        // Insert ABOVE the header
        header.parentNode.insertBefore(banner, header);

        console.log("[TM] Burt Brothers banner injected");
    }

    // Run on load + DOM changes
    const observer = new MutationObserver(injectBanner);

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    setTimeout(injectBanner, 1000);

})();
