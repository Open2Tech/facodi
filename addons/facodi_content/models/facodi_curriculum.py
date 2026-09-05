import hashlib
import json

from odoo import _, api, fields, models
from odoo.exceptions import AccessError, UserError, ValidationError

from ..services.curriculum import CurriculumValidationError, parse_curriculum


DEGREE_LEVELS = [
    ("bachelor", "Bachelor / Licenciatura"),
    ("master", "Master"),
    ("doctorate", "Doctorate"),
    ("short_cycle", "Short Cycle"),
    ("other", "Other"),
]


class FacodiProgram(models.Model):
    _name = "facodi.program"
    _description = "FACODI University Programme"
    _inherit = ["mail.thread", "mail.activity.mixin"]
    _order = "institution_partner_id, name, id"

    institution_partner_id = fields.Many2one(
        "res.partner",
        required=True,
        ondelete="restrict",
        index=True,
        tracking=True,
    )
    code = fields.Char(required=True, index=True, tracking=True)
    name = fields.Char(required=True, translate=True, tracking=True)
    description = fields.Html(translate=True, sanitize_overridable=True)
    degree_level = fields.Selection(
        DEGREE_LEVELS,
        required=True,
        default="other",
        index=True,
    )
    company_id = fields.Many2one(
        "res.company",
        required=True,
        default=lambda self: self.env.company,
        index=True,
    )
    curriculum_ids = fields.One2many("facodi.curriculum", "program_id")
    active = fields.Boolean(default=True)

    _institution_code_company_unique = models.Constraint(
        "UNIQUE(institution_partner_id, code, company_id)",
        "A programme code must be unique for its institution and company.",
    )

    @api.model_create_multi
    def create(self, values_list):
        for values in values_list:
            if values.get("code"):
                values["code"] = str(values["code"]).strip().upper()
        return super().create(values_list)


