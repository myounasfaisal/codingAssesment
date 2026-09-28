import { type FormEvent, useState } from "react";
import { PRIORITIES, TASK_STATUSES, type CreateTaskInput, type Priority, type Task, type TaskStatus } from "../../types/task";
import styles from "./TaskFormModal.module.css";

interface TaskFormModalProps {
  task?: Task | null;
  onClose: () => void;
  onSubmit: (data: CreateTaskInput) => Promise<void>;
}

function toDateInputValue(dueDate: string | null | undefined): string {
  if (!dueDate) return "";
  return dueDate.slice(0, 10);
}

export function TaskFormModal({ task, onClose, onSubmit }: TaskFormModalProps) {
  const isEdit = Boolean(task);

  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "TODO");
  const [priority, setPriority] = useState<Priority>(task?.priority ?? "MEDIUM");
  const [tags, setTags] = useState((task?.tags ?? []).join(", "));
  const [dueDate, setDueDate] = useState(toDateInputValue(task?.dueDate));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    setIsSubmitting(true);
    try {
      const data: CreateTaskInput = {
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      };
      await onSubmit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save task");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <form className={styles.card} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2>{isEdit ? "Edit task" : "Create task"}</h2>

        <label className={styles.field}>
          <span>Title</span>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus required />
        </label>

        <label className={styles.field}>
          <span>Description</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </label>

        <div className={styles.row}>
          <label className={styles.field}>
            <span>Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
              {TASK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span>Priority</span>
            <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className={styles.row}>
          <label className={styles.field}>
            <span>Tags (comma-separated)</span>
            <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="bug, backend" />
          </label>

          <label className={styles.field}>
            <span>Due date</span>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </label>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <button type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className={styles.primary} disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : isEdit ? "Save changes" : "Create task"}
          </button>
        </div>
      </form>
    </div>
  );
}
