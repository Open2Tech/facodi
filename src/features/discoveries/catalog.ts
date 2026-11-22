export const courseDiscoveries = {
  accounting: 'ctesp-contabilidade',
  computing: 'lesti',
  psychology: 'psicologia',
  neuroscience: 'neurociencias-cognitivas-neuropsicologia',
  astronomy: 'astronomia-astrofisica-gacs-2018',
  mathematics: 'matematica-aplicada-economia-gestao',
  civil: 'engenharia-civil',
  biochemistry: 'bioquimica',
  biomedicine: 'ciencias-biomedicas',
  marketing: 'ctesp-marketing-digital',
  design: 'ldcom',
  economy: 'economia',
  english: 'ufes-letras-ingles',
  electronics: 'engenharia-eletrotecnica-computadores',
  heritage: 'patrimonio-cultural-arqueologia',
  modeling: 'ctesp-desenho-modelacao-digital',
  networking: 'ctesp-sti',
  education: 'ciencias-educacao-formacao',
  sports: 'desporto',
  management: 'gestao',
  administration: 'ifes-cariacica-administracao-integrado-2026',
  positioning: 'marketing',
  communication: 'ciencias-da-comunicacao',
} as const;

export type CourseDiscovery = keyof typeof courseDiscoveries;
const courseEntries = Object.entries(courseDiscoveries) as [CourseDiscovery, string][];
export const discoveryByCourse = new Map(courseEntries.map(([id, slug]) => [slug, id]));

export const campusDiscoveries = {
  compass: '/',
  chain: '/sequences',
  margin: '/notes',
} as const;

export type CampusDiscovery = keyof typeof campusDiscoveries;
export type Discovery = CourseDiscovery | CampusDiscovery;

export const discoveryLinks: { id: Discovery; to: string }[] = [
  ...Object.entries(campusDiscoveries).map(([id, to]) => ({ id: id as CampusDiscovery, to: to + '#discovery-' + id })),
  ...courseEntries.map(([id, slug]) => ({ id, to: '/courses/' + slug + '#course-discovery' })),
];