class FacodiCurriculum(models.Model):
    _name = "facodi.curriculum"
    _description = "FACODI Versioned Curriculum"
    _inherit = ["mail.thread", "mail.activity.mixin"]
    _order = "program_id, version desc, id desc"

    program_id = fields.Many2one(
        "facodi.program",
        required=True,
        ondelete="cascade",
        index=True,
        tracking=True,
    )
    company_id = fields.Many2one(
        related="program_id.company_id",
        store=True,
        index=True,
    )
    version = fields.Char(required=True, index=True, tracking=True)
    name = fields.Char(required=True, translate=True, tracking=True)
    state = fields.Selection(
        [
            ("draft", "Draft"),
            ("review", "In Review"),
            ("active", "Active"),
            ("archived", "Archived"),
        ],
        required=True,
        default="draft",
        copy=False,
        index=True,
        tracking=True,
    )
    valid_from = fields.Date()
    valid_to = fields.Date()
    source_resource_id = fields.Many2one(
        "facodi.resource",
        ondelete="restrict",
        copy=False,
    )
    source_snapshot_id = fields.Many2one(
        "facodi.resource.snapshot",
        ondelete="restrict",
        copy=False,
    )
    period_ids = fields.One2many(
        "facodi.curriculum.period",
        "curriculum_id",
        copy=True,
    )
    unit_ids = fields.Many2many(
        "facodi.course.unit",
        compute="_compute_unit_ids",
        string="Curricular Units",
    )
    activated_by_id = fields.Many2one(
        "res.users",
        readonly=True,
        copy=False,
        ondelete="set null",
    )
    activated_at = fields.Datetime(readonly=True, copy=False)

    _program_version_unique = models.Constraint(
        "UNIQUE(program_id, version)",
        "A curriculum version must be unique within its programme.",
    )

    @api.depends("period_ids.unit_ids")
    def _compute_unit_ids(self):
        for curriculum in self:
            curriculum.unit_ids = curriculum.period_ids.unit_ids

    @api.constrains("valid_from", "valid_to")
    def _check_dates(self):
        for curriculum in self:
            if (
                curriculum.valid_from
                and curriculum.valid_to
                and curriculum.valid_to < curriculum.valid_from
            ):
                raise ValidationError(_("Curriculum end date cannot precede start date."))

    def _ensure_curator(self):
        if not self.env.is_superuser() and not self.env.user.has_group(
            "facodi_content.group_facodi_curator"
        ):
            raise AccessError(_("Only FACODI curators can review curricula."))

    def _ensure_manager(self):
        if not self.env.is_superuser() and not self.env.user.has_group(
            "facodi_content.group_facodi_manager"
        ):
            raise AccessError(_("Only FACODI managers can activate curricula."))

    def action_submit_review(self):
        self._ensure_curator()
        for curriculum in self:
            if curriculum.state != "draft":
                raise UserError(_("Only a draft curriculum can be submitted."))
            curriculum.state = "review"
        return True

    def action_activate(self):
        self._ensure_manager()
        now = fields.Datetime.now()
        for curriculum in self:
            if curriculum.state != "review":
                raise UserError(_("Only a reviewed curriculum can be activated."))
            other_active = self.search(
                [
                    ("program_id", "=", curriculum.program_id.id),
                    ("state", "=", "active"),
                    ("id", "!=", curriculum.id),
                ]
            )
            other_active.write({"state": "archived"})
            curriculum.write(
                {
                    "state": "active",
                    "activated_by_id": self.env.user.id,
                    "activated_at": now,
                }
            )
        return True

    def unlink(self):
        if any(curriculum.state == "active" for curriculum in self):
            raise UserError(_("Active curricula must be archived before deletion."))
        return super().unlink()

    @api.model
    def import_payload(self, *, source, institution, payload, filename, attachment=None):
        source.ensure_one()
        institution.ensure_one()
        try:
            document = parse_curriculum(payload, filename=filename)
        except CurriculumValidationError as error:
            raise ValidationError(str(error)) from error
        program_values = document["program"]
        plan_values = document["curriculum"]
        program = self.env["facodi.program"].search(
            [
                ("institution_partner_id", "=", institution.id),
                ("code", "=", program_values["code"].upper()),
                ("company_id", "=", source.company_id.id),
            ],
            limit=1,
        )
        if not program:
            program = self.env["facodi.program"].create(
                {
                    "institution_partner_id": institution.id,
                    "code": program_values["code"],
                    "name": program_values["name"],
                    "degree_level": program_values["degree_level"],
                    "company_id": source.company_id.id,
                }
            )
        curriculum = self.search(
            [
                ("program_id", "=", program.id),
                ("version", "=", plan_values["version"]),
            ],
            limit=1,
        )
        if curriculum and curriculum.state != "draft":
            raise UserError(_("Only a draft curriculum version can be re-imported."))
        if not curriculum:
            curriculum = self.create(
                {
                    "program_id": program.id,
                    "version": plan_values["version"],
                    "name": plan_values["name"],
                }
            )

        digest = hashlib.sha256(bytes(payload)).hexdigest()
        external_key = (
            f"curriculum:{institution.id}:{program.code}:{curriculum.version}".lower()
        )
        resource_result = {
            "external_key": external_key,
            "source_url": "",
            "resource_type": "curriculum",
            "name": curriculum.name,
            "description": "",
            "source_language_code": "",
            "mime_type": (
                "text/csv" if str(filename).lower().endswith(".csv") else "application/json"
            ),
            "content_text": json.dumps(document, ensure_ascii=False),
            "source_version": digest,
            "snapshot_payload": {
                "schema_version": 1,
                "provider": "curriculum_import",
                "filename": str(filename),
                "sha256": digest,
                "document": document,
            },
        }
        source_resource, source_snapshot, _changed = self.env[
            "facodi.resource"
        ].ingest_result(
            source,
            resource_result,
            attachment=attachment,
        )
        curriculum.period_ids.unlink()
        curriculum.write(
            {
                "name": plan_values["name"],
                "source_resource_id": source_resource.id,
                "source_snapshot_id": source_snapshot.id,
            }
        )
        self._materialise_periods(curriculum, document["periods"])
        return curriculum, source_resource, source_snapshot

    @api.model
    def _materialise_periods(self, curriculum, periods):
        role_map = {
            "topics": ("topic", "topic"),
            "learning_outcomes": ("learning_outcome", "learning_outcome"),
            "competencies": ("competency", "competency"),
            "prerequisites": ("prerequisite", "prerequisite"),
        }
        for period_values in periods:
            period = self.env["facodi.curriculum.period"].create(
                {
                    "curriculum_id": curriculum.id,
                    "name": period_values["name"],
                    "year_number": period_values["year"],
                    "semester_number": period_values["semester"],
                }
            )
            for unit_values in period_values["units"]:
                unit = self.env["facodi.course.unit"].create(
                    {
                        "period_id": period.id,
                        "code": unit_values["code"],
                        "name": unit_values["name"],
                        "ects": unit_values["ects"],
                        "description": unit_values.get("description") or "",
                    }
                )
                for field_name, (concept_type, role) in role_map.items():
                    for concept_name in unit_values.get(field_name) or []:
                        concept_code = f"{concept_type}:" + hashlib.sha256(
                            concept_name.casefold().encode("utf-8")
                        ).hexdigest()[:24]
                        concept = self.env["facodi.concept"].search(
                            [
                                ("code", "=", concept_code),
                                ("company_id", "=", curriculum.company_id.id),
                            ],
                            limit=1,
                        )
                        if not concept:
                            concept = self.env["facodi.concept"].create(
                                {
                                    "code": concept_code,
                                    "name": concept_name,
                                    "concept_type": concept_type,
                                    "company_id": curriculum.company_id.id,
                                }
                            )
                        self.env["facodi.unit.concept"].create(
                            {
                                "unit_id": unit.id,
                                "concept_id": concept.id,
                                "role": role,
                                "weight": 1.0,
                            }
                        )
                bibliography_ids = []
                for item in unit_values.get("bibliography") or []:
                    external_key = (
                        item.get("external_key") if isinstance(item, dict) else item
                    )
                    if external_key:
                        bibliography_ids.extend(
                            self.env["facodi.resource"].search(
                                [
                                    ("company_id", "=", curriculum.company_id.id),
                                    ("external_key", "=", external_key),
                                ]
                            ).ids
                        )
                if bibliography_ids:
                    unit.bibliography_resource_ids = [(6, 0, bibliography_ids)]


