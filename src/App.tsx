import { useMemo, useRef, useState } from 'react';

const APP_NAME = 'O Conto de um Mundo Cruel';
const VERSION = 2;

type AttributeKey = 'FOR' | 'DES' | 'CON' | 'RES' | 'INT' | 'SAB' | 'CAR';
type AttributeMap = Record<AttributeKey, number>;
type HumanBonus = 'skill' | 'attribute';
type CopyState = 'idle' | 'copied' | 'error';

type RpgClass = {
  id: string;
  name: string;
  description: string;
  base: AttributeMap;
  recommendedSkills: string[];
  trainedSkills: number;
};

type Race = {
  id: string;
  name: string;
  description: string;
  modifiers: AttributeMap;
  physical: string;
  lifespan: string;
  maturity: string;
};

type Skill = {
  id: string;
  name: string;
  groups: AttributeKey[];
  scalesWith: AttributeKey[];
};

type Armor = {
  id: string;
  name: string;
  defense: number;
  dodgePenalty: number;
  minStrength: number;
  description: string;
};

type Shield = Armor;

type WeaponGrip = 'Leve' | 'Uma Mão' | 'Versátil' | 'Duas Mãos';
type Weapon = {
  id: string;
  name: string;
  damage: string[];
  damageType: string;
  training: 'Simples' | 'Marcial';
  grip: WeaponGrip;
  scalesWith: AttributeKey[];
};

type CharacterSheet = {
  id: string;
  name: string;
  age: string;
  classId: string;
  raceId: string;
  humanBonus: HumanBonus;
  adjustments: AttributeMap;
  trainedSkillIds: string[];
  armorId: string;
  shieldId: string;
  mainWeaponId: string;
  lightWeaponIds: string[];
  updatedAt: string;
};

const ATTRIBUTES: AttributeKey[] = ['FOR', 'DES', 'CON', 'RES', 'INT', 'SAB', 'CAR'];
const ZERO: AttributeMap = { FOR: 0, DES: 0, CON: 0, RES: 0, INT: 0, SAB: 0, CAR: 0 };

const ATTRIBUTE_LABELS: Record<AttributeKey, string> = {
  FOR: 'Força',
  DES: 'Destreza',
  CON: 'Constituição',
  RES: 'Resistência',
  INT: 'Inteligência',
  SAB: 'Sabedoria',
  CAR: 'Carisma',
};

const ATTRIBUTE_HINTS: Record<AttributeKey, string> = {
  FOR: 'Força física, carga, impacto e brutalidade marcial.',
  DES: 'Agilidade, reflexos, precisão, esquiva e furtividade.',
  CON: 'Vigor, fôlego, tolerância a esforço e vitalidade.',
  RES: 'Resistência a dano, dor, pressão e condições hostis.',
  INT: 'Estudo, memória, lógica, arcanismo e investigação.',
  SAB: 'Percepção, instinto, fé, medicina e sobrevivência.',
  CAR: 'Presença, influência, liderança, mentira e magnetismo.',
};

const classes: RpgClass[] = [
  {
    id: 'bardo',
    name: 'Bardo',
    description:
      'Artista, diplomata e manipulador social que usa presença, música, palavra e conhecimento para apoiar aliados e controlar situações.',
    base: { FOR: 8, DES: 13, CON: 10, RES: 9, INT: 11, SAB: 12, CAR: 17 },
    recommendedSkills: ['Atuação', 'Persuasão', 'Enganação', 'Intuição', 'História'],
    trainedSkills: 4,
  },
  {
    id: 'berserker',
    name: 'Berserker',
    description:
      'Combatente brutal movido por fúria, dor e instinto, feito para causar dano físico absurdo e continuar de pé mesmo ferido.',
    base: { FOR: 17, DES: 11, CON: 16, RES: 14, INT: 7, SAB: 9, CAR: 6 },
    recommendedSkills: ['Atletismo', 'Intimidação', 'Sobrevivência', 'Percepção'],
    trainedSkills: 2,
  },
  {
    id: 'clerigo',
    name: 'Clérigo',
    description:
      'Devoto, curandeiro e ritualista que usa fé, sabedoria e conhecimento espiritual para curar, proteger e purificar.',
    base: { FOR: 10, DES: 9, CON: 12, RES: 11, INT: 12, SAB: 17, CAR: 9 },
    recommendedSkills: ['Religião', 'Medicina', 'Intuição', 'História', 'Persuasão'],
    trainedSkills: 3,
  },
  {
    id: 'guerreiro',
    name: 'Guerreiro',
    description:
      'Especialista em combate armado, treinado para usar armas, armaduras e técnicas militares com consistência.',
    base: { FOR: 16, DES: 12, CON: 14, RES: 13, INT: 8, SAB: 10, CAR: 7 },
    recommendedSkills: ['Atletismo', 'Intimidação', 'Percepção', 'Sobrevivência'],
    trainedSkills: 2,
  },
  {
    id: 'paladino',
    name: 'Paladino',
    description:
      'Guerreiro juramentado que combina força marcial, armadura pesada, liderança e poder vindo de um código ou juramento.',
    base: { FOR: 15, DES: 8, CON: 14, RES: 14, INT: 8, SAB: 10, CAR: 13 },
    recommendedSkills: ['Religião', 'Persuasão', 'Intimidação', 'Atletismo', 'Intuição'],
    trainedSkills: 3,
  },
  {
    id: 'ladino',
    name: 'Ladino',
    description:
      'Especialista em furtividade, infiltração, golpes precisos, armadilhas, crime e vantagem tática.',
    base: { FOR: 8, DES: 17, CON: 10, RES: 8, INT: 12, SAB: 12, CAR: 11 },
    recommendedSkills: ['Stealth', 'Presteza de mão', 'Acrobacia', 'Investigação', 'Enganação'],
    trainedSkills: 4,
  },
  {
    id: 'arcanista',
    name: 'Arcanista',
    description:
      'Estudioso da magia, símbolos, alquimia, grimórios e rituais. Usa conhecimento para manipular forças arcanas.',
    base: { FOR: 6, DES: 10, CON: 9, RES: 8, INT: 18, SAB: 13, CAR: 8 },
    recommendedSkills: ['Arcanismo', 'História', 'Investigação', 'Religião', 'Natureza'],
    trainedSkills: 4,
  },
  {
    id: 'patrulheiro',
    name: 'Patrulheiro',
    description:
      'Rastreador, caçador e batedor especializado em sobrevivência, exploração, emboscadas e combate em território hostil.',
    base: { FOR: 12, DES: 15, CON: 12, RES: 10, INT: 9, SAB: 16, CAR: 6 },
    recommendedSkills: ['Sobrevivência', 'Percepção', 'Natureza', 'Adestramento', 'Stealth', 'Atletismo'],
    trainedSkills: 4,
  },
  {
    id: 'duelista',
    name: 'Duelista',
    description:
      'Combatente ágil e técnico que depende de esquiva, precisão, contra-ataques e mobilidade em vez de armadura pesada.',
    base: { FOR: 10, DES: 18, CON: 10, RES: 8, INT: 11, SAB: 11, CAR: 10 },
    recommendedSkills: ['Acrobacia', 'Atletismo', 'Percepção', 'Atuação', 'Intimidação'],
    trainedSkills: 3,
  },
  {
    id: 'monge',
    name: 'Monge',
    description:
      'Asceta marcial que transforma disciplina, respiração e movimento em defesa, golpes precisos e controle do campo de batalha.',
    base: { FOR: 11, DES: 17, CON: 12, RES: 11, INT: 10, SAB: 16, CAR: 7 },
    recommendedSkills: ['Acrobacia', 'Atletismo', 'Percepção', 'Intuição', 'Medicina'],
    trainedSkills: 4,
  },
  {
    id: 'feiticeiro',
    name: 'Feiticeiro',
    description:
      'Conjurador de poder inato, ligado ao sangue, emoção e energia elemental. Não aprende a magia: ele manifesta a magia.',
    base: { FOR: 7, DES: 11, CON: 10, RES: 9, INT: 10, SAB: 12, CAR: 18 },
    recommendedSkills: ['Persuasão', 'Intimidação', 'Enganação', 'Arcanismo', 'Intuição'],
    trainedSkills: 3,
  },
];

