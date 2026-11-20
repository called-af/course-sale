<?php

namespace App\Services;

use App\Models\Course;
use App\Models\Material;
use App\Models\MaterialContent;
use App\Models\Module;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class CourseStructureService
{
    public function ensureModuleBelongsToCourse(Course $course, Module $module): void
    {
        $this->ensure($module->course_id === $course->id);
    }

    public function ensureMaterialBelongsToModule(Module $module, Material $material): void
    {
        $this->ensure($material->module_id === $module->id);
    }

    public function ensureContentBelongsToMaterial(Material $material, MaterialContent $content): void
    {
        $this->ensure($content->material_id === $material->id);
    }

    public function ensureMaterialHierarchy(Course $course, Module $module, Material $material): void
    {
        $this->ensureModuleBelongsToCourse($course, $module);
        $this->ensureMaterialBelongsToModule($module, $material);
    }

    public function ensureContentHierarchy(Course $course, Module $module, Material $material, MaterialContent $content): void
    {
        $this->ensureMaterialHierarchy($course, $module, $material);
        $this->ensureContentBelongsToMaterial($material, $content);
    }

    protected function ensure(bool $condition): void
    {
        if (! $condition) {
            throw new NotFoundHttpException;
        }
    }
}
