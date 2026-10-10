#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json
import os

print("Building 530 additional treasury questions...")

# Base array of 530 questions
questions = []

def add_q(num, topic, diff, qtext, opA, opB, opC, opD, corr, expl, ref):
    pts = 5 if diff == "MUDAH" else 10 if diff == "SEDANG" else 15
    questions.append({
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
