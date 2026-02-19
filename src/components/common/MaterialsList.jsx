const MaterialsList = ({ materials }) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getTypeIcon = (type) => {
    const icons = {
      membrane: '🏗️',
      resine: '🧪',
      primaire: '🎨',
      enduit: '🧱',
      accessoire: '🔧',
    };
    return icons[type] || '📦';
  };

  const getTypeLabel = (type) => {
    const labels = {
      membrane: 'Membrane',
      resine: 'Résine',
      primaire: 'Primaire',
      enduit: 'Enduit',
      accessoire: 'Accessoire',
    };
    return labels[type] || type;
  };

  if (!materials || materials.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-6">
      <h3 className="font-heading font-bold text-lg mb-4">
        Matériaux nécessaires
      </h3>
      
      <div className="space-y-3">
        {materials.map((material, index) => (
          <div
            key={index}
            className="flex items-center gap-4 p-4 bg-neutral-50 rounded-lg border border-neutral-200"
          >
            <div className="text-3xl">{getTypeIcon(material.type)}</div>
            
            <div className="flex-1">
              <div className="font-semibold text-sm">{material.nom}</div>
              <div className="text-xs text-neutral-600">
                <span className="inline-block bg-neutral-200 px-2 py-0.5 rounded">
                  {getTypeLabel(material.type)}
                </span>
              </div>
            </div>

            <div className="text-right">
              <div className="font-display text-lg text-primary-500">
                {material.quantite} {material.unite}
              </div>
              {material.prix_unitaire > 0 && material.cout_total > 0 && (
                <div className="text-xs text-neutral-600">
                  {formatPrice(material.prix_unitaire)}/{material.unite} = {formatPrice(material.cout_total)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-neutral-200">
        <p className="text-xs text-neutral-600">
          💡 Les quantités incluent déjà les pertes et le nombre de couches nécessaires
        </p>
      </div>
    </div>
  );
};

export default MaterialsList;