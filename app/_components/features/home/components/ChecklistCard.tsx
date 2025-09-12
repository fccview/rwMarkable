"use client"

import { useState, useRef, useEffect } from "react"
import { Trash2, Plus } from "lucide-react"
import { deleteListAction, createItemAction, updateItemAction, deleteItemAction } from "@/app/_server/actions/data/actions"
import { Button } from "@/app/_components/ui/elements/button"
import { ChecklistItem } from "./ChecklistItem"

interface Item {
  id: string
  text: string
  completed: boolean
  order: number
}

interface List {
  id: string
  title: string
  category?: string
  items: Item[]
}

interface ChecklistCardProps {
  list: List
  onUpdate?: () => void
}

export function ChecklistCard({ list, onUpdate }: ChecklistCardProps) {
  const [newItemText, setNewItemText] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [shouldFocus, setShouldFocus] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItemText.trim()) return

    setIsLoading(true)
    const formData = new FormData()
    formData.append('listId', list.id)
    formData.append('text', newItemText.trim())
    const result = await createItemAction(formData)
    setIsLoading(false)

    if (result.success) {
      setNewItemText("")
      setShouldFocus(true)
      onUpdate?.()
    }
  }

  useEffect(() => {
    if (shouldFocus && inputRef.current) {
      inputRef.current.focus()
      setShouldFocus(false)
    }
  }, [shouldFocus])

  const handleDeleteList = async () => {
    if (confirm("Are you sure you want to delete this list?")) {
      const formData = new FormData()
      formData.append('id', list.id)
      formData.append('category', list.category || 'Uncategorized')
      await deleteListAction(formData)
      onUpdate?.()
    }
  }

  const handleToggleItem = async (itemId: string, completed: boolean) => {
    const formData = new FormData()
    formData.append('listId', list.id)
    formData.append('itemId', itemId)
    formData.append('completed', String(completed))
    await updateItemAction(formData)
    setShouldFocus(true)
    onUpdate?.()
  }

  const handleDeleteItem = async (itemId: string) => {
    const formData = new FormData()
    formData.append('listId', list.id)
    formData.append('itemId', itemId)
    await deleteItemAction(formData)
    setShouldFocus(true)
    onUpdate?.()
  }

  const incompleteItems = list.items.filter(item => !item.completed)
  const completedItems = list.items.filter(item => item.completed)

  return (
    <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg text-foreground">{list.title}</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDeleteList}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2 mb-4">
        {incompleteItems.map((item, index) => (
          <ChecklistItem
            key={item.id}
            item={item}
            index={index}
            onToggle={handleToggleItem}
            onDelete={handleDeleteItem}
          />
        ))}
      </div>

      {completedItems.length > 0 && (
        <div className="border-t border-border pt-4 mb-4">
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Completed</h4>
          <div className="space-y-2">
            {completedItems.map((item, index) => (
              <ChecklistItem
                key={item.id}
                item={item}
                index={incompleteItems.length + index}
                onToggle={handleToggleItem}
                onDelete={handleDeleteItem}
                completed
              />
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleCreateItem} className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          placeholder="Add new item..."
          className="flex-1 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          disabled={isLoading}
        />
        <Button type="submit" size="sm" disabled={isLoading || !newItemText.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
} 