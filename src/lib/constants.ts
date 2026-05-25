import type { TransactionType } from '@/domain/types'

export const MONTH_NAMES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]
export const MONTH_NAMES_SHORT = [
  'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
  'jul', 'ago', 'set', 'out', 'nov', 'dez',
]

export interface CategorySeed {
  name: string
  type: TransactionType
  color: string
  slug: string
}

export const DEFAULT_CATEGORIES: CategorySeed[] = [
  // Income
  { name: 'Salário',      type: 'income',  color: 'oklch(0.65 0.13 145)',  slug: 'salario' },
  { name: 'Pensão',       type: 'income',  color: 'oklch(0.68 0.11 165)',  slug: 'pensao' },
  { name: 'Renda extra',  type: 'income',  color: 'oklch(0.7 0.1 130)',    slug: 'extra' },
  // Expense
  { name: 'Moradia',      type: 'expense', color: 'oklch(0.55 0.13 25)',   slug: 'moradia' },
  { name: 'Utilidades',   type: 'expense', color: 'oklch(0.6 0.12 45)',    slug: 'utilidades' },
  { name: 'Mercado',      type: 'expense', color: 'oklch(0.62 0.13 70)',   slug: 'mercado' },
  { name: 'Saúde',        type: 'expense', color: 'oklch(0.58 0.12 0)',    slug: 'saude' },
  { name: 'Transporte',   type: 'expense', color: 'oklch(0.6 0.1 260)',    slug: 'transporte' },
  { name: 'Lazer',        type: 'expense', color: 'oklch(0.6 0.11 310)',   slug: 'lazer' },
  { name: 'Assinaturas',  type: 'expense', color: 'oklch(0.6 0.1 220)',    slug: 'assinaturas' },
  { name: 'Cartão',       type: 'expense', color: 'oklch(0.5 0.12 340)',   slug: 'cartao' },
  { name: 'Outros',       type: 'expense', color: 'oklch(0.65 0.04 250)',  slug: 'outros' },
]
