import csv
import io
import json


SEMANTIC_FIELDS = (
    "topics",
    "learning_outcomes",
    "competencies",
    "prerequisites",
)


class CurriculumValidationError(ValueError):
    """Raised with a structural path when a curriculum cannot be imported."""


def _required_text(value, path):
    text = str(value or "").strip()
    if not text:
        raise CurriculumValidationError(f"{path}: a non-empty value is required")
    return text


def _positive_integer(value, path, *, maximum=None):
    try:
        number = int(value)
    except (TypeError, ValueError) as error:
        raise CurriculumValidationError(f"{path}: an integer is required") from error
    if number < 1 or (maximum is not None and number > maximum):
        suffix = f" between 1 and {maximum}" if maximum else " greater than zero"
        raise CurriculumValidationError(f"{path}: expected an integer{suffix}")
    return number


def _ects(value, path):
    try:
        number = float(value or 0)
    except (TypeError, ValueError) as error:
        raise CurriculumValidationError(f"{path}: a number is required") from error
    if number < 0 or number > 60:
        raise CurriculumValidationError(f"{path}: expected a number between 0 and 60")
    return number


def _strings(value, path):
    if value in (None, ""):
        return []
    if isinstance(value, str):
        values = value.split("|")
    elif isinstance(value, list):
        values = value
    else:
        raise CurriculumValidationError(f"{path}: expected a list of text values")
    result = []
    for index, item in enumerate(values):
        text = _required_text(item, f"{path}[{index}]")
        if text not in result:
            result.append(text)
    return result


def _normalise_document(document):
    if not isinstance(document, dict):
        raise CurriculumValidationError("root: expected an object")
    program_raw = document.get("program")
    curriculum_raw = document.get("curriculum")
    periods_raw = document.get("periods")
    if not isinstance(program_raw, dict):
        raise CurriculumValidationError("program: expected an object")
    if not isinstance(curriculum_raw, dict):
        raise CurriculumValidationError("curriculum: expected an object")
    if not isinstance(periods_raw, list) or not periods_raw:
        raise CurriculumValidationError("periods: expected a non-empty list")
    result = {
        "schema_version": 1,
        "program": {
            "code": _required_text(program_raw.get("code"), "program.code"),
            "name": _required_text(program_raw.get("name"), "program.name"),
            "degree_level": str(program_raw.get("degree_level") or "other").strip(),
        },
        "curriculum": {
            "version": _required_text(
                curriculum_raw.get("version"), "curriculum.version"
            ),
            "name": _required_text(curriculum_raw.get("name"), "curriculum.name"),
        },
        "periods": [],
    }
    seen_units = set()
    seen_periods = set()
    for period_index, period_raw in enumerate(periods_raw):
        period_path = f"periods[{period_index}]"
        if not isinstance(period_raw, dict):
            raise CurriculumValidationError(f"{period_path}: expected an object")
        year = _positive_integer(period_raw.get("year"), f"{period_path}.year")
        semester = _positive_integer(
            period_raw.get("semester"),
            f"{period_path}.semester",
            maximum=4,
        )
        period_key = (year, semester)
        if period_key in seen_periods:
            raise CurriculumValidationError(f"{period_path}: duplicate year/semester")
        seen_periods.add(period_key)
        units_raw = period_raw.get("units")
        if not isinstance(units_raw, list) or not units_raw:
            raise CurriculumValidationError(f"{period_path}.units: expected a non-empty list")
        period = {
            "year": year,
            "semester": semester,
            "name": str(period_raw.get("name") or f"Year {year} / Semester {semester}").strip(),
            "units": [],
        }
        for unit_index, unit_raw in enumerate(units_raw):
            unit_path = f"{period_path}.units[{unit_index}]"
            if not isinstance(unit_raw, dict):
                raise CurriculumValidationError(f"{unit_path}: expected an object")
            code = _required_text(unit_raw.get("code"), f"{unit_path}.code")
            if code in seen_units:
                raise CurriculumValidationError(f"{unit_path}.code: duplicate unit code {code}")
            seen_units.add(code)
            unit = {
                "code": code,
                "name": _required_text(unit_raw.get("name"), f"{unit_path}.name"),
                "ects": _ects(unit_raw.get("ects"), f"{unit_path}.ects"),
                "description": str(unit_raw.get("description") or "").strip(),
                "bibliography": unit_raw.get("bibliography") or [],
            }
            for field_name in SEMANTIC_FIELDS:
                unit[field_name] = _strings(
                    unit_raw.get(field_name),
                    f"{unit_path}.{field_name}",
                )
            period["units"].append(unit)
        result["periods"].append(period)
    return result


def _csv_document(payload):
    try:
        text = payload.decode("utf-8-sig")
    except UnicodeDecodeError as error:
        raise CurriculumValidationError("root: CSV must use UTF-8") from error
    rows = list(csv.DictReader(io.StringIO(text)))
    if not rows:
        raise CurriculumValidationError("rows: expected at least one CSV row")
    first = rows[0]
    document = {
        "program": {
            "code": first.get("program_code"),
            "name": first.get("program_name"),
            "degree_level": first.get("degree_level") or "other",
        },
        "curriculum": {
            "version": first.get("curriculum_version"),
            "name": first.get("curriculum_name"),
        },
        "periods": [],
    }
    periods = {}
    for row_index, row in enumerate(rows, start=2):
        for key, expected in (
            ("program_code", first.get("program_code")),
            ("curriculum_version", first.get("curriculum_version")),
        ):
            if row.get(key) != expected:
                raise CurriculumValidationError(
                    f"rows[{row_index}].{key}: all rows must describe one curriculum"
                )
        try:
            year = int(row.get("year") or 0)
            semester = int(row.get("semester") or 0)
        except ValueError as error:
            raise CurriculumValidationError(
                f"rows[{row_index}].year: year and semester must be integers"
            ) from error
        period = periods.setdefault(
            (year, semester),
            {
                "year": year,
                "semester": semester,
                "name": row.get("period_name") or f"Year {year} / Semester {semester}",
                "units": [],
            },
        )
        unit = {
            "code": row.get("unit_code"),
            "name": row.get("unit_name"),
            "ects": row.get("ects"),
            "description": row.get("description") or "",
            "bibliography": [],
        }
        for field_name in SEMANTIC_FIELDS:
            unit[field_name] = row.get(field_name) or ""
        period["units"].append(unit)
    document["periods"] = list(periods.values())
    return document


def parse_curriculum(payload, *, filename):
    raw = bytes(payload or b"")
    lowered = str(filename or "").lower()
    if lowered.endswith(".csv"):
        document = _csv_document(raw)
    elif lowered.endswith(".json"):
        try:
            document = json.loads(raw.decode("utf-8-sig"))
        except (UnicodeDecodeError, ValueError) as error:
            raise CurriculumValidationError("root: invalid UTF-8 JSON") from error
    else:
        raise CurriculumValidationError("filename: expected a .json or .csv file")
    return _normalise_document(document)