class FacodiCurriculumPeriod(models.Model):
    _name = "facodi.curriculum.period"
    _description = "FACODI Curriculum Period"
    _order = "sequence, id"

    curriculum_id = fields.Many2one(
        "facodi.curriculum",
        required=True,
        ondelete="cascade",
        index=True,
    )
    company_id = fields.Many2one(
        related="curriculum_id.company_id",
        store=True,
        index=True,
    )
    name = fields.Char(required=True, translate=True)
    year_number = fields.Integer(required=True)
    semester_number = fields.Integer(required=True)
    sequence = fields.Integer(compute="_compute_sequence", store=True, index=True)
    unit_ids = fields.One2many("facodi.course.unit", "period_id", copy=True)

    _curriculum_period_unique = models.Constraint(
        "UNIQUE(curriculum_id, year_number, semester_number)",
        "A year and semester can occur only once in a curriculum version.",
    )

    @api.depends("year_number", "semester_number")
    def _compute_sequence(self):
        for period in self:
            period.sequence = period.year_number * 100 + period.semester_number

    @api.constrains("year_number", "semester_number")
    def _check_order_values(self):
        for period in self:
            if period.year_number < 1 or not 1 <= period.semester_number <= 4:
                raise ValidationError(
                    _("Year must be positive and semester must be between 1 and 4.")
                )


