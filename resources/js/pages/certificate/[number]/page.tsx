import { Head, Link } from '@inertiajs/react';
import { Award, Calendar, CheckCircle2, Shield, XCircle } from 'lucide-react';

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
    return (
        <>
            <Head title={valid ? `Certificate — ${certificate?.student_name}` : 'Certificate Not Found'} />

            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex flex-col">
                {/* Minimal header */}
                <header className="px-6 py-5 flex items-center justify-between border-b border-white/5">
                    <Link
                        href="/"
                        className="text-sm font-bold tracking-widest uppercase text-purple-400 hover:text-purple-300 transition-colors"
                    >
                        KursusIO
                    </Link>
                    <span className="text-xs text-slate-500 uppercase tracking-widest">Certificate Verification</span>
                </header>

                {/* Main content */}
                <div className="flex flex-1 items-center justify-center p-6">
                    {valid && certificate ? (
                        <ValidCertificate certificate={certificate} />
                    ) : (
                        <InvalidCertificate />
                    )}
                </div>

                {/* Footer */}
                <footer className="px-6 py-4 text-center border-t border-white/5">
                    <p className="text-xs text-slate-600">
                        © {new Date().getFullYear()} KursusIO · All Rights Reserved
                    </p>
                </footer>
            </div>
        </>
    );
}

function ValidCertificate({ certificate }: { certificate: CertificateData }) {
    return (
        <div className="w-full max-w-xl space-y-6">
            {/* Status banner */}
            <div className="flex items-center gap-3 border border-emerald-500/30 bg-emerald-900/20 px-5 py-3.5">
                <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
                <div>
                    <p className="text-sm font-semibold text-emerald-300">Certificate Verified</p>
                    <p className="text-xs text-emerald-600">This certificate is authentic and issued by KursusIO.</p>
                </div>
            </div>

            {/* Certificate card */}
            <div className="border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
                {/* Header */}
                <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 px-8 py-10 text-center border-b border-white/10">
                    <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-purple-500/10 blur-2xl" />
                    <div className="relative z-10">
                        {/* KursusIO brand */}
                        <p className="text-[10px] font-bold tracking-[4px] uppercase text-purple-400 mb-3">KursusIO</p>
                        <div className="w-10 h-px bg-purple-400/40 mx-auto mb-4" />
                        <p className="text-[10px] font-medium tracking-[2px] uppercase text-slate-500 mb-5">
                            Certificate of Completion
                        </p>

                        {/* Award icon */}
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center border border-purple-500/30 bg-purple-900/30">
                            <Award size={24} className="text-purple-400" />
                        </div>

                        <p className="text-xs text-slate-500 mb-1.5 uppercase tracking-wider">This certifies that</p>
                        <h2 className="text-3xl font-bold text-white mb-1">{certificate.student_name}</h2>
                        <div className="w-40 h-px bg-gradient-to-r from-transparent via-purple-400/60 to-transparent mx-auto mb-4" />
                        <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider">has successfully completed</p>
                        <p className="text-lg font-semibold text-purple-300 leading-snug max-w-sm mx-auto">
                            {certificate.course.title}
                        </p>
                    </div>
                </div>

                {/* Details row */}
                <div className="grid grid-cols-3 divide-x divide-white/10">
                    <div className="px-4 py-4 text-center">
                        <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">Issued On</p>
                        <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-slate-300">
                            <Calendar size={11} className="text-slate-500" />
                            {certificate.issued_at}
                        </div>
                    </div>
                    <div className="px-4 py-4 text-center">
                        <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">Instructor</p>
                        <p className="text-xs font-medium text-slate-300">{certificate.course.instructor}</p>
                    </div>
                    <div className="px-4 py-4 text-center">
                        <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">Certificate No.</p>
                        <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-purple-400 font-mono">
                            <Shield size={10} />
                            <span className="truncate">{certificate.certificate_number}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Back to course */}
            <div className="text-center">
                <Link
                    href={`/course/${certificate.course.slug}`}
                    className="text-xs text-slate-500 hover:text-purple-400 transition-colors"
                >
                    View course ↗
                </Link>
            </div>
        </div>
    );
}

function InvalidCertificate() {
    return (
        <div className="w-full max-w-md text-center space-y-5">
            <div className="flex items-center justify-center gap-3 border border-red-500/30 bg-red-900/20 px-5 py-3.5">
                <XCircle size={20} className="text-red-400 shrink-0" />
                <div className="text-left">
                    <p className="text-sm font-semibold text-red-300">Certificate Not Found</p>
                    <p className="text-xs text-red-600">This certificate number is invalid or does not exist.</p>
                </div>
            </div>
            <div className="border border-white/10 bg-white/5 p-8">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center border border-red-500/30 bg-red-900/20">
                    <Award size={24} className="text-red-500" />
                </div>
                <h2 className="text-lg font-semibold text-white mb-2">Invalid Certificate</h2>
                <p className="text-sm text-slate-400">
                    We could not verify this certificate. It may have been revoked or the certificate number is incorrect.
                </p>
            </div>
            <Link
                href="/"
                className="inline-block text-xs text-purple-400 hover:text-purple-300 transition-colors"
            >
                ← Back to KursusIO
            </Link>
        </div>
    );
}
