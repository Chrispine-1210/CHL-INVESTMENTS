import { notFound } from 'next/navigation';
import { Footer, Header } from '@/components/thoko-shell';
import { articles, articleFromRecord } from '@/lib/journal';
import { getPublishedPost } from '@/lib/thoko-server';

export const dynamic = 'force-dynamic';

async function findArticle(slug: string) {
  return articles.find(article=>article.id===slug) ?? await getPublishedPost(slug).then(row=>row?articleFromRecord(row):null);
}
export async function generateMetadata({params}: {params:Promise<{slug:string}>}) {
  const entry=await findArticle((await params).slug);
  return entry?{title:entry.title,description:entry.intro}:{title:'Article unavailable',robots:{index:false}};
}

export default async function ArticlePage({params}: {params:Promise<{slug:string}>}) {
  const entry=await findArticle((await params).slug);
  if (!entry) notFound();
  return <><Header page="journal"/><main className="wrap section">
    <article className="story-article">
      <a className="text-link small" href="/journal">← All articles</a>
      <p className="kicker">{entry.category}</p><h1>{entry.title}</h1>
      <p className="story-intro">{entry.intro}</p>
      {entry.updated&&<time className="small muted" dateTime={entry.updated}>{new Intl.DateTimeFormat('en-MW',{dateStyle:'long',timeZone:'Africa/Blantyre'}).format(new Date(entry.updated))}</time>}
      {entry.image&&<img src={entry.image} alt={entry.imageAlt||''}/>}
      <div className="story-text">{entry.paragraphs.map((paragraph,index)=><p className="preline" key={index}>{paragraph}</p>)}</div>
      <div className="row"><a className="button button-primary" href="/order">See the menu</a><a className="button button-outline" href="/community">Visit the community</a></div>
    </article>
  </main><Footer/></>;
}
