# Prime

A machine-readable graph of knowledge claims, built on Git and Markdown.

## What is Prime?

What makes a good argument, or truth claim?

A _good_ argument is true.

A _valid_ argument is one where its conclusion follows from its premises. Validity is purely structural — it has nothing to do with truth.

If a premise is false, the argument is not _invalid_ but it is _unsound_. The structure still holds; the foundation does not.

What makes a premise false? It, in turn, relies on an either _invalid_ argument or _unsound_ premises – or both. Every claim rests on other claims — and the rot can enter at any level.

In the world of code might call this a dependency graph. A graph can be traversed, and indexed by machine. Follow the chain down and you hit bedrock: unsupported claims; axiomatic truths that can be accepted without argument (?)

Prime stores each claim as a Markdown file in a Git repository. Git already solves the hard problems: versioning, integrity, distribution, attribution. Every commit is a cryptographic snapshot. Every clone is a full copy. Repositories can reference each other — so an argument in one repo can cite a premise in another, across authors, institutions, and time. The graph is not trapped in one database or one jurisdiction. It lives where code lives, and it moves the way code moves. And I hope Prime can make reason scale the way code can.

## Installation

## Quick Start

## Commands

### `prime init`

### `prime validate`

### `prime graph`

### `prime show`

## Node File Format

## Prime URI Scheme

## License
