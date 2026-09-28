import type { Task } from "../../types/task";
import styles from "./TaskTable.module.css";

interface TaskTableProps {
  tasks: Task[];
  showOwner: boolean;
  showSelection: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

function isOverdue(task: Task): boolean {
  return Boolean(task.dueDate) && new Date(task.dueDate as string) < new Date() && task.status !== "DONE";
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

export function TaskTable({
  tasks,
  showOwner,
  showSelection,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onEdit,
  onDelete,
}: TaskTableProps) {
  const allSelected = tasks.length > 0 && tasks.every((t) => selectedIds.has(t.id));

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          {showSelection && (
            <th>
              <input type="checkbox" checked={allSelected} onChange={onToggleSelectAll} aria-label="Select all on page" />
            </th>
          )}
          <th>Title</th>
          <th>Status</th>
          <th>Priority</th>
          <th>Tags</th>
          <th>Due date</th>
          {showOwner && <th>Owner</th>}
          <th></th>
        </tr>
      </thead>
      <tbody>
        {tasks.map((task) => {
          const overdue = isOverdue(task);
          return (
            <tr key={task.id} className={overdue ? styles.overdue : undefined}>
              {showSelection && (
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(task.id)}
                    onChange={() => onToggleSelect(task.id)}
                    aria-label={`Select ${task.title}`}
                  />
                </td>
              )}
              <td>
                <div className={styles.title}>{task.title}</div>
                {task.description && <div className={styles.description}>{task.description}</div>}
              </td>
              <td>{task.status}</td>
              <td>{task.priority}</td>
              <td>{task.tags.length > 0 ? task.tags.join(", ") : "—"}</td>
              <td>{formatDate(task.dueDate)}</td>
              {showOwner && <td className={styles.owner} title={task.ownerId}>{task.ownerId.slice(0, 8)}…</td>}
              <td className={styles.rowActions}>
                <button onClick={() => onEdit(task)}>Edit</button>
                <button onClick={() => onDelete(task)}>Delete</button>
              </td>
            </tr>
          );
        })}
        {tasks.length === 0 && (
          <tr>
            <td colSpan={showOwner ? (showSelection ? 8 : 7) : showSelection ? 7 : 6} className={styles.empty}>
              No tasks match the current filters.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
