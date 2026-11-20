<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>{{ $customTitle ?? 'Certificate of Completion' }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @page { margin: 0; }
        body { font-family: "DejaVu Sans", Helvetica, sans-serif; }
        .custom-element {
            position: absolute;
            width: 70%;
            line-height: 1.2;
            z-index: 6;
            white-space: pre-wrap;
            font-family: "DejaVu Sans", Helvetica, sans-serif;
        }
        .signature-image {
            display: block;
            margin: 0 auto 3px;
            object-fit: contain;
        }
        .signature-caption {
            font-family: "DejaVu Sans", Helvetica, sans-serif;
            font-size: 8px;
            line-height: 1.2;
            margin-top: 1px;
        }

        @if(($mode ?? 'default') === 'custom' && !empty($backgroundDataUri))
        .page {
            position: relative;
            width: 842px;
            height: 595px;
            overflow: hidden;
        }
        .bg-image {
            position: absolute;
            top: 0; left: 0;
            width: 842px;
            height: 595px;
            z-index: 0;
        }
        .element {
            position: absolute;
            width: 70%;
            line-height: 1.2;
            z-index: 2;
        }
        .align-left { text-align: left; }
        .align-center { text-align: center; }
        .align-right { text-align: right; }
        .label {
            font-size: 8px;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            opacity: 0.7;
            margin-bottom: 2px;
        }
        .verify-url {
            position: absolute;
            left: 24px;
            bottom: 16px;
            font-size: 7px;
            color: #374151;
            z-index: 3;
        }
        @else
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

        @php
            $primary = $primaryColor ?? '#7c3aed';
            $accent  = $accentColor ?? '#a78bfa';

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
            $bgStyleSafe = $bgStyle ?? 'dark';
        @endphp

        @if ($bgStyleSafe === 'light')
        .bg-gradient { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: #f8f7ff; }
        body { color: #1e1b4b; }
        .brand         { color: {{ $primary }}; }
        .divider       { background: rgba({{ $primaryRgb }}, 0.4); }
        .title         { color: #64748b; }
        .this-certifies, .completion-text { color: #94a3b8; }
        .student-name  { color: #1e1b4b; }
        .name-underline { background: rgba({{ $primaryRgb }}, 0.5); }
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

        @elseif ($bgStyleSafe === 'gradient')
        .bg-gradient { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: #1a1033; }
        body { color: #e2e8f0; }
        .brand         { color: {{ $accent }}; }
        .divider       { background: rgba({{ $accentRgb }}, 0.5); }
        .title         { color: #94a3b8; }
        .this-certifies, .completion-text { color: #64748b; }
        .student-name  { color: #f1f5f9; }
        .name-underline { background: rgba({{ $accentRgb }}, 0.6); }
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

        @else
        .bg-gradient { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: #0f0f18; }
        body { color: #e2e8f0; }
        .brand         { color: {{ $accent }}; }
        .divider       { background: rgba({{ $accentRgb }}, 0.5); }
        .title         { color: #94a3b8; }
        .this-certifies, .completion-text { color: #64748b; }
        .student-name  { color: #f1f5f9; }
        .name-underline { background: rgba({{ $accentRgb }}, 0.6); }
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

        .circle-1 { position: absolute; top: -80px; right: -80px; width: 350px; height: 350px; border-radius: 50%; background: rgba({{ $primaryRgb ?? '124,58,237' }}, 0.12); }
        .circle-2 { position: absolute; bottom: -100px; left: -60px; width: 300px; height: 300px; border-radius: 50%; background: rgba({{ $primaryRgb ?? '124,58,237' }}, 0.07); }
        .outer-border { position: absolute; top: 16px; left: 16px; right: 16px; bottom: 16px; border: 1px solid; }
        .inner-border { position: absolute; top: 22px; left: 22px; right: 22px; bottom: 22px; border: 1px solid; }
        .corner { position: absolute; width: 28px; height: 28px; border-style: solid; }
        .corner-tl { top: 10px; left: 10px; border-width: 2px 0 0 2px; }
        .corner-tr { top: 10px; right: 10px; border-width: 2px 2px 0 0; }
        .corner-bl { bottom: 10px; left: 10px; border-width: 0 0 2px 2px; }
        .corner-br { bottom: 10px; right: 10px; border-width: 0 2px 2px 0; }

        .content { position: absolute; top: 0; left: 0; width: 100%; height: 100%; text-align: center; padding: {{ ($showSignature ?? false) ? '36px 60px 52px' : '40px 60px' }}; }
        .brand { font-family: "DejaVu Sans", Helvetica, sans-serif; font-size: 11px; font-weight: bold; letter-spacing: 4px; text-transform: uppercase; margin-bottom: 10px; }
        .divider { width: 60px; height: 1px; margin: 0 auto 14px; }
        .title { font-size: 11px; font-weight: normal; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 18px; font-family: "DejaVu Sans", Helvetica, sans-serif; }
        .this-certifies { font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 6px; font-family: "DejaVu Sans", Helvetica, sans-serif; }
        .student-name { font-size: 36px; font-weight: bold; margin-bottom: 6px; line-height: 1.1; }
        .name-underline { width: 240px; height: 1px; margin: 0 auto 18px; }
        .completion-text { font-size: 10px; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px; font-family: "DejaVu Sans", Helvetica, sans-serif; }
        .course-title { font-size: 18px; font-weight: bold; margin-bottom: {{ ($showSignature ?? false) ? '12px' : '20px' }}; line-height: 1.3; }
        .footer-row { width: 100%; margin-top: 6px; }
        .footer-item { display: inline-block; width: 30%; text-align: center; vertical-align: top; }
        .footer-label { font-family: "DejaVu Sans", Helvetica, sans-serif; font-size: 8px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 4px; }
        .footer-value { font-family: "DejaVu Sans", Helvetica, sans-serif; font-size: 10px; font-weight: bold; }
        .footer-value.cert-number { font-size: 9px; letter-spacing: 1px; }
        .signature-block { margin-top: 12px; width: 100%; text-align: center; }
        .signature-item { display: inline-block; width: 180px; text-align: center; margin: 0 20px; }
        .signature-line { width: 120px; height: 0; border-top: 1px solid; margin: 0 auto 4px; }
        .signature-name { font-family: "DejaVu Sans", Helvetica, sans-serif; font-size: 9px; }
        .signature-role { font-family: "DejaVu Sans", Helvetica, sans-serif; font-size: 7px; letter-spacing: 1.5px; text-transform: uppercase; opacity: 0.5; margin-top: 2px; }
        .footer-note-text { font-family: "DejaVu Sans", Helvetica, sans-serif; font-size: 7.5px; letter-spacing: 0.3px; font-style: italic; margin-top: 8px; }
        .seal { position: absolute; bottom: 38px; right: 50px; width: 72px; height: 72px; border: 2px solid; border-radius: 50%; text-align: center; }
        .seal-inner { position: absolute; top: 7px; left: 7px; width: 56px; height: 56px; border: 1px solid; border-radius: 50%; }
        .seal-text { position: absolute; top: 18px; left: 0; right: 0; font-family: "DejaVu Sans", Helvetica, sans-serif; font-size: 6px; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase; text-align: center; line-height: 1.4; }
        .verify-url { position: absolute; bottom: 38px; left: 50px; font-family: "DejaVu Sans", Helvetica, sans-serif; font-size: 7px; letter-spacing: 0.5px; }
        @endif
    </style>
</head>
<body>
@php
    $brandNameSafe = $brandName ?? 'KursusIO';
    $sealName = mb_strtoupper($brandNameSafe);
    $sealHalf = (int) ceil(mb_strlen($sealName) / 2);

    $signatureStyle = static function (float $targetHeight) use ($signatureImageSize): string {
        if (! is_array($signatureImageSize) || empty($signatureImageSize['width']) || empty($signatureImageSize['height'])) {
            return '';
        }

        $ratio = (float) $signatureImageSize['width'] / (float) $signatureImageSize['height'];
        if ($ratio <= 0) {
            return '';
        }

        $targetHeight = max(24, min(120, $targetHeight));
        $width = min(320, $targetHeight * $ratio);
        $height = $width / $ratio;

        return 'width: '.round($width, 1).'px; height: '.round($height, 1).'px;';
    };
@endphp

@if(($mode ?? 'default') === 'custom' && !empty($backgroundDataUri))
    <div class="page">
        <img src="{{ $backgroundDataUri }}" class="bg-image" alt="Certificate template" />

        @foreach(($elements ?? []) as $key => $el)
            @php
                $visible = $el['visible'] ?? false;
                $text = $values[$key] ?? ($el['text'] ?? '');
                $prefix = $el['prefix'] ?? null;
                $isMeta = in_array($key, ['issued_at', 'certificate_number', 'instructor_name', 'signature_name'], true);
                $signatureSrc = $key === 'signature_name' ? ($signatureImageDataUri ?? null) : null;
                $hasContent = $signatureSrc || filled($text);
            @endphp
            @if($visible && $hasContent)
                @php
                    $align = $el['align'] ?? 'center';
                    $tx = $align === 'left' ? '0' : ($align === 'right' ? '-100%' : '-50%');
                    $elementSignatureStyle = $signatureSrc ? $signatureStyle((float) ($el['fontSize'] ?? 11) * 4) : '';
                @endphp
                <div class="element align-{{ $align }}" style="left: {{ $el['x'] ?? 50 }}%; top: {{ $el['y'] ?? 50 }}%; transform: translate({{ $tx }}, -50%); color: {{ $el['color'] ?? '#111827' }}; font-size: {{ $el['fontSize'] ?? 12 }}px; font-weight: {{ in_array($key, ['student_name','course_title','title'], true) ? 'bold' : 'normal' }};">
                    @if($isMeta && $prefix)
                        <div class="label" style="color: {{ $el['color'] ?? '#111827' }};">{{ $prefix }}</div>
                    @endif
                    @if($signatureSrc)
                        <img src="{{ $signatureSrc }}" class="signature-image" style="{{ $elementSignatureStyle }}" alt="Instructor signature" />
                        @if(filled($text))
                            <div class="signature-caption" style="color: {{ $el['color'] ?? '#111827' }};">{{ $text }}</div>
                        @endif
                    @else
                        <div>{{ $text }}</div>
                    @endif
                </div>
            @endif
        @endforeach

        <div class="verify-url">Verify at: {{ $verifyUrl }}</div>
    </div>
@else
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
            <div class="brand">{{ $brandNameSafe }}</div>
            <div class="divider"></div>
            <div class="title">{{ $customTitle ?? 'Certificate of Completion' }}</div>

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

            @if ($showSignature ?? false)
            <div class="signature-block">
                <div class="signature-item">
                    @if(!empty($signatureImageDataUri))
                        <img src="{{ $signatureImageDataUri }}" class="signature-image" style="{{ $signatureStyle(42) }}" alt="Instructor signature" />
                        <div class="signature-name">{{ $signatureName }}</div>
                    @else
                        <div class="signature-line"></div>
                        <div class="signature-name">{{ $signatureName }}</div>
                    @endif
                    <div class="signature-role">Instructor</div>
                </div>
                <div class="signature-item">
                    <div class="signature-line"></div>
                    <div class="signature-name">{{ $brandNameSafe }}</div>
                    <div class="signature-role">Platform</div>
                </div>
            </div>
            @endif

            @if (!empty($footerNote))
            <div class="footer-note-text">"{{ $footerNote }}"</div>
            @endif
        </div>

        <div class="seal">
            <div class="seal-inner"></div>
            <div class="seal-text">{{ mb_substr($sealName, 0, $sealHalf) }}<br>{{ mb_substr($sealName, $sealHalf) }}<br>VERIFIED</div>
        </div>

        <div class="verify-url">Verify at: {{ $verifyUrl }}</div>

        @foreach(($elements ?? []) as $key => $el)
            @php
                $isCustom = is_string($key) && str_starts_with($key, 'custom_');
                $customVisible = $el['visible'] ?? false;
                $customText = $el['text'] ?? '';
                $customAlign = $el['align'] ?? 'center';
                $customTranslate = $customAlign === 'left' ? '0' : ($customAlign === 'right' ? '-100%' : '-50%');
            @endphp
            @if($isCustom && $customVisible && filled($customText))
                <div class="custom-element" style="left: {{ $el['x'] ?? 50 }}%; top: {{ $el['y'] ?? 50 }}%; transform: translate({{ $customTranslate }}, -50%); text-align: {{ $customAlign }}; color: {{ $el['color'] ?? '#111827' }}; font-size: {{ $el['fontSize'] ?? 14 }}px;">{{ $customText }}</div>
            @endif
        @endforeach
    </div>
@endif
</body>
</html>
