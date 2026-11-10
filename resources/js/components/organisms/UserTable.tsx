import { usePage } from '@inertiajs/react';
import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';
import type { SharedPageProps } from '@/types/shared';
import type { User } from '@/types/user';

function roleVariant(role: string) {
    switch (role) {
        case 'admin':
            return 'danger';
        case 'instructor':
            return 'warning';
        default:
            return 'info';
    }
}

interface UserTableProps {
    users: User[];
    onEdit?: (user: User) => void;
    onDelete: (user: User) => void;
}

export default function UserTable({ users, onEdit, onDelete }: UserTableProps) {
    const { auth } = usePage<SharedPageProps>().props;

    return (
        <div className="overflow-hidden border border-zinc-400 dark:border-slate-700">
            <table className="w-full text-sm">
                <thead className="border-b border-zinc-400 bg-slate-50 dark:border-slate-700 dark:bg-[#1e1f24]">
                    <tr className="text-left">
                        <th className="px-4 py-3 text-slate-700 dark:text-slate-200">User</th>
                        <th className="px-4 py-3 text-slate-700 dark:text-slate-200">Email</th>
                        <th className="px-4 py-3 text-slate-700 dark:text-slate-200">Role</th>
                        <th className="w-40 px-4 py-3 text-slate-700 dark:text-slate-200">Actions</th>
                    </tr>
                </thead>

                <tbody>
                    {users.map((user) => (
                        <tr
                            key={user.id}
                            className="border-b border-zinc-400 bg-white transition-colors last:border-none hover:bg-slate-50 dark:border-slate-700 dark:bg-[#1e1f24] dark:hover:bg-slate-800"
                        >
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 overflow-hidden rounded-lg bg-neutral-100 dark:bg-slate-700">
                                        {user.avatar_url ? (
                                            <img src={user.avatar_url} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-xs text-neutral-400 dark:text-slate-500">
                                                N/A
                                            </div>
                                        )}
                                    </div>

                                    <span className="font-medium text-slate-800 dark:text-slate-100">{user.name}</span>
                                </div>
                            </td>

                            <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{user.email}</td>

                            <td className="px-4 py-3">
                                <Badge variant={roleVariant(user.role)}>{user.role}</Badge>
                            </td>

                            <td className="px-4 py-3">
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => onEdit?.(user)}>
                                        Edit
                                    </Button>

                                    <Button
                                        variant="danger"
                                        disabled={user.id === auth?.user?.id}
                                        title={user.id === auth?.user?.id ? 'You cannot delete your own account' : undefined}
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
    );
}
