from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from models.recommendation import HybridRecommender
from models.gemini_recommender import GeminiRecommender
from models.adaptive_quiz import QLearningQuiz
from models.sentiment import SentimentModel
from models.ui_adapter import QLearningUIAdapter
from models.performance_predictor import PerformancePredictor
import uvicorn
from config import ALLOWED_ORIGINS

app = FastAPI(title='Open Learn Hub AI Service')

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

recommender = HybridRecommender()
gemini_recommender = GeminiRecommender()
quiz_agent = QLearningQuiz()
sent_model = SentimentModel()
ui_adapter = QLearningUIAdapter()
performance_predictor = PerformancePredictor()


# -------------------------------
# Base Models
# -------------------------------

class RecommendIn(BaseModel):
    user_id: str
    enrolled_courses: list = []
    available_courses: list = []


class RecommendOut(BaseModel):
    recommendations: list


class NextIn(BaseModel):
    quiz_id: str
    last_answer: dict | None = None


class SentIn(BaseModel):
    text: str


@app.get('/')
async def root():
    return {"ok": True}


@app.get('/status')
async def status():
    """Check AI service status"""
    gemini_status = gemini_recommender.enabled
    if gemini_status:
        is_connected, message = gemini_recommender.test_connection()
        return {
            "service": "running",
            "gemini_enabled": gemini_status,
            "gemini_connection": is_connected,
            "message": message
        }
    else:
        return {
            "service": "running",
            "gemini_enabled": False,
            "gemini_connection": False,
            "message": "Gemini API not configured"
        }


# ---------------------------------------------------
# RECOMMENDATION
# ---------------------------------------------------

@app.post('/recommend', response_model=RecommendOut)
async def recommend(payload: RecommendIn):
    """AI-powered course recommendation"""
    try:
        recommendations = gemini_recommender.get_recommendations(
            enrolled_courses=payload.enrolled_courses,
            available_courses=payload.available_courses,
            top_k=3
        )
        return {"recommendations": recommendations}
    except Exception as e:
        print(f"Recommendation error: {e}")
        return {"recommendations": []}


# ---------------------------------------------------
# ADAPTIVE QUIZ
# ---------------------------------------------------

@app.post('/adaptive-quiz/next')
async def adaptive_next(payload: NextIn):
    bank = [
        {"id": "q1", "prompt": "2+2?", "difficulty": 1},
        {"id": "q2", "prompt": "Derivative of x^2?", "difficulty": 3},
        {"id": "q3", "prompt": "Prove NP!=P?", "difficulty": 5}
    ]
    level = 3
    if payload.last_answer:
        level = quiz_agent.next_level(level, bool(payload.last_answer.get('correct')))
    q = quiz_agent.select_question(bank, level)
    return {"level": level, "question": q}


# ---------------------------------------------------
# SENTIMENT
# ---------------------------------------------------

class MoodAnalysisIn(BaseModel):
    text: str
    engagement_score: float | None = None


class ChatIn(BaseModel):
    message: str
    conversation_history: list = []


@app.post('/sentiment')
async def sentiment(payload: SentIn):
    res = sent_model.infer(payload.text)
    theme = "bright" if res["label"] == "positive" else ("dark" if res["label"] == "negative" else "calm")
    return {"sentiment": res, "theme": theme}


@app.post('/analyze-mood')
async def analyze_mood(payload: MoodAnalysisIn):
    sentiment_result = sent_model.infer(payload.text)
    mood = ui_adapter.analyze_mood_from_sentiment(
        sentiment_result['label'],
        sentiment_result['polarity']
    )
    ui_config = ui_adapter.get_ui_config(mood, payload.engagement_score)

    return {
        "sentiment": sentiment_result,
        "mood": mood,
        "ui_config": ui_config
    }


# ---------------------------------------------------
# CHAT ASSISTANT
# ---------------------------------------------------

@app.post('/chat')
async def chat(payload: ChatIn):
    """
    Chat with Gemini AI assistant for learning support
    """
    try:
        print(f"Chat request received: {payload.message[:100]}...")
        print(f"Gemini recommender enabled: {gemini_recommender.enabled}")

        if not gemini_recommender.enabled:
            return {
                "response": "I'm currently in offline mode. Here are some tips:\n\n"
                            "- Explore courses in different categories\n"
                            "- Complete quizzes to test your knowledge\n"
                            "- Use the discussion forum\n"
                            "- Track your progress on the dashboard\n\n"
                            "What would you like to know more about?"
            }

        system_context = (
            "You are a helpful AI learning assistant for Open Learn Hub, an online learning platform.\n"
            "Your role is to:\n"
            "- Help students find courses\n"
            "- Answer learning strategy questions\n"
            "- Provide motivation\n"
            "- Explain platform features\n"
            "- Give study tips\n\n"
            "Be friendly, concise, and supportive. Keep responses under 150 words.\n\n"
            "Student's question: "
        )

        full_prompt = f"{system_context} {payload.message}\n\nAssistant:"

        response, error = gemini_recommender._call_with_retry(full_prompt)
        if error:
            raise error

        return {"response": response.text}

    except Exception as e:
        print(f"Chat error: {e}")
        # If the error message contains 429, it is likely a Gemini quota issue.
        if "429" in str(e):
            return {"response": "AI usage limit reached – please try again later."}
        return {
            "response": "I'm having trouble connecting right now. Please try again."
        }


