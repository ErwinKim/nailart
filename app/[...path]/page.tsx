import { notFound } from 'next/navigation';
import DashboardPage from '@/components/dashboard/page';

type CatchAllPageProps = {
	params: Promise<{ path: string[] }>;
};

export default async function CatchAllPage({ params }: CatchAllPageProps) {
	const { path } = await params;

	if (path.length === 1 && path[0] === 'dashboard') {
		return <DashboardPage />;
	}

	notFound();
}
