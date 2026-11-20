import type Konva from 'konva';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Circle, Group as KonvaGroup, Image as KonvaImage, Layer, Line, Rect, Stage, Text as KonvaText } from 'react-konva';

import {
    BOLD_ELEMENTS,
    CANVAS_H,
    CANVAS_W,
    META_ELEMENTS,
    clamp,
    isCustomElementKey,
    measureElementBox,
    resolveElementText,
    round,
} from './certificate-designer-utils';
import type { CertificateTemplate, ElementConfig, ElementKey, PreviewValues } from './certificate-designer-utils';

interface DesignerCanvasProps {
    template: CertificateTemplate;
    values: PreviewValues;
    backgroundUrl: string | null;
    signatureImageUrl: string | null;
    selected: ElementKey | null;
    interactive?: boolean;
    brandName: string;
    onSelect: (key: ElementKey | null) => void;
    onChange: (key: ElementKey, patch: Partial<ElementConfig>) => void;
}

interface Guides {
    vertical: boolean;
    horizontal: boolean;
}

type ResizeCorner = 'nw' | 'ne' | 'sw' | 'se';

interface ResizeState {
    key: ElementKey;
    corner: ResizeCorner;
    startFontSize: number;
    startDistance: number;
    centerX: number;
    centerY: number;
}

function useHtmlImage(src: string | null) {
    const [image, setImage] = useState<HTMLImageElement | null>(null);

    useEffect(() => {
        if (!src) {
            setImage(null);
            return;
        }

        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => setImage(img);
        img.onerror = () => setImage(null);
        img.src = src;

        return () => {
            img.onload = null;
            img.onerror = null;
        };
    }, [src]);

    return image;
}

interface SignatureLayout {
    width: number;
    imageHeight: number;
    captionHeight: number;
    height: number;
    localX: number;
    anchorX: number;
    anchorY: number;
    offsetX: number;
    left: number;
    top: number;
}

/** Mirrors the PDF signature sizing: height follows font size, width is capped. */
function signatureLayout(image: HTMLImageElement, element: ElementConfig, text: string): SignatureLayout {
    const ratio = image.naturalWidth > 0 && image.naturalHeight > 0 ? image.naturalWidth / image.naturalHeight : 3;
    const requestedHeight = clamp(element.fontSize * 4, 28, 120);
    const width = Math.min(320, requestedHeight * ratio);
    const imageHeight = width / ratio;
    const captionFontSize = Math.max(8, element.fontSize * 0.8);
    const captionHeight = text ? captionFontSize * 1.2 + 2 : 0;
    const height = imageHeight + captionHeight;
    const maxWidth = CANVAS_W * 0.72;
    const localX = element.align === 'center' ? (maxWidth - width) / 2 : element.align === 'right' ? maxWidth - width : 0;
    const offsetX = element.align === 'left' ? 0 : element.align === 'right' ? maxWidth : maxWidth / 2;
    const anchorX = (element.x / 100) * CANVAS_W;
    const anchorY = (element.y / 100) * CANVAS_H;

    return {
        width,
        imageHeight,
        captionHeight,
        height,
        localX,
        anchorX,
        anchorY,
        offsetX,
        left: anchorX - offsetX + localX,
        top: anchorY - height / 2,
    };
}

