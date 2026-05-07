// ==UserScript==
// @name         Auto Check Boxes + Radio
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Auto-select checkboxes and radio if not already selected
// @match        *://edge.bigbrandtire.com/pos/invoice/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function setIfNotChecked(selector) {
        const el = document.querySelector(selector);
        if (!el) return;

        if (!el.checked) {
            el.checked = true;

            // Trigger events in case the site listens for them
            el.dispatchEvent(new Event('change', { bubbles: true }));
            el.dispatchEvent(new Event('click', { bubbles: true }));
        }
    }

    function run() {
        // Checkboxes
        setIfNotChecked('#EmailOk');
        setIfNotChecked('#TextOk');

        // Radio button (select by value)
        const radio = document.querySelector('input[name="DropOffTypes"][value="3"]');
        if (radio && !radio.checked) {
            radio.checked = true;
            radio.dispatchEvent(new Event('change', { bubbles: true }));
            radio.dispatchEvent(new Event('click', { bubbles: true }));
        }
    }

    // Run after page loads
    window.addEventListener('load', run);

    // Optional: handle dynamic content (very common in POS/web apps)
    const observer = new MutationObserver(run);
    observer.observe(document.body, { childList: true, subtree: true });

})();