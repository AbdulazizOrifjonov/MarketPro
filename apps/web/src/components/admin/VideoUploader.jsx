import { useRef, useState } from 'react';
import { Upload, X, Loader2, Video } from 'lucide-react';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/input';

export function VideoUploader({ folder, value, onChange }) {
  const inputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('files', file);
      const { data } = await api.post(`/upload/${folder}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onChange(data.files[0]?.url || '');
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  if (value) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border p-2">
        <Video className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="flex-1 truncate text-xs text-muted-foreground">{value}</span>
        <button type="button" onClick={() => onChange('')} className="rounded-full p-1 hover:bg-accent" aria-label="remove video">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Input
        placeholder="https://... video havolasi (ixtiyoriy)"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className="flex shrink-0 items-center gap-1.5 rounded-lg border border-input px-3 text-sm hover:bg-accent disabled:opacity-50"
      >
        {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        Fayldan
      </button>
      <input ref={inputRef} type="file" accept="video/mp4" hidden onChange={handleFile} />
    </div>
  );
}
