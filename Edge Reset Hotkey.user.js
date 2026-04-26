// ==UserScript==
// @name         Edge Reset Hotkey
// @match        *://edge.bigbrandtire.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    document.addEventListener('keydown', (e) => {
        // Ctrl + Alt + Backspace
        if (e.ctrlKey && e.altKey && e.key === 'Backspace') {
            e.preventDefault();

            if (typeof resetHeaderWithPrompt === 'function') {
                resetHeaderWithPrompt();
            } else {
                console.log("resetHeaderWithPrompt not found");
            }
        }
    });
})();

document.addEventListener('keydown', async (e) => {
    // Ctrl + Alt + I (your hidden trigger)
    if (e.ctrlKey && e.altKey && e.key === 'i') {
        e.preventDefault();

        // Step 1: open clock modal
        if (typeof openInOut === 'function') {
            openInOut();
        }

        // Wait 2 seconds
        await new Promise(r => setTimeout(r, 2000));

        // Step 2: click Agree
        document
            .querySelector('button[onclick="acceptMessage();"]')
            ?.click();

        // Wait 2 seconds
        await new Promise(r => setTimeout(r, 2000));

        // Step 3: click Save
        document
            .querySelector('#sendInOutPunch')
            ?.click();
    }
});