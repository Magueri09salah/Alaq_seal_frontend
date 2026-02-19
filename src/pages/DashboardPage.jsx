import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { devisAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Navbar from '../components/layout/Navbar';

const fmt    = (p) => new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', minimumFractionDigits: 0 }).format(p ?? 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-MA', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const STATUS_CONFIG = {
  draft:     { label: 'Brouillon',  bg: 'bg-neutral-100', text: 'text-neutral-600', dot: 'bg-neutral-400' },
  saved:     { label: 'Sauvegardé', bg: 'bg-primary-100', text: 'text-primary-700', dot: 'bg-primary-500' },
  submitted: { label: 'Soumis',     bg: 'bg-accent-100',  text: 'text-accent-700',  dot: 'bg-accent-500'  },
  reviewed:  { label: 'Examiné',    bg: 'bg-green-100',   text: 'text-green-700',   dot: 'bg-green-500'   },
};

const TABS = [
  { key: 'all',       label: 'Tous'        },
  { key: 'draft',     label: 'Brouillons'  },
  { key: 'saved',     label: 'Sauvegardés' },
  { key: 'submitted', label: 'Soumis'      },
];

const StatCard = ({ label, value, sub, icon, accent }) => (
  <div className="bg-white border border-neutral-200 rounded-2xl p-6">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-neutral-500 font-body">{label}</p>
        <p className={`font-display font-bold text-3xl mt-1 ${accent ? 'text-primary-500' : 'text-neutral-900'}`}>{value}</p>
        {sub && <p className="text-xs text-neutral-400 font-body mt-1">{sub}</p>}
      </div>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${accent ? 'bg-primary-100' : 'bg-neutral-100'}`}>
        <svg className={`w-6 h-6 ${accent ? 'text-primary-500' : 'text-neutral-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {icon}
        </svg>
      </div>
    </div>
  </div>
);

export default function DashboardPage() {
  const navigate   = useNavigate();
  const { user }   = useAuth();
  const [tab, setTab]     = useState('all');
  const [devis, setDevis] = useState([]);
  const [stats, setStats] = useState({ total: 0, draft: 0, saved: 0, submitted: 0, reviewed: 0, total_value: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [meta, setMeta]       = useState({});

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => { fetchDevis(); }, [tab, page]);

  const fetchStats = async () => {
    try { const r = await devisAPI.stats(); setStats(r.data.data); }
    catch {}
  };

  const fetchDevis = async () => {
    try {
      setLoading(true);
      const params = { page, per_page: 8 };
      if (tab !== 'all') params.status = tab;
      const r = await devisAPI.list(params);
      setDevis(r.data.data.data ?? r.data.data);
      setMeta(r.data.data.meta ?? {});
    } catch { toast.error('Erreur chargement'); }
    finally { setLoading(false); }
  };

  const handleTabChange = (t) => { setTab(t); setPage(1); };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-neutral-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-16 py-8">

          {/* Page title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold text-neutral-900">
                Bonjour, {user?.name?.split(' ')[0] ?? 'Bienvenue'} 👋
              </h1>
              <p className="text-neutral-500 font-body mt-1">Gérez et suivez vos devis AlaqSeal</p>
            </div>
            <button onClick={() => navigate('/estimator/new')}
              className="inline-flex items-center px-5 py-3 bg-primary-500 hover:bg-primary-600 text-white font-heading font-semibold rounded-lg transition-all shadow-sm hover:shadow-md flex-shrink-0">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
              </svg>
              Nouveau Devis
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <StatCard
              label="Total Devis"
              value={stats.total}
              icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>}
            />
            <StatCard
              label="Brouillons"
              value={stats.draft}
              sub="En cours de rédaction"
              icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>}
            />
            <StatCard
              label="Soumis"
              value={stats.submitted}
              sub="En attente de réponse"
              icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>}
            />
            {/* <StatCard
              label="Valeur totale"
              value={fmt(stats.total_value)}
              sub="Tous devis confondus"
              accent
              icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>}
            /> */}
          </div>

          {/* Tabs + List */}
          <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">

            {/* Tab bar */}
            <div className="border-b border-neutral-200 px-6 pt-4 flex gap-1">
              {TABS.map(t => (
                <button key={t.key} onClick={() => handleTabChange(t.key)}
                  className={`px-4 py-2 font-heading font-semibold text-sm rounded-t-lg transition-all border-b-2 -mb-px ${
                    tab === t.key
                      ? 'border-primary-500 text-primary-600 bg-primary-50'
                      : 'border-transparent text-neutral-500 hover:text-neutral-700'
                  }`}>
                  {t.label}
                  {t.key !== 'all' && stats[t.key] > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 text-xs bg-primary-100 text-primary-600 rounded-full font-body">{stats[t.key]}</span>
                  )}
                </button>
              ))}
            </div>

            {/* List */}
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-200 border-t-primary-500"></div>
              </div>
            ) : devis.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                </div>
                <h3 className="font-heading font-bold text-neutral-700 mb-2">Aucun devis</h3>
                <p className="text-neutral-500 font-body text-sm mb-6">
                  {tab === 'all' ? 'Créez votre premier devis pour commencer' : `Aucun devis avec le statut "${TABS.find(t => t.key === tab)?.label}"`}
                </p>
                {tab === 'all' && (
                  <button onClick={() => navigate('/estimator/new')}
                    className="inline-flex items-center px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-heading font-semibold text-sm rounded-lg transition-all">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                    </svg>
                    Créer un devis
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-neutral-100">
                {devis.map(d => {
                  const s = STATUS_CONFIG[d.status] || STATUS_CONFIG.draft;
                  return (
                    <button key={d.id} onClick={() => navigate(`/devis/${d.id}`)}
                      className="w-full flex items-center gap-4 px-6 py-4 hover:bg-neutral-50 transition-colors text-left">
                      {/* Status dot */}
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${s.dot}`} />

                      {/* Main info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-heading font-semibold text-neutral-900 truncate">
                            {d.project_name || 'Sans titre'}
                          </p>
                          {d.subcategory && (
                            <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 text-xs font-body rounded capitalize">{d.subcategory}</span>
                          )}
                        </div>
                        <p className="text-sm text-neutral-500 font-body mt-0.5">
                          {d.service?.name}
                          {d.product && <span className="mx-1 text-neutral-300">·</span>}
                          {d.product?.name}
                          {d.product_case && <span className="mx-1 text-neutral-300">·</span>}
                          {d.product_case?.name}
                        </p>
                        <p className="text-xs text-neutral-400 font-body mt-0.5">
                          {d.devis_number} · {fmtDate(d.created_at)}
                          {d.surface_area && ` · ${d.surface_area} m²`}
                          {d.project_location && ` · ${d.project_location}`}
                        </p>
                      </div>

                      {/* Price + status */}
                      <div className="flex flex-col items-end flex-shrink-0 gap-1">
                        <p className="font-display font-bold text-lg text-primary-500">{fmt(d.total_ttc)}</p>
                        <span className={`px-2.5 py-0.5 text-xs font-heading font-semibold rounded-full ${s.bg} ${s.text}`}>{s.label}</span>
                      </div>

                      {/* Arrow */}
                      <svg className="w-5 h-5 text-neutral-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                      </svg>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {meta.last_page > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-100">
                <p className="text-sm text-neutral-500 font-body">
                  Page {meta.current_page} sur {meta.last_page}
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="px-3 py-1.5 border border-neutral-200 rounded-lg text-sm font-heading font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 transition-all">
                    Précédent
                  </button>
                  <button onClick={() => setPage(p => p + 1)} disabled={page === meta.last_page}
                    className="px-3 py-1.5 border border-neutral-200 rounded-lg text-sm font-heading font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 transition-all">
                    Suivant
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