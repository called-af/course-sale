<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>{{ $customTitle }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: "DejaVu Serif", Georgia, serif;
            width: 842px;
            height: 595px;
            overflow: hidden;
            position: relative;
        }

        .page {
            width: 842px;
            height: 595px;
            position: relative;
            overflow: hidden;
        }

        /* ── BACKGROUND STYLES ─────────────────────────────── */
        @php
            $primary = $primaryColor;
            $accent  = $accentColor;

            // Parse hex → r,g,b for rgba usage
            $hexToRgb = function(string $hex): string {
                $hex = ltrim($hex, '#');
                if (strlen($hex) === 3) {
                    $hex = $hex[0].$hex[0].$hex[1].$hex[1].$hex[2].$hex[2];
                }
                $r = hexdec(substr($hex, 0, 2));
                $g = hexdec(substr($hex, 2, 2));
                $b = hexdec(substr($hex, 4, 2));
                return "$r,$g,$b";
            };

            $primaryRgb = $hexToRgb($primary);
            $accentRgb  = $hexToRgb($accent);
        @endphp

        @if ($bgStyle === 'light')
        .bg-gradient {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: #f8f7ff;
        }
        body { color: #1e1b4b; }
        .brand         { color: {{ $primary }}; }
        .divider       { background: rgba({{ $primaryRgb }}, 0.4); }
        .title         { color: #64748b; }
        .this-certifies, .completion-text { color: #94a3b8; }
        .student-name  { color: #1e1b4b; }
        .name-underline { background: linear-gradient(90deg, transparent, rgba({{ $primaryRgb }}, 0.5), transparent); }
        .course-title  { color: {{ $primary }}; }
        .footer-label  { color: #94a3b8; }
        .footer-value  { color: #475569; }
        .footer-value.cert-number { color: {{ $primary }}; }
        .outer-border  { border-color: rgba({{ $primaryRgb }}, 0.3); }
        .inner-border  { border-color: rgba({{ $primaryRgb }}, 0.12); }
        .corner        { border-color: {{ $primary }}; }
        .verify-url    { color: #94a3b8; }
        .seal          { border-color: rgba({{ $primaryRgb }}, 0.4); }
        .seal-inner    { border-color: rgba({{ $primaryRgb }}, 0.2); }
        .seal-text     { color: {{ $primary }}; }
        .signature-line { border-top-color: rgba({{ $primaryRgb }}, 0.4); }
        .signature-name { color: #475569; }
        .footer-note-text { color: #94a3b8; }

        @elseif ($bgStyle === 'gradient')
        .bg-gradient {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: linear-gradient(135deg, #0f0f18 0%, rgba({{ $primaryRgb }}, 0.35) 50%, #0f0f18 100%);
        }
        body { color: #e2e8f0; }
        .brand         { color: {{ $accent }}; }
        .divider       { background: rgba({{ $accentRgb }}, 0.5); }
        .title         { color: #94a3b8; }
        .this-certifies, .completion-text { color: #64748b; }
        .student-name  { color: #f1f5f9; }
        .name-underline { background: linear-gradient(90deg, transparent, rgba({{ $accentRgb }}, 0.6), transparent); }
        .course-title  { color: {{ $accent }}; }
        .footer-label  { color: #475569; }
        .footer-value  { color: #94a3b8; }
        .footer-value.cert-number { color: {{ $primary }}; }
        .outer-border  { border-color: rgba({{ $accentRgb }}, 0.3); }
        .inner-border  { border-color: rgba({{ $accentRgb }}, 0.12); }
        .corner        { border-color: {{ $primary }}; }
        .verify-url    { color: #334155; }
        .seal          { border-color: rgba({{ $primaryRgb }}, 0.5); }
        .seal-inner    { border-color: rgba({{ $primaryRgb }}, 0.3); }
        .seal-text     { color: {{ $primary }}; }
        .signature-line { border-top-color: rgba({{ $accentRgb }}, 0.4); }
        .signature-name { color: #94a3b8; }
        .footer-note-text { color: #64748b; }

        @else {{-- dark (default) --}}
        .bg-gradient {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: linear-gradient(135deg, #0f0f18 0%, #1a0a2e 50%, #0f0f18 100%);
        }
        body { color: #e2e8f0; }
        .brand         { color: {{ $accent }}; }
        .divider       { background: rgba({{ $accentRgb }}, 0.5); }
        .title         { color: #94a3b8; }
        .this-certifies, .completion-text { color: #64748b; }
        .student-name  { color: #f1f5f9; }
        .name-underline { background: linear-gradient(90deg, transparent, rgba({{ $accentRgb }}, 0.6), transparent); }
        .course-title  { color: {{ $accent }}; }
        .footer-label  { color: #475569; }
        .footer-value  { color: #94a3b8; }
        .footer-value.cert-number { color: {{ $primary }}; }
        .outer-border  { border-color: rgba({{ $accentRgb }}, 0.3); }
        .inner-border  { border-color: rgba({{ $accentRgb }}, 0.12); }
        .corner        { border-color: {{ $primary }}; }
        .verify-url    { color: #334155; }
        .seal          { border-color: rgba({{ $primaryRgb }}, 0.5); }
        .seal-inner    { border-color: rgba({{ $primaryRgb }}, 0.3); }
        .seal-text     { color: {{ $primary }}; }
        .signature-line { border-top-color: rgba({{ $accentRgb }}, 0.4); }
        .signature-name { color: #94a3b8; }
        .footer-note-text { color: #64748b; }
        @endif

        /* Decorative blobs */
        .circle-1 {
            position: absolute; top: -80px; right: -80px;
            width: 350px; height: 350px; border-radius: 50%;
            background: rgba({{ $primaryRgb }}, 0.12);
        }
        .circle-2 {
            position: absolute; bottom: -100px; left: -60px;
            width: 300px; height: 300px; border-radius: 50%;
            background: rgba({{ $primaryRgb }}, 0.07);
        }

        /* Borders */
        .outer-border {
            position: absolute; top: 16px; left: 16px; right: 16px; bottom: 16px;
            border: 1px solid;
        }
        .inner-border {
            position: absolute; top: 22px; left: 22px; right: 22px; bottom: 22px;
            border: 1px solid;
        }

        /* Corners */
        .corner {
            position: absolute; width: 28px; height: 28px;
            border-style: solid;
        }
        .corner-tl { top: 10px; left: 10px; border-width: 2px 0 0 2px; }
        .corner-tr { top: 10px; right: 10px; border-width: 2px 2px 0 0; }
        .corner-bl { bottom: 10px; left: 10px; border-width: 0 0 2px 2px; }
        .corner-br { bottom: 10px; right: 10px; border-width: 0 2px 2px 0; }

        /* Content */
        .content {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            padding: {{ $showSignature ? '36px 60px 52px' : '40px 60px' }};
            text-align: center;
        }

        .brand {
            font-family: "DejaVu Sans", Helvetica, sans-serif;
            font-size: 11px; font-weight: bold;
            letter-spacing: 4px; text-transform: uppercase;
            margin-bottom: 10px;
        }
        .divider {
            width: 60px; height: 1px; margin: 0 auto 14px;
        }
        .title {
            font-size: 11px; font-weight: normal;
            letter-spacing: 3px; text-transform: uppercase;
            margin-bottom: 18px;
            font-family: "DejaVu Sans", Helvetica, sans-serif;
        }
        .this-certifies {
            font-size: 10px; letter-spacing: 1.5px;
            text-transform: uppercase; margin-bottom: 6px;
            font-family: "DejaVu Sans", Helvetica, sans-serif;
        }
        .student-name {
            font-size: 36px; font-weight: bold;
            margin-bottom: 6px; line-height: 1.1;
        }
        .name-underline {
            width: 240px; height: 1px; margin: 0 auto 18px;
        }
        .completion-text {
            font-size: 10px; letter-spacing: 1px;
            text-transform: uppercase; margin-bottom: 8px;
            font-family: "DejaVu Sans", Helvetica, sans-serif;
        }
        .course-title {
            font-size: 18px; font-weight: bold;
            margin-bottom: {{ $showSignature ? '12px' : '20px' }};
            line-height: 1.3; max-width: 500px;
        }

        /* Footer info row */
        .footer-row {
            display: flex; flex-direction: row;
            justify-content: center; align-items: flex-start;
            width: 100%; margin-top: 6px;
        }
        .footer-item {
            flex: 1; text-align: center; padding: 0 12px;
        }
        .footer-item + .footer-item {
            border-left: 1px solid rgba({{ $accentRgb }}, 0.15);
        }
        .footer-label {
            font-family: "DejaVu Sans", Helvetica, sans-serif;
            font-size: 8px; letter-spacing: 2px;
            text-transform: uppercase; margin-bottom: 4px;
        }
        .footer-value {
            font-family: "DejaVu Sans", Helvetica, sans-serif;
            font-size: 10px; font-weight: bold;
        }
        .footer-value.cert-number {
            font-size: 9px; letter-spacing: 1px;
        }

        /* Signature */
        .signature-block {
            display: flex; flex-direction: row;
            justify-content: center; align-items: flex-end;
            gap: 60px; margin-top: 12px; width: 100%;
        }
        .signature-item {
            text-align: center; min-width: 120px;
        }
        .signature-line {
            width: 120px; height: 0;
            border-top: 1px solid; margin: 0 auto 4px;
        }
        .signature-name {
            font-family: "DejaVu Sans", Helvetica, sans-serif;
            font-size: 9px;
        }
        .signature-role {
            font-family: "DejaVu Sans", Helvetica, sans-serif;
            font-size: 7px; letter-spacing: 1.5px;
            text-transform: uppercase; opacity: 0.5; margin-top: 2px;
        }

        /* Footer note */
        .footer-note-text {
            font-family: "DejaVu Sans", Helvetica, sans-serif;
            font-size: 7.5px; letter-spacing: 0.3px;
            font-style: italic; margin-top: 8px;
        }

        /* Seal */
        .seal {
            position: absolute; bottom: 38px; right: 50px;
            width: 72px; height: 72px; border: 2px solid; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
        }
        .seal-inner {
            width: 56px; height: 56px; border: 1px solid; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
        }
        .seal-text {
            font-family: "DejaVu Sans", Helvetica, sans-serif;
            font-size: 6px; font-weight: bold;
            letter-spacing: 1.5px; text-transform: uppercase;
            text-align: center; line-height: 1.4;
        }

        /* Verify URL */
        .verify-url {
            position: absolute; bottom: 38px; left: 50px;
            font-family: "DejaVu Sans", Helvetica, sans-serif;
            font-size: 7px; letter-spacing: 0.5px;
        }
    </style>
</head>
<body>
<div class="page">
    <div class="bg-gradient"></div>
    <div class="circle-1"></div>
    <div class="circle-2"></div>

    <div class="outer-border"></div>
    <div class="inner-border"></div>

    <div class="corner corner-tl"></div>
    <div class="corner corner-tr"></div>
    <div class="corner corner-bl"></div>
    <div class="corner corner-br"></div>

    <div class="content">
        <div class="brand">KursusIO</div>
        <div class="divider"></div>
        <div class="title">{{ $customTitle }}</div>

        <div class="this-certifies">This certifies that</div>
        <div class="student-name">{{ $studentName }}</div>
        <div class="name-underline"></div>

        <div class="completion-text">has successfully completed</div>
        <div class="course-title">{{ $courseTitle }}</div>

        <div class="footer-row">
            <div class="footer-item">
                <div class="footer-label">Issued On</div>
                <div class="footer-value">{{ $issuedAt }}</div>
            </div>
            <div class="footer-item">
                <div class="footer-label">Certificate No.</div>
                <div class="footer-value cert-number">{{ $certificateNumber }}</div>
            </div>
            <div class="footer-item">
                <div class="footer-label">Instructor</div>
                <div class="footer-value">{{ $instructorName }}</div>
            </div>
        </div>

        @if ($showSignature)
        <div class="signature-block">
            <div class="signature-item">
                <div class="signature-line"></div>
                <div class="signature-name">{{ $signatureName }}</div>
                <div class="signature-role">Instructor</div>
            </div>
            <div class="signature-item">
                <div class="signature-line"></div>
                <div class="signature-name">KursusIO</div>
                <div class="signature-role">Platform</div>
            </div>
        </div>
        @endif

        @if (!empty($footerNote))
        <div class="footer-note-text">"{{ $footerNote }}"</div>
        @endif
    </div>

    <div class="seal">
        <div class="seal-inner">
            <div class="seal-text">KURSUS<br>IO<br>VERIFIED</div>
        </div>
    </div>

    <div class="verify-url">Verify at: {{ $verifyUrl }}</div>
</div>
</body>
</html>
