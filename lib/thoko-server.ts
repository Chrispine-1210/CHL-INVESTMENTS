import { env } from 'cloudflare:workers';
import { z } from 'zod';
import { getChatGPTUser, type ChatGPTUser } from '@/app/chatgpt-auth';
import { accounts, addonIds, malawiDate, menu, orderTransitions, priceOrder, registers, roles, type Register, type Role } from './thoko';
import { canRegister, managesWork, permits, seesAllTasks, seesTeam } from './portal-access';

class ApiError extends Error {
  constructor(public status:number, message:string) { super(message); }
}
function ensure(value:unknown,status:number,message:string): asserts value {
  if (!value) throw new ApiError(status,message);
}
const db = () => {
  ensure(env.DB,503,'Business data is temporarily unavailable. Try again.');
  return env.DB;
};
type Param = string|number|null;
const statement = (sql:string,...parameters:Param[]) => db().prepare(sql).bind(...parameters);
const one = <T>(sql:string,...parameters:Param[]) => statement(sql,...parameters).first<T>();
const many = async <T>(sql:string,...parameters:Param[]) => (await statement(sql,...parameters).all<T>()).results;
const now = () => new Date().toISOString();
const id = () => crypto.randomUUID();
const memo = (max:number) => z.string().trim().max(max);
const email = z.string().trim().toLowerCase().max(160).email();
const kwacha = z.number().int().min(0).max(1000000000);
const calendarDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value=>{
  const date=new Date(value+'T00:00:00Z');
  return !isNaN(date.getTime()) && date.toISOString().slice(0,10)===value;
},'Enter a valid calendar date.');
const response = (data:unknown,status=200) => Response.json(data,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});

async function input<T extends z.ZodType>(request:Request,schema:T):Promise<z.infer<T>> {
  const origin=request.headers.get('origin');
  ensure(origin && origin===new URL(request.url).origin,403,'This request must come from the Thoko website.');
  ensure(request.headers.get('content-type')?.split(';')[0].trim()==='application/json',415,'Send a JSON request.');
  const reader=request.body?.getReader();
  ensure(reader,400,'Request data is missing.');
  const decoder=new TextDecoder();
  let size=0, body='';
  for (;;) {
    const {value,done}=await reader.read();
    if (done) break;
    size+=value.byteLength;
    if (size>24000) { await reader.cancel(); throw new ApiError(413,'The request is too large.'); }
    body+=decoder.decode(value,{stream:true});
  }
  body+=decoder.decode();
  let parsed;
  try { parsed=JSON.parse(body); } catch { throw new ApiError(400,'The request contains invalid JSON.'); }
  const result=schema.safeParse(parsed);
  if (!result.success) throw new ApiError(400,result.error.issues[0]?.message ?? 'Check the submitted details.');
  return result.data;
}

export async function roleFor(user:ChatGPTUser|null):Promise<Role|null> {
  if (!user) return null;
  const address=user.email.trim().toLowerCase();
  if (env.THOKO_OWNER_EMAIL?.trim().toLowerCase()===address) return 'founder';
  const row=await one<{role:Role}>('SELECT role FROM staff WHERE email=? AND active=1',address);
  return row && roles.includes(row.role) ? row.role : null;
}

const orderPrefs=z.object({
  intake:z.boolean(), delivery:z.boolean(), community:z.boolean(), disabled:z.array(z.enum(menu.map(i=>i.id) as [string,...string[]])).max(13),
});
type Settings=z.infer<typeof orderPrefs>;
const defaults:Settings={intake:false,delivery:false,community:false,disabled:[]};
async function settings():Promise<Settings> {
  const row=await one<{value:string}>('SELECT value FROM settings WHERE key=?','operations');
  if (!row) return defaults;
  const result=orderPrefs.safeParse(JSON.parse(row.value));
  return result.success?result.data:defaults;
}

function event(user:ChatGPTUser,action:string,target:string,detail:string,ifChanged=false) {
  return statement('INSERT INTO audit (id,actor,action,target,detail,created) SELECT ?,?,?,?,?,?'+(ifChanged?' WHERE changes()=1':''),
    id(),user.userId,action,target,detail,now());
}
async function write(user:ChatGPTUser,query:D1PreparedStatement,action:string,target:string,detail:string) {
  const [result]=await db().batch([query,event(user,action,target,detail,true)]);
  ensure(result.meta.changes===1,409,'The record changed or the requested action is no longer available. Refresh and try again.');
}

