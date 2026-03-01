import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import Layout from "./components/Layout";
import { ClassProvider } from "./context/ClassContext";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import DashboardPage from "./pages/DashboardPage";
import ImportPage from "./pages/ImportPage";
import LoginPage from "./pages/LoginPage";
import ReportsPage from "./pages/ReportsPage";
import StudentDetailPage from "./pages/StudentDetailPage";
import StudentsPage from "./pages/StudentsPage";
import SubjectDetailPage from "./pages/SubjectDetailPage";
import SubjectsPage from "./pages/SubjectsPage";

// Root route with auth guard
function RootComponent() {
  const { identity, isInitializing } = useInternetIdentity();

  if (isInitializing) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          <p className="font-body text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!identity) {
    return <LoginPage />;
  }

  return (
    <ClassProvider>
      <Outlet />
      <Toaster richColors position="top-right" />
    </ClassProvider>
  );
}

const rootRoute = createRootRoute({ component: RootComponent });

const layoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "layout",
  component: Layout,
});

const indexRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/",
  component: DashboardPage,
});

const studentsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/students",
  component: StudentsPage,
});

const studentDetailRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/students/$id",
  component: StudentDetailPage,
});

const subjectsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/subjects",
  component: SubjectsPage,
});

const subjectDetailRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/subjects/$id",
  component: SubjectDetailPage,
});

const importRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/import",
  component: ImportPage,
});

const reportsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/reports",
  component: ReportsPage,
});

const routeTree = rootRoute.addChildren([
  layoutRoute.addChildren([
    indexRoute,
    studentsRoute,
    studentDetailRoute,
    subjectsRoute,
    subjectDetailRoute,
    importRoute,
    reportsRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
