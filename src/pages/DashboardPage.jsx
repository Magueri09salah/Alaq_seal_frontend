import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { devisAPI, estimatorAPI } from '../services/api';
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
  <div className="bg-white border border-neutral-200 rounded-2xl p-4 sm:p-6">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs sm:text-sm text-neutral-500 font-body">{label}</p>
        <p className={`font-display font-bold text-2xl sm:text-3xl mt-1 ${accent ? 'text-primary-500' : 'text-neutral-900'}`}>{value}</p>
        {sub && <p className="text-xs text-neutral-400 font-body mt-1 hidden sm:block">{sub}</p>}
      </div>
      <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center ${accent ? 'bg-primary-100' : 'bg-neutral-100'}`}>
        <svg className={`w-5 h-5 sm:w-6 sm:h-6 ${accent ? 'text-primary-500' : 'text-neutral-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    try {
      const [oldStats, toitureStats] = await Promise.all([
        devisAPI.stats().catch(() => ({ data: { data: { total: 0, draft: 0, saved: 0, submitted: 0, reviewed: 0, total_value: 0 } } })),
        estimatorAPI.getToitureStats().catch(() => ({ data: { data: { total: 0, draft: 0, saved: 0, submitted: 0, reviewed: 0, total_value: 0 } } }))
      ]);

      const oldData = oldStats.data.data;
      const toitureData = toitureStats.data.data;

      setStats({
        total: (oldData.total || 0) + (toitureData.total || 0),
        draft: (oldData.draft || 0) + (toitureData.draft || 0),
        saved: (oldData.saved || 0) + (toitureData.saved || 0),
        submitted: (oldData.submitted || 0) + (toitureData.submitted || 0),
        reviewed: (oldData.reviewed || 0) + (toitureData.reviewed || 0),
        total_value: (oldData.total_value || 0) + (toitureData.total_value || 0),
      });
    } catch (err) {
      console.error('Stats error:', err);
    }
  };

  const fetchDevis = async () => {
    try {
      setLoading(true);
      const params = { page, per_page: 8 };
      if (tab !== 'all') params.status = tab;

      const [oldDevis, toitureDevis] = await Promise.all([
        devisAPI.list(params).catch(() => ({ data: { data: { data: [], meta: {} } } })),
        estimatorAPI.listToitureDevis(params).catch(() => ({ data: { data: { data: [], meta: {} } } }))
      ]);

      const oldList = Array.isArray(oldDevis.data.data) ? oldDevis.data.data : (oldDevis.data.data?.data || []);
      const toitureList = Array.isArray(toitureDevis.data.data) ? toitureDevis.data.data : (toitureDevis.data.data?.data || []);

      const oldMarked = oldList.map(d => ({ ...d, _source: 'old' }));
      const toitureMarked = toitureList.map(d => ({ ...d, _source: 'toiture' }));

      const combined = [...oldMarked, ...toitureMarked].sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );

      setDevis(combined);

      const meta1 = oldDevis.data.data?.meta || {};
      const meta2 = toitureDevis.data.data?.meta || {};
      setMeta(meta1.total > meta2.total ? meta1 : meta2);

    } catch (err) {
      console.error('Fetch error:', err);
      toast.error('Erreur chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (t) => { setTab(t); setPage(1); };

  const handleDevisClick = (d) => {
    if (d._source === 'toiture') {
      navigate(`/toiture/devis/${d.id}`);
    } else {
      navigate(`/devis/${d.id}`);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-neutral-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-16 py-6 sm:py-8">

          {/* Page title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-neutral-900">
                Bonjour, {user?.name?.split(' ')[0] ?? 'Bienvenue'} 👋
              </h1>
              <p className="text-neutral-500 font-body mt-1 text-sm sm:text-base">Gérez et suivez vos devis Alaq Seal</p>
            </div>
            <button onClick={() => navigate('/new-devis')}
              className="inline-flex items-center justify-center px-4 sm:px-5 py-2.5 sm:py-3 bg-primary-500 hover:bg-primary-600 text-white font-heading font-semibold rounded-lg transition-all shadow-sm hover:shadow-md flex-shrink-0 text-sm sm:text-base">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
              </svg>
              Nouveau Devis
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
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
          </div>

          {/* Tabs + List */}
          <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">

            {/* Tab bar - horizontal scroll on mobile */}
            <div className="border-b border-neutral-200 px-3 sm:px-6 pt-3 sm:pt-4 overflow-x-auto scrollbar-hide">
              <div className="flex gap-1 min-w-max">
                {TABS.map(t => (
                  <button key={t.key} onClick={() => handleTabChange(t.key)}
                    className={`px-3 sm:px-4 py-2 font-heading font-semibold text-xs sm:text-sm rounded-t-lg transition-all border-b-2 -mb-px whitespace-nowrap ${
                      tab === t.key
                        ? 'border-primary-500 text-primary-600 bg-primary-50'
                        : 'border-transparent text-neutral-500 hover:text-neutral-700'
                    }`}>
                    {t.label}
                    {t.key !== 'all' && stats[t.key] > 0 && (
                      <span className="ml-1.5 sm:ml-2 px-1.5 py-0.5 text-xs bg-primary-100 text-primary-600 rounded-full font-body">{stats[t.key]}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            {loading ? (
              <div className="flex justify-center py-12 sm:py-16">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-200 border-t-primary-500"></div>
              </div>
            ) : devis.length === 0 ? (
              <div className="text-center py-12 sm:py-20 px-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 sm:w-8 sm:h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                </div>
                <h3 className="font-heading font-bold text-neutral-700 mb-2">Aucun devis</h3>
                <p className="text-neutral-500 font-body text-sm mb-6">
                  {tab === 'all' ? 'Créez votre premier devis pour commencer' : `Aucun devis avec le statut "${TABS.find(t => t.key === tab)?.label}"`}
                </p>
                {tab === 'all' && (
                  <button onClick={() => navigate('/new-devis')}
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
                    <button key={`${d._source}-${d.id}`} onClick={() => handleDevisClick(d)}
                      className="w-full flex items-start sm:items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3.5 sm:py-4 hover:bg-neutral-50 active:bg-neutral-100 transition-colors text-left">
                      {/* Status dot */}
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5 sm:mt-0 ${s.dot}`} />

                      {/* Main info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-heading font-semibold text-neutral-900 truncate text-sm sm:text-base">
                            {d.project_name || 'Sans titre'}
                          </p>
                          {d.type && (
                            <span className="px-1.5 sm:px-2 py-0.5 bg-primary-100 text-primary-600 text-xs font-body rounded capitalize">
                              {d.type === 'toiture' ? 'Toiture' : d.type === 'mur' ? 'Mur' : d.type === 'salle_bain' ? 'Salle bain' : d.type}
                            </span>
                          )}
                        </div>
                        
                        {/* Secondary info - simplified on mobile */}
                        <p className="text-sm text-neutral-500 font-body mt-0.5 hidden sm:block">
                          {d.service?.name}
                          {d.product && <span className="mx-1 text-neutral-300">·</span>}
                          {d.product?.name}
                          {d.product_case && <span className="mx-1 text-neutral-300">·</span>}
                          {d.product_case?.name}
                          {d.type && d.toiture_type && <span className="mx-1 text-neutral-300">·</span>}
                          {d.toiture_type && (d.toiture_type === 'accessible' ? 'Accessible' : 'Non accessible')}
                        </p>
                        
                        <p className="text-xs text-neutral-400 font-body mt-0.5">
                          {d.devis_number} · {fmtDate(d.created_at)}
                          {(d.surface_area || d.surface_brute) && ` · ${d.surface_area || d.surface_brute} m²`}
                          {d.project_location && <span className="hidden sm:inline"> · {d.project_location}</span>}
                        </p>

                        {/* Mobile-only: price + status inline */}
                        <div className="flex items-center gap-2 mt-2 sm:hidden">
                          <span className="font-display font-bold text-sm text-primary-500">{fmt(d.total_ttc)}</span>
                          <span className={`px-2 py-0.5 text-xs font-heading font-semibold rounded-full ${s.bg} ${s.text}`}>{s.label}</span>
                        </div>
                      </div>

                      {/* Price + status - desktop only */}
                      <div className="hidden sm:flex flex-col items-end flex-shrink-0 gap-1">
                        <p className="font-display font-bold text-lg text-primary-500">{fmt(d.total_ttc)}</p>
                        <span className={`px-2.5 py-0.5 text-xs font-heading font-semibold rounded-full ${s.bg} ${s.text}`}>{s.label}</span>
                      </div>

                      {/* Arrow */}
                      <svg className="w-5 h-5 text-neutral-300 flex-shrink-0 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                      </svg>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {meta.last_page > 1 && (
              <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-t border-neutral-100">
                <p className="text-xs sm:text-sm text-neutral-500 font-body">
                  Page {meta.current_page}/{meta.last_page}
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="px-3 py-1.5 border border-neutral-200 rounded-lg text-xs sm:text-sm font-heading font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 transition-all">
                    Précédent
                  </button>
                  <button onClick={() => setPage(p => p + 1)} disabled={page === meta.last_page}
                    className="px-3 py-1.5 border border-neutral-200 rounded-lg text-xs sm:text-sm font-heading font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 transition-all">
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