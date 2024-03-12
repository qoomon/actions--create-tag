import {exec} from './actions.js'

/**
 * Get the current branch name.
 * @returns branch name
 */
export async function getCurrentBranch(): Promise<string> {
  return await exec('git branch --show-current')
      .then(({stdout}) => stdout.toString().trim())
}

/**
 * Get the sha of the given ref.
 * @param ref - commit ref
 * @returns sha
 */
export async function getRev(ref: string = 'HEAD'): Promise<string> {
  return await exec('git rev-parse', [ref])
      .then(({stdout}) => stdout.toString().trim())
}

/**
 * Get the remote url of the repository.
 * @param remoteName - remote name
 * @returns remote url
 */
export async function getRemoteUrl(remoteName: string = 'origin'): Promise<string> {
  return await exec('git remote get-url --push', [remoteName])
      .then(({stdout}) => stdout.toString().trim())
}

/**
 * Get the list of unmerged files.
 * @returns unmerged files
 */
export async function getUnmergedFiles(): Promise<string[]> {
  return await exec('git diff --name-only --diff-filter=U')
      .then(({stdout}) => stdout.toString().split('\n').filter(Boolean))
}

/**
 * Get the tag details.
 * @param name - a tag name.
 * @returns tag details
 */
export async function getTagDetails(name: string): Promise<TagDetails> {
  const result = <TagDetails>{}
  result.name = name

  const tagOutputLines = await exec('git tag -l', [
    name,
    '--format=' + [
      'type:%(objecttype)',
      'object:%(objectname)',
      'tagger.name:%(taggername)',
      'tagger.email:%(taggeremail)',
      'tagger.date:%(taggerdate)',
      'subject:%(subject)',
      'body:',
      '%(body)',
    ].join('\n'),
  ])
      .then(({stdout}) => stdout.toString().split('\n').slice(0, -1))

  if (tagOutputLines.length === 0) {
    throw new Error(`Unknown tag : ${name}`)
  }
  const tagFieldLinesIterator = tagOutputLines.values()
  for (const line of tagFieldLinesIterator) {
    const lineMatch = line.match(/^(?<lineValueName>[^:]+):(?<lineValue>.*)$/)
    if (!lineMatch) throw new Error(`Unexpected field line: ${line}`)
    const {lineValueName, lineValue} = lineMatch.groups as { lineValueName: string, lineValue: string }
    switch (lineValueName) {
      case 'type':
        result.type = lineValue
        break
      case 'object':
        result.sha = lineValue
        break
      case 'tagger.name':
        result.tagger = result.tagger ?? {}
        result.tagger.name = lineValue
        break
      case 'tagger.email':
        result.tagger = result.tagger ?? {}
        result.tagger.email = lineValue
        break
      case 'tagger.date':
        result.tagger = result.tagger ?? {}
        result.tagger.date = new Date(lineValue)
        break
      case 'subject':
        result.subject = lineValue
        break
      case 'body':
        // read all remaining lines
        result.body = [...tagFieldLinesIterator].join('\n')
        break
      default:
        throw new Error(`Unexpected field: ${lineValueName}`)
    }
  }

  if (result.type === 'tag') {
    result.targetSha = await exec('git rev-list -n 1', [name])
        .then(({stdout}) => stdout.toString().trim() || undefined)
  } else {
    result.targetSha = result.sha
  }

  return result
}

/**
 * Get the cached details.
 * @returns cached details
 */
export async function getCacheDetails(): Promise<CacheDetails> {
  const result = <CacheDetails>{}

  const diffOutputFileLines = await exec('git diff --cached --raw --cc --diff-filter=AMD')
      .then(({stdout}) => stdout.toString().split('\n').filter(Boolean))

  result.files = diffOutputFileLines
      .map(parseRawFileDiffLine) satisfies RawFileDiff[] as (RawFileDiff & { status: 'A' | 'M' | 'D' })[]

  return result
}

/**
 * Parse a line from the raw diff output.
 * @param line - line to parse
 * @returns parsed line
 */
function parseRawFileDiffLine(line: string): RawFileDiff {
  const fileMatch = line.match(/^:+(?:(?<mode>\d{6}) ){2,}(?:\w{7} ){2,}(?<status>[A-Z])\w*\s+(?<path>.*)$/)
  if (!fileMatch) throw new Error(`Unexpected file line: ${line}`)

  return {
    status: fileMatch.groups!.status,
    mode: fileMatch.groups!.mode,
    path: fileMatch.groups!.path,
  }
}

/**
 * Read the content of the file at the given path.
 * @param path - path to the file
 * @param ref - ref to read the file from. If not set, the cached file is read.
 * @returns file content
 */
export async function readFile(path: string, ref?: string): Promise<Buffer> {
  const object = ref ? `${ref}:${path}` : await getCachedObjectSha(path)
  return await exec('git cat-file blob', [object], {silent: true})
      .then(({stdout}) => stdout)
}

/**
 * Get the sha of the cached object for the given path.
 * @param path - path to the file
 * @returns sha of the cached object
 */
async function getCachedObjectSha(path: string) {
  return await exec('git ls-files --cached --stage', [path], {silent: false})
      // example output: 100644 5492f6d1d15ac444387259da81d19b74b3f2d4d6 0  dummy.txt
      .then(({stdout}) => stdout.toString().split(/\s/)[1])
}

export type TagDetails = {
  type: string
  sha: string
  name: string
  tagger: {
    name: string
    email: string
    date: Date
  }
  subject: string
  body: string
  targetSha?: string
}

export type CacheDetails = {
  files: {
    path: string,
    mode: string
    status: 'A' | 'M' | 'D'
  }[]
}

type RawFileDiff = {
  mode: string
  path: string
  status: string
}
