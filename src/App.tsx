import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users, GitBranch, Swords, Activity, Bot, FileText,
  Zap, Sun, Moon, Search, X, ChevronDown, ChevronRight,
  Target, AlertTriangle, Star, BarChart3,
  CheckSquare, Square, Megaphone, Shield, ArrowUpCircle,
  Clock, Calendar, Menu, Plus, Trash2, Loader2, RefreshCw, Edit3,
  Brain, Database, Filter, ClipboardCheck, Link2, Archive, Copy, Layers, Network, Zap as ZapIcon,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  PIPE_STAGES, COMPETITOR_INTEL, FY_TARGET,
  COACH_SCENARIOS, INVESTMENT_ITEMS, INVESTMENT_DIMS,
} from '@/lib/data'
import * as api from '@/lib/api'
import type { Customer, KeyPerson, Todo as TodoItem, PipelineStageSummary, Memory, MemoryStats, MemoryPoolSummary, MemoryTypeDef } from '@/lib/api'
import { getUnlinkedMemories, linkMemoryToCustomer, markMemoryUnlinkedReviewed, archiveMemoryWithReason, batchMemoryOperation, getMemoryStats, getContextPools, getContextTypes } from '@/lib/api'
import { cn, fmtK, daysSince, colorHex, priorityLabel } from '@/lib/utils'
import { Button } from '@/components/ui/button'

// ─── Data Fetching Hook ──────────────────────────────────────
function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const reload = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await api.getCustomers()
      setCustomers(res.data)
    } catch (e: any) {
      setError(e.message)
    } finally { setLoading(false) }
  }, [])
  useEffect(() => { reload() }, [reload])
  return { customers, loading, error, reload, setCustomers }
}

function useTodos() {
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [loading, setLoading] = useState(true)
  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.getTodos({ status: 'all' })
      setTodos(res.data)
    } catch { /* ignore */ } finally { setLoading(false) }
  }, [])
  useEffect(() => { reload() }, [reload])
  return { todos, loading, reload, setTodos }
}

function usePipeline() {
  const [stages, setStages] = useState<PipelineStageSummary[]>([])
  const [loading, setLoading] = useState(true)
  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.getPipelineSummary()
      setStages(res.data)
    } catch { /* ignore */ } finally { setLoading(false) }
  }, [])
  useEffect(() => { reload() }, [reload])
  return { stages, loading, reload }
}

// ─── Loading / Error wrapper ─────────────────────────────────
function DataState({ loading, error, onRetry, children, ...qoderProps }: {
  loading: boolean; error: string | null; onRetry: () => void; children: React.ReactNode
} & Record<string, any>) {
  if (loading) return (
    <div style={{ ...({ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80, gap: 12, color: 'var(--fg-tertiary)' }), ...((qoderProps as any)?.style) }} className={(qoderProps as any)?.className} data-qoder-id={(qoderProps as any)?.["data-qoder-id"]} data-qoder-source={(qoderProps as any)?.["data-qoder-source"]}>
      <Loader2 size={20} className="animate-spin"  data-qoder-id="qel-animate-spin-536fe491" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-animate-spin-536fe491&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DataState&quot;,&quot;elementRole&quot;:&quot;animate-spin&quot;,&quot;loc&quot;:{&quot;line&quot;:75,&quot;column&quot;:7}}"/> <span data-qoder-id="qel-span-b9bbca8d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-b9bbca8d&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DataState&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:75,&quot;column&quot;:54}}">加载中...</span>
    </div>
  )
  if (error) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 80, gap: 12 }} data-qoder-id="qel-div-8bf410e4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-8bf410e4&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DataState&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:79,&quot;column&quot;:5}}">
      <AlertTriangle size={24} style={{ color: 'var(--status-danger)' }}  data-qoder-id="qel-alerttriangle-10e0d7af" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-alerttriangle-10e0d7af&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DataState&quot;,&quot;elementRole&quot;:&quot;alerttriangle&quot;,&quot;loc&quot;:{&quot;line&quot;:80,&quot;column&quot;:7}}"/>
      <span style={{ color: 'var(--fg-secondary)' }} data-qoder-id="qel-span-b4bbc2ae" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-b4bbc2ae&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DataState&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:81,&quot;column&quot;:7}}">加载失败: {error}</span>
      <Button variant="outline" size="sm" onClick={onRetry} data-qoder-id="qel-button-f4c19bf1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-f4c19bf1&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DataState&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:82,&quot;column&quot;:7}}"><RefreshCw size={14}  data-qoder-id="qel-refreshcw-e2b289a0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-refreshcw-e2b289a0&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DataState&quot;,&quot;elementRole&quot;:&quot;refreshcw&quot;,&quot;loc&quot;:{&quot;line&quot;:82,&quot;column&quot;:61}}"/> 重试</Button>
    </div>
  )
  return <>{children}</>
}

// ─── Empty State ────────────────────────────────────────────
function EmptyState({ icon, message, hint, ...qoderProps }: { icon?: React.ReactNode; message: string; hint?: string } & Record<string, any>) {
  return (
    <div style={{ ...({ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: 12 }), ...((qoderProps as any)?.style) }} className={(qoderProps as any)?.className} data-qoder-id={(qoderProps as any)?.["data-qoder-id"]} data-qoder-source={(qoderProps as any)?.["data-qoder-source"]}>
      <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-muted)' }} data-qoder-id="qel-div-7bfb8a82" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-7bfb8a82&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;EmptyState&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:92,&quot;column&quot;:7}}">
        {icon || <FileText size={20}  data-qoder-id="qel-filetext-2cc5a0df" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-filetext-2cc5a0df&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;EmptyState&quot;,&quot;elementRole&quot;:&quot;filetext&quot;,&quot;loc&quot;:{&quot;line&quot;:93,&quot;column&quot;:18}}"/>}
      </div>
      <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--fg-secondary)' }} data-qoder-id="qel-span-e0dca2e8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-e0dca2e8&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;EmptyState&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:95,&quot;column&quot;:7}}">{message}</span>
      {hint && <span style={{ fontSize: 12, color: 'var(--fg-tertiary)' }} data-qoder-id="qel-span-e1dca47b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-e1dca47b&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;EmptyState&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:96,&quot;column&quot;:16}}">{hint}</span>}
    </div>
  )
}

type TabId = 'dashboard' | 'customers' | 'pipeline' | 'competitive' | 'energy' | 'coach' | 'weekly' | 'review' | 'aihub'

const NAV_ITEMS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: '仪表盘', icon: <LayoutDashboard size={18}  data-qoder-id="qel-layoutdashboard-2eed58a0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-layoutdashboard-2eed58a0&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;layoutdashboard&quot;,&quot;loc&quot;:{&quot;line&quot;:24,&quot;column&quot;:42}}"/> },
  { id: 'customers', label: '客户管理', icon: <Users size={18}  data-qoder-id="qel-users-3ac6a549" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-users-3ac6a549&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;users&quot;,&quot;loc&quot;:{&quot;line&quot;:25,&quot;column&quot;:43}}"/> },
  { id: 'pipeline', label: 'Pipeline 汇总', icon: <GitBranch size={18}  data-qoder-id="qel-gitbranch-6c16aae6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-gitbranch-6c16aae6&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;gitbranch&quot;,&quot;loc&quot;:{&quot;line&quot;:26,&quot;column&quot;:42}}"/> },
  { id: 'competitive', label: '竞品分析', icon: <Swords size={18}  data-qoder-id="qel-swords-169f8ddf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-swords-169f8ddf&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;swords&quot;,&quot;loc&quot;:{&quot;line&quot;:27,&quot;column&quot;:45}}"/> },
  { id: 'energy', label: '精力分配', icon: <Activity size={18}  data-qoder-id="qel-activity-1de6a06e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-activity-1de6a06e&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;activity&quot;,&quot;loc&quot;:{&quot;line&quot;:28,&quot;column&quot;:40}}"/> },
  { id: 'coach', label: 'AI 教练', icon: <Bot size={18}  data-qoder-id="qel-bot-34694d61" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-bot-34694d61&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;bot&quot;,&quot;loc&quot;:{&quot;line&quot;:29,&quot;column&quot;:40}}"/> },
  { id: 'weekly', label: '周报', icon: <FileText size={18}  data-qoder-id="qel-filetext-b5c82248" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-filetext-b5c82248&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;filetext&quot;,&quot;loc&quot;:{&quot;line&quot;:30,&quot;column&quot;:38}}"/> },
  { id: 'review', label: 'AI记忆审核', icon: <ClipboardCheck size={18} /> },
  { id: 'aihub', label: 'AI 中枢', icon: <Brain size={18} /> },
]

/* ─────────────────────── MemoryReviewPage (V26.06.07) ──────── */
const MEMORY_TYPES = ['archive_raw','project','customer_profile','meeting','strategy','relationship','competitor','weekly','risk','decision','todo_context','sales_data'];
const REVIEW_STATUSES = ['pending','linked','no_customer','archived'];

function MemoryReviewPage({ customers }: { customers: Customer[] }) {
  const [stats, setStats] = useState<any>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending');
  const [filterSource, setFilterSource] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [linkModal, setLinkModal] = useState<Memory | null>(null);
  const [noteModal, setNoteModal] = useState<{ id: number; action: 'mark' | 'archive' } | null>(null);
  const [noteText, setNoteText] = useState('');
  const [linkCustomer, setLinkCustomer] = useState('');
  const [linkNote, setLinkNote] = useState('');
  const [offset, setOffset] = useState(0);
  const [toast, setToast] = useState('');
  const LIMIT = 30;

  const loadData = useCallback(async (reset = false) => {
    setLoading(true);
    try {
      const newOffset = reset ? 0 : offset;
      if (reset) setOffset(0);
      const [memRes, statsRes] = await Promise.all([
        getUnlinkedMemories({
          keyword: keyword || undefined,
          memoryType: filterType || undefined,
          sourceFile: filterSource || undefined,
          reviewStatus: filterStatus || undefined,
          limit: LIMIT,
          offset: newOffset,
        }),
        getMemoryStats(),
      ]);
      setMemories(memRes.data);
      setTotal(memRes.pagination.total);
      setStats(statsRes.data);
    } catch (e) {
      console.error('Load error:', e);
    }
    setLoading(false);
  }, [keyword, filterType, filterStatus, filterSource, offset]);

  useEffect(() => { loadData(true); }, [keyword, filterType, filterStatus, filterSource]);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(''), 2500); return () => clearTimeout(t); } }, [toast]);

  const toggleSelect = (id: number) => {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const selectAll = () => {
    if (selected.size === memories.length) setSelected(new Set());
    else setSelected(new Set(memories.map(m => m.id)));
  };

  const doLink = async () => {
    if (!linkModal || !linkCustomer) return;
    await linkMemoryToCustomer(linkModal.id, linkCustomer, linkNote || undefined);
    setToast(`已关联到客户`);
    setLinkModal(null); setLinkCustomer(''); setLinkNote('');
    loadData(true);
  };

  const doNote = async () => {
    if (!noteModal) return;
    if (noteModal.action === 'mark') {
      await markMemoryUnlinkedReviewed(noteModal.id, noteText || undefined);
      setToast('已标记无需关联');
    } else {
      await archiveMemoryWithReason(noteModal.id, noteText || undefined);
      setToast('已归档');
    }
    setNoteModal(null); setNoteText('');
    loadData(true);
  };

  const doBatch = async (action: 'link_customer' | 'mark_unlinked_reviewed' | 'archive') => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    if (action === 'link_customer') {
      // Use first selected to open link modal for batch
      setLinkModal(memories.find(m => m.id === ids[0]) || null);
      return;
    }
    await batchMemoryOperation(ids, action, undefined, '批量操作');
    setToast(`批量${action === 'archive' ? '归档' : '标记'}: ${ids.length} 条`);
    setSelected(new Set());
    loadData(true);
  };

  const doBatchLink = async () => {
    if (!linkCustomer) return;
    const ids = Array.from(selected);
    await batchMemoryOperation(ids, 'link_customer', linkCustomer, linkNote || undefined);
    setToast(`批量关联: ${ids.length} 条`);
    setLinkModal(null); setLinkCustomer(''); setLinkNote(''); setSelected(new Set());
    loadData(true);
  };

  const loadMore = () => { setOffset(prev => prev + LIMIT); setTimeout(() => loadData(), 0); };

  const reviewCounts = useMemo(() => {
    if (!stats?.byReviewStatus) return { pending: 0, linked: 0, no_customer: 0, archived: 0 };
    const map: Record<string, number> = {};
    stats.byReviewStatus.forEach((r: any) => { map[r.review_status] = r.count; });
    return { pending: map.pending || 0, linked: map.linked || 0, no_customer: map.no_customer || 0, archived: map.archived || 0 };
  }, [stats]);

  const copyContent = (text: string) => { navigator.clipboard.writeText(text); setToast('已复制'); };

  return (
    <div className="page-container" style={{ maxWidth: 960 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>AI 记忆审核</h1>
          <p style={{ fontSize: 13, color: 'var(--fg-tertiary)', margin: '4px 0 0' }}>
            审核未关联客户的历史资料记忆，关联到正确客户或归档
          </p>
        </div>
        <button className="btn btn-secondary" onClick={() => loadData(true)} style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
          <RefreshCw size={14} /> 刷新
        </button>
      </div>

      {/* Stats Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { label: '总记忆', value: stats?.totalActive ?? '-', color: 'var(--accent)' },
          { label: '已关联', value: reviewCounts.linked, color: 'var(--success)' },
          { label: '待审核', value: reviewCounts.pending, color: 'var(--warning)' },
          { label: '无需关联', value: reviewCounts.no_customer, color: 'var(--fg-tertiary)' },
          { label: '已归档', value: reviewCounts.archived, color: 'var(--fg-tertiary)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '12px 14px', borderLeft: `3px solid ${s.color}` }}>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--fg-tertiary)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '10px 14px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-tertiary)' }} />
          <input
            type="text" placeholder="搜索关键词..."
            value={keyword} onChange={e => setKeyword(e.target.value)}
            style={{ width: '100%', padding: '6px 10px 6px 30px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-card)', fontSize: 13 }}
          />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-card)', fontSize: 12, minWidth: 120 }}>
          <option value="">全部类型</option>
          {MEMORY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-card)', fontSize: 12, minWidth: 110 }}>
          <option value="">全部状态</option>
          {REVIEW_STATUSES.map(s => <option key={s} value={s}>{s === 'pending' ? '待审核' : s === 'linked' ? '已关联' : s === 'no_customer' ? '无需关联' : '已归档'}</option>)}
        </select>
        <select value={filterSource} onChange={e => setFilterSource(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-card)', fontSize: 12, minWidth: 110 }}>
          <option value="">全部来源</option>
          <option value="markdown">Markdown</option>
          <option value="xlsx">Excel</option>
          <option value="database">数据库种子</option>
        </select>
        <span style={{ fontSize: 12, color: 'var(--fg-tertiary)', whiteSpace: 'nowrap' }}>共 {total} 条</span>
      </div>

      {/* Batch Actions */}
      {selected.size > 0 && (
        <div className="card" style={{ padding: '10px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10, background: 'var(--accent-bg, rgba(0,153,153,0.06))' }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>已选 {selected.size} 条</span>
          <button className="btn btn-primary" onClick={() => doBatch('link_customer')} style={{ fontSize: 12, padding: '4px 10px' }}>
            <Link2 size={13} /> 批量关联
          </button>
          <button className="btn btn-secondary" onClick={() => doBatch('mark_unlinked_reviewed')} style={{ fontSize: 12, padding: '4px 10px' }}>
            <CheckSquare size={13} /> 批量标记无需关联
          </button>
          <button className="btn btn-secondary" onClick={() => doBatch('archive')} style={{ fontSize: 12, padding: '4px 10px', color: 'var(--danger)' }}>
            <Archive size={13} /> 批量归档
          </button>
          <button className="btn btn-secondary" onClick={() => setSelected(new Set())} style={{ fontSize: 12, padding: '4px 10px' }}>
            取消选择
          </button>
        </div>
      )}

      {/* Memory List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--fg-tertiary)' }}><Loader2 size={24} className="spin" /> 加载中...</div>
      ) : memories.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <CheckSquare size={32} style={{ color: 'var(--success)', marginBottom: 8 }} />
          <div style={{ fontSize: 15, fontWeight: 600 }}>暂无待审核记忆</div>
          <div style={{ fontSize: 13, color: 'var(--fg-tertiary)', marginTop: 4 }}>所有记忆已审核完毕</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Select all */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--fg-tertiary)', padding: '0 4px' }}>
            <input type="checkbox" checked={selected.size === memories.length && memories.length > 0} onChange={selectAll} />
            <span>全选当前页</span>
          </div>

          {memories.map(mem => (
            <div key={mem.id} className="card" style={{ padding: '12px 14px', borderLeft: `3px solid ${selected.has(mem.id) ? 'var(--accent)' : 'var(--border)'}` }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  type="checkbox"
                  checked={selected.has(mem.id)}
                  onChange={() => toggleSelect(mem.id)}
                  style={{ marginTop: 4, cursor: 'pointer' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 400 }}>{mem.title}</span>
                    <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: 'var(--bg-secondary)', color: 'var(--fg-secondary)', whiteSpace: 'nowrap' }}>{mem.memoryType}</span>
                    <span style={{ fontSize: 10, color: 'var(--fg-tertiary)' }}>★{mem.importance}</span>
                    {mem.customerName && (
                      <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: 'var(--success-bg, rgba(39,174,96,0.1))', color: 'var(--success)' }}>{mem.customerName}</span>
                    )}
                  </div>
                  {/* Content preview */}
                  <div style={{ fontSize: 12, color: 'var(--fg-secondary)', lineHeight: 1.5, maxHeight: 60, overflow: 'hidden', marginBottom: 6 }}>
                    {mem.content.length > 200 ? mem.content.slice(0, 200) + '...' : mem.content}
                  </div>
                  {/* Meta */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: 'var(--fg-tertiary)', flexWrap: 'wrap' }}>
                    {mem.sourceFile && <span>来源: {mem.sourceFile.length > 30 ? '...' + mem.sourceFile.slice(-30) : mem.sourceFile}</span>}
                    <span>{mem.createdAt?.slice(0, 10)}</span>
                    {mem.reviewNote && <span style={{ fontStyle: 'italic' }}>备注: {mem.reviewNote}</span>}
                  </div>
                </div>
                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                  <button className="btn btn-primary" onClick={() => { setLinkModal(mem); setLinkCustomer(''); setLinkNote(''); }} style={{ fontSize: 11, padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 3 }} title="关联客户">
                    <Link2 size={12} /> 关联
                  </button>
                  <button className="btn btn-secondary" onClick={() => { setNoteModal({ id: mem.id, action: 'mark' }); setNoteText(''); }} style={{ fontSize: 11, padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 3 }} title="标记无需关联">
                    <CheckSquare size={12} /> 标记
                  </button>
                  <button className="btn btn-secondary" onClick={() => { setNoteModal({ id: mem.id, action: 'archive' }); setNoteText(''); }} style={{ fontSize: 11, padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 3, color: 'var(--danger)' }} title="归档">
                    <Archive size={12} /> 归档
                  </button>
                  <button className="btn btn-secondary" onClick={() => copyContent(mem.content)} style={{ fontSize: 11, padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 3 }} title="复制内容">
                    <Copy size={12} /> 复制
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Load more */}
          {offset + LIMIT < total && (
            <button className="btn btn-secondary" onClick={loadMore} style={{ margin: '8px auto', fontSize: 13 }}>
              加载更多 ({total - offset - LIMIT} 条剩余)
            </button>
          )}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 20px', fontSize: 13, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 9999 }}>
          {toast}
        </div>
      )}

      {/* Link Customer Modal */}
      {linkModal && (
        <div className="modal-overlay" onClick={() => setLinkModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
          <div className="card" onClick={e => e.stopPropagation()} style={{ width: 420, padding: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 0, marginBottom: 12 }}>
              {selected.size > 1 ? `批量关联客户 (${selected.size} 条)` : '关联客户'}
            </h3>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: 'var(--fg-tertiary)', display: 'block', marginBottom: 4 }}>选择客户</label>
              <select value={linkCustomer} onChange={e => setLinkCustomer(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-card)', fontSize: 13 }}>
                <option value="">-- 请选择 --</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: 'var(--fg-tertiary)', display: 'block', marginBottom: 4 }}>审核备注（可选）</label>
              <textarea value={linkNote} onChange={e => setLinkNote(e.target.value)} placeholder="说明关联原因..." style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-card)', fontSize: 13, minHeight: 60, resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setLinkModal(null)}>取消</button>
              <button className="btn btn-primary" onClick={selected.size > 1 ? doBatchLink : doLink} disabled={!linkCustomer}>
                {selected.size > 1 ? '批量关联' : '关联'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Note Modal */}
      {noteModal && (
        <div className="modal-overlay" onClick={() => setNoteModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
          <div className="card" onClick={e => e.stopPropagation()} style={{ width: 400, padding: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 0, marginBottom: 12 }}>
              {noteModal.action === 'mark' ? '标记无需关联' : '归档记忆'}
            </h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: 'var(--fg-tertiary)', display: 'block', marginBottom: 4 }}>审核备注（可选）</label>
              <textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder={noteModal.action === 'mark' ? '说明无需关联的原因...' : '说明归档原因...'} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-card)', fontSize: 13, minHeight: 60, resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setNoteModal(null)}>取消</button>
              <button className="btn btn-primary" onClick={doNote} style={noteModal.action === 'archive' ? { color: 'var(--danger)' } : {}}>
                {noteModal.action === 'mark' ? '确认标记' : '确认归档'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────── AIHubPage (V26.06.10) ────────── */

const DOMAIN_COLORS: Record<string, string> = {
  customer: '#009999',
  sales: '#2980B9',
  growth: '#8E44AD',
  ai: '#E67E22',
};

const DOMAIN_ICONS: Record<string, React.ReactNode> = {
  customer: <Users size={14} />,
  sales: <BarChart3 size={14} />,
  growth: <ZapIcon size={14} />,
  ai: <Brain size={14} />,
};

function AIHubPage() {
  const [pools, setPools] = useState<MemoryPoolSummary | null>(null);
  const [types, setTypes] = useState<MemoryTypeDef[]>([]);
  const [domains, setDomains] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [poolsRes, typesRes] = await Promise.all([
          getContextPools(),
          getContextTypes(),
        ]);
        setPools(poolsRes.data);
        setTypes(typesRes.data.types);
        setDomains(typesRes.data.domains);
      } catch (e) {
        console.error('AIHub load error:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80, color: 'var(--fg-tertiary)' }}>
      <Loader2 size={20} className="animate-spin" />
    </div>
  );

  const domainList = Object.entries(domains);

  return (
    <div style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>🧠 AI 中枢</h1>
      <p style={{ fontSize: 13, color: 'var(--fg-tertiary)', marginTop: 4 }}>
        四层记忆架构 · 七阶段演进路线 · AI 接入统一入口
      </p>

      {/* ── 演进路线 ── */}
      <div style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>📋 七阶段演进路线</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
          {[
            { phase: 'Phase 1', label: 'Memory Router', status: '✅ 完成', desc: '智能关键词路由' },
            { phase: 'Phase 2', label: 'Insight Layer', status: '✅ 完成', desc: 'L3+L4 分层框架' },
            { phase: 'Phase 3', label: 'Customer Coach', status: '🔧 框架预留', desc: 'AI 销售教练' },
            { phase: 'Phase 4', label: 'Weekly AI', status: '🔧 框架预留', desc: '周报智能总结' },
            { phase: 'Phase 5', label: 'Strategy Center', status: '🔧 框架预留', desc: '战略规划中心' },
            { phase: 'Phase 6', label: 'AI Provider', status: '🔧 框架预留', desc: '统一 AI 接入' },
            { phase: 'Phase 7', label: 'Multi-Agent', status: '🔧 框架预留', desc: '多 Agent 协同' },
          ].map((p, i) => (
            <div key={i} style={{
              padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-secondary)' }}>{p.phase}</span>
                <span style={{ fontSize: 11, color: 'var(--fg-tertiary)' }}>{p.status}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{p.label}</div>
              <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', marginTop: 2 }}>{p.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 四域记忆池 ── */}
      <div style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>🗂️ 四域记忆池</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
          {domainList.map(([key, domain]) => {
            const poolInfo = pools?.[key];
            return (
              <div key={key} style={{
                padding: 16, borderRadius: 'var(--radius-md)',
                background: `linear-gradient(135deg, ${DOMAIN_COLORS[key] || '#666'}15, var(--bg-elevated))`,
                border: `1px solid ${DOMAIN_COLORS[key] || '#666'}30`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ color: DOMAIN_COLORS[key] || '#666' }}>{DOMAIN_ICONS[key]}</span>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{domain.label}</span>
                  <span style={{
                    fontSize: 10, padding: '1px 6px', borderRadius: 10,
                    background: 'var(--bg-surface)', color: 'var(--fg-tertiary)',
                  }}>{domain.layer}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', marginBottom: 10 }}>
                  {domain.description || ''}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontSize: 28, fontWeight: 700, color: DOMAIN_COLORS[key] || '#666' }}>
                    {poolInfo?.count ?? '-'}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--fg-tertiary)' }}>条记忆</span>
                </div>
                <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {(domain.types || []).map((t: any) => (
                    <span key={t.value} style={{
                      fontSize: 10, padding: '2px 8px', borderRadius: 10,
                      background: 'var(--bg-surface)', color: 'var(--fg-secondary)',
                    }}>{t.label}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 四层架构图 ── */}
      <div style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>🏗️ 四层记忆架构</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { layer: 'L4', name: '战略层', desc: '战略规划、销售哲学（strategy_plan）', color: '#8E44AD', icon: '🏛️' },
            { layer: 'L3', name: '洞察层', desc: 'AI 推断认知：insight · coach · learning · market', color: '#E67E22', icon: '💡' },
            { layer: 'L2', name: '记忆层', desc: '客户域6类 + 销售域5类 = 长期结构化记忆', color: '#2980B9', icon: '🧠' },
            { layer: 'L1', name: '事实层', desc: '业务表原始数据（不可修改 · 系统事实）', color: '#009999', icon: '📊' },
          ].map((l) => (
            <div key={l.layer} style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: 16, borderRadius: 'var(--radius-md)',
              background: `linear-gradient(135deg, ${l.color}10, var(--bg-elevated))`,
              border: `1px solid ${l.color}25`,
            }}>
              <div style={{ fontSize: 28 }}>{l.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{
                    fontSize: 11, padding: '2px 8px', borderRadius: 10,
                    background: l.color + '20', color: l.color, fontWeight: 600,
                  }}>{l.layer}</span>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>{l.name}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--fg-tertiary)' }}>{l.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 统一入口 ── */}
      <div style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>🔌 AI 统一入口</h2>
        <div style={{
          padding: 16, borderRadius: 'var(--radius-md)',
          background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
          fontFamily: 'monospace', fontSize: 12, lineHeight: 1.8,
        }}>
          <div style={{ color: 'var(--fg-tertiary)', marginBottom: 6 }}># 未来所有AI能力统一走此接口</div>
          <div><span style={{ color: '#27AE60' }}>GET</span> /api/context/query?q=&lt;query&gt;&amp;customerId=&lt;id&gt;&amp;tags=&lt;tags&gt;</div>
          <div style={{ color: 'var(--fg-tertiary)', marginTop: 4 }}># 返回</div>
          <div>{'{'}</div>
          <div style={{ paddingLeft: 20 }}>
            <span style={{ color: '#E67E22' }}>facts</span>: L1 业务事实,</div>
          <div style={{ paddingLeft: 20 }}>
            <span style={{ color: '#2980B9' }}>memories</span>: L2 记忆 (Router → TopK),</div>
          <div style={{ paddingLeft: 20 }}>
            <span style={{ color: '#8E44AD' }}>insights</span>: L3 洞察,</div>
          <div style={{ paddingLeft: 20 }}>
            <span style={{ color: '#E74C3C' }}>strategy</span>: L4 战略</div>
          <div>{'}'}</div>
        </div>
      </div>

      {/* ── 设计原则 ── */}
      <div style={{ marginTop: 24, padding: 16, borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>🚫 核心禁令</div>
        <div style={{ fontSize: 12, color: 'var(--fg-secondary)', lineHeight: 1.8 }}>
          · AI 不直接读取数据库 &nbsp;|&nbsp; · AI 不读取全部 Memory (prompt 爆炸)<br/>
          · 统一走 Context Layer &nbsp;|&nbsp; · Memory Router 命中池 TopK 检索<br/>
          · 向量数据库待 100+客户/5000+记忆后接入
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────── APP SHELL ────────────────────────── */
export default function App(qoderProps: Record<string, any>) {
  const [tab, setTab] = useState<TabId>('dashboard')
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [custModal, setCustModal] = useState<string | null>(null)
  const [qnOpen, setQnOpen] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)
  const selectTab = (id: TabId) => { setTab(id); setMobileNav(false) }

  // Data hooks — shared across pages
  const custData = useCustomers()
  const todoData = useTodos()
  const pipeData = usePipeline()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <div className={["app-layout", (qoderProps as any)?.className].filter(Boolean).join(" ")} data-component="AppShell" style={(qoderProps as any)?.style} data-qoder-id={(qoderProps as any)?.["data-qoder-id"]} data-qoder-source={(qoderProps as any)?.["data-qoder-source"]}>
      {/* ── Mobile Header ── */}
      <div className="mobile-header" data-qoder-id="qel-mobile-header-7733e646" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mobile-header-7733e646&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;mobile-header&quot;,&quot;loc&quot;:{&quot;line&quot;:59,&quot;column&quot;:7}}">
        <button className="mobile-hamburger" onClick={() => setMobileNav(true)} data-qoder-id="qel-mobile-hamburger-873bae8b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mobile-hamburger-873bae8b&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;mobile-hamburger&quot;,&quot;loc&quot;:{&quot;line&quot;:60,&quot;column&quot;:9}}">
          <Menu size={20}  data-qoder-id="qel-menu-a285b646" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-menu-a285b646&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;menu&quot;,&quot;loc&quot;:{&quot;line&quot;:61,&quot;column&quot;:11}}"/>
        </button>
        <span className="mobile-header-title" data-qoder-id="qel-mobile-header-title-4ee34c40" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mobile-header-title-4ee34c40&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;mobile-header-title&quot;,&quot;loc&quot;:{&quot;line&quot;:63,&quot;column&quot;:9}}">Sales CRM</span>
        <button className="mobile-hamburger" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} data-qoder-id="qel-mobile-hamburger-883bb01e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mobile-hamburger-883bb01e&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;mobile-hamburger&quot;,&quot;loc&quot;:{&quot;line&quot;:64,&quot;column&quot;:9}}">
          {theme === 'dark' ? <Sun size={18}  data-qoder-id="qel-sun-c0e79fab" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-sun-c0e79fab&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;sun&quot;,&quot;loc&quot;:{&quot;line&quot;:65,&quot;column&quot;:31}}"/> : <Moon size={18}  data-qoder-id="qel-moon-c59d75ca" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-moon-c59d75ca&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;moon&quot;,&quot;loc&quot;:{&quot;line&quot;:65,&quot;column&quot;:51}}"/>}
        </button>
      </div>

      {/* ── Sidebar Drawer Overlay ── */}
      {mobileNav && <div className="drawer-overlay" onClick={() => setMobileNav(false)}  data-qoder-id="qel-drawer-overlay-3e8a618e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-drawer-overlay-3e8a618e&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;drawer-overlay&quot;,&quot;loc&quot;:{&quot;line&quot;:70,&quot;column&quot;:21}}"/>}

      {/* ── Sidebar ── */}
      <aside className={cn('sidebar', mobileNav && 'drawer-open')} data-component="Sidebar" data-qoder-id="qel-sidebar-9297e275" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-sidebar-9297e275&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;sidebar&quot;,&quot;loc&quot;:{&quot;line&quot;:57,&quot;column&quot;:7}}">
        <div className="sidebar-brand" data-qoder-id="qel-sidebar-brand-6028b41a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-sidebar-brand-6028b41a&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;sidebar-brand&quot;,&quot;loc&quot;:{&quot;line&quot;:58,&quot;column&quot;:9}}">
          <div className="sidebar-brand-title" data-qoder-id="qel-sidebar-brand-title-337a837c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-sidebar-brand-title-337a837c&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;sidebar-brand-title&quot;,&quot;loc&quot;:{&quot;line&quot;:59,&quot;column&quot;:11}}">Sales CRM</div>
          <div className="sidebar-brand-sub" data-qoder-id="qel-sidebar-brand-sub-721b69b1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-sidebar-brand-sub-721b69b1&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;sidebar-brand-sub&quot;,&quot;loc&quot;:{&quot;line&quot;:60,&quot;column&quot;:11}}">OEM 南京区域 · FY26</div>
        </div>

        <div className="sidebar-section" data-qoder-id="qel-sidebar-section-5285a2e1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-sidebar-section-5285a2e1&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;sidebar-section&quot;,&quot;loc&quot;:{&quot;line&quot;:63,&quot;column&quot;:9}}">
          <div className="sidebar-section-label" data-qoder-id="qel-sidebar-section-label-32c2e865" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-sidebar-section-label-32c2e865&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;sidebar-section-label&quot;,&quot;loc&quot;:{&quot;line&quot;:64,&quot;column&quot;:11}}">导航</div>
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={cn('sidebar-item', tab === item.id && 'active')}
              onClick={() => selectTab(item.id)}
             data-qoder-id="qel-button-e144d554" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-e144d554&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:66,&quot;column&quot;:13}}">
              {item.icon}
              <span data-qoder-id="qel-span-4a02c36d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-4a02c36d&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:72,&quot;column&quot;:15}}">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="sidebar-footer" data-qoder-id="qel-sidebar-footer-202f9bc1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-sidebar-footer-202f9bc1&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;sidebar-footer&quot;,&quot;loc&quot;:{&quot;line&quot;:77,&quot;column&quot;:9}}">
          <button className="sidebar-item" onClick={() => { setQnOpen(true); setMobileNav(false) }} data-qoder-id="qel-sidebar-item-dab28eeb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-sidebar-item-dab28eeb&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;sidebar-item&quot;,&quot;loc&quot;:{&quot;line&quot;:78,&quot;column&quot;:11}}">
            <Zap size={18}  data-qoder-id="qel-zap-2547267c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-zap-2547267c&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;zap&quot;,&quot;loc&quot;:{&quot;line&quot;:79,&quot;column&quot;:13}}"/>
            <span data-qoder-id="qel-span-b1fb1860" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-b1fb1860&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:80,&quot;column&quot;:13}}">速记</span>
          </button>
          <button className="sidebar-item" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} data-qoder-id="qel-sidebar-item-64ab1964" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-sidebar-item-64ab1964&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;sidebar-item&quot;,&quot;loc&quot;:{&quot;line&quot;:86,&quot;column&quot;:11}}">
            {theme === 'dark' ? <Sun size={18}  data-qoder-id="qel-sun-afe0c923" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-sun-afe0c923&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;sun&quot;,&quot;loc&quot;:{&quot;line&quot;:87,&quot;column&quot;:33}}"/> : <Moon size={18}  data-qoder-id="qel-moon-42a07928" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-moon-42a07928&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;moon&quot;,&quot;loc&quot;:{&quot;line&quot;:87,&quot;column&quot;:53}}"/>}
            <span data-qoder-id="qel-span-b8fb2365" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-b8fb2365&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:88,&quot;column&quot;:13}}">{theme === 'dark' ? '浅色模式' : '深色模式'}</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="main-content" data-component="MainContent" data-qoder-id="qel-maincontent-be46cf2f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-maincontent-be46cf2f&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;maincontent&quot;,&quot;loc&quot;:{&quot;line&quot;:94,&quot;column&quot;:7}}">
        <AnimatePresence mode="wait" data-qoder-id="qel-animatepresence-a3d80963" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-animatepresence-a3d80963&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;animatepresence&quot;,&quot;loc&quot;:{&quot;line&quot;:95,&quot;column&quot;:9}}">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
           data-qoder-id="qel-motion-div-90459b4a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-motion-div-90459b4a&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;motion-div&quot;,&quot;loc&quot;:{&quot;line&quot;:96,&quot;column&quot;:11}}">
            {tab === 'dashboard' && <DashboardPage customers={custData.customers} custLoading={custData.loading} custError={custData.error} onRetry={custData.reload} todos={todoData.todos} todoData={todoData} onCustClick={setCustModal} pipeStages={pipeData.stages} data-qoder-id="qel-dashboardpage-79c00185" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-dashboardpage-79c00185&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;dashboardpage&quot;,&quot;loc&quot;:{&quot;line&quot;:207,&quot;column&quot;:37}}"/>}
            {tab === 'customers' && <CustomersPage customers={custData.customers} custLoading={custData.loading} custError={custData.error} onRetry={custData.reload} onCustClick={setCustModal} onReload={custData.reload} data-qoder-id="qel-customerspage-868e80de" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-customerspage-868e80de&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;customerspage&quot;,&quot;loc&quot;:{&quot;line&quot;:208,&quot;column&quot;:37}}"/>}
            {tab === 'pipeline' && <PipelinePage customers={custData.customers} custLoading={custData.loading} custError={custData.error} onRetry={custData.reload} pipeData={pipeData} onCustClick={setCustModal} data-qoder-id="qel-pipelinepage-66b940b9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-pipelinepage-66b940b9&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;pipelinepage&quot;,&quot;loc&quot;:{&quot;line&quot;:209,&quot;column&quot;:36}}"/>}
            {tab === 'competitive' && <CompetitivePage customers={custData.customers} custLoading={custData.loading} custError={custData.error} onRetry={custData.reload} data-qoder-id="qel-competitivepage-f61ccfe0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-competitivepage-f61ccfe0&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;competitivepage&quot;,&quot;loc&quot;:{&quot;line&quot;:210,&quot;column&quot;:39}}"/>}
            {tab === 'energy' && <EnergyPage customers={custData.customers} custLoading={custData.loading} custError={custData.error} onRetry={custData.reload} data-qoder-id="qel-energypage-92084237" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-energypage-92084237&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;energypage&quot;,&quot;loc&quot;:{&quot;line&quot;:211,&quot;column&quot;:34}}"/>}
            {tab === 'coach' && <CoachPage customers={custData.customers} data-qoder-id="qel-coachpage-77587252" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-coachpage-77587252&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;coachpage&quot;,&quot;loc&quot;:{&quot;line&quot;:212,&quot;column&quot;:33}}"/>}
            {tab === 'weekly' && <WeeklyPage data-qoder-id="qel-weeklypage-802c936f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-weeklypage-802c936f&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;weeklypage&quot;,&quot;loc&quot;:{&quot;line&quot;:213,&quot;column&quot;:34}}"/>}
            {tab === 'review' && <MemoryReviewPage customers={custData.customers} />}
            {tab === 'aihub' && <AIHubPage />}
          </motion.div>
        </AnimatePresence>
      </div>

      {custModal && <CustomerDetailModal id={custModal} customers={custData.customers} onClose={() => setCustModal(null)} onReload={custData.reload} data-qoder-id="qel-customerdetailmodal-96a5648c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-customerdetailmodal-96a5648c&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;customerdetailmodal&quot;,&quot;loc&quot;:{&quot;line&quot;:218,&quot;column&quot;:21}}"/>}
      {qnOpen && <QuickNoteModal customers={custData.customers} onClose={() => setQnOpen(false)} data-qoder-id="qel-quicknotemodal-c1d77994" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-quicknotemodal-c1d77994&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;quicknotemodal&quot;,&quot;loc&quot;:{&quot;line&quot;:219,&quot;column&quot;:18}}"/>}

      {/* ── Mobile Bottom Tab Bar ── */}
      <nav className="bottom-tabs" data-qoder-id="qel-bottom-tabs-3cd06e47" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-bottom-tabs-3cd06e47&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;bottom-tabs&quot;,&quot;loc&quot;:{&quot;line&quot;:134,&quot;column&quot;:7}}">
        {NAV_ITEMS.slice(0, 3).map(item => (
          <button
            key={item.id}
            className={cn('bottom-tab-item', tab === item.id && 'active')}
            onClick={() => selectTab(item.id)}
           data-qoder-id="qel-button-594c4e01" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-594c4e01&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:136,&quot;column&quot;:11}}">
            {item.icon}
            <span data-qoder-id="qel-span-bc0c713f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-bc0c713f&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:142,&quot;column&quot;:13}}">{item.label}</span>
          </button>
        ))}
        <button
          className={cn('bottom-tab-item', ['competitive', 'energy', 'coach', 'weekly', 'review', 'aihub'].includes(tab) && 'active')}
          onClick={() => setMobileNav(true)}
         data-qoder-id="qel-button-554e864c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-554e864c&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:145,&quot;column&quot;:9}}">
          <Menu size={18}  data-qoder-id="qel-menu-398f9e57" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-menu-398f9e57&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;menu&quot;,&quot;loc&quot;:{&quot;line&quot;:149,&quot;column&quot;:11}}"/>
          <span data-qoder-id="qel-span-bd0c72d2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-bd0c72d2&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:150,&quot;column&quot;:11}}">更多</span>
        </button>
      </nav>
    </div>
  )
}

