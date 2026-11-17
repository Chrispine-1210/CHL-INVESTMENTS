'use client';
import {useCallback,useEffect,useRef,useState,type FormEvent,type ReactNode} from 'react';
import {api,asMessage,showDate,signOut} from '@/lib/site-client';
import {accounts,malawiDate,menu,money,orderLabels,orderTransitions,registers,roleLabels,roles,type QuoteLine,type Register,type Role} from '@/lib/thoko';
import {canRegister,navigation,permits,portalPath,seesAllTasks,visible,type View} from '@/lib/portal-access';
import { Activity, ArrowUpRight, BookOpen, CalendarDays, ChartNoAxesColumn, ClipboardList, FileText, LayoutDashboard, ReceiptText, Settings2, ShoppingBag, ShieldCheck, TriangleAlert, Users, MessagesSquare } from 'lucide-react';

type Member={role:Role;name:string;email:string};
type Entry={id:string;title:string;party:string;due:string;status:string;amount:number;note:string;likelihood:number;impact:number;evidence:string;revision:number};
type QueueOrder={id:string;status:string;mode:string;name?:string;phone?:string;address?:string;notes:string;lines:QuoteLine[];subtotal:number;fee:number|null;total:number|null;paid:number;created:string;revision:number};
const icons={overview:LayoutDashboard,orders:ShoppingBag,tasks:ClipboardList,team:Users,calendar:CalendarDays,
  ledger:ChartNoAxesColumn,bills:ReceiptText,contracts:FileText,risks:TriangleAlert,decisions:ShieldCheck,
  posts:BookOpen,community:MessagesSquare,audit:Activity,settings:Settings2};
function human(id:string){return '#'+id.slice(0,8).toUpperCase();}
function countStatus(list:{status:string;count:number}[],state:string){return list.find(r=>r.status===state)?.count??0;}
function field(form:FormData,key:string){return String(form.get(key)||'');}
function num(form:FormData,key:string){return Number(form.get(key)||0);}
function Badge({children}:{children:ReactNode}){return <span className="status">{children}</span>;}
function Empty({children}:{children:ReactNode}){return <p className="muted empty">{children}</p>;}

export function Portal({member,view}:{member:Member;view:View}){
  const title=navigation.flatMap(([,items])=>items).find(([key])=>key===view)?.[1]||'Overview';
  return <main className="portal-shell">
    <aside className="portal-side">
      <a className="brand" href="/"><img src="/media/logo.webp" alt=""/><span>Thoko<small>OPERATIONS PORTAL</small></span></a>
      <nav aria-label="Management navigation">{navigation.map(([name,items])=>{
        const entries=items.filter(([key])=>visible(member.role,key));
        return entries.length>0&&<div key={name}><p>{name}</p>{entries.map(([key,label,icon])=>{
          const Icon=icons[icon as keyof typeof icons];
          return <a aria-current={view===key?'page':undefined} key={key} href={portalPath(key)}><Icon size={17} aria-hidden="true"/>{label}</a>;
        })}</div>;
      })}</nav>
    </aside>
    <section className="portal-main"><div className="portal-top"><div><p className="kicker">Thoko management</p><h1>{title}</h1></div>
      <div className="portal-user"><b>{member.name}</b><small>{roleLabels[member.role]}</small><a className="text-link" href={signOut('/')} target="_top">Sign out</a></div></div>
      {view==='summary'?<Summary role={member.role}/>:
      view==='orders'?<OrderQueue role={member.role}/>:
      view==='ledger'?<Ledger role={member.role}/>:
      view==='team'?<Team role={member.role}/>:
      view==='settings'?<Settings/>:
      view==='audit'?<Audit/>:
      view==='community'?<CommunityInbox/>:
      <RegisterView key={view} kind={view} member={member}/>}
    </section>
  </main>;
}

