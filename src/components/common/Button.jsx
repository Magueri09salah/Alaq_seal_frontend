const Button = ({ children, variant = 'primary', loading = false, ...props }) => {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
  };

  return (
    <button
      className={`${variants[variant]} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      disabled={loading}
      {...props}
    >
      {loading ? 'Chargement...' : children}
    </button>
  );
};

export default Button;