/* ═══════════════════════ PAGE 1: DASHBOARD ═════════════════════ */
function DashboardPage({ customers, custLoading, custError, onRetry, todos, todoData, onCustClick, pipeStages }: {
  customers: Customer[]; custLoading: boolean; custError: string | null; onRetry: () => void;
  todos: TodoItem[]; todoData: ReturnType<typeof useTodos>;
  onCustClick: (id: string) => void; pipeStages: PipelineStageSummary[];
}) {
  const [newTodoText, setNewTodoText] = useState('')
  const [editingTodoId, setEditingTodoId] = useState<number | null>(null)
  const [editTodoText, setEditTodoText] = useState('')
  const [todoFilter, setTodoFilter] = useState<'pending' | 'completed'>('pending')

  const activeCusts = customers.filter(c => !c.isGroup)
  const totalCY = activeCusts.reduce((s, c) => s + (c.salesData?.CY_YTD || 0), 0)
  const activeCount = activeCusts.filter(c => (c.salesData?.CY_YTD || 0) > 0).length
  const pipeCount = activeCusts.reduce((s, c) => s + (c.pipeline?.length || 0), 0)
  const fyPct = Math.min(100, Math.round(totalCY / FY_TARGET * 100))

  // Pending todos
  const pendingTodos = todos.filter(t => !t.completed)

  // Revenue chart data — use full customer names
  const chartData = activeCusts
    .filter(c => (c.salesData?.CY_YTD || 0) > 0 || (c.salesData?.PY || 0) > 0)
    .map(c => ({
      name: c.name,
      cy: c.salesData?.CY_YTD || 0,
      py: c.salesData?.PY_YTD || c.salesData?.PY || 0,
    }))
    .sort((a, b) => b.cy - a.cy)

  // Risk alerts
  const riskCusts = activeCusts.filter(c => c.risk)
  const coldCusts = activeCusts.filter(c => c.lastVisit && daysSince(c.lastVisit) > 14)

  // Add todo (optimistic)
  const handleAddTodo = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTodoText.trim()) {
      const tempId = Date.now()
      const optimistic: TodoItem = { id: tempId, text: newTodoText.trim(), completed: false, createdAt: new Date().toISOString() }
      setNewTodoText('')
      todoData.setTodos(prev => [optimistic, ...prev])
      try {
        const res = await api.createTodo({ text: optimistic.text })
        todoData.setTodos(prev => prev.map(t => t.id === tempId ? res.data : t))
      } catch (err) {
        console.error('Failed to add todo:', err)
        todoData.setTodos(prev => prev.filter(t => t.id !== tempId))
      }
    }
  }

  // Toggle todo (optimistic)
  const handleToggleTodo = async (todo: TodoItem) => {
    todoData.setTodos(prev => prev.map(t => t.id === todo.id ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : undefined } : t))
    try {
      await api.updateTodo(todo.id, { completed: !todo.completed })
    } catch (err) {
      console.error('Failed to toggle todo:', err)
      todoData.setTodos(prev => prev.map(t => t.id === todo.id ? { ...t, completed: todo.completed } : t))
    }
  }

  // Delete todo (optimistic)
  const handleDeleteTodo = async (id: number) => {
    const backup = todoData.todos
    todoData.setTodos(prev => prev.filter(t => t.id !== id))
    try {
      await api.deleteTodo(id)
    } catch (err) {
      console.error('Failed to delete todo:', err)
      todoData.setTodos(backup)
    }
  }

  // Edit todo text (optimistic)
  const handleEditTodo = async (todo: TodoItem) => {
    if (editTodoText.trim() && editTodoText.trim() !== todo.text) {
      const oldText = todo.text
      todoData.setTodos(prev => prev.map(t => t.id === todo.id ? { ...t, text: editTodoText.trim() } : t))
      setEditingTodoId(null)
      setEditTodoText('')
      try {
        await api.updateTodo(todo.id, { text: editTodoText.trim() })
      } catch (err) {
        console.error('Failed to edit todo:', err)
        todoData.setTodos(prev => prev.map(t => t.id === todo.id ? { ...t, text: oldText } : t))
      }
    } else {
      setEditingTodoId(null)
      setEditTodoText('')
    }
  }

  return (
    <>
      <div className="page-header" data-qoder-id="qel-page-header-ce493f65" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-page-header-ce493f65&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;page-header&quot;,&quot;loc&quot;:{&quot;line&quot;:305,&quot;column&quot;:7}}">
        <h1 className="page-title" data-qoder-id="qel-page-title-b9db0547" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-page-title-b9db0547&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;page-title&quot;,&quot;loc&quot;:{&quot;line&quot;:306,&quot;column&quot;:9}}">仪表盘</h1>
        <p className="page-subtitle" data-qoder-id="qel-page-subtitle-c00438e1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-page-subtitle-c00438e1&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;page-subtitle&quot;,&quot;loc&quot;:{&quot;line&quot;:307,&quot;column&quot;:9}}">年度目标 {fyPct}% · {fmtK(totalCY)} / {FY_TARGET.toLocaleString()}K · {activeCount} 个活跃客户 · {pipeCount} 个商机</p>
      </div>

      <DataState loading={custLoading} error={custError} onRetry={onRetry} data-qoder-id="qel-datastate-4ccfac55" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-datastate-4ccfac55&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;datastate&quot;,&quot;loc&quot;:{&quot;line&quot;:310,&quot;column&quot;:7}}">
      <div className="page-body" data-qoder-id="qel-page-body-b6a94011" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-page-body-b6a94011&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;page-body&quot;,&quot;loc&quot;:{&quot;line&quot;:311,&quot;column&quot;:7}}">
        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }} data-qoder-id="qel-div-35f47543" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-35f47543&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:313,&quot;column&quot;:9}}">
          {[
            { label: '年度订单', value: fmtK(totalCY), sub: `完成 ${fyPct}%`, color: 'var(--accent)' },
            { label: '活跃客户', value: String(activeCount), sub: '有 YTD 订单', color: 'var(--status-success)' },
            { label: '活跃商机', value: String(pipeCount), sub: 'Pipeline 项目', color: 'var(--status-warning)' },
            { label: '待办事项', value: String(pendingTodos.length), sub: `共 ${todos.length} 项`, color: 'var(--status-info)' },
          ].map(kpi => (
            <div key={kpi.label} className="kpi-card" style={{ '--kpi-color': kpi.color } as React.CSSProperties} data-qoder-id="qel-kpi-card-67a64216" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-kpi-card-67a64216&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;kpi-card&quot;,&quot;loc&quot;:{&quot;line&quot;:320,&quot;column&quot;:13}}">
              <div className="kpi-label" data-qoder-id="qel-kpi-label-7bb8ecef" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-kpi-label-7bb8ecef&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;kpi-label&quot;,&quot;loc&quot;:{&quot;line&quot;:321,&quot;column&quot;:15}}">{kpi.label}</div>
              <div className="kpi-value" data-qoder-id="qel-kpi-value-19611869" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-kpi-value-19611869&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;kpi-value&quot;,&quot;loc&quot;:{&quot;line&quot;:322,&quot;column&quot;:15}}">{kpi.value}</div>
              <div className="kpi-sub" data-qoder-id="qel-kpi-sub-5d403d7d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-kpi-sub-5d403d7d&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;kpi-sub&quot;,&quot;loc&quot;:{&quot;line&quot;:323,&quot;column&quot;:15}}">{kpi.sub}</div>
            </div>
          ))}
        </div>

        {/* Todos + Revenue Chart */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 }} data-qoder-id="qel-div-38f479fc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-38f479fc&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:329,&quot;column&quot;:9}}">
          {/* Todo List with add/delete/complete/edit */}
          <div className="card" data-qoder-id="qel-card-3de2cf5c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-card-3de2cf5c&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;card&quot;,&quot;loc&quot;:{&quot;line&quot;:331,&quot;column&quot;:11}}">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }} data-qoder-id="qel-div-3ef4836e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-3ef4836e&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:332,&quot;column&quot;:13}}">
              <CheckSquare size={16} style={{ color: 'var(--accent)' }}  data-qoder-id="qel-checksquare-018732da" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-checksquare-018732da&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;checksquare&quot;,&quot;loc&quot;:{&quot;line&quot;:333,&quot;column&quot;:15}}"/>
              <span style={{ fontSize: 15, fontWeight: 600 }} data-qoder-id="qel-span-e6b3768d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-e6b3768d&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:334,&quot;column&quot;:15}}">待办事项</span>
              <div style={{ display: 'flex', gap: 4, marginLeft: 4 }} data-qoder-id="qel-div-3ef4836e-2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-3ef4836e-2&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:353,&quot;column&quot;:15}}">
                <Button variant={todoFilter === 'pending' ? 'default' : 'ghost'} size="sm"
                  onClick={() => setTodoFilter('pending')} style={{ fontSize: 12, padding: '2px 10px' }} data-qoder-id="qel-button-40990bba" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-40990bba&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:354,&quot;column&quot;:17}}">当前</Button>
                <Button variant={todoFilter === 'completed' ? 'default' : 'ghost'} size="sm"
                  onClick={() => setTodoFilter('completed')} style={{ fontSize: 12, padding: '2px 10px' }} data-qoder-id="qel-button-41990d4d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-41990d4d&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:356,&quot;column&quot;:17}}">已完成</Button>
              </div>
              <span className="badge badge-teal" style={{ marginLeft: 'auto' }} data-qoder-id="qel-badge-a08bce3d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-badge-a08bce3d&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;badge&quot;,&quot;loc&quot;:{&quot;line&quot;:335,&quot;column&quot;:15}}">{pendingTodos.length}/{todos.length}</span>
            </div>
            {/* Add todo input */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }} data-qoder-id="qel-div-4514e08b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-4514e08b&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:338,&quot;column&quot;:13}}">
              <input
                className="search-input"
                style={{ flex: 1 }}
                placeholder="输入待办事项，按回车添加..."
                value={newTodoText}
                onChange={e => setNewTodoText(e.target.value)}
                onKeyDown={handleAddTodo}
               data-qoder-id="qel-search-input-61ee22b5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-search-input-61ee22b5&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;search-input&quot;,&quot;loc&quot;:{&quot;line&quot;:339,&quot;column&quot;:15}}"/>
            </div>
            {(() => {
              const filteredTodos = todoFilter === 'pending'
                ? todos.filter(t => !t.completed)
                : todos.filter(t => t.completed)
              return (
              <>
            {filteredTodos.length === 0 && !todoData.loading && (
              <EmptyState icon={<CheckSquare size={20} />} message={todoFilter === 'pending' ? '暂无待办事项' : '暂无已完成事项'} hint={todoFilter === 'pending' ? '在上方输入框添加待办' : '完成待办后将在此显示'}  data-qoder-id="qel-emptystate-2097824d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-emptystate-2097824d&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;emptystate&quot;,&quot;loc&quot;:{&quot;line&quot;:379,&quot;column&quot;:15}}"/>
            )}
            {/* Scrollable todo list */}
            <div style={{ maxHeight: 320, overflowY: 'auto', paddingRight: 4 }} data-qoder-id="qel-div-4814e544" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-4814e544&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:382,&quot;column&quot;:13}}">
              {filteredTodos.map(t => (
                <div key={t.id} className="action-row" style={{ gap: 8 }} data-qoder-id="qel-action-row-1391186e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-action-row-1391186e&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;action-row&quot;,&quot;loc&quot;:{&quot;line&quot;:352,&quot;column&quot;:15}}">
                  <button
                    onClick={() => handleToggleTodo(t)}
                    style={{ width: 18, height: 18, borderRadius: 'var(--radius-xs)', border: `2px solid ${t.completed ? 'var(--status-success)' : 'var(--accent)'}`, background: t.completed ? 'var(--status-success)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                   data-qoder-id="qel-button-2a721bbb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-2a721bbb&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:353,&quot;column&quot;:17}}">
                    {t.completed && <CheckSquare size={12} style={{ color: 'white' }}  data-qoder-id="qel-checksquare-f9872642" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-checksquare-f9872642&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;checksquare&quot;,&quot;loc&quot;:{&quot;line&quot;:357,&quot;column&quot;:35}}"/>}
                  </button>
                  {editingTodoId === t.id ? (
                    <input
                      className="search-input"
                      style={{ flex: 1, padding: '2px 6px', fontSize: 13 }}
                      value={editTodoText}
                      onChange={e => setEditTodoText(e.target.value)}
                      onBlur={() => handleEditTodo(t)}
                      onKeyDown={e => { if (e.key === 'Enter') handleEditTodo(t); if (e.key === 'Escape') { setEditingTodoId(null); setEditTodoText('') } }}
                      autoFocus
                     data-qoder-id="qel-search-input-57ebd460" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-search-input-57ebd460&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;search-input&quot;,&quot;loc&quot;:{&quot;line&quot;:392,&quot;column&quot;:21}}"/>
                  ) : (
                    <span
                      className="action-row-label"
                      style={{ textDecoration: t.completed ? 'line-through' : 'none', opacity: t.completed ? 0.5 : 1, cursor: 'pointer' }}
                      onDoubleClick={() => { setEditingTodoId(t.id); setEditTodoText(t.text) }}
                      data-qoder-id="qel-action-row-label-1ba3c7c9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-action-row-label-1ba3c7c9&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;action-row-label&quot;,&quot;loc&quot;:{&quot;line&quot;:359,&quot;column&quot;:17}}"
                    >{t.text}</span>
                  )}
                  {t.deadline && <span className={t.deadline === '已过期' ? 'action-row-urgent' : 'action-row-meta'} data-qoder-id="qel-span-4bb65423" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-4bb65423&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:360,&quot;column&quot;:32}}">{t.deadline}</span>}
                  {t.createdAt && <span className="action-row-meta" style={{ fontSize: 11 }} data-qoder-id="qel-action-row-meta-fbc8455f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-action-row-meta-fbc8455f&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;action-row-meta&quot;,&quot;loc&quot;:{&quot;line&quot;:410,&quot;column&quot;:35}}">{t.createdAt.slice(0, 10)}</span>}
                  <button onClick={() => handleDeleteTodo(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-muted)', padding: 2, flexShrink: 0 }} data-qoder-id="qel-button-147437b0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-147437b0&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:361,&quot;column&quot;:17}}">
                    <Trash2 size={12}  data-qoder-id="qel-trash2-bd321cc9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-trash2-bd321cc9&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;trash2&quot;,&quot;loc&quot;:{&quot;line&quot;:362,&quot;column&quot;:19}}"/>
                  </button>
                </div>
              ))}
            </div>
              </>
              )
            })()}
          </div>
          <div className="card" data-qoder-id="qel-card-c8f121b7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-card-c8f121b7&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;card&quot;,&quot;loc&quot;:{&quot;line&quot;:369,&quot;column&quot;:11}}">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }} data-qoder-id="qel-div-481723db" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-481723db&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:370,&quot;column&quot;:13}}">
              <BarChart3 size={16} style={{ color: 'var(--accent)' }}  data-qoder-id="qel-barchart3-120405fc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-barchart3-120405fc&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;barchart3&quot;,&quot;loc&quot;:{&quot;line&quot;:371,&quot;column&quot;:15}}"/>
              <span style={{ fontSize: 15, fontWeight: 600 }} data-qoder-id="qel-span-51b65d95" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-51b65d95&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:372,&quot;column&quot;:15}}">客户营收对比</span>
            </div>
            <div style={{ maxHeight: 500, overflowY: 'auto' }} data-qoder-id="qel-div-8890c29d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-8890c29d&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:426,&quot;column&quot;:13}}">
            <div style={{ width: '100%', height: Math.max(200, chartData.length * 32) }} data-qoder-id="qel-div-4917256e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-4917256e&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:374,&quot;column&quot;:13}}">
              <ResponsiveContainer width="100%" height="100%" data-qoder-id="qel-responsivecontainer-cf2e17ab" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-responsivecontainer-cf2e17ab&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;responsivecontainer&quot;,&quot;loc&quot;:{&quot;line&quot;:375,&quot;column&quot;:15}}">
                <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }} data-qoder-id="qel-barchart-e711f76e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-barchart-e711f76e&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;barchart&quot;,&quot;loc&quot;:{&quot;line&quot;:376,&quot;column&quot;:17}}">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"  data-qoder-id="qel-cartesiangrid-27a234f5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-cartesiangrid-27a234f5&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;cartesiangrid&quot;,&quot;loc&quot;:{&quot;line&quot;:377,&quot;column&quot;:19}}"/>
                  <XAxis type="number" tickFormatter={(v: number) => `${Math.round(v / 1000)}K`} tick={{ fontSize: 11, fill: 'var(--fg-tertiary)' }}  data-qoder-id="qel-xaxis-f3eafece" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-xaxis-f3eafece&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;xaxis&quot;,&quot;loc&quot;:{&quot;line&quot;:378,&quot;column&quot;:19}}"/>
                  <YAxis type="category" dataKey="name" width={200} tick={{ fontSize: 11, fill: 'var(--fg-secondary)' }} tickFormatter={(v: string) => v.length > 18 ? v.slice(0, 18) + '…' : v}  data-qoder-id="qel-yaxis-583835d3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-yaxis-583835d3&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;yaxis&quot;,&quot;loc&quot;:{&quot;line&quot;:379,&quot;column&quot;:19}}"/>
                  <ReTooltip
                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                    formatter={(value: any, name: any) => [fmtK(value as number), name === 'cy' ? 'CY YTD' : 'PY YTD']}
                   data-qoder-id="qel-retooltip-87e99638" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-retooltip-87e99638&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;retooltip&quot;,&quot;loc&quot;:{&quot;line&quot;:380,&quot;column&quot;:19}}"/>
                  <Bar dataKey="py" fill="var(--border-strong)" radius={[0, 3, 3, 0]} barSize={10} name="py"  data-qoder-id="qel-bar-3ee7b2a5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-bar-3ee7b2a5&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;bar&quot;,&quot;loc&quot;:{&quot;line&quot;:384,&quot;column&quot;:19}}"/>
                  <Bar dataKey="cy" fill="var(--accent)" radius={[0, 3, 3, 0]} barSize={10} name="cy"  data-qoder-id="qel-bar-3de7b112" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-bar-3de7b112&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;bar&quot;,&quot;loc&quot;:{&quot;line&quot;:385,&quot;column&quot;:19}}"/>
                </BarChart>
              </ResponsiveContainer>
            </div>
            </div>
          </div>
        </div>

        {/* Pipeline Summary */}
        <div className="card" style={{ marginBottom: 32 }} data-qoder-id="qel-card-ebb42a3c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-card-ebb42a3c&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;card&quot;,&quot;loc&quot;:{&quot;line&quot;:393,&quot;column&quot;:9}}">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }} data-qoder-id="qel-div-8190b798" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-8190b798&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:394,&quot;column&quot;:11}}">
            <GitBranch size={16} style={{ color: 'var(--accent)' }}  data-qoder-id="qel-gitbranch-7b233ab9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-gitbranch-7b233ab9&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;gitbranch&quot;,&quot;loc&quot;:{&quot;line&quot;:395,&quot;column&quot;:13}}"/>
            <span style={{ fontSize: 15, fontWeight: 600 }} data-qoder-id="qel-span-e2324986" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-e2324986&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:396,&quot;column&quot;:13}}">Pipeline 概览</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }} data-qoder-id="qel-div-828e7a94" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-828e7a94&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:398,&quot;column&quot;:11}}">
            {PIPE_STAGES.map(stage => {
              const stageData = pipeStages.find(s => s.num === stage.num)
              const count = stageData?.count || 0
              return (
                <div key={stage.num} style={{ textAlign: 'center' }} data-qoder-id="qel-div-838e7c27" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-838e7c27&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:403,&quot;column&quot;:17}}">
                  <div style={{ fontSize: 28, fontWeight: 700, color: stage.color, marginBottom: 4 }} data-qoder-id="qel-div-848e7dba" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-848e7dba&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:404,&quot;column&quot;:19}}">{count}</div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg-tertiary)' }} data-qoder-id="qel-div-858e7f4d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-858e7f4d&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:405,&quot;column&quot;:19}}">{stage.name}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Alerts */}
        {(riskCusts.length > 0 || coldCusts.length > 0) && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} data-qoder-id="qel-div-7e8e7448" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-7e8e7448&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:414,&quot;column&quot;:11}}">
            {riskCusts.length > 0 && (
              <div className="card" data-qoder-id="qel-card-eab66740" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-card-eab66740&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;card&quot;,&quot;loc&quot;:{&quot;line&quot;:416,&quot;column&quot;:15}}">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }} data-qoder-id="qel-div-808e776e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-808e776e&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:417,&quot;column&quot;:17}}">
                  <AlertTriangle size={16} style={{ color: 'var(--status-danger)' }}  data-qoder-id="qel-alerttriangle-07dfc849" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-alerttriangle-07dfc849&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;alerttriangle&quot;,&quot;loc&quot;:{&quot;line&quot;:418,&quot;column&quot;:19}}"/>
                  <span style={{ fontSize: 15, fontWeight: 600 }} data-qoder-id="qel-span-dd300310" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-dd300310&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:419,&quot;column&quot;:19}}">风险提醒</span>
                </div>
                {riskCusts.map(c => (
                  <div key={c.id} className="action-row" style={{ cursor: 'pointer' }} onClick={() => onCustClick(c.id)} data-qoder-id="qel-action-row-70d7b1b1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-action-row-70d7b1b1&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;action-row&quot;,&quot;loc&quot;:{&quot;line&quot;:422,&quot;column&quot;:19}}">
                    <div className="dot dot-red"  data-qoder-id="qel-dot-8b23a9e7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-dot-8b23a9e7&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;dot&quot;,&quot;loc&quot;:{&quot;line&quot;:423,&quot;column&quot;:21}}"/>
                    <span className="action-row-label" data-qoder-id="qel-action-row-label-f89affac" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-action-row-label-f89affac&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;action-row-label&quot;,&quot;loc&quot;:{&quot;line&quot;:424,&quot;column&quot;:21}}">{c.name}</span>
                    <span style={{ fontSize: 12, color: 'var(--status-danger)' }} data-qoder-id="qel-span-59378209" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-59378209&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:425,&quot;column&quot;:21}}">{c.risk}</span>
                  </div>
                ))}
              </div>
            )}
            {coldCusts.length > 0 && (
              <div className="card" data-qoder-id="qel-card-80af049d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-card-80af049d&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;card&quot;,&quot;loc&quot;:{&quot;line&quot;:431,&quot;column&quot;:15}}">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }} data-qoder-id="qel-div-f095e383" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-f095e383&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:432,&quot;column&quot;:17}}">
                  <Clock size={16} style={{ color: 'var(--status-warning)' }}  data-qoder-id="qel-clock-6367e138" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-clock-6367e138&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;clock&quot;,&quot;loc&quot;:{&quot;line&quot;:433,&quot;column&quot;:19}}"/>
                  <span style={{ fontSize: 15, fontWeight: 600 }} data-qoder-id="qel-span-5d378855" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-5d378855&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:434,&quot;column&quot;:19}}">冷淡预警</span>
                </div>
                {coldCusts.sort((a, b) => daysSince(b.lastVisit!) - daysSince(a.lastVisit!)).slice(0, 5).map(c => (
                  <div key={c.id} className="action-row" style={{ cursor: 'pointer' }} onClick={() => onCustClick(c.id)} data-qoder-id="qel-action-row-fad4b958" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-action-row-fad4b958&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;action-row&quot;,&quot;loc&quot;:{&quot;line&quot;:437,&quot;column&quot;:19}}">
                    <div className="dot dot-orange"  data-qoder-id="qel-dot-83239d4f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-dot-83239d4f&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;dot&quot;,&quot;loc&quot;:{&quot;line&quot;:438,&quot;column&quot;:21}}"/>
                    <span className="action-row-label" data-qoder-id="qel-action-row-label-009b0c44" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-action-row-label-009b0c44&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;action-row-label&quot;,&quot;loc&quot;:{&quot;line&quot;:439,&quot;column&quot;:21}}">{c.name}</span>
                    <span className="action-row-meta" data-qoder-id="qel-action-row-meta-236901d5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-action-row-meta-236901d5&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;action-row-meta&quot;,&quot;loc&quot;:{&quot;line&quot;:440,&quot;column&quot;:21}}">{daysSince(c.lastVisit!)}天</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      </DataState>
    </>
  )
}

