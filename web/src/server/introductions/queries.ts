import 'server-only';
import { userClient } from '../database/clients';

// Party-safe поля (без internal_reason/internal_resolution/priority2/manager notes).
const PARTY_SELECT =
  'id,subject,reason,context,expected_outcome,value_for_target,status,target_type,target_profile_id,target_organization_id,target_user_id,' +
  'request_type_id,related_entity_type,related_entity_id,consent_to_share_contacts,requester_shared_contacts,target_consent_status,' +
  'public_reason,info_request,info_response,approved_at,introduction_sent_at,closed_at,created_at,updated_at,version,requester_id,' +
  'type:introduction_types(slug,title_uk),target:profiles!introductions_target_profile_id_fkey(display_name,avatar,headline),' +
  'target_org:organizations!introductions_target_organization_id_fkey(name,slug)';

// Список: власні запити (requester) + адресовані мені (target).
export async function getMyIntroductions(jwt: string, userId: string) {
  const db = userClient(jwt);
  const [mine, incoming] = await Promise.all([
    db.from('introductions').select(PARTY_SELECT).eq('requester_id', userId).is('deleted_at', null).order('updated_at', { ascending: false }),
    db.from('introductions').select(PARTY_SELECT).eq('target_user_id', userId).neq('requester_id', userId).in('status', ['waiting_for_target_consent', 'target_accepted', 'introduction_sent', 'follow_up_due', 'closed']).is('deleted_at', null).order('updated_at', { ascending: false }),
  ]);
  return { requested: mine.data ?? [], incoming: incoming.data ?? [] };
}

export async function getIntroduction(jwt: string, id: string) {
  const db = userClient(jwt);
  const { data, error } = await db.from('introductions')
    .select(PARTY_SELECT + ',intro_message,requester:profiles!introductions_requester_id_fkey(display_name,avatar,headline)')
    .eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as unknown as Record<string, unknown>;
  // intro_message показуємо лише після відправки
  if (row.status !== 'introduction_sent' && row.status !== 'follow_up_due' && row.status !== 'closed') row.intro_message = null;
  const { data: history } = await db.from('introduction_status_history')
    .select('from_status,to_status,public_note,actor_role,created_at').eq('introduction_id', id).order('created_at');
  return { ...row, history: history ?? [] };
}

// ---------- admin (PM) ----------
export async function getAdminIntroductions(jwt: string, params: { status?: string | null; manager?: string | null }) {
  const db = userClient(jwt);
  let q = db.from('introductions')
    .select('id,subject,status,priority2,request_type_id,manager_id,created_at,updated_at,target_consent_status,follow_up_due_at,' +
      'type:introduction_types(title_uk),requester:profiles!introductions_requester_id_fkey(display_name),' +
      'target:profiles!introductions_target_profile_id_fkey(display_name),target_org:organizations!introductions_target_organization_id_fkey(name)')
    .is('deleted_at', null);
  if (params.status) q = q.eq('status', params.status);
  if (params.manager) q = q.eq('manager_id', params.manager);
  q = q.order('updated_at', { ascending: false }).limit(300);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function getAdminIntroduction(jwt: string, id: string) {
  const db = userClient(jwt);
  const { data, error } = await db.from('introductions').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const [notes, history, msgs] = await Promise.all([
    db.from('introduction_internal_notes').select('id,body,created_at,author_admin_id').eq('introduction_id', id).is('deleted_at', null).order('created_at'),
    db.from('introduction_status_history').select('from_status,to_status,public_note,actor_role,created_at').eq('introduction_id', id).order('created_at'),
    db.from('introduction_messages').select('id,subject,delivery_status,sent_at,retry_count').eq('introduction_id', id).order('created_at'),
  ]);
  return { ...data, internalNotes: notes.data ?? [], history: history.data ?? [], messages: msgs.data ?? [] };
}
