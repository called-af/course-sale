<?php

namespace App\Http\Controllers;

use App\Http\Requests\Tag\StoreTagRequest;
use App\Http\Requests\Tag\UpdateTagRequest;
use App\Models\Tag;
use App\Services\TagService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class TagController extends Controller
{
    public function __construct(
        protected TagService $tagService
    ) {}

    public function index(): Response
    {
        $this->authorize('viewAny', Tag::class);

        return Inertia::render('admin/tag/page', [
            'tags' => Tag::withCount('courses')->latest()->get(),
        ]);
    }

    public function store(StoreTagRequest $request): RedirectResponse
    {
        $this->tagService->create(
            $request->validated()
        );

        return back()->with('success', 'Tag created successfully.');
    }

    public function update(
        UpdateTagRequest $request,
        Tag $tag
    ): RedirectResponse {
        $this->tagService->update(
            $tag,
            $request->validated()
        );

        return back()->with('success', 'Tag updated successfully.');
    }

    public function destroy(Tag $tag): RedirectResponse
    {
        $this->authorize('delete', $tag);
        $this->tagService->delete($tag);

        return back()->with('success', 'Tag deleted successfully.');
    }
}
