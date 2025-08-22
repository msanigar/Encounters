'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Toast, useToast } from '@/components/ui/toast'
import { 
  Search, 
  UserPlus, 
  User, 
  Calendar, 
  ChevronDown,
  ChevronUp,
  X,
  Edit,
  Save
} from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils'

interface PatientSelectorProps {
  onPatientSelect: (patientId: string, patient: any) => void
  selectedPatientId?: string | null
  className?: string
}

export function PatientSelector({ 
  onPatientSelect, 
  selectedPatientId, 
  className = '' 
}: PatientSelectorProps) {
  
  const [isExpanded, setIsExpanded] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [newPatientName, setNewPatientName] = useState('')
  const [newPatientContact, setNewPatientContact] = useState('')
  const [editPatientName, setEditPatientName] = useState('')
  const [editPatientContact, setEditPatientContact] = useState('')
  const { toast, showToast, hideToast } = useToast()

  const patients = useQuery(api.queries.patients.list, { search: searchTerm })
  const selectedPatient = useQuery(
    api.queries.patients.get, 
    selectedPatientId ? { id: selectedPatientId as any } : 'skip'
  )
  const patientWithEncounters = useQuery(
    api.queries.patients.getWithEncounters,
    selectedPatientId ? { patientId: selectedPatientId as any } : 'skip'
  )

  const createPatient = useMutation(api.mutations.patients.create)
  const updatePatient = useMutation(api.mutations.patients.update)
  const upsertPatient = useMutation(api.mutations.patients.upsertByContact)

  // Initialize edit form when patient is selected
  useEffect(() => {
    if (selectedPatient && !isEditing) {
      setEditPatientName(selectedPatient.displayName)
      setEditPatientContact(selectedPatient.emailOrPhone)
    }
  }, [selectedPatient, isEditing])

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setIsExpanded(true)
  }

  const handlePatientSelect = (patient: any) => {
    onPatientSelect(patient._id, patient)
    setIsExpanded(false)
    setSearchTerm('')
  }

  const handleCreatePatient = async () => {
    if (!newPatientName.trim() || !newPatientContact.trim()) return

    try {
      const patientId = await createPatient({
        displayName: newPatientName.trim(),
        emailOrPhone: newPatientContact.trim(),
      })

      // Set the selected patient ID - the query will automatically update
      onPatientSelect(patientId, {
        _id: patientId,
        displayName: newPatientName.trim(),
        emailOrPhone: newPatientContact.trim(),
        createdAt: Date.now(),
      })

      setNewPatientName('')
      setNewPatientContact('')
      setIsCreating(false)
      showToast('Patient created successfully!')
    } catch (error) {
      console.error('Failed to create patient:', error)
      showToast('Failed to create patient. Please try again.')
    }
  }

  const handleUpdatePatient = async () => {
    if (!selectedPatientId || !editPatientName.trim() || !editPatientContact.trim()) return

    try {
      await updatePatient({
        patientId: selectedPatientId as any,
        displayName: editPatientName.trim(),
        emailOrPhone: editPatientContact.trim(),
      })

      setIsEditing(false)
      showToast('Patient updated successfully!')
    } catch (error: any) {
      console.error('Failed to update patient:', error)
      showToast(error.message || 'Failed to update patient. Please try again.')
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    if (selectedPatient) {
      setEditPatientName(selectedPatient.displayName)
      setEditPatientContact(selectedPatient.emailOrPhone)
    }
  }

  const handleUpsertPatient = async () => {
    if (!newPatientName.trim() || !newPatientContact.trim()) return

    try {
      const patientId = await upsertPatient({
        displayName: newPatientName.trim(),
        emailOrPhone: newPatientContact.trim(),
      })

      // Refresh the patient list and select the patient
      const patient = patients?.find(p => p._id === patientId)
      if (patient) {
        onPatientSelect(patientId, patient)
      }

      setNewPatientName('')
      setNewPatientContact('')
      setIsCreating(false)
      showToast('Patient created/updated successfully!')
    } catch (error) {
      console.error('Failed to upsert patient:', error)
      showToast('Failed to create/update patient. Please try again.')
    }
  }

  const clearSelection = () => {
    onPatientSelect('', null)
    setSearchTerm('')
    setIsExpanded(false)
    setIsEditing(false)
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Scheduled'
      case 'completed':
        return 'Completed'
      case 'cancelled':
        return 'Cancelled'
      case 'no-show':
        return 'No Show'
      case 'rescheduled':
        return 'Rescheduled'
      default:
        return 'Unknown'
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search/Select Patient */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5" />
            Select Patient
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {selectedPatient ? (
            <div className="space-y-3">
              {isEditing ? (
                // Edit Mode
                <div className="p-3 bg-blue-50 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-blue-900">Edit Patient</h4>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={handleUpdatePatient}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Save className="w-4 h-4 mr-1" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelEdit}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Input
                      placeholder="Full name"
                      value={editPatientName}
                      onChange={(e) => setEditPatientName(e.target.value)}
                      className="text-sm"
                    />
                    <Input
                      placeholder="Email or phone"
                      value={editPatientContact}
                      onChange={(e) => setEditPatientContact(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-900">{selectedPatient.displayName}</p>
                      <p className="text-sm text-blue-700">{selectedPatient.emailOrPhone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Edit patient"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearSelection}
                      className="text-blue-600 hover:text-blue-800"
                      title="Clear selection"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Patient History */}
              {patientWithEncounters && patientWithEncounters.encounters && patientWithEncounters.encounters.length > 0 && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Encounters</h4>
                  <div className="space-y-1">
                    {patientWithEncounters.encounters.slice(0, 3).map((encounter: any) => {
                      // Handle different date field possibilities
                      const encounterDate = encounter.scheduledAt || encounter.createdAt || encounter.linkCreatedAt
                      const formattedDateTime = encounterDate ? formatTime(encounterDate) : 'Unknown date'
                      
                      return (
                        <div key={encounter._id} className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">
                            {formattedDateTime}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {encounter.status ? getStatusText(encounter.status) : 'No status'}
                          </Badge>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search patients..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </div>

              {/* Search Results */}
              {isExpanded && (
                <div className="border rounded-lg max-h-48 overflow-y-auto">
                  {patients && patients.length > 0 ? (
                    <div className="space-y-1 p-2">
                      {patients.map((patient: any) => (
                        <button
                          key={patient._id}
                          onClick={() => handlePatientSelect(patient)}
                          className="w-full text-left p-2 hover:bg-gray-100 rounded text-sm"
                        >
                          <div className="font-medium">{patient.displayName}</div>
                          <div className="text-gray-600">{patient.emailOrPhone}</div>
                        </button>
                      ))}
                    </div>
                  ) : searchTerm ? (
                    <div className="p-4 text-center text-gray-500">
                      <p className="text-sm">No patients found</p>
                      <p className="text-xs">Try a different search term or create a new patient</p>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Create New Patient */}
              {!isCreating ? (
                <Button
                  variant="outline"
                  onClick={() => setIsCreating(true)}
                  className="w-full"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create New Patient
                </Button>
              ) : (
                <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Create New Patient</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsCreating(false)
                        setNewPatientName('')
                        setNewPatientContact('')
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Input
                      placeholder="Full name"
                      value={newPatientName}
                      onChange={(e) => setNewPatientName(e.target.value)}
                      className="text-sm"
                    />
                    <Input
                      placeholder="Email or phone"
                      value={newPatientContact}
                      onChange={(e) => setNewPatientContact(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleCreatePatient}
                      disabled={!newPatientName.trim() || !newPatientContact.trim()}
                      className="flex-1"
                    >
                      Create Patient
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleUpsertPatient}
                      disabled={!newPatientName.trim() || !newPatientContact.trim()}
                      className="flex-1"
                    >
                      Create/Update
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  )
}
