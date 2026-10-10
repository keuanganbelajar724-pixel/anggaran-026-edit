import json
import os

all_questions = []

def add(num, topic, diff, qtext, opA, opB, opC, opD, corr, expl, ref):
    pts = 5 if diff == "MUDAH" else 10 if diff == "SEDANG" else 15
    all_questions.append({
        "id": f"mbq_{num:03d}",
        "number": num,
        "topic": topic,
        "difficulty": diff,
        "questionText": qtext,
        "optionA": opA,
        "optionB": opB,
        "optionC": opC,
        "optionD": opD,
        "correctAnswer": corr,
        "explanation": expl,
        "referenceRegulation": ref,
        "points": pts
    })

print("Helper add function defined")
