import pandas as pd

events = pd.read_csv("../storage/app/ml/events.csv")
courses = pd.read_csv("../storage/app/ml/courses.csv")
userItemMatrix = pd.read_csv("../storage/app/ml/user_item_matrix.csv", index_col=0)

def build_matrix():
    userItemMatrix = pd.DataFrame(index=events['user_id'].unique(), columns=courses['course_id'].unique())
    for index, row in events.iterrows():
        userItemMatrix.at[row['user_id'], row['course_id']] = 1
    userItemMatrix.fillna(0, inplace=True)
    userItemMatrix.to_csv("../storage/app/ml/user_item_matrix.csv")


print(userItemMatrix)