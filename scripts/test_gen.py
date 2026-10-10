# Quick verification of JSON formatting for TypeScript export
import json

sample = {
    "id": "mbq_1051",
    "number": 1051,
    "topic": "IKPA - Reformulasi 2026 & Kinerja Anggaran",
    "difficulty": "MUDAH",
    "questionText": "Berapakah bobot indikator Deviasi Halaman III DIPA dalam reformulasi IKPA terbaru?",
    "optionA": "10%",
    "optionB": "15%",
    "optionC": "20%",
    "optionD": "25%",
    "correctAnswer": "B",
    "explanation": "Dalam reformulasi IKPA, bobot indikator Deviasi Hal III DIPA ditetapkan sebesar 15%.",
    "referenceRegulation": "Perdirjen Perbendaharaan No. PER-5/PB/2022",
    "points": 5
}
print(json.dumps(sample, indent=2, ensure_ascii=False))
