
// ==UserScript==
// @name         USAF Auto Store + Re-Search (FINAL FIXED)
// @match        *://*.usautoforce.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {

    const script = document.createElement('script');

    script.textContent = `
        (function () {

            console.log("[INJECTED] USAF automation running");

            const wait = (ms) => new Promise(r => setTimeout(r, ms));

            const params = new URLSearchParams(window.location.search);

            let store = params.get('store');
            let tireSize = params.get('tireSize');

            // ✅ Persist values
            if (store) sessionStorage.setItem('usafStore', store);
            if (tireSize) sessionStorage.setItem('usafSize', tireSize);

            // ✅ Recover if redirected
            store = store || sessionStorage.getItem('usafStore');
            tireSize = tireSize || sessionStorage.getItem('usafSize');

            if (!store || !tireSize) {
                console.log("[INJECTED] Missing store or tireSize");
                return;
            }

            async function waitForDealerButton() {
                while (true) {
                    const btn = document.getElementById('btnDealerMenu');

                    if (btn && btn.innerText.trim().length > 5) {
                        await wait(1500);
                        return btn;
                    }

                    await wait(100);
                }
            }

            async function run() {

                console.log("[INJECTED] Running flow");

                const btn = await waitForDealerButton();

                // ✅ CASE 1: Already correct store
                if (btn.innerText.includes(store)) {

                    console.log("[INJECTED] Store already correct");

                    // If we landed on homepage → redirect back to search
                    if (!location.href.includes("/ByTireSize")) {
                        console.log("[INJECTED] On homepage, redirecting to tire search");

                        location.href = \`/Tires/Search/ByTireSize?tireSize=\${tireSize}&store=\${store}\`;
                    }

                    return;
                }

                // ✅ CASE 2: Need to switch store
                console.log("[INJECTED] Switching store...");

                btn.click();

                let input;
                while (!(input = document.getElementById('SelectDealerAutoComplete'))) {
                    await wait(100);
                }

                const nativeSetter = Object.getOwnPropertyDescriptor(
                    window.HTMLInputElement.prototype,
                    "value"
                ).set;

                input.focus();

                nativeSetter.call(input, '');
                input.dispatchEvent(new Event('input', { bubbles: true }));

                await wait(100);

                nativeSetter.call(input, store);
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));

                let storeEl;
                while (!(storeEl = Array.from(document.querySelectorAll('.divSelectDealerResult'))
                    .find(el => el.innerText.includes(store)))) {
                    await wait(100);
                }

                storeEl.click();

                console.log("[INJECTED] Store selected → waiting for redirect");

                // Wait for forced redirect to homepage
                await wait(2500);

                // Force correct page after redirect
                location.href = \`/Tires/Search/ByTireSize?tireSize=\${tireSize}&store=\${store}\`;
            }

            window.addEventListener('load', () => {
                setTimeout(run, 1000);
            });

        })();
    `;

    document.documentElement.appendChild(script);
    script.remove();

})();

