import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ModuleAccessProvider } from './contexts/ModuleAccessContext';
import { AppLayout } from './components/AppLayout';
import { Login } from './pages/Login';

function AppContent() {
  const { user, loading } = useAuth();

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
