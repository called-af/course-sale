import { Download, ExternalLink } from 'lucide-react';
import type { CertificateItem } from '@/types/dashboard';

interface CertificateCardProps {
    certificate: CertificateItem;
}

export default function CertificateCard({ certificate }: CertificateCardProps) {
    return (
        <div className="group flex flex-col gap-2 border border-slate-100 bg-slate-50/60 p-3.5 transition hover:border-purple-200 hover:bg-purple-50/20 dark:border-slate-700 dark:bg-slate-900/50 dark:hover:border-purple-900/60">
            <div className="flex items-start gap-3">
                <div className="h-10 w-14 shrink-0 overflow-hidden bg-slate-200 dark:bg-slate-800">
                    <img
                        src={certificate.course.thumbnail_url ?? '/assets/landscape.jpeg'}
                        alt={certificate.course.title}
                        className="h-full w-full object-cover"
                    />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-xs font-bold text-slate-800 group-hover:text-purple-700 dark:text-slate-100 dark:group-hover:text-purple-400">
                        {certificate.course.title}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">Issued: {certificate.issued_at}</p>
                </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200/60 pt-2 text-[11px] dark:border-slate-700">
                <span className="max-w-[150px] truncate font-mono text-purple-700 dark:text-purple-400">{certificate.certificate_number}</span>
                <div className="flex items-center gap-2">
                    <a
                        href={`/certificate/${certificate.certificate_number}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-medium text-slate-600 hover:text-purple-700 dark:text-slate-400 dark:hover:text-purple-300"
                        title="Verify Certificate"
                    >
                        <ExternalLink size={11} />
                        Verify
                    </a>
                    <a
                        href={`/student/certificates/${certificate.id}/download`}
                        className="inline-flex items-center gap-1 font-semibold text-purple-700 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
                        title="Download PDF"
                    >
                        <Download size={11} />
                        Download
                    </a>
                </div>
            </div>
        </div>
    );
}
