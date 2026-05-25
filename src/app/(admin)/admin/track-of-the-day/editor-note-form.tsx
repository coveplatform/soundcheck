"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, Save, RotateCcw, CheckCircle2 } from "lucide-react";

type Props = {
  submissionId: string;
  initialNote: string;
  initialByline: string;
  generatedAt: Date | string | null;
  editedAt: Date | string | null;
};

export function EditorNoteForm({
  submissionId,
  initialNote,
  initialByline,
  generatedAt,
  editedAt,
}: Props) {
  const router = useRouter();
  const [note, setNote] = useState(initialNote);
  const [byline, setByline] = useState(initialByline);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [saved, setSaved] = useState(false);

  const isDirty = note !== initialNote || byline !== initialByline;

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/track-of-the-day", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId, editorNote: note, editorNoteByline: byline }),
      });
      if (res.ok) {
        setSaved(true);
        router.refresh();
        setTimeout(() => setSaved(false), 2500);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = async () => {
    if (!confirm("Regenerate the editor's note with AI? This will overwrite the current note.")) return;
    setRegenerating(true);
    try {
      const res = await fetch("/api/admin/track-of-the-day", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId, action: "regenerate" }),
      });
      const data = await res.json();
      if (data.editorNote) {
        setNote(data.editorNote);
        router.refresh();
      }
    } finally {
      setRegenerating(false);
    }
  };

  const stamp = editedAt
    ? `Edited ${new Date(editedAt).toLocaleString()}`
    : generatedAt
    ? `Auto-generated ${new Date(generatedAt).toLocaleString()}`
    : "Not yet generated";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-black">Editor&rsquo;s note</h3>
        <p className="text-[11px] text-neutral-400">{stamp}</p>
      </div>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={8}
        placeholder="AI-generated editor's note will appear here after the daily cron runs. You can edit freely."
        className="w-full px-4 py-3 text-sm leading-relaxed rounded-xl border-2 border-neutral-200 focus:border-purple-400 focus:outline-none resize-y font-serif"
        style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
      />

      <div className="flex items-center gap-3">
        <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
          Byline
        </label>
        <input
          type="text"
          value={byline}
          onChange={(e) => setByline(e.target.value)}
          placeholder="MixReflect"
          className="flex-1 px-3 py-1.5 text-sm rounded-lg border-2 border-neutral-200 focus:border-purple-400 focus:outline-none"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-2">
        <button
          onClick={handleSave}
          disabled={saving || !isDirty}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-black text-white text-xs font-bold hover:bg-neutral-800 disabled:opacity-40 transition-colors"
        >
          {saving ? (
            <><Loader2 className="h-3 w-3 animate-spin" /> Saving…</>
          ) : saved ? (
            <><CheckCircle2 className="h-3 w-3" /> Saved</>
          ) : (
            <><Save className="h-3 w-3" /> Save changes</>
          )}
        </button>

        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border-2 border-purple-200 bg-purple-50 text-purple-700 text-xs font-bold hover:bg-purple-100 disabled:opacity-40 transition-colors"
        >
          {regenerating ? (
            <><Loader2 className="h-3 w-3 animate-spin" /> Generating…</>
          ) : (
            <><Sparkles className="h-3 w-3" /> Regenerate with AI</>
          )}
        </button>

        {isDirty && (
          <button
            onClick={() => {
              setNote(initialNote);
              setByline(initialByline);
            }}
            className="inline-flex items-center gap-1.5 h-9 px-3 text-xs text-neutral-500 hover:text-black transition-colors"
          >
            <RotateCcw className="h-3 w-3" /> Discard
          </button>
        )}
      </div>
    </div>
  );
}
