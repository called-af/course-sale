from typing import List, Optional
from pydantic import BaseModel, Field


class RecommendationCourseItem(BaseModel):
    course_id: int = Field(..., description="ID of the recommended course")
    score: float = Field(..., description="Calculated recommendation score")
    reason: str = Field(..., description="Human-readable explanation for the recommendation")
    matching_tags: List[str] = Field(default_factory=list, description="Tags matching user preferences")


class CourseRecommendationRequest(BaseModel):
    user_id: Optional[int] = Field(None, description="User ID for personalized recommendations")
    limit: int = Field(6, ge=1, le=50, description="Maximum number of courses to return")


class CourseRecommendationResponse(BaseModel):
    course_ids: List[int] = Field(default_factory=list, description="List of recommended course IDs")
    scores: List[float] = Field(default_factory=list, description="Corresponding recommendation scores")
    recommendations: List[RecommendationCourseItem] = Field(default_factory=list, description="Detailed recommendation objects")
    source: str = Field(..., description="Recommendation algorithm source")
    count: int = Field(..., description="Number of recommendations returned")


class RecommendationResponse(BaseModel):
    user_id: Optional[int] = Field(None, description="User ID for whom recommendations were generated")
    course_ids: List[int] = Field(default_factory=list, description="List of recommended course IDs")
    scores: List[float] = Field(default_factory=list, description="Corresponding recommendation scores")
    recommendations: List[RecommendationCourseItem] = Field(default_factory=list, description="List of recommended courses")
    source: str = Field(..., description="Algorithm or source used: 'collaborative_filtering', 'content_based', 'popularity', etc.")
    count: int = Field(..., description="Number of recommendations returned")


class HealthResponse(BaseModel):
    model_config = {'protected_namespaces': ()}

    status: str = "ok"
    engine: str = "FastAPI Recommendation Service"
    model_loaded: bool = False
    total_courses_in_catalog: int = 0
    total_users_in_matrix: int = 0
