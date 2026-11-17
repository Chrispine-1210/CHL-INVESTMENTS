import { notFound } from 'next/navigation';
import { PortalEntry } from '@/components/portal-entry';
import { portalView } from '@/lib/portal-access';

export const dynamic = 'force-dynamic';
export default async function PortalSection({params}:{params:Promise<{section:string}>}) {
  const section=portalView((await params).section);
  if (!section) notFound();
  return <PortalEntry view={section}/>;
}
