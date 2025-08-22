'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  UserPlus, 
  User, 
  Calendar, 
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

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
  const [searchTerm, setSearchTerm] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newPatientName, setNewPatientName] = useState('')
  const [newPatientContact, setNewPatientContact] = useState('')

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
  const upsertPatient = useMutation(api.mutations.patients.upsertByContact)

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
    } catch (error) {
      console.error('Failed to create patient:', error)
    }
  }

  const handleUpsertPatient = async () => {
    if (!newPatientContact.trim()) return

    try {
      const patientId = await upsertPatient({
        displayName: newPatientName.trim() || undefined,
        emailOrPhone: newPatientContact.trim(),
      })

      // Set the selected patient ID - the query will automatically update
      onPatientSelect(patientId, {
        _id: patientId,
        displayName: newPatientName.trim() || 'Unknown Patient',
        emailOrPhone: newPatientContact.trim(),
        createdAt: Date.now(),
      })

      setNewPatientName('')
      setNewPatientContact('')
      setIsCreating(false)
    } catch (error) {
      console.error('Failed to upsert patient:', error)
    }
  }

  const clearSelection = () => {
    onPatientSelect('', null)
    setSearchTerm('')
    setIsExpanded(false)
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
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">{selectedPatient.displayName}</p>
                  <p className="text-sm text-blue-700">{selectedPatient.emailOrPhone}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                className="text-blue-600 hover:text-blue-800"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search patients by name or email..."
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
                <div className="border rounded-lg max-h-60 overflow-y-auto">
                  {patients?.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      No patients found
                    </div>
                  ) : (
                    <div className="divide-y">
                      {patients?.map((patient: any) => (
                        <button
                          key={patient._id}
                          onClick={() => handlePatientSelect(patient)}
                          className="w-full p-3 text-left hover:bg-gray-50 flex items-center gap-3"
                        >
                          <User className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="font-medium">{patient.displayName}</p>
                            <p className="text-sm text-gray-500">{patient.emailOrPhone}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Create New Patient */}
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreating(!isCreating)}
                  className="w-full"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  {isCreating ? 'Cancel' : 'Create New Patient'}
                </Button>
              </div>

              {isCreating && (
                <div className="space-y-3 p-3 border rounded-lg bg-gray-50">
                  <Input
                    placeholder="Patient name"
                    value={newPatientName}
                    onChange={(e) => setNewPatientName(e.target.value)}
                  />
                  <Input
                    placeholder="Email or phone"
                    value={newPatientContact}
                    onChange={(e) => setNewPatientContact(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleCreatePatient}
                      disabled={!newPatientName.trim() || !newPatientContact.trim()}
                    >
                      Create
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleUpsertPatient}
                      disabled={!newPatientContact.trim()}
                    >
                      Find or Create
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Patient Details */}
      {patientWithEncounters && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Patient History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Encounters:</span>
                <Badge variant="secondary">
                  {patientWithEncounters.encounters.length}
                </Badge>
              </div>
              
              {patientWithEncounters.encounters.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Recent Encounters:</p>
                  <div className="space-y-1">
                    {patientWithEncounters.encounters.slice(0, 3).map((encounter: any) => (
                      <div key={encounter._id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span>{formatDate(encounter.scheduledAt || encounter.createdAt || Date.now())}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {encounter.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