type StoredOrder = {
  id:string;user_id:string;request_key:string;fingerprint:string;mode:'pickup'|'delivery';status:string;name:string;phone:string;
  address:string;notes:string;lines:string;subtotal:number;fee:number|null;created:string;updated:string;revision:number;paid:number;
};
const orderSelect = `SELECT o.*,COALESCE((SELECT SUM(CASE WHEN r.kind='refund' THEN -r.amount ELSE r.amount END) FROM receipts r WHERE r.order_id=o.id),0) AS paid FROM orders o`;
const orderDto=(row:StoredOrder,contact=false)=>({
  id:row.id,mode:row.mode,status:row.status,lines:JSON.parse(row.lines),notes:row.notes,
  subtotal:row.subtotal,fee:row.fee,total:row.fee===null?null:row.subtotal+row.fee,paid:row.paid,created:row.created,
  revision:row.revision,...(contact?{name:row.name,phone:row.phone,address:row.address}:{}),
});
const newOrder=z.object({
  requestKey:z.string().uuid(),mode:z.enum(['pickup','delivery']),name:memo(70).min(2),
  phone:memo(28).refine(v=>/^\+?[0-9 ()-]+$/.test(v)&&v.replace(/\D/g,'').length>=7&&v.replace(/\D/g,'').length<=15,'Enter a valid telephone number.'),
  address:memo(240).default(''),notes:memo(350).default(''),
  lines:z.array(z.object({itemId:memo(40),quantity:z.number().int().min(1).max(30),addOns:z.array(z.enum(addonIds as [string,...string[]])).max(5)})).min(1).max(30),
  accepted:z.literal(true),
});

async function createOrder(request:Request,user:ChatGPTUser) {
  const value=await input(request,newOrder);
  const fingerprint=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value)));
  const hash=Array.from(new Uint8Array(fingerprint),v=>v.toString(16).padStart(2,'0')).join('');
  const existing=await one<StoredOrder>(orderSelect+' WHERE o.user_id=? AND o.request_key=?',user.userId,value.requestKey);
  if (existing) {
    ensure(existing.fingerprint===hash,409,'That checkout attempt already has an order. Open your order history.');
    return response({order:orderDto(existing)});
  }
  const pref=await settings();
  ensure(pref.intake,503,'Online ordering is paused. Call Thoko to place an order.');
  ensure(value.mode==='pickup'||pref.delivery,400,'Delivery requests are currently closed.');
  ensure(value.mode==='pickup'||value.address.length>=8,400,'Enter a delivery area and landmark.');
  ensure(value.lines.reduce((n,l)=>n+l.quantity,0)<=60,400,'Call Thoko for orders larger than 60 items.');
  let lines;
  try { lines=priceOrder(value.lines,pref.disabled); } catch (error) { throw new ApiError(400,(error as Error).message); }
  const subtotal=lines.reduce((n,l)=>n+l.lineTotal,0);
  const orderId=id(), time=now(), cutoff=new Date(Date.now()-3600000).toISOString();
  await statement(`INSERT OR IGNORE INTO orders (id,user_id,request_key,fingerprint,mode,status,name,phone,address,notes,lines,subtotal,fee,created,updated,revision)
    SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1
    WHERE (SELECT COUNT(*) FROM orders WHERE user_id=? AND created>=?)<8`,
    orderId,user.userId,value.requestKey,hash,value.mode,'requested',value.name,value.phone,value.mode==='delivery'?value.address:'',
    value.notes,JSON.stringify(lines),subtotal,value.mode==='pickup'?0:null,time,time,user.userId,cutoff).run();
  const row=await one<StoredOrder>(orderSelect+' WHERE o.user_id=? AND o.request_key=?',user.userId,value.requestKey);
  ensure(row,429,'You reached the hourly order request limit. Call Thoko for help.');
  ensure(row.fingerprint===hash,409,'That checkout attempt already has an order. Open your order history.');
  return response({order:orderDto(row)},row.id===orderId?201:200);
}

