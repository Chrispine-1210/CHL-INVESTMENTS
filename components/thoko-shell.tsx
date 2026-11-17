import { ArrowUpRight, MapPin } from 'lucide-react';
import { location, phone, tel } from '@/lib/thoko';

const navigation=[['home','/','Home'],['order','/order','Menu'],['about','/about','Our story'],['journal','/journal','Journal'],['community','/community','Community']];

export function Header({page='home'}:{page?:string}) {
  return <header className="topbar">
    <div className="location-bar"><div className="wrap row between"><span><MapPin size={13} aria-hidden="true"/> Kanengo, Lilongwe</span><a href={'tel:'+tel}>{phone}</a></div></div>
    <div className="wrap topinner">
      <a className="brand" href="/" aria-label="Thoko home"><img src="/media/logo.webp" alt="" width="44" height="54"/><span>Thoko<small>RESTAURANT & TAKEAWAY</small></span></a>
      <nav aria-label="Main navigation">{navigation.map(([key,path,label])=><a key={key} aria-current={page===key?'page':undefined} href={path}>{label}</a>)}</nav>
      <a className="button button-primary order-link" href="/order">Order food <ArrowUpRight size={15} aria-hidden="true"/></a>
    </div>
  </header>;
}
export function Footer() {
  return <footer className="footer"><div className="wrap footer-grid">
    <div><b>Thoko Restaurant & Takeaway</b><p>{location}, Lilongwe</p><a href={'tel:'+tel}>{phone}</a></div>
    <div className="footer-nav"><a href="/order">Order & track</a><a href="/about">Our story & team</a><a href="/journal">Journal</a><a href="/community">Community & careers</a></div>
    <div className="footer-nav"><a href="/privacy">Privacy</a><a href="/portal">Staff portal <ArrowUpRight size={13} aria-hidden="true"/></a></div>
  </div></footer>;
}
