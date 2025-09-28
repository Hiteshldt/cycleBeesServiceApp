'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatDate } from '@/lib/utils'
import { Plus, Edit, Trash2, Save, X, MessageSquare } from 'lucide-react'

interface Note {
  id: string
  request_id: string
  note_text: string
  created_by: string
  created_at: string
  updated_at: string
}

interface NotesManagerProps {
  requestId: string
  className?: string
}

export function NotesManager({ requestId, className = '' }: NotesManagerProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')

  useEffect(() => {
    fetchNotes()
  }, [requestId])

  const fetchNotes = async () => {
    try {
      const response = await fetch(`/api/requests/${requestId}/notes`)
      if (response.ok) {
        const data = await response.json()
        setNotes(data)
      } else {
        console.error('Failed to fetch notes')
      }
    } catch (error) {
      console.error('Error fetching notes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddNote = async () => {
    if (!noteText.trim()) return

    try {
      const response = await fetch(`/api/requests/${requestId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note_text: noteText.trim() })
      })

      if (response.ok) {
        setNoteText('')
        setShowAddForm(false)
        fetchNotes() // Refresh notes
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to add note')
      }
    } catch (error) {
      console.error('Error adding note:', error)
      alert('Failed to add note')
    }
  }

  const handleEditNote = async (noteId: string) => {
    if (!noteText.trim()) return

    try {
      const response = await fetch(`/api/requests/${requestId}/notes/${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note_text: noteText.trim() })
      })

      if (response.ok) {
        setNoteText('')
        setEditingNote(null)
        fetchNotes() // Refresh notes
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update note')
      }
    } catch (error) {
      console.error('Error updating note:', error)
      alert('Failed to update note')
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return

    try {
      const response = await fetch(`/api/requests/${requestId}/notes/${noteId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchNotes() // Refresh notes
      } else {
        alert('Failed to delete note')
      }
    } catch (error) {
      console.error('Error deleting note:', error)
      alert('Failed to delete note')
    }
  }

  const startEditing = (note: Note) => {
    setEditingNote(note.id)
    setNoteText(note.note_text)
    setShowAddForm(false)
  }

  const cancelEdit = () => {
    setEditingNote(null)
    setNoteText('')
  }

  const cancelAdd = () => {
    setShowAddForm(false)
    setNoteText('')
  }

  if (isLoading) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="flex items-center gap-2 text-gray-600">
          <MessageSquare className="h-4 w-4" />
          <span>Loading notes...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-blue-600" />
          <span className="font-medium text-gray-900">Notes ({notes.length})</span>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          size="sm"
          variant="outline"
          disabled={showAddForm || editingNote !== null}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Note
        </Button>
      </div>

      {/* Add Note Form */}
      {showAddForm && (
        <div className="p-3 border rounded-lg bg-gray-50">
          <Label htmlFor="new-note">Add Note</Label>
          <div className="mt-1 space-y-2">
            <Input
              id="new-note"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Enter your note..."
              maxLength={1000}
            />
            <div className="flex items-center gap-2">
              <Button onClick={handleAddNote} size="sm" disabled={!noteText.trim()}>
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
              <Button onClick={cancelAdd} size="sm" variant="outline">
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <span className="text-xs text-gray-500 ml-auto">
                {noteText.length}/1000
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Notes List */}
      {notes.length === 0 && !showAddForm ? (
        <div className="text-center py-6 text-gray-500">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          <p>No notes yet</p>
          <p className="text-sm">Add a note to keep track of important information</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notes.map((note) => (
            <div key={note.id} className="p-3 border rounded-lg bg-white">
              {editingNote === note.id ? (
                <div className="space-y-2">
                  <Input
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Edit note..."
                    maxLength={1000}
                  />
                  <div className="flex items-center gap-2">
                    <Button onClick={() => handleEditNote(note.id)} size="sm" disabled={!noteText.trim()}>
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                    <Button onClick={cancelEdit} size="sm" variant="outline">
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                    <span className="text-xs text-gray-500 ml-auto">
                      {noteText.length}/1000
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-900 mb-2">{note.note_text}</p>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      <span>By {note.created_by}</span>
                      <span className="mx-1">•</span>
                      <span>{formatDate(note.created_at)}</span>
                      {note.updated_at !== note.created_at && (
                        <span className="ml-1 text-gray-400">(edited)</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        onClick={() => startEditing(note)}
                        size="sm"
                        variant="ghost"
                        disabled={editingNote !== null || showAddForm}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        onClick={() => handleDeleteNote(note.id)}
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700"
                        disabled={editingNote !== null || showAddForm}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}