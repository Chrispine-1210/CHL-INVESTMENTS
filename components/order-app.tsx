'use client';
import { useEffect,useState, type FormEvent } from 'react';
import { api,asMessage,signIn,showDate,type PublicData } from '@/lib/site-client';
import { addonIds,categories,location,menu,money,orderLabels,priceOrder,tel,type MenuItem,type QuoteLine } from '@/lib/thoko';

type Line={itemId:string;quantity:number;addOns:string[]};
type Order={id:string;mode:string;status:string;lines:QuoteLine[];subtotal:number;total:number|null;fee:number|null;paid:number;created:string;revision:number};
function parseBasket(raw:string|null) {
  const lines:Line[]=JSON.parse(raw||'[]');
  if (!Array.isArray(lines)) return [];
  if (lines.length) priceOrder(lines);
  return lines;
}
export function OrderApp() {
  const [publicData,setPublic]=useState<PublicData|null>(null);
  const [basket,setBasket]=useState<Line[]>([]);
  const [ready,setReady]=useState(false);
  const [filter,setFilter]=useState('Main meals');
  const [mode,setMode]=useState<'pickup'|'delivery'>('pickup');
  const [selected,setSelected]=useState<MenuItem|null>(null);
  const [extras,setExtras]=useState<string[]>([]);
  const [quantity,setQuantity]=useState(1);
  const [history,setHistory]=useState<Order[]>([]);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [busy,setBusy]=useState(false);
  const [checkout,setCheckout]=useState(false);
  const [requestKey,setRequestKey]=useState('');
  const [track,setTrack]=useState(false);

  async function refreshOrders() {
    const list=await api<{orders:Order[]}>('orders');
    setHistory(list.orders);
  }
  useEffect(()=>{
    try {setBasket(parseBasket(localStorage.getItem('thoko-basket-v1')));} catch {/* discard invalid local basket */}
    const itemId=new URLSearchParams(window.location.search).get('item');
    const requestedItem=menu.find(item=>item.id===itemId);
    if(requestedItem){setSelected(requestedItem);setFilter(requestedItem.category);}
    setReady(true);
    api<PublicData>('public').then(data=>{setPublic(data);if(data.user) return refreshOrders();}).catch(e=>setError(asMessage(e)));
  },[]);
  useEffect(()=>{if(ready) try{localStorage.setItem('thoko-basket-v1',JSON.stringify(basket));}catch{/* local persistence is optional */}},[basket,ready]);
  let quoted:QuoteLine[]=[];
  try { if(basket.length) quoted=priceOrder(basket); } catch {/* invalid old basket cannot submit */}
  const subtotal=quoted.reduce((total,line)=>total+line.lineTotal,0);
  const count=basket.reduce((total,line)=>total+line.quantity,0);
  const disabled=publicData?.settings.disabled||[];

  function add(){
    if(!selected) return;
    const chosen=[...extras].sort();
    const match=basket.findIndex(l=>l.itemId===selected.id&&l.addOns.join()===chosen.join());
    const lines=match<0?[...basket,{itemId:selected.id,quantity,addOns:chosen}]:basket.map((l,i)=>i===match?{...l,quantity:l.quantity+quantity}:l);
    if(lines.length>30||lines.some(l=>l.quantity>30)||lines.reduce((n,l)=>n+l.quantity,0)>60) {
      setError('For a large order, please call Thoko.');return;
    }
    setBasket(lines);
    setSelected(null);
    setRequestKey('');
    setError('');
    setNotice(selected.name+' added to your basket.');
  }
  function changeLine(i:number,delta:number){
    setBasket(basket.map((l,k)=>i===k?{...l,quantity:Math.min(30,l.quantity+delta)}:l).filter(l=>l.quantity>0));
    setRequestKey('');
  }
  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();if(busy)return;
    const form=new FormData(e.currentTarget), key=requestKey||crypto.randomUUID();
    setRequestKey(key);setBusy(true);setError('');setNotice('');
    try{
      const result=await api<{order:Order}>('orders',{requestKey:key,mode,name:form.get('name'),phone:form.get('phone'),
        address:form.get('address')||'',notes:form.get('notes')||'',lines:basket,accepted:form.get('accepted')==='on'});
      setBasket([]);setCheckout(false);setRequestKey('');setNotice('Request '+result.order.id.slice(0,8).toUpperCase()+' received. Thoko will confirm availability.');
      setHistory(rows=>[result.order,...rows.filter(o=>o.id!==result.order.id)]);setTrack(true);
    }catch(e){setError(asMessage(e));}
    finally{setBusy(false);}
  }

  async function acceptQuote(order:Order){
    if(order.total===null||busy)return;
    setBusy(true);setError('');setNotice('');
    try{
      await api('orders/'+order.id+'/accept-quote',{revision:order.revision,total:order.total});
      await refreshOrders();
      setNotice('Delivery quote accepted. Track the order here.');
    }catch(e){setError(asMessage(e));}
    finally{setBusy(false);}
  }
  return <main className="wrap order-page">
    <div className="page-heading commercial-order-heading"><div><p className="kicker">The Thoko menu</p><h1>FIND YOUR<br/>FAVOURITE.</h1><p>Choose your meal. Add your extras. Make it yours.</p></div><a className="button button-primary" href={'tel:'+tel}>Call to order</a></div>
    {error&&<p role="alert" className="message error">{error}</p>}
    {notice&&<p role="status" className="message success">{notice}</p>}
    <div className="order-layout">
      <div>
        <div className="row fulfilment" aria-label="Fulfilment method">
          <button type="button" aria-pressed={mode==='pickup'} onClick={()=>{setMode('pickup');setRequestKey('');}}>Pickup</button>
          <button type="button" aria-pressed={mode==='delivery'} onClick={()=>{setMode('delivery');setRequestKey('');}}>Delivery</button>
          {publicData?.user&&<button type="button" onClick={()=>{setTrack(!track);if(!track) refreshOrders().catch(e=>setError(asMessage(e)));}}>Order history</button>}
        </div>
        <p className="muted small">{mode==='pickup'?location:'Delivery address and landmark are required. Thoko confirms the fee and availability before you pay.'}</p>
        {track&&<section className="paper-panel history"><div className="section-head"><h2>Your orders</h2><button className="button button-outline" onClick={()=>refreshOrders().catch(e=>setError(asMessage(e)))}>Refresh</button></div>
          {!history.length&&<p className="muted">You haven’t requested an order yet.</p>}
          {history.map(o=><article className="history-item" key={o.id}>
            <div className="row between"><strong>#{o.id.slice(0,8).toUpperCase()} · {o.mode==='pickup'?'Pickup':'Delivery'}</strong><span className="status">{orderLabels[o.status]}</span></div>
            <p>{o.lines.map(l=>l.quantity+' × '+l.name+(l.addOns.length?' ('+l.addOns.map(a=>a.name).join(', ')+')':'')).join(' · ')}</p>
            <p className="small muted">{showDate(o.created)} · {o.total===null?money(o.subtotal)+' food subtotal · delivery fee pending':money(o.total)+' total'} · {money(o.paid)} recorded</p>
            {o.status==='quoted'&&o.total!==null&&<button className="button button-primary" disabled={busy} onClick={()=>acceptQuote(o)}>Accept {money(o.total)} delivery total</button>}
          </article>)}
        </section>}
        <div className="filters" aria-label="Menu categories">{categories.map(c=><button key={c} className={filter===c?'active':''} aria-pressed={filter===c} onClick={()=>setFilter(c)}>{c}</button>)}</div>
        <div className="menu-items">{menu.filter(i=>i.category===filter).map(item=><article key={item.id}>
          {item.image&&<img src={'/media/'+item.image+'.webp'} alt="" loading="lazy"/>}
          <div className="menu-detail"><h2>{item.name}</h2><p>{item.category==='Main meals'?'Served with nsima':item.category}</p><b>{money(item.price)}</b></div>
          <button className="button button-outline add" disabled={disabled.includes(item.id)} onClick={()=>{setSelected(item);setQuantity(1);setExtras([]);}} aria-label={'Add '+item.name}>{disabled.includes(item.id)?'Unavailable':'Add +'}</button>
        </article>)}</div>
      </div>
      <aside className="basket paper-panel" id="basket">
        <div className="row between"><h2>Your basket</h2><span className="status">{count} {count===1?'item':'items'}</span></div>
        {!quoted.length&&<p className="muted">Add a meal or side to start your order.</p>}
        {quoted.map((l,i)=><div className="basket-line" key={l.itemId+'-'+l.addOns.map(a=>a.itemId).join()}>
          <div><strong>{l.name}</strong><p className="small muted">{l.addOns.length?'With '+l.addOns.map(a=>a.name).join(', '):null}</p>
            <div className="quantity"><button aria-label={'Remove one '+l.name} onClick={()=>changeLine(i,-1)}>−</button><span>{l.quantity}</span><button aria-label={'Add one '+l.name} disabled={count>=60||l.quantity>=30} onClick={()=>changeLine(i,1)}>+</button></div>
          </div><b>{money(l.lineTotal)}</b>
        </div>)}
        <div className="row between total"><strong>{mode==='delivery'?'Food subtotal':'Total'}</strong><b>{money(subtotal)}</b></div>
        {mode==='delivery'&&<p className="small muted">Delivery fee quoted separately.</p>}
        {!publicData?.settings.intake&&<p className="message compact">{publicData?'Online ordering is paused. Call to order.':'Checking online ordering availability…'}</p>}
        {publicData?.settings.intake&&mode==='delivery'&&!publicData.settings.delivery&&<p className="message compact">Delivery requests are currently closed.</p>}
        {publicData?.settings.intake&&!publicData.user?<a className="button button-primary wide" href={signIn('/order')} target="_top">Sign in to request an order</a>:
          <button className="button button-primary wide" disabled={!quoted.length||!publicData?.settings.intake||(mode==='delivery'&&!publicData.settings.delivery)} onClick={()=>setCheckout(!checkout)}>{checkout?'Hide checkout':'Continue to checkout'}</button>}
        <a className="text-link call-link" href={'tel:'+tel}>Call to order ›</a>
        {checkout&&publicData?.user&&<form className="stack checkout" onSubmit={submit} onInput={()=>{if(!busy)setRequestKey('');}}>
          <label>Contact name<input name="name" required maxLength={70} autoComplete="name"/></label>
          <label>Phone<input name="phone" required type="tel" maxLength={28} autoComplete="tel"/></label>
          {mode==='delivery'&&<label>Delivery area and landmark<textarea name="address" minLength={8} maxLength={240} required/></label>}
          <label>Order notes<textarea name="notes" maxLength={350} placeholder="Optional instructions"/></label>
          <label className="check"><input name="accepted" type="checkbox" required/> I agree that Thoko may use these details to confirm and fulfil my order. <a href="/privacy">Privacy</a></label>
          <button className="button button-primary" disabled={busy}>{busy?'Sending…':'Send order request'}</button>
        </form>}
      </aside>
    </div>
    {!!count&&<a className="mobile-basket button button-primary" href="#basket">Basket · {count} · {money(subtotal)}</a>}
    {selected&&<div className="overlay" onClick={()=>setSelected(null)}><section role="dialog" aria-modal="true" aria-labelledby="item-title" className="modal" onClick={e=>e.stopPropagation()}>
      <button className="close" onClick={()=>setSelected(null)} aria-label="Close item options" autoFocus>×</button>
      <p className="kicker">{selected.category}</p><h2 id="item-title">{selected.name}</h2><strong>{money(selected.price)}</strong>
      {selected.category==='Main meals'&&<fieldset><legend>Add extras per meal</legend>{menu.filter(i=>addonIds.includes(i.id)&&!disabled.includes(i.id)).map(i=><label className="check addon" key={i.id}><input type="checkbox" checked={extras.includes(i.id)} onChange={e=>setExtras(e.target.checked?[...extras,i.id]:extras.filter(a=>a!==i.id))}/>{i.name}<strong>+{money(i.price)}</strong></label>)}</fieldset>}
      <div className="row between"><span>Quantity</span><div className="quantity"><button onClick={()=>setQuantity(Math.max(1,quantity-1))} aria-label="Decrease quantity">−</button>{quantity}<button onClick={()=>setQuantity(Math.min(30,quantity+1))} aria-label="Increase quantity">+</button></div></div>
      <button className="button button-primary wide" onClick={add}>Add to basket · {money(quantity*(selected.price+menu.filter(i=>extras.includes(i.id)).reduce((n,i)=>n+i.price,0)))}</button>
    </section></div>}
  </main>;
}
