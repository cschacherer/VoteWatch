# VoteWatch — Project Spec

VoteWatch is a civic transparency app for the **Utah State Legislature**. It collects bills, roll-call votes and legislators, uses an LLM to write plain-English bill summaries and to sort bills into policy topics, and then scores how each legislator votes on each policy axis (for example Housing Supply: Restrict ↔ Increase).

Solo hobby project. The developer's working style: iterate in the UI, keep commented-out experiments around, and run offline data jobs by hand-toggling `await` lines.

---

## 1. Architecture

```
Utah Legislature API (glen.le.utah.gov) ─┐
le.utah.gov HTML/PDF/XML (scraped) ──────┼─► server/database/fillDatabase.js ─► voteWatch.db (SQLite, committed)
nano-gpt LLM API (summaries, policies) ──┘   server/database/createPolicyScore.js ┘        │
                                                                                         ▼
                                              server/server.js (Express 5, port 3005, read-only API)
                                                                                         │  axios
                                                                                         ▼
                                              react_client (Vite + React 19 + TS, port 5173)
                                                 └─► browser calls Geoapify / UGRC / ArcGIS directly for district lookup
```

- **There are two separate npm projects** and no root package.json: `server/` (plain JS ESM) and `react_client/` (TypeScript).
- **The ETL runs offline and by hand.** The API server only reads. Nothing in the running app writes to the DB.
- **The DB is committed**: `server/database/voteWatch.db` is about 98 MB and currently has 1,998 bills, 133k votes, 102 legislators, 2,261 policy rows and 5,100 couple scores. Sessions are `2025GS`, `2025S1`, `2025S2` and `2026GS`. Stored scores exist **only for year 2026**. Other years and single sessions are scored live for one legislator (see `/analysis/:legislatorId/:year`).

### Running
```bash
cd server && npm run dev          # nodemon server.js → http://localhost:3005
cd react_client && npm run dev    # vite → http://localhost:5173
cd server && npm run databaseDev  # runs fillDatabase.js (whatever await lines are uncommented at the bottom)
```
`.vscode/launch.json` has matching debug configs ("Debug Full Stack", "Launch and Debug Fill Database").
Check the client with `npx tsc -p tsconfig.app.json --noEmit` and `npm run lint`. `npm run build` currently **fails**: `noUnusedLocals` is on and several files have unused imports. There are no tests; mocha is listed in the server's dependencies but has no test files.

---

## 2. Server (`server/`)

| File | Role |
|---|---|
| `server.js` | Express app, CORS for `http://localhost:5173`, request logger, mounts routers |
| `billRouter.js`, `legislatorRouter.js`, `analysisRouter.js` | Each router creates its own `Database` and runs `await openDatabase()` at the top level |
| `database/database.js` | `Database` class: every SQL statement lives here. `_execute` / `_getAllRows` / `_getFirstRow` wrap sqlite3 callbacks in promises |
| `classes/*.js` | `Bill`, `Legislator`, `Vote`: they normalize the inconsistent gov-API JSON (keys lower-cased with `helper.js#lowerCaseKeys`, several fallback spellings per field) |
| `database/constants.js` | `SESSION_LIST`, API base URLs, LLM config (`AI_BASE_URL` = nano-gpt, `AI_MODEL` = `deepseek/deepseek-v4-flash`) |
| `database/policyTopics.js` | **Source of truth for the policy taxonomy** (see §4) |

