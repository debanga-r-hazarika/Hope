import { supabase } from './supabase';
import type { AgileStatus, AgileIssue, AgileIssueInput, AgileFilters, AgileRoadmapBucket } from '../types/agile';

export async function fetchStatuses(): Promise<AgileStatus[]> {
  const { data, error } = await supabase
    .from('agile_statuses')
    .select('*')
    .order('position');

  if (error) throw error;
  return data || [];
}

export async function fetchAgileStatuses(): Promise<AgileStatus[]> {
  return fetchStatuses();
}

export async function fetchAgileIssues(filters?: AgileFilters): Promise<AgileIssue[]> {
  return fetchIssues(filters);
}

export async function updateAgileIssue(id: string, updates: Partial<AgileIssueInput>): Promise<AgileIssue> {
  return updateIssue(id, updates);
}

export async function deleteAgileIssue(id: string): Promise<void> {
  return deleteIssue(id);
}

export async function createAgileIssue(issue: AgileIssueInput): Promise<AgileIssue> {
  return createIssue(issue);
}

export async function fetchAgileOwners() {
  const { data, error } = await supabase
    .from('users')
    .select('id, full_name')
    .order('full_name');

  if (error) throw error;
  return data || [];
}

export function summarizePointsByStatus(issues: AgileIssue[], statuses: AgileStatus[]) {
  const summary: Record<string, number> = {};

  statuses.forEach((status) => {
    summary[status.id] = 0;
  });

  issues.forEach((issue) => {
    if (issue.statusId && summary[issue.statusId] !== undefined) {
      summary[issue.statusId] += issue.estimate || 0;
    }
  });

  return summary;
}

export async function fetchAgileBuckets(): Promise<AgileRoadmapBucket[]> {
  return fetchRoadmapBuckets();
}

export async function updateIssueOrdering(id: string, ordering: number): Promise<void> {
  const { error } = await supabase
    .from('agile_issues')
    .update({ ordering })
    .eq('id', id);

  if (error) throw error;
}

export async function createStatus(status: Partial<AgileStatus>): Promise<AgileStatus> {
  const { data, error } = await supabase
    .from('agile_statuses')
    .insert([status])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateStatus(id: string, updates: Partial<AgileStatus>): Promise<AgileStatus> {
  const { data, error } = await supabase
    .from('agile_statuses')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteStatus(id: string): Promise<void> {
  const { error } = await supabase
    .from('agile_statuses')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function fetchIssues(filters?: AgileFilters): Promise<AgileIssue[]> {
  let query = supabase.from('agile_issues').select('*').order('ordering');

  if (filters?.statusIds && filters.statusIds.length > 0) {
    query = query.in('status_id', filters.statusIds);
  }

  if (filters?.ownerIds && filters.ownerIds.length > 0) {
    query = query.in('owner_id', filters.ownerIds);
  }

  if (filters?.tag) {
    query = query.contains('tags', [filters.tag]);
  }

  if (filters?.readyOnly) {
    query = query.eq('ready_for_review', true);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function createIssue(issue: AgileIssueInput): Promise<AgileIssue> {
  const { data, error } = await supabase
    .from('agile_issues')
    .insert([issue])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateIssue(id: string, updates: Partial<AgileIssueInput>): Promise<AgileIssue> {
  const { data, error } = await supabase
    .from('agile_issues')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteIssue(id: string): Promise<void> {
  const { error } = await supabase
    .from('agile_issues')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function fetchRoadmapBuckets(): Promise<AgileRoadmapBucket[]> {
  const { data, error } = await supabase
    .from('agile_roadmap_buckets')
    .select('*')
    .order('sort_order');

  if (error) throw error;
  return data || [];
}

export async function createRoadmapBucket(bucket: Partial<AgileRoadmapBucket>): Promise<AgileRoadmapBucket> {
  const { data, error } = await supabase
    .from('agile_roadmap_buckets')
    .insert([bucket])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateRoadmapBucket(id: string, updates: Partial<AgileRoadmapBucket>): Promise<AgileRoadmapBucket> {
  const { data, error } = await supabase
    .from('agile_roadmap_buckets')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteRoadmapBucket(id: string): Promise<void> {
  const { error } = await supabase
    .from('agile_roadmap_buckets')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
