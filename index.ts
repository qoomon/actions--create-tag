import * as core from '@actions/core'
import * as github from '@actions/github'
import {exec, getInput, run} from './lib/actions.js'
// see https://github.com/actions/toolkit for more github actions libraries
import {getRemoteUrl, getTagDetails} from './lib/git.js'
import {createTag, parseRepositoryFromUrl} from './lib/github.js'
import {fileURLToPath} from 'url'

export const action = () => run(async () => {
  const input = {
    token: getInput('token', {required: true})!,
    workingDirectory: getInput('working-directory') ?? '.',
    remoteName: getInput('remoteName') ?? 'origin',
    name: getInput('name', {required: true})!,
    message: getInput('message') ?? getInput('name', {required: true})!,
  }

  process.chdir(input.workingDirectory)

  const tagArgs = [input.name,
    '--annotate',
    '--message', input.message,
  ]
  const tagResult = await exec('git', [
    '-c', 'user.name=github-actions[bot]',
    '-c', 'user.email=41898282+github-actions[bot]@users.noreply.github.com',
    'tag', ...tagArgs,
  ])
  if (tagResult.status !== 0) {
    core.info(tagResult.stderr.toString())
    core.setOutput('status', tagResult.status)
    return
  }

  const octokit = github.getOctokit(input.token)
  const recentTag = await getTagDetails(input.name)
  const repositoryRemoteUrl = await getRemoteUrl()
  const repository = parseRepositoryFromUrl(repositoryRemoteUrl)
  const githubTag = await createTag(octokit, repository, {
    tag: recentTag.name,
    subject: recentTag.subject,
    body: recentTag.body,
    sha: recentTag.targetSha!,
  })

  core.info('Syncing local repository ...')
  await exec(`git fetch`, [input.remoteName, githubTag.sha])
  await exec(`git tag -f ${recentTag.name} ${githubTag.sha}`)
})

// Execute the action, if running as main module
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  action()
}
