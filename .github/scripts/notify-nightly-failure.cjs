module.exports = async ({ github, context }) => {
  const failedSuites = [];
  if (process.env.E2E_RESULT === "failure") failedSuites.push("E2E");
  if (process.env.INTEGRATION_RESULT === "failure")
    failedSuites.push("integration");
  if (process.env.REPORT_RESULT === "failure") failedSuites.push("report");
  const suiteText = failedSuites.length ? failedSuites.join(" + ") : "nightly";

  const title = `Nightly ${suiteText} suite failing`;
  const runUrl = `${context.serverUrl}/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}`;
  const body = `The nightly ${suiteText} suite failed.\n\nRun: ${runUrl}`;
  const label = "nightly-test-failure";

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
      description: "Nightly test run (E2E and/or integration) failed",
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
