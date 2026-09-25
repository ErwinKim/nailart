'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import AetherHero from '@/components/main/hero';
import { useAuth } from '@/components/providers/auth-provider';

export default function AuthPage() {
	const router = useRouter();
	const { error, loading, signInWithGoogle, user } = useAuth();

	useEffect(() => {
		if (!loading && user) router.replace('/dashboard');
	}, [loading, router, user]);

	return (
		<main className="auth-page">
			<AetherHero
				className="auth-background"
				title=""
				subtitle=""
				ctaLabel=""
				secondaryCtaLabel=""
			/>
			<div className="auth-noise" aria-hidden="true" />
			<div className="auth-glow auth-glow-primary" aria-hidden="true" />
			<div className="auth-glow auth-glow-secondary" aria-hidden="true" />

			<header className="auth-header">
				<Link className="site-logo" href="/" aria-label="NailArt AI home">
					<span className="site-logo-mark">N</span>
					<span>NailArt <em>AI</em></span>
				</Link>
				<Link className="auth-back-link" href="/">
					Back to home <span aria-hidden="true">↗</span>
				</Link>
			</header>

			<section className="auth-content" aria-label="Sign in">
				<div className="auth-card">
					<div className="auth-card-heading">
						<span className="auth-card-label">Enter NailArt AI</span>
						<span className="auth-card-status"><i aria-hidden="true" /> Studio ready</span>
					</div>
					<button className="google-button" type="button" onClick={signInWithGoogle} disabled={loading}>
						<span className="google-icon" aria-hidden="true">G</span>
						{loading ? 'Checking session...' : 'Continue with Google'}
						<span className="google-arrow" aria-hidden="true">↗</span>
					</button>
					{error ? <p className="auth-error" role="alert">{error}</p> : null}
					<p className="auth-legal">
						By continuing, you agree to our Terms and Privacy Policy.
					</p>
				</div>
			</section>

			<div className="auth-footer" aria-hidden="true">
				<span>NAILART AI / 2026</span>
				<span>CREATE WITH INTENT</span>
			</div>
		</main>
	);
}
