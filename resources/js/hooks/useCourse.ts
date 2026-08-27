import { useForm, router, usePage } from "@inertiajs/react"
import { useEffect, useState } from "react"
import { Course } from "@/types"

interface CourseFormData {
  title: string
  description: string
  level: string
  type: string
  status: string
  price: string | number
  thumbnail: File | null
  category_ids: number[]
  tag_ids: number[]
}

export function useCourse(course?: Course, courses: Course[] = []) {
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
  | SEARCH
  |--------------------------------------------------------------------------
  */

  const [search, setSearch] = useState("")

  const filteredCourses = courses.filter((course) =>
    course.title.toLowerCase().includes(search.toLowerCase()) ||
    (course.creator?.name ?? "")
      .toLowerCase()
      .includes(search.toLowerCase())
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
    category_ids: course?.categories?.map((c) => c.id) ?? [],
    tag_ids: course?.tags?.map((t) => t.id) ?? [],
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
      data.thumbnail !== null ||
      JSON.stringify(data.category_ids) !==
        JSON.stringify(course.categories?.map((c) => c.id) ?? []) ||
      JSON.stringify(data.tag_ids) !==
        JSON.stringify(course.tags?.map((t) => t.id) ?? [])
    : data.title.trim() !== ""

  /*
  |--------------------------------------------------------------------------
  | SAVE
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

      if (
        JSON.stringify(data.category_ids) !==
        JSON.stringify(course.categories?.map((c) => c.id) ?? [])
      ) {
        payload.category_ids = data.category_ids
      }

      if (
        JSON.stringify(data.tag_ids) !==
        JSON.stringify(course.tags?.map((t) => t.id) ?? [])
      ) {
        payload.tag_ids = data.tag_ids
      }

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
  | DELETE / VISIT
  |--------------------------------------------------------------------------
  */
  const destroy = (slug: string) => {
    const rolePrefix = auth.user.role
    router.delete(`/${rolePrefix}/courses/${slug}`)
  }

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

    /* SEARCH */
    search,
    setSearch,
    filteredCourses,
  }
}