# Fragment for existing snapshot action, inside the validated receiver.
    if 'kf_demand_plan' in payload:
        plan = payload['kf_demand_plan']
        if not isinstance(plan,dict) or plan.get('contract')!='curricular_demand_plan.v1' or plan.get('scope')!='catalog_observation_only':
            raise UserError('Invalid demand planning contract')
        items = plan.get('items')
        total = plan.get('total')
        feedback = plan.get('feedback_review')
        if not isinstance(items,list) or len(items)>200 or not isinstance(total,int) or isinstance(total,bool) or total<len(items) or total>100000 or not isinstance(feedback,int) or isinstance(feedback,bool) or feedback<0 or feedback>100000:
            raise UserError('Invalid demand planning counts')
        seen = {}
        for item in items:
            if not isinstance(item,dict):
                raise UserError('Invalid demand item')
            uid = item.get('unit_id')
            digest = item.get('digest')
            title = item.get('title')
            slug = item.get('course_slug')
            code = item.get('unit_code')
            route = item.get('route')
            direct = item.get('direct_count')
            reuse = item.get('reuse_count')
            if not isinstance(uid,str) or len(uid)!=36 or any(ch not in '0123456789abcdef-' for ch in uid) or uid in seen or not isinstance(digest,str) or len(digest)!=64 or any(ch not in '0123456789abcdef' for ch in digest):
                raise UserError('Invalid demand identity')
            if not isinstance(title,str) or not 1<=len(title)<=250 or any(ch in '<>' for ch in title) or not isinstance(slug,str) or not 1<=len(slug)<=120 or not slug.replace('-','').replace('_','').isalnum() or not isinstance(code,str) or not 1<=len(code)<=40 or not code.replace('-','').replace('_','').replace('.','').isalnum():
                raise UserError('Invalid curricular fields')
            if route not in ['resource_discovery','modality_review','manual_review'] or not isinstance(direct,int) or isinstance(direct,bool) or not 0<=direct<=100000 or not isinstance(reuse,int) or isinstance(reuse,bool) or not 0<=reuse<=5:
                raise UserError('Invalid demand evidence')
            seen[uid] = item
        body += '<h3>ATLAS · Planeamento de necessidades</h3><p>Sinais curriculares ativos: '+str(total)+' · elegíveis para planeamento: '+str(len(items))+' · sinais agregados de feedback: '+str(feedback)+'. Ausência de associação não comprova lacuna. Priorizar reutilização e distinguir modalidade.</p>'
        if env['ir.config_parameter'].sudo().get_param('facodi.kf.production.enabled','False').lower() in ['true','1','yes']:
            Task = env['project.task']
            central = [('project_id','=',1),('company_id','=',1),('name','=like','KF · Produção v1 · Diagnóstico · %')]
            today = str(datetime.datetime.utcnow().date())
            active_count = Task.search_count(central+[('stage_id','in',[16,17,18])])
            created = Task.search_count(central+[('create_date','>=',today+' 00:00:00')])
            if active_count<3 and not created:
                triage = Task.search([('project_id','in',list(range(2,26))),('company_id','=',1),('name','=like','Triagem · %'),('stage_id','=',15)],limit=200)
                by_uid = {}
                for source in triage:
                    desc = str(source.description or '')
                    uid = desc.split('Supabase UC UUID: ',1)[1].split('<',1)[0].strip() if 'Supabase UC UUID: ' in desc else ''
                    if uid in seen:
                        by_uid.setdefault(uid,[]).append(source.id)
                for item in items:
                    uid = item['unit_id']
                    source_ids = by_uid.get(uid,[])
                    if len(source_ids)!=1:
                        continue
                    source = Task.browse(source_ids[0])
                    desc = str(source.description or '')
                    if source.stage_id.id!=15 or source.name!='Triagem · '+item['title'] or 'UC: '+item['unit_code']+' · '+item['course_slug'] not in desc:
                        continue
                    demand_key = 'KF-DEMAND-v1: '+uid
                    if Task.with_context(active_test=False).search_count(central+[('description','ilike',demand_key)]):
                        continue
                    title = item['title'].replace('&','&amp;')
                    next_action = {'resource_discovery':'Conferir FUC atual, objetivos, nível e idioma; avaliar reutilização antes de pesquisar fontes novas.','modality_review':'Confirmar modalidade e entregáveis; considerar guia de estágio/projeto em vez de exigir vídeos.','manual_review':'Conferir identidade e modalidade antes de escolher entregável.'}[item['route']]
                    report = '<p>KF-MRP: KF-DIAGNOSIS</p><p>KF-QTY: 1</p><p>'+demand_key+'</p><p>KF-DEMAND-DIGEST: '+item['digest']+'</p><p>KF-TRIAGE-TASK: '+str(source.id)+'</p><h3>Diagnóstico curricular · observação do catálogo</h3><p>UC: '+title+' · '+item['unit_code']+' · '+item['course_slug']+'</p><p>Sinal observado: sem sequência pública direta nem unit_videos no catálogo; relações diretas públicas: '+str(item['direct_count'])+'; candidatos heurísticos de reutilização: '+str(item['reuse_count'])+'. Rota: '+item['route']+'.</p><p>Limitações: não confirma lacuna pedagógica, nem FUC atual, modalidade ou adequação dos candidatos. Não autoriza publicação.</p><p>Próxima ação: '+next_action+'</p>'
                    mission = Task.with_context(tracking_disable=True,mail_create_nosubscribe=True).create({'name':'KF · Produção v1 · Diagnóstico · '+item['title'],'project_id':1,'company_id':1,'stage_id':16,'priority':'1','description':report})
                    source.with_context(tracking_disable=True).write({'stage_id':17})
                    source.message_post(subject='KF-DEMAND-DELEGATED-v1',body='Diagnóstico de catálogo delegado à missão '+str(mission.id)+'. Revisão curricular continua necessária.',subtype_xmlid='mail.mt_note',message_type='comment')
                    body += '<p>Nova missão de diagnóstico: '+str(mission.id)+' · tarefa curricular '+str(source.id)+'. Limite: uma por dia UTC e três abertas.</p>'
                    break
        if env['ir.config_parameter'].sudo().get_param('facodi.kf.production.enabled','False').lower() in ['true','1','yes']:
            Task = env['project.task']
            MO = env['mrp.production']
            missions = Task.search([('project_id','=',1),('company_id','=',1),('name','=like','KF · Produção v1 · Diagnóstico · %'),('stage_id','in',[16,17])],order='id asc',limit=3)
            reconciled = 0
            for mission in missions:
                desc = str(mission.description or '')
                uid = desc.split('KF-DEMAND-v1: ',1)[1].split('<',1)[0].strip() if 'KF-DEMAND-v1: ' in desc else ''
                sid = desc.split('KF-TRIAGE-TASK: ',1)[1].split('<',1)[0].strip() if 'KF-TRIAGE-TASK: ' in desc else ''
                item = seen.get(uid)
                if not item or not sid.isdigit():
                    continue
                source = Task.search([('id','=',int(sid)),('company_id','=',1),('project_id','in',list(range(2,26))),('stage_id','=',17)],limit=1)
                if not source or source.name!='Triagem · '+item['title'] or 'Supabase UC UUID: '+uid+'<' not in str(source.description or '') or 'UC: '+item['unit_code']+' · '+item['course_slug'] not in str(source.description or ''):
                    continue
                title = item['title'].replace('&','&amp;')
                next_action = {'resource_discovery':'Conferir FUC atual, objetivos, nível e idioma; avaliar reutilização antes de pesquisar fontes novas.','modality_review':'Confirmar modalidade e entregáveis; considerar guia de estágio/projeto em vez de exigir vídeos.','manual_review':'Conferir identidade e modalidade antes de escolher entregável.'}[item['route']]
                expected = '<p>KF-MRP: KF-DIAGNOSIS</p><p>KF-QTY: 1</p><p>KF-DEMAND-v1: '+uid+'</p><p>KF-DEMAND-DIGEST: '+item['digest']+'</p><p>KF-TRIAGE-TASK: '+sid+'</p><h3>Diagnóstico curricular · observação do catálogo</h3><p>UC: '+title+' · '+item['unit_code']+' · '+item['course_slug']+'</p><p>Sinal observado: sem sequência pública direta nem unit_videos no catálogo; relações diretas públicas: '+str(item['direct_count'])+'; candidatos heurísticos de reutilização: '+str(item['reuse_count'])+'. Rota: '+item['route']+'.</p><p>Limitações: não confirma lacuna pedagógica, nem FUC atual, modalidade ou adequação dos candidatos. Não autoriza publicação.</p><p>Próxima ação: '+next_action+'</p>'
                if desc!=expected or mission.name!='KF · Produção v1 · Diagnóstico · '+item['title']:
                    continue
                orders = MO.search([('origin','=','KF-MISSION-'+str(mission.id)),('company_id','=',1),('project_id','=',1),('product_id.default_code','=','KF-DIAGNOSIS'),('bom_id.code','=','KF-BOM-DIAGNOSIS'),('state','in',['draft','confirmed','progress'])],limit=2)
                if len(orders)!=1:
                    continue
                mo = orders[0]
                if mo.product_qty!=1 or mo.product_id.is_storable or mo.product_id.sale_ok or mo.product_id.purchase_ok or mo.product_id.standard_price!=0 or mo.bom_id.bom_line_ids or mo.move_raw_ids or mo.move_byproduct_ids or len(mo.workorder_ids)!=5 or any(m.state=='done' or m.picked for m in mo.move_finished_ids):
                    continue
                titles = ['KF · Evidência curricular','KF · Modalidade e cobertura','KF · Diagnóstico estruturado','KF · Identidade e limites','KF · Entrega operacional']
                evidence_notes = ['Identidade e código da UC, curso e contagens do catálogo reconciliados com o registo de procura.', 'Rota '+item['route']+' é uma heurística; modalidade e FUC atual não confirmadas. Não confundir cobertura observada com lacuna pedagógica.', 'Relatório de sinal, limitações e próxima ação presente na missão, reconstruído do contrato corrente.', 'Título, UUID, código, curso, digest e descrição comparados com o contrato atual e a tarefa curricular; revisão determinística, não independente por IA.', 'Relatório operacional entregue na tarefa curricular '+sid+'; sem alteração de conteúdos públicos.']
                tag = 'KF-DIAGNOSIS-EVIDENCE-v1: '+item['digest']
                if mo.state=='draft':
                    mo.action_confirm()
                checks = env['quality.check'].search([('production_id','=',mo.id)])
                works = mo.workorder_ids.sorted('sequence')
                if len(checks)!=5 or set(checks.mapped('workorder_id').ids)!=set(works.ids) or any(w.time_ids or w.move_raw_ids or w.state=='cancel' for w in works):
                    continue
                valid = True
                for i in range(5):
                    work = works[i]
                    check = checks.filtered(lambda q:q.workorder_id==work)
                    if len(check)!=1 or check.point_id.title!=titles[i] or check.point_id.operation_id!=work.operation_id or check.point_id.test_type_id.id!=7 or check.quality_state=='fail' or (check.quality_state=='pass' and tag not in str(check.note or '')) or (work.state=='done' and check.quality_state!='pass'):
                        valid = False
                if not valid:
                    continue
                for i in range(5):
                    work = works[i]
                    check = checks.filtered(lambda q:q.workorder_id==work)
                    if work.state=='done' and check.quality_state=='pass':
                        continue
                    if work.state not in ['ready','progress'] or any(w.state!='done' for w in work.blocked_by_workorder_ids):
                        break
                    if i==4:
                        if not env['mail.message'].search_count([('model','=','project.task'),('res_id','=',source.id),('subject','=','KF-DIAGNOSIS-DELIVERED-v1')]):
                            source.message_post(subject='KF-DIAGNOSIS-DELIVERED-v1',body='<p>Missão '+str(mission.id)+' · '+tag+'</p>'+expected,subtype_xmlid='mail.mt_note',message_type='comment')
                    if check.quality_state=='none':
                        check.write({'note':str(check.note or '')+'<p>'+tag+'. '+evidence_notes[i]+'</p>'})
                        check.do_pass()
                    if check.quality_state=='pass':
                        work.button_finish()
                    else:
                        break
                if all(w.state=='done' for w in works) and all(q.quality_state=='pass' for q in checks):
                    mission.write({'stage_id':19})
                    source.write({'stage_id':18})
                    reconciled += 1
            body += '<p>Diagnósticos entregues nesta execução: '+str(reconciled)+'. Aprovação do diagnóstico operacional não equivale a publicação curricular; ordens prontas para encerramento, sem validação automática de inventário.</p>'
