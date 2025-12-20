import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { useState, useMemo } from 'react'
import { Command } from '@phosphor-icons/react'

interface Shortcut {
  keys: string[]
  description: string
  category: 'navigation' | 'tools' | 'actions' | 'view'
}

const shortcuts: Shortcut[] = [
  { keys: ['Ctrl/Cmd', 'O'], description: 'Open PDF file', category: 'actions' },
  { keys: ['Ctrl/Cmd', 'S'], description: 'Download/Save PDF', category: 'actions' },
  { keys: ['Ctrl/Cmd', 'F'], description: 'Search document', category: 'actions' },
  { keys: ['Ctrl/Cmd', 'Shift', 'A'], description: 'Toggle markup toolbar', category: 'actions' },
  { keys: ['Ctrl/Cmd', 'Z'], description: 'Undo last action', category: 'actions' },
  { keys: ['Ctrl/Cmd', 'Shift', 'Z'], description: 'Redo last action', category: 'actions' },
  
  { keys: ['↑'], description: 'Previous page', category: 'navigation' },
  { keys: ['↓'], description: 'Next page', category: 'navigation' },
  { keys: ['j'], description: 'Next page (vim-style)', category: 'navigation' },
  { keys: ['k'], description: 'Previous page (vim-style)', category: 'navigation' },
  { keys: ['Page Up'], description: 'Previous page', category: 'navigation' },
  { keys: ['Page Down'], description: 'Next page', category: 'navigation' },
  { keys: ['Home'], description: 'Go to first page', category: 'navigation' },
  { keys: ['End'], description: 'Go to last page', category: 'navigation' },
  
  { keys: ['h'], description: 'Activate highlight tool', category: 'tools' },
  { keys: ['p'], description: 'Activate pen tool', category: 'tools' },
  { keys: ['s'], description: 'Activate signature tool', category: 'tools' },
  { keys: ['t'], description: 'Activate text box tool', category: 'tools' },
  { keys: ['r'], description: 'Activate rectangle tool', category: 'tools' },
  { keys: ['Delete'], description: 'Delete selected annotation', category: 'tools' },
  { keys: ['Backspace'], description: 'Delete selected annotation', category: 'tools' },
  
  { keys: ['+'], description: 'Zoom in', category: 'view' },
  { keys: ['='], description: 'Zoom in', category: 'view' },
  { keys: ['-'], description: 'Zoom out', category: 'view' },
  { keys: ['0'], description: 'Fit to width', category: 'view' },
  { keys: ['1'], description: 'Zoom to 100%', category: 'view' },
  
  { keys: ['Escape'], description: 'Close dialogs/toolbars', category: 'actions' },
  { keys: ['?'], description: 'Show keyboard shortcuts', category: 'actions' },
]

const categoryNames = {
  navigation: 'Navigation',
  tools: 'Annotation Tools',
  actions: 'Actions',
  view: 'View',
}

interface KeyboardShortcutsDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function KeyboardShortcutsDialog({ isOpen, onClose }: KeyboardShortcutsDialogProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredShortcuts = useMemo(() => {
    if (!searchQuery) return shortcuts

    const query = searchQuery.toLowerCase()
    return shortcuts.filter(
      (shortcut) =>
        shortcut.description.toLowerCase().includes(query) ||
        shortcut.keys.some((key) => key.toLowerCase().includes(query))
    )
  }, [searchQuery])

  const groupedShortcuts = useMemo(() => {
    const groups: Record<string, Shortcut[]> = {
      navigation: [],
      tools: [],
      actions: [],
      view: [],
    }

    filteredShortcuts.forEach((shortcut) => {
      groups[shortcut.category].push(shortcut)
    })

    return groups
  }, [filteredShortcuts])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
        aria-describedby="keyboard-shortcuts-description"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Command size={24} weight="duotone" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription id="keyboard-shortcuts-description">
            Complete list of keyboard shortcuts for faster navigation and editing
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <Input
            placeholder="Search shortcuts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
            autoFocus
            aria-label="Search keyboard shortcuts"
          />

          <div className="overflow-y-auto flex-1 space-y-6 pr-2">
            {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => {
              if (categoryShortcuts.length === 0) return null

              return (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    {categoryNames[category as keyof typeof categoryNames]}
                  </h3>
                  <div className="space-y-2">
                    {categoryShortcuts.map((shortcut, index) => (
                      <div
                        key={`${category}-${index}`}
                        className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50 transition-colors"
                      >
                        <span className="text-sm text-foreground">{shortcut.description}</span>
                        <div className="flex items-center gap-1">
                          {shortcut.keys.map((key, keyIndex) => (
                            <kbd
                              key={keyIndex}
                              className="px-2 py-1 text-xs font-mono bg-muted border border-border rounded shadow-sm"
                            >
                              {key}
                            </kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  {category !== 'view' && <Separator className="mt-4" />}
                </div>
              )
            })}

            {filteredShortcuts.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p>No shortcuts found matching "{searchQuery}"</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors"
            aria-label="Close keyboard shortcuts dialog"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
