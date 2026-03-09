import { useState, useRef, useEffect } from 'react';

// List of major Moroccan cities
const MOROCCAN_CITIES = [
  'Casablanca',
  'Rabat',
  'Fès',
  'Marrakech',
  'Agadir',
  'Tanger',
  'Meknès',
  'Oujda',
  'Kenitra',
  'Tétouan',
  'Safi',
  'Salé',
  'Temara',
  'Mohammedia',
  'Khouribga',
  'El Jadida',
  'Béni Mellal',
  'Nador',
  'Taza',
  'Settat',
  'Khemisset',
  'Inezgane',
  'Larache',
  'Guelmim',
  'Ksar El Kebir',
  'Berkane',
  'Taourirt',
  'Bouskoura',
  'Fquih Ben Salah',
  'Dcheira El Jihadia',
  'Oued Zem',
  'El Kelaa Des Sraghna',
  'Sidi Slimane',
  'Errachidia',
  'Guercif',
  'Oulad Teima',
  'Ben Guerir',
  'Tifelt',
  'Lqliaa',
  'Taroudant',
  'Sefrou',
  'Essaouira',
  'Fnideq',
  'Sidi Kacem',
  'Tiznit',
  'Tan-Tan',
  'Ouarzazate',
  'Souk El Arbaa',
  'Youssoufia',
  'Laâyoune',
  'Martil',
  'Ain Harrouda',
  'Suq as-Sabt Awlad an-Nama',
  'Skhirate',
  'Ouazzane',
  'Benslimane',
  'Al Hoceima',
  'Beni Ansar',
  'M\'diq',
  'Sidi Bennour',
  'Midelt',
  'Azrou',
  'Drargua',
  'Ain Aouda',
  'Zagora',
  'Asilah',
  'Chefchaouen',
  'Ifrane',
  'Sidi Yahia El Gharb',
].sort();

export default function CityAutocomplete({ value, onChange, placeholder = "Ex: Casablanca", className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredCities, setFilteredCities] = useState(MOROCCAN_CITIES);
  const wrapperRef = useRef(null);

  // Filter cities as user types
  useEffect(() => {
    if (!value) {
      setFilteredCities(MOROCCAN_CITIES);
      return;
    }

    const filtered = MOROCCAN_CITIES.filter(city =>
      city.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredCities(filtered);
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (city) => {
    onChange(city);
    setIsOpen(false);
  };

  const handleInputChange = (e) => {
    onChange(e.target.value);
    setIsOpen(true);
  };

  const handleFocus = () => {
    setIsOpen(true);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={handleFocus}
        className={`w-full px-4 py-3 border border-neutral-300 rounded-lg font-body focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${className}`}
        placeholder={placeholder}
        autoComplete="off"
      />

      {isOpen && filteredCities.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredCities.map((city, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelect(city)}
              className="w-full text-left px-4 py-3 hover:bg-primary-50 hover:text-primary-600 transition-colors font-body text-sm border-b border-neutral-100 last:border-b-0"
            >
              {city}
            </button>
          ))}
        </div>
      )}

      {isOpen && filteredCities.length === 0 && value && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg p-4">
          <p className="text-sm text-neutral-500 font-body">
            Aucune ville trouvée pour "{value}"
          </p>
        </div>
      )}
    </div>
  );
}