/* ════════════════════ CREATE CUSTOMER MODAL ════════════════════ */
function CreateCustomerModal({ onClose, onCreated, ...qoderProps }: { onClose: () => void; onCreated: () => void } & Record<string, any>) {
  const [name, setName] = useState('')
  const [industry, setIndustry] = useState('')
  const [color, setColor] = useState<'red' | 'orange' | 'green' | 'gray'>('gray')
  const [comp, setComp] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!name.trim()) { setError('请输入客户名称'); return }
    setSaving(true); setError('')
    try {
      await api.createCustomer({ name: name.trim(), color, industry, comp })
      onCreated()
    } catch (e: any) {
      setError(e.message || '创建失败')
    } finally { setSaving(false) }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', fontSize: 14, fontFamily: 'var(--font-sans)',
    color: 'var(--fg)', background: 'var(--bg-input)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', outline: 'none',
  }

  return (
    <div className={["modal-overlay", (qoderProps as any)?.className].filter(Boolean).join(" ")} onClick={e => { if (e.target === e.currentTarget) onClose() }} style={(qoderProps as any)?.style} data-qoder-id={(qoderProps as any)?.["data-qoder-id"]} data-qoder-source={(qoderProps as any)?.["data-qoder-source"]}>
      <div className="modal-panel" style={{ maxWidth: 480 }} data-qoder-id="qel-modal-panel-72711d5f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-modal-panel-72711d5f&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CreateCustomerModal&quot;,&quot;elementRole&quot;:&quot;modal-panel&quot;,&quot;loc&quot;:{&quot;line&quot;:535,&quot;column&quot;:7}}">
        <div className="modal-header" data-qoder-id="qel-modal-header-3beb2e9d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-modal-header-3beb2e9d&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CreateCustomerModal&quot;,&quot;elementRole&quot;:&quot;modal-header&quot;,&quot;loc&quot;:{&quot;line&quot;:536,&quot;column&quot;:9}}">
          <h2 className="modal-title" data-qoder-id="qel-modal-title-7e2c2544" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-modal-title-7e2c2544&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CreateCustomerModal&quot;,&quot;elementRole&quot;:&quot;modal-title&quot;,&quot;loc&quot;:{&quot;line&quot;:537,&quot;column&quot;:11}}">新增客户</h2>
          <Button variant="ghost" size="icon" onClick={onClose} data-qoder-id="qel-button-3ee0ea63" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-3ee0ea63&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CreateCustomerModal&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:538,&quot;column&quot;:11}}"><X size={18}  data-qoder-id="qel-x-a941c5c7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-x-a941c5c7&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CreateCustomerModal&quot;,&quot;elementRole&quot;:&quot;x&quot;,&quot;loc&quot;:{&quot;line&quot;:538,&quot;column&quot;:65}}"/></Button>
        </div>
        {error && <div style={{ padding: '8px 12px', margin: '0 0 12px', background: 'var(--danger-bg, #fef2f2)', color: 'var(--status-danger)', borderRadius: 'var(--radius-sm)', fontSize: 13 }} data-qoder-id="qel-div-841672e0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-841672e0&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CreateCustomerModal&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:540,&quot;column&quot;:19}}">{error}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} data-qoder-id="qel-div-87167799" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-87167799&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CreateCustomerModal&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:541,&quot;column&quot;:9}}">
          <div data-qoder-id="qel-div-86167606" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-86167606&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CreateCustomerModal&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:542,&quot;column&quot;:11}}">
            <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, display: 'block' }} data-qoder-id="qel-label-46920c9b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-label-46920c9b&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CreateCustomerModal&quot;,&quot;elementRole&quot;:&quot;label&quot;,&quot;loc&quot;:{&quot;line&quot;:543,&quot;column&quot;:13}}">客户名称 *</label>
            <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="输入客户名称"  data-qoder-id="qel-input-f87e3a98" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-input-f87e3a98&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CreateCustomerModal&quot;,&quot;elementRole&quot;:&quot;input&quot;,&quot;loc&quot;:{&quot;line&quot;:544,&quot;column&quot;:13}}"/>
          </div>
          <div data-qoder-id="qel-div-8b167de5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-8b167de5&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CreateCustomerModal&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:546,&quot;column&quot;:11}}">
            <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, display: 'block' }} data-qoder-id="qel-label-47920e2e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-label-47920e2e&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CreateCustomerModal&quot;,&quot;elementRole&quot;:&quot;label&quot;,&quot;loc&quot;:{&quot;line&quot;:547,&quot;column&quot;:13}}">行业</label>
            <input style={inputStyle} value={industry} onChange={e => setIndustry(e.target.value)} placeholder="输入行业"  data-qoder-id="qel-input-f57e35df" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-input-f57e35df&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CreateCustomerModal&quot;,&quot;elementRole&quot;:&quot;input&quot;,&quot;loc&quot;:{&quot;line&quot;:548,&quot;column&quot;:13}}"/>
          </div>
          <div data-qoder-id="qel-div-8c167f78" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-8c167f78&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CreateCustomerModal&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:550,&quot;column&quot;:11}}">
            <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, display: 'block' }} data-qoder-id="qel-label-448fcade" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-label-448fcade&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CreateCustomerModal&quot;,&quot;elementRole&quot;:&quot;label&quot;,&quot;loc&quot;:{&quot;line&quot;:551,&quot;column&quot;:13}}">优先级</label>
            <select style={inputStyle} value={color} onChange={e => setColor(e.target.value as any)} data-qoder-id="qel-select-3d254e59" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-select-3d254e59&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CreateCustomerModal&quot;,&quot;elementRole&quot;:&quot;select&quot;,&quot;loc&quot;:{&quot;line&quot;:552,&quot;column&quot;:13}}">
              <option value="red" data-qoder-id="qel-option-5606e06a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-option-5606e06a&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CreateCustomerModal&quot;,&quot;elementRole&quot;:&quot;option&quot;,&quot;loc&quot;:{&quot;line&quot;:553,&quot;column&quot;:15}}">A类 · 重点攻坚</option>
              <option value="orange" data-qoder-id="qel-option-5706e1fd" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-option-5706e1fd&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CreateCustomerModal&quot;,&quot;elementRole&quot;:&quot;option&quot;,&quot;loc&quot;:{&quot;line&quot;:554,&quot;column&quot;:15}}">B类 · 稳步推进</option>
              <option value="green" data-qoder-id="qel-option-5006d6f8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-option-5006d6f8&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CreateCustomerModal&quot;,&quot;elementRole&quot;:&quot;option&quot;,&quot;loc&quot;:{&quot;line&quot;:555,&quot;column&quot;:15}}">C类 · 培育拓展</option>
              <option value="gray" data-qoder-id="qel-option-5106d88b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-option-5106d88b&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CreateCustomerModal&quot;,&quot;elementRole&quot;:&quot;option&quot;,&quot;loc&quot;:{&quot;line&quot;:556,&quot;column&quot;:15}}">D类 · 观察维护</option>
            </select>
          </div>
          <div data-qoder-id="qel-div-19138bd8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-19138bd8&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CreateCustomerModal&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:559,&quot;column&quot;:11}}">
            <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, display: 'block' }} data-qoder-id="qel-label-478fcf97" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-label-478fcf97&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CreateCustomerModal&quot;,&quot;elementRole&quot;:&quot;label&quot;,&quot;loc&quot;:{&quot;line&quot;:560,&quot;column&quot;:13}}">竞品</label>
            <input style={inputStyle} value={comp} onChange={e => setComp(e.target.value)} placeholder="输入竞品名称"  data-qoder-id="qel-input-ef7bedd6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-input-ef7bedd6&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CreateCustomerModal&quot;,&quot;elementRole&quot;:&quot;input&quot;,&quot;loc&quot;:{&quot;line&quot;:561,&quot;column&quot;:13}}"/>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }} data-qoder-id="qel-div-18138a45" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-18138a45&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CreateCustomerModal&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:564,&quot;column&quot;:9}}">
          <Button variant="outline" onClick={onClose} data-qoder-id="qel-button-c3ecf4b5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-c3ecf4b5&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CreateCustomerModal&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:565,&quot;column&quot;:11}}">取消</Button>
          <Button variant="default" onClick={handleSubmit} disabled={saving || !name.trim()} data-qoder-id="qel-button-c2ecf322" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-c2ecf322&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CreateCustomerModal&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:566,&quot;column&quot;:11}}">
            {saving ? '创建中...' : '创建'}
          </Button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════ PAGE 2: CUSTOMERS ═════════════════════ */
function CustomersPage({ customers, custLoading, custError, onRetry, onCustClick, onReload }: {
  customers: Customer[]; custLoading: boolean; custError: string | null; onRetry: () => void;
  onCustClick: (id: string) => void; onReload: () => void;
}) {
  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<'priority' | 'industry' | 'lastVisit' | 'revenue'>('priority')
  const custs = customers.filter(c => !c.isGroup)
  const order = { red: 0, orange: 1, green: 2, gray: 3 }

  const sorted = useMemo(() => {
    const list = search ? custs.filter(c =>
      (c.name + (c.industry || '') + (c.comp || '')).toLowerCase().includes(search.toLowerCase())
    ) : [...custs]
    return list.sort((a, b) => {
      if (sort === 'industry') return (a.industry || '').localeCompare(b.industry || '') || order[a.color] - order[b.color]
      if (sort === 'lastVisit') {
        const da = a.lastVisit ? daysSince(a.lastVisit) : 999
        const db = b.lastVisit ? daysSince(b.lastVisit) : 999
        return da - db || order[a.color] - order[b.color]
      }
      if (sort === 'revenue') return (b.salesData?.CY_YTD || 0) - (a.salesData?.CY_YTD || 0)
      return order[a.color] - order[b.color]
    })
  }, [search, sort])

  return (
    <>
      <div className="page-header" data-qoder-id="qel-page-header-8c7c8528" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-page-header-8c7c8528&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomersPage&quot;,&quot;elementRole&quot;:&quot;page-header&quot;,&quot;loc&quot;:{&quot;line&quot;:481,&quot;column&quot;:7}}">
        <h1 className="page-title" data-qoder-id="qel-page-title-f3415d94" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-page-title-f3415d94&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomersPage&quot;,&quot;elementRole&quot;:&quot;page-title&quot;,&quot;loc&quot;:{&quot;line&quot;:482,&quot;column&quot;:9}}">客户管理</h1>
        <p className="page-subtitle" data-qoder-id="qel-page-subtitle-856c7360" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-page-subtitle-856c7360&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomersPage&quot;,&quot;elementRole&quot;:&quot;page-subtitle&quot;,&quot;loc&quot;:{&quot;line&quot;:483,&quot;column&quot;:9}}">{sorted.length} 个客户 · 按{
          { priority: '优先级', industry: '行业', lastVisit: '最近拜访', revenue: '营收' }[sort]
        }排序</p>
      </div>
      <DataState loading={custLoading} error={custError} onRetry={onRetry} data-qoder-id="qel-datastate-7b14dc1b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-datastate-7b14dc1b&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomersPage&quot;,&quot;elementRole&quot;:&quot;datastate&quot;,&quot;loc&quot;:{&quot;line&quot;:487,&quot;column&quot;:7}}">
      <div className="page-body" data-qoder-id="qel-page-body-36b0eda1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-page-body-36b0eda1&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomersPage&quot;,&quot;elementRole&quot;:&quot;page-body&quot;,&quot;loc&quot;:{&quot;line&quot;:488,&quot;column&quot;:7}}">
        {/* Search + Sort */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 28 }} data-qoder-id="qel-div-adb89643" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-adb89643&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomersPage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:307,&quot;column&quot;:9}}">
          <div style={{ position: 'relative', flex: 1, maxWidth: 400 }} data-qoder-id="qel-div-aeb897d6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-aeb897d6&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomersPage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:308,&quot;column&quot;:11}}">
            <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-muted)' }}  data-qoder-id="qel-search-74423b89" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-search-74423b89&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomersPage&quot;,&quot;elementRole&quot;:&quot;search&quot;,&quot;loc&quot;:{&quot;line&quot;:309,&quot;column&quot;:13}}"/>
            <input className="search-input" placeholder="搜索客户..." value={search} onChange={e => setSearch(e.target.value)}  data-qoder-id="qel-search-input-e10f1eb3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-search-input-e10f1eb3&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomersPage&quot;,&quot;elementRole&quot;:&quot;search-input&quot;,&quot;loc&quot;:{&quot;line&quot;:310,&quot;column&quot;:13}}"/>
          </div>
          {search && <Button variant="ghost" size="sm" onClick={() => setSearch('')} data-qoder-id="qel-button-7695e267" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-7695e267&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomersPage&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:312,&quot;column&quot;:22}}">清除</Button>}
          <Button variant="outline" size="sm" onClick={() => setShowCreate(true)} data-qoder-id="qel-button-7da7368d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-7da7368d&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomersPage&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:619,&quot;column&quot;:11}}"><Plus size={14}  data-qoder-id="qel-plus-ac480452" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-plus-ac480452&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomersPage&quot;,&quot;elementRole&quot;:&quot;plus&quot;,&quot;loc&quot;:{&quot;line&quot;:619,&quot;column&quot;:83}}"/></Button>
          <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }} data-qoder-id="qel-div-b2b89e22" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-b2b89e22&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomersPage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:313,&quot;column&quot;:11}}">
            {(['priority', 'industry', 'lastVisit', 'revenue'] as const).map(s => (
              <Button key={s} variant={sort === s ? 'default' : 'ghost'} size="sm"
                onClick={() => setSort(s)} data-qoder-id="qel-button-7895e58d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-7895e58d&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomersPage&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:315,&quot;column&quot;:15}}">
                {{ priority: '优先级', industry: '行业', lastVisit: '拜访', revenue: '营收' }[s]}
              </Button>
            ))}
          </div>
        </div>

        {/* Customer Grid */}
        {sorted.length === 0 && <EmptyState icon={<Users size={20} />} message={search ? `未找到匹配"${search}"的客户` : '暂无客户数据'} hint={search ? '尝试更换关键词' : '请先添加客户'}  data-qoder-id="qel-emptystate-0a362379" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-emptystate-0a362379&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomersPage&quot;,&quot;elementRole&quot;:&quot;emptystate&quot;,&quot;loc&quot;:{&quot;line&quot;:507,&quot;column&quot;:33}}"/>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }} data-qoder-id="qel-div-b4b8a148" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-b4b8a148&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomersPage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:324,&quot;column&quot;:9}}">
          {sorted.map((c, i) => {
            const d = c.lastVisit ? daysSince(c.lastVisit) : 999
            return (
              <motion.div
                key={c.id}
                className="card-clickable"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.2 }}
                onClick={() => onCustClick(c.id)}
               data-qoder-id="qel-card-clickable-cc54b199" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-card-clickable-cc54b199&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomersPage&quot;,&quot;elementRole&quot;:&quot;card-clickable&quot;,&quot;loc&quot;:{&quot;line&quot;:328,&quot;column&quot;:15}}">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }} data-qoder-id="qel-div-b2badcb9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-b2badcb9&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomersPage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:336,&quot;column&quot;:17}}">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} data-qoder-id="qel-div-b1badb26" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-b1badb26&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomersPage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:337,&quot;column&quot;:19}}">
                    <div className="dot" style={{ background: colorHex(c.color) }}  data-qoder-id="qel-dot-d4443acf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-dot-d4443acf&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomersPage&quot;,&quot;elementRole&quot;:&quot;dot&quot;,&quot;loc&quot;:{&quot;line&quot;:338,&quot;column&quot;:21}}"/>
                    <span style={{ fontSize: 14, fontWeight: 600 }} data-qoder-id="qel-span-e30b197c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-e30b197c&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomersPage&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:339,&quot;column&quot;:21}}">{c.name}</span>
                  </div>
                  <span className={cn('badge', `badge-${c.color}`)} style={{ fontSize: 10 }} data-qoder-id="qel-span-e20b17e9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-e20b17e9&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomersPage&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:341,&quot;column&quot;:19}}">
                    {priorityLabel(c.color)}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--fg-tertiary)', marginBottom: 12 }} data-qoder-id="qel-div-b5bae172" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-b5bae172&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomersPage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:345,&quot;column&quot;:17}}">
                  {c.industry || '未分类'}{c.comp ? ` · 对手: ${c.comp}` : ''}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--fg-secondary)' }} data-qoder-id="qel-div-b4badfdf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-b4badfdf&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomersPage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:348,&quot;column&quot;:17}}">
                  <span data-qoder-id="qel-span-df0b1330" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-df0b1330&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomersPage&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:349,&quot;column&quot;:19}}">CY: {fmtK(c.salesData?.CY_YTD || 0)}</span>
                  <span data-qoder-id="qel-span-ee0b2acd" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-ee0b2acd&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomersPage&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:350,&quot;column&quot;:19}}">{c.pipeline?.length || 0} 商机</span>
                  <span data-qoder-id="qel-span-ed0b293a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-ed0b293a&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomersPage&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:351,&quot;column&quot;:19}}">{d === 999 ? '未拜访' : `${d}天前拜访`}</span>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
      </DataState>
      {showCreate && <CreateCustomerModal onClose={() => setShowCreate(false)} onCreated={() => { onReload(); setShowCreate(false) }}  data-qoder-id="qel-createcustomermodal-bfcd09eb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-createcustomermodal-bfcd09eb&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomersPage&quot;,&quot;elementRole&quot;:&quot;createcustomermodal&quot;,&quot;loc&quot;:{&quot;line&quot;:667,&quot;column&quot;:22}}"/>}
    </>
  )
}