const races: Race[] = [
  {
    id: 'humano',
    name: 'Humano',
    description: 'Adaptável, numeroso e versátil. Humanos se destacam pela flexibilidade social, cultural e militar.',
    modifiers: { ...ZERO },
    physical: 'Altura e corpo muito variados. Pele, cabelo e estrutura facial mudam bastante conforme região e linhagem.',
    lifespan: '50 a 70 anos',
    maturity: '20 anos',
  },
  {
    id: 'elfo',
    name: 'Elfo',
    description: 'Ágil, perceptivo e longevo, mas menos robusto fisicamente.',
    modifiers: { FOR: -1, DES: 2, CON: -1, RES: -1, INT: 1, SAB: 1, CAR: 0 },
    physical: 'Corpos esguios, traços finos, orelhas longas, olhos claros ou incomuns e movimentos muito silenciosos.',
    lifespan: '700 a 900 anos',
    maturity: '100 anos',
  },
  {
    id: 'humano-elfo',
    name: 'Humano-Elfo',
    description: 'Descendente de humanos e elfos, equilibrando adaptabilidade, presença e intelecto.',
    modifiers: { FOR: 0, DES: 1, CON: 0, RES: 0, INT: 1, SAB: 0, CAR: 1 },
    physical: 'Traços humanos com sutilezas élficas: orelhas discretamente pontudas, rosto simétrico e olhar marcante.',
    lifespan: '120 a 180 anos',
    maturity: '20 anos',
  },
  {
    id: 'draconato-antigo',
    name: 'Draconato Antigo',
    description:
      'Descendente próximo dos dragões extintos, com corpo muito mais dracônico que humano. Vive muito mais, mas sofre forte impacto social.',
    modifiers: { FOR: 3, DES: -2, CON: 2, RES: 3, INT: 0, SAB: 0, CAR: -1 },
    physical: 'Escamas densas, crânio alongado, chifres grandes, cauda pesada, garras evidentes e silhueta monstruosa.',
    lifespan: '800 a 1000 anos',
    maturity: '50 anos',
  },
  {
    id: 'draconato-intermediario',
    name: 'Draconato Intermediário',
    description: 'Meio-termo entre a herança dracônica antiga e as gerações mais humanas.',
    modifiers: { FOR: 2, DES: -1, CON: 1, RES: 2, INT: 0, SAB: 0, CAR: 0 },
    physical: 'Escamas visíveis, chifres menores, olhos reptilianos e pele rígida em placas pelo corpo.',
    lifespan: '350 a 500 anos',
    maturity: '30 anos',
  },
  {
    id: 'draconato-recente',
    name: 'Draconato Recente',
    description: 'Draconato de geração recente, mais humano na aparência, mas ainda marcado pelo sangue dos dragões.',
    modifiers: { FOR: 1, DES: 0, CON: 1, RES: 1, INT: 0, SAB: 0, CAR: 1 },
    physical: 'Traços dracônicos discretos: manchas de escamas, olhos brilhantes, unhas duras e presença incomum.',
    lifespan: '80 a 100 anos',
    maturity: '15 anos',
  },
  {
    id: 'tiefling',
    name: 'Tiefling',
    description: 'Ser de origem estranha e aparência marcante, com magnetismo social e inclinação arcana.',
    modifiers: { FOR: 0, DES: 1, CON: 0, RES: 0, INT: 1, SAB: -1, CAR: 2 },
    physical: 'Chifres, cauda, olhos intensos, pele em tons incomuns e uma presença que parece deslocada do mundo comum.',
    lifespan: '70 a 110 anos',
    maturity: '20 anos',
  },
  {
    id: 'anao',
    name: 'Anão',
    description: 'Robusto, resistente e teimoso, com corpo compacto e enorme capacidade de suportar dano.',
    modifiers: { FOR: 1, DES: -1, CON: 2, RES: 2, INT: 0, SAB: 1, CAR: -1 },
    physical: 'Baixos, largos, ossatura forte, mãos grandes, barbas densas e pele marcada por trabalho, pedra e metal.',
    lifespan: '250 a 350 anos',
    maturity: '50 anos',
  },
  {
    id: 'orc',
    name: 'Orc',
    description: 'Forte, vigoroso e fisicamente dominante, feito para combate direto e sobrevivência brutal.',
    modifiers: { FOR: 3, DES: 0, CON: 2, RES: 1, INT: -1, SAB: 0, CAR: -1 },
    physical: 'Mandíbula larga, presas inferiores, pele rígida em tons terrosos ou esverdeados e musculatura pesada.',
    lifespan: '40 a 50 anos',
    maturity: '15 anos',
  },
  {
    id: 'lagarto-humano',
    name: 'Lagarto-Humano',
    description: 'Humanoide reptiliano resistente, instintivo e adaptado a ambientes hostis.',
    modifiers: { FOR: 1, DES: 1, CON: 1, RES: 2, INT: -1, SAB: 1, CAR: -2 },
    physical: 'Escamas naturais, cauda, olhos laterais ou fendidos, mandíbula forte e corpo adaptado a água e lama.',
    lifespan: '250 a 350 anos',
    maturity: '10 anos',
  },
  {
    id: 'minotauro',
    name: 'Minotauro',
    description: 'Criatura grande, forte e intimidadora, com corpo massivo, chifres e enorme poder físico.',
    modifiers: { FOR: 4, DES: -2, CON: 2, RES: 3, INT: -1, SAB: 0, CAR: -2 },
    physical: 'Corpo enorme, pescoço grosso, cabeça taurina ou semi-taurina, chifres grandes e cascos ou pernas robustas.',
    lifespan: '60 a 80 anos',
    maturity: '20 anos',
  },
];