### REST API (all GET, snake_case JSON straight from SQLite rows)
- `/bills`: every bill with a `policies[]` array (built with a SQL `json_group_array` over `policy`)
- `/bills/:sessionId`: bills for one session. ⚠ `policies` comes back as an unparsed JSON string (see §7)
- `/bills/:sessionId/:id`: one bill with a parsed `policies[]` array
- `/bills/:sessionId/:id/votes`: the votes joined with legislator name and house
- `/legislators`, `/legislators/:id`, `/legislators/:id/votes`, `/legislators/:id/sponsored`. The votes and sponsored routes attach each bill's parsed `policies[]` through the `BILL_POLICIES_COLUMN` subquery plus `parsePolicies` in `database.js`. Reuse those for any new bill query that needs policies. On the client, `createBillFromVote` uses `raw.policies` when it is present, and otherwise builds a single policy from a row joined with `policy` (the analysis routes)
- `/legislators/:chamber/:district`: chamber is `H` or `S`
- `/legislators/:id/:year/analysis`: reads the older `policy_score` table
- `/analysis/years`: years that have bills, newest first, with `has_scores` and `sessions` (that year's session ids, newest first). The Analysis page and the profile's Policy Scores tab use it instead of a hard-coded year list
- `/analysis/overview/:year`: legislature-wide data for the Analysis page: `summary` (bills voted on, total and absent votes), `scores` (every legislator's couple scores with votes, plus party and chamber), `participation` (each legislator's yes/no/absent counts) and `policy_outcomes`. `policy_outcomes` comes from `server/database/policyOutcomes.js`: per topic, the bill and passed counts for every direction, plus an outcome score per couple. The outcome score uses the legislator-score formula, but each *passed* bill counts toward its own direction. Only directions valid for their topic (per `policyTopics.js`) are counted. This route and `/years` must be registered before `/:legislatorId/:year`
- `/analysis/scores/:year[?session=]`: every legislator's couple scores with their party (only couples with counted votes), via `getLegislatureCoupleScores`. It reads the stored scores for a year when there are any, and otherwise computes all legislators live (about 0.6s). It must be registered before `/:legislatorId/:year`. Used by the Voting Analysis tab's "Compare" switch
- `/analysis/outcomes/:year[?session=]`: just the `policy_outcomes` (via `getPolicyOutcomes`, which the overview also uses) for a year or one session. The Analysis page calls it when a session is picked
- `/analysis/outcomes/:year/:policyCoupleName[?session=]`: one couple's legislature outcome score plus the passed bills behind it (each row is bill + policy). Used by `OutcomeDetailsPage`
- `/analysis/:legislatorId/:year[?session=]`: couple scores. For a year without `?session` it reads the stored scores (`leg_scores_policy_topic_couples` ⨝ `policy_topic_couples`). For a session, or a year with no stored rows, it computes them live with `getLiveCoupleScoresForLegislator` → `database/legislatorCoupleScores.js#buildLegislatorCoupleScores`. That is the same math as `createPolicyScore.js`, and it was checked equal to all 5,100 stored 2026 scores. Both paths return the same row shape. If you change the scoring formula, change both. Used by the profile's Voting Analysis tab and by AnalysisDetailsPage
- `/analysis/:legislatorId/:year/:policyTopic/:policyDirection`: the bills and this legislator's votes for one direction
- `/analysis/:legislatorId/:year/couple/:policyCoupleName[?session=]`: every bill in that couple (only that session's bills when `?session` is given) with the legislator's vote, including absent votes (yes + no rows equal `all_included_votes`; absent rows are shown but not scored). Used by `AnalysisDetailsPage`. It must be registered before the four-parameter route above

Route conventions: wrap each handler in `try/catch`, `console.log` a label, and send `res.status(500).send("Internal Server Error")` on error. Keep new routes in the same shape and put the SQL in a new `Database` method, never inline in a router.

### Database schema (live DB; `_createTables()` has drifted from it, see §7)
- `legislators(id PK, full_name, format_name, image, house 'H'|'S', party, district, counties, email, phone, service_start, link)`
- `bills(session_id, id, …, summary_text [JSON string], full_text, pdf_link, passed, house_vote_url, senate_vote_url, policy_topics [legacy], measure_type, is_substantive, needs_review, review_reason; PK(session_id,id))`
- `votes(session_id, bill_id, legislator_id, vote 'yes'|'no'|'absent'; PK(session_id,bill_id,legislator_id))`
- `policy(session_id, bill_id, policy_topic, policy_topic_strength 'primary'|'secondary', policy_direction, impact_level 'low'|'moderate'|'high', confidence 0–1, neutral_summary, include_in_scorecard; PK(session_id,bill_id,policy_topic))`: filled by the LLM
- `policy_topic_couples(id, policy_topic, name_label, left_policy_direction, right_policy_direction, policy_topic_couple_name UNIQUE)`
- `policy_topic_singles(id, policy_topic, name_label, policy_direction)`: defined but not used yet
- `leg_scores_policy_topic_couples(legislator_id, year, policy_topic_couple_name, all_included_votes, score; PK(legislator_id,year,policy_topic_couple_name))`
- `policy_score(...)` and `policy_topics(...)`: the older per-direction scoring, now superseded by couples

Keys: bills are identified by **(session_id, id)**. Bill IDs look like `HB0001` or `SB0123`. Special-session sessions end in `S1`/`S2`. Year is `session_id.slice(0,4)`.

---

## 3. ETL pipeline (`server/database/`)

`fillDatabase.js` exposes stage functions and runs whichever ones are uncommented at the bottom of the file. The stages, in order:
1. `createNewEmptyDatabase()`: **this deletes voteWatch.db.** Never run it unless the user asks explicitly.
2. `fillLegislatorsTable()`: `getLegislatorsFromGovApi.js`
3. `fillBillsTableAllSessions_generalData()`: calls the gov API bill list, then fetches each bill and builds a `Bill` object
4. `…_passedData()`: sets passed and dates from the passed list (strips the `S01` version suffix)
5. `…_textData()`: `getBillTextFromWebScraping.js` (PDF link plus XML full text)
6. `currentFillVotesTable()`: `getVotesFromWebScraping.js` scrapes `svotes.jsp` with cheerio (uses a TLS-insecure undici agent)
7. `…_summaryData()`: `getSummariesFromAI.js` stores a JSON summary in `bills.summary_text`. Currently hard-limited to `2026GS`/`2025S2` and 300 bills
8. `…_policyData()`: `getPoliciesFromAI.js` sends the summary and subjects to the LLM, which returns strict JSON with topics constrained to the `policyTopics.js` enums; the result goes into `policy` plus the bill's review fields
9. `createPolicyScore.js` → `createScoresForAllLegislators()` (year hard-coded to `"2026"`). Also contains the commented-out `generatePolicyTopicTable()` that seeds `policy_topic_couples`

Inserts use `INSERT OR IGNORE`, so **re-running a stage does not overwrite existing rows**. To recompute scores or policies you must delete the old rows first. These jobs make many paid LLM calls and scrape external sites, so confirm with the user before running any of them.

---

## 4. Policy taxonomy and scoring (the core domain)

- `server/database/policyTopics.js#createPolicyTopics()` defines 16 topics (housing_land_use, environment_natural_resources, energy, taxes_government_spending, criminal_justice_public_safety, civil_rights_liberties, redistricting_elections, healthcare_public_health, education, labor_employment, business_economic_regulation, infrastructure_transportation, government_operations_transparency, great_salt_lake, immigration, artificial_intelligence). Each topic has:
  - `policyDirections`: snake_case verbs such as `increase_housing_supply`. These are the only values the LLM may assign.
  - `policyCouples`: `PolicyTopicCouple(name, nameLabel, leftLabel, rightLabel, leftDirection, rightDirection)`. Each one pairs two opposing directions into a single 0–100 axis.
- **`react_client/src/models/PolicyTopic.ts` is a hand-maintained copy** in a different shape (it has no labels and only lists `includedPolicyDirections`). If you change the taxonomy you must update both files, re-seed `policy_topic_couples`, and re-run the LLM policy classification for affected bills.
- **Couple score** (`generateCouplePolicyDirectionScore`):
  - Each vote gets a weight: `impact{low .5, moderate 1, high 2} × strength{primary 1, secondary .5} × confidence`.
  - A yes vote adds +weight to that side's net and a no vote adds −weight. Absent votes are skipped.
  - `score = 50 + 50 × (netRight − netLeft) / (totalLeftWeight + totalRightWeight)`, which gives 0 for fully left, 50 for neutral and 100 for fully right. If there are no votes the score is 50.
  - `all_included_votes` counts the yes and no votes. The UI hides couples where it is 0.
- Summaries and classifications must stay **neutral and nonpartisan**. Preserve the prompt rules in `getSummariesFromAI.js` and `getPoliciesFromAI.js` when editing them.

---

## 5. Client (`react_client/src/`)

- **Stack:** React 19, react-router-dom 7 (`BrowserRouter`), TypeScript strict with `noUnusedLocals`/`noUnusedParameters`, Vite 7 with `vite-plugin-svgr` (import SVGs as components), Bootstrap 5 CSS and react-bootstrap, `react-data-table-component` for tables, react-leaflet for maps. `@tanstack/react-table`, the `datatables.net-*` packages and `styled-components` are installed but **unused**, so don't introduce them.
- **Routes** (`App.tsx`, all inside `AppLayout` with `NavigationBar`): `/`, `/about`, `/bills`, `/bills/:sessionId/:billId`, `/legislators`, `/legislators/:legislatorId`, `/maps`, `/analysis`, `/analysis` is **Legislature Trends**: legislature-wide charts plus a participation table, with `?tab=&year=&session=`. The page has three `PillTabs`: `passed` ("Legislature Trends", the default), `parties` ("Party Trends") and `participation`. Each tab's filter card starts with the same `yearRow`, which sets the page-wide `year` param. "Filter policies" stays visible for a year without scores, so the year can be changed back. Param changes go through `updateParams`, so they keep the other params. There is no chamber filter: every section covers both chambers. `session` only narrows "What the legislature passed", and a new year clears it. The spectrums and participation table stay whole-year, because stored scores are per year. One legislator's scores live on their profile at `/legislators/:id?tab=scores&year=&session=`. The Voting Analysis filter card has Year chips (every year with bills) and, when the year has more than one session, Session chips. "Votes Included" links pass `?session=` on to AnalysisDetailsPage, and its back link keeps it. A "Compare" switch loads `/analysis/scores/:year` for the same year and session, and adds each party's median (`utils/partyMedians`, the same numbers as Party Trends) to every `PolicyScoreBar` through its optional `partyMedians` prop. These show as smaller R and D dots, with labels under the track. `/analysis/outcomes/:year/:policyCoupleName` (OutcomeDetailsPage, the bills behind a legislature outcome score; its static `outcomes` segment outranks the route below). Also `/analysis/:legislatorId/:year/:policyCoupleName` (AnalysisDetailsPage, linked from "Votes Included" in PolicyTopicSection).
- **Folder layout:** one folder per page or component (`Name/Name.tsx` plus `Name.module.css`), default export. ScoreSlider is the exception: it uses a plain `.css` file with BEM names (`ScoreSlider__track`) and a named export.
- **Data flow** follows the pattern `services/*Service.ts` → `apiClient` (axios, baseURL `http://127.0.0.1:3005`) → `endpointsAPI` path builders → `models/*.ts#createX(raw)` factory → typed object.
  - Models are `type`s plus a `createX(raw: any)` that maps snake_case to camelCase with `String(x ?? "")`/`Number(...)` coercion.
  - Services catch errors, pass them through `getErrorMessage`, `console.log` them and rethrow `new Error(msg)`.
  - Pages load data in `useEffect` with `useState`. There is no global state library, React Query or context. Keep it that way unless the user asks.
- **Tables:** use `GeneralTable<T>` with `columns={createXColumns({...handlers})}`, a plain array of `createDataTableColumn<T>({...})` entries. The table itself only adds free-text search, sorting and pagination. Search matches are highlighted with the CSS Custom Highlight API (`::highlight(table-search)` in `global.css`). It paints text ranges without changing the DOM, so it works inside any cell component. Highlighting starts at 2 characters and re-scans when the table's DOM changes (paging, sorting, "Show more"). Search only looks at what the table shows: each non-`omit` column's `searchText(row)`, or its `selector` value when that is a string, number, or array of them. Object values are skipped, so hidden fields like a bill's `fullText` never match. Give a column `searchText` whenever its cell displays something different from its selector, using the shared helpers in `utils/searchText.ts` (`billCellSearchText`, `policyChipSearchText`) for `BillCell` and `PolicyChip`. Render a searchable phrase as one string (`` {`${level} impact`} ``), not as JSX pieces, because separate text nodes can't be highlighted across. Rows are keyed by `keyField` (default `"id"`). Bill numbers repeat across sessions, so tables of bills pass `keyField="rowKey"` (`Bill.rowKey` = session + id); duplicate keys leave stale rows on screen. There's no filter pop-up and no filter state inside the table. Optional props: `loading` shows a loading state, and `onFilteredDataChange(rows)` reports the rows left after search. It fires every render, so store only primitive values from it (like counts).
- **Filters live on the page, and there's only one set.** Pages keep filter state themselves and filter the data before passing it to `GeneralTable`.
  - **Clicking a value in a row must select the matching filter at the top of the page:** sessions, pass status, policy topics and directions, subjects, chamber, district, party, county, vote, role. On the Legislators page, clicking a district also selects its chamber, because House 12 and Senate 12 are different seats. Column factories take the page's setters as handlers (e.g. `onSessionSelect`, `onStatusSelect`), so the top filters always show what's applied. The Bills page and the Legislator Details Voting History and Sponsored Bills tabs share one time filter. A Year row (`All Years` plus each year) comes first, then, once a year is picked, a Session row with that year's sessions. It shows even when the year has only one (for example 2026's General Session). Picking a year clears the session, and clicking a session badge in a row selects both its year and the session. The profile's Voting Analysis tab and Legislature Trends also always show the selected year's Session row. On the Bills, Legislators and Legislator Details pages a row click filters to *only* that value: `filterFromRow` runs `clearAllFilters()` and then applies the clicked filter, so every other filter (including "Primary policies only") goes back to All. The "Show subjects column" switch isn't a filter, so it stays as it is.
  - **Only make a value clickable if a page filter exists for it.** `Badge` only shows the pointer cursor and hover effect when it has an `onClick`.
  - Hidden (`omit: true`) columns are only for sorting, like the `sessionId` column behind the newest-first default.
- **Chips or a dropdown:** use chips for short lists (about 8 options or fewer) and `SearchableDropdown` for long ones. For in-between lists that are worth seeing, like the 16 policy topics, use `ChipSelect`: chips on screens wider than 768px, a searchable dropdown on phones.
- **Styling:** prefer the global utility classes in `styles/global.css` and `styles/layout.css` over new CSS: `page`, `pageScroll`, `section`, `verticalStack`, `horizontalRow`, `centerVertically`, `centerHorizontally`, `justifySpaceBetween`, `smallGap`/`defaultGap`/`largeGap`, `smallPadding`/`defaultPadding`/`largePadding`, `largeFont`, `outline`/`outlineThin`, `filledHeader`, `subHeader`, `link`, `topicHeight`. Colors and spacing are CSS variables on `:root` (`--padding-*`, `--color-house`, `--color-senate`, `--color-republican`, `--color-democrat`, …). Use a component `.module.css` only for component-specific styles.
- **Font sizes:** every `font-size` uses the rem scale in `global.css`: `--font-size-xs` (12px), `-sm` (14), `-md` (16), `-lg` (20), `-xl` (24) and `-2xl` (32), plus `--font-size-section`, `--font-size-display` and `--font-size-hero` for responsive headings. Never hard-code `px` or `rem` font sizes, including in inline styles such as `GeneralTable`'s `customStyles`. Because the scale is in rem, text follows the user's browser font-size setting. Use `px` only for borders, shadows and fixed-size details like icons. Inputs use `-md` (16px) so iPhones don't zoom in when an input gets focus.
- **Images:** ship photos as resized WebP, about twice their displayed width. The originals are converted with `sharp`, which isn't a project dependency; run it from a scratch folder. The Home hero is served from `public/images/capitol-hero-{800,1600}.webp` and preloaded by an inline script in `index.html`, only on `/`. The preload's `imagesrcset` and `imagesizes` must match the hero `<img>` in `HomePage.tsx`, or the browser downloads it twice. Photos below the fold get `loading="lazy"`. The original JPEGs in `src/assets/` are no longer imported and don't ship.
- **List pages (Bills, Legislators) share one layout.** Build new list pages from the shared components:
  - `ListPage` for the scrolling page, where the last child (the table) gets 80vh
  - `PageHeader` for the label, title, subtitle and stats
  - `PillTabs` for single-select tabs
  - `FilterCard` and `FilterRow` for the filter card. `FilterRow` takes an optional `action`, shown below the row's chips, for a control that belongs to that one filter, like the "Primary policies only" switch on the Topic row
  - `ClearFiltersButton` (exported from `FilterCard`) as the card's `action`: pass it `count` (the page's `activeFilterCount`) and `onClick` (`clearAllFilters`). It renders nothing while `count` is 0
  - `FilterChip` for a chip with a count
  - `ToggleSwitch` for switches
  - `GeneralTable` with `onFilteredDataChange`, so the header stats count the visible rows

  Filters live in page state and filter the data before it reaches `GeneralTable`. Chip counts are faceted: each filter's counts apply every other filter but not its own.
