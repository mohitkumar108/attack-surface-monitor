import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import axios from 'axios';
import { ShodanResponse, VirusTotalResponse, VirusTotalSimpleResponse, ThreatData } from '../types';

interface ApiContextType {
  loading: boolean;
  error: string | null;
  threatData: ThreatData[];
  fetchShodanData: (ip: string) => Promise<ShodanResponse | null>;
  fetchVirusTotalData: (ip: string) => Promise<VirusTotalResponse | null>;
  fetchVirusTotalSimple: (ip: string) => Promise<VirusTotalSimpleResponse | null>;
  analyzeThreat: (ip: string) => Promise<void>;
  clearError: () => void;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

export const useApi = () => {
  const context = useContext(ApiContext);
  if (context === undefined) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
};

interface ApiProviderProps {
  children: ReactNode;
}

export const ApiProvider: React.FC<ApiProviderProps> = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [threatData, setThreatData] = useState<ThreatData[]>([]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchShodanData = useCallback(async (ip: string): Promise<ShodanResponse | null> => {
    try {
      setLoading(true);
      setError(null);
      
      // In a real application, this would call your backend API
      // For demo purposes, we'll simulate the API call
      const response = await axios.get(`/api/shodan/${ip}`);
      return response.data;
    } catch (err) {
      setError('Failed to fetch Shodan data');
      console.error('Shodan API error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchVirusTotalData = useCallback(async (ip: string): Promise<VirusTotalResponse | null> => {
    try {
      setLoading(true);
      setError(null);
      
      // In a real application, this would call your backend API
      const response = await axios.get(`/api/virustotal/${ip}`);
      return response.data;
    } catch (err) {
      setError('Failed to fetch VirusTotal data');
      console.error('VirusTotal API error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchVirusTotalSimple = useCallback(async (ip: string): Promise<VirusTotalSimpleResponse | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`/api/virustotal/simple/${ip}`);
      return response.data;
    } catch (err) {
      setError('Failed to fetch VirusTotal simple data');
      console.error('VirusTotal simple API error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const analyzeThreat = useCallback(async (ip: string) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch data from both APIs
      const [shodanData, vtSimpleData] = await Promise.all([
        fetchShodanData(ip),
        fetchVirusTotalSimple(ip)
      ]);

      if (shodanData && vtSimpleData) {
        // Process and combine data
        const threatInfo: ThreatData = {
          id: `threat-${Date.now()}`,
          ip: ip,
          country: shodanData.data[0]?.location?.country_name || 'Unknown',
          city: shodanData.data[0]?.location?.city || 'Unknown',
          org: shodanData.org,
          ports: vtSimpleData.ports,
          vulnerabilities: vtSimpleData.vulns,
          riskLevel: vtSimpleData.vulns.length > 0 ? 'high' : vtSimpleData.ports.length > 5 ? 'medium' : 'low',
          lastSeen: new Date().toISOString(),
          services: shodanData.data.map(item => item.product || 'Unknown').filter(Boolean)
        };

        setThreatData(prev => [threatInfo, ...prev.slice(0, 9)]); // Keep last 10 threats
      }
    } catch (err) {
      setError('Failed to analyze threat');
      console.error('Threat analysis error:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchShodanData, fetchVirusTotalSimple]);

  const value: ApiContextType = {
    loading,
    error,
    threatData,
    fetchShodanData,
    fetchVirusTotalData,
    fetchVirusTotalSimple,
    analyzeThreat,
    clearError
  };

  return (
    <ApiContext.Provider value={value}>
      {children}
    </ApiContext.Provider>
  );
};