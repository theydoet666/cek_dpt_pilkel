import React, { useState } from 'react';
import { Search, X, Fingerprint, User } from 'lucide-react';
import { Button } from '../shared/Button';

interface SearchFormProps {
  onSearch: (query: string) => void;
  loading: boolean;
  initialQuery?: string;
}

export const SearchForm: React.FC<SearchFormProps> = ({
  onSearch,
  loading,
  initialQuery = '',
}) => {
  const [query, setQuery] = useState(initialQuery);

  const isNikInput = /^\d+$/.test(query.trim());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const handleClear = () => {
    setQuery('');
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-3">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
          {isNikInput && query.length > 0 ? (
            <Fingerprint className="w-5 h-5 text-emerald-600 animate-pulse" />
          ) : (
            <User className="w-5 h-5 text-slate-400" />
          )}
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ketik NIK / NIK Tersamar atau Nama pemilih..."
          className="w-full pl-11 pr-12 py-3.5 sm:py-4 bg-white border border-slate-300 rounded-2xl text-slate-900 placeholder-slate-400 text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 shadow-sm transition-all min-h-[52px]"
          disabled={loading}
          autoComplete="off"
        />

        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
            title="Bersihkan input"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Auto Detect Mode Indicator */}
      {query.trim().length > 0 && (
        <div className="flex items-center justify-between text-xs text-slate-500 px-2 animate-fade-in">
          <span>
            Mode Pencarian:{' '}
            <strong className="text-emerald-800 font-semibold">
              {isNikInput
                ? `Pencarian NIK (${query.trim().length} Digit)`
                : 'Pencarian Nama Pemilih'}
            </strong>
          </span>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        loading={loading}
        icon={<Search className="w-5 h-5" />}
        className="text-base sm:text-lg py-4 shadow-lg shadow-emerald-800/15"
      >
        Cek Status DPT
      </Button>

      {/* Helper suggestion buttons */}
      <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
        <span>Contoh pencarian:</span>
        <button
          type="button"
          onClick={() => {
            setQuery('GEDE ARIE');
            onSearch('GEDE ARIE');
          }}
          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium"
        >
          "GEDE ARIE"
        </button>
        <button
          type="button"
          onClick={() => {
            setQuery('5104021201910391');
            onSearch('5104021201910391');
          }}
          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium"
        >
          NIK 16 Digit
        </button>
      </div>
    </form>
  );
};
