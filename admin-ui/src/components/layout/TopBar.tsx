import { useState, useRef, useEffect } from 'react'
import { Sun, Moon, Bell, ChevronDown, User, Settings, LogOut, Globe } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { SearchBar } from '../ui/SearchBar'
import { Breadcrumbs } from './Breadcrumbs'
import { cn, getInitials } from '../../utils'

export function TopBar({ children }: { children?: React.ReactNode }) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { i18n } = useTranslation()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [langDropdownOpen, setLangDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const langDropdownRef = useRef<HTMLDivElement>(null)

  const currentLang = i18n.language === 'ar' ? 'العربية' : 'English'

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) {
        setLangDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleSearch(_query: string) {
    // Global search is not implemented — users should use the specific
    // search capabilities on each page (properties, leads, clients).
  }

  function switchLanguage(lang: string) {
    i18n.changeLanguage(lang)
    setLangDropdownOpen(false)
  }

  return (
    <header className="flex items-center h-16 px-4 md:px-6 gap-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700/60 shrink-0">
      {children}
      {/* Breadcrumbs */}
      <div className="flex-1 min-w-0">
        <Breadcrumbs />
      </div>

      {/* Search */}
      <div className="hidden md:block w-56 lg:w-72">
        <SearchBar
          onSearch={handleSearch}
          placeholder={i18n.t('common.search')}
          className="w-full"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Language switcher */}
        <div className="relative" ref={langDropdownRef}>
          <button
            onClick={() => setLangDropdownOpen((o) => !o)}
            className="flex items-center gap-1.5 p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors"
            aria-label="Switch language"
          >
            <Globe size={18} />
            <span className="text-xs font-medium hidden lg:inline">{currentLang}</span>
            <ChevronDown size={14} className={cn('text-gray-400 transition-transform', langDropdownOpen && 'rotate-180')} />
          </button>
          {langDropdownOpen && (
            <div className="absolute end-0 mt-1 w-36 rounded-xl bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
              <button
                onClick={() => switchLanguage('en')}
                className={cn(
                  'flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
                  i18n.language === 'en' ? 'text-indigo-600 dark:text-indigo-400 font-medium' : 'text-gray-700 dark:text-gray-300',
                )}
              >
                English
              </button>
              <button
                onClick={() => switchLanguage('ar')}
                className={cn(
                  'flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
                  i18n.language === 'ar' ? 'text-indigo-600 dark:text-indigo-400 font-medium' : 'text-gray-700 dark:text-gray-300',
                )}
              >
                العربية
              </button>
            </div>
          )}
        </div>

        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <button
          className="relative p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors"
          aria-label="Notifications"
        >
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-semibold shrink-0">
              {user ? getInitials(user.name) : <User size={14} />}
            </div>
            <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-200 max-w-[120px] truncate">
              {user?.name ?? 'User'}
            </span>
            <ChevronDown size={14} className={cn('text-gray-400 transition-transform', dropdownOpen && 'rotate-180')} />
          </button>

          {dropdownOpen && (
            <div className="absolute end-0 mt-1 w-52 rounded-xl bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
              <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
              </div>
              <Link
                to="/settings"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <User size={15} />
                {i18n.t('common.profile')}
              </Link>
              <Link
                to="/settings"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Settings size={15} />
                {i18n.t('common.settings')}
              </Link>
              <div className="border-t border-gray-100 dark:border-gray-700 mt-1 pt-1">
                <button
                  onClick={logout}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut size={15} />
                  {i18n.t('common.signOut')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}