function useResource<T>(path:string){
  const [result,setResult]=useState<{path:string;value:T}|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const requestVersion=useRef(0);
  const load=useCallback(async()=>{
    const version=++requestVersion.current;
    setError('');
    try{
      const value=await api<T>(path);
      if(version===requestVersion.current)setResult({path,value});
    }catch(e){
      if(version===requestVersion.current)setError(asMessage(e));
    }
  },[path]);
  useEffect(()=>{void load();return()=>{requestVersion.current++;};},[load]);
  async function save(endpoint:string,payload:unknown){
    if(busy)return false;
    setBusy(true);setError('');
    try{await api(endpoint,payload);await load();return true;}
    catch(e){setError(asMessage(e));return false;}
    finally{setBusy(false);}
  }
  return {data:result?.path===path?result.value:null,error,busy,load,save,setError};
}
function Warning({message}:{message:string}){return message?<p className="message error" role="alert">{message}</p>:null;}
function Summary({role}:{role:Role}){
  type Counts={status:string;count:number};
  const {data,error}=useResource<{tasks:Counts[];due:{today:number;overdue:number};orders:Counts[];risks:{id:string;title:string;score:number;status:string}[]}>('portal/summary');
  const metrics=[
    {label:'Open tasks',value:data?countStatus(data.tasks,'Open'):undefined,href:'/portal/tasks'},
    {label:'In progress',value:data?countStatus(data.tasks,'In progress'):undefined,href:'/portal/tasks'},
    {label:'Due today',value:data?.due?.today,href:'/portal/tasks'},
    {label:'Overdue',value:data?.due?.overdue,href:'/portal/tasks'},
  ];
  return <><Warning message={error}/><section className="portal-brief"><p className="kicker">{new Intl.DateTimeFormat('en-MW',{dateStyle:'full',timeZone:'Africa/Blantyre'}).format(new Date())}</p>
    <h2>{seesAllTasks(role)?'Restaurant at a glance':'Your work at Thoko'}</h2><p>{seesAllTasks(role)?'Review open team work and items that need attention.':'Review the tasks and shifts assigned to you.'}</p></section>
    <div className="metrics overview-metrics">{metrics.map(item=><article key={item.label}><span>{item.label}</span><b>{item.value??'—'}</b><a href={item.href} aria-label={item.label+' · Go to tasks'}><ArrowUpRight size={17} aria-hidden="true"/></a></article>)}</div>
    {(permits(role,'ordersRead')||role==='board')&&<section className="paper-panel"><div className="section-head"><h2>Order requests</h2>{permits(role,'ordersRead')&&<a className="button button-outline" href="/portal/orders">Open queue</a>}</div><p className="muted">{data?countStatus(data.orders,'requested')+' awaiting restaurant action':'Loading requests…'}</p></section>}
    <div className="row portal-shortcuts">
      <a className="button button-outline" href="/portal/shifts">Shift roster</a>
      {visible(role,'ledger')&&<a className="button button-outline" href="/portal/ledger">Financial statements</a>}
      {visible(role,'team')&&<a className="button button-outline" href="/portal/team">Team directory</a>}
    </div>
    {visible(role,'risks')&&<section className="paper-panel"><div className="section-head"><h2>Priority risks</h2><a className="button button-outline" href="/portal/risks">Open register</a></div>
    {!data?.risks.length?<Empty>{data?'No open risks recorded.':'Loading risks…'}</Empty>:data.risks.map(r=><div className="list-row" key={r.id}><b>{r.title}</b><Badge>{r.status} · {r.score}/25</Badge></div>)}
  </section>}</>;
}

function Team({role}:{role:Role}){
  const {data,error,load}=useResource<{staff:{email:string;role:Role;created:string}[]}>('portal/team');
  return <><Warning message={error}/><section className="paper-panel">
    <div className="section-head"><h2>Active staff accounts</h2><div className="row">
      <a className="button button-outline" href="/portal/shifts">Shift roster</a>
      <button className="button button-outline" onClick={load}>Refresh</button>
      {permits(role,'manage')&&<a className="button button-primary" href="/portal/settings">Manage access</a>}
    </div></div>
    {!data?.staff.length?<Empty>{data?'No active staff accounts have been added.':'Loading staff accounts…'}</Empty>:
      <div className="team-directory">{data.staff.map(member=><article key={member.email}><div aria-hidden="true">{member.email.slice(0,2).toUpperCase()}</div><p><b>{member.email}</b><span>{roleLabels[member.role]}</span></p></article>)}</div>}
  </section></>;
}

