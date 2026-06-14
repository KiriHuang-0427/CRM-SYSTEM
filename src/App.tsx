import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users, GitBranch, Swords, Activity, Bot, FileText,
  Zap, Sun, Moon, Search, X, ChevronDown, ChevronRight,
  Target, AlertTriangle, Star, BarChart3,
  CheckSquare, Square, Megaphone, Shield, ArrowUpCircle,
  Clock, Calendar, Menu, Plus, Trash2, Loader2, RefreshCw, Edit3,
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
import type { Customer, KeyPerson, Todo as TodoItem, PipelineStageSummary } from '@/lib/api'
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

type TabId = 'dashboard' | 'customers' | 'pipeline' | 'competitive' | 'energy' | 'coach' | 'weekly'

const NAV_ITEMS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: '仪表盘', icon: <LayoutDashboard size={18}  data-qoder-id="qel-layoutdashboard-2eed58a0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-layoutdashboard-2eed58a0&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;layoutdashboard&quot;,&quot;loc&quot;:{&quot;line&quot;:24,&quot;column&quot;:42}}"/> },
  { id: 'customers', label: '客户管理', icon: <Users size={18}  data-qoder-id="qel-users-3ac6a549" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-users-3ac6a549&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;users&quot;,&quot;loc&quot;:{&quot;line&quot;:25,&quot;column&quot;:43}}"/> },
  { id: 'pipeline', label: 'Pipeline 汇总', icon: <GitBranch size={18}  data-qoder-id="qel-gitbranch-6c16aae6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-gitbranch-6c16aae6&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;gitbranch&quot;,&quot;loc&quot;:{&quot;line&quot;:26,&quot;column&quot;:42}}"/> },
  { id: 'competitive', label: '竞品分析', icon: <Swords size={18}  data-qoder-id="qel-swords-169f8ddf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-swords-169f8ddf&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;swords&quot;,&quot;loc&quot;:{&quot;line&quot;:27,&quot;column&quot;:45}}"/> },
  { id: 'energy', label: '精力分配', icon: <Activity size={18}  data-qoder-id="qel-activity-1de6a06e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-activity-1de6a06e&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;activity&quot;,&quot;loc&quot;:{&quot;line&quot;:28,&quot;column&quot;:40}}"/> },
  { id: 'coach', label: 'AI 教练', icon: <Bot size={18}  data-qoder-id="qel-bot-34694d61" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-bot-34694d61&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;bot&quot;,&quot;loc&quot;:{&quot;line&quot;:29,&quot;column&quot;:40}}"/> },
  { id: 'weekly', label: '周报', icon: <FileText size={18}  data-qoder-id="qel-filetext-b5c82248" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-filetext-b5c82248&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;filetext&quot;,&quot;loc&quot;:{&quot;line&quot;:30,&quot;column&quot;:38}}"/> },
]

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
          className={cn('bottom-tab-item', ['competitive', 'energy', 'coach', 'weekly'].includes(tab) && 'active')}
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
              <div style={{ display: 'flex', gap: 4, marginLeft: 4 }}>
                <Button variant={todoFilter === 'pending' ? 'default' : 'ghost'} size="sm"
                  onClick={() => setTodoFilter('pending')} style={{ fontSize: 12, padding: '2px 10px' }}>当前</Button>
                <Button variant={todoFilter === 'completed' ? 'default' : 'ghost'} size="sm"
                  onClick={() => setTodoFilter('completed')} style={{ fontSize: 12, padding: '2px 10px' }}>已完成</Button>
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
              <EmptyState icon={<CheckSquare size={20} />} message={todoFilter === 'pending' ? '暂无待办事项' : '暂无已完成事项'} hint={todoFilter === 'pending' ? '在上方输入框添加待办' : '完成待办后将在此显示'} />
            )}
            {/* Scrollable todo list */}
            <div style={{ maxHeight: 320, overflowY: 'auto', paddingRight: 4 }}>
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
                    />
                  ) : (
                    <span
                      className="action-row-label"
                      style={{ textDecoration: t.completed ? 'line-through' : 'none', opacity: t.completed ? 0.5 : 1, cursor: 'pointer' }}
                      onDoubleClick={() => { setEditingTodoId(t.id); setEditTodoText(t.text) }}
                      data-qoder-id="qel-action-row-label-1ba3c7c9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-action-row-label-1ba3c7c9&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;action-row-label&quot;,&quot;loc&quot;:{&quot;line&quot;:359,&quot;column&quot;:17}}"
                    >{t.text}</span>
                  )}
                  {t.deadline && <span className={t.deadline === '已过期' ? 'action-row-urgent' : 'action-row-meta'} data-qoder-id="qel-span-4bb65423" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-4bb65423&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:360,&quot;column&quot;:32}}">{t.deadline}</span>}
                  {t.createdAt && <span className="action-row-meta" style={{ fontSize: 11 }}>{t.createdAt.slice(0, 10)}</span>}
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
            <div style={{ maxHeight: 500, overflowY: 'auto' }}>
            <div style={{ width: '100%', height: Math.max(200, chartData.length * 32) }} data-qoder-id="qel-div-4917256e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-4917256e&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:374,&quot;column&quot;:13}}">
              <ResponsiveContainer width="100%" height="100%" data-qoder-id="qel-responsivecontainer-cf2e17ab" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-responsivecontainer-cf2e17ab&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;responsivecontainer&quot;,&quot;loc&quot;:{&quot;line&quot;:375,&quot;column&quot;:15}}">
                <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }} data-qoder-id="qel-barchart-e711f76e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-barchart-e711f76e&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;barchart&quot;,&quot;loc&quot;:{&quot;line&quot;:376,&quot;column&quot;:17}}">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"  data-qoder-id="qel-cartesiangrid-27a234f5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-cartesiangrid-27a234f5&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;cartesiangrid&quot;,&quot;loc&quot;:{&quot;line&quot;:377,&quot;column&quot;:19}}"/>
                  <XAxis type="number" tickFormatter={(v: number) => `${Math.round(v / 1000)}K`} tick={{ fontSize: 11, fill: 'var(--fg-tertiary)' }}  data-qoder-id="qel-xaxis-f3eafece" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-xaxis-f3eafece&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;xaxis&quot;,&quot;loc&quot;:{&quot;line&quot;:378,&quot;column&quot;:19}}"/>
                  <YAxis type="category" dataKey="name" width={200} tick={{ fontSize: 11, fill: 'var(--fg-secondary)' }} tickFormatter={(v: string) => v.length > 18 ? v.slice(0, 18) + '…' : v}  data-qoder-id="qel-yaxis-583835d3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-yaxis-583835d3&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;DashboardPage&quot;,&quot;elementRole&quot;:&quot;yaxis&quot;,&quot;loc&quot;:{&quot;line&quot;:379,&quot;column&quot;:19}}"/>
                  <ReTooltip
                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                    formatter={(value: number, name: string) => [fmtK(value), name === 'cy' ? 'CY YTD' : 'PY YTD']}
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
function CreateCustomerModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
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
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-panel" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <h2 className="modal-title">新增客户</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X size={18} /></Button>
        </div>
        {error && <div style={{ padding: '8px 12px', margin: '0 0 12px', background: 'var(--danger-bg, #fef2f2)', color: 'var(--status-danger)', borderRadius: 'var(--radius-sm)', fontSize: 13 }}>{error}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, display: 'block' }}>客户名称 *</label>
            <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="输入客户名称" />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, display: 'block' }}>行业</label>
            <input style={inputStyle} value={industry} onChange={e => setIndustry(e.target.value)} placeholder="输入行业" />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, display: 'block' }}>优先级</label>
            <select style={inputStyle} value={color} onChange={e => setColor(e.target.value as any)}>
              <option value="red">A类 · 重点攻坚</option>
              <option value="orange">B类 · 稳步推进</option>
              <option value="green">C类 · 培育拓展</option>
              <option value="gray">D类 · 观察维护</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, display: 'block' }}>竞品</label>
            <input style={inputStyle} value={comp} onChange={e => setComp(e.target.value)} placeholder="输入竞品名称" />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button variant="default" onClick={handleSubmit} disabled={saving || !name.trim()}>
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
          <Button variant="outline" size="sm" onClick={() => setShowCreate(true)}><Plus size={14} /></Button>
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
      {showCreate && <CreateCustomerModal onClose={() => setShowCreate(false)} onCreated={() => { onReload(); setShowCreate(false) }} />}
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
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-panel">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">{c.name}</h2>
            <div style={{ fontSize: 13, color: 'var(--fg-secondary)', marginTop: 4 }}>
              {c.industry}{c.comp ? ` · 竞品: ${c.comp}` : ''}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <Button variant="ghost" size="icon" onClick={() => editing ? handleSave() : startEdit()}>
              {editing ? <CheckSquare size={18} /> : <Edit3 size={18} />}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleDelete}><Trash2 size={18} /></Button>
            <Button variant="ghost" size="icon" onClick={onClose}><X size={18} /></Button>
          </div>
        </div>

        {/* Basic Info */}
        <Section title="基本信息">
          <div className="detail-grid">
            <div><div className="detail-label">优先级</div><span className={cn('badge', `badge-${c.color}`)}>{priorityLabel(c.color)}</span></div>
            {editing ? (
              <>
                <div>
                  <div className="detail-label">名称</div>
                  <input style={inlineInputStyle} value={editName} onChange={e => setEditName(e.target.value)} />
                </div>
                <div>
                  <div className="detail-label">行业</div>
                  <input style={inlineInputStyle} value={editIndustry} onChange={e => setEditIndustry(e.target.value)} />
                </div>
              </>
            ) : (
              <div><div className="detail-label">行业</div><div className="detail-value">{c.industry}</div></div>
            )}
            <div><div className="detail-label">上次拜访</div><div className="detail-value">{c.lastVisit ? `${c.lastVisit} (${daysSince(c.lastVisit)}天前)` : '未拜访'}</div></div>
            {c.nextYear && <div><div className="detail-label">明年预期</div><div className="detail-value">{c.nextYear}</div></div>}
          </div>
          {editing && (
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <Button variant="default" size="sm" onClick={handleSave}>保存</Button>
              <Button variant="outline" size="sm" onClick={() => setEditing(false)}>取消</Button>
            </div>
          )}
        </Section>

        {/* Sales Data */}
        <Section title="销售数据">
          <div className="detail-grid">
            <div><div className="detail-label">CY YTD</div><div className="detail-value" style={{ fontSize: 20, fontWeight: 700 }}>{fmtK(cy)}</div></div>
            <div><div className="detail-label">PY YTD</div><div className="detail-value">{fmtK(py)}</div></div>
            <div><div className="detail-label">同比增长</div><div className="detail-value" style={{ color: growth >= 0 ? 'var(--status-success)' : 'var(--status-danger)', fontWeight: 600 }}>{gStr}</div></div>
            {sd.CY_P8 ? <div><div className="detail-label">P8 预测</div><div className="detail-value" style={{ color: 'var(--accent)', fontWeight: 600 }}>{fmtK(sd.CY_P8)}</div></div> : null}
          </div>
        </Section>

        {/* Key Persons with CRUD */}
        <Section title="关键联系人">
          {(c.keyPersons || []).map((p, i) => (
            <div key={p.id ?? i} style={{ marginBottom: 6 }}>
              {editingContactId === p.id ? (
                <div style={{ padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input style={inlineInputStyle} value={editCName} onChange={e => setEditCName(e.target.value)} placeholder="姓名" />
                    <input style={inlineInputStyle} value={editCRole} onChange={e => setEditCRole(e.target.value)} placeholder="职位" />
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input style={inlineInputStyle} value={editCPhone} onChange={e => setEditCPhone(e.target.value)} placeholder="电话" />
                    <input style={inlineInputStyle} value={editCEmail} onChange={e => setEditCEmail(e.target.value)} placeholder="邮箱" />
                  </div>
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                    <Button variant="default" size="sm" onClick={() => handleUpdateContact(p.id!)}>保存</Button>
                    <Button variant="outline" size="sm" onClick={() => setEditingContactId(null)}>取消</Button>
                  </div>
                </div>
              ) : (
                <div className="person-row">
                  <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>
                    {p.name.slice(0, 1)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 550 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--fg-tertiary)' }}>{p.role}{p.phone ? ` · ${p.phone}` : ''}{p.email ? ` · ${p.email}` : ''}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star key={s} size={12} style={{ color: s < p.stars ? 'var(--status-warning)' : 'var(--border)', fill: s < p.stars ? 'var(--status-warning)' : 'transparent' }} />
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 2 }}>
                    <Button variant="ghost" size="icon" onClick={() => startEditContact(p)}><Edit3 size={14} /></Button>
                    {p.id != null && <Button variant="ghost" size="icon" onClick={() => handleDeleteContact(p.id!)}><Trash2 size={14} /></Button>}
                  </div>
                </div>
              )}
            </div>
          ))}
          {/* Add contact form */}
          {addingContact ? (
            <div style={{ padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <input style={inlineInputStyle} value={newCName} onChange={e => setNewCName(e.target.value)} placeholder="姓名" />
                <input style={inlineInputStyle} value={newCRole} onChange={e => setNewCRole(e.target.value)} placeholder="职位" />
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input style={inlineInputStyle} value={newCPhone} onChange={e => setNewCPhone(e.target.value)} placeholder="电话" />
                <input style={inlineInputStyle} value={newCEmail} onChange={e => setNewCEmail(e.target.value)} placeholder="邮箱" />
              </div>
              <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                <Button variant="default" size="sm" onClick={handleAddContact}>添加</Button>
                <Button variant="outline" size="sm" onClick={() => setAddingContact(false)}>取消</Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setAddingContact(true)} style={{ marginTop: 8, width: '100%' }}>
              <Plus size={14} /> 添加联系人
            </Button>
          )}
        </Section>

        {/* Pipeline */}
        {c.pipeline?.length > 0 && (
          <Section title="商机">
            {c.pipeline.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', marginBottom: 6, borderLeft: `3px solid ${PIPE_STAGES.find(s => s.num === p.pipeStage)?.color || 'var(--accent)'}` }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 550 }}>{p.name}</div>
                  {p.stage && <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', marginTop: 2 }}>{p.stage}</div>}
                </div>
                {p.amount && <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>{p.amount}</span>}
              </div>
            ))}
          </Section>
        )}

        {/* Next Actions */}
        {c.nextActions?.length > 0 && (
          <Section title="下一步行动">
            {c.nextActions.map((a, i) => (
              <div key={i} className="action-row">
                <Calendar size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                <span className="action-row-label">{a.action}</span>
                <span className={a.deadline === '已过期' ? 'action-row-urgent' : 'action-row-meta'}>{a.deadline}</span>
              </div>
            ))}
          </Section>
        )}

        {/* Risk */}
        {c.risk && (
          <Section title="风险">
            <div className="risk-box">{c.risk}</div>
          </Section>
        )}

        {/* AI Coach */}
        {c.talkStrategy && (
          <Section title="AI 策略建议">
            <div style={{ padding: '16px 20px', background: 'var(--accent-bg)', borderRadius: 'var(--radius-sm)', fontSize: 13, lineHeight: 1.7, color: 'var(--fg-secondary)', borderLeft: '3px solid var(--accent)' }}>
              {c.talkStrategy}
            </div>
          </Section>
        )}

        {/* Talk Points */}
        {c.talkPoints?.length > 0 && (
          <Section title="话术参考">
            {c.talkPoints.map((tp, i) => (
              <div key={i} className="talk-point" style={{ '--tp-color': tp.color } as React.CSSProperties}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{tp.title}</div>
                {tp.text}
              </div>
            ))}
          </Section>
        )}
      </div>
    </div>
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
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Pipeline 汇总</h1>
          <p className="page-subtitle">{activeCusts.reduce((s, c) => s + (c.pipeline?.length || 0), 0)} 个活跃商机</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowAddForm(!showAddForm)} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {showAddForm ? <X size={14} /> : <Plus size={14} />}
          {showAddForm ? '取消' : '添加商机'}
        </Button>
      </div>
      {showAddForm && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 10, alignItems: 'end' }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--fg-tertiary)', display: 'block', marginBottom: 4 }}>客户 *</label>
              <select className="search-input" value={newPipeCustId} onChange={e => setNewPipeCustId(e.target.value)} style={{ padding: '6px 10px' }}>
                <option value="">选择客户...</option>
                {activeCusts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--fg-tertiary)', display: 'block', marginBottom: 4 }}>项目名称 *</label>
              <input className="search-input" placeholder="如：900系列穿梭车" value={newPipeName} onChange={e => setNewPipeName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleAddPipeline() }} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--fg-tertiary)', display: 'block', marginBottom: 4 }}>阶段描述</label>
              <input className="search-input" placeholder="如：样机窗口期" value={newPipeStage} onChange={e => setNewPipeStage(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--fg-tertiary)', display: 'block', marginBottom: 4 }}>金额</label>
              <input className="search-input" placeholder="如：~2M" value={newPipeAmount} onChange={e => setNewPipeAmount(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select className="search-input" value={newPipeStageNum} onChange={e => setNewPipeStageNum(Number(e.target.value))} style={{ width: 100, padding: '6px 6px' }}>
                {PIPE_STAGES.map(s => <option key={s.num} value={s.num}>{s.name}</option>)}
              </select>
              <Button onClick={handleAddPipeline} disabled={!newPipeCustId || !newPipeName.trim()}>添加</Button>
            </div>
          </div>
        </div>
      )}
      <DataState loading={custLoading} error={custError} onRetry={onRetry}>
      {totalPipeItems === 0 && !showLost ? (
        <EmptyState icon={<GitBranch size={20} />} message="暂无商机数据" hint="客户档案中添加 Pipeline 项目后将在此显示" />
      ) : (
      <div className="page-body">
        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16 }}>
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
                <div style={{ fontSize: 11, color: 'var(--fg-muted)', padding: '0 12px 8px', lineHeight: 1.4 }}>
                  {stageDescriptions[stage.num - 1]}
                </div>
                {items.map((item, i) => (
                  <div key={i} className="pipe-card" onClick={() => onCustClick(item.customerId || '')} data-qoder-id="qel-pipe-card-adad6b3c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-pipe-card-adad6b3c&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;pipe-card&quot;,&quot;loc&quot;:{&quot;line&quot;:708,&quot;column&quot;:19}}">
                    <div className="pipe-card-title" data-qoder-id="qel-pipe-card-title-5d49ec4c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-pipe-card-title-5d49ec4c&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;pipe-card-title&quot;,&quot;loc&quot;:{&quot;line&quot;:709,&quot;column&quot;:21}}">{item.name}</div>
                    <div className="pipe-card-cust" data-qoder-id="qel-pipe-card-cust-49393779" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-pipe-card-cust-49393779&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;pipe-card-cust&quot;,&quot;loc&quot;:{&quot;line&quot;:710,&quot;column&quot;:21}}">{item.customerName || ''}</div>
                    {item.stage && <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', marginTop: 4 }} data-qoder-id="qel-div-b9faa274" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-b9faa274&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:711,&quot;column&quot;:36}}">{item.stage}</div>}
                    {item.amount && <div className="pipe-card-amount" data-qoder-id="qel-pipe-card-amount-22094ff4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-pipe-card-amount-22094ff4&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;pipe-card-amount&quot;,&quot;loc&quot;:{&quot;line&quot;:712,&quot;column&quot;:37}}">{item.amount}</div>}
                    {/* Stage dropdown for changing pipeline stage */}
                    <select
                      className="pipeline-stage-select"
                      value={item.pipeStage}
                      onChange={async (e) => {
                        e.stopPropagation()
                        if (item.id) {
                          try {
                            await api.updatePipelineStage(item.id, Number(e.target.value))
                            pipeData.reload()
                          } catch (err) { console.error('Failed to update stage:', err) }
                        }
                      }}
                      onClick={e => e.stopPropagation()}
                     data-qoder-id="qel-pipeline-stage-select-df65f77a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-pipeline-stage-select-df65f77a&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;pipeline-stage-select&quot;,&quot;loc&quot;:{&quot;line&quot;:714,&quot;column&quot;:21}}">
                      {PIPE_STAGES.map(s => (
                        <option key={s.num} value={s.num} data-qoder-id="qel-option-a0a97e15" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-option-a0a97e15&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;PipelinePage&quot;,&quot;elementRole&quot;:&quot;option&quot;,&quot;loc&quot;:{&quot;line&quot;:729,&quot;column&quot;:25}}">{s.name}</option>
                      ))}
                    </select>
                    {/* Action buttons: won / lost / delete */}
                    <div style={{ position: 'absolute', top: 6, right: 6, display: 'flex', gap: 2 }}>
                      <button
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--status-success)', padding: 2 }}
                        title="标记为赢得"
                        onClick={async (e) => {
                          e.stopPropagation()
                          if (item.id && confirm(`确定将「${item.name}」标记为赢得吗？`)) {
                            try {
                              await api.markPipelineWin(item.id)
                              pipeData.reload()
                            } catch (err) { console.error('Failed to mark won:', err) }
                          }
                        }}
                      >
                        <CheckSquare size={12} />
                      </button>
                      <button
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--status-danger)', padding: 2 }}
                        title="标记为丢失"
                        onClick={async (e) => {
                          e.stopPropagation()
                          if (item.id && confirm(`确定将「${item.name}」标记为丢失吗？`)) {
                            await handleMarkLost(item.id, '')
                          }
                        }}
                      >
                        <X size={12} />
                      </button>
                      <button
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-muted)', padding: 2, opacity: 0.5 }}
                        title="删除商机"
                        onClick={async (e) => {
                          e.stopPropagation()
                          if (item.id) await handleDeletePipeline(item.id, item.name)
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>

        {/* Lost Pipeline Items Section */}
        <div style={{ marginTop: 24 }}>
          <button
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
              background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
              cursor: 'pointer', fontSize: 13, fontWeight: 500, color: 'var(--fg-secondary)',
            }}
            onClick={() => { setShowLost(!showLost); if (!showLost && lostItems.length === 0) loadLostItems() }}
          >
            <AlertTriangle size={14} style={{ color: 'var(--status-warning)' }} />
            丢失商机 {lostItems.length > 0 && <span style={{ color: 'var(--fg-muted)' }}>({lostItems.length})</span>}
            {showLost ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          {showLost && (
            <div style={{ marginTop: 12 }}>
              {lostLoading ? (
                <div style={{ padding: 20, color: 'var(--fg-muted)', fontSize: 13 }}>加载中...</div>
              ) : lostItems.length === 0 ? (
                <div style={{ padding: 20, color: 'var(--fg-muted)', fontSize: 13 }}>暂无丢失商机</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                  {lostItems.map(item => (
                    <div key={item.id} className="card" style={{ opacity: 0.7, borderLeft: '3px solid var(--status-danger)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{item.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--fg-tertiary)', marginTop: 2 }}>{item.customerName}</div>
                          {editingLostId === item.id ? (
                            <div style={{ marginTop: 6 }}>
                              <textarea
                                value={editLostReason}
                                onChange={e => setEditLostReason(e.target.value)}
                                placeholder="丢失原因..."
                                style={{ width: '100%', minHeight: 48, padding: '6px 10px', fontSize: 12, fontFamily: 'var(--font-sans)', color: 'var(--fg)', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', resize: 'vertical', outline: 'none' }}
                              />
                              <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                                <Button variant="default" size="sm" onClick={() => handleSaveLostReason(item.id!)}>保存</Button>
                                <Button variant="outline" size="sm" onClick={() => setEditingLostId(null)}>取消</Button>
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                              <div style={{ fontSize: 11, color: 'var(--status-danger)', flex: 1 }}>{item.lostReason ? `原因: ${item.lostReason}` : '暂无原因'}</div>
                              <Button variant="ghost" size="sm" onClick={() => { setEditingLostId(item.id!); setEditLostReason(item.lostReason || '') }}>
                                <Edit3 size={12} />
                              </Button>
                            </div>
                          )}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleRestore(item.id!)}>恢复</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Won Pipeline Items Section */}
        <div style={{ marginTop: 12 }}>
          <button
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
              background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
              cursor: 'pointer', fontSize: 13, fontWeight: 500, color: 'var(--fg-secondary)',
            }}
            onClick={() => { setShowWon(!showWon); if (!showWon && wonItems.length === 0) loadWonItems() }}
          >
            <CheckSquare size={14} style={{ color: 'var(--status-success)' }} />
            赢得商机 {wonItems.length > 0 && <span style={{ color: 'var(--fg-muted)' }}>({wonItems.length})</span>}
            {showWon ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          {showWon && (
            <div style={{ marginTop: 12 }}>
              {wonLoading ? (
                <div style={{ padding: 20, color: 'var(--fg-muted)', fontSize: 13 }}>加载中...</div>
              ) : wonItems.length === 0 ? (
                <div style={{ padding: 20, color: 'var(--fg-muted)', fontSize: 13 }}>暂无赢得商机</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                  {wonItems.map(item => (
                    <div key={item.id} className="card" style={{ opacity: 0.8, borderLeft: '3px solid var(--status-success)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{item.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--fg-tertiary)', marginTop: 2 }}>{item.customerName}</div>
                          {item.amount && <div style={{ fontSize: 11, color: 'var(--status-success)', marginTop: 4 }}>{item.amount}</div>}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleRestore(item.id!)}>恢复</Button>
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
      <DataState loading={custLoading} error={custError} onRetry={onRetry}>
      {activeCusts.length === 0 ? (
        <EmptyState icon={<Swords size={20} />} message="暂无竞品数据" hint="客户档案中设置竞品信息后将在此显示竞品分析" />
      ) : (
      <div className="page-body">
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
  const [scores, setScores] = useState<Record<string, Record<number, number>>>({})
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
      return { ...prev, [itemKey]: itemScores }
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
        return next
      })
    } catch (err) {
      console.error('Failed to delete invest item:', err)
    }
  }

  const iconMap: Record<string, React.ReactNode> = {
    megaphone: <Megaphone size={18} style={{ color: 'var(--accent)' }} />,
    shield: <Shield size={18} style={{ color: 'var(--accent)' }} />,
    'arrow-up-circle': <ArrowUpCircle size={18} style={{ color: 'var(--accent)' }} />,
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
          <table className="data-table" data-qoder-id="qel-data-table-008d2a79" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-data-table-008d2a79&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CoachPage&quot;,&quot;elementRole&quot;:&quot;data-table&quot;,&quot;loc&quot;:{&quot;line&quot;:685,&quot;column&quot;:11}}">
            <thead data-qoder-id="qel-thead-6335f610" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-thead-6335f610&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CoachPage&quot;,&quot;elementRole&quot;:&quot;thead&quot;,&quot;loc&quot;:{&quot;line&quot;:686,&quot;column&quot;:13}}">
              <tr data-qoder-id="qel-tr-c8c656a3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-tr-c8c656a3&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CoachPage&quot;,&quot;elementRole&quot;:&quot;tr&quot;,&quot;loc&quot;:{&quot;line&quot;:687,&quot;column&quot;:15}}">
                <th data-qoder-id="qel-th-a49ab162" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-th-a49ab162&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CoachPage&quot;,&quot;elementRole&quot;:&quot;th&quot;,&quot;loc&quot;:{&quot;line&quot;:688,&quot;column&quot;:17}}">项目</th>
                <th>客户</th>
                {INVESTMENT_DIMS.map(d => <th key={d} data-qoder-id="qel-th-a59ab2f5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-th-a59ab2f5&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.tsx&quot;,&quot;componentName&quot;:&quot;CoachPage&quot;,&quot;elementRole&quot;:&quot;th&quot;,&quot;loc&quot;:{&quot;line&quot;:689,&quot;column&quot;:43}}">{d}</th>)}
              </tr>
            </thead>
            <tbody>
              {investItems.map(item => {
                const itemScores = scores[item.key] || {}
                const totalScore = Object.values(itemScores).reduce((s, v) => s + v, 0)
                const scoredDims = Object.keys(itemScores).length
                return (
                <tr key={item.key}>
                  <td style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {editingInvestKey === item.key ? (
                      <input
                        className="search-input"
                        style={{ padding: '2px 6px', fontSize: 13, width: '100%' }}
                        value={editingInvestName}
                        onChange={e => setEditingInvestName(e.target.value)}
                        onBlur={() => handleSaveInvestName(item.key)}
                        onKeyDown={e => { if (e.key === 'Enter') handleSaveInvestName(item.key); if (e.key === 'Escape') setEditingInvestKey(null) }}
                        autoFocus
                      />
                    ) : (
                      <span
                        style={{ cursor: 'pointer' }}
                        onDoubleClick={() => { setEditingInvestKey(item.key); setEditingInvestName(item.name) }}
                      >
                        {item.name}{scoredDims > 0 && <span style={{ marginLeft: 4, fontSize: 11, color: 'var(--accent)' }}>({totalScore})</span>}
                      </span>
                    )}
                    <button onClick={() => handleDeleteItem(item.key)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-muted)', padding: 2, flexShrink: 0 }} title="删除项目">
                      <Trash2 size={11} />
                    </button>
                  </td>
                  <td>
                    <select
                      className="search-input"
                      style={{ padding: '2px 6px', fontSize: 12, minWidth: 80 }}
                      value={item.customerId || ''}
                      onChange={e => handleUpdateInvestCust(item.key, e.target.value)}
                    >
                      <option value="">未关联</option>
                      {customers.filter(c => !c.isGroup).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </td>
                  {INVESTMENT_DIMS.map((_, di) => (
                    <td key={di}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {[1, 2, 3, 4, 5].map(v => {
                          const selected = itemScores[di] === v
                          const filled = itemScores[di] != null && v <= itemScores[di]!
                          return (
                          <div
                            key={v}
                            onClick={() => handleScore(item.key, di, v)}
                            style={{
                              width: 24, height: 24, borderRadius: 'var(--radius-xs)',
                              background: selected ? 'var(--accent)' : filled ? 'var(--accent-bg)' : 'var(--bg-elevated)',
                              border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
                              cursor: 'pointer', fontSize: 11, fontWeight: selected ? 600 : 400,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: selected ? '#fff' : filled ? 'var(--accent)' : 'var(--fg-muted)',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            {v}
                          </div>
                          )
                        })}
                      </div>
                    </td>
                  ))}
                </tr>
                )
              })}
            </tbody>
          </table>
          {/* Add new investment item */}
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <select
              className="search-input"
              style={{ width: 140 }}
              value={newItemCustId}
              onChange={e => setNewItemCustId(e.target.value)}
            >
              <option value="">选择客户（可选）</option>
              {customers.filter(c => !c.isGroup).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input
              className="search-input"
              style={{ flex: 1 }}
              placeholder="输入样机/项目名称..."
              value={newItemName}
              onChange={e => setNewItemName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddItem() }}
            />
            <Button variant="outline" size="sm" onClick={handleAddItem} disabled={!newItemName.trim()}>
              <Plus size={14} /> 添加
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

/* ═══════════════════════ PAGE 7: WEEKLY ═══════════════════════ */
function WeeklyPage() {
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
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--fg-muted)' }} />
      </div>
    )
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">周报</h1>
        <p className="page-subtitle">工作记录与回顾</p>
      </div>
      <div className="page-body">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {reports.map(r => {
            const isOpen = openWeek === r.weekId
            return (
              <div key={r.weekId} className="week-panel">
                <div className="week-panel-header" onClick={() => setOpenWeek(isOpen ? '' : r.weekId)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{r.label}</span>
                    {r.isCurrent && <span className="badge badge-teal">本周</span>}
                  </div>
                </div>
                {isOpen && (
                  <div className="week-panel-body">
                    {/* Focus Items */}
                    <div style={{ marginBottom: 20 }}>
                      <div className="detail-section-title">本周重点</div>
                      {r.focuses.map((f, i) => (
                        <div key={i} className="action-row">
                          <div className="dot dot-teal" />
                          <span className="action-row-label">{f.text}</span>
                        </div>
                      ))}
                      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                        <input
                          type="text"
                          placeholder="添加重点..."
                          value={newFocusWeek === r.weekId ? newFocusText : ''}
                          onFocus={() => setNewFocusWeek(r.weekId)}
                          onChange={e => { setNewFocusWeek(r.weekId); setNewFocusText(e.target.value) }}
                          onKeyDown={e => { if (e.key === 'Enter') handleAddFocus(r.weekId) }}
                          style={{ flex: 1, padding: '6px 10px', fontSize: 13, fontFamily: 'var(--font-sans)', color: 'var(--fg)', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', outline: 'none' }}
                        />
                        <button onClick={() => handleAddFocus(r.weekId)} style={{ padding: '4px 10px', fontSize: 12, cursor: 'pointer', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--fg-secondary)' }}>
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                    {/* Action Items */}
                    <div style={{ marginBottom: 20 }}>
                      <div className="detail-section-title">行动清单</div>
                      {r.actions.map(a => {
                        const isChecked = !!localChecked[a.id]
                        return (
                          <div key={a.id} className="action-row" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div onClick={() => handleToggleAction(r.weekId, a.id, !!a.completed)} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                              {isChecked
                                ? <CheckSquare size={14} style={{ color: 'var(--status-success)', flexShrink: 0 }} />
                                : <Square size={14} style={{ color: 'var(--fg-muted)', flexShrink: 0 }} />
                              }
                              <span className="action-row-label" style={{
                                textDecoration: isChecked ? 'line-through' : 'none',
                                color: isChecked ? 'var(--fg-muted)' : 'var(--fg)',
                              }}>{a.text}</span>
                            </div>
                            <button onClick={() => handleDeleteAction(r.weekId, a.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--fg-muted)', opacity: 0.5 }} title="删除">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )
                      })}
                      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                        <input
                          type="text"
                          placeholder="添加行动项..."
                          value={newActionWeek === r.weekId ? newActionText : ''}
                          onFocus={() => setNewActionWeek(r.weekId)}
                          onChange={e => { setNewActionWeek(r.weekId); setNewActionText(e.target.value) }}
                          onKeyDown={e => { if (e.key === 'Enter') handleAddAction(r.weekId) }}
                          style={{ flex: 1, padding: '6px 10px', fontSize: 13, fontFamily: 'var(--font-sans)', color: 'var(--fg)', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', outline: 'none' }}
                        />
                        <button onClick={() => handleAddAction(r.weekId)} style={{ padding: '4px 10px', fontSize: 12, cursor: 'pointer', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--fg-secondary)' }}>
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                    {/* Daily Notes */}
                    <div>
                      <div className="detail-section-title">每日记录</div>
                      {DAYS.map(d => (
                        <div key={d.key} style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-secondary)', marginBottom: 6 }}>{d.label}</div>
                          <textarea
                            style={{ width: '100%', minHeight: 60, padding: '10px 14px', fontSize: 13, fontFamily: 'var(--font-sans)', color: 'var(--fg)', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', resize: 'vertical', outline: 'none' }}
                            placeholder={`${d.label}的工作记录...`}
                            value={dailyNotes[`${r.weekId}_${d.key}`] || ''}
                            onChange={e => handleDailyNoteChange(r.weekId, d.key, e.target.value)}
                          />
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
        <div style={{ marginBottom: 12 }}>
          <select value={custId} onChange={e => setCustId(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', fontSize: 14, fontFamily: 'var(--font-sans)', color: 'var(--fg)', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', outline: 'none' }}>
            <option value="">选择客户...</option>
            {customers.filter(c => !c.isGroup).map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="记录沟通内容..."
          style={{ width: '100%', minHeight: 100, padding: '12px 14px', fontSize: 14, fontFamily: 'var(--font-sans)', color: 'var(--fg)', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', resize: 'vertical', outline: 'none', marginBottom: 12 }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 20 }}>
          <Button variant="default" onClick={handleSave} disabled={saving || !custId || !note.trim()}>
            {saving ? '保存中...' : '保存'}
          </Button>
        </div>
        {/* Recent notes history */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-secondary)', marginBottom: 8 }}>最近笔记</div>
          {notesLoading ? (
            <div style={{ padding: 12, color: 'var(--fg-muted)', fontSize: 12 }}>加载中...</div>
          ) : recentNotes.length === 0 ? (
            <div style={{ padding: 12, color: 'var(--fg-muted)', fontSize: 12 }}>暂无笔记</div>
          ) : (
            <div style={{ maxHeight: 240, overflowY: 'auto' }}>
              {recentNotes.map(n => (
                <div key={n.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>{n.customerName || '未知客户'}</span>
                      <span style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{n.createdAt?.slice(0, 16).replace('T', ' ')}</span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--fg)', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{n.content}</div>
                  </div>
                  <button onClick={() => handleDeleteNote(n.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-muted)', padding: 2, flexShrink: 0, alignSelf: 'flex-start' }} title="删除">
                    <Trash2 size={12} />
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
