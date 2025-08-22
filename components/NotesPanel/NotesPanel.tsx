'use client'

import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  MessageSquare,
  Stethoscope,
  Pill,
  Calendar
} from 'lucide-react'
import { formatTime } from '@/lib/utils'

interface NotesPanelProps {
  encounterId: string
  patientId?: string
  providerId: string
}

const noteTypeIcons = {
  general: MessageSquare,
  assessment: Stethoscope,
  treatment: Pill,
  followup: Calendar,
}

const noteTypeColors = {
  general: 'bg-blue-100 text-blue-800',
  assessment: 'bg-green-100 text-green-800',
  treatment: 'bg-purple-100 text-purple-800',
  followup: 'bg-orange-100 text-orange-800',
}

export function NotesPanel({ encounterId, patientId, providerId }: NotesPanelProps) {
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [newNoteContent, setNewNoteContent] = useState('')
  const [newNoteType, setNewNoteType] = useState<'general' | 'assessment' | 'treatment' | 'followup'>('general')
  const [editNoteContent, setEditNoteContent] = useState('')
  const [editNoteType, setEditNoteType] = useState<'general' | 'assessment' | 'treatment' | 'followup'>('general')

  const notes = useQuery(api.queries.notes.getNotesForEncounter, { encounterId: encounterId as any })
  const createNote = useMutation(api.mutations.notes.createNote)
  const updateNote = useMutation(api.mutations.notes.updateNote)
  const deleteNote = useMutation(api.mutations.notes.deleteNote)

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) return

    try {
      await createNote({
        encounterId: encounterId as any,
        patientId: patientId as any,
        providerId,
        content: newNoteContent,
        type: newNoteType,
      })
      setNewNoteContent('')
      setNewNoteType('general')
      setIsAddingNote(false)
    } catch (error) {
      console.error('Failed to create note:', error)
    }
  }

  const handleEditNote = async (noteId: string) => {
    if (!editNoteContent.trim()) return

    try {
      await updateNote({
        noteId: noteId as any,
        content: editNoteContent,
        type: editNoteType,
      })
      setEditingNoteId(null)
      setEditNoteContent('')
      setEditNoteType('general')
    } catch (error) {
      console.error('Failed to update note:', error)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return

    try {
      await deleteNote({ noteId: noteId as any })
    } catch (error) {
      console.error('Failed to delete note:', error)
    }
  }

  const startEditing = (note: any) => {
    setEditingNoteId(note._id)
    setEditNoteContent(note.content)
    setEditNoteType(note.type)
  }

  const cancelEditing = () => {
    setEditingNoteId(null)
    setEditNoteContent('')
    setEditNoteType('general')
  }

  if (!notes) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500">Loading notes...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Notes ({notes.length})
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsAddingNote(true)}
            disabled={isAddingNote}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Note
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add New Note */}
        {isAddingNote && (
          <div className="p-4 border rounded-lg bg-blue-50">
            <div className="space-y-3">
              <Select value={newNoteType} onValueChange={(value: any) => setNewNoteType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Note type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="assessment">Assessment</SelectItem>
                  <SelectItem value="treatment">Treatment</SelectItem>
                  <SelectItem value="followup">Follow-up</SelectItem>
                </SelectContent>
              </Select>
              <Textarea
                placeholder="Enter your note..."
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                rows={3}
              />
              <div className="flex space-x-2">
                <Button size="sm" onClick={handleAddNote}>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsAddingNote(false)}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Notes List */}
        {notes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No notes yet</p>
            <p className="text-sm">Add your first note to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => {
              const IconComponent = noteTypeIcons[note.type as keyof typeof noteTypeIcons]
              const colorClass = noteTypeColors[note.type as keyof typeof noteTypeColors]

              return (
                <div key={note._id} className="border rounded-lg p-3">
                  {editingNoteId === note._id ? (
                    <div className="space-y-3">
                      <Select value={editNoteType} onValueChange={(value: any) => setEditNoteType(value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Note type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="assessment">Assessment</SelectItem>
                          <SelectItem value="treatment">Treatment</SelectItem>
                          <SelectItem value="followup">Follow-up</SelectItem>
                        </SelectContent>
                      </Select>
                      <Textarea
                        value={editNoteContent}
                        onChange={(e) => setEditNoteContent(e.target.value)}
                        rows={3}
                      />
                      <div className="flex space-x-2">
                        <Button size="sm" onClick={() => handleEditNote(note._id)}>
                          <Save className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEditing}>
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <IconComponent className="w-4 h-4 text-gray-500" />
                          <Badge className={colorClass} variant="secondary">
                            {note.type.charAt(0).toUpperCase() + note.type.slice(1)}
                          </Badge>
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEditing(note)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteNote(note._id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {formatTime(note.createdAt)}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