async function updateOrder(request:Request,user:ChatGPTUser,role:Role|null,orderId:string) {
  ensure(permits(role,'ordersUpdate'),403,'You do not have order update access.');
  const value=await input(request,z.object({status:z.enum(['quoted','confirmed','preparing','ready','out_for_delivery','completed','cancelled']),
    revision:z.number().int().positive(),fee:kwacha.optional(),note:memo(260).default('')}));
  const row=await one<StoredOrder>(orderSelect+' WHERE o.id=?',orderId);
  ensure(row,404,'Order not found.');
  ensure(row.revision===value.revision,409,'The order changed. Refresh the queue.');
  ensure(orderTransitions[row.status]?.includes(value.status),409,'That change is unavailable from the current status.');
  if (role==='kitchen') ensure(['preparing','ready'].includes(value.status),403,'Kitchen access covers preparation and readiness.');
  if (role==='dispatch') ensure(['out_for_delivery','completed'].includes(value.status)&&row.mode==='delivery',403,'Dispatch access covers delivery handoff and completion.');
  if (value.status==='quoted') ensure(row.mode==='delivery'&&value.fee!==undefined,400,'Enter a delivery quote first.');
  if (value.status==='confirmed' && row.mode==='delivery') ensure(row.status==='quoted'&&row.fee!==null&&value.note.length>=6,400,'Record customer acceptance of the quoted fee in the approval note.');
  if (value.status==='out_for_delivery') ensure(row.mode==='delivery',400,'Pickup orders cannot be sent out for delivery.');
  if (value.status==='completed'&&row.mode==='delivery') ensure(row.status==='out_for_delivery',400,'Mark the delivery as out for delivery first.');
  if (value.status==='completed') ensure(row.fee!==null&&row.paid===row.subtotal+row.fee,409,'Record and verify the full cleared payment before completion.');
  if (value.status==='cancelled') ensure(value.note.length>=6&&row.paid===0,400,'Record a cancellation reason and clear any received balance first.');
  const fee=value.status==='quoted'?value.fee!:row.fee;
  const payClause=value.status==='completed'||value.status==='cancelled'
    ? ' AND COALESCE((SELECT SUM(CASE WHEN kind=\'refund\' THEN -amount ELSE amount END) FROM receipts WHERE order_id=orders.id),0)=?':'';
  const params:Param[]=[value.status,fee,now(),orderId,value.revision];
  if (payClause) params.push(value.status==='cancelled'?0:row.subtotal+fee!);
  await write(user,statement('UPDATE orders SET status=?,fee=?,updated=?,revision=revision+1 WHERE id=? AND revision=?'+payClause,
    ...params),'order.status',orderId,value.status+(value.note?' · '+value.note:''));
  return response({ok:true});
}

async function receipt(request:Request,user:ChatGPTUser,role:Role|null,orderId:string) {
  ensure(permits(role,'payments'),403,'You do not have payment recording access.');
  const value=await input(request,z.object({kind:z.enum(['receipt','refund']),amount:kwacha.min(1),
    channel:z.enum(['cash','mobile money','bank transfer']),reference:memo(90).min(3),note:memo(300).min(6)}));
  const paymentId=id();
  const paid=`COALESCE((SELECT SUM(CASE WHEN kind='refund' THEN -amount ELSE amount END) FROM receipts WHERE order_id=o.id),0)`;
  const condition=value.kind==='receipt'? `${paid}+?<=o.subtotal+o.fee AND o.status NOT IN ('requested','quoted','cancelled','completed')`
    : `${paid}>=? AND o.status NOT IN ('requested','quoted','cancelled')`;
  await write(user,statement(`INSERT OR IGNORE INTO receipts(id,order_id,kind,amount,channel,reference,created,actor,note)
    SELECT ?,o.id,?,?,?,?,?,?,? FROM orders o WHERE o.id=? AND o.fee IS NOT NULL AND ${condition}`,
    paymentId,value.kind,value.amount,value.channel,value.reference.toUpperCase(),now(),user.userId,value.note,orderId,value.amount),
    'order.'+value.kind,orderId,paymentId);
  return response({ok:true},201);
}