/* ════════════════════ CUSTOMER DETAIL MODAL ════════════════════ */
function CustomerDetailModal({ id, customers, onClose, onReload }: { id: string; customers: Customer[]; onClose: () => void; onReload: () => void }) {
  const c = customers.find(x => x.id === id)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editIndustry, setEditIndustry] = useState('')
  const [editingContactId, setEditingContactId] = useState<number | null>(null)
  const [editCName, setEditCName] = useState('')
  const [editCRole, setEditCRole] = useState('')
  const [editCPhone, setEditCPhone] = useState('')
  const [editCEmail, setEditCEmail] = useState('')
  const [addingContact, setAddingContact] = useState(false)
  const [newCName, setNewCName] = useState('')
  const [newCRole, setNewCRole] = useState('')
  const [newCPhone, setNewCPhone] = useState('')
  const [newCEmail, setNewCEmail] = useState('')

  if (!c) return null
  const sd = c.salesData || {}
  const cy = sd.CY_YTD || 0
  const py = sd.PY_YTD || sd.PY || 0
  const growth = py > 0 ? Math.round((cy - py) / py * 100) : cy > 0 ? 999 : 0
  const gStr = growth === 999 ? 'NEW' : growth >= 0 ? `+${growth}%` : `${growth}%`

  const handleSave = async () => {
    try {
      await api.updateCustomer(c.id, { name: editName, industry: editIndustry })
      onReload()
      setEditing(false)
    } catch (e) { console.error('Failed to update customer:', e) }
  }

  const handleDelete = async () => {
    if (!confirm('确认删除客户 ' + c.name + '？')) return
    try {
      await api.deleteCustomer(c.id)
      onReload()
      onClose()
    } catch (e) { console.error('Failed to delete customer:', e) }
  }

  const startEdit = () => { setEditName(c.name); setEditIndustry(c.industry); setEditing(true) }

  const startEditContact = (p: KeyPerson) => {
    setEditingContactId(p.id ?? null)
    setEditCName(p.name); setEditCRole(p.role); setEditCPhone(p.phone || ''); setEditCEmail(p.email || '')
  }

  const handleUpdateContact = async (contactId: number) => {
    try {
      await api.updateContact(c.id, contactId, { name: editCName, role: editCRole, phone: editCPhone, email: editCEmail })
      onReload(); setEditingContactId(null)
    } catch (e) { console.error('Failed to update contact:', e) }
  }

  const handleDeleteContact = async (contactId: number) => {
    try { await api.deleteContact(c.id, contactId); onReload() }
    catch (e) { console.error('Failed to delete contact:', e) }
  }

  const handleAddContact = async () => {
    if (!newCName.trim()) return
    try {
      await api.addContact(c.id, { name: newCName, role: newCRole, phone: newCPhone, email: newCEmail })
      onReload(); setAddingContact(false); setNewCName(''); setNewCRole(''); setNewCPhone(''); setNewCEmail('')
    } catch (e) { console.error('Failed to add contact:', e) }
  }

  const inlineInputStyle: React.CSSProperties = {
    padding: '4px 8px', fontSize: 13, fontFamily: 'var(--font-sans)',
    color: 'var(--fg)', background: 'var(--bg-input)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-xs)', outline: 'none', flex: 1, minWidth: 0,
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }} data-qoder-id="qel-modal-overlay-761208de" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-modal-overlay-761208de&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;modal-overlay&quot;,&quot;loc&quot;:{&quot;line&quot;:747,&quot;column&quot;:5}}">
      <div className="modal-panel" data-qoder-id="qel-modal-panel-bccbc0d7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-modal-panel-bccbc0d7&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;modal-panel&quot;,&quot;loc&quot;:{&quot;line&quot;:748,&quot;column&quot;:7}}">
        <div className="modal-header" data-qoder-id="qel-modal-header-f028ef7d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-modal-header-f028ef7d&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;modal-header&quot;,&quot;loc&quot;:{&quot;line&quot;:749,&quot;column&quot;:9}}">
          <div data-qoder-id="qel-div-e77e5cc8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-e77e5cc8&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:750,&quot;column&quot;:11}}">
            <h2 className="modal-title" data-qoder-id="qel-modal-title-1c8891ff" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-modal-title-1c8891ff&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;modal-title&quot;,&quot;loc&quot;:{&quot;line&quot;:751,&quot;column&quot;:13}}">{c.name}</h2>
            <div style={{ fontSize: 13, color: 'var(--fg-secondary)', marginTop: 4 }} data-qoder-id="qel-div-ed7e663a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-ed7e663a&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:752,&quot;column&quot;:13}}">
              {c.industry}{c.comp ? ` · 竞品: ${c.comp}` : ''}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4 }} data-qoder-id="qel-div-ec7e64a7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-ec7e64a7&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:756,&quot;column&quot;:11}}">
            <Button variant="ghost" size="icon" onClick={() => editing ? handleSave() : startEdit()} data-qoder-id="qel-button-855353dc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-855353dc&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:757,&quot;column&quot;:13}}">
              {editing ? <CheckSquare size={18}  data-qoder-id="qel-checksquare-db22a98d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-checksquare-db22a98d&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;checksquare&quot;,&quot;loc&quot;:{&quot;line&quot;:758,&quot;column&quot;:26}}"/> : <Edit3 size={18}  data-qoder-id="qel-edit3-c670af72" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-edit3-c670af72&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;edit3&quot;,&quot;loc&quot;:{&quot;line&quot;:758,&quot;column&quot;:54}}"/>}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleDelete} data-qoder-id="qel-button-4b18c509" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-4b18c509&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:760,&quot;column&quot;:13}}"><Trash2 size={18}  data-qoder-id="qel-trash2-b2e9ffae" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-trash2-b2e9ffae&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;trash2&quot;,&quot;loc&quot;:{&quot;line&quot;:760,&quot;column&quot;:72}}"/></Button>
            <Button variant="ghost" size="icon" onClick={onClose} data-qoder-id="qel-button-4918c1e3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-4918c1e3&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:761,&quot;column&quot;:13}}"><X size={18}  data-qoder-id="qel-x-6e5388dc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-x-6e5388dc&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;x&quot;,&quot;loc&quot;:{&quot;line&quot;:761,&quot;column&quot;:67}}"/></Button>
          </div>
        </div>

        {/* Basic Info */}
        <Section title="基本信息" data-qoder-id="qel-section-d8aa3bd5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-section-d8aa3bd5&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;section&quot;,&quot;loc&quot;:{&quot;line&quot;:766,&quot;column&quot;:9}}">
          <div className="detail-grid" data-qoder-id="qel-detail-grid-dd852b61" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-detail-grid-dd852b61&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;detail-grid&quot;,&quot;loc&quot;:{&quot;line&quot;:767,&quot;column&quot;:11}}">
            <div data-qoder-id="qel-div-336bb057" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-336bb057&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:768,&quot;column&quot;:13}}"><div className="detail-label" data-qoder-id="qel-detail-label-a5bb3151" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-detail-label-a5bb3151&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;detail-label&quot;,&quot;loc&quot;:{&quot;line&quot;:768,&quot;column&quot;:18}}">优先级</div><span className={cn('badge', `badge-${c.color}`)} data-qoder-id="qel-span-3679ffb5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-3679ffb5&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:768,&quot;column&quot;:57}}">{priorityLabel(c.color)}</span></div>
            {editing ? (
              <>
                <div data-qoder-id="qel-div-286b9f06" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-286b9f06&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:771,&quot;column&quot;:17}}">
                  <div className="detail-label" data-qoder-id="qel-detail-label-2cbe446d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-detail-label-2cbe446d&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;detail-label&quot;,&quot;loc&quot;:{&quot;line&quot;:772,&quot;column&quot;:19}}">名称</div>
                  <input style={inlineInputStyle} value={editName} onChange={e => setEditName(e.target.value)}  data-qoder-id="qel-input-be5c9d7f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-input-be5c9d7f&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;input&quot;,&quot;loc&quot;:{&quot;line&quot;:773,&quot;column&quot;:19}}"/>
                </div>
                <div data-qoder-id="qel-div-2d69684e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-2d69684e&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:775,&quot;column&quot;:17}}">
                  <div className="detail-label" data-qoder-id="qel-detail-label-29be3fb4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-detail-label-29be3fb4&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;detail-label&quot;,&quot;loc&quot;:{&quot;line&quot;:776,&quot;column&quot;:19}}">行业</div>
                  <input style={inlineInputStyle} value={editIndustry} onChange={e => setEditIndustry(e.target.value)}  data-qoder-id="qel-input-b95c95a0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-input-b95c95a0&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;input&quot;,&quot;loc&quot;:{&quot;line&quot;:777,&quot;column&quot;:19}}"/>
                </div>
              </>
            ) : (
              <div data-qoder-id="qel-div-30696d07" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-30696d07&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:781,&quot;column&quot;:15}}"><div className="detail-label" data-qoder-id="qel-detail-label-26be3afb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-detail-label-26be3afb&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;detail-label&quot;,&quot;loc&quot;:{&quot;line&quot;:781,&quot;column&quot;:20}}">行业</div><div className="detail-value" data-qoder-id="qel-detail-value-37637abf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-detail-value-37637abf&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;detail-value&quot;,&quot;loc&quot;:{&quot;line&quot;:781,&quot;column&quot;:58}}">{c.industry}</div></div>
            )}
            <div data-qoder-id="qel-div-23695890" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-23695890&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:783,&quot;column&quot;:13}}"><div className="detail-label" data-qoder-id="qel-detail-label-23be3642" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-detail-label-23be3642&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;detail-label&quot;,&quot;loc&quot;:{&quot;line&quot;:783,&quot;column&quot;:18}}">上次拜访</div><div className="detail-value" data-qoder-id="qel-detail-value-ce6096dd" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-detail-value-ce6096dd&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;detail-value&quot;,&quot;loc&quot;:{&quot;line&quot;:783,&quot;column&quot;:58}}">{c.lastVisit ? `${c.lastVisit} (${daysSince(c.lastVisit)}天前)` : '未拜访'}</div></div>
            {c.nextYear && <div data-qoder-id="qel-div-9c70d2d0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-9c70d2d0&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:784,&quot;column&quot;:28}}"><div className="detail-label" data-qoder-id="qel-detail-label-10c056f0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-detail-label-10c056f0&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;detail-label&quot;,&quot;loc&quot;:{&quot;line&quot;:784,&quot;column&quot;:33}}">明年预期</div><div className="detail-value" data-qoder-id="qel-detail-value-cb609224" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-detail-value-cb609224&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;detail-value&quot;,&quot;loc&quot;:{&quot;line&quot;:784,&quot;column&quot;:73}}">{c.nextYear}</div></div>}
          </div>
          {editing && (
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }} data-qoder-id="qel-div-a170daaf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-a170daaf&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:787,&quot;column&quot;:13}}">
              <Button variant="default" size="sm" onClick={handleSave} data-qoder-id="qel-button-5a1d59d4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-5a1d59d4&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:788,&quot;column&quot;:15}}">保存</Button>
              <Button variant="outline" size="sm" onClick={() => setEditing(false)} data-qoder-id="qel-button-5d1d5e8d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-5d1d5e8d&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:789,&quot;column&quot;:15}}">取消</Button>
            </div>
          )}
        </Section>

        {/* Sales Data */}
        <Section title="销售数据" data-qoder-id="qel-section-e5aecd7a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-section-e5aecd7a&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;section&quot;,&quot;loc&quot;:{&quot;line&quot;:795,&quot;column&quot;:9}}">
          <div className="detail-grid" data-qoder-id="qel-detail-grid-4c7fc9f0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-detail-grid-4c7fc9f0&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;detail-grid&quot;,&quot;loc&quot;:{&quot;line&quot;:796,&quot;column&quot;:11}}">
            <div data-qoder-id="qel-div-a470df68" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-a470df68&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:797,&quot;column&quot;:13}}"><div className="detail-label" data-qoder-id="qel-detail-label-18c2a21f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-detail-label-18c2a21f&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;detail-label&quot;,&quot;loc&quot;:{&quot;line&quot;:797,&quot;column&quot;:18}}">CY YTD</div><div className="detail-value" style={{ fontSize: 20, fontWeight: 700 }} data-qoder-id="qel-detail-value-c95e5067" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-detail-value-c95e5067&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;detail-value&quot;,&quot;loc&quot;:{&quot;line&quot;:797,&quot;column&quot;:60}}">{fmtK(cy)}</div></div>
            <div data-qoder-id="qel-div-356df214" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-356df214&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:798,&quot;column&quot;:13}}"><div className="detail-label" data-qoder-id="qel-detail-label-19c2a3b2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-detail-label-19c2a3b2&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;detail-label&quot;,&quot;loc&quot;:{&quot;line&quot;:798,&quot;column&quot;:18}}">PY YTD</div><div className="detail-value" data-qoder-id="qel-detail-value-c45e4888" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-detail-value-c45e4888&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;detail-value&quot;,&quot;loc&quot;:{&quot;line&quot;:798,&quot;column&quot;:60}}">{fmtK(py)}</div></div>
            <div data-qoder-id="qel-div-346df081" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-346df081&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:799,&quot;column&quot;:13}}"><div className="detail-label" data-qoder-id="qel-detail-label-16c29ef9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-detail-label-16c29ef9&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;detail-label&quot;,&quot;loc&quot;:{&quot;line&quot;:799,&quot;column&quot;:18}}">同比增长</div><div className="detail-value" style={{ color: growth >= 0 ? 'var(--status-success)' : 'var(--status-danger)', fontWeight: 600 }} data-qoder-id="qel-detail-value-c75e4d41" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-detail-value-c75e4d41&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;detail-value&quot;,&quot;loc&quot;:{&quot;line&quot;:799,&quot;column&quot;:58}}">{gStr}</div></div>
            {sd.CY_P8 ? <div data-qoder-id="qel-div-2f6de8a2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-2f6de8a2&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:800,&quot;column&quot;:25}}"><div className="detail-label" data-qoder-id="qel-detail-label-1fc2ad24" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-detail-label-1fc2ad24&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;detail-label&quot;,&quot;loc&quot;:{&quot;line&quot;:800,&quot;column&quot;:30}}">P8 预测</div><div className="detail-value" style={{ color: 'var(--accent)', fontWeight: 600 }} data-qoder-id="qel-detail-value-c25c06cb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-detail-value-c25c06cb&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;detail-value&quot;,&quot;loc&quot;:{&quot;line&quot;:800,&quot;column&quot;:71}}">{fmtK(sd.CY_P8)}</div></div> : null}
          </div>
        </Section>

        {/* Key Persons with CRUD */}
        <Section title="关键联系人" data-qoder-id="qel-section-6bb41d9a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-section-6bb41d9a&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;section&quot;,&quot;loc&quot;:{&quot;line&quot;:805,&quot;column&quot;:9}}">
          {(c.keyPersons || []).map((p, i) => (
            <div key={p.id ?? i} style={{ marginBottom: 6 }} data-qoder-id="qel-div-a775614f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-a775614f&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:807,&quot;column&quot;:13}}">
              {editingContactId === p.id ? (
                <div style={{ padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: 6 }} data-qoder-id="qel-div-a6755fbc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-a6755fbc&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:809,&quot;column&quot;:17}}">
                  <div style={{ display: 'flex', gap: 6 }} data-qoder-id="qel-div-a5755e29" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-a5755e29&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:810,&quot;column&quot;:19}}">
                    <input style={inlineInputStyle} value={editCName} onChange={e => setEditCName(e.target.value)} placeholder="姓名"  data-qoder-id="qel-input-4e55316a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-input-4e55316a&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;input&quot;,&quot;loc&quot;:{&quot;line&quot;:811,&quot;column&quot;:21}}"/>
                    <input style={inlineInputStyle} value={editCRole} onChange={e => setEditCRole(e.target.value)} placeholder="职位"  data-qoder-id="qel-input-4d552fd7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-input-4d552fd7&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;input&quot;,&quot;loc&quot;:{&quot;line&quot;:812,&quot;column&quot;:21}}"/>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }} data-qoder-id="qel-div-a2755970" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-a2755970&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:814,&quot;column&quot;:19}}">
                    <input style={inlineInputStyle} value={editCPhone} onChange={e => setEditCPhone(e.target.value)} placeholder="电话"  data-qoder-id="qel-input-43552019" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-input-43552019&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;input&quot;,&quot;loc&quot;:{&quot;line&quot;:815,&quot;column&quot;:21}}"/>
                    <input style={inlineInputStyle} value={editCEmail} onChange={e => setEditCEmail(e.target.value)} placeholder="邮箱"  data-qoder-id="qel-input-42551e86" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-input-42551e86&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;input&quot;,&quot;loc&quot;:{&quot;line&quot;:816,&quot;column&quot;:21}}"/>
                  </div>
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }} data-qoder-id="qel-div-a3731c6c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-a3731c6c&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:818,&quot;column&quot;:19}}">
                    <Button variant="default" size="sm" onClick={() => handleUpdateContact(p.id!)} data-qoder-id="qel-button-5e1f9eb7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-5e1f9eb7&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:819,&quot;column&quot;:21}}">保存</Button>
                    <Button variant="outline" size="sm" onClick={() => setEditingContactId(null)} data-qoder-id="qel-button-5f1fa04a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-5f1fa04a&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:820,&quot;column&quot;:21}}">取消</Button>
                  </div>
                </div>
              ) : (
                <div className="person-row" data-qoder-id="qel-person-row-891a8f92" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-person-row-891a8f92&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;person-row&quot;,&quot;loc&quot;:{&quot;line&quot;:824,&quot;column&quot;:17}}">
                  <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: 'var(--accent)' }} data-qoder-id="qel-div-9f731620" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-9f731620&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:825,&quot;column&quot;:19}}">
                    {p.name.slice(0, 1)}
                  </div>
                  <div style={{ flex: 1 }} data-qoder-id="qel-div-a07317b3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-a07317b3&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:828,&quot;column&quot;:19}}">
                    <div style={{ fontSize: 13, fontWeight: 550 }} data-qoder-id="qel-div-a1731946" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-a1731946&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:829,&quot;column&quot;:21}}">{p.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--fg-tertiary)' }} data-qoder-id="qel-div-a2731ad9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-a2731ad9&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:830,&quot;column&quot;:21}}">{p.role}{p.phone ? ` · ${p.phone}` : ''}{p.email ? ` · ${p.email}` : ''}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 2 }} data-qoder-id="qel-div-ab732904" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-ab732904&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:832,&quot;column&quot;:19}}">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star key={s} size={12} style={{ color: s < p.stars ? 'var(--status-warning)' : 'var(--border)', fill: s < p.stars ? 'var(--status-warning)' : 'transparent' }}  data-qoder-id="qel-star-165b90a3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-star-165b90a3&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;star&quot;,&quot;loc&quot;:{&quot;line&quot;:834,&quot;column&quot;:23}}"/>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 2 }} data-qoder-id="qel-div-357abe07" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-357abe07&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:837,&quot;column&quot;:19}}">
                    <Button variant="ghost" size="icon" onClick={() => startEditContact(p)} data-qoder-id="qel-button-ce270acc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-ce270acc&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:838,&quot;column&quot;:21}}"><Edit3 size={14}  data-qoder-id="qel-edit3-8c31a371" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-edit3-8c31a371&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;edit3&quot;,&quot;loc&quot;:{&quot;line&quot;:838,&quot;column&quot;:93}}"/></Button>
                    {p.id != null && <Button variant="ghost" size="icon" onClick={() => handleDeleteContact(p.id!)} data-qoder-id="qel-button-d0270df2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-d0270df2&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:839,&quot;column&quot;:38}}"><Trash2 size={14}  data-qoder-id="qel-trash2-b3f90bcb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-trash2-b3f90bcb&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;trash2&quot;,&quot;loc&quot;:{&quot;line&quot;:839,&quot;column&quot;:117}}"/></Button>}
                  </div>
                </div>
              )}
            </div>
          ))}
          {/* Add contact form */}
          {addingContact ? (
            <div style={{ padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }} data-qoder-id="qel-div-307ab628" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-307ab628&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:847,&quot;column&quot;:13}}">
              <div style={{ display: 'flex', gap: 6 }} data-qoder-id="qel-div-337abae1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-337abae1&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:848,&quot;column&quot;:15}}">
                <input style={inlineInputStyle} value={newCName} onChange={e => setNewCName(e.target.value)} placeholder="姓名"  data-qoder-id="qel-input-bc5a5bc2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-input-bc5a5bc2&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;input&quot;,&quot;loc&quot;:{&quot;line&quot;:849,&quot;column&quot;:17}}"/>
                <input style={inlineInputStyle} value={newCRole} onChange={e => setNewCRole(e.target.value)} placeholder="职位"  data-qoder-id="qel-input-bf5a607b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-input-bf5a607b&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;input&quot;,&quot;loc&quot;:{&quot;line&quot;:850,&quot;column&quot;:17}}"/>
              </div>
              <div style={{ display: 'flex', gap: 6 }} data-qoder-id="qel-div-2c7aafdc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-2c7aafdc&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:852,&quot;column&quot;:15}}">
                <input style={inlineInputStyle} value={newCPhone} onChange={e => setNewCPhone(e.target.value)} placeholder="电话"  data-qoder-id="qel-input-515774ba" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-input-515774ba&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;input&quot;,&quot;loc&quot;:{&quot;line&quot;:853,&quot;column&quot;:17}}"/>
                <input style={inlineInputStyle} value={newCEmail} onChange={e => setNewCEmail(e.target.value)} placeholder="邮箱"  data-qoder-id="qel-input-5257764d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-input-5257764d&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;input&quot;,&quot;loc&quot;:{&quot;line&quot;:854,&quot;column&quot;:17}}"/>
              </div>
              <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }} data-qoder-id="qel-div-ad77a958" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-ad77a958&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:856,&quot;column&quot;:15}}">
                <Button variant="default" size="sm" onClick={handleAddContact} data-qoder-id="qel-button-c824c2c3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-c824c2c3&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:857,&quot;column&quot;:17}}">添加</Button>
                <Button variant="outline" size="sm" onClick={() => setAddingContact(false)} data-qoder-id="qel-button-cd24caa2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-cd24caa2&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:858,&quot;column&quot;:17}}">取消</Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setAddingContact(true)} style={{ marginTop: 8, width: '100%' }} data-qoder-id="qel-button-ce24cc35" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-ce24cc35&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:862,&quot;column&quot;:13}}">
              <Plus size={14}  data-qoder-id="qel-plus-fbafaa94" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-plus-fbafaa94&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;plus&quot;,&quot;loc&quot;:{&quot;line&quot;:863,&quot;column&quot;:15}}"/> 添加联系人
            </Button>
          )}
        </Section>

        {/* Pipeline */}
        {c.pipeline?.length > 0 && (
          <Section title="商机" data-qoder-id="qel-section-55b6398f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-section-55b6398f&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;section&quot;,&quot;loc&quot;:{&quot;line&quot;:870,&quot;column&quot;:11}}">
            {c.pipeline.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', marginBottom: 6, borderLeft: `3px solid ${PIPE_STAGES.find(s => s.num === p.pipeStage)?.color || 'var(--accent)'}` }} data-qoder-id="qel-div-a7779fe6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-a7779fe6&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:872,&quot;column&quot;:15}}">
                <div style={{ flex: 1 }} data-qoder-id="qel-div-a877a179" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-a877a179&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:873,&quot;column&quot;:17}}">
                  <div style={{ fontSize: 13, fontWeight: 550 }} data-qoder-id="qel-div-21580c49" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-21580c49&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:874,&quot;column&quot;:19}}">{p.name}</div>
                  {p.stage && <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', marginTop: 2 }} data-qoder-id="qel-div-20580ab6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-20580ab6&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:875,&quot;column&quot;:31}}">{p.stage}</div>}
                </div>
                {p.amount && <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }} data-qoder-id="qel-span-ac8e412f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-ac8e412f&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:877,&quot;column&quot;:30}}">{p.amount}</span>}
              </div>
            ))}
          </Section>
        )}

        {/* Next Actions */}
        {c.nextActions?.length > 0 && (
          <Section title="下一步行动" data-qoder-id="qel-section-e1bdd1b8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-section-e1bdd1b8&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;section&quot;,&quot;loc&quot;:{&quot;line&quot;:885,&quot;column&quot;:11}}">
            {c.nextActions.map((a, i) => (
              <div key={i} className="action-row" data-qoder-id="qel-action-row-1a92fa9d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-action-row-1a92fa9d&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;action-row&quot;,&quot;loc&quot;:{&quot;line&quot;:887,&quot;column&quot;:15}}">
                <Calendar size={14} style={{ color: 'var(--accent)', flexShrink: 0 }}  data-qoder-id="qel-calendar-d64f04f6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-calendar-d64f04f6&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;calendar&quot;,&quot;loc&quot;:{&quot;line&quot;:888,&quot;column&quot;:17}}"/>
                <span className="action-row-label" data-qoder-id="qel-action-row-label-5d577143" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-action-row-label-5d577143&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;action-row-label&quot;,&quot;loc&quot;:{&quot;line&quot;:889,&quot;column&quot;:17}}">{a.action}</span>
                <span className={a.deadline === '已过期' ? 'action-row-urgent' : 'action-row-meta'} data-qoder-id="qel-span-a78e3950" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-a78e3950&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:890,&quot;column&quot;:17}}">{a.deadline}</span>
              </div>
            ))}
          </Section>
        )}

        {/* Risk */}
        {c.risk && (
          <Section title="风险" data-qoder-id="qel-section-dcbdc9d9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-section-dcbdc9d9&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;section&quot;,&quot;loc&quot;:{&quot;line&quot;:898,&quot;column&quot;:11}}">
            <div className="risk-box" data-qoder-id="qel-risk-box-556c305a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-risk-box-556c305a&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;risk-box&quot;,&quot;loc&quot;:{&quot;line&quot;:899,&quot;column&quot;:13}}">{c.risk}</div>
          </Section>
        )}

        {/* AI Coach */}
        {c.talkStrategy && (
          <Section title="AI 策略建议" data-qoder-id="qel-section-debb8e68" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-section-debb8e68&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;section&quot;,&quot;loc&quot;:{&quot;line&quot;:905,&quot;column&quot;:11}}">
            <div style={{ padding: '16px 20px', background: 'var(--accent-bg)', borderRadius: 'var(--radius-sm)', fontSize: 13, lineHeight: 1.7, color: 'var(--fg-secondary)', borderLeft: '3px solid var(--accent)' }} data-qoder-id="qel-div-9c54fc53" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-9c54fc53&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:906,&quot;column&quot;:13}}">
              {c.talkStrategy}
            </div>
          </Section>
        )}

        {/* Talk Points */}
        {(c.talkPoints?.length ?? 0) > 0 && (
          <Section title="话术参考" data-qoder-id="qel-section-e0bb918e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-section-e0bb918e&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;section&quot;,&quot;loc&quot;:{&quot;line&quot;:914,&quot;column&quot;:11}}">
            {(c.talkPoints ?? []).map((tp, i) => (
              <div key={i} className="talk-point" style={{ '--tp-color': tp.color } as React.CSSProperties} data-qoder-id="qel-talk-point-87c7ccab" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-talk-point-87c7ccab&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;talk-point&quot;,&quot;loc&quot;:{&quot;line&quot;:916,&quot;column&quot;:15}}">
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }} data-qoder-id="qel-div-9f55010c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-9f55010c&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:917,&quot;column&quot;:17}}">{tp.title}</div>
                {tp.text}
              </div>
            ))}
          </Section>
        )}

        {/* AI Memory Foundation Panel (V26.06.06) */}
        <MemoryPanel customerId={c.id}  data-qoder-id="qel-memorypanel-566a2e6b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-memorypanel-566a2e6b&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CustomerDetailModal&quot;,&quot;elementRole&quot;:&quot;memorypanel&quot;,&quot;loc&quot;:{&quot;line&quot;:926,&quot;column&quot;:9}}"/>
      </div>
    </div>
  )
}

