import AdminLayout from "@/components/templates/AdminLayout"
import MaterialsCrud from "@/components/organism/Course/MaterialsCrud"

import { Head } from "@inertiajs/react"
import { Module } from "@/types"

interface ModulePageProps {
  module: Module
}

export default function ModulePage({ module }: ModulePageProps) {
  return (
    <>
      <Head title={module.title} />

      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">
            {module.title}
          </h1>

          <p className="text-sm text-neutral-500">
            Manage materials inside this module
          </p>
        </div>

        <MaterialsCrud
          courseSlug={module.course?.slug}  
          moduleId={module.id}
          materials={module.materials ?? []}
        />
      </div>
    </>
  )
}

ModulePage.layout = (page: any) => (
  <AdminLayout>{page}</AdminLayout>
)