import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __d = dirname(fileURLToPath(import.meta.url));
const MIG = join(__d, '..', 'migrations');
const SEED = join(__d, '..', 'seed.sql');
const db = new PGlite();
let PASS = 0, FAIL = 0;
const ok = (m) => { PASS++; console.log('  ✓', m); };
const bad = (m, e) => { FAIL++; console.log('  ✗', m, '—', (e && (e.message||e)) || ''); };

// ---- auth shim ----
await db.exec(`
  create schema if not exists auth;
  create table if not exists auth.users (id uuid primary key, email text, email_confirmed_at timestamptz default now(), raw_user_meta_data jsonb default '{}'::jsonb);
  do $$ begin create role anon; exception when duplicate_object then null; end $$;
  do $$ begin create role authenticated; exception when duplicate_object then null; end $$;
  do $$ begin create role service_role; exception when duplicate_object then null; end $$;
  grant usage on schema auth to anon, authenticated, service_role;
  create or replace function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claims', true)::jsonb->>'sub','')::uuid; $$;
`);

// ---- apply migrations ----
const files = readdirSync(MIG).filter(f => f.endsWith('.sql')).sort();
const sanitize = (s) => s.replace(/create extension if not exists pgcrypto;/gi, '-- pgcrypto (core gen_random_uuid in PGlite)');
for (const f of files) {
  try { await db.exec(sanitize(readFileSync(`${MIG}/${f}`, 'utf8'))); }
  catch (e) { console.log('MIGRATION FAILED:', f, '\n', e.message); process.exit(1); }
}
console.log(`Applied ${files.length} migrations OK`);
// Supabase grants broad table privileges to anon/authenticated; RLS does the real gating.
await db.exec(`grant usage on schema public to anon, authenticated, service_role;
  grant select, insert, update, delete on all tables in schema public to authenticated;
  grant select on all tables in schema public to anon;
  grant all on all tables in schema public to service_role;
  grant usage, select on all sequences in schema public to anon, authenticated, service_role;`);
try { await db.exec(readFileSync(SEED, 'utf8')); ok('seed applied'); } catch (e) { bad('seed', e); }

// helper: run as a user
// PGlite runs each statement in its own implicit tx → use session-level (false), not `local`.
async function clearCtx() { await db.exec('reset role;'); await db.query(`select set_config('request.jwt.claims', '{}', false)`); await db.query(`select set_config('app.privileged_write','0',false)`); }
async function asUser(uid, fn) {
  await db.query(`select set_config('request.jwt.claims', $1, false)`, [JSON.stringify({ sub: uid })]);
  await db.exec('set role authenticated;');
  try { return await fn(); } finally { await clearCtx(); }
}
async function asAnon(fn) {
  await db.query(`select set_config('request.jwt.claims', '{}', false)`);
  await db.exec(`set role anon;`);
  try { return await fn(); } finally { await clearCtx(); }
}
async function asService(fn) { await clearCtx(); return fn(); }

// ---- fixtures: org + members + admin(event_manager) + users ----
const U = {
  owner: '11111111-1111-1111-1111-111111111111',   // org owner
  member: '22222222-2222-2222-2222-222222222222',  // plain member (no publish)
  em: '33333333-3333-3333-3333-333333333333',      // event_manager admin
  ua: '44444444-4444-4444-4444-444444444444',      // attendee A
  ub: '55555555-5555-5555-5555-555555555555',      // attendee B
  uc: '66666666-6666-6666-6666-666666666666',      // attendee C (waitlist)
};
const ORG = '77777777-7777-7777-7777-777777777777';
const ETYPE = (await db.query(`select id from public.event_types where slug='conference'`)).rows[0].id;

await asService(async () => {
  await db.query(`select set_config('app.privileged_write','1',false)`);   // bypass guard triggers for fixtures
  for (const id of Object.values(U)) {
    await db.query(`insert into auth.users(id,email) values ($1,$2)`, [id, id.slice(0,4)+'@t.co']);
    await db.query(`update public.profiles set display_name=$2 where id=$1`, [id, 'U'+id.slice(0,2)]);
    await db.query(`insert into public.profiles(id,display_name) select $1,$2 where not exists (select 1 from public.profiles where id=$1)`, [id, 'U'+id.slice(0,2)]);
  }
  await db.query(`insert into public.organizations(id,name,slug,owner_id,moderation) values ($1,'Org','org',$2,'approved')`, [ORG, U.owner]);
  await db.query(`insert into public.organization_members(org_id,user_id,role,status) values ($1,$2,'owner','active'),($1,$3,'member','active')`, [ORG,U.owner,U.member]);
  await db.query(`insert into public.admin_users(id,email,role,status) values ($1,'em@t.co','event_manager','active')`, [U.em]);
});
await clearCtx();   // drop privileged flag before role-scoped tests
ok('fixtures created');

