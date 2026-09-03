import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface LogoContextType {
  logoUrl: string | null;
  updateLogo: (url: string | null) => Promise<void>;
  resetLogo: () => Promise<void>;
  loading: boolean;
}

const LogoContext = createContext<LogoContextType>({
  logoUrl: null,
  updateLogo: async () => {},
  resetLogo: async () => {},
  loading: false,
});

const DEFAULT_FAVICON = '/favicon.svg';

export const LogoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logoUrl, setLogoUrlState] = useState<string | null>(() => {
    return localStorage.getItem('app_logo_url') || null;
  });
  const [loading, setLoading] = useState(false);

  // Update browser favicon dynamically
  const updateFavicon = (url: string | null) => {
    try {
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = url || DEFAULT_FAVICON;
    } catch (e) {
      console.error('Error updating favicon:', e);
    }
  };

  // Fetch initial logo setting from Supabase / localStorage
  useEffect(() => {
    const fetchSettings = async () => {
      // Apply cached local logo first
      const cached = localStorage.getItem('app_logo_url');
      if (cached) {
        setLogoUrlState(cached);
        updateFavicon(cached);
      }

      try {
        const isPlaceholder = import.meta.env.VITE_SUPABASE_URL?.includes('placeholder');
        if (!isPlaceholder) {
          const { data, error } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', 'logo_url')
            .maybeSingle();

          if (!error && data?.value) {
            setLogoUrlState(data.value);
            localStorage.setItem('app_logo_url', data.value);
            updateFavicon(data.value);
          }
        }
      } catch {
        // Safe fallback to localStorage if app_settings table does not exist yet
      }
    };

    fetchSettings();
  }, []);

  const updateLogo = async (newUrl: string | null) => {
    setLoading(true);
    try {
      if (newUrl) {
        localStorage.setItem('app_logo_url', newUrl);
        setLogoUrlState(newUrl);
        updateFavicon(newUrl);
      } else {
        localStorage.removeItem('app_logo_url');
        setLogoUrlState(null);
        updateFavicon(DEFAULT_FAVICON);
      }

      // Sync to Supabase if connected
      const isPlaceholder = import.meta.env.VITE_SUPABASE_URL?.includes('placeholder');
      if (!isPlaceholder) {
        if (newUrl) {
          const { error } = await supabase.from('app_settings').upsert({
            key: 'logo_url',
            value: newUrl,
            updated_at: new Date().toISOString(),
          });
          if (error) {
            console.warn('Note: Run schema.sql in Supabase to sync logo online:', error.message);
          }
        } else {
          await supabase.from('app_settings').delete().eq('key', 'logo_url');
        }
      }
    } catch (err) {
      console.warn('Saved logo locally (Supabase table app_settings pending SQL execution).');
    } finally {
      setLoading(false);
    }
  };

  const resetLogo = async () => {
    await updateLogo(null);
  };

  return (
    <LogoContext.Provider value={{ logoUrl, updateLogo, resetLogo, loading }}>
      {children}
    </LogoContext.Provider>
  );
};

export const useAppLogo = () => useContext(LogoContext);
