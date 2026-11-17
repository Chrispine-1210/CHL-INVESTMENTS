import type { Role } from './thoko';

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
