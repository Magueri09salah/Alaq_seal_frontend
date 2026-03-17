import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { estimatorAPI } from '../services/api';
import toast from 'react-hot-toast';
import Navbar from '../components/layout/Navbar';
import CityAutocomplete from '../components/common/CityAutocomplete';

// ─── Constants ───────────────────────────────────────────────────────────────

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

const TOITURE_TYPES = [
  { key: 'non_accessible', label: 'Non accessible', description: 'Toiture technique non accessible' },
  { key: 'accessible', label: 'Accessible', description: 'Toiture-terrasse accessible aux piétons' },
];

const TOITURE_FINITIONS = [
  { key: 'autoprotegee', label: 'Autoprotégée ardoisée', description: 'Finition directe ardoisée' },
  { key: 'lestage', label: 'Finition lisse + Lestage', description: 'Géotextile + Gravier 5cm' },
];

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

const SALLE_BAIN_TYPES = [
  { key: 'avec_bac', label: 'Douche avec bac', description: 'Étanchéité standard avec receveur' },
  { key: 'italienne', label: 'Douche italienne (sans bac)', description: 'Étanchéité renforcée zone douche' },
];

const fmt = (p) => new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', minimumFractionDigits: 0 }).format(p);

// ─── Main Component ───────────────────────────────────────────────────────────
export default function EstimatorWizard() {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [selType, setSelType] = useState(null);
  const [selToitureType, setSelToitureType] = useState(null);
  const [selIsolation, setSelIsolation] = useState(null);
  const [selFinition, setSelFinition] = useState(null);
  const [calculation, setCalculation] = useState(null);
  const [removedMaterials, setRemovedMaterials] = useState(new Set());

  const [selWaterLevel, setSelWaterLevel] = useState(null);
  const [selSdbType, setSelSdbType] = useState(null);
  const [drainSelected, setDrainSelected] = useState(false);

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

  const [toitureData, setToitureData] = useState({
    longueur: '',
    largeur: '',
    hauteur_acrotere: '',
    nombre_evacuations: '1',
    chape_existante: true,
  });

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
        { id: 2, label: 'Niveau d\'eau' },
        { id: 3, label: 'Détails' },
        { id: 4, label: 'Résumé' },
      ];
    } else if (selType === 'salle_bain') {
      return [
        { id: 1, label: 'Type' },
        { id: 2, label: 'Type douche' },
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

  const canGoNext = () => {
    if (currentStep === 1) return !!selType;
    if (selType === 'toiture') {
      if (currentStep === 2) return !!selToitureType;
      if (currentStep === 3) return selIsolation !== null;
    }
    if (selType === 'mur') {
      if (currentStep === 2) return !!selWaterLevel;
    }
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
          if (!sdbData.surface_zone_douche) {
            toast.error('Veuillez remplir la surface de la zone douche');
            return;
          }
        }

        const cleanNumeric = (value) => {
          if (value === '' || value === null || value === undefined) return undefined;
          const num = parseFloat(value);
          return isNaN(num) ? undefined : num;
        };

        payload = {
          type: 'salle_bain',
          sdb_type: selSdbType,
          support: sdbData.support,
          surface_sol_totale: cleanNumeric(sdbData.surface_sol_totale),
          ...(sdbData.surface_bac && { surface_bac: cleanNumeric(sdbData.surface_bac) }),
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
      
      if (selType === 'toiture') {
        setCurrentStep(5);
      } else if (selType === 'mur' || selType === 'salle_bain') {
        setCurrentStep(4);
      }
      
    } catch (error) {
      console.error('Calculate error:', error);
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
        payload.sdb_type = selSdbType;
        payload.support = sdbData.support;
        payload.salle_bain_data = {
          sdb_type: selSdbType,
          support: sdbData.support,
          surface_sol_totale: sdbData.surface_sol_totale,
          surface_bac: sdbData.surface_bac || null,
          surface_zone_douche: sdbData.surface_zone_douche || null,
          longueur_murs_douche: sdbData.longueur_murs_douche || null,
          largeur_murs_douche: sdbData.largeur_murs_douche || null,
          hauteur_murs_douche: sdbData.hauteur_murs_douche || null,
          longueur_murs_piece: sdbData.longueur_murs_piece || null,
          largeur_murs_piece: sdbData.largeur_murs_piece || null,
          hauteur_murs_piece: sdbData.hauteur_murs_piece || null,
        };
        payload.longueur = Math.sqrt(parseFloat(sdbData.surface_sol_totale) || 0);
        payload.largeur = Math.sqrt(parseFloat(sdbData.surface_sol_totale) || 0);
      }

      const r = await estimatorAPI.createToitureDevis(payload);
      toast.success('Devis créé avec succès!');
      navigate(`/toiture/devis/${r.data.data.id}`);
    } catch (error) {
      console.error('Save error:', error);
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

  // ── Shared navigation buttons component ──
  const NavButtons = ({ onPrev, onNext, nextLabel, nextDisabled, isSubmit, showPrev = true }) => (
    <div className="flex justify-between pt-4 gap-3">
      {showPrev ? (
        <button type="button" onClick={onPrev}
          className="inline-flex items-center px-4 sm:px-6 py-2.5 sm:py-3 border border-neutral-300 text-neutral-700 hover:bg-neutral-50 font-heading font-semibold rounded-lg transition-all text-sm sm:text-base">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Précédent
        </button>
      ) : <div />}
      <button type={isSubmit ? 'submit' : 'button'} onClick={!isSubmit ? onNext : undefined}
        disabled={nextDisabled || loading}
        className="inline-flex items-center px-4 sm:px-6 py-2.5 sm:py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-neutral-300 text-white font-heading font-semibold rounded-lg transition-all disabled:cursor-not-allowed text-sm sm:text-base shadow-sm hover:shadow-md">
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Calcul en cours...
          </>
        ) : (
          <>
            {nextLabel || 'Suivant'}
            <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-1.5 sm:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </>
        )}
      </button>
    </div>
  );

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-neutral-50">
        {/* Header */}
        <div>
          <div className="container mx-auto px-4 sm:px-6 lg:px-16 py-6 sm:py-8">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-neutral-900">Créer un Devis</h1>
            <p className="text-neutral-600 mt-1 font-body text-sm sm:text-base">Suivez les étapes pour générer votre estimation</p>
          </div>
        </div>

        {/* Progress */}
        <div className="bg-white border-b border-neutral-200">
          <div className="container mx-auto px-4 sm:px-6 lg:px-16 py-4 sm:py-5">
            <div className="flex items-center max-w-3xl mx-auto">
              {steps.map((step, idx) => {
                const done = uiIdx > idx + 1;
                const active = uiIdx === idx + 1;
                return (
                  <div key={step.id} className="flex items-center flex-1">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-heading font-bold text-xs sm:text-sm transition-all ${done ? 'bg-primary-500 text-white' : active ? 'bg-primary-500 text-white ring-4 ring-primary-100' : 'bg-neutral-200 text-neutral-500'}`}>
                        {done ? <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg> : idx + 1}
                      </div>
                      <span className={`text-[10px] sm:text-xs mt-1 sm:mt-1.5 font-body font-medium text-center leading-tight ${active ? 'text-primary-500' : 'text-neutral-400'}`}>{step.label}</span>
                    </div>
                    {idx < steps.length - 1 && <div className={`flex-1 h-0.5 mx-1.5 sm:mx-2 ${done ? 'bg-primary-500' : 'bg-neutral-200'}`} />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-16 py-6 sm:py-8">
          <div className="max-w-4xl mx-auto">

            {/* ── STEP 1: TYPE D'ÉTANCHÉITÉ ── */}
            {currentStep === 1 && (
              <div className="bg-white border border-neutral-200 rounded-2xl p-5 sm:p-8">
                <h2 className="font-heading text-xl sm:text-2xl font-bold text-neutral-900 mb-1 sm:mb-2">Quel type d'étanchéité ?</h2>
                <p className="text-neutral-600 font-body mb-6 sm:mb-8 text-sm sm:text-base">Sélectionnez le type de travaux pour votre projet</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
                  {ETANCHEITE_TYPES.map(type => (
                    <button
                      key={type.key}
                      onClick={() => setSelType(type.key)}
                      className={`group bg-white border-2 rounded-2xl p-4 sm:p-6 text-center transition-all hover:shadow-sm ${
                        selType === type.key
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-neutral-200 hover:border-primary-300'
                      }`}>
                      <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4 transition-colors ${
                        selType === type.key ? 'bg-primary-200' : 'bg-primary-100 group-hover:bg-primary-200'
                      }`}>
                        <svg className="w-6 h-6 sm:w-8 sm:h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={type.icon} />
                        </svg>
                      </div>
                      <h3 className="font-heading font-bold text-base sm:text-lg text-neutral-900 mb-1 sm:mb-2">{type.label}</h3>
                      <p className="text-xs sm:text-sm text-neutral-600 font-body">{type.description}</p>
                    </button>
                  ))}
                </div>

                <div className="flex justify-end">
                  <NavButtons showPrev={false} onNext={handleNext} nextDisabled={!canGoNext()} />
                </div>
              </div>
            )}

            {/* ── STEP 2 (TOITURE): TYPE DE TOITURE ── */}
            {currentStep === 2 && selType === 'toiture' && (
              <div className="bg-white border border-neutral-200 rounded-2xl p-5 sm:p-8">
                <h2 className="font-heading text-xl sm:text-2xl font-bold text-neutral-900 mb-1 sm:mb-2">Type de toiture</h2>
                <p className="text-neutral-600 font-body mb-6 sm:mb-8 text-sm sm:text-base">La toiture sera-t-elle accessible ?</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
                  {TOITURE_TYPES.map(type => (
                    <button
                      key={type.key}
                      onClick={() => setSelToitureType(type.key)}
                      className={`group bg-white border-2 rounded-2xl p-4 sm:p-6 text-left transition-all hover:shadow-sm ${
                        selToitureType === type.key
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-neutral-200 hover:border-primary-300'
                      }`}>
                      <h3 className="font-heading font-bold text-base sm:text-lg text-neutral-900 mb-1 sm:mb-2">{type.label}</h3>
                      <p className="text-xs sm:text-sm text-neutral-600 font-body">{type.description}</p>
                    </button>
                  ))}
                </div>

                <NavButtons onPrev={handlePrev} onNext={handleNext} nextDisabled={!canGoNext()} />
              </div>
            )}

            {/* ── STEP 3 (TOITURE): ISOLATION ── */}
            {currentStep === 3 && selType === 'toiture' && (
              <div className="bg-white border border-neutral-200 rounded-2xl p-5 sm:p-8">
                <h2 className="font-heading text-xl sm:text-2xl font-bold text-neutral-900 mb-1 sm:mb-2">Isolation thermique</h2>
                <p className="text-neutral-600 font-body mb-6 sm:mb-8 text-sm sm:text-base">Souhaitez-vous une isolation thermique ? (Toiture chaude)</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
                  <button
                    onClick={() => setSelIsolation(true)}
                    className={`group bg-white border-2 rounded-2xl p-4 sm:p-6 text-left transition-all hover:shadow-sm ${
                      selIsolation === true
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-neutral-200 hover:border-primary-300'
                    }`}>
                    <h3 className="font-heading font-bold text-base sm:text-lg text-neutral-900 mb-1 sm:mb-2">Oui (Toiture chaude)</h3>
                    <p className="text-xs sm:text-sm text-neutral-600 font-body">Avec isolation thermique</p>
                  </button>
                  <button
                    onClick={() => setSelIsolation(false)}
                    className={`group bg-white border-2 rounded-2xl p-4 sm:p-6 text-left transition-all hover:shadow-sm ${
                      selIsolation === false
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-neutral-200 hover:border-primary-300'
                    }`}>
                    <h3 className="font-heading font-bold text-base sm:text-lg text-neutral-900 mb-1 sm:mb-2">Non</h3>
                    <p className="text-xs sm:text-sm text-neutral-600 font-body">Sans isolation thermique</p>
                  </button>
                </div>

                <NavButtons onPrev={handlePrev} onNext={handleNext} nextDisabled={!canGoNext()} />
              </div>
            )}

            {/* ── STEP 4: DETAILS FORM (TOITURE) ── */}
            {currentStep === 4 && selType === 'toiture' && (
              <div className="bg-white border border-neutral-200 rounded-2xl p-5 sm:p-8">
                <h2 className="font-heading text-xl sm:text-2xl font-bold text-neutral-900 mb-1 sm:mb-2">Informations techniques</h2>
                <p className="text-neutral-600 font-body mb-6 sm:mb-8 text-sm sm:text-base">Renseignez les dimensions de votre toiture</p>

                <form onSubmit={handleCalculate} className="space-y-5 sm:space-y-6">
                  {/* Project info */}
                  <div>
                    <h3 className="font-heading font-semibold text-neutral-800 mb-3 sm:mb-4 text-sm sm:text-base">Informations du projet</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-heading font-medium text-neutral-700 mb-1.5 sm:mb-2">Nom du projet</label>
                        <input type="text" value={info.project_name} onChange={e => setInfo({...info, project_name: e.target.value})}
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-neutral-300 rounded-lg font-body text-sm sm:text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                          placeholder="Ex: Rénovation toiture villa" />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-heading font-medium text-neutral-700 mb-1.5 sm:mb-2">Localisation</label>
                        <CityAutocomplete
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-neutral-300 rounded-lg font-body text-sm sm:text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                          value={info.project_location}
                          onChange={(city) => setInfo({...info, project_location: city})}
                          placeholder="Ex: Casablanca"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dimensions */}
                  <div>
                    <h3 className="font-heading font-semibold text-neutral-800 mb-3 sm:mb-4 text-sm sm:text-base">Dimensions</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-heading font-medium text-neutral-700 mb-1.5 sm:mb-2">Longueur (m) <span className="text-red-500">*</span></label>
                        <input type="number" required min="0.1" step="0.01" value={toitureData.longueur}
                          onChange={e => setToitureData({...toitureData, longueur: e.target.value})}
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-neutral-300 rounded-lg font-body text-sm sm:text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                          placeholder="0.00" />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-heading font-medium text-neutral-700 mb-1.5 sm:mb-2">Largeur (m) <span className="text-red-500">*</span></label>
                        <input type="number" required min="0.1" step="0.01" value={toitureData.largeur}
                          onChange={e => setToitureData({...toitureData, largeur: e.target.value})}
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-neutral-300 rounded-lg font-body text-sm sm:text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                          placeholder="0.00" />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-xs sm:text-sm font-heading font-medium text-neutral-700 mb-1.5 sm:mb-2">Hauteur acrotère (m) <span className="text-red-500">*</span></label>
                        <input type="number" required min="0" step="0.01" value={toitureData.hauteur_acrotere}
                          onChange={e => setToitureData({...toitureData, hauteur_acrotere: e.target.value})}
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-neutral-300 rounded-lg font-body text-sm sm:text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                          placeholder="0.00" />
                      </div>
                    </div>
                  </div>

                  {/* Options */}
                  <div>
                    <h3 className="font-heading font-semibold text-neutral-800 mb-3 sm:mb-4 text-sm sm:text-base">Options</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-heading font-medium text-neutral-700 mb-1.5 sm:mb-2">Nombre d'évacuations</label>
                        <input type="number" min="1" value={toitureData.nombre_evacuations}
                          onChange={e => setToitureData({...toitureData, nombre_evacuations: e.target.value})}
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-neutral-300 rounded-lg font-body text-sm sm:text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
                      </div>
                    </div>
                  </div>

                  {/* Finition (only for non-accessible) */}
                  {selToitureType === 'non_accessible' && (
                    <div>
                      <h3 className="font-heading font-semibold text-neutral-800 mb-3 sm:mb-4 text-sm sm:text-base">Choix de finition</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        {TOITURE_FINITIONS.map(fin => (
                          <button
                            key={fin.key}
                            type="button"
                            onClick={() => setSelFinition(fin.key)}
                            className={`group bg-white border-2 rounded-2xl p-3 sm:p-4 text-left transition-all hover:shadow-sm ${
                              selFinition === fin.key
                                ? 'border-primary-500 bg-primary-50'
                                : 'border-neutral-200 hover:border-primary-300'
                            }`}>
                            <h4 className="font-heading font-bold text-sm sm:text-base text-neutral-900 mb-0.5 sm:mb-1">{fin.label}</h4>
                            <p className="text-xs sm:text-sm text-neutral-600 font-body">{fin.description}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <label className="block text-xs sm:text-sm font-heading font-medium text-neutral-700 mb-1.5 sm:mb-2">Notes</label>
                    <textarea value={info.notes} onChange={e => setInfo({...info, notes: e.target.value})} rows={3}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-neutral-300 rounded-lg font-body text-sm sm:text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                      placeholder="Informations complémentaires..." />
                  </div>

                  <NavButtons onPrev={handlePrev} nextLabel="Calculer le prix" isSubmit />
                </form>
              </div>
            )}

            {/* ── STEP 2 (MUR): NIVEAU D'EAU ── */}
            {currentStep === 2 && selType === 'mur' && (
              <div className="bg-white border border-neutral-200 rounded-2xl p-5 sm:p-8">
                <h2 className="font-heading text-xl sm:text-2xl font-bold text-neutral-900 mb-1 sm:mb-2">
                  Niveau d'humidité / infiltration
                </h2>
                <p className="text-neutral-600 font-body mb-6 sm:mb-8 text-sm sm:text-base">
                  Sélectionnez le type de problème d'eau sur votre mur
                </p>
                
                <div className="grid gap-3 sm:gap-4 mb-6 sm:mb-8">
                  {MUR_WATER_LEVELS.map((level) => (
                    <button
                      key={level.key}
                      onClick={() => setSelWaterLevel(level.key)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all hover:shadow-sm ${
                        selWaterLevel === level.key
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-neutral-200 bg-white hover:border-primary-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            selWaterLevel === level.key
                              ? 'border-primary-500 bg-primary-500'
                              : 'border-neutral-300'
                          }`}
                        >
                          {selWaterLevel === level.key && (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-heading font-bold text-sm sm:text-base text-neutral-900">{level.label}</h4>
                          <p className="text-xs sm:text-sm text-neutral-600 mt-0.5 sm:mt-1 font-body">{level.desc}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <NavButtons onPrev={handlePrev} onNext={() => {
                  if (!selWaterLevel) {
                    toast.error('Veuillez sélectionner un niveau d\'eau');
                    return;
                  }
                  setCurrentStep(3);
                }} nextDisabled={!selWaterLevel} />
              </div>
            )}

            {/* ── STEP 3 (MUR): DETAILS FORM ── */}
            {currentStep === 3 && selType === 'mur' && (
              <div className="bg-white border border-neutral-200 rounded-2xl p-5 sm:p-8">
                <h2 className="font-heading text-xl sm:text-2xl font-bold text-neutral-900 mb-1 sm:mb-2">
                  Détails du mur
                </h2>
                <p className="text-neutral-600 font-body mb-6 sm:mb-8 text-sm sm:text-base">
                  Renseignez les dimensions de votre mur enterré
                </p>

                <form onSubmit={handleCalculate} className="space-y-5 sm:space-y-6">
                  {/* Project info */}
                  <div>
                    <h3 className="font-heading font-semibold text-neutral-800 mb-3 sm:mb-4 text-sm sm:text-base">
                      Informations du projet
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-heading font-medium text-neutral-700 mb-1.5 sm:mb-2">
                          Nom du projet
                        </label>
                        <input
                          type="text"
                          value={info.project_name}
                          onChange={(e) => setInfo({ ...info, project_name: e.target.value })}
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-neutral-300 rounded-lg font-body text-sm sm:text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                          placeholder="Ex: Rénovation mur villa"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-heading font-medium text-neutral-700 mb-1.5 sm:mb-2">
                          Localisation
                        </label>
                        <CityAutocomplete
                          value={info.project_location}
                          onChange={(city) => setInfo({ ...info, project_location: city })}
                          placeholder="Ex: Casablanca"
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-neutral-300 rounded-lg font-body text-sm sm:text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dimensions */}
                  <div>
                    <h3 className="font-heading font-semibold text-neutral-800 mb-3 sm:mb-4 text-sm sm:text-base">
                      Dimensions du mur
                    </h3>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-heading font-medium text-neutral-700 mb-1.5 sm:mb-2">
                          Longueur (m) <span className="text-red-500">*</span>
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
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-neutral-300 rounded-lg font-body text-sm sm:text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                          placeholder="Ex: 10.00"
                        />
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-heading font-medium text-neutral-700 mb-1.5 sm:mb-2">
                          Hauteur (m) <span className="text-red-500">*</span>
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
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-neutral-300 rounded-lg font-body text-sm sm:text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                          placeholder="Ex: 2.50"
                        />
                      </div>
                    </div>

                    {standardData.longueur && standardData.hauteur && (
                      <div className="mt-3 sm:mt-4 bg-primary-50 border border-primary-200 rounded-lg p-3 sm:p-4">
                        <p className="text-xs sm:text-sm text-neutral-700">
                          <span className="font-heading font-semibold">Surface estimée:</span>{' '}
                          {(parseFloat(standardData.longueur) * parseFloat(standardData.hauteur)).toFixed(2)} m²
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Drainage option */}
                  <div>
                    <h3 className="font-heading font-semibold text-neutral-800 mb-3 sm:mb-4 text-sm sm:text-base">
                      Système de drainage
                    </h3>

                    {selWaterLevel === 'nappe' ? (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4">
                        <div className="flex gap-2.5 sm:gap-3">
                          <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <div>
                            <p className="font-heading font-semibold text-amber-900 text-sm sm:text-base">
                              Drainage obligatoire
                            </p>
                            <p className="text-xs sm:text-sm text-amber-700 mt-1 font-body">
                              Pour une nappe phréatique permanente, un système de drainage complet est automatiquement inclus dans le devis.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="border border-neutral-200 rounded-lg p-3 sm:p-4">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={drainSelected}
                            onChange={(e) => setDrainSelected(e.target.checked)}
                            className="mt-0.5 sm:mt-1 w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                          />
                          <div>
                            <span className="font-heading font-medium text-neutral-900 text-sm sm:text-base">
                              Ajouter un système de drainage
                            </span>
                            <p className="text-xs sm:text-sm text-neutral-600 mt-1 font-body">
                              Recommandé pour une meilleure évacuation de l'humidité et de l'eau.
                            </p>
                          </div>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs sm:text-sm font-heading font-medium text-neutral-700 mb-1.5 sm:mb-2">
                      Notes
                    </label>
                    <textarea
                      value={info.notes}
                      onChange={(e) => setInfo({ ...info, notes: e.target.value })}
                      rows={3}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-neutral-300 rounded-lg font-body text-sm sm:text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                      placeholder="Informations complémentaires..."
                    />
                  </div>

                  <NavButtons onPrev={handlePrev} nextLabel="Calculer le prix" isSubmit />
                </form>
              </div>
            )}

            {/* ── STEP 2 (SALLE DE BAIN): TYPE DOUCHE ── */}
            {currentStep === 2 && selType === 'salle_bain' && (
              <div className="bg-white border border-neutral-200 rounded-2xl p-5 sm:p-8">
                <h2 className="font-heading text-xl sm:text-2xl font-bold text-neutral-900 mb-1 sm:mb-2">Type de douche</h2>
                <p className="text-neutral-600 font-body mb-6 sm:mb-8 text-sm sm:text-base">Quel type de douche souhaitez-vous étanchéifier ?</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
                  {SALLE_BAIN_TYPES.map(type => (
                    <button
                      key={type.key}
                      onClick={() => setSelSdbType(type.key)}
                      className={`group bg-white border-2 rounded-2xl p-4 sm:p-6 text-left transition-all hover:shadow-sm ${
                        selSdbType === type.key
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-neutral-200 hover:border-primary-300'
                      }`}>
                      <h3 className="font-heading font-bold text-base sm:text-lg text-neutral-900 mb-1 sm:mb-2">{type.label}</h3>
                      <p className="text-xs sm:text-sm text-neutral-600 font-body">{type.description}</p>
                    </button>
                  ))}
                </div>

                <NavButtons onPrev={handlePrev} onNext={handleNext} nextDisabled={!canGoNext()} />
              </div>
            )}

            {/* ── STEP 3 (SALLE DE BAIN): DETAILS FORM ── */}
            {currentStep === 3 && selType === 'salle_bain' && (
              <div className="bg-white border border-neutral-200 rounded-2xl p-5 sm:p-8">
                <h2 className="font-heading text-xl sm:text-2xl font-bold text-neutral-900 mb-1 sm:mb-2">Détails du projet</h2>
                <p className="text-neutral-600 font-body mb-6 sm:mb-8 text-sm sm:text-base">
                  {selSdbType === 'avec_bac'
                    ? 'Renseignez les dimensions de la pièce et du bac'
                    : 'Renseignez les dimensions de la pièce et de la zone douche'}
                </p>

                <form onSubmit={handleCalculate} className="space-y-5 sm:space-y-6">
                  {/* Project info */}
                  <div>
                    <h3 className="font-heading font-semibold text-neutral-800 mb-3 sm:mb-4 text-sm sm:text-base">Informations du projet</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-heading font-medium text-neutral-700 mb-1.5 sm:mb-2">Nom du projet</label>
                        <input type="text" value={info.project_name} onChange={e => setInfo({...info, project_name: e.target.value})}
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-neutral-300 rounded-lg font-body text-sm sm:text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                          placeholder="Ex: Rénovation salle de bain" />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-heading font-medium text-neutral-700 mb-1.5 sm:mb-2">Localisation</label>
                        <CityAutocomplete
                          value={info.project_location}
                          onChange={(city) => setInfo({...info, project_location: city})}
                          placeholder="Ex: Casablanca"
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-neutral-300 rounded-lg font-body text-sm sm:text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Support type */}
                  <div>
                    <h3 className="font-heading font-semibold text-neutral-800 mb-3 sm:mb-4 text-sm sm:text-base">Type de support</h3>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <button
                        type="button"
                        onClick={() => setSdbData(prev => ({ ...prev, support: 'ciment' }))}
                        className={`group bg-white border-2 rounded-2xl p-3 sm:p-4 text-left transition-all hover:shadow-sm ${
                          sdbData.support === 'ciment'
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-neutral-200 hover:border-primary-300'
                        }`}>
                        <h4 className="font-heading font-bold text-sm sm:text-base text-neutral-900 mb-0.5 sm:mb-1">Chape ciment</h4>
                        <p className="text-xs sm:text-sm text-neutral-600 font-body">Support absorbant</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSdbData(prev => ({ ...prev, support: 'carrelage' }))}
                        className={`group bg-white border-2 rounded-2xl p-3 sm:p-4 text-left transition-all hover:shadow-sm ${
                          sdbData.support === 'carrelage'
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-neutral-200 hover:border-primary-300'
                        }`}>
                        <h4 className="font-heading font-bold text-sm sm:text-base text-neutral-900 mb-0.5 sm:mb-1">Ancien carrelage</h4>
                        <p className="text-xs sm:text-sm text-neutral-600 font-body">Support lisse</p>
                      </button>
                    </div>
                  </div>

                  {/* Fields for avec_bac */}
                  {selSdbType === 'avec_bac' && (
                    <>
                      <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <label className="block text-xs sm:text-sm font-heading font-medium text-neutral-700 mb-1.5 sm:mb-2">Surface sol totale (m²) <span className="text-red-500">*</span></label>
                          <input type="number" required min="0.1" step="0.01" value={sdbData.surface_sol_totale}
                            onChange={e => setSdbData({...sdbData, surface_sol_totale: e.target.value})}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-neutral-300 rounded-lg font-body text-sm sm:text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                            placeholder="0.00" />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-heading font-medium text-neutral-700 mb-1.5 sm:mb-2">Surface bac (m²) <span className="text-neutral-400 text-xs">(opt.)</span></label>
                          <input type="number" min="0" step="0.01" value={sdbData.surface_bac}
                            onChange={e => setSdbData({...sdbData, surface_bac: e.target.value})}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-neutral-300 rounded-lg font-body text-sm sm:text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                            placeholder="0.00" />
                        </div>
                      </div>

                      <h3 className="font-heading font-semibold text-neutral-800 text-sm sm:text-base">Murs zone douche</h3>
                      <div className="grid grid-cols-3 gap-2 sm:gap-4">
                        <div>
                          <label className="block text-xs sm:text-sm font-heading font-medium text-neutral-700 mb-1.5 sm:mb-2">Long. (ml) <span className="text-red-500">*</span></label>
                          <input type="number" required min="0.1" step="0.01" value={sdbData.longueur_murs_douche}
                            onChange={e => setSdbData({...sdbData, longueur_murs_douche: e.target.value})}
                            className="w-full px-2.5 sm:px-4 py-2.5 sm:py-3 border border-neutral-300 rounded-lg font-body text-sm sm:text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                            placeholder="0.00" />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-heading font-medium text-neutral-700 mb-1.5 sm:mb-2">Larg. (ml) <span className="text-red-500">*</span></label>
                          <input type="number" required min="0.1" step="0.01" value={sdbData.largeur_murs_douche}
                            onChange={e => setSdbData({...sdbData, largeur_murs_douche: e.target.value})}
                            className="w-full px-2.5 sm:px-4 py-2.5 sm:py-3 border border-neutral-300 rounded-lg font-body text-sm sm:text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                            placeholder="0.00" />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-heading font-medium text-neutral-700 mb-1.5 sm:mb-2">Haut. (m) <span className="text-red-500">*</span></label>
                          <input type="number" required min="0.1" step="0.01" value={sdbData.hauteur_murs_douche}
                            onChange={e => setSdbData({...sdbData, hauteur_murs_douche: e.target.value})}
                            className="w-full px-2.5 sm:px-4 py-2.5 sm:py-3 border border-neutral-300 rounded-lg font-body text-sm sm:text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                            placeholder="0.00" />
                        </div>
                      </div>

                      <h3 className="font-heading font-semibold text-neutral-800 text-sm sm:text-base">Murs de la pièce</h3>
                      <div className="grid grid-cols-3 gap-2 sm:gap-4">
                        <div>
                          <label className="block text-xs sm:text-sm font-heading font-medium text-neutral-700 mb-1.5 sm:mb-2">Long. (ml) <span className="text-red-500">*</span></label>
                          <input type="number" required min="0.1" step="0.01" value={sdbData.longueur_murs_piece}
                            onChange={e => setSdbData({...sdbData, longueur_murs_piece: e.target.value})}
                            className="w-full px-2.5 sm:px-4 py-2.5 sm:py-3 border border-neutral-300 rounded-lg font-body text-sm sm:text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                            placeholder="0.00" />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-heading font-medium text-neutral-700 mb-1.5 sm:mb-2">Larg. (ml) <span className="text-red-500">*</span></label>
                          <input type="number" required min="0.1" step="0.01" value={sdbData.largeur_murs_piece}
                            onChange={e => setSdbData({...sdbData, largeur_murs_piece: e.target.value})}
                            className="w-full px-2.5 sm:px-4 py-2.5 sm:py-3 border border-neutral-300 rounded-lg font-body text-sm sm:text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                            placeholder="0.00" />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-heading font-medium text-neutral-700 mb-1.5 sm:mb-2">Haut. (m) <span className="text-red-500">*</span></label>
                          <input type="number" required min="0.1" step="0.01" value={sdbData.hauteur_murs_piece}
                            onChange={e => setSdbData({...sdbData, hauteur_murs_piece: e.target.value})}
                            className="w-full px-2.5 sm:px-4 py-2.5 sm:py-3 border border-neutral-300 rounded-lg font-body text-sm sm:text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                            placeholder="0.00" />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Fields for italienne */}
                  {selSdbType === 'italienne' && (
                    <>
                      <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <label className="block text-xs sm:text-sm font-heading font-medium text-neutral-700 mb-1.5 sm:mb-2">Surface sol totale (m²) <span className="text-red-500">*</span></label>
                          <input type="number" required min="0.1" step="0.01" value={sdbData.surface_sol_totale}
                            onChange={e => setSdbData({...sdbData, surface_sol_totale: e.target.value})}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-neutral-300 rounded-lg font-body text-sm sm:text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                            placeholder="0.00" />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-heading font-medium text-neutral-700 mb-1.5 sm:mb-2">Surface zone douche (m²) <span className="text-red-500">*</span></label>
                          <input type="number" required min="0.1" step="0.01" value={sdbData.surface_zone_douche}
                            onChange={e => setSdbData({...sdbData, surface_zone_douche: e.target.value})}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-neutral-300 rounded-lg font-body text-sm sm:text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                            placeholder="0.00" />
                        </div>
                      </div>

                      <h3 className="font-heading font-semibold text-neutral-800 text-sm sm:text-base">Murs zone douche</h3>
                      <div className="grid grid-cols-3 gap-2 sm:gap-4">
                        <div>
                          <label className="block text-xs sm:text-sm font-heading font-medium text-neutral-700 mb-1.5 sm:mb-2">Long. (ml) <span className="text-red-500">*</span></label>
                          <input type="number" required min="0.1" step="0.01" value={sdbData.longueur_murs_douche}
                            onChange={e => setSdbData({...sdbData, longueur_murs_douche: e.target.value})}
                            className="w-full px-2.5 sm:px-4 py-2.5 sm:py-3 border border-neutral-300 rounded-lg font-body text-sm sm:text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                            placeholder="0.00" />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-heading font-medium text-neutral-700 mb-1.5 sm:mb-2">Larg. (ml) <span className="text-red-500">*</span></label>
                          <input type="number" required min="0.1" step="0.01" value={sdbData.largeur_murs_douche}
                            onChange={e => setSdbData({...sdbData, largeur_murs_douche: e.target.value})}
                            className="w-full px-2.5 sm:px-4 py-2.5 sm:py-3 border border-neutral-300 rounded-lg font-body text-sm sm:text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                            placeholder="0.00" />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-heading font-medium text-neutral-700 mb-1.5 sm:mb-2">Haut. (m) <span className="text-red-500">*</span></label>
                          <input type="number" required min="0.1" step="0.01" value={sdbData.hauteur_murs_douche}
                            onChange={e => setSdbData({...sdbData, hauteur_murs_douche: e.target.value})}
                            className="w-full px-2.5 sm:px-4 py-2.5 sm:py-3 border border-neutral-300 rounded-lg font-body text-sm sm:text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                            placeholder="0.00" />
                        </div>
                      </div>

                      <h3 className="font-heading font-semibold text-neutral-800 text-sm sm:text-base">Murs de la pièce</h3>
                      <div className="grid grid-cols-3 gap-2 sm:gap-4">
                        <div>
                          <label className="block text-xs sm:text-sm font-heading font-medium text-neutral-700 mb-1.5 sm:mb-2">Long. (ml) <span className="text-red-500">*</span></label>
                          <input type="number" required min="0.1" step="0.01" value={sdbData.longueur_murs_piece}
                            onChange={e => setSdbData({...sdbData, longueur_murs_piece: e.target.value})}
                            className="w-full px-2.5 sm:px-4 py-2.5 sm:py-3 border border-neutral-300 rounded-lg font-body text-sm sm:text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                            placeholder="0.00" />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-heading font-medium text-neutral-700 mb-1.5 sm:mb-2">Larg. (ml) <span className="text-red-500">*</span></label>
                          <input type="number" required min="0.1" step="0.01" value={sdbData.largeur_murs_piece}
                            onChange={e => setSdbData({...sdbData, largeur_murs_piece: e.target.value})}
                            className="w-full px-2.5 sm:px-4 py-2.5 sm:py-3 border border-neutral-300 rounded-lg font-body text-sm sm:text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                            placeholder="0.00" />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-heading font-medium text-neutral-700 mb-1.5 sm:mb-2">Haut. (m) <span className="text-red-500">*</span></label>
                          <input type="number" required min="0.1" step="0.01" value={sdbData.hauteur_murs_piece}
                            onChange={e => setSdbData({...sdbData, hauteur_murs_piece: e.target.value})}
                            className="w-full px-2.5 sm:px-4 py-2.5 sm:py-3 border border-neutral-300 rounded-lg font-body text-sm sm:text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                            placeholder="0.00" />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Notes */}
                  <div>
                    <label className="block text-xs sm:text-sm font-heading font-medium text-neutral-700 mb-1.5 sm:mb-2">Notes</label>
                    <textarea value={info.notes} onChange={e => setInfo({...info, notes: e.target.value})} rows={3}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-neutral-300 rounded-lg font-body text-sm sm:text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                      placeholder="Informations complémentaires..." />
                  </div>

                  <NavButtons onPrev={handlePrev} nextLabel="Calculer le prix" isSubmit />
                </form>
              </div>
            )}


            {/* ── SUMMARY STEP ── */}
            {calculation && ((currentStep === 5 && selType === 'toiture') || (currentStep === 4 && selType !== 'toiture')) && (
              <div className="space-y-4 sm:space-y-6">
                {/* Recap */}
                <div className="bg-white border border-neutral-200 rounded-2xl p-4 sm:p-5">
                  <div className="flex flex-wrap gap-4 sm:gap-6 text-sm">
                    <div>
                      <p className="text-xs text-neutral-500 font-body">Type</p>
                      <p className="font-heading font-semibold text-neutral-900 text-sm sm:text-base">
                        {ETANCHEITE_TYPES.find(t => t.key === selType)?.label}
                      </p>
                    </div>
                    {selType === 'toiture' && (
                      <>
                        <div>
                          <p className="text-xs text-neutral-500 font-body">Toiture</p>
                          <p className="font-heading font-semibold text-neutral-900 text-sm sm:text-base">
                            {TOITURE_TYPES.find(t => t.key === selToitureType)?.label}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-neutral-500 font-body">Isolation</p>
                          <p className="font-heading font-semibold text-neutral-900 text-sm sm:text-base">
                            {selIsolation ? 'Oui (Toiture chaude)' : 'Non'}
                          </p>
                        </div>
                      </>
                    )}
                    <div>
                      <p className="text-xs text-neutral-500 font-body">Surface</p>
                      <p className="font-heading font-semibold text-neutral-900 text-sm sm:text-base">{calculation.surface_brute} m²</p>
                    </div>
                    {info.project_location && (
                      <div>
                        <p className="text-xs text-neutral-500 font-body">Lieu</p>
                        <p className="font-heading font-semibold text-neutral-900 text-sm sm:text-base">{info.project_location}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Materials list */}
                {calculation.materials?.length > 0 && (
                  <div className="bg-white border border-neutral-200 rounded-2xl p-4 sm:p-6">
                    <h2 className="font-heading text-base sm:text-lg font-bold text-neutral-900 mb-3 sm:mb-4">Liste des produits</h2>
                    <div className="space-y-2 sm:space-y-3">
                      {calculation.materials.filter((_, idx) => !removedMaterials.has(idx)).map((mat, i) => (
                        <div key={i} className="flex items-center justify-between p-2.5 sm:p-3 bg-neutral-50 rounded-xl group hover:bg-neutral-100 transition-colors">
                          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                            <span className="w-5 h-5 sm:w-6 sm:h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-heading font-bold flex-shrink-0">
                              {i + 1}
                            </span>
                            <span className="font-body text-neutral-900 text-xs sm:text-sm truncate">{mat.name}</span>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                            <span className="font-heading font-bold text-primary-500 text-xs sm:text-sm whitespace-nowrap">
                              {mat.quantity} {mat.unit}
                            </span>
                            <button
                              type="button"
                              onClick={() => setRemovedMaterials(new Set([...removedMaterials, i]))}
                              className="p-1 sm:p-1.5 rounded-lg bg-red-100 text-red-600 transition-all"
                              title="Retirer ce produit">
                              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <div className="bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-2xl p-5 sm:p-6">
                  <h2 className="font-heading text-lg sm:text-xl font-bold mb-4 sm:mb-6">Estimation</h2>
                  <div className="space-y-3">
                    <div className="flex justify-between pb-3 border-b border-primary-400">
                      <span className="font-body text-sm sm:text-base">Prix estimé</span>
                      <span className="font-display font-bold text-lg sm:text-xl">{fmt(calculation.total_ht || 0)}</span>
                    </div>
                  </div>
                </div>

                {/* Save buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button onClick={() => {
                      if (selType === 'toiture') {
                        setCurrentStep(4);
                      } else {
                        setCurrentStep(3);
                      }
                    }} disabled={loading}
                    className="flex-1 inline-flex items-center justify-center px-4 sm:px-6 py-2.5 sm:py-3 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-heading font-semibold rounded-lg transition-all disabled:opacity-50 text-sm sm:text-base">
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Modifier
                  </button>
                  <button onClick={() => handleSave('saved')} disabled={loading}
                    className="flex-1 inline-flex items-center justify-center px-4 sm:px-6 py-2.5 sm:py-3 bg-primary-500 hover:bg-primary-600 text-white font-heading font-semibold rounded-lg transition-all disabled:opacity-50 shadow-sm hover:shadow-md text-sm sm:text-base">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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