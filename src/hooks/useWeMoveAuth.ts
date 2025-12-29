import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface CountryCode {
  id: string;
  country_name: string;
  country_iso: string;
  dial_code: string;
}

export function useWeMoveAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [countryCodes, setCountryCodes] = useState<CountryCode[]>([]);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchCountryCodes = async () => {
      const { data, error } = await supabase
        .from('country_codes')
        .select('*')
        .eq('is_active', true)
        .order('country_name');
      
      if (!error && data) {
        setCountryCodes(data);
      }
    };

    fetchCountryCodes();
  }, []);

  const signUp = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    dialCode: string,
    phoneNumber: string,
    documentType: 'id_card' | 'driver_license' | 'passport',
    documentNumber: string
  ) => {
    const redirectUrl = `${window.location.origin}/wemove/dashboard`;
    const phoneFull = `${dialCode}${phoneNumber.replace(/\D/g, '')}`;

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          first_name: firstName,
          last_name: lastName,
        }
      }
    });

    if (authError) {
      return { error: authError };
    }

    if (!authData.user) {
      return { error: new Error('User creation failed') };
    }

    // Create user record
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        phone_full: phoneFull,
        first_name: firstName,
        last_name: lastName,
        document_type: documentType,
        document_number: documentNumber,
        status: 'pending'
      });

    if (userError) {
      return { error: userError };
    }

    // Create wemove_transporters record
    const { error: transporterError } = await supabase
      .from('wemove_transporters')
      .insert({
        user_id: authData.user.id,
        verification_status: 'pending',
        active: false
      });

    if (transporterError) {
      return { error: transporterError };
    }

    return { data: authData, error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error };
    }

    if (!data.user) {
      return { error: new Error('Login failed') };
    }

    // Check if user has wemove_transporter role by checking wemove_transporters table
    const { data: transporterData, error: transporterError } = await supabase
      .from('wemove_transporters')
      .select('id')
      .eq('user_id', data.user.id)
      .maybeSingle();

    if (transporterError) {
      await supabase.auth.signOut();
      return { error: transporterError };
    }

    if (!transporterData) {
      await supabase.auth.signOut();
      return { error: new Error('not_wemove_transporter') };
    }

    return { data, error: null };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    user,
    session,
    loading,
    countryCodes,
    signUp,
    signIn,
    signOut,
  };
}
