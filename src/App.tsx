import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ModuleAccessProvider } from './contexts/ModuleAccessContext';
import { AppLayout } from './components/AppLayout';
import { Login } from './pages/Login';
import { PasswordResetRequired } from './pages/PasswordResetRequired';

function AppContent() {
  const { user, loading, needsPasswordReset } = useAuth();
  const mustChangePassword = Boolean(user?.user_metadata?.must_change_password);
  const requiresReset = mustChangePassword || needsPasswordReset;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (requiresReset) {
    return <PasswordResetRequired />;
  }

  return <AppLayout />;
}

function App() {
  return (
    <AuthProvider>
      <ModuleAccessProvider>
        <AppContent />
      </ModuleAccessProvider>
    </AuthProvider>
  );
}

export default App;