// ─── Memory Panel Component (V26.06.06) ──────────────────────
// Displays memory summary in customer detail modal

const MEMORY_TYPE_LABELS: Record<string, string> = {
  customer_profile: '客户画像',
  relationship: '联系人',
  project: '项目/商机',
  risk: '风险',
  competitor: '竞品',
  strategy: '策略',
  decision: '决策',
  meeting: '拜访记录',
  weekly: '周报',
  todo_context: '待办',
  sales_data: '销售数据',
  archive_raw: '原始档案',
};

const MEMORY_TYPE_COLORS: Record<string, string> = {
  customer_profile: 'var(--accent)',
  relationship: '#27ae60',
  project: '#e67e22',
  risk: '#e74c3c',
  competitor: '#9b59b6',
  strategy: '#2980b9',
  decision: '#f39c12',
  meeting: '#1abc9c',
  weekly: '#3498db',
  todo_context: '#95a5a6',
  sales_data: '#34495e',
  archive_raw: '#7f8c8d',
};

function MemoryPanel({ customerId }: { customerId: string }) {
  const [memories, setMemories] = useState<api.Memory[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [filterType, setFilterType] = useState('')
  const [allMemories, setAllMemories] = useState<api.Memory[]>([])
  const [allTotal, setAllTotal] = useState(0)

  // Load recent 5 memories
  useEffect(() => {
    setLoading(true)
    api.getMemories({ customerId, limit: 5 })
      .then(res => { setMemories(res.data); setTotal(res.total) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [customerId])

  // Load all memories when modal opens
  useEffect(() => {
    if (!showAll) return
    const params: any = { customerId, limit: 100 }
    if (filterType) params.memoryType = filterType
    api.getMemories(params)
      .then(res => { setAllMemories(res.data); setAllTotal(res.total) })
      .catch(() => {})
  }, [showAll, customerId, filterType])

  // Count by type
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const m of memories) {
      counts[m.memoryType] = (counts[m.memoryType] || 0) + 1
    }
    return counts
  }, [memories])

  if (loading) {
    return (
      <Section title="历史记忆 / AI地基" data-qoder-id="qel-section-6a1d265f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-section-6a1d265f&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;MemoryPanel&quot;,&quot;elementRole&quot;:&quot;section&quot;,&quot;loc&quot;:{&quot;line&quot;:1004,&quot;column&quot;:7}}">
        <div style={{ padding: '12px 16px', color: 'var(--fg-tertiary)', fontSize: 12 }} data-qoder-id="qel-div-a2887d64" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-a2887d64&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;MemoryPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1005,&quot;column&quot;:9}}">
          <Loader2 size={14} className="spin"  data-qoder-id="qel-spin-f04626b4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-spin-f04626b4&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;MemoryPanel&quot;,&quot;elementRole&quot;:&quot;spin&quot;,&quot;loc&quot;:{&quot;line&quot;:1006,&quot;column&quot;:11}}"/> 加载中...
        </div>
      </Section>
    )
  }

  if (total === 0) {
    return (
      <Section title="历史记忆 / AI地基" data-qoder-id="qel-section-6f1d2e3e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-section-6f1d2e3e&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;MemoryPanel&quot;,&quot;elementRole&quot;:&quot;section&quot;,&quot;loc&quot;:{&quot;line&quot;:1014,&quot;column&quot;:7}}">
        <div style={{ padding: '12px 16px', color: 'var(--fg-tertiary)', fontSize: 12 }} data-qoder-id="qel-div-0a09f90b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-0a09f90b&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;MemoryPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1015,&quot;column&quot;:9}}">
          <Database size={14} style={{ marginRight: 4, verticalAlign: 'middle' }}  data-qoder-id="qel-database-6b4aaf1a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-database-6b4aaf1a&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;MemoryPanel&quot;,&quot;elementRole&quot;:&quot;database&quot;,&quot;loc&quot;:{&quot;line&quot;:1016,&quot;column&quot;:11}}"/>
          该客户暂无记忆数据
        </div>
      </Section>
    )
  }

  return (
    <Section title="历史记忆 / AI地基" data-qoder-id="qel-section-52c67c89" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-section-52c67c89&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;MemoryPanel&quot;,&quot;elementRole&quot;:&quot;section&quot;,&quot;loc&quot;:{&quot;line&quot;:1024,&quot;column&quot;:5}}">
      {/* Summary bar */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10, padding: '0 2px' }} data-qoder-id="qel-div-0b09fa9e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-0b09fa9e&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;MemoryPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1026,&quot;column&quot;:7}}">
        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: 'var(--accent-bg)', color: 'var(--accent)', fontWeight: 600 }} data-qoder-id="qel-span-d4560403" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-d4560403&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;MemoryPanel&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:1027,&quot;column&quot;:9}}">
          共 {total} 条记忆
        </span>
        {Object.entries(typeCounts).slice(0, 5).map(([type, count]) => (
          <span key={type} style={{
            fontSize: 11, padding: '2px 8px', borderRadius: 10,
            background: `${MEMORY_TYPE_COLORS[type] || 'var(--fg-tertiary)'}15`,
            color: MEMORY_TYPE_COLORS[type] || 'var(--fg-tertiary)',
            fontWeight: 500,
          }} data-qoder-id="qel-span-d3560270" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-d3560270&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;MemoryPanel&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:1031,&quot;column&quot;:11}}">
            {MEMORY_TYPE_LABELS[type] || type} {count}
          </span>
        ))}
      </div>

      {/* Recent memories list */}
      {memories.map(m => (
        <div key={m.id} style={{
          padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)',
          marginBottom: 4, borderLeft: `3px solid ${MEMORY_TYPE_COLORS[m.memoryType] || 'var(--border)'}`,
          fontSize: 12, lineHeight: 1.5,
        }} data-qoder-id="qel-div-100a027d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-100a027d&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;MemoryPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1044,&quot;column&quot;:9}}">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }} data-qoder-id="qel-div-0f0a00ea" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-0f0a00ea&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;MemoryPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1049,&quot;column&quot;:11}}">
            <span style={{ fontSize: 10, fontWeight: 600, color: MEMORY_TYPE_COLORS[m.memoryType] || 'var(--fg-tertiary)', textTransform: 'uppercase' }} data-qoder-id="qel-span-e05616e7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-e05616e7&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;MemoryPanel&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:1050,&quot;column&quot;:13}}">
              {MEMORY_TYPE_LABELS[m.memoryType] || m.memoryType}
            </span>
            {m.importance >= 4 && <span style={{ fontSize: 9, color: '#e74c3c' }} data-qoder-id="qel-span-df561554" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-df561554&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;MemoryPanel&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:1053,&quot;column&quot;:35}}">●高重要</span>}
            {m.sourceFile && <span style={{ fontSize: 10, color: 'var(--fg-tertiary)', marginLeft: 'auto' }} data-qoder-id="qel-span-d253c246" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-d253c246&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;MemoryPanel&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:1054,&quot;column&quot;:30}}">{m.sourceFile}</span>}
          </div>
          <div style={{ color: 'var(--fg-primary)', fontWeight: 500 }} data-qoder-id="qel-div-0507b295" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-0507b295&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;MemoryPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1056,&quot;column&quot;:11}}">{m.title}</div>
          {m.content && m.content.length > 120 && (
            <div style={{ color: 'var(--fg-tertiary)', fontSize: 11, marginTop: 2 }} data-qoder-id="qel-div-0207addc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-0207addc&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;MemoryPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1058,&quot;column&quot;:13}}">
              {m.content.slice(0, 120)}...
            </div>
          )}
        </div>
      ))}

      {/* View all button */}
      {total > 5 && (
        <button onClick={() => setShowAll(!showAll)} style={{
          width: '100%', padding: '8px', marginTop: 6, border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)', background: 'transparent', color: 'var(--accent)',
          cursor: 'pointer', fontSize: 12, fontWeight: 500,
        }} data-qoder-id="qel-button-48f1c503" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-48f1c503&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;MemoryPanel&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:1067,&quot;column&quot;:9}}">
          {showAll ? '收起' : `查看全部 ${total} 条记忆`}
        </button>
      )}

      {/* Expanded view with filter */}
      {showAll && (
        <div style={{ marginTop: 8 }} data-qoder-id="qel-div-0007aab6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-0007aab6&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;MemoryPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1078,&quot;column&quot;:9}}">
          <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }} data-qoder-id="qel-div-0107ac49" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-0107ac49&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;MemoryPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1079,&quot;column&quot;:11}}">
            <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{
              fontSize: 11, padding: '3px 6px', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--fg-primary)',
            }} data-qoder-id="qel-select-f98a612c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-select-f98a612c&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;MemoryPanel&quot;,&quot;elementRole&quot;:&quot;select&quot;,&quot;loc&quot;:{&quot;line&quot;:1080,&quot;column&quot;:13}}">
              <option value="" data-qoder-id="qel-option-ee7f234d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-option-ee7f234d&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;MemoryPanel&quot;,&quot;elementRole&quot;:&quot;option&quot;,&quot;loc&quot;:{&quot;line&quot;:1084,&quot;column&quot;:15}}">全部类型</option>
              {Object.entries(MEMORY_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key} data-qoder-id="qel-option-df7f0bb0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-option-df7f0bb0&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;MemoryPanel&quot;,&quot;elementRole&quot;:&quot;option&quot;,&quot;loc&quot;:{&quot;line&quot;:1086,&quot;column&quot;:17}}">{label}</option>
              ))}
            </select>
            <span style={{ fontSize: 11, color: 'var(--fg-tertiary)', alignSelf: 'center' }} data-qoder-id="qel-span-db53d071" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-db53d071&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;MemoryPanel&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:1089,&quot;column&quot;:13}}">
              {allTotal} 条
            </span>
          </div>
          <div style={{ maxHeight: 300, overflowY: 'auto' }} data-qoder-id="qel-div-7e049f79" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-7e049f79&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;MemoryPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1093,&quot;column&quot;:11}}">
            {allMemories.map(m => (
              <div key={m.id} style={{
                padding: '6px 10px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)',
                marginBottom: 3, borderLeft: `3px solid ${MEMORY_TYPE_COLORS[m.memoryType] || 'var(--border)'}`,
                fontSize: 11, lineHeight: 1.5,
              }} data-qoder-id="qel-div-7d049de6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-7d049de6&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;MemoryPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1095,&quot;column&quot;:15}}">
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} data-qoder-id="qel-div-7c049c53" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-7c049c53&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;MemoryPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1100,&quot;column&quot;:17}}">
                  <span style={{ fontSize: 10, fontWeight: 600, color: MEMORY_TYPE_COLORS[m.memoryType] || 'var(--fg-tertiary)' }} data-qoder-id="qel-span-6950de64" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-6950de64&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;MemoryPanel&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:1101,&quot;column&quot;:19}}">
                    {MEMORY_TYPE_LABELS[m.memoryType] || m.memoryType}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--fg-tertiary)', marginLeft: 'auto' }} data-qoder-id="qel-span-6850dcd1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-6850dcd1&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;MemoryPanel&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:1104,&quot;column&quot;:19}}">
                    {m.sourceKind === 'markdown' ? '📄' : m.sourceKind === 'xlsx' ? '📊' : m.sourceKind === 'database' ? '💾' : ''} {m.sourceFile || ''}
                  </span>
                </div>
                <div style={{ color: 'var(--fg-primary)', fontWeight: 500, marginTop: 1 }} data-qoder-id="qel-div-8104a432" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-8104a432&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;MemoryPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1108,&quot;column&quot;:17}}">{m.title}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Section>
  )
}

function Section({ title, children, ...qoderProps }: { title: string; children: React.ReactNode } & Record<string, any>) {
  return (
    <div className={["detail-section", (qoderProps as any)?.className].filter(Boolean).join(" ")} style={(qoderProps as any)?.style} data-qoder-id={(qoderProps as any)?.["data-qoder-id"]} data-qoder-source={(qoderProps as any)?.["data-qoder-source"]}>
      <div className="detail-section-title" data-qoder-id="qel-detail-section-title-3db241bc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-detail-section-title-3db241bc&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;Section&quot;,&quot;elementRole&quot;:&quot;detail-section-title&quot;,&quot;loc&quot;:{&quot;line&quot;:489,&quot;column&quot;:7}}">{title}</div>
      {children}
    </div>
  )
}

