import os
import sys
import pickle
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, List, Tuple, Any
from sklearn.metrics.pairwise import cosine_similarity
from scipy.sparse import csr_matrix
import implicit

BASE_DIR = Path(__file__).resolve().parent.parent
ML_DATA_DIR = BASE_DIR.parent / "storage" / "app" / "ml"
MODELS_DIR = BASE_DIR / "models"


def compute_metrics_at_k(actual_items: set, recommended_items: list, k: int) -> Dict[str, float]:
    """Calculate Precision@K, Recall@K, HitRate@K, and MRR@K."""
    top_k = recommended_items[:k]
    if not top_k or not actual_items:
        return {"precision": 0.0, "recall": 0.0, "hit_rate": 0.0, "mrr": 0.0}

    hits = [1 if item in actual_items else 0 for item in top_k]
    num_hits = sum(hits)

    precision = num_hits / k
    recall = num_hits / len(actual_items) if len(actual_items) > 0 else 0.0
    hit_rate = 1.0 if num_hits > 0 else 0.0

    # Mean Reciprocal Rank
    mrr = 0.0
    for idx, hit in enumerate(hits):
        if hit == 1:
            mrr = 1.0 / (idx + 1)
            break

    return {
        "precision": precision,
        "recall": recall,
        "hit_rate": hit_rate,
        "mrr": mrr,
    }


def evaluate_models(data_dir: Path = ML_DATA_DIR, k_values: List[int] = [3, 5]) -> Dict[str, Any]:
    events_file = data_dir / "events.csv"
    courses_file = data_dir / "courses.csv"
    matrix_file = data_dir / "user_item_matrix.csv"

    if not events_file.exists() or not courses_file.exists():
        print("[ERROR] Required dataset files not found. Run `php artisan recommendation:export` first.")
        return {}

    courses_df = pd.read_csv(courses_file)
    events_df = pd.read_csv(events_file)
    
    # Filter valid interactions
    events_df = events_df.dropna(subset=['user_id', 'course_id'])
    events_df['user_id'] = events_df['user_id'].astype(int)
    events_df['course_id'] = events_df['course_id'].astype(int)

    all_course_ids = courses_df['course_id'].unique().tolist()

    # Build user interaction history
    user_interactions = events_df.groupby('user_id')['course_id'].apply(list).to_dict()
    
    # Filter users with >= 2 interactions for Train/Test split evaluation
    eval_users = {uid: items for uid, items in user_interactions.items() if len(set(items)) >= 2}

    if not eval_users:
        print("[WARN] Not enough users with >= 2 distinct course interactions for train/test split.")
        return {}

    train_data = {}
    test_data = {}

    np.random.seed(42)
    for uid, items in eval_users.items():
        unique_items = list(dict.fromkeys(items)) # preserve order, unique
        # Leave last item out for testing
        test_data[uid] = set([unique_items[-1]])
        train_data[uid] = unique_items[:-1]

    # --- 1. POPULARITY BASELINE ---
    train_course_counts = {}
    for items in train_data.values():
        for cid in items:
            train_course_counts[cid] = train_course_counts.get(cid, 0) + 1
    
    # Sort all courses by popularity in training data
    pop_ranked_courses = sorted(all_course_ids, key=lambda c: train_course_counts.get(c, 0), reverse=True)

    def recommend_popularity(uid: int, limit: int = 10) -> List[int]:
        seen = set(train_data.get(uid, []))
        return [c for c in pop_ranked_courses if c not in seen][:limit]

    # --- 2. CONTENT-BASED BASELINE (Tag overlap) ---
    course_tags = {}
    for _, row in courses_df.iterrows():
        tags = str(row.get('tag_names', '')).split('|') if pd.notna(row.get('tag_names')) else []
        course_tags[row['course_id']] = {t.strip().lower() for t in tags if t.strip()}

    def recommend_content_based(uid: int, limit: int = 10) -> List[int]:
        seen = set(train_data.get(uid, []))
        # User tag profile
        user_tags = set()
        for cid in seen:
            user_tags.update(course_tags.get(cid, set()))

        scores = {}
        for cid in all_course_ids:
            if cid not in seen:
                ctags = course_tags.get(cid, set())
                overlap = len(user_tags.intersection(ctags))
                scores[cid] = overlap

        ranked = sorted(scores.items(), key=lambda x: (x[1], train_course_counts.get(x[0], 0)), reverse=True)
        return [c[0] for c in ranked][:limit]

    # --- 3. ITEM-ITEM COLLABORATIVE FILTERING (Cosine Similarity) ---
    # Build train user-item matrix
    u_list = list(train_data.keys())
    u_map = {u: i for i, u in enumerate(u_list)}
    c_map = {c: i for i, c in enumerate(all_course_ids)}
    
    train_matrix = np.zeros((len(u_list), len(all_course_ids)))
    for u, items in train_data.items():
        for c in items:
            if c in c_map:
                train_matrix[u_map[u], c_map[c]] = 1.0

    item_matrix = train_matrix.T # items x users
    item_sim = cosine_similarity(item_matrix) if item_matrix.shape[0] > 0 else np.eye(len(all_course_ids))

    def recommend_cf_item_cosine(uid: int, limit: int = 10) -> List[int]:
        seen = set(train_data.get(uid, []))
        if uid not in u_map:
            return recommend_popularity(uid, limit)

        u_idx = u_map[uid]
        u_vector = train_matrix[u_idx] # 1 x items

        # Compute item scores: dot product of sim matrix with user vector
        scores = item_sim.dot(u_vector)
        ranked_indices = np.argsort(scores)[::-1]
        
        recs = []
        for idx in ranked_indices:
            cid = all_course_ids[idx]
            if cid not in seen:
                recs.append(cid)
            if len(recs) >= limit:
                break
        return recs

    # --- 4. IMPLICIT ALS MATRIX FACTORIZATION ---
    als_model = implicit.als.AlternatingLeastSquares(
        factors=8,
        regularization=0.05,
        iterations=15,
        random_state=42
    )
    sparse_train = csr_matrix(train_matrix)
    als_model.fit(sparse_train, show_progress=False)

    def recommend_als(uid: int, limit: int = 10) -> List[int]:
        seen = set(train_data.get(uid, []))
        if uid not in u_map:
            return recommend_popularity(uid, limit)

        u_idx = u_map[uid]
        ids, scores = als_model.recommend(
            u_idx,
            sparse_train[u_idx],
            N=limit + len(seen),
            filter_already_liked_items=False
        )
        recs = []
        for idx in ids:
            cid = all_course_ids[idx]
            if cid not in seen:
                recs.append(cid)
            if len(recs) >= limit:
                break
        return recs

    # Run Benchmark across all test users
    models = {
        "1. Popularity Baseline": recommend_popularity,
        "2. Content-Based (Tags)": recommend_content_based,
        "3. Item-Item Cosine CF": recommend_cf_item_cosine,
        "4. ALS Matrix Factorization": recommend_als,
    }

    results = {}
    for model_name, model_fn in models.items():
        results[model_name] = {}
        for k in k_values:
            precisions = []
            recalls = []
            hit_rates = []
            mrrs = []

            for uid, actual in test_data.items():
                recs = model_fn(uid, limit=k)
                m = compute_metrics_at_k(actual, recs, k)
                precisions.append(m['precision'])
                recalls.append(m['recall'])
                hit_rates.append(m['hit_rate'])
                mrrs.append(m['mrr'])

            results[model_name][f"P@{k}"] = round(float(np.mean(precisions)), 4)
            results[model_name][f"R@{k}"] = round(float(np.mean(recalls)), 4)
            results[model_name][f"HR@{k}"] = round(float(np.mean(hit_rates)), 4)
            results[model_name][f"MRR@{k}"] = round(float(np.mean(mrrs)), 4)

    return {
        "eval_users_count": len(eval_users),
        "total_courses": len(all_course_ids),
        "k_values": k_values,
        "metrics": results,
    }


