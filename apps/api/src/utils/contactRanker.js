const TITLE_PRIORITY = [
  { pattern: /chief executive|ceo/i, level: 1, score: 10 },
  { pattern: /founder|co-founder/i, level: 1, score: 15 },
  { pattern: /owner|managing director|president|director/i, level: 1, score: 20 },
  { pattern: /chief|cto|cio/i, level: 2, score: 40 },
  { pattern: /marketing|growth|business development/i, level: 3, score: 60 },
  { pattern: /operations|sales/i, level: 4, score: 80 },
  { pattern: /it|technical|engineer/i, level: 5, score: 90 },
]

const rankContact = (jobTitle = "") => {
  for (const rule of TITLE_PRIORITY) {
    if (rule.pattern.test(jobTitle)) {
      return { priorityLevel: rule.level, rankScore: rule.score }
    }
  }
  return { priorityLevel: 6, rankScore: 120 }
}

const selectTopContacts = (contacts, minCount = 2) => {
  const sorted = [...contacts].sort((a, b) => {
    if (a.rank_score !== b.rank_score) return a.rank_score - b.rank_score
    return new Date(a.discovered_at) - new Date(b.discovered_at)
  })
  return sorted.slice(0, Math.min(minCount, sorted.length))
}

module.exports = { rankContact, selectTopContacts, TITLE_PRIORITY }
