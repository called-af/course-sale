import Button from '@/components/atoms/Button';
import InputField from '@/components/molecules/InputField';
import { useCourse } from '@/hooks/useCourse';

export default function CourseAdd({ onSuccess }: { onSuccess?: () => void }) {
    const { data, setData, save, processing, errors } = useCourse();

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                save();
                onSuccess?.();
            }}
            className="space-y-4"
        >
            <InputField label="Title" name="title" value={data.title} onChange={(e) => setData('title', e.target.value)} />

            {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}

            <Button type="submit" disabled={processing}>
                Save Course
            </Button>
        </form>
    );
}
