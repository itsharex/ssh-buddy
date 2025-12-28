import { useState, useRef, useEffect } from 'react'
import { Tag, Plus, X, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface TagManagerProps {
  hostAlias: string
  hostTags: string[]
  allTags: string[]
  onAddTag: (tag: string) => Promise<void>
  onRemoveTag: (tag: string) => Promise<void>
  onCreateTag?: (tag: string) => Promise<void>
  onDeleteTag?: (tag: string) => Promise<void>
}

export function TagManager({
  hostAlias,
  hostTags,
  allTags,
  onAddTag,
  onRemoveTag,
  onCreateTag,
  onDeleteTag,
}: TagManagerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [newTagInput, setNewTagInput] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [tagToDelete, setTagToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleAddExistingTag = async (tag: string) => {
    if (!hostTags.includes(tag)) {
      await onAddTag(tag)
    }
  }

  const handleRemoveTag = async (tag: string) => {
    await onRemoveTag(tag)
  }

  const handleCreateNewTag = async () => {
    const trimmed = newTagInput.trim().toLowerCase()
    if (!trimmed) return

    setIsCreating(true)
    try {
      // Create tag globally if handler provided
      if (onCreateTag && !allTags.includes(trimmed)) {
        await onCreateTag(trimmed)
      }
      // Add to host
      await onAddTag(trimmed)
      setNewTagInput('')
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteTag = async () => {
    if (!tagToDelete || !onDeleteTag) return

    setIsDeleting(true)
    try {
      await onDeleteTag(tagToDelete)
      setTagToDelete(null)
    } finally {
      setIsDeleting(false)
    }
  }

  const availableToAdd = allTags.filter((t) => !hostTags.includes(t))
  const canCreateNew =
    newTagInput.trim() &&
    !allTags.includes(newTagInput.trim().toLowerCase()) &&
    !hostTags.includes(newTagInput.trim().toLowerCase())

  return (
    <>
      {/* Inline Tag Display */}
      <div className="flex flex-wrap items-center gap-1.5">
        {hostTags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs"
          >
            <Tag className="h-2.5 w-2.5" />
            {tag}
          </span>
        ))}
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-dashed border-muted-foreground/30 text-muted-foreground text-xs hover:border-primary hover:text-primary transition-colors"
        >
          <Plus className="h-2.5 w-2.5" />
          {hostTags.length === 0 ? 'Add tag' : 'Edit'}
        </button>
      </div>

      {/* Tag Editor Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Manage Tags
            </DialogTitle>
            <DialogDescription>
              Add or remove tags for {hostAlias}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Current Tags */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Current Tags</label>
              {hostTags.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No tags assigned
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {hostTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleRemoveTag(tag)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-sm hover:bg-destructive/10 hover:text-destructive transition-colors group"
                    >
                      <Tag className="h-3 w-3" />
                      {tag}
                      <X className="h-3 w-3 opacity-50 group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Add New Tag */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Add Tag</label>
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  placeholder="Enter tag name..."
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (
                      e.key === 'Enter' &&
                      (canCreateNew ||
                        availableToAdd.includes(
                          newTagInput.trim().toLowerCase()
                        ))
                    ) {
                      e.preventDefault()
                      if (canCreateNew) {
                        handleCreateNewTag()
                      } else {
                        handleAddExistingTag(newTagInput.trim().toLowerCase())
                        setNewTagInput('')
                      }
                    }
                  }}
                  className="flex-1"
                  disabled={isCreating}
                />
                {canCreateNew && (
                  <Button
                    size="sm"
                    onClick={handleCreateNewTag}
                    disabled={isCreating}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Create
                  </Button>
                )}
              </div>
              {canCreateNew && (
                <p className="text-xs text-muted-foreground">
                  Press Enter or click Create to add new tag "
                  {newTagInput.trim()}"
                </p>
              )}
            </div>

            {/* Available Tags */}
            {availableToAdd.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Available Tags</label>
                <div className="flex flex-wrap gap-1.5">
                  {availableToAdd.map((tag) => (
                    <div key={tag} className="inline-flex items-center group">
                      <button
                        onClick={() => handleAddExistingTag(tag)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-l-full border border-r-0 border-muted-foreground/30 text-muted-foreground text-sm hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        {tag}
                      </button>
                      {onDeleteTag && (
                        <button
                          onClick={() => setTagToDelete(tag)}
                          className="inline-flex items-center px-1.5 py-1 rounded-r-full border border-muted-foreground/30 text-muted-foreground text-sm hover:border-destructive hover:text-destructive hover:bg-destructive/5 transition-colors"
                          title="Delete tag globally"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Tags (for deletion) */}
            {onDeleteTag && allTags.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border">
                <label className="text-sm font-medium text-muted-foreground">
                  All Tags (click trash to delete globally)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {allTags.map((tag) => (
                    <div
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs"
                    >
                      <Tag className="h-2.5 w-2.5" />
                      {tag}
                      <button
                        onClick={() => setTagToDelete(tag)}
                        className="ml-0.5 p-0.5 rounded-full hover:bg-destructive/20 hover:text-destructive transition-colors"
                        title="Delete tag globally"
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Tag Confirmation Dialog */}
      <Dialog
        open={tagToDelete !== null}
        onOpenChange={(open) => !open && setTagToDelete(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Tag</DialogTitle>
            <DialogDescription className="pt-2">
              Are you sure you want to delete the tag{' '}
              <span className="font-mono text-foreground">"{tagToDelete}"</span>
              ?
              <span className="block mt-2 text-amber-600">
                This will remove it from all hosts.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setTagToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTag}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

interface TagBadgeProps {
  tag: string
  onRemove?: () => void
  className?: string
}

export function TagBadge({ tag, onRemove, className }: TagBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs',
        onRemove && 'pr-1',
        className
      )}
    >
      <Tag className="h-2.5 w-2.5" />
      {tag}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-0.5 p-0.5 rounded-full hover:bg-primary/20 transition-colors"
        >
          <X className="h-2.5 w-2.5" />
        </button>
      )}
    </span>
  )
}
