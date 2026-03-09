import { lazy } from 'react'

export const Dashboard = lazy(() => import('./Dashboard').then(m => ({ default: m.Dashboard })))
export const Altars = lazy(() => import('./Altars').then(m => ({ default: m.Altars })))
export const AIMentor = lazy(() => import('./AIMentor').then(m => ({ default: m.AIMentor })))
export const RitualTracker = lazy(() => import('./RitualTracker').then(m => ({ default: m.RitualTracker })))
export const SigilLab = lazy(() => import('./SigilLab').then(m => ({ default: m.SigilLab })))
export const Journal = lazy(() => import('./Journal').then(m => ({ default: m.Journal })))
export const Marketplace = lazy(() => import('./Marketplace').then(m => ({ default: m.Marketplace })))
export const Settings = lazy(() => import('./Settings').then(m => ({ default: m.Settings })))
export const ForumPage = lazy(() => import('./forum/ForumPage').then(m => ({ default: m.ForumPage })))
export const KnowledgeGraph = lazy(() => import('./KnowledgeGraph').then(m => ({ default: m.KnowledgeGraph })))
export const DivinationLab = lazy(() => import('./DivinationLab').then(m => ({ default: m.DivinationLab })))
