import os
import pickle
from pathlib import Path
from typing import List, Optional
import pandas as pd
import numpy as np
from fastapi import APIRouter, HTTPException, Query

os.environ["OPENBLAS_NUM_THREADS"] = "1"

from app.schemas import (
    RecommendationCourseItem,
    RecommendationResponse,
    CourseRecommendationRequest,
    CourseRecommendationResponse,
    HealthResponse
)

router = APIRouter(tags=["recommendations"])

BASE_DIR = Path(__file__).resolve().parent.parent.parent
MODEL_PATH = BASE_DIR / "models" / "recommender_model.pkl"
ML_DATA_DIR = BASE_DIR.parent / "storage" / "app" / "ml"

_model_cache = None


def get_model():
    global _model_cache
    if _model_cache is not None:
        return _model_cache

    if MODEL_PATH.exists():
        try:
            with open(MODEL_PATH, "rb") as f:
                _model_cache = pickle.load(f)
                return _model_cache
        except Exception as e:
            print(f"[ERROR] Failed to load model from {MODEL_PATH}: {e}")

    # Fallback to direct training if model file does not exist
    try:
        from ml.train import train_and_save_model
        if train_and_save_model(ML_DATA_DIR, BASE_DIR / "models"):
            with open(MODEL_PATH, "rb") as f:
                _model_cache = pickle.load(f)
                return _model_cache
    except Exception as e:
        print(f"[WARN] On-demand training failed: {e}")

    return None


def generate_recommendations_for_user(user_id: Optional[int], limit: int = 6) -> RecommendationResponse:
    model = get_model()
    if not model:
        return RecommendationResponse(
            user_id=user_id,
            course_ids=[],
            scores=[],
            recommendations=[],
            source="empty_no_model",
            count=0
        )

    courses_df = model.get("courses_df", pd.DataFrame())
    course_ids = model.get("course_ids", [])
    course_to_idx = model.get("course_to_idx", {})
    content_sim = model.get("content_sim", None)
    user_item_matrix = model.get("user_item_matrix", None)
    pop_scores = model.get("pop_scores", {})

    # Unauthenticated / Guest or Cold start
    if user_id is None:
        sorted_pop = sorted(pop_scores.items(), key=lambda x: x[1], reverse=True)
        items: List[RecommendationCourseItem] = []
        c_ids: List[int] = []
        scores: List[float] = []

        for cid, score in sorted_pop[:limit]:
            course_row = courses_df[courses_df['course_id'] == cid]
            tags = []
            if not course_row.empty and pd.notna(course_row.iloc[0].get('tag_names')):
                tags = [t.strip() for t in str(course_row.iloc[0]['tag_names']).split('|') if t.strip()][:3]

            item = RecommendationCourseItem(
                course_id=int(cid),
                score=round(float(score), 2),
                reason="Popular with students this month",
                matching_tags=tags
            )
            items.append(item)
            c_ids.append(item.course_id)
            scores.append(item.score)

        return RecommendationResponse(
            user_id=None,
            course_ids=c_ids,
            scores=scores,
            recommendations=items,
            source="popularity_guest",
            count=len(items)
        )

    interacted_cids = set()
    user_course_weights = {}

    if user_item_matrix is not None and user_id in user_item_matrix.index:
        user_row = user_item_matrix.loc[user_id]
        active_interactions = user_row[user_row > 0]
        interacted_cids = set(active_interactions.index.tolist())
        user_course_weights = active_interactions.to_dict()

    # If cold-start user
    if not user_course_weights:
        guest_recs = generate_recommendations_for_user(None, limit=limit)
        return RecommendationResponse(
            user_id=user_id,
            course_ids=guest_recs.course_ids,
            scores=guest_recs.scores,
            recommendations=guest_recs.recommendations,
            source="popularity_cold_start",
            count=guest_recs.count
        )

    # Collaborative & Content-Based Hybrid Scoring
    candidate_scores = {}
    matching_tags_map = {}

    for cid in course_ids:
        if cid in interacted_cids:
            continue

        idx = course_to_idx.get(cid)
        if idx is None or content_sim is None:
            continue

        total_sim_score = 0.0
        for inter_cid, weight in user_course_weights.items():
            inter_idx = course_to_idx.get(inter_cid)
            if inter_idx is not None:
                sim = content_sim[idx, inter_idx]
                total_sim_score += sim * float(weight)

        base_pop = pop_scores.get(cid, 0.0) * 0.1
        final_score = total_sim_score + base_pop

        course_row = courses_df[courses_df['course_id'] == cid]
        tags = []
        if not course_row.empty and pd.notna(course_row.iloc[0].get('tag_names')):
            tags = [t.strip() for t in str(course_row.iloc[0]['tag_names']).split('|') if t.strip()][:3]

        candidate_scores[cid] = final_score
        matching_tags_map[cid] = tags

    sorted_candidates = sorted(candidate_scores.items(), key=lambda x: x[1], reverse=True)

    items: List[RecommendationCourseItem] = []
    c_ids: List[int] = []
    scores: List[float] = []

    for cid, score in sorted_candidates[:limit]:
        tags = matching_tags_map.get(cid, [])
        reason = f"Based on your interest in {', '.join(tags)}" if tags else "Personalized for your learning path"
        item = RecommendationCourseItem(
            course_id=int(cid),
            score=round(float(score), 2),
            reason=reason,
            matching_tags=tags
        )
        items.append(item)
        c_ids.append(item.course_id)
        scores.append(item.score)

    # Backfill with popular courses if needed
    if len(items) < limit:
        needed = limit - len(items)
        recommended_cids = {item.course_id for item in items}.union(interacted_cids)
        sorted_pop = sorted(pop_scores.items(), key=lambda x: x[1], reverse=True)
        
        for cid, pscore in sorted_pop:
            if cid not in recommended_cids:
                course_row = courses_df[courses_df['course_id'] == cid]
                tags = []
                if not course_row.empty and pd.notna(course_row.iloc[0].get('tag_names')):
                    tags = [t.strip() for t in str(course_row.iloc[0]['tag_names']).split('|') if t.strip()][:3]

                item = RecommendationCourseItem(
                    course_id=int(cid),
                    score=round(float(pscore), 2),
                    reason="Popular course backfill",
                    matching_tags=tags
                )
                items.append(item)
                c_ids.append(item.course_id)
                scores.append(item.score)
                recommended_cids.add(cid)
                if len(items) >= limit:
                    break

    return RecommendationResponse(
        user_id=user_id,
        course_ids=c_ids,
        scores=scores,
        recommendations=items,
        source="python_collaborative_content_hybrid",
        count=len(items)
    )


