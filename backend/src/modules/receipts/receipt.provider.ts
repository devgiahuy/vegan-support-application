import { z } from '../../common/validation/zod.js';
import type { AppConfig } from '../../config/env.js';

const providerLineSchema = z
  .object({
    lineText: z.string().trim().min(1).max(300),
    name: z.string().trim().min(1).max(160),
    quantity: z.number().positive().max(999_999_999).nullable(),
    unit: z.string().trim().min(1).max(40).nullable(),
    unitPrice: z.number().nonnegative().max(999_999_999_999).nullable(),
    lineTotal: z.number().nonnegative().max(999_999_999_999).nullable(),
    currency: z.string().regex(/^[A-Z]{3}$/).nullable(),
    confidence: z.number().min(0).max(1),
    uncertaintyNote: z.string().trim().min(1).max(500).nullable(),
  })
  .strict();

const providerImageResultSchema = z
  .object({
    inputId: z.string().uuid(),
    merchantName: z.string().trim().min(1).max(200).nullable(),
    purchasedAt: z.string().date().nullable(),
    currency: z.string().regex(/^[A-Z]{3}$/).nullable(),
    totalAmount: z.number().nonnegative().max(999_999_999_999).nullable(),
    metadataConfidence: z.number().min(0).max(1).nullable(),
    lines: z.array(providerLineSchema).max(200),
    error: z
      .object({ code: z.string().min(1).max(100), message: z.string().min(1).max(500) })
      .strict()
      .nullable(),
  })
  .strict();

const providerResultSchema = z.array(providerImageResultSchema);

export interface ReceiptProviderInput {
  id: string;
  position: number;
  url: string;
}

export type ReceiptProviderImageResult = z.infer<typeof providerImageResultSchema>;

export interface ReceiptExtractionProvider {
  readonly name: string;
  readonly model: string;
  readonly templateVersion: string;
  extract(inputs: readonly ReceiptProviderInput[]): Promise<ReceiptProviderImageResult[]>;
}

export class FakeReceiptExtractionProvider implements ReceiptExtractionProvider {
  readonly name = 'fake-local';

  constructor(
    readonly model: string,
    readonly templateVersion: string,
  ) {}

  extract(inputs: readonly ReceiptProviderInput[]): Promise<ReceiptProviderImageResult[]> {
    const output = inputs.map((input) => {
      if (input.url.includes('partial-failure')) {
        return {
          inputId: input.id,
          merchantName: null,
          purchasedAt: null,
          currency: null,
          totalAmount: null,
          metadataConfidence: null,
          lines: [],
          error: {
            code: 'RECEIPT_IMAGE_EXTRACTION_FAILED',
            message: 'One receipt image could not be extracted; other page results remain available.',
          },
        };
      }
      return {
        inputId: input.id,
        merchantName: 'Local Vegan Market',
        purchasedAt: '2026-09-24',
        currency: 'VND',
        totalAmount: 78000,
        metadataConfidence: 0.94,
        lines: [
          {
            lineText: 'DAU HU 400G 24000',
            name: 'dau hu',
            quantity: 400,
            unit: 'g',
            unitPrice: 60,
            lineTotal: 24000,
            currency: 'VND',
            confidence: 0.93,
            uncertaintyNote: null,
          },
          {
            lineText: 'RAU XANH 2 30000',
            name: 'unknown leafy vegetable',
            quantity: 2,
            unit: 'bunch',
            unitPrice: 15000,
            lineTotal: 30000,
            currency: 'VND',
            confidence: 0.56,
            uncertaintyNote: 'The abbreviated product name does not identify a canonical ingredient.',
          },
        ],
        error: null,
      };
    });
    return Promise.resolve(providerResultSchema.parse(output));
  }
}

export function createReceiptExtractionProvider(config: AppConfig): ReceiptExtractionProvider {
  return new FakeReceiptExtractionProvider(
    config.receipt.model,
    config.receipt.templateVersion,
  );
}
