// CRM Frontend API Layer
// All backend API calls are centralized here

const API_BASE = '/api';

// ─── Types ───────────────────────────────────────────────────

export interface SalesData {
  PY?: number;
  PY_YTD?: number;
  CY_YTD?: number;
  CY_P8?: number;
}

export interface KeyPerson {
  id?: number;
  name: string;
  role: string;
  tag?: string;
  tagCls?: string;
  stars: number;
  phone?: string;
  email?: string;
}

export interface PipelineItem {
  id?: number;
  name: string;
  stage?: string;
  amount?: string;
  pipeStage: number;
  note?: string;
  lost?: boolean;
  lostReason?: string;
  lostAt?: string;
  won?: boolean;
  wonAt?: string;
  expectedCloseDate?: string;
  statusDescription?: string;
  customerName?: string;
  customerColor?: string;
  customerId?: string;
}

export interface NextAction {
  action: string;
  deadline: string;
}

export interface TalkPoint {
  id?: number;
  title: string;
  color: string;
  bg: string;
  text: string;
}

export interface Customer {
  id: string;
  name: string;
  color: 'red' | 'orange' | 'green' | 'gray';
  industry: string;
  revenue: string;
  nextYear?: string;
  comp?: string;
  lastVisit?: string;
  salesData: SalesData;
  keyPersons: KeyPerson[];
  pipeline: PipelineItem[];
  nextActions: NextAction[];
  aiCoach?: string;
  risk?: string;
  talkStrategy?: string;
  talkPoints?: TalkPoint[];
  isGroup?: boolean;
  subCustomers?: { id?: number; name: string; tag: string }[];
}

export interface Todo {
  id: number;
  text: string;
  customerId?: string;
  deadline?: string;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
}

export interface Note {
  id: number;
  customerId: string;
  customerName?: string;
  content: string;
  createdAt: string;
}

export interface PipelineStageSummary {
  num: number;
  name: string;
  color: string;
  count: number;
  items: PipelineItem[];
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
}

// ─── Fetch Helper ────────────────────────────────────────────

async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// ─── Customers API ───────────────────────────────────────────

export async function getCustomers(params?: { search?: string; sort?: string }) {
  const qs = new URLSearchParams();
  if (params?.search) qs.set('search', params.search);
  if (params?.sort) qs.set('sort', params.sort);
  const query = qs.toString();
  return fetchApi<ApiResponse<Customer[]>>(`/customers${query ? `?${query}` : ''}`);
}

export async function getCustomer(id: string) {
  return fetchApi<ApiResponse<Customer>>(`/customers/${id}`);
}

