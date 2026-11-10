import Modal from '@/components/atoms/Modal';
import type { Course, PaymentGateway, PaymentMethod } from '@/types';
import CheckoutPanel from './CheckoutPanel';

interface CheckoutModalProps {
    open: boolean;
    onClose: () => void;
    course: Course;
    paymentMethods?: PaymentMethod[];
    gateway?: PaymentGateway | null;
}

export default function CheckoutModal({ open, onClose, course, paymentMethods = [], gateway }: CheckoutModalProps) {
    return (
        <Modal open={open} onClose={onClose} title="Checkout" size="xl">
            <CheckoutPanel course={course} paymentMethods={paymentMethods} gateway={gateway} onSuccess={onClose} />
        </Modal>
    );
}
