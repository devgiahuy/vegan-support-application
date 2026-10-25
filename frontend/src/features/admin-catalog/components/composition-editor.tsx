'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldGroup, FieldLabel, FieldDescription } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDebounce } from '@/hooks/useDebounce';
import { getApiErrorCode, getApiErrorMessage } from '@/lib/api-error';
import { useIngredientsQuery } from '@/features/ingredient/queries/ingredient.queries';
import { useAllergenCatalogQuery } from '@/features/diet-preferences/queries/allergen.queries';
import {
  useCompositionQuery,
  useCompositionSourcesQuery,
  useSaveCompositionMutation,
} from '../queries/composition.queries';
import type {
  IngredientComposition,
  CompositionSource,
  CompositionStatus,
  CompositionKind,
} from '../types/composition.model';

const STATUSES: Array<{ value: CompositionStatus; label: string }> = [
  { value: 'UNKNOWN', label: 'Chưa rõ thành phần' },
  { value: 'PARTIAL', label: 'Mới có một phần dữ liệu' },
  { value: 'COMPLETE', label: 'Đã rà soát đầy đủ' },
];
const KINDS: Array<{ value: CompositionKind; label: string }> = [
  { value: 'UNSPECIFIED', label: 'Chưa phân loại' },
  { value: 'SIMPLE', label: 'Nguyên liệu đơn' },
  { value: 'COMPOUND', label: 'Nguyên liệu phối trộn' },
];

