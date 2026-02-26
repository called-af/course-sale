import { useState } from "react"
import { useUser } from "@/hooks/useUser"

import type { User } from "@/types/user"

import AdminLayout from "@/components/templates/AdminLayout"
import InputField from "@/components/molecules/InputField"
import Button from "@/components/atoms/Button"

import UserTable from "@/components/organism/UserTable"
import UserFormModal from "@/components/organism/UserFormModal"
import ConfirmationDelete from "@/components/molecules/ConfirmationDelete"
import { Head } from "@inertiajs/react"

export default function UserPage({ users }: { users: User[] }) {
  const {
    data,
    setData,
    processing,

    editingUser,
    deleteTarget,

    startEdit,
    closeEdit,

    submitCreate,
    submitUpdate,

    openDeleteModal,
    closeDeleteModal,
    confirmDelete,
  } = useUser()

  const [search, setSearch] = useState("")
  const [formOpen, setFormOpen] = useState(false)

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase())
  )

  function handleAddClick() {
    closeEdit()
    setFormOpen(true)
  }

  function handleEditClick(user: User) {
    startEdit(user)
    setFormOpen(true)
  }

  function handleSubmit() {
    if (editingUser) {
      submitUpdate()
    } else {
      submitCreate()
    }

    setFormOpen(false)
  }

  return (
    <>
      <Head title="User Management" />
      <div className="max-w-6xl mx-auto space-y-6">

        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Users</h1>

          <Button onClick={handleAddClick}>
            Add User
          </Button>
        </div>

        <InputField
          label="Search Users"
          placeholder="Search name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <UserTable
          users={filteredUsers}
          onEdit={handleEditClick}
          onDelete={openDeleteModal}
        />

        <UserFormModal
          open={formOpen}
          onClose={() => setFormOpen(false)}
          onSubmit={handleSubmit}
          processing={processing}
          editing={!!editingUser}
          data={data}
          setData={setData}
        />

        {/* 🔥 DELETE MODAL — SOURCE OF TRUTH */}
        <ConfirmationDelete
          open={!!deleteTarget}
          onClose={closeDeleteModal}
          onConfirm={confirmDelete}
          isLoading={processing}
          title="Delete User"
          message="User will be permanently deleted."
        />
      </div>
    </>
  )
}

UserPage.layout = (page: React.ReactNode) => (
  <AdminLayout>{page}</AdminLayout>
)