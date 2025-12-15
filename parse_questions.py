import re
import json

def parse_questions(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    questions = []
    current_question = None
    
    # Regex patterns
    section_pattern = re.compile(r'^##\s+(.*)')
    question_pattern = re.compile(r'^(\d+)\.\s*(.*)')
    option_pattern = re.compile(r'([A-D])\.\s*([^A-D\n]+)')
    answer_pattern = re.compile(r'^答案[：:]\s*(.*)')
    
    current_section = "默认章节"

    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Check for section
        s_match = section_pattern.match(line)
        if s_match:
            current_section = s_match.group(1).strip()
            continue

        # Check for new question
        q_match = question_pattern.match(line)
        if q_match:
            if current_question:
                questions.append(current_question)
            
            current_question = {
                'id': int(q_match.group(1)),
                'question': q_match.group(2),
                'options': [],
                'answer': '',
                'type': 'choice', # Default to choice, will change to 'fill' if no options found or answer is not A-D
                'section': current_section
            }
            continue
            
        # Check for answer
        a_match = answer_pattern.match(line)
        if a_match:
            if current_question:
                raw_answer = a_match.group(1).strip()
                current_question['answer'] = raw_answer
                
                # Determine type based on answer and options
                # If answer is longer than 1 char or not A-D, it is likely fill-in-the-blank
                if len(raw_answer) > 1 or raw_answer not in ['A', 'B', 'C', 'D']:
                    current_question['type'] = 'fill'
                elif not current_question['options']:
                     # If answer is single letter but no options found yet (maybe options are after answer? unlikely in this format), 
                     # or maybe it's a True/False or just missing options.
                     # But based on file, choices usually have options.
                     pass
            continue
            
        # Check for options
        # Options can be in one line "A. xxx B. xxx" or multiple lines
        # This is a bit tricky if options are split. 
        # Let's try to find all occurrences of "X. "
        
        if current_question:
            # Find all options in the line
            # We look for A., B., C., D. followed by content
            # A simple regex might miss if content contains "A. " but unlikely in this context
            
            # Split line by potential option starters
            # But options might be "A. Value B. Value"
            # Let's search for patterns
            
            matches = list(re.finditer(r'([A-D])\.\s*', line))
            if matches:
                for i, match in enumerate(matches):
                    opt_label = match.group(1)
                    start_idx = match.end()
                    # End index is the start of next match or end of string
                    if i + 1 < len(matches):
                        end_idx = matches[i+1].start()
                    else:
                        end_idx = len(line)
                    
                    opt_content = line[start_idx:end_idx].strip()
                    current_question['options'].append({
                        'label': opt_label,
                        'content': opt_content
                    })
    
    # Append last question
    if current_question:
        questions.append(current_question)
        
    return questions

if __name__ == '__main__':
    questions = parse_questions('习题.md')
    print(f"Parsed {len(questions)} questions.")
    
    # Save to JSON
    with open('backend/questions.json', 'w', encoding='utf-8') as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)
    print("Saved to backend/questions.json")