function RegisterView({kind,member}:{kind:Register;member:Member}){
  const meta=registers[kind],path='portal/registers/'+kind;
  const [editing,setEditing]=useState<Entry|'new'|null>(null);
  const [filter,setFilter]=useState(''),[search,setSearch]=useState(''),[dueFilter,setDueFilter]=useState('');
  const [budgetMonth,setBudgetMonth]=useState(malawiDate().slice(0,7));
  const {data,error,busy,save,load}=useResource<{rows:Entry[]}>(path+(kind==='budgets'&&budgetMonth?'?month='+budgetMonth:''));
  const today=malawiDate();
  const assigned=kind==='tasks'||kind==='shifts';
  const budgetAccounts=accounts.filter(([,,type])=>type==='income'||type==='expense');
  const canEdit=canRegister(member.role,kind,true);
  const item=editing&&editing!=='new'?editing:undefined;
  const filtered=data?.rows.filter(row=>{
    if(filter&&row.status!==filter)return false;
    if(search&&![row.title,row.party,row.note].some(value=>value.toLowerCase().includes(search.trim().toLowerCase())))return false;
    if(kind==='budgets'&&budgetMonth&&row.due.slice(0,7)!==budgetMonth)return false;
    if(dueFilter==='today')return row.due===today&&row.status!=='Done';
    if(dueFilter==='overdue')return !!row.due&&row.due<today&&row.status!=='Done';
    return true;
  })||[];
  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();
    const form=new FormData(e.currentTarget);
    const due=field(form,'due');
    if(await save(path+(item?'/'+item.id:''),{
      title:field(form,'title'),party:field(form,'party'),due:kind==='budgets'?due+'-01':due,status:field(form,'status'),
      amount:num(form,'amount'),note:field(form,'note'),evidence:field(form,'evidence'),
      likelihood:num(form,'likelihood')||1,impact:num(form,'impact')||1,revision:item?.revision,
    })){
      if(kind==='budgets')setBudgetMonth(due);
      setEditing(null);
    }
  }
  return <><Warning message={error}/><section className="paper-panel">
    <div className="section-head"><h2>{meta.title}</h2><div className="row"><select aria-label="Filter status" value={filter} onChange={e=>setFilter(e.target.value)}><option value="">All statuses</option>{meta.statuses.map(s=><option key={s}>{s}</option>)}</select>
      {canEdit&&<button className="button button-primary" onClick={()=>setEditing('new')}>New {meta.singular.toLowerCase()}</button>}
      <button className="button button-outline" onClick={load}>Refresh</button></div></div>
    {kind==='hiring'&&<p className="muted small">Use an internal candidate reference. Record the next action and due date. <a className="text-link" href="/portal/community">Review community interest</a></p>}
    {kind==='posts'&&<p className="muted small">The first paragraph is shown in the journal listing. Published updates appear on the website immediately.</p>}
    <div className="row work-filters"><label>Search<input type="search" value={search} placeholder="Title, owner or details" onChange={e=>setSearch(e.target.value)}/></label>
      {kind==='tasks'&&<label>Due date<select value={dueFilter} onChange={e=>setDueFilter(e.target.value)}><option value="">All dates</option><option value="today">Due today</option><option value="overdue">Overdue</option></select></label>}
      {kind==='budgets'&&<label>Budget month<input type="month" value={budgetMonth} onChange={e=>setBudgetMonth(e.target.value)}/></label>}
    </div>
    {kind==='budgets'&&/^\d{4}-(0[1-9]|1[0-2])$/.test(budgetMonth)&&data&&<BudgetActuals month={budgetMonth} rows={data.rows}/> }
    {editing&&<form className="stack portal-form" key={item?.id||'new'} onSubmit={submit}>
      <h3>{item?'Edit':'New'} {meta.singular.toLowerCase()}</h3>
      <div className="fields"><label>Title<input name="title" defaultValue={item?.title} required minLength={3} maxLength={150}/></label>
      {kind==='budgets'?<label>{meta.party}<select name="party" required defaultValue={item?.party||''}><option value="" disabled>Choose an account</option>{budgetAccounts.map(([code,name])=><option key={code} value={code}>{code} · {name}</option>)}</select></label>:
      <label>{meta.party}<input name="party" type={assigned?'email':'text'} required={assigned||kind==='hiring'} defaultValue={item?.party} maxLength={160}/></label>}
      <label>{kind==='budgets'?'Budget month':kind==='shifts'?'Shift date':'Due date'}<input name="due" type={kind==='budgets'?'month':'date'} required={kind==='budgets'||kind==='shifts'} defaultValue={kind==='budgets'?item?.due.slice(0,7)||budgetMonth:item?.due}/></label>
      <label>Status<select name="status" defaultValue={item?.status}>{meta.statuses.map(s=><option key={s}>{s}</option>)}</select></label>
      {meta.value&&<label>{meta.value}<input name="amount" type="number" min={0} max={1000000000} defaultValue={item?.amount||0}/></label>}
      {kind==='risks'&&<><label>Likelihood (1–5)<input name="likelihood" type="number" min={1} max={5} defaultValue={item?.likelihood||1} required/></label><label>Impact (1–5)<input name="impact" type="number" min={1} max={5} defaultValue={item?.impact||1} required/></label></>}
      </div>
      <label>{kind==='posts'?'Public article text':kind==='shifts'?'Shift hours and duties':kind==='risks'?'Mitigation and next steps':'Details and next steps'}<textarea name="note" maxLength={1800} defaultValue={item?.note}/></label>
      {kind!=='posts'&&<label>Evidence or settlement reference<input name="evidence" maxLength={350} defaultValue={item?.evidence}/></label>}
      <div className="row"><button className="button button-primary" disabled={busy}>{busy?'Saving…':'Save'}</button><button type="button" className="button button-outline" onClick={()=>setEditing(null)}>Cancel</button></div>
    </form>}
    {!filtered.length?<Empty>{data?'No records match this view.':'Loading records…'}</Empty>:
      <div className="table-scroll"><table><thead><tr><th>Record</th><th>Owner / party</th><th>Due</th><th>Status</th>{(meta.value||kind==='risks')&&<th>{kind==='risks'?'Risk score':'Amount'}</th>}<th>Action</th></tr></thead><tbody>
      {filtered.map(r=><tr key={r.id}><td><strong>{r.title}</strong>{r.note&&<p className="small muted preline">{r.note}</p>}{r.evidence&&<p className="small">Ref {r.evidence}</p>}</td><td>{kind==='budgets'?budgetAccounts.find(([code])=>code===r.party)?.[1]||r.party:r.party||'—'}</td><td>{r.due||'—'}{kind==='tasks'&&r.due&&r.due<today&&r.status!=='Done'&&<p className="overdue-label">Overdue</p>}</td><td><Badge>{r.status}</Badge></td>
        {meta.value&&<td>{money(r.amount)}</td>}{kind==='risks'&&<td>{r.likelihood*r.impact}/25</td>}
        <td>{kind==='posts'&&r.status==='Published'&&<a className="text-link journal-live" href={'/journal/'+r.id}>View live</a>}{canEdit?<button className="text-link" onClick={()=>setEditing(r)}>Edit</button>:kind==='tasks'&&r.party===member.email.toLowerCase()?
          <select aria-label={'Status for '+r.title} value={r.status} disabled={busy} onChange={e=>save(path+'/'+r.id+'/status',{status:e.target.value,revision:r.revision})}>{meta.statuses.map(s=><option key={s}>{s}</option>)}</select>:'—'}</td></tr>)}
      </tbody></table></div>}
  </section></>;
}

