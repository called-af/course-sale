import os
import pandas as pd
import numpy as np
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
ML_DATA_DIR = BASE_DIR.parent / "storage" / "app" / "ml"

EVENT_WEIGHTS = {
    'course_enroll': 5.0,
    'quiz_complete': 4.0,
    'material_complete': 4.0,
    'quiz_attempt': 3.0,
    'material_view': 2.0,
    'course_view': 1.0,
}


def build_user_item_matrix(data_dir: Path = ML_DATA_DIR) -> pd.DataFrame:
    events_file = data_dir / "events.csv"
    courses_file = data_dir / "courses.csv"
    output_matrix_file = data_dir / "user_item_matrix.csv"

    if not events_file.exists():
        raise FileNotFoundError(f"events.csv not found at {events_file}")

    events_df = pd.read_csv(events_file)
    events_df = events_df.dropna(subset=['user_id', 'course_id'])
    events_df['user_id'] = events_df['user_id'].astype(int)
    events_df['course_id'] = events_df['course_id'].astype(int)

    # Calculate weighted interaction
    events_df['weight'] = events_df['event_type'].map(lambda x: EVENT_WEIGHTS.get(x, 1.0))
    
    # Aggregate weights per user-course pair
    aggregated = events_df.groupby(['user_id', 'course_id'])['weight'].sum().reset_index()
    aggregated.rename(columns={'weight': 'implicit_weight'}, inplace=True)

    # Save to user_item_matrix.csv
    aggregated.to_csv(output_matrix_file, index=False)
    print(f"Matrix built with {len(aggregated)} user-course interactions saved to {output_matrix_file}")
    return aggregated


if __name__ == '__main__':
    build_user_item_matrix()