import * as core from '@actions/core'
import * as github from '@actions/github'
import {exec, getInput, run} from './lib/actions'
// see https://github.com/actions/toolkit for more github actions libraries
import {
  getRemoteUrl,
  getRev,
  getTagDetails,
} from './lib/git'
import {createTag, CreateTagArgs, parseRepositoryFromUrl} from './lib/github.js'

const input = {
  token: getInput('token', {required: true})!,
  remoteName: getInput('remoteName', {required: true})!,
  name: getInput('name', {required: true})!,
  message: getInput('message', {required: false}),
  recreate: getInput('recreate', {required: false})?.toLowerCase() === 'true' || false,
  push: getInput('push', {required: false})?.toLowerCase() === 'true' || false,
}

const octokit = github.getOctokit(input.token)

run(async () => {
  const repositoryRemoteUrl = await getRemoteUrl()
  const repository = parseRepositoryFromUrl(repositoryRemoteUrl)

  let createTagArgs: CreateTagArgs

  if (input.recreate) {
    const recentTag = await getTagDetails(input.name)
    if (recentTag.type !== 'tag') {
      core.setFailed(`${input.name} is not an annotated tag`)
      return
    }

    createTagArgs = {
      tag: input.name,
      message: input.message ?? [recentTag.subject, recentTag.body].join('\n'),
      sha: recentTag.targetSha!,
    }
  } else {
    if (!input.message) {
      core.setFailed('input message is required')
      return
    }

    const headCommitSha = await getRev('HEAD')

    createTagArgs = {
      tag: input.name,
      message: input.message,
      sha: headCommitSha,
    }
  }

  core.info('Creating tag ...')

  const tag = await createTag(octokit, repository, createTagArgs)
  core.setOutput('tag', tag.tag)

  core.info('Syncing local repository ...')
  await exec(`git fetch ${input.remoteName} ${tag.sha}`)
  await exec(`git tag -f ${tag.tag} ${createTagArgs.sha}`)
})