export function CompositionEditor({
  ingredientId,
  ingredientName,
}: {
  ingredientId: string;
  ingredientName: string;
}) {
  const [open, setOpen] = React.useState(false);
  const query = useCompositionQuery(ingredientId, open);
  const sources = useCompositionSourcesQuery(open);
  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        Cấu tạo & dị ứng
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cấu tạo: {ingredientName}</DialogTitle>
            <DialogDescription>
              Rà soát thành phần và nguồn theo đúng nguyên liệu hoặc sản phẩm. Dữ liệu không đầy đủ
              sẽ bị loại khi áp dụng ràng buộc ăn uống.
            </DialogDescription>
          </DialogHeader>
          {(query.isPending || sources.isPending) && <Skeleton className="h-64 w-full" />}
          {(query.isError || sources.isError) && (
            <Alert variant="destructive">
              <AlertDescription>
                Không tải được cấu tạo hoặc nguồn dữ liệu.{' '}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    void query.refetch();
                    void sources.refetch();
                  }}
                >
                  Thử lại
                </Button>
              </AlertDescription>
            </Alert>
          )}
          {query.data && sources.data && !query.isError && !sources.isError && (
            <CompositionForm
              key={`${ingredientId}-${query.data.version}`}
              data={query.data}
              sources={sources.data}
              onReload={() => void query.refetch()}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function CompositionForm({
  data,
  sources,
  onReload,
}: {
  data: IngredientComposition;
  sources: CompositionSource[];
  onReload: () => void;
}) {
  const [status, setStatus] = React.useState(data.status);
  const [kind, setKind] = React.useState(data.kind);
  const [components, setComponents] = React.useState(data.components);
  const [search, setSearch] = React.useState('');
  const [sourceId, setSourceId] = React.useState(data.evidence.sourceId);
  const [sourceVersion, setSourceVersion] = React.useState(data.evidence.sourceVersion);
  const [sourceRecordId, setSourceRecordId] = React.useState(data.evidence.sourceRecordId);
  const [scope, setScope] = React.useState(data.evidence.scope);
  const [error, setError] = React.useState('');
  const debounced = useDebounce(search, 300);
  const ingredients = useIngredientsQuery({ q: debounced.trim() || undefined, limit: 20 });
  const allergens = useAllergenCatalogQuery();
  const mutation = useSaveCompositionMutation(data.ingredientId);
  const needsEvidence = status !== 'UNKNOWN';
  const source = sources.find((item) => item.id === sourceId);
  const addable =
    ingredients.data?.items.filter(
      (item) => item.id !== data.ingredientId && !components.some((entry) => entry.id === item.id)
    ) ?? [];
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (search.trim()) {
      setError('Hãy chọn thành phần tìm thấy hoặc xóa nội dung tìm kiếm trước khi lưu.');
      return;
    }
    if (kind === 'SIMPLE' && components.length) {
      setError(
        'Nguyên liệu đơn không có thành phần con. Hãy bỏ thành phần con hoặc chọn phối trộn.'
      );
      return;
    }
    if (
      status === 'COMPLETE' &&
      (kind === 'UNSPECIFIED' || (kind === 'COMPOUND' && !components.length))
    ) {
      setError('Hãy phân loại nguyên liệu và chọn đủ thành phần con trước khi đánh dấu đầy đủ.');
      return;
    }
    if (
      needsEvidence &&
      (!source || !sourceVersion.trim() || !sourceRecordId.trim() || !scope.trim())
    ) {
      setError(
        'Cần nguồn đang hoạt động, phiên bản, mã bản ghi nguồn và phạm vi sản phẩm/công thức.'
      );
      return;
    }
    try {
      await mutation.mutateAsync({
        version: data.version,
        draft: {
          status,
          kind,
          componentIds: components.map((item) => item.id),
          sourceId,
          sourceVersion,
          sourceRecordId,
          scope,
        },
      });
    } catch (failure) {
      const code = getApiErrorCode(failure);
      const messages: Record<string, string> = {
        INGREDIENT_COMPOSITION_CONFLICT:
          'Có người vừa thay đổi dữ liệu. Hãy tải lại trước khi lưu.',
        INGREDIENT_COMPOSITION_CYCLE:
          'Các thành phần đang tạo vòng lặp. Hãy kiểm tra lại lựa chọn.',
        INGREDIENT_COMPOSITION_DEPTH: 'Cấu tạo vượt giới hạn 32 cấp thành phần.',
        INVALID_COMPOSITION_SOURCE: 'Nguồn dữ liệu đã ngừng dùng. Hãy chọn nguồn khác.',
        INVALID_INGREDIENT_COMPONENT: 'Có thành phần đã ngừng dùng. Hãy tải lại và chọn lại.',
      };
      setError(
        (code && messages[code]) ||
          getApiErrorMessage(failure, 'Không lưu được cấu tạo nguyên liệu.')
      );
    }
  };
  return (
    <form onSubmit={(event) => void save(event)} className="flex flex-col gap-5">
      <Alert>
        <AlertDescription>
          {data.complete
            ? 'Dữ liệu cấu tạo hiện đầy đủ theo nguồn đã rà soát.'
            : 'Cấu tạo hiện chưa đủ dữ liệu để kiểm tra các yêu cầu ăn uống bắt buộc.'}{' '}
          Đây không phải chứng nhận an toàn dị ứng.
          {data.inferredAllergenCodes.length > 0 && (
            <span className="block pt-1">
              Nhóm dị ứng từ nguyên liệu và thành phần con:{' '}
              {data.inferredAllergenCodes
                .map(
                  (code) =>
                    allergens.data?.find((item) => item.code === code)?.label ??
                    'Nhóm chưa có tên trong danh mục'
                )
                .join(', ')}
              .
            </span>
          )}
        </AlertDescription>
      </Alert>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="composition-status">Mức đầy đủ dữ liệu</FieldLabel>
          <Select value={status} onValueChange={(value) => setStatus(value as CompositionStatus)}>
            <SelectTrigger id="composition-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {STATUSES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="composition-kind">Loại nguyên liệu</FieldLabel>
          <Select value={kind} onValueChange={(value) => setKind(value as CompositionKind)}>
            <SelectTrigger id="composition-kind">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {KINDS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="composition-search">Thành phần bên trong</FieldLabel>
          <FieldDescription>
            Chọn nguyên liệu chuẩn. Thành phần lồng nhau được backend kiểm tra; không tự suy ra từ
            tên thương mại.
          </FieldDescription>
          <ul className="flex flex-wrap gap-2" aria-label="Thành phần đã chọn">
            {components.map((item) => (
              <li key={item.id} className="flex items-center gap-1 rounded-md border p-1 text-sm">
                {item.name}
                {!item.active && <Badge variant="destructive">Ngừng dùng</Badge>}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Bỏ thành phần ${item.name}`}
                  onClick={() => setComponents(components.filter((entry) => entry.id !== item.id))}
                >
                  <X />
                </Button>
              </li>
            ))}
          </ul>
          <Input
            id="composition-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm tên hoặc tên gọi khác của thành phần"
            maxLength={160}
          />
          {ingredients.isPending && <Skeleton className="h-16 w-full" />}
          {ingredients.isError && (
            <Button type="button" variant="outline" onClick={() => void ingredients.refetch()}>
              Không tải được thành phần. Thử lại
            </Button>
          )}
          {!ingredients.isPending && !ingredients.isError && (
            <ScrollArea className="h-32 rounded-md border">
              <ul className="flex flex-col gap-1 p-2">
                {addable.map((item) => (
                  <li key={item.id}>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        setComponents([
                          ...components,
                          { id: item.id, name: item.canonicalName, active: true },
                        ]);
                        setSearch('');
                      }}
                    >
                      {item.canonicalName}
                    </Button>
                  </li>
                ))}
                {!addable.length && (
                  <li className="p-2 text-sm text-muted-foreground">
                    Không có thành phần phù hợp. Thử tên khác.
                  </li>
                )}
              </ul>
            </ScrollArea>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="composition-source">Nguồn rà soát</FieldLabel>
          <Select
            value={sourceId || 'none'}
            onValueChange={(value) => setSourceId(value === 'none' ? '' : value)}
          >
            <SelectTrigger id="composition-source">
              <SelectValue placeholder="Chọn nguồn" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="none">Chưa chọn nguồn</SelectItem>
                {sources.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {source && (
            <FieldDescription>
              {source.licenseName} · {source.attribution}
            </FieldDescription>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="composition-version">Phiên bản nguồn</FieldLabel>
          <Input
            id="composition-version"
            required={needsEvidence}
            value={sourceVersion}
            onChange={(event) => setSourceVersion(event.target.value)}
            maxLength={120}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="composition-record">Bản ghi / tham chiếu trong nguồn</FieldLabel>
          <Input
            id="composition-record"
            required={needsEvidence}
            value={sourceRecordId}
            onChange={(event) => setSourceRecordId(event.target.value)}
            maxLength={240}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="composition-scope">
            Phạm vi nguyên liệu / sản phẩm / công thức
          </FieldLabel>
          <Textarea
            id="composition-scope"
            required={needsEvidence}
            value={scope}
            onChange={(event) => setScope(event.target.value)}
            maxLength={1000}
            placeholder="Tên sản phẩm, thương hiệu, phiên bản nhãn hoặc công thức cụ thể được rà soát"
          />
        </Field>
      </FieldGroup>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            {error}{' '}
            <Button type="button" variant="outline" onClick={onReload}>
              Tải lại dữ liệu
            </Button>
          </AlertDescription>
        </Alert>
      )}
      <Button type="submit" disabled={mutation.isPending || Boolean(search.trim())}>
        {mutation.isPending ? 'Đang lưu…' : 'Lưu kết quả rà soát'}
      </Button>
      {data.audit.length > 0 && (
        <details>
          <summary className="cursor-pointer text-sm font-medium">Lịch sử rà soát gần nhất</summary>
          <ol className="flex flex-col gap-2 pt-3 text-sm">
            {data.audit.map((entry) => (
              <li key={entry.version}>
                <span className="tabular-nums">
                  Phiên bản {entry.version} · {entry.createdAtLabel}
                </span>
                <p className="text-muted-foreground">{entry.scope}</p>
              </li>
            ))}
          </ol>
        </details>
      )}
    </form>
  );
}
