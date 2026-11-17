import {readFile,readdir} from 'node:fs/promises';
import {Miniflare} from 'miniflare';
import assert from 'node:assert/strict';

const root='dist/server';
const files=(await readdir(root,{recursive:true})).filter(p=>p.endsWith('.js')&&p!=='index.js');
const mf=new Miniflare({
  modules:['index.js',...files].map(path=>({type:'ESModule',path:root+'/'+path})),modulesRoot:root,
  compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],
  d1Databases:{DB:'thoko-test'},bindings:{THOKO_OWNER_EMAIL:'owner@example.test'},
});
const db=await mf.getD1Database('DB');
const migration=await readFile('drizzle/0000_closed_wallow.sql','utf8');
await db.batch(migration.split('--> statement-breakpoint').map(s=>s.trim()).filter(Boolean).map(s=>db.prepare(s)));
const identities={
  owner:{id:'owner-local',email:'owner@example.test'},
  buyer:{id:'customer-local',email:'buyer@example.test'},
  other:{id:'other-local',email:'other@example.test'},
  staff:{id:'staff-local',email:'staff@example.test'},
  board:{id:'board-local',email:'board@example.test'},
};
async function api(path,{who,body,status=200}={}){
  const headers={};
  if(who){
    headers['oai-authenticated-user-id']=identities[who].id;
    headers['oai-authenticated-user-email']=identities[who].email;
  }
  if(body!==undefined){
    headers.origin='http://thoko.test';
    headers['content-type']='application/json';
  }
  const r=await mf.dispatchFetch('http://thoko.test/api/'+path,{headers,method:body===undefined?'GET':'POST',body:body===undefined?undefined:JSON.stringify(body)});
  const raw=await r.text();
  assert.equal(r.status,status,`HTTP ${path}: ${raw.slice(0,600)}`);
  return JSON.parse(raw);
}
const order=(mode='pickup')=>({requestKey:crypto.randomUUID(),mode,name:'Test Buyer',phone:'+265 991 000 000',
  address:mode==='delivery'?'Test delivery area near landmark':'',notes:'Test only',
  lines:[{itemId:'braai',quantity:2,addOns:['nsima','soft-drinks']}],accepted:true});
const setStaff=(who,role)=>api('portal/settings/staff',{who:'owner',body:{email:identities[who].email,role,active:true}});
try{
  const a=await api('public');assert.equal(a.settings.intake,false);
  await api('portal',{status:401});
  await api('portal',{who:'buyer',status:403});
  assert.equal((await api('portal',{who:'owner'})).role,'founder');
  await api('orders',{who:'buyer',body:order(),status:503});
  await api('portal/settings',{who:'owner',body:{intake:true,delivery:true,community:true,disabled:[]}});
  await setStaff('staff','staff');
  await setStaff('board','board');

  const pickup=order();
  const created=(await api('orders',{who:'buyer',body:pickup,status:201})).order;
  assert.equal(created.total,23000);
  assert.equal((await api('orders',{who:'buyer',body:pickup})).order.id,created.id);
  await api('orders',{who:'buyer',body:{...pickup,notes:'Different'},status:409});
  assert.equal((await api('orders',{who:'other'})).orders.length,0);
  await api('portal/orders',{who:'staff',status:403});
  await api('portal/orders',{who:'board',status:403});
  const base='portal/orders/'+created.id;
  await api(base,{who:'owner',body:{status:'confirmed',revision:1}});
  await api(base,{who:'owner',body:{status:'preparing',revision:1},status:409});
  await api(base,{who:'owner',body:{status:'preparing',revision:2}});
  await api(base,{who:'owner',body:{status:'ready',revision:3}});
  await api(base,{who:'owner',body:{status:'completed',revision:4},status:409});
  for(const [reference,amount] of [['TEST-1',5000],['TEST-2',18000]])
    await api(base+'/receipts',{who:'owner',body:{kind:'receipt',amount,channel:'cash',reference,note:'Test till record'},status:201});
  await api(base+'/receipts',{who:'owner',body:{kind:'receipt',amount:1,channel:'cash',reference:'TEST-3',note:'Test till record'},status:409});
  await api(base,{who:'owner',body:{status:'completed',revision:4}});
  assert.equal((await api('orders',{who:'buyer'})).orders[0].status,'completed');

  const delivery=(await api('orders',{who:'buyer',body:order('delivery'),status:201})).order;
  assert.equal(delivery.total,null);
  const deliveryBase='portal/orders/'+delivery.id;
  await api(deliveryBase,{who:'owner',body:{status:'confirmed',revision:1,note:'Test customer'} ,status:400});
  await api(deliveryBase,{who:'owner',body:{status:'quoted',revision:1,fee:1500}});
  await api('orders/'+delivery.id+'/accept-quote',{who:'other',body:{revision:2,total:24500},status:409});
  await api('orders/'+delivery.id+'/accept-quote',{who:'buyer',body:{revision:2,total:24500}});
  const history=(await api('orders',{who:'buyer'})).orders;
  assert.equal(history.find(x=>x.id===delivery.id).status,'confirmed');

  const task=await api('portal/registers/tasks',{who:'owner',body:{title:'Local test task',party:'staff@example.test',status:'Open',due:'2026-11-12'},status:201});
  assert.equal((await api('portal/registers/tasks',{who:'staff'})).rows.length,1);
  await api('portal/registers/tasks/'+task.id+'/status',{who:'staff',body:{status:'Done',revision:1}});
  assert.equal((await api('portal/registers/tasks',{who:'staff'})).rows[0].status,'Done');
  await api('portal/registers/tax',{who:'staff',status:403});

  const entry={date:'2026-11-12',reference:'OPENING-1',memo:'Test opening cash',lines:[
    {account:'1000',side:'debit',amount:10000},{account:'3000',side:'credit',amount:10000}]};
  await api('portal/ledger',{who:'board',body:entry,status:403});
  await api('portal/ledger',{who:'owner',body:{...entry,lines:[entry.lines[0],{...entry.lines[1],amount:9999}]},status:400});
  await api('portal/ledger',{who:'owner',body:entry,status:201});
  await api('portal/ledger',{who:'owner',body:entry,status:409});
  const books=await api('portal/ledger?asOf=2026-11-12',{who:'board'});
  assert.equal(books.assets,10000);assert.equal(books.equity,10000);assert.equal(books.variance,0);

  await api('portal/registers/posts',{who:'owner',body:{title:'Test kitchen update',status:'Published',note:'Example update text.'},status:201});
  assert.equal((await api('public')).posts.length,1);
  await api('community',{who:'buyer',body:{kind:'careers',consent:true,note:'Example interest'}});
  assert.equal((await api('portal/community',{who:'owner'})).interests.length,1);
  await api('community',{who:'buyer',body:{kind:'careers',consent:false}});
  assert.equal((await api('portal/community',{who:'owner'})).interests.length,0);
  const events=(await api('portal/audit',{who:'owner'})).events;
  assert.equal(events.filter(e=>e.action==='order.status'&&e.target===created.id).length,4);
  console.log('PASS: durable pickup and delivery, server prices, retry deduplication, customer isolation, quote consent, split receipts, role controls, tasks, balanced ledger, public updates and interest withdrawal.');
} finally { await mf.dispose(); }