- **Long option lists:** use `components/SearchableDropdown` (a button that opens a searchable list with optional counts and keyboard support), as the Bills page does for its 579 subjects. Use chips only for short lists such as sessions and policy topics.
- **Display helpers:** `formatPolicyName("housing_land_use")` → "Housing Land Use" (`utils/stringFormat.ts`), and `formatDate` in `models/DataTableUtils.ts`.
- **District lookup** (`services/mapService.ts`, `DistrictFinder`): the browser calls Geoapify autocomplete, then UGRC geocode, then ArcGIS district layers, then `/legislators/:chamber/:district`. The keys come from `react_client/.env` (`VITE_GEOAPIFY_API_KEY`, `VITE_UGRC_APIKEY`). The basemap tiles are Esri's World Light Gray canvas: free with attribution and no key needed. The old CARTO URL now shows "API KEY REQUIRED" tiles. House outlines are blue (`#2563eb`) and Senate amber (`#d97706`), so chamber colors don't look like party colors.
- Formatting: 4-space indent, double quotes, trailing commas (Prettier defaults with `tabWidth: 4`). Match this in both projects.

---

## 6. Working rules for Claude

1. **Adding a feature end to end** goes in this order: a `Database` method, then a router route, then an `endpointsAPI` entry, then a service function, then a model `createX`, then the page or component. Keep snake_case on the server and camelCase in the client.
2. Don't run ETL or scoring scripts, don't delete or recreate `voteWatch.db`, and don't make LLM or scraping calls without asking first. For DB inspection, read-only queries through node + sqlite3 are fine.
3. Taxonomy changes touch **both** `policyTopics.js` files **and** require re-seeding and re-scoring (§4).
4. After client changes, run `npx tsc -p tsconfig.app.json --noEmit` and don't add new errors. Remove unused imports you introduce.
5. Leave the user's commented-out experiments alone unless the task is cleanup.
6. Don't add new dependencies when an installed one already covers the need.
7. Never paste secret values into chat, commits or docs.
8. Vite's file watcher on this Windows machine can miss a second save made within milliseconds of the first. If a style or change doesn't appear, check what Vite actually serves (e.g. `await import('/src/...module.css?t=' + Date.now())` in the browser) and `touch` the file to force a reload.
9. Component files (`.tsx` with a default-export component) should export only components and types. Put helper functions and constants in `utils/` (for example `utils/partyMedians.ts`). Otherwise Vite's Fast Refresh can't hot-swap the file: an error thrown mid-edit leaves the page blank until a full reload, because there's no error boundary.
10. `GeneralTable` wraps `DataTable` in a styled-components `StyleSheetManager` with `@emotion/is-prop-valid`. react-data-table-component 7 passes column settings like `grow` and `minWidth` to styled-components 6, which no longer filters them, so without the wrapper React logs "does not recognize the `minWidth` prop" warnings. `@emotion/is-prop-valid` ships with styled-components, so it isn't a separate dependency.

