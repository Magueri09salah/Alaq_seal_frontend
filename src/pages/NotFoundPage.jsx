import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/layout/Navbar';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full text-center">
          
          {/* 404 Illustration */}
          <div className="mb-6 sm:mb-8">
            <div className="relative inline-block">
              {/* Large 404 - smaller on mobile */}
              <h1 className="font-display text-[8rem] sm:text-[12rem] lg:text-[16rem] font-black text-primary-100 leading-none select-none">
                404
              </h1>
              
              {/* Icon overlay - smaller on mobile */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-20 h-20 sm:w-28 sm:h-28 lg:w-32 lg:h-32 bg-primary-500 rounded-2xl flex items-center justify-center shadow-xl">
                  <svg className="w-10 h-10 sm:w-14 sm:h-14 lg:w-16 lg:h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Message */}
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-900 mb-3 sm:mb-4">
            Page introuvable
          </h2>
          <p className="text-neutral-600 font-body text-base sm:text-lg mb-6 sm:mb-8 max-w-md mx-auto">
            Oups ! La page que vous recherchez n'existe pas ou a été déplacée.
          </p>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <button
              onClick={() => navigate(-1)}
              className="w-full sm:w-auto inline-flex items-center justify-center px-5 sm:px-6 py-2.5 sm:py-3 border-2 border-neutral-300 text-neutral-700 hover:bg-neutral-100 font-heading font-semibold rounded-lg transition-all text-sm sm:text-base">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Retour
            </button>

            {user ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full sm:w-auto inline-flex items-center justify-center px-5 sm:px-6 py-2.5 sm:py-3 bg-primary-500 hover:bg-primary-600 text-white font-heading font-semibold rounded-lg transition-all shadow-sm hover:shadow-md text-sm sm:text-base">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Tableau de bord
              </button>
            ) : (
              <button
                onClick={() => navigate('/')}
                className="w-full sm:w-auto inline-flex items-center justify-center px-5 sm:px-6 py-2.5 sm:py-3 bg-primary-500 hover:bg-primary-600 text-white font-heading font-semibold rounded-lg transition-all shadow-sm hover:shadow-md text-sm sm:text-base">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Accueil
              </button>
            )}
          </div>

          {/* Help links */}
          <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-neutral-200">
            <p className="text-xs sm:text-sm text-neutral-500 font-body mb-3 sm:mb-4">
              Vous cherchez quelque chose ?
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-sm">
              {user && (
                <>
                  <button
                    onClick={() => navigate('/new-devis')}
                    className="text-primary-600 hover:text-primary-700 font-heading font-medium transition-colors">
                    Créer un devis
                  </button>
                  <span className="text-neutral-300">•</span>
                </>
              )}
              <button
                onClick={() => navigate('/')}
                className="text-primary-600 hover:text-primary-700 font-heading font-medium transition-colors">
                Page d'accueil
              </button>
              {!user && (
                <>
                  <span className="text-neutral-300">•</span>
                  <button
                    onClick={() => navigate('/login')}
                    className="text-primary-600 hover:text-primary-700 font-heading font-medium transition-colors">
                    Se connecter
                  </button>
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}