const skills: Skill[] = [
  { id: 'atletismo', name: 'Atletismo', groups: ['FOR'], scalesWith: ['FOR'] },
  { id: 'intimidacao', name: 'Intimidação', groups: ['FOR', 'CAR'], scalesWith: ['FOR', 'CAR'] },
  { id: 'acrobacia', name: 'Acrobacia', groups: ['DES'], scalesWith: ['DES'] },
  { id: 'presteza-de-mao', name: 'Presteza de mão', groups: ['DES'], scalesWith: ['DES'] },
  { id: 'stealth', name: 'Stealth', groups: ['DES'], scalesWith: ['DES'] },
  { id: 'arcanismo', name: 'Arcanismo', groups: ['INT'], scalesWith: ['INT'] },
  { id: 'historia', name: 'História', groups: ['INT'], scalesWith: ['INT'] },
  { id: 'investigacao', name: 'Investigação', groups: ['INT'], scalesWith: ['INT'] },
  { id: 'natureza', name: 'Natureza', groups: ['INT'], scalesWith: ['INT'] },
  { id: 'religiao', name: 'Religião', groups: ['INT'], scalesWith: ['INT'] },
  { id: 'adestramento', name: 'Adestramento', groups: ['SAB'], scalesWith: ['SAB'] },
  { id: 'intuicao', name: 'Intuição', groups: ['SAB'], scalesWith: ['SAB'] },
  { id: 'percepcao', name: 'Percepção', groups: ['SAB'], scalesWith: ['SAB'] },
  { id: 'medicina', name: 'Medicina', groups: ['SAB'], scalesWith: ['SAB'] },
  { id: 'sobrevivencia', name: 'Sobrevivência', groups: ['SAB'], scalesWith: ['SAB'] },
  { id: 'atuacao', name: 'Atuação', groups: ['CAR'], scalesWith: ['CAR'] },
  { id: 'enganacao', name: 'Enganação', groups: ['CAR'], scalesWith: ['CAR'] },
  { id: 'persuasao', name: 'Persuasão', groups: ['CAR'], scalesWith: ['CAR'] },
];

const armors: Armor[] = [
  {
    id: 'none',
    name: 'Sem armadura',
    defense: 0,
    dodgePenalty: 0,
    minStrength: 0,
    description: 'Sem proteção extra. Mantém mobilidade total.',
  },
  {
    id: 'light',
    name: 'Armadura leve',
    defense: 2,
    dodgePenalty: 1,
    minStrength: 0,
    description: 'Couro, tecido reforçado ou placas pequenas. Exige pouco, mas reduz 1 de esquiva.',
  },
  {
    id: 'medium',
    name: 'Armadura média',
    defense: 4,
    dodgePenalty: 3,
    minStrength: 11,
    description: 'Cota, couro rígido, placas parciais. Protege bem, mas pesa no movimento.',
  },
  {
    id: 'heavy',
    name: 'Armadura pesada',
    defense: 6,
    dodgePenalty: 5,
    minStrength: 14,
    description: 'Metal pesado e cobertura ampla. Excelente defesa, esquiva muito limitada.',
  },
];

const shields: Shield[] = [
  {
    id: 'none',
    name: 'Sem escudo',
    defense: 0,
    dodgePenalty: 0,
    minStrength: 0,
    description: 'Mãos livres para armas, foco, escalada ou conjuração.',
  },
  {
    id: 'light',
    name: 'Escudo leve',
    defense: 1,
    dodgePenalty: 0,
    minStrength: 0,
    description: 'Pode ser usado com arma e não perde agilidade.',
  },
  {
    id: 'medium',
    name: 'Escudo médio',
    defense: 2,
    dodgePenalty: 1,
    minStrength: 10,
    description: 'Proteção confiável, mas já atrapalha reações rápidas.',
  },
  {
    id: 'heavy',
    name: 'Escudo pesado',
    defense: 3,
    dodgePenalty: 2,
    minStrength: 13,
    description: 'Escudo grande para linha de frente. Forte defesa, mobilidade menor.',
  },
  {
    id: 'tower',
    name: 'Escudo de torre',
    defense: 4,
    dodgePenalty: 4,
    minStrength: 16,
    description: 'Uma parede carregável. Defesa absurda, mas exige corpo e espaço.',
  },
];

