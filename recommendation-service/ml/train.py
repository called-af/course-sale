import os
import sys
import pickle
import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.metrics.pairwise import cosine_similarity

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
ML_DATA_DIR = BASE_DIR.parent / "storage" / "app" / "ml"
MODELS_DIR = BASE_DIR / "models"


def train_and_save_model(data_dir: Path = ML_DATA_DIR, models_dir: Path = MODELS_DIR):
    models_dir.mkdir(parents=True, exist_ok=True)
    
    courses_file = data_dir / "courses.csv"
    matrix_file = data_dir / "user_item_matrix.csv"
    events_file = data_dir / "events.csv"

    if not courses_file.exists():
        print(f"[WARN] Courses file not found at {courses_file}. Please run `php artisan recommendation:export` first.")
        return False

    print(f"Loading data from {data_dir}...")
    courses_df = pd.read_csv(courses_file)
    
    # 1. Build Item-Item Content / Tag Similarity Matrix
    tag_vectors = {}
    all_tags = set()
    for _, row in courses_df.iterrows():
        tags = str(row.get('tag_names', '')).split('|') if pd.notna(row.get('tag_names')) else []
        tag_set = {t.strip().lower() for t in tags if t.strip()}
        tag_vectors[row['course_id']] = tag_set
        all_tags.update(tag_set)
    
    tag_list = sorted(list(all_tags))
    tag_to_idx = {tag: i for i, tag in enumerate(tag_list)}
    
    course_ids = courses_df['course_id'].tolist()
    course_to_idx = {cid: i for i, cid in enumerate(course_ids)}
    
    # Content feature matrix (courses x tags)
    content_matrix = np.zeros((len(course_ids), len(tag_list))) if tag_list else np.zeros((len(course_ids), 1))
    for cid, tags in tag_vectors.items():
        if cid in course_to_idx:
            for t in tags:
                if t in tag_to_idx:
                    content_matrix[course_to_idx[cid], tag_to_idx[t]] = 1.0

    # Calculate item-item cosine similarity based on tags
    if content_matrix.shape[1] > 0 and np.any(content_matrix):
        content_sim = cosine_similarity(content_matrix)
    else:
        content_sim = np.eye(len(course_ids))

    # 2. Build User-Item Collaborative Matrix
    user_item_df = pd.DataFrame()
    user_item_matrix = None
    user_ids = []
    
    if matrix_file.exists() and os.path.getsize(matrix_file) > 0:
        user_item_df = pd.read_csv(matrix_file)
        if not user_item_df.empty and 'user_id' in user_item_df.columns and 'course_id' in user_item_df.columns:
            pivot = user_item_df.pivot_table(
                index='user_id',
                columns='course_id',
                values='implicit_weight',
                fill_value=0.0
            )
            user_ids = pivot.index.tolist()
            user_item_matrix = pivot

    # 3. Calculate Popularity Scores
    pop_scores = {}
    for _, row in courses_df.iterrows():
        cid = int(row['course_id'])
        rating = float(row.get('rating_avg', 0.0)) if pd.notna(row.get('rating_avg')) else 0.0
        pop_scores[cid] = rating

    if not user_item_df.empty and 'course_id' in user_item_df.columns:
        counts = user_item_df.groupby('course_id')['implicit_weight'].sum().to_dict()
        for cid, weight in counts.items():
            pop_scores[int(cid)] = pop_scores.get(int(cid), 0.0) + (weight * 1.5)

    # 4. Save Model Package
    model_data = {
        'courses_df': courses_df,
        'course_ids': course_ids,
        'course_to_idx': course_to_idx,
        'tag_list': tag_list,
        'content_sim': content_sim,
        'user_ids': user_ids,
        'user_item_matrix': user_item_matrix,
        'pop_scores': pop_scores,
    }

    model_path = models_dir / "recommender_model.pkl"
    with open(model_path, 'wb') as f:
        pickle.dump(model_data, f)

    print(f"Model successfully trained and saved to {model_path}!")
    print(f"Courses in catalog: {len(course_ids)}, Unique tags: {len(tag_list)}, Active users: {len(user_ids)}")
    return True


if __name__ == '__main__':
    train_and_save_model()
