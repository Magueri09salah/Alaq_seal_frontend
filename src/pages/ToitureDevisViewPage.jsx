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
  const [qrLoading, setQrLoading] = useState(true);

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
      toast.error('Devis introuvable');
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
      toiture: 'Toiture-terrasse',
      mur: 'Mur enterré',
      salle_bain: 'Salle de bain',
    };
    return labels[type] || type;
  };

  const getTypeIcon = (type) => {
    const icons = {
      toiture: '🏠',
      mur: '🧱',
      salle_bain: '🚿',
    };
    return icons[type] || '📋';
  };

  const fmt = (n) => new Intl.NumberFormat('fr-MA', { 
    style: 'currency', 
    currency: 'MAD', 
    minimumFractionDigits: 2 
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
            <p className="text-neutral-600 font-body">Chargement du devis...</p>
          </div>
        </div>
      </>
    );
  }

  if (!devis) return null;

  const canEdit = devis.status === 'draft' || devis.status === 'saved';

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-neutral-50 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-16">
          
          {/* Header with back button */}
          <div className="mb-6 flex items-center justify-between">
            <Link
              to="/dashboard"
              className="inline-flex items-center text-sm font-heading font-medium text-neutral-600 hover:text-primary-600 transition-colors"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Retour au tableau de bord
            </Link>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDownloadPdf}
                className="inline-flex items-center px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-heading font-medium rounded-lg transition-all shadow-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Télécharger PDF
              </button>
              {canEdit && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="inline-flex items-center px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 font-heading font-medium rounded-lg transition-all disabled:opacity-50"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Supprimer
                </button>
              )}
            </div>
          </div>

          {/* Main content grid - 2 columns like PlacoVision */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left column - Client info + Materials (2/3 width) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Client Information */}
              <div className="bg-white rounded-2xl border border-neutral-200 p-6">
                <h2 className="font-heading text-xl font-bold text-neutral-900 mb-6">
                  Informations client
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-neutral-500 font-body mb-1">Nom</p>
                    <p className="font-heading font-semibold text-neutral-900">
                      {devis.user?.name || 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-neutral-500 font-body mb-1">Email</p>
                    <p className="font-body text-neutral-900">
                      {devis.user?.email || 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-neutral-500 font-body mb-1">Téléphone</p>
                    <p className="font-body text-neutral-900">
                      {devis.user?.phone || 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-neutral-500 font-body mb-1">Localisation du projet</p>
                    <p className="font-body text-neutral-900">
                      {devis.project_location || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Materials List */}
              <div className="bg-white rounded-2xl border border-neutral-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center text-xl">
                    {getTypeIcon(devis.type)}
                  </div>
                  <div>
                    <h2 className="font-heading text-xl font-bold text-neutral-900">
                      {getTypeLabel(devis.type)}
                    </h2>
                    <p className="text-sm text-neutral-500 font-body">
                      {devis.project_name || 'Devis d\'étanchéité'}
                    </p>
                  </div>
                </div>

                {/* Surface info */}
                <div className="bg-neutral-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-neutral-600 font-body">
                        {devis.type === 'toiture' && `L=${fmtQty(devis.longueur)}m × l=${fmtQty(devis.largeur)}m`}
                        {devis.type === 'mur' && `L=${fmtQty(devis.longueur)}m × H=${fmtQty(devis.hauteur || devis.largeur)}m`}
                        {devis.type === 'salle_bain' && 'Surface totale'}
                      </p>
                      <p className="text-lg font-heading font-bold text-primary-600 mt-1">
                        {fmtQty(devis.surface_brute)} m²
                      </p>
                    </div>
                    {getStatusBadge(devis.status)}
                  </div>
                </div>

                {/* Materials table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-neutral-200">
                        <th className="text-left py-3 px-2 text-sm font-heading font-semibold text-neutral-700">
                          Matériau
                        </th>
                        <th className="text-center py-3 px-2 text-sm font-heading font-semibold text-neutral-700">
                          Qté calc.
                        </th>
                        <th className="text-center py-3 px-2 text-sm font-heading font-semibold text-neutral-700">
                          Unité
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {devis.materials?.map((material, index) => (
                        <tr key={index} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-heading font-bold flex-shrink-0">
                                {material.order || index + 1}
                              </div>
                              <span className="font-body text-neutral-900">{material.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-center font-heading font-medium text-neutral-900">
                            {fmtQty(material.quantity)}
                          </td>
                          <td className="py-3 px-2 text-center font-body text-neutral-600">
                            {material.unit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-neutral-50">
                        <td colSpan="2" className="py-4 px-2 text-right font-heading font-bold text-neutral-900">
                          Sous-total {getTypeLabel(devis.type)}:
                        </td>
                        <td className="py-4 px-2 text-center font-heading font-bold text-neutral-900">
                          {fmt(devis.total_ht)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Notes section */}
              {devis.notes && (
                <div className="bg-white rounded-2xl border border-neutral-200 p-6">
                  <h3 className="font-heading text-lg font-bold text-neutral-900 mb-3">
                    Notes
                  </h3>
                  <p className="font-body text-neutral-700 whitespace-pre-wrap">
                    {devis.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Right column - Summary + QR Code (1/3 width) */}
            <div className="space-y-6">
              
              {/* Summary card */}
              <div className="bg-white rounded-2xl border border-neutral-200 p-6">
                <h3 className="font-heading text-lg font-bold text-neutral-900 mb-6">
                  Récapitulatif
                </h3>

                {/* Work summary */}
                <div className="mb-6 pb-6 border-b border-neutral-200">
                  <p className="text-sm text-neutral-500 font-body mb-3">
                    Travaux inclus :
                  </p>
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 bg-primary-100 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm font-body text-neutral-700">
                      {getTypeLabel(devis.type)} ({devis.materials?.length || 0} produit{devis.materials?.length > 1 ? 's' : ''})
                    </span>
                  </div>
                </div>

                {/* Pricing */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-body text-neutral-600">Total HT</span>
                    <span className="font-heading font-semibold text-neutral-900">
                      {fmt(devis.total_ht)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-body text-neutral-600">TVA ({devis.tva_rate || 20}%)</span>
                    <span className="font-heading font-semibold text-neutral-900">
                      {fmt(devis.tva_amount)}
                    </span>
                  </div>
                  
                  <div className="pt-3 border-t border-neutral-200">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-heading font-bold text-neutral-900">
                        Total TTC
                      </span>
                      <span className="text-xl font-heading font-bold text-red-600">
                        {fmt(devis.total_ttc)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Validity */}
                <div className="mt-6 pt-6 border-t border-neutral-200">
                  <p className="text-sm text-neutral-600 font-body">
                    Devis valable jusqu'au{' '}
                    <span className="font-semibold text-neutral-900">
                      {new Date(new Date(devis.created_at).getTime() + 30 * 24 * 60 * 60 * 1000)
                        .toLocaleDateString('fr-FR', { 
                          day: 'numeric', 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                    </span>
                  </p>
                </div>

                {/* Technical details */}
                {devis.type === 'toiture' && (
                  <div className="mt-6 pt-6 border-t border-neutral-200">
                    <div className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="text-sm font-heading font-semibold text-neutral-900 mb-1">
                          Spécifications techniques
                        </p>
                        <ul className="text-xs text-neutral-600 font-body space-y-1">
                          <li>• Type: {devis.toiture_type === 'accessible' ? 'Accessible' : 'Non accessible'}</li>
                          <li>• Isolation: {devis.isolation ? 'Oui (toiture chaude)' : 'Non'}</li>
                          {devis.finition && (
                            <li>• Finition: {devis.finition === 'autoprotegee' ? 'Autoprotégée' : 'Lestage'}</li>
                          )}
                          {devis.hauteur_acrotere > 0 && (
                            <li>• Hauteur acrotère: {devis.hauteur_acrotere}m</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {devis.type === 'mur' && (
                  <div className="mt-6 pt-6 border-t border-neutral-200">
                    <div className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="text-sm font-heading font-semibold text-neutral-900 mb-1">
                          Spécifications techniques
                        </p>
                        <ul className="text-xs text-neutral-600 font-body space-y-1">
                          <li>• Niveau d'eau: {
                            devis.water_level === 'humidite' ? 'Humidité du sol' :
                            devis.water_level === 'infiltration' ? 'Infiltration' :
                            devis.water_level === 'nappe' ? 'Nappe phréatique' : devis.water_level || 'N/A'
                          }</li>
                          <li>• Drainage: {devis.drain ? 'Oui' : 'Non'}</li>
                          {devis.hauteur_technique && (
                            <li>• Hauteur technique: {devis.hauteur_technique}m</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {devis.type === 'salle_bain' && devis.sdb_type && (
                  <div className="mt-6 pt-6 border-t border-neutral-200">
                    <div className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="text-sm font-heading font-semibold text-neutral-900 mb-1">
                          Spécifications techniques
                        </p>
                        <ul className="text-xs text-neutral-600 font-body space-y-1">
                          <li>• Type: {devis.sdb_type === 'avec_bac' ? 'Avec bac' : 'Italienne'}</li>
                          <li>• Support: {devis.support === 'ciment' ? 'Chape ciment' : 'Carrelage'}</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* QR Code card */}
              {devis.public_pdf_url && (
                <div className="bg-white rounded-2xl border border-neutral-200 p-6">
                  <div className="text-center">
                    <div className="inline-block p-4 bg-white rounded-lg border-2 border-neutral-200">
                      {qrLoading && (
                        <div className="flex items-center justify-center" style={{ width: 160, height: 160 }}>
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                        </div>
                      )}
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(devis.public_pdf_url)}&format=png&margin=8`}
                        alt={`QR Code ${devis.devis_number}`}
                        className={`rounded ${qrLoading ? 'hidden' : 'block'}`}
                        style={{ width: 160, height: 160 }}
                        onLoad={() => setQrLoading(false)}
                        onError={() => setQrLoading(false)}
                      />
                    </div>
                    <div className="mt-4 flex items-center justify-center gap-2">
                      <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm text-neutral-600 font-body">
                        Scannez avec votre téléphone
                      </p>
                    </div>
                    <p className="text-xs text-neutral-500 font-body mt-2">
                      Pour télécharger le PDF directement
                    </p>
                  </div>
                </div>
              )}

              {/* Devis number card */}
              <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-6 text-white">
                <p className="text-sm opacity-90 font-body mb-1">Numéro de devis</p>
                <p className="text-2xl font-heading font-bold">{devis.devis_number}</p>
                <p className="text-sm opacity-90 font-body mt-3">
                  Créé le {new Date(devis.created_at).toLocaleDateString('fr-FR', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default ToitureDevisViewPage;