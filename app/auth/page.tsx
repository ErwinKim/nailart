import Link from 'next/link';
import AetherHero from '@/components/main/hero';

export default function AuthPage() {
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

			<section className="auth-content" aria-labelledby="auth-title">
				<div className="auth-card">
					<div className="auth-card-heading">
						<span className="auth-card-label">Enter NailArt AI</span>
						<span className="auth-card-status"><i aria-hidden="true" /> Studio ready</span>
					</div>
					<button className="google-button" type="button">
						<span className="google-icon" aria-hidden="true">G</span>
						Continue with Google
						<span className="google-arrow" aria-hidden="true">↗</span>
					</button>
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
