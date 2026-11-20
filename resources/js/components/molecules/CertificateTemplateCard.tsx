import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';

import {
    BOLD_ELEMENTS,
    CANVAS_H,
    CANVAS_RATIO,
    CANVAS_W,
    META_ELEMENTS,
    clamp,
    isCustomElementKey,
    normalizeTemplate,
    resolveElementText,
} from '@/components/organisms/admin/certificate-designer-utils';
import type { CertificateTemplate, ElementKey, PreviewValues } from '@/components/organisms/admin/certificate-designer-utils';
import type { CertificateTemplateData } from '@/types/course';

const SANS = '"DejaVu Sans", "Instrument Sans", ui-sans-serif, system-ui, sans-serif';
const SERIF = '"DejaVu Serif", Georgia, serif';

export interface CertificateTemplatePreviewValues {
    studentName: string;
    courseTitle: string;
    certificateNumber: string;
    issuedAt: string;
    instructorName: string;
    brandName: string;
    signatureName?: string;
    verifyUrl?: string;
}

interface Props {
    template: CertificateTemplateData | null | undefined;
    values: CertificateTemplatePreviewValues;
    className?: string;
}

/** The PDF derives signature size from the image ratio; mirror that on the landing card. */
function useImageRatio(src: string | null): number {
    const [ratio, setRatio] = useState(3);

    useEffect(() => {
        setRatio(3);
        if (!src || typeof window === 'undefined') return;

        const image = new window.Image();
        image.onload = () => {
            const next = image.naturalWidth / image.naturalHeight;
            if (Number.isFinite(next) && next > 0) setRatio(next);
        };
        image.onerror = () => setRatio(3);
        image.src = src;

        return () => {
            image.onload = null;
            image.onerror = null;
        };
    }, [src]);

    return ratio;
}

function withAlpha(hex: string, alpha: number): string {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);

    if ([r, g, b].some((value) => Number.isNaN(value))) return `rgba(124, 58, 237, ${alpha})`;

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function builtInColor(key: ElementKey, template: CertificateTemplate): string {
    if (template.bg_style === 'light') {
        switch (key) {
            case 'student_name':
                return '#111827';
            case 'title':
            case 'course_title':
            case 'certificate_number':
                return template.primary_color;
            case 'signature_name':
                return '#334155';
            case 'issued_at':
            case 'instructor_name':
                return '#475569';
            default:
                return '#64748b';
        }
    }

    switch (key) {
        case 'student_name':
            return '#f8fafc';
        case 'title':
        case 'course_title':
        case 'certificate_number':
            return template.accent_color;
        case 'issued_at':
        case 'instructor_name':
        case 'signature_name':
            return '#cbd5e1';
        default:
            return '#94a3b8';
    }
}

function VerifyLink({ href, light }: { href: string; light: boolean }) {
    const label = href.replace(/^https?:\/\//, '').replace(/\/$/, '');

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute truncate transition-opacity hover:underline"
            style={{
                left: light ? 50 : 50,
                bottom: light ? 38 : 16,
                maxWidth: 420,
                zIndex: 7,
                fontFamily: SANS,
                fontSize: 7,
                letterSpacing: '0.5px',
                color: light ? '#94a3b8' : '#334155',
            }}
            title={`Verify certificate · ${href}`}
        >
            Verify at: {label}
        </a>
    );
}

