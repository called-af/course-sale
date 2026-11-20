<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Course;
use App\Models\LandingSetting;
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

        // Only load data for sections that are actually visible. This keeps the
        // landing payload small as the catalogue and certificate table grow.
        return Inertia::render('landing/page', [
            'courses' => LandingSetting::visible(LandingSetting::SECTION_COURSES)
                ? Course::where('status', 'published')
                    ->with('creator', 'categories')
                    ->latest()
                    ->take($landing->courseLimit())
                    ->get()
                    ->append(['thumbnail_url'])
                : [],

            'categories' => LandingSetting::visible(LandingSetting::SECTION_CAREER)
                ? Category::all()
                : [],

            'testimonials' => LandingSetting::visible(LandingSetting::SECTION_TESTIMONIAL)
                ? $landing->testimonials()
                : [],

            'instructors' => LandingSetting::visible(LandingSetting::SECTION_INSTRUCTOR)
                ? $landing->instructors()
                : [],

            'certificates' => LandingSetting::visible(LandingSetting::SECTION_CERTIFICATE)
                ? $landing->certificates()
                : [],

            // Used by the clearly-labelled sample before any certificate exists.
            'certificateTemplate' => LandingSetting::visible(LandingSetting::SECTION_CERTIFICATE)
                ? $landing->globalCertificateTemplate()
                : [],
        ]);
    }
}