// ============ TEST: creation permission ============
let EV;
await asUser(U.owner, async () => {
  const r = await db.query(`select public.create_event_draft($1,$2::jsonb,null) as j`, [ORG, JSON.stringify({title:'SMR Forum', timezone:'Europe/Kyiv'})]);
  EV = r.rows[0].j.id; ok('owner creates draft');
});
try { await asUser(U.member, async () => { await db.query(`select public.create_event_draft($1,$2::jsonb,null)`, [ORG, JSON.stringify({title:'x'})]); }); bad('member should NOT create'); }
catch { ok('plain member cannot create (forbidden)'); }

// fill + submit (missing fields → validation)
try { await asUser(U.owner, async () => { await db.query(`select public.submit_event_for_moderation($1,null)`, [EV]); }); bad('submit without required should fail'); }
catch { ok('submit blocked until required fields (starts_at/type)'); }

await asUser(U.owner, async () => {
  await db.query(`select public.update_event_draft($1,$2::jsonb,null,null)`, [EV, JSON.stringify({
    event_type_id: ETYPE, format_kind:'offline', country:'Україна', city:'Київ', venue_name:'Arena',
    starts_at:'2026-09-01T10:00:00Z', ends_at:'2026-09-01T18:00:00Z',
    capacity:2, waitlist_enabled:true, registration_mode:'instant', ticket_type:'free'
  })]);
  await db.query(`select public.submit_event_for_moderation($1,null)`, [EV]);
  ok('owner fills + submits (moderation=pending)');
});

// organizer cannot self-approve (no EM role)
try { await asUser(U.owner, async () => { await db.query(`select public.admin_approve_event($1,true,null)`, [EV]); }); bad('organizer must not approve'); }
catch { ok('organizer cannot approve (forbidden)'); }

// organizer cannot flip published_at directly (trigger barrier)
try { await asUser(U.owner, async () => { await db.query(`update public.events set business_status='published', published_at=now() where id=$1`, [EV]); });
  const bs = (await db.query(`select business_status from public.events where id=$1`,[EV])).rows[0].business_status;
  if (bs === 'published') bad('trigger barrier failed: organizer published'); else ok('trigger barrier: organizer cannot set published');
}
catch { ok('trigger barrier: organizer direct publish blocked'); }

// EM approves + publishes
await asUser(U.em, async () => { const r = await db.query(`select public.admin_approve_event($1,true,null) as j`,[EV]); if (r.rows[0].j.business_status!=='published') throw new Error('not published'); ok('EM approves + publishes'); });

// public visibility
await asAnon(async () => {
  const r = await db.query(`select count(*)::int c from public.public_events where id=$1`, [EV]);
  r.rows[0].c === 1 ? ok('published event visible in public_events') : bad('public_events missing published');
});
// anon must NOT see private online link column exposure — public_events has no online_private_url
{ const cols = (await db.query(`select column_name from information_schema.columns where table_name='public_events'`)).rows.map(x=>x.column_name);
  cols.includes('online_private_url') ? bad('public_events leaks private link') : ok('public_events has no private online link'); }

// ============ REGISTRATION + CAPACITY (cap=2) ============
await asUser(U.ua, async () => { const r=await db.query(`select public.register_for_event($1,null,true,true,'web',null) as j`,[EV]); r.rows[0].j.status==='registered'?ok('A registered'):bad('A not registered'); });
await asUser(U.ub, async () => { const r=await db.query(`select public.register_for_event($1,null,true,true,'web',null) as j`,[EV]); r.rows[0].j.status==='registered'?ok('B registered'):bad('B not registered'); });
// duplicate
try { await asUser(U.ua, async () => { await db.query(`select public.register_for_event($1,null,false,false,'web',null)`,[EV]); }); bad('duplicate allowed'); }
catch { ok('duplicate registration blocked'); }
// C → waitlist (capacity full)
await asUser(U.uc, async () => { const r=await db.query(`select public.register_for_event($1,null,false,false,'web',null) as j`,[EV]); r.rows[0].j.status==='waitlisted'?ok('C waitlisted (capacity full)'):bad('C should be waitlisted, got '+r.rows[0].j.status); });
{ const c=(await db.query(`select registered_count,waitlist_count from public.events where id=$1`,[EV])).rows[0]; (c.registered_count===2&&c.waitlist_count===1)?ok('counters registered=2 waitlist=1'):bad('counters wrong '+JSON.stringify(c)); }

