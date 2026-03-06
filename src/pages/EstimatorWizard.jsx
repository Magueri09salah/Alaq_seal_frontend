import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { estimatorAPI } from '../services/api';
import toast from 'react-hot-toast';
import Navbar from '../components/layout/Navbar';

// ─── Constants ───────────────────────────────────────────────────────────────

// Main étanchéité types (first page)
const ETANCHEITE_TYPES = [
  { 
    key: 'toiture', 
    label: 'Étanchéité toiture plate', 
    description: 'Toitures-terrasses accessibles ou non accessibles',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
  },
  { 
    key: 'mur', 
    label: 'Étanchéité mur enterré', 
    description: 'Cuvelage, murs enterrés, soubassements',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5'
  },
  { 
    key: 'salle_bain', 
    label: 'Étanchéité sous carrelage', 
    description: 'Salles de bain, douches, pièces humides',
    icon: 'M4 6h16M4 10h16M4 14h16M4 18h16'
  },
];

// Toiture types (page 2 for toiture)
const TOITURE_TYPES = [
  { key: 'non_accessible', label: 'Non accessible', description: 'Toiture technique non accessible' },
  { key: 'accessible', label: 'Accessible', description: 'Toiture-terrasse accessible aux piétons' },
];

// Toiture finish options (for non-accessible only)
const TOITURE_FINITIONS = [
  { key: 'autoprotegee', label: 'Autoprotégée ardoisée', description: 'Finition directe ardoisée' },
  { key: 'lestage', label: 'Finition lisse + Lestage', description: 'Géotextile + Gravier 5cm' },
];

const fmt = (p) => new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', minimumFractionDigits: 0 }).format(p);

