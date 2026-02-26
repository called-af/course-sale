import { useEffect } from "react"
import { usePage } from "@inertiajs/react"
import { toast } from "react-toastify"

export function useInertiaToast() {
  const { flash, errors } = usePage().props as any

  useEffect(() => {
    if (flash?.success) {
      toast.success(flash.success)
    }

    if (flash?.error) {
      toast.error(flash.error)
    }

    if (errors?.status) {
      toast.error(errors.status)
    }
  }, [flash, errors])
}