// A cancels → C gets offer
await asUser(U.ua, async () => { await db.query(`select public.cancel_event_registration($1,null)`,[EV]); ok('A cancels'); });
{ const p=(await db.query(`select promotion_status from public.event_registrations where event_id=$1 and user_id=$2`,[EV,U.uc])).rows[0].promotion_status; p==='offered'?ok('C received waitlist offer'):bad('C promo status='+p); }
// user cannot accept someone else's offer / no offer
try { await asUser(U.ub, async () => { await db.query(`select public.accept_waitlist_place($1,null)`,[EV]); }); bad('B (registered) accepted a waitlist offer'); }
catch { ok('non-offered user cannot accept'); }
// C accepts
await asUser(U.uc, async () => { const r=await db.query(`select public.accept_waitlist_place($1,null) as j`,[EV]); r.rows[0].j.status==='registered'?ok('C accepts → registered'):bad('C accept failed'); });
{ const c=(await db.query(`select registered_count,waitlist_count from public.events where id=$1`,[EV])).rows[0]; (c.registered_count===2&&c.waitlist_count===0)?ok('after promotion counters=2/0'):bad('counters '+JSON.stringify(c)); }

// participant reads private access; non-participant forbidden
await asUser(U.uc, async () => { const r=await db.query(`select public.get_event_access($1) as j`,[EV]); r.rows[0].j.ok?ok('participant reads access'):bad('access'); });
try { await asUser(U.member, async () => { await db.query(`select public.get_event_access($1)`,[EV]); }); bad('non-participant read access'); }
catch { ok('non-participant cannot read private access'); }

// registration privacy: user A cannot read C's registration row
await asUser(U.ua, async () => { const c=(await db.query(`select count(*)::int c from public.event_registrations where user_id=$1`,[U.uc])).rows[0].c; c===0?ok('user cannot read others registrations (RLS)'):bad('RLS leak: sees others regs'); });

// ============ RESCHEDULE + notifications ============
await asUser(U.owner, async () => { await db.query(`select public.reschedule_event($1,'2026-09-15T10:00:00Z','2026-09-15T18:00:00Z','Форс-мажор',null)`,[EV]); ok('owner reschedules'); });
{ const n=(await db.query(`select count(*)::int c from public.notifications where entity_id=$1 and type='event_rescheduled'`,[EV])).rows[0].c; n>=2?ok('reschedule notified participants ('+n+')'):bad('reschedule notifications='+n); }

// ============ COMPLETE + attendance ============
await asUser(U.em, async () => { await db.query(`select public.complete_event($1,null)`,[EV]); ok('EM completes event'); });
{ // mark B + C attended
  const regs=(await db.query(`select id,user_id from public.event_registrations where event_id=$1 and status='registered'`,[EV])).rows;
  await asUser(U.owner, async () => {
    for (const rg of regs) await db.query(`select public.mark_event_attendance($1,'attended',null)`,[rg.id]);
    ok('organizer marks attendance for '+regs.length+' participants');
  });
  const att=(await db.query(`select count(*)::int c from public.event_registrations where event_id=$1 and status='attended'`,[EV])).rows[0].c;
  att===regs.length?ok('attendance persisted'):bad('attendance count '+att);
}
// user cannot self-mark attended
{ const reg=(await db.query(`select id from public.event_registrations where event_id=$1 and user_id=$2`,[EV,U.uc])).rows[0].id;
  try { await asUser(U.uc, async () => { await db.query(`select public.mark_event_attendance($1,'attended',null)`,[reg]); }); bad('user self-marked attendance'); }
  catch { ok('user cannot self-mark attendance'); } }

// A stays cancelled
{ const s=(await db.query(`select status from public.event_registrations where event_id=$1 and user_id=$2`,[EV,U.ua])).rows[0].status; s==='cancelled'?ok('A remains cancelled'):bad('A status='+s); }

