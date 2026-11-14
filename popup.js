/**
 * TradingView Strategy Scraper - Popup Logic
 */

let scrapedData = null;
let currentMode = null; // 'summary' or 'trades'

const statusText = document.getElementById('statusText');
const statusCard = document.getElementById('statusCard');
const resultsArea = document.getElementById('resultsArea');

// Update UI status
function setStatus(text, type = 'ready') {
    statusText.innerText = text;
    statusCard.className = `status-card ${type}`;
}

// Scrape Summary
document.getElementById('scrapeSummary').addEventListener('click', async () => {
    setStatus('Scraping metrics...', 'loading');
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    console.log("🔍 Tab Info:", tab.id, tab.url);
    
    chrome.tabs.sendMessage(tab.id, { action: "scrapeSummary" }, (response) => {
        if (chrome.runtime.lastError) {
            console.error("❌ Message Error:", chrome.runtime.lastError.message);
            setStatus('Error: Content script not found on this page. Try refreshing TradingView.', 'error');
            return;
        }
        
        if (response && response.success) {
            scrapedData = response.data;
            currentMode = 'summary';
            setStatus('Summary captured!', 'success');
            resultsArea.classList.remove('hidden');
        } else {
            setStatus('Failed: ' + (response?.error || 'Unknown error'), 'error');
        }
    });
});

// Scrape Trades
document.getElementById('scrapeTrades').addEventListener('click', async () => {
    setStatus('Scraping trades (scrolling)...', 'loading');
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    console.log("🔍 Tab Info:", tab.id, tab.url);
    
    chrome.tabs.sendMessage(tab.id, { action: "scrapeTrades" }, (response) => {
        if (chrome.runtime.lastError) {
            console.error("❌ Message Error:", chrome.runtime.lastError.message);
            setStatus('Error: Content script not found on this page. Try refreshing TradingView.', 'error');
            return;
        }
        
        if (response && response.success) {
            scrapedData = response.data;
            currentMode = 'trades';
            setStatus(`Captured ${scrapedData.trades.length} trades!`, 'success');
            resultsArea.classList.remove('hidden');
        } else {
            setStatus('Failed: ' + (response?.error || 'Switch to Trades tab'), 'error');
        }
    });
});

// Formatter: JSON
function getJson() {
    return JSON.stringify(scrapedData, null, 2);
}

// Formatter: CSV
function getCsv() {
    if (currentMode === 'summary') {
        const rows = [['Metric', 'Value']];
        for (const [k, v] of Object.entries(scrapedData)) {
            rows.push([k, v]);
        }
        return rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    } else {
        const rows = [scrapedData.headers, ...scrapedData.trades];
        return rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    }
}

// Download Helper
function downloadFile(content, fileName, contentType) {
    const a = document.createElement("a");
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
}

// Export Listeners
document.getElementById('downloadCsv').addEventListener('click', () => {
    const csv = getCsv();
    downloadFile(csv, `tv_strategy_${currentMode}.csv`, 'text/csv');
});

document.getElementById('downloadJson').addEventListener('click', () => {
    const json = getJson();
    downloadFile(json, `tv_strategy_${currentMode}.json`, 'application/json');
});

document.getElementById('copyBtn').addEventListener('click', () => {
    const csv = getCsv();
    navigator.clipboard.writeText(csv).then(() => {
        const originalText = document.getElementById('copyBtn').innerHTML;
        document.getElementById('copyBtn').innerHTML = '✅ Copied!';
        setTimeout(() => {
            document.getElementById('copyBtn').innerHTML = originalText;
        }, 2000);
    });
});
