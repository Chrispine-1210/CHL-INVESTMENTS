import { ArrowRight, ArrowUpRight, Bike, Flame, MapPin, Phone, ShoppingBag, Utensils } from 'lucide-react';
import { Footer, Header } from '@/components/thoko-shell';
import { directions, location, menu, money, phone, tel } from '@/lib/thoko';

const featuredMeals = menu.filter(item => ['braai', 'local', 'beef'].includes(item.id));
const otherMeals = menu.filter(item => ['boiled-chicken', 'goat', 'offal', 'usipa', 'chambo'].includes(item.id));
const extras = menu.filter(item => ['nsima', 'rice', 'soft-drinks'].includes(item.id));
const braai = menu.find(item => item.id === 'braai')!;

export default function Home() {
  return <><Header/><main className="restaurant-home">
    <section className="food-hero" aria-labelledby="food-hero-title">
      <img className="food-hero-image" src="/media/thoko-braai-hero.webp" alt="Serving suggestion with braai chicken, nsima and vegetables" fetchPriority="high" width="1536" height="1024"/>
      <div className="wrap food-hero-inner">
        <div className="food-hero-copy">
          <p className="eyebrow">Your Malawian kitchen in Kanengo</p>
          <h1 id="food-hero-title">BIG FLAVOUR.<br/><span>LOCAL<br/>FAVOURITES.</span></h1>
          <p className="hero-description">Braai chicken. A proper plate of nsima. The meals you know and love, right here in Lilongwe.</p>
          <div className="hero-order-actions"><a className="button button-primary" href="#menu">Find your meal <ArrowRight size={18} aria-hidden="true"/></a><a className="button hero-phone" href={'tel:' + tel}><Phone size={17} aria-hidden="true"/> Call to order</a></div>
          <a className="hero-address" href={directions}><MapPin size={16} aria-hidden="true"/> Kwenda Road, Kanengo <ArrowUpRight size={14} aria-hidden="true"/></a>
        </div>
        <a className="hero-dish" href="/order?item=braai"><span><Flame size={18} aria-hidden="true"/> From the braai</span><div><b>{braai.name}</b><strong>{money(braai.price)}</strong></div><small>Served with nsima <ArrowUpRight size={16} aria-hidden="true"/></small></a>
      </div>
      <span className="serving-caption">Serving suggestion</span>
    </section>

    <div className="service-choices"><div className="wrap service-choices-inner">
      <a href="#visit"><Utensils size={24} aria-hidden="true"/><div><b>Pull up a chair.</b><span>Dine in at Thoko</span></div><ArrowUpRight size={18} aria-hidden="true"/></a>
      <a href="/order"><ShoppingBag size={24} aria-hidden="true"/><div><b>Take Thoko with you.</b><span>Browse meals for pickup</span></div><ArrowUpRight size={18} aria-hidden="true"/></a>
      <a href={'tel:' + tel}><Bike size={24} aria-hidden="true"/><div><b>Eating somewhere else?</b><span>Call to ask about delivery</span></div><ArrowUpRight size={18} aria-hidden="true"/></a>
    </div></div>

    <section className="wrap restaurant-menu" id="menu" aria-labelledby="menu-title">
      <div className="commercial-section-head"><div><p className="eyebrow">Find your favourite</p><h2 id="menu-title">GOOD TASTE.<br/>GREAT CHOICE.</h2></div><div><p>Chicken, beef, fish and local favourites.<br/>Main meals come with nsima.</p><a className="text-link" href="/order">Explore the full menu <ArrowRight size={17} aria-hidden="true"/></a></div></div>
      <div className="meal-cards">{featuredMeals.map(item => <article className="meal-card" key={item.id}>
        <a className="meal-photo-link" href={'/order?item=' + item.id} aria-label={'Choose ' + item.name}><img src={'/media/' + item.image + '.webp'} alt={item.name + ' from the Thoko menu artwork'} width="600" height="400" loading="lazy"/>{item.id === 'braai' && <span className="meal-category"><Flame size={14} aria-hidden="true"/> From the braai</span>}</a>
        <div className="meal-card-content"><div className="meal-card-heading"><h3>{item.name}</h3><strong>{money(item.price)}</strong></div><p>Served with nsima</p><a className="meal-order-link" href={'/order?item=' + item.id}>Choose this meal <ArrowUpRight size={18} aria-hidden="true"/></a></div>
      </article>)}</div>
      <div className="more-menu"><div><p className="eyebrow">More on the menu</p><h3>Something for<br/>your appetite.</h3><p>Ask the team about today’s availability.</p></div><div className="menu-price-list">{otherMeals.map(item => <a key={item.id} href={'/order?item=' + item.id}><span>{item.name}</span><b>{money(item.price)}</b><ArrowUpRight size={17} aria-hidden="true"/></a>)}</div></div>
    </section>

    <section className="extras-section"><div className="wrap extras-inner"><div><p className="eyebrow">A little extra</p><h2>MAKE IT<br/>YOUR MEAL.</h2><p>Add another portion, choose a bowl of rice or pick up a drink.</p><a className="text-link" href="/order">Choose your extras <ArrowRight size={17} aria-hidden="true"/></a></div><div className="extras-menu">{extras.map(item => <a key={item.id} href={'/order?item=' + item.id}><span>{item.name}</span><strong>{money(item.price)}</strong><ArrowUpRight size={18} aria-hidden="true"/></a>)}<p>Rice and extra nsima are priced separately.</p></div></div></section>

    <section className="wrap visit-thoko" id="visit"><div className="visit-copy"><p className="eyebrow">Come hungry. Leave happy.</p><h2>YOUR TABLE<br/>IN KANENGO.</h2><p>Find us at {location}, Lilongwe. Sit down for a meal or call ahead for takeaway.</p><div className="row"><a className="button button-primary" href={directions}>Get directions <ArrowUpRight size={17} aria-hidden="true"/></a><a className="visit-phone" href={'tel:' + tel}><Phone size={17} aria-hidden="true"/> {phone}</a></div></div><div className="visit-detail"><MapPin size={32} aria-hidden="true"/><h3>Thoko Restaurant<br/>& Takeaway</h3><p>Shore Rubber Building<br/>Kwenda Road, Kanengo<br/>Lilongwe, Malawi</p><a href={'tel:' + tel}>Call for hours & availability <ArrowRight size={17} aria-hidden="true"/></a></div></section>

    <section className="family-note"><div className="wrap family-note-inner"><img src="/media/logo.webp" alt="Thoko Restaurant logo" width="84" height="108" loading="lazy"/><div><p className="eyebrow">A family name. A place to eat.</p><h2>Welcome to Dorothy’s kitchen.</h2><p>Founded by Dorothy Chakhala and named after her youngest son, Thoko brings the family table to Kanengo.</p></div><a className="text-link" href="/about">Our story <ArrowRight size={17} aria-hidden="true"/></a></div></section>
  </main><Footer/></>;
}
