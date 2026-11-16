import { Head, Link } from '@inertiajs/react';
import { Award, BookOpen, Calendar, Download, ExternalLink, Shield } from 'lucide-react';
import Button from '@/components/atoms/Button';
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
        <div className="flex flex-col overflow-hidden border border-slate-100 bg-white shadow-xs dark:border-slate-700 dark:bg-[#1e1f24]">
            {/* Thumbnail */}
            <div className="relative aspect-video w-full overflow-hidden bg-slate-100 dark:bg-[#141416]">
                <img src={cert.course.thumbnail_url} alt={cert.course.title} className="h-full w-full object-cover" />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                {/* Badge */}
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-purple-700 px-2.5 py-1 text-[10px] font-semibold text-white">
                    <Award size={11} />
                    Completed
                </div>
            </div>

            {/* Body */}
            <div className="flex flex-1 flex-col space-y-3 p-4">
                <div>
                    <p className="line-clamp-2 leading-snug font-semibold text-slate-800 dark:text-slate-100">{cert.course.title}</p>
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">By {cert.course.instructor}</p>
                </div>

                {/* Certificate meta */}
                <div className="space-y-1.5 border-t border-slate-100 pt-3 dark:border-slate-700">
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <Calendar size={12} className="shrink-0 text-slate-400 dark:text-slate-500" />
                        <span>Issued on {cert.issued_at}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <Shield size={12} className="shrink-0 text-purple-500" />
                        <span className="truncate font-mono text-purple-600 dark:text-purple-400">{cert.certificate_number}</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                    {cert.has_pdf && (
                        <a href={`/student/certificates/${cert.id}/download`} download className="flex-1">
                            <Button variant="outline" size="sm" widthFull leftIcon={<Download size={13} />} className="!rounded-none">
                                Download PDF
                            </Button>
                        </a>
                    )}
                    <a href={`/certificate/${cert.certificate_number}`} target="_blank" rel="noopener noreferrer" className="flex-1">
                        <Button size="sm" widthFull leftIcon={<ExternalLink size={13} />} className="!rounded-none">
                            Verify
                        </Button>
                    </a>
                </div>
            </div>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="border border-slate-100 bg-white p-12 text-center shadow-xs dark:border-slate-700 dark:bg-[#1e1f24]">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center bg-purple-50 dark:bg-purple-950/40">
                <Award size={28} className="text-purple-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">No certificates yet</h3>
            <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">
                Complete all materials in a course to earn your certificate of completion.
            </p>
            <Link href="/student/courses" className="mt-5 inline-block">
                <Button leftIcon={<BookOpen size={15} />} className="!rounded-none">
                    Continue Learning
                </Button>
            </Link>
        </div>
    );
}

MyCertificatesPage.layout = (page: React.ReactNode) => <UserLayout>{page}</UserLayout>;
