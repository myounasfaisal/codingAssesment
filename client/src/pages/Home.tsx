import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "./Home.module.css";

export function Home() {
  const { user, isLoading } = useAuth();

  if (!isLoading && user) {
    return <Navigate to="/tasks" replace />;
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1>TaskHub Pro</h1>
        <p className={styles.subtitle}>Organize your team's work, together.</p>
        <div className={styles.actions}>
          <Link to="/login" className={styles.secondary}>
            Log in
          </Link>
          <Link to="/register" className={styles.primary}>
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
