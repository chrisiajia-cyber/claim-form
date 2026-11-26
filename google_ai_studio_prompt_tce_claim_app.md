# Project Brief: TCE Expense Claim Web Application

Build a clean, modern, single-page React + Tailwind CSS web application for creating, managing, and printing **TCE Expense Claim Forms**.

## 1. Core Header & Metadata Fields
Create an executive, print-ready document header styled for **TCE** ("Expense Claim Form") with editable fields:
- **Pay To:** Default pre-filled value `SSChu` (editable text input)
- **Claim Ref No.:** Editable text input (e.g., `TCE-2026-001`)
- **Department:** Editable text input
- **Submission Date:** Date picker defaulting to today's date
- **Currency:** Dropdown selector defaulting to `MYR (RM)` with options for `SGD`, `USD`, and `IDR`

## 2. Dynamic Expense Line-Item Table
Build an interactive table with the exact column sequence requested:
1. **No.:** Auto-numbered row index (`1, 2, 3...`)
2. **Date:** Date input per line item
3. **Document No.:** Text input for receipt, invoice, or voucher reference
4. **Particular:** Text input for expense description
5. **Total:** Numeric currency input (formatted to 2 decimal places)
6. **Actions:** Delete row button (hidden when printing)

### Interactive Table Features:
- **Add Row Button:** Appends a new blank line item.
- **Auto-Calculation:** Automatically sums all `Total` values in real time into a bold **Total Claim Amount** footer row.
- **Smart Clipboard Paste:** Allow pasting rows directly from Excel or Google Sheets (`Date`, `Document No.`, `Particular`, `Total`) into the table to auto-populate multiple rows at once.
- **Local Storage Persistence:** Automatically save the current draft in `localStorage` so data is not lost on refresh, plus a **"Clear / New Claim"** button with confirmation.

## 3. Approval & Sign-Off Block
At the bottom of the claim sheet, include a 3-column signature block:
- **Claimed By (SSChu)** — dynamically reflects the current `Pay To` name, with Signature & Date lines.
- **Verified By** — Signature & Date lines.
- **Approved By** — Signature & Date lines.

## 4. Print & Export Toolbar (Hidden in Print View)
Provide a top action bar (`no-print`) containing:
- **Print / Save as PDF:** Triggers `window.print()` with clean `@media print` CSS formatted strictly for **A4 portrait** (`210mm x 297mm`), hiding all UI buttons, borders around inputs, and scrollbars so the output looks like a crisp corporate form.
- **Export CSV:** Downloads the line items and metadata as a `.csv` file.
- **Load Sample Data:** Populates 3 realistic sample expense rows for quick previewing.

## 5. Design & UX Guidelines
- Use a crisp, high-contrast corporate palette (slate-900 headers, subtle slate-200 borders, white A4 paper sheet centered on a soft gray workspace background).
- Ensure inputs look like clean document cells (borderless or subtle bottom underline until hovered/focused).
- Keep all components, state logic, and styles cleanly organized and responsive.