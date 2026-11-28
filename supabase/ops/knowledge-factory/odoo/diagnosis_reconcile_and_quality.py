# Fragment for existing manufacturing reconciliation action, inside the enabled branch.
    # Close delivered digital diagnoses separately from the snapshot transaction.
    diagnostic_orders = MO.search([('company_id','=',1),('project_id','=',1),('state','in',['to_close','done']),('origin','=like','KF-MISSION-%'),('product_id.default_code','=','KF-DIAGNOSIS'),('bom_id.code','=','KF-BOM-DIAGNOSIS')],order='id asc',limit=100)
    for order in diagnostic_orders:
        tail = order.origin.split('KF-MISSION-',1)[1]
        if not tail.isdigit() or order.product_qty!=1 or order.qty_producing!=1 or order.product_id.is_storable or order.product_id.sale_ok or order.product_id.purchase_ok or order.product_id.standard_price!=0 or order.bom_id.bom_line_ids or order.move_raw_ids or order.move_byproduct_ids or len(order.workorder_ids)!=5 or len(order.move_finished_ids)!=1:
            continue
        mission = Task.search([('id','=',int(tail)),('company_id','=',1),('project_id','=',1),('stage_id','=',19),('name','=like','KF · Produção v1 · Diagnóstico · %')],limit=1)
        if not mission or env['mail.message'].search_count([('model','=','project.task'),('res_id','=',mission.id),('subject','=','KF-DIAGNOSIS-RECEIPT-v1')]):
            continue
        desc = str(mission.description or '')
        uid = desc.split('KF-DEMAND-v1: ',1)[1].split('<',1)[0].strip() if 'KF-DEMAND-v1: ' in desc else ''
        digest = desc.split('KF-DEMAND-DIGEST: ',1)[1].split('<',1)[0].strip() if 'KF-DEMAND-DIGEST: ' in desc else ''
        sid = desc.split('KF-TRIAGE-TASK: ',1)[1].split('<',1)[0].strip() if 'KF-TRIAGE-TASK: ' in desc else ''
        if len(uid)!=36 or any(ch not in '0123456789abcdef-' for ch in uid) or len(digest)!=64 or any(ch not in '0123456789abcdef' for ch in digest) or not sid.isdigit() or not int(sid)>0:
            continue
        source = Task.search([('id','=',int(sid)),('company_id','=',1),('project_id','in',list(range(2,26))),('stage_id','in',[18,19,20])],limit=1)
        if not source or 'Supabase UC UUID: '+uid+'<' not in str(source.description or ''):
            continue
        delivery = env['mail.message'].search([('model','=','project.task'),('res_id','=',source.id),('subject','=','KF-DIAGNOSIS-DELIVERED-v1')],limit=2)
        tag = 'KF-DIAGNOSIS-EVIDENCE-v1: '+digest
        if len(delivery)!=1 or tag not in str(delivery.body or '') or 'Missão '+str(mission.id)+' ·' not in str(delivery.body or ''):
            continue
        checks = env['quality.check'].search([('production_id','=',order.id)])
        if len(checks)!=5 or set(checks.mapped('workorder_id').ids)!=set(order.workorder_ids.ids) or any(q.quality_state!='pass' or tag not in str(q.note or '') for q in checks) or any(w.state!='done' or w.time_ids or w.move_raw_ids for w in order.workorder_ids):
            continue
        move = order.move_finished_ids
        if move.product_id!=order.product_id or move.quantity!=1:
            continue
        if order.state=='to_close' and move.state!='done' and not move.picked:
            order.button_mark_done()
        if order.state=='done' and move.state=='done' and move.picked:
            mission.message_post(subject='KF-DIAGNOSIS-RECEIPT-v1',body='<p>KF-DIAGNOSIS-v1|'+uid+'|'+digest+'|'+sid+'|'+str(order.id)+'|5|5|done</p>',subtype_xmlid='mail.mt_note',message_type='comment')
        break

    failed_checks = env['quality.check'].search([('quality_state','=','fail'),('production_id.company_id','=',1),('production_id.project_id','=',1),('production_id.product_id.default_code','in',['KF-RESOURCE','KF-SEQUENCE','KF-UNIT','KF-MAINT','KF-COURSE','KF-LESSON','KF-CURATION','KF-DIAGNOSIS']),('production_id.state','not in',['cancel'])],order='id asc',limit=10)
    for check in failed_checks:
        order = check.production_id
        key = 'KF-NC-CHECK-v1: '+str(check.id)
        title = key+' · '+check.name
        alerts = env['quality.alert'].with_context(active_test=False).search([('company_id','=',1),('title','=',title),('production_id','=',order.id)],limit=2)
        if len(alerts)>1:
            continue
        if not alerts:
            point = str(check.point_id.title or '').replace('&','&amp;').replace('<','&lt;').replace('>','&gt;')
            alerts = env['quality.alert'].with_context(tracking_disable=True,mail_create_nosubscribe=True).create({'title':title,'team_id':2,'company_id':1,'product_id':order.product_id.id,'production_id':order.id,'workorder_id':check.workorder_id.id,'description':'<p>Não conformidade nativa: '+check.name+' · '+point+'. Inspeção '+str(check.id)+', OF '+str(order.id)+'. Preservar falha e evidências. Exigir retrabalho e nova inspeção; não aprovar automaticamente.</p>'})
        origin = str(order.origin or '')
        if not origin.startswith('KF-MISSION-') or not origin[11:].isdigit():
            continue
        mission = Task.search([('id','=',int(origin[11:])),('company_id','=',1),('project_id','=',1),('name','=like','KF · Produção v1 · %')],limit=1)
        if not mission or mission.stage_id.id not in [16,17,18,19,21]:
            continue
        rework = Task.with_context(active_test=False).search([('project_id','=',1),('company_id','=',1),('parent_id','=',mission.id),('name','=', 'KF · Retrabalho v1 · '+check.name)],limit=2)
        if len(rework)>1:
            continue
        if not rework:
            rework = Task.with_context(tracking_disable=True,mail_create_nosubscribe=True).create({'name':'KF · Retrabalho v1 · '+check.name,'project_id':1,'company_id':1,'parent_id':mission.id,'stage_id':15,'priority':'1','description':'<p>'+key+' · alerta '+str(alerts.id)+' · OF '+str(order.id)+'. Corrigir o entregável original; preservar evidência e versão rejeitada. Não libertar antes de nova inspeção independente.</p>'})
        if mission.stage_id.id!=21:
            mission.write({'stage_id':21})
