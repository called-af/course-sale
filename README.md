# KursusIO — E-Learning Platform with Hybrid ML Recommendation Engine

KursusIO is a modern, full-featured online learning management and course marketplace platform built on **Laravel 12**, **Inertia.js (React 19 & TypeScript)**, and a dedicated **Python FastAPI Machine Learning Microservice**.

The platform provides comprehensive course authoring, interactive curriculum delivery, quiz assessments, role-based workflows (Admin, Instructor, Student), implicit user behavioral tracking, and a resilient, hybrid AI recommendation engine with automatic native fallback.

---

## Table of Contents

- [System Architecture](#system-architecture)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation and Setup](#installation-and-setup)
- [Recommendation Engine & ML Subsystem](#recommendation-engine--ml-subsystem)
- [Environment Configuration](#environment-configuration)
- [Development and Execution](#development-and-execution)
- [Testing and Benchmarking](#testing-and-benchmarking)
- [Artisan CLI Commands Reference](#artisan-cli-commands-reference)
- [FastAPI Microservice Endpoints](#fastapi-microservice-endpoints)
- [Directory Structure](#directory-structure)
- [License](#license)

---

## System Architecture

KursusIO adopts a service-oriented hybrid architecture:

```
                                    +-----------------------------------------+
                                    |         Client Browser (SPA)            |
                                    |    React 19, TypeScript, Tailwind CSS   |
                                    +--------------------+--------------------+
                                                         |
                                                         | Inertia.js / HTTPS
                                                         v
                                    +-----------------------------------------+
                                    |          Laravel Core Engine            |
                                    |       Controllers, Services, Auth       |
                                    +---------+---------------+---------------+
                                              |               |
               +------------------------------+               +-------------------------------+
               |                                                                              |
               v                                                                              v
+-----------------------------+                                                +-----------------------------+
|    MySQL / Database         |                                                |   Redis Cache & Queues      |
|  - Users, Roles             |                                                |  - Recommendation Cache     |
|  - Courses, Modules, Quizzes|                                                |  - User Event Pipeline      |
|  - User Events & Progress   |                                                |  - Session Storage          |
+--------------+--------------+                                                +-----------------------------+
               |
               | CSV Export Pipeline
               v
+------------------------------------------------------------------------------------------------------------+
|                                Python ML Microservice (FastAPI)                                             |
|                                                                                                            |
|   +--------------------------+    +----------------------------+    +----------------------------------+   |
|   | Implicit ALS Factorizer  |    | Item-Item Cosine Similarity|    | Content-Based Tag Matrix Engine  |   |
|   +--------------------------+    +----------------------------+    +----------------------------------+   |
|                                                                                                            |
|   - Offline Training (ml/train.py)                                                                         |
|   - Offline Precision & Recall Benchmarking (ml/evaluate.py)                                               |
|   - Real-time Inference API (app/main.py -> port 8001)                                                     |
+------------------------------------------------------------------------------------------------------------+
```

---

## Key Features

### 1. Course Management & Curriculum Authoring
- Structured multi-tier curriculum hierarchy: **Course -> Modules -> Materials**.
- Support for rich text content, reading time estimates, video material integration, and downloadable resources.
- Publishing and review lifecycle: `draft` -> `review` -> `published` / `archived`.
- Dynamic course categorization and multi-tag tagging for granular search discovery and recommendation scoring.

### 2. Interactive Assessment & Quiz System
- Module-level and course-level quizzes with multiple-choice questions and instant automated grading.
- Student attempt history tracking with scoring metadata persisted for analytics.

### 3. Role-Based Access Control (RBAC)
- **Admin**: System-wide analytics, instructor application approval, course publication gating, revenue monitoring.
- **Instructor**: Course builder, material manager, curriculum organizer, enrollment tracking, revenue earnings dashboard.
- **Student**: Course catalog discovery, free and paid enrollment, progress tracking, resume learning functionality, personalized course feeds.

### 4. Behavioral Event Tracking Pipeline
- Real-time tracking of granular student actions via `UserEvent`:
  - `course_view`: Course detail page visits.
  - `course_enroll`: Direct course enrollments.
  - `material_view`: Lesson reading / video view events.
  - `material_complete`: Completed materials.
  - `quiz_attempt`: Quiz submissions with score payload.
  - `quiz_complete`: Successful quiz completion.

### 5. Resilient Hybrid Recommendation Subsystem
- **Master Feature Switch**: Complete on/off toggle via configuration without template breakage.
- **Driver Flexibility**: Supports both `python` (microservice) and `laravel` (native PHP) execution drivers.
- **Automatic Fallback Mechanism**: If the Python FastAPI service is offline, unresponsive, or experiencing timeouts, the Laravel client automatically falls back to the native PHP Content-Based and Popularity filtering engine without user disruption.
- **Two-Tier Caching**: User recommendations are cached in Redis with dynamic invalidation upon significant learning events.

---

## Technology Stack

### Backend
- **Framework**: Laravel 12
- **Language**: PHP 8.2+
- **Database**: MySQL / MariaDB (SQLite supported for testing)
- **Cache & Queue**: Redis (via `phpredis` extension or Predis)
- **Authentication**: Laravel Session Auth with Role Middleware

### Frontend
- **Framework**: React 19 with TypeScript
- **Adapter**: Inertia.js 2.0
- **Styling**: Tailwind CSS 4, Motion (Framer Motion)
- **Icons**: Lucide React
- **Rich Editor**: Slate.js
- **Tooling**: Vite 7

### Machine Learning & Microservice
- **Framework**: FastAPI (ASGI) with Uvicorn
- **Language**: Python 3.12
- **Data Processing**: Pandas, NumPy, SciPy
- **Algorithms**: Implicit (Alternating Least Squares), Scikit-Learn (Cosine Similarity, Matrix Factorization)
- **Testing**: Pytest, HTTPX

---

## Prerequisites

Ensure the following dependencies are installed on your environment:

- **PHP** >= 8.2 with extensions: `pdo`, `pdo_mysql`, `mbstring`, `openssl`, `curl`, `redis`
- **Composer** >= 2.6
- **Node.js** >= 20.x & **NPM** >= 10.x
- **Python** >= 3.12 with `python3-venv`
- **Redis Server** >= 6.x
- **MySQL** >= 8.0 or MariaDB >= 10.5

---

## Installation and Setup

### 1. Clone the Repository

```bash
git clone <repository-url> course-sale
cd course-sale
```

### 2. Configure Laravel Environment

Copy the example environment file and generate the application key:

```bash
cp .env.example .env
composer install
php artisan key:generate
```

Configure your database and Redis parameters inside `.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=course_sale
DB_USERNAME=root
DB_PASSWORD=your_password

CACHE_STORE=redis
QUEUE_CONNECTION=redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

### 3. Run Database Migrations and Seeders

```bash
php artisan migrate --seed
```

### 4. Setup Frontend Dependencies

```bash
npm install
npm run build
```

### 5. Setup Python ML Recommendation Microservice

Create a virtual environment and install the required machine learning packages:

```bash
cd recommendation-service
python3 -m venv venv
./venv/bin/pip install --upgrade pip
./venv/bin/pip install -r requirements.txt
cd ..
```

### 6. Initialize ML Model Artifacts

Export the seed datasets from Laravel and train the initial Python model:

```bash
php artisan recommendation:export
php artisan recommendation:train
```

---

## Recommendation Engine & ML Subsystem

The recommendation engine is built in progressive phases adhering to machine learning best practices:

### 1. Configuration (`config/recommendation.php`)

```php
return [
    'enabled' => env('RECOMMENDATION_ENABLED', true),
    'driver' => env('RECOMMENDATION_DRIVER', 'python'), // 'python' or 'laravel'
    'cache_ttl' => (int) env('RECOMMENDATION_CACHE_TTL', 7200),
    'python' => [
        'url' => env('RECOMMENDATION_PYTHON_URL', 'http://127.0.0.1:8001'),
        'timeout' => (float) env('RECOMMENDATION_PYTHON_TIMEOUT', 2.0),
        'retry' => (int) env('RECOMMENDATION_PYTHON_RETRY', 1),
        'fallback_to_laravel' => env('RECOMMENDATION_FALLBACK_TO_LARAVEL', true),
    ],
];
```

### 2. Driver Modes

| Driver Mode | Primary Engine | Fallback Behavior | Use Case |
| :--- | :--- | :--- | :--- |
| `python` | FastAPI ALS & Cosine Similarity | Automatic fallback to Laravel PHP Content-Based + Popularity engine if offline | Production & ML-enabled environments |
| `laravel` | Native PHP Tag Filtering & Popularity | N/A (Fully self-contained within PHP) | Standalone deployments without Python runtime |
| `disabled` (`ENABLED=false`) | None (Returns `[]`) | N/A | Maintenance or minimalist UI requirements |

### 3. Model Training Pipeline

Training executes offline to prevent inference degradation:

1. **Export Interaction Matrix**: `php artisan recommendation:export` dumps `events.csv`, `user_item_matrix.csv`, and `courses.csv` into `storage/app/ml/`.
2. **Train Model**: `php artisan recommendation:train` runs `recommendation-service/ml/train.py`, fitting the ALS factorizer and tag cosine similarity matrix, saving the serialized artifact to `recommendation-service/models/recommender_model.pkl`.
3. **Offline Benchmark**: `php artisan recommendation:evaluate` benchmarks Precision@K, Recall@K, HitRate@K, and MRR@K across all candidate algorithms.

---

## Environment Configuration

Key environment variables available in `.env`:

```env
# Application Details
APP_NAME="KursusIO"
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost:8000

# Database Configuration
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=course_sale
DB_USERNAME=root
DB_PASSWORD=

# Cache & Queues
CACHE_STORE=redis
QUEUE_CONNECTION=redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Recommendation Engine
RECOMMENDATION_ENABLED=true
RECOMMENDATION_DRIVER=python
RECOMMENDATION_PYTHON_URL=http://127.0.0.1:8001
RECOMMENDATION_PYTHON_TIMEOUT=2.0
RECOMMENDATION_FALLBACK_TO_LARAVEL=true
RECOMMENDATION_CACHE_TTL=7200
```

---

## Development and Execution

To run the complete system locally, run the following processes:

### Option A: Standard Multi-Terminal Setup

**Terminal 1 — Laravel Application Server:**
```bash
php artisan serve --port=8000
```

**Terminal 2 — Vite Asset Compiler:**
```bash
npm run dev
```

**Terminal 3 — Background Queue Worker:**
```bash
php artisan queue:listen --tries=1
```

**Terminal 4 — Python ML Microservice:**
```bash
cd recommendation-service
./venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```

### Option B: Unified Concurrently Runner

The repository includes a predefined composer script to run Laravel, Queue, Logs, and Vite in a single terminal:

```bash
composer run dev
```

*(Note: Start the Python FastAPI service in a separate terminal if `RECOMMENDATION_DRIVER=python`).*

---

## Testing and Benchmarking

### 1. Run Laravel Test Suite

Runs all Unit and Feature tests (including recommendation fallback tests):

```bash
php artisan test
```

### 2. Run Python FastAPI Test Suite

Runs all test client assertions for recommendation endpoints:

```bash
cd recommendation-service
./venv/bin/pytest
cd ..
```

### 3. Run Recommendation Benchmark Evaluation

Calculates offline ranking metrics comparing Popularity, Content-Based, Item-Item Cosine Similarity, and ALS Factorization:

```bash
php artisan recommendation:evaluate
```

---

## Artisan CLI Commands Reference

| Command | Description |
| :--- | :--- |
| `php artisan recommendation:status` | Inspects system toggles, verifies Python API connectivity, and displays real-time inference latency. |
| `php artisan recommendation:stats` | Analyzes event distribution, matrix sparsity, and gate-check readiness for collaborative filtering. |
| `php artisan recommendation:export` | Exports raw interaction logs and catalog data to CSV format for ML ingestion. |
| `php artisan recommendation:train` | Runs the end-to-end dataset export and offline Python model retraining. |
| `php artisan recommendation:evaluate` | Computes Precision@K, Recall@K, HitRate@K, and MRR@K metrics. |
| `php artisan recommendation:seed-events` | Seeds synthetic user interactions for load testing and algorithmic validation. |

---

## FastAPI Microservice Endpoints

When running on `http://127.0.0.1:8001`:

| Method | Path | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Service health status and API version metadata. |
| `GET` | `/api/v1/health` | Diagnostic status checking model load status and catalog size. |
| `POST` | `/course` | Core inference endpoint accepting `{user_id, limit}` and returning `{course_ids, scores}`. |
| `GET` | `/api/v1/recommendations/user/{user_id}` | Returns ranked course recommendations for an authenticated user. |
| `GET` | `/api/v1/recommendations/guest` | Returns popularity-based recommendations for unauthenticated guests. |
| `POST` | `/api/v1/recommend` | RESTful POST wrapper for user course recommendations. |

Interactive OpenAPI documentation is accessible at `http://127.0.0.1:8001/docs`.

---

## Directory Structure

```
course-sale/
|-- app/
|   |-- Console/Commands/              # Custom Artisan management commands
|   |-- Http/Controllers/              # Web & API controllers
|   |-- Http/Middleware/               # Role & Inertia request middleware
|   |-- Models/                        # Eloquent models (Course, User, UserEvent, etc.)
|   `-- Services/
|       |-- RecommendationService.php  # Core recommendation consumer & fallback engine
|       |-- EventTrackingService.php   # Student interaction tracker
|       `-- DashboardService.php       # Role-specific analytics aggregator
|-- config/
|   `-- recommendation.php             # Recommendation engine configuration
|-- database/
|   |-- factories/                     # Eloquent model factories
|   |-- migrations/                    # Database schema migrations
|   `-- seeders/                       # Default roles, users, and catalog seeders
|-- recommendation-service/            # Python ML FastAPI Microservice
|   |-- app/
|   |   |-- api/recommend.py           # FastAPI recommendation endpoints
|   |   |-- main.py                    # FastAPI application initialization
|   |   `-- schemas.py                 # Pydantic request & response models
|   |-- ml/
|   |   |-- data/build_matrix.py       # Matrix aggregation utility
|   |   |-- evaluate.py                # Precision@K & Recall@K benchmark script
|   |   `-- train.py                   # ALS & Cosine similarity training script
|   |-- models/                        # Serialized ML model artifacts (.pkl)
|   |-- tests/                         # Pytest test suite
|   `-- requirements.txt               # Python package dependencies
|-- resources/
|   |-- js/                            # Inertia React 19 SPA frontend
|   |   |-- components/                # Reusable UI component library
|   |   |-- layouts/                   # Layout wrappers
|   |   `-- pages/                     # Inertia view pages (Admin, Course, Dashboard)
|   `-- css/                           # Tailwind CSS stylesheet entrypoints
|-- routes/
|   `-- web.php                        # Application web and catalog routes
|-- storage/app/ml/                    # Exported CSV interaction datasets
|-- tests/                             # PHPUnit & Pest test suites
|-- task.md                            # Recommendation system development roadmap
`-- README.md                          # Platform documentation
```

---

## License

This software is open-sourced under the [MIT License](LICENSE).
