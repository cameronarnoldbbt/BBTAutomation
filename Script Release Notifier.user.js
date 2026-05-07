// ==UserScript==
// @name         BBT Script Release Notifier
// @match        https://edge.bigbrandtire.com/pos/*
// @grant        GM_xmlhttpRequest
// @connect      api.github.com
// @connect      raw.githubusercontent.com
// ==/UserScript==

(function () {
    'use strict';

    // ===== CONFIG =====
    const OWNER = 'cameronarnoldbbt';
    const REPO = 'BBTAutomation';
    const BRANCH = 'main';
    const PATH = '';

    const API_URL = `https://api.github.com/repos/${OWNER}/${REPO}/contents${PATH ? '/' + PATH : ''}?ref=${BRANCH}`;
    const REPO_URL = `https://github.com/${OWNER}/${REPO}`;

    const TODAY = new Date().toDateString();
    const LAST_CHECK = localStorage.getItem('bbtScriptCheckDate');

    // ===== SHOW MODAL IF PENDING =====
    const pendingData = JSON.parse(localStorage.getItem('bbtPendingScripts') || 'null');
    if (pendingData) {
        window.addEventListener('load', () => {
            showScriptModal(pendingData);
        });
    }

    // ===== DAILY CHECK =====
    if (LAST_CHECK === TODAY) return;

    GM_xmlhttpRequest({
        method: 'GET',
        url: API_URL,
        headers: { 'Accept': 'application/vnd.github.v3+json' },
        onload: async function (response) {
            try {
                const data = JSON.parse(response.responseText);

                const jsFiles = data.filter(f => f.type === 'file' && f.name.endsWith('.js'));
                const currentFiles = jsFiles.map(f => f.name);

                const storedFiles = JSON.parse(localStorage.getItem('bbtKnownScripts') || '[]');
                const newFiles = jsFiles.filter(f => !storedFiles.includes(f.name));

                if (newFiles.length > 0) {
                    // fetch description for FIRST new script only (keeps it fast)
                    const file = newFiles[0];
                    const description = await fetchDescription(file.download_url);

                    const payload = {
                        name: file.name,
                        description: description || 'No description provided.'
                    };

                    localStorage.setItem('bbtPendingScripts', JSON.stringify(payload));
                }

                localStorage.setItem('bbtKnownScripts', JSON.stringify(currentFiles));
                localStorage.setItem('bbtScriptCheckDate', TODAY);

            } catch (err) {
                console.error('BBT script check failed:', err);
            }
        }
    });

    // ===== FETCH DESCRIPTION FROM RAW FILE =====
    function fetchDescription(url) {
        return new Promise((resolve) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                onload: function (res) {
                    try {
                        const text = res.responseText;

                        // matches: // @description something here
                        const match = text.match(/@description\s+(.+)/i);

                        resolve(match ? match[1].trim() : null);
                    } catch {
                        resolve(null);
                    }
                },
                onerror: () => resolve(null)
            });
        });
    }

    // ===== MODAL =====
    function showScriptModal(data) {
        const overlay = document.createElement('div');
        const modal = document.createElement('div');

        Object.assign(overlay.style, {
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.5)',
            zIndex: 9998
        });

        modal.innerHTML = `
            <div style="font-size:18px; font-weight:bold; text-decoration: underline; margin-bottom:12px;">
                EDGE Automations
            </div>

            <div style="font-size:16px; margin-bottom:10px;">
                New Script Available!
            </div>

            <div style="font-size:15px; margin-bottom:10px;">
                ${data.name}
            </div>

            <div style="font-size:13px; opacity:0.85; margin-bottom:20px;">
                ${data.description}
            </div>

            <div style="display:flex; justify-content: space-between;">
                <button id="bbtDismiss">Dismiss</button>
                <button id="bbtOpenGitHub">Open GitHub</button>
            </div>
        `;

        Object.assign(modal.style, {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#1e1e1e',
            color: '#fff',
            padding: '20px',
            borderRadius: '12px',
            zIndex: 9999,
            width: '320px',
            boxShadow: '0 0 20px rgba(0,0,0,0.4)',
            fontFamily: 'sans-serif'
        });

        document.body.appendChild(overlay);
        document.body.appendChild(modal);

        document.getElementById('bbtDismiss').onclick = () => {
            localStorage.removeItem('bbtPendingScripts');
            overlay.remove();
            modal.remove();
        };

        document.getElementById('bbtOpenGitHub').onclick = () => {
            window.open(REPO_URL, '_blank');
            localStorage.removeItem('bbtPendingScripts');
            overlay.remove();
            modal.remove();
        };
    }

})();
