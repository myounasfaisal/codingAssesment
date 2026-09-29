import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import * as userService from "../services/user.service";
import type { Role } from "../types/auth";
import type { OrgUser } from "../types/user";
import styles from "./AdminUsers.module.css";

const ROLES: Role[] = ["USER", "MANAGER", "ADMIN"];

function getErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "response" in err) {
    const response = (err as { response?: { data?: { error?: { message?: string } } } }).response;
    if (response?.data?.error?.message) return response.data.error.message;
  }
  return err instanceof Error ? err.message : "Something went wrong";
}

export function AdminUsers() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState<OrgUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await userService.listOrgUsers();
      setUsers(list);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleRoleChange = async (targetUser: OrgUser, newRole: Role) => {
    setSavingId(targetUser.id);
    setError(null);
    setMessage(null);
    try {
      const updated = await userService.updateUserRole(targetUser.id, newRole);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setMessage(`${updated.email} is now ${updated.role}.`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Manage users</h1>
        <div className={styles.headerRight}>
          <Link to="/tasks">Home</Link>
          <span>{user?.email}</span>
          <button onClick={handleLogout}>Log out</button>
        </div>
      </header>

      <p className={styles.hint}>
        Users in your organization only. Roles are scoped per-organization: you cannot view or change
        users from other organizations, and you cannot change your own role.
      </p>

      {error && <div className={styles.errorBanner}>{error}</div>}
      {message && <div className={styles.successBanner}>{message}</div>}

      {isLoading ? (
        <p>Loading…</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>Created</th>
              <th>Change role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isSelf = u.id === user?.id;
              return (
                <tr key={u.id}>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    {isSelf ? (
                      <span className={styles.selfNote}>(you)</span>
                    ) : (
                      <select
                        value={u.role}
                        disabled={savingId === u.id}
                        onChange={(e) => handleRoleChange(u, e.target.value as Role)}
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
