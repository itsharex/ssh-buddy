import { useState } from 'react'
import { Star, Server, Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { SSHHostConfig } from '@/lib/ssh-config'
import type { HostMetadata } from '@/lib/metadata-service'

export type GroupFilter = 'all' | 'favorites' | 'ungrouped' | string

interface HostGroupsProps {
  hosts: SSHHostConfig[]
  allTags: string[]
  selectedGroup: GroupFilter
  onSelectGroup: (group: GroupFilter) => void
  getHostMetadata?: (hostAlias: string) => HostMetadata | null
}

const FOLDERS_EXPANDED_KEY = 'ssh-buddy:folders-expanded'

export function HostGroups({
  hosts,
  allTags,
  selectedGroup,
  onSelectGroup,
  getHostMetadata,
}: HostGroupsProps) {
  const [foldersExpanded, setFoldersExpanded] = useState(() => {
    const saved = localStorage.getItem(FOLDERS_EXPANDED_KEY)
    return saved !== null ? saved === 'true' : true
  })

  const toggleFoldersExpanded = () => {
    const newValue = !foldersExpanded
    setFoldersExpanded(newValue)
    localStorage.setItem(FOLDERS_EXPANDED_KEY, String(newValue))
  }

  // Calculate counts
  const totalCount = hosts.length

  const favoritesCount = hosts.filter((host) => {
    const meta = getHostMetadata?.(host.Host)
    return meta?.isFavorite
  }).length

  const tagCounts = allTags.reduce(
    (acc, tag) => {
      acc[tag] = hosts.filter((host) => {
        const meta = getHostMetadata?.(host.Host)
        return meta?.tags.includes(tag)
      }).length
      return acc
    },
    {} as Record<string, number>
  )

  const ungroupedCount = hosts.filter((host) => {
    const meta = getHostMetadata?.(host.Host)
    return !meta?.tags.length
  }).length

  return (
    <div className="flex flex-col gap-0.5 p-2 border-b border-border">
      {/* Section: Views */}
      <SectionHeader label="VIEWS" />

      {/* All Hosts */}
      <GroupItem
        icon={<Server className="h-4 w-4" />}
        label="All Hosts"
        count={totalCount}
        isSelected={selectedGroup === 'all'}
        onClick={() => onSelectGroup('all')}
        variant="primary"
      />

      {/* Favorites */}
      {favoritesCount > 0 && (
        <GroupItem
          icon={<Star className="h-4 w-4 fill-amber-500" />}
          label="Favorites"
          count={favoritesCount}
          isSelected={selectedGroup === 'favorites'}
          onClick={() => onSelectGroup('favorites')}
          variant="favorites"
        />
      )}

      {/* Section: Folders */}
      {allTags.length > 0 && (
        <>
          {/* Section header */}
          <div className="px-2 pt-3 pb-1">
            <button
              onClick={toggleFoldersExpanded}
              className="flex items-center gap-1.5 hover:text-primary transition-colors"
            >
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground font-mono hover:text-muted-foreground">
                // FOLDERS
              </span>
              {!foldersExpanded && allTags.length > 0 && (
                <span className="text-[10px] text-muted-foreground/40 font-mono">
                  [{allTags.length}]
                </span>
              )}
            </button>
          </div>

          {/* Collapsible content */}
          {foldersExpanded && allTags.length > 0 && (
            <ScrollArea className={cn(allTags.length > 8 && 'max-h-[200px]')}>
              <div className="flex flex-col gap-0.5">
                {allTags.map((tag) => (
                  <GroupItem
                    key={tag}
                    icon={
                      <span className="text-[10px] text-primary/40 font-mono">
                        &gt;
                      </span>
                    }
                    label={tag}
                    count={tagCounts[tag]}
                    isSelected={selectedGroup === tag}
                    onClick={() => onSelectGroup(tag)}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </>
      )}

      {/* Ungrouped */}
      {ungroupedCount > 0 && allTags.length > 0 && foldersExpanded && (
        <>
          <div className="h-px bg-border my-1.5" />
          <GroupItem
            icon={<Inbox className="h-4 w-4" />}
            label="Unorganized"
            count={ungroupedCount}
            isSelected={selectedGroup === 'ungrouped'}
            onClick={() => onSelectGroup('ungrouped')}
            variant="muted"
          />
        </>
      )}
    </div>
  )
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="px-2 py-1">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground font-mono">
        // {label}
      </span>
    </div>
  )
}

interface GroupItemProps {
  icon: React.ReactNode
  label: string
  count: number
  isSelected: boolean
  onClick: () => void
  variant?: 'default' | 'primary' | 'favorites' | 'muted'
}

function GroupItem({
  icon,
  label,
  count,
  isSelected,
  onClick,
  variant = 'default',
}: GroupItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex items-center gap-2 w-full px-2 py-1.5 text-sm transition-all duration-100',
        'border-l-2',

        // Selected state
        isSelected
          ? ['bg-primary/10', 'border-l-primary', 'text-primary']
          : [
              'border-l-transparent',
              'hover:bg-primary/5',
              'hover:border-l-primary/30',
              'text-foreground/80',
            ],

        // Variants
        variant === 'primary' && 'font-medium',
        variant === 'favorites' && !isSelected && 'text-amber-600',
        variant === 'muted' && !isSelected && 'text-muted-foreground/60'
      )}
    >
      {/* Icon */}
      <span
        className={cn(
          'shrink-0 transition-all duration-200',
          isSelected && 'text-primary',
          variant === 'favorites' && !isSelected && 'text-amber-500',
          variant === 'muted' && !isSelected && 'text-muted-foreground/50'
        )}
      >
        {icon}
      </span>

      {/* Label */}
      <span
        className={cn(
          'truncate flex-1 text-left',
          isSelected && 'text-glow-sm'
        )}
      >
        {label}
      </span>

      {/* Count */}
      <span
        className={cn(
          'text-[10px] tabular-nums font-mono min-w-[1.25rem] text-right',
          isSelected ? 'text-primary/70' : 'text-muted-foreground/40'
        )}
      >
        {count}
      </span>
    </button>
  )
}