# ---------------------------------------------------
# FLASHCARDS
# ---------------------------------------------------

class FlashcardGenIn(BaseModel):
    content: str
    count: int = 10


@app.post('/generate-flashcards')
async def generate_flashcards(payload: FlashcardGenIn):
    try:
        if not gemini_recommender.enabled:
            raise Exception("Gemini not available")

        prompt = (
            f"Generate exactly {payload.count} flashcards from the content.\n\n"
            f"Content:\n{payload.content[:2000]}\n\n"
            "Instructions:\n"
            "- Return ONLY valid JSON array\n"
            "- Format: [{\"question\": \"...\", \"answer\": \"...\"}]\n"
            "- No markdown, no explanations\n"
            "- Focus on testing understanding\n\n"
            "JSON array:"
        )

        response, error = gemini_recommender._call_with_retry(prompt)
        if error:
            raise error
        response_text = response.text.strip()

        if '```' in response_text:
            parts = response_text.split('```')
            for part in parts:
                part = part.strip()
                if part.startswith('[') and part.endswith(']'):
                    response_text = part
                    break

        import json
        flashcards = json.loads(response_text)

        formatted = []
        for fc in flashcards[:payload.count]:
            if isinstance(fc, dict) and 'question' in fc and 'answer' in fc:
                formatted.append({
                    "question": str(fc['question']),
                    "answer": str(fc['answer'])
                })

        if len(formatted) == 0:
            raise Exception("No valid flashcards")

        return {"flashcards": formatted}

    except Exception as e:
        print(f"Flashcard error: {e}")
        topic = payload.content.split()[:5]
        topic = ' '.join(topic)

        fallback = [
            {
                "question": f"What are the key concepts in {topic}?",
                "answer": "Review the main points in the content."
            },
            {
                "question": f"How would you explain {topic}?",
                "answer": "Break the concept into simple parts."
            },
            {
                "question": f"What is the practical use of {topic}?",
                "answer": "Think of real-world applications."
            }
        ]

        return {"flashcards": fallback[:payload.count]}


# ---------------------------------------------------
# NOTE SUMMARY
# ---------------------------------------------------

class NoteSummaryIn(BaseModel):
    content: str


@app.post('/generate-note-summary')
async def generate_note_summary(payload: NoteSummaryIn):
    try:
        if not gemini_recommender.enabled:
            raise Exception("Gemini not available")

        prompt = (
            "Summarize the following content into 2-3 bullet points.\n"
            "Focus on key ideas and takeaways.\n\n"
            "Content:\n"
            f"{payload.content[:3000]}\n\n"
            "Return ONLY bullet points. Start each with '-' or '*'."
        )

        response, error = gemini_recommender._call_with_retry(prompt)
        if error:
            raise error
        summary = response.text.strip()

        return {"summary": summary}

    except Exception:
        words = payload.content.split()[:100]
        preview = " ".join(words)

        fallback = (
            f"- Summary Topic: {preview[:50]}...\n"
            "- Key Points: Review main concepts\n"
            "- Action Items: Study and practice"
        )

        return {"summary": fallback}


# ---------------------------------------------------
# STUDY PLAN GENERATOR
# ---------------------------------------------------

class StudyPlanGenIn(BaseModel):
    goal: str
    available_hours: int
    target_date: str
    courses: list[str]


