"""API router for Quiz functionality."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.auth_service import get_current_user
from app.models.db_models import User, Quiz, QuizQuestion
from app.models.schemas import (
    QuizGenerateRequest,
    QuizGenerateResponse,
    QuizQuestionPublicResponse,
    QuizCheckAnswerRequest,
    QuizCheckAnswerResponse,
    QuizQuestionReview,
    QuizSubmitRequest,
    QuizSubmitResponse,
    QuizHistoryItem,
    QuizDetailResponse,
)
from app.services import quiz_service

router = APIRouter(prefix="/api/quiz", tags=["quiz"])


def _answers_match(user_answer: str, correct_answer: str) -> bool:
    return user_answer.strip() == correct_answer.strip()


def _get_owned_quiz(quiz_id: str, user_id: str, db: Session) -> Quiz | None:
    return db.query(Quiz).filter(Quiz.id == quiz_id, Quiz.user_id == user_id).first()


def _question_to_review(q: QuizQuestion) -> QuizQuestionReview:
    return QuizQuestionReview(
        id=q.id,
        question_text=q.question_text,
        options=q.options,
        user_answer=q.user_answer,
        correct_answer=q.correct_answer,
        explanation=q.explanation,
        is_correct=q.is_correct,
    )


@router.post("/generate", response_model=QuizGenerateResponse)
async def generate_quiz(
    request: QuizGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate a new quiz and save it to the database in an unanswered state."""
    try:
        questions = await quiz_service.generate_quiz(
            topic=request.topic,
            difficulty=request.difficulty,
            num_questions=request.num_questions,
            doc_ids=request.doc_ids,
            user_id=current_user.id,
        )

        if not questions:
            raise HTTPException(
                status_code=400,
                detail="Failed to generate questions. Context may be empty.",
            )

        db_quiz = Quiz(
            user_id=current_user.id,
            topic=request.topic or "General",
            difficulty=request.difficulty,
            total_questions=len(questions),
            score=None,
        )
        db.add(db_quiz)
        db.flush()

        db_questions = []
        for q in questions:
            db_question = QuizQuestion(
                quiz_id=db_quiz.id,
                question_text=q.question_text,
                options=q.options,
                correct_answer=q.correct_answer,
                explanation=q.explanation,
            )
            db.add(db_question)
            db.flush()
            db_questions.append(db_question)

        db.commit()

        response_questions = [
            QuizQuestionPublicResponse(
                id=dbq.id,
                question_text=dbq.question_text,
                options=dbq.options,
            )
            for dbq in db_questions
        ]

        return QuizGenerateResponse(
            quiz_id=db_quiz.id,
            topic=db_quiz.topic,
            difficulty=db_quiz.difficulty,
            questions=response_questions,
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
            detail=f"Failed to generate quiz: {str(e)}",
        )


@router.post("/{quiz_id}/questions/{question_id}/check", response_model=QuizCheckAnswerResponse)
def check_answer(
    quiz_id: str,
    question_id: str,
    request: QuizCheckAnswerRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Verify one answer during an in-progress quiz (study mode).
    Answers are stored server-side; correct_answer is not sent in /generate.
    """
    quiz = _get_owned_quiz(quiz_id, current_user.id, db)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    if quiz.score is not None:
        raise HTTPException(status_code=400, detail="Quiz already submitted.")

    question = (
        db.query(QuizQuestion)
        .filter(QuizQuestion.id == question_id, QuizQuestion.quiz_id == quiz_id)
        .first()
    )
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    if question.user_answer is not None:
        raise HTTPException(
            status_code=400,
            detail="This question was already answered.",
        )

    is_correct = _answers_match(request.user_answer, question.correct_answer)
    question.user_answer = request.user_answer.strip()
    question.is_correct = is_correct
    db.commit()

    return QuizCheckAnswerResponse(is_correct=is_correct)


@router.post("/{quiz_id}/submit", response_model=QuizSubmitResponse)
def submit_quiz(
    quiz_id: str,
    request: QuizSubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit answers for a quiz and calculate score."""
    quiz = _get_owned_quiz(quiz_id, current_user.id, db)
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
            q.user_answer = answer.user_answer.strip()
            q.is_correct = _answers_match(answer.user_answer, q.correct_answer)
            if q.is_correct:
                score += 1

    quiz.score = score
    db.commit()

    review = [_question_to_review(q) for q in questions]

    return QuizSubmitResponse(
        score=score,
        total_questions=quiz.total_questions,
        message="Quiz submitted successfully!",
        review=review,
    )


@router.get("/history", response_model=list[QuizHistoryItem])
def get_quiz_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List completed quizzes (summary only — no answers)."""
    quizzes = (
        db.query(Quiz)
        .filter(Quiz.user_id == current_user.id, Quiz.score.isnot(None))
        .order_by(Quiz.created_at.desc())
        .all()
    )

    return [
        QuizHistoryItem(
            id=q.id,
            topic=q.topic or "General",
            difficulty=q.difficulty,
            score=q.score or 0,
            total_questions=q.total_questions,
            created_at=q.created_at.isoformat() if q.created_at else "",
        )
        for q in quizzes
    ]


@router.get("/{quiz_id}", response_model=QuizDetailResponse)
def get_quiz_detail(
    quiz_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Full quiz review for a completed attempt only.
    In-progress quizzes must not expose correct answers via this endpoint.
    """
    quiz = _get_owned_quiz(quiz_id, current_user.id, db)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    if quiz.score is None:
        raise HTTPException(
            status_code=403,
            detail="Quiz is not finished yet. Complete and submit the quiz to view answers.",
        )

    questions = db.query(QuizQuestion).filter(QuizQuestion.quiz_id == quiz_id).all()

    return QuizDetailResponse(
        id=quiz.id,
        topic=quiz.topic or "General",
        difficulty=quiz.difficulty,
        score=quiz.score,
        total_questions=quiz.total_questions,
        created_at=quiz.created_at.isoformat() if quiz.created_at else "",
        questions=[_question_to_review(q) for q in questions],
    )