---

## 7. Known issues / tech debt (verified 2026-09-26)

**Security**
- `server/database/constants.js` hard-codes the nano-gpt `AI_TOKEN` in committed source. It should come from `process.env` (the commented `NANO_AI_TOKEN` line). The key should also be rotated.
- `react_client/.env` is tracked in git even though `.gitignore` lists `.env`. It contains the Geoapify and UGRC keys, which are browser-exposed by design, but it should still be untracked.

**Server bugs**
- `getAllBillsWithPoliciesForSession` returns before its `JSON.parse` mapping (the code after the return is unreachable), so `policies` is a JSON **string** on `/bills/:sessionId`, and the client's `createAllBillPolicies` has to cope with that. `getBillDetailsWithPolicies` was fixed on 2026-09-26: it now parses the string and drops the `[null]` entry that bills with no policies produced.
- `getAllVotesOnBill` inner-joins `legislators`, so votes by legislators no longer in office are left out of bill vote lists.
- `legislatorRouter.js` path `"analysis/:legislatorId/..."` has no leading `/`, so it never matches. Use `/analysis/...` instead.
- `_createTables()` has drifted from the live schema:
  - `leg_scores_policy_topic_couples` contains invalid SQL (`TEXT (Foregin key )`, missing comma).
  - `policy_topic_couples` has no `policy_topic_couple_name` column.
  - `bills` has no `policy_topics` column, but `addToBills` supplies 27 values for 26 columns.
  - A fresh `createNewDatabase()` would therefore break.
