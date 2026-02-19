import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { estimatorAPI } from '../services/api';
import toast from 'react-hot-toast';
import Navbar from '../components/layout/Navbar';

// ─── Constants ───────────────────────────────────────────────────────────────
const SERVICES_WITH_SUBTYPES = ['facade', 'etancheite'];

const SUBTYPES = {
  facade: [
    { key: 'graphique', label: 'Graphique',  description: 'Motifs et designs contemporains' },
    { key: 'minerale',  label: 'Minérale',   description: 'Pierres, granits et ardoises naturelles' },
    { key: 'organique', label: 'Organique',  description: 'Textures naturelles et matières vivantes' },
    { key: 'urbaine',   label: 'Urbaine',    description: 'Style contemporain pour milieux urbains' },
  ],
  etancheite: [
    { key: 'mur', label: 'Mur', description: "Cuvelage, SEL mur salle d'eau, murs enterrés" },
    { key: 'sol', label: 'Sol', description: "SEL sol salle d'eau, sous carrelage" },
  ],
};

const CASE_ICONS = {
  check:   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
  warning: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />,
  water:   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />,
  layers:  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />,
  sun:     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />,
};

const SERVICE_ICON_PATHS = {
  facade:             "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  etancheite:         "M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z",
  resine_sol:         "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z",
  etancheite_toiture: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  coffrage:           "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
};

const SUBTYPE_ICON_PATHS = {
  graphique: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01",
  minerale:  "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7",
  organique: "M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z",
  urbaine:   "M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z",
  mur:       "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5",
  sol:       "M4 6h16M4 10h16M4 14h16M4 18h16",
};

const fmt = (p) => new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', minimumFractionDigits: 0 }).format(p);