const validRegister=(key:string):key is Register=>Object.hasOwn(registers,key);
const recordSchema=z.object({
  title:memo(150).min(3),party:memo(160).default(''),due:z.union([calendarDate,z.literal('')]).default(''),
  status:memo(26),amount:kwacha.default(0),note:memo(1800).default(''),evidence:memo(350).default(''),
  likelihood:z.number().int().min(1).max(5).default(1),impact:z.number().int().min(1).max(5).default(1),
  revision:z.number().int().positive().optional(),
});
type RecordRow={id:string;kind:string;party:string;status:string;revision:number};
async function recordWrite(request:Request,user:ChatGPTUser,role:Role|null,kind:Register,recordId?:string) {
  ensure(canRegister(role,kind,true),403,'This register is outside your role.');
  const value=await input(request,recordSchema);
  ensure((registers[kind].statuses as readonly string[]).includes(value.status),400,'Choose a valid status.');
  const assigned=kind==='tasks'||kind==='shifts';
  if (assigned) ensure(email.safeParse(value.party).success,400,'Enter a staff email address.');
  if (kind==='hiring') ensure(value.party,400,'Enter a candidate reference.');
  if (kind==='shifts') {
    ensure(value.due,400,'Choose a shift date.');
    const address=value.party.toLowerCase();
    ensure(env.THOKO_OWNER_EMAIL?.trim().toLowerCase()===address||await one('SELECT email FROM staff WHERE email=? AND active=1',address),400,'Assign the shift to an active Thoko account.');
  }
  if (kind==='budgets') {
    ensure(accounts.some(([code,,type])=>code===value.party&&(type==='income'||type==='expense')),400,'Choose an income or expense account.');
    ensure(value.due.endsWith('-01'),400,'Use the first day of the budget month.');
  }
  if (kind==='posts'&&value.status==='Published') ensure(value.note.length>=12,400,'Enter public update text before publishing.');
  if (['bills','tax'].includes(kind)&&value.status==='Settled') ensure(value.evidence.length>=4,400,'Record a cleared settlement reference.');
  if (kind==='decisions'&&value.status!=='Proposed') ensure(value.evidence.length>=4,400,'Record a minute or approval reference.');
  const party=assigned?value.party.toLowerCase():value.party;
  const values:Param[]=[value.title,party,value.due,value.status,value.amount,value.note,value.likelihood,value.impact,value.evidence];
  if (!recordId) {
    const newId=id();
    await write(user,statement(`INSERT INTO records(id,kind,title,party,due,status,amount,note,likelihood,impact,evidence,created,updated,revision)
      SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?,1
      WHERE ?<>'budgets' OR NOT EXISTS(SELECT 1 FROM records WHERE kind='budgets' AND party=? AND due=?)`,
      newId,kind,...values,now(),now(),kind,party,value.due),kind+'.create',newId,value.status);
    return response({id:newId},201);
  }
  ensure(value.revision,400,'Refresh the record before saving changes.');
  await write(user,statement(`UPDATE records SET title=?,party=?,due=?,status=?,amount=?,note=?,likelihood=?,impact=?,evidence=?,updated=?,revision=revision+1
      WHERE id=? AND kind=? AND revision=? AND (?<>'budgets' OR NOT EXISTS(
        SELECT 1 FROM records existing WHERE existing.kind='budgets' AND existing.party=? AND existing.due=? AND existing.id<>?
      ))`,...values,now(),recordId,kind,value.revision,kind,party,value.due,recordId),kind+'.update',recordId,value.status);
  return response({ok:true});
}

const ledgerInput=z.object({date:calendarDate,reference:memo(100).min(3),memo:memo(240).min(4),
  lines:z.array(z.object({account:z.enum(accounts.map(a=>a[0]) as unknown as [string,...string[]]),side:z.enum(['debit','credit']),
    amount:kwacha.min(1)})).min(2).max(14)});
