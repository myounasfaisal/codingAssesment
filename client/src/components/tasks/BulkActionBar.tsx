import { useState } from "react";
import { PRIORITIES, TASK_STATUSES, type Priority, type TaskStatus } from "../../types/task";
import styles from "./BulkActionBar.module.css";

interface BulkActionBarProps {
  selectedCount: number;
  onApply: (set: { status?: TaskStatus; priority?: Priority }) => Promise<void>;
  onClear: () => void;
}

export function BulkActionBar({ selectedCount, onApply, onClear }: BulkActionBarProps) {
  const [status, setStatus] = useState<TaskStatus | "">("");
  const [priority, setPriority] = useState<Priority | "">("");
  const [isApplying, setIsApplying] = useState(false);

  const canApply = (status !== "" || priority !== "") && !isApplying;

  const handleApply = async () => {
    setIsApplying(true);
    try {
      await onApply({
        status: status || undefined,
        priority: priority || undefined,
      });
      setStatus("");
      setPriority("");
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className={styles.bar}>
      <span>{selectedCount} selected</span>

      <label>
        <span>Set status</span>
        <select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus | "")}>
          <option value="">—</option>
          {TASK_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>Set priority</span>
        <select value={priority} onChange={(e) => setPriority(e.target.value as Priority | "")}>
          <option value="">—</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </label>

      <button onClick={handleApply} disabled={!canApply}>
        {isApplying ? "Applying…" : "Apply"}
      </button>
      <button onClick={onClear} disabled={isApplying}>
        Clear selection
      </button>
    </div>
  );
}
