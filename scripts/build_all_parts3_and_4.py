# -*- coding: utf-8 -*-
import json
import os

def create_q(number, topic, difficulty, question_text, opt_a, opt_b, opt_c, opt_d, correct_ans, explanation, reg):
    points = 5 if difficulty == 'MUDAH' else (10 if difficulty == 'SEDANG' else 15)
    return {
        "id": f"mbq_{number}",
        "number": number,
        "topic": topic,
        "difficulty": difficulty,
        "questionText": question_text,
        "optionA": opt_a,
        "optionB": opt_b,
        "optionC": opt_c,
        "optionD": opt_d,
        "correctAnswer": correct_ans,
        "explanation": explanation,
        "referenceRegulation": reg,
        "points": points
    }

def write_ts_file(filepath, var_name, questions):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write("import { MasterBankQuestion } from '../types/quiz';\n\n")
        f.write(f"export const {var_name}: MasterBankQuestion[] = [\n")
        for i, q in enumerate(questions):
            json_str = json.dumps(q, indent=2, ensure_ascii=False)
            f.write(json_str)
            if i < len(questions) - 1:
                f.write(",\n")
            else:
                f.write("\n")
        f.write("];\n")
    print(f"Successfully wrote {len(questions)} questions to {filepath}")

if __name__ == "__main__":
    print("Generator helper initialized.")
