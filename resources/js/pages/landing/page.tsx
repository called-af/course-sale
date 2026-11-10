import { Head } from '@inertiajs/react';

import AboutSection from '@/components/organisms/Landing/AboutSection';
import CategorySection from '@/components/organisms/Landing/CategorySection';
import CourseSection from '@/components/organisms/Landing/CourseSection';
import HeroSection from '@/components/organisms/Landing/HeroSection';
import TestimonialSection from '@/components/organisms/Landing/TestimoniSection';
import WelcomeLayout from '@/components/templates/WelcomeLayout';

import type { Course, TestimonialItem } from '@/types';
import type { Category } from '@/types/category';

interface WelcomeProps {
    courses: Course[];
    categories: Category[];
    testimonials: TestimonialItem[];
}

export default function Welcome({ courses, categories, testimonials }: WelcomeProps) {
    return (
        <>
            <Head title="Welcome to our digital course" />

            <HeroSection />
            <AboutSection />
            <CourseSection courses={courses} />
            <CategorySection categories={categories} />
            <TestimonialSection testimonials={testimonials} />
        </>
    );
}

Welcome.layout = (page: React.ReactNode) => <WelcomeLayout withCta>{page}</WelcomeLayout>;
