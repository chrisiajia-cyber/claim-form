import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

const CLAIM_CATEGORIES = [
  'Damaged Item',
  'Missing Parcel',
  'Expense Reimbursement',
  'Warranty / Defect',
  'Other',
] as const;

const SYSTEM_INSTRUCTION = `You are an automated claims intake assistant. Analyze the uploaded receipt, invoice, or incident photo and extract the claim details accurately into the requested JSON schema.
- Format all dates as YYYY-MM-DD.
- Extract the total claimable amount as a clean number without currency symbols.
- Use a 3-letter ISO currency code (e.g., MYR, USD, SGD, EUR, GBP).
- Choose the closest matching claimCategory from: Damaged Item, Missing Parcel, Expense Reimbursement, Warranty / Defect, Other.
- If a field is missing or illegible, return null rather than guessing.`;

function createGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.post('/api/extract-claim', async (req, res) => {
    try {
      const { base64Data, mimeType } = req.body as {
        base64Data?: string;
        mimeType?: string;
      };

      if (!base64Data || !mimeType) {
        res.status(400).json({
          error: 'Missing document payload. Upload an image or PDF receipt to extract claim fields.',
        });
        return;
      }

      const allowedMimeTypes = new Set([
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/heic',
        'image/heif',
        'application/pdf',
      ]);

      if (!allowedMimeTypes.has(mimeType)) {
        res.status(400).json({
          error: `Unsupported file type (${mimeType}). Upload a PNG, JPG, WEBP, or PDF document.`,
        });
        return;
      }

      const ai = createGeminiClient();
      if (!ai) {
        res.status(503).json({
          error:
            'Document extraction service is not configured. Check your API key in Settings > Secrets, or complete the form fields manually.',
        });
        return;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType,
              },
            },
            {
              text: 'Extract the structured claim details from this uploaded receipt, invoice, or incident document.',
            },
          ],
        },
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              claimantName: {
                type: Type.STRING,
                nullable: true,
                description: 'Full name of the customer or employee submitting the claim',
              },
              referenceNumber: {
                type: Type.STRING,
                nullable: true,
                description: 'Order ID, invoice number, or tracking number',
              },
              incidentDate: {
                type: Type.STRING,
                nullable: true,
                description: 'Date of purchase or incident in YYYY-MM-DD format',
              },
              claimCategory: {
                type: Type.STRING,
                enum: [...CLAIM_CATEGORIES],
                description: 'Category of the claim',
              },
              claimAmount: {
                type: Type.NUMBER,
                nullable: true,
                description: 'Total numeric amount being claimed',
              },
              currency: {
                type: Type.STRING,
                nullable: true,
                description: '3-letter currency code (e.g., MYR, USD, SGD)',
              },
              description: {
                type: Type.STRING,
                nullable: true,
                description: 'Concise summary of the items or reason for the claim',
              },
            },
            required: ['claimCategory', 'description'],
          },
        },
      });

      const rawText = (response.text ?? '{}').trim();
      const parsed = JSON.parse(rawText);

      res.json({
        claimantName: typeof parsed.claimantName === 'string' ? parsed.claimantName.trim() : null,
        referenceNumber:
          typeof parsed.referenceNumber === 'string' ? parsed.referenceNumber.trim() : null,
        incidentDate: typeof parsed.incidentDate === 'string' ? parsed.incidentDate.trim() : null,
        claimCategory: CLAIM_CATEGORIES.includes(parsed.claimCategory)
          ? parsed.claimCategory
          : 'Other',
        claimAmount:
          typeof parsed.claimAmount === 'number' && Number.isFinite(parsed.claimAmount)
            ? parsed.claimAmount
            : null,
        currency:
          typeof parsed.currency === 'string' && parsed.currency.trim().length === 3
            ? parsed.currency.trim().toUpperCase()
            : null,
        description: typeof parsed.description === 'string' ? parsed.description.trim() : null,
      });
    } catch (error: unknown) {
      const err = error as { status?: number; message?: string };
      console.error('Claim extraction error:', err);
      const status = typeof err?.status === 'number' ? err.status : 500;
      if (status === 403 || status === 401) {
        res.status(status).json({
          error: 'API authorization failed. Verify the server API key in Settings > Secrets.',
        });
        return;
      }
      if (status === 429) {
        res.status(429).json({
          error: 'Extraction rate limit reached. Wait a moment and retry, or enter fields manually.',
        });
        return;
      }
      res.status(500).json({
        error: err?.message || 'Unable to parse document. Verify the file is legible or fill the form manually.',
      });
    }
  });

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('/{*splat}', (_req, res) => {
      const indexPath = path.join(distDir, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Build output not found.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ClearClaim server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