const weapons: Weapon[] = [
  { id: 'adaga', name: 'Adaga', damage: ['1d4 + Bônus de FORÇA ou DESTREZA'], damageType: 'Cortante', training: 'Simples', grip: 'Leve', scalesWith: ['FOR', 'DES'] },
  { id: 'machadinha', name: 'Machadinha', damage: ['1d6 + Bônus de FORÇA'], damageType: 'Cortante', training: 'Simples', grip: 'Leve', scalesWith: ['FOR'] },
  { id: 'martelo', name: 'Martelo', damage: ['1d4 + Bônus de FORÇA'], damageType: 'Impacto', training: 'Simples', grip: 'Leve', scalesWith: ['FOR'] },
  { id: 'porrete', name: 'Porrete', damage: ['1d4 + Bônus de FORÇA'], damageType: 'Impacto', training: 'Simples', grip: 'Uma Mão', scalesWith: ['FOR'] },
  { id: 'dardo', name: 'Dardo (Javelin)', damage: ['1d6 + Bônus de FORÇA'], damageType: 'Perfuração', training: 'Simples', grip: 'Uma Mão', scalesWith: ['FOR'] },
  { id: 'maca', name: 'Maça', damage: ['1d6 + Bônus de FORÇA'], damageType: 'Espancamento', training: 'Simples', grip: 'Uma Mão', scalesWith: ['FOR'] },
  { id: 'bastao', name: 'Bastão', damage: ['Uma Mão: 1d6 + Bônus de FORÇA', 'Duas Mãos: 1d8 + Bônus de FORÇA'], damageType: 'Espancamento', training: 'Simples', grip: 'Versátil', scalesWith: ['FOR'] },
  { id: 'lanca', name: 'Lança', damage: ['Uma Mão: 1d6 + Bônus de FORÇA', 'Duas Mãos: 1d8 + Bônus de FORÇA'], damageType: 'Perfuração', training: 'Simples', grip: 'Versátil', scalesWith: ['FOR'] },
  { id: 'porrete-grande', name: 'Porrete Grande', damage: ['1d8 + Bônus de FORÇA'], damageType: 'Impacto', training: 'Simples', grip: 'Duas Mãos', scalesWith: ['FOR'] },
  { id: 'cimitarra', name: 'Cimitarra', damage: ['1d6 + Bônus de FORÇA ou DESTREZA'], damageType: 'Cortante', training: 'Marcial', grip: 'Uma Mão', scalesWith: ['FOR', 'DES'] },
  { id: 'espada-curta', name: 'Espada Curta', damage: ['1d6 + Bônus de FORÇA ou DESTREZA'], damageType: 'Perfuração', training: 'Marcial', grip: 'Uma Mão', scalesWith: ['FOR', 'DES'] },
  { id: 'mangual', name: 'Mangual', damage: ['1d8 + Bônus de FORÇA'], damageType: 'Impacto', training: 'Marcial', grip: 'Uma Mão', scalesWith: ['FOR'] },
  { id: 'maca-estrela', name: 'Maça-Estrela', damage: ['1d8 + Bônus de FORÇA'], damageType: 'Perfuração', training: 'Marcial', grip: 'Uma Mão', scalesWith: ['FOR'] },
  { id: 'rapieira', name: 'Rapieira', damage: ['1d8 + Bônus de FORÇA ou DESTREZA'], damageType: 'Perfuração', training: 'Marcial', grip: 'Uma Mão', scalesWith: ['FOR', 'DES'] },
  { id: 'picareta-de-guerra', name: 'Picareta de Guerra', damage: ['1d8 + Bônus de FORÇA'], damageType: 'Perfuração', training: 'Marcial', grip: 'Uma Mão', scalesWith: ['FOR'] },
  { id: 'machado-de-batalha', name: 'Machado de Batalha', damage: ['Uma Mão: 1d8 + Bônus de FORÇA', 'Duas Mãos: 1d10 + Bônus de FORÇA'], damageType: 'Cortante', training: 'Marcial', grip: 'Versátil', scalesWith: ['FOR'] },
  { id: 'espada-longa', name: 'Espada Longa', damage: ['Uma Mão: 1d8 + Bônus de FORÇA', 'Duas Mãos: 1d10 + Bônus de FORÇA'], damageType: 'Cortante', training: 'Marcial', grip: 'Versátil', scalesWith: ['FOR'] },
  { id: 'tridente', name: 'Tridente', damage: ['Uma Mão: 1d6 + Bônus de FORÇA', 'Duas Mãos: 1d8 + Bônus de FORÇA'], damageType: 'Perfuração', training: 'Marcial', grip: 'Versátil', scalesWith: ['FOR'] },
  { id: 'martelo-de-guerra', name: 'Martelo de Guerra', damage: ['Uma Mão: 1d8 + Bônus de FORÇA', 'Duas Mãos: 1d10 + Bônus de FORÇA'], damageType: 'Impacto', training: 'Marcial', grip: 'Versátil', scalesWith: ['FOR'] },
  { id: 'glaive', name: 'Glaive', damage: ['1d10 + Bônus de FORÇA'], damageType: 'Cortante', training: 'Marcial', grip: 'Duas Mãos', scalesWith: ['FOR'] },
  { id: 'machado-grande', name: 'Machado Grande', damage: ['1d12 + Bônus de FORÇA'], damageType: 'Cortante', training: 'Marcial', grip: 'Duas Mãos', scalesWith: ['FOR'] },
  { id: 'montante', name: 'Montante (Zweihander)', damage: ['2d6 + Bônus de FORÇA'], damageType: 'Cortante', training: 'Marcial', grip: 'Duas Mãos', scalesWith: ['FOR'] },
  { id: 'alabarda', name: 'Alabarda', damage: ['1d10 + Bônus de FORÇA'], damageType: 'Cortante', training: 'Marcial', grip: 'Duas Mãos', scalesWith: ['FOR'] },
  { id: 'malho', name: 'Malho', damage: ['2d6 + Bônus de FORÇA'], damageType: 'Impacto', training: 'Marcial', grip: 'Duas Mãos', scalesWith: ['FOR'] },
  { id: 'pique', name: 'Pique', damage: ['1d10 + Bônus de FORÇA'], damageType: 'Perfuração', training: 'Marcial', grip: 'Duas Mãos', scalesWith: ['FOR'] },
  { id: 'besta-leve', name: 'Besta Leve', damage: ['1d6 + Bônus de DESTREZA'], damageType: 'Perfuração', training: 'Marcial', grip: 'Uma Mão', scalesWith: ['DES'] },
  { id: 'besta', name: 'Besta', damage: ['1d8 + Bônus de DESTREZA'], damageType: 'Perfuração', training: 'Simples', grip: 'Duas Mãos', scalesWith: ['DES'] },
  { id: 'besta-pesada', name: 'Besta Pesada', damage: ['1d10 + Bônus de DESTREZA'], damageType: 'Perfuração', training: 'Marcial', grip: 'Duas Mãos', scalesWith: ['DES'] },
  { id: 'arco-pequeno', name: 'Arco Pequeno', damage: ['1d6 + Bônus de DESTREZA'], damageType: 'Perfuração', training: 'Simples', grip: 'Duas Mãos', scalesWith: ['DES'] },
  { id: 'arco', name: 'Arco', damage: ['1d8 + Bônus de DESTREZA'], damageType: 'Perfuração', training: 'Marcial', grip: 'Duas Mãos', scalesWith: ['DES'] },
];

const copyLabels: Record<CopyState, string> = {
  idle: 'Copiar resumo',
  copied: 'Resumo copiado',
  error: 'Falha ao copiar',
};

const lightWeapons = weapons.filter((weapon) => weapon.grip === 'Leve');
const mainWeapons = weapons.filter((weapon) => weapon.grip !== 'Leve');

function now() {
  return new Date().toISOString();
}

function newId() {
  return globalThis.crypto?.randomUUID?.() ?? `ficha-${Date.now()}`;
}

