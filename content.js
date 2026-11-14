/**
 * TradingView Strategy Scraper - Content Script
 */

console.log("🚀 TV Scraper: Content Script injected and running!");

// Utility to wait for elements
const waitForElement = (selector, timeout = 5000) => {
    return new Promise((resolve, reject) => {
        const el = document.querySelector(selector);
        if (el) return resolve(el);

        const observer = new MutationObserver(() => {
            const el = document.querySelector(selector);
            if (el) {
                resolve(el);
                observer.disconnect();
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
        setTimeout(() => {
            observer.disconnect();
            reject(new Error(`Timeout waiting for ${selector}`));
        }, timeout);
    });
};

/**
 * Scrapes the "Performance Summary" and general metrics
 */
function scrapePerformanceSummary() {
    console.log("Scraping Performance Summary...");
    const data = {};

    // 1. Get Summary Cards (Total P&L, etc.)
    const summaryCells = document.querySelectorAll('[class*="containerCell-"]');
    summaryCells.forEach(cell => {
        const labelEl = cell.querySelector('[class*="title-"]');
        const valueEl = cell.querySelector('[class*="value-"]');
        if (labelEl && valueEl) {
            data[labelEl.innerText.trim()] = valueEl.innerText.trim();
        }
    });

    // 2. Get Performance Tables (ka-table)
    const tables = document.querySelectorAll('table[class*="ka-table"]');
    tables.forEach(table => {
        const rows = table.querySelectorAll('tr[class*="ka-tr"]');
        rows.forEach(row => {
            const metricEl = row.querySelector('[class*="title-"]');
            const values = row.querySelectorAll('[class*="value-"]');

            if (metricEl && values.length > 0) {
                const metricName = metricEl.innerText.trim();
                const metricValues = Array.from(values).map(v => v.innerText.trim());

                // If there are multiple values (All, Long, Short), we join them or index them
                if (metricValues.length === 1) {
                    data[metricName] = metricValues[0];
                } else if (metricValues.length > 1) {
                    data[`${metricName} (All)`] = metricValues[0];
                    data[`${metricName} (Long)`] = metricValues[1];
                    data[`${metricName} (Short)`] = metricValues[2];
                }
            }
        });
    });

    return data;
}

/**
 * Scrapes the "List of trades" table with auto-scrolling
 * Optimized for TradingView's virtualized lists
 */
async function scrapeTradeList() {
    console.log("🚀 TV Scraper: Starting Trade List extraction...");
    const tradesMap = new Map();

    // 1. Find the table and its scrollable parent
    const table = document.querySelector('table[class*="ka-table"]');
    if (!table) throw new Error("Trade List table not found.");

    // Find the actual scrollable container (usually several levels up)
    let scrollContainer = table.parentElement;
    while (scrollContainer && scrollContainer !== document.body) {
        const style = window.getComputedStyle(scrollContainer);
        if (style.overflowY === 'auto' || style.overflowY === 'scroll') break;
        scrollContainer = scrollContainer.parentElement;
    }

    if (!scrollContainer || scrollContainer === document.body) {
        // Fallback to the known class pattern if direct parent search fails
        scrollContainer = document.querySelector('[class*="scrollContainer-"]') || table.parentElement;
    }

    console.log("📂 TV Scraper: Found scroll container:", scrollContainer);

    let lastScrollTop = -1;
    let iterationsWithoutNewData = 0;
    const maxRetries = 10; // Be more persistent for longer lists

    // Set scroll to top first
    scrollContainer.scrollTop = 0;
    await new Promise(r => setTimeout(r, 500));

    // Enhanced Cleaner: Standardize numbers, remove mojibake, and strip suffixes
    const clean = (val) => {
        if (!val) return "";
        return val
            .replace(/\u2212/g, '-') // Unicode Minus
            .replace(/âˆ’/g, '-')    // mojibake Minus
            .replace(/â€¯/g, '')     // mojibake space
            .replace(/[A-Z]{3}/g, '') // Remove Currencies
            .replace(/[,]/g, '')     // Remove commas
            .replace(/\s[KMD]$/i, '') // Remove K/M/D suffixes
            .trim();
    };

    // Utility to extract specific part from a double-cell (data-part 0/1)
    const getPart = (cell, partIndex) => {
        if (!cell) return "";
        const part = cell.querySelector(`[data-part="${partIndex}"]`);
        if (part) return clean(part.innerText);

        // Fallback to newline split if parts not found
        const lines = cell.innerText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (partIndex === 0) return clean(lines[0] || "");
        return clean(lines[1] || lines[0] || "");
    };

    // Utility to find column indices by header text
    const findHeadersMap = () => {
        const headerCells = document.querySelectorAll('th[class*="ka-thead-cell"]');
        const map = {};
        headerCells.forEach((th, idx) => {
            const text = th.innerText.toLowerCase().trim();
            if (text.includes('trade #')) map.tradeNo = idx;
            if (text.includes('date')) map.date = idx;
            if (text.includes('signal')) map.signal = idx;
            if (text.includes('price')) map.price = idx;
            if (text.includes('size')) map.size = idx;
            if (text.includes('p&l') && !text.includes('%')) map.pnl = idx;
            if (text.includes('run-up')) map.runup = idx;
            if (text.includes('drawdown')) map.drawdown = idx;
            if (text.includes('cumulative')) map.cumulative = idx;
        });
        console.log("📍 TV Scraper: Detected Header Map:", map);
        return map;
    };

    const colMap = findHeadersMap();

    while (iterationsWithoutNewData < maxRetries) {
        const currentRows = document.querySelectorAll('tr[class*="ka-tr"]');
        let newFoundThisBatch = 0;

        currentRows.forEach(row => {
            const cells = row.querySelectorAll('td[class*="ka-cell"]');
            if (cells.length >= 7) {
                const tradeNoIndex = colMap.tradeNo !== undefined ? colMap.tradeNo : 0;
                const tradeNo = clean(cells[tradeNoIndex]?.innerText || "");

                if (tradeNo && !tradesMap.has(tradeNo)) {
                    // Extract using Dynamic Mapping
                    const entryDate = colMap.date !== undefined ? getPart(cells[colMap.date], 1) : "";
                    const exitDate = colMap.date !== undefined ? getPart(cells[colMap.date], 0) : "";

                    const entrySignal = colMap.signal !== undefined ? getPart(cells[colMap.signal], 1) : "";
                    const exitSignal = colMap.signal !== undefined ? getPart(cells[colMap.signal], 0) : "";

                    const entryPrice = colMap.price !== undefined ? getPart(cells[colMap.price], 1) : "";
                    const exitPrice = colMap.price !== undefined ? getPart(cells[colMap.price], 0) : "";

                    const size = colMap.size !== undefined ? clean(cells[colMap.size]?.innerText || "") : "";
                    const pnlVal = colMap.pnl !== undefined ? getPart(cells[colMap.pnl], 0) : "";
                    const pnlPct = colMap.pnl !== undefined ? getPart(cells[colMap.pnl], 1) : "";

                    const runup = colMap.runup !== undefined ? getPart(cells[colMap.runup], 0) : "";
                    const drawdown = colMap.drawdown !== undefined ? getPart(cells[colMap.drawdown], 0) : "";
                    const cumulative = colMap.cumulative !== undefined ? getPart(cells[colMap.cumulative], 0) : "";

                    const rowData = [
                        tradeNo,
                        entryDate, exitDate,
                        entrySignal, exitSignal,
                        entryPrice, exitPrice,
                        size, pnlVal, pnlPct,
                        runup, drawdown, cumulative
                    ];

                    tradesMap.set(tradeNo, rowData);
                    newFoundThisBatch++;
                }
            }
        });

        if (newFoundThisBatch > 0) {
            iterationsWithoutNewData = 0;
            console.log(`📈 TV Scraper: ${tradesMap.size} trades collected...`);
        } else {
            iterationsWithoutNewData++;
        }

        // TURBO SCROLL
        scrollContainer.scrollTop += (scrollContainer.clientHeight * 0.8);
        await new Promise(r => setTimeout(r, 250)); // Fast wait

        if (Math.abs(scrollContainer.scrollTop - lastScrollTop) < 2) {
            await new Promise(r => setTimeout(r, 500)); // Final chance
            if (Math.abs(scrollContainer.scrollTop - lastScrollTop) < 2) break;
        }

        lastScrollTop = scrollContainer.scrollTop;
    }

    const finalTrades = Array.from(tradesMap.values());
    console.log(`✅ TV Scraper: Finished! Total: ${finalTrades.length}`);

    const headers = [
        "Trade #", "Entry Date", "Exit Date", "Entry Signal", "Exit Signal",
        "Entry Price", "Exit Price", "Size", "P&L", "P&L %", "Run-up", "Drawdown", "Cumulative"
    ];

    return { headers, trades: finalTrades };
}

// Message Listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("📥 TV Scraper: Received message:", request.action);
    if (request.action === "scrapeSummary") {
        try {
            const result = scrapePerformanceSummary();
            sendResponse({ success: true, data: result });
        } catch (err) {
            sendResponse({ success: false, error: err.message });
        }
    } else if (request.action === "scrapeTrades") {
        scrapeTradeList()
            .then(result => sendResponse({ success: true, data: result }))
            .catch(err => sendResponse({ success: false, error: err.message }));
        return true; // Keep channel open for async
    }
    return true;
});
