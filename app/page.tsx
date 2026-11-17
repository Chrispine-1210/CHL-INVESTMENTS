import { Footer,Header } from '@/components/thoko-shell';
import { location,menu,money,phone,tel } from '@/lib/thoko';

const highlights=menu.filter(i=>['local','braai','beef','rice'].includes(i.id));
export default function Home() {
  return <><Header/><main>
    <section className="wrap hero">
      <div className="hero-copy"><p className="kicker"><span/> KANENGO, LILONGWE</p>
        <h1>Good food.<br/><em>Close to home.</em></h1>
        <p>Local chicken, braai favourites and Malawian meals with nsima. Visit us in Kanengo or order for pickup or delivery.</p>
        <div className="row hero-actions"><a className="button button-primary" href="/order">Explore the menu <span aria-hidden="true">›</span></a><a className="button button-outline" href={'tel:'+tel}>Call Thoko</a></div>
      </div>
      <figure className="hero-art"><img src="/media/chicken.webp" alt="Seasoned chicken from Thoko’s menu photography"/><figcaption><span>THOKO KITCHEN</span><b>Local favourites, cooked with care</b></figcaption></figure>
    </section>
    <section className="service-band"><div className="wrap services">
      <div><b>Dine in</b><span>Visit us in Kanengo</span></div>
      <div><b>Pick up</b><span>Request a collection order</span></div>
      <div><b>Delivery</b><span>Receive a quote before confirmation</span></div>
    </div></section>
    <section className="wrap section">
      <div className="section-head"><div><p className="kicker">THE THOKO MENU</p><h2>From the kitchen</h2></div><a className="text-link" href="/order">See all 13 menu items ›</a></div>
      <div className="featured">{highlights.map(i=><article key={i.id}><img src={'/media/'+i.image+'.webp'} alt="" loading="lazy"/><div><h3>{i.name}</h3><strong>{money(i.price)}</strong></div></article>)}</div>
      <p className="small muted">Main meals come with nsima. Choose extra sides and drinks with your order.</p>
    </section>
    <section className="wrap section home-bottom">
      <article className="paper-panel"><p className="kicker">FIND THOKO</p><h2>Come by Kanengo.</h2><p>{location}</p><a className="text-link" href={'tel:'+tel}>{phone} ›</a></article>
      <article className="community-panel"><p className="kicker">THOKO COMMUNITY</p><h2>Stay in touch.</h2><p>Read restaurant updates, share feedback and register interest in careers or volunteering.</p><a className="text-link" href="/community">Visit the community ›</a></article>
    </section>
  </main><Footer/></>;
}