export default function DesignerCanvas({
    template,
    values,
    backgroundUrl,
    signatureImageUrl,
    selected,
    interactive = true,
    brandName,
    onSelect,
    onChange,
}: DesignerCanvasProps) {
    const bgImage = useHtmlImage(backgroundUrl);
    const signatureImage = useHtmlImage(signatureImageUrl);
    const [guides, setGuides] = useState<Guides>({ vertical: false, horizontal: false });
    const [resizing, setResizing] = useState<ResizeState | null>(null);
    const [resizeFontSize, setResizeFontSize] = useState<number | null>(null);
    const resizeRef = useRef<ResizeState | null>(null);

    const previewFontSize = resizing && resizeFontSize != null ? resizeFontSize : null;

    const effectiveElement = useCallback(
        (key: ElementKey, element: ElementConfig): ElementConfig => {
            if (previewFontSize != null && resizing?.key === key) {
                return { ...element, fontSize: previewFontSize };
            }
            return element;
        },
        [previewFontSize, resizing?.key],
    );

    const visibleElements = useMemo(
        () =>
            (Object.keys(template.elements) as ElementKey[])
                .map((key) => {
                    const base = template.elements[key];
                    const element = effectiveElement(key, base);
                    const text = resolveElementText(key, base, template, values);
                    return { key, element, base, text };
                })
                .filter(({ base, text }) => base.visible && text.length > 0),
        [template, values, effectiveElement],
    );

    const selectedElement = selected ? template.elements[selected] : null;
    const selectedEffective = selected && selectedElement ? effectiveElement(selected, selectedElement) : null;
    const selectedText = selected && selectedElement ? resolveElementText(selected, selectedElement, template, values) : '';
    const selectedSignature =
        selected === 'signature_name' && selectedEffective && selectedElement?.visible && signatureImage
            ? signatureLayout(signatureImage, selectedEffective, selectedText)
            : null;
    const selectedBox = selectedSignature
        ? selectedSignature
        : selected && selectedEffective && selectedElement?.visible && selectedText
          ? measureElementBox(selected, selectedEffective, selectedText)
          : null;

    const clearCursor = (event: Konva.KonvaEventObject<MouseEvent>) => {
        if (resizeRef.current) return;
        const stage = event.target.getStage();
        if (stage && !event.target.isDragging()) stage.container().style.cursor = 'default';
    };

    const moveCursor = (event: Konva.KonvaEventObject<MouseEvent>) => {
        if (resizeRef.current) return;
        const stage = event.target.getStage();
        if (stage) stage.container().style.cursor = 'move';
    };

    const dragHandlers = (key: ElementKey) => ({
        draggable: interactive && resizing?.key !== key,
        onClick: (event: Konva.KonvaEventObject<MouseEvent>) => {
            event.cancelBubble = true;
            onSelect(key);
        },
        onTap: () => onSelect(key),
        onDragStart: () => {
            onSelect(key);
            setGuides({ vertical: false, horizontal: false });
        },
        onDragMove: (event: Konva.KonvaEventObject<DragEvent>) => {
            const nextX = (event.target.x() / CANVAS_W) * 100;
            const nextY = (event.target.y() / CANVAS_H) * 100;
            setGuides({ vertical: Math.abs(nextX - 50) < 1.2, horizontal: Math.abs(nextY - 50) < 1.2 });
        },
        onDragEnd: (event: Konva.KonvaEventObject<DragEvent>) => {
            let nextX = (event.target.x() / CANVAS_W) * 100;
            let nextY = (event.target.y() / CANVAS_H) * 100;

            if (Math.abs(nextX - 50) < 1.2) nextX = 50;
            if (Math.abs(nextY - 50) < 1.2) nextY = 50;

            onChange(key, {
                x: Math.round(Math.max(0, Math.min(100, nextX)) * 10) / 10,
                y: Math.round(Math.max(0, Math.min(100, nextY)) * 10) / 10,
            });
            setGuides({ vertical: false, horizontal: false });
            const stage = event.target.getStage();
            if (stage) stage.container().style.cursor = resizeRef.current ? stage.container().style.cursor : 'default';
        },
    });

    const beginResize = (event: Konva.KonvaEventObject<DragEvent | MouseEvent>, key: ElementKey, corner: ResizeCorner) => {
        event.cancelBubble = true;
        if (!selectedBox || !selectedElement) return;

        const stage = event.target.getStage();
        const pointer = stage?.getPointerPosition();
        if (!stage || !pointer) return;

        const centerX = selectedBox.left + selectedBox.width / 2;
        const centerY = selectedBox.top + selectedBox.height / 2;
        const dx = pointer.x - centerX;
        const dy = pointer.y - centerY;
        const startDistance = Math.max(8, Math.hypot(dx, dy));

        const state: ResizeState = {
            key,
            corner,
            startFontSize: selectedElement.fontSize,
            startDistance,
            centerX,
            centerY,
        };

        resizeRef.current = state;
        setResizing(state);
        setResizeFontSize(selectedElement.fontSize);
        stage.container().style.cursor = cornerCursor(corner);
    };

    const updateResize = (event: Konva.KonvaEventObject<DragEvent>) => {
        const state = resizeRef.current;
        if (!state) return;
        event.cancelBubble = true;

        const stage = event.target.getStage();
        const pointer = stage?.getPointerPosition();
        if (!stage || !pointer) return;

        const dx = pointer.x - state.centerX;
        const dy = pointer.y - state.centerY;
        const distance = Math.max(8, Math.hypot(dx, dy));
        const scale = distance / state.startDistance;
        const next = clamp(round(state.startFontSize * scale, 1), 6, 120);
        setResizeFontSize(next);
        stage.container().style.cursor = cornerCursor(state.corner);

        // Keep the handle anchored to its box corner during drag.
        if (selectedBox) {
            const corners = boxCorners(selectedBox);
            const corner = corners[state.corner];
            event.target.position({ x: corner.x, y: corner.y });
        }
    };

    const endResize = (event: Konva.KonvaEventObject<DragEvent | MouseEvent>) => {
        const state = resizeRef.current;
        if (!state) return;
        event.cancelBubble = true;

        const stage = event.target.getStage();
        const finalSize = resizeFontSize ?? state.startFontSize;
        resizeRef.current = null;
        setResizing(null);
        setResizeFontSize(null);
        if (stage) stage.container().style.cursor = 'default';

        onChange(state.key, { fontSize: clamp(round(finalSize, 1), 6, 120) });
    };

    return (
        <Stage
            width={CANVAS_W}
            height={CANVAS_H}
            className="touch-none select-none"
            onMouseDown={(event) => {
                if (event.target === event.target.getStage()) onSelect(null);
            }}
        >
            <Layer listening={false}>
                {backgroundUrl ? (
                    bgImage ? (
                        <KonvaImage image={bgImage} width={CANVAS_W} height={CANVAS_H} />
                    ) : (
                        <Rect width={CANVAS_W} height={CANVAS_H} fill="#e5e7eb" />
                    )
                ) : (
                    <DefaultCanvasBackground template={template} brandName={brandName} />
                )}
            </Layer>

            <Layer>
                {visibleElements.map(({ key, element, text }) => {
                    const isMeta = META_ELEMENTS.includes(key);
                    const bold = BOLD_ELEMENTS.includes(key);
                    const color = backgroundUrl || isCustomElementKey(key) ? element.color : builtInColor(key, template);
                    const maxWidth = CANVAS_W * 0.72;
                    const box = measureElementBox(key, element, text);
                    const labelFontSize = Math.max(6, element.fontSize * 0.72);
                    const labelLineHeight = labelFontSize * 1.2;
                    const contentLeft =
                        element.align === 'center' ? (maxWidth - box.width) / 2 : element.align === 'right' ? maxWidth - box.width : 0;

                    // A tight, slightly padded hit area keeps nearby text layers from
                    // stealing each other's clicks (the text block itself is 72% wide).
                    const hitArea = (
                        <Rect x={contentLeft - 3} y={-3} width={box.width + 6} height={box.height + 6} fill="rgba(0,0,0,0.001)" cornerRadius={3} />
                    );

                    const signature = key === 'signature_name' && signatureImage ? signatureLayout(signatureImage, element, text) : null;
                    const isResizingThis = resizing?.key === key;

                    return (
                        <KonvaGroup
                            key={key}
                            x={signature ? signature.anchorX : box.anchorX}
                            y={signature ? signature.anchorY : box.anchorY}
                            offsetX={signature ? signature.offsetX : box.offsetX}
                            offsetY={signature ? signature.height / 2 : box.height / 2}
                            {...dragHandlers(key)}
                            draggable={interactive && !isResizingThis}
                            onMouseEnter={moveCursor}
                            onMouseLeave={clearCursor}
                        >
                            {signature && signatureImage ? (
                                <>
                                    <KonvaImage
                                        image={signatureImage}
                                        x={signature.localX}
                                        y={0}
                                        width={signature.width}
                                        height={signature.imageHeight}
                                        listening={false}
                                    />
                                    {text && (
                                        <KonvaText
                                            text={text}
                                            x={signature.localX}
                                            y={signature.imageHeight + 2}
                                            width={signature.width}
                                            align={element.align}
                                            fontSize={Math.max(8, element.fontSize * 0.8)}
                                            fontStyle="normal"
                                            lineHeight={1.2}
                                            fill={color}
                                            listening={false}
                                        />
                                    )}
                                    <Rect
                                        x={signature.localX - 3}
                                        y={-3}
                                        width={signature.width + 6}
                                        height={signature.height + 6}
                                        fill="rgba(0,0,0,0.001)"
                                        cornerRadius={3}
                                    />
                                </>
                            ) : (
                                <>
                                    {isMeta && element.prefix ? (
                                        <>
                                            <KonvaText
                                                text={element.prefix.toUpperCase()}
                                                width={maxWidth}
                                                align={element.align}
                                                fontSize={labelFontSize}
                                                fontStyle="normal"
                                                letterSpacing={1.6}
                                                lineHeight={1.2}
                                                fill={color}
                                                opacity={0.72}
                                                listening={false}
                                            />
                                            <KonvaText
                                                text={text}
                                                y={labelLineHeight + 3}
                                                width={maxWidth}
                                                align={element.align}
                                                fontSize={element.fontSize}
                                                fontStyle={bold ? 'bold' : 'normal'}
                                                lineHeight={1.2}
                                                fill={color}
                                                listening={false}
                                            />
                                        </>
                                    ) : (
                                        <KonvaText
                                            text={text}
                                            width={maxWidth}
                                            align={element.align}
                                            fontSize={element.fontSize}
                                            fontStyle={bold ? 'bold' : 'normal'}
                                            lineHeight={1.2}
                                            fill={color}
                                            listening={false}
                                        />
                                    )}
                                    {hitArea}
                                </>
                            )}
                        </KonvaGroup>
                    );
                })}
            </Layer>

            {interactive && (guides.vertical || guides.horizontal) && (
                <Layer listening={false}>
                    {guides.vertical && (
                        <Line points={[CANVAS_W / 2, 0, CANVAS_W / 2, CANVAS_H]} stroke="#8b5cf6" strokeWidth={1} dash={[5, 6]} opacity={0.6} />
                    )}
                    {guides.horizontal && (
                        <Line points={[0, CANVAS_H / 2, CANVAS_W, CANVAS_H / 2]} stroke="#8b5cf6" strokeWidth={1} dash={[5, 6]} opacity={0.6} />
                    )}
                </Layer>
            )}

            {interactive && selectedBox && selected && (
                <Layer>
                    <Rect
                        x={selectedBox.left - 10}
                        y={selectedBox.top - 10}
                        width={selectedBox.width + 20}
                        height={selectedBox.height + 20}
                        stroke="#8b5cf6"
                        strokeWidth={1.4}
                        dash={[6, 4]}
                        cornerRadius={2}
                        listening={false}
                    />
                    {(['nw', 'ne', 'sw', 'se'] as ResizeCorner[]).map((corner) => {
                        const point = boxCorners(selectedBox)[corner];
                        const active = resizing?.key === selected && resizing.corner === corner;

                        return (
                            <Rect
                                key={corner}
                                x={point.x}
                                y={point.y}
                                offsetX={6}
                                offsetY={6}
                                width={12}
                                height={12}
                                fill={active ? '#8b5cf6' : '#ffffff'}
                                stroke="#8b5cf6"
                                strokeWidth={1.5}
                                cornerRadius={2}
                                draggable
                                dragBoundFunc={() => point}
                                onMouseEnter={(event) => {
                                    const stage = event.target.getStage();
                                    if (stage) stage.container().style.cursor = cornerCursor(corner);
                                }}
                                onMouseLeave={(event) => {
                                    if (resizeRef.current) return;
                                    const stage = event.target.getStage();
                                    if (stage) stage.container().style.cursor = 'default';
                                }}
                                onMouseDown={(event) => beginResize(event, selected, corner)}
                                onDragStart={(event) => beginResize(event, selected, corner)}
                                onDragMove={updateResize}
                                onDragEnd={endResize}
                                onMouseUp={endResize}
                            />
                        );
                    })}
                    {resizeFontSize != null && resizing?.key === selected && (
                        <KonvaGroup listening={false}>
                            <Rect
                                x={selectedBox.left + selectedBox.width / 2 - 28}
                                y={selectedBox.top - 34}
                                width={56}
                                height={20}
                                fill="#18181b"
                                cornerRadius={4}
                                opacity={0.92}
                            />
                            <KonvaText
                                x={selectedBox.left + selectedBox.width / 2 - 28}
                                y={selectedBox.top - 29}
                                width={56}
                                align="center"
                                text={`${Math.round(resizeFontSize)} px`}
                                fontSize={11}
                                fontStyle="bold"
                                fill="#ffffff"
                            />
                        </KonvaGroup>
                    )}
                </Layer>
            )}
        </Stage>
    );
}

