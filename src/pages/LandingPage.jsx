import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-50 via-white to-accent-50 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-16 py-12 sm:py-16 lg:py-24">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-primary-100 rounded-full text-primary-700 text-sm font-semibold mb-6">
              <span className="w-2 h-2 bg-primary-500 rounded-full mr-2 animate-pulse"></span>
              Plateforme self-service professionnelle
            </div>

            {/* Main Heading */}
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-neutral-900 mb-6 leading-tight">
              Créez votre devis
              <br />
              <span className="text-primary-500">en quelques clics</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-neutral-600 mb-8 max-w-2xl mx-auto font-body leading-relaxed">
              Estimez vos projets d'étanchéité et façades instantanément. 
              Téléchargez un devis professionnel sans attendre.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link 
                to="/register" 
                className="w-full sm:w-auto bg-primary-500 hover:bg-primary-600 text-white px-8 py-4 rounded-lg font-heading font-bold text-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Créer mon compte gratuit
              </Link>
              <Link 
                to="/login" 
                className="w-full sm:w-auto bg-white hover:bg-neutral-50 text-primary-500 px-8 py-4 rounded-lg font-heading font-semibold text-lg border-2 border-primary-500 transition-all"
              >
                Se connecter
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-6 text-sm text-neutral-500">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Gratuit</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Sans engagement</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Instantané</span>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 -z-10 w-64 h-64 bg-primary-200 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 left-0 -z-10 w-96 h-96 bg-accent-200 rounded-full blur-3xl opacity-20"></div>
      </section>

      {/* Features Grid */}
      <section className="py-12 sm:py-16 lg:py-20 bg-neutral-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-16">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
            {[
              { 
                icon: '⚡', 
                title: 'Prix instantanés', 
                desc: 'Calcul en temps réel pendant la configuration'
              },
              { 
                icon: '📄', 
                title: 'PDF professionnel', 
                desc: 'Téléchargez votre devis immédiatement'
              },
              { 
                icon: '🕐', 
                title: 'Disponible 24/7', 
                desc: 'Créez vos devis à tout moment'
              },
              { 
                icon: '💰', 
                title: 'Tarifs transparents', 
                desc: 'Prix clairs et détaillés par service'
              },
              { 
                icon: '🎯', 
                title: 'Simple et rapide', 
                desc: 'Devis en 3 minutes chrono'
              },
              { 
                icon: '✉️', 
                title: 'Envoi direct', 
                desc: 'Soumettez à Alaq Seal en un clic'
              },
            ].map((feature, index) => (
              <div 
                key={index} 
                className="bg-white p-6 lg:p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-neutral-100"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="font-heading font-bold text-lg sm:text-xl mb-2 text-neutral-900">
                  {feature.title}
                </h3>
                <p className="text-neutral-600 text-sm sm:text-base leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-16">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-neutral-900 mb-4">
              Nos Services
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Des solutions complètes pour tous vos projets d'étanchéité et façades
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              { name: 'Résine de sol', price: '250', icon: '🏗️', color: 'primary' },
              { name: 'Façades', price: '150', icon: '🏢', color: 'accent' },
              { name: 'Étanchéité murs', price: '200', icon: '🧱', color: 'primary' },
              { name: 'Étanchéité sols', price: '180', icon: '⬜', color: 'accent' },
              { name: 'Coffrage modulaire', price: '80', icon: '📦', color: 'primary' },
            ].map((service, index) => (
              <div 
                key={index} 
                className="group bg-white p-6 lg:p-8 rounded-2xl border-2 border-neutral-100 hover:border-primary-300 transition-all hover:shadow-lg"
              >
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
                  {service.icon}
                </div>
                <h3 className="font-heading font-bold text-xl mb-3 text-neutral-900">
                  {service.name}
                </h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-neutral-500 text-sm">À partir de</span>
                  <span className="font-display text-2xl text-primary-500">
                    {service.price}
                  </span>
                  <span className="text-neutral-600 text-sm">MAD/m²</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-primary-500 to-primary-600 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-16">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-lg text-primary-100 max-w-2xl mx-auto">
              Un processus simple en 3 étapes
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12 max-w-5xl mx-auto">
            {[
              { 
                num: '01', 
                title: 'Sélectionner', 
                desc: 'Choisissez vos services parmi notre catalogue'
              },
              { 
                num: '02', 
                title: 'Configurer', 
                desc: 'Ajustez surface, options et finitions'
              },
              { 
                num: '03', 
                title: 'Télécharger', 
                desc: 'Obtenez votre devis PDF professionnel'
              },
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-6 font-display text-2xl">
                  {step.num}
                </div>
                <h3 className="font-heading font-bold text-xl sm:text-2xl mb-3">
                  {step.title}
                </h3>
                <p className="text-primary-100 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-16">
          <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-neutral-50 to-primary-50 rounded-3xl p-8 lg:p-12 border-2 border-primary-100">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-neutral-900 mb-6">
              Prêt à commencer ?
            </h2>
            <p className="text-lg sm:text-xl text-neutral-600 mb-8 max-w-2xl mx-auto">
              Créez votre premier devis gratuitement en moins de 3 minutes
            </p>
            <Link 
              to="/register" 
              className="inline-block bg-primary-500 hover:bg-primary-600 text-white px-10 py-4 rounded-lg font-heading font-bold text-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Créer mon compte gratuit
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 text-white py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-16">
          <div className="text-center">
            <img 
              src="/alaq_seal_logo.png" 
              alt="Alaq Seal" 
              className="h-12 w-auto object-contain mx-auto mb-6 brightness-0 invert opacity-80"
            />
            <p className="text-neutral-400 mb-6 text-sm sm:text-base">
              Solutions d'étanchéité et façades durables
            </p>
            <div className="flex justify-center gap-6 mb-6">
              <a href="tel:+212767915425" className="text-neutral-400 hover:text-white transition-colors text-sm">
                +212 767 915 425
              </a>
              <span className="text-neutral-600">•</span>
              <a href="https://alaqseal.com" target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-white transition-colors text-sm">
                alaqseal.com
              </a>
            </div>
            <p className="text-neutral-500 text-sm">
              © 2026 Alaq Seal. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;