import Button from '@/components/atoms/Button';
import Modal from '@/components/atoms/Modal';
import InputField from '@/components/molecules/InputField';
import SelectField from '@/components/molecules/SelectField';
import TextAreaField from '@/components/molecules/TextAreaField';

import type { User } from '@/types/user';

interface UserFormModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: () => void;
    processing: boolean;
    editing: boolean;
    data: {
        name: string;
        email: string;
        password: string;
        role: User['role'];
        bio: string;
    };
    setData: (key: 'name' | 'email' | 'password' | 'role' | 'bio', value: string) => void;
}

export default function UserFormModal({ open, onClose, onSubmit, processing, editing, data, setData }: UserFormModalProps) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            title={editing ? 'Edit User' : 'Add User'}
            footer={
                <>
                    <Button variant="outline" onClick={onClose} disabled={processing}>
                        Cancel
                    </Button>

                    <Button onClick={onSubmit} isLoading={processing}>
                        {editing ? 'Update' : 'Create'}
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                <InputField label="Name" value={data.name} onChange={(e) => setData('name', e.target.value)} />

                <InputField label="Email" value={data.email} onChange={(e) => setData('email', e.target.value)} />

                <InputField label="Password" type="password" value={data.password} onChange={(e) => setData('password', e.target.value)} />

                <TextAreaField
                    label="Bio"
                    rows={3}
                    maxLength={1000}
                    placeholder="Short description about this user..."
                    value={data.bio}
                    onChange={(e) => setData('bio', e.target.value)}
                />

                <SelectField
                    label="Role"
                    value={data.role}
                    onChange={(e) => setData('role', e.target.value)}
                    options={[
                        { label: 'Student', value: 'student' },
                        { label: 'Instructor', value: 'instructor' },
                        { label: 'Admin', value: 'admin' },
                    ]}
                />
            </div>
        </Modal>
    );
}
