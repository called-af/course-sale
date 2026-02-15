<?php

namespace App\Http\Controllers;

use App\Http\Requests\Category\StoreCategoryRequest;
use App\Http\Requests\Category\UpdateCategoryRequest;
use App\Models\Category;
use App\Services\CategoryService;
use Illuminate\Http\RedirectResponse;

class CategoryController extends Controller
{
    public function __construct(
        protected CategoryService $categoryService
    ) {}

    public function store(StoreCategoryRequest $request): RedirectResponse
    {
        $this->categoryService->create(
            $request->validated()
        );

        return back()->with('success', 'Category berhasil dibuat');
    }

    public function update(
        UpdateCategoryRequest $request,
        Category $category
    ): RedirectResponse {
        $this->categoryService->update(
            $category,
            $request->validated()
        );

        return back()->with('success', 'Category berhasil diperbarui');
    }

    public function destroy(Category $category): RedirectResponse
    {
        $this->categoryService->delete($category);

        return back()->with('success', 'Category berhasil dihapus');
    }
}