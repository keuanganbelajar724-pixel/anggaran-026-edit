#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generator Master Bank Soal Part 2 (530 Soal: mbq_521 - mbq_1050)
Total Bank Soal: 520 (Lama) + 530 (Baru) = 1050 Butir Soal
"""

import json
import os

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
