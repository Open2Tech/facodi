
-- Editorial study paths using existing published FACODI video objects.
-- Inspired by the Odoo Learn application topics, not a copy of Odoo courses.
CREATE TEMP TABLE _seq_manifest ON COMMIT DROP AS
SELECT * FROM jsonb_to_recordset('[{"slug":"facodi-odoo19-visao-geral","title":"Odoo 19 — visão geral de um ERP integrado","domain":"erp","tag":"odoo-19","ids":["OZLP-SCHW7A","63oKGbVtJZY"],"units":["14181196","14181197","14181177","19411050"]},{"slug":"facodi-odoo19-rh-colaboradores","title":"Odoo — colaboradores, departamentos e ciclo de vida","domain":"rh","tag":"recursos-humanos","ids":["X0oPzFw8JpI","OEdRSbbYI14","EnMondApUtY","bVbR3tqTHpQ","xSjG8zovhB4","ZmEFgl3N2vY","idf86c350U0","G3bEOwfrVrc"],"units":["14181094","IFESCAR-ADM26-3-GESTAO-PESSOAS"]},{"slug":"facodi-odoo19-rh-recrutamento","title":"Odoo — recrutamento e seleção de candidatos","domain":"rh","tag":"recrutamento","ids":["uzwSxfGEK8Q","0Uj0n0ERx6I","FYkWjKTKX6o","M8BSg8VMta4","xEcOUeBWGL0","-xHbo21qjJI","O-ruLrLXoNE","_tGbu-b1bIc","WXn5il2wB0o","6JfjBoIzgZw"],"units":["14181094","IFESCAR-ADM26-3-GESTAO-PESSOAS"]},{"slug":"facodi-odoo19-rh-desempenho","title":"Odoo — avaliação de desempenho e objetivos","domain":"rh","tag":"avaliacao-desempenho","ids":["vlVKTeokFO4","vYyl77YzRwY","l--UNp-Xlpk","O19X_lNEwIA"],"units":["14181094","IFESCAR-ADM26-3-GESTAO-PESSOAS"]},{"slug":"facodi-odoo19-rh-tempo","title":"Odoo — assiduidade, férias e horas de trabalho","domain":"rh","tag":"assiduidade","ids":["zdaELnDd13I","gB_y1GRLwys","IMTzJoWrtU0","W3K_9S3Qsj8","U70Tqg8Z0sk","lLYuOJYkiq4","PhZYGTNxu6s","MbwCZ6-H6Dw"],"units":["14181094","IFESCAR-ADM26-3-GESTAO-PESSOAS"]},{"slug":"facodi-odoo19-rh-remuneracao","title":"Odoo — contratos, processamento salarial e relatórios","domain":"rh","tag":"remuneracao","ids":["DCd6Mf-CPf8","q9dmuj9huFk","qjfJXsg_zSA","wZducJaKuGI","jjLrgiQoJsc","ijVjz469WHc","m0t1Z4NY0Ww","NrTLOOuVehQ"],"units":["14181094"]},{"slug":"facodi-odoo19-rh-indicacoes","title":"Odoo — indicações e recomendação de candidatos","domain":"rh","tag":"recrutamento","ids":["ot51_hzEptc","TV0k3ro2sjI","pBlGLhBoRvY","oQRxU4puI34"],"units":["14181094"]},{"slug":"facodi-odoo19-operacoes-frota","title":"Odoo — gestão e manutenção de frotas","domain":"operations","tag":"frota","ids":["_oFiIVuXV7k","ie9X1MNUFcs","zFNHNHI2p6M","vSOihwvGf_4"],"units":["14181197","14181196"]},{"slug":"facodi-odoo19-operacoes-rececao","title":"Odoo — receção e atendimento presencial","domain":"operations","tag":"atendimento","ids":["CmztKGWVph0","sCTea1IkIl4"],"units":["14181197"]},{"slug":"facodi-odoo19-operacoes-refeicoes","title":"Odoo — gestão interna de refeições e encomendas","domain":"operations","tag":"operacoes","ids":["_MkDQ7hrDn0","ydg64NYZZzI","qcCQOCjGvT0"],"units":["14181197"]},{"slug":"facodi-odoo19-financas-despesas","title":"Odoo — despesas, cartões e refaturação","domain":"finance","tag":"contabilidade","ids":["gTWm1ji4u9A","rye1ajtwCis","8_Nc6SVaN-4","hXkmv9MdeRg","PV2nsCeWVCs","B4iSBSeSK24"],"units":["14181196","14181197"]},{"slug":"facodi-odoo19-operacoes-aprovacoes","title":"Odoo — aprovações e segurança operacional","domain":"operations","tag":"operacoes","ids":["cKCytSOotDo","Xn9_LuE9Hio","bUcuZork1XY"],"units":["14181197"]},{"slug":"facodi-odoo19-servicos-helpdesk","title":"Odoo — Helpdesk e Serviço de Campo","domain":"operations","tag":"helpdesk","ids":["GewHZ9JKQHQ","yIemkwQy3a4","cr-MWnAXtiQ","yZdcmAApq-0"],"units":["14181197","19411050"]},{"slug":"facodi-tecnologia-redes-protocolos","title":"Redes de Computadores — IP, DNS, HTTPS e cloud","domain":"network","tag":"redes","ids":["xj_GjnD4uyI","UIcCwuYzxcE"],"units":["19411014","18121014"]},{"slug":"facodi-tecnologia-dev-containers","title":"Ambientes colaborativos — Dev Containers e Python","domain":"development","tag":"dev-containers","ids":["p9L7YFqHGk4","SYU8tT_WqIY","HuAc85cLRx0","naGF7EIUFp0"],"units":["19411001","18121017"]},{"slug":"facodi-tecnologia-python-distribuicao","title":"Python — pacotes, organização e executáveis","domain":"development","tag":"python","ids":["O3bs4JtHrow","ZOSWdktsKf0","EoQFKtPz15Y"],"units":["18121006","19411000"]},{"slug":"facodi-tecnologia-lowcode-plataformas","title":"Low-Code e aplicações empresariais — plataformas","domain":"development","tag":"low-code","ids":["viURaw3oiBA","jsS5FyfEv3o","Pu3tyDPf0pg","63oKGbVtJZY"],"units":["19411050","14181177"]},{"slug":"facodi-tecnologia-odoo-integracoes","title":"Odoo — API, webhooks e personalização de aplicações","domain":"development","tag":"integracoes","ids":["LlwvC8IxTaM","cr-MWnAXtiQ","uBmVnipuECk"],"units":["19411021","19411050","14181197"]},{"slug":"facodi-tecnologia-react-navegacao","title":"React e CMS — navegação e conteúdos modernos","domain":"development","tag":"react","ids":["Ab01W6h4Giw","CJOzgEC__7U","dU7GwCOgvNY"],"units":["19411021","18121018"]},{"slug":"facodi-tecnologia-cloud-ambientes","title":"Cloud e deploy — containers e pipelines","domain":"development","tag":"cloud","ids":["cVAB6Dj341E","p9L7YFqHGk4","Zd014DjonqE"],"units":["19411001","18121017"]}]'::jsonb)
AS x(slug text,title text,domain text,tag text,ids jsonb,units jsonb);
CREATE TEMP TABLE _seq_items ON COMMIT DROP AS
SELECT m.slug,x.value youtube_id,x.ordinality::int ord
FROM _seq_manifest m CROSS JOIN LATERAL jsonb_array_elements_text(m.ids)
WITH ORDINALITY x(value,ordinality);
CREATE TEMP TABLE _seq_units ON COMMIT DROP AS
SELECT m.slug,x.value code FROM _seq_manifest m
CROSS JOIN LATERAL jsonb_array_elements_text(m.units) x(value);

