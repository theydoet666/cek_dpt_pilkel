import { AuthProvider } from './hooks/useAuth';
import { AppRouter } from './routes/AppRouter';
import { Toaster } from 'react-hot-toast';

export function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#0f172a',
            color: '#fff',
            borderRadius: '12px',
            fontSize: '14px',
          },
        }}
      />
      <AppRouter />
    </AuthProvider>
  );
}

export default App;