function createSheet(): CharacterSheet {
  return {
    id: newId(),
    name: '',
    age: '',
    classId: classes[0].id,
    raceId: races[0].id,
    humanBonus: 'skill',
    adjustments: { ...ZERO },
    trainedSkillIds: [],
    armorId: 'none',
    shieldId: 'none',
    mainWeaponId: 'none',
    lightWeaponIds: [],
    updatedAt: now(),
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function signed(value: number) {
  return value > 0 ? `+${value}` : `${value}`;
}

function modifier(value: number) {
  return Math.floor((value - 10) / 2);
}

function getClass(id: string) {
  return classes.find((item) => item.id === id) ?? classes[0];
}

function getRace(id: string) {
  return races.find((item) => item.id === id) ?? races[0];
}

function getArmor(id: string) {
  return armors.find((item) => item.id === id) ?? armors[0];
}

function getShield(id: string) {
  return shields.find((item) => item.id === id) ?? shields[0];
}

function getWeapon(id: string) {
  return weapons.find((item) => item.id === id);
}

function freePoints(sheet: CharacterSheet) {
  return 3 + (sheet.raceId === 'humano' && sheet.humanBonus === 'attribute' ? 1 : 0);
}

function skillLimit(sheet: CharacterSheet) {
  return getClass(sheet.classId).trainedSkills + (sheet.raceId === 'humano' && sheet.humanBonus === 'skill' ? 1 : 0);
}

function finalAttributes(characterClass: RpgClass, race: Race, adjustments: AttributeMap) {
  return ATTRIBUTES.reduce((total, attribute) => {
    total[attribute] = clamp(characterClass.base[attribute] + race.modifiers[attribute] + adjustments[attribute], 5, 20);
    return total;
  }, {} as AttributeMap);
}

function pointBudget(adjustments: AttributeMap, initialPoints: number) {
  const spent = ATTRIBUTES.reduce((sum, attribute) => sum + Math.max(0, adjustments[attribute]), 0);
  const reductions = ATTRIBUTES.reduce((sum, attribute) => sum + Math.abs(Math.min(0, adjustments[attribute])), 0);
  return { available: initialPoints + reductions - spent, spent, reductions };
}

function canAdjust(
  attribute: AttributeKey,
  delta: 1 | -1,
  characterClass: RpgClass,
  race: Race,
  adjustments: AttributeMap,
  initialPoints: number,
) {
  const nextAdjustments = { ...adjustments, [attribute]: adjustments[attribute] + delta };
  const preRacial = characterClass.base[attribute] + nextAdjustments[attribute];
  const finalValue = preRacial + race.modifiers[attribute];

  return (
    nextAdjustments[attribute] >= -2 &&
    preRacial <= 18 &&
    finalValue >= 5 &&
    finalValue <= 20 &&
    pointBudget(nextAdjustments, initialPoints).available >= 0
  );
}

function bestAttribute(attributes: AttributeMap, candidates: AttributeKey[]) {
  return candidates.reduce((best, current) => (modifier(attributes[current]) > modifier(attributes[best]) ? current : best));
}

function skillBonus(skill: Skill, attributes: AttributeMap, trained: boolean) {
  return modifier(attributes[bestAttribute(attributes, skill.scalesWith)]) + (trained ? 2 : 0);
}

function weaponBonus(weapon: Weapon, attributes: AttributeMap) {
  return modifier(attributes[bestAttribute(attributes, weapon.scalesWith)]);
}

function lightWeaponLimit(mainWeaponId: string) {
  const mainWeapon = getWeapon(mainWeaponId);
  if (!mainWeapon) return 3;
  return mainWeapon.grip === 'Uma Mão' || mainWeapon.grip === 'Versátil' ? 2 : 1;
}

function hasStrength(minStrength: number, attributes: AttributeMap) {
  return attributes.FOR >= minStrength;
}

function equipmentDefense(attributes: AttributeMap, armor: Armor, shield: Shield) {
  const armorValue = hasStrength(armor.minStrength, attributes) ? armor.defense : 0;
  const shieldValue = hasStrength(shield.minStrength, attributes) ? shield.defense : 0;
  return attributes.RES + armorValue + shieldValue;
}

function passiveDodge(attributes: AttributeMap, armor: Armor, shield: Shield) {
  const armorPenalty = hasStrength(armor.minStrength, attributes) ? armor.dodgePenalty : 0;
  const shieldPenalty = hasStrength(shield.minStrength, attributes) ? shield.dodgePenalty : 0;
  const base = 5 + Math.trunc((attributes.DES - 10) / 2);
  return clamp(base - armorPenalty - shieldPenalty, 1, 12);
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function safeFileName(name: string) {
  return (
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'ficha'
  );
}

function cleanAttributes(value: unknown): AttributeMap {
  const source = typeof value === 'object' && value !== null ? (value as Partial<AttributeMap>) : {};
  return ATTRIBUTES.reduce((map, attribute) => {
    const numberValue = Number(source[attribute]);
    map[attribute] = Number.isFinite(numberValue) ? numberValue : 0;
    return map;
  }, { ...ZERO });
}

function normalizeSheet(imported: unknown): CharacterSheet {
  const source =
    typeof imported === 'object' && imported !== null && 'ficha' in imported
      ? (imported as { ficha: unknown }).ficha
      : imported;
  const raw = typeof source === 'object' && source !== null ? (source as Partial<CharacterSheet>) : {};
  const base = createSheet();
  const classId = classes.some((item) => item.id === raw.classId) ? raw.classId! : base.classId;
  const raceId = races.some((item) => item.id === raw.raceId) ? raw.raceId! : base.raceId;
  const armorId = armors.some((item) => item.id === raw.armorId) ? raw.armorId! : base.armorId;
  const shieldId = shields.some((item) => item.id === raw.shieldId) ? raw.shieldId! : base.shieldId;
  const mainWeaponId =
    raw.mainWeaponId === 'none' || mainWeapons.some((item) => item.id === raw.mainWeaponId) ? raw.mainWeaponId! : 'none';
  const currentLightLimit = lightWeaponLimit(mainWeaponId);
  const lightWeaponIds = Array.isArray(raw.lightWeaponIds)
    ? raw.lightWeaponIds.filter((id): id is string => lightWeapons.some((weapon) => weapon.id === id)).slice(0, currentLightLimit)
    : [];

  return {
    ...base,
    id: typeof raw.id === 'string' ? raw.id : base.id,
    name: typeof raw.name === 'string' ? raw.name : '',
    age: typeof raw.age === 'string' ? raw.age : '',
    classId,
    raceId,
    humanBonus: raw.humanBonus === 'attribute' ? 'attribute' : 'skill',
    adjustments: cleanAttributes(raw.adjustments),
    trainedSkillIds: Array.isArray(raw.trainedSkillIds)
      ? raw.trainedSkillIds.filter((id): id is string => skills.some((skill) => skill.id === id)).slice(0, skillLimit({ ...base, classId, raceId, humanBonus: raw.humanBonus === 'attribute' ? 'attribute' : 'skill' }))
      : [],
    armorId,
    shieldId,
    mainWeaponId,
    lightWeaponIds,
    updatedAt: now(),
  };
}

function buildSummary(
  sheet: CharacterSheet,
  characterClass: RpgClass,
  race: Race,
  attributes: AttributeMap,
  trainedSkillNames: string[],
  armor: Armor,
  shield: Shield,
  mainWeapon: Weapon | undefined,
  selectedLightWeapons: Weapon[],
  sheetDefense: number,
  sheetDodge: number,
) {
  const attributeText = ATTRIBUTES.map(
    (attribute) => `${attribute}: ${attributes[attribute]} (${signed(modifier(attributes[attribute]))})`,
  ).join('\n');

  return [
    `Nome: ${sheet.name || 'Sem nome'}`,
    `Idade: ${sheet.age || 'Não informada'}`,
    `Classe: ${characterClass.name}`,
    `Raça: ${race.name}`,
    'Atributos:',
    attributeText,
    `Perícias treinadas: ${trainedSkillNames.length ? trainedSkillNames.join(', ') : 'Nenhuma'}`,
    `Armadura: ${armor.name}`,
    `Escudo: ${shield.name}`,
    `Arma principal: ${mainWeapon?.name ?? 'Nenhuma'}`,
    `Armas leves: ${selectedLightWeapons.length ? selectedLightWeapons.map((weapon) => weapon.name).join(', ') : 'Nenhuma'}`,
    `Defesa: ${sheetDefense}`,
    `Esquiva Passiva: ${sheetDodge}`,
  ].join('\n');
}

export default function App() {
  const [sheet, setSheet] = useState(createSheet);
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const [jsonText, setJsonText] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const [darkMode, setDarkMode] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedClass = useMemo(() => getClass(sheet.classId), [sheet.classId]);
  const selectedRace = useMemo(() => getRace(sheet.raceId), [sheet.raceId]);
  const selectedArmor = useMemo(() => getArmor(sheet.armorId), [sheet.armorId]);
  const selectedShield = useMemo(() => getShield(sheet.shieldId), [sheet.shieldId]);
  const selectedMainWeapon = useMemo(() => getWeapon(sheet.mainWeaponId), [sheet.mainWeaponId]);
  const selectedLightWeapons = useMemo(
    () => lightWeapons.filter((weapon) => sheet.lightWeaponIds.includes(weapon.id)),
    [sheet.lightWeaponIds],
  );
  const initialPoints = freePoints(sheet);
  const currentSkillLimit = skillLimit(sheet);
  const attributes = useMemo(
    () => finalAttributes(selectedClass, selectedRace, sheet.adjustments),
    [selectedClass, selectedRace, sheet.adjustments],
  );
  const budget = pointBudget(sheet.adjustments, initialPoints);
  const trainedSkills = skills.filter((skill) => sheet.trainedSkillIds.includes(skill.id));
  const trainedSkillNames = trainedSkills.map((skill) => skill.name);
  const sheetDefense = equipmentDefense(attributes, selectedArmor, selectedShield);
  const sheetDodge = passiveDodge(attributes, selectedArmor, selectedShield);
  const currentLightLimit = lightWeaponLimit(sheet.mainWeaponId);
  const armorOk = hasStrength(selectedArmor.minStrength, attributes);
  const shieldOk = hasStrength(selectedShield.minStrength, attributes);

  function patchSheet(patch: Partial<CharacterSheet>) {
    setSheet((current) => ({ ...current, ...patch, updatedAt: now() }));
  }

  function selectClass(classId: string) {
    patchSheet({ classId, adjustments: { ...ZERO }, trainedSkillIds: [] });
  }

  function selectRace(raceId: string) {
    patchSheet({
      raceId,
      humanBonus: raceId === 'humano' ? sheet.humanBonus : 'skill',
      adjustments: { ...ZERO },
    });
  }

  function setHumanBonus(humanBonus: HumanBonus) {
    patchSheet({ humanBonus, adjustments: { ...ZERO } });
  }

  function adjustAttribute(attribute: AttributeKey, delta: 1 | -1) {
    if (!canAdjust(attribute, delta, selectedClass, selectedRace, sheet.adjustments, initialPoints)) return;
    patchSheet({ adjustments: { ...sheet.adjustments, [attribute]: sheet.adjustments[attribute] + delta } });
  }

  function toggleSkill(skillId: string) {
    const trained = sheet.trainedSkillIds.includes(skillId);
    if (!trained && sheet.trainedSkillIds.length >= currentSkillLimit) return;
    patchSheet({
      trainedSkillIds: trained
        ? sheet.trainedSkillIds.filter((id) => id !== skillId)
        : [...sheet.trainedSkillIds, skillId],
    });
  }

  function selectMainWeapon(mainWeaponId: string) {
    const nextLightLimit = lightWeaponLimit(mainWeaponId);
    patchSheet({ mainWeaponId, lightWeaponIds: sheet.lightWeaponIds.slice(0, nextLightLimit) });
  }

  function toggleLightWeapon(weaponId: string) {
    const selected = sheet.lightWeaponIds.includes(weaponId);
    if (!selected && sheet.lightWeaponIds.length >= currentLightLimit) return;
    patchSheet({
      lightWeaponIds: selected
        ? sheet.lightWeaponIds.filter((id) => id !== weaponId)
        : [...sheet.lightWeaponIds, weaponId],
    });
  }

  function newSheet() {
    setSheet(createSheet());
    setJsonText('');
    setImportStatus('');
  }

  function exportJson() {
    const payload = {
      version: VERSION,
      sistema: APP_NAME,
      ficha: sheet,
      resumo: buildSummary(
        sheet,
        selectedClass,
        selectedRace,
        attributes,
        trainedSkillNames,
        selectedArmor,
        selectedShield,
        selectedMainWeapon,
        selectedLightWeapons,
        sheetDefense,
        sheetDodge,
      ),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${safeFileName(sheet.name)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function importJson(text: string) {
    try {
      const imported = JSON.parse(text);
      setSheet(normalizeSheet(imported));
      setImportStatus('Ficha importada com sucesso.');
    } catch {
      setImportStatus('Não consegui ler esse JSON. Confere se o arquivo veio completo.');
    }
  }

  async function importJsonFile(file: File | undefined) {
    if (!file) return;
    const text = await file.text();
    setJsonText(text);
    importJson(text);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function copySummary() {
    const summary = buildSummary(
      sheet,
      selectedClass,
      selectedRace,
      attributes,
      trainedSkillNames,
      selectedArmor,
      selectedShield,
      selectedMainWeapon,
      selectedLightWeapons,
      sheetDefense,
      sheetDodge,
    );

    try {
      await navigator.clipboard.writeText(summary);
      setCopyState('copied');
    } catch {
      setCopyState('error');
    } finally {
      window.setTimeout(() => setCopyState('idle'), 2200);
    }
  }

  return (
    <div className={`app-shell ${darkMode ? 'dark-mode' : ''}`}>
      <div className="marble-world" aria-hidden="true" />

      <header className="topbar">
        <div className="brand">
          <div>
            <p className="eyebrow">Criador de ficha</p>
            <h1>{APP_NAME}</h1>
            <span>Sua história estará cravada em mármore.</span>
          </div>
        </div>

        <div className="actions">
          <button className="primary-button" type="button" onClick={exportJson}>
            Baixar JSON
          </button>
          <button type="button" onClick={() => fileInputRef.current?.click()}>
            Importar JSON
          </button>
          <button type="button" onClick={newSheet}>
            Nova ficha
          </button>
          <button type="button" onClick={copySummary}>
            {copyLabels[copyState]}
          </button>
          <button type="button" onClick={() => setDarkMode((value) => !value)}>
            {darkMode ? 'Modo claro' : 'Modo escuro'}
          </button>
          <input
            ref={fileInputRef}
            className="hidden-input"
            type="file"
            accept="application/json,.json"
            onChange={(event) => importJsonFile(event.target.files?.[0])}
          />
        </div>
      </header>

      <main className="layout">
        <aside className="side-column">
          <section className="panel">
            <PanelTitle eyebrow="Ficha" title="Identidade" />
            <div className="form-grid">
              <label>
                <span>Nome do personagem</span>
                <input
                  value={sheet.name}
                  onChange={(event) => patchSheet({ name: event.target.value })}
                  placeholder="Ex.: Fulano de Tal"
                />
              </label>
              <label>
                <span>Idade</span>
                <input
                  type="number"
                  min="0"
                  value={sheet.age}
                  onChange={(event) => patchSheet({ age: event.target.value })}
                  placeholder="32"
                />
              </label>
            </div>
          </section>

          <section className="panel">
            <PanelTitle eyebrow="Arquétipo" title="Classe" />
            <div className="selection-list">
              {classes.map((characterClass) => (
                <button
                  key={characterClass.id}
                  className={`selection-card ${sheet.classId === characterClass.id ? 'selected' : ''}`}
                  type="button"
                  onClick={() => selectClass(characterClass.id)}
                >
                  <span className="card-head">
                    <strong>{characterClass.name}</strong>
                    <small>{characterClass.trainedSkills} perícias</small>
                  </span>
                  <span>{characterClass.description}</span>
                  <em>{characterClass.recommendedSkills.slice(0, 3).join(' | ')}</em>
                </button>
              ))}
            </div>
          </section>

          <section className="panel">
            <PanelTitle eyebrow="Sangue" title="Raça" />
            <div className="selection-list compact">
              {races.map((race) => {
                const mods = ATTRIBUTES.map((attribute) =>
                  race.modifiers[attribute] ? `${attribute} ${signed(race.modifiers[attribute])}` : '',
                ).filter(Boolean);

                return (
                  <button
                    key={race.id}
                    className={`selection-card ${sheet.raceId === race.id ? 'selected' : ''}`}
                    type="button"
                    onClick={() => selectRace(race.id)}
                  >
                    <span className="card-head">
                      <strong>{race.name}</strong>
                    </span>
                    <span>{race.description}</span>
                    <em>{mods.length ? mods.join(' | ') : 'Sem modificadores'}</em>
                  </button>
                );
              })}
            </div>

            {sheet.raceId === 'humano' && (
              <div className="human-toggle">
                <button
                  className={sheet.humanBonus === 'skill' ? 'selected' : ''}
                  type="button"
                  onClick={() => setHumanBonus('skill')}
                >
                  +1 perícia
                </button>
                <button
                  className={sheet.humanBonus === 'attribute' ? 'selected' : ''}
                  type="button"
                  onClick={() => setHumanBonus('attribute')}
                >
                  +1 atributo
                </button>
              </div>
            )}
          </section>
        </aside>

        <section className="main-column">
          <section className="summary-panel">
            <div className="portrait-block">
              <div className="portrait">{initials(sheet.name)}</div>
              <div>
                <p className="eyebrow">Prévia da ficha</p>
                <h2>{sheet.name || 'Personagem sem nome'}</h2>
                <p>
                  {selectedClass.name} | {selectedRace.name}
                  {sheet.age ? ` | ${sheet.age} anos` : ''}
                </p>
              </div>
            </div>

            <div className="lore-grid">
              <article>
                <span>Classe</span>
                <strong>{selectedClass.name}</strong>
                <p>{selectedClass.description}</p>
              </article>
              <article>
                <span>Raça</span>
                <strong>{selectedRace.name}</strong>
                <p>{selectedRace.description}</p>
              </article>
            </div>

            <div className="race-details">
              <article>
                <span>Características físicas</span>
                <p>{selectedRace.physical}</p>
              </article>
              <article>
                <span>Expectativa de vida</span>
                <strong>{selectedRace.lifespan}</strong>
              </article>
              <article>
                <span>Maturidade</span>
                <strong>{selectedRace.maturity}</strong>
              </article>
            </div>

            <div className="attribute-summary">
              {ATTRIBUTES.map((attribute) => (
                <div key={attribute}>
                  <span>{attribute}</span>
                  <strong>{attributes[attribute]}</strong>
                  <small>{signed(modifier(attributes[attribute]))}</small>
                </div>
              ))}
            </div>

            <div className="combat-strip">
              <div>
                <span>Perícias treinadas</span>
                <strong>{trainedSkillNames.length}</strong>
                <p>{trainedSkillNames.length ? trainedSkillNames.join(', ') : 'Nenhuma selecionada'}</p>
              </div>
              <div>
                <span>Defesa</span>
                <strong>{sheetDefense}</strong>
              </div>
              <div>
                <span>Esquiva</span>
                <strong>{sheetDodge}</strong>
              </div>
            </div>
          </section>

          <section className="panel">
            <PanelTitle eyebrow="Armadura, escudo e armas" title="Equipamento" />

            <div className="equipment-block">
              <h3>Armadura</h3>
              <div className="equipment-grid">
                {armors.map((armor) => {
                  const disabled = !hasStrength(armor.minStrength, attributes);
                  return (
                    <button
                      key={armor.id}
                      type="button"
                      className={`equipment-card ${sheet.armorId === armor.id ? 'selected' : ''}`}
                      disabled={disabled}
                      onClick={() => patchSheet({ armorId: armor.id })}
                    >
                      <strong>{armor.name}</strong>
                      <span>Defesa +{armor.defense} | Esquiva -{armor.dodgePenalty}</span>
                      <small>{armor.minStrength ? `Exige FOR ${armor.minStrength}` : 'Sem requisito de FOR'}</small>
                      <p>{armor.description}</p>
                    </button>
                  );
                })}
              </div>
              {!armorOk && <p className="warning">Sua FOR atual não sustenta a armadura equipada; ela não conta na defesa.</p>}
            </div>

            <div className="equipment-block">
              <h3>Escudo</h3>
              <div className="equipment-grid">
                {shields.map((shield) => {
                  const disabled = !hasStrength(shield.minStrength, attributes);
                  return (
                    <button
                      key={shield.id}
                      type="button"
                      className={`equipment-card ${sheet.shieldId === shield.id ? 'selected' : ''}`}
                      disabled={disabled}
                      onClick={() => patchSheet({ shieldId: shield.id })}
                    >
                      <strong>{shield.name}</strong>
                      <span>Defesa +{shield.defense} | Esquiva -{shield.dodgePenalty}</span>
                      <small>{shield.minStrength ? `Exige FOR ${shield.minStrength}` : 'Sem requisito de FOR'}</small>
                      <p>{shield.description}</p>
                    </button>
                  );
                })}
              </div>
              {!shieldOk && <p className="warning">Sua FOR atual não sustenta o escudo equipado; ele não conta na defesa.</p>}
            </div>

            <div className="equipment-block">
              <h3>Arma principal</h3>
              <select value={sheet.mainWeaponId} onChange={(event) => selectMainWeapon(event.target.value)}>
                <option value="none">Nenhuma arma principal</option>
                {mainWeapons.map((weapon) => (
                  <option key={weapon.id} value={weapon.id}>
                    {weapon.name} | {weapon.training} | {weapon.grip}
                  </option>
                ))}
              </select>

              {selectedMainWeapon && (
                <WeaponReadout weapon={selectedMainWeapon} attributes={attributes} />
              )}
            </div>

            <div className="equipment-block">
              <div className="inline-title">
                <h3>Armas leves</h3>
                <div className="counter small-counter">
                  <strong>
                    {sheet.lightWeaponIds.length}/{currentLightLimit}
                  </strong>
                  <span>leves</span>
                </div>
              </div>
              <p className="rule-note">
                Sempre pode levar 1 arma leve. Leva 2 com arma de uma mão ou versátil. Leva 3 se não usar outra arma.
              </p>
              <div className="equipment-grid">
                {lightWeapons.map((weapon) => {
                  const selected = sheet.lightWeaponIds.includes(weapon.id);
                  const disabled = !selected && sheet.lightWeaponIds.length >= currentLightLimit;
                  return (
                    <button
                      key={weapon.id}
                      type="button"
                      className={`equipment-card ${selected ? 'selected' : ''}`}
                      disabled={disabled}
                      onClick={() => toggleLightWeapon(weapon.id)}
                    >
                      <strong>{weapon.name}</strong>
                      <span>{weapon.damage.join(' / ')}</span>
                      <small>
                        {weapon.training} | {weapon.grip} | {weapon.damageType} | bônus {signed(weaponBonus(weapon, attributes))}
                      </small>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="panel json-panel">
            <PanelTitle eyebrow="Troca de ficha" title="JSON" />
            <div className="json-actions">
              <button className="primary-button" type="button" onClick={exportJson}>
                Baixar ficha em JSON
              </button>
              <button type="button" onClick={() => fileInputRef.current?.click()}>
                Abrir JSON recebido
              </button>
              <button type="button" onClick={() => importJson(jsonText)}>
                Importar texto colado
              </button>
            </div>
            <textarea
              value={jsonText}
              onChange={(event) => setJsonText(event.target.value)}
              placeholder="Cole aqui o JSON"
            />
            {importStatus && <p className="import-status">{importStatus}</p>}
          </section>
        </section>

        <aside className="side-column right">
          <section className="panel">
            <div className="inline-title">
              <PanelTitle eyebrow="Base + raça + ajuste" title="Atributos" />
              <div className="counter">
                <strong>{budget.available}</strong>
                <span>livres</span>
              </div>
            </div>

            <div className="mini-stats">
              <span>Gastos: {budget.spent}</span>
              <span>Reduções: {budget.reductions}</span>
              <span>Base: {initialPoints}</span>
            </div>

            <div className="attribute-list">
              {ATTRIBUTES.map((attribute) => {
                const base = selectedClass.base[attribute];
                const racial = selectedRace.modifiers[attribute];
                const adjustment = sheet.adjustments[attribute];
                const finalValue = attributes[attribute];

                return (
                  <article className="attribute-row" key={attribute}>
                    <div className="attribute-top">
                      <div>
                        <strong title={ATTRIBUTE_HINTS[attribute]}>
                          {attribute} <span>{ATTRIBUTE_LABELS[attribute]}</span>
                        </strong>
                        <p>
                          {base} base {signed(adjustment)} ajuste {signed(racial)} racial = {finalValue}
                        </p>
                      </div>
                      <div className="stepper">
                        <button
                          type="button"
                          disabled={!canAdjust(attribute, -1, selectedClass, selectedRace, sheet.adjustments, initialPoints)}
                          onClick={() => adjustAttribute(attribute, -1)}
                        >
                          -
                        </button>
                        <span>{finalValue}</span>
                        <button
                          type="button"
                          disabled={!canAdjust(attribute, 1, selectedClass, selectedRace, sheet.adjustments, initialPoints)}
                          onClick={() => adjustAttribute(attribute, 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="attribute-bar">
                      <span style={{ width: `${(finalValue / 20) * 100}%` }} />
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="panel">
            <div className="inline-title">
              <PanelTitle eyebrow="Treinamento" title="Perícias" />
              <div className="counter">
                <strong>
                  {sheet.trainedSkillIds.length}/{currentSkillLimit}
                </strong>
                <span>treinadas</span>
              </div>
            </div>

            <div className="recommended">
              <strong>Recomendadas</strong>
              {selectedClass.recommendedSkills.map((skill) => (
                <span key={skill}>{skill}</span>
              ))}
            </div>

            <div className="skill-groups">
              {ATTRIBUTES.map((attribute) => {
                const attributeSkills = skills.filter((skill) => skill.groups.includes(attribute));

                return (
                  <div className="skill-group" key={attribute}>
                    <h3>
                      <span>{attribute}</span>
                      {ATTRIBUTE_LABELS[attribute]}
                    </h3>
                    {attributeSkills.length ? (
                      <div className="skill-list">
                        {attributeSkills.map((skill) => {
                          const trained = sheet.trainedSkillIds.includes(skill.id);
                          const recommended = selectedClass.recommendedSkills.includes(skill.name);
                          const disabled = !trained && sheet.trainedSkillIds.length >= currentSkillLimit;
                          const sourceAttribute = bestAttribute(attributes, skill.scalesWith);
                          const bonus = skillBonus(skill, attributes, trained);

                          return (
                            <button
                              key={skill.id}
                              className={`skill-card ${trained ? 'trained' : ''} ${recommended ? 'recommended-skill' : ''}`}
                              type="button"
                              disabled={disabled}
                              onClick={() => toggleSkill(skill.id)}
                            >
                              <span>
                                <strong>{skill.name}</strong>
                                {trained && <em>Treinada</em>}
                              </span>
                              <small>
                                Usa {sourceAttribute} {attributes[sourceAttribute]} | bônus {signed(bonus)}
                              </small>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="empty">Nenhuma perícia</p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </aside>
      </main>

    </div>
  );
}

function PanelTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="panel-title">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
    </div>
  );
}

function WeaponReadout({ weapon, attributes }: { weapon: Weapon; attributes: AttributeMap }) {
  return (
    <article className="weapon-readout">
      <strong>{weapon.name}</strong>
      {weapon.damage.map((line) => (
        <span key={line}>{line}</span>
      ))}
      <small>
        {weapon.training} | {weapon.grip} | {weapon.damageType} | bônus atual {signed(weaponBonus(weapon, attributes))}
      </small>
    </article>
  );
}
