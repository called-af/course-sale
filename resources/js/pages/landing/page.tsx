import { Head } from '@inertiajs/react';

import AboutSection from '@/components/organisms/Landing/AboutSection';
import BenefitSection from '@/components/organisms/Landing/BenefitSection';
import CategorySection from '@/components/organisms/Landing/CategorySection';
import CertificateSection from '@/components/organisms/Landing/CertificateSection';
import CourseSection from '@/components/organisms/Landing/CourseSection';
import FaqSection from '@/components/organisms/Landing/FaqSection';
import HeroSection from '@/components/organisms/Landing/HeroSection';
import HowItWorksSection from '@/components/organisms/Landing/HowItWorksSection';
import InstructorSection from '@/components/organisms/Landing/InstructorSection';
import TestimonialSection from '@/components/organisms/Landing/TestimoniSection';
import TrustBar from '@/components/organisms/Landing/TrustBar';
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
            <InstructorSection />
            <HowItWorksSection />
            <BenefitSection />
            <CertificateSection />
            <TestimonialSection testimonials={testimonials} />
            <FaqSection />
            <TrustBar />
        </>
    );
}

Welcome.layout = (page: React.ReactNode) => <WelcomeLayout withCta>{page}</WelcomeLayout>;
