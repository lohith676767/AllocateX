import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FileImage, MapPin, X } from 'lucide-react';
import { useState } from 'react';
import { useApiErrorToast, useToast } from '../hooks/useToast';
import { api } from '../services/api';
import type { Milestone } from '../types';

export default function EvidenceModal({ milestone, onClose }: { milestone: Milestone; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { push } = useToast();
  const onError = useApiErrorToast();
  const [filename, setFilename] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('25.4358° N, 78.5685° E (simulated GPS)');

  const submit = useMutation({
    mutationFn: () => api.submitEvidence(milestone.id, { filename, description, simulatedLocation: location }),
    onSuccess: () => {
      queryClient.invalidateQueries();
      push('success', 'Evidence submitted', `Attached to "${milestone.name}" for human review.`);
      onClose();
    },
    onError: (err) => onError(err, 'Evidence submission failed'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/70 p-4 backdrop-blur-sm">
      <div className="card w-full max-w-md p-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-mist-100">Submit milestone evidence</h3>
            <p className="mt-0.5 text-xs text-mist-400">{milestone.name}</p>
          </div>
          <button onClick={onClose} className="text-mist-400 hover:text-mist-100">
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
            <span className="text-xs font-medium text-mist-300">Document / photo filename</span>
            <div className="mt-1 flex items-center gap-2 rounded-lg border border-ink-600 bg-ink-800 px-3 py-2">
              <FileImage size={14} className="text-mist-400" />
              <input
                required
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="site_completion_photo.jpg"
                className="w-full bg-transparent text-sm text-mist-100 outline-none placeholder:text-mist-400/60"
              />
            </div>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-mist-300">Description</span>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Site visit confirming completed work against the milestone criteria."
              className="mt-1 w-full resize-none rounded-lg border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-mist-100 outline-none placeholder:text-mist-400/60"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-mist-300">Simulated location</span>
            <div className="mt-1 flex items-center gap-2 rounded-lg border border-ink-600 bg-ink-800 px-3 py-2">
              <MapPin size={14} className="text-mist-400" />
              <input
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-transparent text-sm text-mist-100 outline-none"
              />
            </div>
          </label>
          <p className="rounded-lg border border-ink-700 bg-ink-800/40 px-3 py-2 text-[11px] leading-relaxed text-mist-400">
            Evidence is human-reviewable, not automatically verified. No computer vision or ML runs on the file.
          </p>
          <button
            type="submit"
            disabled={submit.isPending}
            className="w-full rounded-lg bg-signal-teal py-2 text-sm font-semibold text-ink-950 disabled:opacity-60"
          >
            {submit.isPending ? 'Submitting…' : 'Submit evidence'}
          </button>
        </form>
      </div>
    </div>
  );
}
