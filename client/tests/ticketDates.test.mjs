import test from 'node:test';
import assert from 'node:assert/strict';
import {ticketMonthKey, buildTicketTrend} from '../src/ticketDates.js';

const tickets = [
  {ticketNo:'TCK-0018',dueDate:'2026-07-07',receivedDate:'2026-10-14',status:'In Review'},
  {ticketNo:'TCK-0016',dueDate:'2026/09/09',receivedDate:'2026-10-14',status:'In Review'},
  {ticketNo:'TCK-0017',dueDate:'2026-11-09',receivedDate:'2026-10-14',status:'In Review'},
  {ticketNo:'TCK-0019',dueDate:'',receivedDate:'2026-10-14',status:'Closed'}
];
test('Date shown in ticket details takes precedence over receivedDate', () => {
  assert.deepEqual(tickets.map(ticketMonthKey),['2026-07','2026-09','2026-11','2026-10']);
});
test('monthly trend uses ticket Date and keeps months with zero counts', () => {
  const trend = buildTicketTrend(tickets,new Date(2026,5,1),6,{
    isCompleted:t=>t.status==='Closed',isOverdue:()=>false,locale:'en'
  });
  const byMonth=Object.fromEntries(trend.map(r=>[r.key,r]));
  assert.equal(byMonth['2026-07'].open,1);
  assert.equal(byMonth['2026-09'].open,1);
  assert.equal(byMonth['2026-10'].completed,1);
  assert.equal(byMonth['2026-08'].open,0);
  assert.equal(byMonth['2026-11'].open,1);
});
