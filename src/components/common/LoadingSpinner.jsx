const LoadingSpinner = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-500 mx-auto"></div>
        <p className="mt-4 text-neutral-600 font-heading">Chargement...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;