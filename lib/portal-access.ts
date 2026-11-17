import type { Register, Role } from './thoko';

export const rights = {
  ordersRead:['founder','operations','finance','kitchen','dispatch'],
  ordersUpdate:['founder','operations','kitchen','dispatch'],
  payments:['founder','finance','operations'],
  financeRead:['founder','finance','board'],
  financeWrite:['founder','finance'],
  people:['founder','officer'],
  audit:['founder','board','finance'],
  manage:['founder'],
} satisfies Record<string,Role[]>;
export function permits(role:Role|null, right:keyof typeof rights) {
  return role !== null && (rights[right] as Role[]).includes(role);
}

export type View = 'summary'|'orders'|'ledger'|'team'|'community'|'audit'|'settings'|Register;
export const navigation: [string, Array<[View,string,string]>][] = [
  ['Service',[['summary','Overview','overview'],['orders','Order queue','orders'],['tasks','Tasks & follow-ups','tasks'],['team','Team directory','team'],['shifts','Shift roster','calendar'],['hiring','Recruitment','team']]],
  ['Finance & governance',[['ledger','Financial statements','ledger'],['budgets','Monthly budgets','ledger'],['bills','Bills & payables','bills'],['tax','Tax calendar','calendar'],['contracts','Contracts','contracts'],['risks','Risk register','risks'],['decisions','Board decisions','decisions']]],
  ['Administration',[['posts','Journal publishing','posts'],['community','Community inbox','community'],['audit','Audit trail','audit'],['settings','Access & settings','settings']]],
];
export function portalPath(view:View) {
  return view==='summary'?'/portal':'/portal/'+view;
}
export function portalView(section:string): View|undefined {
  return navigation.flatMap(([,items])=>items).find(([view])=>view===section)?.[0];
}
export const managesWork = (role:Role|null) => role==='founder'||role==='operations'||role==='officer';
export const seesTeam = (role:Role|null) => managesWork(role);
export const seesAllTasks = (role:Role|null) => managesWork(role)||role==='board';
export function canRegister(role:Role|null,key:Register,write=false) {
  if (role==='founder') return true;
  if (!role) return false;
  switch (key) {
    case 'tasks': return write?managesWork(role):true;
    case 'hiring': return permits(role,'people');
    case 'shifts': return write?managesWork(role):true;
    case 'bills':
    case 'tax':
    case 'budgets': return role==='finance'||(role==='board'&&!write);
    case 'posts': return role==='officer'||role==='operations';
    case 'decisions': return role==='board';
    case 'contracts': return role==='operations'||role==='finance'||(role==='board'&&!write);
    case 'risks': return ['board','operations','officer','finance'].includes(role);
  }
}
export function visible(role:Role,view:View) {
  switch (view) {
    case 'summary': return true;
    case 'orders': return permits(role,'ordersRead');
    case 'ledger': return permits(role,'financeRead');
    case 'team': return seesTeam(role);
    case 'community': return permits(role,'people');
    case 'audit': return permits(role,'audit');
    case 'settings': return permits(role,'manage');
    default: return canRegister(role,view);
  }
}
