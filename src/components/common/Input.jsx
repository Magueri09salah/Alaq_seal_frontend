const Input = ({ label, error, ...props }) => {
  return (
    <div className="mb-6">
      {label && (
        <label className="block text-neutral-700 font-heading font-semibold mb-2">
          {label}
        </label>
      )}
      <input
        className={`form-input ${error ? 'border-error-500 focus:border-error-500' : ''}`}
        {...props}
      />
      {error && (
        <p className="text-error-500 text-sm mt-2 font-body">{error}</p>
      )}
    </div>
  );
};

export default Input;