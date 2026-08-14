import { useState } from "react"
import { useUser } from "@/hooks/useUser"
import { Head } from "@inertiajs/react"
import { Plus } from "lucide-react"

import type { User } from "@/types/user"
import AdminLayout from "@/components/templates/AdminLayout"
import Button from "@/components/atoms/Button"
import InputField from "@/components/molecules/InputField"
import PageHeader from "@/components/molecules/PageHeader"

import UserTable from "@/components/organism/UserTable"
import UserFormModal from "@/components/organism/UserFormModal"
import ConfirmationDelete from "@/components/molecules/ConfirmationDelete"

export default function UserPage({ users }: { users: User[] }) {
  const {
    data, setData, processing,
    editingUser, deleteTarget,
    startEdit, closeEdit,
    submitCreate, submitUpdate,
    openDeleteModal, closeDeleteModal, confirmDelete,
  } = useUser()

  const [search, setSearch] = useState("")
  const [formOpen, setFormOpen] = useState(false)

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
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

      <div className="max-w-8xl mx-auto space-y-8">

        <PageHeader
          breadcrumbs={[{ label: "Admin" }, { label: "Users" }]}
          title="User Management"
          description="Manage all registered users on the platform"
          actions={
            <Button
              onClick={handleAddClick}
              leftIcon={<Plus className="w-4 h-4" />}
              className="!rounded-none"
            >
              Add User
            </Button>
          }
        />

        {/* Content Card */}
        <div className="bg-white border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                All Users ({filteredUsers.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Filter or search through all registered users.
              </p>
            </div>
            <div className="w-full sm:w-80">
              <InputField
                label=""
                placeholder="Search name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <UserTable
            users={filteredUsers}
            onEdit={handleEditClick}
            onDelete={openDeleteModal}
          />
        </div>

        <UserFormModal
          open={formOpen}
          onClose={() => setFormOpen(false)}
          onSubmit={handleSubmit}
          processing={processing}
          editing={!!editingUser}
          data={data}
          setData={setData}
        />

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
