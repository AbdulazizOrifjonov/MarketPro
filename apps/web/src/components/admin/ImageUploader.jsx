import { useRef, useState } from 'react';
import { Upload, X, Loader2, Link2, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function ImageUploader({ folder, images, onChange, min = 0 }) {
  const inputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showUrlField, setShowUrlField] = useState(false);
  const [urlValue, setUrlValue] = useState('');

  async function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append('files', f));
      const { data } = await api.post(`/upload/${folder}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onChange([...images, ...data.files.map((f) => f.url)]);
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function addUrl() {
    if (!urlValue.trim()) return;
    onChange([...images, urlValue.trim()]);
    setUrlValue('');
    setShowUrlField(false);
  }

  function removeImage(index) {
    onChange(images.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {images.map((url, i) => (
          <div key={url + i} className="relative h-20 w-20 overflow-hidden rounded-lg border border-border">
            <img src={url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => removeImage(i)}
              className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-muted-foreground hover:bg-accent"
        >
          {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
          <span className="text-[10px]">Fayldan</span>
        </button>
        <button
          type="button"
          onClick={() => setShowUrlField((v) => !v)}
          className={cn(
            'flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-muted-foreground hover:bg-accent',
            showUrlField ? 'border-primary text-primary' : 'border-border'
          )}
        >
          <Link2 className="h-5 w-5" />
          <span className="text-[10px]">Havoladan</span>
        </button>
      </div>

      {showUrlField && (
        <div className="mt-2 flex gap-2">
          <Input
            placeholder="https://... rasm havolasi"
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addUrl();
              }
            }}
          />
          <Button type="button" size="sm" onClick={addUrl}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}

      {min > 0 && images.length < min && (
        <p className="mt-1.5 text-xs text-destructive">Kamida {min} ta rasm kerak (fayl yuklang yoki havola qo'ying)</p>
      )}
      <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={handleFiles} />
    </div>
  );
}
