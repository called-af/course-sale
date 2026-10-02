<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Course;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class LandingController extends Controller
{
    public function show()
    {
        if (Auth::check()) {
            return redirect()->route('home.redirect');
        }

        return Inertia::render('landing/page', [
            'courses' => Course::where('status', 'published')
                ->with('creator', 'categories')
                ->latest()
                ->take(8)
                ->get()
                ->append(['thumbnail_url']),

            'categories' => Category::all(),
        ]);
    }
}