const MATERIAL_TYPE_COLORS = {
  barbotine:  'bg-orange-100 text-orange-700',
  mortier:    'bg-stone-100  text-stone-700',
  primaire:   'bg-yellow-100 text-yellow-700',
  resine:     'bg-blue-100   text-blue-700',
  bande:      'bg-purple-100 text-purple-700',
  membrane:   'bg-indigo-100 text-indigo-700',
  isolation:  'bg-green-100  text-green-700',
  pare_vapeur:'bg-cyan-100   text-cyan-700',
  gravillon:  'bg-gray-100   text-gray-700',
  drain:      'bg-teal-100   text-teal-700',
  finition:   'bg-pink-100   text-pink-700',
  enduit:     'bg-amber-100  text-amber-700',
  nappe:      'bg-lime-100   text-lime-700',
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function EstimatorWizard() {
  const navigate = useNavigate();

  // UI state
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading]         = useState(false);

  // API data
  const [services, setServices]             = useState([]);
  const [products, setProducts]             = useState([]);
  const [pricingFactors, setPricingFactors] = useState({});

  // Selections
  const [selService, setSelService]   = useState(null);
  const [selSubtype, setSelSubtype]   = useState(null);
  const [selProduct, setSelProduct]   = useState(null);
  const [selCase, setSelCase]         = useState(null);
  const [calculation, setCalculation] = useState(null);

  // Dimensions form
  const [dims, setDims] = useState({ longueur: '', largeur: '', hauteur: '', nombre_murs: 4 });
  const [info, setInfo] = useState({ project_name: '', project_location: '', notes: '' });
  const [factors, setFactors] = useState({ height: 1.00, condition: 1.00, complexity: 1.00, region: 1.00 });

  // Derived
  const needsSubtype = selService ? SERVICES_WITH_SUBTYPES.includes(selService.code) : false;

  // Auto-calc surface display
  const isWall   = selProduct?.subcategory === 'mur' || selService?.code === 'facade' || selProduct?.code === 'cuvelage_interieur' || selProduct?.code === 'sel_mur_salle_eau' || selProduct?.code === 'mur_enterre_bitumineux';
  const surfaceCalc = isWall
    ? (parseFloat(dims.longueur) || 0) * (parseFloat(dims.hauteur) || 0) * (parseInt(dims.nombre_murs) || 4)
    : (parseFloat(dims.longueur) || 0) * (parseFloat(dims.largeur) || 0);

  // Steps config
  const buildSteps = () => {
    const base = [{ id: 1, label: 'Service' }];
    if (needsSubtype) base.push({ id: 2, label: selService?.code === 'facade' ? 'Collection' : 'Type' });
    base.push({ id: needsSubtype ? 3 : 2, label: 'Produit' });
    base.push({ id: needsSubtype ? 4 : 3, label: 'Application' });
    base.push({ id: needsSubtype ? 5 : 4, label: 'Détails' });
    base.push({ id: needsSubtype ? 6 : 5, label: 'Résumé' });
    return base;
  };
  const steps       = buildSteps();
  const uiIdx       = steps.findIndex(s => s.id === currentStep) + 1;
  const isProduct   = (currentStep === 2 && !needsSubtype) || (currentStep === 3 && needsSubtype);
  const isCases     = (currentStep === 3 && !needsSubtype) || (currentStep === 4 && needsSubtype);
  const isDetails   = (currentStep === 4 && !needsSubtype) || (currentStep === 5 && needsSubtype);
  const isSummary   = (currentStep === 5 && !needsSubtype) || (currentStep === 6 && needsSubtype);

  useEffect(() => { fetchServices(); fetchPricingFactors(); }, []);

  // Load products when step changes to product step
  useEffect(() => {
    if (isProduct && selService && (!needsSubtype || selSubtype)) {
      fetchProducts(selService.id, selSubtype?.key);
    }
  }, [currentStep]);

  const fetchServices = async () => {
    try { const r = await estimatorAPI.getServices(); setServices(r.data.data); }
    catch { toast.error('Erreur chargement services'); }
  };

  const fetchPricingFactors = async () => {
    try { const r = await estimatorAPI.getPricingFactors(); setPricingFactors(r.data.data); }
    catch {}
  };

  const fetchProducts = async (serviceId, subcategory = null) => {
    try {
      setLoading(true);
      const r = await estimatorAPI.getServiceProducts(serviceId, subcategory ? { subcategory } : {});
      setProducts(r.data.data);
    } catch { toast.error('Erreur chargement produits'); }
    finally { setLoading(false); }
  };

  // ── Navigation handlers ─────────────────────────────────────────────────────
  const canGoNext = () => {
    if (currentStep === 1) return !!selService;
    if (currentStep === 2 && needsSubtype) return !!selSubtype;
    if (isProduct) return !!selProduct;
    if (isCases) return !!selCase;
    if (isDetails) return false; // form has its own submit
    return false;
  };

  const handleNext = () => {
    if (!canGoNext()) {
      if (currentStep === 1) toast.error('Veuillez sélectionner un service');
      else if (currentStep === 2 && needsSubtype) toast.error('Veuillez sélectionner un type');
      else if (isProduct) toast.error('Veuillez sélectionner un produit');
      else if (isCases) toast.error('Veuillez sélectionner un cas d\'application');
      return;
    }
    setCurrentStep(c => c + 1);
  };

  const handlePrev = () => {
    setCurrentStep(c => Math.max(1, c - 1));
  };

  const handleCalculate = async (e) => {
    e.preventDefault();
    if (!dims.longueur || !dims.largeur) { toast.error('Renseignez les dimensions'); return; }
    try {
      setLoading(true);
      const r = await estimatorAPI.calculateDevis({
        product_id:      selProduct.id,
        product_case_id: selCase.id,
        longueur:    parseFloat(dims.longueur),
        largeur:     parseFloat(dims.largeur),
        hauteur:     parseFloat(dims.hauteur) || 0,
        nombre_murs: parseInt(dims.nombre_murs) || 4,
        factor_height:     factors.height,
        factor_condition:  factors.condition,
        factor_complexity: factors.complexity,
        factor_region:     factors.region,
      });
      setCalculation(r.data.data);
      setCurrentStep(needsSubtype ? 6 : 5);
    } catch { toast.error('Erreur lors du calcul'); }
    finally { setLoading(false); }
  };

  const handleSave = async (status) => {
    try {
      setLoading(true);
      const r = await estimatorAPI.createDevis({
        service_id:      selService.id,
        product_id:      selProduct.id,
        product_case_id: selCase.id,
        subcategory:     selSubtype?.key || null,
        status,
        longueur:    parseFloat(dims.longueur),
        largeur:     parseFloat(dims.largeur),
        hauteur:     parseFloat(dims.hauteur) || 0,
        nombre_murs: parseInt(dims.nombre_murs) || 4,
        project_name:     info.project_name,
        project_location: info.project_location,
        notes:            info.notes,
        factor_height:     factors.height,
        factor_condition:  factors.condition,
        factor_complexity: factors.complexity,
        factor_region:     factors.region,
      });
      toast.success('Devis créé avec succès!');
      navigate(`/devis/${r.data.data.id}`);
    } catch { toast.error('Erreur lors de la création'); }
    finally { setLoading(false); }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-neutral-50">

        {/* Header */}
        <div>
          <div className="container mx-auto px-4 sm:px-6 lg:px-16 py-8">
            <h1 className="font-display text-3xl font-bold text-neutral-900">Créer un Devis</h1>
            <p className="text-neutral-600 mt-1 font-body">Suivez les étapes pour générer votre estimation</p>
          </div>
        </div>

        {/* Progress */}
        <div className="bg-white border-b border-neutral-200">
          <div className="container mx-auto px-4 sm:px-6 lg:px-16 py-5">
            <div className="flex items-center max-w-3xl mx-auto">
              {steps.map((step, idx) => {
                const done   = uiIdx > idx + 1;
                const active = uiIdx === idx + 1;
                return (
                  <div key={step.id} className="flex items-center flex-1">
                    <div className="flex flex-col items-center">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-heading font-bold text-sm transition-all ${done ? 'bg-primary-500 text-white' : active ? 'bg-primary-500 text-white ring-4 ring-primary-100' : 'bg-neutral-200 text-neutral-500'}`}>
                        {done ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg> : idx + 1}
                      </div>
                      <span className={`text-xs mt-1.5 font-body font-medium hidden sm:block ${active ? 'text-primary-500' : 'text-neutral-400'}`}>{step.label}</span>
                    </div>
                    {idx < steps.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${done ? 'bg-primary-500' : 'bg-neutral-200'}`} />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-16 py-8">
          <div className="max-w-4xl mx-auto">

            {/* ── STEP 1: SERVICE ── */}
            {currentStep === 1 && (
              <div className="bg-white border border-neutral-200 rounded-2xl p-8">
                <h2 className="font-heading text-2xl font-bold text-neutral-900 mb-2">Quel service vous intéresse ?</h2>
                <p className="text-neutral-600 font-body mb-8">Sélectionnez le type de travaux pour votre projet</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  {services.map(svc => (
                    <button
                      key={svc.id}
                      onClick={() => setSelService(svc)}
                      className={`group bg-white border-2 rounded-2xl p-6 text-center transition-all hover:shadow-sm ${
                        selService?.id === svc.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-neutral-200 hover:border-primary-300'
                      }`}>
                      <div className={`w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 transition-colors ${
                        selService?.id === svc.id ? 'bg-primary-200' : 'bg-primary-100 group-hover:bg-primary-200'
                      }`}>
                        <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={SERVICE_ICON_PATHS[svc.code] || SERVICE_ICON_PATHS.coffrage} />
                        </svg>
                      </div>
                      <h3 className="font-heading font-bold text-lg text-neutral-900 mb-2">{svc.name}</h3>
                      <p className="text-sm text-neutral-600 font-body">{svc.description}</p>
                    </button>
                  ))}
                </div>

                {/* Navigation */}
                <div className="flex justify-end">
                  <button onClick={handleNext} disabled={!canGoNext()}
                    className="inline-flex items-center px-6 py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-neutral-300 text-white font-heading font-semibold rounded-lg transition-all disabled:cursor-not-allowed">
                    Suivant
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 2 (with subtype): COLLECTION / TYPE ── */}
            {currentStep === 2 && needsSubtype && (
              <div className="bg-white border border-neutral-200 rounded-2xl p-8">
                <h2 className="font-heading text-2xl font-bold text-neutral-900 mb-2">
                  {selService.code === 'facade' ? 'Quelle collection ?' : "Quel type d'étanchéité ?"}
                </h2>
                <p className="text-neutral-600 font-body mb-8">
                  {selService.code === 'facade' ? 'Choisissez la collection pour votre projet' : 'Précisez le type de support à traiter'}
                </p>
                <div className={`grid gap-4 mb-8 ${selService.code === 'etancheite' ? 'grid-cols-1 sm:grid-cols-2 max-w-md mx-auto' : 'grid-cols-2 lg:grid-cols-4'}`}>
                  {SUBTYPES[selService.code].map(sub => (
                    <button
                      key={sub.key}
                      onClick={() => setSelSubtype(sub)}
                      className={`group bg-white border-2 rounded-2xl p-6 text-center transition-all hover:shadow-sm ${
                        selSubtype?.key === sub.key
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-neutral-200 hover:border-primary-300'
                      }`}>
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 transition-colors ${
                        selSubtype?.key === sub.key ? 'bg-primary-200' : 'bg-primary-100 group-hover:bg-primary-200'
                      }`}>
                        <svg className="w-7 h-7 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={SUBTYPE_ICON_PATHS[sub.key]} />
                        </svg>
                      </div>
                      <h3 className="font-heading font-bold text-lg text-neutral-900 mb-1">{sub.label}</h3>
                      <p className="text-xs text-neutral-600 font-body">{sub.description}</p>
                    </button>
                  ))}
                </div>

                {/* Navigation */}
                <div className="flex justify-between">
                  <button onClick={handlePrev}
                    className="inline-flex items-center px-6 py-3 border border-neutral-300 text-neutral-700 hover:bg-neutral-50 font-heading font-semibold rounded-lg transition-all">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Précédent
                  </button>
                  <button onClick={handleNext} disabled={!canGoNext()}
                    className="inline-flex items-center px-6 py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-neutral-300 text-white font-heading font-semibold rounded-lg transition-all disabled:cursor-not-allowed">
                    Suivant
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* ── PRODUCT STEP ── */}
            {isProduct && (
              <div className="bg-white border border-neutral-200 rounded-2xl p-8">
                <div className="mb-8">
                  <h2 className="font-heading text-2xl font-bold text-neutral-900 mb-2">Choisissez votre produit</h2>
                  <p className="text-neutral-600 font-body flex items-center gap-2 flex-wrap">
                    {selService.name}
                    {selSubtype && <span className="px-2.5 py-0.5 bg-primary-100 text-primary-700 text-xs font-heading font-semibold rounded-full">{selSubtype.label}</span>}
                  </p>
                </div>

                {loading ? (
                  <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-500"></div></div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                      {products.map(prod => (
                        <button
                          key={prod.id}
                          onClick={() => setSelProduct(prod)}
                          className={`group bg-white border-2 rounded-2xl p-6 text-left transition-all hover:shadow-sm ${
                            selProduct?.id === prod.id
                              ? 'border-primary-500 ring-2 ring-primary-100'
                              : 'border-neutral-200 hover:border-primary-300'
                          }`}>
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="font-heading font-bold text-lg text-neutral-900 pr-2">{prod.name}</h3>
                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                              <span className={`px-2.5 py-0.5 text-xs font-heading font-semibold rounded-lg ${prod.category === 'premium' ? 'bg-accent-100 text-accent-700' : prod.category === 'standard' ? 'bg-primary-100 text-primary-700' : 'bg-neutral-100 text-neutral-700'}`}>{prod.category}</span>
                              {prod.norme && <span className="text-xs text-neutral-400 font-body">{prod.norme}</span>}
                            </div>
                          </div>
                          <p className="text-sm text-neutral-600 font-body mb-4 line-clamp-2">{prod.description}</p>
                          <div className="flex items-center justify-between text-sm border-t border-neutral-100 pt-3">
                            <span className="text-neutral-500 font-body">Prix / m²</span>
                            <span className="font-heading font-bold text-primary-500">{fmt(prod.price_min)} – {fmt(prod.price_max)}</span>
                          </div>
                          {prod.warranty_years && (
                            <div className="mt-2 flex items-center text-xs text-neutral-500 font-body">
                              <svg className="w-3.5 h-3.5 mr-1 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                              </svg>
                              Garantie {prod.warranty_years} ans
                            </div>
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Navigation */}
                    <div className="flex justify-between">
                      <button onClick={handlePrev}
                        className="inline-flex items-center px-6 py-3 border border-neutral-300 text-neutral-700 hover:bg-neutral-50 font-heading font-semibold rounded-lg transition-all">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Précédent
                      </button>
                      <button onClick={handleNext} disabled={!canGoNext()}
                        className="inline-flex items-center px-6 py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-neutral-300 text-white font-heading font-semibold rounded-lg transition-all disabled:cursor-not-allowed">
                        Suivant
                        <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── CASE STEP ── */}
            {isCases && selProduct && (
              <div className="bg-white border border-neutral-200 rounded-2xl p-8">
                <h2 className="font-heading text-2xl font-bold text-neutral-900 mb-2">Cas d'application</h2>
                <p className="text-neutral-600 font-body mb-2">
                  {selProduct.name}
                  {selProduct.norme && <span className="ml-2 text-xs text-neutral-400">({selProduct.norme})</span>}
                </p>
                <p className="text-sm text-neutral-500 font-body mb-8">Sélectionnez le cas qui correspond à votre chantier</p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  {selProduct.cases?.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setSelCase(c)}
                      className={`group bg-white border-2 rounded-2xl p-6 text-left transition-all hover:shadow-sm ${
                        selCase?.id === c.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-neutral-200 hover:border-primary-300'
                      }`}>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                        selCase?.id === c.id ? 'bg-primary-200' : 'bg-primary-100 group-hover:bg-primary-200'
                      }`}>
                        <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {CASE_ICONS[c.icon_type] || CASE_ICONS.check}
                        </svg>
                      </div>
                      <h3 className="font-heading font-bold text-base text-neutral-900 mb-2">{c.name}</h3>
                      <p className="text-sm text-neutral-600 font-body leading-relaxed">{c.description}</p>
                    </button>
                  ))}
                </div>

                {/* Navigation */}
                <div className="flex justify-between">
                  <button onClick={handlePrev}
                    className="inline-flex items-center px-6 py-3 border border-neutral-300 text-neutral-700 hover:bg-neutral-50 font-heading font-semibold rounded-lg transition-all">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Précédent
                  </button>
                  <button onClick={handleNext} disabled={!canGoNext()}
                    className="inline-flex items-center px-6 py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-neutral-300 text-white font-heading font-semibold rounded-lg transition-all disabled:cursor-not-allowed">
                    Suivant
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* ── DETAILS STEP ── */}
            {isDetails && (
              <div className="bg-white border border-neutral-200 rounded-2xl p-8">
                <div className="mb-8">
                  <h2 className="font-heading text-2xl font-bold text-neutral-900 mb-1">Détails du projet</h2>
                  <p className="text-sm text-neutral-500 font-body">
                    {selService.name}
                    {selSubtype && <><span className="mx-1 text-neutral-300">›</span>{selSubtype.label}</>}
                    <span className="mx-1 text-neutral-300">›</span>{selProduct.name}
                    <span className="mx-1 text-neutral-300">›</span>{selCase.name}
                  </p>
                </div>

                <form onSubmit={handleCalculate} className="space-y-8">
                  {/* Project info */}
                  <div>
                    <h3 className="font-heading font-semibold text-neutral-800 mb-4">Informations du projet</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-heading font-medium text-neutral-700 mb-2">Nom du projet</label>
                        <input type="text" value={info.project_name} onChange={e => setInfo({...info, project_name: e.target.value})}
                          className="w-full px-4 py-3 border border-neutral-300 rounded-lg font-body focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                          placeholder="Ex: Rénovation façade villa" />
                      </div>
                      <div>
                        <label className="block text-sm font-heading font-medium text-neutral-700 mb-2">Localisation</label>
                        <input type="text" value={info.project_location} onChange={e => setInfo({...info, project_location: e.target.value})}
                          className="w-full px-4 py-3 border border-neutral-300 rounded-lg font-body focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                          placeholder="Ex: Casablanca" />
                      </div>
                    </div>
                  </div>

                  {/* Dimensions */}
                  <div>
                    <h3 className="font-heading font-semibold text-neutral-800 mb-4">Dimensions</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-heading font-medium text-neutral-700 mb-2">Longueur (m) <span className="text-red-500">*</span></label>
                        <input type="number" required min="0.1" step="0.01" value={dims.longueur}
                          onChange={e => setDims({...dims, longueur: e.target.value})}
                          className="w-full px-4 py-3 border border-neutral-300 rounded-lg font-body focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                          placeholder="0.00" />
                      </div>
                      <div>
                        <label className="block text-sm font-heading font-medium text-neutral-700 mb-2">Largeur (m) <span className="text-red-500">*</span></label>
                        <input type="number" required min="0.1" step="0.01" value={dims.largeur}
                          onChange={e => setDims({...dims, largeur: e.target.value})}
                          className="w-full px-4 py-3 border border-neutral-300 rounded-lg font-body focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                          placeholder="0.00" />
                      </div>
                      {isWall && (
                        <>
                          <div>
                            <label className="block text-sm font-heading font-medium text-neutral-700 mb-2">Hauteur (m)</label>
                            <input type="number" min="0.1" step="0.01" value={dims.hauteur}
                              onChange={e => setDims({...dims, hauteur: e.target.value})}
                              className="w-full px-4 py-3 border border-neutral-300 rounded-lg font-body focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                              placeholder="0.00" />
                          </div>
                          <div>
                            <label className="block text-sm font-heading font-medium text-neutral-700 mb-2">Nb. murs</label>
                            <input type="number" min="1" max="10" value={dims.nombre_murs}
                              onChange={e => setDims({...dims, nombre_murs: e.target.value})}
                              className="w-full px-4 py-3 border border-neutral-300 rounded-lg font-body focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
                          </div>
                        </>
                      )}
                    </div>

                    {/* Surface preview */}
                    {surfaceCalc > 0 && (
                      <div className="mt-4 p-4 bg-primary-50 border border-primary-200 rounded-xl flex items-center justify-between">
                        <span className="text-sm font-body text-primary-700">Surface calculée automatiquement</span>
                        <span className="font-display font-bold text-xl text-primary-600">{surfaceCalc.toFixed(2)} m²</span>
                      </div>
                    )}
                  </div>

                  {/* Pricing Factors */}
                  <div>
                    <h3 className="font-heading font-semibold text-neutral-800 mb-4">Coefficients de calcul</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { key: 'height',     label: 'Hauteur du bâtiment', field: 'height' },
                        { key: 'condition',  label: 'État du support',     field: 'condition' },
                        { key: 'complexity', label: 'Complexité',          field: 'complexity' },
                        { key: 'region',     label: 'Région',              field: 'region' },
                      ].map(({ key, label, field }) => pricingFactors[key] && (
                        <div key={key}>
                          <label className="block text-sm font-heading font-medium text-neutral-700 mb-2">{label}</label>
                          <select value={factors[field]} onChange={e => setFactors({...factors, [field]: parseFloat(e.target.value)})}
                            className="w-full px-4 py-3 border border-neutral-300 rounded-lg font-body focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all">
                            {pricingFactors[key].map(f => <option key={f.code} value={f.multiplier}>{f.name} (×{f.multiplier})</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-heading font-medium text-neutral-700 mb-2">Notes <span className="text-neutral-400 font-body font-normal">(optionnel)</span></label>
                    <textarea value={info.notes} onChange={e => setInfo({...info, notes: e.target.value})} rows={3}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg font-body focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                      placeholder="Informations complémentaires..." />
                  </div>

                  {/* Navigation */}
                  <div className="flex justify-between pt-4">
                    <button type="button" onClick={handlePrev}
                      className="inline-flex items-center px-6 py-3 border border-neutral-300 text-neutral-700 hover:bg-neutral-50 font-heading font-semibold rounded-lg transition-all">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Précédent
                    </button>
                    <button type="submit" disabled={loading}
                      className="inline-flex items-center px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-heading font-semibold rounded-lg transition-all disabled:opacity-50 shadow-sm hover:shadow-md">
                      {loading ? 'Calcul en cours...' : 'Calculer le prix'}
                      <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ── SUMMARY STEP ── */}
            {isSummary && calculation && (
              <div className="space-y-6">
                {/* Breadcrumb recap */}
                <div className="bg-white border border-neutral-200 rounded-2xl p-5">
                  <div className="flex flex-wrap gap-6 text-sm">
                    {[
                      ['Service', selService.name],
                      ...(selSubtype ? [['Type', selSubtype.label]] : []),
                      ['Produit', selProduct.name],
                      ['Cas', selCase.name],
                      ['Surface', `${calculation.surface_area} m²`],
                      ...(info.project_location ? [['Lieu', info.project_location]] : []),
                    ].map(([label, val]) => (
                      <div key={label}>
                        <p className="text-xs text-neutral-500 font-body">{label}</p>
                        <p className="font-heading font-semibold text-neutral-900">{val}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Materials list (DTU) */}
                {calculation.calculated_materials?.length > 0 && (
                  <div className="bg-white border border-neutral-200 rounded-2xl p-6">
                    <h2 className="font-heading text-lg font-bold text-neutral-900 mb-4">Liste des produits — ordre DTU</h2>
                    <div className="space-y-3">
                      {calculation.calculated_materials.map((mat, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-heading font-bold flex-shrink-0">{mat.step}</span>
                            <div>
                              <span className="font-body text-neutral-900 text-sm">{mat.name}</span>
                              {mat.is_optional && <span className="ml-2 text-xs text-neutral-400">(optionnel)</span>}
                              <span className={`ml-2 text-xs px-2 py-0.5 rounded font-body ${MATERIAL_TYPE_COLORS[mat.type] || 'bg-neutral-100 text-neutral-600'}`}>
                                {mat.type}
                              </span>
                            </div>
                          </div>
                          <span className="font-heading font-bold text-primary-500 text-sm">{mat.quantity} {mat.unit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Price breakdown */}
                <div className="bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-2xl p-6">
                  <h2 className="font-heading text-xl font-bold mb-6">Calcul du prix</h2>
                  <div className="space-y-3">
                    <div className="flex justify-between pb-3 border-b border-primary-400">
                      <span className="font-body">Prix de base ({calculation.surface_area} m²)</span>
                      <span className="font-display font-bold">{fmt(calculation.base_price)}</span>
                    </div>
                    <div className="text-sm space-y-1.5 text-primary-100">
                      <p className="text-white font-heading font-semibold">Coefficients :</p>
                      {[['Hauteur', calculation.factor_height], ['État', calculation.factor_condition], ['Complexité', calculation.factor_complexity], ['Région', calculation.factor_region]].map(([l, v]) => (
                        <div key={l} className="flex justify-between"><span className="font-body">× {l}</span><span>×{v}</span></div>
                      ))}
                    </div>
                    <div className="flex justify-between pt-2 border-t border-primary-400">
                      <span className="font-body">Avec coefficients</span>
                      <span className="font-display font-bold">{fmt(calculation.price_with_factors)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-body">+ Coûts fixes</span>
                      <span>{fmt(calculation.fixed_costs)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-primary-400">
                      <span className="font-body font-semibold">Sous-total HT</span>
                      <span className="font-display font-bold">{fmt(calculation.subtotal_ht)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-body">TVA ({calculation.tva_rate}%)</span>
                      <span>{fmt(calculation.tva_amount)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t-2 border-white text-xl">
                      <span className="font-heading font-bold">TOTAL TTC</span>
                      <span className="font-display font-bold">{fmt(calculation.total_ttc)}</span>
                    </div>
                  </div>
                </div>

                {/* Duration */}
                {calculation.estimated_days > 0 && (
                  <div className="bg-white border border-neutral-200 rounded-2xl p-5 flex items-center gap-4">
                    <div className="w-12 h-12 bg-accent-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 font-body">Durée estimée des travaux</p>
                      <p className="font-display font-bold text-2xl text-neutral-900">{calculation.estimated_days} jours</p>
                      <p className="text-xs text-neutral-400 font-body">{calculation.preparation_days}j préparation + {calculation.drying_days}j séchage</p>
                    </div>
                  </div>
                )}

                {/* Save buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button onClick={() => handleSave('draft')} disabled={loading}
                    className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-heading font-semibold rounded-lg transition-all disabled:opacity-50">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/>
                    </svg>
                    Sauvegarder comme brouillon
                  </button>
                  <button onClick={() => handleSave('saved')} disabled={loading}
                    className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-heading font-semibold rounded-lg transition-all disabled:opacity-50 shadow-sm hover:shadow-md">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                    </svg>
                    Sauvegarder le devis
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}