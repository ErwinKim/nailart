'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import DashboardNav from '@/components/dashboard/dashboard-nav';
import PromptArea from '@/components/dashboard/prompt-area';

export default function DashboardPage() {
	const router = useRouter();
	const { loading, user } = useAuth();

	useEffect(() => {
		if (!loading && !user) router.replace('/auth');
	}, [loading, router, user]);

	if (loading || !user) {
		return <main className="dashboard-page dashboard-loading" aria-label="Loading dashboard" />;
	}

	return (
		<main className="dashboard-page">
			<DashboardNav />
			<PromptArea />
		</main>
	);
}
