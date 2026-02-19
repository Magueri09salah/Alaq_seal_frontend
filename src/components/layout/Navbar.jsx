import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Déconnexion réussie');
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="bg-white border-b border-neutral-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-16">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-3">
            <img 
              src="/alaq_seal_logo.png" 
              alt="Alaq Seal" 
              className="h-12 w-auto object-contain"
            />
          </Link>

          {/* Right section */}
          <div className="flex items-center gap-4">
            {/* User info */}
            {user && (
              <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-neutral-50 rounded-lg">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-heading font-semibold text-primary-600">
                    {user.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="font-body text-sm text-neutral-700">{user.name}</span>
              </div>
            )}

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-all font-body text-sm font-medium"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}