function DefaultDecorations({ template, brandName, verifyUrl }: { template: CertificateTemplate; brandName: string; verifyUrl?: string }) {
    const isLight = template.bg_style === 'light';
    const isGradient = template.bg_style === 'gradient';
    const base = isLight ? '#fbfaff' : isGradient ? '#160e2e' : '#0d0b16';
    const primary = template.primary_color;
    const accent = template.accent_color;
    const sealName = brandName.toUpperCase();
    const sealHalf = Math.ceil(sealName.length / 2);

    return (
        <>
            <div className="absolute inset-0" style={{ background: base }} />

            {isGradient && (
                <div
                    className="absolute inset-0"
                    style={{ background: `linear-gradient(135deg, ${base} 0%, ${withAlpha(primary, 0.4)} 50%, ${base} 100%)` }}
                />
            )}

            <div
                className="absolute rounded-full"
                style={{
                    left: 612,
                    top: -250,
                    width: 380,
                    height: 380,
                    background: withAlpha(primary, isLight ? 0.06 : 0.16),
                }}
            />
            <div
                className="absolute rounded-full"
                style={{
                    left: -150,
                    top: 485,
                    width: 340,
                    height: 340,
                    background: withAlpha(primary, isLight ? 0.04 : 0.1),
                }}
            />
            <div
                className="absolute rounded-full"
                style={{
                    left: 662,
                    top: 485,
                    width: 140,
                    height: 140,
                    border: `1px solid ${withAlpha(accent, isLight ? 0.18 : 0.14)}`,
                }}
            />

            <div className="absolute" style={{ inset: 16, border: `1px solid ${withAlpha(accent, isLight ? 0.4 : 0.32)}` }} />
            <div className="absolute" style={{ inset: 22, border: `1px solid ${withAlpha(accent, isLight ? 0.18 : 0.14)}` }} />

            <div
                className="absolute"
                style={{
                    left: 10,
                    top: 10,
                    width: 26,
                    height: 26,
                    borderTop: `2px solid ${primary}`,
                    borderLeft: `2px solid ${primary}`,
                    opacity: 0.7,
                }}
            />
            <div
                className="absolute"
                style={{
                    right: 10,
                    top: 10,
                    width: 26,
                    height: 26,
                    borderTop: `2px solid ${primary}`,
                    borderRight: `2px solid ${primary}`,
                    opacity: 0.7,
                }}
            />
            <div
                className="absolute"
                style={{
                    left: 10,
                    bottom: 10,
                    width: 26,
                    height: 26,
                    borderBottom: `2px solid ${primary}`,
                    borderLeft: `2px solid ${primary}`,
                    opacity: 0.7,
                }}
            />
            <div
                className="absolute"
                style={{
                    right: 10,
                    bottom: 10,
                    width: 26,
                    height: 26,
                    borderBottom: `2px solid ${primary}`,
                    borderRight: `2px solid ${primary}`,
                    opacity: 0.7,
                }}
            />

            <div
                className="absolute text-center font-bold uppercase"
                style={{
                    left: 0,
                    top: 30,
                    width: CANVAS_W,
                    fontFamily: SANS,
                    fontSize: 10,
                    letterSpacing: '4px',
                    color: accent,
                    opacity: isLight ? 0.9 : 0.85,
                }}
            >
                {brandName}
            </div>
            <div
                className="absolute"
                style={{
                    left: CANVAS_W / 2 - 24,
                    top: 50,
                    width: 48,
                    height: 1,
                    background: accent,
                    opacity: 0.5,
                }}
            />

            <div
                className="absolute rounded-full text-center"
                style={{
                    right: 50,
                    bottom: 38,
                    width: 72,
                    height: 72,
                    border: `2px solid ${withAlpha(primary, 0.5)}`,
                }}
            >
                <div className="absolute rounded-full" style={{ inset: 7, border: `1px solid ${withAlpha(primary, 0.3)}` }} />
                <div
                    className="absolute font-bold uppercase"
                    style={{
                        left: 0,
                        right: 0,
                        top: 18,
                        fontFamily: SANS,
                        fontSize: 6,
                        lineHeight: 1.4,
                        letterSpacing: '1.5px',
                        color: primary,
                    }}
                >
                    {sealName.slice(0, sealHalf)}
                    <br />
                    {sealName.slice(sealHalf)}
                    <br />
                    Verified
                </div>
            </div>

            {verifyUrl && <VerifyLink href={verifyUrl} light={isLight} />}
        </>
    );
}

/**
 * Renders the same normalized template payload used by the certificate designer
 * and PDF generator. The canvas keeps the designer's 842x595 coordinate space
 * and is scaled with the card width so every landing preview matches the real thing.
 */
