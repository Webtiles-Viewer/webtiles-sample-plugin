// Runs as npm's `version` script: `npm version 0.2.0` (or patch/minor/major) sets package.json, then this copies the
// version into manifest.json and records it in versions.json with the manifest's apiVersion and minAppVersion
// (version → requirements, which updates read; ADR-0001 §9). Change those two in manifest.json first when a release
// needs a newer host. npm then commits and tags the three files.
import { readFileSync, writeFileSync } from 'node:fs'

const version = process.env.npm_package_version
if (!version) throw new Error('version-bump: run it through `npm version <version>`')

const manifest = JSON.parse(readFileSync('manifest.json', 'utf8'))
manifest.version = version
writeFileSync('manifest.json', `${JSON.stringify(manifest, null, 2)}\n`)

const versions = JSON.parse(readFileSync('versions.json', 'utf8'))
versions[version] = { apiVersion: manifest.apiVersion, minAppVersion: manifest.minAppVersion }
writeFileSync('versions.json', `${JSON.stringify(versions, null, 2)}\n`)
