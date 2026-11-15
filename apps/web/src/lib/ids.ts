/**
 * The backend keys estimates and projects by UUID. Legacy demo links such as
 * `/app/estimates/BS-2026-004` or `/app/projects/deshmukh-residence` are not
 * UUIDs, so the API answers `422` and the page shows a validation error.
 * These helpers let routes detect such links locally and redirect instead.
 */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string | null | undefined): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}