@app.post('/generate-study-plan')
async def generate_study_plan(payload: StudyPlanGenIn):
    try:
        if not gemini_recommender.enabled:
            raise Exception("Gemini not available")

        courses_list = ", ".join(payload.courses)

        prompt = f"""
Create a detailed study plan.

Goal: {payload.goal}
Available hours per week: {payload.available_hours}
Target date: {payload.target_date}
Courses: {courses_list}

Return ONLY JSON in this format:
{{
  "title": "...",
  "schedule": [...],
  "milestones": [...],
  "tips": [...]
}}
"""

        response, error = gemini_recommender._call_with_retry(prompt)
        if error:
            raise error
        raw = response.text.strip()

        if '```' in raw:
            parts = raw.split('```')
            for p in parts:
                p = p.strip()
                if p.startswith('{') and p.endswith('}'):
                    raw = p
                    break

        import json
        plan = json.loads(raw)

        return {"plan": plan}

    except Exception as e:
        print("Plan error:", e)

        fallback = {
            "title": f"{payload.goal} Study Plan",
            "schedule": [
                {
                    "day": "Monday",
                    "timeSlots": [
                        {
                            "startTime": "09:00",
                            "endTime": "11:00",
                            "activity": "Study",
                            "description": "Follow course content"
                        }
                    ]
                }
            ],
            "milestones": [
                {
                    "title": "Complete course material",
                    "dueDate": payload.target_date,
                    "description": "Finish main modules"
                }
            ],
            "tips": [
                "Study regularly",
                "Revise important topics",
                "Avoid distractions"
            ]
        }

        return {"plan": fallback}


# ---------------------------------------------------
# QUIZ GENERATOR
# ---------------------------------------------------

class QuizGenIn(BaseModel):
    course_title: str
    lesson_title: str
    lesson_content: str = ""
    num_questions: int = 5


@app.post('/generate-quiz')
async def generate_quiz(payload: QuizGenIn):
    try:
        if not gemini_recommender.enabled:
            raise Exception("Gemini unavailable")

        prompt = f"""
Generate {payload.num_questions} MCQ questions.

Course: {payload.course_title}
Lesson: {payload.lesson_title}
Content: {payload.lesson_content[:500]}

Return ONLY JSON array:
[
  {{
    "question": "...",
    "options": ["A","B","C","D"],
    "correctAnswer": 0
  }}
]
"""

        response, error = gemini_recommender._call_with_retry(prompt)
        if error:
            raise error
        raw = response.text.strip()

        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:].strip()

        import json
        data = json.loads(raw)

        cleaned = []
        for q in data[:payload.num_questions]:
            cleaned.append({
                "question": q["question"],
                "options": q["options"][:4],
                "correctAnswer": int(q["correctAnswer"])
            })

        return {"questions": cleaned}

    except Exception as e:
        print("Quiz error:", e)
        topic = payload.lesson_title

        fallback = [
            {
                "question": f"What is the main idea of {topic}?",
                "options": ["Concept", "Definition", "Example", "None"],
                "correctAnswer": 0
            }
        ]

        return {"questions": fallback}


# ---------------------------------------------------
# PERFORMANCE PREDICTION
# ---------------------------------------------------

class PerformanceAnalysisIn(BaseModel):
    progress: float = 0
    quiz_average: float = 0
    completed_lessons: int = 0
    total_lessons: int = 1
    days_enrolled: int = 1
    watch_time_hours: float = 0
    quizzes_taken: int = 0
    avg_quiz_score: float = 0
    days_inactive: int = 0
    courses_enrolled: int = 1
    leaderboard_points: int = 0
    badges_earned: int = 0
    courses_completed: int = 0


@app.post('/predict-performance')
async def predict_performance(payload: PerformanceAnalysisIn):
    try:
        student_data = payload.dict()
        return performance_predictor.get_comprehensive_analysis(student_data)
    except Exception as e:
        print("Performance error:", e)
        return {
            "error": str(e),
            "dropout_risk": {"risk_level": "Unknown", "dropout_probability": 0.5},
            "grade_prediction": {"predicted_grade": 75, "letter_grade": "C"},
            "study_recommendations": {"recommended_hours_per_week": 10},
            "next_course_difficulty": {"recommended_difficulty": "Intermediate"}
        }


@app.post('/predict-dropout')
async def predict_dropout(payload: PerformanceAnalysisIn):
    try:
        return performance_predictor.predict_dropout_risk(payload.dict())
    except Exception as e:
        print("Dropout error:", e)
        return {"dropout_probability": 0.5, "risk_level": "Unknown", "error": str(e)}


@app.post('/predict-grade')
async def predict_grade(payload: PerformanceAnalysisIn):
    try:
        return performance_predictor.predict_final_grade(payload.dict())
    except Exception as e:
        print("Grade error:", e)
        return {"predicted_grade": 75, "letter_grade": "C", "error": str(e)}


@app.post('/recommend-study-time')
async def recommend_study_time(payload: PerformanceAnalysisIn):
    try:
        return performance_predictor.recommend_study_time(payload.dict())
    except Exception as e:
        print("Study time error:", e)
        return {
            "recommended_hours_per_week": 10,
            "estimated_weeks_to_completion": 8,
            "error": str(e)
        }


# ---------------------------------------------------
# SERVER
# ---------------------------------------------------

if __name__ == '__main__':
    uvicorn.run(app, host='0.0.0.0', port=8001)
