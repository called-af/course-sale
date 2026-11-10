import { Tag } from 'lucide-react';
import Button from '@/components/atoms/Button';
import Modal from '@/components/atoms/Modal';
import InputField from '@/components/molecules/InputField';

interface Props {
    open: boolean;
    onClose: () => void;
    onSubmit: () => void;
    processing: boolean;
    errors?: Record<string, string>;
    title: string;
    data: {
        name: string;
    };
    setData: (key: 'name', value: string) => void;
}

export default function TagForm({ open, onClose, onSubmit, processing, errors, title, data, setData }: Props) {
    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!processing && data.name.trim()) {
            onSubmit();
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={title}
            footer={
                <>
                    <Button variant="outline" onClick={onClose} disabled={processing}>
                        Cancel
                    </Button>

                    <Button onClick={handleSubmit} disabled={processing || !data.name.trim()}>
                        {processing ? 'Saving...' : 'Save Tag'}
                    </Button>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center gap-3 rounded-none border border-purple-100/80 bg-purple-50 p-3 text-xs text-purple-900 dark:border-slate-700 dark:bg-purple-950/40 dark:text-purple-300">
                    <Tag className="h-4 w-4 shrink-0 text-purple-600 dark:text-purple-400" />
                    <span>Slug will be generated automatically based on the tag name.</span>
                </div>

                <InputField
                    label="Tag Name"
                    value={data.name}
                    placeholder="e.g. React, Laravel, UI/UX"
                    onChange={(e) => setData('name', e.target.value)}
                    required
                    autoFocus
                />
                {errors?.name && <p className="-mt-2 text-xs font-medium text-red-500">{errors.name}</p>}
            </form>
        </Modal>
    );
}