function OrderQueue({role}:{role:Role}){
  const {data,error,busy,save,load,setError}=useResource<{orders:QueueOrder[]}>('portal/orders');
  const [selectedId,setSelectedId]=useState(''),[receipts,setReceipts]=useState<Array<{id:string;kind:string;amount:number;reference:string;channel:string}>>([]);
  const [filter,setFilter]=useState('active');
  const selected=data?.orders.find(o=>o.id===selectedId);
  const selectedPath='portal/orders/'+selectedId;
  const rows=data?.orders.filter(o=>filter==='all'||(filter==='active'&&!['completed','cancelled'].includes(o.status))||o.status===filter)||[];
  async function loadReceipts(orderId:string){
    if(permits(role,'payments'))try{
      const result=await api<{receipts:typeof receipts}>('portal/orders/'+orderId+'/receipts');setReceipts(result.receipts);
    }catch(e){setError(asMessage(e));}
  }
  async function update(e:FormEvent<HTMLFormElement>){
    e.preventDefault();if(!selected)return;
    const form=new FormData(e.currentTarget),status=field(form,'status');
    await save(selectedPath,{revision:selected.revision,status,fee:status==='quoted'&&field(form,'fee')?num(form,'fee'):undefined,note:field(form,'note')});
  }
  async function pay(e:FormEvent<HTMLFormElement>){
    e.preventDefault();
    const target=e.currentTarget,form=new FormData(target);
    if(await save(selectedPath+'/receipts',{kind:field(form,'kind'),amount:num(form,'amount'),channel:field(form,'channel'),reference:field(form,'reference'),note:field(form,'note')})){
      target.reset();await loadReceipts(selectedId);
    }
  }
  const transitions=(selected?orderTransitions[selected.status]||[]:[]).filter(status=>{
    if(role==='kitchen')return ['preparing','ready'].includes(status);
    if(role==='dispatch')return selected?.mode==='delivery'&&['out_for_delivery','completed'].includes(status);
    if(selected?.mode==='pickup')return !['quoted','out_for_delivery'].includes(status);
    return !(status==='confirmed'&&selected?.status==='requested')&&!(status==='completed'&&selected?.status!=='out_for_delivery');
  });
  return <><Warning message={error}/><section className="paper-panel">
    <div className="section-head"><h2>Fulfilment queue</h2><div className="row"><select aria-label="Filter orders" value={filter} onChange={e=>setFilter(e.target.value)}><option value="active">Active orders</option><option value="all">All orders</option>{Object.entries(orderLabels).map(([key,label])=><option value={key} key={key}>{label}</option>)}</select><button className="button button-outline" onClick={load}>Refresh</button></div></div>
    {rows.length?<div className="table-scroll"><table><thead><tr><th>Order</th><th>Method</th><th>Status</th><th>Total</th><th>Cleared</th><th>Requested</th></tr></thead><tbody>
    {rows.map(o=><tr key={o.id}><td><button className="text-link" onClick={()=>{setSelectedId(o.id);setReceipts([]);void loadReceipts(o.id);}}>{human(o.id)}</button></td><td>{o.mode}</td><td><Badge>{orderLabels[o.status]}</Badge></td><td>{o.total===null?money(o.subtotal)+' + fee':money(o.total)}</td><td>{money(o.paid)}</td><td>{showDate(o.created)}</td></tr>)}</tbody></table></div>:<Empty>{data?'No orders in this view.':'Loading orders…'}</Empty>}
  </section>{selected&&<section className="paper-panel order-detail" key={selected.id}>
    <div className="section-head"><h2>{human(selected.id)} · {orderLabels[selected.status]}</h2><button className="button button-outline" onClick={()=>setSelectedId('')}>Close details</button></div>
    {selected.name&&<p>{selected.name} · <a href={'tel:'+selected.phone}>{selected.phone}</a>{selected.address?' · '+selected.address:''}</p>}
    {selected.notes&&<p className="message compact preline">{selected.notes}</p>}
    {selected.lines.map((l,i)=><div className="list-row" key={i}><div><b>{l.quantity} × {l.name}</b>{l.addOns.length>0&&<p className="muted small">{l.addOns.map(a=>a.name).join(', ')}</p>}</div><b>{money(l.lineTotal)}</b></div>)}
    <p className="small muted">Food subtotal {money(selected.subtotal)} · Delivery fee {selected.fee===null?'pending':money(selected.fee)} · Cleared {money(selected.paid)}</p>
    {permits(role,'ordersUpdate')&&transitions.length>0&&<form className="stack portal-form" onSubmit={update}>
      <h3>Update fulfilment</h3><div className="fields"><label>Next status<select name="status">{transitions.map(s=><option key={s} value={s}>{orderLabels[s]}</option>)}</select></label>
      {transitions.includes('quoted')&&<label>Delivery fee (MWK)<input name="fee" type="number" min={0} max={1000000000}/></label>}</div>
      <label>Note <small>Required for cancellation or staff-confirmed delivery acceptance</small><textarea name="note" maxLength={260}/></label>
      <button className="button button-primary" disabled={busy}>Update order</button>
    </form>}
    {permits(role,'payments')&&<div className="portal-form"><h3>Payments and refunds</h3>
      {!receipts.length?<Empty>No payment records yet.</Empty>:receipts.map(r=><div className="list-row" key={r.id}><b>{r.kind} · {money(r.amount)}</b><span>{r.channel} · {r.reference}</span></div>)}
      {selected.fee!==null&&!['requested','quoted','cancelled'].includes(selected.status)&&<form className="stack" onSubmit={pay}>
        <div className="fields"><label>Type<select name="kind">{selected.status!=='completed'&&<option value="receipt">Cleared receipt</option>}<option value="refund">Cleared refund</option></select></label>
        <label>Amount (MWK)<input name="amount" type="number" min={1} max={1000000000} required/></label>
        <label>Payment channel<select name="channel"><option>cash</option><option>mobile money</option><option>bank transfer</option></select></label>
        <label>Unique clearing reference<input name="reference" minLength={3} maxLength={90} required/></label></div>
        <label>Verified against<textarea name="note" required minLength={6} maxLength={300}/></label><button className="button button-primary" disabled={busy}>Record cleared payment</button>
      </form>}
    </div>}
  </section>}</>;
}

