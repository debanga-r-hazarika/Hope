import { supabase } from './supabase';
import type {
  AgileIssue,
  AgileIssueInput,
  AgileStatus,
  AgileRoadmapBucket,
  AgileFilters,
} from '../types/agile';

type IssueRow = Record<string, unknown>;

const toNumber = (value: unknown) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const mapStatusRow = (row: Record<string, unknown>): AgileStatus => ({
  id: (row.id as string) ?? '',
  name: (row.name as string) ?? '',
  description: (row.description as string | null) ?? null,
  position: (row.position as number) ?? 0,
  color: (row.color as string | null) ?? null,
});

const mapBucketRow = (row: Record<string, unknown>): AgileRoadmapBucket => ({
  id: (row.id as string) ?? '',
  name: (row.name as string) ?? '',
  sortOrder: (row.sort_order as number) ?? 0,
});

const mapIssueRow = (row: IssueRow): AgileIssue => ({
  id: (row.id as string) ?? '',
  title: (row.title as string) ?? '',
  description: (row.description as string | null) ?? null,
  statusId: (row.status_id as string | null) ?? null,
  priority: ((row.priority as string) ?? 'normal') as 'high' | 'normal' | 'low',
  deadlineDate: (row.deadline_date as string | null) ?? null,
  estimate: toNumber(row.estimate),
  ownerId: (row.owner_id as string | null) ?? null,
  ownerName: (row.owner_name as string | null) ?? null,
  tags: (row.tags as string[]) ?? [],
  roadmapBucket: (row.roadmap_bucket as string | null) ?? null,
  ordering: (row.ordering as number) ?? 0,
  createdAt: (row.created_at as string) ?? '',
  updatedAt: (row.updated_at as string) ?? '',
  readyForReview: (row.ready_for_review as boolean) ?? false,
  reviewRejected: (row.review_rejected as boolean) ?? false,
});

export async function fetchAgileStatuses(): Promise<AgileStatus[]> {
  const { data, error } = await supabase
    .from('agile_statuses')
    .select('*')
    .order('position', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapStatusRow(row as Record<string, unknown>));
}

export async function fetchAgileBuckets(): Promise<AgileRoadmapBucket[]> {
  const { data, error } = await supabase
    .from('agile_roadmap_buckets')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapBucketRow(row as Record<string, unknown>));
}

export async function fetchAgileIssues(filters?: AgileFilters): Promise<AgileIssue[]> {
  let query = supabase
    .from('agile_issues')
    .select('*')
    .order('status_id', { ascending: true })
    .order('ordering', { ascending: true });

  if (filters?.statusIds?.length) {
    query = query.in('status_id', filters.statusIds);
  }
  if (filters?.ownerIds?.length) {
    query = query.in('owner_id', filters.ownerIds);
  }
  if (filters?.tag) {
    query = query.contains('tags', [filters.tag]);
  }
  if (filters?.readyOnly) {
    query = query.eq('ready_for_review', true);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapIssueRow(row as IssueRow));
}

const fetchNextOrdering = async (statusId?: string) => {
  if (!statusId) return 0;
  const { data, error } = await supabase
    .from('agile_issues')
    .select('ordering')
    .eq('status_id', statusId)
    .order('ordering', { ascending: false })
    .limit(1);

  if (error) return 0;
  const current = (data?.[0] as { ordering?: number } | undefined)?.ordering ?? 0;
  return current + 1;
};

export async function createAgileIssue(input: AgileIssueInput, options?: { createdBy?: string | null }) {
  const ordering = await fetchNextOrdering(input.statusId);

  const payload = {
    title: input.title,
    description: input.description ?? null,
    status_id: input.statusId ?? null,
    priority: input.priority ?? 'normal',
    deadline_date: input.deadlineDate ?? null,
    estimate: input.estimate ?? null,
    owner_id: input.ownerId ?? null,
    owner_name: input.ownerName ?? null,
    tags: input.tags ?? [],
    roadmap_bucket: input.roadmapBucket ?? null,
    ordering,
    created_by: options?.createdBy ?? null,
    ready_for_review: input.readyForReview ?? false,
    review_rejected: input.reviewRejected ?? false,
  };

  const { data, error } = await supabase
    .from('agile_issues')
    .insert(payload)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return mapIssueRow(data as IssueRow);
}

export async function updateAgileIssue(id: string, input: Partial<AgileIssueInput>) {
  const payload: Record<string, unknown> = {};
  if (input.title !== undefined) payload.title = input.title;
  if (input.description !== undefined) payload.description = input.description ?? null;
  if (input.statusId !== undefined) payload.status_id = input.statusId ?? null;
  if (input.priority !== undefined) payload.priority = input.priority ?? 'normal';
  if (input.deadlineDate !== undefined) payload.deadline_date = input.deadlineDate ?? null;
  if (input.estimate !== undefined) payload.estimate = input.estimate ?? null;
  if (input.ownerId !== undefined) payload.owner_id = input.ownerId ?? null;
  if (input.ownerName !== undefined) payload.owner_name = input.ownerName ?? null;
  if (input.tags !== undefined) payload.tags = input.tags ?? [];
  if (input.roadmapBucket !== undefined) payload.roadmap_bucket = input.roadmapBucket ?? null;
  if (input.readyForReview !== undefined) payload.ready_for_review = input.readyForReview;
  if (input.reviewRejected !== undefined) payload.review_rejected = input.reviewRejected;

  const { data, error } = await supabase
    .from('agile_issues')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return mapIssueRow(data as IssueRow);
}

export async function updateIssueOrdering(updates: Array<{ id: string; statusId: string | null; ordering: number }>) {
  if (!updates.length) return;
  const tasks = updates.map((update) =>
    supabase
      .from('agile_issues')
      .update({ status_id: update.statusId, ordering: update.ordering })
      .eq('id', update.id)
  );
  const results = await Promise.all(tasks);
  const firstError = results.find((res) => res.error)?.error;
  if (firstError) {
    throw new Error(firstError.message);
  }
}

export async function deleteAgileIssue(id: string) {
  const { error } = await supabase.from('agile_issues').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function fetchAgileOwners(): Promise<Array<{ id: string; name: string }>> {
  const { data, error } = await supabase.from('users').select('id, full_name');
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: (row as { id: string }).id,
    name: (row as { full_name: string | null }).full_name ?? 'Unknown',
  }));
}

export function summarizePointsByStatus(issues: AgileIssue[]) {
  return issues.reduce<Record<string, number>>((acc, issue) => {
    if (!issue.statusId) return acc;
    const value = toNumber(issue.estimate) ?? 0;
    acc[issue.statusId] = (acc[issue.statusId] ?? 0) + value;
    return acc;
  }, {});
}