- `addToPolicyTopic` targets `ON CONFLICT(policy_direction)`, which matches the live table but not `_createTables`.
- `classes/policy.js` references an undefined `policy_object` and exports nothing, so it is dead code. `classes/vote.js` builds `link` from an undefined `this.year`.
- `addTo*Score` duplicates: `addToLegislatorPolicyCoupleScore` and `addToLegislatorPolicySingleScore` both write to `policy_score`.
- Each router opens its own SQLite connection (three in total). One shared instance would be cleaner.
- Years and sessions are hard-coded in several places: `SESSION_LIST`, `"2026"` in scoring, `availableYears = [2025, 2026]` in `AnalysisPage`, and the summary session filter.
- Stray files `server/output.txt` and `server/UsersConner SchachererDesktopOutput.txt`, plus a hard-coded Desktop path in `getAllSubjects`.

**Client**
- `tsc` fails on about 20 unused imports or locals across `AnalysisPage`, `BillDetailsPage`, `HomePage`, `LegislatorDetailsPage`, `LegislatorsPage` and the services. This blocks `npm run build`.
- `analysisService.getAllPolicyTopics` actually fetches bills, so it is misnamed.
- **Many couple scores rest on very few votes.** 2026 has 16 of 41 couples at a median of under 5 votes per legislator, and several have exactly 1, so every score there is 0 or 100. The Analysis page hides couples under `MIN_MEDIAN_VOTES` (5) by default and shows the vote basis on each chart. `PolicySpectrum` is one card per policy topic, laid out like `PolicyTopicSection`. Each of the topic's couples gets a 0–100 slider with one dot per party at that party's **median** legislator score. Cards are always alphabetical by topic name. The sort buttons (Biggest party gap, Most agreement, A–Z) only order the couples inside each card. A party needs `MIN_PARTY_MEMBERS` (3) scored members to get a dot. Democrat labels sit above the track and Republican labels below, so they never overlap. Dots are clamped so they stay on the track at 0 and 100. When the two medians are within `DOTS_TOUCH_POINTS` (4), the dots sit side by side, centered on the midpoint; otherwise identical scores (common in low-vote policies) would hide one dot. Keep this in mind for any new score view.
- `AnalysisPage` links use `<a href>`, which does a full reload. `react-router`'s `Link` would avoid that.
- `getPolicyWeight` (impact × strength × confidence) lives in `server/database/policyWeight.js` and is shared by `createPolicyScore.js` and `policyOutcomes.js`. Change it in one place so legislator scores and outcome scores stay consistent. Changes only take effect after re-running scoring.
- Couple end labels ("Restrict" / "Increase") are derived on the client by `shortenDirectionPair` in `utils/stringFormat.ts`. It matches the hand-written `leftLabel`/`rightLabel` in `policyTopics.js` for all 50 current couples, but new couples should be checked.
- The root README describes a generic setup (ports 3000 and the concurrently script) and doesn't match the actual ports 3005 and 5173.