// ─── Main Component ───────────────────────────────────────────────────────────
export default function EstimatorWizard() {
  const navigate = useNavigate();

  // UI state
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Selections
  const [selType, setSelType] = useState(null);  // toiture, mur, salle_bain
  const [selToitureType, setSelToitureType] = useState(null);  // accessible / non_accessible
  const [selIsolation, setSelIsolation] = useState(null);  // true / false
  const [selFinition, setSelFinition] = useState(null);  // for non-accessible only
  const [calculation, setCalculation] = useState(null);
  const [removedMaterials, setRemovedMaterials] = useState(new Set());

  // Form data for toiture
  const [toitureData, setToitureData] = useState({
    longueur: '',
    largeur: '',
    perimetre: '',
    hauteur_acrotere: '',
    nombre_evacuations: '1',
    chape_existante: true,
  });

  // Form data for mur/salle_bain
  const [standardData, setStandardData] = useState({
    longueur: '',
    largeur: '',
    hauteur: '',
    nombre_murs: 4,
  });

  const [info, setInfo] = useState({ project_name: '', project_location: '', notes: '' });

  // Steps configuration
  const buildSteps = () => {
    if (selType === 'toiture') {
      return [
        { id: 1, label: 'Type' },
        { id: 2, label: 'Toiture' },
        { id: 3, label: 'Isolation' },
        { id: 4, label: 'Détails' },
        { id: 5, label: 'Résumé' },
      ];
    } else {
      return [
        { id: 1, label: 'Type' },
        { id: 2, label: 'Détails' },
        { id: 3, label: 'Résumé' },
      ];
    }
  };

  const steps = buildSteps();
  const uiIdx = steps.findIndex(s => s.id === currentStep) + 1;

  // ── Navigation ──────────────────────────────────────────────────────────────
  const canGoNext = () => {
    if (currentStep === 1) return !!selType;
    if (currentStep === 2 && selType === 'toiture') return !!selToitureType;
    if (currentStep === 3 && selType === 'toiture') return selIsolation !== null;
    return false;
  };

  const handleNext = () => {
    if (!canGoNext()) {
      if (currentStep === 1) toast.error('Veuillez sélectionner un type d\'étanchéité');
      else if (currentStep === 2) toast.error('Veuillez sélectionner le type de toiture');
      else if (currentStep === 3) toast.error('Choisissez si vous souhaitez une isolation');
      return;
    }
    setCurrentStep(c => c + 1);
  };

  const handlePrev = () => {
    setCurrentStep(c => Math.max(1, c - 1));
  };

  const handleCalculate = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      
      let payload;
      
      if (selType === 'toiture') {
        // Validate toiture form
        if (!toitureData.longueur || !toitureData.largeur || !toitureData.perimetre) {
          toast.error('Veuillez remplir tous les champs obligatoires');
          return;
        }

        payload = {
          type: 'toiture',
          toiture_type: selToitureType,
          isolation: selIsolation,
          finition: selFinition,
          chape_existante: toitureData.chape_existante,
          ...toitureData,
        };
      } else {
        // Validate standard form
        if (!standardData.longueur || !standardData.largeur) {
          toast.error('Veuillez remplir les dimensions');
          return;
        }

        payload = {
          type: selType,
          ...standardData,
        };
      }

      const r = await estimatorAPI.calculateToiture(payload);
      setCalculation(r.data.data);
      setRemovedMaterials(new Set());
      
      if (selType === 'toiture') {
        setCurrentStep(5);
      } else {
        setCurrentStep(3);
      }
      
    } catch (error) {
      console.error('Calculate error:', error);
      toast.error('Erreur lors du calcul');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (status) => {
    try {
      setLoading(true);
      
      const payload = {
        type: selType,
        status,
        calculation: calculation,
        project_name: info.project_name,
        project_location: info.project_location,
        notes: info.notes,
        ...(selType === 'toiture' ? {
          toiture_type: selToitureType,
          isolation: selIsolation,
          finition: selFinition,
          ...toitureData,
        } : standardData),
      };

      const r = await estimatorAPI.createToitureDevis(payload);
      toast.success('Devis créé avec succès!');
      // Navigate to toiture devis view page (not old system)
      navigate(`/toiture/devis/${r.data.data.id}`);
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
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
                const done = uiIdx > idx + 1;
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

            {/* ── STEP 1: TYPE D'ÉTANCHÉITÉ ── */}
            {currentStep === 1 && (
              <div className="bg-white border border-neutral-200 rounded-2xl p-8">
                <h2 className="font-heading text-2xl font-bold text-neutral-900 mb-2">Quel type d'étanchéité ?</h2>
                <p className="text-neutral-600 font-body mb-8">Sélectionnez le type de travaux pour votre projet</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  {ETANCHEITE_TYPES.map(type => (
                    <button
                      key={type.key}
                      onClick={() => setSelType(type.key)}
                      className={`group bg-white border-2 rounded-2xl p-6 text-center transition-all hover:shadow-sm ${
                        selType === type.key
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-neutral-200 hover:border-primary-300'
                      }`}>
                      <div className={`w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 transition-colors ${
                        selType === type.key ? 'bg-primary-200' : 'bg-primary-100 group-hover:bg-primary-200'
                      }`}>
                        <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={type.icon} />
                        </svg>
                      </div>
                      <h3 className="font-heading font-bold text-lg text-neutral-900 mb-2">{type.label}</h3>
                      <p className="text-sm text-neutral-600 font-body">{type.description}</p>
                    </button>
                  ))}
                </div>

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

            {/* ── STEP 2 (TOITURE): TYPE DE TOITURE ── */}
            {currentStep === 2 && selType === 'toiture' && (
              <div className="bg-white border border-neutral-200 rounded-2xl p-8">
                <h2 className="font-heading text-2xl font-bold text-neutral-900 mb-2">Type de toiture</h2>
                <p className="text-neutral-600 font-body mb-8">La toiture sera-t-elle accessible ?</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {TOITURE_TYPES.map(type => (
                    <button
                      key={type.key}
                      onClick={() => setSelToitureType(type.key)}
                      className={`group bg-white border-2 rounded-2xl p-6 text-left transition-all hover:shadow-sm ${
                        selToitureType === type.key
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-neutral-200 hover:border-primary-300'
                      }`}>
                      <h3 className="font-heading font-bold text-lg text-neutral-900 mb-2">{type.label}</h3>
                      <p className="text-sm text-neutral-600 font-body">{type.description}</p>
                    </button>
                  ))}
                </div>

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

            {/* ── STEP 3 (TOITURE): ISOLATION ── */}
            {currentStep === 3 && selType === 'toiture' && (
              <div className="bg-white border border-neutral-200 rounded-2xl p-8">
                <h2 className="font-heading text-2xl font-bold text-neutral-900 mb-2">Isolation thermique</h2>
                <p className="text-neutral-600 font-body mb-8">Souhaitez-vous une isolation thermique ? (Toiture chaude)</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  <button
                    onClick={() => setSelIsolation(true)}
                    className={`group bg-white border-2 rounded-2xl p-6 text-left transition-all hover:shadow-sm ${
                      selIsolation === true
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-neutral-200 hover:border-primary-300'
                    }`}>
                    <h3 className="font-heading font-bold text-lg text-neutral-900 mb-2">Oui (Toiture chaude)</h3>
                    <p className="text-sm text-neutral-600 font-body">Avec isolation thermique</p>
                  </button>
                  <button
                    onClick={() => setSelIsolation(false)}
                    className={`group bg-white border-2 rounded-2xl p-6 text-left transition-all hover:shadow-sm ${
                      selIsolation === false
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-neutral-200 hover:border-primary-300'
                    }`}>
                    <h3 className="font-heading font-bold text-lg text-neutral-900 mb-2">Non</h3>
                    <p className="text-sm text-neutral-600 font-body">Sans isolation thermique</p>
                  </button>
                </div>

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

            {/* ── STEP 4: DETAILS FORM (TOITURE) ── */}
            {currentStep === 4 && selType === 'toiture' && (
              <div className="bg-white border border-neutral-200 rounded-2xl p-8">
                <h2 className="font-heading text-2xl font-bold text-neutral-900 mb-2">Informations techniques</h2>
                <p className="text-neutral-600 font-body mb-8">Renseignez les dimensions de votre toiture</p>

                <form onSubmit={handleCalculate} className="space-y-6">
                  {/* Project info */}
                  <div>
                    <h3 className="font-heading font-semibold text-neutral-800 mb-4">Informations du projet</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-heading font-medium text-neutral-700 mb-2">Nom du projet</label>
                        <input type="text" value={info.project_name} onChange={e => setInfo({...info, project_name: e.target.value})}
                          className="w-full px-4 py-3 border border-neutral-300 rounded-lg font-body focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                          placeholder="Ex: Rénovation toiture villa" />
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
                        <input type="number" required min="0.1" step="0.01" value={toitureData.longueur}
                          onChange={e => setToitureData({...toitureData, longueur: e.target.value})}
                          className="w-full px-4 py-3 border border-neutral-300 rounded-lg font-body focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                          placeholder="0.00" />
                      </div>
                      <div>
                        <label className="block text-sm font-heading font-medium text-neutral-700 mb-2">Largeur (m) <span className="text-red-500">*</span></label>
                        <input type="number" required min="0.1" step="0.01" value={toitureData.largeur}
                          onChange={e => setToitureData({...toitureData, largeur: e.target.value})}
                          className="w-full px-4 py-3 border border-neutral-300 rounded-lg font-body focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                          placeholder="0.00" />
                      </div>
                      <div>
                        <label className="block text-sm font-heading font-medium text-neutral-700 mb-2">Périmètre (ml) <span className="text-red-500">*</span></label>
                        <input type="number" required min="0.1" step="0.01" value={toitureData.perimetre}
                          onChange={e => setToitureData({...toitureData, perimetre: e.target.value})}
                          className="w-full px-4 py-3 border border-neutral-300 rounded-lg font-body focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                          placeholder="0.00" />
                      </div>
                      <div>
                        <label className="block text-sm font-heading font-medium text-neutral-700 mb-2">Hauteur acrotère (m)</label>
                        <input type="number" min="0" step="0.01" value={toitureData.hauteur_acrotere}
                          onChange={e => setToitureData({...toitureData, hauteur_acrotere: e.target.value})}
                          className="w-full px-4 py-3 border border-neutral-300 rounded-lg font-body focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                          placeholder="0.00" />
                      </div>
                    </div>
                  </div>

                  {/* Options */}
                  <div>
                    <h3 className="font-heading font-semibold text-neutral-800 mb-4">Options</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-heading font-medium text-neutral-700 mb-2">Nombre d'évacuations</label>
                        <input type="number" min="1" value={toitureData.nombre_evacuations}
                          onChange={e => setToitureData({...toitureData, nombre_evacuations: e.target.value})}
                          className="w-full px-4 py-3 border border-neutral-300 rounded-lg font-body focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
                      </div>
                      <div>
                        <label className="block text-sm font-heading font-medium text-neutral-700 mb-2">Chape de pente existante ?</label>
                        <select value={toitureData.chape_existante} onChange={e => setToitureData({...toitureData, chape_existante: e.target.value === 'true'})}
                          className="w-full px-4 py-3 border border-neutral-300 rounded-lg font-body focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all">
                          <option value="true">Oui</option>
                          <option value="false">Non</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Finition (only for non-accessible) */}
                  {selToitureType === 'non_accessible' && (
                    <div>
                      <h3 className="font-heading font-semibold text-neutral-800 mb-4">Choix de finition</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {TOITURE_FINITIONS.map(fin => (
                          <button
                            key={fin.key}
                            type="button"
                            onClick={() => setSelFinition(fin.key)}
                            className={`group bg-white border-2 rounded-2xl p-4 text-left transition-all hover:shadow-sm ${
                              selFinition === fin.key
                                ? 'border-primary-500 bg-primary-50'
                                : 'border-neutral-200 hover:border-primary-300'
                            }`}>
                            <h4 className="font-heading font-bold text-base text-neutral-900 mb-1">{fin.label}</h4>
                            <p className="text-sm text-neutral-600 font-body">{fin.description}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-heading font-medium text-neutral-700 mb-2">Notes</label>
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

            {/* ── STEP 2 (MUR/SALLE_BAIN): DETAILS FORM ── */}
            {currentStep === 2 && (selType === 'mur' || selType === 'salle_bain') && (
              <div className="bg-white border border-neutral-200 rounded-2xl p-8">
                <h2 className="font-heading text-2xl font-bold text-neutral-900 mb-2">Détails du projet</h2>
                <p className="text-neutral-600 font-body mb-8">Renseignez les dimensions</p>

                <form onSubmit={handleCalculate} className="space-y-6">
                  {/* Project info */}
                  <div>
                    <h3 className="font-heading font-semibold text-neutral-800 mb-4">Informations du projet</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-heading font-medium text-neutral-700 mb-2">Nom du projet</label>
                        <input type="text" value={info.project_name} onChange={e => setInfo({...info, project_name: e.target.value})}
                          className="w-full px-4 py-3 border border-neutral-300 rounded-lg font-body focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                          placeholder="Ex: Étanchéité mur" />
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
                        <input type="number" required min="0.1" step="0.01" value={standardData.longueur}
                          onChange={e => setStandardData({...standardData, longueur: e.target.value})}
                          className="w-full px-4 py-3 border border-neutral-300 rounded-lg font-body focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                          placeholder="0.00" />
                      </div>
                      <div>
                        <label className="block text-sm font-heading font-medium text-neutral-700 mb-2">Largeur (m) <span className="text-red-500">*</span></label>
                        <input type="number" required min="0.1" step="0.01" value={standardData.largeur}
                          onChange={e => setStandardData({...standardData, largeur: e.target.value})}
                          className="w-full px-4 py-3 border border-neutral-300 rounded-lg font-body focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                          placeholder="0.00" />
                      </div>
                      {selType === 'mur' && (
                        <>
                          <div>
                            <label className="block text-sm font-heading font-medium text-neutral-700 mb-2">Hauteur (m)</label>
                            <input type="number" min="0.1" step="0.01" value={standardData.hauteur}
                              onChange={e => setStandardData({...standardData, hauteur: e.target.value})}
                              className="w-full px-4 py-3 border border-neutral-300 rounded-lg font-body focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                              placeholder="0.00" />
                          </div>
                          <div>
                            <label className="block text-sm font-heading font-medium text-neutral-700 mb-2">Nb. murs</label>
                            <input type="number" min="1" max="10" value={standardData.nombre_murs}
                              onChange={e => setStandardData({...standardData, nombre_murs: e.target.value})}
                              className="w-full px-4 py-3 border border-neutral-300 rounded-lg font-body focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-heading font-medium text-neutral-700 mb-2">Notes</label>
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
            {calculation && ((currentStep === 5 && selType === 'toiture') || (currentStep === 3 && selType !== 'toiture')) && (
              <div className="space-y-6">
                {/* Back button to edit */}
                <div className="bg-white border border-neutral-200 rounded-2xl p-4">
                  <button
                    onClick={() => {
                      if (selType === 'toiture') {
                        setCurrentStep(4); // Go back to details form
                      } else {
                        setCurrentStep(2); // Go back to details form
                      }
                    }}
                    className="inline-flex items-center text-sm font-heading font-medium text-neutral-600 hover:text-primary-600 transition-colors">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Modifier les informations
                  </button>
                </div>

                {/* Recap */}
                <div className="bg-white border border-neutral-200 rounded-2xl p-5">
                  <div className="flex flex-wrap gap-6 text-sm">
                    <div>
                      <p className="text-xs text-neutral-500 font-body">Type</p>
                      <p className="font-heading font-semibold text-neutral-900">
                        {ETANCHEITE_TYPES.find(t => t.key === selType)?.label}
                      </p>
                    </div>
                    {selType === 'toiture' && (
                      <>
                        <div>
                          <p className="text-xs text-neutral-500 font-body">Toiture</p>
                          <p className="font-heading font-semibold text-neutral-900">
                            {TOITURE_TYPES.find(t => t.key === selToitureType)?.label}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-neutral-500 font-body">Isolation</p>
                          <p className="font-heading font-semibold text-neutral-900">
                            {selIsolation ? 'Oui (Toiture chaude)' : 'Non'}
                          </p>
                        </div>
                      </>
                    )}
                    <div>
                      <p className="text-xs text-neutral-500 font-body">Surface</p>
                      <p className="font-heading font-semibold text-neutral-900">{calculation.surface_brute} m²</p>
                    </div>
                    {info.project_location && (
                      <div>
                        <p className="text-xs text-neutral-500 font-body">Lieu</p>
                        <p className="font-heading font-semibold text-neutral-900">{info.project_location}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Materials list */}
                {calculation.materials?.length > 0 && (
                  <div className="bg-white border border-neutral-200 rounded-2xl p-6">
                    <h2 className="font-heading text-lg font-bold text-neutral-900 mb-4">Liste des produits</h2>
                    <div className="space-y-3">
                      {calculation.materials.filter((_, idx) => !removedMaterials.has(idx)).map((mat, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl group hover:bg-neutral-100 transition-colors">
                          <div className="flex items-center gap-3 flex-1">
                            <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-heading font-bold flex-shrink-0">
                              {i + 1}
                            </span>
                            <span className="font-body text-neutral-900 text-sm">{mat.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-heading font-bold text-primary-500 text-sm">
                              {mat.quantity} {mat.unit}
                            </span>
                            <button
                              type="button"
                              onClick={() => setRemovedMaterials(new Set([...removedMaterials, i]))}
                              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-100 text-neutral-400 hover:text-red-600 transition-all"
                              title="Retirer ce produit">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Price */}
                <div className="bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-2xl p-6">
                  <h2 className="font-heading text-xl font-bold mb-6">Estimation</h2>
                  <div className="space-y-3">
                    <div className="flex justify-between pb-3 border-b border-primary-400">
                      <span className="font-body">Prix estimé</span>
                      <span className="font-display font-bold">{fmt(calculation.total_ht || 0)}</span>
                    </div>
                  </div>
                </div>

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