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

        return Inertia::render('welcome', [
            'courses' => Course::where('status', 'published')
                ->with('creator', 'categories')
                ->latest()
                ->take(8)
                ->get(),

            'categories' => Category::all(),
        ]);
    }
}
