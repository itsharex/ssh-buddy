import { useState, useRef, useEffect } from 'react'
import { Search, X, Tag, Star, Clock, ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type SortOption = 'name' | 'lastUsed' | 'favorites'

interface HostFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedTags: string[]
  onTagSelect: (tag: string) => void
  onTagDeselect: (tag: string) => void
  availableTags: string[]
  showFavoritesOnly: boolean
  onFavoritesToggle: () => void
  sortBy: SortOption
  onSortChange: (sort: SortOption) => void
}

export function HostFilters({
  searchQuery,
  onSearchChange,
  selectedTags,
  onTagSelect,
  onTagDeselect,
  availableTags,
  showFavoritesOnly,
  onFavoritesToggle,
  sortBy,
  onSortChange,
}: HostFiltersProps) {
  const [showTagDropdown, setShowTagDropdown] = useState(false)
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const tagDropdownRef = useRef<HTMLDivElement>(null)
  const sortDropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        tagDropdownRef.current &&
        !tagDropdownRef.current.contains(e.target as Node)
      ) {
        setShowTagDropdown(false)
      }
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(e.target as Node)
      ) {
        setShowSortDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const sortLabels: Record<SortOption, string> = {
    name: 'Name',
    lastUsed: 'Recent',
    favorites: 'Favorites',
  }

  return (
    <div className="space-y-2 p-2 border-b border-border">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search hosts..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 pr-8 h-8 text-sm"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="flex items-center gap-1.5">
        {/* Tag Filter Dropdown */}
        <div className="relative" ref={tagDropdownRef}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTagDropdown(!showTagDropdown)}
            className={cn(
              'h-7 text-xs gap-1.5 px-2',
              selectedTags.length > 0 && 'bg-primary/10 border-primary/30'
            )}
          >
            <Tag className="h-3 w-3" />
            Tags
            {selectedTags.length > 0 && (
              <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px]">
                {selectedTags.length}
              </span>
            )}
            <ChevronDown className="h-3 w-3 ml-0.5" />
          </Button>

          {showTagDropdown && (
            <div className="absolute top-full left-0 mt-1 z-50 w-48 rounded-md border border-border bg-popover shadow-lg">
              <div className="p-1.5 max-h-48 overflow-y-auto">
                {availableTags.length === 0 ? (
                  <p className="text-xs text-muted-foreground px-2 py-1.5">
                    No tags created yet
                  </p>
                ) : (
                  availableTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        if (selectedTags.includes(tag)) {
                          onTagDeselect(tag)
                        } else {
                          onTagSelect(tag)
                        }
                      }}
                      className={cn(
                        'flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs transition-colors',
                        selectedTags.includes(tag)
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-primary/5 text-foreground'
                      )}
                    >
                      <Tag className="h-3 w-3" />
                      <span className="truncate">{tag}</span>
                      {selectedTags.includes(tag) && (
                        <X className="h-3 w-3 ml-auto" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Favorites Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={onFavoritesToggle}
          className={cn(
            'h-7 text-xs gap-1.5 px-2',
            showFavoritesOnly &&
              'bg-amber-500/10 border-amber-500/30 text-amber-600'
          )}
        >
          <Star
            className={cn('h-3 w-3', showFavoritesOnly && 'fill-amber-500')}
          />
          Favorites
        </Button>

        {/* Sort Dropdown */}
        <div className="relative ml-auto" ref={sortDropdownRef}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            className="h-7 text-xs gap-1.5 px-2"
          >
            <Clock className="h-3 w-3" />
            {sortLabels[sortBy]}
            <ChevronDown className="h-3 w-3" />
          </Button>

          {showSortDropdown && (
            <div className="absolute top-full right-0 mt-1 z-50 w-32 rounded-md border border-border bg-popover shadow-lg">
              <div className="p-1">
                {(Object.keys(sortLabels) as SortOption[]).map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      onSortChange(option)
                      setShowSortDropdown(false)
                    }}
                    className={cn(
                      'flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs transition-colors',
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

      {/* Active Tags Display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedTags.map((tag) => (
            <button
              key={tag}
              onClick={() => onTagDeselect(tag)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] hover:bg-primary/20 transition-colors"
            >
              <Tag className="h-2.5 w-2.5" />
              {tag}
              <X className="h-2.5 w-2.5" />
            </button>
          ))}
          <button
            onClick={() => selectedTags.forEach((t) => onTagDeselect(t))}
            className="text-[10px] text-muted-foreground hover:text-foreground px-1"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  )
}
