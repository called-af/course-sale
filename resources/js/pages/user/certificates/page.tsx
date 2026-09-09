import { Head, Link } from '@inertiajs/react';
import { Award, BookOpen, Calendar, Download, ExternalLink, Shield } from 'lucide-react';
import UserLayout from '@/components/templates/UserLayout';

interface CertificateCourse {
    id: number;
    title: string;
    slug: string;
    thumbnail_url: string;
    instructor: string;
}

interface CertificateItem {
    id: number;
    certificate_number: string;
    issued_at: string;
    has_pdf: boolean;
    course: CertificateCourse;
}

interface Props {
    certificates: CertificateItem[];
}

export default function MyCertificatesPage({ certificates }: Props) {
    return (
        <>
            <Head title="My Certificates" />

            <div className="space-y-8">
                {/* Page header */}
                <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 p-6 text-white shadow-xl sm:p-8">
                    <div className="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />
                    <div className="relative z-10">
                        <p className="mb-1 text-sm font-medium text-purple-300">Your Achievements</p>
                        <h1 className="text-2xl font-bold sm:text-3xl">My Certificates</h1>
                        <p className="mt-1 text-sm text-slate-400">
                            {certificates.length > 0
                                ? `You have earned ${certificates.length} certificate${certificates.length > 1 ? 's' : ''}.`
                                : 'Complete a course to earn your first certificate.'}
                        </p>
                    </div>
                </div>

                {/* Content */}
                {certificates.length === 0 ? (
                    <EmptyState />
                ) : (
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {certificates.map((cert) => (
                            <CertificateCard key={cert.id} cert={cert} />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

function CertificateCard({ cert }: { cert: CertificateItem }) {
    return (
        <div className="flex flex-col border border-slate-100 bg-white shadow-xs overflow-hidden">
            {/* Thumbnail */}
            <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                <img
                    src={cert.course.thumbnail_url}
                    alt={cert.course.title}
                    className="h-full w-full object-cover"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                {/* Badge */}
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-purple-700 px-2.5 py-1 text-[10px] font-semibold text-white">
                    <Award size={11} />
                    Completed
                </div>
            </div>

            {/* Body */}
            <div className="flex flex-1 flex-col p-4 space-y-3">
                <div>
                    <p className="font-semibold text-slate-800 line-clamp-2 leading-snug">
                        {cert.course.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">By {cert.course.instructor}</p>
                </div>

                {/* Certificate meta */}
                <div className="space-y-1.5 border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Calendar size={12} className="text-slate-400 shrink-0" />
                        <span>Issued on {cert.issued_at}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Shield size={12} className="text-purple-500 shrink-0" />
                        <span className="font-mono text-purple-600 truncate">{cert.certificate_number}</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                    {cert.has_pdf && (
                        <a
                            href={`/student/certificates/${cert.id}/download`}
                            className="flex flex-1 items-center justify-center gap-1.5 border border-slate-200 bg-white py-2 text-xs font-medium text-slate-700 hover:border-purple-300 hover:text-purple-700 transition-colors"
                            download
                        >
                            <Download size={13} />
                            Download PDF
                        </a>
                    )}
                    <a
                        href={`/certificate/${cert.certificate_number}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-1 items-center justify-center gap-1.5 border border-purple-200 bg-purple-50 py-2 text-xs font-medium text-purple-700 hover:bg-purple-100 transition-colors"
                    >
                        <ExternalLink size={13} />
                        Verify
                    </a>
                </div>
            </div>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="border border-slate-100 bg-white p-12 text-center shadow-xs">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center bg-purple-50">
                <Award size={28} className="text-purple-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-700">No certificates yet</h3>
            <p className="mt-2 text-sm text-slate-400">
                Complete all materials in a course to earn your certificate of completion.
            </p>
            <Link
                href="/student/courses"
                className="mt-5 inline-flex items-center gap-2 bg-purple-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-purple-800 transition-colors"
            >
                <BookOpen size={15} />
                Continue Learning
            </Link>
        </div>
    );
}

MyCertificatesPage.layout = (page: React.ReactNode) => <UserLayout>{page}</UserLayout>;
