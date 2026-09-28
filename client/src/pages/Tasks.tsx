import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import * as taskService from "../services/task.service";
import { BulkActionBar } from "../components/tasks/BulkActionBar";
import { TaskFilterBar, type TaskFilters } from "../components/tasks/TaskFilterBar";
import { TaskFormModal } from "../components/tasks/TaskFormModal";
import { TaskTable } from "../components/tasks/TaskTable";
import type { CreateTaskInput, Priority, Task, TaskStatus } from "../types/task";
import styles from "./Tasks.module.css";

function getErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "response" in err) {
    const response = (err as { response?: { data?: { error?: { message?: string } } } }).response;
    if (response?.data?.error?.message) return response.data.error.message;
  }
  return err instanceof Error ? err.message : "Something went wrong";
}

export function Tasks() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const filters: TaskFilters = useMemo(
    () => ({
      status: (searchParams.get("status") as TaskStatus | null) ?? "",
      priority: (searchParams.get("priority") as Priority | null) ?? "",
      tags: searchParams.get("tags") ?? "",
      q: searchParams.get("q") ?? "",
    }),
    [searchParams]
  );

  const [tasks, setTasks] = useState<Task[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [formTask, setFormTask] = useState<Task | "new" | null>(null);

  const canBulk = user?.role !== "USER";
  const showOwner = user?.role !== "USER";

  const loadPage = useCallback(
    async (cursor: string | undefined, append: boolean) => {
      if (append) setIsLoadingMore(true);
      else setIsLoading(true);
      setError(null);
      try {
        const result = await taskService.listTasks({
          status: filters.status || undefined,
          priority: filters.priority || undefined,
          tags: filters.tags || undefined,
          q: filters.q || undefined,
          cursor,
        });
        setTasks((prev) => (append ? [...prev, ...result.items] : result.items));
        setNextCursor(result.nextCursor);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [filters.status, filters.priority, filters.tags, filters.q]
  );

  useEffect(() => {
    setSelectedIds(new Set());
    loadPage(undefined, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.priority, filters.tags, filters.q]);

  const handleFilterChange = (patch: Partial<TaskFilters>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    setSearchParams(next);
  };

  const handleLoadMore = () => {
    if (nextCursor) loadPage(nextCursor, true);
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    setSelectedIds((prev) => {
      const allSelected = tasks.length > 0 && tasks.every((t) => prev.has(t.id));
      if (allSelected) return new Set();
      return new Set(tasks.map((t) => t.id));
    });
  };

  const handleCreate = async (data: CreateTaskInput) => {
    const created = await taskService.createTask(data);
    setTasks((prev) => [created, ...prev]);
    setFormTask(null);
  };

  const handleUpdate = async (id: string, data: CreateTaskInput) => {
    const updated = await taskService.updateTask(id, data);
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    setFormTask(null);
  };

  const handleDelete = async (task: Task) => {
    if (!window.confirm(`Delete task "${task.title}"?`)) return;
    try {
      await taskService.deleteTask(task.id);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleBulkApply = async (set: { status?: TaskStatus; priority?: Priority }) => {
    try {
      const ids = Array.from(selectedIds);
      const result = await taskService.bulkUpdateTasks(ids, set);
      setTasks((prev) =>
        prev.map((t) =>
          result.updatedIds.includes(t.id)
            ? { ...t, ...(set.status && { status: set.status }), ...(set.priority && { priority: set.priority }) }
            : t
        )
      );
      setSelectedIds(new Set());
      if (result.skippedIds.length > 0) {
        setError(`${result.skippedIds.length} task(s) were skipped (out of your scope).`);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>TaskHub Pro</h1>
        <div className={styles.headerRight}>
          <span>{user?.email}</span>
          {user?.role === "ADMIN" && <Link to="/admin/users">Manage users</Link>}
          <button onClick={handleLogout}>Log out</button>
        </div>
      </header>

      <TaskFilterBar filters={filters} onChange={handleFilterChange} />

      <div className={styles.toolbar}>
        <button className={styles.primary} onClick={() => setFormTask("new")}>
          + Create task
        </button>
      </div>

      {canBulk && selectedIds.size > 0 && (
        <BulkActionBar
          selectedCount={selectedIds.size}
          onApply={handleBulkApply}
          onClear={() => setSelectedIds(new Set())}
        />
      )}

      {error && <div className={styles.errorBanner}>{error}</div>}

      {isLoading ? (
        <p>Loading…</p>
      ) : (
        <>
          <TaskTable
            tasks={tasks}
            showOwner={showOwner}
            showSelection={canBulk}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onToggleSelectAll={handleToggleSelectAll}
            onEdit={setFormTask}
            onDelete={handleDelete}
          />

          {nextCursor && (
            <div className={styles.loadMore}>
              <button onClick={handleLoadMore} disabled={isLoadingMore}>
                {isLoadingMore ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </>
      )}

      {formTask && (
        <TaskFormModal
          task={formTask === "new" ? null : formTask}
          onClose={() => setFormTask(null)}
          onSubmit={(data) => (formTask === "new" ? handleCreate(data) : handleUpdate(formTask.id, data))}
        />
      )}
    </div>
  );
}
