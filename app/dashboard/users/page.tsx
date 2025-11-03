'use client'

import { useState, useEffect } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Plus, Edit, Trash2, Shield, Mail } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { RoleGuard } from '@/components/auth/role-guard'
import { profileOperations } from '@/lib/database'
import type { Profile } from '@/lib/supabase'
import { EditUserDialog } from '@/components/users/edit-user-dialog'
import { CreateUserDialog } from '@/components/users/create-user-dialog'

export default function UsersPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<Profile | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const loadUsers = async () => {
    setLoading(true)
    const allUsers = await profileOperations.getAllProfiles()
    setUsers(allUsers)
    setLoading(false)
  }

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const handleStatusToggle = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    const updatedProfile = await profileOperations.updateProfile(userId, {
      status: newStatus,
    })
    
    if (updatedProfile) {
      setUsers(users.map(user => 
        user.id === userId ? { ...user, status: newStatus } : user
      ))
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'supervisor':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'technician':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'customer':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const columns: ColumnDef<Profile>[] = [
    {
      accessorKey: 'full_name',
      header: 'Name',
      cell: ({ row }) => {
        const user = row.original
        return (
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <span className="text-sm font-medium">
                {user.full_name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="font-medium">{user.full_name || 'No name'}</div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => {
        const role = row.getValue('role') as string
        return (
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(
              role
            )}`}
          >
            <Shield className="mr-1 h-3 w-3" />
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </span>
        )
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const user = row.original
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={user.status === 'active'}
              onCheckedChange={() => handleStatusToggle(user.id, user.status)}
            />
            <span className="text-sm">
              {user.status === 'active' ? 'Active' : 'Inactive'}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Joined',
      cell: ({ row }) => {
        const date = new Date(row.getValue('created_at'))
        return <div className="text-sm">{date.toLocaleDateString()}</div>
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const user = row.original
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(user.email)}
              >
                <Mail className="mr-2 h-4 w-4" />
                Copy email
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setEditingUser(user)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit user
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete user
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return (
    <RoleGuard allowedRoles={['admin', 'supervisor']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground">
              Manage user accounts, roles, and permissions.
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>
              A list of all users in the system with their roles and status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={users}
                searchKey="full_name"
                searchPlaceholder="Search users..."
              />
            )}
          </CardContent>
        </Card>

        {/* Edit User Dialog */}
        {editingUser && (
          <EditUserDialog
            user={editingUser}
            open={!!editingUser}
            onOpenChange={(open) => !open && setEditingUser(null)}
            onUserUpdated={loadUsers}
          />
        )}

        {/* Create User Dialog */}
        <CreateUserDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onUserCreated={loadUsers}
        />
      </div>
    </RoleGuard>
  )
}