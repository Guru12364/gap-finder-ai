'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Subject } from '@/types';

export function useSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubjects = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/subjects');
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setSubjects(data.data || []);
      }
    } catch (err) {
      setError('Failed to fetch subjects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const createSubject = async (name: string, description?: string) => {
    try {
      const res = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }
      await fetchSubjects();
      return data.data;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to create subject');
    }
  };

  return { subjects, loading, error, fetchSubjects, createSubject };
}
