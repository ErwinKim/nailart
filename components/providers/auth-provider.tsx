'use client';

import type { User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export type UserProfile = {
	id: string;
	email: string;
	display_name: string | null;
	avatar_url: string | null;
	created_at: string;
	updated_at: string;
};

type AuthContextValue = {
	user: User | null;
	profile: UserProfile | null;
	loading: boolean;
	error: string | null;
	signInWithGoogle: () => Promise<void>;
	signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [profile, setProfile] = useState<UserProfile | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const supabase = createClient();

		const loadProfile = async (currentUser: User | null) => {
			if (!currentUser) {
				setProfile(null);
				return;
			}

			const { data, error: profileError } = await supabase
				.from('users')
				.select('*')
				.eq('id', currentUser.id)
				.maybeSingle();

			if (profileError) {
				setError(profileError.message);
				return;
			}

			setProfile(data as UserProfile | null);
		};

		void supabase.auth.getUser().then(async ({ data: { user: currentUser } }) => {
			setUser(currentUser);
			await loadProfile(currentUser);
			setLoading(false);
		});

		const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
			const currentUser = session?.user ?? null;
			setUser(currentUser);
			void loadProfile(currentUser);
		});

		return () => listener.subscription.unsubscribe();
	}, []);

	const signInWithGoogle = async () => {
		setError(null);
		const supabase = createClient();
		const { error: signInError } = await supabase.auth.signInWithOAuth({
			provider: 'google',
			options: {
				redirectTo: `${window.location.origin}/auth/callback`,
			},
		});

		if (signInError) setError(signInError.message);
	};

	const signOut = async () => {
		const supabase = createClient();
		const { error: signOutError } = await supabase.auth.signOut();
		if (signOutError) setError(signOutError.message);
	};

	return (
		<AuthContext.Provider value={{ user, profile, loading, error, signInWithGoogle, signOut }}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) throw new Error('useAuth must be used inside AuthProvider');
	return context;
}
