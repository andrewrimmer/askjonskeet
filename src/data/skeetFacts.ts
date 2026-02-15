export const skeetFacts: string[] = [
  "Jon Skeet's heart rate is 5GHz.",
  "Jon Skeet doesn't need a debugger, he just stares down the code until it confesses.",
  "Jon Skeet can divide by zero.",
  "When Jon Skeet points to null, null quakes in fear.",
  "Jon Skeet's code doesn't follow conventions. Conventions follow Jon Skeet's code.",
  "Jon Skeet doesn't do code reviews. The code reviews itself out of respect.",
  "Jon Skeet can answer a Stack Overflow question before it's asked.",
  "Anonymous methods and anonymous types are really both named Jon Skeet. They just don't want to boast.",
  "Jon Skeet is immutable. If something is going to change, it's going to have to be the rest of the universe.",
  "Jon Skeet's addition to a project doesn't increase the bus factor. The bus wouldn't dare.",
  "Jon Skeet doesn't write tests. Tests write themselves to please him.",
  "When Jon Skeet throws an exception, the exception catches itself and apologises.",
  "Jon Skeet can parse HTML with regex.",
  "Jon Skeet once mass-assigned all his attributes and the application still passed its security audit.",
  "Jon Skeet has mass. His mass is so great that Stack Overflow orbits him.",
  "Jon Skeet's keyboard doesn't have a Backspace key. He doesn't make mistakes.",
  "When Jon Skeet presses Ctrl+Alt+Delete, Chuck Norris gets scared.",
  "Jon Skeet can instantiate an abstract class.",
  "Jon Skeet doesn't need to use LINQ. Data voluntarily organises itself for him.",
  "When Jon Skeet writes code, the compiler checks itself for errors.",
  "Jon Skeet can compile syntax errors.",
  "The GC doesn't collect Jon Skeet's objects. They collect themselves when he's done with them.",
  "Jon Skeet once mass-edited all accepted answers on Stack Overflow. They all still compiled.",
  "Jon Skeet's code has 100% test coverage. Including tests for features not yet imagined.",
  "Jon Skeet doesn't use version control. He just remembers.",
  "There is no Ctrl key on Jon Skeet's keyboard. Jon Skeet is always in control.",
  "Jon Skeet's Stack Overflow reputation exceeds the 32-bit integer limit. They had to upgrade just for him.",
]

export function getRandomFact(): string {
  return skeetFacts[Math.floor(Math.random() * skeetFacts.length)]
}