/* ═══════════════════════ PAGE 3: PIPELINE ═════════════════════ */
function PipelinePage({ customers, custLoading, custError, onRetry, pipeData, onCustClick }: {
  customers: Customer[]; custLoading: boolean; custError: string | null; onRetry: () => void;
  pipeData: ReturnType<typeof usePipeline>;
  onCustClick: (id: string) => void;
}) {
  const [showLost, setShowLost] = useState(false)
  const [lostItems, setLostItems] = useState<api.PipelineItem[]>([])
  const [lostLoading, setLostLoading] = useState(false)
  const [editingLostId, setEditingLostId] = useState<number | null>(null)
  const [editLostReason, setEditLostReason] = useState('')
  const [showWon, setShowWon] = useState(false)
  const [wonItems, setWonItems] = useState<api.PipelineItem[]>([])
  const [wonLoading, setWonLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newPipeCustId, setNewPipeCustId] = useState('')
  const [newPipeName, setNewPipeName] = useState('')
  const [newPipeStage, setNewPipeStage] = useState('')
  const [newPipeAmount, setNewPipeAmount] = useState('')
  const [newPipeStageNum, setNewPipeStageNum] = useState(1)

  const activeCusts = customers.filter(c => !c.isGroup)
  const totalPipeItems = pipeData.stages.reduce((s, st) => s + (st.items?.length || 0), 0)

  // Load lost items when toggled
  const loadLostItems = async () => {
    setLostLoading(true)
    try {
      const res = await api.getLostPipelineItems()
      setLostItems(res.data)
    } catch { /* ignore */ }
    finally { setLostLoading(false) }
  }

  const loadWonItems = async () => {
    setWonLoading(true)
    try {
      const res = await api.getWonPipelineItems()
      setWonItems(res.data)
    } catch { /* ignore */ }
    finally { setWonLoading(false) }
  }

  const handleMarkLost = async (id: number, reason?: string) => {
    try {
      await api.markPipelineLost(id, reason)
      pipeData.reload()
    } catch (err) { console.error('Failed to mark lost:', err) }
  }

  const handleRestore = async (id: number) => {
    try {
      await api.restorePipeline(id)
      pipeData.reload()
      loadLostItems()
    } catch (err) { console.error('Failed to restore:', err) }
  }

  const handleSaveLostReason = async (id: number) => {
    try {
      await api.updatePipelineItem(id, { lostReason: editLostReason })
      setEditingLostId(null)
      loadLostItems()
    } catch (err) { console.error('Failed to save reason:', err) }
  }

  const handleAddPipeline = async () => {
    if (!newPipeCustId || !newPipeName.trim()) return
    try {
      await api.createPipelineItem({
        customerId: newPipeCustId,
        name: newPipeName.trim(),
        stage: newPipeStage,
        amount: newPipeAmount,
        pipeStage: newPipeStageNum,
      })
      setNewPipeCustId('')
      setNewPipeName('')
      setNewPipeStage('')
      setNewPipeAmount('')
      setNewPipeStageNum(1)
      setShowAddForm(false)
      pipeData.reload()
    } catch (err) { console.error('Failed to add pipeline:', err) }
  }

  const handleDeletePipeline = async (id: number, name: string) => {
    if (!confirm(`确定删除商机「${name}」吗？此操作不可撤销。`)) return
    try {
      await api.deletePipelineItem(id)
      pipeData.reload()
    } catch (err) { console.error('Failed to delete pipeline:', err) }
  }

  const handleStageChange = async (item: api.PipelineItem, value: string) => {
    if (!item.id) return
    try {
      if (value === 'win') {
        if (confirm(`确定将「${item.name}」标记为赢得吗？`)) {
          await api.markPipelineWin(item.id)
          pipeData.reload()
        }
      } else if (value === 'lost') {
        if (confirm(`确定将「${item.name}」标记为丢失吗？`)) {
          await handleMarkLost(item.id, '')
        }
      } else {
        await api.updatePipelineStage(item.id, Number(value))
        pipeData.reload()
      }
    } catch (err) { console.error('Failed to change stage:', err) }
  }

  const stageDescriptions = [
    '初次接触，了解需求',
    '确认需求和技术方案',
    '提交正式方案和报价',
    '价格/条款协商中',
    '合同签订在即',
    '执行交付和售后',
  ]

  return (
    <>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }} data-qoder-id="qel-page-header-4b200788" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-page-header-4b200788&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;page-header&quot;,&quot;loc&quot;:{&quot;line&quot;:1042,&quot;column&quot;:7}}">
        <div data-qoder-id="qel-div-36e1cf55" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-36e1cf55&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1043,&quot;column&quot;:9}}">
          <h1 className="page-title" data-qoder-id="qel-page-title-d265330b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-page-title-d265330b&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;page-title&quot;,&quot;loc&quot;:{&quot;line&quot;:1044,&quot;column&quot;:11}}">Pipeline 汇总</h1>
          <p className="page-subtitle" data-qoder-id="qel-page-subtitle-d9d02de1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-page-subtitle-d9d02de1&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;page-subtitle&quot;,&quot;loc&quot;:{&quot;line&quot;:1045,&quot;column&quot;:11}}">{activeCusts.reduce((s, c) => s + (c.pipeline?.length || 0), 0)} 个活跃商机</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowAddForm(!showAddForm)} style={{ display: 'flex', alignItems: 'center', gap: 4 }} data-qoder-id="qel-button-3c29abb8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-3c29abb8&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:1047,&quot;column&quot;:9}}">
          {showAddForm ? <X size={14}  data-qoder-id="qel-x-c8c665f1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-x-c8c665f1&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;x&quot;,&quot;loc&quot;:{&quot;line&quot;:1048,&quot;column&quot;:26}}"/> : <Plus size={14}  data-qoder-id="qel-plus-7efcde66" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-plus-7efcde66&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;plus&quot;,&quot;loc&quot;:{&quot;line&quot;:1048,&quot;column&quot;:44}}"/>}
          {showAddForm ? '取消' : '添加商机'}
        </Button>
      </div>
      {showAddForm && (
        <div className="card" style={{ marginBottom: 16 }} data-qoder-id="qel-card-aee5851c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-card-aee5851c&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;card&quot;,&quot;loc&quot;:{&quot;line&quot;:1053,&quot;column&quot;:9}}">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 10, alignItems: 'end' }} data-qoder-id="qel-div-a28a60b8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-a28a60b8&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1054,&quot;column&quot;:11}}">
            <div data-qoder-id="qel-div-a58a6571" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-a58a6571&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1055,&quot;column&quot;:13}}">
              <label style={{ fontSize: 12, color: 'var(--fg-tertiary)', display: 'block', marginBottom: 4 }} data-qoder-id="qel-label-0507adfa" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-label-0507adfa&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;label&quot;,&quot;loc&quot;:{&quot;line&quot;:1056,&quot;column&quot;:15}}">客户 *</label>
              <select className="search-input" value={newPipeCustId} onChange={e => setNewPipeCustId(e.target.value)} style={{ padding: '6px 10px' }} data-qoder-id="qel-search-input-4ec939ca" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-search-input-4ec939ca&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;search-input&quot;,&quot;loc&quot;:{&quot;line&quot;:1057,&quot;column&quot;:15}}">
                <option value="" data-qoder-id="qel-option-184317d2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-option-184317d2&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;option&quot;,&quot;loc&quot;:{&quot;line&quot;:1058,&quot;column&quot;:17}}">选择客户...</option>
                {activeCusts.map(c => <option key={c.id} value={c.id} data-qoder-id="qel-option-1b40ddf4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-option-1b40ddf4&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;option&quot;,&quot;loc&quot;:{&quot;line&quot;:1059,&quot;column&quot;:39}}">{c.name}</option>)}
              </select>
            </div>
            <div data-qoder-id="qel-div-a2882221" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-a2882221&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1062,&quot;column&quot;:13}}">
              <label style={{ fontSize: 12, color: 'var(--fg-tertiary)', display: 'block', marginBottom: 4 }} data-qoder-id="qel-label-f8055aec" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-label-f8055aec&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;label&quot;,&quot;loc&quot;:{&quot;line&quot;:1063,&quot;column&quot;:15}}">项目名称 *</label>
              <input className="search-input" placeholder="如：900系列穿梭车" value={newPipeName} onChange={e => setNewPipeName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleAddPipeline() }}  data-qoder-id="qel-search-input-7e5a466a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-search-input-7e5a466a&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;search-input&quot;,&quot;loc&quot;:{&quot;line&quot;:1064,&quot;column&quot;:15}}"/>
            </div>
            <div data-qoder-id="qel-div-a58826da" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-a58826da&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1066,&quot;column&quot;:13}}">
              <label style={{ fontSize: 12, color: 'var(--fg-tertiary)', display: 'block', marginBottom: 4 }} data-qoder-id="qel-label-f7055959" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-label-f7055959&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;label&quot;,&quot;loc&quot;:{&quot;line&quot;:1067,&quot;column&quot;:15}}">阶段描述</label>
              <input className="search-input" placeholder="如：样机窗口期" value={newPipeStage} onChange={e => setNewPipeStage(e.target.value)}  data-qoder-id="qel-search-input-7b5a41b1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-search-input-7b5a41b1&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;search-input&quot;,&quot;loc&quot;:{&quot;line&quot;:1068,&quot;column&quot;:15}}"/>
            </div>
            <div data-qoder-id="qel-div-a4882547" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-a4882547&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1070,&quot;column&quot;:13}}">
              <label style={{ fontSize: 12, color: 'var(--fg-tertiary)', display: 'block', marginBottom: 4 }} data-qoder-id="qel-label-02056aaa" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-label-02056aaa&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;label&quot;,&quot;loc&quot;:{&quot;line&quot;:1071,&quot;column&quot;:15}}">金额</label>
              <input className="search-input" placeholder="如：~2M" value={newPipeAmount} onChange={e => setNewPipeAmount(e.target.value)}  data-qoder-id="qel-search-input-745a36ac" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-search-input-745a36ac&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;search-input&quot;,&quot;loc&quot;:{&quot;line&quot;:1072,&quot;column&quot;:15}}"/>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }} data-qoder-id="qel-div-1b850f05" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-1b850f05&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1074,&quot;column&quot;:13}}">
              <select className="search-input" value={newPipeStageNum} onChange={e => setNewPipeStageNum(Number(e.target.value))} style={{ width: 100, padding: '6px 6px' }} data-qoder-id="qel-search-input-3bc49eb3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-search-input-3bc49eb3&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;search-input&quot;,&quot;loc&quot;:{&quot;line&quot;:1075,&quot;column&quot;:15}}">
                {PIPE_STAGES.map(s => <option key={s.num} value={s.num} data-qoder-id="qel-option-8f485055" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-option-8f485055&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;option&quot;,&quot;loc&quot;:{&quot;line&quot;:1076,&quot;column&quot;:39}}">{s.name}</option>)}
              </select>
              <Button onClick={handleAddPipeline} disabled={!newPipeCustId || !newPipeName.trim()} data-qoder-id="qel-button-ae244f00" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-ae244f00&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:1078,&quot;column&quot;:15}}">添加</Button>
            </div>
          </div>
        </div>
      )}
      <DataState loading={custLoading} error={custError} onRetry={onRetry} data-qoder-id="qel-datastate-6e79d51d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-datastate-6e79d51d&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;datastate&quot;,&quot;loc&quot;:{&quot;line&quot;:1083,&quot;column&quot;:7}}">
      {totalPipeItems === 0 && !showLost ? (
        <EmptyState icon={<GitBranch size={20} />} message="暂无商机数据" hint="客户档案中添加 Pipeline 项目后将在此显示"  data-qoder-id="qel-emptystate-b87f89f6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-emptystate-b87f89f6&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;emptystate&quot;,&quot;loc&quot;:{&quot;line&quot;:1085,&quot;column&quot;:9}}"/>
      ) : (
      <div className="page-body" data-qoder-id="qel-page-body-288077f6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-page-body-288077f6&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;page-body&quot;,&quot;loc&quot;:{&quot;line&quot;:1087,&quot;column&quot;:7}}">
        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16 }} data-qoder-id="qel-div-14850400" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-14850400&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1088,&quot;column&quot;:9}}">
          {PIPE_STAGES.map(stage => {
            const stageData = pipeData.stages.find(s => s.num === stage.num)
            const items = stageData?.items || []
            return (
              <div key={stage.num} className="pipe-col" data-qoder-id="qel-pipe-col-e288fc3d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-pipe-col-e288fc3d&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;pipe-col&quot;,&quot;loc&quot;:{&quot;line&quot;:701,&quot;column&quot;:15}}">
                <div className="pipe-col-header" data-qoder-id="qel-pipe-col-header-c2e1899e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-pipe-col-header-c2e1899e&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;pipe-col-header&quot;,&quot;loc&quot;:{&quot;line&quot;:702,&quot;column&quot;:17}}">
                  <div className="dot" style={{ background: stage.color }}  data-qoder-id="qel-dot-d77e02b5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-dot-d77e02b5&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;dot&quot;,&quot;loc&quot;:{&quot;line&quot;:703,&quot;column&quot;:19}}"/>
                  <span className="pipe-col-title" data-qoder-id="qel-pipe-col-title-cfcc15cc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-pipe-col-title-cfcc15cc&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;pipe-col-title&quot;,&quot;loc&quot;:{&quot;line&quot;:704,&quot;column&quot;:19}}">{stage.name}</span>
                  <span className="pipe-col-count" data-qoder-id="qel-pipe-col-count-0d7f358a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-pipe-col-count-0d7f358a&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;pipe-col-count&quot;,&quot;loc&quot;:{&quot;line&quot;:705,&quot;column&quot;:19}}">{items.length}</span>
                </div>
                {/* Stage description */}
                <div style={{ fontSize: 11, color: 'var(--fg-muted)', padding: '0 12px 8px', lineHeight: 1.4 }} data-qoder-id="qel-div-1882cbb5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-1882cbb5&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1100,&quot;column&quot;:17}}">
                  {stageDescriptions[stage.num - 1]}
                </div>
                {items.map((item, i) => (
                  <div key={i} className="pipe-card" onClick={() => onCustClick(item.customerId || '')} data-qoder-id="qel-pipe-card-adad6b3c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-pipe-card-adad6b3c&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;pipe-card&quot;,&quot;loc&quot;:{&quot;line&quot;:708,&quot;column&quot;:19}}">
                    <div className="pipe-card-title" data-qoder-id="qel-pipe-card-title-5d49ec4c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-pipe-card-title-5d49ec4c&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;pipe-card-title&quot;,&quot;loc&quot;:{&quot;line&quot;:709,&quot;column&quot;:21}}">{item.name}</div>
                    <div className="pipe-card-cust" data-qoder-id="qel-pipe-card-cust-49393779" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-pipe-card-cust-49393779&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;pipe-card-cust&quot;,&quot;loc&quot;:{&quot;line&quot;:710,&quot;column&quot;:21}}">{item.customerName || ''}</div>
                    {item.stage && <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', marginTop: 4 }} data-qoder-id="qel-div-b9faa274" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-b9faa274&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:711,&quot;column&quot;:36}}">{item.stage}</div>}
                    {item.amount && <div className="pipe-card-amount" data-qoder-id="qel-pipe-card-amount-22094ff4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-pipe-card-amount-22094ff4&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;pipe-card-amount&quot;,&quot;loc&quot;:{&quot;line&quot;:712,&quot;column&quot;:37}}">{item.amount}</div>}
                    {/* Stage dropdown with Win/Lost */}
                    <select
                      className="pipeline-stage-select"
                      value={item.pipeStage}
                      onChange={(e) => {
                        e.stopPropagation()
                        handleStageChange(item, e.target.value)
                      }}
                      onClick={e => e.stopPropagation()}
                     data-qoder-id="qel-pipeline-stage-select-c0e46198" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-pipeline-stage-select-c0e46198&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;pipeline-stage-select&quot;,&quot;loc&quot;:{&quot;line&quot;:1319,&quot;column&quot;:21}}">
                      {PIPE_STAGES.map(s => (
                        <option key={s.num} value={s.num} data-qoder-id="qel-option-903b85f5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-option-903b85f5&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;option&quot;,&quot;loc&quot;:{&quot;line&quot;:1329,&quot;column&quot;:25}}">{s.name}</option>
                      ))}
                      <option disabled data-qoder-id="qel-option-8d3b813c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-option-8d3b813c&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;option&quot;,&quot;loc&quot;:{&quot;line&quot;:1331,&quot;column&quot;:23}}">─────────</option>
                      <option value="win" data-qoder-id="qel-option-8e3b82cf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-option-8e3b82cf&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;option&quot;,&quot;loc&quot;:{&quot;line&quot;:1332,&quot;column&quot;:23}}">Win - 赢得商机</option>
                      <option value="lost" data-qoder-id="qel-option-8b3b7e16" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-option-8b3b7e16&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;option&quot;,&quot;loc&quot;:{&quot;line&quot;:1333,&quot;column&quot;:23}}">Lost - 丢失商机</option>
                    </select>
                  </div>
                ))}
              </div>
            )
          })}
        </div>

        {/* Lost Pipeline Items Section */}
        <div style={{ marginTop: 24 }} data-qoder-id="qel-div-17808b8b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-17808b8b&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1176,&quot;column&quot;:9}}">
          <button
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
              background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
              cursor: 'pointer', fontSize: 13, fontWeight: 500, color: 'var(--fg-secondary)',
            }}
            onClick={() => { setShowLost(!showLost); if (!showLost && lostItems.length === 0) loadLostItems() }}
           data-qoder-id="qel-button-10080b74" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-10080b74&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:1177,&quot;column&quot;:11}}">
            <AlertTriangle size={14} style={{ color: 'var(--status-warning)' }}  data-qoder-id="qel-alerttriangle-01918272" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-alerttriangle-01918272&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;alerttriangle&quot;,&quot;loc&quot;:{&quot;line&quot;:1185,&quot;column&quot;:13}}"/>
            丢失商机 {lostItems.length > 0 && <span style={{ color: 'var(--fg-muted)' }} data-qoder-id="qel-span-427466d9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-427466d9&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:1186,&quot;column&quot;:43}}">({lostItems.length})</span>}
            {showLost ? <ChevronDown size={14}  data-qoder-id="qel-chevrondown-708dc21c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-chevrondown-708dc21c&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;chevrondown&quot;,&quot;loc&quot;:{&quot;line&quot;:1187,&quot;column&quot;:25}}"/> : <ChevronRight size={14}  data-qoder-id="qel-chevronright-639ebe9d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-chevronright-639ebe9d&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;chevronright&quot;,&quot;loc&quot;:{&quot;line&quot;:1187,&quot;column&quot;:53}}"/>}
          </button>
          {showLost && (
            <div style={{ marginTop: 12 }} data-qoder-id="qel-div-a57d997e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-a57d997e&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1190,&quot;column&quot;:13}}">
              {lostLoading ? (
                <div style={{ padding: 20, color: 'var(--fg-muted)', fontSize: 13 }} data-qoder-id="qel-div-a67d9b11" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-a67d9b11&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1192,&quot;column&quot;:17}}">加载中...</div>
              ) : lostItems.length === 0 ? (
                <div style={{ padding: 20, color: 'var(--fg-muted)', fontSize: 13 }} data-qoder-id="qel-div-a37d9658" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-a37d9658&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1194,&quot;column&quot;:17}}">暂无丢失商机</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }} data-qoder-id="qel-div-a47d97eb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-a47d97eb&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1196,&quot;column&quot;:17}}">
                  {lostItems.map(item => (
                    <div key={item.id} className="card" style={{ opacity: 0.7, borderLeft: '3px solid var(--status-danger)' }} data-qoder-id="qel-card-40f1a3e5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-card-40f1a3e5&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;card&quot;,&quot;loc&quot;:{&quot;line&quot;:1198,&quot;column&quot;:21}}">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }} data-qoder-id="qel-div-a27d94c5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-a27d94c5&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1199,&quot;column&quot;:23}}">
                        <div style={{ flex: 1 }} data-qoder-id="qel-div-a37b57c1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-a37b57c1&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1200,&quot;column&quot;:25}}">
                          <div style={{ fontSize: 13, fontWeight: 600 }} data-qoder-id="qel-div-a27b562e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-a27b562e&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1201,&quot;column&quot;:27}}">{item.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--fg-tertiary)', marginTop: 2 }} data-qoder-id="qel-div-a17b549b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-a17b549b&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1202,&quot;column&quot;:27}}">{item.customerName}</div>
                          {editingLostId === item.id ? (
                            <div style={{ marginTop: 6 }} data-qoder-id="qel-div-a07b5308" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-a07b5308&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1204,&quot;column&quot;:29}}">
                              <textarea
                                value={editLostReason}
                                onChange={e => setEditLostReason(e.target.value)}
                                placeholder="丢失原因..."
                                style={{ width: '100%', minHeight: 48, padding: '6px 10px', fontSize: 12, fontFamily: 'var(--font-sans)', color: 'var(--fg)', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', resize: 'vertical', outline: 'none' }}
                               data-qoder-id="qel-textarea-bff3403d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-textarea-bff3403d&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;textarea&quot;,&quot;loc&quot;:{&quot;line&quot;:1205,&quot;column&quot;:31}}"/>
                              <div style={{ display: 'flex', gap: 4, marginTop: 4 }} data-qoder-id="qel-div-a67b5c7a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-a67b5c7a&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1211,&quot;column&quot;:31}}">
                                <Button variant="default" size="sm" onClick={() => handleSaveLostReason(item.id!)} data-qoder-id="qel-button-432e33eb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-432e33eb&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:1212,&quot;column&quot;:33}}">保存</Button>
                                <Button variant="outline" size="sm" onClick={() => setEditingLostId(null)} data-qoder-id="qel-button-422e3258" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-422e3258&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:1213,&quot;column&quot;:33}}">取消</Button>
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }} data-qoder-id="qel-div-9b7b4b29" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-9b7b4b29&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1217,&quot;column&quot;:29}}">
                              <div style={{ fontSize: 11, color: 'var(--status-danger)', flex: 1 }} data-qoder-id="qel-div-9a7b4996" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-9a7b4996&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1218,&quot;column&quot;:31}}">{item.lostReason ? `原因: ${item.lostReason}` : '暂无原因'}</div>
                              <Button variant="ghost" size="sm" onClick={() => { setEditingLostId(item.id!); setEditLostReason(item.lostReason || '') }} data-qoder-id="qel-button-432bf554" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-432bf554&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:1219,&quot;column&quot;:31}}">
                                <Edit3 size={12}  data-qoder-id="qel-edit3-1833df5f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-edit3-1833df5f&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;edit3&quot;,&quot;loc&quot;:{&quot;line&quot;:1220,&quot;column&quot;:33}}"/>
                              </Button>
                            </div>
                          )}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleRestore(item.id!)} data-qoder-id="qel-button-452bf87a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-452bf87a&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:1225,&quot;column&quot;:25}}">恢复</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Won Pipeline Items Section */}
        <div style={{ marginTop: 12 }} data-qoder-id="qel-div-a0791471" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-a0791471&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1236,&quot;column&quot;:9}}">
          <button
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
              background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
              cursor: 'pointer', fontSize: 13, fontWeight: 500, color: 'var(--fg-secondary)',
            }}
            onClick={() => { setShowWon(!showWon); if (!showWon && wonItems.length === 0) loadWonItems() }}
           data-qoder-id="qel-button-93008ae8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-93008ae8&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:1237,&quot;column&quot;:11}}">
            <CheckSquare size={14} style={{ color: 'var(--status-success)' }}  data-qoder-id="qel-checksquare-87cc36fb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-checksquare-87cc36fb&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;checksquare&quot;,&quot;loc&quot;:{&quot;line&quot;:1245,&quot;column&quot;:13}}"/>
            赢得商机 {wonItems.length > 0 && <span style={{ color: 'var(--fg-muted)' }} data-qoder-id="qel-span-d36f3aee" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-d36f3aee&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:1246,&quot;column&quot;:42}}">({wonItems.length})</span>}
            {showWon ? <ChevronDown size={14}  data-qoder-id="qel-chevrondown-ed8876b5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-chevrondown-ed8876b5&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;chevrondown&quot;,&quot;loc&quot;:{&quot;line&quot;:1247,&quot;column&quot;:24}}"/> : <ChevronRight size={14}  data-qoder-id="qel-chevronright-d4a3edae" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-chevronright-d4a3edae&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;chevronright&quot;,&quot;loc&quot;:{&quot;line&quot;:1247,&quot;column&quot;:52}}"/>}
          </button>
          {showWon && (
            <div style={{ marginTop: 12 }} data-qoder-id="qel-div-967904b3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-967904b3&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1250,&quot;column&quot;:13}}">
              {wonLoading ? (
                <div style={{ padding: 20, color: 'var(--fg-muted)', fontSize: 13 }} data-qoder-id="qel-div-9776c7af" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-9776c7af&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1252,&quot;column&quot;:17}}">加载中...</div>
              ) : wonItems.length === 0 ? (
                <div style={{ padding: 20, color: 'var(--fg-muted)', fontSize: 13 }} data-qoder-id="qel-div-9676c61c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-9676c61c&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1254,&quot;column&quot;:17}}">暂无赢得商机</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }} data-qoder-id="qel-div-9976cad5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-9976cad5&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1256,&quot;column&quot;:17}}">
                  {wonItems.map(item => (
                    <div key={item.id} className="card" style={{ opacity: 0.8, borderLeft: '3px solid var(--status-success)' }} data-qoder-id="qel-card-bdf92471" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-card-bdf92471&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;card&quot;,&quot;loc&quot;:{&quot;line&quot;:1258,&quot;column&quot;:21}}">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }} data-qoder-id="qel-div-9376c163" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-9376c163&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1259,&quot;column&quot;:23}}">
                        <div style={{ flex: 1 }} data-qoder-id="qel-div-9276bfd0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-9276bfd0&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1260,&quot;column&quot;:25}}">
                          <div style={{ fontSize: 13, fontWeight: 600 }} data-qoder-id="qel-div-9576c489" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-9576c489&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1261,&quot;column&quot;:27}}">{item.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--fg-tertiary)', marginTop: 2 }} data-qoder-id="qel-div-9476c2f6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-9476c2f6&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1262,&quot;column&quot;:27}}">{item.customerName}</div>
                          {item.amount && <div style={{ fontSize: 11, color: 'var(--status-success)', marginTop: 4 }} data-qoder-id="qel-div-9f76d447" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-9f76d447&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1263,&quot;column&quot;:43}}">{item.amount}</div>}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleRestore(item.id!)} data-qoder-id="qel-button-343d26d8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-343d26d8&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:1265,&quot;column&quot;:25}}">恢复</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      )}
      </DataState>
    </>
  )
}

/* ═══════════════════════ PAGE 4: COMPETITIVE ═══════════════════ */
function CompetitivePage({ customers, custLoading, custError, onRetry }: {
  customers: Customer[]; custLoading: boolean; custError: string | null; onRetry: () => void;
}) {
  const activeCusts = customers.filter(c => !c.isGroup && c.comp)
  const compMap = new Map<string, typeof activeCusts>()
  activeCusts.forEach(c => {
    const existing = compMap.get(c.comp!) || []
    existing.push(c)
    compMap.set(c.comp!, existing)
  })

  return (
    <>
      <div className="page-header" data-qoder-id="qel-page-header-01a22de7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-page-header-01a22de7&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CompetitivePage&quot;,&quot;elementRole&quot;:&quot;page-header&quot;,&quot;loc&quot;:{&quot;line&quot;:758,&quot;column&quot;:7}}">
        <h1 className="page-title" data-qoder-id="qel-page-title-93d00b77" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-page-title-93d00b77&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CompetitivePage&quot;,&quot;elementRole&quot;:&quot;page-title&quot;,&quot;loc&quot;:{&quot;line&quot;:759,&quot;column&quot;:9}}">竞品分析</h1>
        <p className="page-subtitle" data-qoder-id="qel-page-subtitle-0fa09f33" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-page-subtitle-0fa09f33&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CompetitivePage&quot;,&quot;elementRole&quot;:&quot;page-subtitle&quot;,&quot;loc&quot;:{&quot;line&quot;:760,&quot;column&quot;:9}}">{compMap.size} 个主要竞争对手 · {activeCusts.length} 个客户存在竞品</p>
      </div>
      <DataState loading={custLoading} error={custError} onRetry={onRetry} data-qoder-id="qel-datastate-066713b0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-datastate-066713b0&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CompetitivePage&quot;,&quot;elementRole&quot;:&quot;datastate&quot;,&quot;loc&quot;:{&quot;line&quot;:1299,&quot;column&quot;:7}}">
      {activeCusts.length === 0 ? (
        <EmptyState icon={<Swords size={20} />} message="暂无竞品数据" hint="客户档案中设置竞品信息后将在此显示竞品分析"  data-qoder-id="qel-emptystate-9f3a7d55" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-emptystate-9f3a7d55&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CompetitivePage&quot;,&quot;elementRole&quot;:&quot;emptystate&quot;,&quot;loc&quot;:{&quot;line&quot;:1301,&quot;column&quot;:9}}"/>
      ) : (
      <div className="page-body" data-qoder-id="qel-page-body-681feb9f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-page-body-681feb9f&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CompetitivePage&quot;,&quot;elementRole&quot;:&quot;page-body&quot;,&quot;loc&quot;:{&quot;line&quot;:1303,&quot;column&quot;:7}}">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16, marginBottom: 32 }} data-qoder-id="qel-div-55d51347" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-55d51347&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CompetitivePage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:553,&quot;column&quot;:9}}">
          {COMPETITOR_INTEL.map(comp => (
            <div key={comp.name} className="card" data-qoder-id="qel-card-f862f391" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-card-f862f391&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CompetitivePage&quot;,&quot;elementRole&quot;:&quot;card&quot;,&quot;loc&quot;:{&quot;line&quot;:555,&quot;column&quot;:13}}">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }} data-qoder-id="qel-div-57d5166d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-57d5166d&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CompetitivePage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:556,&quot;column&quot;:15}}">
                <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} data-qoder-id="qel-div-56d514da" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-56d514da&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CompetitivePage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:557,&quot;column&quot;:17}}">
                  <Swords size={16} style={{ color: 'var(--accent)' }}  data-qoder-id="qel-swords-91f8ff9f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-swords-91f8ff9f&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CompetitivePage&quot;,&quot;elementRole&quot;:&quot;swords&quot;,&quot;loc&quot;:{&quot;line&quot;:558,&quot;column&quot;:19}}"/>
                </div>
                <span style={{ fontSize: 15, fontWeight: 600 }} data-qoder-id="qel-span-daede204" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-daede204&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CompetitivePage&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:560,&quot;column&quot;:17}}">{comp.name}</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--fg-secondary)', lineHeight: 1.6, margin: 0 }} data-qoder-id="qel-p-e069c155" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-p-e069c155&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CompetitivePage&quot;,&quot;elementRole&quot;:&quot;p&quot;,&quot;loc&quot;:{&quot;line&quot;:562,&quot;column&quot;:15}}">{comp.desc}</p>
            </div>
          ))}
        </div>

        {/* Customer-level competition */}
        <div className="card" data-qoder-id="qel-card-fa62f6b7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-card-fa62f6b7&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CompetitivePage&quot;,&quot;elementRole&quot;:&quot;card&quot;,&quot;loc&quot;:{&quot;line&quot;:568,&quot;column&quot;:9}}">
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }} data-qoder-id="qel-div-4dd506af" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-4dd506af&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CompetitivePage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:569,&quot;column&quot;:11}}">客户竞品分布</div>
          <table className="data-table" data-qoder-id="qel-data-table-92ac429f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-data-table-92ac429f&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CompetitivePage&quot;,&quot;elementRole&quot;:&quot;data-table&quot;,&quot;loc&quot;:{&quot;line&quot;:570,&quot;column&quot;:11}}">
            <thead data-qoder-id="qel-thead-6fad7a56" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-thead-6fad7a56&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CompetitivePage&quot;,&quot;elementRole&quot;:&quot;thead&quot;,&quot;loc&quot;:{&quot;line&quot;:571,&quot;column&quot;:13}}">
              <tr data-qoder-id="qel-tr-09f3549d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-tr-09f3549d&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CompetitivePage&quot;,&quot;elementRole&quot;:&quot;tr&quot;,&quot;loc&quot;:{&quot;line&quot;:572,&quot;column&quot;:15}}">
                <th data-qoder-id="qel-th-eb10f5fc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-th-eb10f5fc&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CompetitivePage&quot;,&quot;elementRole&quot;:&quot;th&quot;,&quot;loc&quot;:{&quot;line&quot;:573,&quot;column&quot;:17}}">客户</th>
                <th data-qoder-id="qel-th-ec10f78f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-th-ec10f78f&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CompetitivePage&quot;,&quot;elementRole&quot;:&quot;th&quot;,&quot;loc&quot;:{&quot;line&quot;:574,&quot;column&quot;:17}}">竞争对手</th>
                <th data-qoder-id="qel-th-e910f2d6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-th-e910f2d6&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CompetitivePage&quot;,&quot;elementRole&quot;:&quot;th&quot;,&quot;loc&quot;:{&quot;line&quot;:575,&quot;column&quot;:17}}">行业</th>
                <th data-qoder-id="qel-th-ea10f469" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-th-ea10f469&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CompetitivePage&quot;,&quot;elementRole&quot;:&quot;th&quot;,&quot;loc&quot;:{&quot;line&quot;:576,&quot;column&quot;:17}}">CY YTD</th>
              </tr>
            </thead>
            <tbody data-qoder-id="qel-tbody-b9fc36e8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-tbody-b9fc36e8&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CompetitivePage&quot;,&quot;elementRole&quot;:&quot;tbody&quot;,&quot;loc&quot;:{&quot;line&quot;:579,&quot;column&quot;:13}}">
              {activeCusts.sort((a, b) => (b.salesData?.CY_YTD || 0) - (a.salesData?.CY_YTD || 0)).map(c => (
                <tr key={c.id} data-qoder-id="qel-tr-03f34b2b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-tr-03f34b2b&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CompetitivePage&quot;,&quot;elementRole&quot;:&quot;tr&quot;,&quot;loc&quot;:{&quot;line&quot;:581,&quot;column&quot;:17}}">
                  <td data-qoder-id="qel-td-3eaf6dc2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-td-3eaf6dc2&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CompetitivePage&quot;,&quot;elementRole&quot;:&quot;td&quot;,&quot;loc&quot;:{&quot;line&quot;:582,&quot;column&quot;:19}}">{c.name}</td>
                  <td data-qoder-id="qel-td-3faf6f55" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-td-3faf6f55&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CompetitivePage&quot;,&quot;elementRole&quot;:&quot;td&quot;,&quot;loc&quot;:{&quot;line&quot;:583,&quot;column&quot;:19}}"><span className="badge badge-orange" data-qoder-id="qel-badge-13749c24" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-badge-13749c24&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CompetitivePage&quot;,&quot;elementRole&quot;:&quot;badge&quot;,&quot;loc&quot;:{&quot;line&quot;:583,&quot;column&quot;:23}}">{c.comp}</span></td>
                  <td style={{ color: 'var(--fg-tertiary)' }} data-qoder-id="qel-td-bfac673e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-td-bfac673e&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CompetitivePage&quot;,&quot;elementRole&quot;:&quot;td&quot;,&quot;loc&quot;:{&quot;line&quot;:584,&quot;column&quot;:19}}">{c.industry}</td>
                  <td data-qoder-id="qel-td-beac65ab" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-td-beac65ab&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CompetitivePage&quot;,&quot;elementRole&quot;:&quot;td&quot;,&quot;loc&quot;:{&quot;line&quot;:585,&quot;column&quot;:19}}">{fmtK(c.salesData?.CY_YTD || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}
      </DataState>
    </>
  )
}

