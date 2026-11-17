import { location, phone, tel } from '@/lib/thoko';

export function Header({page='home'}:{page?:string}) {
  return <header className="topbar"><div className="wrap topinner">
    <a className="brand" href="/" aria-label="Thoko home"><img src="/media/logo.webp" alt="" /><span>Thoko<small>RESTAURANT & TAKEAWAY</small></span></a>
    <nav aria-label="Main navigation"><a aria-current={page==='home'?'page':undefined} href="/">Home</a><a aria-current={page==='order'?'page':undefined} href="/order">Menu</a><a aria-current={page==='community'?'page':undefined} href="/community">Community</a></nav>
    <a className="button button-primary order-link" href="/order">Order food <span aria-hidden="true">›</span></a>
  </div></header>;
}
export function Footer() {
  return <footer className="footer"><div className="wrap footer-grid">
    <div><b>Thoko Restaurant & Takeaway</b><p>{location}, Lilongwe</p><a href={'tel:'+tel}>{phone}</a></div>
    <div><a href="/order">Order & track</a><a href="/community">Community & careers</a><a href="/privacy">Privacy</a><a href="/portal">Staff portal ›</a></div>
  </div></footer>;
}
