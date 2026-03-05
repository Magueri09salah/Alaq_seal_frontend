import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { estimatorAPI } from '../services/api';
import toast from 'react-hot-toast';
import Navbar from '../components/layout/Navbar';

const ToitureDevisViewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [devis, setDevis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchDevis();
  }, [id]);

  const fetchDevis = async () => {
    try {
      setLoading(true);
      const response = await estimatorAPI.getToitureDevis(id);
      setDevis(response.data.data);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Devis introuvable 1');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce devis ?')) return;

    try {
      setDeleting(true);
      await estimatorAPI.deleteToitureDevis(id);
      toast.success('Devis supprimé avec succès');
      navigate('/dashboard');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const url = `${import.meta.env.VITE_API_URL}/toiture/devis/${id}/download-pdf`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/pdf',
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${devis.devis_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
      
      toast.success('PDF téléchargé avec succès');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Erreur lors du téléchargement du PDF');
    }
  };

  const handleSubmit = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir soumettre ce devis ?')) return;

    try {
      await estimatorAPI.submitToitureDevis(id);
      toast.success('Devis soumis avec succès');
      fetchDevis();
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Erreur lors de la soumission');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      draft: 'bg-neutral-100 text-neutral-700 border-neutral-300',
      saved: 'bg-blue-100 text-blue-700 border-blue-300',
      submitted: 'bg-green-100 text-green-700 border-green-300',
      reviewed: 'bg-purple-100 text-purple-700 border-purple-300',
    };
    const labels = {
      draft: 'Brouillon',
      saved: 'Sauvegardé',
      submitted: 'Soumis',
      reviewed: 'Vérifié',
    };
    return (
      <span className={`px-3 py-1.5 rounded-lg text-sm font-heading font-semibold border ${styles[status] || styles.draft}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getTypeLabel = (type) => {
    const labels = {
      toiture: 'Étanchéité toiture plate',
      mur: 'Étanchéité mur enterré',
      salle_bain: 'Étanchéité sous carrelage',
    };
    return labels[type] || type;
  };

  const fmt = (n) => new Intl.NumberFormat('fr-MA', { 
    style: 'currency', 
    currency: 'MAD', 
    minimumFractionDigits: 0 
  }).format(n || 0);

  const fmtQty = (n) => {
    const formatted = new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(n || 0);
    return formatted.replace(/\.?0+$/, '');
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-neutral-600 font-body">Chargement...</p>
          </div>
        </div>
      </>
    );
  }

  if (!devis) return null;

  const canEdit = devis.status === 'draft' || devis.status === 'saved';
  const canSubmit = devis.status === 'saved';

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-neutral-50">
        {/* Header */}
        <div className="bg-white border-b border-neutral-200">
          <div className="container mx-auto px-4 sm:px-6 lg:px-16 py-6">
            <div className="flex items-center gap-3 mb-4">
              <Link
                to="/dashboard"
                className="inline-flex items-center text-sm font-heading font-medium text-neutral-600 hover:text-neutral-900 transition-colors">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Retour au tableau de bord
              </Link>
            </div>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="font-display text-3xl font-bold text-neutral-900">
                    {devis.devis_number}
                  </h1>
                  {getStatusBadge(devis.status)}
                </div>
                <p className="text-neutral-600 font-body">
                  Créé le {new Date(devis.created_at).toLocaleDateString('fr-FR', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleDownloadPdf}
                  className="inline-flex items-center px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-heading font-semibold text-sm rounded-lg transition-all shadow-sm hover:shadow-md">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Télécharger PDF
                </button>
                {/* {canSubmit && (
                  <button
                    onClick={handleSubmit}
                    className="inline-flex items-center px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white font-heading font-semibold text-sm rounded-lg transition-all shadow-sm hover:shadow-md">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Soumettre
                  </button>
                )} */}
                {canEdit && (
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="inline-flex items-center px-5 py-2.5 border border-red-300 text-red-600 hover:bg-red-50 font-heading font-semibold text-sm rounded-lg transition-all disabled:opacity-50">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Supprimer
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-16 py-8">
          <div className="max-w-5xl mx-auto space-y-6">
            
            {/* Project Info */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-6">
              <h2 className="font-heading text-lg font-bold text-neutral-900 mb-4">Informations du projet</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-neutral-600 font-body mb-1">Nom du projet</p>
                  <p className="font-heading font-semibold text-neutral-900">
                    {devis.project_name || 'Sans titre'}
                  </p>
                </div>
                {devis.project_location && (
                  <div>
                    <p className="text-sm text-neutral-600 font-body mb-1">Localisation</p>
                    <p className="font-heading font-semibold text-neutral-900">{devis.project_location}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-neutral-600 font-body mb-1">Type</p>
                  <p className="font-heading font-semibold text-neutral-900">{getTypeLabel(devis.type)}</p>
                </div>
                {devis.type === 'toiture' && devis.toiture_type && (
                  <div>
                    <p className="text-sm text-neutral-600 font-body mb-1">Type de toiture</p>
                    <p className="font-heading font-semibold text-neutral-900">
                      {devis.toiture_type === 'accessible' ? 'Accessible' : 'Non accessible'}
                    </p>
                  </div>
                )}
                {devis.type === 'toiture' && devis.isolation !== null && (
                  <div>
                    <p className="text-sm text-neutral-600 font-body mb-1">Isolation thermique</p>
                    <p className="font-heading font-semibold text-neutral-900">
                      {devis.isolation ? 'Oui (Toiture chaude)' : 'Non'}
                    </p>
                  </div>
                )}
                {devis.finition && (
                  <div>
                    <p className="text-sm text-neutral-600 font-body mb-1">Finition</p>
                    <p className="font-heading font-semibold text-neutral-900">
                      {devis.finition === 'autoprotegee' ? 'Autoprotégée ardoisée' : 'Finition lisse + Lestage'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Dimensions */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-6">
              <h2 className="font-heading text-lg font-bold text-neutral-900 mb-4">Dimensions</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-neutral-50 rounded-xl p-4">
                  <p className="text-xs text-neutral-600 font-body mb-1">Longueur</p>
                  <p className="font-display text-2xl font-bold text-neutral-900">{fmtQty(devis.longueur)} m</p>
                </div>
                <div className="bg-neutral-50 rounded-xl p-4">
                  <p className="text-xs text-neutral-600 font-body mb-1">Largeur</p>
                  <p className="font-display text-2xl font-bold text-neutral-900">{fmtQty(devis.largeur)} m</p>
                </div>
                {devis.perimetre && (
                  <div className="bg-neutral-50 rounded-xl p-4">
                    <p className="text-xs text-neutral-600 font-body mb-1">Périmètre</p>
                    <p className="font-display text-2xl font-bold text-neutral-900">{fmtQty(devis.perimetre)} ml</p>
                  </div>
                )}
                {devis.hauteur_acrotere && (
                  <div className="bg-neutral-50 rounded-xl p-4">
                    <p className="text-xs text-neutral-600 font-body mb-1">H. acrotère</p>
                    <p className="font-display text-2xl font-bold text-neutral-900">{fmtQty(devis.hauteur_acrotere)} m</p>
                  </div>
                )}
                {devis.hauteur && (
                  <div className="bg-neutral-50 rounded-xl p-4">
                    <p className="text-xs text-neutral-600 font-body mb-1">Hauteur</p>
                    <p className="font-display text-2xl font-bold text-neutral-900">{fmtQty(devis.hauteur)} m</p>
                  </div>
                )}
                <div className="bg-primary-50 rounded-xl p-4 col-span-2 md:col-span-1">
                  <p className="text-xs text-primary-600 font-body mb-1">Surface totale</p>
                  <p className="font-display text-2xl font-bold text-primary-600">{fmtQty(devis.surface_brute)} m²</p>
                </div>
              </div>
            </div>

            {/* Materials */}
            {devis.materials && devis.materials.length > 0 && (
              <div className="bg-white border border-neutral-200 rounded-2xl p-6">
                <h2 className="font-heading text-lg font-bold text-neutral-900 mb-4">Liste des matériaux</h2>
                <div className="space-y-2">
                  {devis.materials.map((mat, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition-colors">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-heading font-bold flex-shrink-0">
                          {mat.order || idx + 1}
                        </div>
                        <span className="font-body text-neutral-900">{mat.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-bold text-primary-600">
                          {fmtQty(mat.quantity)}
                        </span>
                        <span className="text-sm text-neutral-600 font-body">{mat.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pricing */}
            <div className="bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-2xl p-6">
              <h2 className="font-heading text-xl font-bold mb-6">Estimation</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-3 border-b border-primary-400">
                  <span className="font-body">Sous-total HT</span>
                  <span className="font-display text-xl font-bold">{fmt(devis.total_ht)}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-primary-400">
                  <span className="font-body">TVA ({devis.tva_rate}%)</span>
                  <span className="font-display text-xl font-bold">{fmt(devis.tva_amount)}</span>
                </div>
                <div className="flex justify-between items-center pt-3">
                  <span className="font-heading text-lg font-bold">Total TTC</span>
                  <span className="font-display text-3xl font-black">{fmt(devis.total_ttc)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {devis.notes && (
              <div className="bg-white border border-neutral-200 rounded-2xl p-6">
                <h2 className="font-heading text-lg font-bold text-neutral-900 mb-4">Notes</h2>
                <p className="text-neutral-700 font-body whitespace-pre-wrap">{devis.notes}</p>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
};

export default ToitureDevisViewPage;