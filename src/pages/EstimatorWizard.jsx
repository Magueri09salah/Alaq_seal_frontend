import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { estimatorAPI } from '../services/api';
import toast from 'react-hot-toast';
import Navbar from '../components/layout/Navbar';
import CityAutocomplete from '../components/common/CityAutocomplete';

// ─── Constants ───────────────────────────────────────────────────────────────

// Main étanchéité types (first page)
const ETANCHEITE_TYPES = [
  { 
    key: 'toiture', 
    label: 'Toiture-terrasse', 
    description: 'Étanchéité toiture plate',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
  },
  { 
    key: 'mur', 
    label: 'Mur', 
    description: 'Étanchéité mur enterré',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5'
  },
  { 
    key: 'salle_bain', 
    label: 'Salle de bain', 
    description: 'Étanchéité sous carrelage',
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

// Mur water level options
const MUR_WATER_LEVELS = [
    {
      key: 'humidite',
      label: 'Humidité du sol',
      desc: 'Humidité provenant du sol sans infiltration active d\'eau',
    },
    {
      key: 'infiltration',
      label: 'Infiltration d\'eau occasionnelle',
      desc: 'Eau qui s\'infiltre de manière intermittente (pluie, arrosage)',
    },
    {
      key: 'nappe',
      label: 'Eau permanente / Nappe phréatique',
      desc: 'Présence constante d\'eau ou contact direct avec la nappe phréatique',
    },
  ];

// Salle de bain type options
const SALLE_BAIN_TYPES = [
  { key: 'avec_bac', label: 'Douche avec bac', description: 'Étanchéité standard avec receveur' },
  { key: 'italienne', label: 'Douche italienne (sans bac)', description: 'Étanchéité renforcée zone douche' },
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

  const [selWaterLevel, setSelWaterLevel] = useState(null);  // for mur: humidite, infiltration, nappe
  const [selSdbType, setSelSdbType] = useState(null);  // for salle_bain: avec_bac, italienne
  const [drainSelected, setDrainSelected] = useState(false);  // for mur drainage

  const [sdbData, setSdbData] = useState({
    support: 'ciment',
    surface_sol_totale: '',
    surface_bac: '',
    surface_zone_douche: '',
    longueur_murs_douche: '',
    largeur_murs_douche: '',
    hauteur_murs_douche: '',
    longueur_murs_piece: '',
    largeur_murs_piece: '',
    hauteur_murs_piece: '',
  });

  // Form data for toiture
  const [toitureData, setToitureData] = useState({
    longueur: '',
    largeur: '',
    // perimetre: '',
    hauteur_acrotere: '',
    nombre_evacuations: '1',
    chape_existante: true,
  });

  // Form data for mur/salle_bain
  const [standardData, setStandardData] = useState({
    longueur_murs_douche: '',
    largeur_murs_douche: '',
    hauteur_murs_douche: '',
    longueur_murs_piece: '',
    largeur_murs_piece: '',
    hauteur_murs_piece: '',
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
    } else if (selType === 'mur') {
      return [
        { id: 1, label: 'Type' },
        { id: 2, label: 'Niveau d\'eau' },  // NEW
        { id: 3, label: 'Détails' },
        { id: 4, label: 'Résumé' },
      ];
    } else if (selType === 'salle_bain') {
      return [
        { id: 1, label: 'Type' },
        { id: 2, label: 'Type douche' },  // NEW
        { id: 3, label: 'Détails' },
        { id: 4, label: 'Résumé' },
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
    
    // Toiture flow
    if (selType === 'toiture') {
      if (currentStep === 2) return !!selToitureType;
      if (currentStep === 3) return selIsolation !== null;
    }
    
    // Mur flow - NEW
    if (selType === 'mur') {
      if (currentStep === 2) return !!selWaterLevel;
    }
    
    // Salle de bain flow - NEW
    if (selType === 'salle_bain') {
      if (currentStep === 2) return !!selSdbType;
    }
    
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
      if (!toitureData.longueur || !toitureData.largeur) {
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
    } else if (selType === 'mur') {
      if (!standardData.longueur || !standardData.hauteur) {
          toast.error('Veuillez remplir tous les champs obligatoires');
          return;
        }
        
        const finalDrain = selWaterLevel === 'nappe' ? true : drainSelected;
        
        payload = {
          type: 'mur',
          water_level: selWaterLevel,
          drain: finalDrain,
          longueur: parseFloat(standardData.longueur),
          hauteur: parseFloat(standardData.hauteur),
        };
      } else if (selType === 'salle_bain') {
      // SALLE DE BAIN LOGIC - FIXED TO HANDLE EMPTY STRINGS
      
      // Validate that required fields are filled
      if (!sdbData.surface_sol_totale) {
        toast.error('Veuillez remplir la surface sol totale');
        return;
      }
      if (!sdbData.longueur_murs_douche || !sdbData.largeur_murs_douche || !sdbData.hauteur_murs_douche) {
          toast.error('Veuillez remplir les dimensions des murs');
          return;
        }
        if (!sdbData.longueur_murs_piece || !sdbData.largeur_murs_piece || !sdbData.hauteur_murs_piece) {
          toast.error('Veuillez remplir les dimensions des murs');
          return;
        }

      if (selSdbType === 'italienne') {
        // Validate italienne specific fields
        if (!sdbData.surface_zone_douche) {
          toast.error('Veuillez remplir la surface de la zone douche');
          return;
        }
      }

      // CRITICAL FIX: Convert empty strings to null and parse numbers
      // This helper function cleans the data
      const cleanNumeric = (value) => {
        if (value === '' || value === null || value === undefined) return undefined;
        const num = parseFloat(value);
        return isNaN(num) ? undefined : num;
      };

      // Build payload with cleaned data - undefined fields won't be sent
      payload = {
        type: 'salle_bain',
        sdb_type: selSdbType,
        support: sdbData.support,
        surface_sol_totale: cleanNumeric(sdbData.surface_sol_totale),
        
        // These will only be included if they have values (not empty strings)
        ...(sdbData.surface_bac && { surface_bac: cleanNumeric(sdbData.surface_bac) }),
        // ...(sdbData.longueur_murs && { longueur_murs: cleanNumeric(sdbData.longueur_murs) }),
        // ...(sdbData.largeur_murs && { largeur_murs: cleanNumeric(sdbData.largeur_murs) }),
        // ...(sdbData.hauteur_murs && { hauteur_murs: cleanNumeric(sdbData.hauteur_murs) }),
        ...(sdbData.surface_zone_douche && { surface_zone_douche: cleanNumeric(sdbData.surface_zone_douche) }),
        ...(sdbData.longueur_murs_douche && { longueur_murs_douche: cleanNumeric(sdbData.longueur_murs_douche) }),
        ...(sdbData.largeur_murs_douche && { largeur_murs_douche: cleanNumeric(sdbData.largeur_murs_douche) }),
        ...(sdbData.hauteur_murs_douche && { hauteur_murs_douche: cleanNumeric(sdbData.hauteur_murs_douche) }),
        ...(sdbData.longueur_murs_piece && { longueur_murs_piece: cleanNumeric(sdbData.longueur_murs_piece) }),
        ...(sdbData.largeur_murs_piece && { largeur_murs_piece: cleanNumeric(sdbData.largeur_murs_piece) }),
        ...(sdbData.hauteur_murs_piece && { hauteur_murs_piece: cleanNumeric(sdbData.hauteur_murs_piece) }),
      };
    }

    const r = await estimatorAPI.calculateToiture(payload);
    setCalculation(r.data.data);
    setRemovedMaterials(new Set());
    
    // Navigate to summary
    if (selType === 'toiture') {
      setCurrentStep(5);
    } else if (selType === 'mur' || selType === 'salle_bain') {
      setCurrentStep(4);
    }
    
  } catch (error) {
    console.error('Calculate error:', error);
    
    // Better error handling to show backend validation errors
    if (error.response?.data?.errors) {
      const errorMessages = Object.values(error.response.data.errors).flat();
      toast.error(errorMessages[0] || 'Erreur lors du calcul');
    } else {
      toast.error(error.response?.data?.message || 'Erreur lors du calcul');
    }
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
      };

      // Add type-specific data
      if (selType === 'toiture') {
        payload.toiture_type = selToitureType;
        payload.isolation = selIsolation;
        payload.finition = selFinition;
        Object.assign(payload, toitureData);
      } else if (selType === 'mur') {
        payload.water_level = selWaterLevel;
        payload.drain = selWaterLevel === 'nappe' ? true : drainSelected;
        payload.longueur = parseFloat(standardData.longueur);
        payload.largeur = parseFloat(standardData.longueur);
        payload.hauteur = parseFloat(standardData.hauteur);
        
        if (calculation.hauteur_technique) {
          payload.hauteur_technique = calculation.hauteur_technique;
        }
      } else if (selType === 'salle_bain') {
        // CRITICAL FIX: Include sdb_type and sdbData
        payload.sdb_type = selSdbType;
        payload.support = sdbData.support;
        
        // Include all the detailed salle de bain data
        // The controller will store this in the salle_bain_data JSON column
        payload.salle_bain_data = {
          sdb_type: selSdbType,
          support: sdbData.support,
          surface_sol_totale: sdbData.surface_sol_totale,
          surface_bac: sdbData.surface_bac || null,
          // longueur_murs: sdbData.longueur_murs || null,
          // largeur_murs: sdbData.largeur_murs || null,
          // hauteur_murs: sdbData.hauteur_murs || null,
          surface_zone_douche: sdbData.surface_zone_douche || null,
          longueur_murs_douche: sdbData.longueur_murs_douche || null,
          largeur_murs_douche: sdbData.largeur_murs_douche || null,
          hauteur_murs_douche: sdbData.hauteur_murs_douche || null,
          longueur_murs_piece: sdbData.longueur_murs_piece || null,
          largeur_murs_piece: sdbData.largeur_murs_piece || null,
          hauteur_murs_piece: sdbData.hauteur_murs_piece || null,
        };
        
        // Also include minimal longueur/largeur for compatibility with existing schema
        // Use surface_sol_totale as a proxy for area calculations
        payload.longueur = Math.sqrt(parseFloat(sdbData.surface_sol_totale) || 0);
        payload.largeur = Math.sqrt(parseFloat(sdbData.surface_sol_totale) || 0);
      }

      const r = await estimatorAPI.createToitureDevis(payload);
      toast.success('Devis créé avec succès!');
      navigate(`/toiture/devis/${r.data.data.id}`);
    } catch (error) {
      console.error('Save error:', error);
      
      // Better error handling
      if (error.response?.data?.errors) {
        const errorMessages = Object.values(error.response.data.errors).flat();
        toast.error(errorMessages[0] || 'Erreur lors de la sauvegarde');
      } else {
        toast.error(error.response?.data?.message || 'Erreur lors de la sauvegarde');
      }
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
                        {/* <input type="text" value={info.project_location} onChange={e => setInfo({...info, project_location: e.target.value})}
                          className="w-full px-4 py-3 border border-neutral-300 rounded-lg font-body focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                          placeholder="Ex: Casablanca" /> */}
                          <CityAutocomplete
                          className="w-full px-4 py-3 border border-neutral-300 rounded-lg font-body focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                            value={info.project_location}
                            onChange={(city) => setInfo({...info, project_location: city})}
                            placeholder="Ex: Casablanca"
                          />
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
                      {/* <div>
                        <label className="block text-sm font-heading font-medium text-neutral-700 mb-2">Périmètre (ml) <span className="text-red-500">*</span></label>
                        <input type="number" required min="0.1" step="0.01" value={toitureData.perimetre}
                          onChange={e => setToitureData({...toitureData, perimetre: e.target.value})}
                          className="w-full px-4 py-3 border border-neutral-300 rounded-lg font-body focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                          placeholder="0.00" />
                      </div> */}
                      <div>
                        <label className="block text-sm font-heading font-medium text-neutral-700 mb-2">Hauteur acrotère (m) <span className="text-red-500">*</span> </label>
                        <input type="number" required min="0" step="0.01" value={toitureData.hauteur_acrotere}
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
                      {/* <div>
                        <label className="block text-sm font-heading font-medium text-neutral-700 mb-2">Chape de pente existante ?</label>
                        <select value={toitureData.chape_existante} onChange={e => setToitureData({...toitureData, chape_existante: e.target.value === 'true'})}
                          className="w-full px-4 py-3 border border-neutral-300 rounded-lg font-body focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all">
                          <option value="true">Oui</option>
                          <option value="false">Non</option>
                        </select>
                      </div> */}
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

            {/* ── STEP 2 (MUR): NIVEAU D'EAU ── */}
            {currentStep === 2 && selType === 'mur' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      Niveau d'humidité / infiltration
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Sélectionnez le type de problème d'eau sur votre mur
                    </p>
                    
                    <div className="grid gap-4">
                      {MUR_WATER_LEVELS.map((level) => (
                        <button
                          key={level.key}
                          onClick={() => setSelWaterLevel(level.key)}
                          className={`p-4 rounded-lg border-2 text-left transition-all hover:border-blue-400 ${
                            selWaterLevel === level.key
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 bg-white'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                selWaterLevel === level.key
                                  ? 'border-blue-500 bg-blue-500'
                                  : 'border-gray-300'
                              }`}
                            >
                              {selWaterLevel === level.key && (
                                <div className="w-2 h-2 bg-white rounded-full" />
                              )}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{level.label}</h4>
                              <p className="text-sm text-gray-600 mt-1">{level.desc}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between pt-6">
                    <button
                      onClick={() => setCurrentStep(1)}
                      className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Retour
                    </button>
                    <button
                      onClick={() => {
                        if (!selWaterLevel) {
                          toast.error('Veuillez sélectionner un niveau d\'eau');
                          return;
                        }
                        setCurrentStep(3);
                      }}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Suivant
                    </button>
                  </div>
                </div>
            )}

            
            {currentStep === 3 && selType === 'mur' && (
              <div className="bg-white border border-neutral-200 rounded-2xl p-8">
                <h2 className="font-heading text-2xl font-bold text-neutral-900 mb-2">
                  Détails du mur
                </h2>
                <p className="text-neutral-600 font-body mb-8">
                  Renseignez les dimensions de votre mur enterré
                </p>

                <form onSubmit={handleCalculate} className="space-y-6">
                  {/* Project info */}
                  <div>
                    <h3 className="font-heading font-semibold text-neutral-800 mb-4">
                      Informations du projet
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-heading font-medium text-neutral-700 mb-2">
                          Nom du projet
                        </label>
                        <input
                          type="text"
                          value={info.project_name}
                          onChange={(e) => setInfo({ ...info, project_name: e.target.value })}
                          className="w-full px-4 py-3 border border-neutral-300 rounded-lg font-body focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                          placeholder="Ex: Rénovation mur villa"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-heading font-medium text-neutral-700 mb-2">
                          Localisation
                        </label>
                        <CityAutocomplete
                          value={info.project_location}
                          onChange={(city) => setInfo({ ...info, project_location: city })}
                          placeholder="Ex: Casablanca"
                          className="w-full px-4 py-3 border border-neutral-300 rounded-lg font-body focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dimensions */}
                  <div>
                    <h3 className="font-heading font-semibold text-neutral-800 mb-4">
                      Dimensions du mur
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-heading font-medium text-neutral-700 mb-2">
                          Longueur du mur (m) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          required
                          min="0.1"
                          step="0.01"
                          value={standardData.longueur}
                          onChange={(e) =>
                            setStandardData({ ...standardData, longueur: e.target.value })
                          }
                          className="w-full px-4 py-3 border border-neutral-300 rounded-lg font-body focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                          placeholder="Ex: 10.00"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-heading font-medium text-neutral-700 mb-2">
                          Hauteur du mur (m) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          required
                          min="0.1"
                          step="0.01"
                          value={standardData.hauteur}
                          onChange={(e) =>
                            setStandardData({ ...standardData, hauteur: e.target.value })
                          }
                          className="w-full px-4 py-3 border border-neutral-300 rounded-lg font-body focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                          placeholder="Ex: 2.50"
                        />
                      </div>
                    </div>

                    {/* Surface calculation preview */}
                    {standardData.longueur && standardData.hauteur && (
                      <div className="mt-4 bg-primary-50 border border-primary-200 rounded-lg p-4">
                        <p className="text-sm text-neutral-700">
                          <span className="font-heading font-semibold">Surface estimée:</span>{' '}
                          {(
                            parseFloat(standardData.longueur) * parseFloat(standardData.hauteur)
                          ).toFixed(2)}{' '}
                          m²
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Drainage option */}
                  <div>
                    <h3 className="font-heading font-semibold text-neutral-800 mb-4">
                      Système de drainage
                    </h3>

                    {/* Show info if nappe (drainage mandatory) */}
                    {selWaterLevel === 'nappe' ? (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex gap-3">
                          <svg
                            className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <div>
                            <p className="font-heading font-semibold text-amber-900">
                              Drainage obligatoire
                            </p>
                            <p className="text-sm text-amber-700 mt-1 font-body">
                              Pour une nappe phréatique permanente, un système de drainage complet
                              (drain perforé + gravier + géotextile) est automatiquement inclus dans
                              le devis.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Show checkbox for other water levels
                      <div className="border border-neutral-200 rounded-lg p-4">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={drainSelected}
                            onChange={(e) => setDrainSelected(e.target.checked)}
                            className="mt-1 w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                          />
                          <div>
                            <span className="font-heading font-medium text-neutral-900">
                              Ajouter un système de drainage
                            </span>
                            <p className="text-sm text-neutral-600 mt-1 font-body">
                              Recommandé pour une meilleure évacuation de l'humidité et de l'eau.
                              Comprend: drain perforé, gravier drainant et géotextile.
                            </p>
                          </div>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-heading font-medium text-neutral-700 mb-2">
                      Notes
                    </label>
                    <textarea
                      value={info.notes}
                      onChange={(e) => setInfo({ ...info, notes: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg font-body focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                      placeholder="Informations complémentaires..."
                    />
                  </div>

                  {/* Navigation buttons */}
                  <div className="flex justify-between pt-4">
                    <button
                      type="button"
                      onClick={handlePrev}
                      className="inline-flex items-center px-6 py-3 border border-neutral-300 text-neutral-700 hover:bg-neutral-50 font-heading font-semibold rounded-lg transition-all"
                    >
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                      Précédent
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-heading font-semibold rounded-lg transition-all disabled:opacity-50 shadow-sm hover:shadow-md"
                    >
                      {loading ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Calcul en cours...
                        </>
                      ) : (
                        <>
                          Calculer le prix
                          <svg
                            className="w-5 h-5 ml-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {currentStep === 4 && selType === 'mur' && calculation && (
              <div className="space-y-6">
                {/* Back button to edit */}
                {/* <div className="bg-white border border-neutral-200 rounded-2xl p-4">
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="inline-flex items-center text-sm font-heading font-medium text-neutral-600 hover:text-primary-600 transition-colors"
                  >
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                    Modifier les informations
                  </button>
                </div> */}

                {/* Recap card */}
                {/* <div className="bg-white border border-neutral-200 rounded-2xl p-5">
                  <h3 className="font-heading text-lg font-bold text-neutral-900 mb-4">
                    Récapitulatif
                  </h3>
                  <div className="flex flex-wrap gap-6 text-sm">
                    <div>
                      <p className="text-xs text-neutral-500 font-body">Type</p>
                      <p className="font-heading font-semibold text-neutral-900">
                        Étanchéité Mur Enterré
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 font-body">Niveau d'eau</p>
                      <p className="font-heading font-semibold text-neutral-900">
                        {MUR_WATER_LEVELS.find((w) => w.key === selWaterLevel)?.label ||
                          selWaterLevel}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 font-body">Longueur</p>
                      <p className="font-heading font-semibold text-neutral-900">
                        {standardData.longueur} m
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 font-body">Hauteur</p>
                      <p className="font-heading font-semibold text-neutral-900">
                        {standardData.hauteur} m
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 font-body">Surface brute</p>
                      <p className="font-heading font-semibold text-neutral-900">
                        {calculation.surface_brute} m²
                      </p>
                    </div>
                    {calculation.hauteur_technique && (
                      <div>
                        <p className="text-xs text-neutral-500 font-body">Hauteur technique</p>
                        <p className="font-heading font-semibold text-neutral-900">
                          {calculation.hauteur_technique} m
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-neutral-500 font-body">Drainage</p>
                      <p className="font-heading font-semibold text-neutral-900">
                        {calculation.drain ? 'Oui' : 'Non'}
                      </p>
                    </div>
                    {info.project_location && (
                      <div>
                        <p className="text-xs text-neutral-500 font-body">Lieu</p>
                        <p className="font-heading font-semibold text-neutral-900">
                          {info.project_location}
                        </p>
                      </div>
                    )}
                  </div>
                </div> */}

                {/* Materials list */}
                {/* {calculation.materials?.length > 0 && (
                  <div className="bg-white border border-neutral-200 rounded-2xl p-6">
                    <h2 className="font-heading text-lg font-bold text-neutral-900 mb-4">
                      Liste des produits
                    </h2>
                    <div className="space-y-3">
                      {calculation.materials
                        .filter((_, idx) => !removedMaterials.has(idx))
                        .map((mat, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl group hover:bg-neutral-100 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-heading font-bold flex-shrink-0">
                                {i + 1}
                              </span>
                              <span className="font-body text-neutral-900 text-sm">
                                {mat.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-heading font-bold text-primary-500 text-sm">
                                {mat.quantity} {mat.unit}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setRemovedMaterials(new Set([...removedMaterials, i]))
                                }
                                className="p-1.5 rounded-lg bg-red-100 text-red-600 transition-all hover:bg-red-200"
                                title="Retirer ce produit"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )} */}

                {/* Price card */}
                {/* <div className="bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-2xl p-6">
                  <h2 className="font-heading text-xl font-bold mb-6">Estimation</h2>
                  <div className="space-y-3">
                    <div className="flex justify-between pb-3 border-b border-primary-400">
                      <span className="font-body">Prix estimé HT</span>
                      <span className="font-display font-bold">{fmt(calculation.total_ht || 0)}</span>
                    </div>
                    <div className="flex justify-between pb-3 border-b border-primary-400">
                      <span className="font-body">TVA (20%)</span>
                      <span className="font-display font-bold">
                        {fmt((calculation.total_ht || 0) * 0.2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-lg">
                      <span className="font-body font-bold">Total TTC</span>
                      <span className="font-display font-bold text-2xl">
                        {fmt((calculation.total_ht || 0) * 1.2)}
                      </span>
                    </div>
                  </div>
                </div> */}

                {/* Action buttons */}
                  {/* <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => setCurrentStep(3)}
                      disabled={loading}
                      className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-heading font-semibold rounded-lg transition-all disabled:opacity-50"
                    >
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                      Modifier les informations
                    </button>
                    <button
                      onClick={() => handleSave('saved')}
                      disabled={loading}
                      className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-heading font-semibold rounded-lg transition-all disabled:opacity-50 shadow-sm hover:shadow-md"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Sauvegarder le devis
                    </button>
                  </div> */}
              </div>
            )}

            {/* ── STEP 2 (SALLE DE BAIN): TYPE DOUCHE ── */}
            {currentStep === 2 && selType === 'salle_bain' && (
              <div className="bg-white border border-neutral-200 rounded-2xl p-8">
                <h2 className="font-heading text-2xl font-bold text-neutral-900 mb-2">Type de douche</h2>
                <p className="text-neutral-600 font-body mb-8">Quel type de douche souhaitez-vous étanchéifier ?</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {SALLE_BAIN_TYPES.map(type => (
                    <button
                      key={type.key}
                      onClick={() => setSelSdbType(type.key)}
                      className={`group bg-white border-2 rounded-2xl p-6 text-left transition-all hover:shadow-sm ${
                        selSdbType === type.key
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

            {/* ── STEP 3 (MUR): DETAILS FORM ── */}
            {currentStep === 3 && selType === 'salle_bain' && (
              <div className="bg-white border border-neutral-200 rounded-2xl p-8">
                <h2 className="font-heading text-2xl font-bold text-neutral-900 mb-2">Détails du projet</h2>
                <p className="text-neutral-600 font-body mb-8">
                  {selSdbType === 'avec_bac'
                    ? 'Renseignez les dimensions de la pièce et du bac'
                    : 'Renseignez les dimensions de la pièce et de la zone douche'}
                </p>

                <form onSubmit={handleCalculate} className="space-y-6">
                  {/* Project info (same as before) */}
                  <div>
                    <h3 className="font-heading font-semibold text-neutral-800 mb-4">Informations du projet</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-heading font-medium text-neutral-700 mb-2">Nom du projet</label>
                        <input type="text" value={info.project_name} onChange={e => setInfo({...info, project_name: e.target.value})}
                          className="w-full px-4 py-3 border border-neutral-300 rounded-lg font-body focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                          placeholder="Ex: Rénovation salle de bain" />
                      </div>
                      <div>
                        <label className="block text-sm font-heading font-medium text-neutral-700 mb-2">Localisation</label>
                        <CityAutocomplete
                          value={info.project_location}
                          onChange={(city) => setInfo({...info, project_location: city})}
                          placeholder="Ex: Casablanca"
                          className="w-full px-4 py-3 border border-neutral-300 rounded-lg font-body focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Support type */}
                  <div>
                    <h3 className="font-heading font-semibold text-neutral-800 mb-4">Type de support</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setSdbData(prev => ({ ...prev, support: 'ciment' }))}
                        className={`group bg-white border-2 rounded-2xl p-4 text-left transition-all hover:shadow-sm ${
                          sdbData.support === 'ciment'
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-neutral-200 hover:border-primary-300'
                        }`}>
                        <h4 className="font-heading font-bold text-base text-neutral-900 mb-1">Chape ciment</h4>
                        <p className="text-sm text-neutral-600 font-body">Support absorbant</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSdbData(prev => ({ ...prev, support: 'carrelage' }))}
                        className={`group bg-white border-2 rounded-2xl p-4 text-left transition-all hover:shadow-sm ${
                          sdbData.support === 'carrelage'
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-neutral-200 hover:border-primary-300'
                        }`}>
                        <h4 className="font-heading font-bold text-base text-neutral-900 mb-1">Ancien carrelage</h4>
                        <p className="text-sm text-neutral-600 font-body">Support lisse</p>
                      </button>
                    </div>
                  </div>

                  {/* Fields for avec_bac */}
                  {selSdbType === 'avec_bac' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-heading font-medium text-neutral-700 mb-2">Surface sol totale (m²) <span className="text-red-500">*</span></label>
                          <input type="number" required min="0.1" step="0.01" value={sdbData.surface_sol_totale}
                            onChange={e => setSdbData({...sdbData, surface_sol_totale: e.target.value})}
                            className="w-full px-4 py-3 border border-neutral-300 rounded-lg font-body focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                            placeholder="0.00" />
                        </div>
                        <div>
                          <label className="block text-sm font-heading font-medium text-neutral-700 mb-2">Surface bac de douche (m²) (optionnel)</label>
                          <input type="number" min="0" step="0.01" value={sdbData.surface_bac}
                            onChange={e => setSdbData({...sdbData, surface_bac: e.target.value})}
                            className="w-full px-4 py-3 border border-neutral-300 rounded-lg font-body focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                            placeholder="0.00" />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-heading font-medium text-neutral-700 mb-2">Longueur murs douche  (ml) <span className="text-red-500">*</span></label>
                          <input type="number" required min="0.1" step="0.01" value={sdbData.longueur_murs_douche}
                            onChange={e => setSdbData({...sdbData, longueur_murs_douche: e.target.value})}
                            className="w-full px-4 py-3 border border-neutral-300 rounded-lg font-body focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                            placeholder="0.00" />
                        </div>
                        <div>
                          <label className="block text-sm font-heading font-medium text-neutral-700 mb-2">Largeur murs douche  (ml) <span className="text-red-500">*</span></label>
                          <input type="number" required min="0.1" step="0.01" value={sdbData.largeur_murs_douche}
                            onChange={e => setSdbData({...sdbData, largeur_murs_douche: e.target.value})}
                            className="w-full px-4 py-3 border border-neutral-300 rounded-lg font-body focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                            placeholder="0.00" />
                        </div>
                        <div>
                          <label className="block text-sm font-heading font-medium text-neutral-700 mb-2">Hauteur murs douche (m) <span className="text-red-500">*</span></label>
                          <input type="number" required min="0.1" step="0.01" value={sdbData.hauteur_murs_douche}
                            onChange={e => setSdbData({...sdbData, hauteur_murs_douche: e.target.value})}
                            className="w-full px-4 py-3 border border-neutral-300 rounded-lg font-body focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                            placeholder="0.00" />
                        </div>
                      </div>
                      <h3 className="font-heading font-semibold text-neutral-800 mt-4 mb-2">Murs de la pièce</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-heading font-medium text-neutral-700 mb-2">Longueur murs pièce (ml) <span className="text-red-500">*</span></label>
                          <input type="number" required min="0.1" step="0.01" value={sdbData.longueur_murs_piece}
                            onChange={e => setSdbData({...sdbData, longueur_murs_piece: e.target.value})}
                            className="w-full px-4 py-3 border border-neutral-300 rounded-lg font-body focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                            placeholder="0.00" />
                        </div>
                        <div>
                          <label className="block text-sm font-heading font-medium text-neutral-700 mb-2">Largeur murs pièce (ml) <span className="text-red-500">*</span></label>
                          <input type="number" required min="0.1" step="0.01" value={sdbData.largeur_murs_piece}
                            onChange={e => setSdbData({...sdbData, largeur_murs_piece: e.target.value})}
                            className="w-full px-4 py-3 border border-neutral-300 rounded-lg font-body focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                            placeholder="0.00" />
                        </div>
                        <div>
                          <label className="block text-sm font-heading font-medium text-neutral-700 mb-2">Hauteur murs pièce  (m) <span className="text-red-500">*</span></label>
                          <input type="number" required min="0.1" step="0.01" value={sdbData.hauteur_murs_piece}
                            onChange={e => setSdbData({...sdbData, hauteur_murs_piece: e.target.value})}
                            className="w-full px-4 py-3 border border-neutral-300 rounded-lg font-body focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                            placeholder="0.00" />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Fields for italienne */}
                  {selSdbType === 'italienne' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-heading font-medium text-neutral-700 mb-2">Surface sol totale (m²) <span className="text-red-500">*</span></label>
                          <input type="number" required min="0.1" step="0.01" value={sdbData.surface_sol_totale}
                            onChange={e => setSdbData({...sdbData, surface_sol_totale: e.target.value})}
                            className="w-full px-4 py-3 border border-neutral-300 rounded-lg font-body focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                            placeholder="0.00" />
                        </div>
                        <div>
                          <label className="block text-sm font-heading font-medium text-neutral-700 mb-2">Surface zone douche (m²) <span className="text-red-500">*</span></label>
                          <input type="number" required min="0.1" step="0.01" value={sdbData.surface_zone_douche}
                            onChange={e => setSdbData({...sdbData, surface_zone_douche: e.target.value})}
                            className="w-full px-4 py-3 border border-neutral-300 rounded-lg font-body focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                            placeholder="0.00" />
                        </div>
                      </div>

                      <h3 className="font-heading font-semibold text-neutral-800 mt-4 mb-2">Murs de la zone douche</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-heading font-medium text-neutral-700 mb-2">Longueur (ml) <span className="text-red-500">*</span></label>
                          <input type="number" required min="0.1" step="0.01" value={sdbData.longueur_murs_douche}
                            onChange={e => setSdbData({...sdbData, longueur_murs_douche: e.target.value})}
                            className="w-full px-4 py-3 border border-neutral-300 rounded-lg font-body focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                            placeholder="0.00" />
                        </div>
                        <div>
                          <label className="block text-sm font-heading font-medium text-neutral-700 mb-2">Largeur (ml) <span className="text-red-500">*</span></label>
                          <input type="number" required min="0.1" step="0.01" value={sdbData.largeur_murs_douche}
                            onChange={e => setSdbData({...sdbData, largeur_murs_douche: e.target.value})}
                            className="w-full px-4 py-3 border border-neutral-300 rounded-lg font-body focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                            placeholder="0.00" />
                        </div>
                        <div>
                          <label className="block text-sm font-heading font-medium text-neutral-700 mb-2">Hauteur murs douche (m) <span className="text-red-500">*</span></label>
                          <input type="number" required min="0.1" step="0.01" value={sdbData.hauteur_murs_douche}
                            onChange={e => setSdbData({...sdbData, hauteur_murs_douche: e.target.value})}
                            className="w-full px-4 py-3 border border-neutral-300 rounded-lg font-body focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                            placeholder="0.00" />
                        </div>
                      </div>

                      <h3 className="font-heading font-semibold text-neutral-800 mt-4 mb-2">Murs de la pièce</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-heading font-medium text-neutral-700 mb-2">Longueur (ml) <span className="text-red-500">*</span></label>
                          <input type="number" required min="0.1" step="0.01" value={sdbData.longueur_murs_piece}
                            onChange={e => setSdbData({...sdbData, longueur_murs_piece: e.target.value})}
                            className="w-full px-4 py-3 border border-neutral-300 rounded-lg font-body focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                            placeholder="0.00" />
                        </div>
                        <div>
                          <label className="block text-sm font-heading font-medium text-neutral-700 mb-2">Largeur (ml) <span className="text-red-500">*</span></label>
                          <input type="number" required min="0.1" step="0.01" value={sdbData.largeur_murs_piece}
                            onChange={e => setSdbData({...sdbData, largeur_murs_piece: e.target.value})}
                            className="w-full px-4 py-3 border border-neutral-300 rounded-lg font-body focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                            placeholder="0.00" />
                        </div>
                        <div>
                          <label className="block text-sm font-heading font-medium text-neutral-700 mb-2">Hauteur (m) <span className="text-red-500">*</span></label>
                          <input type="number" required min="0.1" step="0.01" value={sdbData.hauteur_murs_piece}
                            onChange={e => setSdbData({...sdbData, hauteur_murs_piece: e.target.value})}
                            className="w-full px-4 py-3 border border-neutral-300 rounded-lg font-body focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                            placeholder="0.00" />
                        </div>
                      </div>
                    </>
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


            {/* ── SUMMARY STEP ── */}
            {calculation && ((currentStep === 5 && selType === 'toiture') || (currentStep === 4 && selType !== 'toiture')) && (
              <div className="space-y-6">
                {/* Back button to edit */}
                {/* <div className="bg-white border border-neutral-200 rounded-2xl p-4">
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
                </div> */}

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
                              className="p-1.5 rounded-lg bg-red-100 text-neutral-400 text-red-600 transition-all"
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
                  <button onClick={() => {
                      if (selType === 'toiture') {
                        setCurrentStep(4); // Go back to details form
                      } else {
                        setCurrentStep(3); // Go back to details form
                      }
                    }} disabled={loading}
                    className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-heading font-semibold rounded-lg transition-all disabled:opacity-50">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Modifier les informations
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