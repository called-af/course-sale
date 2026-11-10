<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Course;
use App\Services\LandingService;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class LandingController extends Controller
{
    public function show(LandingService $landing)
    {
        if (Auth::check() && Auth::user()->role !== 'admin') {
            return redirect()->route('home.redirect');
        }

        return Inertia::render('landing/page', [
            'courses' => Course::where('status', 'published')
                ->with('creator', 'categories')
                ->latest()
                ->take($landing->courseLimit())
                ->get()
                ->append(['thumbnail_url']),

            'categories' => Category::all(),

            'testimonials' => $landing->testimonials(),
        ]);
    }
}
