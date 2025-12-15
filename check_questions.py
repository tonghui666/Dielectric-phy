import json
import os

def check_questions():
    try:
        with open('backend/questions.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        print(f"Total questions: {len(data)}")
        
        fill_questions = [q for q in data if q.get('type') == 'fill']
        choice_questions = [q for q in data if q.get('type') == 'choice']
        
        print(f"Fill questions: {len(fill_questions)}")
        print(f"Choice questions: {len(choice_questions)}")
        
        # Check for anomalies
        empty_answer_fill = [q for q in fill_questions if not q.get('answer') or q.get('answer').strip() == '']
        if empty_answer_fill:
            print(f"WARNING: {len(empty_answer_fill)} fill questions have empty answers!")
            for q in empty_answer_fill[:3]:
                print(f"  ID {q['id']}: {q['question']}")
                
        fill_with_options = [q for q in fill_questions if q.get('options') and len(q['options']) > 0]
        if fill_with_options:
            print(f"WARNING: {len(fill_with_options)} fill questions have options!")
            
        choice_without_options = [q for q in choice_questions if not q.get('options') or len(q['options']) == 0]
        if choice_without_options:
            print(f"WARNING: {len(choice_without_options)} choice questions have no options!")

        # Check for single-letter answers in fill questions (might be misclassified)
        short_answer_fill = [q for q in fill_questions if len(q.get('answer', '').strip()) == 1]
        if short_answer_fill:
             print(f"WARNING: {len(short_answer_fill)} fill questions have single-letter answers (might be choice?):")
             for q in short_answer_fill[:5]:
                 print(f"  ID {q['id']}: Answer='{q['answer']}' Question='{q['question']}'")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_questions()
