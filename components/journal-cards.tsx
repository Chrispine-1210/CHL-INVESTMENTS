import { ArrowUpRight, BookOpen } from 'lucide-react';
import type { Article } from '@/lib/journal';

export function JournalCards({entries}: {entries: Article[]}) {
  return <div className="journal-grid">{entries.map(entry=><article className="journal-card" key={entry.id}>
    <a href={'/journal/'+entry.id}>
      {entry.image ? <img src={entry.image} alt={entry.imageAlt || ''} loading="lazy"/> : <div className="journal-cover" aria-hidden="true"><BookOpen size={38}/></div>}
      <div className="journal-card-body"><p className="kicker">{entry.category}</p><h3>{entry.title}</h3>
        <p className="muted">{entry.intro}</p><span className="journal-read">Read article <ArrowUpRight size={15} aria-hidden="true"/></span></div>
    </a>
  </article>)}</div>;
}
