import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import GoogleButton from '../components/auth/Googlebutton';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.email || !formData.phone || !formData.password || !formData.password_confirmation) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    if (formData.password !== formData.password_confirmation) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    try {
      setLoading(true);
      await register(formData);
      toast.success('Compte créé avec succès! 🎉');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error('Register error:', error);
      const errorMessage = error.response?.data?.message || 'Erreur lors de la création du compte';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      {/* Fixed background image */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat -z-10"
        style={{ backgroundImage: 'url(/background.jpeg)' }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/">
            <div className="inline-flex items-center justify-center mb-4">
              <img 
                src="/alaq_seal_logo.png" 
                alt="Alaq Seal" 
                className="h-12 w-auto object-contain"
              />
            </div>
          </Link>
          <h1 className="font-display text-3xl font-bold text-neutral-900 mb-2">Créer un compte</h1>
          <p className="text-neutral-600 font-body">Commencez à créer vos devis gratuitement</p>
        </div>

        {/* Register Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-neutral-200">
          {/* Google Button */}
          <GoogleButton />

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-neutral-500 font-body">OU</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-heading font-medium text-neutral-700 mb-2">
                Nom complet
              </label>
              <input
                id="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg font-body focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="Jean Dupont"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-heading font-medium text-neutral-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg font-body focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="votre@email.com"
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-heading font-medium text-neutral-700 mb-2">
                Téléphone
              </label>
              <input
                id="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg font-body focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="06 12 34 56 78"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-heading font-medium text-neutral-700 mb-2">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg font-body focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="••••••••"
              />
              <p className="text-xs text-neutral-500 font-body mt-1">Minimum 6 caractères</p>
            </div>

            {/* Password Confirmation */}
            <div>
              <label htmlFor="password_confirmation" className="block text-sm font-heading font-medium text-neutral-700 mb-2">
                Confirmer le mot de passe
              </label>
              <input
                id="password_confirmation"
                type="password"
                required
                value={formData.password_confirmation}
                onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg font-body focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white font-heading font-semibold py-3 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Création en cours...
                </span>
              ) : (
                'Créer mon compte'
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-600 font-body">
              Vous avez déjà un compte?{' '}
              <Link to="/login" className="text-primary-500 hover:text-primary-600 font-heading font-semibold">
                Se connecter
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link to="/" className="text-sm text-neutral-600 hover:text-neutral-900 font-body">
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}