function boxCorners(box: { left: number; top: number; width: number; height: number }): Record<ResizeCorner, { x: number; y: number }> {
    const pad = 10;
    const left = box.left - pad;
    const top = box.top - pad;
    const right = box.left + box.width + pad;
    const bottom = box.top + box.height + pad;

    return {
        nw: { x: left, y: top },
        ne: { x: right, y: top },
        sw: { x: left, y: bottom },
        se: { x: right, y: bottom },
    };
}

function cornerCursor(corner: ResizeCorner): string {
    return corner === 'nw' || corner === 'se' ? 'nwse-resize' : 'nesw-resize';
}

/**
 * The built-in certificate ignores the per-element colors (it uses the brand
 * palette instead). Mirror that behaviour in the canvas preview so the default
 * artwork is always readable, while custom uploaded artwork keeps the colors
 * configured by the admin.
 */
function builtInColor(key: ElementKey, template: CertificateTemplate): string {
    const light = template.bg_style === 'light';

    if (light) {
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
        case 'footer_note':
            return '#94a3b8';
        default:
            return '#94a3b8';
    }
}

function DefaultCanvasBackground({ template, brandName }: { template: CertificateTemplate; brandName: string }) {
    const isLight = template.bg_style === 'light';
    const isGradient = template.bg_style === 'gradient';
    const base = isLight ? '#fbfaff' : isGradient ? '#160e2e' : '#0d0b16';
    const accent = template.accent_color || '#a78bfa';
    const primary = template.primary_color || '#7c3aed';
    const brand = (brandName || 'KursusIO').toUpperCase();

    return (
        <>
            <Rect width={CANVAS_W} height={CANVAS_H} fill={base} />

            {isGradient && (
                <Rect
                    width={CANVAS_W}
                    height={CANVAS_H}
                    fillLinearGradientStartPoint={{ x: 0, y: 0 }}
                    fillLinearGradientEndPoint={{ x: CANVAS_W, y: CANVAS_H }}
                    fillLinearGradientColorStops={[0, base, 0.5, primary + '66', 1, base]}
                />
            )}

            <Circle x={CANVAS_W - 40} y={-60} radius={190} fill={primary} opacity={isLight ? 0.06 : 0.16} />
            <Circle x={20} y={CANVAS_H + 60} radius={170} fill={primary} opacity={isLight ? 0.04 : 0.1} />
            <Circle x={CANVAS_W - 110} y={CANVAS_H - 40} radius={70} stroke={accent} strokeWidth={1} opacity={isLight ? 0.18 : 0.14} />

            <Rect x={16} y={16} width={CANVAS_W - 32} height={CANVAS_H - 32} stroke={accent} strokeWidth={1} opacity={isLight ? 0.4 : 0.32} />
            <Rect x={22} y={22} width={CANVAS_W - 44} height={CANVAS_H - 44} stroke={accent} strokeWidth={0.6} opacity={isLight ? 0.18 : 0.14} />

            <CornerAccents color={primary} />

            <KonvaText
                x={0}
                y={30}
                width={CANVAS_W}
                align="center"
                text={brand}
                fontSize={10}
                fontStyle="bold"
                letterSpacing={4}
                fill={accent}
                opacity={isLight ? 0.9 : 0.85}
            />
            <Line points={[CANVAS_W / 2 - 24, 50, CANVAS_W / 2 + 24, 50]} stroke={accent} strokeWidth={1} opacity={0.5} />
        </>
    );
}

function CornerAccents({ color }: { color: string }) {
    const inset = 10;
    const length = 26;

    return (
        <>
            <Line points={[inset, inset + length, inset, inset, inset + length, inset]} stroke={color} strokeWidth={2} opacity={0.7} />
            <Line
                points={[CANVAS_W - inset - length, inset, CANVAS_W - inset, inset, CANVAS_W - inset, inset + length]}
                stroke={color}
                strokeWidth={2}
                opacity={0.7}
            />
            <Line
                points={[inset, CANVAS_H - inset - length, inset, CANVAS_H - inset, inset + length, CANVAS_H - inset]}
                stroke={color}
                strokeWidth={2}
                opacity={0.7}
            />
            <Line
                points={[
                    CANVAS_W - inset - length,
                    CANVAS_H - inset,
                    CANVAS_W - inset,
                    CANVAS_H - inset,
                    CANVAS_W - inset,
                    CANVAS_H - inset - length,
                ]}
                stroke={color}
                strokeWidth={2}
                opacity={0.7}
            />
        </>
    );
}
