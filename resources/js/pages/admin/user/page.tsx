import { useEffect, useRef, useState } from "react"
import { useUser } from "@/hooks/useUser"
import { Head, router } from "@inertiajs/react"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"

import type { User } from "@/types/user"
import AdminLayout from "@/components/templates/AdminLayout"
import Button from "@/components/atoms/Button"
import InputField from "@/components/molecules/InputField"
import SelectField from "@/components/molecules/SelectField"
import PageHeader from "@/components/molecules/PageHeader"

import UserTable from "@/components/organisms/UserTable"
import UserFormModal from "@/components/organisms/UserFormModal"
import ConfirmationDelete from "@/components/molecules/ConfirmationDelete"

export default function UserPage({ users, filters }: { users: any; filters?: { search?: string; role?: string } }) {
  const {
    data, setData, processing,
    editingUser, deleteTarget,
    startEdit, closeEdit,
    submitCreate, submitUpdate,
    openDeleteModal, closeDeleteModal, confirmDelete,
  } = useUser()

  const [search, setSearch] = useState(filters?.search ?? "")
  const [role, setRole] = useState(filters?.role ?? "")
  const [formOpen, setFormOpen] = useState(false)
  const firstFilterRender = useRef(true)

  const userItems: User[] = users?.data ?? []

  useEffect(() => {
    if (firstFilterRender.current) {
      firstFilterRender.current = false
      return
    }

    const timer = window.setTimeout(() => {
      router.get("/admin/users", { search: search || undefined, role: role || undefined }, {
        only: ["users", "filters"],
        preserveState: true,
        preserveScroll: true,
      })
    }, 300)

    return () => window.clearTimeout(timer)
  }, [search, role])

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
        <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                All Users ({users?.total ?? 0})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Filter or search through all registered users.
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <InputField
                label=""
                placeholder="Search name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <SelectField
                label=""
                value={role}
                onChange={(e) => setRole(e.target.value)}
                options={[
                  { label: "All Roles", value: "" },
                  { label: "Admin", value: "admin" },
                  { label: "Instructor", value: "instructor" },
                  { label: "Student", value: "student" },
                ]}
                className="min-w-36"
              />
            </div>
          </div>

          <UserTable
            users={userItems}
            onEdit={handleEditClick}
            onDelete={openDeleteModal}
          />

          {(users?.last_page ?? 1) > 1 && (
            <div className="flex flex-col gap-3 border-t border-slate-100 dark:border-slate-700 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Showing {userItems.length === 0 ? 0 : ((users.current_page - 1) * 10) + 1}
                –{Math.min(users.current_page * 10, users.total)} of {users.total} users
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={users.current_page === 1}
                  onClick={() => router.get("/admin/users", { page: users.current_page - 1, search: search || undefined, role: role || undefined }, { only: ["users", "filters"], preserveState: true, preserveScroll: true })}
                  leftIcon={<ChevronLeft className="h-4 w-4" />}
                >
                  Previous
                </Button>
                <span className="px-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                  Page {users.current_page} of {users.last_page}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={users.current_page === users.last_page}
                  onClick={() => router.get("/admin/users", { page: users.current_page + 1, search: search || undefined, role: role || undefined }, { only: ["users", "filters"], preserveState: true, preserveScroll: true })}
                  rightIcon={<ChevronRight className="h-4 w-4" />}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
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
          message={
            deleteTarget
              ? `Are you sure you want to delete user "${deleteTarget.name}" (${deleteTarget.email})?`
              : "Are you sure you want to delete this user?"
          }
        />
      </div>
    </>
  )
}

UserPage.layout = (page: React.ReactNode) => (
  <AdminLayout>{page}</AdminLayout>
)
