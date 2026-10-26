import assert from 'node:assert/strict';
import { uniqueAssetIdsByContent } from '../../common/media/asset-dedup.js';
import { compareReceiptImages, mergeReceiptLines } from './receipt.dedup.js';
import type { ReceiptImageIdentity } from './receipt.dedup.js';

type Line = Parameters<typeof mergeReceiptLines>[0][number] & { uncertaintyNote: string | null };

const imageOne = '22000000-0000-4000-8000-000000000001';
const imageTwo = '22000000-0000-4000-8000-000000000002';
const receiptImages = new Map<string, ReceiptImageIdentity>([
  [
    imageOne,
    {
      inputId: imageOne,
      receiptNumber: 'A-1',
      merchantName: 'Chợ Xanh',
      purchasedAt: '2026-09-24',
      currency: 'VND',
      totalAmount: 100,
    },
  ],
  [
    imageTwo,
    {
      inputId: imageTwo,
      receiptNumber: 'A-1',
      merchantName: 'Chợ Xanh',
      purchasedAt: '2026-09-24',
      currency: 'VND',
      totalAmount: 100,
    },
  ],
]);

function line(
  inputId: string,
  lineText: string,
  name: string,
  lineTotal: number | null,
  ingredientId: string | null = null,
): Line {
  return {
    inputId,
    ingredientId,
    lineText,
    normalizedName: name.toLowerCase(),
    quantity: 1,
    unit: 'phần',
    lineTotal,
    uncertaintyNote: null,
  };
}

export function verifyReceiptLineDeduplication(): void {
  // The same receipt photo uploaded twice, translated differently each run: Dưa leo vs Dưa chuột.
  const first = [
    line(imageOne, '# Cucumber 3.80', 'dưa leo', 3.8),
    line(imageOne, '# Yogurt 7.00', 'sữa chua', 7),
    line(imageOne, '# Spinach 4.50', 'cải bó xôi', 4.5, 'ing-spinach'),
  ];
  const second = [
    line(imageTwo, '# Cucumber 3.80', 'dưa chuột', 3.8),
    line(imageTwo, '#Yogurt  7.00', 'sữa chua', 7),
    line(imageTwo, '# Spinach 4.50', 'rau bina', 4.5, 'ing-spinach'),
  ];
  const merged = mergeReceiptLines([], [...first, ...second], receiptImages);
  assert.equal(merged.kept.length, 3, 'identical lines from two images collapse into one');
  assert.equal(merged.duplicates, 3);
  assert(merged.kept.every((item) => item.inputId === imageOne));
  assert.match(merged.kept[0]!.uncertaintyNote ?? '', /không cộng dồn/);

  // Lines repeated inside one image are legitimate (the same product bought twice) and kept.
  const sameImage = mergeReceiptLines(
    [],
    [line(imageOne, 'Milk 8.50', 'sữa', 8.5), line(imageOne, 'Milk 8.50', 'sữa', 8.5)],
    receiptImages,
  );
  assert.equal(sameImage.kept.length, 2, 'repeats within one image are not collapsed');

  // Appending an image merges against candidates that are already stored on the job.
  const appended = mergeReceiptLines(
    first,
    [
      line(imageTwo, '# Cucumber 3.80', 'dưa chuột', 3.8),
      line(imageTwo, '# Cabbage 2.20', 'bắp cải', 2.2),
    ],
    receiptImages,
  );
  assert.deepEqual(
    appended.kept.map((item) => item.lineText),
    ['# Cabbage 2.20'],
    'only lines not read before are added',
  );
  assert.equal(appended.duplicates, 1);

  // Same name but a different price is a different line, not a duplicate.
  const different = mergeReceiptLines(
    first,
    [line(imageTwo, '# Cucumber 5.10', 'dưa leo', 5.1)],
    receiptImages,
  );
  assert.equal(different.kept.length, 1);
  const differentQuantity = mergeReceiptLines(
    first,
    [{ ...line(imageTwo, '# Cucumber 3.80', 'dưa leo', 3.8), quantity: 2 }],
    receiptImages,
  );
  assert.equal(
    differentQuantity.kept.length,
    1,
    'matching printed text with a different quantity is a separate line',
  );
  const distinctImages = new Map(receiptImages);
  distinctImages.set(imageTwo, { ...receiptImages.get(imageTwo)!, receiptNumber: 'A-2' });
  assert.equal(
    mergeReceiptLines(first, second, distinctImages).kept.length,
    3,
    'different receipts accumulate matching items',
  );
  const noNumberImages = new Map(receiptImages);
  for (const id of [imageOne, imageTwo])
    noNumberImages.set(id, { ...receiptImages.get(id)!, receiptNumber: null });
  const croppedNumberImages = new Map(receiptImages);
  croppedNumberImages.set(imageTwo, { ...receiptImages.get(imageTwo)!, receiptNumber: null });
  assert.equal(
    compareReceiptImages(
      croppedNumberImages.get(imageOne)!,
      first,
      croppedNumberImages.get(imageTwo)!,
      second,
    ),
    'EXACT_DUPLICATE',
    'a cropped receipt number still permits an exact metadata and line match',
  );
  const croppedPartial = mergeReceiptLines(first, [second[0]!], croppedNumberImages);
  assert.equal(croppedPartial.identityDecisionRequired, true);
  assert.equal(croppedPartial.reviewRequired, true);
  assert.equal(
    compareReceiptImages(noNumberImages.get(imageOne)!, first, noNumberImages.get(imageTwo)!, second),
    'EXACT_DUPLICATE',
    'matching complete no-number receipts are duplicates',
  );
  assert.equal(
    compareReceiptImages(
      noNumberImages.get(imageOne)!,
      first,
      noNumberImages.get(imageTwo)!,
      [{ ...second[0]!, quantity: 2 }, ...second.slice(1)],
    ),
    'DISTINCT',
    'a changed quantity prevents automatic no-number deduplication',
  );
  assert.equal(
    mergeReceiptLines([], [...first, ...second], noNumberImages).duplicates,
    3,
    'exact no-number receipts are duplicates',
  );
  const partial = mergeReceiptLines(first, [second[0]!], noNumberImages);
  assert.equal(partial.reviewRequired, true, 'partial same-receipt image requires review');
  assert.equal(
    partial.identityDecisionRequired,
    true,
    'a missing receipt number requires an explicit same/separate decision',
  );
  assert.equal(
    partial.kept.length,
    1,
    'ambiguous no-number line remains available for the review decision',
  );
}

export function verifyContentDeduplicationOfAssets(): void {
  const assets = new Map([
    ['a', { providerEtag: 'etag-1' }],
    ['b', { providerEtag: 'etag-1' }],
    ['c', { providerEtag: 'etag-2' }],
    ['d', { providerEtag: null }],
    ['e', { providerEtag: null }],
  ]);
  assert.deepEqual(uniqueAssetIdsByContent(['a', 'b', 'c'], assets), ['a', 'c']);
  assert.deepEqual(
    uniqueAssetIdsByContent(['d', 'e'], assets),
    ['d', 'e'],
    'assets without an ETag cannot be compared and are kept',
  );
  assert.deepEqual(
    uniqueAssetIdsByContent(['b', 'c'], assets, ['etag-1']),
    ['c'],
    'an image identical to one already attached to the job is ignored',
  );
}

verifyReceiptLineDeduplication();
verifyContentDeduplicationOfAssets();
console.info(
  'Receipt dedup acceptance passed: cross-image line collapse, same-image repeats kept, append merge against stored lines, and identical-content image collapse.',
);
