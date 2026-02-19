import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { devisAPI } from '../services/api';
import toast from 'react-hot-toast';
import Navbar from '../components/layout/Navbar';

const fmt = (p) => new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', minimumFractionDigits: 0 }).format(p ?? 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-MA', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

const STATUS_CONFIG = {
  draft:     { label: 'Brouillon',   bg: 'bg-neutral-100', text: 'text-neutral-600' },
  saved:     { label: 'Sauvegardé',  bg: 'bg-primary-100', text: 'text-primary-700' },
  submitted: { label: 'Soumis',      bg: 'bg-accent-100',  text: 'text-accent-700'  },
  reviewed:  { label: 'Examiné',     bg: 'bg-green-100',   text: 'text-green-700'   },
};

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

export default function DevisViewPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [devis, setDevis]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting]   = useState(false);

  useEffect(() => { fetchDevis(); }, [id]);

  const fetchDevis = async () => {
    try {
      setLoading(true);
      const r = await devisAPI.show(id);
      setDevis(r.data.data);
    } catch { toast.error('Devis introuvable'); navigate('/dashboard'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    if (!window.confirm('Soumettre ce devis à AlaqSeal ?')) return;
    try {
      setSubmitting(true);
      const r = await devisAPI.submit(id);
      setDevis(r.data.data);
      toast.success('Devis soumis avec succès !');
    } catch (e) { toast.error(e.response?.data?.error || 'Erreur lors de la soumission'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Supprimer définitivement ce devis ?')) return;
    try {
      setDeleting(true);
      await devisAPI.delete(id);
      toast.success('Devis supprimé');
      navigate('/dashboard');
    } catch (e) { toast.error(e.response?.data?.error || 'Erreur lors de la suppression'); }
    finally { setDeleting(false); }
  };

  if (loading) return (
    <>
      <Navbar />
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-500"></div>
      </div>
    </>
  );

  if (!devis) return null;

  const status = STATUS_CONFIG[devis.status] || STATUS_CONFIG.draft;
  const canAct = devis.status === 'draft' || devis.status === 'saved';

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-neutral-50">

        {/* Header */}
        <div className="bg-white border-b border-neutral-200">
          <div className="container mx-auto px-4 sm:px-6 lg:px-16 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Left */}
              <div>
                <button onClick={() => navigate('/dashboard')}
                  className="inline-flex items-center text-neutral-500 hover:text-primary-500 font-body text-sm mb-3 transition-colors">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
                  </svg>
                  Tableau de bord
                </button>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="font-display text-2xl font-bold text-neutral-900">
                    {devis.project_name || 'Devis sans titre'}
                  </h1>
                  <span className={`px-3 py-1 text-sm font-heading font-semibold rounded-full ${status.bg} ${status.text}`}>
                    {status.label}
                  </span>
                </div>
                <p className="text-neutral-500 font-body text-sm mt-1">
                  {devis.devis_number} · Créé le {fmtDate(devis.created_at)}
                </p>
              </div>

              {/* Actions */}
              {canAct && (
                <div className="flex gap-3 flex-shrink-0">
                  <button onClick={handleDelete} disabled={deleting}
                    className="inline-flex items-center px-4 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 font-heading font-semibold text-sm rounded-lg transition-all disabled:opacity-50">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                    {deleting ? 'Suppression...' : 'Supprimer'}
                  </button>
                  <button onClick={handleSubmit} disabled={submitting}
                    className="inline-flex items-center px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-heading font-semibold text-sm rounded-lg transition-all disabled:opacity-50 shadow-sm hover:shadow-md">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                    </svg>
                    {submitting ? 'Soumission...' : 'Soumettre à AlaqSeal'}
                  </button>
                </div>
              )}

              {/* Submitted banner */}
              {devis.status === 'submitted' && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-accent-100 text-accent-700 rounded-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span className="font-heading font-semibold text-sm">Soumis le {fmtDate(devis.submitted_at)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-16 py-8">
          <div className="max-w-4xl mx-auto space-y-6">

            {/* ── PROJECT INFO ── */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-6">
              <h2 className="font-heading font-bold text-lg text-neutral-900 mb-4">Informations du projet</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  ['Service',    devis.service?.name],
                  ['Produit',    devis.product?.name],
                  ['Cas DTU',    devis.product_case?.name],
                  ['Localisation', devis.project_location || '—'],
                ].map(([label, val]) => (
                  <div key={label}>
                    <p className="text-xs text-neutral-500 font-body">{label}</p>
                    <p className="font-heading font-semibold text-neutral-900 text-sm mt-0.5">{val}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── DIMENSIONS ── */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-6">
              <h2 className="font-heading font-bold text-lg text-neutral-900 mb-4">Dimensions</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  ['Longueur',      `${devis.longueur} m`],
                  ['Largeur',       `${devis.largeur} m`],
                  ...(parseFloat(devis.hauteur) > 0 ? [['Hauteur', `${devis.hauteur} m`]] : []),
                  ...(parseInt(devis.nombre_murs) > 0 ? [['Nb. murs', devis.nombre_murs]] : []),
                  ['Surface totale', `${devis.surface_area} m²`],
                ].map(([label, val]) => (
                  <div key={label} className={label === 'Surface totale' ? 'bg-primary-50 border border-primary-200 rounded-xl p-3' : 'bg-neutral-50 rounded-xl p-3'}>
                    <p className="text-xs text-neutral-500 font-body">{label}</p>
                    <p className={`font-display font-bold text-lg mt-0.5 ${label === 'Surface totale' ? 'text-primary-600' : 'text-neutral-900'}`}>{val}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── DTU MATERIALS LIST ── */}
            {devis.calculated_materials?.length > 0 && (
              <div className="bg-white border border-neutral-200 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-heading font-bold text-lg text-neutral-900">Liste des produits — ordre DTU</h2>
                  {devis.product?.norme && (
                    <span className="px-3 py-1 bg-neutral-100 text-neutral-600 text-xs font-heading font-semibold rounded-full">
                      {devis.product.norme}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {devis.calculated_materials.map((mat, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition-colors">
                      <div className="flex items-center gap-4">
                        {/* Step number */}
                        <span className="w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center text-xs font-heading font-bold flex-shrink-0">
                          {mat.step}
                        </span>
                        {/* Name + type badge */}
                        <div>
                          <p className="font-body text-neutral-900 text-sm font-medium">{mat.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-xs px-2 py-0.5 rounded font-body ${MATERIAL_TYPE_COLORS[mat.type] || 'bg-neutral-100 text-neutral-600'}`}>
                              {mat.type}
                            </span>
                            {mat.is_optional && (
                              <span className="text-xs text-neutral-400 font-body italic">optionnel</span>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Quantity */}
                      <div className="text-right flex-shrink-0">
                        <span className="font-display font-bold text-primary-500 text-lg">{mat.quantity}</span>
                        <span className="text-neutral-500 font-body text-sm ml-1">{mat.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── PRICING BREAKDOWN ── */}
            <div className="bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-2xl p-6">
              <h2 className="font-heading text-xl font-bold mb-6">Calcul du prix</h2>
              <div className="space-y-3">
                <div className="flex justify-between pb-3 border-b border-primary-400">
                  <span className="font-body">Prix de base ({devis.surface_area} m²)</span>
                  <span className="font-display font-bold">{fmt(devis.base_price)}</span>
                </div>
                <div className="text-sm space-y-1.5 text-primary-100">
                  <p className="text-white font-heading font-semibold">Coefficients appliqués :</p>
                  {[
                    ['Hauteur',     devis.factor_height],
                    ['État',        devis.factor_condition],
                    ['Complexité',  devis.factor_complexity],
                    ['Région',      devis.factor_region],
                  ].map(([l, v]) => (
                    <div key={l} className="flex justify-between">
                      <span className="font-body">× {l}</span>
                      <span className={parseFloat(v) === 1 ? 'text-primary-200' : 'text-white font-semibold'}>×{v}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between pt-2 border-t border-primary-400">
                  <span className="font-body">Avec coefficients</span>
                  <span className="font-display font-bold">{fmt(devis.price_with_factors)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-body">+ Coûts fixes</span>
                  <span>{fmt(devis.fixed_costs)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-primary-400">
                  <span className="font-body font-semibold">Sous-total HT</span>
                  <span className="font-display font-bold">{fmt(devis.subtotal_ht)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-body">TVA ({devis.tva_rate}%)</span>
                  <span>{fmt(devis.tva_amount)}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t-2 border-white text-xl">
                  <span className="font-heading font-bold">TOTAL TTC</span>
                  <span className="font-display font-bold">{fmt(devis.total_ttc)}</span>
                </div>
              </div>
            </div>

            {/* ── DURATION + NOTES ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Duration */}
              {devis.estimated_days > 0 && (
                <div className="bg-white border border-neutral-200 rounded-2xl p-5 flex items-center gap-4">
                  <div className="w-12 h-12 bg-accent-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 font-body">Durée estimée</p>
                    <p className="font-display font-bold text-2xl text-neutral-900">{devis.estimated_days} jours</p>
                    <p className="text-xs text-neutral-400 font-body">{devis.preparation_days}j préparation · {devis.drying_days}j séchage</p>
                  </div>
                </div>
              )}

              {/* Notes */}
              {devis.notes && (
                <div className="bg-white border border-neutral-200 rounded-2xl p-5">
                  <p className="text-xs text-neutral-500 font-body mb-2">Notes</p>
                  <p className="font-body text-neutral-700 text-sm leading-relaxed">{devis.notes}</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}