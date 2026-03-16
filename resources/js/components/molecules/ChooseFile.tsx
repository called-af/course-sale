import { useState, ChangeEvent, useRef } from "react"
import Label from "@/components/atoms/Label"
import clsx from "clsx"

type Aspect = "square" | "video"

interface ChooseFileProps {
  label?: string
  value?: string | null
  className?: string
  aspect?: Aspect
  onChange: (file: File | null) => void
}

export default function ChooseFile({
  label,
  value,
  className,
  aspect = "square",
  onChange,
}: ChooseFileProps) {

  const [preview, setPreview] = useState<string | null>(value ?? null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleChange(e: ChangeEvent<HTMLInputElement>) {

    const file = e.target.files?.[0] ?? null

    if (!file) {
      onChange(null)
      setPreview(value ?? null)
      return
    }

    const url = URL.createObjectURL(file)

    setPreview(url)
    onChange(file)
  }

  return (
    <div className="flex flex-col gap-1">

      {label && <Label>{label}</Label>}

      <div
        onClick={() => inputRef.current?.click()}
        className={clsx(
          "relative w-full border border-dashed border-neutral-300 rounded overflow-hidden cursor-pointer bg-neutral-50 hover:bg-neutral-100 transition flex items-center justify-center",
          aspect === "square" && "aspect-square",
          aspect === "video" && "aspect-video",
          className
        )}
      >

        {preview ? (
          <img
            src={preview}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <span className="text-[10px] text-neutral-400">
            IMG
          </span>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleChange}
        />

      </div>

    </div>
  )
}