# Task.md Phase 4 Requirement: POST /course {user_id, limit} -> {course_ids, scores}
@router.post("/course", response_model=CourseRecommendationResponse)
def post_course_recommendation(payload: CourseRecommendationRequest):
    result = generate_recommendations_for_user(user_id=payload.user_id, limit=payload.limit)
    return CourseRecommendationResponse(
        course_ids=result.course_ids,
        scores=result.scores,
        recommendations=result.recommendations,
        source=result.source,
        count=result.count
    )


# RESTful API Endpoints
@router.get("/api/v1/health", response_model=HealthResponse)
def health_check():
    model = get_model()
    if model:
        return HealthResponse(
            status="ok",
            engine="Python ML Hybrid Recommender (ALS & Item-Item CF)",
            model_loaded=True,
            total_courses_in_catalog=len(model.get("course_ids", [])),
            total_users_in_matrix=len(model.get("user_ids", []))
        )
    return HealthResponse(
        status="degraded",
        engine="Python ML Recommender (Model Not Loaded)",
        model_loaded=False,
        total_courses_in_catalog=0,
        total_users_in_matrix=0
    )


@router.get("/api/v1/recommendations/guest", response_model=RecommendationResponse)
def get_guest_recommendations(limit: int = Query(6, ge=1, le=50)):
    return generate_recommendations_for_user(user_id=None, limit=limit)


@router.get("/api/v1/recommendations/user/{user_id}", response_model=RecommendationResponse)
def get_user_recommendations(user_id: int, limit: int = Query(6, ge=1, le=50)):
    return generate_recommendations_for_user(user_id=user_id, limit=limit)


@router.post("/api/v1/recommend", response_model=RecommendationResponse)
def post_recommendations(payload: CourseRecommendationRequest):
    return generate_recommendations_for_user(user_id=payload.user_id, limit=payload.limit)