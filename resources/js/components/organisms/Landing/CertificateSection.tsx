import { ArrowRight, Award, Check } from 'lucide-react';
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, type Variants } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import type { PointerEvent } from 'react';

import Button from '@/components/atoms/Button';
import CertificateTemplateCard from '@/components/molecules/CertificateTemplateCard';
import LandingSectionHeader from '@/components/molecules/LandingSectionHeader';
import SectionLink from '@/components/molecules/SectionLink';
import { useBranding } from '@/hooks/useBranding';
import { useLanding } from '@/hooks/useLanding';

import type { CertificateTemplateData, LandingCertificate } from '@/types';

interface Props {
    certificates: LandingCertificate[];
    certificateTemplate: CertificateTemplateData;
}

type DisplayCertificate = LandingCertificate & { isSample?: boolean };

const EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];

const cardVariants: Variants = {
    enter: (direction: number) => ({ opacity: 0, x: direction >= 0 ? 36 : -36, scale: 0.985 }),
    center: { opacity: 1, x: 0, scale: 1 },
    exit: (direction: number) => ({ opacity: 0, x: direction >= 0 ? -36 : 36, scale: 0.985 }),
};

function sampleCertificate(name: string, template: CertificateTemplateData): DisplayCertificate {
    return {
        id: -1,
        certificate_number: 'SAMPLE-0000',
        student_name: 'Dimas Aditya',
        course_title: 'Digital Marketing Fundamentals',
        instructor_name: name,
        issued_at: '12 November 2026',
        verify_url: '',
        template,
        isSample: true,
    };
}

