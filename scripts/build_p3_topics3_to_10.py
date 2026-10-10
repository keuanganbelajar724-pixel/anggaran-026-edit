# -*- coding: utf-8 -*-
import json
import os

def q(num, topic, diff, q_text, a, b, c, d, ans, exp, reg):
    pts = 5 if diff == 'MUDAH' else (10 if diff == 'SEDANG' else 15)
    return {
        "id": f"mbq_{num}",
        "number": num,
        "topic": topic,
        "difficulty": diff,
        "questionText": q_text,
        "optionA": a,
        "optionB": b,
        "optionC": c,
        "optionD": d,
        "correctAnswer": ans,
        "explanation": exp,
        "referenceRegulation": reg,
        "points": pts
    }

questions = []
cur_num = 1151

# Helper to generate 50 structured questions per topic
def add_topic(topic_name, reg, mudah_items, sedang_items, analisis_items):
    global cur_num, questions
    for item in mudah_items:
        questions.append(q(cur_num, topic_name, "MUDAH", item[0], item[1], item[2], item[3], item[4], item[5], item[6] if len(item)>6 else reg))
        cur_num += 1
    for item in sedang_items:
        questions.append(q(cur_num, topic_name, "SEDANG", item[0], item[1], item[2], item[3], item[4], item[5], item[6] if len(item)>6 else reg))
        cur_num += 1
    for item in analisis_items:
        questions.append(q(cur_num, topic_name, "ANALISIS", item[0], item[1], item[2], item[3], item[4], item[5], item[6] if len(item)>6 else reg))
        cur_num += 1
    print(f"Added {topic_name}: total now {len(questions)}")

print("Ready to define topics 3 to 10...")