function BudgetActuals({month,rows}:{month:string;rows:Entry[]}){
  const last=new Date(month+'-01T00:00:00Z');
  last.setUTCMonth(last.getUTCMonth()+1,0);
  const lastDay=last.toISOString().slice(0,10);
  const {data,error}=useResource<{accounts:{code:string;type:string;period:number}[]}>('portal/ledger?from='+month+'-01&asOf='+lastDay);
  const lines=rows.filter(row=>row.due.slice(0,7)===month&&row.status!=='Planned');
  const totals=['income','expense'].map(type=>{
    const budget=lines.filter(line=>accounts.some(([code,,accountType])=>code===line.party&&accountType===type))
      .reduce((sum,line)=>sum+line.amount,0);
    const actual=data?.accounts.filter(account=>account.type===type).reduce((sum,account)=>sum+account.period,0);
    return {type,budget,actual};
  });
  return <div className="budget-comparison"><Warning message={error}/><p className="muted small">Approved and closed budget lines compared with posted journals for the selected month.</p>
    <div className="table-scroll"><table><thead><tr><th>Category</th><th>Budget</th><th>Actual</th><th>Actual minus budget</th></tr></thead><tbody>
      {totals.map(({type,budget,actual})=><tr key={type}><td>{type==='income'?'Income':'Expenses'}</td><td>{money(budget)}</td><td>{actual===undefined?'—':money(actual)}</td><td>{actual===undefined?'—':money(actual-budget)}</td></tr>)}
    </tbody></table></div></div>;
}

