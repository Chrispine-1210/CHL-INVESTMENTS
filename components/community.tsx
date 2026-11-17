'use client';
import {useEffect,useState,type FormEvent} from 'react';
import {api,asMessage,showDate,signIn,signOut,type PublicData} from '@/lib/site-client';

const options=[
  ['updates','Restaurant updates','Follow menu news and service updates.'],
  ['careers','Careers','Register your interest in working with Thoko.'],
  ['volunteering','Volunteering','Tell us how you would like to contribute.'],
  ['feedback','Customer feedback','Send a private suggestion to the team.'],
] as const;
type Interest={kind:string;status:string};
export function Community(){
  const [data,setData]=useState<PublicData|null>(null),[interest,setInterest]=useState<Interest[]>([]);
  const [selected,setSelected]=useState<(typeof options)[number]|null>(null),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
  const refresh=()=>api<{interests:Interest[]}>('community').then(r=>setInterest(r.interests));
  useEffect(()=>{api<PublicData>('public').then(r=>{setData(r);if(r.user)return refresh();}).catch(e=>setError(asMessage(e)));},[]);
  async function save(kind:string,consent:boolean,note=''){
    if(busy)return;
    setBusy(true);setError('');setNotice('');
    try {await api('community',{kind,consent,note});await refresh();setSelected(null);setNotice(consent?'Your interest has been recorded.':'Your interest has been withdrawn.');}
    catch(e){setError(asMessage(e));}
    finally{setBusy(false);}
  }
  function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();
    if(selected)void save(selected[0],true,String(new FormData(e.currentTarget).get('note')||''));
  }
  return <main className="wrap section">
    <div className="page-heading"><p className="kicker"><span/> THOKO COMMUNITY</p><h1>A place at the table.</h1><p>Follow what is happening at Thoko, share feedback or put your name forward for future opportunities.</p></div>
    {error&&<p className="message error" role="alert">{error}</p>}{notice&&<p className="message success" role="status">{notice}</p>}
    <section className="community-layout">
      <div><h2>Latest updates</h2>
        {data?.posts.length?data.posts.map(p=><article key={p.id} className="paper-panel update"><p className="kicker">{p.party||'Restaurant news'}</p><h3>{p.title}</h3><p className="preline">{p.note}</p><time className="muted small">{showDate(p.updated)}</time></article>):
          <article className="paper-panel update"><h3>Welcome to Thoko</h3><p>Explore the menu or visit us at Shore Rubber Building on Kwenda Road in Kanengo.</p><a href="/order" className="text-link">View the menu ›</a></article>}
      </div>
      <div className="paper-panel"><div className="section-head"><h2>Get involved</h2>{data?.user&&<a className="text-link" href={signOut('/community')} target="_top">Sign out</a>}</div>
        {data&&!data.settings.community&&<p className="message compact">Online sign-ups are currently closed. Public updates are available here.</p>}
        {options.map(opt=>{
          const active=interest.some(i=>i.kind===opt[0]&&i.status==='Active');
          return <article className="interest" key={opt[0]}><h3>{opt[1]}</h3><p className="muted small">{opt[2]}</p>
            {active?<button className="button button-outline" disabled={busy} onClick={()=>save(opt[0],false)}>Withdraw interest</button>:
            data?.settings.community?(data.user?<button className="button button-outline" onClick={()=>setSelected(opt)}>Continue ›</button>:<a className="button button-outline" href={signIn('/community')} target="_top">Sign in ›</a>):null}
          </article>;
        })}
        {selected&&<form className="stack" onSubmit={submit}>
          <h3>{selected[1]}</h3>
          {selected[0]!=='updates'&&<label>Message<textarea name="note" required={selected[0]==='feedback'} maxLength={900} placeholder="Share only information relevant to your interest."/></label>}
          <label className="check"><input required type="checkbox"/> I agree that Thoko may use my account email and message to respond to this request. <a href="/privacy">Privacy</a></label>
          <div className="row"><button className="button button-primary" disabled={busy}>{busy?'Saving…':'Send interest'}</button><button className="button button-outline" type="button" onClick={()=>setSelected(null)}>Cancel</button></div>
        </form>}
      </div>
    </section>
  </main>;
}
