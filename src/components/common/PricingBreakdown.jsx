const PricingBreakdown = ({ calculation, formData }) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 2,
    }).format(price);
  };

  return (
    <div className="bg-gradient-to-br from-primary-500 to-accent-500 text-white rounded-xl p-6">
      <h3 className="font-heading font-bold text-xl mb-6">Calcul détaillé du prix</h3>

      <div className="space-y-4">
        {/* Base Price */}
        <div className="flex justify-between items-center pb-3 border-b border-white/20">
          <div>
            <div className="font-semibold">Prix de base</div>
            <div className="text-xs opacity-80">{formData.surface_m2} m² × prix unitaire</div>
          </div>
          <div className="font-display text-lg">{formatPrice(calculation.prix_base)}</div>
        </div>

        {/* Coefficients */}
        <div className="space-y-2">
          <div className="text-sm font-semibold opacity-90">Application des coefficients:</div>
          
          <div className="flex justify-between items-center pl-4">
            <div>
              <div className="text-sm">Coefficient état</div>
              <div className="text-xs opacity-70 capitalize">{formData.etat_batiment}</div>
            </div>
            <div className="font-semibold">×{calculation.coefficient_etat}</div>
          </div>

          <div className="flex justify-between items-center pl-4">
            <div>
              <div className="text-sm">Coefficient problème</div>
              <div className="text-xs opacity-70 capitalize">{formData.probleme_constate}</div>
            </div>
            <div className="font-semibold">×{calculation.coefficient_probleme}</div>
          </div>

          <div className="flex justify-between items-center pl-4">
            <div>
              <div className="text-sm">Coefficient région</div>
              <div className="text-xs opacity-70 capitalize">{formData.region}</div>
            </div>
            <div className="font-semibold">×{calculation.coefficient_region}</div>
          </div>
        </div>

        {/* After Coefficients */}
        <div className="flex justify-between items-center pt-3 pb-3 border-y border-white/20">
          <div className="font-semibold">Prix après coefficients</div>
          <div className="font-display text-lg">
            {formatPrice(
              calculation.prix_base * 
              calculation.coefficient_etat * 
              calculation.coefficient_probleme * 
              calculation.coefficient_region
            )}
          </div>
        </div>

        {/* Complements */}
        {calculation.couts_complementaires > 0 && (
          <div className="flex justify-between items-center">
            <div>
              <div className="font-semibold">Coûts complémentaires</div>
              <div className="text-xs opacity-80">Relevés, points singuliers, etc.</div>
            </div>
            <div className="font-display text-lg">+{formatPrice(calculation.couts_complementaires)}</div>
          </div>
        )}

        {/* Fixed Costs */}
        {calculation.couts_fixes > 0 && (
          <div className="flex justify-between items-center">
            <div>
              <div className="font-semibold">Coûts fixes</div>
              <div className="text-xs opacity-80">Déplacement, installation</div>
            </div>
            <div className="font-display text-lg">+{formatPrice(calculation.couts_fixes)}</div>
          </div>
        )}

        {/* Subtotal HT */}
        <div className="flex justify-between items-center pt-4 pb-3 border-t-2 border-white/40">
          <div className="font-bold text-lg">Sous-total HT</div>
          <div className="font-display text-2xl">{formatPrice(calculation.subtotal_ht)}</div>
        </div>

        {/* TVA */}
        <div className="flex justify-between items-center">
          <div>
            <div className="font-semibold">TVA</div>
            <div className="text-xs opacity-80">{calculation.tva_rate}%</div>
          </div>
          <div className="font-display text-lg">+{formatPrice(calculation.tva_amount)}</div>
        </div>

        {/* Total TTC */}
        <div className="flex justify-between items-center pt-4 mt-4 border-t-2 border-white">
          <div className="font-bold text-xl">TOTAL TTC</div>
          <div className="font-display text-3xl">{formatPrice(calculation.total_ttc)}</div>
        </div>
      </div>

      {/* Info */}
      <div className="mt-6 pt-6 border-t border-white/20">
        <p className="text-xs opacity-80">
          💡 Ce prix est une estimation basée sur les informations fournies. 
          Le prix final peut varier après visite technique.
        </p>
      </div>
    </div>
  );
};

export default PricingBreakdown;