function Ledger({role}:{role:Role}){
  const [date,setDate]=useState(''),[from,setFrom]=useState(''),[editing,setEditing]=useState(false),[count,setCount]=useState(2);
  const {data,error,busy,save,load}=useResource<{
    date:string;from:string;assets:number;liabilities:number;equity:number;earnings:number;income:number;expense:number;variance:number;
    period:{income:number;expense:number;result:number;cashBalance:number;cashMovement:number};
    accounts:{code:string;name:string;type:string;balance:number}[];journals:{id:string;reference:string;memo:string;date:string;amount:number}[];
  }>('portal/ledger?'+new URLSearchParams({...date&&{asOf:date},...from&&{from}}));
  async function post(e:FormEvent<HTMLFormElement>){
    e.preventDefault();const form=new FormData(e.currentTarget);
    const lines=Array.from({length:count},(_,i)=>({account:field(form,'account'+i),side:field(form,'side'+i),amount:num(form,'amount'+i)}));
    if(await save('portal/ledger',{date:field(form,'date'),reference:field(form,'reference'),memo:field(form,'memo'),lines})){
      setEditing(false);setCount(2);
    }
  }
  return <><Warning message={error}/><div className="row report-date"><label>Period start<input type="date" value={from||data?.from||''} onChange={e=>setFrom(e.target.value)}/></label><label>Report date<input type="date" value={date||data?.date||''} onChange={e=>setDate(e.target.value)}/></label><button className="button button-outline" onClick={load}>Refresh</button></div>
    <div className="metrics">{[['Assets',data?.assets],['Liabilities',data?.liabilities],['Equity incl. earnings',data?.equity]].map(([label,value])=><article key={String(label)}><span>{label}</span><b>{typeof value==='number'?money(value):'—'}</b></article>)}</div>
    <section className="paper-panel"><div className="section-head"><h2>Period performance</h2><a className="text-link" href="/portal/budgets">Monthly budgets</a></div>
      <div className="metrics period-metrics">{[['Income',data?.period.income],['Expenses',data?.period.expense],['Operating result',data?.period.result],['Cash & equivalents',data?.period.cashBalance],['Net cash account movement',data?.period.cashMovement]].map(([label,value])=>
        <article key={String(label)}><span>{label}</span><b>{typeof value==='number'?money(value):'—'}</b></article>)}</div>
      <p className="muted small">Income and expenses use journals posted within the selected period. Cash combines the cash, bank and mobile money ledger accounts.</p>
    </section>
    <section className="paper-panel">
      <div className="section-head"><h2>General ledger</h2>{permits(role,'financeWrite')&&<button className="button button-primary" onClick={()=>setEditing(!editing)}>{editing?'Close journal form':'Post journal'}</button>}</div>
      <p className="muted small">Balances use posted journals through the report date. Enter opening balances and post cleared payments using their source references. Tax estimates and payable register records require their own ledger entries.</p>
      {data&&<p className="message compact">Income {money(data.income)} · Expenses {money(data.expense)} · Cumulative earnings {money(data.earnings)} · Balance check {money(data.variance)}</p>}
      {editing&&<form className="stack portal-form" onSubmit={post}>
        <div className="fields"><label>Posting date<input name="date" type="date" required defaultValue={data?.date}/></label><label>Unique evidence reference<input name="reference" required minLength={3} maxLength={100}/></label></div>
        <label>Memo<input name="memo" required minLength={4} maxLength={240}/></label>
        {Array.from({length:count},(_,i)=><div className="fields journal-line" key={i}>
          <label>Account<select name={'account'+i} required defaultValue=""><option value="" disabled>Choose account</option>{accounts.map(([code,name])=><option key={code} value={code}>{code} · {name}</option>)}</select></label>
          <label>Side<select name={'side'+i} defaultValue={i===0?'debit':'credit'}><option value="debit">Debit</option><option value="credit">Credit</option></select></label>
          <label>Amount (MWK)<input name={'amount'+i} type="number" min={1} max={1000000000} required/></label></div>)}
        <div className="row"><button className="button button-outline" type="button" disabled={count>=14} onClick={()=>setCount(count+1)}>Add line</button>{count>2&&<button className="button button-outline" type="button" onClick={()=>setCount(count-1)}>Remove last line</button>}<button className="button button-primary" disabled={busy}>Post balanced journal</button></div>
      </form>}
      {data&&<div className="table-scroll"><table><thead><tr><th>Account</th><th>Class</th><th>Balance</th></tr></thead><tbody>{data.accounts.map(a=><tr key={a.code}><td>{a.code} · {a.name}</td><td>{a.type}</td><td>{money(a.balance)}</td></tr>)}</tbody></table></div>}
    </section>
    <section className="paper-panel"><h2>Recent journals</h2>
    {!data?.journals.length?<Empty>{data?'No journals posted for this period.':'Loading journals…'}</Empty>:<div className="table-scroll"><table><thead><tr><th>Reference</th><th>Date</th><th>Memo</th><th>Posted debit</th></tr></thead><tbody>{data.journals.map(j=><tr key={j.id}><td>{j.reference}</td><td>{j.date}</td><td>{j.memo}</td><td>{money(j.amount)}</td></tr>)}</tbody></table></div>}</section>
  </>;
}

