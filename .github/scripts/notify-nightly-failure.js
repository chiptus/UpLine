module.exports = async ({ github, context }) => {
  const title = "Nightly E2E suite failing";
  const runUrl = `${context.serverUrl}/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}`;
  const body = `The nightly E2E suite failed.\n\nRun: ${runUrl}`;
  const label = "nightly-e2e-failure";

  try {
    await github.rest.issues.getLabel({
      owner: context.repo.owner,
      repo: context.repo.repo,
      name: label,
    });
  } catch {
    await github.rest.issues.createLabel({
      owner: context.repo.owner,
      repo: context.repo.repo,
      name: label,
      color: "d73a4a",
      description: "Nightly E2E full-suite run failed",
    });
  }

  const { data: existing } = await github.rest.issues.listForRepo({
    owner: context.repo.owner,
    repo: context.repo.repo,
    state: "open",
    labels: label,
  });

  if (existing.length > 0) {
    await github.rest.issues.createComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: existing[0].number,
      body,
    });
  } else {
    await github.rest.issues.create({
      owner: context.repo.owner,
      repo: context.repo.repo,
      title,
      body,
      labels: [label],
    });
  }
};
