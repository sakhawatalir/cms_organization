'use client'

import React, { useState, useEffect } from 'react';

interface LookupOption {
  id: string;
  name: string;
  [key: string]: any;
}

interface LookupFieldProps {
  value: string;
  onChange: (value: string) => void;
  lookupType: 'organizations' | 'hiring-managers' | 'job-seekers' | 'jobs';
  placeholder?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

export default function LookupField({
  value,
  onChange,
  lookupType,
  placeholder = 'Select an option',
  required = false,
  className = "w-full p-2 border-b border-gray-300 focus:outline-none focus:border-blue-500",
  disabled = false
}: LookupFieldProps) {
  const [options, setOptions] = useState<LookupOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOptions();
  }, [lookupType]);

  const fetchOptions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const apiEndpoint = `/api/${lookupType}`;
      const response = await fetch(apiEndpoint);

      if (!response.ok) {
        throw new Error(`Failed to fetch ${lookupType}`);
      }

      const data = await response.json();
      
      // Handle different response structures
      let fetchedOptions: LookupOption[] = [];
      
      if (lookupType === 'organizations') {
        fetchedOptions = (data.organizations || []).map((org: any) => ({
          id: org.id.toString(),
          name: org.name
        }));
      } else if (lookupType === 'hiring-managers') {
        fetchedOptions = (data.hiringManagers || []).map((hm: any) => ({
          id: hm.id.toString(),
          name: hm.full_name || `${hm.first_name} ${hm.last_name}`
        }));
      } else if (lookupType === 'job-seekers') {
        fetchedOptions = (data.jobSeekers || []).map((js: any) => ({
          id: js.id.toString(),
          name: js.full_name || `${js.first_name} ${js.last_name}`
        }));
      } else if (lookupType === 'jobs') {
        fetchedOptions = (data.jobs || []).map((job: any) => ({
          id: job.id.toString(),
          name: job.job_title
        }));
      }

      setOptions(fetchedOptions);
    } catch (err) {
      console.error(`Error fetching ${lookupType}:`, err);
      setError(err instanceof Error ? err.message : 'Failed to load options');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <select className={className} disabled>
        <option>Loading...</option>
      </select>
    );
  }

  if (error) {
    return (
      <select className={className} disabled>
        <option>Error loading options</option>
      </select>
    );
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
      required={required}
      disabled={disabled}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.name}
        </option>
      ))}
    </select>
  );
}