async function ledgerWrite(request:Request,user:ChatGPTUser) {
  const value=await input(request,ledgerInput);
  const totals=value.lines.reduce((a,l)=>({...a,[l.side]:a[l.side]+l.amount}),{debit:0,credit:0});
  ensure(totals.debit===totals.credit,400,'Debits and credits must match.');
  ensure(new Set(value.lines.map(l=>l.account)).size>=2,400,'Use at least two different accounts.');
  const journalId=id();
  await db().batch([
    statement('INSERT INTO journals(id,reference,date,memo,actor,created) VALUES(?,?,?,?,?,?)',journalId,value.reference.toUpperCase(),value.date,value.memo,user.userId,now()),
    ...value.lines.map(l=>statement('INSERT INTO postings(id,journal_id,account,side,amount) VALUES(?,?,?,?,?)',id(),journalId,l.account,l.side,l.amount)),
    event(user,'journal.posted',journalId,value.reference.toUpperCase()),
  ]);
  return response({id:journalId},201);
}
async function ledgerRead(request:Request) {
  const query = new URL(request.url).searchParams;
  const date=calendarDate.safeParse(query.get('asOf')??malawiDate());
  ensure(date.success,400,'Enter a valid report date.');
  const from=calendarDate.safeParse(query.get('from')??date.data.slice(0,7)+'-01');
  ensure(from.success&&from.data<=date.data,400,'The period must begin on or before the report date.');
  const rows=await many<{account:string;balance:number;period:number}>(`SELECT p.account,
      SUM(CASE WHEN p.side='debit' THEN p.amount ELSE -p.amount END) AS balance,
      SUM(CASE WHEN j.date<? THEN 0 WHEN p.side='debit' THEN p.amount ELSE -p.amount END) AS period
      FROM postings p JOIN journals j ON j.id=p.journal_id WHERE j.date<=? GROUP BY p.account`,from.data,date.data);
  const list=accounts.map(([code,name,type])=>{
    const row=rows.find(r=>r.account===code);
    const sign=type==='asset'||type==='expense'?1:-1;
    return {code,name,type,balance:(row?.balance??0)*sign,period:(row?.period??0)*sign};
  });
  const sum=(type:string)=>list.filter(a=>a.type===type).reduce((n,a)=>n+a.balance,0);
  const assets=sum('asset'),liabilities=sum('liability'),earnings=sum('income')-sum('expense'),equity=sum('equity')+earnings;
  const journals=await many(`SELECT j.id,j.reference,j.date,j.memo,SUM(CASE WHEN p.side='debit' THEN p.amount ELSE 0 END) AS amount
      FROM journals j JOIN postings p ON p.journal_id=j.id WHERE j.date<=? GROUP BY j.id ORDER BY j.date DESC,j.created DESC LIMIT 100`,date.data);
  const periodSum=(type:string)=>list.filter(account=>account.type===type).reduce((total,account)=>total+account.period,0);
  const cash=list.filter(account=>['1000','1010','1020'].includes(account.code));
  const cashBalance=cash.reduce((total,account)=>total+account.balance,0);
  const cashMovement=cash.reduce((total,account)=>total+account.period,0);
  const income=periodSum('income'),expense=periodSum('expense');
  return response({date:date.data,from:from.data,assets,liabilities,equity,earnings,income:sum('income'),expense:sum('expense'),
    period:{income,expense,result:income-expense,cashBalance,cashMovement},
    variance:assets-liabilities-equity,accounts:list,journals});
}

type PublishedPost = {id:string;title:string;party:string;note:string;updated:string};
const publishedPosts = "SELECT id,title,party,note,updated FROM records WHERE kind='posts' AND status='Published'";
export const getPublishedPosts = () => many<PublishedPost>(publishedPosts+' ORDER BY updated DESC LIMIT 24');
export const getPublishedPost = (postId:string) => one<PublishedPost>(publishedPosts+' AND id=?',postId);