DO $guard$ BEGIN
IF (SELECT count(*) FROM _seq_manifest)<>20
OR (SELECT count(*) FROM _seq_items)<>88
OR (SELECT count(*) FROM _seq_units)<>38
OR EXISTS(SELECT 1 FROM _seq_items GROUP BY slug,youtube_id HAVING count(*)>1)
OR EXISTS(SELECT 1 FROM _seq_manifest m JOIN facodi.learning_objects l
 ON l.slug=m.slug AND l.object_type='playlist')
OR EXISTS(
 SELECT 1 FROM _seq_items x LEFT JOIN facodi.youtube_videos y ON y.youtube_video_id=x.youtube_id
 LEFT JOIN facodi.learning_objects v ON v.id=y.learning_object_id
 WHERE y.id IS NULL OR y.status<>'published' OR v.id IS NULL
 OR v.object_type<>'video' OR NOT v.published OR v.status<>'active')
OR EXISTS(SELECT 1 FROM _seq_units x
 LEFT JOIN facodi.curricular_units u ON u.code=x.code
 LEFT JOIN facodi.courses c ON c.id=u.course_id
 WHERE u.id IS NULL OR NOT u.published OR u.status<>'active' OR NOT c.published)
THEN RAISE EXCEPTION 'Unexpected source playlists, video links or academic unit IDs';END IF;
END $guard$;

