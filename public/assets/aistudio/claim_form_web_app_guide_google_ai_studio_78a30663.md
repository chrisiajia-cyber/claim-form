# Building & Exporting a Claim Form Web App with Google AI Studio

This guide outlines the complete workflow for prototyping an AI-powered **Claim Form Web App** in Google AI Studio, exporting the codebase, and adding data export features (**CSV/Excel** and **PDF/Print**) for submitted claims.

---

## 1. Exporting the Web App from Google AI Studio

Depending on how you build the form inside Google AI Studio, use the appropriate export path:

### Option A: Full UI Prototype (Google AI Studio Build)
If you prompted Google AI Studio to generate the interactive Claim Form UI:
1. **Download ZIP:** Click the **Download / Export ZIP** icon in the top-right toolbar to export a standalone **React + Vite + Tailwind CSS** project.
2. **Push to GitHub / Open in Firebase Studio (Project IDX):** Sync directly to GitHub to deploy via Vercel, Netlify, or Firebase Hosting.
3. **One-Click Deploy:** Click **Deploy to Cloud Run** in the top bar to publish the claim form immediately to a live public URL.

### Option B: Backend AI Integration ("Get Code")
If you already have a web frontend and want to use Gemini to auto-fill claim fields from uploaded receipts, invoices, or damage photos:
1. Configure your **System Instructions** and **Structured Outputs (JSON Schema)** in AI Studio.
2. Click **Get code** in the top-right toolbar.
3. Copy the generated `@google/genai` TypeScript/JavaScript snippet into a secure server-side API route (never expose your `GEMINI_API_KEY` in client-side browser code).

---

## 2. Google AI Studio Configuration (Receipt / Claim Auto-Fill)

### System Instructions
Paste this into the **System Instructions** panel in Google AI Studio:

```text
You are an automated claims intake assistant. Analyze the uploaded receipt, invoice, or incident photo and extract the claim details accurately into the requested JSON schema. 
- Format all dates as YYYY-MM-DD.
- Extract the total claimable amount as a clean number without currency symbols.
- If a field is missing or illegible, return null rather than guessing.
```

### Structured Output (JSON Schema)
Enable **Structured Outputs** in the right-hand sidebar and define your claim schema so the response maps directly into your web form state:

```json
{
  "type": "OBJECT",
  "properties": {
    "claimantName": {
      "type": "STRING",
      "description": "Full name of the customer or employee submitting the claim"
    },
    "referenceNumber": {
      "type": "STRING",
      "description": "Order ID, invoice number, or tracking number"
    },
    "incidentDate": {
      "type": "STRING",
      "description": "Date of purchase or incident in YYYY-MM-DD format"
    },
    "claimCategory": {
      "type": "STRING",
      "enum": ["Damaged Item", "Missing Parcel", "Expense Reimbursement", "Warranty / Defect", "Other"]
    },
    "claimAmount": {
      "type": "NUMBER",
      "description": "Total numeric amount being claimed"
    },
    "currency": {
      "type": "STRING",
      "description": "3-letter currency code (e.g., MYR, USD, SGD)"
    },
    "description": {
      "type": "STRING",
      "description": "Concise summary of the items or reason for the claim"
    }
  },
  "required": ["referenceNumber", "claimCategory", "claimAmount", "description"]
}
```

---

## 3. Exported `@google/genai` Server Route Example

Use this exported pattern in a Next.js App Router endpoint (`app/api/extract-claim/route.ts`) or Node.js backend to process uploaded receipts:

```typescript
import { GoogleGenAI, Type } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const { base64Image, mimeType } = await req.json();

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType,
          },
        },
        "Extract the claim details from this document.",
      ],
      config: {
        systemInstruction:
          "Extract claim details accurately. Format dates as YYYY-MM-DD.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            claimantName: { type: Type.STRING },
            referenceNumber: { type: Type.STRING },
            incidentDate: { type: Type.STRING },
            claimCategory: { type: Type.STRING },
            claimAmount: { type: Type.NUMBER },
            currency: { type: Type.STRING },
            description: { type: Type.STRING },
          },
          required: ["referenceNumber", "claimCategory", "claimAmount", "description"],
        },
      },
    });

    const extractedData = JSON.parse(response.text || "{}");
    return NextResponse.json(extractedData);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to parse claim document" },
      { status: 500 }
    );
  }
}
```

---

## 4. Exporting Submitted Claim Data from Your Web App

AI Studio prototypes store data in temporary browser state by default. Add these two utilities to your exported project so users and admins can export submitted claims.

### A. Export All Claims to CSV (Excel / Google Sheets)

```typescript
export interface ClaimRecord {
  id: string;
  submittedAt: string;
  claimantName: string;
  referenceNumber: string;
  claimCategory: string;
  claimAmount: number;
  currency: string;
  status: "Pending" | "Approved" | "Rejected";
}

export function exportClaimsToCSV(claims: ClaimRecord[]) {
  const headers = [
    "Claim ID",
    "Submitted Date",
    "Claimant Name",
    "Reference No",
    "Category",
    "Amount",
    "Currency",
    "Status",
  ];

  const rows = claims.map((c) => [
    c.id,
    c.submittedAt,
    `"${c.claimantName.replace(/"/g, '""')}"`,
    c.referenceNumber,
    c.claimCategory,
    c.claimAmount.toFixed(2),
    c.currency,
    c.status,
  ]);

  const csvContent =
    "data:text/csv;charset=utf-8," +
    [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `claims_export_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
```

### B. Export Single Claim Receipt as PDF (Browser Print)

Add a **"Save as PDF / Print Receipt"** button on your confirmation screen using `window.print()` paired with print-only CSS:

```css
@media print {
  /* Hide navigation, buttons, and form inputs when exporting to PDF */
  .no-print {
    display: none !important;
  }

  /* Format the claim summary card cleanly on A4 paper */
  .claim-receipt-card {
    box-shadow: none !important;
    border: 1px solid #d1d5db !important;
    width: 100% !important;
    margin: 0 !important;
  }
}
```

---

## 5. Pre-Launch Checklist

- [ ] **Move API Key to Environment Variables:** Store `GEMINI_API_KEY` in `.env.local` (never commit `.env` to GitHub).
- [ ] **Connect Persistent Storage:** Replace temporary React `useState` / `localStorage` with **Firebase Firestore**, **Supabase**, or a SQL database so claims are saved across devices.
- [ ] **File Upload Storage:** Store uploaded receipt photos or damage evidence in **Firebase Storage**, **AWS S3**, or **Cloudflare R2** and save the file URL in the claim record.
- [ ] **Email Notifications:** Trigger a confirmation email (via Resend, SendGrid, or Nodemailer) with the Claim ID when a user submits the form.