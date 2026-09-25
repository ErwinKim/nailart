'use client';

import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';

function getInitials(name: string) {
	return name
		.split(' ')
		.map((part) => part[0])
		.join('')
		.slice(0, 2)
		.toUpperCase();
}

export default function DashboardNav() {
	const { profile, user, signOut } = useAuth();
	const displayName = profile?.display_name || user?.user_metadata.full_name || user?.email?.split('@')[0] || 'Creator';
	const email = profile?.email || user?.email || '';
	const initials = getInitials(displayName);
	const avatarUrl = profile?.avatar_url || user?.user_metadata.avatar_url || user?.user_metadata.picture;

	return (
		<header className="dashboard-header">
			<Link className="site-logo" href="/" aria-label="NailArt AI home">
				<span className="site-logo-mark">N</span>
				<span>NailArt <em>AI</em></span>
			</Link>
			<div className="dashboard-profile">
				<button className="profile-trigger" type="button" aria-label="Open profile menu">
					<span
						className="profile-avatar"
						style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : undefined}
					>
						{avatarUrl ? null : initials}
					</span>
					<span className="profile-trigger-copy">
						<strong>{displayName}</strong>
						<small>{email}</small>
					</span>
					<span className="profile-chevron" aria-hidden="true">⌄</span>
				</button>
				<div className="profile-popover">
					<div className="profile-popover-heading">
						<span className="profile-popover-avatar">{initials}</span>
						<span>
							<strong>{displayName}</strong>
							<small>{email}</small>
						</span>
					</div>
					<button className="profile-sign-out" type="button" onClick={() => void signOut()}>
						Sign out <span aria-hidden="true">↗</span>
					</button>
				</div>
			</div>
		</header>
	);
}
