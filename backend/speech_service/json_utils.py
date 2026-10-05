"""
JSON Serialization Utilities
Recursively converts NumPy scalars, arrays, and booleans to native Python types
so FastAPI's jsonable_encoder never encounters a numpy.bool_ or other numpy scalar.
"""
from __future__ import annotations


def sanitize_for_json(obj):
    """
    Recursively walk a nested structure (dict / list / numpy scalar / numpy array)
    and convert every NumPy type to the closest native Python equivalent.

    Conversion rules:
      numpy.bool_          → bool
      numpy.integer        → int
      numpy.floating       → float
      numpy.ndarray        → list  (recursed)
      dict                 → dict  (values recursed)
      list / tuple         → list  (items recursed)
      everything else      → unchanged
    """
    try:
        import numpy as np
        _np_bool = np.bool_
        _np_int = np.integer
        _np_float = np.floating
        _np_ndarray = np.ndarray
    except ImportError:  # numpy not installed – nothing to sanitize
        return obj

    if isinstance(obj, _np_bool):
        return bool(obj)
    if isinstance(obj, _np_int):
        return int(obj)
    if isinstance(obj, _np_float):
        return float(obj)
    if isinstance(obj, _np_ndarray):
        return [sanitize_for_json(v) for v in obj.tolist()]
    if isinstance(obj, dict):
        return {k: sanitize_for_json(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [sanitize_for_json(v) for v in obj]
    return obj
