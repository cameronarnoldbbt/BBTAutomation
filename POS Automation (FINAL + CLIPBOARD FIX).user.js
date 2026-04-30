// ==UserScript==
// @name         POS Automation (FINAL + INVOICE FLOW FIXED)
// @match        *://edge.bigbrandtire.com/*
// @exclude      *://edge.bigbrandtire.com/pos/invoice/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const FLOW_KEY = 'AUTO_FLOW';
    const INVOICE_KEY = 'invoice_reprint_flow';

    console.log("TM LOADED");

    // =========================
    // HOTKEY TRIGGER
    // =========================
    document.addEventListener('keydown', async (e) => {
        if (e.ctrlKey && e.altKey && e.shiftKey && e.key.toLowerCase() === 'j') {
            e.preventDefault();

            const text = await navigator.clipboard.readText();

            // ✅ FIXED PARSING (non-greedy + safe)
            const storeMatch = text.match(/STORE:\s*([A-Z0-9]+)/i);
            const phoneMatch = text.match(/PHONE:\s*(\d+)/i);

            const storeRaw = storeMatch ? storeMatch[1].trim().toUpperCase() : null;
            const phone = phoneMatch ? phoneMatch[1].trim() : null;

            // ✅ Normalize "NONE" → null
            const store = (storeRaw === "NONE") ? null : storeRaw;

            console.log("RAW:", text);
            console.log("PARSED STORE:", store);
            console.log("PARSED PHONE:", phone);

            // =========================
            // 🔥 INVOICE FLOW (NO STORE)
            // =========================
            if (!store && phone) {
                console.log("No store → invoice flow");

                localStorage.setItem(INVOICE_KEY, JSON.stringify({
                    phone,
                    ts: Date.now()
                }));

                const link = document.querySelector('a[href="/pos/main/invoicereprint"]');

                if (link) {
                    link.click();
                } else {
                    console.warn("Invoice link not found");
                }

                return;
            }

            // =========================
            // NORMAL POS FLOW
            // =========================
            if (!store || !phone) {
                console.warn("Missing store or phone");
                return;
            }

            localStorage.setItem(FLOW_KEY, JSON.stringify({
                store,
                phone,
                ts: Date.now()
            }));

            const el = await waitFor(() =>
                document.querySelector(`[data-storenumber="${store}"]`)
            );

            if (!el) {
                console.warn("Store element not found");
                return;
            }

            console.log("Clicking store");
            el.click();
        }
    });

    // =========================
    // RESUME POS FLOW
    // =========================
    const savedRaw = localStorage.getItem(FLOW_KEY);

    if (savedRaw) {
        const data = JSON.parse(savedRaw);

        if (Date.now() - data.ts > 8000) {
            localStorage.removeItem(FLOW_KEY);
        } else {
            console.log("Resuming POS flow:", data);
            runAfterReload(data);
        }
    }

    async function runAfterReload(data) {

        await waitFor(() => {
            const el = document.querySelector('#storeNumber');
            return el && el.innerText.trim() === data.store;
        });

        console.log("Store confirmed");

        await sleep(300);

        $('#customerSelectModal').modal('show');

        console.log("Modal opened");

        const input = await waitFor(() =>
            document.querySelector('#customersearchphone')
        );

        if (!input) {
            console.warn("Input not found");
            localStorage.removeItem(FLOW_KEY);
            return;
        }

        input.focus();
        input.value = data.phone;

        input.dispatchEvent(new Event('input', { bubbles: true }));

        console.log("Phone entered");

        ['keydown','keypress','keyup'].forEach(type => {
            input.dispatchEvent(new KeyboardEvent(type, {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true
            }));
        });

        input.closest('form')?.submit();

        console.log("Enter triggered");

        await sleep(500);

        document.querySelector('.cust-card')?.click();

        console.log("Customer selected");

        // Clipboard reset
        try {
            await navigator.clipboard.writeText(data.phone);
        } catch {
            const ta = document.createElement('textarea');
            ta.value = data.phone;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            ta.remove();
        }

        console.log("Clipboard reset");

        localStorage.removeItem(FLOW_KEY);
    }

    // =========================
    // RESUME INVOICE FLOW
    // =========================
    const invoiceRaw = localStorage.getItem(INVOICE_KEY);

    if (invoiceRaw) {
        const data = JSON.parse(invoiceRaw);

        if (Date.now() - data.ts > 8000) {
            localStorage.removeItem(INVOICE_KEY);
        } else {
            console.log("Resuming invoice flow:", data);
            runInvoiceAfterReload(data);
        }
    }

    async function runInvoiceAfterReload(data) {

        const waitForElements = async () => {
            const select = document.getElementById('SearchType');
            const input = document.getElementById('phoneNum');

            if (select && input) {
                console.log("Filling invoice form");

                select.value = "2";
                select.dispatchEvent(new Event('change', { bubbles: true }));

                input.focus();
                input.value = data.phone;
                input.dispatchEvent(new Event('input', { bubbles: true }));

                ['keydown','keypress','keyup'].forEach(type => {
                    input.dispatchEvent(new KeyboardEvent(type, {
                        key: 'Enter',
                        code: 'Enter',
                        keyCode: 13,
                        which: 13,
                        bubbles: true
                    }));
                });

                console.log("Invoice search triggered");

                localStorage.removeItem(INVOICE_KEY);
                return true;
            }

            return false;
        };

        if (await waitForElements()) return;

        const observer = new MutationObserver(async () => {
            if (await waitForElements()) {
                observer.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // =========================
    // HELPERS
    // =========================

    function sleep(ms) {
        return new Promise(r => setTimeout(r, ms));
    }

    async function waitFor(fn, timeout = 7000) {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            const result = fn();
            if (result) return result;
            await sleep(100);
        }
        return null;
    }

})();