// ============ CANCELLED EVENT flow (separate event) ============
let EV2;
await asUser(U.em, async () => {
  const r=await db.query(`select public.create_event_draft($1,$2::jsonb,null) as j`,[ORG, JSON.stringify({title:'Webinar', timezone:'Europe/Kyiv'})]); EV2=r.rows[0].j.id;
  await db.query(`select public.update_event_draft($1,$2::jsonb,null,null)`,[EV2, JSON.stringify({event_type_id:ETYPE,format_kind:'online',online_platform:'Zoom',starts_at:'2026-10-01T10:00:00Z',registration_mode:'instant',ticket_type:'free'})]);
  await db.query(`select public.submit_event_for_moderation($1,null)`,[EV2]);
  await db.query(`select public.admin_approve_event($1,true,null)`,[EV2]);
});
await asUser(U.ua, async () => { await db.query(`select public.register_for_event($1,null,false,false,'web',null)`,[EV2]); });
await asUser(U.em, async () => { await db.query(`select public.cancel_event($1,'Недостатньо реєстрацій','internal',null)`,[EV2]); ok('EM cancels event'); });
{ const bs=(await db.query(`select business_status,public_cancel_reason from public.events where id=$1`,[EV2])).rows[0]; (bs.business_status==='cancelled'&&bs.public_cancel_reason)?ok('event cancelled + public reason set'):bad('cancel state '+JSON.stringify(bs)); }
// new registration blocked on cancelled event
try { await asUser(U.ub, async () => { await db.query(`select public.register_for_event($1,null,false,false,'web',null)`,[EV2]); }); bad('registration on cancelled event allowed'); }
catch { ok('cancelled event blocks new registration'); }
{ const n=(await db.query(`select count(*)::int c from public.notifications where entity_id=$1 and type='event_cancelled'`,[EV2])).rows[0].c; n>=1?ok('cancellation notified participants'):bad('cancel notif='+n); }

// ============ CRON idempotency ============
await asService(async () => { const r=await db.query(`select public.events_cron() as j`); r.rows[0].j.ok?ok('events_cron runs (service_role)'):bad('cron'); });
try { await asUser(U.owner, async () => { await db.query(`select public.events_cron()`); }); bad('cron callable by non-service'); }
catch { ok('events_cron not executable by authenticated'); }

// ============================================================
// MILESTONE 7 — hardening ops-backbone
// ============================================================
const SUPER='88888888-8888-8888-8888-888888888888', ANALYST='99999999-9999-9999-9999-999999999999';
await asService(async () => {
  await db.query(`select set_config('app.privileged_write','1',false)`);
  for (const [id,role] of [[SUPER,'super_admin'],[ANALYST,'analyst']]) {
    await db.query(`insert into auth.users(id,email) values ($1,$2)`,[id,id.slice(0,4)+'@t.co']);
    await db.query(`update public.profiles set display_name=$2 where id=$1`,[id,'A'+id.slice(0,2)]);
    await db.query(`insert into public.profiles(id,display_name) select $1,$2 where not exists (select 1 from public.profiles where id=$1)`,[id,'A'+id.slice(0,2)]);
    await db.query(`insert into public.admin_users(id,email,role,status) values ($1,$2,$3,'active')`,[id,id.slice(0,3)+'@t.co',role]);
  }
});
await clearCtx();

// feature flags: super sets, audience gate
await asUser(SUPER, async () => { await db.query(`select public.set_feature_flag('events_enabled',true,array[]::text[],'{}'::jsonb,'x')`); ok('super_admin sets feature flag'); });
try { await asUser(U.ua, async () => { await db.query(`select public.set_feature_flag('x',true,array[]::text[],'{}'::jsonb,null)`); }); bad('non-super set flag'); } catch { ok('non-super cannot set flag'); }
await asUser(U.ua, async () => { const r=await db.query(`select public.is_feature_enabled('events_enabled') e`); r.rows[0].e?ok('is_feature_enabled true (global)'):bad('flag not enabled'); });
await asUser(SUPER, async () => { await db.query(`select public.set_feature_flag('cohort_only',true,array[]::text[],'{"cohorts":["vip"]}'::jsonb,null)`); });
await asUser(U.ua, async () => { const r=await db.query(`select public.is_feature_enabled('cohort_only') e`); (!r.rows[0].e)?ok('cohort-gated flag hidden from non-cohort user'):bad('cohort gate leaked'); });