export default function CertificateTemplateCard({ template, values, className = '' }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    const normalized = useMemo(() => normalizeTemplate(Array.isArray(template) ? null : template), [template]);
    const signatureRatio = useImageRatio(normalized.signature_image_url);

    const { studentName, courseTitle, certificateNumber, issuedAt, instructorName, brandName, signatureName, verifyUrl } = values;

    const previewValues = useMemo<PreviewValues>(
        () => ({
            student_name: studentName,
            course_title: courseTitle,
            certificate_number: certificateNumber,
            issued_at: issuedAt,
            instructor_name: instructorName,
            brand_name: brandName,
            signature_name: signatureName || instructorName,
        }),
        [studentName, courseTitle, certificateNumber, issuedAt, instructorName, brandName, signatureName],
    );

    useLayoutEffect(() => {
        const node = containerRef.current;
        if (!node) return;

        const update = () => {
            const next = node.clientWidth / CANVAS_W;
            setScale(Number.isFinite(next) && next > 0 ? next : 1);
        };

        update();
        const observer = new ResizeObserver(update);
        observer.observe(node);

        return () => observer.disconnect();
    }, []);

    const customBackground = normalized.mode === 'custom' && Boolean(normalized.background_url);
    const elements = Object.entries(normalized.elements) as [ElementKey, (typeof normalized.elements)[ElementKey]][];

    return (
        <div ref={containerRef} className={`relative w-full overflow-hidden ${className}`} style={{ aspectRatio: CANVAS_RATIO }}>
            <div className="absolute top-0 left-0 origin-top-left" style={{ width: CANVAS_W, height: CANVAS_H, transform: `scale(${scale})` }}>
                {customBackground ? (
                    <>
                        <img
                            src={normalized.background_url ?? undefined}
                            alt=""
                            draggable={false}
                            className="absolute inset-0"
                            style={{ width: CANVAS_W, height: CANVAS_H, objectFit: 'fill' }}
                        />
                        {verifyUrl && <VerifyLink href={verifyUrl} light={false} />}
                    </>
                ) : (
                    <DefaultDecorations template={normalized} brandName={brandName} verifyUrl={verifyUrl} />
                )}

                <div className="absolute inset-0" style={{ zIndex: 5 }}>
                    {elements.map(([key, element]) => {
                        const text = resolveElementText(key, element, normalized, previewValues);
                        if (!element.visible || !text) return null;

                        const isCustom = isCustomElementKey(key);
                        const color = isCustom || customBackground ? element.color : builtInColor(key, normalized);
                        const bold = BOLD_ELEMENTS.includes(key);
                        const isMeta = META_ELEMENTS.includes(key);
                        const translateX = element.align === 'left' ? '0' : element.align === 'right' ? '-100%' : '-50%';
                        const position: CSSProperties = {
                            position: 'absolute',
                            left: `${element.x}%`,
                            top: `${element.y}%`,
                            transform: `translate(${translateX}, -50%)`,
                            textAlign: element.align,
                            color,
                            lineHeight: 1.2,
                            whiteSpace: 'pre-wrap',
                            pointerEvents: 'none',
                            fontFamily: isCustom || customBackground || isMeta ? SANS : SERIF,
                        };

                        if (key === 'signature_name' && normalized.signature_image_url) {
                            const requestedHeight = clamp(element.fontSize * 4, 28, 120);
                            const width = Math.min(320, requestedHeight * signatureRatio);
                            const imageHeight = width / signatureRatio;
                            const justify = element.align === 'left' ? 'flex-start' : element.align === 'right' ? 'flex-end' : 'center';

                            return (
                                <div key={key} style={{ ...position, width: '72%' }}>
                                    <div style={{ display: 'flex', justifyContent: justify }}>
                                        <div style={{ width }}>
                                            <img
                                                src={normalized.signature_image_url}
                                                alt="Instructor signature"
                                                draggable={false}
                                                style={{
                                                    display: 'block',
                                                    width,
                                                    height: imageHeight,
                                                    objectFit: 'contain',
                                                    margin: element.align === 'center' ? '0 auto' : element.align === 'right' ? '0 0 0 auto' : '0',
                                                }}
                                            />
                                            <div
                                                style={{
                                                    marginTop: 1,
                                                    fontFamily: SANS,
                                                    fontSize: Math.max(8, element.fontSize * 0.8),
                                                    textAlign: element.align,
                                                }}
                                            >
                                                {text}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <div key={key} style={{ ...position, width: 'max-content', maxWidth: '72%' }}>
                                {isMeta && element.prefix && (
                                    <div
                                        style={{
                                            marginBottom: 3,
                                            fontFamily: SANS,
                                            fontSize: Math.max(6, element.fontSize * 0.72),
                                            letterSpacing: '1.6px',
                                            textTransform: 'uppercase',
                                            opacity: 0.72,
                                        }}
                                    >
                                        {element.prefix}
                                    </div>
                                )}
                                <div style={{ fontSize: element.fontSize, fontWeight: bold ? 700 : 400 }}>{text}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
