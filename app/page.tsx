import { ArrowRight, ArrowUpRight, Bike, MapPin, ShoppingBag, Utensils } from 'lucide-react';
import { Footer, Header } from '@/components/thoko-shell';
import { JournalCards } from '@/components/journal-cards';
import { articles } from '@/lib/journal';
import { directions, location, menu, money, phone, tel } from '@/lib/thoko';

const highlights=menu.filter(item=>['local','braai','beef'].includes(item.id));
const services=[
  {Icon:Utensils,title:'Dine in',note:'24 seats at our Kanengo restaurant',href:'/about'},
  {Icon:ShoppingBag,title:'Pickup',note:'Order ahead and collect at Thoko',href:'/order'},
  {Icon:Bike,title:'Delivery',note:'Review your delivery quote first',href:'/order'},
];

export default function Home() {
  return <><Header/><main>
    <div className="wrap homepage-hero-wrap"><section className="homepage-hero">
      <div className="hero-content"><p className="kicker">Malawian kitchen · Kanengo</p>
        <h1>Good food.<br/><em>Close to home.</em></h1>
        <p>Local chicken, braai favourites and Malawian meals served with nsima. Sit down with us or order to take away.</p>
        <div className="row hero-actions"><a className="button button-primary" href="/order">Explore the menu <ArrowRight size={18} aria-hidden="true"/></a><a className="hero-call" href={'tel:'+tel}>Call Thoko</a></div>
      </div>
      <figure className="hero-photo"><img src="/media/chicken.webp" alt="Chicken pieces served in a tray, from the Thoko menu artwork" fetchPriority="high"/><figcaption>From the Thoko menu</figcaption></figure>
    </section>
    <div className="service-strip" aria-label="Ways to order">{services.map(({Icon,title,note,href})=><a key={title} href={href}><Icon size={24} aria-hidden="true"/><span><b>{title}</b><small>{note}</small></span><ArrowUpRight size={16} aria-hidden="true"/></a>)}</div></div>
    <section className="wrap section menu-preview">
      <div className="section-head"><div><p className="kicker">The menu</p><h2>From the kitchen</h2></div><a className="text-link" href="/order">See the full menu <ArrowRight size={16} aria-hidden="true"/></a></div>
      <div className="featured">{highlights.map(item=><article key={item.id}><a href="/order"><img src={'/media/'+item.image+'.webp'} alt="" loading="lazy"/><div><h3>{item.name}</h3><p>Served with nsima</p><strong>{money(item.price)}</strong></div></a></article>)}</div>
    </section>
    <section className="story-band"><div className="wrap story-band-inner">
      <div className="story-emblem"><img src="/media/logo.webp" alt="Thoko Restaurant & Take Away logo" loading="lazy"/></div>
      <div><p className="kicker">Our story</p><h2>Founded by Dorothy Chakhala.</h2><p>Dorothy named the restaurant after her youngest son. Get to know the family and the team that runs Thoko.</p><a className="text-link" href="/about">Meet Thoko <ArrowRight size={16} aria-hidden="true"/></a></div>
    </div></section>
    <section className="wrap section">
      <div className="section-head"><h2>The Thoko Journal</h2><a className="text-link" href="/journal">Read the journal <ArrowRight size={16} aria-hidden="true"/></a></div>
      <JournalCards entries={articles}/>
    </section>
    <section className="wrap section home-bottom">
      <article className="paper-panel"><MapPin size={23} aria-hidden="true"/><h2>Visit us in Kanengo.</h2><p>{location}, Lilongwe</p><div className="row"><a className="text-link" href={directions}>Get directions <ArrowUpRight size={15} aria-hidden="true"/></a><a href={'tel:'+tel}>{phone}</a></div></article>
      <article className="community-panel"><h2>Stay in touch.</h2><p>Follow restaurant updates, share feedback or register interest in careers and volunteering.</p><a className="text-link" href="/community">Visit the community <ArrowRight size={16} aria-hidden="true"/></a></article>
    </section>
  </main><Footer/></>;
}
