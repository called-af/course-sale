import Badge from "@/components/atoms/Badge"
import Button from "@/components/atoms/Button"
import { router } from "@inertiajs/react"
import { route } from "ziggy-js"

function roleVariant(role: string) {
  switch (role) {
    case "admin":
      return "danger"
    case "instructor":
      return "warning"
    default:
      return "info"
  }
}

export default function UserTable({
  users,
  onEdit,
  onDelete,
}: any) {
  return (
    <div className="border border-zinc-400 dark:border-slate-700 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="border-zinc-400 dark:border-slate-700 border-b bg-slate-50 dark:bg-slate-800">
          <tr className="text-left">
            <th className="px-4 py-3 text-slate-700 dark:text-slate-200">User</th>
            <th className="px-4 py-3 text-slate-700 dark:text-slate-200">Email</th>
            <th className="px-4 py-3 text-slate-700 dark:text-slate-200">Role</th>
            <th className="px-4 py-3 w-40 text-slate-700 dark:text-slate-200">Actions</th>
          </tr>
        </thead>

        <tbody>
          {users.map((user: any) => (
            <tr key={user.id} className="border-b border-zinc-400 dark:border-slate-700 last:border-none bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-neutral-100 dark:bg-slate-700 overflow-hidden">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400 dark:text-slate-500">
                        N/A
                      </div>
                    )}
                  </div>

                  <span className="font-medium text-slate-800 dark:text-slate-100">
                    {user.name}
                  </span>
                </div>
              </td>

              <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                {user.email}
              </td>

              <td className="px-4 py-3">
                <Badge variant={roleVariant(user.role)}>
                  {user.role}
                </Badge>
              </td>

              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      router.visit(route("admin.users.show", user.id))
                    }
                  >
                    Edit
                  </Button>

                  <Button
                    variant="danger"
                    onClick={() => onDelete(user)}
                  >
                    Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
