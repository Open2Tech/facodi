# Insert after the mirror metrics in the aggregated snapshot server action.
# Odoo provides env and UserError. The surrounding action provides assurance and body.
batches = assurance.get('resource_av_batches', [])
if not isinstance(batches, list) or len(batches) > 20:
    raise UserError('Invalid AV batch list')

authorizations = env['ir.config_parameter'].sudo().get_param('facodi.kf.mrp.evidence.manifest.v1', '').split(';')
batches_by_task = {}
for evidence in batches:
    if not isinstance(evidence, dict) or evidence.get('scope') != 'partial_av_cross_provider':
        raise UserError('Invalid AV evidence scope')
    task_id = evidence.get('task_id')
    expected = evidence.get('expected')
    receipt_id = evidence.get('receipt_id')
    digest = evidence.get('evidence_hash')
    jobs = evidence.get('job_ids')
    if (not isinstance(task_id, int) or isinstance(task_id, bool) or task_id <= 0
            or not isinstance(expected, int) or isinstance(expected, bool) or not 1 <= expected <= 20):
        raise UserError('Invalid AV batch size or task')
    if not isinstance(receipt_id, str) or len(receipt_id) != 36 or any(c not in '0123456789abcdef-' for c in receipt_id):
        raise UserError('Invalid AV receipt identifier')
    if not isinstance(digest, str) or len(digest) != 64 or any(c not in '0123456789abcdef' for c in digest):
        raise UserError('Invalid AV evidence hash')
    if not isinstance(jobs, list) or len(jobs) > expected:
        raise UserError('Invalid AV evidence list')
    for job_id in jobs:
        if not isinstance(job_id, str) or len(job_id) != 36 or any(c not in '0123456789abcdef-' for c in job_id):
            raise UserError('Invalid AV job identifier')
    if len(set(jobs)) != len(jobs):
        raise UserError('Duplicate AV job identifier')

    key = '|'.join([str(task_id), 'KF-BOM-RESOURCE', 'KF-RESOURCE', str(expected), receipt_id, digest])
    if key in authorizations:
        batches_by_task.setdefault(task_id, []).append(evidence)

if batches:
    body += '<h3>Quality · Evidência audiovisual</h3>'
for task_id in sorted(batches_by_task):
    task_batches = batches_by_task[task_id]
    if len(task_batches) != 1:
        body += '<p>Missão ' + str(task_id) + ': múltiplos manifestos ativos, validação pendente.</p>'
        continue
    evidence = task_batches[0]
    expected = evidence['expected']
    jobs = evidence['job_ids']
    count = str(len(jobs)) + '/' + str(expected)
    body += '<p>Missão ' + str(task_id) + ': ' + count + ' recursos com evidência parcial e consenso entre fornecedores. Revisão integral, licença e autorização editorial por validar.</p>'
    mission = env['project.task'].search([
        ('id', '=', task_id), ('project_id', '=', 1), ('company_id', '=', 1),
        ('name', '=like', 'KF · Produção v1 · %'),
    ], limit=1)
    orders = env['mrp.production'].search([
        ('origin', '=', 'KF-MISSION-' + str(task_id)), ('company_id', '=', 1),
        ('project_id', '=', 1), ('bom_id.code', '=', 'KF-BOM-RESOURCE'),
        ('product_id.default_code', '=', 'KF-RESOURCE'), ('state', 'in', ['confirmed', 'progress']),
    ], limit=2)
    if not mission or len(orders) != 1 or orders.product_qty != expected:
        continue
    check = env['quality.check'].search([
        ('production_id', '=', orders.id), ('point_id.title', '=', 'KF · Pertinência curricular'),
        ('workorder_id.operation_id.sequence', '=', 30),
    ], limit=2)
    if len(check) != 1 or check.quality_state != 'none':
        continue
    marker = '<h3>KF AV evidence snapshot v1</h3>'
    base_note = str(check.note or '').split(marker, 1)[0]
    note = (base_note + marker + '<p>' + count + ' recursos com evidência audiovisual parcial e consenso. '
            + 'Jobs: ' + (', '.join(jobs) if jobs else 'nenhum')
            + '. Revisão integral, licença e autorização editorial por validar.</p>')
    if str(check.note or '') != note:
        check.with_context(tracking_disable=True).write({'note': note})
