"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
} from "react";
import Link from "next/link";
import type { ResumeParseResult } from "@/lib/types";
import { PROCESSING_STAGES, runResumeProcessing } from "@/lib/resumeProcessing";

type Screen =
  | { step: "idle" }
  | { step: "processing"; fileName: string; fileSize: number; stageIndex: number }
  | { step: "done"; result: ResumeParseResult };

const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

function isAcceptedFile(file: File): boolean {
  if (ACCEPTED_MIME_TYPES.includes(file.type)) return true;
  return /\.(pdf|docx)$/i.test(file.name);
}

function formatSize(bytes: number): string {
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function stageStatus(stageIndex: number, current: number): "pending" | "active" | "done" {
  if (stageIndex < current) return "done";
  if (stageIndex === current) return "active";
  return "pending";
}

// current = -1 shows every stage as not-yet-started, used before a file is picked.
function StageList({ current }: { current: number }) {
  return (
    <ol className="flex flex-col gap-4">
      {PROCESSING_STAGES.map((stage, i) => {
        const status = stageStatus(i, current);
        return (
          <li key={stage.key} className="flex items-center gap-3">
            <span
              aria-hidden
              className={`h-[9px] w-[9px] shrink-0 rounded-full border ${
                status === "pending"
                  ? "border-edge bg-paper"
                  : status === "active"
                    ? "stage-active-dot border-ink bg-paper"
                    : "border-ink bg-ink"
              }`}
            />
            <span className={`text-sm ${status === "pending" ? "text-muted" : "text-ink"}`}>
              {stage.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function UploadPanel() {
  const [screen, setScreen] = useState<Screen>({ step: "idle" });
  const [isDragging, setIsDragging] = useState(false);
  const [rejected, setRejected] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef<(() => void) | null>(null);

  useEffect(() => () => cancelRef.current?.(), []);

  const startProcessing = useCallback((file: File) => {
    if (!isAcceptedFile(file)) {
      setRejected(true);
      return;
    }
    setRejected(false);
    cancelRef.current?.();
    setScreen({ step: "processing", fileName: file.name, fileSize: file.size, stageIndex: 0 });

    cancelRef.current = runResumeProcessing(file, {
      onStage: (stageIndex) => {
        setScreen((prev) => (prev.step === "processing" ? { ...prev, stageIndex } : prev));
      },
      onComplete: (result) => {
        setScreen({ step: "done", result });
      },
      onError: () => {
        setScreen({ step: "idle" });
        setRejected(true);
      },
    });
  }, []);

  const openPicker = () => inputRef.current?.click();

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPicker();
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) startProcessing(file);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) startProcessing(file);
    event.target.value = "";
  };

  if (screen.step === "processing") {
    return (
      <div className="rounded-[3px] border border-edge bg-surface px-6 py-7">
        <p className="mb-1 truncate text-sm font-medium">{screen.fileName}</p>
        <p className="mb-6 font-mono text-[11.5px] text-muted">{formatSize(screen.fileSize)}</p>
        <StageList current={screen.stageIndex} />
      </div>
    );
  }

  if (screen.step === "done") {
    return (
      <div className="rounded-[3px] border border-edge border-l-2 border-l-signal bg-surface px-6 py-7">
        <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-3">
          {screen.result.categories.map((category) => (
            <div key={category.key}>
              <dt className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted">
                {category.label}
              </dt>
              <dd className="flex flex-wrap gap-1.5">
                {category.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-[2px] border border-edge px-1.5 py-0.5 text-[12px]"
                  >
                    {skill}
                  </span>
                ))}
              </dd>
            </div>
          ))}
        </div>

        <Link
          href="/"
          className="mt-6 inline-block rounded-[2px] border border-signal bg-signal px-4 py-2 text-[13px] font-semibold text-surface transition-colors hover:bg-transparent hover:text-signal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          See your matches
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-[3px] border border-edge bg-surface px-6 py-7">
      <h2 className="mb-4 text-sm font-semibold">Upload your CV</h2>

      <div
        role="button"
        tabIndex={0}
        aria-label="Upload your CV. Drop a PDF or DOCX file, or click to choose one."
        onClick={openPicker}
        onKeyDown={handleKeyDown}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`flex cursor-pointer items-center justify-center rounded-[3px] border border-dashed bg-paper px-4 py-8 text-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
          isDragging ? "border-ink" : "border-edge hover:border-muted"
        }`}
      >
        <p className="text-sm">Drop your CV here, or click to choose a PDF or DOCX file.</p>
      </div>

      {rejected && (
        <p className="mt-3 text-[13px] text-muted">Only PDF and DOCX files are accepted.</p>
      )}

      <div className="mt-6">
        <StageList current={-1} />
      </div>

      <input
        ref={inputRef}
        type="file"
        tabIndex={-1}
        aria-hidden
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={handleChange}
        className="sr-only"
      />
    </div>
  );
}