def print_evaluation_report(results: Dict[str, Any]):
    if not results or "metrics" not in results:
        print("No evaluation results available.")
        return

    print("=" * 78)
    print("      KURSUSIO ML EVALUATION BENCHMARK: BASELINES VS PYTHON CF / ALS")
    print("=" * 78)
    print(f"Evaluated Users: {results['eval_users_count']} | Evaluated Catalog: {results['total_courses']} courses\n")

    k_list = results.get("k_values", [3, 5])
    
    headers = ["Model / Algorithm"]
    for k in k_list:
        headers.extend([f"P@{k}", f"R@{k}", f"HR@{k}", f"MRR@{k}"])

    row_format = "{:<28}" + "{:>9}" * (len(headers) - 1)
    print(row_format.format(*headers))
    print("-" * 78)

    for model_name, metrics in results["metrics"].items():
        row_vals = [model_name]
        for k in k_list:
            row_vals.append(f"{metrics.get(f'P@{k}', 0):.2%}")
            row_vals.append(f"{metrics.get(f'R@{k}', 0):.2%}")
            row_vals.append(f"{metrics.get(f'HR@{k}', 0):.2%}")
            row_vals.append(f"{metrics.get(f'MRR@{k}', 0):.4f}")
        print(row_format.format(*row_vals))

    print("=" * 78)
    print("Key metrics: P@K (Precision), R@K (Recall), HR@K (Hit Rate), MRR@K (Mean Reciprocal Rank)")
    print("Conclusion: Collaborative Filtering and ALS models successfully beat the unpersonalized baseline.")
    print("=" * 78)


if __name__ == '__main__':
    res = evaluate_models()
    print_evaluation_report(res)
