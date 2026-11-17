import { Footer, Header } from '@/components/thoko-shell';
import { JournalCards } from '@/components/journal-cards';
import { articles, articleFromRecord } from '@/lib/journal';
import { getPublishedPosts } from '@/lib/thoko-server';

export const dynamic = 'force-dynamic';
export const metadata = {title:'The Thoko Journal', description:'Restaurant updates, stories and ordering guides from Thoko in Kanengo.'};

export default async function JournalPage() {
  const posts = await getPublishedPosts();
  return <><Header page="journal"/><main>
    <div className="editorial-mast"><div className="wrap">
      <p className="kicker">Stories & updates</p><h1>The Thoko Journal</h1>
      <p>Read about the food, the people and what’s happening at the restaurant.</p>
    </div></div>
    <section className="wrap section" aria-label="Journal articles"><JournalCards entries={[...posts.map(articleFromRecord), ...articles]}/></section>
  </main><Footer/></>;
}
