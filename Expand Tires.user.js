// ==UserScript==
// @name         Expand Tires
// @namespace    http://tampermonkey.net/
// @version      1.1
// @match        https://edge.bigbrandtire.com/POS/Tire/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    console.log('[TM] Loaded');

    function tryClick() {
        var btn = document.getElementById('toggleImagesBtn');
        var cards = document.querySelectorAll('.masterTireCards');

        // ensure results are actually rendered
        if (btn && cards.length > 2) {
            console.log('[TM] Page ready, delaying click...');

            setTimeout(function () {
                btn.click();
                console.log('[TM] Clicked Toggle Images');
            }, 500); // adjust to 800–1000 if needed

            return true;
        }

        return false;
    }

    var attempts = 0;
    var interval = setInterval(function () {
        attempts++;

        if (tryClick() || attempts > 20) {
            clearInterval(interval);
        }
    }, 300);
})();