const interests=['updates','careers','volunteering','feedback'] as const;
export async function dispatch(request:Request,path:string[]) {
  try {
    const get=request.method==='GET';
    const [area,key,recordId]=path;
    const user=await getChatGPTUser();
    if (get&&area==='public'&&path.length===1) {
      const [pref,posts]=await Promise.all([settings(),getPublishedPosts()]);
      return response({settings:pref,posts,user:!!user});
    }
    ensure(user,401,'Sign in with ChatGPT to continue.');
    if (area==='orders'&&path.length===1) {
      if (!get) return await createOrder(request,user);
      const rows=await many<StoredOrder>(orderSelect+' WHERE o.user_id=? ORDER BY o.created DESC LIMIT 60',user.userId);
      return response({orders:rows.map(r=>orderDto(r))});
    }
    if (area==='orders'&&key&&recordId==='accept-quote'&&!get) {
      const value=await input(request,z.object({revision:z.number().int().positive(),total:kwacha}));
      await write(user,statement(`UPDATE orders SET status='confirmed',updated=?,revision=revision+1
        WHERE id=? AND user_id=? AND mode='delivery' AND status='quoted' AND revision=? AND subtotal+fee=?`,
        now(),key,user.userId,value.revision,value.total),'order.quote_accepted',key,'Customer accepted the delivery quote');
      return response({ok:true});
    }
    if (area==='community'&&path.length===1) {
      if (get) return response({interests:await many('SELECT kind,status,updated FROM community WHERE user_id=?',user.userId)});
      const value=await input(request,z.object({kind:z.enum(interests),consent:z.boolean(),note:memo(900).default('')}));
      if (value.consent) ensure((await settings()).community,503,'Online community sign-ups are currently closed.');
      if (value.kind==='feedback'&&value.consent) ensure(value.note.length>=5,400,'Please enter your feedback.');
      const existing=await one<{updated:string}>('SELECT updated FROM community WHERE user_id=? AND kind=?',user.userId,value.kind);
      if (value.consent&&existing) ensure(Date.now()-Date.parse(existing.updated)>15000,429,'Wait a moment before sending another update.');
      const time=now();
      await statement(`INSERT INTO community(id,user_id,email,kind,note,status,created,updated) VALUES(?,?,?,?,?,?,?,?)
        ON CONFLICT(user_id,kind) DO UPDATE SET note=excluded.note,status=excluded.status,updated=excluded.updated`,
        id(),user.userId,user.email,value.kind,value.consent?value.note:'',value.consent?'Active':'Withdrawn',time,time).run();
      return response({ok:true});
    }
    ensure(area==='portal',404,'That page or operation was not found.');
    const role=await roleFor(user);
    ensure(role,403,'This account has no Thoko staff access. Contact the restaurant administrator.');
    if (!key && get) return response({role,name:user.displayName,email:user.email});
    if (key==='summary'&&get) {
      const clauses=seesAllTasks(role)?[]:[user.email.toLowerCase()];
      const tasks=await many(`SELECT status,COUNT(*) AS count FROM records WHERE kind='tasks'${clauses.length?' AND party=?':''} GROUP BY status`,...clauses);
      const orders=permits(role,'ordersRead')||role==='board'?await many('SELECT status,COUNT(*) AS count FROM orders GROUP BY status'):[];
      const due=await one<{overdue:number;today:number}>(`SELECT
        COALESCE(SUM(CASE WHEN due<>'' AND due<? THEN 1 ELSE 0 END),0) AS overdue,
        COALESCE(SUM(CASE WHEN due=? THEN 1 ELSE 0 END),0) AS today
        FROM records WHERE kind='tasks' AND status<>'Done'${clauses.length?' AND party=?':''}`,malawiDate(),malawiDate(),...clauses);
      const risks=canRegister(role,'risks')?await many(`SELECT id,title,status,likelihood*impact AS score FROM records WHERE kind='risks' AND status IN ('Open','Monitoring') ORDER BY score DESC LIMIT 5`):[];
      return response({tasks,due,orders,risks});
    }
    if (key==='team'&&get) {
      ensure(seesTeam(role),403,'Team directory access is required.');
      const staff=await many<{email:string;role:Role;created:string}>("SELECT email,role,created FROM staff WHERE active=1 ORDER BY email LIMIT 200");
      const owner=env.THOKO_OWNER_EMAIL?.trim().toLowerCase();
      if (owner&&!staff.some(member=>member.email===owner)) staff.unshift({email:owner,role:'founder',created:''});
      return response({staff});
    }
    if (key==='orders') {
      ensure(permits(role,'ordersRead'),403,'Order queue access is required.');
      if (get&&!recordId) {
        const rows=await many<StoredOrder>(orderSelect+' ORDER BY CASE WHEN o.status IN (\'completed\',\'cancelled\') THEN 1 ELSE 0 END,o.created DESC LIMIT 150');
        return response({orders:rows.map(r=>orderDto(r,role!=='kitchen'))});
      }
      if (get&&recordId&&path[3]==='receipts') {
        ensure(permits(role,'payments'),403,'Payment recording access is required.');
        return response({receipts:await many('SELECT id,kind,amount,channel,reference,note,created FROM receipts WHERE order_id=? ORDER BY created DESC',recordId)});
      }
      if (!get&&recordId) return await (path[3]==='receipts'?receipt(request,user,role,recordId):updateOrder(request,user,role,recordId));
    }
    if (key==='registers'&&recordId&&validRegister(recordId)) {
      const kind=recordId;
      ensure(canRegister(role,kind),403,'This register is outside your role.');
      if (get) {
        const month=new URL(request.url).searchParams.get('month');
        if (kind==='budgets'&&month) {
          const first=calendarDate.safeParse(month+'-01');
          ensure(first.success,400,'Choose a valid budget month.');
          return response({rows:await many("SELECT * FROM records WHERE kind='budgets' AND due=? ORDER BY party",first.data)});
        }
        const onlyAssigned=(kind==='tasks'&&!seesAllTasks(role))||(kind==='shifts'&&!managesWork(role));
        return response({rows:await many('SELECT * FROM records WHERE kind=?'+(onlyAssigned?' AND party=?':'')+
          " ORDER BY CASE WHEN due='' THEN 1 ELSE 0 END,due,updated DESC LIMIT 180",kind,...(onlyAssigned?[user.email.toLowerCase()]:[]))});
      }
      if (kind==='tasks'&&path[3]&&path[4]==='status') {
        const value=await input(request,z.object({status:z.enum(['Open','In progress','Done']),revision:z.number().int().positive()}));
        const existing=await one<RecordRow>("SELECT id,kind,party,status,revision FROM records WHERE kind='tasks' AND id=?",path[3]);
        ensure(existing&&(managesWork(role)||existing.party===user.email.toLowerCase()),403,'You can change tasks assigned to your account.');
        await write(user,statement('UPDATE records SET status=?,updated=?,revision=revision+1 WHERE id=? AND kind=? AND revision=?',
          value.status,now(),path[3],kind,value.revision),'task.status',path[3],value.status);
        return response({ok:true});
      }
      return await recordWrite(request,user,role,kind,path[3]);
    }
    if (key==='ledger') {
      ensure(permits(role,get?'financeRead':'financeWrite'),403,'Finance access is required.');
      return await (get?ledgerRead(request):ledgerWrite(request,user));
    }
    if (key==='community'&&get) {
      ensure(permits(role,'people'),403,'People and community access is required.');
      return response({interests:await many(`SELECT id,email,kind,note,updated FROM community WHERE status='Active' ORDER BY updated DESC LIMIT 180`)});
    }
    if (key==='audit'&&get) {
      ensure(permits(role,'audit'),403,'Audit access is required.');
      return response({events:await many('SELECT id,action,target,detail,created FROM audit ORDER BY created DESC LIMIT 120')});
    }
    if (key==='settings') {
      ensure(permits(role,'manage'),403,'Founder access is required.');
      if (get) return response({settings:await settings(),staff:await many('SELECT email,role,active,created FROM staff ORDER BY email LIMIT 200')});
      if (recordId==='staff') {
        const value=await input(request,z.object({email,role:z.enum(roles),active:z.boolean()}));
        ensure(value.email!==user.email.toLowerCase()||value.active&&value.role==='founder',400,'Keep the current founder account active.');
        await write(user,statement(`INSERT INTO staff(email,role,active,created) VALUES(?,?,?,?)
          ON CONFLICT(email) DO UPDATE SET role=excluded.role,active=excluded.active`,value.email,value.role,value.active?1:0,now()),
          'staff.access',value.email,value.active?value.role:'revoked');
      } else {
        const value=await input(request,orderPrefs);
        await write(user,statement(`INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`,
          'operations',JSON.stringify(value)),'settings.update','operations','Customer intake and availability');
      }
      return response({ok:true});
    }
    throw new ApiError(404,'That page or operation was not found.');
  } catch (error) {
    if (error instanceof ApiError) return response({error:error.message},error.status);
    if (error instanceof Error && /unique constraint/i.test(error.message)) return response({error:'That reference has already been used.'},409);
    console.error('thoko-api',path.slice(0,2).join('/'),error instanceof Error ? error.name : 'UnknownError');
    return response({error:'Thoko could not finish this action. Refresh and try again.'},500);
  }
}
