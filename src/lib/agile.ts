import { supabase } from './supabase';
import type { AgileStatus, AgileRoadmapBucket, AgileIssue, AgileIssueInput, AgileFilters } from '../types/agile';

export async function fetchAgileStatuses(): Promise<AgileStatus[]> {
  const { data, error } = await supabase
    .from('agile_statuses')
    .select('*')
    .order('position', { ascending: true });

  if (error) throw error;

  return (data || []).map(row => ({
    id: row.id,
    name: row.name,
    description: row.description,
    position: row.position,
    color: row.color,
  }));
}

export async function fetchAgileBuckets(): Promise<AgileRoadmapBucket[]> {
  const { data, error } = await supabase
    .from('agile_roadmap_buckets')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw error;

  return (data || []).map(row => ({
    id: row.id,
    name: row.name,
    sortOrder: row.sort_order,
  }));
}

export async function fetchAgileIssues(filters?: AgileFilters): Promise<AgileIssue[]> {
  let query = supabase
    .from('agile_issues')
    .select('*')
    .order('ordering', { ascending: true });

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

  return (data || []).map(row => ({
    id: row.id,
    title: row.title,
    description: row.description,
    statusId: row.status_id,
    priority: row.priority,
    deadlineDate: row.deadline_date,
    estimate: row.estimate,
    ownerId: row.owner_id,
    ownerName: row.owner_name,
    tags: row.tags || [],
    roadmapBucket: row.roadmap_bucket,
    ordering: row.ordering,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    readyForReview: row.ready_for_review,
    reviewRejected: row.review_rejected,
  }));
}

export async function fetchAgileOwners(): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabase
    .from('agile_issues')
    .select('owner_id, owner_name')
    .not('owner_id', 'is', null)
    .not('owner_name', 'is', null);

  if (error) throw error;

  const uniqueOwners = new Map<string, string>();
  (data || []).forEach(row => {
    if (row.owner_id && row.owner_name) {
      uniqueOwners.set(row.owner_id, row.owner_name);
    }
  });

  return Array.from(uniqueOwners.entries()).map(([id, name]) => ({ id, name }));
}

export async function createAgileIssue(input: AgileIssueInput): Promise<AgileIssue> {
  const maxOrderingResult = await supabase
    .from('agile_issues')
    .select('ordering')
    .order('ordering', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrdering = maxOrderingResult.data ? maxOrderingResult.data.ordering + 1 : 0;

  const { data, error } = await supabase
    .from('agile_issues')
    .insert({
      title: input.title,
      description: input.description,
      status_id: input.statusId,
      priority: input.priority || 'normal',
      deadline_date: input.deadlineDate,
      estimate: input.estimate,
      owner_id: input.ownerId,
      owner_name: input.ownerName,
      tags: input.tags || [],
      roadmap_bucket: input.roadmapBucket,
      ordering: nextOrdering,
      ready_for_review: input.readyForReview || false,
      review_rejected: input.reviewRejected || false,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    statusId: data.status_id,
    priority: data.priority,
    deadlineDate: data.deadline_date,
    estimate: data.estimate,
    ownerId: data.owner_id,
    ownerName: data.owner_name,
    tags: data.tags || [],
    roadmapBucket: data.roadmap_bucket,
    ordering: data.ordering,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    readyForReview: data.ready_for_review,
    reviewRejected: data.review_rejected,
  };
}

export async function updateAgileIssue(id: string, input: Partial<AgileIssueInput>): Promise<AgileIssue> {
  const updateData: Record<string, unknown> = {};

  if (input.title !== undefined) updateData.title = input.title;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.statusId !== undefined) updateData.status_id = input.statusId;
  if (input.priority !== undefined) updateData.priority = input.priority;
  if (input.deadlineDate !== undefined) updateData.deadline_date = input.deadlineDate;
  if (input.estimate !== undefined) updateData.estimate = input.estimate;
  if (input.ownerId !== undefined) updateData.owner_id = input.ownerId;
  if (input.ownerName !== undefined) updateData.owner_name = input.ownerName;
  if (input.tags !== undefined) updateData.tags = input.tags;
  if (input.roadmapBucket !== undefined) updateData.roadmap_bucket = input.roadmapBucket;
  if (input.readyForReview !== undefined) updateData.ready_for_review = input.readyForReview;
  if (input.reviewRejected !== undefined) updateData.review_rejected = input.reviewRejected;

  const { data, error } = await supabase
    .from('agile_issues')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    statusId: data.status_id,
    priority: data.priority,
    deadlineDate: data.deadline_date,
    estimate: data.estimate,
    ownerId: data.owner_id,
    ownerName: data.owner_name,
    tags: data.tags || [],
    roadmapBucket: data.roadmap_bucket,
    ordering: data.ordering,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    readyForReview: data.ready_for_review,
    reviewRejected: data.review_rejected,
  };
}

export async function deleteAgileIssue(id: string): Promise<void> {
  const { error } = await supabase.from('agile_issues').delete().eq('id', id);
  if (error) throw error;
}

export async function updateIssueOrdering(issueId: string, newOrdering: number): Promise<void> {
  const { error } = await supabase
    .from('agile_issues')
    .update({ ordering: newOrdering })
    .eq('id', issueId);

  if (error) throw error;
}

export async function summarizePointsByStatus(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('agile_issues')
    .select('status_id, estimate');

  if (error) throw error;

  const summary: Record<string, number> = {};
  (data || []).forEach(row => {
    if (row.status_id) {
      summary[row.status_id] = (summary[row.status_id] || 0) + (row.estimate || 0);
    }
  });

  return summary;
}
