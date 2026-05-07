// ==UserScript==
// @name         Script Release Notifier
// @match        https://edge.bigbrandtire.com/pos/*
// @version      1.0
// @grant        GM_xmlhttpRequest
// @connect      api.github.com
// ==/UserScript==

(function () {
    'use strict';

    const OWNER = 'cameronarnoldbbt';
    const REPO = 'BBTAutomation';
    const BRANCH = 'main';
    const PATH = ''; // root (leave empty unless you move scripts into a folder)

    const API_URL = `https://api.github.com/repos/${OWNER}/${REPO}/contents${PATH ? '/' + PATH : ''}?ref=${BRANCH}`;

    const TODAY = new Date().toDateString();
    const LAST_CHECK = localStorage.getItem('scriptCheckDate');

    if (LAST_CHECK === TODAY) {
        return; // already checked today
    }

    GM_xmlhttpRequest({
        method: 'GET',
        url: API_URL,
        headers: {
            'Accept': 'application/vnd.github.v3+json'
        },
        onload: function (response) {
            try {
                const data = JSON.parse(response.responseText);

                // only grab JS files (optional filter)
                const currentFiles = data
                    .filter(file => file.type === 'file' && file.name.endsWith('.js'))
                    .map(file => file.name);

                const storedFiles = JSON.parse(localStorage.getItem('knownScripts') || '[]');

                // find NEW files (not previously seen)
                const newScripts = currentFiles.filter(file => !storedFiles.includes(file));

                if (newScripts.length > 0) {
                    showPopup(newScripts.length);
                }

                // update storage
                localStorage.setItem('knownScripts', JSON.stringify(currentFiles));
                localStorage.setItem('scriptCheckDate', TODAY);

            } catch (e) {
                console.error('Script check failed:', e);
            }
        }
    });

    function showPopup(count) {
        const popup = document.createElement('div');
        popup.innerText = `⚡ ${count} new script${count > 1 ? 's' : ''} available!`;

        Object.assign(popup.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: '#222',
            color: '#fff',
            padding: '12px 16px',
            borderRadius: '8px',
            zIndex: 9999,
            fontSize: '14px',
            boxShadow: '0 0 10px rgba(0,0,0,0.3)'
        });

        document.body.appendChild(popup);

        setTimeout(() => popup.remove(), 8000);
    }

})();