// beta invitation create + redeem (cohort applied)
let CH='vip';
await asUser(SUPER, async () => { await db.query(`select public.create_beta_invitation('hash_abc',null,null,$1,3,null)`,[CH]); ok('super creates beta invitation'); });
try { await asUser(U.ub, async () => { await db.query(`select public.create_beta_invitation('h',null,null,null,1,null)`); }); bad('non-super created invite'); } catch { ok('non-super cannot create invite'); }
await asUser(U.ub, async () => { const r=await db.query(`select public.redeem_beta_invitation('hash_abc',null) j`); r.rows[0].j.cohort===CH?ok('user redeems invite → cohort'):bad('redeem'); });
{ const co=(await db.query(`select cohorts from public.profiles where id=$1`,[U.ub])).rows[0].cohorts; (co&&co.includes('vip'))?ok('cohort applied to profile'):bad('cohort not applied'); }
await asUser(U.ub, async () => { const r=await db.query(`select public.is_feature_enabled('cohort_only') e`); r.rows[0].e?ok('cohort flag now visible to cohort member'):bad('cohort flag still hidden'); });
try { await asUser(U.uc, async () => { await db.query(`select public.redeem_beta_invitation('hash_wrong',null)`); }); bad('invalid code redeemed'); } catch { ok('invalid invite code rejected'); }

// notification preferences: security cannot be disabled
await asUser(U.ua, async () => {
  await db.query(`select public.upsert_notification_preferences('{"channels":{"push":false},"categories":{"security":{"push":false}}}'::jsonb)`);
  const p=(await db.query(`select channels,categories from public.notification_preferences where user_id=$1`,[U.ua])).rows[0];
  (p.channels.push===false && p.categories.security && p.categories.security.push===true)?ok('prefs saved; security channel forced on'):bad('security pref not enforced '+JSON.stringify(p.categories));
});
await asUser(U.ub, async () => { const c=(await db.query(`select count(*)::int c from public.notification_preferences where user_id=$1`,[U.ua])).rows[0].c; c===0?ok('user cannot read others prefs (RLS)'):bad('prefs RLS leak'); });

// devices: token transfer prevention
await asUser(U.ua, async () => { await db.query(`select public.register_device('ios','tok-123','devA','1.0','production')`); ok('user A registers device'); });
await asUser(U.ub, async () => { await db.query(`select public.register_device('ios','tok-123','devB','1.0','production')`); });
{ const a=(await db.query(`select invalidated_at from public.devices where user_id=$1 and push_token='tok-123'`,[U.ua])).rows[0];
  const b=(await db.query(`select invalidated_at from public.devices where user_id=$1 and push_token='tok-123'`,[U.ub])).rows[0];
  (a.invalidated_at && !b.invalidated_at)?ok('push token reassigned → old owner invalidated'):bad('token transfer not prevented'); }

// consent
await asUser(U.ua, async () => { await db.query(`select public.record_consent('terms','v1','web')`); const c=(await db.query(`select count(*)::int c from public.user_consents where user_id=$1 and consent_type='terms'`,[U.ua])).rows[0].c; c===1?ok('consent recorded'):bad('consent'); });
try { await asUser(U.ua, async () => { await db.query(`select public.revoke_consent('security')`); }); bad('security consent revoked'); } catch { ok('security consent cannot be revoked'); }

// feedback: own read + admin update
let FB;
await asUser(U.ua, async () => { const r=await db.query(`select public.submit_feedback('bug','щось зламалось',null,null,'1.0','web','/events') j`); FB=r.rows[0].j.id; ok('user submits feedback'); });
await asUser(U.ub, async () => { const c=(await db.query(`select count(*)::int c from public.feedback where id=$1`,[FB])).rows[0].c; c===0?ok('user cannot read others feedback (RLS)'):bad('feedback RLS leak'); });
try { await asUser(U.ua, async () => { await db.query(`select public.update_feedback_status($1,'resolved',null)`,[FB]); }); bad('user changed feedback status'); } catch { ok('user cannot change feedback status'); }
await asUser(SUPER, async () => { await db.query(`select public.update_feedback_status($1,'triaged','high')`,[FB]); ok('admin triages feedback'); });

// account deletion + data export
await asUser(U.uc, async () => { const r=await db.query(`select public.request_account_deletion(30) j`); r.rows[0].j.effective_at?ok('account deletion requested (grace)'):bad('deletion'); });
await asUser(U.uc, async () => { await db.query(`select public.cancel_account_deletion()`); const d=(await db.query(`select deletion_requested_at from public.profiles where id=$1`,[U.uc])).rows[0]; (!d.deletion_requested_at)?ok('account deletion cancelled'):bad('cancel deletion'); });
await asUser(U.ua, async () => { const r=await db.query(`select public.export_my_data() j`); const j=r.rows[0].j; (j.profile && Array.isArray(j.bookmarks) && j.exported_at)?ok('data export returns own bundle'):bad('export shape'); (j.profile.id===U.ua)?ok('export contains only own profile'):bad('export leaked other profile'); });

