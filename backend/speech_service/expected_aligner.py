"""
Expected-vs-Spoken Deterministic Alignment Engine
Implements weighted sequence alignment (Needleman-Wunsch) with:
1. Indian English phonetic similarity tolerance (prevents penalizing accents)
2. Hard ASR uncertainty gating (low-confidence ASR words never become false errors)
3. Word and phrase repetition tracking
4. Precise error extraction (correct, omission, substitution, insertion)
"""
import re
import math
try:
    from .config import config
except (ImportError, ValueError):
    from config import config

def normalize_text_tokens(text: str) -> list[str]:
    """Tokenizes text into clean lowercase alphanumeric tokens."""
    if not text:
        return []
    clean = re.sub(r"[^a-zA-Z0-9\s'-]", " ", text.lower())
    return [w.strip("'-") for w in clean.split() if w.strip("'-")]

def _normalize_spoken_token(raw_word: str) -> str:
    """
    Normalize a single ASR-returned word for alignment comparison only.
    Strips the same punctuation that normalize_text_tokens() strips from the
    expected text so that, e.g., 'it.' and 'it' compare as equal.
    The raw transcript is never modified; this result is used only in the
    DP/backtracking logic and stored as the clean spokenWord in wordTimings.
    """
    tokens = normalize_text_tokens(raw_word)
    return tokens[0] if tokens else raw_word.lower().strip()

def compute_phonetic_similarity(word1: str, word2: str) -> float:
    """
    Computes phonetic similarity between two words (0.0 to 1.0).
    Tolerates common Indian English accent shifts (w/v, th/d, rhoticity).
    """
    w1 = word1.lower().strip()
    w2 = word2.lower().strip()
    if w1 == w2:
        return 1.0

    # Phonetic mapping rules for Indian English variation
    def normalize_phonetic(w):
        w = w.replace("ph", "f").replace("gh", "g")
        w = w.replace("w", "v")          # Indian English w/v coalescence
        w = w.replace("th", "d")         # Dental plosive substitution
        w = w.replace("c", "k").replace("q", "k")
        w = re.sub(r"(.)\1+", r"\1", w)  # Remove doubled letters
        return w

    pw1 = normalize_phonetic(w1)
    pw2 = normalize_phonetic(w2)

    if pw1 == pw2:
        return 0.90

    # Levenshtein distance on phonetically normalized strings
    m, n = len(pw1), len(pw2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(m + 1): dp[i][0] = i
    for j in range(n + 1): dp[0][j] = j

    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if pw1[i - 1] == pw2[j - 1]:
                dp[i][j] = dp[i - 1][j - 1]
            else:
                dp[i][j] = 1 + min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1])

    dist = dp[m][n]
    max_len = max(m, n, 1)
    similarity = max(0.0, 1.0 - (dist / max_len))
    return round(similarity, 3)

def is_indian_english_phonetic_variant(word1: str, word2: str) -> bool:
    """Checks whether two words are legitimate Indian English pronunciation variants."""
    w1 = word1.lower().strip()
    w2 = word2.lower().strip()
    if not w1 or not w2:
        return False
    if w1 == w2:
        return True

    def norm_voiced(w):
        w = w.replace("ph", "f").replace("gh", "g").replace("w", "v").replace("th", "d").replace("c", "k").replace("q", "k")
        return re.sub(r"(.)\1+", r"\1", w)

    def norm_voiceless(w):
        w = w.replace("ph", "f").replace("gh", "g").replace("w", "v").replace("th", "t").replace("c", "k").replace("q", "k")
        return re.sub(r"(.)\1+", r"\1", w)

    if norm_voiced(w1) == norm_voiced(w2):
        return True
    if norm_voiceless(w1) == norm_voiceless(w2):
        return True
    return False

