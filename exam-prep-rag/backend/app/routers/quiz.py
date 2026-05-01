"""API router for Quiz functionality."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.auth_service import get_current_user
from app.models.db_models import User, Quiz, QuizQuestion
from app.models.schemas import (
    QuizGenerateRequest, 
    QuizGenerateResponse,
    QuizQuestionResponse,
    QuizSubmitRequest,
    QuizSubmitResponse,
    QuizHistoryItem
)
from app.services import quiz_service

router = APIRouter(prefix="/api/quiz", tags=["quiz"])


@router.post("/generate", response_model=QuizGenerateResponse)
async def generate_quiz(
    request: QuizGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate a new quiz and save it to the database in an unanswered state."""
    try:
        # Generate questions using LLM
        questions = await quiz_service.generate_quiz(
            topic=request.topic,
            difficulty=request.difficulty,
            num_questions=request.num_questions,
            doc_ids=request.doc_ids,
            user_id=current_user.id,
        )
        
        if not questions:
            raise HTTPException(status_code=400, detail="Failed to generate questions. Context may be empty.")

        # Save the new quiz to the database
        db_quiz = Quiz(
            user_id=current_user.id,
            topic=request.topic or "General",
            difficulty=request.difficulty,
            total_questions=len(questions),
            score=None  # Null score means incomplete
        )
        db.add(db_quiz)
        db.flush()  # To get db_quiz.id

        # Save the questions and collect their DB IDs
        db_questions = []
        for q in questions:
            db_question = QuizQuestion(
                quiz_id=db_quiz.id,
                question_text=q.question_text,
                options=q.options,
                correct_answer=q.correct_answer,
                explanation=q.explanation
            )
            db.add(db_question)
            db.flush()  # Get the generated ID
            db_questions.append(db_question)
            
        db.commit()

        # Build response with database IDs
        response_questions = [
            QuizQuestionResponse(
                id=dbq.id,
                question_text=dbq.question_text,
                options=dbq.options,
                correct_answer=dbq.correct_answer,
                explanation=dbq.explanation
            )
            for dbq in db_questions
        ]

        return QuizGenerateResponse(
            quiz_id=db_quiz.id,
            topic=db_quiz.topic,
            difficulty=db_quiz.difficulty,
            questions=response_questions
        )
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate quiz: {str(e)}"
        )


@router.post("/{quiz_id}/submit", response_model=QuizSubmitResponse)
def submit_quiz(
    quiz_id: str,
    request: QuizSubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit answers for a quiz and calculate score."""
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id, Quiz.user_id == current_user.id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
        
    if quiz.score is not None:
        raise HTTPException(status_code=400, detail="Quiz already submitted")

    questions = db.query(QuizQuestion).filter(QuizQuestion.quiz_id == quiz_id).all()
    q_map = {q.id: q for q in questions}
    
    score = 0
    for answer in request.answers:
        q = q_map.get(answer.question_id)
        if q:
            q.user_answer = answer.user_answer
            q.is_correct = (answer.user_answer == q.correct_answer)
            if q.is_correct:
                score += 1
                
    quiz.score = score
    db.commit()
    
    return QuizSubmitResponse(
        score=score,
        total_questions=quiz.total_questions,
        message="Quiz submitted successfully!"
    )


@router.get("/history", response_model=list[QuizHistoryItem])
def get_quiz_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get the user's past quizzes."""
    quizzes = db.query(Quiz).filter(Quiz.user_id == current_user.id).order_by(Quiz.created_at.desc()).all()
    
    return [
        QuizHistoryItem(
            id=q.id,
            topic=q.topic or "General",
            difficulty=q.difficulty,
            score=q.score or 0,
            total_questions=q.total_questions,
            created_at=q.created_at.isoformat()
        )
        for q in quizzes if q.score is not None  # Only show completed quizzes
    ]
