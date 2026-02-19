const AlertBadge = ({ alert }) => {
  const config = {
    error: {
      bg: 'bg-error-50',
      border: 'border-error-300',
      text: 'text-error-800',
      icon: '🔴',
    },
    warning: {
      bg: 'bg-warning-50',
      border: 'border-warning-300',
      text: 'text-warning-800',
      icon: '🟡',
    },
    info: {
      bg: 'bg-accent-50',
      border: 'border-accent-300',
      text: 'text-accent-800',
      icon: '🔵',
    },
  };

  const style = config[alert.niveau] || config.info;

  return (
    <div className={`${style.bg} border-2 ${style.border} rounded-lg p-4`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">{alert.icon || style.icon}</span>
        <div className="flex-1">
          <p className={`${style.text} font-semibold text-sm`}>
            {alert.message}
          </p>
          {alert.action && (
            <p className={`${style.text} text-xs mt-1 opacity-90`}>
              <strong>Action:</strong> {alert.action}
            </p>
          )}
          {alert.bloque && (
            <p className="text-error-600 text-xs mt-2 font-bold">
              ⚠️ Cette erreur bloque la création du devis
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertBadge;