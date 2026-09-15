# Defer Intake Feature - Product Requirements Document

## Overview
- **Summary**: Add a "Defer Intake" action to the University Application table that lets staff defer an application to a future intake date. The original application is rejected with a comment, and a duplicate application is created with a new custom intake date that appears in a separate "Deferred Intake" filter tab.
- **Purpose**: Handle cases where visa processing is delayed or the current intake date expires, without losing the application data or history.
- **Target Users**: University staff users (UNIVERSITY role) who review and process applications on `/dashboard/application`.

## Goals
- Add Defer Intake button alongside Reject and Approve in the Application Approval column
- Reject original application with a [DEFERRED] prefixed reason that appears in the rejection history indicator bubble ("SMS" visible to viewers)
- Create a duplicate application tied to the same student and program, tagged as deferred
- Display the NEW intake date on the deferred duplicate application
- Separate the two applications in the UI: Original in "Rejected" tab, Duplicate in "Deferred Intake" tab
- Duplicate (deferred) application shows NO rejection history / SMS indicator

## Non-Goals
- No actual SMS/Twilio text message sending (the "SMS" refers to the in-app rejection history bubble indicator)
- No email notifications for the defer action (unless explicitly added later)
- No changes to the Student or Agent role application list views
- No changes to the offer creation or signing workflow for deferred applications

## Background & Context
The application page (`/dashboard/application`) already has a tabbed table for University staff with:
- Tabs: All Applications, Pending Review, Awaiting Signature, Recently Completed, Rejected
- Action buttons: Reject, Approve
- The Defer Intake UI scaffolding (dialog, button hook, tab) already existed but was non-functional due to broken API route, missing DB columns, missing type definitions, and missing deferred tab count calculation.

Relevant files already scaffolded but broken before fixes:
- [defer-intake-dialog.tsx](file:///d:/Personal%20Project/Admission-Operation-System/app/(dashboard)/dashboard/application/_components/defer-intake-dialog.tsx) - Dialog UI
- [application-list-table.tsx](file:///d:/Personal%20Project/Admission-Operation-System/app/(dashboard)/dashboard/application/_components/university-application/application-list-table.tsx) - Table with Defer button and "Deferred Intake" tab
- [withUniversityApplicationPageLogic.tsx](file:///d:/Personal%20Project/Admission-Operation-System/app/(dashboard)/dashboard/application/_components/university-application/withUniversityApplicationPageLogic.tsx) - Logic HOC already wired defer mutation

## Functional Requirements
- **FR-1**: Defer Intake button appears in the Approval column for the same applications that can be Rejected (pending, no offer), AND the application is NOT itself already a deferred copy.
- **FR-2**: Clicking Defer Intake opens a dialog showing the current intake, a required date picker for "New Intake Date", and a required textarea for "Reason for Deferral".
- **FR-3**: Submitting the defer dialog rejects the ORIGINAL application with status REJECTED and records an application_review row with feedback prefixed `[DEFERRED]`.
- **FR-4**: Submitting the defer dialog creates a NEW application row (duplicate) with:
  - Same student (profile_id), course (course_id), university, submitted_by
  - Status = PENDING
  - `is_deferred = true`
  - `deferred_from_application_id` pointing back to the original
  - `custom_intake_date` set to the user-selected date
- **FR-5**: Original application appears in the "Rejected" tab (NOT the Deferred tab). Shows OLD intake date. The rejection history indicator ("SMS" bubble) is visible with the deferral reason.
- **FR-6**: New duplicate application appears ONLY in the "Deferred Intake" tab (NOT the Rejected tab). Shows the NEW custom intake date. Has NO rejection history / bubble indicator.
- **FR-7**: The "Deferred Intake" tab counter accurately counts applications with `is_deferred = true`.
- **FR-8**: Navigating into the deferred application detail page shows the NEW intake date under Academic Record > Intake.

## Non-Functional Requirements
- **NFR-1**: Build must pass TypeScript type checking (`npm run build` exits with code 0 after type-check step).
- **NFR-2**: No regression on the existing Reject / Approve flows.
- **NFR-3**: DB migration must be backwards compatible (using IF NOT EXISTS / nullable columns, no destructive changes).

## Constraints
- **Technical**: Existing Supabase tables; new columns must be added via a new migration script in `supabase/migrations/`
- **Technical**: Application review writes MUST go through the existing `application_review` table (not `application_review_history` which does not exist)
- **Technical**: Application status column is `status` (enum: APPROVED / REJECTED / NEEDS_REVISION / PENDING), NOT `pipeline_status` (a computed display field only)
- **Business**: Cannot defer applications that already have an offer letter
- **Business**: Cannot defer applications unless they are in PENDING status
- **Dependencies**: Rejection history bubble component `DocumentRejectionIndicator` reads from `application_review` table via `loadRejectionHistoryByApplicationIds`

## Assumptions
- The term "SMS" in the user's requirement refers to the in-app rejection history tooltip bubble (the red indicator showing the rejection reason), not an actual mobile SMS integration.
- The "custom_intake_date" is a simple DATE override on the application row; the course/degree's stored intake_date remains unchanged.
- A deferred duplicate application can later be Approved normally (offer creation) like any other PENDING application.
- The Defer Intake action is idempotent in that already-deferred applications have the button disabled.

## Acceptance Criteria

### AC-1: Defer Dialog Opens and Validates Inputs
- **Type**: `rule`
- **Given**: User is on `/dashboard/application` with University role, viewing a PENDING application with no existing offer.
- **When**: User clicks "Defer Intake" button.
- **Then**: Dialog opens showing Current Intake, empty New Intake Date picker, empty Reason textarea. Submit button is disabled until both date and non-empty reason are entered.
- **Pass Condition**: Manual UI test: button disabled when fields empty, enabled when both valid.
- **Evidence**: Browser interaction on local dev server.

### AC-2: Original Application is Rejected with Deferred Reason
- **Type**: `rule`
- **Given**: User submits the Defer Intake dialog with a valid date and reason.
- **When**: The server responds success and the list refetches.
- **Then**: Original application row has pipeline_status "Rejected", appears in "Rejected" tab count, shows a rejection history indicator bubble that displays the `[DEFERRED]` prefixed reason on hover/click. Original intake label unchanged (old expired date).
- **Pass Condition**: Direct DB query: original application.status = 'REJECTED' AND application_review table contains one row with status REJECTED and feedback starting with "[DEFERRED]".
- **Evidence**: Supabase SQL Editor query result + UI screenshot of rejection bubble.

### AC-3: Duplicate Deferred Application Created Correctly
- **Type**: `rule`
- **Given**: Defer submission succeeded.
- **When**: Querying applications for the same student.
- **Then**: NEW application row exists with is_deferred=true, deferred_from_application_id=original.id, custom_intake_date equals user-chosen date, status=PENDING. Same course_id, profile_id, university_id as original.
- **Pass Condition**: Direct DB query: SELECT count(*) = 1 FROM application WHERE is_deferred = true AND deferred_from_application_id = '<orig>' AND custom_intake_date = '<chosen>'.
- **Evidence**: Supabase SQL Editor query result.

### AC-4: Tab Filtering Correctly Separates Original vs Duplicate
- **Type**: `rule`
- **Given**: Original (REJECTED) and duplicate (DEFERRED) rows exist for same program/student.
- **When**: Switching between the "Rejected" and "Deferred Intake" tabs in the UI.
- **Then**: Original application appears only in the "Rejected" tab and NOT in the "Deferred Intake" tab. Duplicate application appears only in "Deferred Intake" tab and NOT in "Rejected" tab. Deferred tab count increases by exactly 1.
- **Pass Condition**: Manual UI tab navigation and count verification.
- **Evidence**: Screenshots of both tabs.

### AC-5: Intake Label Shows Correct Date for Each Application
- **Type**: `rule`
- **Given**: Original and deferred duplicate both exist.
- **When**: Viewing the list table or clicking into detail page for each.
- **Then**: Original shows old course intake label. Deferred duplicate shows new intake date (Month Year + " Intake" suffix) derived from custom_intake_date, in both list view Intake column and detail view Academic Record > Intake field.
- **Pass Condition**: UI inspection — Intake cell for deferred row equals `formatIntakeDate(custom_intake_date) + " Intake"` and differs from the original.
- **Evidence**: Screenshot of both rows side-by-side in the table.

### AC-6: Deferred Duplicate Has No Rejection SMS/Indicator
- **Type**: `rule`
- **Given**: Deferred duplicate application exists.
- **When**: Rendering the list table row for the deferred duplicate.
- **Then**: Rejection indicator (DocumentRejectionIndicator) is NOT rendered (column is blank). No rejection history entries are associated with the duplicate.
- **Pass Condition**: UI inspection + DB query: COUNT(*) from application_review where application_id = deferred_id equals 0.
- **Evidence**: Screenshot + DB query.

### AC-7: TypeScript Build Passes
- **Type**: `rule`
- **Given**: All changes are in place.
- **When**: Running `npm run build` to completion.
- **Then**: Type check step completes without "Failed to type check" message; process exits 0.
- **Pass Condition**: Command exits cleanly, no TypeScript errors printed.
- **Evidence**: Build terminal output.

### AC-8: DB Migration is Non-Destructive and Idempotent
- **Type**: `rule`
- **Given**: Migration file `048_application_defer_intake.sql` is present.
- **When**: Running the migration against the Supabase project twice consecutively.
- **Then**: Both runs succeed without errors (IF NOT EXISTS guards prevent duplicate column / index creation).
- **Pass Condition**: `supabase db push` or equivalent runs without error on repeat execution.
- **Evidence**: Migration execution log.

### AC-9: UX Consistency of Defer Button vs Sibling Actions
- **Type**: `rubric`
- **Dimension**: UI/UX consistency of the new Defer Intake action
- **Scale**: 1-5
- **Anchors**: 1 = Button styling/alignment diverges; dialog is inconsistent with Reject dialog. 3 = Reasonable visual parity but minor spacing/styling issues. 5 = Defer button visually matches Reject button (same height, rounded style, weight) and dialog UX follows exactly the same pattern as Reject dialog (cancel/submit buttons, required field behavior, error banner).
- **Pass Threshold**: >= 4
- **Evidence**: Side-by-side screenshot of Reject dialog and Defer dialog; table row with all three action buttons visible.

## Open Questions
- [ ] Should the deferred duplicate application inherit ALL application documents from the original (application_document join rows)? Currently only the core row is duplicated; document links may need to be copied.
- [ ] Does the duplicate application need a generated application_no, or is it OK to re-use/leave null?
- [ ] Should the deferred application be prevented from being deferred again recursively? (Currently prevented via `can_defer && !isDeferred` check.)
