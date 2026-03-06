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

const defaultCompanies: Company[] = [
  {
    id: '1',
    name: 'Teleriza Telecom',
    slug: 'teleriza',
    branding: { systemName: 'Teleriza DNS Monitor', logoUrl: null },
    dnsServers: ['170.245.94.203', '170.245.94.204'],
    active: true,
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'NetSpeed Internet',
    slug: 'netspeed',
    branding: { systemName: 'NetSpeed DNS Guard', logoUrl: null },
    dnsServers: ['192.168.1.1'],
    active: true,
    createdAt: '2024-03-20',
  },
  {
    id: '3',
    name: 'FibraMax Telecom',
    slug: 'fibramax',
    branding: { systemName: 'FibraMax Security DNS', logoUrl: null },
    dnsServers: ['10.0.0.1', '10.0.0.2'],
    active: false,
    createdAt: '2024-06-10',
  },
];

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
