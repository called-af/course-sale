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
import { useLanding } from '@/hooks/useLanding';
import { useSeo } from '@/hooks/useSeo';

import type { LandingPageProps } from '@/types';

export default function Welcome({ courses, categories, testimonials, instructors, certificates, certificateTemplate }: LandingPageProps) {
    const seo = useSeo();
    const landing = useLanding();

    return (
        <>
            <Head title={seo.title || 'Welcome to our digital course'} />

            {landing.hero.show && <HeroSection />}
            {landing.about.show && <AboutSection />}
            {landing.courses.show && <CourseSection courses={courses} />}
            {landing.career.show && <CategorySection categories={categories} />}
            {landing.instructor.show && <InstructorSection instructors={instructors} />}
            {landing.how_it_works.show && <HowItWorksSection />}
            {landing.benefit.show && <BenefitSection />}
            {landing.certificate.show && <CertificateSection certificates={certificates} certificateTemplate={certificateTemplate} />}
            {landing.testimonial.show && <TestimonialSection testimonials={testimonials} />}
            {landing.faq.show && <FaqSection />}
            {landing.trust.show && <TrustBar />}
        </>
    );
}

Welcome.layout = (page: React.ReactNode) => <WelcomeLayout withCta>{page}</WelcomeLayout>;
