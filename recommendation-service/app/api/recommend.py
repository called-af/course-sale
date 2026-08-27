from fastapi import FastAPI

app = FastAPI()


@app.get("/course/{user_id}")
def recommend_course(course_id: str, user_id: str):
  pass