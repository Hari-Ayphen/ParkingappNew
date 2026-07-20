# GitHub Projects v2 Board

The team tracks tasks and bugs on a single **GitHub Projects v2** board with two
single-select fields: **Status** and **Deploy**.

## Fields

| Field  | Type          | Options                                                  |
| ------ | ------------- | ------------------------------------------------------- |
| Status | Single select | Backlog · Todo · In Progress · In Review · Done          |
| Deploy | Single select | Not deployed · Staging · Production                      |

`Status` tracks where the work is in the flow. `Deploy` tracks where that work has shipped —
so a card can be **Done** on Status but still **Staging** on Deploy until it reaches production.

**Scheduling lives outside the board:** a **Milestone** says *which version* an issue ships in.
See [Milestones](#milestones) below.

---

## 0. Authenticate `gh` with the Projects scope

```bash
brew install gh
gh auth login                              # GitHub.com → HTTPS → browser
gh auth refresh -s project,read:project    # REQUIRED: default scopes do NOT include Projects
gh auth status                             # confirm scopes include 'project' and 'repo'
```

> ⚠️ The `gh auth refresh` line is not optional. `gh auth login`'s default scopes exclude
> Projects, so every `gh project` command below fails until you add them.

## 1. Create the labels

```bash
bash github/labels.sh   # idempotent — uses `gh label create ... --force`
```

## 2. Create the board

```bash
gh project create --owner <OWNER> --title "<Project>" --format json
```

> ⚠️ **Gotcha:** this call may return a **504 Gateway Timeout but still create the project.**
> Before retrying, always check:
>
> ```bash
> gh project list --owner <OWNER>
> ```
>
> Retrying blind gives you two boards.

Note the project **number** from `gh project list` — every command below takes it as `<NUM>`.
`<OWNER>` is a user (`@me`) or an org.

## 3. Create the Deploy field

```bash
gh project field-create <NUM> --owner <OWNER> \
  --name "Deploy" --data-type SINGLE_SELECT \
  --single-select-options "Not deployed,Staging,Production"
```

## 4. Extend the built-in Status field

> ⚠️ **Gotcha:** the board ships with a built-in `Status` field carrying only
> **Todo / In Progress / Done**. You can't `field-create` a second field named `Status`
> (names must be unique), so extend the existing one via GraphQL — and do it **while the
> board is still empty**, before any items reference the options.

```bash
SID=$(gh project field-list <NUM> --owner <OWNER> --format json \
  | python3 -c "import sys,json;d=json.load(sys.stdin);print(next(f['id'] for f in d['fields'] if f['name']=='Status'))")

gh api graphql -f query='
mutation($fid:ID!){
  updateProjectV2Field(input:{ fieldId:$fid, singleSelectOptions:[
    {name:"Backlog",color:GRAY,description:"Not started"},
    {name:"Todo",color:RED,description:"Ready to pick up"},
    {name:"In Progress",color:YELLOW,description:"Being worked on"},
    {name:"In Review",color:BLUE,description:"Awaiting review"},
    {name:"Done",color:GREEN,description:"Complete"}
  ]}){ projectV2Field { ... on ProjectV2SingleSelectField { name options { name } } } }
}' -f fid="$SID"
```

The mutation **replaces** the whole option set, so list all five — any option you omit is dropped.

## 5. Add issues and set fields

```bash
iid=$(gh project item-add <NUM> --owner <OWNER> --url <ISSUE_URL> --format json | jq -r .id)

gh project item-edit --id "$iid" \
  --project-id "<PVT_...>" \
  --field-id "<FIELD_ID>" \
  --single-select-option-id "<OPTION_ID>"
```

Get the project id (`PVT_…`), field ids, and option ids from:

```bash
gh project list --owner <OWNER> --format json               # project id
gh project field-list <NUM> --owner <OWNER> --format json   # field + option ids
```

> ⚠️ **Gotcha:** `item-edit` takes the **project id** (`PVT_…`), not the project **number**.

## 6. Verify

> ⚠️ **Gotcha:** `gh project item-list` defaults to **30 items**. Pass `--limit 100` or
> you'll conclude items are missing when they're just paginated out.

The open-issue count should match the board item count:

```bash
gh issue list --state open --limit 100
gh project item-list <NUM> --owner <OWNER> --limit 100
```

Confirm the Status field really carries all five options:

```bash
gh project field-list <NUM> --owner <OWNER> --format json \
  | jq '.fields[] | select(.name=="Status").options[].name'
```

---

## Create the board — UI

If you'd rather click through it:

1. Go to the org/user **Projects** tab → **New project** → **Board** layout → name it.
2. The board ships with a **Status** field. Open its settings and set the options to:
   `Backlog`, `Todo`, `In Progress`, `In Review`, `Done`.
3. Add a new field: **+ → New field → Single select**, name it **Deploy**, options:
   `Not deployed`, `Staging`, `Production`.
4. (Optional) Add a **Board** view grouped by `Status`, and a **Table** view for triage.
5. Enable the built-in **workflows** (Project → ⋯ → Workflows) so newly-added issues default to
   `Status: Todo` and closed issues move to `Status: Done`.
6. Add repositories to the project so their issues/PRs can be tracked.

---

## Milestones

**A milestone is a version** — `v0.1`, `v0.2`, `v1.0` — and it's what schedules an issue.
Milestones are a repo feature, not a board field, so they work alongside Status/Deploy:

| Question | Answered by |
|---|---|
| *Which version does this ship in?* | Milestone |
| *Where is this right now?* | Status |
| *Has it reached production?* | Deploy |
| *Is this live scope or deferred?* | `phase:1` / `phase:2` label |

Create them once (**Issues → Milestones → New milestone**, or via the API), then assign:

```bash
# create a milestone
gh api repos/{{owner}}/{{repo}}/milestones -f title="v0.1" -f description="Auth & onboarding"

# assign an issue to it
gh issue edit 42 --milestone "v0.1"

# create an issue already scheduled
gh issue create --title "[Feature] …" --label "type:feature,area:web,priority:P2,phase:1" \
  --milestone "v0.1"

# what's left in this version
gh issue list --milestone "v0.1" --state open
```

The milestone page gives you a progress bar and burn-down for free. A `phase:2` issue with no
milestone is deferred scope — that's valid, not an oversight.

Scope and exit criteria per milestone live in [`../PROJECT_PLAN.md`](../PROJECT_PLAN.md).

---

## Day-to-day

- New issue → **Backlog** (or **Todo** once scoped). Assign its **milestone** if it's scheduled.
- Start work → **In Progress**.
- Open PR → **In Review**; set `Deploy: Staging` when it lands on staging.
- Merge + close issue (`Closes #N`) → **Done**; set `Deploy: Production` after the prod release.