INSERT INTO facodi.learning_objects(id,object_type,slug,title,description,objectives,keywords,tags,language,status,published,source_type,source_id,metadata)
SELECT md5('facodi:playlist:20261115:'||m.slug)::uuid,
'playlist',m.slug,m.title,
'Sequência independente organizada pela FACODI com vídeos dos respetivos autores. Percurso complementar inspirado em categorias de e-Learning, não acreditado pela Odoo nem pela universidade. Verificar a versão das aplicações, diferenças entre edições e legislação aplicável antes da utilização prática.',
jsonb_build_array('Compreender os principais conceitos na ordem proposta.',
'Consultar cada vídeo no canal original.','Comparar os processos com a documentação oficial e o currículo da UC.'),
ARRAY[m.title,m.tag,m.domain],
CASE WHEN m.domain IN ('erp','rh','operations','finance') OR m.slug LIKE '%odoo-%'
THEN ARRAY['odoo','erp','gestao','tecnologia',m.tag,'sequencia-editorial','facodi']
ELSE ARRAY['tecnologia',m.tag,'sequencia-editorial','facodi'] END,
'pt-PT','active',true,'generated','facodi:playlist:20261115:'||m.slug,
jsonb_build_object('playlist_type','facodi_owned_editorial_sequence',
'sequence_domain',m.domain,'topic_tag',m.tag,
'curation_scope','video_title_channel_and_existing_educational_context',
'curricular_equivalence',false,'official_odoo_course',false,
'formal_certification',false,'license_verified',false,'full_video_reviewed',false,
'video_count',jsonb_array_length(m.ids),
'original_source_links_reused',true,
'official_source_catalogue','https://www.odoo.com/pt_BR/slides',
'curation_batch','facodi_20261115_odoo19_and_stem_study_sequences')
FROM _seq_manifest m;

INSERT INTO facodi.learning_object_relations(id,parent_object_id,child_object_id,relation_type,position,created_by_mechanism,metadata)
SELECT md5('facodi:playlist:item:20261115:'||m.slug||':'||m.youtube_id)::uuid,
p.id,y.learning_object_id,'contains',m.ord,'structured_catalog_import',
jsonb_build_object('review_status','approved','review_scope','title_and_channel_only',
'full_video_reviewed',false,'official_course_lecture',false,'position_basis','thematic_learning_progression',
'curation_batch','facodi_20261115_odoo19_and_stem_study_sequences')
FROM _seq_items m JOIN facodi.learning_objects p
ON p.object_type='playlist' AND p.slug=m.slug
JOIN facodi.youtube_videos y ON y.youtube_video_id=m.youtube_id
ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;

INSERT INTO facodi.learning_object_relations(id,parent_object_id,child_object_id,relation_type,position,created_by_mechanism,metadata)
SELECT md5('facodi:playlist:unit:20261115:'||u.code||':'||m.slug)::uuid,
u.learning_object_id,p.id,'contains',
81000+row_number() over(partition by u.id order by m.slug)::int,
'structured_catalog_import',
jsonb_build_object('review_status','approved','review_scope','title_and_channel_only',
'pedagogical_scope','supplementary_independent_video_sequence',
'curation_batch','facodi_20261115_odoo19_and_stem_study_sequences')
FROM _seq_units m JOIN facodi.learning_objects p ON p.slug=m.slug AND p.object_type='playlist'
JOIN facodi.curricular_units u ON u.code=m.code
ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;

DO $verify$ BEGIN
IF (SELECT count(*) FROM facodi.learning_objects WHERE object_type='playlist' AND metadata->>'curation_batch'='facodi_20261115_odoo19_and_stem_study_sequences')<>20
OR (SELECT count(*) FROM facodi.learning_object_relations r
JOIN facodi.learning_objects p ON p.id=r.parent_object_id
WHERE p.metadata->>'curation_batch'='facodi_20261115_odoo19_and_stem_study_sequences' AND r.relation_type='contains')<>88
OR NOT EXISTS(SELECT 1 FROM facodi.get_public_editorial_playlist_v2('facodi-odoo19-rh-recrutamento') WHERE item_count=10)
OR NOT EXISTS(SELECT 1 FROM facodi.list_public_editorial_sequences_v1('19411014') WHERE playlist_slug='facodi-tecnologia-redes-protocolos')
THEN RAISE EXCEPTION 'Study sequence publication or public RPC incomplete';END IF;
END $verify$;