def align_expected_and_spoken(expected_text: str, aligned_words: list[dict]) -> dict:
    """
    Aligns expected passage tokens with spoken ASR words.
    Extracts correct, substitutions, omissions, insertions, repetitions, and uncertain items.
    """
    target_tokens = normalize_text_tokens(expected_text)
    spoken_tokens = [_normalize_spoken_token(w["word"]) for w in aligned_words]

    m = len(target_tokens)
    n = len(spoken_tokens)

    # 1. DP Alignment Matrix (Needleman-Wunsch)
    dp = [[0.0] * (n + 1) for _ in range(m + 1)]
    for i in range(m + 1): dp[i][0] = i * 1.0
    for j in range(n + 1): dp[0][j] = j * 1.0

    for i in range(1, m + 1):
        for j in range(1, n + 1):
            tw = target_tokens[i - 1]
            sw = spoken_tokens[j - 1]
            is_variant = is_indian_english_phonetic_variant(tw, sw)
            sim = compute_phonetic_similarity(tw, sw)

            if tw == sw:
                cost = 0.0
            elif is_variant:
                cost = 0.2  # Very small penalty for Indian English pronunciation variant
            elif sim >= 0.70:
                cost = 0.5  # Acoustic similarity alignment hint
            else:
                cost = 1.0  # Full substitution cost

            dp[i][j] = min(
                dp[i - 1][j - 1] + cost, # match or substitution
                dp[i - 1][j] + 1.0,      # omission (target deletion)
                dp[i][j - 1] + 1.0       # insertion (spoken insertion)
            )

    # 2. Backtracking
    i = m
    j = n
    aligned_sequence = []

    while i > 0 or j > 0:
        if i > 0 and j > 0:
            tw = target_tokens[i - 1]
            sw = spoken_tokens[j - 1]
            is_variant = is_indian_english_phonetic_variant(tw, sw)
            sim = compute_phonetic_similarity(tw, sw)
            word_obj = aligned_words[j - 1] if j - 1 < len(aligned_words) else {}
            conf = word_obj.get("confidence")
            is_uncertain = word_obj.get("isUncertain", False) or (conf is not None and conf < config.MIN_ASR_CONFIDENCE)

            cost = 0.0 if tw == sw else (0.2 if is_variant else (0.5 if sim >= 0.70 else 1.0))

            if math.isclose(dp[i][j], dp[i - 1][j - 1] + cost, abs_tol=1e-4):
                if tw == sw:
                    status = "correct"
                elif is_uncertain:
                    status = "uncertain"
                elif is_variant:
                    status = "correct" # Accepted as phonetic variant!
                else:
                    status = "substitution"

                aligned_sequence.insert(0, {
                    "targetIndex": i - 1,
                    "expectedWord": tw,
                    "spokenWord": sw,
                    "status": status,
                    "phoneticSimilarity": sim,
                    "isPhoneticVariant": (is_variant and tw != sw),
                    "startSec": word_obj.get("start"),
                    "endSec": word_obj.get("end"),
                    "durationMs": round((word_obj.get("end", 0) - word_obj.get("start", 0)) * 1000) if word_obj.get("start") is not None and word_obj.get("end") is not None else None,
                    "confidence": conf,
                    "isUncertain": is_uncertain
                })
                i -= 1
                j -= 1
                continue

        if i > 0 and math.isclose(dp[i][j], dp[i - 1][j] + 1.0, abs_tol=1e-4):
            # Omission
            aligned_sequence.insert(0, {
                "targetIndex": i - 1,
                "expectedWord": target_tokens[i - 1],
                "spokenWord": "",
                "status": "omission",
                "phoneticSimilarity": 0.0,
                "isPhoneticVariant": False,
                "startSec": None,
                "endSec": None,
                "durationMs": None,
                "confidence": None,
                "isUncertain": False
            })
            i -= 1
            continue

        if j > 0 and math.isclose(dp[i][j], dp[i][j - 1] + 1.0, abs_tol=1e-4):
            # Insertion
            word_obj = aligned_words[j - 1] if j - 1 < len(aligned_words) else {}
            conf = word_obj.get("confidence")
            is_uncertain = word_obj.get("isUncertain", False) or (conf is not None and conf < config.MIN_ASR_CONFIDENCE)

            aligned_sequence.insert(0, {
                "targetIndex": None,
                "expectedWord": None,
                "spokenWord": spoken_tokens[j - 1],
                "status": "uncertain" if is_uncertain else "insertion",
                "phoneticSimilarity": 0.0,
                "isPhoneticVariant": False,
                "startSec": word_obj.get("start"),
                "endSec": word_obj.get("end"),
                "durationMs": round((word_obj.get("end", 0) - word_obj.get("start", 0)) * 1000) if word_obj.get("start") is not None and word_obj.get("end") is not None else None,
                "confidence": conf,
                "isUncertain": is_uncertain
            })
            j -= 1
            continue

        if i > 0: i -= 1
        if j > 0: j -= 1

    # 3. Detect Repetitions in spoken word stream
    repetitions = []
    for idx in range(len(aligned_words) - 1):
        w_curr = _normalize_spoken_token(aligned_words[idx]["word"])
        w_next = _normalize_spoken_token(aligned_words[idx + 1]["word"])
        if w_curr and w_curr == w_next:
            repetitions.append({
                "type": "word_repetition",
                "phrase": w_curr,
                "occurrences": 2,
                "targetIndex": idx,
                "timestamps": [
                    {"start": aligned_words[idx].get("start", 0), "end": aligned_words[idx].get("end", 0)},
                    {"start": aligned_words[idx + 1].get("start", 0), "end": aligned_words[idx + 1].get("end", 0)}
                ]
            })

    # 4. Extract Classified Arrays
    omissions = [
        {"expectedWord": item["expectedWord"], "targetIndex": item["targetIndex"], "confidence": item["confidence"]}
        for item in aligned_sequence if item["status"] == "omission"
    ]
    substitutions = [
        {
            "expectedWord": item["expectedWord"],
            "spokenWord": item["spokenWord"],
            "targetIndex": item["targetIndex"],
            "phoneticSimilarity": item["phoneticSimilarity"],
            "isPhoneticVariant": item["isPhoneticVariant"],
            "confidence": item["confidence"]
        }
        for item in aligned_sequence if item["status"] == "substitution"
    ]
    insertions = [
        {"spokenWord": item["spokenWord"], "nearTargetIndex": item.get("targetIndex"), "confidence": item["confidence"]}
        for item in aligned_sequence if item["status"] == "insertion"
    ]

    correct_words_count = sum(1 for item in aligned_sequence if item["status"] == "correct")
    uncertain_words_count = sum(1 for item in aligned_sequence if item["status"] == "uncertain")

    total_target = len(target_tokens)
    # Uncertainty gate: Uncertain words do not penalize accuracy
    valid_denom = max(1, total_target - uncertain_words_count)
    accuracy_pct = round((correct_words_count / valid_denom) * 100, 1) if total_target > 0 else 100.0

    return {
        "wordTimings": aligned_sequence,
        "omissions": omissions,
        "substitutions": substitutions,
        "insertions": insertions,
        "repetitions": repetitions,
        "expectedWordCount": total_target,
        "spokenWordCount": len(spoken_tokens),
        "correctWordCount": correct_words_count,
        "uncertainWordCount": uncertain_words_count,
        "decodingAccuracyPct": accuracy_pct
    }
