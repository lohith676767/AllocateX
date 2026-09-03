import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FileImage, MapPin, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useApiErrorToast, useToast } from '../hooks/useToast';
import { api } from '../services/api';
import type { Milestone } from '../types';

export default function EvidenceModal({ milestone, onClose }: { milestone: Milestone; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { push } = useToast();
  const onError = useApiErrorToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filename, setFilename] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('25.4358° N, 78.5685° E (simulated GPS)');

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFilename(file.name);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(file.type.startsWith('image/') ? URL.createObjectURL(file) : null);
  };

  const submit = useMutation({
    mutationFn: () => api.submitEvidence(milestone.id, { filename, description, simulatedLocation: location }),
    onSuccess: () => {
      queryClient.invalidateQueries();
      push('success', 'Evidence submitted', `Attached to "${milestone.name}" — awaiting human review.`);
      onClose();
    },
    onError: (err) => onError(err, 'Evidence submission failed'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-[2px]">
      <div className="card w-full max-w-md p-5 shadow-popover">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-[14px] font-semibold text-stone-900">Submit milestone evidence</h3>
            <p className="mt-0.5 text-[12px] text-stone-500">{milestone.name}</p>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700">
            <X size={16} />
          </button>
        </div>

        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            submit.mutate();
          }}
        >
          <label className="block">
            <span className="text-[12px] font-medium text-stone-600">Document / photo</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-1 flex w-full items-center gap-3 rounded-md border border-dashed border-stone-300 bg-stone-50 px-3 py-3 text-left hover:border-accent-300"
            >
              {previewUrl ? (
                <img src={previewUrl} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />
              ) : (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-stone-200">
                  <Upload size={15} className="text-stone-500" />
                </span>
              )}
              <span className="min-w-0">
                <span className="block truncate text-[13px] text-stone-800">{filename || 'Choose a file…'}</span>
                <span className="block text-[11px] text-stone-500">
                  {filename ? 'Click to replace' : 'Photo, PDF, or document from this device'}
                </span>
              </span>
            </button>
            {filename && (
              <div className="mt-1.5 flex items-center gap-2 rounded-md border border-stone-200 bg-stone-50 px-3 py-1.5">
                <FileImage size={12} className="shrink-0 text-stone-400" />
                <input
                  required
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  className="w-full bg-transparent text-[12px] text-stone-600 outline-none"
                />
              </div>
            )}
          </label>
          <label className="block">
            <span className="text-[12px] font-medium text-stone-600">Description</span>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Site visit confirming completed work against the milestone criteria."
              className="mt-1 w-full resize-none rounded-md border border-stone-200 bg-white px-3 py-2 text-[13px] text-stone-800 outline-none placeholder:text-stone-400"
            />
          </label>
          <label className="block">
            <span className="text-[12px] font-medium text-stone-600">Simulated location</span>
            <div className="mt-1 flex items-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-2">
              <MapPin size={14} className="text-stone-400" />
              <input
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-transparent text-[13px] text-stone-800 outline-none"
              />
            </div>
          </label>
          <p className="rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-[11px] leading-relaxed text-stone-500">
            The file itself is never uploaded to a server — only its name, alongside your description and location, is
            recorded for human review. No computer vision or ML runs on it.
          </p>
          <button
            type="submit"
            disabled={submit.isPending}
            className="w-full rounded-md bg-accent-600 py-2 text-[13px] font-semibold text-white hover:bg-accent-700 disabled:opacity-60"
          >
            {submit.isPending ? 'Submitting…' : 'Submit evidence'}
          </button>
        </form>
      </div>
    </div>
  );
}
