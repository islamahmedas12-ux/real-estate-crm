import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  Users,
  UserCheck,
  FileText,
  Receipt,
  BarChart3,
  UserCog,
  Settings,
  ChevronLeft,
  ChevronRight,
  Building,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '../../utils'

const NAV_ITEMS = [
  { labelKey: 'nav.dashboard',  path: '/',           icon: LayoutDashboard, exact: true },
  { labelKey: 'nav.properties', path: '/properties', icon: Building2 },
  { labelKey: 'nav.clients',    path: '/clients',    icon: Users },
  { labelKey: 'nav.leads',      path: '/leads',      icon: UserCheck },
  { labelKey: 'nav.contracts',  path: '/contracts',  icon: FileText },
  { labelKey: 'nav.invoices',   path: '/invoices',   icon: Receipt },
  { labelKey: 'nav.reports',    path: '/reports',    icon: BarChart3 },
  { labelKey: 'nav.agents',     path: '/agents',     icon: UserCog },
  { labelKey: 'nav.settings',   path: '/settings',   icon: Settings },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { t } = useTranslation()

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-white dark:bg-gray-900',
        'border-r border-gray-200 dark:border-gray-700/60',
        'transition-all duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* Brand */}
      <div
        className={cn(
          'flex items-center h-16 px-4 border-b border-gray-200 dark:border-gray-700/60 shrink-0',
          collapsed ? 'justify-center' : 'gap-3',
        )}
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 text-white shrink-0">
          <Building size={18} />
        </div>
        {!collapsed && (
          <span className="font-semibold text-gray-900 dark:text-gray-100 truncate text-sm">
            {t('app.name')}
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <ul className="flex flex-col gap-0.5">
          {NAV_ITEMS.map(({ labelKey, path, icon: Icon, exact }) => (
            <li key={path}>
              <NavLink
                to={path}
                end={exact}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200',
                    collapsed && 'justify-center',
                  )
                }
                title={collapsed ? t(labelKey) : undefined}
              >
                <Icon size={18} className="shrink-0" />
                {!collapsed && <span>{t(labelKey)}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-gray-200 dark:border-gray-700/60 p-2 shrink-0">
        <button
          onClick={onToggle}
          className={cn(
            'flex items-center w-full rounded-lg px-2.5 py-2 text-sm text-gray-500',
            'hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300',
            'transition-colors',
            collapsed ? 'justify-center' : 'gap-3',
          )}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={18} /> : (
            <>
              <ChevronLeft size={18} />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}