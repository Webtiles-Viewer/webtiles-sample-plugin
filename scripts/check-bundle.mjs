// Fails when dist/main.js breaks the bundle contract of ADR-0001 §8: a single ES module with no
// bare, remote or relative imports (the host loads it from a blob URL, so nothing else resolves),
// no `import.meta` (under a blob import `import.meta.url` is `blob:`), and a default export. It also checks the other
// files in dist/ and that manifest.json, package.json and versions.json agree on the version.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

/** Classify an import specifier; `null` means it is acceptable (it never is today). */
function classify(specifier) {
  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(specifier)) return 'remote or URL import'
  if (/^\.{0,2}\//.test(specifier) || specifier === '.' || specifier === '..') {
    return 'relative import (the bundle must be a single file)'
  }
  return 'bare import'
}

/** Scan the source of a bundle; returns one message per violation. */
export function scanBundle(source, fileName = 'main.js') {
  const sf = ts.createSourceFile(fileName, source, ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS)
  const problems = []
  let hasDefaultExport = false
  const at = (node) => {
    const { line, character } = sf.getLineAndCharacterOfPosition(node.getStart(sf))
    return `${fileName}:${line + 1}:${character + 1}`
  }

  const visit = (node) => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteralLike(node.moduleSpecifier)
    ) {
      problems.push(`${at(node)}: ${classify(node.moduleSpecifier.text)} "${node.moduleSpecifier.text}"`)
    } else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      const arg = node.arguments[0]
      problems.push(
        arg && ts.isStringLiteralLike(arg)
          ? `${at(node)}: dynamic ${classify(arg.text)} "${arg.text}"`
          : `${at(node)}: dynamic import() of a non-literal specifier`,
      )
    } else if (ts.isMetaProperty(node) && node.keywordToken === ts.SyntaxKind.ImportKeyword) {
      problems.push(`${at(node)}: import.meta is not allowed (use ctx.assets.getUrl)`)
    } else if (ts.isExportAssignment(node)) {
      hasDefaultExport = true
    } else if (ts.isExportDeclaration(node) && !node.moduleSpecifier && node.exportClause) {
      if (ts.isNamedExports(node.exportClause) && node.exportClause.elements.some((e) => e.name.text === 'default')) {
        hasDefaultExport = true
      }
    } else if (ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) {
      const mods = ts.getModifiers(node) ?? []
      if (mods.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) && mods.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword)) {
        hasDefaultExport = true
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)

  if (!hasDefaultExport) problems.push(`${fileName}: no default export (expected \`export default definePlugin({ … })\`)`)
  return problems
}

/** The files WebTiles reads from dist/, and the manifest's agreement with package.json and versions.json. */
function checkFiles() {
  const problems = []
  const read = (file) => {
    try {
      return readFileSync(file, 'utf8')
    } catch {
      problems.push(`${file} is missing`)
      return null
    }
  }
  const text = read('dist/manifest.json')
  read('dist/styles.css')
  if (text === null) return problems
  const manifest = JSON.parse(text)
  if ('$schema' in manifest) problems.push('dist/manifest.json still has $schema, which the host rejects')
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
  if (manifest.version !== pkg.version) {
    problems.push(`manifest.json version ${manifest.version} differs from package.json ${pkg.version} (use \`npm version\`)`)
  }
  const entry = JSON.parse(readFileSync('versions.json', 'utf8'))[manifest.version]
  if (!entry) problems.push(`versions.json has no entry for ${manifest.version} (use \`npm version\`)`)
  else if (entry.apiVersion !== manifest.apiVersion || entry.minAppVersion !== manifest.minAppVersion) {
    problems.push(`versions.json's ${manifest.version} entry differs from manifest.json's apiVersion or minAppVersion`)
  }
  return problems
}

function main() {
  const file = process.argv[2] ?? 'dist/main.js'
  let source
  try {
    source = readFileSync(file, 'utf8')
  } catch {
    console.error(`check-bundle: cannot read ${file}; run \`npm run build\` first.`)
    process.exit(1)
  }
  const problems = [...scanBundle(source, file), ...checkFiles()]
  if (problems.length) {
    console.error(`check-bundle: dist/ breaks the bundle contract (ADR-0001 §8):`)
    for (const p of problems) console.error(`  - ${p}`)
    process.exit(1)
  }
  console.log('check-bundle: dist/ ok')
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main()