// data quality + metrics gating
await asUser(ANALYST, async () => { const r=await db.query(`select public.data_quality_report() j`); r.rows[0].j.generated_at?ok('analyst reads data_quality_report'):bad('dq'); });
try { await asUser(U.ua, async () => { await db.query(`select public.data_quality_report()`); }); bad('user read data quality'); } catch { ok('non-admin cannot read data quality'); }
await asUser(SUPER, async () => { const r=await db.query(`select public.admin_metrics() j`); (r.rows[0].j.users_total!==undefined)?ok('admin_metrics returns aggregates'):bad('metrics'); });
try { await asUser(U.ua, async () => { await db.query(`select public.admin_metrics()`); }); bad('user read admin metrics'); } catch { ok('non-admin cannot read admin metrics'); }

// ============================================================
// MILESTONE 8 — closed beta enablement
// ============================================================
// business outcome: admin records, participant reads own, non-participant cannot
let BO;
await asUser(SUPER, async () => { const r=await db.query(`select public.record_business_outcome($1::jsonb) j`,[JSON.stringify({outcome_type:'contact_established',source_module:'introductions',participants:[U.ua],status:'verified',short_description:'x'})]); BO=r.rows[0].j.id; ok('admin records business outcome'); });
try { await asUser(U.ua, async () => { await db.query(`select public.record_business_outcome($1::jsonb)`,[JSON.stringify({outcome_type:'x'})]); }); bad('user recorded outcome'); } catch { ok('non-admin cannot record outcome'); }
await asUser(U.ua, async () => { const c=(await db.query(`select count(*)::int c from public.business_outcomes where id=$1`,[BO])).rows[0].c; c===1?ok('participant reads own outcome'):bad('participant cannot see own outcome'); });
await asUser(U.ub, async () => { const c=(await db.query(`select count(*)::int c from public.business_outcomes where id=$1`,[BO])).rows[0].c; c===0?ok('non-participant cannot read outcome (RLS)'):bad('outcome RLS leak'); });

// survey response: own insert, admin aggregate read
await asUser(U.ua, async () => { await db.query(`select public.submit_survey_response('onboarding','clear',5,'yes',null,null)`); ok('user submits survey response'); });
try { await asUser(U.ua, async () => { await db.query(`select public.submit_survey_response('x',null,9,null,null,null)`); }); bad('invalid rating accepted'); } catch { ok('survey rating validated (1..5)'); }
await asUser(U.ub, async () => { const c=(await db.query(`select count(*)::int c from public.survey_responses where user_id=$1`,[U.ua])).rows[0].c; c===0?ok('user cannot read others survey (RLS)'):bad('survey RLS leak'); });

// beta metrics gating + shape
await asUser(ANALYST, async () => { const r=await db.query(`select public.beta_metrics() j`); const j=r.rows[0].j; (j.funnel_opportunities && j.business_outcomes_total!==undefined && j.generated_at)?ok('analyst reads beta_metrics (funnels+outcomes)'):bad('beta_metrics shape'); });
try { await asUser(U.ua, async () => { await db.query(`select public.beta_metrics()`); }); bad('user read beta metrics'); } catch { ok('non-admin cannot read beta metrics'); }

// beta flags seeded
{ const c=(await db.query(`select count(*)::int c from public.feature_flags where key in ('beta_invite_required','public_signup','maintenance_mode')`)).rows[0].c; c===3?ok('beta feature flags seeded'):bad('beta flags missing '+c); }
{ const s=(await db.query(`select enabled from public.feature_flags where key='public_signup'`)).rows[0].enabled; (s===false)?ok('public_signup disabled by default (closed beta)'):bad('public_signup should be off'); }

// is_seed marker present
{ const c=(await db.query(`select count(*)::int c from information_schema.columns where table_name='opportunities' and column_name='is_seed'`)).rows[0].c; c===1?ok('is_seed marker on opportunities'):bad('is_seed missing'); }

console.log(`\n==== ${PASS} passed, ${FAIL} failed ====`);
process.exit(FAIL ? 1 : 0);
