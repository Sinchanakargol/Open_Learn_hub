class QLearningQuiz:
    def __init__(self):
        pass

    def next_level(self, current_level, correct):
        if correct:
            return min(current_level + 1, 5)
        else:
            return max(current_level - 1, 1)

    def select_question(self, question_bank, level):
        # Return a mock question
        return {
            "id": "mock_q1",
            "prompt": "What is 2 + 2?",
            "difficulty": level
        }