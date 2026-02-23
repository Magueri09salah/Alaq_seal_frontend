import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function GoogleCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUserFromGoogle } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const userStr = searchParams.get('user');
    const error = searchParams.get('error');

    if (error) {
      toast.error('Échec de la connexion avec Google');
      navigate('/login', { replace: true });
      return;
    }

    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        
        // Save to localStorage
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_user', JSON.stringify(user));
        
        // Update context
        setUserFromGoogle(user);
        
        toast.success('Connexion réussie avec Google! 🎉');
        window.location.href = '/dashboard';
      } catch (error) {
        console.error('Google auth error:', error);
        toast.error('Erreur lors de la connexion');
        navigate('/login', { replace: true });
      }
    } else {
      toast.error('Données d\'authentification manquantes');
      navigate('/login', { replace: true });
    }
  }, [searchParams, navigate, setUserFromGoogle]);

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-500 mx-auto mb-4"></div>
        <p className="text-neutral-600 font-body">Connexion en cours...</p>
      </div>
    </div>
  );
}