export async function createCustomer(data: Partial<Customer>) {
  return fetchApi<ApiResponse<Customer>>('/customers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCustomer(id: string, data: Partial<Customer>) {
  return fetchApi<ApiResponse<Customer>>(`/customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteCustomer(id: string) {
  return fetchApi<{ success: boolean }>(`/customers/${id}`, {
    method: 'DELETE',
  });
}

// ─── Contact API ─────────────────────────────────────────────

export async function addContact(customerId: string, data: { name: string; role?: string; phone?: string; email?: string; stars?: number; tag?: string }) {
  return fetchApi<ApiResponse<KeyPerson>>(`/customers/${customerId}/contacts`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateContact(customerId: string, contactId: number, data: Partial<{ name: string; role: string; phone: string; email: string; stars: number; tag: string }>) {
  return fetchApi<ApiResponse<KeyPerson>>(`/customers/${customerId}/contacts/${contactId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteContact(customerId: string, contactId: number) {
  return fetchApi<{ success: boolean }>(`/customers/${customerId}/contacts/${contactId}`, {
    method: 'DELETE',
  });
}

// ─── Pipeline API ────────────────────────────────────────────

export async function getPipelineSummary(includeLost?: boolean) {
  const qs = includeLost ? '?includeLost=true' : '';
  return fetchApi<ApiResponse<PipelineStageSummary[]>>(`/pipeline${qs}`);
}

export async function getLostPipelineItems() {
  return fetchApi<ApiResponse<PipelineItem[]>>('/pipeline/lost');
}

export async function getCustomerPipeline(customerId: string) {
  return fetchApi<ApiResponse<PipelineItem[]>>(`/pipeline/${customerId}`);
}

export async function createPipelineItem(data: {
  customerId: string; name: string; stage?: string; amount?: string; pipeStage?: number; note?: string;
  expectedCloseDate?: string; statusDescription?: string;
}) {
  return fetchApi<ApiResponse<PipelineItem>>('/pipeline', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updatePipelineItem(id: number, data: {
  name?: string; stage?: string; amount?: string; pipeStage?: number; note?: string;
  expectedCloseDate?: string; statusDescription?: string; lostReason?: string;
}) {
  return fetchApi<ApiResponse<PipelineItem>>(`/pipeline/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function updatePipelineStage(id: number, stage: number) {
  return fetchApi<ApiResponse<PipelineItem>>(`/pipeline/${id}/stage`, {
    method: 'PUT',
    body: JSON.stringify({ stage }),
  });
}

export async function markPipelineLost(id: number, reason?: string) {
  return fetchApi<ApiResponse<PipelineItem>>(`/pipeline/${id}/lost`, {
    method: 'PUT',
    body: JSON.stringify({ reason }),
  });
}

export async function markPipelineWin(id: number) {
  return fetchApi<ApiResponse<PipelineItem>>(`/pipeline/${id}/win`, {
    method: 'PUT',
  });
}

export async function getWonPipelineItems() {
  return fetchApi<ApiResponse<PipelineItem[]>>('/pipeline/won');
}

export async function restorePipeline(id: number) {
  return fetchApi<ApiResponse<PipelineItem>>(`/pipeline/${id}/restore`, {
    method: 'PUT',
  });
}

export async function deletePipelineItem(id: number) {
  return fetchApi<{ success: boolean }>(`/pipeline/${id}`, {
    method: 'DELETE',
  });
}

// ─── Todos API ───────────────────────────────────────────────

export async function getTodos(params?: { status?: 'pending' | 'completed' | 'all'; customerId?: string }) {
  const qs = new URLSearchParams();
  if (params?.status && params.status !== 'all') qs.set('status', params.status);
  if (params?.customerId) qs.set('customerId', params.customerId);
  const query = qs.toString();
  return fetchApi<ApiResponse<Todo[]>>(`/todos${query ? `?${query}` : ''}`);
}

export async function createTodo(data: { text: string; customerId?: string; deadline?: string }) {
  return fetchApi<ApiResponse<Todo>>('/todos', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTodo(id: number, data: { completed?: boolean; text?: string; deadline?: string; customerId?: string }) {
  return fetchApi<ApiResponse<Todo>>(`/todos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteTodo(id: number) {
  return fetchApi<{ success: boolean }>(`/todos/${id}`, {
    method: 'DELETE',
  });
}

// ─── Notes API ───────────────────────────────────────────────

export async function getNotes(customerId?: string) {
  const qs = customerId ? `?customerId=${customerId}` : '';
  return fetchApi<ApiResponse<Note[]>>(`/notes${qs}`);
}

export async function createNote(data: { customerId: string; content: string }) {
  return fetchApi<ApiResponse<Note>>('/notes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteNote(id: number) {
  return fetchApi<{ success: boolean }>(`/notes/${id}`, {
    method: 'DELETE',
  });
}

// ─── Invest Items API ─────────────────────────────────────────

export interface InvestItem {
  id: number;
  key: string;
  name: string;
  customerId?: string;
  customerName?: string;
  createdAt: string;
}

export async function getInvestItems() {
  return fetchApi<ApiResponse<InvestItem[]>>('/invest-items');
}

export async function createInvestItem(data: { name: string; key?: string; customerId?: string }) {
  return fetchApi<ApiResponse<InvestItem>>('/invest-items', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateInvestItem(key: string, data: { name?: string; customerId?: string }) {
  return fetchApi<ApiResponse<InvestItem>>(`/invest-items/${key}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteInvestItem(key: string) {
  return fetchApi<{ success: boolean }>(`/invest-items/${key}`, {
    method: 'DELETE',
  });
}

// ─── Weekly API ─────────────────────────────────────────────

export interface WeeklyFocus {
  id: number;
  text: string;
  sortOrder: number;
}

export interface WeeklyAction {
  id: number;
  text: string;
  completed: boolean;
  sortOrder: number;
}

export interface WeeklyDailyNote {
  id: number;
  dayKey: string;
  content: string;
}

export interface WeeklyReport {
  id: number;
  weekId: string;
  label: string;
  isCurrent: boolean;
  createdAt: string;
  focuses: WeeklyFocus[];
  actions: WeeklyAction[];
  dailyNotes: WeeklyDailyNote[];
}

export async function getWeeklyReports() {
  return fetchApi<ApiResponse<WeeklyReport[]>>('/weekly');
}

export async function createWeeklyReport(data: { weekId: string; label?: string }) {
  return fetchApi<ApiResponse<WeeklyReport>>('/weekly', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateWeeklyFocuses(weekId: string, focuses: string[]) {
  return fetchApi<ApiResponse<WeeklyFocus[]>>(`/weekly/${weekId}/focuses`, {
    method: 'PUT',
    body: JSON.stringify({ focuses }),
  });
}

export async function updateWeeklyDailyNote(weekId: string, dayKey: string, content: string) {
  return fetchApi<ApiResponse<WeeklyDailyNote>>(`/weekly/${weekId}/daily-notes`, {
    method: 'PUT',
    body: JSON.stringify({ dayKey, content }),
  });
}

export async function addWeeklyAction(weekId: string, text: string) {
  return fetchApi<ApiResponse<WeeklyAction>>(`/weekly/${weekId}/actions`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

export async function updateWeeklyAction(weekId: string, actionId: number, data: { completed?: boolean; text?: string }) {
  return fetchApi<ApiResponse<WeeklyAction>>(`/weekly/${weekId}/actions/${actionId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteWeeklyAction(weekId: string, actionId: number) {
  return fetchApi<{ success: boolean }>(`/weekly/${weekId}/actions/${actionId}`, {
    method: 'DELETE',
  });
}

export async function updateWeeklyLabel(weekId: string, label: string) {
  return fetchApi<{ success: boolean }>(`/weekly/${weekId}/label`, {
    method: 'PUT',
    body: JSON.stringify({ label }),
  });
}

// ─── Health Check ────────────────────────────────────────────

export async function getHealth() {
  return fetchApi<{
    status: string;
    version: string;
    customers: number;
    todos: number;
    pipeline: number;
    memories: number;
    timestamp: string;
  }>('/health');
}

// ─── Memories API ─────────────────────────────────────────────

export interface Memory {
  id: number;
  customerId: string | null;
  customerName: string | null;
  memoryType: string;
  title: string;
  content: string;
  summary: string | null;
  importance: number;
  confidence: number;
  sourceKind: string | null;
  sourceFile: string | null;
  sourcePath: string | null;
  sourceAnchor: string | null;
  sourceTable: string | null;
  sourceId: string | null;
  occurredAt: string | null;
  tags: string[] | string | null;
  metadataJson: Record<string, any> | string | null;
  checksum: string | null;
  isArchived: boolean;
  reviewStatus: 'pending' | 'linked' | 'no_customer' | 'archived';
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MemoryStats {
  totalActive: number;
  totalArchived: number;
  byType: { memory_type: string; count: number }[];
  bySource: { source_kind: string; count: number }[];
  linkedCount: number;
  unlinkedCount: number;
  sourceFileCount: number;
  importJobCount: number;
  highRisk: number;
  highImportance: number;
  byReviewStatus: { review_status: string; count: number }[];
}

export async function getMemories(params?: {
  customerId?: string;
  memoryType?: string;
  sourceKind?: string;
  keyword?: string;
  limit?: number;
  offset?: number;
  includeArchived?: boolean;
}) {
  const qs = new URLSearchParams();
  if (params?.customerId) qs.set('customerId', params.customerId);
  if (params?.memoryType) qs.set('memoryType', params.memoryType);
  if (params?.sourceKind) qs.set('sourceKind', params.sourceKind);
  if (params?.keyword) qs.set('keyword', params.keyword);
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.offset) qs.set('offset', String(params.offset));
  if (params?.includeArchived) qs.set('includeArchived', 'true');
  const query = qs.toString();
  return fetchApi<{ data: Memory[]; total: number; limit: number; offset: number }>(`/memories${query ? `?${query}` : ''}`);
}

export async function getMemoryStats() {
  return fetchApi<ApiResponse<MemoryStats>>('/memories/stats/summary');
}

export async function archiveMemory(id: number) {
  return fetchApi<{ success: boolean }>(`/memories/${id}`, {
    method: 'DELETE',
  });
}

// ─── V26.07.01 Memory Review API ────────────────────────────

export async function getUnlinkedMemories(params?: {
  keyword?: string;
  memoryType?: string;
  sourceFile?: string;
  sourceKind?: string;
  reviewStatus?: string;
  limit?: number;
  offset?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.keyword) qs.set('keyword', params.keyword);
  if (params?.memoryType) qs.set('memoryType', params.memoryType);
  if (params?.sourceFile) qs.set('sourceFile', params.sourceFile);
  if (params?.sourceKind) qs.set('sourceKind', params.sourceKind);
  if (params?.reviewStatus) qs.set('reviewStatus', params.reviewStatus);
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.offset) qs.set('offset', String(params.offset));
  const query = qs.toString();
  return fetchApi<{ data: Memory[]; pagination: { limit: number; offset: number; total: number } }>(
    `/memories/unlinked${query ? `?${query}` : ''}`
  );
}

export async function linkMemoryToCustomer(id: number, customerId: string, reason?: string) {
  return fetchApi<{ data: Memory }>(`/memories/${id}/link-customer`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerId, reason }),
  });
}

export async function markMemoryUnlinkedReviewed(id: number, reason?: string) {
  return fetchApi<{ data: Memory }>(`/memories/${id}/mark-unlinked-reviewed`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
}

export async function archiveMemoryWithReason(id: number, reason?: string) {
  return fetchApi<{ success: boolean }>(`/memories/${id}/archive`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
}

export async function batchMemoryOperation(
  ids: number[],
  action: 'link_customer' | 'mark_unlinked_reviewed' | 'archive',
  customerId?: string,
  reason?: string
) {
  return fetchApi<{ data: { success: number; failed: number } }>('/memories/batch', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids, action, customerId, reason }),
  });
}

// ─── Customer Context API ─────────────────────────────────────

export interface CustomerContext {
  customer: Record<string, any>;
  contacts: any[];
  pipeline: { active: any[]; lost: any[]; won: any[] };
  todos: { pending: any[]; completedRecent: any[] };
  notes: any[];
  weekly: any[];
  memories: Record<string, Memory[]>;
  contextMeta: { memoryCount: number; lastUpdatedAt: string; generatedAt: string };
}

export async function getCustomerContext(customerId: string) {
  return fetchApi<{ data: CustomerContext }>(`/customers/${customerId}/context`);
}
