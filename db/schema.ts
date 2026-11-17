import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const settings = sqliteTable('settings',{key:text().primaryKey(),value:text().notNull()});
export const staff = sqliteTable('staff',{email:text().primaryKey(),role:text().notNull(),active:integer().notNull(),created:text().notNull()});
export const orders = sqliteTable('orders',{
  id:text().primaryKey(), userId:text('user_id').notNull(), key:text('request_key').notNull(), fingerprint:text().notNull(),
  mode:text().notNull(), status:text().notNull(), name:text().notNull(), phone:text().notNull(),
  address:text().notNull(), notes:text().notNull(), lines:text().notNull(), subtotal:integer().notNull(),
  fee:integer(), created:text().notNull(), updated:text().notNull(), revision:integer().notNull(),
}, t=>[uniqueIndex('order_request_once').on(t.userId,t.key),index('order_history').on(t.userId,t.created),index('order_queue').on(t.status,t.created)]);
export const receipts = sqliteTable('receipts',{
  id:text().primaryKey(),orderId:text('order_id').notNull().references(()=>orders.id),
  kind:text().notNull(), amount:integer().notNull(), channel:text().notNull(), reference:text().notNull(),
  created:text().notNull(), actor:text().notNull(), note:text().notNull(),
},t=>[uniqueIndex('receipt_unique_reference').on(t.channel,t.reference),index('receipts_by_order').on(t.orderId)]);
export const records = sqliteTable('records',{
  id:text().primaryKey(),kind:text().notNull(),title:text().notNull(),party:text().notNull(),
  due:text().notNull(),status:text().notNull(),amount:integer().notNull(),note:text().notNull(),
  likelihood:integer().notNull(),impact:integer().notNull(),evidence:text().notNull(), created:text().notNull(),
  updated:text().notNull(),revision:integer().notNull(),
},t=>[index('records_by_kind').on(t.kind,t.status,t.due),index('records_by_owner').on(t.party,t.kind)]);
export const community = sqliteTable('community',{
  id:text().primaryKey(),userId:text('user_id').notNull(),email:text().notNull(),kind:text().notNull(),
  note:text().notNull(),status:text().notNull(),created:text().notNull(),updated:text().notNull(),
},t=>[uniqueIndex('community_unique_interest').on(t.userId,t.kind)]);
export const journals = sqliteTable('journals',{
  id:text().primaryKey(),reference:text().notNull().unique(),date:text().notNull(),memo:text().notNull(),actor:text().notNull(),created:text().notNull(),
},t=>[index('journal_by_date').on(t.date)]);
export const postings = sqliteTable('postings',{
  id:text().primaryKey(),journalId:text('journal_id').notNull().references(()=>journals.id),
  account:text().notNull(),side:text().notNull(),amount:integer().notNull(),
},t=>[index('postings_journal').on(t.journalId)]);
export const audit = sqliteTable('audit',{
  id:text().primaryKey(), actor:text().notNull(), action:text().notNull(),target:text().notNull(),
  detail:text().notNull(),created:text().notNull(),
},t=>[index('audit_target').on(t.target,t.created)]);
