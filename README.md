# TradingView Strategy Scraper 📈

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-success?style=flat)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![JavaScript](https://img.shields.io/badge/Language-JavaScript%20ES6+-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A powerful, lightweight Google Chrome extension (Manifest V3) engineered for quantitative traders, algorithmic strategy developers, and financial analysts. It extracts complete backtest performance summaries and trade logs directly from TradingView's **Strategy Tester** panel into clean CSV and JSON formats.

---

## 🚀 Key Features

- **📊 Comprehensive Performance Summary Extraction**:
  - Scrapes key high-level metrics (Net Profit, Gross Profit, Gross Loss, Max Drawdown, Profit Factor, Total Closed Trades, Win Rate, etc.).
  - Extracts multi-column breakouts (**All**, **Long**, and **Short** metrics).
- **📜 Virtualized Trade List Extraction**:
  - Built-in smart auto-scroll engine traverses TradingView's virtualized table (`ka-table`).
  - Seamlessly captures all historical trades without missing records caused by lazy-loading or viewport virtualization.
- **🧹 Intelligent Data Normalization & Sanitization**:
  - Normalizes unicode negative signs (`\u2212`, mojibake artifacts) into clean ASCII minus signs (`-`).
  - Automatically strips currency tickers, unit suffixes, and thousands separators for direct mathematical analysis.
  - Accurately splits dual-part cells into distinct fields (Entry vs. Exit Date, Entry vs. Exit Signal, Entry vs. Exit Price, P&L value vs. P&L %).
- **💾 Multi-Format Exporting**:
  - **Save CSV**: Download formatted `.csv` files ready for Microsoft Excel, Google Sheets, or Python Pandas.
  - **Save JSON**: Export structured `.json` datasets for programmatic modeling, APIs, or database ingestion.
  - **Copy CSV**: Copy tabular CSV directly to your clipboard for rapid pasting.
- **🎨 Modern Glassmorphic Dark UI**:
  - Sleek, high-contrast dark theme designed to match modern trading interfaces.
  - Real-time pulse indicator and dynamic status updates during automated table traversal.
- **🔒 100% Client-Side & Private**:
  - Zero external servers, tracking, or telemetry. All processing happens entirely within your local browser sandbox.

---

## 📁 Project Structure

```
tradingview-strategy-scraper/
├── icons/
│   ├── icon16.png        # Toolbar favicon (16x16)
│   ├── icon48.png        # Extension management icon (48x48)
│   └── icon128.png       # Web Store & installation icon (128x128)
├── content.js            # Content script: DOM scraping & virtual table auto-scroller
├── manifest.json         # Extension manifest (Manifest V3)
├── popup.html            # Extension popup user interface
├── popup.js              # UI controller, messaging, CSV/JSON serialization
├── styles.css            # Dark glassmorphic styles & animations
└── README.md             # Project documentation
```

---

## 🛠️ Installation (Developer Mode)

Because this is a custom extension, install it in Google Chrome using **Developer Mode**:

1. **Clone or Download** this repository to your local machine:
   ```bash
   git clone https://github.com/MohammedElansary-dev/tradingview-strategy-scraper.git
   ```
   *(or download as a `.zip` file and extract it)*.

2. Open Google Chrome and navigate to:
   ```text
   chrome://extensions/
   ```

3. Toggle the **Developer mode** switch in the top-right corner to **ON**.

4. Click the **Load unpacked** button in the top-left corner.

5. Select the project folder (`tradingview-strategy-scraper`).

6. The **TradingView Strategy Scraper** will appear in your extensions list. Pin it to your Chrome toolbar for easy access.

---

## 📖 Usage Guide

### 1. Scrape Performance Summary

1. Navigate to any chart on [TradingView](https://www.tradingview.com/chart/).
2. Apply your Pine Script strategy to the chart.
3. Open the **Strategy Tester** tab in the bottom panel.
4. Select the **Overview** or **Performance Summary** tab.
5. Click the **TV Strategy Scraper** icon in your Chrome toolbar.
6. Click **📊 Scrape Summary**.
7. Once captured, click **Save CSV**, **Save JSON**, or **Copy CSV**.

### 2. Scrape Complete Trade List

1. Inside the **Strategy Tester** panel on TradingView, switch to the **List of Trades** tab.
2. Click the **TV Strategy Scraper** icon.
3. Click **📜 Scrape Trade List**.
4. The extension will automatically scroll through the virtualized table, collecting every row until the beginning of the backtest is reached.
5. Once completed, select your export format (**Save CSV**, **Save JSON**, or **Copy CSV**).

---

## 📊 Extracted Data Fields

### Trade List Schema

When exporting the Trade List, the resulting CSV/JSON contains the following columns:

| Column Name | Description | Example |
|---|---|---|
| `Trade #` | Unique trade sequence number | `148` |
| `Entry Date` | Date and time the position was opened | `2024-03-12 14:30` |
| `Exit Date` | Date and time the position was closed | `2024-03-13 18:00` |
| `Entry Signal` | Name of the entry order/signal | `Long Entry` |
| `Exit Signal` | Name of the exit order/signal | `Take Profit` |
| `Entry Price` | Execution price on entry | `64250.5` |
| `Exit Price` | Execution price on exit | `66100.0` |
| `Size` | Number of contracts / shares / lots | `0.5` |
| `P&L` | Monetary profit or loss | `924.75` |
| `P&L %` | Percentage return on the trade | `2.88` |
| `Run-up` | Maximum favorable excursion (MFE) | `1150.0` |
| `Drawdown` | Maximum adverse excursion (MAE) | `-210.0` |
| `Cumulative` | Running account equity / cumulative P&L | `15420.50` |

---

## 🔐 Permissions

The extension uses minimal Manifest V3 permissions:

- **`activeTab`**: Accesses the active TradingView tab only when the user invokes the popup.
- **`scripting`**: Required to inject content scripts and read strategy table data from the DOM.
- **`clipboardWrite`**: Allows the extension to copy extracted CSV data directly to the user's system clipboard.

---

## 💻 Tech Stack

- **Platform**: Google Chrome Extension (Manifest V3)
- **Languages**: JavaScript (ES6+), HTML5, CSS3
- **Design**: Responsive Glassmorphism, CSS Custom Properties, Inter typography
- **Target Compatibility**: TradingView Desktop Web Charts (`https://www.tradingview.com/chart/*`)

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

---

*Disclaimer: This extension is an independent open-source tool and is not affiliated, associated, authorized, endorsed by, or in any way officially connected with TradingView, Inc.*
