import { useForm, router, usePage } from "@inertiajs/react"
import { useEffect, useState } from "react"
import { useRoute } from "ziggy-js"
import { Course } from "@/types"

interface CourseFormData {
  title: string
  description: string
  level: string
  type: string
  status: string
  price: string | number
  thumbnail: File | null
}

export function useCourse(course?: Course) {
  const route = useRoute()
  const { auth } = usePage().props as any

  const isEdit = !!course

  /*
  |--------------------------------------------------------------------------
  | PREVIEW
  |--------------------------------------------------------------------------
  */
  const [preview, setPreview] = useState<string>(
    course?.thumbnail_url || "/assets/landscape.jpeg"
  )

  /*
  |--------------------------------------------------------------------------
  | FORM
  |--------------------------------------------------------------------------
  */
  const form = useForm<CourseFormData>({
    title: course?.title ?? "",
    description: course?.description ?? "",
    level: course?.level ?? "",
    type: course?.type ?? "free",
    status: course?.status ?? "draft",
    price: (course as any)?.price ?? "",
    thumbnail: null,
  })

  const { data, setData, processing, errors, reset } = form

  /*
  |--------------------------------------------------------------------------
  | THUMBNAIL
  |--------------------------------------------------------------------------
  */
  const handleThumbnailChange = (file: File) => {
    const objectUrl = URL.createObjectURL(file)

    setData("thumbnail", file)
    setPreview(objectUrl)
  }

  useEffect(() => {
    return () => {
      if (preview.startsWith("blob:")) {
        URL.revokeObjectURL(preview)
      }
    }
  }, [preview])

  /*
  |--------------------------------------------------------------------------
  | DIRTY CHECK
  |--------------------------------------------------------------------------
  */
  const hasChanges = isEdit
    ? data.title !== course.title ||
      data.description !== (course.description ?? "") ||
      data.level !== (course.level ?? "") ||
      data.status !== course.status ||
      data.type !== course.type ||
      data.price !== ((course as any)?.price ?? "") ||
      data.thumbnail !== null
    : data.title.trim() !== ""

  /*
  |--------------------------------------------------------------------------
  | SAVE (CREATE / UPDATE)
  |--------------------------------------------------------------------------
  */
  const save = () => {
    if (!hasChanges) return

    const rolePrefix = auth.user.role

    if (isEdit) {
      const payload: Record<string, any> = {}

      if (data.title !== course.title) payload.title = data.title
      if (data.description !== (course.description ?? ""))
        payload.description = data.description
      if (data.level !== (course.level ?? "")) payload.level = data.level
      if (data.status !== course.status) payload.status = data.status
      if (data.type !== course.type) payload.type = data.type
      if (data.price !== ((course as any)?.price ?? ""))
        payload.price = data.price
      if (data.thumbnail) payload.thumbnail = data.thumbnail

      form.transform(() => payload)

      form.put(`/${rolePrefix}/courses/${course.slug}`, {
        forceFormData: true,
        onSuccess: () => reset("thumbnail"),
      })

      return
    }

    form.post(`/${rolePrefix}/courses`, {
      onSuccess: () => reset(),
    })
  }

  /*
  |--------------------------------------------------------------------------
  | DELETE
  |--------------------------------------------------------------------------
  */
  const destroy = (slug: string) => {
    const rolePrefix = auth.user.role
    router.delete(`/${rolePrefix}/courses/${slug}`)
  }

  /*
  |--------------------------------------------------------------------------
  | VISIT
  |--------------------------------------------------------------------------
  */
  const visit = (slug: string) => {
    const rolePrefix = auth.user.role
    router.visit(`/${rolePrefix}/courses/${slug}`)
  }

  return {
    isEdit,

    data,
    setData,
    errors,
    processing,

    preview,
    handleThumbnailChange,

    hasChanges,
    save,
    destroy,
    visit,
  }
}