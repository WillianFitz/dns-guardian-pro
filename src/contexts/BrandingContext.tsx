import React, { createContext, useContext, useState, ReactNode } from 'react';

interface BrandingConfig {
  systemName: string;
  logoUrl: string | null;
  primaryColor?: string;
}

interface Company {
  id: string;
  name: string;
  slug: string;
  branding: BrandingConfig;
  dnsServers: string[];
  active: boolean;
  createdAt: string;
}

interface BrandingContextType {
  currentBranding: BrandingConfig;
  setCurrentBranding: (b: BrandingConfig) => void;
  companies: Company[];
  setCompanies: React.Dispatch<React.SetStateAction<Company[]>>;
  isAdmin: boolean;
  setIsAdmin: (v: boolean) => void;
}

const defaultBranding: BrandingConfig = {
  systemName: 'DNS Monitor',
  logoUrl: null,
};

const defaultCompanies: Company[] = [];

const BrandingContext = createContext<BrandingContextType>({
  currentBranding: defaultBranding,
  setCurrentBranding: () => {},
  companies: [],
  setCompanies: () => {},
  isAdmin: false,
  setIsAdmin: () => {},
});

export const useBranding = () => useContext(BrandingContext);

export const BrandingProvider = ({ children }: { children: ReactNode }) => {
  const [currentBranding, setCurrentBranding] = useState<BrandingConfig>(defaultBranding);
  const [companies, setCompanies] = useState<Company[]>(defaultCompanies);
  const [isAdmin, setIsAdmin] = useState(false);

  return (
    <BrandingContext.Provider value={{ currentBranding, setCurrentBranding, companies, setCompanies, isAdmin, setIsAdmin }}>
      {children}
    </BrandingContext.Provider>
  );
};

export type { BrandingConfig, Company };
