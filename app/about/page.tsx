import { ChefHat, CookingPot, Flame, Sparkles, Utensils, WashingMachine } from 'lucide-react';
import { Footer, Header } from '@/components/thoko-shell';
import { directions, location, phone, tel } from '@/lib/thoko';

export const metadata = {title:'Our story & team',description:'Meet Dorothy Chakhala and the restaurant team behind Thoko Restaurant & Takeaway in Kanengo.'};
const teams=[
  {icon:Utensils,title:'Front of house',body:'Three waitresses take orders and serve the six dining tables.'},
  {icon:ChefHat,title:'Kitchen',body:'The main chef leads meal preparation with a kitchen assistant.'},
  {icon:Flame,title:'Braai',body:'A dedicated cook prepares the braai chicken.'},
  {icon:Sparkles,title:'Cleaning',body:'A general cleaner looks after the dining and shared areas.'},
  {icon:WashingMachine,title:'Wash-up',body:'Two team members handle washing, one for dishes and one for cups.'},
];
export default function AboutPage(){
  return <><Header page="about"/><main>
    <div className="editorial-mast"><div className="wrap"><p className="kicker">Our story</p><h1>Meet Thoko.</h1><p>A family-founded restaurant and takeaway in Kanengo, Lilongwe.</p></div></div>
    <section className="wrap section about-founder">
      <div className="founder-mark"><img src="/media/logo.webp" alt="Original Thoko Restaurant & Take Away logo"/></div>
      <div><p className="kicker">Founder</p><h2>Dorothy Chakhala</h2>
        <p>Dorothy founded Thoko Restaurant & Takeaway and named it after her youngest son, Thoko. She leads operations, oversees finances and makes the restaurant’s business decisions.</p>
        <p>Thoko serves Malawian meals in Kanengo. The dining room seats 24 across six tables, and customers can also request pickup or delivery.</p>
        <a className="text-link" href="/journal/meet-thoko">Read the family story</a>
      </div>
    </section>
    <section className="wrap section"><div className="section-head"><h2>The restaurant team</h2></div>
      <div className="team-grid">{teams.map(({icon:Icon,title,body})=><article className="paper-panel" key={title}><Icon size={22} aria-hidden="true"/><h3>{title}</h3><p>{body}</p></article>)}
        <article className="paper-panel"><CookingPot size={22} aria-hidden="true"/><h3>Work with Thoko</h3><p>Register career or volunteering interest through the community page.</p><a className="text-link" href="/community">Community & careers</a></article>
      </div>
    </section>
    <section className="wrap section visit-section"><div><p className="kicker">Visit</p><h2>Find us in Kanengo.</h2><p>{location}, Lilongwe</p></div><div className="row"><a className="button button-primary" href={directions}>Get directions</a><a className="button button-outline" href={'tel:'+tel}>{phone}</a></div></section>
  </main><Footer/></>;
}
