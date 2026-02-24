const ESC = '\x1b'

export function enterAltScreen(): void {
  process.stdout.write(`${ESC}[?1049h`)
}

export function exitAltScreen(): void {
  process.stdout.write(`${ESC}[?1049l`)
}

export function clearScreen(): void {
  process.stdout.write(`${ESC}[2J${ESC}[H`)
}

export function hideCursor(): void {
  process.stdout.write(`${ESC}[?25l`)
}

export function showCursor(): void {
  process.stdout.write(`${ESC}[?25h`)
}

export function moveTo(row: number, col: number): void {
  process.stdout.write(`${ESC}[${row + 1};${col + 1}H`)
}

export function writeLine(row: number, text: string): void {
  moveTo(row, 0)
  process.stdout.write(`${ESC}[2K${text}`)
}

export function writeScreen(lines: string[]): void {
  clearScreen()
  process.stdout.write(lines.join('\n'))
}
