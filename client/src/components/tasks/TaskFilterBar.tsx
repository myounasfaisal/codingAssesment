import { useEffect, useRef, useState } from "react";
import { PRIORITIES, TASK_STATUSES, type Priority, type TaskStatus } from "../../types/task";
import styles from "./TaskFilterBar.module.css";

export interface TaskFilters {
  status: TaskStatus | "";
  priority: Priority | "";
  tags: string;
  q: string;
}

interface TaskFilterBarProps {
  filters: TaskFilters;
  onChange: (patch: Partial<TaskFilters>) => void;
}

const DEBOUNCE_MS = 300;

export function TaskFilterBar({ filters, onChange }: TaskFilterBarProps) {
  const [qInput, setQInput] = useState(filters.q);
  const [tagsInput, setTagsInput] = useState(filters.tags);
  const qTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tagsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setQInput(filters.q), [filters.q]);
  useEffect(() => setTagsInput(filters.tags), [filters.tags]);

  const handleQChange = (value: string) => {
    setQInput(value);
    if (qTimer.current) clearTimeout(qTimer.current);
    qTimer.current = setTimeout(() => onChange({ q: value }), DEBOUNCE_MS);
  };

  const handleTagsChange = (value: string) => {
    setTagsInput(value);
    if (tagsTimer.current) clearTimeout(tagsTimer.current);
    tagsTimer.current = setTimeout(() => onChange({ tags: value }), DEBOUNCE_MS);
  };

  return (
    <div className={styles.bar}>
      <label className={styles.field}>
        <span>Status</span>
        <select
          value={filters.status}
          onChange={(e) => onChange({ status: e.target.value as TaskStatus | "" })}
        >
          <option value="">All</option>
          {TASK_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span>Priority</span>
        <select
          value={filters.priority}
          onChange={(e) => onChange({ priority: e.target.value as Priority | "" })}
        >
          <option value="">All</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span>Tags</span>
        <input
          type="text"
          placeholder="comma,separated"
          value={tagsInput}
          onChange={(e) => handleTagsChange(e.target.value)}
        />
      </label>

      <label className={styles.field}>
        <span>Search</span>
        <input
          type="text"
          placeholder="Search title…"
          value={qInput}
          onChange={(e) => handleQChange(e.target.value)}
        />
      </label>
    </div>
  );
}
