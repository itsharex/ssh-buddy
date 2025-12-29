import { useState, useMemo } from 'react'
import {
  Server,
  Globe,
  Star,
  Tag,
  Search,
  X,
  Clock,
  ChevronDown,
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SkeletonList } from '@/components/common'
import { HostGroups, type GroupFilter } from './HostGroups'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { SSHHostConfig } from '@/lib/ssh-config'
import type { HostMetadata } from '@/lib/metadata-service'
import { cn } from '@/lib/utils'

type SortOption = 'name' | 'lastUsed' | 'favorites'

interface HostListProps {
  hosts: SSHHostConfig[]
  selectedHost: string | null
  onSelectHost: (hostName: string) => void
  loading?: boolean
  getHostMetadata?: (hostAlias: string) => HostMetadata | null
  allTags?: string[]
}

export function HostList({
  hosts,
  selectedHost,
  onSelectHost,
  loading,
  getHostMetadata,
  allTags = [],
}: HostListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGroup, setSelectedGroup] = useState<GroupFilter>('all')
  const [sortBy, setSortBy] = useState<SortOption>('name')
  const [showSortDropdown, setShowSortDropdown] = useState(false)

  const sortLabels: Record<SortOption, string> = {
    name: 'Name',
    lastUsed: 'Recent',
    favorites: 'Favorites',
  }

  // Filter and sort hosts
  const filteredHosts = useMemo(() => {
    let result = [...hosts]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (host) =>
          host.Host.toLowerCase().includes(query) ||
          host.HostName?.toLowerCase().includes(query) ||
          host.User?.toLowerCase().includes(query)
      )
    }

    // Group filter
    if (selectedGroup !== 'all' && getHostMetadata) {
      if (selectedGroup === 'favorites') {
        result = result.filter((host) => {
          const meta = getHostMetadata(host.Host)
          return meta?.isFavorite === true
        })
      } else if (selectedGroup === 'ungrouped') {
        result = result.filter((host) => {
          const meta = getHostMetadata(host.Host)
          return !meta?.tags.length
        })
      } else {
        // Filter by tag (selectedGroup is the tag name)
        result = result.filter((host) => {
          const meta = getHostMetadata(host.Host)
          return meta?.tags.includes(selectedGroup)
        })
      }
    }

    // Sort
    result.sort((a, b) => {
      const metaA = getHostMetadata?.(a.Host)
      const metaB = getHostMetadata?.(b.Host)

      switch (sortBy) {
        case 'lastUsed': {
          const lastA = metaA?.lastUsed || 0
          const lastB = metaB?.lastUsed || 0
          return lastB - lastA
        }
        case 'favorites': {
          const favA = metaA?.isFavorite ? 1 : 0
          const favB = metaB?.isFavorite ? 1 : 0
          if (favA !== favB) return favB - favA
          return a.Host.localeCompare(b.Host)
        }
        case 'name':
        default:
          return a.Host.localeCompare(b.Host)
      }
    })

    return result
  }, [hosts, searchQuery, selectedGroup, sortBy, getHostMetadata])

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <SkeletonList count={5} />
      </div>
    )
  }

  const hasFilters = searchQuery || selectedGroup !== 'all'

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="p-2 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search hosts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-8 h-8 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {/* Sort Dropdown */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="h-8 text-xs gap-1 px-2"
            >
              <Clock className="h-3 w-3" />
              {sortLabels[sortBy]}
              <ChevronDown className="h-3 w-3" />
            </Button>

            {showSortDropdown && (
              <div className="absolute top-full right-0 mt-1 z-50 w-32 rounded-md border-brutal border-primary/30 bg-popover shadow-brutal-sm">
                <div className="p-1">
                  {(Object.keys(sortLabels) as SortOption[]).map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSortBy(option)
                        setShowSortDropdown(false)
                      }}
                      className={cn(
                        'flex w-full items-center gap-2 px-2 py-1.5 text-xs transition-colors',
                        sortBy === option
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-primary/5'
                      )}
                    >
                      {sortLabels[option]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Groups/Folders */}
      <HostGroups
        hosts={hosts}
        allTags={allTags}
        selectedGroup={selectedGroup}
        onSelectGroup={setSelectedGroup}
        getHostMetadata={getHostMetadata}
      />

      {/* Host List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {hosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <div className="flex h-10 w-10 items-center justify-center bg-primary/10 border-brutal border-primary/30 mb-3 shadow-brutal-sm">
                <Server className="h-5 w-5 text-primary/50" />
              </div>
              <p className="text-sm text-primary/70 mb-1">// NO_HOSTS_FOUND</p>
              <p className="text-xs text-muted-foreground">
                Press [+] to add host
              </p>
            </div>
          ) : filteredHosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <div className="flex h-10 w-10 items-center justify-center bg-primary/10 border-brutal border-primary/30 mb-3 shadow-brutal-sm">
                <Server className="h-5 w-5 text-primary/50" />
              </div>
              <p className="text-sm text-primary/70 mb-1">// NO_MATCH</p>
              <p className="text-xs text-muted-foreground">
                {selectedGroup !== 'all'
                  ? 'No hosts in this group'
                  : 'Adjust search to find hosts'}
              </p>
            </div>
          ) : (
            filteredHosts.map((host, index) => {
              const meta = getHostMetadata?.(host.Host)
              const isSelected = selectedHost === host.Host
              return (
                <button
                  key={host.Host}
                  onClick={() => onSelectHost(host.Host)}
                  className={cn(
                    'flex w-full items-center gap-3 px-3 py-2.5 text-sm transition-all duration-100 group',
                    'border-2',
                    isSelected
                      ? 'bg-primary/10 border-primary/50 shadow-brutal-sm'
                      : 'border-transparent hover:bg-primary/5 hover:border-primary/30'
                  )}
                >
                  {/* Index number */}
                  <span
                    className={cn(
                      'text-[10px] w-4 text-right font-mono',
                      isSelected ? 'text-primary' : 'text-muted-foreground/50'
                    )}
                  >
                    {String(index).padStart(2, '0')}
                  </span>

                  <div
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center transition-all border-2',
                      isSelected
                        ? 'bg-primary/20 text-primary border-primary/40'
                        : 'bg-muted/50 text-muted-foreground border-transparent group-hover:border-primary/30'
                    )}
                  >
                    <Server className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-1.5">
                      <p
                        className={cn(
                          'font-medium truncate',
                          isSelected
                            ? 'text-primary text-glow-sm'
                            : 'text-foreground/90 group-hover:text-primary/90'
                        )}
                      >
                        {host.Host}
                      </p>
                      {meta?.isFavorite && (
                        <Star className="h-3 w-3 shrink-0 fill-amber-500 text-amber-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {host.HostName && (
                        <p
                          className={cn(
                            'text-xs truncate flex items-center gap-1',
                            isSelected
                              ? 'text-primary/60'
                              : 'text-muted-foreground'
                          )}
                        >
                          <Globe className="h-3 w-3" />
                          {host.HostName}
                        </p>
                      )}
                      {meta && meta.tags.length > 0 && (
                        <div className="flex items-center gap-1 ml-auto">
                          <Tag
                            className={cn(
                              'h-2.5 w-2.5',
                              isSelected
                                ? 'text-primary/50'
                                : 'text-muted-foreground'
                            )}
                          />
                          <span
                            className={cn(
                              'text-[10px]',
                              isSelected
                                ? 'text-primary/50'
                                : 'text-muted-foreground'
                            )}
                          >
                            {meta.tags.length}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Connection indicator */}
                  {isSelected && (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-terminal-pulse" />
                  )}
                </button>
              )
            })
          )}
        </div>
      </ScrollArea>

      {/* Filter Status */}
      {hasFilters && filteredHosts.length > 0 && (
        <div className="px-3 py-2 border-t border-border">
          <p className="text-[10px] text-muted-foreground text-center">
            Showing {filteredHosts.length} of {hosts.length} hosts
          </p>
        </div>
      )}
    </div>
  )
}
