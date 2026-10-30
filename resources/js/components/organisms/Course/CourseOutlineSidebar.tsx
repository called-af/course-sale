import React, { useState } from "react"
import { ChevronDown, BookOpen } from "lucide-react"
import CourseOutlineItem from "@/components/molecules/course-preview/CourseOutlineItem"
import InputField from "@/components/molecules/InputField"
import { Module } from "@/types/modules"

interface CourseOutlineSidebarProps {
  modules: Module[]
  totalItemsCount: number
  selectedContentId: number | null
  onSelectContent: (id: number) => void
}

export default function CourseOutlineSidebar({
  modules = [],
  totalItemsCount,
  selectedContentId,
  onSelectContent,
}: CourseOutlineSidebarProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedModules, setExpandedModules] = useState<Record<number, boolean>>(() => {
    const initial: Record<number, boolean> = {}
    modules.forEach((mod) => {
      initial[mod.id] = true
    })
    return initial
  })

  const filteredModules = modules
    .map((mod) => {
      const filteredMaterials = (mod.materials ?? [])
        .map((mat) => {
          const filteredContents = (mat.contents ?? []).filter((content) =>
            content.title.toLowerCase().includes(searchTerm.toLowerCase())
          )
          return { ...mat, contents: filteredContents }
        })
        .filter((mat) => mat.contents.length > 0)

      return { ...mod, materials: filteredMaterials }
    })
    .filter((mod) => mod.materials.length > 0)

  const toggleModule = (id: number) => {
    setExpandedModules((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="bg-white dark:bg-[#1e1f24] border border-slate-200 dark:border-slate-700 shadow-xs p-4 rounded-none space-y-4">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-purple-600" />
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
            Course Outline
          </h3>
        </div>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{totalItemsCount} items</span>
      </div>

      {/* Search Input using project InputField molecule with sharp edges */}
      <div>
        <InputField
          label=""
          type="search"
          placeholder="Search lesson..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full text-xs !rounded-none"
        />
      </div>

      {/* Module List */}
      <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
        {filteredModules.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-400 dark:text-slate-500">
            No matching materials found.
          </div>
        ) : (
          filteredModules.map((module, index) => {
            const isExpanded = expandedModules[module.id] ?? true

            return (
              <div key={module.id} className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleModule(module.id)}
                  className="w-full py-1.5 px-2 text-left text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between gap-2 hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer rounded-none"
                >
                  <span className="truncate">
                    MOD {String(index + 1).padStart(2, "0")}: {module.title}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0 transition-transform duration-150 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isExpanded && (
                  <div className="pl-2 space-y-2 border-l border-slate-200 dark:border-slate-700 ml-2 my-1">
                    {module.materials?.map((material) => (
                      <div key={material.id} className="space-y-1">
                        <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 pt-1">
                          {material.title}
                        </div>
                        <div className="space-y-0.5">
                          {material.contents?.map((content) => (
                            <CourseOutlineItem
                              key={content.id}
                              id={content.id}
                              title={content.title}
                              type={content.type}
                              duration={content.duration}
                              isActive={content.id === selectedContentId}
                              onClick={() => onSelectContent(content.id)}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