class FacodiCourseUnit(models.Model):
    _name = "facodi.course.unit"
    _description = "FACODI Curricular Unit"
    _inherit = ["mail.thread", "mail.activity.mixin"]
    _order = "year_number, semester_number, code, id"

    period_id = fields.Many2one(
        "facodi.curriculum.period",
        required=True,
        ondelete="cascade",
        index=True,
    )
    curriculum_id = fields.Many2one(
        related="period_id.curriculum_id",
        store=True,
        index=True,
    )
    program_id = fields.Many2one(
        related="curriculum_id.program_id",
        store=True,
        index=True,
    )
    company_id = fields.Many2one(
        related="curriculum_id.company_id",
        store=True,
        index=True,
    )
    year_number = fields.Integer(related="period_id.year_number", store=True)
    semester_number = fields.Integer(
        related="period_id.semester_number",
        store=True,
    )
    code = fields.Char(required=True, index=True, tracking=True)
    name = fields.Char(required=True, translate=True, tracking=True)
    description = fields.Html(translate=True, sanitize_overridable=True)
    ects = fields.Float(string="ECTS", default=0.0)
    difficulty_level = fields.Selection(
        [
            ("beginner", "Beginner"),
            ("intermediate", "Intermediate"),
            ("advanced", "Advanced"),
            ("expert", "Expert"),
        ],
    )
    native_channel_id = fields.Many2one(
        "slide.channel",
        string="Odoo eLearning Course",
        ondelete="set null",
    )
    concept_relation_ids = fields.One2many(
        "facodi.unit.concept",
        "unit_id",
        copy=True,
    )
    topic_relation_ids = fields.One2many(
        "facodi.unit.concept",
        "unit_id",
        domain=[("role", "=", "topic")],
    )
    outcome_relation_ids = fields.One2many(
        "facodi.unit.concept",
        "unit_id",
        domain=[("role", "=", "learning_outcome")],
    )
    competency_relation_ids = fields.One2many(
        "facodi.unit.concept",
        "unit_id",
        domain=[("role", "=", "competency")],
    )
    prerequisite_relation_ids = fields.One2many(
        "facodi.unit.concept",
        "unit_id",
        domain=[("role", "=", "prerequisite")],
    )
    bibliography_resource_ids = fields.Many2many(
        "facodi.resource",
        "facodi_unit_bibliography_rel",
        "unit_id",
        "resource_id",
        string="Bibliography",
    )

    _curriculum_code_unique = models.Constraint(
        "UNIQUE(curriculum_id, code)",
        "A curricular unit code must be unique within a curriculum version.",
    )

    @api.constrains("ects")
    def _check_ects(self):
        for unit in self:
            if unit.ects < 0 or unit.ects > 60:
                raise ValidationError(_("ECTS must be between 0 and 60."))

    def action_generate_match_candidates(self):
        self.ensure_one()
        return self.env["facodi.resource.unit.match"].generate_for_unit(self)

    def action_queue_matching(self):
        self.ensure_one()
        return self.env["facodi.job"].enqueue(
            "match",
            f"match:unit:{self.id}:{fields.Datetime.now()}",
            {"unit_id": self.id},
            company=self.company_id,
        )

    def action_compute_coverage(self):
        self.ensure_one()
        return self.env["facodi.coverage"].compute_for_unit(self)

    def action_queue_coverage(self):
        self.ensure_one()
        return self.env["facodi.job"].enqueue(
            "coverage",
            f"coverage:unit:{self.id}:{fields.Datetime.now()}",
            {"unit_id": self.id},
            company=self.company_id,
        )


class FacodiUnitConcept(models.Model):
    _name = "facodi.unit.concept"
    _description = "FACODI Curricular Requirement"
    _order = "unit_id, role, sequence, id"

    unit_id = fields.Many2one(
        "facodi.course.unit",
        required=True,
        ondelete="cascade",
        index=True,
    )
    concept_id = fields.Many2one(
        "facodi.concept",
        required=True,
        ondelete="restrict",
        index=True,
    )
    company_id = fields.Many2one(
        related="unit_id.company_id",
        store=True,
        index=True,
    )
    role = fields.Selection(
        [
            ("topic", "Topic"),
            ("learning_outcome", "Learning Outcome"),
            ("competency", "Competency"),
            ("prerequisite", "Prerequisite"),
        ],
        required=True,
        index=True,
    )
    weight = fields.Float(default=1.0)
    sequence = fields.Integer(default=10)
    notes = fields.Text(translate=True)

    _unit_concept_role_unique = models.Constraint(
        "UNIQUE(unit_id, concept_id, role)",
        "A concept can occur only once per role in a curricular unit.",
    )

    @api.constrains("weight")
    def _check_weight(self):
        for relation in self:
            if relation.weight < 0 or relation.weight > 1:
                raise ValidationError(_("Concept weight must be between 0 and 1."))

    @api.constrains("concept_id", "role")
    def _check_concept_role(self):
        for relation in self:
            if relation.concept_id.concept_type != relation.role:
                raise ValidationError(
                    _("The curricular role must match the canonical concept type.")
                )
