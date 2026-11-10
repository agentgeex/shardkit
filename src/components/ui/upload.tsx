/**
 * ui/upload.tsx — 文件上传（对齐 vue-admin-tpl「全部示例」的 Upload）
 * ────────────────────────────────────────────────────────────────────────────
 * 拖拽/点选上传，本地预览（图片缩略、文件名），支持多选、数量/类型/大小限制。
 * 纯前端演示：不真正上传，fileList 由父组件受控。
 */
import * as React from "react";
import { UploadCloud, X, FileText, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface UploadItem {
  uid: string;
  name: string;
  size: number;
  type?: string;
  url?: string; // 图片预览
}

export interface UploadProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  value?: UploadItem[];
  onChange?: (items: UploadItem[]) => void;
  accept?: string;
  multiple?: boolean;
  maxCount?: number;
  maxSizeMB?: number;
  disabled?: boolean;
  tip?: React.ReactNode;
  className?: string;
}

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function Upload({
  value = [],
  onChange,
  accept,
  multiple = true,
  maxCount = 5,
  maxSizeMB = 5,
  disabled,
  tip,
  className,
  ...rest
}: UploadProps) {
  const [dragOver, setDragOver] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    setError(null);
    const next = [...value];
    for (const f of Array.from(files)) {
      if (next.length >= maxCount) {
        setError(`最多上传 ${maxCount} 个文件`);
        break;
      }
      if (f.size > maxSizeMB * 1024 * 1024) {
        setError(`「${f.name}」超过 ${maxSizeMB}MB`);
        continue;
      }
      next.push({
        uid: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: f.name,
        size: f.size,
        type: f.type,
        url: f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined,
      });
    }
    onChange?.(next);
  };

  const remove = (uid: string) => onChange?.(value.filter((i) => i.uid !== uid));

  return (
    <div className={cn("space-y-2", className)} data-testid="upload" {...rest}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!disabled) addFiles(e.dataTransfer.files);
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-input bg-transparent px-6 py-6 text-center transition-colors",
          dragOver && "border-primary bg-primary/5",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <UploadCloud className="h-7 w-7 text-muted-foreground" />
        <div className="text-sm">
          将文件拖到此处，或 <span className="text-primary underline-offset-4 hover:underline">点击上传</span>
        </div>
        {tip && <div className="text-[11px] text-muted-foreground">{tip}</div>}
        <input
          ref={inputRef}
          type="file"
          hidden
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {value.length > 0 && (
        <ul className="space-y-1.5">
          {value.map((f) => (
            <li
              key={f.uid}
              className="flex items-center gap-2.5 rounded-md border border-border px-2.5 py-1.5 text-sm"
            >
              {f.url ? (
                <img src={f.url} alt={f.name} className="h-8 w-8 rounded object-cover" />
              ) : (
                <FileText className="h-8 w-8 shrink-0 text-muted-foreground" />
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate">{f.name}</div>
                <div className="text-[11px] text-muted-foreground">{fmtSize(f.size)}</div>
              </div>
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => remove(f.uid)}
                  className="rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-destructive"
                  aria-label={`移除 ${f.name}`}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
