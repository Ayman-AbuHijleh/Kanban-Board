import { lazy, Suspense } from "react";
import {
  Route,
  createBrowserRouter,
  createRoutesFromElements,
  Navigate,
} from "react-router-dom";
import { isAuthenticated } from "../services/authService";

const Login = lazy(() => import("../pages/Login"));
const Signup = lazy(() => import("../pages/Signup"));
const Dashboard = lazy(() => import("../pages/Dashboard"));
const BoardMembers = lazy(() => import("../pages/BoardMembers"));
const Board = lazy(() => import("../pages/Board"));

const LoadingFallback = () => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      fontSize: "18px",
      color: "#5e6c84",
    }}
  >
    Loading...
  </div>
);

const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const PublicRoute = ({ children }: { children: React.ReactElement }) => {
  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route
        path="/login"
        element={
          <Suspense fallback={<LoadingFallback />}>
            <PublicRoute>
              <Login />
            </PublicRoute>
          </Suspense>
        }
      />
      <Route
        path="/signup"
        element={
          <Suspense fallback={<LoadingFallback />}>
            <PublicRoute>
              <Signup />
            </PublicRoute>
          </Suspense>
        }
      />
      <Route
        path="/dashboard"
        element={
          <Suspense fallback={<LoadingFallback />}>
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          </Suspense>
        }
      />
      <Route
        path="/boards/:boardId/members"
        element={
          <Suspense fallback={<LoadingFallback />}>
            <ProtectedRoute>
              <BoardMembers />
            </ProtectedRoute>
          </Suspense>
        }
      />
      <Route
        path="/boards/:boardId"
        element={
          <Suspense fallback={<LoadingFallback />}>
            <ProtectedRoute>
              <Board />
            </ProtectedRoute>
          </Suspense>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </>
  )
);

export default router;