function Settings(){
  type Pref={intake:boolean;delivery:boolean;community:boolean;disabled:string[]};
  type Staff={email:string;role:Role;active:number;created:string};
  const {data,error,busy,save}=useResource<{settings:Pref;staff:Staff[]}>('portal/settings');
  async function config(e:FormEvent<HTMLFormElement>){
    e.preventDefault();const form=new FormData(e.currentTarget);
    await save('portal/settings',{intake:form.has('intake'),delivery:form.has('delivery'),community:form.has('community'),disabled:form.getAll('disabled')});
  }
  async function staff(e:FormEvent<HTMLFormElement>){
    e.preventDefault();const form=new FormData(e.currentTarget);
    await save('portal/settings/staff',{email:field(form,'email'),role:field(form,'role'),active:field(form,'access')==='active'});
  }
  return <><Warning message={error}/>{data&&<><section className="paper-panel"><h2>Customer intake and availability</h2>
    <p className="muted">Open each channel when the team is ready to monitor and fulfil requests.</p>
    <form className="stack" key={JSON.stringify(data.settings)} onSubmit={config}>
      <label className="check"><input name="intake" type="checkbox" defaultChecked={data.settings.intake}/> Accept online pickup and permitted delivery requests</label>
      <label className="check"><input name="delivery" type="checkbox" defaultChecked={data.settings.delivery}/> Accept delivery quote requests</label>
      <label className="check"><input name="community" type="checkbox" defaultChecked={data.settings.community}/> Open community interest and feedback forms</label>
      <fieldset><legend>Temporarily unavailable menu items</legend><div className="fields">{menu.map(i=><label key={i.id} className="check"><input type="checkbox" name="disabled" value={i.id} defaultChecked={data.settings.disabled.includes(i.id)}/>{i.name}</label>)}</div></fieldset>
      <button className="button button-primary" disabled={busy}>Save operating settings</button>
    </form></section>
    <section className="paper-panel"><h2>Staff access</h2><p className="muted">Use the email associated with the staff member’s ChatGPT sign-in. Revoking access takes effect on the next request.</p>
      <form className="stack portal-form" onSubmit={staff}>
        <div className="fields"><label>Account email<input name="email" required type="email" maxLength={160}/></label>
        <label>Role<select name="role">{roles.map(r=><option value={r} key={r}>{roleLabels[r]}</option>)}</select></label>
        <label>Access<select name="access"><option value="active">Active</option><option value="revoked">Revoke</option></select></label></div>
        <button className="button button-primary" disabled={busy}>Save staff access</button>
      </form>
      {data.staff.length?data.staff.map(s=><div className="list-row" key={s.email}><b>{s.email}</b><span>{roleLabels[s.role]} · {s.active?'Active':'Revoked'}</span></div>):<Empty>No delegated staff accounts recorded.</Empty>}
    </section></>}</>;
}
function Audit(){
  const {data,error,load}=useResource<{events:{id:string;action:string;target:string;detail:string;created:string}[]}>('portal/audit');
  return <section className="paper-panel"><Warning message={error}/><div className="section-head"><h2>Recorded activity</h2><button className="button button-outline" onClick={load}>Refresh</button></div>
    {data?.events.length?data.events.map(e=><div className="list-row" key={e.id}><div><b>{e.action}</b><p className="muted small">{e.target} · {e.detail}</p></div><time>{showDate(e.created)}</time></div>):<Empty>{data?'No activity recorded yet.':'Loading activity…'}</Empty>}</section>;
}
function CommunityInbox(){
  const {data,error,load}=useResource<{interests:{id:string;email:string;kind:string;note:string;updated:string}[]}>('portal/community');
  return <section className="paper-panel"><Warning message={error}/><div className="section-head"><h2>Active interest and feedback</h2><button className="button button-outline" onClick={load}>Refresh</button></div>
    {data?.interests.length?data.interests.map(i=><div className="list-row" key={i.id}><div><b>{i.email}</b><p className="muted small preline">{i.note}</p></div><div><Badge>{i.kind}</Badge><p className="small">{showDate(i.updated)}</p></div></div>):<Empty>{data?'No active community submissions.':'Loading submissions…'}</Empty>}</section>;
}
