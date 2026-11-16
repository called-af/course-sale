import { Head, Link } from '@inertiajs/react';
import { Award, Calendar, CheckCircle2, Shield, XCircle } from 'lucide-react';
import { useBranding } from '@/hooks/useBranding';

interface CertificateData {
    id: number;
    certificate_number: string;
    issued_at: string;
    student_name: string;
    course: {
        title: string;
        slug: string;
        thumbnail_url: string;
        instructor: string;
    };
}

interface Props {
    certificate: CertificateData | null;
    valid: boolean;
}

export default function CertificateVerifyPage({ certificate, valid }: Props) {
    const { name } = useBranding();

    return (
        <>
            <Head title={valid ? `Certificate — ${certificate?.student_name}` : 'Certificate Not Found'} />

            <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
                {/* Minimal header */}
                <header className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 px-4 py-5 sm:px-6">
                    <Link href="/" className="text-sm font-bold tracking-widest text-purple-400 uppercase transition-colors hover:text-purple-300">
                        {name}
                    </Link>
                    <span className="text-xs tracking-widest text-slate-500 uppercase">Certificate Verification</span>
                </header>

                {/* Main content */}
                <div className="flex flex-1 items-center justify-center p-6">
                    {valid && certificate ? <ValidCertificate certificate={certificate} /> : <InvalidCertificate />}
                </div>

                {/* Footer */}
                <footer className="border-t border-white/5 px-6 py-4 text-center">
                    <p className="text-xs text-slate-600">
                        © {new Date().getFullYear()} {name} · All Rights Reserved
                    </p>
                </footer>
            </div>
        </>
    );
}

function ValidCertificate({ certificate }: { certificate: CertificateData }) {
    const { name } = useBranding();

    return (
        <div className="w-full max-w-xl space-y-6">
            {/* Status banner */}
            <div className="flex items-center gap-3 border border-emerald-500/30 bg-emerald-900/20 px-5 py-3.5">
                <CheckCircle2 size={20} className="shrink-0 text-emerald-400" />
                <div>
                    <p className="text-sm font-semibold text-emerald-300">Certificate Verified</p>
                    <p className="text-xs text-emerald-600">This certificate is authentic and issued by {name}.</p>
                </div>
            </div>

            {/* Certificate card */}
            <div className="overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm">
                {/* Header */}
                <div className="relative overflow-hidden border-b border-white/10 bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 px-8 py-10 text-center">
                    <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-purple-500/10 blur-2xl" />
                    <div className="relative z-10">
                        {/* Brand */}
                        <p className="mb-3 text-[10px] font-bold tracking-[4px] text-purple-400 uppercase">{name}</p>
                        <div className="mx-auto mb-4 h-px w-10 bg-purple-400/40" />
                        <p className="mb-5 text-[10px] font-medium tracking-[2px] text-slate-500 uppercase">Certificate of Completion</p>

                        {/* Award icon */}
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center border border-purple-500/30 bg-purple-900/30">
                            <Award size={24} className="text-purple-400" />
                        </div>

                        <p className="mb-1.5 text-xs tracking-wider text-slate-500 uppercase">This certifies that</p>
                        <h2 className="mb-1 text-3xl font-bold text-white">{certificate.student_name}</h2>
                        <div className="mx-auto mb-4 h-px w-40 bg-gradient-to-r from-transparent via-purple-400/60 to-transparent" />
                        <p className="mb-2 text-xs tracking-wider text-slate-500 uppercase">has successfully completed</p>
                        <p className="mx-auto max-w-sm text-lg leading-snug font-semibold text-purple-300">{certificate.course.title}</p>
                    </div>
                </div>

                {/* Details row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
                    <div className="px-4 py-4 text-center">
                        <p className="mb-1 text-[9px] tracking-widest text-slate-500 uppercase">Issued On</p>
                        <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-slate-300">
                            <Calendar size={11} className="text-slate-500" />
                            {certificate.issued_at}
                        </div>
                    </div>
                    <div className="px-4 py-4 text-center">
                        <p className="mb-1 text-[9px] tracking-widest text-slate-500 uppercase">Instructor</p>
                        <p className="text-xs font-medium text-slate-300">{certificate.course.instructor}</p>
                    </div>
                    <div className="px-4 py-4 text-center">
                        <p className="mb-1 text-[9px] tracking-widest text-slate-500 uppercase">Certificate No.</p>
                        <div className="flex items-center justify-center gap-1 font-mono text-[10px] font-bold text-purple-400">
                            <Shield size={10} />
                            <span className="truncate">{certificate.certificate_number}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Back to course */}
            <div className="text-center">
                <Link href={`/course/${certificate.course.slug}`} className="text-xs text-slate-500 transition-colors hover:text-purple-400">
                    View course ↗
                </Link>
            </div>
        </div>
    );
}

function InvalidCertificate() {
    const { name } = useBranding();

    return (
        <div className="w-full max-w-md space-y-5 text-center">
            <div className="flex items-center justify-center gap-3 border border-red-500/30 bg-red-900/20 px-5 py-3.5">
                <XCircle size={20} className="shrink-0 text-red-400" />
                <div className="text-left">
                    <p className="text-sm font-semibold text-red-300">Certificate Not Found</p>
                    <p className="text-xs text-red-600">This certificate number is invalid or does not exist.</p>
                </div>
            </div>
            <div className="border border-white/10 bg-white/5 p-8">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center border border-red-500/30 bg-red-900/20">
                    <Award size={24} className="text-red-500" />
                </div>
                <h2 className="mb-2 text-lg font-semibold text-white">Invalid Certificate</h2>
                <p className="text-sm text-slate-400">
                    We could not verify this certificate. It may have been revoked or the certificate number is incorrect.
                </p>
            </div>
            <Link href="/" className="inline-block text-xs text-purple-400 transition-colors hover:text-purple-300">
                ← Back to {name}
            </Link>
        </div>
    );
}
