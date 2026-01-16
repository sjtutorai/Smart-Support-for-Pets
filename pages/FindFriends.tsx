import React, { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, PawPrint, User as UserIcon } from 'lucide-react';
import { searchPetsAndOwners } from '../services/firebase';
import { Link } from 'react-router-dom';
import debounce from 'lodash.debounce';
import { PetProfile, User } from '../types';

interface SearchResult {
  pet: PetProfile;
  owner: User | null;
}

const SearchPage: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const debouncedSearch = useCallback(debounce(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      setHasSearched(false);
      return;
    }
    
    setIsLoading(true);
    setHasSearched(true);
    try {
      const searchResults = await searchPetsAndOwners(query);
      setResults(searchResults);
    } catch (error) {
      console.error("Error searching:", error);
    } finally {
      setIsLoading(false);
    }
  }, 400), []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchText(query);
    setIsLoading(true);
    debouncedSearch(query);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20 animate-fade-in">
      <div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Community Search</h2>
        <p className="text-slate-500 font-medium">Discover new pets and friends in the SS Paw Pal network.</p>
      </div>

      <div className="relative">
        <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={searchText}
          onChange={handleSearchChange}
          placeholder="Search pets or owners..."
          className="w-full bg-white border border-slate-200 rounded-2xl py-6 pl-14 pr-6 text-lg font-medium outline-none focus:ring-4 focus:ring-theme/10 transition-all shadow-sm"
          autoFocus
        />
        {isLoading && <Loader2 size={20} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />}
      </div>

      <div className="space-y-3">
        {results.map(({ pet, owner }) => (
          <Link
            key={pet.id}
            to={`/pet/${pet.id}`}
            className="group bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-5 transition-all hover:shadow-lg hover:border-theme-light hover:scale-[1.02] active:scale-[0.99]"
          >
            <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-100 shrink-0 border-4 border-white shadow-md group-hover:border-theme-light transition-all">
              <img src={pet.avatarUrl || `https://ui-avatars.com/api/?name=${pet.name}&background=random`} alt={pet.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <h4 className="font-black text-slate-800 text-lg group-hover:text-theme transition-colors">{pet.name}</h4>
              <p className="text-sm font-medium text-slate-400">{owner?.displayName || 'Unknown Owner'}</p>
            </div>
            <div className="px-4 py-2 bg-slate-50 rounded-xl text-xs font-bold text-slate-400 group-hover:bg-theme-light group-hover:text-theme transition-colors">
              {pet.breed}
            </div>
          </Link>
        ))}
        
        {hasSearched && !isLoading && results.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-100">
            <PawPrint size={48} className="mx-auto text-slate-200 mb-4" />
            <h4 className="font-black text-slate-600">No Companions Found</h4>
            <p className="text-slate-400 text-sm mt-1">Try a different name or check for typos.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;