/* ═══════════════════════ PAGE 5: ENERGY ═══════════════════════ */
function EnergyPage({ customers, custLoading, custError, onRetry }: {
  customers: Customer[]; custLoading: boolean; custError: string | null; onRetry: () => void;
}) {
  // Derive energy groups dynamically from customer priority colors
  const activeCusts = customers.filter(c => !c.isGroup)
  const redCusts = activeCusts.filter(c => c.color === 'red')
  const orangeCusts = activeCusts.filter(c => c.color === 'orange')
  const greenCusts = activeCusts.filter(c => c.color === 'green')
  const grayCusts = activeCusts.filter(c => c.color === 'gray')

  const total = activeCusts.length || 1
  const groups = [
    { label: 'A类 · 重点攻坚', alloc: 40, color: 'var(--pri-red)', count: redCusts.length, items: redCusts.map(c => c.name) },
    { label: 'B类 · 稳步推进', alloc: 30, color: 'var(--pri-orange)', count: orangeCusts.length, items: orangeCusts.map(c => c.name) },
    { label: 'C类 · 培育拓展', alloc: 20, color: 'var(--pri-green)', count: greenCusts.length, items: greenCusts.map(c => c.name) },
    { label: 'D类 · 观察维护', alloc: 10, color: 'var(--pri-gray)', count: grayCusts.length, items: grayCusts.map(c => c.name) },
  ]

  return (
    <>
      <div className="page-header" data-qoder-id="qel-page-header-acb46175" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-page-header-acb46175&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;EnergyPage&quot;,&quot;elementRole&quot;:&quot;page-header&quot;,&quot;loc&quot;:{&quot;line&quot;:829,&quot;column&quot;:7}}">
        <h1 className="page-title" data-qoder-id="qel-page-title-c1357ba5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-page-title-c1357ba5&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;EnergyPage&quot;,&quot;elementRole&quot;:&quot;page-title&quot;,&quot;loc&quot;:{&quot;line&quot;:830,&quot;column&quot;:9}}">精力分配</h1>
        <p className="page-subtitle" data-qoder-id="qel-page-subtitle-8b726a59" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-page-subtitle-8b726a59&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;EnergyPage&quot;,&quot;elementRole&quot;:&quot;page-subtitle&quot;,&quot;loc&quot;:{&quot;line&quot;:831,&quot;column&quot;:9}}">基于客户优先级的精力投入建议 · {activeCusts.length} 个客户</p>
      </div>
      <DataState loading={custLoading} error={custError} onRetry={onRetry} data-qoder-id="qel-datastate-788bb82e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-datastate-788bb82e&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;EnergyPage&quot;,&quot;elementRole&quot;:&quot;datastate&quot;,&quot;loc&quot;:{&quot;line&quot;:833,&quot;column&quot;:7}}">
      <div className="page-body" data-qoder-id="qel-page-body-d9406098" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-page-body-d9406098&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;EnergyPage&quot;,&quot;elementRole&quot;:&quot;page-body&quot;,&quot;loc&quot;:{&quot;line&quot;:834,&quot;column&quot;:7}}">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }} data-qoder-id="qel-div-d6ecc738" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-d6ecc738&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;EnergyPage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:835,&quot;column&quot;:9}}">
          {groups.map(g => (
            <div key={g.label} className="card" style={{ textAlign: 'center' }} data-qoder-id="qel-card-0ea56578" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-card-0ea56578&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;EnergyPage&quot;,&quot;elementRole&quot;:&quot;card&quot;,&quot;loc&quot;:{&quot;line&quot;:837,&quot;column&quot;:13}}">
              <div style={{ fontSize: 32, fontWeight: 700, color: g.color, marginBottom: 4 }} data-qoder-id="qel-div-d4ef02a9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-d4ef02a9&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;EnergyPage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:838,&quot;column&quot;:15}}">{g.count}</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg-secondary)', marginBottom: 4 }} data-qoder-id="qel-div-d3ef0116" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-d3ef0116&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;EnergyPage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:839,&quot;column&quot;:15}}">{g.label}</div>
              <div style={{ fontSize: 12, color: 'var(--fg-tertiary)', marginBottom: 16 }} data-qoder-id="qel-div-d2eeff83" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-d2eeff83&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;EnergyPage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:840,&quot;column&quot;:15}}">建议投入 {g.alloc}%</div>
              <div className="energy-bar-track" data-qoder-id="qel-energy-bar-track-a0d353bf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-energy-bar-track-a0d353bf&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;EnergyPage&quot;,&quot;elementRole&quot;:&quot;energy-bar-track&quot;,&quot;loc&quot;:{&quot;line&quot;:841,&quot;column&quot;:15}}">
                <motion.div className="energy-bar-fill" style={{ background: g.color }} initial={{ width: 0 }} animate={{ width: `${g.alloc}%` }} transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}  data-qoder-id="qel-energy-bar-fill-6e17fdf4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-energy-bar-fill-6e17fdf4&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;EnergyPage&quot;,&quot;elementRole&quot;:&quot;energy-bar-fill&quot;,&quot;loc&quot;:{&quot;line&quot;:842,&quot;column&quot;:17}}"/>
              </div>
            </div>
          ))}
        </div>

        {/* Customer List by Group */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }} data-qoder-id="qel-div-d7ef0762" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-d7ef0762&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;EnergyPage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:849,&quot;column&quot;:9}}">
          {groups.map(g => (
            <div key={g.label} className="card" data-qoder-id="qel-card-9ba271d8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-card-9ba271d8&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;EnergyPage&quot;,&quot;elementRole&quot;:&quot;card&quot;,&quot;loc&quot;:{&quot;line&quot;:851,&quot;column&quot;:13}}">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }} data-qoder-id="qel-div-d5ef043c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-d5ef043c&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;EnergyPage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:852,&quot;column&quot;:15}}">
                <div className="dot" style={{ background: g.color }}  data-qoder-id="qel-dot-d2838311" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-dot-d2838311&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;EnergyPage&quot;,&quot;elementRole&quot;:&quot;dot&quot;,&quot;loc&quot;:{&quot;line&quot;:853,&quot;column&quot;:17}}"/>
                <span style={{ fontSize: 14, fontWeight: 600 }} data-qoder-id="qel-span-2147de62" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-2147de62&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;EnergyPage&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:854,&quot;column&quot;:17}}">{g.label}</span>
                <span className="badge badge-teal" style={{ marginLeft: 'auto' }} data-qoder-id="qel-badge-9fbb2c55" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-badge-9fbb2c55&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;EnergyPage&quot;,&quot;elementRole&quot;:&quot;badge&quot;,&quot;loc&quot;:{&quot;line&quot;:855,&quot;column&quot;:17}}">{g.count} 个</span>
              </div>
              {g.items.length === 0 && <div style={{ fontSize: 13, color: 'var(--fg-tertiary)', padding: '8px 0' }} data-qoder-id="qel-div-e40f6df1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-e40f6df1&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;EnergyPage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:857,&quot;column&quot;:40}}">暂无客户</div>}
              {g.items.map((item, i) => (
                <div key={i} className="action-row" data-qoder-id="qel-action-row-3adadd52" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-action-row-3adadd52&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;EnergyPage&quot;,&quot;elementRole&quot;:&quot;action-row&quot;,&quot;loc&quot;:{&quot;line&quot;:859,&quot;column&quot;:17}}">
                  <span className="action-row-label" data-qoder-id="qel-action-row-label-e4e0eccf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-action-row-label-e4e0eccf&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;EnergyPage&quot;,&quot;elementRole&quot;:&quot;action-row-label&quot;,&quot;loc&quot;:{&quot;line&quot;:860,&quot;column&quot;:19}}">{item}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      </DataState>
    </>
  )
}

/* ═══════════════════════ PAGE 6: AI COACH ═════════════════════ */
function CoachPage({ customers }: { customers: Customer[] }) {
  // Investment scoring state: { [itemKey]: { [dimIndex]: score } }
  const [scores, setScores] = useState<Record<string, Record<number, number>>>(() => {
    try {
      const saved = localStorage.getItem('crm-invest-scores')
      return saved ? JSON.parse(saved) : {}
    } catch { return {} }
  })
  // Dynamic investment items (persisted to DB)
  const [investItems, setInvestItems] = useState<{ name: string; key: string; customerId?: string; customerName?: string }[]>([])
  const [newItemName, setNewItemName] = useState('')
  const [newItemCustId, setNewItemCustId] = useState('')
  const [editingInvestKey, setEditingInvestKey] = useState<string | null>(null)
  const [editingInvestName, setEditingInvestName] = useState('')

  // Load invest items from API on mount
  useEffect(() => {
    api.getInvestItems().then(res => {
      setInvestItems(res.data.map(i => ({ name: i.name, key: i.key, customerId: i.customerId, customerName: i.customerName })))
    }).catch(() => {
      // Fallback to static data if API fails
      setInvestItems([...INVESTMENT_ITEMS])
    })
  }, [])

  const handleScore = (itemKey: string, dimIdx: number, value: number) => {
    setScores(prev => {
      const itemScores = { ...(prev[itemKey] || {}) }
      // Toggle off if clicking same value
      if (itemScores[dimIdx] === value) {
        delete itemScores[dimIdx]
      } else {
        itemScores[dimIdx] = value
      }
      const next = { ...prev, [itemKey]: itemScores }
      try { localStorage.setItem('crm-invest-scores', JSON.stringify(next)) } catch {}
      return next
    })
  }

  const handleAddItem = async () => {
    if (!newItemName.trim()) return
    try {
      const res = await api.createInvestItem({ name: newItemName.trim(), customerId: newItemCustId || undefined })
      setInvestItems(prev => [...prev, { name: res.data.name, key: res.data.key, customerId: res.data.customerId, customerName: res.data.customerName }])
      setNewItemName('')
      setNewItemCustId('')
    } catch (err) {
      console.error('Failed to add invest item:', err)
    }
  }

  const handleSaveInvestName = async (key: string) => {
    if (!editingInvestName.trim()) return
    try {
      await api.updateInvestItem(key, { name: editingInvestName.trim() })
      setInvestItems(prev => prev.map(i => i.key === key ? { ...i, name: editingInvestName.trim() } : i))
      setEditingInvestKey(null)
    } catch (err) { console.error('Failed to update invest name:', err) }
  }

  const handleUpdateInvestCust = async (key: string, customerId: string) => {
    try {
      const res = await api.updateInvestItem(key, { customerId })
      setInvestItems(prev => prev.map(i => i.key === key ? { ...i, customerId: res.data.customerId, customerName: res.data.customerName } : i))
    } catch (err) { console.error('Failed to update invest customer:', err) }
  }

  const handleDeleteItem = async (key: string) => {
    try {
      await api.deleteInvestItem(key)
      setInvestItems(prev => prev.filter(i => i.key !== key))
      setScores(prev => {
        const next = { ...prev }
        delete next[key]
        try { localStorage.setItem('crm-invest-scores', JSON.stringify(next)) } catch {}
        return next
      })
    } catch (err) {
      console.error('Failed to delete invest item:', err)
    }
  }

  const iconMap: Record<string, React.ReactNode> = {
    megaphone: <Megaphone size={18} style={{ color: 'var(--accent)' }}  data-qoder-id="qel-megaphone-1d6a1e04" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-megaphone-1d6a1e04&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CoachPage&quot;,&quot;elementRole&quot;:&quot;megaphone&quot;,&quot;loc&quot;:{&quot;line&quot;:1490,&quot;column&quot;:16}}"/>,
    shield: <Shield size={18} style={{ color: 'var(--accent)' }}  data-qoder-id="qel-shield-ed481e99" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-shield-ed481e99&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CoachPage&quot;,&quot;elementRole&quot;:&quot;shield&quot;,&quot;loc&quot;:{&quot;line&quot;:1491,&quot;column&quot;:13}}"/>,
    'arrow-up-circle': <ArrowUpCircle size={18} style={{ color: 'var(--accent)' }}  data-qoder-id="qel-arrowupcircle-f812c4aa" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-arrowupcircle-f812c4aa&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CoachPage&quot;,&quot;elementRole&quot;:&quot;arrowupcircle&quot;,&quot;loc&quot;:{&quot;line&quot;:1492,&quot;column&quot;:24}}"/>,
  }

  return (
    <>
      <div className="page-header" data-qoder-id="qel-page-header-60974e32" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-page-header-60974e32&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CoachPage&quot;,&quot;elementRole&quot;:&quot;page-header&quot;,&quot;loc&quot;:{&quot;line&quot;:656,&quot;column&quot;:7}}">
        <h1 className="page-title" data-qoder-id="qel-page-title-ec1dde6c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-page-title-ec1dde6c&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CoachPage&quot;,&quot;elementRole&quot;:&quot;page-title&quot;,&quot;loc&quot;:{&quot;line&quot;:657,&quot;column&quot;:9}}">AI 教练</h1>
        <p className="page-subtitle" data-qoder-id="qel-page-subtitle-c552c80a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-page-subtitle-c552c80a&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CoachPage&quot;,&quot;elementRole&quot;:&quot;page-subtitle&quot;,&quot;loc&quot;:{&quot;line&quot;:658,&quot;column&quot;:9}}">销售场景话术训练 · 投资策略评估</p>
      </div>
      <div className="page-body" data-qoder-id="qel-page-body-01d1739e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-page-body-01d1739e&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CoachPage&quot;,&quot;elementRole&quot;:&quot;page-body&quot;,&quot;loc&quot;:{&quot;line&quot;:660,&quot;column&quot;:7}}">
        {/* Scenarios */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 20, marginBottom: 32 }} data-qoder-id="qel-div-9d355fa2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-9d355fa2&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CoachPage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:662,&quot;column&quot;:9}}">
          {COACH_SCENARIOS.map(sc => (
            <div key={sc.title} className="coach-card" data-qoder-id="qel-coach-card-d4380cbb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-coach-card-d4380cbb&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CoachPage&quot;,&quot;elementRole&quot;:&quot;coach-card&quot;,&quot;loc&quot;:{&quot;line&quot;:664,&quot;column&quot;:13}}">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }} data-qoder-id="qel-div-0b384b63" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-0b384b63&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CoachPage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:665,&quot;column&quot;:15}}">
                {iconMap[sc.icon]}
                <span style={{ fontSize: 15, fontWeight: 600 }} data-qoder-id="qel-span-a790a074" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-a790a074&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CoachPage&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:667,&quot;column&quot;:17}}">{sc.title}</span>
              </div>
              {sc.levels.map((lv, i) => (
                <div key={i} className="coach-level" style={{ '--level-color': lv.color, '--level-bg': lv.bg } as React.CSSProperties} data-qoder-id="qel-coach-level-ed0e7d3b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-coach-level-ed0e7d3b&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CoachPage&quot;,&quot;elementRole&quot;:&quot;coach-level&quot;,&quot;loc&quot;:{&quot;line&quot;:670,&quot;column&quot;:17}}">
                  <div className="coach-level-label" style={{ color: lv.color }} data-qoder-id="qel-coach-level-label-ef31d2c7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-coach-level-label-ef31d2c7&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CoachPage&quot;,&quot;elementRole&quot;:&quot;coach-level-label&quot;,&quot;loc&quot;:{&quot;line&quot;:671,&quot;column&quot;:19}}">{lv.label}</div>
                  <div className="coach-level-text" data-qoder-id="qel-coach-level-text-119217b1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-coach-level-text-119217b1&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CoachPage&quot;,&quot;elementRole&quot;:&quot;coach-level-text&quot;,&quot;loc&quot;:{&quot;line&quot;:672,&quot;column&quot;:19}}">{lv.text}</div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Investment Scoring */}
        <div className="card" data-qoder-id="qel-card-b0a1361f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-card-b0a1361f&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CoachPage&quot;,&quot;elementRole&quot;:&quot;card&quot;,&quot;loc&quot;:{&quot;line&quot;:680,&quot;column&quot;:9}}">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }} data-qoder-id="qel-div-113854d5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-113854d5&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CoachPage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:681,&quot;column&quot;:11}}">
            <Target size={16} style={{ color: 'var(--accent)' }}  data-qoder-id="qel-target-8a4a6024" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-target-8a4a6024&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CoachPage&quot;,&quot;elementRole&quot;:&quot;target&quot;,&quot;loc&quot;:{&quot;line&quot;:682,&quot;column&quot;:13}}"/>
            <span style={{ fontSize: 15, fontWeight: 600 }} data-qoder-id="qel-span-a090956f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-a090956f&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CoachPage&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:683,&quot;column&quot;:13}}">投资评分矩阵</span>
          </div>
          <div className="invest-matrix" data-qoder-id="qel-invest-matrix-282dd965" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-invest-matrix-282dd965&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CoachPage&quot;,&quot;elementRole&quot;:&quot;invest-matrix&quot;,&quot;loc&quot;:{&quot;line&quot;:1701,&quot;column&quot;:11}}">
            <div className="invest-matrix-header" data-qoder-id="qel-invest-matrix-header-b703b536" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-invest-matrix-header-b703b536&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CoachPage&quot;,&quot;elementRole&quot;:&quot;invest-matrix-header&quot;,&quot;loc&quot;:{&quot;line&quot;:1702,&quot;column&quot;:13}}">
              <div className="invest-col-name" data-qoder-id="qel-invest-col-name-638a501c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-invest-col-name-638a501c&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CoachPage&quot;,&quot;elementRole&quot;:&quot;invest-col-name&quot;,&quot;loc&quot;:{&quot;line&quot;:1703,&quot;column&quot;:15}}">项目</div>
              <div className="invest-col-cust" data-qoder-id="qel-invest-col-cust-22f4132d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-invest-col-cust-22f4132d&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CoachPage&quot;,&quot;elementRole&quot;:&quot;invest-col-cust&quot;,&quot;loc&quot;:{&quot;line&quot;:1704,&quot;column&quot;:15}}">客户</div>
              {INVESTMENT_DIMS.map(d => <div key={d} className="invest-col-dim" data-qoder-id="qel-invest-col-dim-09879b7f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-invest-col-dim-09879b7f&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CoachPage&quot;,&quot;elementRole&quot;:&quot;invest-col-dim&quot;,&quot;loc&quot;:{&quot;line&quot;:1705,&quot;column&quot;:41}}">{d}</div>)}
            </div>
            {investItems.map(item => {
              const itemScores = scores[item.key] || {}
              const totalScore = Object.values(itemScores).reduce((s, v) => s + v, 0)
              const scoredDims = Object.keys(itemScores).length
              return (
              <div key={item.key} className="invest-matrix-row" data-qoder-id="qel-invest-matrix-row-77032d6e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-invest-matrix-row-77032d6e&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CoachPage&quot;,&quot;elementRole&quot;:&quot;invest-matrix-row&quot;,&quot;loc&quot;:{&quot;line&quot;:1712,&quot;column&quot;:15}}">
                <div className="invest-col-name" style={{ display: 'flex', alignItems: 'center', gap: 4 }} data-qoder-id="qel-invest-col-name-dd873e93" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-invest-col-name-dd873e93&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CoachPage&quot;,&quot;elementRole&quot;:&quot;invest-col-name&quot;,&quot;loc&quot;:{&quot;line&quot;:1713,&quot;column&quot;:17}}">
                  {editingInvestKey === item.key ? (
                    <input
                      className="search-input"
                      style={{ padding: '2px 6px', fontSize: 13, width: '100%' }}
                      value={editingInvestName}
                      onChange={e => setEditingInvestName(e.target.value)}
                      onBlur={() => handleSaveInvestName(item.key)}
                      onKeyDown={e => { if (e.key === 'Enter') handleSaveInvestName(item.key); if (e.key === 'Escape') setEditingInvestKey(null) }}
                      autoFocus
                     data-qoder-id="qel-search-input-19b1d542" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-search-input-19b1d542&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CoachPage&quot;,&quot;elementRole&quot;:&quot;search-input&quot;,&quot;loc&quot;:{&quot;line&quot;:1715,&quot;column&quot;:21}}"/>
                  ) : (
                    <span
                      style={{ cursor: 'pointer', fontWeight: 500, fontSize: 13 }}
                      onDoubleClick={() => { setEditingInvestKey(item.key); setEditingInvestName(item.name) }}
                     data-qoder-id="qel-span-83bb2d20" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-83bb2d20&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CoachPage&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:1725,&quot;column&quot;:21}}">
                      {item.name}{scoredDims > 0 && <span style={{ marginLeft: 4, fontSize: 11, color: 'var(--accent)' }} data-qoder-id="qel-span-8abb3825" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-8abb3825&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CoachPage&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:1729,&quot;column&quot;:53}}">({totalScore})</span>}
                    </span>
                  )}
                  <button onClick={() => handleDeleteItem(item.key)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-muted)', padding: 2, flexShrink: 0 }} title="删除项目" data-qoder-id="qel-button-40ed2aa2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-40ed2aa2&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CoachPage&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:1732,&quot;column&quot;:19}}">
                    <Trash2 size={11}  data-qoder-id="qel-trash2-4a4952ff" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-trash2-4a4952ff&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CoachPage&quot;,&quot;elementRole&quot;:&quot;trash2&quot;,&quot;loc&quot;:{&quot;line&quot;:1733,&quot;column&quot;:21}}"/>
                  </button>
                </div>
                <div className="invest-col-cust" data-qoder-id="qel-invest-col-cust-93f0f379" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-invest-col-cust-93f0f379&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CoachPage&quot;,&quot;elementRole&quot;:&quot;invest-col-cust&quot;,&quot;loc&quot;:{&quot;line&quot;:1736,&quot;column&quot;:17}}">
                  <select
                    className="search-input"
                    style={{ padding: '3px 6px', fontSize: 12, width: '100%' }}
                    value={item.customerId || ''}
                    onChange={e => handleUpdateInvestCust(item.key, e.target.value)}
                   data-qoder-id="qel-search-input-8282aa20" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-search-input-8282aa20&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CoachPage&quot;,&quot;elementRole&quot;:&quot;search-input&quot;,&quot;loc&quot;:{&quot;line&quot;:1737,&quot;column&quot;:19}}">
                    <option value="" data-qoder-id="qel-option-8d04ade4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-option-8d04ade4&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CoachPage&quot;,&quot;elementRole&quot;:&quot;option&quot;,&quot;loc&quot;:{&quot;line&quot;:1743,&quot;column&quot;:21}}">未关联</option>
                    {customers.filter(c => !c.isGroup).map(c => <option key={c.id} value={c.id} data-qoder-id="qel-option-6f9b7ba9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-option-6f9b7ba9&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CoachPage&quot;,&quot;elementRole&quot;:&quot;option&quot;,&quot;loc&quot;:{&quot;line&quot;:1744,&quot;column&quot;:65}}">{c.name}</option>)}
                  </select>
                </div>
                {INVESTMENT_DIMS.map((_, di) => (
                  <div key={di} className="invest-col-dim" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 3 }} data-qoder-id="qel-invest-col-dim-7e3279a4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-invest-col-dim-7e3279a4&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CoachPage&quot;,&quot;elementRole&quot;:&quot;invest-col-dim&quot;,&quot;loc&quot;:{&quot;line&quot;:1748,&quot;column&quot;:19}}">
                    {[1, 2, 3, 4, 5].map(v => {
                      const selected = itemScores[di] === v
                      const filled = itemScores[di] != null && v <= itemScores[di]!
                      return (
                      <div
                        key={v}
                        onClick={() => handleScore(item.key, di, v)}
                        style={{
                          width: 26, height: 26, borderRadius: 'var(--radius-xs)',
                          background: selected ? 'var(--accent)' : filled ? 'var(--accent-bg)' : 'var(--bg-elevated)',
                          border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
                          cursor: 'pointer', fontSize: 11, fontWeight: selected ? 600 : 400,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: selected ? '#fff' : filled ? 'var(--accent)' : 'var(--fg-muted)',
                          transition: 'all 0.15s ease',
                        }}
                       data-qoder-id="qel-div-dbf34085" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-dbf34085&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CoachPage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1753,&quot;column&quot;:23}}">
                        {v}
                      </div>
                      )
                    })}
                  </div>
                ))}
              </div>
              )
            })}
          </div>
          {/* Add new investment item */}
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }} data-qoder-id="qel-div-6c59b360" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-6c59b360&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CoachPage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1608,&quot;column&quot;:11}}">
            <select
              className="search-input"
              style={{ width: 140 }}
              value={newItemCustId}
              onChange={e => setNewItemCustId(e.target.value)}
             data-qoder-id="qel-search-input-9084fec1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-search-input-9084fec1&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CoachPage&quot;,&quot;elementRole&quot;:&quot;search-input&quot;,&quot;loc&quot;:{&quot;line&quot;:1609,&quot;column&quot;:13}}">
              <option value="" data-qoder-id="qel-option-81025c69" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-option-81025c69&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CoachPage&quot;,&quot;elementRole&quot;:&quot;option&quot;,&quot;loc&quot;:{&quot;line&quot;:1615,&quot;column&quot;:15}}">选择客户（可选）</option>
              {customers.filter(c => !c.isGroup).map(c => <option key={c.id} value={c.id} data-qoder-id="qel-option-7e0257b0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-option-7e0257b0&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CoachPage&quot;,&quot;elementRole&quot;:&quot;option&quot;,&quot;loc&quot;:{&quot;line&quot;:1616,&quot;column&quot;:59}}">{c.name}</option>)}
            </select>
            <input
              className="search-input"
              style={{ flex: 1 }}
              placeholder="输入样机/项目名称..."
              value={newItemName}
              onChange={e => setNewItemName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddItem() }}
             data-qoder-id="qel-search-input-1ab4156c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-search-input-1ab4156c&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CoachPage&quot;,&quot;elementRole&quot;:&quot;search-input&quot;,&quot;loc&quot;:{&quot;line&quot;:1618,&quot;column&quot;:13}}"/>
            <Button variant="outline" size="sm" onClick={handleAddItem} disabled={!newItemName.trim()} data-qoder-id="qel-button-c948958c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-c948958c&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CoachPage&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:1626,&quot;column&quot;:13}}">
              <Plus size={14}  data-qoder-id="qel-plus-67a06e67" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-plus-67a06e67&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CoachPage&quot;,&quot;elementRole&quot;:&quot;plus&quot;,&quot;loc&quot;:{&quot;line&quot;:1627,&quot;column&quot;:15}}"/> 添加
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

