import importlib.util
from pathlib import Path
from unittest import TestCase


MODULE_PATH = (
    Path(__file__).parents[1]
    / "addons"
    / "facodi_content"
    / "services"
    / "curriculum.py"
)


def load_curriculum():
    assert MODULE_PATH.exists(), "The curriculum import boundary is missing"
    spec = importlib.util.spec_from_file_location("facodi_curriculum", MODULE_PATH)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class TestCurriculumImport(TestCase):
    def test_parses_json_into_one_normalised_curriculum(self):
        curriculum = load_curriculum()
        payload = b"""
        {
          "program": {"code":"LEI","name":"Computer Engineering","degree_level":"bachelor"},
          "curriculum": {"version":"2026","name":"LEI 2026"},
          "periods": [{
            "year": 1,
            "semester": 1,
            "name": "Year 1 / Semester 1",
            "units": [{
              "code":"MATH101","name":"Linear Algebra","ects":6,
              "topics":["Vectors","Matrices"],
              "learning_outcomes":["Solve linear systems"],
              "competencies":["Mathematical reasoning"],
              "prerequisites":["Secondary mathematics"]
            }]
          }]
        }
        """

        result = curriculum.parse_curriculum(payload, filename="curriculum.json")

        self.assertEqual(result["program"]["code"], "LEI")
        self.assertEqual(result["curriculum"]["version"], "2026")
        unit = result["periods"][0]["units"][0]
        self.assertEqual(unit["code"], "MATH101")
        self.assertEqual(unit["ects"], 6.0)
        self.assertEqual(unit["topics"], ["Vectors", "Matrices"])
        self.assertEqual(unit["competencies"], ["Mathematical reasoning"])

    def test_parses_csv_rows_and_pipe_separated_semantics(self):
        curriculum = load_curriculum()
        payload = (
            "program_code,program_name,degree_level,curriculum_version,curriculum_name,"
            "year,semester,unit_code,unit_name,ects,topics,learning_outcomes,competencies,prerequisites\n"
            "LEI,Computer Engineering,bachelor,2026,LEI 2026,1,1,MATH101,Linear Algebra,6,"
            "Vectors|Matrices,Solve systems,Mathematical reasoning,Secondary mathematics\n"
            "LEI,Computer Engineering,bachelor,2026,LEI 2026,1,1,CS101,Programming,6,"
            "Algorithms,Write programs,Computational thinking,\n"
        ).encode()

        result = curriculum.parse_curriculum(payload, filename="curriculum.csv")

        self.assertEqual(len(result["periods"]), 1)
        self.assertEqual(
            [unit["code"] for unit in result["periods"][0]["units"]],
            ["MATH101", "CS101"],
        )
        self.assertEqual(
            result["periods"][0]["units"][0]["topics"],
            ["Vectors", "Matrices"],
        )

    def test_reports_invalid_values_with_a_structural_path(self):
        curriculum = load_curriculum()
        payload = b"""
        {
          "program":{"code":"LEI","name":"Engineering"},
          "curriculum":{"version":"2026","name":"LEI 2026"},
          "periods":[{"year":1,"semester":1,"units":[
            {"code":"MATH101","name":"Linear Algebra","ects":-2}
          ]}]
        }
        """

        with self.assertRaisesRegex(
            curriculum.CurriculumValidationError,
            r"periods\[0\]\.units\[0\]\.ects",
        ):
            curriculum.parse_curriculum(payload, filename="curriculum.json")

