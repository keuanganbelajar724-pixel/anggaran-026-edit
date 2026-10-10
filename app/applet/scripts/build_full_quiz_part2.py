#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Builder untuk 530 Butir Soal Tambahan Master Bank Soal Perbendaharaan (mbq_521 s.d. mbq_1050)
Total koleksi akan mencapai 1050 butir soal.
"""

import json
import os

questions = []

def add(num, topic, diff, text, a, b, c, d, ans, exp, ref):
    pts = 5 if diff == "MUDAH" else 10 if diff == "SEDANG" else 15
    questions.append({
        "id": f"mbq_{num:03d}",
        "number": num,
        "topic": topic,
        "difficulty": diff,
        "questionText": text,
        "optionA": a,
        "optionB": b,
        "optionC": c,
        "optionD": d,
        "correctAnswer": ans,
        "explanation": exp,
        "referenceRegulation": ref,
        "points": pts
    })

print("Starting generation...")