/* ═══════════════════════ PAGE 7: WEEKLY ═══════════════════════ */
function WeeklyPage(qoderProps: Record<string, any>) {
  const [openWeek, setOpenWeek] = useState<string>('')
  const [reports, setReports] = useState<api.WeeklyReport[]>([])
  const [loading, setLoading] = useState(true)
  const [localChecked, setLocalChecked] = useState<Record<number, boolean>>({})
  const [newActionText, setNewActionText] = useState('')
  const [newActionWeek, setNewActionWeek] = useState('')
  const [newFocusText, setNewFocusText] = useState('')
  const [newFocusWeek, setNewFocusWeek] = useState('')
  const [dailyNotes, setDailyNotes] = useState<Record<string, string>>({})

  const DAYS = [
    { key: 'mon', label: '周一' },
    { key: 'tue', label: '周二' },
    { key: 'wed', label: '周三' },
    { key: 'thu', label: '周四' },
    { key: 'fri', label: '周五' },
  ]

  const loadReports = async () => {
    setLoading(true)
    try {
      const res = await api.getWeeklyReports()
      setReports(res.data)
      // Init local checked state from API data
      const checked: Record<number, boolean> = {}
      res.data.forEach(r => {
        r.actions.forEach(a => { if (a.completed) checked[a.id] = true })
      })
      setLocalChecked(checked)
      // Init daily notes from API
      const notes: Record<string, string> = {}
      res.data.forEach(r => {
        r.dailyNotes.forEach(n => { notes[`${r.weekId}_${n.dayKey}`] = n.content })
      })
      setDailyNotes(notes)
    } catch (err) {
      console.error('Failed to load weekly reports:', err)
    } finally { setLoading(false) }
  }

  useEffect(() => { loadReports() }, [])

  // Auto-expand current week
  useEffect(() => {
    if (reports.length > 0 && !openWeek) {
      const current = reports.find(r => r.isCurrent)
      setOpenWeek(current?.weekId || reports[0]?.weekId || '')
    }
  }, [reports])

  // Toggle action (local state + API)
  const handleToggleAction = async (weekId: string, actionId: number, completed: boolean) => {
    setLocalChecked(prev => ({ ...prev, [actionId]: !completed }))
    try {
      await api.updateWeeklyAction(weekId, actionId, { completed: !completed })
    } catch (err) {
      console.error('Failed to toggle action:', err)
      setLocalChecked(prev => ({ ...prev, [actionId]: completed }))
    }
  }

  // Add action to a week
  const handleAddAction = async (weekId: string) => {
    const text = newActionText.trim()
    if (!text) return
    setNewActionText('')
    try {
      await api.addWeeklyAction(weekId, text)
      await loadReports()
    } catch (err) {
      console.error('Failed to add action:', err)
    }
  }

  // Add focus to a week
  const handleAddFocus = async (weekId: string) => {
    const text = newFocusText.trim()
    if (!text) return
    const report = reports.find(r => r.weekId === weekId)
    if (!report) return
    setNewFocusText('')
    try {
      const focuses = [...report.focuses.map(f => f.text), text]
      await api.updateWeeklyFocuses(weekId, focuses)
      await loadReports()
    } catch (err) {
      console.error('Failed to add focus:', err)
    }
  }

  // Delete action
  const handleDeleteAction = async (weekId: string, actionId: number) => {
    try {
      await api.deleteWeeklyAction(weekId, actionId)
      setLocalChecked(prev => {
        const next = { ...prev }
        delete next[actionId]
        return next
      })
      await loadReports()
    } catch (err) {
      console.error('Failed to delete action:', err)
    }
  }

  // Daily note change (debounced save)
  const noteTimers = {} as Record<string, ReturnType<typeof setTimeout>>
  const handleDailyNoteChange = (weekId: string, dayKey: string, value: string) => {
    setDailyNotes(prev => ({ ...prev, [`${weekId}_${dayKey}`]: value }))
    const timerKey = `${weekId}_${dayKey}`
    if (noteTimers[timerKey]) clearTimeout(noteTimers[timerKey])
    noteTimers[timerKey] = setTimeout(async () => {
      try {
        await api.updateWeeklyDailyNote(weekId, dayKey, value)
      } catch (err) {
        console.error('Failed to save daily note:', err)
      }
    }, 800)
  }

  if (loading) {
    return (
      <div style={{ ...({ display: 'flex', justifyContent: 'center', padding: 60 }), ...((qoderProps as any)?.style) }} className={(qoderProps as any)?.className} data-qoder-id={(qoderProps as any)?.["data-qoder-id"]} data-qoder-source={(qoderProps as any)?.["data-qoder-source"]}>
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--fg-muted)' }}  data-qoder-id="qel-animate-spin-36a027fb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-animate-spin-36a027fb&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;WeeklyPage&quot;,&quot;elementRole&quot;:&quot;animate-spin&quot;,&quot;loc&quot;:{&quot;line&quot;:1761,&quot;column&quot;:9}}"/>
      </div>
    )
  }

  return (
    <>
      <div className="page-header" data-qoder-id="qel-page-header-d895e1b7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-page-header-d895e1b7&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;WeeklyPage&quot;,&quot;elementRole&quot;:&quot;page-header&quot;,&quot;loc&quot;:{&quot;line&quot;:1768,&quot;column&quot;:7}}">
        <h1 className="page-title" data-qoder-id="qel-page-title-418393e5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-page-title-418393e5&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;WeeklyPage&quot;,&quot;elementRole&quot;:&quot;page-title&quot;,&quot;loc&quot;:{&quot;line&quot;:1769,&quot;column&quot;:9}}">周报</h1>
        <p className="page-subtitle" data-qoder-id="qel-page-subtitle-7ebe9c00" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-page-subtitle-7ebe9c00&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;WeeklyPage&quot;,&quot;elementRole&quot;:&quot;page-subtitle&quot;,&quot;loc&quot;:{&quot;line&quot;:1770,&quot;column&quot;:9}}">工作记录与回顾</p>
      </div>
      <div className="page-body" data-qoder-id="qel-page-body-55d5dac0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-page-body-55d5dac0&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;WeeklyPage&quot;,&quot;elementRole&quot;:&quot;page-body&quot;,&quot;loc&quot;:{&quot;line&quot;:1772,&quot;column&quot;:7}}">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} data-qoder-id="qel-div-838711e0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-838711e0&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;WeeklyPage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1773,&quot;column&quot;:9}}">
          {reports.map(r => {
            const isOpen = openWeek === r.weekId
            return (
              <div key={r.weekId} className="week-panel" data-qoder-id="qel-week-panel-f900c253" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-week-panel-f900c253&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;WeeklyPage&quot;,&quot;elementRole&quot;:&quot;week-panel&quot;,&quot;loc&quot;:{&quot;line&quot;:1777,&quot;column&quot;:15}}">
                <div className="week-panel-header" onClick={() => setOpenWeek(isOpen ? '' : r.weekId)} data-qoder-id="qel-week-panel-header-cb07215a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-week-panel-header-cb07215a&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;WeeklyPage&quot;,&quot;elementRole&quot;:&quot;week-panel-header&quot;,&quot;loc&quot;:{&quot;line&quot;:1778,&quot;column&quot;:17}}">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} data-qoder-id="qel-div-8a871ce5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-8a871ce5&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;WeeklyPage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1779,&quot;column&quot;:19}}">
                    {isOpen ? <ChevronDown size={16}  data-qoder-id="qel-chevrondown-1fd18fcc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-chevrondown-1fd18fcc&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;WeeklyPage&quot;,&quot;elementRole&quot;:&quot;chevrondown&quot;,&quot;loc&quot;:{&quot;line&quot;:1780,&quot;column&quot;:31}}"/> : <ChevronRight size={16}  data-qoder-id="qel-chevronright-f0c52aa9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-chevronright-f0c52aa9&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;WeeklyPage&quot;,&quot;elementRole&quot;:&quot;chevronright&quot;,&quot;loc&quot;:{&quot;line&quot;:1780,&quot;column&quot;:59}}"/>}
                    <span style={{ fontSize: 14, fontWeight: 600 }} data-qoder-id="qel-span-48acb6e2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-48acb6e2&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;WeeklyPage&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:1781,&quot;column&quot;:21}}">{r.label}</span>
                    {r.isCurrent && <span className="badge badge-teal" data-qoder-id="qel-badge-61cb418c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-badge-61cb418c&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;WeeklyPage&quot;,&quot;elementRole&quot;:&quot;badge&quot;,&quot;loc&quot;:{&quot;line&quot;:1782,&quot;column&quot;:37}}">本周</span>}
                  </div>
                </div>
                {isOpen && (
                  <div className="week-panel-body" data-qoder-id="qel-week-panel-body-2fcf71e5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-week-panel-body-2fcf71e5&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;WeeklyPage&quot;,&quot;elementRole&quot;:&quot;week-panel-body&quot;,&quot;loc&quot;:{&quot;line&quot;:1786,&quot;column&quot;:19}}">
                    {/* Focus Items */}
                    <div style={{ marginBottom: 20 }} data-qoder-id="qel-div-1e05995f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-1e05995f&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;WeeklyPage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1788,&quot;column&quot;:21}}">
                      <div className="detail-section-title" data-qoder-id="qel-detail-section-title-6a583061" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-detail-section-title-6a583061&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;WeeklyPage&quot;,&quot;elementRole&quot;:&quot;detail-section-title&quot;,&quot;loc&quot;:{&quot;line&quot;:1789,&quot;column&quot;:23}}">本周重点</div>
                      {r.focuses.map((f, i) => (
                        <div key={i} className="action-row" data-qoder-id="qel-action-row-9d70013d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-action-row-9d70013d&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;WeeklyPage&quot;,&quot;elementRole&quot;:&quot;action-row&quot;,&quot;loc&quot;:{&quot;line&quot;:1791,&quot;column&quot;:25}}">
                          <div className="dot dot-teal"  data-qoder-id="qel-dot-c0b30a7c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-dot-c0b30a7c&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;WeeklyPage&quot;,&quot;elementRole&quot;:&quot;dot&quot;,&quot;loc&quot;:{&quot;line&quot;:1792,&quot;column&quot;:27}}"/>
                          <span className="action-row-label" data-qoder-id="qel-action-row-label-2623be8f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-action-row-label-2623be8f&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;WeeklyPage&quot;,&quot;elementRole&quot;:&quot;action-row-label&quot;,&quot;loc&quot;:{&quot;line&quot;:1793,&quot;column&quot;:27}}">{f.text}</span>
                        </div>
                      ))}
                      <div style={{ display: 'flex', gap: 6, marginTop: 8 }} data-qoder-id="qel-div-1b0594a6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-1b0594a6&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;WeeklyPage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1796,&quot;column&quot;:23}}">
                        <input
                          type="text"
                          placeholder="添加重点..."
                          value={newFocusWeek === r.weekId ? newFocusText : ''}
                          onFocus={() => setNewFocusWeek(r.weekId)}
                          onChange={e => { setNewFocusWeek(r.weekId); setNewFocusText(e.target.value) }}
                          onKeyDown={e => { if (e.key === 'Enter') handleAddFocus(r.weekId) }}
                          style={{ flex: 1, padding: '6px 10px', fontSize: 13, fontFamily: 'var(--font-sans)', color: 'var(--fg)', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', outline: 'none' }}
                         data-qoder-id="qel-input-68c4077d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-input-68c4077d&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;WeeklyPage&quot;,&quot;elementRole&quot;:&quot;input&quot;,&quot;loc&quot;:{&quot;line&quot;:1797,&quot;column&quot;:25}}"/>
                        <button onClick={() => handleAddFocus(r.weekId)} style={{ padding: '4px 10px', fontSize: 12, cursor: 'pointer', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--fg-secondary)' }} data-qoder-id="qel-button-f01bde4c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-f01bde4c&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;WeeklyPage&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:1806,&quot;column&quot;:25}}">
                          <Plus size={14}  data-qoder-id="qel-plus-c51c8027" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-plus-c51c8027&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;WeeklyPage&quot;,&quot;elementRole&quot;:&quot;plus&quot;,&quot;loc&quot;:{&quot;line&quot;:1807,&quot;column&quot;:27}}"/>
                        </button>
                      </div>
                    </div>
                    {/* Action Items */}
                    <div style={{ marginBottom: 20 }} data-qoder-id="qel-div-a308a955" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-a308a955&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;WeeklyPage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1812,&quot;column&quot;:21}}">
                      <div className="detail-section-title" data-qoder-id="qel-detail-section-title-e3551d45" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-detail-section-title-e3551d45&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;WeeklyPage&quot;,&quot;elementRole&quot;:&quot;detail-section-title&quot;,&quot;loc&quot;:{&quot;line&quot;:1813,&quot;column&quot;:23}}">行动清单</div>
                      {r.actions.map(a => {
                        const isChecked = !!localChecked[a.id]
                        return (
                          <div key={a.id} className="action-row" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }} data-qoder-id="qel-action-row-9e724167" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-action-row-9e724167&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;WeeklyPage&quot;,&quot;elementRole&quot;:&quot;action-row&quot;,&quot;loc&quot;:{&quot;line&quot;:1817,&quot;column&quot;:27}}">
                            <div onClick={() => handleToggleAction(r.weekId, a.id, !!a.completed)} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }} data-qoder-id="qel-div-a008a49c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-a008a49c&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;WeeklyPage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1818,&quot;column&quot;:29}}">
                              {isChecked
                                ? <CheckSquare size={14} style={{ color: 'var(--status-success)', flexShrink: 0 }}  data-qoder-id="qel-checksquare-7d1bad7d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-checksquare-7d1bad7d&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;WeeklyPage&quot;,&quot;elementRole&quot;:&quot;checksquare&quot;,&quot;loc&quot;:{&quot;line&quot;:1820,&quot;column&quot;:35}}"/>
                                : <Square size={14} style={{ color: 'var(--fg-muted)', flexShrink: 0 }}  data-qoder-id="qel-square-f134ee8c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-square-f134ee8c&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;WeeklyPage&quot;,&quot;elementRole&quot;:&quot;square&quot;,&quot;loc&quot;:{&quot;line&quot;:1821,&quot;column&quot;:35}}"/>
                              }
                              <span className="action-row-label" style={{
                                textDecoration: isChecked ? 'line-through' : 'none',
                                color: isChecked ? 'var(--fg-muted)' : 'var(--fg)',
                              }} data-qoder-id="qel-action-row-label-292601df" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-action-row-label-292601df&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;WeeklyPage&quot;,&quot;elementRole&quot;:&quot;action-row-label&quot;,&quot;loc&quot;:{&quot;line&quot;:1823,&quot;column&quot;:31}}">{a.text}</span>
                            </div>
                            <button onClick={() => handleDeleteAction(r.weekId, a.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--fg-muted)', opacity: 0.5 }} title="删除" data-qoder-id="qel-button-771ef168" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-771ef168&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;WeeklyPage&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:1828,&quot;column&quot;:29}}">
                              <Trash2 size={12}  data-qoder-id="qel-trash2-f85cf1bd" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-trash2-f85cf1bd&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;WeeklyPage&quot;,&quot;elementRole&quot;:&quot;trash2&quot;,&quot;loc&quot;:{&quot;line&quot;:1829,&quot;column&quot;:31}}"/>
                            </button>
                          </div>
                        )
                      })}
                      <div style={{ display: 'flex', gap: 6, marginTop: 8 }} data-qoder-id="qel-div-aa08b45a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-aa08b45a&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;WeeklyPage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1834,&quot;column&quot;:23}}">
                        <input
                          type="text"
                          placeholder="添加行动项..."
                          value={newActionWeek === r.weekId ? newActionText : ''}
                          onFocus={() => setNewActionWeek(r.weekId)}
                          onChange={e => { setNewActionWeek(r.weekId); setNewActionText(e.target.value) }}
                          onKeyDown={e => { if (e.key === 'Enter') handleAddAction(r.weekId) }}
                          style={{ flex: 1, padding: '6px 10px', fontSize: 13, fontFamily: 'var(--font-sans)', color: 'var(--fg)', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', outline: 'none' }}
                         data-qoder-id="qel-input-6dc88c8a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-input-6dc88c8a&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;WeeklyPage&quot;,&quot;elementRole&quot;:&quot;input&quot;,&quot;loc&quot;:{&quot;line&quot;:1835,&quot;column&quot;:25}}"/>
                        <button onClick={() => handleAddAction(r.weekId)} style={{ padding: '4px 10px', fontSize: 12, cursor: 'pointer', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--fg-secondary)' }} data-qoder-id="qel-button-652113a9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-652113a9&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;WeeklyPage&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:1844,&quot;column&quot;:25}}">
                          <Plus size={14}  data-qoder-id="qel-plus-4621c868" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-plus-4621c868&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;WeeklyPage&quot;,&quot;elementRole&quot;:&quot;plus&quot;,&quot;loc&quot;:{&quot;line&quot;:1845,&quot;column&quot;:27}}"/>
                        </button>
                      </div>
                    </div>
                    {/* Daily Notes */}
                    <div data-qoder-id="qel-div-a80aefcb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-a80aefcb&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;WeeklyPage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1850,&quot;column&quot;:21}}">
                      <div className="detail-section-title" data-qoder-id="qel-detail-section-title-e052d9f5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-detail-section-title-e052d9f5&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;WeeklyPage&quot;,&quot;elementRole&quot;:&quot;detail-section-title&quot;,&quot;loc&quot;:{&quot;line&quot;:1851,&quot;column&quot;:23}}">每日记录</div>
                      {DAYS.map(d => (
                        <div key={d.key} style={{ marginBottom: 12 }} data-qoder-id="qel-div-ae0af93d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-ae0af93d&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;WeeklyPage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1853,&quot;column&quot;:25}}">
                          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-secondary)', marginBottom: 6 }} data-qoder-id="qel-div-ab0af484" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-ab0af484&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;WeeklyPage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1854,&quot;column&quot;:27}}">{d.label}</div>
                          <textarea
                            style={{ width: '100%', minHeight: 60, padding: '10px 14px', fontSize: 13, fontFamily: 'var(--font-sans)', color: 'var(--fg)', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', resize: 'vertical', outline: 'none' }}
                            placeholder={`${d.label}的工作记录...`}
                            value={dailyNotes[`${r.weekId}_${d.key}`] || ''}
                            onChange={e => handleDailyNoteChange(r.weekId, d.key, e.target.value)}
                           data-qoder-id="qel-textarea-f9d5f6eb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-textarea-f9d5f6eb&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;WeeklyPage&quot;,&quot;elementRole&quot;:&quot;textarea&quot;,&quot;loc&quot;:{&quot;line&quot;:1855,&quot;column&quot;:27}}"/>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}

/* ════════════════════ QUICK NOTE MODAL ════════════════════ */
function QuickNoteModal({ customers, onClose, ...qoderProps }: { customers: Customer[]; onClose: () => void } & Record<string, any>) {
  const [custId, setCustId] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [recentNotes, setRecentNotes] = useState<api.Note[]>([])
  const [notesLoading, setNotesLoading] = useState(false)

  // Load recent notes on mount
  useEffect(() => {
    setNotesLoading(true)
    api.getNotes().then(res => {
      setRecentNotes(res.data)
    }).catch(() => { /* ignore */ })
    .finally(() => setNotesLoading(false))
  }, [])

  const handleSave = async () => {
    if (!custId || !note.trim()) return
    setSaving(true)
    try {
      const res = await api.createNote({ customerId: custId, content: note.trim() })
      setNote('')
      // Prepend new note to history
      setRecentNotes(prev => [{ ...res.data, customerName: customers.find(c => c.id === custId)?.name }, ...prev])
    } catch (err) {
      console.error('Failed to save note:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteNote = async (id: number) => {
    try {
      await api.deleteNote(id)
      setRecentNotes(prev => prev.filter(n => n.id !== id))
    } catch (err) { console.error('Failed to delete note:', err) }
  }

  return (
    <div className={["modal-overlay", (qoderProps as any)?.className].filter(Boolean).join(" ")} onClick={e => { if (e.target === e.currentTarget) onClose() }} style={(qoderProps as any)?.style} data-qoder-id={(qoderProps as any)?.["data-qoder-id"]} data-qoder-source={(qoderProps as any)?.["data-qoder-source"]}>
      <div className="modal-panel" style={{ maxWidth: 520 }} data-qoder-id="qel-modal-panel-d10d055e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-modal-panel-d10d055e&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;QuickNoteModal&quot;,&quot;elementRole&quot;:&quot;modal-panel&quot;,&quot;loc&quot;:{&quot;line&quot;:1051,&quot;column&quot;:7}}">
        <div className="modal-header" data-qoder-id="qel-modal-header-2b935a40" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-modal-header-2b935a40&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;QuickNoteModal&quot;,&quot;elementRole&quot;:&quot;modal-header&quot;,&quot;loc&quot;:{&quot;line&quot;:1052,&quot;column&quot;:9}}">
          <h2 className="modal-title" data-qoder-id="qel-modal-title-58c3f85f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-modal-title-58c3f85f&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;QuickNoteModal&quot;,&quot;elementRole&quot;:&quot;modal-title&quot;,&quot;loc&quot;:{&quot;line&quot;:1053,&quot;column&quot;:11}}">速记</h2>
          <Button variant="ghost" size="icon" onClick={onClose} data-qoder-id="qel-button-ad688a0f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-ad688a0f&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;QuickNoteModal&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:1054,&quot;column&quot;:11}}"><X size={18}  data-qoder-id="qel-x-498164a0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-x-498164a0&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;QuickNoteModal&quot;,&quot;elementRole&quot;:&quot;x&quot;,&quot;loc&quot;:{&quot;line&quot;:1054,&quot;column&quot;:65}}"/></Button>
        </div>
        {/* Write area */}
        <div style={{ marginBottom: 12 }} data-qoder-id="qel-div-1c3bad0f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-1c3bad0f&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;QuickNoteModal&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1922,&quot;column&quot;:9}}">
          <select value={custId} onChange={e => setCustId(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', fontSize: 14, fontFamily: 'var(--font-sans)', color: 'var(--fg)', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', outline: 'none' }} data-qoder-id="qel-select-a4633af8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-select-a4633af8&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;QuickNoteModal&quot;,&quot;elementRole&quot;:&quot;select&quot;,&quot;loc&quot;:{&quot;line&quot;:1923,&quot;column&quot;:11}}">
            <option value="" data-qoder-id="qel-option-10eb0a77" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-option-10eb0a77&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;QuickNoteModal&quot;,&quot;elementRole&quot;:&quot;option&quot;,&quot;loc&quot;:{&quot;line&quot;:1925,&quot;column&quot;:13}}">选择客户...</option>
            {customers.filter(c => !c.isGroup).map(c => (
              <option key={c.id} value={c.id} data-qoder-id="qel-option-0feb08e4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-option-0feb08e4&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;QuickNoteModal&quot;,&quot;elementRole&quot;:&quot;option&quot;,&quot;loc&quot;:{&quot;line&quot;:1927,&quot;column&quot;:15}}">{c.name}</option>
            ))}
          </select>
        </div>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="记录沟通内容..."
          style={{ width: '100%', minHeight: 100, padding: '12px 14px', fontSize: 14, fontFamily: 'var(--font-sans)', color: 'var(--fg)', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', resize: 'vertical', outline: 'none', marginBottom: 12 }}
         data-qoder-id="qel-textarea-8344b4f7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-textarea-8344b4f7&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;QuickNoteModal&quot;,&quot;elementRole&quot;:&quot;textarea&quot;,&quot;loc&quot;:{&quot;line&quot;:1931,&quot;column&quot;:9}}"/>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 20 }} data-qoder-id="qel-div-1f3bb1c8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-1f3bb1c8&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;QuickNoteModal&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1937,&quot;column&quot;:9}}">
          <Button variant="default" onClick={handleSave} disabled={saving || !custId || !note.trim()} data-qoder-id="qel-button-2dae5c64" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-2dae5c64&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;QuickNoteModal&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:1938,&quot;column&quot;:11}}">
            {saving ? '保存中...' : '保存'}
          </Button>
        </div>
        {/* Recent notes history */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }} data-qoder-id="qel-div-1f3df05f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-1f3df05f&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;QuickNoteModal&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1943,&quot;column&quot;:9}}">
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-secondary)', marginBottom: 8 }} data-qoder-id="qel-div-203df1f2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-203df1f2&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;QuickNoteModal&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1944,&quot;column&quot;:11}}">最近笔记</div>
          {notesLoading ? (
            <div style={{ padding: 12, color: 'var(--fg-muted)', fontSize: 12 }} data-qoder-id="qel-div-213df385" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-213df385&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;QuickNoteModal&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1946,&quot;column&quot;:13}}">加载中...</div>
          ) : recentNotes.length === 0 ? (
            <div style={{ padding: 12, color: 'var(--fg-muted)', fontSize: 12 }} data-qoder-id="qel-div-1a3de880" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-1a3de880&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;QuickNoteModal&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1948,&quot;column&quot;:13}}">暂无笔记</div>
          ) : (
            <div style={{ maxHeight: 240, overflowY: 'auto' }} data-qoder-id="qel-div-1b3dea13" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-1b3dea13&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;QuickNoteModal&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1950,&quot;column&quot;:13}}">
              {recentNotes.map(n => (
                <div key={n.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: 8 }} data-qoder-id="qel-div-1c3deba6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-1c3deba6&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;QuickNoteModal&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1952,&quot;column&quot;:17}}">
                  <div style={{ flex: 1, minWidth: 0 }} data-qoder-id="qel-div-1d3ded39" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-1d3ded39&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;QuickNoteModal&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1953,&quot;column&quot;:19}}">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }} data-qoder-id="qel-div-263dfb64" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-263dfb64&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;QuickNoteModal&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1954,&quot;column&quot;:21}}">
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }} data-qoder-id="qel-span-de325253" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-de325253&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;QuickNoteModal&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:1955,&quot;column&quot;:23}}">{n.customerName || '未知客户'}</span>
                      <span style={{ fontSize: 11, color: 'var(--fg-muted)' }} data-qoder-id="qel-span-6b356ee1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-6b356ee1&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;QuickNoteModal&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:1956,&quot;column&quot;:23}}">{n.createdAt?.slice(0, 16).replace('T', ' ')}</span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--fg)', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }} data-qoder-id="qel-div-a340fec2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-a340fec2&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;QuickNoteModal&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1958,&quot;column&quot;:21}}">{n.content}</div>
                  </div>
                  <button onClick={() => handleDeleteNote(n.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-muted)', padding: 2, flexShrink: 0, alignSelf: 'flex-start' }} title="删除" data-qoder-id="qel-button-404649e7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-404649e7&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;QuickNoteModal&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:1960,&quot;column&quot;:19}}">
                    <Trash2 size={12}  data-qoder-id="qel-trash2-d31c447c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-trash2-d31c447c&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;QuickNoteModal&quot;,&quot;elementRole&quot;:&quot;trash2&quot;,&quot;loc&quot;:{&quot;line&quot;:1961,&quot;column&quot;:21}}"/>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
