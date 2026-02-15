export const searchSuggestions = [
  'async await',
  'LINQ',
  'DateTime',
  'generics',
  'nullable types',
  'string comparison',
  'dependency injection',
  'garbage collection',
  'closures',
  'inheritance vs composition',
  'immutability',
  'NodaTime',
  'encoding',
  'floating point',
  'enums',
  'polymorphism',
]

export const placeholders = [
  'Why does my async code deadlock?',
  'How do I parse dates correctly?',
  'What is the difference between String and string?',
  'How does garbage collection work in C#?',
  'Why is DateTime so confusing?',
  'How do generics work in Java?',
  'What is NodaTime and why should I use it?',
  'How do I compare strings properly?',
  'Why does floating point arithmetic break?',
  'What is the correct way to use async/await?',
]

export function getRandomPlaceholder(): string {
  return placeholders[Math.floor(Math.random() * placeholders.length)]
}
