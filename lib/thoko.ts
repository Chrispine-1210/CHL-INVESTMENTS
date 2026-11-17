export const money = (value: number) => 'K' + new Intl.NumberFormat('en-MW').format(value);
export const location = 'Shore Rubber Building, Kwenda Road, Kanengo';
export const phone = '+265 991 773 601';
export const tel = '+265991773601';

export const menu = [
  {id:'local', name:'Local Chicken', price:9000, category:'Main meals', image:'chicken'},
  {id:'boiled-chicken', name:'Boiled Local Chicken', price:9000, category:'Main meals'},
  {id:'braai', name:'Braai Chicken', price:9000, category:'Main meals', image:'grill'},
  {id:'beef', name:'Beef', price:5000, category:'Main meals', image:'beef'},
  {id:'goat', name:'Boiled Goat Meat', price:5000, category:'Main meals'},
  {id:'offal', name:'Offal', price:5000, category:'Main meals'},
  {id:'usipa', name:'Usipa', price:5000, category:'Main meals'},
  {id:'chambo', name:'Chambo', price:20000, category:'Main meals'},
  {id:'nsima', name:'Extra Nsima Portion', price:1000, category:'Sides and extras'},
  {id:'rice', name:'Rice per Bowl', price:1000, category:'Sides and extras', image:'rice'},
  {id:'box', name:'Takeaway Box', price:1000, category:'Sides and extras'},
  {id:'soft-drinks', name:'Soft Drinks', price:1500, category:'Drinks'},
  {id:'water', name:'Water (500 ml)', price:1000, category:'Drinks'},
] satisfies Array<{id:string;name:string;price:number;category:string;image?:string}>;
export type MenuItem = (typeof menu)[number];

export const categories = ['Main meals','Sides and extras','Drinks'];
export const addonIds = ['nsima','rice','box','soft-drinks','water'];
export const roles = ['founder','board','operations','finance','officer','kitchen','dispatch','staff'] as const;
export type Role = typeof roles[number];
export const roleLabels: Record<Role,string> = {
  founder:'Founder / CEO',board:'Executive board',operations:'Operations manager',finance:'Finance officer',
  officer:'People & community officer',kitchen:'Kitchen lead',dispatch:'Dispatch officer',staff:'Team member',
};
export const orderLabels: Record<string,string> = {
  requested:'Requested',quoted:'Delivery quoted',confirmed:'Confirmed',preparing:'Preparing',ready:'Ready',
  out_for_delivery:'Out for delivery',completed:'Completed',cancelled:'Cancelled',
};
export const orderTransitions: Record<string,string[]> = {
  requested:['quoted','confirmed','cancelled'],quoted:['confirmed','cancelled'],
  confirmed:['preparing','cancelled'],preparing:['ready','cancelled'],
  ready:['out_for_delivery','completed','cancelled'],out_for_delivery:['completed','cancelled'],
  completed:[],cancelled:[],
};
export const registers = {
  tasks:{title:'Tasks & follow-ups',singular:'Task',statuses:['Open','In progress','Done'],value:'',party:'Assigned staff email'},
  bills:{title:'Bills & payables',singular:'Bill',statuses:['Open','Approved','Settled','Void'],value:'Amount (MWK)',party:'Supplier'},
  tax:{title:'Tax calendar',singular:'Tax obligation',statuses:['Open','Filed','Settled','Void'],value:'Estimated amount (MWK)',party:'Authority'},
  contracts:{title:'Contracts',singular:'Contract',statuses:['Review','Active','Closed','Expired'],value:'Contract value (MWK)',party:'Counterparty'},
  risks:{title:'Risk register',singular:'Risk',statuses:['Open','Monitoring','Mitigated','Closed'],value:'',party:'Accountable owner'},
  decisions:{title:'Board decisions',singular:'Decision',statuses:['Proposed','Approved','Declined','Implemented'],value:'',party:'Accountable owner'},
  posts:{title:'Public updates',singular:'Update',statuses:['Draft','Published','Archived'],value:'',party:'Public category'},
} as const;
export type Register = keyof typeof registers;
export const accounts = [
  ['1000','Cash on hand','asset'],['1010','Bank','asset'],['1020','Mobile money','asset'],
  ['1100','Trade receivables','asset'],['1200','Inventory','asset'],['1500','Equipment','asset'],
  ['2000','Trade payables','liability'],['2100','Tax payable','liability'],['2200','Customer advances','liability'],
  ['2300','Loan payable','liability'],['3000','Owner capital','equity'],['3100','Owner drawings','equity'],
  ['4000','Food sales','income'],['4100','Other income','income'],
  ['5000','Food and packaging costs','expense'],['5100','Payroll','expense'],
  ['5200','Rent and utilities','expense'],['5300','Delivery and service costs','expense'],
  ['5400','Other operating costs','expense'],
] as const;

export type QuoteLine = {itemId:string;name:string;quantity:number;unitPrice:number;addOns:Array<{itemId:string;name:string;unitPrice:number}>;lineTotal:number};
export function priceOrder(lines:Array<{itemId:string;quantity:number;addOns:string[]}>, disabled:string[] = []) {
  if (!lines.length || lines.length > 30) throw new Error('Add between 1 and 30 order lines.');
  return lines.map((line):QuoteLine=>{
    const item=menu.find(i=>i.id===line.itemId);
    if (!item || disabled.includes(item.id)) throw new Error('An item is no longer available. Update your basket.');
    if (!Number.isInteger(line.quantity) || line.quantity<1 || line.quantity>30) throw new Error('Quantity must be between 1 and 30.');
    if (new Set(line.addOns).size !== line.addOns.length || (item.category!=='Main meals' && line.addOns.length)) throw new Error('Choose each add-on once per main meal.');
    const addOns=line.addOns.map(id=>{
      const extra=menu.find(i=>i.id===id);
      if (!extra || !addonIds.includes(id) || disabled.includes(id)) throw new Error('An add-on is no longer available.');
      return {itemId:id,name:extra.name,unitPrice:extra.price};
    });
    return {itemId:item.id,name:item.name,quantity:line.quantity,unitPrice:item.price,addOns,
      lineTotal:line.quantity*(item.price+addOns.reduce((n,a)=>n+a.unitPrice,0))};
  });
}