export default function CertificateSection({ certificates, certificateTemplate }: Props) {
    const cardRef = useRef<HTMLDivElement>(null);
    const reduceMotion = useReducedMotion();
    const { name } = useBranding();
    const { certificate: copy } = useLanding();

    const [[activeIndex, direction], setPage] = useState<[number, number]>([0, 0]);
    const [paused, setPaused] = useState(false);

    const showcase: DisplayCertificate[] = certificates.length
        ? certificates
        : copy.show_sample_when_empty
          ? [sampleCertificate(name, certificateTemplate)]
          : [];
    const count = showcase.length;
    const canRotate = copy.rotate && count > 1;

    const tiltXTarget = useMotionValue(0);
    const tiltYTarget = useMotionValue(0);
    const tiltX = useSpring(tiltXTarget, { stiffness: 180, damping: 22 });
    const tiltY = useSpring(tiltYTarget, { stiffness: 180, damping: 22 });

    const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
        if (reduceMotion) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width - 0.5;
        const py = (event.clientY - rect.top) / rect.height - 0.5;
        tiltYTarget.set(px * 10);
        tiltXTarget.set(-py * 8);
    };

    const resetTilt = () => {
        tiltXTarget.set(0);
        tiltYTarget.set(0);
        setPaused(false);
    };

    useEffect(() => {
        if (count > 0 && activeIndex >= count) {
            setPage([0, 0]);
        }
    }, [activeIndex, count]);

    useEffect(() => {
        if (reduceMotion || paused || !canRotate) {
            return;
        }

        const timer = window.setInterval(
            () => {
                setPage(([index]) => [(index + 1) % count, 1]);
            },
            Math.max(2, copy.rotate_seconds) * 1000,
        );

        return () => window.clearInterval(timer);
    }, [reduceMotion, paused, canRotate, count, copy.rotate_seconds]);

    const certificate = showcase[activeIndex] ?? showcase[0];

    return (
        <section id="certificate" className="relative overflow-hidden bg-[#141416] py-24 text-white dark:bg-[#0F0F11]">
            <div aria-hidden className="pointer-events-none absolute top-1/3 -left-24 h-80 w-80 rounded-full bg-purple-500/10 blur-3xl" />

            <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-8 lg:grid-cols-2 lg:gap-20">
                <motion.div
                    initial={reduceMotion ? false : { opacity: 0, x: -32 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.7, ease: EASE }}
                    className="flex flex-col gap-7"
                >
                    <LandingSectionHeader
                        badge={copy.badge}
                        titleLead={copy.title_lead}
                        titleHighlight={copy.title_highlight}
                        titleClassName="text-white"
                        description={copy.description}
                        descriptionClassName="text-white/45"
                    />

                    <ul className="flex flex-col gap-3">
                        {copy.points.map((point, index) => (
                            <motion.li
                                key={`${point}-${index}`}
                                initial={reduceMotion ? false : { opacity: 0, x: -16 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true, amount: 0.8 }}
                                transition={{ duration: 0.45, delay: 0.15 + index * 0.1, ease: EASE }}
                                className="flex items-center gap-3 text-[13px] text-white/55"
                            >
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-purple-400/20 bg-purple-400/10">
                                    <Check size={11} className="text-purple-300" />
                                </span>
                                {point}
                            </motion.li>
                        ))}
                    </ul>

                    <div className="pt-2">
                        <SectionLink href={copy.cta_href}>
                            <Button rightIcon={<ArrowRight size={16} />} className="px-8 py-3 text-base">
                                {copy.cta_label}
                            </Button>
                        </SectionLink>
                    </div>
                </motion.div>

                <motion.div
                    initial={reduceMotion ? false : { opacity: 0, y: 32, rotate: 1.5 }}
                    whileInView={{ opacity: 1, y: 0, rotate: -1.5 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
                    className="relative mx-auto w-full max-w-md"
                >
                    <div
                        aria-hidden
                        className="pointer-events-none absolute -inset-8 -z-10 rounded-[2rem] bg-[radial-gradient(60%_60%_at_50%_50%,color-mix(in_srgb,var(--color-purple-500)_28%,transparent),transparent_75%)] blur-3xl"
                    />

                    <motion.div
                        ref={cardRef}
                        onPointerMove={handlePointerMove}
                        onPointerEnter={() => setPaused(true)}
                        onPointerLeave={resetTilt}
                        style={{ rotateX: tiltX, rotateY: tiltY, transformPerspective: 1000 }}
                        className="relative"
                    >
                        {certificate ? (
                            <AnimatePresence mode="wait" initial={false} custom={direction}>
                                <motion.div
                                    key={certificate.id}
                                    custom={direction}
                                    variants={cardVariants}
                                    initial={reduceMotion ? false : 'enter'}
                                    animate="center"
                                    exit={reduceMotion ? undefined : 'exit'}
                                    transition={{ type: 'spring', visualDuration: 0.5, bounce: 0.08 }}
                                >
                                    <div className="relative">
                                        <CertificateTemplateCard
                                            className="shadow-[0_28px_80px_-28px_rgba(124,58,237,0.65)]"
                                            template={certificate.template ?? certificateTemplate}
                                            values={{
                                                studentName: certificate.student_name,
                                                courseTitle: certificate.course_title,
                                                certificateNumber: certificate.certificate_number,
                                                issuedAt: certificate.issued_at,
                                                instructorName: certificate.instructor_name,
                                                brandName: name,
                                                signatureName: certificate.instructor_name,
                                                verifyUrl: certificate.isSample ? undefined : certificate.verify_url,
                                            }}
                                        />

                                        {certificate.isSample && (
                                            <>
                                                <span className="absolute top-4 right-4 z-20 flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 text-[9px] font-semibold tracking-[0.12em] text-white uppercase backdrop-blur-sm">
                                                    <Award size={11} />
                                                    Sample preview
                                                </span>
                                                <span className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 text-center text-[8px] font-medium tracking-[0.12em] text-white/70 uppercase drop-shadow">
                                                    Illustrative preview · no real certificate issued
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        ) : (
                            <div className="border border-dashed border-white/20 bg-white/5 p-10 text-center text-sm text-white/50">
                                No certificates have been issued yet.
                            </div>
                        )}

                        {canRotate && (
                            <div className="mt-5 flex items-center justify-center gap-2">
                                {showcase.map((item, index) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => setPage([index, index >= activeIndex ? 1 : -1])}
                                        aria-label={`Show certificate ${index + 1}`}
                                        aria-current={index === activeIndex}
                                        className={`h-1.5 rounded-full transition-colors duration-300 ${
                                            index === activeIndex ? 'w-6 bg-purple-400' : 'w-1.5 bg-white/25 hover:bg-white/60'
                                        }`}
                                    />
                                ))}
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}
