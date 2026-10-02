<?php

namespace App\Http\Controllers;

use App\Services\DashboardService;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(protected DashboardService $dashboardService) {}

    public function admin(): Response
    {
        return Inertia::render('admin/Dashboard', $this->dashboardService->adminData());
    }

    public function student(): Response
    {
        return Inertia::render('student/Dashboard', $this->dashboardService->studentData(Auth::user()));
    }

    public function instructor(): Response
    {
        return Inertia::render('student/Dashboard', $this->dashboardService->instructorData(Auth::user()));
    }
}
