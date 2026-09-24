"use client";

import { useEffect, useRef, useState } from "react";
import { ImageUp } from "lucide-react";

// Reads a WhatsApp or email screenshot in the browser with tesseract.js and hands the text back. Nothing is uploaded.
type Worker = { recognize: (image: File | Blob) => Promise<{ data: { text: string } }>; terminate: () => Promise<unknown> };
let workerPromise: Promise<Worker> | null = null;
let onProgress: (p: number) => void = () => {};

function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = import("tesseract.js").then(async (mod) => {
      const w = await mod.createWorker("eng", 1, {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === "recognizing text") onProgress(m.progress);
        },
      });
      return w as unknown as Worker;
    });
    workerPromise.catch(() => {
      workerPromise = null;
    });
  }
  return workerPromise;
}

// OCR reads "0" as "O" and "1" as "l" inside phone numbers; fix the obvious cases so the check can dial them.
export function cleanOcr(text: string): string {
  return text
    .replace(/[+\d][\dOoIl \-()]{8,}/g, (run) =>
      run.replace(/\D/g, "").length >= 7 ? run.replace(/\S+/g, (tok) => (/\d/.test(tok) ? tok.replace(/[Oo]/g, "0").replace(/[Il]/g, "1") : tok)) : run,
    )
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function ScreenshotInput({ onText, disabled, dropTargetId }: { onText: (text: string) => void; disabled?: boolean; dropTargetId?: string }) {
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function read(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("That is not an image. Drop a screenshot, PNG or JPG.");
      return;
    }
    setError(null);
    setProgress(0);
    try {
      onProgress = setProgress;
      const worker = await getWorker();
      const { data } = await worker.recognize(file);
      const text = cleanOcr(data.text);
      if (text.length < 8) {
        setError("Could not read any text in that image. Try a sharper screenshot or paste the text.");
      } else {
        onText(text);
      }
    } catch {
      setError("The reader could not load. Paste the text instead.");
    } finally {
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  // A screenshot pasted anywhere with Ctrl+V, or dropped on the textarea, goes straight to the reader.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const item = [...(e.clipboardData?.items ?? [])].find((i) => i.type.startsWith("image/"));
      const file = item?.getAsFile();
      if (file && !disabled) {
        e.preventDefault();
        void read(file);
      }
    };
    const onDrop = (e: DragEvent) => {
      const file = e.dataTransfer?.files?.[0];
      if (file && file.type.startsWith("image/") && !disabled) {
        e.preventDefault();
        void read(file);
      }
    };
    const onDragOver = (e: DragEvent) => e.preventDefault();
    const target = dropTargetId ? document.getElementById(dropTargetId) : null;
    document.addEventListener("paste", onPaste);
    target?.addEventListener("drop", onDrop);
    target?.addEventListener("dragover", onDragOver);
    return () => {
      document.removeEventListener("paste", onPaste);
      target?.removeEventListener("drop", onDrop);
      target?.removeEventListener("dragover", onDragOver);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, dropTargetId]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input ref={inputRef} type="file" accept="image/*" className="sr-only" id="screenshot" onChange={(e) => e.target.files?.[0] && read(e.target.files[0])} disabled={disabled || progress !== null} />
      <label htmlFor="screenshot" className={`inline-flex items-center gap-1.5 rounded-full border border-rule px-3 py-1.5 text-xs font-semibold text-toner hover:border-toner ${disabled || progress !== null ? "pointer-events-none opacity-60" : ""}`}>
        <ImageUp className="h-3.5 w-3.5" aria-hidden />
        {progress === null ? "Upload a screenshot" : `Reading ${Math.round(progress * 100)}%`}
      </label>
      <span className="text-xs text-toner-2">or paste one with Ctrl+V. Read on your phone, never uploaded.</span>
      {error && <span role="alert" className="text-xs text-red">{error}</span>}
    </div>
  );
}
